import React, { useState, useEffect, useRef } from 'react';
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
import type { Transaction } from '../types/transaction';
import { UuidUtils } from '../utils/uuidUtils';

export type TransactionEditorMode = 'create' | 'edit' | 'clone';

interface TransactionEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  mode: TransactionEditorMode;
  transaction?: Transaction;
  accountId: string;
}

const TransactionEditor: React.FC<TransactionEditorProps> = ({
  open,
  onClose,
  onSave,
  mode,
  transaction,
  accountId,
}) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('0');
  const [dueDate, setDueDate] = useState<Dayjs | null>(dayjs());
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && transaction) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLabel(transaction.label);
        setDescription(transaction.description || '');
        setAmount(transaction.amount.toString());
        setDueDate(dayjs(transaction.dueDate));
      } else if (mode === 'clone' && transaction) {
        setLabel(transaction.label);
        setDescription(transaction.description || '');
        setAmount(transaction.amount.toString());
        setDueDate(dayjs(transaction.dueDate));
      } else {
        // Create mode
        setLabel('');
        setDescription('');
        setAmount('0');
        setDueDate(dayjs());
      }
      setTimeout(() => {
        if (labelInputRef.current) {
          labelInputRef.current.focus();
          labelInputRef.current.select();
        }
      }, 50);
    }
  }, [open, mode, transaction]);

  const handleSave = () => {
    const numericAmount = parseFloat(amount.replace(',', '.'));
    const newTransaction: Transaction = {
      id: mode === 'edit' && transaction ? transaction.id : UuidUtils.generate(),
      accountId: mode === 'edit' && transaction ? transaction.accountId : accountId,
      label,
      description,
      amount: isNaN(numericAmount) ? 0 : numericAmount,
      dueDate: dueDate ? dueDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
    };

    onSave(newTransaction);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === 'create' ? t('transaction.create') : mode === 'edit' ? t('transaction.edit') : t('transaction.clone')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            inputRef={labelInputRef}
            label={t('transaction.label')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            fullWidth
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
          />
          <DatePicker
            label={t('transaction.dueDate')}
            value={dueDate}
            onChange={(newValue) => setDueDate(newValue)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Stack>
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

export default TransactionEditor;
