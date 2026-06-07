import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransactionCloningDialog from './TransactionCloningDialog';
import { I18nextProvider } from 'react-i18next';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import i18n from '../i18n';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </LocalizationProvider>
  );
};

const mockSourceTransaction = {
  id: 'test-id',
  accountId: 'account-id',
  label: 'Test Transaction',
  description: 'Test Description',
  amount: 100,
  dueDate: '2026-06-20',
};

describe('TransactionCloningDialog', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders the dialog title', () => {
    renderWithProviders(
      <TransactionCloningDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        sourceTransaction={mockSourceTransaction}
      />
    );
    expect(screen.getByText(/clone transaction/i)).toBeInTheDocument();
  });

  it('renders the year picker', () => {
    renderWithProviders(
      <TransactionCloningDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        sourceTransaction={mockSourceTransaction}
      />
    );
    const labels = screen.getAllByText(/target year/i);
    expect(labels.length).toBeGreaterThan(0);
  });

  it('renders the month dropdown', () => {
    renderWithProviders(
      <TransactionCloningDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        sourceTransaction={mockSourceTransaction}
      />
    );
    const labels = screen.getAllByText(/target month/i);
    expect(labels.length).toBeGreaterThan(0);
  });

  it('renders the frequency dropdown (disabled)', () => {
    renderWithProviders(
      <TransactionCloningDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        sourceTransaction={mockSourceTransaction}
      />
    );
    const labels = screen.getAllByText(/frequency/i);
    expect(labels.length).toBeGreaterThan(0);
  });

  it('renders cancel and confirm buttons', () => {
    renderWithProviders(
      <TransactionCloningDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        sourceTransaction={mockSourceTransaction}
      />
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clone/i })).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <TransactionCloningDialog
        open={true}
        onClose={onClose}
        onConfirm={() => {}}
        sourceTransaction={mockSourceTransaction}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm with target date when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(
      <TransactionCloningDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        sourceTransaction={mockSourceTransaction}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /clone/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is not visible when open is false', () => {
    renderWithProviders(
      <TransactionCloningDialog
        open={false}
        onClose={() => {}}
        onConfirm={() => {}}
        sourceTransaction={mockSourceTransaction}
      />
    );
    expect(screen.queryByText(/clone transaction/i)).not.toBeInTheDocument();
  });
});
