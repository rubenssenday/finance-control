import {
  calculateInstallments,
  addMonthsSafely,
} from '../../src/modules/expenses/utils/installment-math.util';

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

  describe('addMonthsSafely', () => {
    it('should add months correctly for standard days', () => {
      const base = new Date(Date.UTC(2026, 9, 15)); // Oct 15, 2026
      const month1 = addMonthsSafely(base, 1);
      expect(month1.getUTCFullYear()).toBe(2026);
      expect(month1.getUTCMonth()).toBe(10); // Nov
      expect(month1.getUTCDate()).toBe(15);

      const month3 = addMonthsSafely(base, 3);
      expect(month3.getUTCFullYear()).toBe(2027);
      expect(month3.getUTCMonth()).toBe(0); // Jan 2027
      expect(month3.getUTCDate()).toBe(15);
    });

    it('should clamp days to the last day of month (e.g. Jan 31 -> Feb 28)', () => {
      const base = new Date(Date.UTC(2026, 0, 31)); // Jan 31, 2026 (non-leap year)
      const feb = addMonthsSafely(base, 1);
      expect(feb.getUTCFullYear()).toBe(2026);
      expect(feb.getUTCMonth()).toBe(1); // Feb
      expect(feb.getUTCDate()).toBe(28);

      const apr = addMonthsSafely(base, 3);
      expect(apr.getUTCFullYear()).toBe(2026);
      expect(apr.getUTCMonth()).toBe(3); // April has 30 days
      expect(apr.getUTCDate()).toBe(30);
    });

    it('should return clone when monthsToAdd is 0', () => {
      const base = new Date(Date.UTC(2026, 5, 20));
      const res = addMonthsSafely(base, 0);
      expect(res.getTime()).toBe(base.getTime());
    });
  });
});

