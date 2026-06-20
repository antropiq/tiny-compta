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

interface RecurringUpdateCascadeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (applyCascade: boolean) => void;
}

const RecurringUpdateCascadeDialog: React.FC<RecurringUpdateCascadeDialogProps> = ({
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
          {t('recurring.update_cascade_prompt')}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button onClick={() => onConfirm(false)} color="primary">
          {t('common.no')}
        </Button>
        <Button onClick={() => onConfirm(true)} color="primary" variant="contained">
          {t('common.yes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurringUpdateCascadeDialog;
