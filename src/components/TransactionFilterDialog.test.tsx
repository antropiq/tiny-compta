import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import TransactionFilterDialog from './TransactionFilterDialog';
import type { Filterable } from '../types/filter';

const mockOnClose = vi.fn();
const mockOnFilterChange = vi.fn();

const renderWithI18n = (ui: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {ui}
    </I18nextProvider>
  );
};

describe('TransactionFilterDialog', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
  });

  const createMockFilter = (label: string, active: boolean): Filterable => ({
    label,
    active,
    setup: vi.fn(),
    apply: vi.fn((list) => list),
  });

  it('renders with correct title', () => {
    const filters = [createMockFilter('transaction.monthly_view', true)];
    renderWithI18n(
      <TransactionFilterDialog
        open={true}
        onClose={mockOnClose}
        filters={filters}
        onFilterChange={mockOnFilterChange}
      />
    );
    expect(screen.getByText(/Filter/i)).toBeInTheDocument();
  });

  it('renders all filters as checkboxes', () => {
    const filters = [
      createMockFilter('transaction.monthly_view', true),
      createMockFilter('transaction.other_filter', false),
    ];
    renderWithI18n(
      <TransactionFilterDialog
        open={true}
        onClose={mockOnClose}
        filters={filters}
        onFilterChange={mockOnFilterChange}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('shows checked state matching filter.active', () => {
    const filters = [
      createMockFilter('transaction.monthly_view', true),
      createMockFilter('transaction.other_filter', false),
    ];
    renderWithI18n(
      <TransactionFilterDialog
        open={true}
        onClose={mockOnClose}
        filters={filters}
        onFilterChange={mockOnFilterChange}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('calls onClose when close button is clicked', () => {
    const filters = [createMockFilter('transaction.monthly_view', true)];
    renderWithI18n(
      <TransactionFilterDialog
        open={true}
        onClose={mockOnClose}
        filters={filters}
        onFilterChange={mockOnFilterChange}
      />
    );
    fireEvent.click(screen.getByText('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('toggles filter active state and calls onFilterChange when checkbox is clicked', () => {
    const filter = createMockFilter('transaction.monthly_view', true);
    renderWithI18n(
      <TransactionFilterDialog
        open={true}
        onClose={mockOnClose}
        filters={[filter]}
        onFilterChange={mockOnFilterChange}
      />
    );
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(filter.active).toBe(false);
    expect(mockOnFilterChange).toHaveBeenCalledWith(filter);
  });

  it('toggles filter from inactive to active', () => {
    const filter = createMockFilter('transaction.monthly_view', false);
    renderWithI18n(
      <TransactionFilterDialog
        open={true}
        onClose={mockOnClose}
        filters={[filter]}
        onFilterChange={mockOnFilterChange}
      />
    );
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(filter.active).toBe(true);
    expect(mockOnFilterChange).toHaveBeenCalledWith(filter);
  });

  it('does not render when dialog is closed', () => {
    const filters = [createMockFilter('transaction.monthly_view', true)];
    renderWithI18n(
      <TransactionFilterDialog
        open={false}
        onClose={mockOnClose}
        filters={filters}
        onFilterChange={mockOnFilterChange}
      />
    );
    expect(screen.queryByText(/Filter/i)).not.toBeInTheDocument();
  });
});
