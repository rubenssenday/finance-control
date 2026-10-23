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
