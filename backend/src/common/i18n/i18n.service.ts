import { Injectable } from '@nestjs/common';
import { BACKEND_DEFAULT_LOCALE, BackendSupportedLocale } from './i18n.types';
import { ptBRMessages } from './messages/pt-BR';
import { enUSMessages } from './messages/en-US';

@Injectable()
export class I18nService {
  private readonly catalogs: Record<BackendSupportedLocale, Record<string, string>> = {
    'pt-BR': ptBRMessages,
    'en-US': enUSMessages,
  };

  /**
   * Resolve best supported locale from Accept-Language header
   */
  resolveLocale(acceptLanguage?: string | null): BackendSupportedLocale {
    if (!acceptLanguage) return BACKEND_DEFAULT_LOCALE;

    const languages = acceptLanguage
      .split(',')
      .map((part) => {
        const [lang, qVal] = part.trim().split(';q=');
        return {
          lang: lang.trim(),
          q: qVal ? parseFloat(qVal) : 1.0,
        };
      })
      .sort((a, b) => b.q - a.q);

    for (const item of languages) {
      const lower = item.lang.toLowerCase();
      if (lower.startsWith('pt')) return 'pt-BR';
      if (lower.startsWith('en')) return 'en-US';
    }

    return BACKEND_DEFAULT_LOCALE;
  }

  /**
   * Get localized message by error code
   */
  getMessage(
    code: string,
    locale: BackendSupportedLocale = BACKEND_DEFAULT_LOCALE,
    fallbackMessage?: string,
  ): string {
    const catalog = this.catalogs[locale] || this.catalogs[BACKEND_DEFAULT_LOCALE];
    if (catalog && catalog[code]) {
      return catalog[code];
    }

    const fallbackCatalog = this.catalogs['en-US'];
    if (fallbackCatalog && fallbackCatalog[code]) {
      return fallbackCatalog[code];
    }

    return fallbackMessage || code;
  }

  /**
   * Translate exception using error code and request's Accept-Language header
   */
  translate(code?: string, originalMessage?: string, acceptLanguage?: string): string {
    const locale = this.resolveLocale(acceptLanguage);
    if (!code) return originalMessage || 'An error occurred';
    return this.getMessage(code, locale, originalMessage);
  }
}
