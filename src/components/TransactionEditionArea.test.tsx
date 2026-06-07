import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransactionEditionArea from './TransactionEditionArea';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { dbService } from '../services/db';
import { useAccount } from '../hooks/useAccount';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import type { Transaction } from '../types/transaction';

vi.mock('../services/db', () => ({
  dbService: {
    getTransactionsByAccountId: vi.fn(),
    addTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

vi.mock('../hooks/useAccount', () => ({
  useAccount: vi.fn(),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {ui}
      </LocalizationProvider>
    </I18nextProvider>
  );
};

describe('TransactionEditionArea', () => {
  const mockAccount = { id: 'account-1', label: 'Test Account' };
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      accountId: 'account-1',
      label: 'Transaction 1',
      description: 'Desc 1',
      amount: 10,
      dueDate: '2026-06-01',
    },
    {
      id: 'tx-2',
      accountId: 'account-1',
      label: 'Transaction 2',
      description: 'Desc 2',
      amount: 20,
      dueDate: '2026-06-02',
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
    vi.mocked(useAccount).mockReturnValue({
      selectedAccount: mockAccount,
      selectedDate: dayjs(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      setSelectedAccount: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn()
    });
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue(mockTransactions);
  });

  it('shows "select account" message when no account is selected', async () => {
    vi.mocked(useAccount).mockReturnValue({
      selectedAccount: null,
      selectedDate: dayjs(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      setSelectedAccount: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn()
    });
    renderWithProviders(<TransactionEditionArea />);

    expect(screen.getByText(/select account/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
  });

  it('loads and displays transactions when an account is selected', async () => {
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(dbService.getTransactionsByAccountId).toHaveBeenCalledWith(mockAccount.id);
    });

    expect(await screen.findByText('Transaction 1')).toBeInTheDocument();
    expect(await screen.findByText('Transaction 2')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('$20.00')).toBeInTheDocument();
  });

  it('opens TransactionEditor in create mode when "Create" button is clicked', async () => {
    renderWithProviders(<TransactionEditionArea />);

    const createButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createButton);

    expect(await screen.findByRole('heading', { name: /create/i })).toBeInTheDocument();
  });

  it('opens TransactionEditor in edit mode when edit icon is clicked', async () => {
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit transaction/i });
    fireEvent.click(editButtons[0]);

    expect(await screen.findByRole('heading', { name: /edit/i })).toBeInTheDocument();
  });

  it('opens TransactionEditor in clone mode when copy icon is clicked', async () => {
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    const copyButtons = screen.getAllByRole('button', { name: /clone transaction/i });
    fireEvent.click(copyButtons[0]);

    expect(await screen.findByRole('heading', { name: /clone/i })).toBeInTheDocument();
  });

  it('opens ConfirmDialog when delete icon is clicked', async () => {
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete transaction/i });
    fireEvent.click(deleteButtons[0]);

    expect(await screen.findByText(/are you sure you want to delete this transaction\?/i)).toBeInTheDocument();
  });

  it('deletes the transaction when confirmed', async () => {
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    // Prepare mock to return only the second transaction after deletion
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue([mockTransactions[1]]);

    const deleteButtons = screen.getAllByRole('button', { name: /delete transaction/i });
    fireEvent.click(deleteButtons[0]);

    const confirmButton = await screen.findByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(dbService.deleteTransaction).toHaveBeenCalledWith('tx-1');
      expect(screen.queryByText('Transaction 1')).not.toBeInTheDocument();
    });
  });

  it('displays transactions in ascending order of dueDate', async () => {
    const unsortedTransactions: Transaction[] = [
      {
        id: 'tx-2',
        accountId: 'account-1',
        label: 'Transaction 2',
        description: 'Desc 2',
        amount: 20,
        dueDate: '2026-06-02',
      },
      {
        id: 'tx-1',
        accountId: 'account-1',
        label: 'Transaction 1',
        description: 'Desc 1',
        amount: 10,
        dueDate: '2026-06-01',
      },
      {
        id: 'tx-3',
        accountId: 'account-1',
        label: 'Transaction 3',
        description: 'Desc 3',
        amount: 30,
        dueDate: '2026-05-28',
      },
    ];

    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue(unsortedTransactions);
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 3')).toBeInTheDocument();
    });

    // Find all rows that contain transaction labels
    const transactionRows = screen.getAllByRole('row').filter(row =>
      row.textContent?.includes('Transaction ')
    );

    expect(transactionRows.length).toBe(3);
    expect(transactionRows[0]).toHaveTextContent('Transaction 3');
    expect(transactionRows[1]).toHaveTextContent('Transaction 1');
    expect(transactionRows[2]).toHaveTextContent('Transaction 2');
  });

  it('applies the monthly view filter by default', async () => {
    const transactionsWithOld: Transaction[] = [
      {
        id: 'tx-new',
        accountId: 'account-1',
        label: 'New Transaction',
        description: 'New',
        amount: 10,
        dueDate: '2026-06-01',
      },
      {
        id: 'tx-old',
        accountId: 'account-1',
        label: 'Old Transaction',
        description: 'Old',
        amount: 10,
        dueDate: '2026-01-01',
      },
    ];
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue(transactionsWithOld);
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('New Transaction')).toBeInTheDocument();
    });
    expect(screen.queryByText('Old Transaction')).not.toBeInTheDocument();
  });

  it('opens the filter dialog when filter button is clicked', async () => {
    renderWithProviders(<TransactionEditionArea />);

    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);

    expect(await screen.findByRole('heading', { name: /filter/i })).toBeInTheDocument();
  });

  it('shows export dialog when download button is clicked', async () => {
    renderWithProviders(<TransactionEditionArea />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    expect(await screen.findByRole('heading', { name: /export/i })).toBeInTheDocument();
  });

  it('shows import dialog when upload button is clicked', async () => {
    renderWithProviders(<TransactionEditionArea />);

    const importButton = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importButton);

    expect(await screen.findByRole('heading', { name: /import/i })).toBeInTheDocument();
  });

  it('renders export dialog with export button when download icon is clicked', async () => {
    renderWithProviders(<TransactionEditionArea />);

    const exportIconButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportIconButton);

    expect(await screen.findByRole('heading', { name: /Export/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export$/i })).toBeInTheDocument();
  });

  it('toggles filter when checkbox is clicked in filter dialog', async () => {
    renderWithProviders(<TransactionEditionArea />);

    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);

    const checkboxes = await screen.findAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();

    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
  });

  it('shows import dialog with file input when upload icon is clicked', async () => {
    renderWithProviders(<TransactionEditionArea />);

    const importIconButton = screen.getByRole('button', { name: /import/i });
    fireEvent.click(importIconButton);

    expect(await screen.findByRole('heading', { name: /Import/i })).toBeInTheDocument();
    expect(screen.getByText(/Select a CSV or JSON file to import/i)).toBeInTheDocument();
  });

  it('shows "no transactions" message when account has no transactions', async () => {
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue([]);
    renderWithProviders(<TransactionEditionArea />);

    expect(await screen.findByText(/no transactions/i)).toBeInTheDocument();
  });

  it('renders indicator column with vertical line for today transactions', async () => {
    const today = dayjs().format('YYYY-MM-DD');
    const transactionsWithToday: Transaction[] = [
      {
        id: 'tx-today',
        accountId: 'account-1',
        label: 'Today Transaction',
        description: 'Today',
        amount: 10,
        dueDate: today,
      },
      {
        id: 'tx-other',
        accountId: 'account-1',
        label: 'Other Transaction',
        description: 'Other',
        amount: 20,
        dueDate: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
      },
    ];
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue(transactionsWithToday);
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Today Transaction')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    const indicatorCells = table.querySelectorAll('.indicator-cell');
    expect(indicatorCells.length).toBe(2);

    const todayRow = Array.from(rows).find(row => row.textContent?.includes('Today Transaction'));
    const otherRow = Array.from(rows).find(row => row.textContent?.includes('Other Transaction'));

    const todayCells = todayRow?.querySelectorAll('td');
    const otherCells = otherRow?.querySelectorAll('td');

    expect(todayCells?.length).toBe(7);
    expect(otherCells?.length).toBe(7);
  });

  it('displays search by label textfield in toolbar', async () => {
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/search by label/i)).toBeInTheDocument();
  });

  it('filters transactions by label when typing in search field', async () => {
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by label/i);
    fireEvent.change(searchInput, { target: { value: 'Transaction 1' } });

    expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    expect(screen.queryByText('Transaction 2')).not.toBeInTheDocument();
  });

  it('shows all transactions when search field is cleared', async () => {
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by label/i);
    fireEvent.change(searchInput, { target: { value: 'Transaction 1' } });

    expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    expect(screen.queryByText('Transaction 2')).not.toBeInTheDocument();

    const clearButton = await screen.findByTestId('clear-search');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
      expect(screen.getByText('Transaction 2')).toBeInTheDocument();
    });
  });

  it('performs case-insensitive label search', async () => {
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by label/i);
    fireEvent.change(searchInput, { target: { value: 'transaction 1' } });

    expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    expect(screen.queryByText('Transaction 2')).not.toBeInTheDocument();
  });

  it('shows no transactions when search matches nothing', async () => {
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by label/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/no transactions/i)).toBeInTheDocument();
    });
  });

  it('renders checkbox for each transaction', async () => {
    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
    const tx1Checkbox = screen.getByTestId('checkbox-tx-1');
    const tx2Checkbox = screen.getByTestId('checkbox-tx-2');
    expect(selectAllCheckbox).toBeInTheDocument();
    expect(tx1Checkbox).toBeInTheDocument();
    expect(tx2Checkbox).toBeInTheDocument();
  });

  it('sets indeterminate state on select-all when some transactions are selected', async () => {
    const mockSetSelectedTransactions = vi.fn();
    vi.mocked(useAccount).mockReturnValue({
      selectedAccount: mockAccount,
      selectedDate: dayjs(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      setSelectedAccount: vi.fn(),
      isInitializing: false,
      selectedTransactions: [mockTransactions[0]],
      setSelectedTransactions: mockSetSelectedTransactions,
    });
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue(mockTransactions);

    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    const selectAllWrapper = document.querySelector('[data-testid="select-all-checkbox"]') as HTMLElement;
    const input = selectAllWrapper.querySelector('input');
    expect(input).toHaveAttribute('data-indeterminate', 'true');
  });

  it('does not set indeterminate when no transactions are selected', async () => {
    const mockSetSelectedTransactions = vi.fn();
    vi.mocked(useAccount).mockReturnValue({
      selectedAccount: mockAccount,
      selectedDate: dayjs(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      setSelectedAccount: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: mockSetSelectedTransactions,
    });
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue(mockTransactions);

    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    const selectAllWrapper = document.querySelector('[data-testid="select-all-checkbox"]') as HTMLElement;
    const input = selectAllWrapper.querySelector('input');
    expect(input).not.toHaveAttribute('data-indeterminate', 'true');
  });

  it('does not set indeterminate when all transactions are selected', async () => {
    const mockSetSelectedTransactions = vi.fn();
    vi.mocked(useAccount).mockReturnValue({
      selectedAccount: mockAccount,
      selectedDate: dayjs(),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      setSelectedAccount: vi.fn(),
      isInitializing: false,
      selectedTransactions: mockTransactions,
      setSelectedTransactions: mockSetSelectedTransactions,
    });
    vi.mocked(dbService.getTransactionsByAccountId).mockResolvedValue(mockTransactions);

    renderWithProviders(<TransactionEditionArea />);

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    const selectAllWrapper = document.querySelector('[data-testid="select-all-checkbox"]') as HTMLElement;
    const input = selectAllWrapper.querySelector('input');
    expect(input).not.toHaveAttribute('data-indeterminate', 'true');
  });
});
