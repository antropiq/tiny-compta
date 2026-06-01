import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfirmDialog from './ConfirmDialog';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
};

describe('ConfirmDialog', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders the message and buttons', () => {
    const message = 'Are you sure?';
    renderWithI18n(<ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} message={message} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    renderWithI18n(<ConfirmDialog open={true} onClose={onClose} onConfirm={() => {}} message="test" />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderWithI18n(<ConfirmDialog open={true} onClose={onClose} onConfirm={onConfirm} message="test" />);
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
