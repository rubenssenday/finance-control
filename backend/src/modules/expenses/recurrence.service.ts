import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoicesService } from '../cards/invoices.service';
import {
  RecurrenceRule,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import {
  clampDay,
  resolveCycleForTransaction,
} from '../cards/utils/billing-cycle.util';

export interface CreateRecurrenceParams {
  accountId: string;
  description: string;
  amount: number;
  dayOfMonth: number;
  startDate: Date;
  endDate?: Date | null;
  paymentMethod: PaymentMethod;
  categoryId: string;
  cardId?: string | null;
}

@Injectable()
export class RecurrenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicesService: InvoicesService,
  ) {}

  /**
   * Creates a recurring monthly template and materializes the next 12 forward monthly expenses.
   */
  async createRuleAndMaterialize(
    params: CreateRecurrenceParams,
  ): Promise<RecurrenceRule> {
    const rule = await this.prisma.recurrenceRule.create({
      data: {
        accountId: params.accountId,
        description: params.description,
        amount: new Prisma.Decimal(params.amount.toFixed(2)),
        dayOfMonth: params.dayOfMonth,
        startDate: params.startDate,
        endDate: params.endDate || null,
        paymentMethod: params.paymentMethod,
        categoryId: params.categoryId,
        cardId: params.cardId || null,
      },
    });

    // Materialize 12 monthly instances
    await this.materializeProjections(rule, 12);

    return rule;
  }

  /**
   * Materializes monthly expense instances for a recurrence rule for N forward months.
   * If the recurrence is paid by credit card, allocates each projection to its
   * corresponding card invoice cycle, sets invoiceId, and increments invoice totals.
   */
  async materializeProjections(
    rule: RecurrenceRule,
    monthsCount = 12,
  ): Promise<number> {
    const startYear = rule.startDate.getUTCFullYear();
    const startMonth = rule.startDate.getUTCMonth() + 1;

    let curYear = startYear;
    let curMonth = startMonth;

    let card = null;
    if (rule.paymentMethod === PaymentMethod.CREDIT_CARD && rule.cardId) {
      card = await this.prisma.creditCard.findFirst({
        where: { id: rule.cardId, accountId: rule.accountId },
      });
    }

    const expensesToCreate: Prisma.ExpenseCreateManyInput[] = [];
    const invoiceIncrements = new Map<string, Prisma.Decimal>();

    for (let i = 0; i < monthsCount; i++) {
      const validDay = clampDay(curYear, curMonth, rule.dayOfMonth);
      const targetDate = new Date(Date.UTC(curYear, curMonth - 1, validDay, 12, 0, 0));

      // If beyond endDate, stop materializing
      if (rule.endDate && targetDate > rule.endDate) {
        break;
      }

      let invoiceId: string | null = null;
      let dueDate = targetDate;

      if (card) {
        const cycle = resolveCycleForTransaction(targetDate, card.closingDay);

        await this.invoicesService.ensureCycleInvoices(
          rule.accountId,
          card.id,
          card.closingDay,
          card.dueDay,
          new Date(Date.UTC(cycle.billingYear, cycle.billingMonth - 1, 1)),
        );

        const targetInvoice = await this.prisma.invoice.findFirst({
          where: {
            cardId: card.id,
            billingYear: cycle.billingYear,
            billingMonth: cycle.billingMonth,
          },
        });

        if (targetInvoice) {
          invoiceId = targetInvoice.id;
          dueDate = targetInvoice.dueDate;

          const currentTotal =
            invoiceIncrements.get(targetInvoice.id) || new Prisma.Decimal('0.00');
          invoiceIncrements.set(targetInvoice.id, currentTotal.add(rule.amount));
        }
      }

      expensesToCreate.push({
        accountId: rule.accountId,
        description: rule.description,
        amount: rule.amount,
        transactionDate: targetDate,
        dueDate,
        paymentMethod: rule.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        categoryId: rule.categoryId,
        cardId: rule.cardId,
        invoiceId,
        isRecurring: true,
        recurrenceRuleId: rule.id,
      });

      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }

    if (expensesToCreate.length > 0) {
      await this.prisma.expense.createMany({
        data: expensesToCreate,
      });

      for (const [invId, amountToAdd] of invoiceIncrements.entries()) {
        await this.prisma.invoice.update({
          where: { id: invId },
          data: {
            totalAmount: {
              increment: amountToAdd,
            },
          },
        });
      }
    }

    return expensesToCreate.length;
  }

  /**
   * Deletes a recurrence rule and optionally all future materialized expenses.
   */
  async deleteRule(
    accountId: string,
    ruleId: string,
    deleteFutureExpenses = true,
    fromDate = new Date(),
  ): Promise<void> {
    if (deleteFutureExpenses) {
      const futureExpenses = await this.prisma.expense.findMany({
        where: {
          accountId,
          recurrenceRuleId: ruleId,
          dueDate: { gte: fromDate },
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      for (const exp of futureExpenses) {
        if (exp.invoiceId) {
          await this.prisma.invoice.update({
            where: { id: exp.invoiceId },
            data: {
              totalAmount: {
                decrement: exp.amount,
              },
            },
          });
        }
      }

      await this.prisma.expense.deleteMany({
        where: {
          accountId,
          recurrenceRuleId: ruleId,
          dueDate: { gte: fromDate },
          paymentStatus: PaymentStatus.PENDING,
        },
      });
    }

    await this.prisma.recurrenceRule.delete({
      where: { id: ruleId },
    });
  }
}
