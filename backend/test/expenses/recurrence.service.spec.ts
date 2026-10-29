import { Test, TestingModule } from '@nestjs/testing';
import { RecurrenceService } from '../../src/modules/expenses/recurrence.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { InvoicesService } from '../../src/modules/cards/invoices.service';
import { PaymentMethod, Prisma } from '@prisma/client';

describe('RecurrenceService', () => {
  let service: RecurrenceService;
  let prisma: any;
  let invoicesService: any;

  beforeEach(async () => {
    prisma = {
      recurrenceRule: {
        create: jest.fn(),
        delete: jest.fn(),
      },
      expense: {
        findMany: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      creditCard: {
        findFirst: jest.fn(),
      },
      invoice: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    invoicesService = {
      ensureCycleInvoices: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurrenceService,
        { provide: PrismaService, useValue: prisma },
        { provide: InvoicesService, useValue: invoicesService },
      ],
    }).compile();

    service = module.get<RecurrenceService>(RecurrenceService);
  });

  describe('createRuleAndMaterialize', () => {
    it('should create recurrence rule and materialize 12 future monthly instances with invoice allocation for CREDIT_CARD', async () => {
      const startDate = new Date(Date.UTC(2026, 9, 10)); // Oct 10, 2026
      const mockDueDate = new Date('2026-10-22T23:59:59.999Z');

      prisma.creditCard.findFirst.mockResolvedValue({
        id: 'card-1',
        closingDay: 15,
        dueDay: 22,
      });

      prisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-oct',
        dueDate: mockDueDate,
      });

      prisma.recurrenceRule.create.mockResolvedValue({
        id: 'rule-1',
        accountId: 'acc-1',
        description: 'Netflix subscription',
        amount: new Prisma.Decimal('55.90'),
        dayOfMonth: 10,
        startDate,
        endDate: null,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        categoryId: 'cat-1',
        cardId: 'card-1',
      });

      prisma.expense.createMany.mockResolvedValue({ count: 12 });

      const rule = await service.createRuleAndMaterialize({
        accountId: 'acc-1',
        description: 'Netflix subscription',
        amount: 55.9,
        dayOfMonth: 10,
        startDate,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        categoryId: 'cat-1',
        cardId: 'card-1',
      });

      expect(rule.id).toBe('rule-1');
      expect(prisma.creditCard.findFirst).toHaveBeenCalledWith({
        where: { id: 'card-1', accountId: 'acc-1' },
      });
      expect(invoicesService.ensureCycleInvoices).toHaveBeenCalled();
      expect(prisma.invoice.findFirst).toHaveBeenCalled();
      expect(prisma.expense.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            isRecurring: true,
            recurrenceRuleId: 'rule-1',
            invoiceId: 'inv-oct',
            dueDate: mockDueDate,
            cardId: 'card-1',
          }),
        ]),
      });
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-oct' },
        data: {
          totalAmount: {
            increment: expect.anything(),
          },
        },
      });
    });

    it('should create recurrence rule and materialize 12 future monthly instances without invoices for non-credit-card payment', async () => {
      const startDate = new Date(Date.UTC(2026, 9, 10)); // Oct 10, 2026

      prisma.recurrenceRule.create.mockResolvedValue({
        id: 'rule-2',
        accountId: 'acc-1',
        description: 'Gym membership',
        amount: new Prisma.Decimal('100.00'),
        dayOfMonth: 10,
        startDate,
        endDate: null,
        paymentMethod: PaymentMethod.BOLETO,
        categoryId: 'cat-2',
        cardId: null,
      });

      prisma.expense.createMany.mockResolvedValue({ count: 12 });

      const rule = await service.createRuleAndMaterialize({
        accountId: 'acc-1',
        description: 'Gym membership',
        amount: 100.0,
        dayOfMonth: 10,
        startDate,
        paymentMethod: PaymentMethod.BOLETO,
        categoryId: 'cat-2',
      });

      expect(rule.id).toBe('rule-2');
      expect(invoicesService.ensureCycleInvoices).not.toHaveBeenCalled();
      expect(prisma.expense.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            isRecurring: true,
            recurrenceRuleId: 'rule-2',
            invoiceId: null,
            cardId: null,
          }),
        ]),
      });
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteRule', () => {
    it('should decrement invoice totals when future expenses with invoiceId are deleted', async () => {
      prisma.expense.findMany.mockResolvedValue([
        {
          id: 'exp-1',
          invoiceId: 'inv-1',
          amount: new Prisma.Decimal('50.00'),
        },
        {
          id: 'exp-2',
          invoiceId: null,
          amount: new Prisma.Decimal('50.00'),
        },
      ]);
      prisma.expense.deleteMany.mockResolvedValue({ count: 2 });
      prisma.recurrenceRule.delete.mockResolvedValue({ id: 'rule-1' });

      await service.deleteRule('acc-1', 'rule-1', true);

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: {
          totalAmount: {
            decrement: new Prisma.Decimal('50.00'),
          },
        },
      });
      expect(prisma.expense.deleteMany).toHaveBeenCalled();
      expect(prisma.recurrenceRule.delete).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
      });
    });
  });
});
