import { PaymentStatus } from '@prisma/client';
import { calculateExpenseDisplayStatus } from '../../src/modules/expenses/utils/expense-status.util';

describe('calculateExpenseDisplayStatus', () => {
  const referenceDate = new Date('2026-10-23T12:00:00.000Z');

  it('should return PAID with daysOverdue = 0 when paymentStatus is PAID', () => {
    const pastDueDate = new Date('2026-10-01T00:00:00.000Z');
    const result = calculateExpenseDisplayStatus(
      PaymentStatus.PAID,
      pastDueDate,
      referenceDate,
    );

    expect(result).toEqual({
      displayStatus: 'PAID',
      daysOverdue: 0,
    });
  });

  it('should return PENDING with daysOverdue = 0 when dueDate is in the future', () => {
    const futureDueDate = new Date('2026-10-25T00:00:00.000Z');
    const result = calculateExpenseDisplayStatus(
      PaymentStatus.PENDING,
      futureDueDate,
      referenceDate,
    );

    expect(result).toEqual({
      displayStatus: 'PENDING',
      daysOverdue: 0,
    });
  });

  it('should return PENDING with daysOverdue = 0 when dueDate is today', () => {
    const todayDueDate = new Date('2026-10-23T08:00:00.000Z');
    const result = calculateExpenseDisplayStatus(
      PaymentStatus.PENDING,
      todayDueDate,
      referenceDate,
    );

    expect(result).toEqual({
      displayStatus: 'PENDING',
      daysOverdue: 0,
    });
  });

  it('should return OVERDUE and correct daysOverdue when dueDate is in the past', () => {
    const pastDueDate = new Date('2026-10-20T00:00:00.000Z');
    const result = calculateExpenseDisplayStatus(
      PaymentStatus.PENDING,
      pastDueDate,
      referenceDate,
    );

    expect(result).toEqual({
      displayStatus: 'OVERDUE',
      daysOverdue: 3,
    });
  });

  it('should handle string ISO dueDate correctly', () => {
    const pastIso = '2026-10-18T00:00:00.000Z';
    const result = calculateExpenseDisplayStatus(
      PaymentStatus.PENDING,
      pastIso,
      referenceDate,
    );

    expect(result).toEqual({
      displayStatus: 'OVERDUE',
      daysOverdue: 5,
    });
  });
});
