import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransactionToolbar from './TransactionToolbar';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
};

describe('TransactionToolbar', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders the add button', () => {
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} />);
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('renders the filter button', () => {
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} onFilterClick={() => {}} />);
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
  });

  it('renders the remove selected button', () => {
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} hasSelectedTransactions onRemoveSelected={() => {}} />);
    expect(screen.getByRole('button', { name: /remove selected/i })).toBeInTheDocument();
  });

  it('disables the remove selected button when no transactions are selected', () => {
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} hasSelectedTransactions={false} onRemoveSelected={() => {}} />);
    expect(screen.getByRole('button', { name: /remove selected/i })).toBeDisabled();
  });

  it('enables the remove selected button when transactions are selected', () => {
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} hasSelectedTransactions onRemoveSelected={() => {}} />);
    expect(screen.getByRole('button', { name: /remove selected/i })).toBeEnabled();
  });

  it('calls onRemoveSelected when the remove selected button is clicked', () => {
    const onRemoveSelected = vi.fn();
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} hasSelectedTransactions onRemoveSelected={onRemoveSelected} />);
    fireEvent.click(screen.getByRole('button', { name: /remove selected/i }));
    expect(onRemoveSelected).toHaveBeenCalledTimes(1);
  });

  it('calls onAddTransaction when the add button is clicked', () => {
    const onAddTransaction = vi.fn();
    renderWithI18n(<TransactionToolbar onAddTransaction={onAddTransaction} />);
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(onAddTransaction).toHaveBeenCalledTimes(1);
  });

  it('calls onFilterClick when the filter button is clicked', () => {
    const onFilterClick = vi.fn();
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} onFilterClick={onFilterClick} />);
    fireEvent.click(screen.getByRole('button', { name: /filter/i }));
    expect(onFilterClick).toHaveBeenCalledTimes(1);
  });

  it('disables the add button when disabled prop is true', () => {
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} disabled />);
    expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
  });

  it('renders the search input', () => {
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} />);
    expect(screen.getByPlaceholderText(/search by label/i)).toBeInTheDocument();
  });

  it('renders the clone button', () => {
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} />);
    expect(screen.getByRole('button', { name: /clone selected/i })).toBeInTheDocument();
  });

  it('disables the clone button when no transactions are selected', () => {
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} selectedTransactionsCount={0} />);
    expect(screen.getByRole('button', { name: /clone selected/i })).toBeDisabled();
  });

  it('disables the clone button when more than one transaction is selected', () => {
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} selectedTransactionsCount={2} />);
    expect(screen.getByRole('button', { name: /clone selected/i })).toBeDisabled();
  });

  it('enables the clone button when exactly one transaction is selected', () => {
    renderWithI18n(<TransactionToolbar onAddTransaction={() => {}} selectedTransactionsCount={1} />);
    expect(screen.getByRole('button', { name: /clone selected/i })).toBeEnabled();
  });

  it('calls onCloneSelected with the first selected transaction when clicked', () => {
    const onCloneSelected = vi.fn();
    const testTransaction = {
      id: 'test-id',
      accountId: 'account-id',
      label: 'Test',
      amount: 100,
      dueDate: '2026-01-01',
    };
    renderWithI18n(
      <TransactionToolbar
        onAddTransaction={() => {}}
        selectedTransactionsCount={1}
        selectedTransactions={[testTransaction]}
        onCloneSelected={onCloneSelected}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /clone selected/i }));
    expect(onCloneSelected).toHaveBeenCalledWith(testTransaction);
  });
});
