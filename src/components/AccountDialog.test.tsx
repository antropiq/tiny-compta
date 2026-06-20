import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AccountDialog from './AccountDialog';
import { dbService } from '../services/db';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

vi.mock('../services/db', () => ({
  dbService: {
    addAccount: vi.fn(),
    updateAccount: vi.fn(),
  },
}));

const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
};

describe('AccountDialog', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
  });

  it('renders in creation mode with empty label', () => {
    renderWithI18n(<AccountDialog open={true} onClose={() => {}} />);
    
    expect(screen.getByLabelText(/account label/i)).toHaveValue('');
  });

  it('renders in edition mode with prefilled label', () => {
    const account = { id: '123', label: 'Test Account' };
    renderWithI18n(<AccountDialog open={true} onClose={() => {}} account={account} />);
    
    expect(screen.getByLabelText(/account label/i)).toHaveValue('Test Account');
  });

  it('calls addAccount when saving a new account', async () => {
    const onSuccess = vi.fn();
    renderWithI18n(<AccountDialog open={true} onClose={() => {}} onSuccess={onSuccess} />);
    
    const input = screen.getByLabelText(/account label/i);
    fireEvent.change(input, { target: { value: 'New Account' } });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(dbService.addAccount).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'New Account', id: expect.any(String) })
      );
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('calls updateAccount when saving an existing account', async () => {
    const account = { id: '123', label: 'Old Label' };
    const onSuccess = vi.fn();
    renderWithI18n(<AccountDialog open={true} onClose={() => {}} account={account} onSuccess={onSuccess} />);
    
    const input = screen.getByLabelText(/account label/i);
    fireEvent.change(input, { target: { value: 'New Label' } });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(dbService.updateAccount).toHaveBeenCalledWith({ id: '123', label: 'New Label' });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('does not call save if label is empty', async () => {
    renderWithI18n(<AccountDialog open={true} onClose={() => {}} />);
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(dbService.addAccount).not.toHaveBeenCalled();
    expect(dbService.updateAccount).not.toHaveBeenCalled();
  });

  it('submits the form when pressing Enter inside the input field', async () => {
    const onSuccess = vi.fn();
    renderWithI18n(<AccountDialog open={true} onClose={() => {}} onSuccess={onSuccess} />);
    
    const input = screen.getByLabelText(/account label/i);
    fireEvent.change(input, { target: { value: 'Enter Key Account' } });
    
    fireEvent.submit(input);

    await waitFor(() => {
      expect(dbService.addAccount).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Enter Key Account', id: expect.any(String) })
      );
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
