import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ImportRecurringDialog from './ImportRecurringDialog';
import { useAccount } from '../hooks/useAccount';
import { dbService } from '../services/db';
import dayjs from 'dayjs';
import type { AccountContextType } from '../contexts/AccountContext';

vi.mock('../hooks/useAccount', () => ({
  useAccount: vi.fn(),
}));

vi.mock('../services/db', () => ({
  dbService: {
    addRecurring: vi.fn(),
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

describe('ImportRecurringDialog', () => {
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
    renderWithProviders(<ImportRecurringDialog {...defaultProps} />);
    expect(screen.getByText('Import Recurring Payments')).toBeDefined();
    expect(screen.getByText('Select a CSV or JSON file to import')).toBeDefined();
  });

  it('does not render when dialog is closed', () => {
    renderWithProviders(<ImportRecurringDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Import Recurring Payments')).toBeNull();
  });

  it('calls onClose when cancel button is clicked', () => {
    renderWithProviders(<ImportRecurringDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  describe('JSON import', () => {
    it('imports valid JSON recurrings successfully', async () => {
      const jsonContent = JSON.stringify({
        recurrings: [
          { label: 'Recurring 1', amount: -150, dayOfMonth: 5, startDate: '2023-01-01' },
          { label: 'Recurring 2', amount: -200, dayOfMonth: 12, startDate: '2023-02-01', endDate: '2023-12-31' },
        ],
      });
      const file = new File([jsonContent], 'recurrings.json', { type: 'application/json' });

      vi.mocked(dbService.addRecurring).mockResolvedValue(undefined);

      renderWithProviders(<ImportRecurringDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(dbService.addRecurring).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(mockOnImportSuccess).toHaveBeenCalledWith(2, 'Test Account');
      });

      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('rejects JSON with invalid structure', async () => {
      const jsonContent = JSON.stringify({ data: [] });
      const file = new File([jsonContent], 'recurrings.json', { type: 'application/json' });

      renderWithProviders(<ImportRecurringDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Json content does not follow the good structure for recurring payments');
      });

      expect(mockOnImportSuccess).not.toHaveBeenCalled();
    });

    it('rejects JSON with invalid dayOfMonth', async () => {
      const jsonContent = JSON.stringify({
        recurrings: [{ label: 'R1', amount: -100, dayOfMonth: 32, startDate: '2023-01-01' }],
      });
      const file = new File([jsonContent], 'recurrings.json', { type: 'application/json' });

      renderWithProviders(<ImportRecurringDialog {...defaultProps} />);

      const fileInput = getComponentFileInput();
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Invalid data in one or more recurring payments. Import aborted.');
      });
    });
  });
});
