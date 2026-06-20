import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface RecurringDeleteCascadeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (action: 'keep' | 'delete') => void;
}

const RecurringDeleteCascadeDialog: React.FC<RecurringDeleteCascadeDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('common.confirm_title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('recurring.delete_prompt_message')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button onClick={() => onConfirm('keep')} color="primary" variant="outlined">
          {t('recurring.delete_prompt_keep')}
        </Button>
        <Button onClick={() => onConfirm('delete')} color="error" variant="contained">
          {t('recurring.delete_prompt_delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurringDeleteCascadeDialog;
