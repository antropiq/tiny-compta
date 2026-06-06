import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Filterable } from '../types/filter';

interface TransactionFilterDialogProps {
  open: boolean;
  onClose: () => void;
  filters: Filterable[];
  onFilterChange: (filter: Filterable) => void;
}

const TransactionFilterDialog: React.FC<TransactionFilterDialogProps> = ({
  open,
  onClose,
  filters,
  onFilterChange,
}) => {
  const { t } = useTranslation();

  const handleToggle = (filter: Filterable) => {
    filter.active = !filter.active;
    onFilterChange(filter);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('transaction.filter')}</DialogTitle>
      <DialogContent>
        <List>
          {filters.map((filter, index) => (
            <ListItem key={index} disablePadding>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filter.active}
                    onChange={() => handleToggle(filter)}
                  />
                }
                label={t(filter.label)}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionFilterDialog;
