import { CurrencyFormatOptions, DateFormatStyle, DEFAULT_LOCALE, SupportedLocale } from './types';

/**
 * Safely parse date from string, number or Date object, avoiding timezone shifts
 * for plain YYYY-MM-DD date strings.
 */
export function parseDateInput(input: string | number | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === 'string') {
    // Check if it matches YYYY-MM-DD exact format
    const ymdMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      return new Date(year, month, day, 12, 0, 0);
    }
  }

  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format currency with locale-specific rules (BRL R$ 1.250,50 / USD $1,250.50)
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options: CurrencyFormatOptions = {},
): string {
  if (amount === null || amount === undefined || amount === '') {
    return locale === 'pt-BR' ? 'R$ 0,00' : '$0.00';
  }

  let num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return locale === 'pt-BR' ? 'R$ 0,00' : '$0.00';

  if (options.isCents) {
    num = num / 100;
  }

  const currencyCode = locale === 'pt-BR' ? 'BRL' : 'USD';
  const showSymbol = options.showSymbol !== false;

  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: currencyCode,
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  });

  // Standardize non-breaking space (\u00A0) to standard space for clean UI renders
  return formatter.format(num).replace(/\u00A0/g, ' ');
}

/**
 * Format calendar date according to locale (DD/MM/YYYY for pt-BR, MM/DD/YYYY for en-US)
 */
export function formatDate(
  dateInput: string | number | Date | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE,
  style: DateFormatStyle = 'numeric',
): string {
  const date = parseDateInput(dateInput);
  if (!date) return '-';

  if (typeof style === 'object') {
    return date.toLocaleDateString(locale, style);
  }

  if (style === 'monthYear') {
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }

  if (style === 'shortMonth') {
    const month = date.toLocaleDateString(locale, { month: 'short' }).replace('.', '');
    const year = date.getFullYear();
    return locale === 'pt-BR' ? `${month}/${year}` : `${month} ${year}`;
  }

  if (style === 'longDate') {
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Default 'numeric'
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  if (locale === 'pt-BR') {
    return `${day}/${month}/${year}`;
  }
  return `${month}/${day}/${year}`;
}

/**
 * Format 24-hour time notation (HH:mm)
 */
export function formatTime(
  dateInput: string | number | Date | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const date = parseDateInput(dateInput);
  if (!date) return '-';

  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale !== 'pt-BR',
  });
}

/**
 * Combined Date and Time formatted string
 */
export function formatDateTime(
  dateInput: string | number | Date | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  const date = parseDateInput(dateInput);
  if (!date) return '-';

  const d = formatDate(date, locale, 'numeric');
  const t = formatTime(date, locale);
  return `${d} ${t}`;
}

/**
 * Parse localized number string (e.g. "1.250,50" -> 1250.50) into standard number
 */
export function parseLocalizedNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;

  const clean = value.trim();
  // If string contains both '.' and ',', determine format by last separator
  const lastDot = clean.lastIndexOf('.');
  const lastComma = clean.lastIndexOf(',');

  if (lastComma > lastDot) {
    // Brazilian format: "1.250,50" -> remove dots, replace comma with dot
    const normalized = clean.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  } else if (lastDot > lastComma) {
    // US format: "1,250.50" -> remove commas
    const normalized = clean.replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Single separator
  if (lastComma !== -1) {
    const normalized = clean.replace(',', '.').replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  const normalized = clean.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
