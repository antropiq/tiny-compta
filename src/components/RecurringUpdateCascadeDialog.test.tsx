import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecurringUpdateCascadeDialog from './RecurringUpdateCascadeDialog';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {ui}
    </I18nextProvider>
  );
};

describe('RecurringUpdateCascadeDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
  });

  it('renders with open=true', () => {
    renderWithProviders(
      <RecurringUpdateCascadeDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText(/confirm/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(
      <RecurringUpdateCascadeDialog
        open={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText(/confirm/i)).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    renderWithProviders(
      <RecurringUpdateCascadeDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm with false when no button is clicked', () => {
    renderWithProviders(
      <RecurringUpdateCascadeDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /no/i }));
    expect(mockOnConfirm).toHaveBeenCalledWith(false);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onConfirm with true when yes button is clicked', () => {
    renderWithProviders(
      <RecurringUpdateCascadeDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /yes/i }));
    expect(mockOnConfirm).toHaveBeenCalledWith(true);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('renders the French confirm title', async () => {
    await i18n.changeLanguage('fr');
    renderWithProviders(
      <RecurringUpdateCascadeDialog
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText(/confirmer/i)).toBeInTheDocument();
  });
});
