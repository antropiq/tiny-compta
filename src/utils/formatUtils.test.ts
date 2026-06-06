import { describe, it, expect } from 'vitest';
import { FormatUtils } from './formatUtils';

describe('FormatUtils', () => {
  describe('currency', () => {
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
  });
});
