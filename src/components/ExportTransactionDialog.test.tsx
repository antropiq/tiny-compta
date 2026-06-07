import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ExportTransactionDialog from './ExportTransactionDialog';
import { useAccount } from '../hooks/useAccount';
import type { Transaction } from '../types/transaction';
import dayjs from 'dayjs';
import type { AccountContextType } from '../contexts/AccountContext';

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

describe('ExportTransactionDialog', () => {
  const mockTransactions: Transaction[] = [
    { id: '1', accountId: 'acc1', label: 'T1', amount: 10, dueDate: '2023-01-01', description: 'D1' },
    { id: '2', accountId: 'acc1', label: 'T2', amount: 20, dueDate: '2023-02-01', description: 'D2' },
    { id: '3', accountId: 'acc1', label: 'T3', amount: 30, dueDate: '2023-03-01', description: 'D3' },
  ];

  const mockOnExport = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    i18n.changeLanguage('en');
    vi.mocked(useAccount).mockReturnValue({
      selectedAccount: { id: 'acc1', label: 'Test Account' },
      setSelectedAccount: vi.fn(),
      selectedDate: dayjs('2023-02-01'),
      setSelectedDate: vi.fn(),
      transactionsVersion: 0,
      setTransactionsVersion: vi.fn(),
      isInitializing: false,
      selectedTransactions: [],
      setSelectedTransactions: vi.fn(),
    } as AccountContextType);
  });

  it('renders correctly', () => {
    renderWithProviders(
      <ExportTransactionDialog
        open={true}
        onClose={mockOnClose}
        transactions={mockTransactions}
        onExport={mockOnExport}
      />
    );
    expect(screen.getByText(/Export Transactions/i)).toBeDefined();
  });

  it('exports JSON correctly', async () => {
    renderWithProviders(
      <ExportTransactionDialog
        open={true}
        onClose={mockOnClose}
        transactions={mockTransactions}
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);

    expect(mockOnExport).toHaveBeenCalledWith(
      expect.stringContaining('"transactions": ['),
      expect.stringContaining('.json'),
      'json'
    );
  });

  it('exports CSV correctly', async () => {
    renderWithProviders(
      <ExportTransactionDialog
        open={true}
        onClose={mockOnClose}
        transactions={mockTransactions}
        onExport={mockOnExport}
      />
    );

    // Change format to CSV
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    const option = await screen.findByText(/Export to CSV/i);
    fireEvent.click(option);

    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);

    expect(mockOnExport).toHaveBeenCalledWith(
      expect.stringContaining('"label";"amount";"description";"dueDate"'),
      expect.stringContaining('.csv'),
      'csv'
    );
  });
});
