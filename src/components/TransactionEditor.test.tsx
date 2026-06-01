import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransactionEditor from './TransactionEditor';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import type { Transaction } from '../types/transaction';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

vi.mock('../utils/uuidUtils', () => ({
  UuidUtils: {
    generate: vi.fn(() => 'mocked-uuid'),
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

describe('TransactionEditor', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const accountId = 'account-123';

  const mockTransaction: Transaction = {
    id: 'tx-1',
    accountId: 'account-123',
    label: 'Test Label',
    description: 'Test Description',
    amount: 100.5,
    dueDate: '2026-05-31',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
  });

  it('renders in create mode with empty fields', () => {
    renderWithProviders(
      <TransactionEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        accountId={accountId}
      />
    );

    expect(screen.getByText(/create/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/label/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/amount/i)).toHaveValue('0');
  });

  it('renders in edit mode with transaction data', () => {
    renderWithProviders(
      <TransactionEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="edit"
        transaction={mockTransaction}
        accountId={accountId}
      />
    );

    expect(screen.getByText(/edit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/label/i)).toHaveValue('Test Label');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Test Description');
    expect(screen.getByLabelText(/amount/i)).toHaveValue('100.5');
  });

  it('renders in clone mode with transaction data', () => {
    renderWithProviders(
      <TransactionEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="clone"
        transaction={mockTransaction}
        accountId={accountId}
      />
    );

    expect(screen.getByText(/clone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/label/i)).toHaveValue('Test Label');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Test Description');
    expect(screen.getByLabelText(/amount/i)).toHaveValue('100.5');
  });

  it('calls onClose when cancel button is clicked', () => {
    renderWithProviders(
      <TransactionEditor
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

  it('calls onSave with correct data when save button is clicked in create mode', async () => {
    renderWithProviders(
      <TransactionEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="create"
        accountId={accountId}
      />
    );

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: 'New Label' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'New Description' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '250' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        id: 'mocked-uuid',
        accountId: accountId,
        label: 'New Label',
        description: 'New Description',
        amount: 250,
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onSave with correct data when save button is clicked in edit mode', async () => {
    renderWithProviders(
      <TransactionEditor
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        mode="edit"
        transaction={mockTransaction}
        accountId={accountId}
      />
    );

    fireEvent.change(screen.getByLabelText(/label/i), { target: { value: 'Updated Label' } });
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '150' } });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        id: 'tx-1',
        accountId: 'account-123',
        label: 'Updated Label',
        amount: 150,
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
