import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecurringsTab from './RecurringsTab';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { AccountContext } from '../contexts/AccountContext';
import dayjs, { Dayjs } from 'dayjs';
import type { Account } from '../types/account';
import type { Transaction } from '../types/transaction';

const mockSelectedDate = dayjs('2025-01-01');

const mockAccount: Account = { id: 'acc-1', label: 'Test Account' };

const mockContextValue = {
  selectedAccount: mockAccount,
  setSelectedAccount: vi.fn(),
  selectedDate: mockSelectedDate,
  setSelectedDate: vi.fn(),
  transactionsVersion: 0,
  setTransactionsVersion: vi.fn(),
  isInitializing: false,
  selectedTransactions: [],
  setSelectedTransactions: vi.fn(),
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <AccountContext.Provider value={mockContextValue}>{ui}</AccountContext.Provider>
    </I18nextProvider>
  );
};

const testRecurrings = [
  {
    id: 'rec-1',
    accountId: 'acc-1',
    label: 'Monthly Subscription',
    description: 'Netflix',
    amount: 100,
    dayOfMonth: 1,
    startDate: '2025-01-01',
    endDate: '2025-06-01',
  },
  {
    id: 'rec-2',
    accountId: 'acc-1',
    label: 'No End Date',
    description: 'Permanent',
    amount: 50,
    dayOfMonth: 15,
    startDate: '2025-01-01',
  },
];

describe('RecurringsTab', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    vi.clearAllMocks();
  });

  it('renders the remaining column header', () => {
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={() => {}}
        onTransactionsChanged={() => {}}
        applyRecurringsForMonth={async () => {}}
      />
    );
    expect(screen.getByText('Remaining')).toBeInTheDocument();
  });

  it('shows remaining amount when endDate is specified', () => {
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={() => {}}
        onTransactionsChanged={() => {}}
        applyRecurringsForMonth={async () => {}}
      />
    );
    // rec-1: endDate 2025-06-01, selectedDate 2025-01-01
    // Months = diff(Jun, Jan, 'month') + 1 = 5 + 1 = 6
    // Remaining = 100 * 6 = 600
    expect(screen.getByText('$600.00')).toBeInTheDocument();
  });

  it('shows empty remaining when no endDate is specified', () => {
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={() => {}}
        onTransactionsChanged={() => {}}
        applyRecurringsForMonth={async () => {}}
      />
    );
    // rec-2 has no endDate, remaining cell should be empty
    const rows = screen.getAllByRole('row');
    // Find the row for "No End Date" recurring
    const noEndDateRow = rows.find(row => row.textContent?.includes('No End Date'));
    expect(noEndDateRow).toBeTruthy();
    // The remaining cell (6th column, 0-indexed) should be empty
    const cells = noEndDateRow?.querySelectorAll('td');
    expect(cells?.[5]?.textContent).toBe('');
  });

  it('renders the French remaining column label', async () => {
    await i18n.changeLanguage('fr');
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={() => {}}
        onTransactionsChanged={() => {}}
        applyRecurringsForMonth={async () => {}}
      />
    );
    expect(screen.getByText('Restant')).toBeInTheDocument();
  });

  it('renders edit and delete buttons for each recurring', () => {
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={() => {}}
        onTransactionsChanged={() => {}}
        applyRecurringsForMonth={async () => {}}
      />
    );
    const editButtons = screen.getAllByLabelText('edit recurring');
    const deleteButtons = screen.getAllByLabelText('delete recurring');
    expect(editButtons.length).toBe(2);
    expect(deleteButtons.length).toBe(2);
  });

  it('calculates correct remaining for single month', () => {
    const singleMonthRecurrings = [
      {
        id: 'rec-1',
        accountId: 'acc-1',
        label: 'One Month',
        description: 'Jan only',
        amount: 100,
        dayOfMonth: 1,
        startDate: '2025-01-01',
        endDate: '2025-01-01',
      },
    ];
    renderWithProviders(
      <RecurringsTab
        recurrings={singleMonthRecurrings}
        onRecurringsChanged={() => {}}
        onTransactionsChanged={() => {}}
        applyRecurringsForMonth={async () => {}}
      />
    );
    // endDate = startDate, diff = 0, +1 = 1 month, remaining = 100 * 1 = 100
    // Find the row and check the remaining cell (6th column)
    const rows = screen.getAllByRole('row');
    const dataRow = rows.find(row => row.textContent?.includes('One Month'));
    const cells = dataRow?.querySelectorAll('td');
    expect(cells?.[5]?.textContent).toBe('$100.00');
  });

  it('shows zero remaining when endDate is before selectedDate', () => {
    const pastRecurrings = [
      {
        id: 'rec-1',
        accountId: 'acc-1',
        label: 'Past Recurring',
        description: 'Ended',
        amount: 100,
        dayOfMonth: 1,
        startDate: '2024-01-01',
        endDate: '2024-06-01',
      },
    ];
    renderWithProviders(
      <RecurringsTab
        recurrings={pastRecurrings}
        onRecurringsChanged={() => {}}
        onTransactionsChanged={() => {}}
        applyRecurringsForMonth={async () => {}}
      />
    );
    // endDate 2024-06-01, selectedDate 2025-01-01
    // diff = -7, +1 = -6, months <= 0 so it should be empty
    expect(screen.queryByText('$600.00')).not.toBeInTheDocument();
    expect(screen.queryByText('-$600.00')).not.toBeInTheDocument();
  });
});
