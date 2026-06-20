import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContext } from 'react';
import { AccountProvider } from './AccountContext';
import { dbService } from '../services/db';
import { AccountContext } from '../contexts/AccountContext';
import dayjs from 'dayjs';

vi.mock('../services/db', () => ({
  dbService: {
    getSettingByKey: vi.fn(),
    getAllAccounts: vi.fn(),
    setSetting: vi.fn(),
  },
}));

describe('AccountProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides default values before initialization', () => {
    vi.mocked(dbService.getSettingByKey).mockResolvedValue(undefined);

    const { result } = renderHook(() => useContext(AccountContext), {
      wrapper: ({ children }) => <AccountProvider>{children}</AccountProvider>,
    });

    expect(result.current!.selectedAccount).toBeNull();
    expect(result.current!.isInitializing).toBe(true);
  });

  it('initializes with selected account from settings when account exists', async () => {
    const mockAccount = { id: 'acc-1', label: 'My Account' };
    vi.mocked(dbService.getSettingByKey).mockResolvedValue({ id: 's1', key: 'selected_account', value: 'My Account' });
    vi.mocked(dbService.getAllAccounts).mockResolvedValue([mockAccount]);

    const { result } = renderHook(() => useContext(AccountContext), {
      wrapper: ({ children }) => <AccountProvider>{children}</AccountProvider>,
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current!.selectedAccount).toEqual(mockAccount);
    expect(result.current!.isInitializing).toBe(false);
  });

  it('selects the first account when setting value does not match any account', async () => {
    vi.mocked(dbService.getSettingByKey).mockResolvedValue({ id: 's1', key: 'selected_account', value: 'Nonexistent' });
    vi.mocked(dbService.getAllAccounts).mockResolvedValue([{ id: 'acc-1', label: 'Other Account' }]);

    const { result } = renderHook(() => useContext(AccountContext), {
      wrapper: ({ children }) => <AccountProvider>{children}</AccountProvider>,
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current!.selectedAccount).toEqual({ id: 'acc-1', label: 'Other Account' });
    expect(result.current!.isInitializing).toBe(false);
  });

  it('selects the first account on load when no selected account setting is set', async () => {
    const mockAccount = { id: 'acc-1', label: 'First Account' };
    vi.mocked(dbService.getSettingByKey).mockResolvedValue(undefined);
    vi.mocked(dbService.getAllAccounts).mockResolvedValue([mockAccount]);

    const { result } = renderHook(() => useContext(AccountContext), {
      wrapper: ({ children }) => <AccountProvider>{children}</AccountProvider>,
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current!.selectedAccount).toEqual(mockAccount);
    expect(dbService.setSetting).toHaveBeenCalledWith('selected_account', 'First Account');
    expect(result.current!.isInitializing).toBe(false);
  });

  it('does not select account when setting value is empty', async () => {
    vi.mocked(dbService.getSettingByKey).mockResolvedValue({ id: 's1', key: 'selected_account', value: '' });
    vi.mocked(dbService.getAllAccounts).mockResolvedValue([]);

    const { result } = renderHook(() => useContext(AccountContext), {
      wrapper: ({ children }) => <AccountProvider>{children}</AccountProvider>,
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current!.selectedAccount).toBeNull();
    expect(result.current!.isInitializing).toBe(false);
  });

  it('handles initialization error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(dbService.getSettingByKey).mockRejectedValue(new Error('db error'));

    const { result } = renderHook(() => useContext(AccountContext), {
      wrapper: ({ children }) => <AccountProvider>{children}</AccountProvider>,
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current!.isInitializing).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Error initializing account from settings:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('calls setSetting with account label when selecting an account', async () => {
    vi.mocked(dbService.getSettingByKey).mockResolvedValue(undefined);

    const { result } = renderHook(() => useContext(AccountContext), {
      wrapper: ({ children }) => <AccountProvider>{children}</AccountProvider>,
    });

    const mockAccount = { id: 'acc-1', label: 'New Account' };

    await act(async () => {
      await result.current!.setSelectedAccount(mockAccount);
    });

    expect(dbService.setSetting).toHaveBeenCalledWith('selected_account', 'New Account');
  });

  it('calls setSetting with empty string when deselecting account', async () => {
    vi.mocked(dbService.getSettingByKey).mockResolvedValue(undefined);

    const { result } = renderHook(() => useContext(AccountContext), {
      wrapper: ({ children }) => <AccountProvider>{children}</AccountProvider>,
    });

    await act(async () => {
      await result.current!.setSelectedAccount(null);
    });

    expect(dbService.setSetting).toHaveBeenCalledWith('selected_account', '');
  });

  it('resets selectedDate to current day when selecting a new account', async () => {
    vi.mocked(dbService.getSettingByKey).mockResolvedValue(undefined);

    const { result } = renderHook(() => useContext(AccountContext), {
      wrapper: ({ children }) => <AccountProvider>{children}</AccountProvider>,
    });

    const mockAccount = { id: 'acc-1', label: 'Test' };

    await act(async () => {
      await result.current!.setSelectedAccount(mockAccount);
    });

    expect(result.current!.selectedDate).toBeTruthy();
    expect(result.current!.selectedDate?.format('YYYY-MM-DD')).toBe(dayjs().format('YYYY-MM-DD'));
  });

  it('provides setTransactionsVersion function', async () => {
    vi.mocked(dbService.getSettingByKey).mockResolvedValue(undefined);

    const { result } = renderHook(() => useContext(AccountContext), {
      wrapper: ({ children }) => <AccountProvider>{children}</AccountProvider>,
    });

    await act(async () => {
      result.current!.setTransactionsVersion(v => v + 1);
    });

    expect(result.current!.transactionsVersion).toBe(1);
  });
});
