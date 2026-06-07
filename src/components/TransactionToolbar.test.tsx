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
});
