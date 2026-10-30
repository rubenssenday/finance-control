import { normalizeSearch } from '../../src/modules/expenses/utils/search-normalize.util';

describe('normalizeSearch', () => {
  it('should convert uppercase to lowercase', () => {
    expect(normalizeSearch('MERCADO')).toBe('mercado');
    expect(normalizeSearch('Netflix')).toBe('netflix');
  });

  it('should remove accents and diacritics', () => {
    expect(normalizeSearch('Almoço no Itaú')).toBe('almoco no itau');
    expect(normalizeSearch('Café & Pão')).toBe('cafe & pao');
    expect(normalizeSearch('ÁÉÍÓÚ àèìòù âêîôû ãõ ç')).toBe('aeiou aeiou aeiou ao c');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(normalizeSearch('   Farmácia   ')).toBe('farmacia');
  });

  it('should handle null, undefined, or empty string gracefully', () => {
    expect(normalizeSearch('')).toBe('');
    expect(normalizeSearch(null)).toBe('');
    expect(normalizeSearch(undefined)).toBe('');
  });
});
