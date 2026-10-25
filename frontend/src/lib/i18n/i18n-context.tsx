'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  CurrencyFormatOptions,
  DateFormatStyle,
  DEFAULT_LOCALE,
  I18nContextType,
  SupportedLocale,
} from './types';
import {
  formatCurrency as formatCurrencyUtil,
  formatDate as formatDateUtil,
  formatDateTime as formatDateTimeUtil,
  formatTime as formatTimeUtil,
  parseLocalizedNumber as parseLocalizedNumberUtil,
} from './formatters';

import ptBRDictionary from '../../locales/pt-BR.json';
import enUSDictionary from '../../locales/en-US.json';

const dictionaries: Record<SupportedLocale, Record<string, any>> = {
  'pt-BR': ptBRDictionary,
  'en-US': enUSDictionary,
};

const I18nContext = createContext<I18nContextType | null>(null);

function getInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    // 1. Check NEXT_LOCALE cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, val] = cookie.trim().split('=');
      if (name === 'NEXT_LOCALE' && (val === 'pt-BR' || val === 'en-US')) {
        return val as SupportedLocale;
      }
    }

    // 2. Check localStorage
    const saved = localStorage.getItem('financial_control_locale');
    if (saved === 'pt-BR' || saved === 'en-US') {
      return saved as SupportedLocale;
    }

    // 3. Check browser language
    const navLang = navigator.language?.toLowerCase() || '';
    if (navLang.startsWith('pt')) return 'pt-BR';
    if (navLang.startsWith('en')) return 'en-US';
  } catch (err) {
    // Ignore storage/cookie access errors
  }

  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const initial = getInitialLocale();
    setLocaleState(initial);
    setIsMounted(true);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = initial;
    }
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('financial_control_locale', newLocale);
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = newLocale;
      } catch (err) {
        console.error('Failed to persist locale preference', err);
      }
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
      const fallbackDict = dictionaries['en-US'];

      const resolveKey = (d: Record<string, any>, path: string): any => {
        const parts = path.split('.');
        let current: any = d;
        for (const part of parts) {
          if (current && typeof current === 'object' && part in current) {
            current = current[part];
          } else {
            return undefined;
          }
        }
        return current;
      };

      let message = resolveKey(dict, key);
      if (message === undefined && locale !== 'en-US') {
        message = resolveKey(fallbackDict, key);
      }

      if (message === undefined || typeof message !== 'string') {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Missing translation key: "${key}" for locale "${locale}"`);
        }
        return key;
      }

      if (params) {
        return Object.entries(params).reduce((acc, [paramKey, val]) => {
          return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
        }, message);
      }

      return message;
    },
    [locale],
  );

  const formatCurrency = useCallback(
    (amount: number | string | null | undefined, options?: CurrencyFormatOptions) => {
      return formatCurrencyUtil(amount, locale, options);
    },
    [locale],
  );

  const formatDate = useCallback(
    (dateInput: string | number | Date | null | undefined, style?: DateFormatStyle) => {
      return formatDateUtil(dateInput, locale, style);
    },
    [locale],
  );

  const formatTime = useCallback(
    (dateInput: string | number | Date | null | undefined) => {
      return formatTimeUtil(dateInput, locale);
    },
    [locale],
  );

  const formatDateTime = useCallback(
    (dateInput: string | number | Date | null | undefined) => {
      return formatDateTimeUtil(dateInput, locale);
    },
    [locale],
  );

  const parseLocalizedNumber = useCallback((value: string | number | null | undefined) => {
    return parseLocalizedNumberUtil(value);
  }, []);

  const value = useMemo<I18nContextType>(
    () => ({
      locale,
      setLocale,
      t,
      formatCurrency,
      formatDate,
      formatTime,
      formatDateTime,
      parseLocalizedNumber,
    }),
    [
      locale,
      setLocale,
      t,
      formatCurrency,
      formatDate,
      formatTime,
      formatDateTime,
      parseLocalizedNumber,
    ],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

export function useFormatters() {
  const { formatCurrency, formatDate, formatTime, formatDateTime, parseLocalizedNumber } =
    useTranslation();
  return {
    formatCurrency,
    formatDate,
    formatTime,
    formatDateTime,
    parseLocalizedNumber,
  };
}
