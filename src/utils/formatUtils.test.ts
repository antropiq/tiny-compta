import { describe, it, expect } from 'vitest';
import { FormatUtils } from './formatUtils';
import dayjs from 'dayjs';

describe('FormatUtils', () => {
  describe('currency', () => {
    it('uses navigator language when no locale is provided', () => {
      const originalLanguage = global.navigator.language;
      Object.defineProperty(global.navigator, 'language', { value: 'fr-FR', writable: true, configurable: true });
      const result = FormatUtils.currency(100);
      expect(result).toContain('€');
      Object.defineProperty(global.navigator, 'language', { value: originalLanguage, writable: true, configurable: true });
    });
    it('formats positive numbers with currency symbol', () => {
      const result = FormatUtils.currency(100, 'en-US');
      expect(result).toContain('$');
      expect(result).toContain('100.00');
    });

    it('formats negative numbers with currency symbol', () => {
      const result = FormatUtils.currency(-50.5, 'en-US');
      expect(result).toContain('$');
      expect(result).toContain('50.50');
      expect(result).toContain('-');
    });

    it('uses localized decimal separator and symbol for French locale', () => {
      const result = FormatUtils.currency(1234.5, 'fr-FR');
      expect(result).toContain('€');
      expect(result).toContain('1\u202f234,50');
    });

    it('uses localized decimal separator and symbol for US locale', () => {
      const result = FormatUtils.currency(1234.5, 'en-US');
      expect(result).toContain('$');
      expect(result).toContain('1,234.50');
    });

    it('formats zero correctly with currency symbol', () => {
      const result = FormatUtils.currency(0, 'en-US');
      expect(result).toContain('$');
      expect(result).toContain('0.00');
    });

    it('formats numbers with many decimal places', () => {
      const result = FormatUtils.currency(99.999, 'en-US');
      expect(result).toContain('$');
      expect(result).toContain('100.00');
    });

    it('falls back to base language currency when full locale is unknown', () => {
      const result = FormatUtils.currency(100, 'de');
      expect(result).toContain('€');
    });

    it('falls back to base language currency for unknown region with known base', () => {
      const result = FormatUtils.currency(100, 'de-AT');
      expect(result).toContain('€');
    });

    it('defaults to USD for unknown locale and unknown base language', () => {
      const result = FormatUtils.currency(100, 'xx-XX');
      expect(result).toContain('$');
    });
  });

  describe('date', () => {
    it('formats date with French locale', () => {
      const result = FormatUtils.date(dayjs('2026-06-01'), 'fr-FR');
      expect(result).toBe('01/06/2026');
    });

    it('formats date with US locale', () => {
      const result = FormatUtils.date(dayjs('2026-06-01'), 'en-US');
      expect(result).toBe('06/01/2026');
    });

    it('formats date with German locale', () => {
      const result = FormatUtils.date(dayjs('2026-06-01'), 'de-DE');
      expect(result).toBe('01.06.2026');
    });

    it('accepts a string date', () => {
      const result = FormatUtils.date('2026-01-15', 'fr-FR');
      expect(result).toBe('15/01/2026');
    });

      it('uses i18n language when no locale is provided', () => {
      // i18n is initialized with 'fr' fallback, so date should be DD/MM/YYYY format
      const result = FormatUtils.date(dayjs('2026-03-05'));
      expect(result).toBe('05/03/2026');
    });
  });
});
