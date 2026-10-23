import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from '../../src/modules/expenses/expenses.service';
import { InvoicesService } from '../../src/modules/cards/invoices.service';
import { RecurrenceService } from '../../src/modules/expenses/recurrence.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import {
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';

describe('ExpensesService - settleExpense', () => {
  let service: ExpensesService;
  let prisma: any;

  const accountId = 'acc-123';
  const expenseId = 'exp-123';

  beforeEach(async () => {
    prisma = {
      expense: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: prisma },
        { provide: InvoicesService, useValue: {} },
        { provide: RecurrenceService, useValue: {} },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should toggle a cash expense from PENDING to PAID and set paidAt', async () => {
    const existingExpense = {
      id: expenseId,
      accountId,
      description: 'Conta de Luz',
      amount: 150.0,
      paymentMethod: PaymentMethod.BOLETO,
      paymentStatus: PaymentStatus.PENDING,
      dueDate: new Date('2026-10-25T00:00:00.000Z'),
      updatedAt: new Date('2026-10-23T10:00:00.000Z'),
    };
    prisma.expense.findFirst.mockResolvedValue(existingExpense);
    prisma.expense.update.mockImplementation(({ data }: any) => ({
      ...existingExpense,
      paymentStatus: data.paymentStatus,
      paidAt: data.paidAt,
      updatedAt: new Date(),
    }));

    const result = await service.settleExpense(accountId, expenseId, {});

    expect(result.paymentStatus).toBe(PaymentStatus.PAID);
    expect(result.displayStatus).toBe('PAID');
    expect(result.paidAt).toBeInstanceOf(Date);
    expect(prisma.expense.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: expenseId },
        data: expect.objectContaining({
          paymentStatus: PaymentStatus.PAID,
          paidAt: expect.any(Date),
        }),
      }),
    );
  });

  it('should toggle a cash expense from PAID to PENDING and clear paidAt', async () => {
    const existingExpense = {
      id: expenseId,
      accountId,
      description: 'Internet',
      amount: 99.9,
      paymentMethod: PaymentMethod.PIX,
      paymentStatus: PaymentStatus.PAID,
      paidAt: new Date('2026-10-20T10:00:00.000Z'),
      dueDate: new Date('2026-10-25T00:00:00.000Z'),
      updatedAt: new Date('2026-10-20T10:00:00.000Z'),
    };
    prisma.expense.findFirst.mockResolvedValue(existingExpense);
    prisma.expense.update.mockImplementation(({ data }: any) => ({
      ...existingExpense,
      paymentStatus: data.paymentStatus,
      paidAt: data.paidAt,
      updatedAt: new Date(),
    }));

    const result = await service.settleExpense(accountId, expenseId, {});

    expect(result.paymentStatus).toBe(PaymentStatus.PENDING);
    expect(result.displayStatus).toBe('PENDING');
    expect(result.paidAt).toBeNull();
  });

  it('should throw UnprocessableEntityException when attempting to settle a CREDIT_CARD expense directly', async () => {
    const ccExpense = {
      id: expenseId,
      accountId,
      description: 'Supermercado',
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentStatus: PaymentStatus.PENDING,
      updatedAt: new Date(),
    };
    prisma.expense.findFirst.mockResolvedValue(ccExpense);

    await expect(
      service.settleExpense(accountId, expenseId, {}),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('should throw ConflictException (409) when expectedUpdatedAt does not match', async () => {
    const existingExpense = {
      id: expenseId,
      accountId,
      description: 'Farmácia',
      paymentMethod: PaymentMethod.DEBIT_CARD,
      paymentStatus: PaymentStatus.PENDING,
      dueDate: new Date('2026-10-23T00:00:00.000Z'),
      updatedAt: new Date('2026-10-23T11:00:00.000Z'),
    };
    prisma.expense.findFirst.mockResolvedValue(existingExpense);

    await expect(
      service.settleExpense(accountId, expenseId, {
        expectedUpdatedAt: '2026-10-22T08:00:00.000Z',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw NotFoundException if expense does not exist', async () => {
    prisma.expense.findFirst.mockResolvedValue(null);

    await expect(
      service.settleExpense(accountId, 'non-existent', {}),
    ).rejects.toThrow(NotFoundException);
  });
});
