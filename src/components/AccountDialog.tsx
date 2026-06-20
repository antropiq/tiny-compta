import React, { useState, useEffect, useRef } from 'react';
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
import { UuidUtils } from '../utils/uuidUtils';

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLabel(account?.label ?? '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [open, account]);

  const handleSave = async () => {
    if (!label.trim()) return;

    let updatedAccount: Account;
    if (account) {
      updatedAccount = { ...account, label };
      await dbService.updateAccount(updatedAccount);
    } else {
      updatedAccount = { id: UuidUtils.generate(), label };
      await dbService.addAccount(updatedAccount);
    }

    if (onSuccess) {
      onSuccess(updatedAccount);
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {account ? t('account.edit') : t('account.create')}
        </DialogTitle>
        <DialogContent>
          <TextField
            inputRef={inputRef}
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
          <Button type="submit" variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AccountDialog;
