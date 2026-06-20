import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ExportRecurringDialog from './ExportRecurringDialog';
import { useAccount } from '../hooks/useAccount';
import type { Recurring } from '../types/recurring';
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

describe('ExportRecurringDialog', () => {
  const mockRecurrings: Recurring[] = [
    { id: '1', accountId: 'acc1', label: 'R1', amount: -100, dayOfMonth: 5, startDate: '2023-01-01', description: 'Desc1' },
    { id: '2', accountId: 'acc1', label: 'R2', amount: -200, dayOfMonth: 10, startDate: '2023-02-01', endDate: '2024-02-01', description: 'Desc2' },
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
    } as unknown as AccountContextType);
  });

  it('renders correctly', () => {
    renderWithProviders(
      <ExportRecurringDialog
        open={true}
        onClose={mockOnClose}
        recurrings={mockRecurrings}
        onExport={mockOnExport}
      />
    );
    expect(screen.getByText(/Export Recurring Payments/i)).toBeDefined();
  });

  it('exports JSON correctly', async () => {
    renderWithProviders(
      <ExportRecurringDialog
        open={true}
        onClose={mockOnClose}
        recurrings={mockRecurrings}
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);

    expect(mockOnExport).toHaveBeenCalledWith(
      expect.stringContaining('"recurrings": ['),
      expect.stringContaining('.json'),
      'json'
    );
  });

  it('exports CSV correctly', async () => {
    renderWithProviders(
      <ExportRecurringDialog
        open={true}
        onClose={mockOnClose}
        recurrings={mockRecurrings}
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
      expect.stringContaining('"label";"amount";"description";"dayOfMonth";"startDate";"endDate"'),
      expect.stringContaining('.csv'),
      'csv'
    );
  });
});
