import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ApplicationStatusBar from './ApplicationStatusBar';
import packageJson from '../../package.json';
import { useBalance } from '../hooks/useBalance';
import { useTranslation } from 'react-i18next';
import { useAccount } from '../hooks/useAccount';
import dayjs from 'dayjs';
import type { AccountContextType } from '../contexts/AccountContext';
import type { Recurring } from '../types/recurring';

vi.mock('../hooks/useBalance', () => ({
  useBalance: vi.fn(),
}));

vi.mock(import('react-i18next'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: vi.fn(),
  };
});

vi.mock('../hooks/useAccount', () => ({
  useAccount: vi.fn(),
}));

describe('ApplicationStatusBar', () => {
  const mockT = (key: string, options?: { date: string; balance: string }) => {
    if (key === 'transaction.balance_status' && options) {
      return `Solde du compte au ${options.date}: ${options.balance}`;
    }
    return key;
  };

  it('renders the correct version number', () => {
    vi.mocked(useBalance).mockReturnValue({ balance: 0, loading: false, hasTransactions: false });
    vi.mocked(useAccount).mockReturnValue({ 
      selectedAccount: null, 
      selectedDate: dayjs(),
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn()
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar activeTab={0} recurrings={[]} />);
    expect(screen.getByText(`Tiny compta version @${packageJson.version}`)).toBeInTheDocument();
  });

  it('renders the balance correctly with the selected date', () => {
    const selectedDate = dayjs('2024-05-15');
    vi.mocked(useBalance).mockReturnValue({ balance: 123.45, loading: false, hasTransactions: true });
    vi.mocked(useAccount).mockReturnValue({ 
      selectedAccount: { id: '1', label: 'Acc' },
      selectedDate: selectedDate,
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn()
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar activeTab={0} recurrings={[]} />);
    expect(screen.getByText('Solde du compte au 15/05/2024: $123.45')).toBeInTheDocument();
  });

  it('does not render balance if no transactions', () => {
    vi.mocked(useBalance).mockReturnValue({ balance: 0, loading: false, hasTransactions: false });
    vi.mocked(useAccount).mockReturnValue({ 
      selectedAccount: { id: '1', label: 'Acc' }, 
      selectedDate: dayjs(),
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn()
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar activeTab={0} recurrings={[]} />);
    expect(screen.queryByText(/Solde du compte/)).not.toBeInTheDocument();
  });

  it('does not render balance if no account', () => {
    vi.mocked(useBalance).mockReturnValue({ balance: 0, loading: false, hasTransactions: true });
    vi.mocked(useAccount).mockReturnValue({ 
      selectedAccount: null, 
      selectedDate: dayjs(),
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn()
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar activeTab={0} recurrings={[]} />);
    expect(screen.queryByText(/Solde du compte/)).not.toBeInTheDocument();
  });

  it('does not render selected sum when no transactions are selected', () => {
    vi.mocked(useBalance).mockReturnValue({ balance: 0, loading: false, hasTransactions: false });
    vi.mocked(useAccount).mockReturnValue({ 
      selectedAccount: null, 
      selectedDate: dayjs(),
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn()
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar activeTab={0} recurrings={[]} />);
    expect(screen.queryByText(/Sélectionné/)).not.toBeInTheDocument();
  });

  it('renders selected sum when transactions are selected', () => {
    const mockSelectedTransactions = [
      { id: 'tx-1', accountId: '1', label: 'T1', amount: 10, dueDate: '2024-01-01' },
      { id: 'tx-2', accountId: '1', label: 'T2', amount: 20, dueDate: '2024-01-02' },
    ];
    vi.mocked(useBalance).mockReturnValue({ balance: 0, loading: false, hasTransactions: false });
    vi.mocked(useAccount).mockReturnValue({ 
      selectedAccount: null, 
      selectedDate: dayjs(),
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: mockSelectedTransactions,
      setSelectedTransactions: vi.fn()
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string, options?: { sum: string }) => {
        if (key === 'transaction.selected_sum' && options) {
          return `Sélectionné : ${options.sum}`;
        }
        return key;
      },
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar activeTab={0} recurrings={[]} />);
    expect(screen.getByText('Sélectionné : $30.00')).toBeInTheDocument();
  });

  it('does not render recurring sum when not on recurrings tab', () => {
    vi.mocked(useBalance).mockReturnValue({ balance: 0, loading: false, hasTransactions: false });
    vi.mocked(useAccount).mockReturnValue({ 
      selectedAccount: null, 
      selectedDate: dayjs(),
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn()
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar activeTab={0} recurrings={[{ id: 'r1', accountId: '1', label: 'Rent', amount: 500, dayOfMonth: 1, startDate: '2024-01-01' } as Recurring]} />);
    expect(screen.queryByText(/Somme des paiements récurrents/)).not.toBeInTheDocument();
  });

  it('renders recurring sum when on recurrings tab with recurrings', () => {
    const mockRecurrings: Recurring[] = [
      { id: 'r1', accountId: '1', label: 'Rent', amount: 500, dayOfMonth: 1, startDate: '2024-01-01' },
      { id: 'r2', accountId: '1', label: 'Internet', amount: 30, dayOfMonth: 15, startDate: '2024-01-01' },
    ];
    vi.mocked(useBalance).mockReturnValue({ balance: 0, loading: false, hasTransactions: false });
    vi.mocked(useAccount).mockReturnValue({ 
      selectedAccount: null, 
      selectedDate: dayjs(),
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn()
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string, options?: { sum: string }) => {
        if (key === 'recurring.sum' && options) {
          return `Somme des paiements récurrents : ${options.sum}`;
        }
        return key;
      },
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar activeTab={1} recurrings={mockRecurrings} />);
    expect(screen.getByText('Somme des paiements récurrents : $530.00')).toBeInTheDocument();
  });

  it('does not render recurring sum when on recurrings tab but no recurrings', () => {
    vi.mocked(useBalance).mockReturnValue({ balance: 0, loading: false, hasTransactions: false });
    vi.mocked(useAccount).mockReturnValue({ 
      selectedAccount: null, 
      selectedDate: dayjs(),
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn()
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar activeTab={1} recurrings={[]} />);
    expect(screen.queryByText(/Somme des paiements récurrents/)).not.toBeInTheDocument();
  });

  it('excludes inactive recurrings with past endDate from sum', () => {
    const mockRecurrings: Recurring[] = [
      { id: 'r1', accountId: '1', label: 'Active Rent', amount: 500, dayOfMonth: 1, startDate: '2024-01-01' },
      { id: 'r2', accountId: '1', label: 'Ended Gym', amount: 30, dayOfMonth: 15, startDate: '2024-01-01', endDate: '2023-12-31' },
    ];
    vi.mocked(useBalance).mockReturnValue({ balance: 0, loading: false, hasTransactions: false });
    vi.mocked(useAccount).mockReturnValue({ 
      selectedAccount: null, 
      selectedDate: dayjs(),
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn()
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string, options?: { sum: string }) => {
        if (key === 'recurring.sum' && options) {
          return `Somme des paiements récurrents : ${options.sum}`;
        }
        return key;
      },
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar activeTab={1} recurrings={mockRecurrings} />);
    expect(screen.getByText('Somme des paiements récurrents : $500.00')).toBeInTheDocument();
  });
});
