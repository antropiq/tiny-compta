import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ImportTransactionDialog from './ImportTransactionDialog';
import { useAccount } from '../hooks/useAccount';
import { dbService } from '../services/db';
import dayjs from 'dayjs';
import type { AccountContextType } from '../contexts/AccountContext';

vi.mock('../hooks/useAccount', () => ({
  useAccount: vi.fn(),
}));

vi.mock('../services/db', () => ({
  dbService: {
    addTransaction: vi.fn(),
  },
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

describe('ImportTransactionDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnImportSuccess = vi.fn();
  const mockOnError = vi.fn();

  const mockAccount = { id: 'acc1', label: 'Test Account' };

  beforeEach(() => {
    vi.clearAllMocks();
    i18n.changeLanguage('en');
    vi.mocked(useAccount).mockReturnValue({
      selectedAccount: mockAccount,
      selectedDate: dayjs('2023-02-01'),
      setSelectedDate: vi.fn(),
      setTransactionsVersion: vi.fn(),
    } as unknown as AccountContextType);
  });

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    onImportSuccess: mockOnImportSuccess,
    onError: mockOnError,
  };

  const getComponentFileInput = () => {
    return document.querySelector('label.MuiButton-outlined input[type="file"]') as HTMLInputElement;
  };

  it('renders correctly', () => {
    renderWithProviders(<ImportTransactionDialog {...defaultProps} />);
    expect(screen.getByText('Import Transactions')).toBeDefined();
    expect(screen.getByText('Select a CSV or JSON file to import')).toBeDefined();
  });

  it('does not render when dialog is closed', () => {
    renderWithProviders(<ImportTransactionDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Import Transactions')).toBeNull();
  });

  it('calls onClose when cancel button is clicked', () => {
    renderWithProviders(<ImportTransactionDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  describe('JSON import', () => {
    it('imports valid JSON transactions successfully', async () => {
      const jsonContent = JSON.stringify({
        transactions: [
          { label: 'Transaction 1', amount: 100, dueDate: '2023-01-01' },
          { label: 'Transaction 2', amount: -50, dueDate: '2023-02-01' },
        ],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      vi.mocked(dbService.addTransaction).mockResolvedValue(undefined);

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(mockOnImportSuccess).toHaveBeenCalledWith(2, 'Test Account');
      });

      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('rejects JSON with invalid structure', async () => {
      const jsonContent = JSON.stringify({ data: [] });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Json content does not follow the good structure');
      });

      expect(mockOnImportSuccess).not.toHaveBeenCalled();
    });

    it('rejects JSON with missing transactions array', async () => {
      const jsonContent = JSON.stringify({ transactions: 'not-an-array' });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Json content does not follow the good structure');
      });
    });

    it('rejects JSON with invalid transaction data (missing label)', async () => {
      const jsonContent = JSON.stringify({
        transactions: [{ amount: 100, dueDate: '2023-01-01' }],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Invalid data in one or more transactions. Import aborted.');
      });
    });

    it('rejects JSON with invalid amount', async () => {
      const jsonContent = JSON.stringify({
        transactions: [{ label: 'Test', amount: 'not-a-number', dueDate: '2023-01-01' }],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Invalid data in one or more transactions. Import aborted.');
      });
    });

    it('rejects JSON with invalid date', async () => {
      const jsonContent = JSON.stringify({
        transactions: [{ label: 'Test', amount: 100, dueDate: 'not-a-date' }],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Invalid data in one or more transactions. Import aborted.');
      });
    });

    it('rejects JSON with empty label', async () => {
      const jsonContent = JSON.stringify({
        transactions: [{ label: '', amount: 100, dueDate: '2023-01-01' }],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Invalid data in one or more transactions. Import aborted.');
      });
    });

    it('rejects JSON with whitespace-only label', async () => {
      const jsonContent = JSON.stringify({
        transactions: [{ label: '   ', amount: 100, dueDate: '2023-01-01' }],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Invalid data in one or more transactions. Import aborted.');
      });
    });

    it('passes through description when provided', async () => {
      const jsonContent = JSON.stringify({
        transactions: [
          { label: 'Test', amount: 100, dueDate: '2023-01-01', description: 'My description' },
        ],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            label: 'Test',
            amount: 100,
            description: 'My description',
          })
        );
      });
    });

    it('defaults description to empty string when not provided', async () => {
      const jsonContent = JSON.stringify({
        transactions: [
          { label: 'Test', amount: 100, dueDate: '2023-01-01' },
        ],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            description: '',
          })
        );
      });
    });

    it('assigns selectedAccountId to imported transactions', async () => {
      const jsonContent = JSON.stringify({
        transactions: [
          { label: 'Test', amount: 100, dueDate: '2023-01-01' },
        ],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            accountId: 'acc1',
          })
        );
      });
    });

    it('generates a UUID for each imported transaction', async () => {
      const jsonContent = JSON.stringify({
        transactions: [
          { label: 'Test', amount: 100, dueDate: '2023-01-01' },
        ],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
          })
        );
      });
    });

    it('closes dialog after successful import', async () => {
      const jsonContent = JSON.stringify({
        transactions: [
          { label: 'Test', amount: 100, dueDate: '2023-01-01' },
        ],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('handles empty transactions array gracefully', async () => {
      const jsonContent = JSON.stringify({
        transactions: [],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      expect(mockOnImportSuccess).not.toHaveBeenCalled();
    });
  });

  describe('CSV import', () => {
    it('imports valid CSV transactions with semicolon separator', async () => {
      const csvContent = 'Label;Amount;DueDate\nTransaction 1;100;2023-01-01\nTransaction 2;-50;2023-02-01';
      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(mockOnImportSuccess).toHaveBeenCalledWith(2, 'Test Account');
      });
    });

    it('imports valid CSV transactions with comma separator', async () => {
      const csvContent = 'Label,Amount,DueDate\nTransaction 1,100,2023-01-01\nTransaction 2,-50,2023-02-01';
      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledTimes(2);
      });
    });

    it('handles CSV with quoted values', async () => {
      const csvContent = 'Label;Amount;DueDate\n"Transaction, with comma";100;2023-01-01';
      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            label: 'Transaction, with comma',
            amount: 100,
          })
        );
      });
    });

    it('imports CSV with French headers', async () => {
      const csvContent = 'Libellé;Montant;Date\ntest;100;2023-01-01';
      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            label: 'test',
            amount: 100,
          })
        );
      });
    });

    it('closes dialog when CSV has only header line', async () => {
      const csvContent = 'Label;Amount;DueDate';
      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      expect(mockOnImportSuccess).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('skips empty lines in CSV', async () => {
      const csvContent = 'Label;Amount;DueDate\n\nTransaction 1;100;2023-01-01\n\n';
      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledTimes(1);
      });
    });

    it('handles CSV with description column', async () => {
      const csvContent = 'Label;Amount;Description;DueDate\nTest;100;My desc;2023-01-01';
      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            label: 'Test',
            description: 'My desc',
          })
        );
      });
    });

    it('handles CSV with lowercase headers', async () => {
      const csvContent = 'label;amount;duedate\nTest;100;2023-01-01';
      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            label: 'Test',
            amount: 100,
          })
        );
      });
    });
  });

  describe('unsupported file types', () => {
    it('rejects .txt files', async () => {
      const file = new File(['some content'], 'transactions.txt', { type: 'text/plain' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Json content does not follow the good structure');
      });
    });

    it('rejects .xlsx files', async () => {
      const file = new File(['some content'], 'transactions.xlsx', { type: 'application/xlsx' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Json content does not follow the good structure');
      });
    });
  });

  describe('account context', () => {
    it('works with no selected account (uses empty string)', async () => {
      vi.mocked(useAccount).mockReturnValue({
        selectedAccount: null,
        selectedDate: dayjs('2023-02-01'),
        setSelectedDate: vi.fn(),
        setTransactionsVersion: vi.fn(),
      } as unknown as AccountContextType);

      const jsonContent = JSON.stringify({
        transactions: [
          { label: 'Test', amount: 100, dueDate: '2023-01-01' },
        ],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            accountId: '',
          })
        );
      });
    });

    it('does not call onImportSuccess when no selected account', async () => {
      vi.mocked(useAccount).mockReturnValue({
        selectedAccount: null,
        selectedDate: dayjs('2023-02-01'),
        setSelectedDate: vi.fn(),
        setTransactionsVersion: vi.fn(),
      } as unknown as AccountContextType);

      const jsonContent = JSON.stringify({
        transactions: [
          { label: 'Test', amount: 100, dueDate: '2023-01-01' },
        ],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      expect(mockOnImportSuccess).not.toHaveBeenCalled();
    });
  });

  describe('button state', () => {
    it('shows loading state after file selection', async () => {
      const jsonContent = JSON.stringify({
        transactions: [
          { label: 'Test', amount: 100, dueDate: '2023-01-01' },
        ],
      });
      const file = new File([jsonContent], 'transactions.json', { type: 'application/json' });

      renderWithProviders(<ImportTransactionDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const label = document.querySelector('label.MuiButton-outlined');
        expect(label).toHaveAttribute('aria-disabled', 'true');
      });
    });
  });
});
