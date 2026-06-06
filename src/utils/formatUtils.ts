import dayjs, { type Dayjs } from 'dayjs';
import i18n from '../i18n';

export class FormatUtils {
  /**
   * Maps a locale to its primary currency code.
   */
  private static readonly localeToCurrency: Record<string, string> = {
    'fr': 'EUR',
    'fr-FR': 'EUR',
    'fr-BE': 'EUR',
    'fr-CH': 'CHF',
    'fr-CA': 'CAD',
    'en': 'USD',
    'en-US': 'USD',
    'en-GB': 'GBP',
    'en-CA': 'CAD',
    'en-AU': 'AUD',
    'en-DE': 'EUR',
    'de': 'EUR',
    'de-DE': 'EUR',
    'de-CH': 'CHF',
    'es': 'EUR',
    'es-ES': 'EUR',
    'it': 'EUR',
    'it-CH': 'CHF',
    'pt': 'EUR',
    'pt-BR': 'BRL',
    'nl': 'EUR',
    'nl-BE': 'EUR',
    'zh': 'CNY',
    'zh-CN': 'CNY',
    'ja': 'JPY',
    'ja-JP': 'JPY',
  };

  /**
   * Derives the currency code from a locale string.
   */
  private static getCurrencyForLocale(locale: string): string {
    if (this.localeToCurrency[locale]) {
      return this.localeToCurrency[locale];
    }
    // Try the base language (first 2 chars)
    const baseLang = locale.split('-')[0];
    if (this.localeToCurrency[baseLang]) {
      return this.localeToCurrency[baseLang];
    }
    // Default to USD if unknown
    return 'USD';
  }

  /**
   * Formats a number as currency with localized decimal separator and currency symbol.
   * @param amount The numeric amount to format.
   * @param locale The locale to use for formatting (defaults to current browser language).
   * @returns A string with localized decimal separator, thousands grouping, and currency symbol.
   */
  static currency(amount: number, locale?: string): string {
    const usedLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
    const currency = this.getCurrencyForLocale(usedLocale);
    return new Intl.NumberFormat(usedLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Formats a date using the current i18n locale.
   * @param date The date to format (Dayjs object or string).
   * @param locale Optional locale override (defaults to current i18n language).
   * @returns A localized date string (e.g. "01/06/2026" for fr, "06/01/2026" for en).
   */
  static date(date: Dayjs | string, locale?: string): string {
    const usedLocale = locale || i18n.language;
    const dateObj = dayjs(date).toDate();
    return new Intl.DateTimeFormat(usedLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  }
}
