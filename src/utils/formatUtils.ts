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
}
