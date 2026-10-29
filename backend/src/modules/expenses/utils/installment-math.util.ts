/**
 * Precision financial math utility for integer-cent installment calculation.
 * Implements the banking-standard algorithm:
 * - Total cents = round(totalAmount * 100)
 * - Base cents = floor(totalCents / N)
 * - Remainder cents = totalCents - (baseCents * N)
 * - Installment 1 = (baseCents + remainderCents) / 100
 * - Installments 2..N = baseCents / 100
 *
 * Guarantees 100% cent conservation: sum(installments) === totalAmount exact.
 */

export interface InstallmentBreakdown {
  installmentNumber: number;
  amount: number;
  cents: number;
}

export function calculateInstallments(
  totalAmount: number,
  installmentCount: number,
): InstallmentBreakdown[] {
  if (installmentCount < 1) {
    throw new Error('Installment count must be at least 1.');
  }

  // Convert float to exact integer cents
  const totalCents = Math.round(totalAmount * 100);

  if (installmentCount === 1) {
    return [
      {
        installmentNumber: 1,
        amount: totalCents / 100,
        cents: totalCents,
      },
    ];
  }

  const baseCents = Math.floor(totalCents / installmentCount);
  const remainderCents = totalCents - baseCents * installmentCount;

  const result: InstallmentBreakdown[] = [];

  for (let i = 1; i <= installmentCount; i++) {
    const cents = i === 1 ? baseCents + remainderCents : baseCents;
    result.push({
      installmentNumber: i,
      amount: cents / 100,
      cents,
    });
  }

  return result;
}

/**
 * Safely adds months to a base date preserving the day of month,
 * clamping to the last valid day of the target month (e.g. Jan 31 + 1 mo = Feb 28).
 */
export function addMonthsSafely(baseDate: Date, monthsToAdd: number): Date {
  if (monthsToAdd === 0) {
    return new Date(baseDate.getTime());
  }

  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth();
  const day = baseDate.getUTCDate();
  const hours = baseDate.getUTCHours();
  const minutes = baseDate.getUTCMinutes();
  const seconds = baseDate.getUTCSeconds();
  const ms = baseDate.getUTCMilliseconds();

  const totalMonths = month + monthsToAdd;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  // Day 0 of (targetMonth + 1) in UTC gives the last day of targetMonth
  const maxDays = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, maxDays);

  return new Date(Date.UTC(targetYear, targetMonth, targetDay, hours, minutes, seconds, ms));
}

