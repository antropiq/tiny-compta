import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecurringDeleteCascadeDialog from './RecurringDeleteCascadeDialog';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {ui}
    </I18nextProvider>
  );
};

describe('RecurringDeleteCascadeDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
  });

  it('renders with open=true', () => {
    renderWithProviders(
      <RecurringDeleteCascadeDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText(/confirm/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(
      <RecurringDeleteCascadeDialog
        open={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText(/confirm/i)).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    renderWithProviders(
      <RecurringDeleteCascadeDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm with "keep" when keep button is clicked', () => {
    renderWithProviders(
      <RecurringDeleteCascadeDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /keep/i }));
    expect(mockOnConfirm).toHaveBeenCalledWith('keep');
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onConfirm with "delete" when delete button is clicked', () => {
    renderWithProviders(
      <RecurringDeleteCascadeDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockOnConfirm).toHaveBeenCalledWith('delete');
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('renders the French confirm title', async () => {
    await i18n.changeLanguage('fr');
    renderWithProviders(
      <RecurringDeleteCascadeDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText(/confirmer/i)).toBeInTheDocument();
  });
});
