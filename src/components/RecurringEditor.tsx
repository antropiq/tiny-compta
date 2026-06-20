import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import type { Recurring } from '../types/recurring';
import { UuidUtils } from '../utils/uuidUtils';

interface RecurringEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (recurring: Recurring) => void;
  mode: 'create' | 'edit';
  recurring?: Recurring;
  accountId: string;
}

const RecurringEditor: React.FC<RecurringEditorProps> = ({
  open,
  onClose,
  onSave,
  mode,
  recurring,
  accountId,
}) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('0');
  const [dayOfMonth, setDayOfMonth] = useState<string>('1');
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && recurring) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLabel(recurring.label);
        setDescription(recurring.description || '');
        setAmount(recurring.amount.toString());
        setDayOfMonth(recurring.dayOfMonth.toString());
        setStartDate(dayjs(recurring.startDate));
        setEndDate(recurring.endDate ? dayjs(recurring.endDate) : null);
      } else {
        setLabel('');
        setDescription('');
        setAmount('0');
        setDayOfMonth('1');
        setStartDate(dayjs());
        setEndDate(null);
      }
    }
  }, [open, mode, recurring]);

  const handleSave = () => {
    const numericAmount = parseFloat(amount.replace(',', '.'));
    const parsedDay = parseInt(dayOfMonth, 10);
    const clampedDay = isNaN(parsedDay) ? 1 : Math.max(1, Math.min(31, parsedDay));

    const newRecurring: Recurring = {
      id: mode === 'edit' && recurring ? recurring.id : UuidUtils.generate(),
      accountId: mode === 'edit' && recurring ? recurring.accountId : accountId,
      label,
      description,
      amount: isNaN(numericAmount) ? 0 : numericAmount,
      dayOfMonth: clampedDay,
      startDate: startDate ? startDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      endDate: endDate ? endDate.format('YYYY-MM-DD') : undefined,
    };

    onSave(newRecurring);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === 'create' ? t('recurring.create') : t('recurring.edit')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label={t('transaction.label')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label={t('transaction.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label={t('transaction.amount')}
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || val === '-' || /^-?\d*[,.]?\d*$/.test(val)) {
                setAmount(val);
              }
            }}
            fullWidth
            required
          />
          <TextField
            label={t('recurring.dayOfMonth')}
            type="number"
            slotProps={{ htmlInput: { min: 1, max: 31 } }}
            value={dayOfMonth}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d*$/.test(val)) {
                setDayOfMonth(val);
              }
            }}
            fullWidth
            required
          />
          <DatePicker
            label={t('recurring.startDate')}
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            slotProps={{ textField: { fullWidth: true, required: true } }}
          />
          <DatePicker
            label={t('recurring.endDate')}
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={!label || !amount || !dayOfMonth || !startDate}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurringEditor;
