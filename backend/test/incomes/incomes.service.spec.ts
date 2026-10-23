import { Test, TestingModule } from '@nestjs/testing';
import { IncomesService } from '../../src/modules/incomes/incomes.service';
import { IncomeRecurrenceService } from '../../src/modules/incomes/income-recurrence.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { CategoryType, IncomeStatus, Prisma } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('IncomesService', () => {
  let service: IncomesService;
  let prisma: any;
  let recurrenceService: any;

  beforeEach(async () => {
    prisma = {
      category: {
        findFirst: jest.fn(),
      },
      income: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      incomeRecurrenceRule: {
        create: jest.fn(),
      },
    };

    recurrenceService = {
      createRuleAndMaterialize: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomesService,
        { provide: PrismaService, useValue: prisma },
        { provide: IncomeRecurrenceService, useValue: recurrenceService },
      ],
    }).compile();

    service = module.get<IncomesService>(IncomesService);
  });

  describe('create - Single Income', () => {
    it('should create single income with valid parameters and default RECEIVED status for today', async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: 'cat-1',
        name: 'Salary',
        type: CategoryType.INCOME,
      });

      const now = new Date();
      prisma.income.create.mockResolvedValue({
        id: 'inc-1',
        description: 'Monthly Salary',
        amount: new Prisma.Decimal('5000.00'),
        receiptDate: now,
        status: IncomeStatus.RECEIVED,
        categoryId: 'cat-1',
      });

      const result = await service.create('acc-1', {
        description: 'Monthly Salary',
        amount: 5000.0,
        receiptDate: now.toISOString(),
        categoryId: 'cat-1',
      });

      expect(result.id).toBe('inc-1');
      expect(prisma.income.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountId: 'acc-1',
            description: 'Monthly Salary',
            status: IncomeStatus.RECEIVED,
          }),
        }),
      );
    });

    it('should default status to PENDING for a future receipt date when not explicitly provided', async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: 'cat-1',
        name: 'Freelance',
        type: CategoryType.INCOME,
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      prisma.income.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'inc-fut', ...data }),
      );

      const result = await service.create('acc-1', {
        description: 'Freelance Design',
        amount: 1500.0,
        receiptDate: futureDate.toISOString(),
        categoryId: 'cat-1',
      });

      expect(result.status).toBe(IncomeStatus.PENDING);
    });

    it('should reject creation with INC004 if category is not found', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.create('acc-1', {
          description: 'Freelance',
          amount: 500.0,
          receiptDate: new Date().toISOString(),
          categoryId: 'non-existent',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject creation with INC005 if category is not an INCOME type', async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: 'cat-exp',
        name: 'Groceries',
        type: CategoryType.EXPENSE,
      });

      await expect(
        service.create('acc-1', {
          description: 'Payment',
          amount: 500.0,
          receiptDate: new Date().toISOString(),
          categoryId: 'cat-exp',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject creation with INC003 if receipt date exceeds 24 months in future', async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: 'cat-1',
        name: 'Salary',
        type: CategoryType.INCOME,
      });

      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 3);

      await expect(
        service.create('acc-1', {
          description: 'Far Future Bonus',
          amount: 1000.0,
          receiptDate: farFuture.toISOString(),
          categoryId: 'cat-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create - Recurring Income', () => {
    it('should call recurrenceService.createRuleAndMaterialize when isRecurring is true', async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: 'cat-1',
        name: 'Salary',
        type: CategoryType.INCOME,
      });

      recurrenceService.createRuleAndMaterialize.mockResolvedValue({
        id: 'rule-1',
        description: 'Monthly Salary',
        amount: new Prisma.Decimal('8000.00'),
      });

      const result = await service.create('acc-1', {
        description: 'Monthly Salary',
        amount: 8000.0,
        receiptDate: '2026-10-05T12:00:00.000Z',
        categoryId: 'cat-1',
        isRecurring: true,
      });

      expect(result.isRecurring).toBe(true);
      expect(result.incomeRecurrenceRuleId).toBe('rule-1');
      expect(result.projectionsGenerated).toBe(12);
      expect(recurrenceService.createRuleAndMaterialize).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should filter by year and month on receiptDate', async () => {
      prisma.income.findMany.mockResolvedValue([]);

      await service.list('acc-1', {
        year: 2026,
        month: 10,
      });

      expect(prisma.income.findMany).toHaveBeenCalledWith({
        where: {
          accountId: 'acc-1',
          receiptDate: {
            gte: new Date(Date.UTC(2026, 9, 1, 0, 0, 0)),
            lte: new Date(Date.UTC(2026, 10, 0, 23, 59, 59, 999)),
          },
        },
        include: {
          category: { select: { id: true, name: true, color: true, icon: true } },
        },
        orderBy: [{ receiptDate: 'asc' }, { createdAt: 'asc' }],
      });
    });
  });

  describe('delete', () => {
    it('should delete a single income when scope is SINGLE', async () => {
      prisma.income.findFirst.mockResolvedValue({
        id: 'inc-1',
        incomeRecurrenceRuleId: null,
      });

      const res = await service.delete('acc-1', 'inc-1', 'SINGLE');
      expect(res.deletedCount).toBe(1);
      expect(prisma.income.delete).toHaveBeenCalledWith({
        where: { id: 'inc-1' },
      });
    });

    it('should delete future recurring instances when scope is FUTURE', async () => {
      const now = new Date();
      prisma.income.findFirst.mockResolvedValue({
        id: 'inc-series-1',
        incomeRecurrenceRuleId: 'rule-1',
        receiptDate: now,
      });

      prisma.income.deleteMany.mockResolvedValue({ count: 6 });

      const res = await service.delete('acc-1', 'inc-series-1', 'FUTURE');
      expect(res.deletedCount).toBe(6);
      expect(prisma.income.deleteMany).toHaveBeenCalledWith({
        where: {
          accountId: 'acc-1',
          incomeRecurrenceRuleId: 'rule-1',
          receiptDate: {
            gte: now,
          },
        },
      });
    });
  });
});
