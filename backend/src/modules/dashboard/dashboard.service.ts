import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CardBrand, PaymentMethod, PaymentStatus } from '@prisma/client';
import { calculateExpenseDisplayStatus } from '../expenses/utils/expense-status.util';
import {
  MonthlyDashboardData,
  PeriodInfo,
  SummaryMetrics,
  CreditCardsBlock,
  BrandGroup,
  BrandGroupCard,
  BrandGroupInvoice,
  BrandGroupCardItem,
  DirectExpensesBlock,
  DirectMethodGroup,
  DirectExpenseItem,
  CategoryBreakdownItem,
  CategoryRef,
} from './interfaces/monthly-dashboard.interface';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const BRAND_LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  ELO: 'Elo',
  AMEX: 'American Express',
  HIPERCARD: 'Hipercard',
  OTHER: 'Outros',
};

const round2 = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates consolidated monthly analytics synthesizing Incomes, Credit Cards,
   * Invoices, Direct Expenses, and Category Distributions.
   */
  async getMonthlyAnalytics(
    accountId: string,
    year: number,
    month: number,
  ): Promise<MonthlyDashboardData> {
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Parallel fetch across 3 primary data streams
    const [incomes, cards, directExpenses] = await Promise.all([
      // 1. Incomes for the calendar month
      this.prisma.income.findMany({
        where: {
          accountId,
          receiptDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        include: {
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
        },
        orderBy: [{ receiptDate: 'asc' }, { createdAt: 'asc' }],
      }),

      // 2. Active credit cards with target monthly cycle invoice
      this.prisma.creditCard.findMany({
        where: {
          accountId,
          isArchived: false,
        },
        include: {
          invoices: {
            where: {
              billingYear: year,
              billingMonth: month,
            },
            include: {
              expenses: {
                include: {
                  category: {
                    select: { id: true, name: true, color: true, icon: true },
                  },
                },
                orderBy: { transactionDate: 'asc' },
              },
            },
          },
        },
        orderBy: [{ nickname: 'asc' }],
      }),

      // 3. Direct cash expenses due within calendar month
      this.prisma.expense.findMany({
        where: {
          accountId,
          paymentMethod: {
            in: [
              PaymentMethod.BOLETO,
              PaymentMethod.PIX,
              PaymentMethod.DEBIT_CARD,
            ],
          },
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        include: {
          category: {
            select: { id: true, name: true, color: true, icon: true },
          },
        },
        orderBy: [{ dueDate: 'asc' }, { transactionDate: 'asc' }],
      }),
    ]);

    // Period metadata
    const period: PeriodInfo = {
      year,
      month,
      monthName: MONTH_NAMES[month - 1] || `Mês ${month}`,
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString(),
    };

    // --- Incomes Calculation ---
    let totalIncome = 0;
    incomes.forEach((inc) => {
      totalIncome += Number(inc.amount) || 0;
    });
    totalIncome = round2(totalIncome);

    // --- Category Expenses Accumulator ---
    const categoryTotals: Record<
      string,
      { category: CategoryRef; amount: number }
    > = {};

    const registerCategoryAmount = (cat: CategoryRef | null, amt: number) => {
      if (!cat) return;
      if (!categoryTotals[cat.id]) {
        categoryTotals[cat.id] = {
          category: cat,
          amount: 0,
        };
      }
      categoryTotals[cat.id].amount += amt;
    };

    // --- Block 1: Credit Cards Grouping by Brand ---
    let cardsTotalLiability = 0;
    let cardsTotalPaid = 0;
    let cardsTotalPending = 0;
    let cardPurchaseCount = 0;

    const brandMap = new Map<string, BrandGroupCard[]>();

    for (const card of cards) {
      const invoice = card.invoices[0] || null;
      let brandInvoice: BrandGroupInvoice | null = null;

      if (invoice) {
        const invTotal = round2(Number(invoice.totalAmount) || 0);
        cardsTotalLiability += invTotal;

        if (invoice.status === 'PAID') {
          cardsTotalPaid += invTotal;
        } else {
          cardsTotalPending += invTotal;
        }

        const items: BrandGroupCardItem[] = (invoice.expenses || []).map(
          (exp) => {
            const itemAmount = round2(Number(exp.amount) || 0);
            cardPurchaseCount++;
            registerCategoryAmount(exp.category, itemAmount);

            return {
              id: exp.id,
              description: exp.description,
              amount: itemAmount,
              transactionDate: exp.transactionDate.toISOString(),
              installmentNumber: exp.installmentNumber,
              installmentTotal: exp.installmentTotal,
              category: exp.category,
            };
          },
        );

        brandInvoice = {
          id: invoice.id,
          billingMonth: invoice.billingMonth,
          billingYear: invoice.billingYear,
          closingDate: invoice.closingDate.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          totalAmount: invTotal,
          status: invoice.status,
          paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
          items,
        };
      }

      const brandKey = card.brand || 'OTHER';
      if (!brandMap.has(brandKey)) {
        brandMap.set(brandKey, []);
      }

      brandMap.get(brandKey)!.push({
        cardId: card.id,
        nickname: card.nickname,
        brand: card.brand,
        closingDay: card.closingDay,
        dueDay: card.dueDay,
        invoice: brandInvoice,
      });
    }

    const brandGroups: BrandGroup[] = [];
    brandMap.forEach((cardsList, brandKey) => {
      let groupTotal = 0;
      cardsList.forEach((c) => {
        if (c.invoice) {
          groupTotal += c.invoice.totalAmount;
        }
      });

      brandGroups.push({
        brand: brandKey,
        brandName: BRAND_LABELS[brandKey] || brandKey,
        totalAmount: round2(groupTotal),
        cardCount: cardsList.length,
        cards: cardsList,
      });
    });

    // Sort brand groups descending by liability
    brandGroups.sort((a, b) => b.totalAmount - a.totalAmount);

    const creditCards: CreditCardsBlock = {
      totalLiability: round2(cardsTotalLiability),
      totalPaid: round2(cardsTotalPaid),
      totalPending: round2(cardsTotalPending),
      brandGroups,
    };

    // --- Block 2: Direct Expenses Grouping (Boleto, Pix, Débito) ---
    const methodBuckets: Record<PaymentMethod, DirectExpenseItem[]> = {
      BOLETO: [],
      PIX: [],
      DEBIT_CARD: [],
      CREDIT_CARD: [], // unused here
    };

    directExpenses.forEach((exp) => {
      const amt = round2(Number(exp.amount) || 0);
      registerCategoryAmount(exp.category, amt);

      const { displayStatus, daysOverdue } = calculateExpenseDisplayStatus(
        exp.paymentStatus,
        exp.dueDate,
      );

      const item: DirectExpenseItem = {
        id: exp.id,
        description: exp.description,
        amount: amt,
        dueDate: exp.dueDate.toISOString(),
        transactionDate: exp.transactionDate.toISOString(),
        paymentMethod: exp.paymentMethod,
        paymentStatus: exp.paymentStatus,
        displayStatus,
        daysOverdue,
        paidAt: exp.paidAt ? exp.paidAt.toISOString() : null,
        updatedAt: exp.updatedAt.toISOString(),
        category: exp.category,
      };

      if (methodBuckets[exp.paymentMethod]) {
        methodBuckets[exp.paymentMethod].push(item);
      }
    });

    const createMethodGroup = (
      methodKey: PaymentMethod,
      label: string,
    ): DirectMethodGroup => {
      const items = methodBuckets[methodKey] || [];
      let subtotal = 0;
      let paidAmount = 0;
      let pendingAmount = 0;

      items.forEach((item) => {
        subtotal += item.amount;
        if (item.paymentStatus === PaymentStatus.PAID) {
          paidAmount += item.amount;
        } else {
          pendingAmount += item.amount;
        }
      });

      return {
        label,
        itemCount: items.length,
        subtotal: round2(subtotal),
        paidAmount: round2(paidAmount),
        pendingAmount: round2(pendingAmount),
        items,
      };
    };

    const boletoGroup = createMethodGroup(PaymentMethod.BOLETO, 'Boleto Bancário');
    const pixGroup = createMethodGroup(PaymentMethod.PIX, 'Pix Instantâneo');
    const debitGroup = createMethodGroup(PaymentMethod.DEBIT_CARD, 'Débito em Conta');

    const directTotalLiability = round2(
      boletoGroup.subtotal + pixGroup.subtotal + debitGroup.subtotal,
    );
    const directTotalPaid = round2(
      boletoGroup.paidAmount + pixGroup.paidAmount + debitGroup.paidAmount,
    );
    const directTotalPending = round2(
      boletoGroup.pendingAmount + pixGroup.pendingAmount + debitGroup.pendingAmount,
    );

    const directExpensesBlock: DirectExpensesBlock = {
      totalLiability: directTotalLiability,
      totalPaid: directTotalPaid,
      totalPending: directTotalPending,
      methods: {
        BOLETO: boletoGroup,
        PIX: pixGroup,
        DEBIT_CARD: debitGroup,
      },
    };

    // --- Consolidated Summary KPIs ---
    const totalExpenses = round2(creditCards.totalLiability + directTotalLiability);
    const totalPaid = round2(creditCards.totalPaid + directTotalPaid);
    const totalPending = round2(creditCards.totalPending + directTotalPending);
    const netBalance = round2(totalIncome - totalExpenses);
    const expenseCount = cardPurchaseCount + directExpenses.length;

    const summary: SummaryMetrics = {
      totalIncome,
      totalExpenses,
      totalPaid,
      totalPending,
      netBalance,
      incomeCount: incomes.length,
      expenseCount,
    };

    // --- Category Breakdown Calculation ---
    const categoryBreakdown: CategoryBreakdownItem[] = Object.values(
      categoryTotals,
    ).map((entry) => {
      const catAmount = round2(entry.amount);
      const percentage =
        totalExpenses > 0
          ? round2((catAmount / totalExpenses) * 100)
          : 0;

      return {
        categoryId: entry.category.id,
        name: entry.category.name,
        color: entry.category.color,
        icon: entry.category.icon,
        amount: catAmount,
        percentage,
      };
    });

    // Sort descending by total amount
    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    return {
      period,
      summary,
      creditCards,
      directExpenses: directExpensesBlock,
      categoryBreakdown,
    };
  }
}
