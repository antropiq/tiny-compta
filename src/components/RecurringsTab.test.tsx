import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecurringsTab from './RecurringsTab';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { AccountContext } from '../contexts/AccountContext';
import { dbService } from '../services/db';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Account } from '../types/account';
import type { Recurring } from '../types/recurring';

vi.mock('../services/db', () => ({
  dbService: {
    addRecurring: vi.fn(),
    updateRecurring: vi.fn(),
    deleteRecurring: vi.fn(),
    getTransactionsByAccountId: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AccountContext.Provider value={mockContextValue}>{ui}</AccountContext.Provider>
      </LocalizationProvider>
    </I18nextProvider>
  );
};

const testRecurrings: Recurring[] = [
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

describe('RecurringsTab handlers', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    vi.clearAllMocks();
    vi.mocked(dbService.addRecurring).mockResolvedValue(undefined);
    vi.mocked(dbService.updateRecurring).mockResolvedValue(undefined);
    vi.mocked(dbService.deleteRecurring).mockResolvedValue(undefined);
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue([]);
    vi.mocked(dbService.updateTransaction).mockResolvedValue(undefined);
    vi.mocked(dbService.deleteTransaction).mockResolvedValue(undefined);
  });

  it('opens the editor in create mode when add button is clicked', async () => {
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={vi.fn()}
        onTransactionsChanged={vi.fn()}
        applyRecurringsForMonth={async () => {}}
      />
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    // The editor should open - check for the dialog title
    expect(await screen.findByText(/add recurring payment/i)).toBeInTheDocument();
  });

  it('opens the editor in edit mode with data when edit button is clicked', async () => {
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={vi.fn()}
        onTransactionsChanged={vi.fn()}
        applyRecurringsForMonth={async () => {}}
      />
    );

    const editButtons = screen.getAllByLabelText('edit recurring');
    fireEvent.click(editButtons[0]);

    expect(await screen.findByText(/edit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/label/i)).toHaveValue('Monthly Subscription');
  });

  it('calls addRecurring when saving a new recurring', async () => {
    const mockOnRecurringsChanged = vi.fn();
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={mockOnRecurringsChanged}
        onTransactionsChanged={vi.fn()}
        applyRecurringsForMonth={async () => {}}
      />
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(await screen.findByText(/add recurring payment/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: 'New Recurring' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/day of month/i), { target: { value: '10' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(dbService.addRecurring).toHaveBeenCalled();
      expect(mockOnRecurringsChanged).toHaveBeenCalled();
    });
  });

  it('shows cascade dialog when editing recurring with amount change', async () => {
    const mockOnRecurringsChanged = vi.fn();
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={mockOnRecurringsChanged}
        onTransactionsChanged={vi.fn()}
        applyRecurringsForMonth={async () => {}}
      />
    );

    const editButtons = screen.getAllByLabelText('edit recurring');
    fireEvent.click(editButtons[0]);

    expect(await screen.findByText(/edit/i)).toBeInTheDocument();

    // Change the amount (original is 100)
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/the recurring amount has been changed/i)).toBeInTheDocument();
    });
  });

  it('confirms cascade update with applyCascade=true', async () => {
    const mockOnRecurringsChanged = vi.fn();
    const mockOnTransactionsChanged = vi.fn();
    const mockTxs = [
      {
        id: 'tx-1',
        accountId: 'acc-1',
        label: 'Test Tx',
        amount: 100,
        dueDate: dayjs().startOf('month').add(1, 'day').format('YYYY-MM-DD'),
        recurringId: 'rec-1',
      },
    ];
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue(mockTxs);

    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={mockOnRecurringsChanged}
        onTransactionsChanged={mockOnTransactionsChanged}
        applyRecurringsForMonth={async () => {}}
      />
    );

    const editButtons = screen.getAllByLabelText('edit recurring');
    fireEvent.click(editButtons[0]);

    expect(await screen.findByText(/edit/i)).toBeInTheDocument();

    // Change the amount to trigger cascade dialog
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await screen.findByText(/the recurring amount has been changed/i);

    // Click "Yes" to apply cascade
    fireEvent.click(screen.getByRole('button', { name: /yes/i }));

    await waitFor(() => {
      expect(dbService.updateRecurring).toHaveBeenCalled();
    });
  });

  it('confirms cascade update with applyCascade=false', async () => {
    const mockOnRecurringsChanged = vi.fn();
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={mockOnRecurringsChanged}
        onTransactionsChanged={vi.fn()}
        applyRecurringsForMonth={async () => {}}
      />
    );

    const editButtons = screen.getAllByLabelText('edit recurring');
    fireEvent.click(editButtons[0]);

    expect(await screen.findByText(/edit/i)).toBeInTheDocument();

    // Change the amount to trigger cascade dialog
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '200' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await screen.findByText(/the recurring amount has been changed/i);

    // Click "No" to not apply cascade
    fireEvent.click(screen.getByRole('button', { name: /no/i }));

    await waitFor(() => {
      expect(dbService.updateRecurring).toHaveBeenCalled();
      expect(mockOnRecurringsChanged).toHaveBeenCalled();
    });
  });

  it('saves recurring without amount change directly (no cascade)', async () => {
    const mockOnRecurringsChanged = vi.fn();
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={mockOnRecurringsChanged}
        onTransactionsChanged={vi.fn()}
        applyRecurringsForMonth={async () => {}}
      />
    );

    const editButtons = screen.getAllByLabelText('edit recurring');
    fireEvent.click(editButtons[0]);

    expect(await screen.findByText(/edit/i)).toBeInTheDocument();

    // Change only the label (not amount)
    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: 'Updated Subscription' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(dbService.updateRecurring).toHaveBeenCalled();
      expect(mockOnRecurringsChanged).toHaveBeenCalled();
    });
  });

  it('opens cascade dialog when delete button is clicked', async () => {
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={vi.fn()}
        onTransactionsChanged={vi.fn()}
        applyRecurringsForMonth={async () => {}}
      />
    );

    const deleteButtons = screen.getAllByLabelText('delete recurring');
    fireEvent.click(deleteButtons[0]);

    expect(await screen.findByText(/would you like to keep the existing transactions/i)).toBeInTheDocument();
  });

  it('confirms delete with action=delete', async () => {
    const mockOnRecurringsChanged = vi.fn();
    const mockOnTransactionsChanged = vi.fn();
    const mockTxs = [
      { id: 'tx-1', accountId: 'acc-1', label: 'Test', amount: 100, dueDate: '2025-01-01', recurringId: 'rec-1' },
    ];
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue(mockTxs);

    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={mockOnRecurringsChanged}
        onTransactionsChanged={mockOnTransactionsChanged}
        applyRecurringsForMonth={async () => {}}
      />
    );

    const deleteButtons = screen.getAllByLabelText('delete recurring');
    fireEvent.click(deleteButtons[0]);

    expect(await screen.findByText(/would you like to keep the existing transactions/i)).toBeInTheDocument();

    // Click "Delete"
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(dbService.deleteTransaction).toHaveBeenCalledWith('tx-1');
      expect(dbService.deleteRecurring).toHaveBeenCalledWith('rec-1');
      expect(mockOnTransactionsChanged).toHaveBeenCalled();
      expect(mockOnRecurringsChanged).toHaveBeenCalled();
    });
  });

  it('confirms delete with action=keep', async () => {
    const mockOnRecurringsChanged = vi.fn();
    const mockOnTransactionsChanged = vi.fn();
    const mockTxs = [
      { id: 'tx-1', accountId: 'acc-1', label: 'Test', amount: 100, dueDate: '2025-01-01', recurringId: 'rec-1' },
    ];
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue(mockTxs);

    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={mockOnRecurringsChanged}
        onTransactionsChanged={mockOnTransactionsChanged}
        applyRecurringsForMonth={async () => {}}
      />
    );

    const deleteButtons = screen.getAllByLabelText('delete recurring');
    fireEvent.click(deleteButtons[0]);

    expect(await screen.findByText(/would you like to keep the existing transactions/i)).toBeInTheDocument();

    // Click "Keep"
    fireEvent.click(screen.getByRole('button', { name: /keep/i }));

    await waitFor(() => {
      expect(dbService.updateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'tx-1', recurringId: undefined })
      );
      expect(dbService.deleteRecurring).toHaveBeenCalledWith('rec-1');
      expect(mockOnTransactionsChanged).toHaveBeenCalled();
      expect(mockOnRecurringsChanged).toHaveBeenCalled();
    });
  });

  it('calls applyRecurringsForMonth when apply button is clicked', async () => {
    const mockApplyRecurrings = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <RecurringsTab
        recurrings={testRecurrings}
        onRecurringsChanged={vi.fn()}
        onTransactionsChanged={vi.fn()}
        applyRecurringsForMonth={mockApplyRecurrings}
      />
    );

    const applyButton = screen.getByRole('button', { name: /apply to selected month/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockApplyRecurrings).toHaveBeenCalled();
    });
  });

  it('does not show add button when no account is selected', () => {
    const nullAccountContext = {
      ...mockContextValue,
      selectedAccount: null,
    };

    render(
      <I18nextProvider i18n={i18n}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AccountContext.Provider value={nullAccountContext}>
            <RecurringsTab
              recurrings={testRecurrings}
              onRecurringsChanged={vi.fn()}
              onTransactionsChanged={vi.fn()}
              applyRecurringsForMonth={async () => {}}
            />
          </AccountContext.Provider>
        </LocalizationProvider>
      </I18nextProvider>
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();
  });

  it('does not show apply button when no account is selected', () => {
    const nullAccountContext = {
      ...mockContextValue,
      selectedAccount: null,
    };

    render(
      <I18nextProvider i18n={i18n}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AccountContext.Provider value={nullAccountContext}>
            <RecurringsTab
              recurrings={testRecurrings}
              onRecurringsChanged={vi.fn()}
              onTransactionsChanged={vi.fn()}
              applyRecurringsForMonth={async () => {}}
            />
          </AccountContext.Provider>
        </LocalizationProvider>
      </I18nextProvider>
    );

    const applyButton = screen.getByRole('button', { name: /apply to selected month/i });
    expect(applyButton).toBeDisabled();
  });
});
