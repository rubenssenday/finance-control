import { PaymentStatus } from '@prisma/client';

export type ExpenseDisplayStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface ExpenseStatusResult {
  displayStatus: ExpenseDisplayStatus;
  daysOverdue: number;
}

/**
 * Dynamically computes displayStatus and daysOverdue for an expense.
 *
 * Rules (per PRD F06):
 * - PAID: explicitly marked by user or debit at creation
 * - PENDING: unmarked and current system date <= due date
 * - OVERDUE: unmarked and current system date > due date
 */
export function calculateExpenseDisplayStatus(
  paymentStatus: PaymentStatus,
  dueDate: Date | string,
  referenceDate: Date = new Date(),
): ExpenseStatusResult {
  if (paymentStatus === PaymentStatus.PAID) {
    return {
      displayStatus: 'PAID',
      daysOverdue: 0,
    };
  }

  if (!dueDate) {
    return {
      displayStatus: 'PENDING',
      daysOverdue: 0,
    };
  }

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;

  // Normalize both dates to midnight UTC to compare calendar days accurately
  const dueMidnight = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate(),
  );
  const refMidnight = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
  );

  if (refMidnight > dueMidnight) {
    const diffMs = refMidnight - dueMidnight;
    const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return {
      displayStatus: 'OVERDUE',
      daysOverdue,
    };
  }

  return {
    displayStatus: 'PENDING',
    daysOverdue: 0,
  };
}
