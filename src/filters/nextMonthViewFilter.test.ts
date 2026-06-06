import { describe, it, expect, beforeEach } from 'vitest';
import dayjs from 'dayjs';
import { nextMonthViewFilter, monthlyViewFilter } from './index';
import type { Transaction } from '../types/transaction';

const createTransaction = (dueDate: string, label = 'test'): Transaction => ({
  id: 'test-id',
  accountId: 'test-account',
  label,
  amount: 100,
  dueDate,
});

describe('nextMonthViewFilter', () => {
  beforeEach(() => {
    // Reset filter state between tests since it's a singleton
    nextMonthViewFilter.setup();
    // We need to unset cutoffDate for the "not set" test
    // by creating a fresh approach
  });
  it('should have correct label', () => {
    expect(nextMonthViewFilter.label).toBe('transaction.next_month_view');
  });

  it('should be inactive by default', () => {
    expect(nextMonthViewFilter.active).toBe(false);
  });

  it('should not autoactivate by default', () => {
    expect(nextMonthViewFilter.autoactivate).toBe(false);
  });

  it('should keep transactions on or before cutoff date (end of month + 5 days)', () => {
    nextMonthViewFilter.setup();
    const cutoffDate = dayjs().endOf('month').add(5, 'day');
    const transactions = [
      createTransaction(cutoffDate.format('YYYY-MM-DD')),
      createTransaction(cutoffDate.subtract(1, 'day').format('YYYY-MM-DD')),
      createTransaction(cutoffDate.subtract(10, 'day').format('YYYY-MM-DD')),
    ];
    const result = nextMonthViewFilter.apply(transactions);
    expect(result).toHaveLength(3);
  });

  it('should filter out transactions after cutoff date (end of month + 5 days)', () => {
    nextMonthViewFilter.setup();
    const cutoffDate = dayjs().endOf('month').add(5, 'day');
    const transactions = [
      createTransaction(cutoffDate.add(1, 'day').format('YYYY-MM-DD')),
      createTransaction(cutoffDate.add(10, 'day').format('YYYY-MM-DD')),
      createTransaction(cutoffDate.subtract(1, 'day').format('YYYY-MM-DD')),
    ];
    const result = nextMonthViewFilter.apply(transactions);
    expect(result).toHaveLength(1);
    expect(result[0].dueDate).toBe(cutoffDate.subtract(1, 'day').format('YYYY-MM-DD'));
  });

  it('should return all transactions when cutoffDate is not set', () => {
    // Manually unset cutoffDate to test the guard clause
    const filter = nextMonthViewFilter as unknown as { cutoffDate?: dayjs.Dayjs };
    filter.cutoffDate = undefined;
    const transactions = [
      createTransaction('2026-01-01'),
      createTransaction('2026-12-31'),
    ];
    const result = nextMonthViewFilter.apply(transactions);
    expect(result).toHaveLength(2);
    // Restore cutoffDate for other tests
    nextMonthViewFilter.setup();
  });

  it('should filter transactions correctly when combined with monthlyViewFilter', () => {
    // Reset both filters to ensure clean state
    monthlyViewFilter.setup();
    nextMonthViewFilter.setup();
    
    const cutoffDate = dayjs().endOf('month').add(5, 'day');
    const startDate = dayjs().startOf('month').subtract(5, 'day');
    
    const transactions = [
      createTransaction(startDate.subtract(1, 'day').format('YYYY-MM-DD'), 'too_old'),
      createTransaction(startDate.format('YYYY-MM-DD'), 'at_start'),
      createTransaction(dayjs().format('YYYY-MM-DD'), 'today'),
      createTransaction(cutoffDate.format('YYYY-MM-DD'), 'at_cutoff'),
      createTransaction(cutoffDate.add(1, 'day').format('YYYY-MM-DD'), 'too_far'),
    ];

    // Apply monthlyViewFilter first (active by default)
    let filtered = monthlyViewFilter.active ? monthlyViewFilter.apply(transactions) : transactions;
    // Then apply nextMonthViewFilter (activate for this test)
    nextMonthViewFilter.active = true;
    filtered = nextMonthViewFilter.apply(filtered);

    expect(filtered).toHaveLength(3);
    const labels = filtered.map(t => t.label);
    expect(labels).not.toContain('too_old');
    expect(labels).not.toContain('too_far');
    expect(labels).toContain('at_start');
    expect(labels).toContain('today');
    expect(labels).toContain('at_cutoff');
  });
});
