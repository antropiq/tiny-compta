import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ApplicationStatusBar from './ApplicationStatusBar';
import packageJson from '../../package.json';
import { useBalance } from '../hooks/useBalance';
import { useTranslation } from 'react-i18next';
import { useAccount } from '../hooks/useAccount';
import dayjs from 'dayjs';
import type { AccountContextType } from '../contexts/AccountContext';

vi.mock('../hooks/useBalance', () => ({
  useBalance: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('../hooks/useAccount', () => ({
  useAccount: vi.fn(),
}));

describe('ApplicationStatusBar', () => {
  const mockT = (key: string, options?: { date: string; amount: string; currency: string }) => {
    if (key === 'transaction.balance_status' && options) {
      return `Solde du compte au ${options.date}: ${options.amount} ${options.currency}`;
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
      isInitializing: false
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar />);
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
      isInitializing: false
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar />);
    expect(screen.getByText('Solde du compte au 15/05/2024: 123.45 €')).toBeInTheDocument();
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
      isInitializing: false
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar />);
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
      isInitializing: false
    } as AccountContextType);
    vi.mocked(useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    } as unknown as ReturnType<typeof useTranslation>);

    render(<ApplicationStatusBar />);
    expect(screen.queryByText(/Solde du compte/)).not.toBeInTheDocument();
  });
});
