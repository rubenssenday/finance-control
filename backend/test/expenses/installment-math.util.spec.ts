import { calculateInstallments } from '../../src/modules/expenses/utils/installment-math.util';

describe('InstallmentMathUtil', () => {
  it('should calculate the exact PRD example: R$ 100.00 in 3 installments', () => {
    // PRD Section 6 F04 exact formula:
    // TotalCents = 10000, N = 3
    // BaseCents = 3333, RemainderCents = 1
    // Installment 1 = R$ 33.34, Installments 2 & 3 = R$ 33.33
    const result = calculateInstallments(100.0, 3);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      installmentNumber: 1,
      amount: 33.34,
      cents: 3334,
    });
    expect(result[1]).toEqual({
      installmentNumber: 2,
      amount: 33.33,
      cents: 3333,
    });
    expect(result[2]).toEqual({
      installmentNumber: 3,
      amount: 33.33,
      cents: 3333,
    });

    const sum = result.reduce((acc, curr) => acc + curr.cents, 0);
    expect(sum).toBe(10000);
  });

  it('should conserve the exact total sum down to the cent across arbitrary amounts and counts', () => {
    const testCases = [
      { amount: 1549.99, installments: 7 },
      { amount: 99.99, installments: 12 },
      { amount: 5000.0, installments: 10 },
      { amount: 12345.67, installments: 72 },
      { amount: 0.05, installments: 2 },
    ];

    for (const tc of testCases) {
      const breakdown = calculateInstallments(tc.amount, tc.installments);
      const totalExpectedCents = Math.round(tc.amount * 100);
      const sumCents = breakdown.reduce((acc, curr) => acc + curr.cents, 0);
      expect(sumCents).toBe(totalExpectedCents);
    }
  });

  it('should return 1 single installment without modification when installmentCount is 1', () => {
    const result = calculateInstallments(250.75, 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      installmentNumber: 1,
      amount: 250.75,
      cents: 25075,
    });
  });

  it('should throw an error if installmentCount < 1', () => {
    expect(() => calculateInstallments(100, 0)).toThrow();
  });
});
