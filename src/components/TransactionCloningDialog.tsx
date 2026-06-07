import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import type { Transaction } from '../types/transaction';
import 'dayjs/locale/en';

interface TransactionCloningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (targetDate: Dayjs) => void;
  sourceTransaction: Transaction;
}

const TransactionCloningDialog: React.FC<TransactionCloningDialogProps> = ({
  open,
  onClose,
  onConfirm,
  sourceTransaction,
}) => {
  const { t, i18n } = useTranslation();
  const sourceDate = sourceTransaction ? dayjs(sourceTransaction.dueDate) : dayjs();
  const defaultTarget = sourceDate.add(1, 'month');

  const [targetYear, setTargetYear] = useState<Dayjs | null>(() => defaultTarget);
  const [targetMonth, setTargetMonth] = useState<number>(defaultTarget.month());

  const months = Array.from({ length: 12 }, (_, i) => i);

  const getMonthName = (monthIndex: number): string => {
    const locale = i18n.language === 'fr' ? 'fr' : 'en';
    return dayjs().locale(locale).month(monthIndex).format('MMMM');
  };

  const handleConfirm = () => {
    if (!targetYear) return;
    const targetDate = dayjs().year(targetYear.year()).month(targetMonth).date(sourceDate.date());
    onConfirm(targetDate);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('transaction.clone_title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker
              label={t('transaction.clone_year')}
              value={targetYear}
              onChange={(newValue) => setTargetYear(newValue)}
              views={['year']}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <FormControl fullWidth>
              <InputLabel>{t('transaction.clone_month')}</InputLabel>
              <Select
                value={targetMonth}
                label={t('transaction.clone_month')}
                onChange={(e) => setTargetMonth(e.target.value as number)}
              >
                {months.map((month) => (
                  <MenuItem key={month} value={month}>
                    {getMonthName(month)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <FormControl fullWidth>
            <InputLabel>{t('transaction.clone_frequency')}</InputLabel>
            <Select
              value="every_month"
              label={t('transaction.clone_frequency')}
              disabled
            >
              <MenuItem value="every_month">{t('transaction.clone_every_month')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          {t('transaction.clone_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionCloningDialog;
