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

interface RecurringApplyPromptDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  monthName: string;
}

const RecurringApplyPromptDialog: React.FC<RecurringApplyPromptDialogProps> = ({
  open,
  onClose,
  onConfirm,
  monthName,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('recurring.apply_prompt_title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('recurring.apply_prompt_message', { month: monthName })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t('common.no')}
        </Button>
        <Button onClick={onConfirm} color="primary" variant="contained">
          {t('common.yes')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurringApplyPromptDialog;
