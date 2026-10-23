/**
 * Billing cycle calculation utility for credit cards and invoices.
 * Implements deterministic calendar day clamping (handling leap years and 28/29/30-day months)
 * and cycle due date resolution according to Brazilian and international card statement rules.
 */

export interface CycleDates {
  billingYear: number;
  billingMonth: number;
  closingDate: Date;
  dueDate: Date;
}

/**
 * Returns the maximum number of days in the specified year and month (1-12).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Clamps a day of the month (1-31) to the maximum valid day of that specific year and month.
 * E.g., day 31 in February clamps to 28 (or 29 in leap years), day 31 in April clamps to 30.
 */
export function clampDay(year: number, month: number, day: number): number {
  const maxDays = getDaysInMonth(year, month);
  return Math.min(Math.max(1, day), maxDays);
}

/**
 * Calculates exact closing and due dates for a given billing cycle (month 1-12, year).
 *
 * Rules:
 * - If closingDay < dueDay: closing and due dates fall in the same calendar month.
 * - If closingDay > dueDay: the payment due date falls in the calendar month following the closing day.
 * - Clamping is applied to both closing and due days for months with fewer days.
 */
export function calculateCycleDates(
  billingYear: number,
  billingMonth: number,
  closingDay: number,
  dueDay: number,
): CycleDates {
  const clampedClosingDay = clampDay(billingYear, billingMonth, closingDay);
  const closingDate = new Date(
    Date.UTC(billingYear, billingMonth - 1, clampedClosingDay, 23, 59, 59, 999),
  );

  let dueYear = billingYear;
  let dueMonth = billingMonth;

  if (closingDay > dueDay) {
    if (billingMonth === 12) {
      dueYear = billingYear + 1;
      dueMonth = 1;
    } else {
      dueMonth = billingMonth + 1;
    }
  }

  const clampedDueDay = clampDay(dueYear, dueMonth, dueDay);
  const dueDate = new Date(
    Date.UTC(dueYear, dueMonth - 1, clampedDueDay, 23, 59, 59, 999),
  );

  return {
    billingYear,
    billingMonth,
    closingDate,
    dueDate,
  };
}

/**
 * Determines which billing cycle (year, month) a transaction falls into based on transaction date
 * and card's closing day.
 *
 * Rule:
 * - If transaction day <= clamped closing day for that month: allocated to current month's invoice.
 * - If transaction day > clamped closing day: allocated to subsequent month's invoice.
 */
export function resolveCycleForTransaction(
  transactionDate: Date,
  closingDay: number,
): { billingYear: number; billingMonth: number } {
  const txYear = transactionDate.getUTCFullYear();
  const txMonth = transactionDate.getUTCMonth() + 1;
  const txDay = transactionDate.getUTCDate();

  const currentMonthClosingDay = clampDay(txYear, txMonth, closingDay);

  if (txDay <= currentMonthClosingDay) {
    return { billingYear: txYear, billingMonth: txMonth };
  }

  if (txMonth === 12) {
    return { billingYear: txYear + 1, billingMonth: 1 };
  }

  return { billingYear: txYear, billingMonth: txMonth + 1 };
}
