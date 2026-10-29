import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from '../../src/modules/expenses/expenses.service';
import { InvoicesService } from '../../src/modules/cards/invoices.service';
import { RecurrenceService } from '../../src/modules/expenses/recurrence.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let prisma: any;
  let invoicesService: any;
  let recurrenceService: any;

  beforeEach(async () => {
    prisma = {
      category: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      creditCard: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      invoice: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      expense: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      recurrenceRule: {
        delete: jest.fn(),
        update: jest.fn(),
      },
    };

    invoicesService = {
      ensureCycleInvoices: jest.fn().mockResolvedValue([]),
    };

    recurrenceService = {
      createRuleAndMaterialize: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: prisma },
        { provide: InvoicesService, useValue: invoicesService },
        { provide: RecurrenceService, useValue: recurrenceService },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  describe('create - Cash Expense', () => {
    it('should create a single cash expense (Debit/Pix/Boleto)', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Food' });
      prisma.expense.create.mockResolvedValue({
        id: 'exp-1',
        description: 'Lunch',
        amount: new Prisma.Decimal('45.00'),
        paymentMethod: PaymentMethod.DEBIT_CARD,
        paymentStatus: PaymentStatus.PAID,
      });

      const result = await service.create('acc-1', {
        description: 'Lunch',
        amount: 45.0,
        transactionDate: '2026-10-22T12:00:00.000Z',
        paymentMethod: PaymentMethod.DEBIT_CARD,
        categoryId: 'cat-1',
        paymentStatus: PaymentStatus.PAID,
      });

      expect(result.id).toBe('exp-1');
      expect(prisma.expense.create).toHaveBeenCalled();
    });

    it('should default Boleto due date to transaction date + 3 days when not provided', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Utilities' });
      prisma.expense.create.mockImplementation(({ data }) => Promise.resolve(data));

      const txDate = new Date('2026-10-10T00:00:00.000Z');
      const result = await service.create('acc-1', {
        description: 'Electricity bill',
        amount: 150.0,
        transactionDate: txDate.toISOString(),
        paymentMethod: PaymentMethod.BOLETO,
        categoryId: 'cat-1',
      });

      const expectedDueDate = new Date(txDate.getTime() + 3 * 86400000);
      expect(new Date(result.dueDate).getTime()).toBe(expectedDueDate.getTime());
    });
  });

  describe('create - Credit Card Installments', () => {
    it('should create credit card installment series and allocate invoices', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Leisure' });
      prisma.creditCard.findFirst.mockResolvedValue({
        id: 'card-1',
        closingDay: 15,
        dueDay: 22,
      });

      prisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-oct',
        dueDate: new Date('2026-10-22T23:59:59.999Z'),
      });

      prisma.expense.create.mockImplementation(({ data }) => Promise.resolve({ id: 'exp-gen', ...data }));

      const result = await service.create('acc-1', {
        description: 'New TV',
        amount: 100.0,
        transactionDate: '2026-10-10T14:00:00.000Z', // Before closing day 15
        paymentMethod: PaymentMethod.CREDIT_CARD,
        categoryId: 'cat-1',
        cardId: 'card-1',
        installments: 3,
      });

      expect(result.installmentsGenerated).toBe(3);
      expect(result.installmentGroupId).toBeTruthy();
      expect(prisma.expense.create).toHaveBeenCalledTimes(3);
      expect(prisma.invoice.update).toHaveBeenCalledTimes(3);
    });

    it('should throw BadRequestException (EXP004) if cardId is missing for credit card payment', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Leisure' });

      await expect(
        service.create('acc-1', {
          description: 'New TV',
          amount: 100.0,
          transactionDate: '2026-10-10T14:00:00.000Z',
          paymentMethod: PaymentMethod.CREDIT_CARD,
          categoryId: 'cat-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create - Non-Credit-Card Installments (Boleto, Pix, Debit)', () => {
    it('should create non-credit-card installment series with monthly due dates and no invoice allocation', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Services' });
      prisma.expense.create.mockImplementation(({ data }) => Promise.resolve({ id: 'exp-gen', ...data }));

      const result = await service.create('acc-1', {
        description: 'Dentist Treatment',
        amount: 300.0,
        transactionDate: '2026-10-15T10:00:00.000Z',
        paymentMethod: PaymentMethod.BOLETO,
        categoryId: 'cat-1',
        dueDate: '2026-11-05T00:00:00.000Z',
        installments: 3,
        paymentStatus: PaymentStatus.PAID, // 1st paid, 2nd & 3rd pending
      });

      expect(result.installmentsGenerated).toBe(3);
      expect(result.installmentGroupId).toBeTruthy();
      expect(prisma.expense.create).toHaveBeenCalledTimes(3);
      expect(prisma.invoice.update).not.toHaveBeenCalled();

      // Verify installment 1 is PAID with paidAt, installments 2 and 3 are PENDING
      const calls = prisma.expense.create.mock.calls;
      const inst1 = calls[0][0].data;
      const inst2 = calls[1][0].data;
      const inst3 = calls[2][0].data;

      expect(inst1.installmentNumber).toBe(1);
      expect(inst1.paymentStatus).toBe(PaymentStatus.PAID);
      expect(inst1.paidAt).toBeInstanceOf(Date);
      expect(new Date(inst1.dueDate).getUTCMonth()).toBe(10); // Nov

      expect(inst2.installmentNumber).toBe(2);
      expect(inst2.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(inst2.paidAt).toBeNull();
      expect(new Date(inst2.dueDate).getUTCMonth()).toBe(11); // Dec

      expect(inst3.installmentNumber).toBe(3);
      expect(inst3.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(inst3.paidAt).toBeNull();
      expect(new Date(inst3.dueDate).getUTCMonth()).toBe(0); // Jan 2027
    });

    it('should mark all installments as PENDING when paymentStatus is PENDING', async () => {
      prisma.category.findFirst.mockResolvedValue({ id: 'cat-1', name: 'Services' });
      prisma.expense.create.mockImplementation(({ data }) => Promise.resolve({ id: 'exp-gen', ...data }));

      const result = await service.create('acc-1', {
        description: 'Gym Plan',
        amount: 200.0,
        transactionDate: '2026-10-15T10:00:00.000Z',
        paymentMethod: PaymentMethod.PIX,
        categoryId: 'cat-1',
        installments: 2,
        paymentStatus: PaymentStatus.PENDING,
      });

      expect(result.installmentsGenerated).toBe(2);
      const calls = prisma.expense.create.mock.calls;
      expect(calls[0][0].data.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(calls[1][0].data.paymentStatus).toBe(PaymentStatus.PENDING);
    });
  });

  describe('delete', () => {
    it('should delete future installments when scope is FUTURE', async () => {
      prisma.expense.findFirst.mockResolvedValue({
        id: 'exp-2',
        installmentGroupId: 'group-1',
        installmentNumber: 2,
        amount: new Prisma.Decimal('100.00'),
      });

      prisma.expense.findMany.mockResolvedValue([
        { id: 'exp-2', invoiceId: 'inv-1', amount: new Prisma.Decimal('100.00') },
        { id: 'exp-3', invoiceId: 'inv-2', amount: new Prisma.Decimal('100.00') },
      ]);

      prisma.expense.deleteMany.mockResolvedValue({ count: 2 });

      const res = await service.delete('acc-1', 'exp-2', 'FUTURE');
      expect(res.deletedCount).toBe(2);
      expect(prisma.expense.deleteMany).toHaveBeenCalled();
    });

    it('should delete future recurring expenses when scope is FUTURE', async () => {
      const now = new Date(Date.UTC(2026, 9, 23));
      prisma.expense.findFirst.mockResolvedValue({
        id: 'exp-rec-1',
        isRecurring: true,
        recurrenceRuleId: 'rule-1',
        dueDate: now,
        amount: new Prisma.Decimal('50.00'),
      });

      prisma.expense.findMany.mockResolvedValue([
        { id: 'exp-rec-1', amount: new Prisma.Decimal('50.00'), dueDate: now },
        { id: 'exp-rec-2', amount: new Prisma.Decimal('50.00'), dueDate: new Date(Date.UTC(2026, 10, 23)) },
      ]);

      prisma.expense.deleteMany.mockResolvedValue({ count: 2 });
      prisma.expense.count.mockResolvedValue(0);
      prisma.recurrenceRule.delete.mockResolvedValue({ id: 'rule-1' });

      const res = await service.delete('acc-1', 'exp-rec-1', 'FUTURE');
      expect(res.deletedCount).toBe(2);
      expect(prisma.expense.deleteMany).toHaveBeenCalledWith({
        where: {
          accountId: 'acc-1',
          recurrenceRuleId: 'rule-1',
          dueDate: { gte: now },
        },
      });
      expect(prisma.recurrenceRule.delete).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
      });
    });
  });

  describe('list', () => {
    it('should filter by dueDate by default when month and year are specified', async () => {
      prisma.expense.findMany.mockResolvedValue([]);

      await service.list('acc-1', {
        year: 2026,
        month: 10,
      });

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: {
          accountId: 'acc-1',
          dueDate: {
            gte: new Date(Date.UTC(2026, 9, 1, 0, 0, 0)),
            lte: new Date(Date.UTC(2026, 10, 0, 23, 59, 59, 999)),
          },
        },
        include: {
          category: { select: { id: true, name: true, color: true, icon: true } },
          card: { select: { id: true, nickname: true, brand: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { transactionDate: 'asc' }],
      });
    });

    it('should filter by transactionDate when dateType is transactionDate', async () => {
      prisma.expense.findMany.mockResolvedValue([]);

      await service.list('acc-1', {
        year: 2026,
        month: 10,
        dateType: 'transactionDate',
      });

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: {
          accountId: 'acc-1',
          transactionDate: {
            gte: new Date(Date.UTC(2026, 9, 1, 0, 0, 0)),
            lte: new Date(Date.UTC(2026, 10, 0, 23, 59, 59, 999)),
          },
        },
        include: {
          category: { select: { id: true, name: true, color: true, icon: true } },
          card: { select: { id: true, nickname: true, brand: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { transactionDate: 'asc' }],
      });
    });
  });
});

