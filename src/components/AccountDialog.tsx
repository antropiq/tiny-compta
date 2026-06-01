import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Account } from '../types/account';
import { dbService } from '../services/db';
import { v4 as uuidv4 } from 'uuid';

interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (account: Account) => void;
  account?: Account;
}

const AccountDialog: React.FC<AccountDialogProps> = ({
  open,
  onClose,
  onSuccess,
  account,
}) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState(account?.label ?? '');

  const handleSave = async () => {
    if (!label.trim()) return;

    let updatedAccount: Account;
    if (account) {
      updatedAccount = { ...account, label };
      await dbService.updateAccount(updatedAccount);
    } else {
      updatedAccount = { id: uuidv4(), label };
      await dbService.addAccount(updatedAccount);
    }

    if (onSuccess) {
      onSuccess(updatedAccount);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {account ? t('account.edit') : t('account.create')}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={t('account.label')}
          type="text"
          fullWidth
          variant="outlined"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained">
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountDialog;
