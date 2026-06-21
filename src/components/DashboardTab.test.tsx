import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardTab from './DashboardTab';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { useAccount } from '../hooks/useAccount';
import { dbService } from '../services/db';
import dayjs from 'dayjs';
import type { Account } from '../types/account';
import type { Transaction } from '../types/transaction';

vi.mock('../hooks/useAccount', () => ({
  useAccount: vi.fn(),
}));

vi.mock('../services/db', () => ({
  dbService: {
    getTransactionsByAccountId: vi.fn(),
  },
}));

vi.mock('@mui/x-charts', () => ({
  ChartsContainer: vi.fn(({ xAxis, series, children }) => (
    <div
      data-testid="mock-charts-container"
      data-xaxis={JSON.stringify(xAxis)}
      data-series={JSON.stringify(series)}
    >
      {children}
    </div>
  )),
  BarPlot: () => <div data-testid="mock-bar-plot" />,
  LinePlot: () => <div data-testid="mock-line-plot" />,
  MarkPlot: () => <div data-testid="mock-mark-plot" />,
  ChartsXAxis: () => <div data-testid="mock-x-axis" />,
  ChartsYAxis: () => <div data-testid="mock-y-axis" />,
  ChartsAxisHighlight: () => <div data-testid="mock-axis-highlight" />,
  ChartsTooltip: () => <div data-testid="mock-tooltip" />,
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {ui}
    </I18nextProvider>
  );
};

describe('DashboardTab', () => {
  const mockAccount: Account = { id: 'account-123', label: 'Main Checking' };
  const selectedDate = dayjs('2026-06-15');

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      accountId: 'account-123',
      label: 'Regular Salary',
      amount: 3000.0,
      dueDate: '2026-06-01',
    },
    {
      id: 'tx-2',
      accountId: 'account-123',
      label: 'Grocery Shopping',
      amount: -120.5,
      dueDate: '2026-06-05',
    },
    {
      id: 'tx-3',
      accountId: 'account-123',
      label: 'Recurring Rent',
      amount: -1000.0,
      dueDate: '2026-06-05',
      recurringId: 'rec-rent',
    },
    {
      id: 'tx-4',
      accountId: 'account-123',
      label: 'Selling Old Phone',
      amount: 150.0,
      dueDate: '2026-06-10',
    },
    {
      id: 'tx-5',
      accountId: 'account-123',
      label: 'Recurring Internet Inflow',
      amount: 30.0,
      dueDate: '2026-06-12',
      recurringId: 'rec-internet',
    },
    {
      id: 'tx-6',
      accountId: 'account-123',
      label: 'Future Inflow Next Month',
      amount: 500.0,
      dueDate: '2026-07-01',
    },
    {
      id: 'tx-7',
      accountId: 'account-123',
      label: 'Past Expense Out of Range',
      amount: -50.0,
      dueDate: '2026-05-30',
    },
    {
      id: 'tx-8',
      accountId: 'account-123',
      label: 'Previous Month Non-Recurring Income',
      amount: 2500.0,
      dueDate: '2026-05-29', // May 29, 2026 (a business day: Friday)
    }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
    vi.mocked(useAccount).mockReturnValue({
      selectedAccount: mockAccount,
      selectedDate: selectedDate,
      transactionsVersion: 1,
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn(),
    });
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue(mockTransactions);
  });

  it('renders instructions to select an account if none is selected', () => {
    vi.mocked(useAccount).mockReturnValue({
      selectedAccount: null,
      selectedDate: selectedDate,
      transactionsVersion: 1,
      setSelectedAccount: vi.fn(),
      setSelectedDate: vi.fn(),
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn(),
    });

    renderWithProviders(<DashboardTab />);
    expect(screen.getByText(/please select an account/i)).toBeInTheDocument();
  });

  it('fetches transactions for the selected account', async () => {
    renderWithProviders(<DashboardTab />);
    await waitFor(() => {
      expect(dbService.getTransactionsByAccountId).toHaveBeenCalledWith('account-123');
    });
  });

  it('renders non-recurring incomes and calculates the total row correctly including previous month business days', async () => {
    renderWithProviders(<DashboardTab />);

    expect(await screen.findByText('Regular Salary')).toBeInTheDocument();
    expect(screen.getByText('Selling Old Phone')).toBeInTheDocument();
    expect(screen.getByText('Previous Month Non-Recurring Income')).toBeInTheDocument();

    expect(screen.queryByText('Grocery Shopping')).not.toBeInTheDocument();
    expect(screen.queryByText('Recurring Rent')).not.toBeInTheDocument();
    expect(screen.queryByText('Recurring Internet Inflow')).not.toBeInTheDocument();
    expect(screen.queryByText('Future Inflow Next Month')).not.toBeInTheDocument();

    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('$2,500.00')).toBeInTheDocument();
    expect(screen.getByText('$5,650.00')).toBeInTheDocument();
  });

  it('renders a friendly message if there are no non-recurring incomes', async () => {
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue([
      {
        id: 'tx-2',
        accountId: 'account-123',
        label: 'Grocery Shopping',
        amount: -120.5,
        dueDate: '2026-06-05',
      },
    ]);

    renderWithProviders(<DashboardTab />);
    expect(await screen.findByText(/no non-recurring income for this period/i)).toBeInTheDocument();
  });

  it('calculates the Account Balances table rows correctly', async () => {
    renderWithProviders(<DashboardTab />);

    await waitFor(() => {
      expect(dbService.getTransactionsByAccountId).toHaveBeenCalled();
    });

    expect(screen.getByText(/today's balance/i)).toBeInTheDocument();
    expect(screen.getByText(/forecasted end of month balance/i)).toBeInTheDocument();

    expect(screen.getAllByText('$4,509.50')).toHaveLength(2);
  });

  it('passes properly structured daily and cumulative series data to the LineChart', async () => {
    renderWithProviders(<DashboardTab />);

    const containerEl = await screen.findByTestId('mock-charts-container');
    expect(containerEl).toBeInTheDocument();

    const seriesDataRaw = containerEl.getAttribute('data-series');
    expect(seriesDataRaw).not.toBeNull();
    const series = JSON.parse(seriesDataRaw!);

    expect(series).toHaveLength(3);
    expect(series[0].id).toBe('non-recurring-incomes');
    expect(series[0].type).toBe('bar');
    expect(series[1].id).toBe('recurring-incomes');
    expect(series[1].type).toBe('bar');
    expect(series[2].id).toBe('balances');
    expect(series[2].type).toBe('line');
  });
});
