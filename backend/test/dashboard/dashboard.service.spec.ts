import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../../src/modules/dashboard/dashboard.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { CardBrand, PaymentMethod, PaymentStatus, InvoiceStatus, Prisma } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      income: {
        findMany: jest.fn(),
      },
      creditCard: {
        findMany: jest.fn(),
      },
      expense: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getMonthlyAnalytics', () => {
    it('should correctly calculate the 5 summary metrics, brand grouping, and category breakdown', async () => {
      const mockAccountId = 'acc-123';
      const year = 2026;
      const month = 10;

      // Seed mock Incomes (Total: 5000.00)
      prisma.income.findMany.mockResolvedValue([
        {
          id: 'inc-1',
          amount: new Prisma.Decimal('3500.00'),
          receiptDate: new Date('2026-10-05T12:00:00Z'),
          category: { id: 'cat-salario', name: 'Salário', color: '#10b981', icon: 'DollarSign' },
        },
        {
          id: 'inc-2',
          amount: new Prisma.Decimal('1500.00'),
          receiptDate: new Date('2026-10-20T12:00:00Z'),
          category: { id: 'cat-freela', name: 'Freelance', color: '#3b82f6', icon: 'Briefcase' },
        },
      ]);

      // Seed mock Credit Cards & Invoices (Two Visa cards, one Mastercard)
      prisma.creditCard.findMany.mockResolvedValue([
        {
          id: 'card-1',
          nickname: 'Nubank Visa',
          brand: CardBrand.VISA,
          closingDay: 18,
          dueDay: 25,
          invoices: [
            {
              id: 'inv-1',
              billingMonth: 10,
              billingYear: 2026,
              closingDate: new Date('2026-10-18T23:59:59Z'),
              dueDate: new Date('2026-10-25T23:59:59Z'),
              totalAmount: new Prisma.Decimal('1000.00'),
              status: InvoiceStatus.OPEN,
              paidAt: null,
              expenses: [
                {
                  id: 'exp-card-1',
                  description: 'Celular',
                  amount: new Prisma.Decimal('600.00'),
                  transactionDate: new Date('2026-10-02T10:00:00Z'),
                  installmentNumber: 1,
                  installmentTotal: 3,
                  category: { id: 'cat-tech', name: 'Tecnologia', color: '#6366f1', icon: 'Laptop' },
                },
                {
                  id: 'exp-card-2',
                  description: 'Restaurante',
                  amount: new Prisma.Decimal('400.00'),
                  transactionDate: new Date('2026-10-15T20:00:00Z'),
                  installmentNumber: null,
                  installmentTotal: null,
                  category: { id: 'cat-food', name: 'Alimentação', color: '#ef4444', icon: 'Utensils' },
                },
              ],
            },
          ],
        },
        {
          id: 'card-2',
          nickname: 'XP Visa Infinite',
          brand: CardBrand.VISA,
          closingDay: 10,
          dueDay: 20,
          invoices: [
            {
              id: 'inv-2',
              billingMonth: 10,
              billingYear: 2026,
              closingDate: new Date('2026-10-10T23:59:59Z'),
              dueDate: new Date('2026-10-20T23:59:59Z'),
              totalAmount: new Prisma.Decimal('500.00'),
              status: InvoiceStatus.PAID,
              paidAt: new Date('2026-10-19T14:00:00Z'),
              expenses: [
                {
                  id: 'exp-card-3',
                  description: 'Passagem Aérea',
                  amount: new Prisma.Decimal('500.00'),
                  transactionDate: new Date('2026-09-28T12:00:00Z'),
                  installmentNumber: 2,
                  installmentTotal: 5,
                  category: { id: 'cat-travel', name: 'Viagem', color: '#8b5cf6', icon: 'Plane' },
                },
              ],
            },
          ],
        },
        {
          id: 'card-3',
          nickname: 'Inter Mastercard',
          brand: CardBrand.MASTERCARD,
          closingDay: 5,
          dueDay: 15,
          invoices: [
            {
              id: 'inv-3',
              billingMonth: 10,
              billingYear: 2026,
              closingDate: new Date('2026-10-05T23:59:59Z'),
              dueDate: new Date('2026-10-15T23:59:59Z'),
              totalAmount: new Prisma.Decimal('300.00'),
              status: InvoiceStatus.OPEN,
              paidAt: null,
              expenses: [
                {
                  id: 'exp-card-4',
                  description: 'Supermercado',
                  amount: new Prisma.Decimal('300.00'),
                  transactionDate: new Date('2026-10-01T15:00:00Z'),
                  installmentNumber: null,
                  installmentTotal: null,
                  category: { id: 'cat-food', name: 'Alimentação', color: '#ef4444', icon: 'Utensils' },
                },
              ],
            },
          ],
        },
      ]);

      // Seed mock Direct Expenses (Boleto: 200 pending, Pix: 150 paid, Debit: 50 paid)
      prisma.expense.findMany.mockResolvedValue([
        {
          id: 'exp-bol-1',
          description: 'Condomínio',
          amount: new Prisma.Decimal('200.00'),
          dueDate: new Date('2026-10-10T00:00:00Z'),
          transactionDate: new Date('2026-10-01T00:00:00Z'),
          paymentMethod: PaymentMethod.BOLETO,
          paymentStatus: PaymentStatus.PENDING,
          paidAt: null,
          updatedAt: new Date('2026-10-01T00:00:00Z'),
          category: { id: 'cat-home', name: 'Moradia', color: '#f59e0b', icon: 'Home' },
        },
        {
          id: 'exp-pix-1',
          description: 'Farmácia Pix',
          amount: new Prisma.Decimal('150.00'),
          dueDate: new Date('2026-10-12T00:00:00Z'),
          transactionDate: new Date('2026-10-12T00:00:00Z'),
          paymentMethod: PaymentMethod.PIX,
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date('2026-10-12T00:00:00Z'),
          updatedAt: new Date('2026-10-12T00:00:00Z'),
          category: { id: 'cat-health', name: 'Saúde', color: '#06b6d4', icon: 'Heart' },
        },
        {
          id: 'exp-deb-1',
          description: 'Café Débito',
          amount: new Prisma.Decimal('50.00'),
          dueDate: new Date('2026-10-14T00:00:00Z'),
          transactionDate: new Date('2026-10-14T00:00:00Z'),
          paymentMethod: PaymentMethod.DEBIT_CARD,
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date('2026-10-14T00:00:00Z'),
          updatedAt: new Date('2026-10-14T00:00:00Z'),
          category: { id: 'cat-food', name: 'Alimentação', color: '#ef4444', icon: 'Utensils' },
        },
      ]);

      const result = await service.getMonthlyAnalytics(mockAccountId, year, month);

      // Period checks
      expect(result.period.year).toBe(2026);
      expect(result.period.month).toBe(10);
      expect(result.period.monthName).toBe('Outubro');

      // Top-Level Summary KPIs Verification:
      // Total Income: 3500 + 1500 = 5000.00
      expect(result.summary.totalIncome).toBe(5000.00);

      // Total Expenses:
      // Cards Total: 1000 (inv-1) + 500 (inv-2) + 300 (inv-3) = 1800.00
      // Direct Total: 200 (Boleto) + 150 (Pix) + 50 (Debit) = 400.00
      // Total Expenses: 1800 + 400 = 2200.00
      expect(result.summary.totalExpenses).toBe(2200.00);

      // Total Paid:
      // Paid Cards: inv-2 (500)
      // Paid Direct: Pix (150) + Debit (50) = 200
      // Total Paid: 500 + 200 = 700.00
      expect(result.summary.totalPaid).toBe(700.00);

      // Total Pending:
      // Pending Cards: inv-1 (1000) + inv-3 (300) = 1300
      // Pending Direct: Boleto (200)
      // Total Pending: 1300 + 200 = 1500.00
      expect(result.summary.totalPending).toBe(1500.00);

      // Projected Net Balance: 5000 - 2200 = 2800.00
      expect(result.summary.netBalance).toBe(2800.00);

      // Counts
      expect(result.summary.incomeCount).toBe(2);
      expect(result.summary.expenseCount).toBe(7); // 4 card items + 3 direct items

      // Block 1 (Credit Cards by Brand) Verification:
      // 2 Brands expected: VISA (Nubank + XP = 1500), MASTERCARD (Inter = 300)
      expect(result.creditCards.brandGroups.length).toBe(2);

      const visaGroup = result.creditCards.brandGroups.find((b) => b.brand === CardBrand.VISA);
      expect(visaGroup).toBeDefined();
      expect(visaGroup?.brandName).toBe('Visa');
      expect(visaGroup?.totalAmount).toBe(1500.00);
      expect(visaGroup?.cardCount).toBe(2);
      expect(visaGroup?.cards.length).toBe(2);

      const masterGroup = result.creditCards.brandGroups.find((b) => b.brand === CardBrand.MASTERCARD);
      expect(masterGroup).toBeDefined();
      expect(masterGroup?.totalAmount).toBe(300.00);
      expect(masterGroup?.cardCount).toBe(1);

      // Block 2 (Direct Expenses Segregation) Verification:
      expect(result.directExpenses.totalLiability).toBe(400.00);
      expect(result.directExpenses.totalPaid).toBe(200.00);
      expect(result.directExpenses.totalPending).toBe(200.00);

      expect(result.directExpenses.methods.BOLETO.itemCount).toBe(1);
      expect(result.directExpenses.methods.BOLETO.subtotal).toBe(200.00);
      expect(result.directExpenses.methods.BOLETO.pendingAmount).toBe(200.00);

      expect(result.directExpenses.methods.PIX.itemCount).toBe(1);
      expect(result.directExpenses.methods.PIX.paidAmount).toBe(150.00);

      expect(result.directExpenses.methods.DEBIT_CARD.itemCount).toBe(1);
      expect(result.directExpenses.methods.DEBIT_CARD.paidAmount).toBe(50.00);

      // Category Breakdown Verification:
      // Tech: 600
      // Food: 400 + 300 + 50 = 750
      // Travel: 500
      // Home: 200
      // Health: 150
      // Total Category Expenses: 600 + 750 + 500 + 200 + 150 = 2200.00
      // Highest category should be Food (750.00 -> 34.09%)
      expect(result.categoryBreakdown.length).toBe(5);
      expect(result.categoryBreakdown[0].name).toBe('Alimentação');
      expect(result.categoryBreakdown[0].amount).toBe(750.00);
      expect(result.categoryBreakdown[0].percentage).toBeCloseTo(34.09, 1);
    });

    it('should return zeroed metrics when no records exist for the month', async () => {
      prisma.income.findMany.mockResolvedValue([]);
      prisma.creditCard.findMany.mockResolvedValue([]);
      prisma.expense.findMany.mockResolvedValue([]);

      const result = await service.getMonthlyAnalytics('acc-empty', 2026, 1);

      expect(result.summary.totalIncome).toBe(0);
      expect(result.summary.totalExpenses).toBe(0);
      expect(result.summary.totalPaid).toBe(0);
      expect(result.summary.totalPending).toBe(0);
      expect(result.summary.netBalance).toBe(0);
      expect(result.creditCards.brandGroups).toEqual([]);
      expect(result.categoryBreakdown).toEqual([]);
    });
  });
});
