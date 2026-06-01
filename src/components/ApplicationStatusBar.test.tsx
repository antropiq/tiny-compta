import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ApplicationStatusBar from './ApplicationStatusBar';
import packageJson from '../../package.json';
import { useBalance } from '../hooks/useBalance';
import { useTranslation } from 'react-i18next';
import { useAccount } from '../hooks/useAccount';
import dayjs from 'dayjs';

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
  const mockT = (key: string, options: any) => {
    if (key === 'transaction.balance_status') {
      return `Solde du compte au ${options.date}: ${options.amount} ${options.currency}`;
    }
    return key;
  };

  it('renders the correct version number', () => {
    (useBalance as any).mockReturnValue({ balance: 0, loading: false, hasTransactions: false });
    (useAccount as any).mockReturnValue({ selectedAccount: null, selectedDate: dayjs() });
    (useTranslation as any).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    });

    render(<ApplicationStatusBar />);
    expect(screen.getByText(`Tiny compta version @${packageJson.version}`)).toBeInTheDocument();
  });

  it('renders the balance correctly with the selected date', () => {
    const selectedDate = dayjs('2024-05-15');
    (useBalance as any).mockReturnValue({ balance: 123.45, loading: false, hasTransactions: true });
    (useAccount as any).mockReturnValue({ 
      selectedAccount: { id: '1', label: 'Acc' },
      selectedDate: selectedDate
    });
    (useTranslation as any).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    });

    render(<ApplicationStatusBar />);
    expect(screen.getByText('Solde du compte au 15/05/2024: 123.45 €')).toBeInTheDocument();
  });

  it('does not render balance if no transactions', () => {
    (useBalance as any).mockReturnValue({ balance: 0, loading: false, hasTransactions: false });
    (useAccount as any).mockReturnValue({ selectedAccount: { id: '1', label: 'Acc' }, selectedDate: dayjs() });
    (useTranslation as any).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    });

    render(<ApplicationStatusBar />);
    expect(screen.queryByText(/Solde du compte/)).not.toBeInTheDocument();
  });

  it('does not render balance if no account', () => {
    (useBalance as any).mockReturnValue({ balance: 0, loading: false, hasTransactions: true });
    (useAccount as any).mockReturnValue({ selectedAccount: null, selectedDate: dayjs() });
    (useTranslation as any).mockReturnValue({
      t: mockT,
      i18n: { language: 'fr' },
    });

    render(<ApplicationStatusBar />);
    expect(screen.queryByText(/Solde du compte/)).not.toBeInTheDocument();
  });
});
