import { Test, TestingModule } from '@nestjs/testing';
import { RecurrenceService } from '../../src/modules/expenses/recurrence.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { PaymentMethod, Prisma } from '@prisma/client';

describe('RecurrenceService', () => {
  let service: RecurrenceService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      recurrenceRule: {
        create: jest.fn(),
        delete: jest.fn(),
      },
      expense: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurrenceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RecurrenceService>(RecurrenceService);
  });

  describe('createRuleAndMaterialize', () => {
    it('should create recurrence rule and materialize 12 future monthly instances', async () => {
      const startDate = new Date(Date.UTC(2026, 9, 10)); // Oct 10, 2026

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
      expect(prisma.expense.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            isRecurring: true,
            recurrenceRuleId: 'rule-1',
          }),
        ]),
      });
    });
  });
});
