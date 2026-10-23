import { Test, TestingModule } from '@nestjs/testing';
import { IncomeRecurrenceService } from '../../src/modules/incomes/income-recurrence.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { IncomeStatus, Prisma } from '@prisma/client';

describe('IncomeRecurrenceService', () => {
  let service: IncomeRecurrenceService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      incomeRecurrenceRule: {
        create: jest.fn(),
      },
      income: {
        createMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncomeRecurrenceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<IncomeRecurrenceService>(IncomeRecurrenceService);
  });

  describe('createRuleAndMaterialize', () => {
    it('should create recurrence rule and materialize exactly 12 forward monthly projections', async () => {
      const mockRule = {
        id: 'rule-inc-1',
        accountId: 'acc-1',
        description: 'Monthly Salary',
        amount: new Prisma.Decimal('6000.00'),
        dayOfMonth: 5,
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        endDate: null,
        categoryId: 'cat-salary',
      };

      prisma.incomeRecurrenceRule.create.mockResolvedValue(mockRule);
      prisma.income.createMany.mockResolvedValue({ count: 12 });

      const result = await service.createRuleAndMaterialize({
        accountId: 'acc-1',
        description: 'Monthly Salary',
        amount: 6000.0,
        dayOfMonth: 5,
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        categoryId: 'cat-salary',
      });

      expect(result.id).toBe('rule-inc-1');
      expect(prisma.incomeRecurrenceRule.create).toHaveBeenCalled();
      expect(prisma.income.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              description: 'Monthly Salary',
              incomeRecurrenceRuleId: 'rule-inc-1',
              isRecurring: true,
            }),
          ]),
        }),
      );

      const createdData = prisma.income.createMany.mock.calls[0][0].data;
      expect(createdData).toHaveLength(12);
    });

    it('should clamp dayOfMonth correctly for short months (e.g., day 31 in February)', async () => {
      const mockRule = {
        id: 'rule-inc-clamp',
        accountId: 'acc-1',
        description: 'End of Month Dividend',
        amount: new Prisma.Decimal('500.00'),
        dayOfMonth: 31,
        startDate: new Date('2027-01-01T00:00:00.000Z'),
        endDate: null,
        categoryId: 'cat-div',
      };

      prisma.incomeRecurrenceRule.create.mockResolvedValue(mockRule);
      prisma.income.createMany.mockResolvedValue({ count: 12 });

      await service.createRuleAndMaterialize({
        accountId: 'acc-1',
        description: 'End of Month Dividend',
        amount: 500.0,
        dayOfMonth: 31,
        startDate: new Date('2027-01-01T00:00:00.000Z'),
        categoryId: 'cat-div',
      });

      const createdData = prisma.income.createMany.mock.calls[0][0].data;
      // February 2027 is the 2nd item (index 1), should clamp to 28
      const febDate = new Date(createdData[1].receiptDate);
      expect(febDate.getUTCMonth()).toBe(1); // February (0-indexed)
      expect(febDate.getUTCDate()).toBe(28);

      // April 2027 is the 4th item (index 3), should clamp to 30
      const aprDate = new Date(createdData[3].receiptDate);
      expect(aprDate.getUTCMonth()).toBe(3); // April
      expect(aprDate.getUTCDate()).toBe(30);
    });

    it('should stop materializing when target date exceeds endDate', async () => {
      const mockRule = {
        id: 'rule-inc-end',
        accountId: 'acc-1',
        description: 'Temporary Contract',
        amount: new Prisma.Decimal('2000.00'),
        dayOfMonth: 10,
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        endDate: new Date('2026-12-15T00:00:00.000Z'), // Only 3 months (Oct, Nov, Dec)
        categoryId: 'cat-salary',
      };

      prisma.incomeRecurrenceRule.create.mockResolvedValue(mockRule);
      prisma.income.createMany.mockResolvedValue({ count: 3 });

      await service.createRuleAndMaterialize({
        accountId: 'acc-1',
        description: 'Temporary Contract',
        amount: 2000.0,
        dayOfMonth: 10,
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        endDate: new Date('2026-12-15T00:00:00.000Z'),
        categoryId: 'cat-salary',
      });

      const createdData = prisma.income.createMany.mock.calls[0][0].data;
      expect(createdData).toHaveLength(3);
    });
  });
});
