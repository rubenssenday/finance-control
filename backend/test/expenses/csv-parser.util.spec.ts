import {
  parseCsvText,
  parseCurrencyAmount,
  parseDateString,
  normalizePaymentMethod,
  validateCsvRows,
} from '../../src/modules/expenses/utils/csv-parser.util';
import { PaymentMethod } from '@prisma/client';

describe('CsvParserUtil', () => {
  describe('parseCsvText', () => {
    it('should parse standard CSV lines with quotes and commas', () => {
      const csv = `description,amount,date\n"Grocery store, central",150.00,2026-10-22\nGas,50.00,2026-10-23`;
      const rows = parseCsvText(csv);

      expect(rows).toHaveLength(3);
      expect(rows[1][0]).toBe('Grocery store, central');
      expect(rows[1][1]).toBe('150.00');
      expect(rows[2][0]).toBe('Gas');
    });
  });

  describe('parseCurrencyAmount', () => {
    it('should parse Brazilian currency formats and plain floats', () => {
      expect(parseCurrencyAmount('R$ 1.250,50')).toBe(1250.5);
      expect(parseCurrencyAmount('150,00')).toBe(150.0);
      expect(parseCurrencyAmount('340.75')).toBe(340.75);
      expect(parseCurrencyAmount('invalid')).toBeNull();
    });
  });

  describe('parseDateString', () => {
    it('should parse DD/MM/YYYY and YYYY-MM-DD', () => {
      const d1 = parseDateString('22/10/2026');
      expect(d1).toBeTruthy();
      expect(new Date(d1!).getUTCDate()).toBe(22);

      const d2 = parseDateString('2026-10-22');
      expect(d2).toBeTruthy();
    });
  });

  describe('normalizePaymentMethod', () => {
    it('should recognize credit, debit, pix, and boleto keywords', () => {
      expect(normalizePaymentMethod('Cartao de Credito')).toBe(PaymentMethod.CREDIT_CARD);
      expect(normalizePaymentMethod('CREDIT_CARD')).toBe(PaymentMethod.CREDIT_CARD);
      expect(normalizePaymentMethod('Debito')).toBe(PaymentMethod.DEBIT_CARD);
      expect(normalizePaymentMethod('PIX')).toBe(PaymentMethod.PIX);
      expect(normalizePaymentMethod('Boleto Bancario')).toBe(PaymentMethod.BOLETO);
      expect(normalizePaymentMethod('Unknown')).toBeNull();
    });
  });

  describe('validateCsvRows', () => {
    it('should match categories and cards and flag missing entities', () => {
      const rows = [
        ['description', 'amount', 'date', 'method', 'category', 'card_nickname', 'installments'],
        ['Supermarket', '150.00', '2026-10-22', 'DEBIT_CARD', 'Food & Dining', '', '1'],
        ['New Laptop', '5000.00', '2026-10-22', 'CREDIT_CARD', 'Electronics', 'Nubank', '10'],
      ];

      const categories = [{ id: 'cat-food', name: 'Food & Dining' }];
      const cards = [{ id: 'card-nu', nickname: 'Nubank' }];

      const results = validateCsvRows(rows, categories, cards);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[0].parsed?.categoryId).toBe('cat-food');

      // Second row has unmatched category 'Electronics'
      expect(results[1].isValid).toBe(false);
      expect(results[1].errors.some((e) => e.includes('Electronics'))).toBe(true);
    });
  });
});
