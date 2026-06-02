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
      dueDate: '2026-01-01',
    },
    {
      id: 'tx-2',
      accountId: 'account-1',
      label: 'Transaction 2',
      description: 'Desc 2',
      amount: 20,
      dueDate: '2026-01-02',
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
      setSelectedAccount: function (): void | Promise<void> {
        throw new Error('Function not implemented.');
      },
      isInitializing: false
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
      setSelectedAccount: function (): void | Promise<void> {
        throw new Error('Function not implemented.');
      },
      isInitializing: false
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
    expect(screen.getByText('10.00')).toBeInTheDocument();
    expect(screen.getByText('20.00')).toBeInTheDocument();
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
        dueDate: '2026-01-02',
      },
      {
        id: 'tx-1',
        accountId: 'account-1',
        label: 'Transaction 1',
        description: 'Desc 1',
        amount: 10,
        dueDate: '2026-01-01',
      },
      {
        id: 'tx-3',
        accountId: 'account-1',
        label: 'Transaction 3',
        description: 'Desc 3',
        amount: 30,
        dueDate: '2025-12-31',
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
});
