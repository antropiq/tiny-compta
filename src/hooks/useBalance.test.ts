import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useBalance } from './useBalance';
import { useAccount } from './useAccount';
import { dbService } from '../services/db';
import type { AccountContextType } from '../contexts/AccountContext';
import dayjs from 'dayjs';

vi.mock('./useAccount', () => ({
  useAccount: vi.fn(),
}));

vi.mock('../services/db', () => ({
  dbService: {
    getTransactionsByAccountId: vi.fn(),
  },
}));

describe('useBalance', () => {
  it('calculates balance correctly', async () => {
    const mockAccount = { id: 'acc-1', label: 'Test Account' };
    const mockTransactions = [
      { id: 'tx-1', accountId: 'acc-1', label: 'T1', amount: 100, dueDate: '2024-01-01' },
      { id: 'tx-2', accountId: 'acc-1', label: 'T2', amount: -50, dueDate: '2024-01-02' },
      { id: 'tx-3', accountId: 'acc-1', label: 'T3', amount: 20, dueDate: '2024-02-01' }, // outside range if selectedDate is 2024-01-15
    ];

    vi.mocked(useAccount).mockReturnValue({
      selectedAccount: mockAccount,
      selectedDate: dayjs('2024-01-15'),
      transactionsVersion: 0,
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
    } as AccountContextType);

    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue(mockTransactions);

    const { result } = renderHook(() => useBalance());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.balance).toBe(50); // 100 - 50
    expect(result.current.hasTransactions).toBe(true);
  });

  it('returns 0 if no account is selected', async () => {
    vi.mocked(useAccount).mockReturnValue({
      selectedAccount: null,
      selectedDate: dayjs(),
      transactionsVersion: 0,
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
    } as AccountContextType);

    const { result } = renderHook(() => useBalance());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.balance).toBe(0);
    expect(result.current.hasTransactions).toBe(false);
  });

  it('returns 0 if no transactions are found', async () => {
    const mockAccount = { id: 'acc-1', label: 'Test Account' };
    vi.mocked(useAccount).mockReturnValue({
      selectedAccount: mockAccount,
      selectedDate: dayjs(),
      transactionsVersion: 0,
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
    } as AccountContextType);

    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue([]);

    const { result } = renderHook(() => useBalance());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.balance).toBe(0);
    expect(result.current.hasTransactions).toBe(false);
  });
});
