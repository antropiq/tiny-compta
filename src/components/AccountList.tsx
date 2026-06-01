import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Autocomplete,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import { Add, Edit, Delete as DeleteIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Account } from '../types/account';
import { dbService } from '../services/db';
import AccountDialog from './AccountDialog';
import ConfirmDialog from './ConfirmDialog';
import { useAccount } from '../hooks/useAccount';

const AccountList: React.FC = () => {
  const { t } = useTranslation();
  const { selectedAccount, setSelectedAccount } = useAccount();
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | undefined>(undefined);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  const loadAccounts = useCallback(async () => {
    const accs = await dbService.getAllAccounts();
    setAccounts(accs);
    return accs;
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAccounts();
  }, [loadAccounts]);

  const handleAccountDialogOpen = (account?: Account) => {
    setAccountToEdit(account);
    setIsAccountDialogOpen(true);
  };

  const handleAccountDialogClose = () => {
    setIsAccountDialogOpen(false);
    setAccountToEdit(undefined);
  };

  const handleConfirmDialogOpen = (account: Account) => {
    setAccountToDelete(account);
    setConfirmMessage(t('account.delete_confirmation'));
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDialogClose = () => {
    setIsConfirmDialogOpen(false);
    setAccountToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (accountToDelete) {
      await dbService.deleteAccount(accountToDelete.id);
      await loadAccounts();
      if (selectedAccount?.id === accountToDelete.id) {
        setSelectedAccount(null);
      }
    }
    handleConfirmDialogClose();
  };

  const handleAccountSaveSuccess = async (updatedAccount?: Account) => {
    await loadAccounts();
    if (updatedAccount) {
      setSelectedAccount(updatedAccount);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Autocomplete
        options={accounts}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        value={selectedAccount}
        onChange={(_, newValue) => setSelectedAccount(newValue)}
        renderInput={(params) => (
          <TextField {...params} size="small" placeholder={t('account.select')} />
        )}
        sx={{ width: 250 }}
      />
      <Tooltip title={t('account.create')}>
        <IconButton onClick={() => handleAccountDialogOpen()}>
          <Add />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('account.edit')}>
        <span>
          <IconButton
            aria-label={t('account.edit')}
            onClick={() => selectedAccount && handleAccountDialogOpen(selectedAccount)}
            disabled={!selectedAccount}
          >
            <Edit />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('account.delete')}>
        <span>
          <IconButton
            aria-label={t('account.delete')}
            onClick={() => selectedAccount && handleConfirmDialogOpen(selectedAccount)}
            disabled={!selectedAccount}
          >
            <DeleteIcon />
          </IconButton>
        </span>
      </Tooltip>

      <AccountDialog
        key={accountToEdit?.id || 'new'}
        open={isAccountDialogOpen}
        onClose={handleAccountDialogClose}
        account={accountToEdit}
        onSuccess={handleAccountSaveSuccess}
      />

      <ConfirmDialog
        open={isConfirmDialogOpen}
        onClose={handleConfirmDialogClose}
        onConfirm={handleConfirmDelete}
        message={confirmMessage}
      />
    </Box>
  );
};

export default AccountList;
