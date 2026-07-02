import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecurringEditor from './RecurringEditor';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Recurring } from '../types/recurring';

vi.mock('../utils/uuidUtils', () => ({
  UuidUtils: {
    generate: vi.fn(() => 'mocked-uuid-rec'),
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

describe('RecurringEditor', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const accountId = 'account-456';

  const mockRecurring: Recurring = {
    id: 'rec-1',
    accountId: 'account-456',
    label: 'Monthly Rent',
    description: 'Apartment rent',
    amount: 800,
    dayOfMonth: 1,
    startDate: '2025-01-01',
    endDate: '2026-12-31',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
  });

  it('renders in create mode with empty/default fields', () => {
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        accountId={accountId}
      />
    );

    expect(screen.getByText(/add recurring payment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/label/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/amount/i)).toHaveValue('0');
    expect(screen.getByLabelText(/day of month/i)).toHaveValue(1);
  });

  it('renders in edit mode with recurring data', () => {
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="edit"
        recurring={mockRecurring}
        accountId={accountId}
      />
    );

    expect(screen.getByText(/edit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/label/i)).toHaveValue('Monthly Rent');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Apartment rent');
    expect(screen.getByLabelText(/amount/i)).toHaveValue('800');
    expect(screen.getByLabelText(/day of month/i)).toHaveValue(1);
  });

  it('renders in edit mode without optional endDate', () => {
    const recurringNoEnd: Recurring = {
      ...mockRecurring,
      id: 'rec-2',
      endDate: undefined,
    };
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="edit"
        recurring={recurringNoEnd}
        accountId={accountId}
      />
    );

    expect(screen.getByLabelText(/label/i)).toHaveValue('Monthly Rent');
  });

  it('calls onClose when cancel button is clicked', () => {
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        accountId={accountId}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onSave with correct data in create mode', async () => {
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        accountId={accountId}
      />
    );

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: 'New Subscription' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Gym membership' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '49.99' } });
    fireEvent.change(screen.getByLabelText(/day of month/i), { target: { value: '15' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        id: 'mocked-uuid-rec',
        accountId,
        label: 'New Subscription',
        description: 'Gym membership',
        amount: 49.99,
        dayOfMonth: 15,
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onSave with correct data in edit mode preserving id and accountId', async () => {
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="edit"
        recurring={mockRecurring}
        accountId={accountId}
      />
    );

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: 'Updated Rent' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        id: 'rec-1',
        accountId: 'account-456',
        label: 'Updated Rent',
        amount: 800,
        dayOfMonth: 1,
      }));
    });
  });

  it('clamps dayOfMonth to 31 when value exceeds 31', async () => {
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        accountId={accountId}
      />
    );

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/day of month/i), { target: { value: '45' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        dayOfMonth: 31,
      }));
    });
  });

  it('clamps dayOfMonth to 1 when value is less than 1', async () => {
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        accountId={accountId}
      />
    );

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/day of month/i), { target: { value: '0' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        dayOfMonth: 1,
      }));
    });
  });

  it('handles comma as decimal separator in amount', async () => {
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        accountId={accountId}
      />
    );

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '10,5' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        amount: 10.5,
      }));
    });
  });

  it('handles empty/invalid amount as zero', async () => {
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        accountId={accountId}
      />
    );

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: 'xyz' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        amount: 0,
      }));
    });
  });

  it('handles negative amount', async () => {
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        accountId={accountId}
      />
    );

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '-50' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        amount: -50,
      }));
    });
  });

  it('saves endDate when provided in edit mode', async () => {
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="edit"
        recurring={mockRecurring}
        accountId={accountId}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        endDate: '2026-12-31',
      }));
    });
  });

  it('disables save button when label is empty', () => {
    renderWithProviders(
      <RecurringEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        accountId={accountId}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });
});
