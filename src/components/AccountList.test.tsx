import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AccountList from './AccountList';
import { dbService } from '../services/db';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { AccountProvider } from '../providers/AccountContext';

vi.mock('../services/db', () => ({
  dbService: {
    getAccount: vi.fn(),
    getAllAccounts: vi.fn(),
    addAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
    getTransaction: vi.fn(),
    getAllTransactions: vi.fn(),
    getTransactionsByAccountId: vi.fn(),
    addTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    getSettingByKey: vi.fn(),
    getAllSettings: vi.fn(),
    updateSetting: vi.fn(),
    deleteSetting: vi.fn(),
    setSetting: vi.fn(),
  },
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <AccountProvider>
        {ui}
      </AccountProvider>
    </I18nextProvider>
  );
};

describe('AccountList', () => {
  const mockAccounts = [
    { id: '1', label: 'Account 1' },
    { id: '2', label: 'Account 2' },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
    vi.mocked(dbService.getAllAccounts).mockResolvedValue(mockAccounts);
  });

  it('loads and displays accounts in the autocomplete', async () => {
    renderWithProviders(<AccountList />);

    await waitFor(() => {
      expect(dbService.getAllAccounts).toHaveBeenCalled();
    });

    const autocompleteInput = screen.getByPlaceholderText(/select account/i);
    fireEvent.mouseDown(autocompleteInput);

    expect(await screen.findByText('Account 1')).toBeInTheDocument();
    expect(await screen.findByText('Account 2')).toBeInTheDocument();
  });

  it('allows selecting an account', async () => {
    renderWithProviders(<AccountList />);

    await waitFor(() => {
      expect(dbService.getAllAccounts).toHaveBeenCalled();
    });

    const autocompleteInput = screen.getByPlaceholderText(/select account/i);
    fireEvent.mouseDown(autocompleteInput);

    const option = await screen.findByText('Account 1');
    fireEvent.click(option);

    expect(autocompleteInput).toHaveValue('Account 1');
  });

  it('enables edit and delete buttons when an account is selected', async () => {
    renderWithProviders(<AccountList />);

    await waitFor(() => {
      expect(dbService.getAllAccounts).toHaveBeenCalled();
    });

    const autocompleteInput = screen.getByPlaceholderText(/select account/i);
    fireEvent.mouseDown(autocompleteInput);

    const option = await screen.findByText('Account 1');
    fireEvent.click(option);

    const editButton = screen.getByRole('button', { name: /edit/i });
    const deleteButton = screen.getByRole('button', { name: /delete/i });

    expect(editButton).not.toBeDisabled();
    expect(deleteButton).not.toBeDisabled();
  });

  it('disables edit and delete buttons when no accounts are available', async () => {
    vi.mocked(dbService.getAllAccounts).mockResolvedValue([]);
    renderWithProviders(<AccountList />);

    await waitFor(() => {
      expect(dbService.getAllAccounts).toHaveBeenCalled();
    });

    const editButton = screen.getByRole('button', { name: /edit/i });
    const deleteButton = screen.getByRole('button', { name: /delete/i });

    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  it('opens AccountDialog in creation mode when plus button is clicked', async () => {
    renderWithProviders(<AccountList />);

    await waitFor(() => {
      expect(dbService.getAllAccounts).toHaveBeenCalled();
    });

    const addButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(addButton);

    expect(await screen.findByText(/create account/i)).toBeInTheDocument();
  });

  it('opens AccountDialog in edition mode when edit button is clicked', async () => {
    renderWithProviders(<AccountList />);

    await waitFor(() => {
      expect(dbService.getAllAccounts).toHaveBeenCalled();
    });

    const autocompleteInput = screen.getByPlaceholderText(/select account/i);
    fireEvent.mouseDown(autocompleteInput);
    const option = await screen.findByText('Account 1');
    fireEvent.click(option);

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(await screen.findByText(/edit account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account label/i)).toHaveValue('Account 1');
  });

  it('opens ConfirmDialog when delete button is clicked', async () => {
    renderWithProviders(<AccountList />);

    await waitFor(() => {
      expect(dbService.getAllAccounts).toHaveBeenCalled();
    });

    const autocompleteInput = screen.getByPlaceholderText(/select account/i);
    fireEvent.mouseDown(autocompleteInput);
    const option = await screen.findByText('Account 1');
    fireEvent.click(option);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(await screen.findByText(/are you sure you want to delete this account\?/i)).toBeInTheDocument();
  });

  it('deletes the account when confirm button is clicked', async () => {
    renderWithProviders(<AccountList />);

    await waitFor(() => {
      expect(dbService.getAllAccounts).toHaveBeenCalled();
    });

    const autocompleteInput = screen.getByPlaceholderText(/select account/i);
    fireEvent.mouseDown(autocompleteInput);
    const option = await screen.findByText('Account 1');
    fireEvent.click(option);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    const confirmButton = await screen.findByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(dbService.deleteAccount).toHaveBeenCalledWith('1');
    });
  });

  it('opens AccountDialog in edition mode and saves changes', async () => {
    renderWithProviders(<AccountList />);

    await waitFor(() => {
      expect(dbService.getAllAccounts).toHaveBeenCalled();
    });

    const autocompleteInput = screen.getByPlaceholderText(/select account/i);
    fireEvent.mouseDown(autocompleteInput);
    const option = await screen.findByText('Account 1');
    fireEvent.click(option);

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(await screen.findByText(/edit account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account label/i)).toHaveValue('Account 1');

    const saveButton = await screen.findByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(dbService.updateAccount).toHaveBeenCalled();
    });
  });

  it('selects the previous account when the currently active account is deleted', async () => {
    vi.mocked(dbService.getAllAccounts).mockResolvedValue([
      { id: '1', label: 'Account 1' },
      { id: '2', label: 'Account 2' },
    ]);
    
    renderWithProviders(<AccountList />);

    await waitFor(() => {
      expect(dbService.getAllAccounts).toHaveBeenCalled();
    });

    const autocompleteInput = screen.getByPlaceholderText(/select account/i);
    fireEvent.mouseDown(autocompleteInput);
    const option = await screen.findByText('Account 2');
    fireEvent.click(option);

    vi.mocked(dbService.getAllAccounts).mockResolvedValue([
      { id: '1', label: 'Account 1' },
    ]);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    const confirmButton = await screen.findByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(autocompleteInput).toHaveValue('Account 1');
    });
  });
});
