/**
 * Normalizes a string for search by removing diacritics (accents),
 * converting to lowercase, and trimming whitespace.
 *
 * Example: "Almoço no Itaú" -> "almoco no itau"
 */
export function normalizeSearch(text?: string | null): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
