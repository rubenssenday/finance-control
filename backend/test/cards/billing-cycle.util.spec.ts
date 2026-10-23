import {
  clampDay,
  calculateCycleDates,
  resolveCycleForTransaction,
  getDaysInMonth,
} from '../../src/modules/cards/utils/billing-cycle.util';

describe('BillingCycleUtil', () => {
  describe('clampDay', () => {
    it('should clamp day 31 to 28 in February of a non-leap year (2026)', () => {
      expect(clampDay(2026, 2, 31)).toBe(28);
      expect(clampDay(2026, 2, 29)).toBe(28);
      expect(clampDay(2026, 2, 20)).toBe(20);
    });

    it('should clamp day 31 to 29 in February of a leap year (2028)', () => {
      expect(clampDay(2028, 2, 31)).toBe(29);
      expect(clampDay(2028, 2, 29)).toBe(29);
    });

    it('should clamp day 31 to 30 in months with 30 days (April, June, September, November)', () => {
      expect(clampDay(2026, 4, 31)).toBe(30);
      expect(clampDay(2026, 6, 31)).toBe(30);
      expect(clampDay(2026, 9, 31)).toBe(30);
      expect(clampDay(2026, 11, 31)).toBe(30);
    });

    it('should preserve days between 1 and 31 in 31-day months', () => {
      expect(clampDay(2026, 1, 31)).toBe(31);
      expect(clampDay(2026, 3, 31)).toBe(31);
      expect(clampDay(2026, 5, 31)).toBe(31);
      expect(clampDay(2026, 7, 31)).toBe(31);
      expect(clampDay(2026, 8, 31)).toBe(31);
      expect(clampDay(2026, 10, 31)).toBe(31);
      expect(clampDay(2026, 12, 31)).toBe(31);
    });
  });

  describe('calculateCycleDates', () => {
    it('should compute closing and due dates in the SAME month when closingDay < dueDay', () => {
      // Closing: 5th, Due: 12th
      const cycle = calculateCycleDates(2026, 11, 5, 12);
      expect(cycle.billingYear).toBe(2026);
      expect(cycle.billingMonth).toBe(11);

      expect(cycle.closingDate.getUTCFullYear()).toBe(2026);
      expect(cycle.closingDate.getUTCMonth() + 1).toBe(11);
      expect(cycle.closingDate.getUTCDate()).toBe(5);

      expect(cycle.dueDate.getUTCFullYear()).toBe(2026);
      expect(cycle.dueDate.getUTCMonth() + 1).toBe(11);
      expect(cycle.dueDate.getUTCDate()).toBe(12);
    });

    it('should compute due date in the NEXT month when closingDay > dueDay', () => {
      // Closing: 25th, Due: 3rd
      const cycle = calculateCycleDates(2026, 11, 25, 3);
      expect(cycle.closingDate.getUTCFullYear()).toBe(2026);
      expect(cycle.closingDate.getUTCMonth() + 1).toBe(11);
      expect(cycle.closingDate.getUTCDate()).toBe(25);

      // Due date should be in December 2026
      expect(cycle.dueDate.getUTCFullYear()).toBe(2026);
      expect(cycle.dueDate.getUTCMonth() + 1).toBe(12);
      expect(cycle.dueDate.getUTCDate()).toBe(3);
    });

    it('should handle December rollover to January of the next year when closingDay > dueDay', () => {
      // Closing: 28th Dec, Due: 5th Jan
      const cycle = calculateCycleDates(2026, 12, 28, 5);
      expect(cycle.closingDate.getUTCFullYear()).toBe(2026);
      expect(cycle.closingDate.getUTCMonth() + 1).toBe(12);
      expect(cycle.closingDate.getUTCDate()).toBe(28);

      expect(cycle.dueDate.getUTCFullYear()).toBe(2027);
      expect(cycle.dueDate.getUTCMonth() + 1).toBe(1);
      expect(cycle.dueDate.getUTCDate()).toBe(5);
    });

    it('should apply day clamping to closing date in February', () => {
      // Closing day: 31 in February 2026 (clamps to 28)
      const cycle = calculateCycleDates(2026, 2, 31, 10);
      expect(cycle.closingDate.getUTCDate()).toBe(28);
    });
  });

  describe('resolveCycleForTransaction', () => {
    it('should allocate to current month invoice when purchase is made on or before closing day', () => {
      // Closing day is 15
      const txOnClosing = new Date(Date.UTC(2026, 9, 15, 12, 0, 0)); // Oct 15
      const cycle = resolveCycleForTransaction(txOnClosing, 15);
      expect(cycle).toEqual({ billingYear: 2026, billingMonth: 10 });

      const txBeforeClosing = new Date(Date.UTC(2026, 9, 5, 10, 0, 0)); // Oct 5
      const cycleBefore = resolveCycleForTransaction(txBeforeClosing, 15);
      expect(cycleBefore).toEqual({ billingYear: 2026, billingMonth: 10 });
    });

    it('should allocate to subsequent month invoice when purchase is made after closing day', () => {
      // Closing day is 15, purchase on Oct 16
      const txAfterClosing = new Date(Date.UTC(2026, 9, 16, 10, 0, 0));
      const cycle = resolveCycleForTransaction(txAfterClosing, 15);
      expect(cycle).toEqual({ billingYear: 2026, billingMonth: 11 });
    });

    it('should handle December rollover to January of next year when purchase is made after closing day in December', () => {
      // Closing day is 20, purchase on Dec 21
      const txAfterClosingInDec = new Date(Date.UTC(2026, 11, 21, 10, 0, 0));
      const cycle = resolveCycleForTransaction(txAfterClosingInDec, 20);
      expect(cycle).toEqual({ billingYear: 2027, billingMonth: 1 });
    });
  });
});
