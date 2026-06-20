import { describe, it, expect } from 'vitest';
import { RecurringUtils } from './recurringUtils';
import type { Recurring } from '../types/recurring';

describe('RecurringUtils', () => {
  const baseRecurring: Recurring = {
    id: 'rec-1',
    accountId: 'acc-1',
    label: 'Netflix',
    amount: -15.99,
    dayOfMonth: 15,
    startDate: '2026-01-01',
  };

  it('should generate transaction for a normal month within range', () => {
    const transactions = RecurringUtils.generateTransactionsForMonth([baseRecurring], '2026-02');
    expect(transactions).toHaveLength(1);
    expect(transactions[0].dueDate).toBe('2026-02-15');
    expect(transactions[0].amount).toBe(-15.99);
    expect(transactions[0].recurringId).toBe('rec-1');
  });

  it('should clamp dayOfMonth to 28 for February on a non-leap year', () => {
    const recurring = { ...baseRecurring, dayOfMonth: 31 };
    const transactions = RecurringUtils.generateTransactionsForMonth([recurring], '2026-02');
    expect(transactions).toHaveLength(1);
    expect(transactions[0].dueDate).toBe('2026-02-28');
  });

  it('should clamp dayOfMonth to 29 for February on a leap year', () => {
    const recurring = { ...baseRecurring, dayOfMonth: 31, startDate: '2024-01-01' };
    const transactions = RecurringUtils.generateTransactionsForMonth([recurring], '2024-02');
    expect(transactions).toHaveLength(1);
    expect(transactions[0].dueDate).toBe('2024-02-29');
  });

  it('should clamp dayOfMonth to 30 for April', () => {
    const recurring = { ...baseRecurring, dayOfMonth: 31 };
    const transactions = RecurringUtils.generateTransactionsForMonth([recurring], '2026-04');
    expect(transactions).toHaveLength(1);
    expect(transactions[0].dueDate).toBe('2026-04-30');
  });

  it('should not generate transaction if target month is before startDate', () => {
    const recurring = { ...baseRecurring, startDate: '2026-06-01' };
    const transactions = RecurringUtils.generateTransactionsForMonth([recurring], '2026-05');
    expect(transactions).toHaveLength(0);
  });

  it('should not generate transaction if target month is after endDate', () => {
    const recurring = { ...baseRecurring, startDate: '2026-01-01', endDate: '2026-03-10' };
    const transactions = RecurringUtils.generateTransactionsForMonth([recurring], '2026-04');
    expect(transactions).toHaveLength(0);
  });

  it('should generate if target month contains the exact startDate', () => {
    const recurring = { ...baseRecurring, startDate: '2026-02-10', dayOfMonth: 15 };
    const transactions = RecurringUtils.generateTransactionsForMonth([recurring], '2026-02');
    expect(transactions).toHaveLength(1);
    expect(transactions[0].dueDate).toBe('2026-02-15');
  });

  it('should not generate if dayOfMonth is before the startDate in the starting month', () => {
    const recurring = { ...baseRecurring, startDate: '2026-02-20', dayOfMonth: 15 };
    const transactions = RecurringUtils.generateTransactionsForMonth([recurring], '2026-02');
    expect(transactions).toHaveLength(0);
  });

  it('should not generate if dayOfMonth is after the endDate in the ending month', () => {
    const recurring = { ...baseRecurring, startDate: '2026-01-01', endDate: '2026-02-10', dayOfMonth: 15 };
    const transactions = RecurringUtils.generateTransactionsForMonth([recurring], '2026-02');
    expect(transactions).toHaveLength(0);
  });

  it('should generate if dayOfMonth is before or equal to the endDate in the ending month', () => {
    const recurring = { ...baseRecurring, startDate: '2026-01-01', endDate: '2026-02-20', dayOfMonth: 15 };
    const transactions = RecurringUtils.generateTransactionsForMonth([recurring], '2026-02');
    expect(transactions).toHaveLength(1);
    expect(transactions[0].dueDate).toBe('2026-02-15');
  });
});
