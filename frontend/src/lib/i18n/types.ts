export type SupportedLocale = 'pt-BR' | 'en-US';

export const DEFAULT_LOCALE: SupportedLocale = 'pt-BR';

export const SUPPORTED_LOCALES: Array<{
  code: SupportedLocale;
  name: string;
  flag: string;
  dateFormat: string;
  currency: string;
}> = [
  {
    code: 'pt-BR',
    name: 'Português (Brasil)',
    flag: '🇧🇷',
    dateFormat: 'DD/MM/AAAA',
    currency: 'BRL (R$)',
  },
  {
    code: 'en-US',
    name: 'English (US)',
    flag: '🇺🇸',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD ($)',
  },
];

export interface CurrencyFormatOptions {
  isCents?: boolean;
  showSymbol?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export type DateFormatStyle =
  | 'numeric'
  | 'shortMonth'
  | 'longDate'
  | 'monthYear'
  | Intl.DateTimeFormatOptions;

export interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number | string | null | undefined, options?: CurrencyFormatOptions) => string;
  formatDate: (date: string | number | Date | null | undefined, style?: DateFormatStyle) => string;
  formatTime: (date: string | number | Date | null | undefined) => string;
  formatDateTime: (date: string | number | Date | null | undefined) => string;
  parseLocalizedNumber: (value: string | number | null | undefined) => number;
}
