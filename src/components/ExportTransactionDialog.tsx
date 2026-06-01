import React, { useState, useEffect } from 'react';
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
  TextField,
  Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import type { Transaction } from '../types/transaction';

interface ExportTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onExport: (data: string, filename: string, type: 'json' | 'csv') => void;
}

type ExportFormat = 'json' | 'csv';

const ExportTransactionDialog: React.FC<ExportTransactionDialogProps> = ({
  open,
  onClose,
  transactions,
  onExport
}) => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>('json');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [delimiter, setDelimiter] = useState<string>('"');
  const [separator, setSeparator] = useState<string>(';');

  useEffect(() => {
    if (transactions.length > 0) {
      const dates = transactions.map(tx => dayjs(tx.dueDate));
      const minDate = dates.reduce((min, current) => (current.isBefore(min) ? current : min), dates[0]);
      const maxDate = dates.reduce((max, current) => (current.isAfter(max) ? current : max), dates[0]);
      setStartDate(minDate);
      setEndDate(maxDate);
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  }, [transactions]);

  const handleExport = () => {
    if (!startDate || !endDate) return;

    const filteredTransactions = transactions.filter(tx => {
      const txDate = dayjs(tx.dueDate);
      return txDate.isAfter(startDate.subtract(1, 'day')) && txDate.isBefore(endDate.add(1, 'day'));
    });

    if (filteredTransactions.length === 0) {
      onClose();
      return;
    }

    const dateStr = dayjs().format('YYYY_MM_DD');
    const filename = `${dateStr}_transactions`;

    if (format === 'json') {
      // We only export the 4 fields: label, amount, description, dueDate
      const exportData = {
        transactions: filteredTransactions.map(({ label, amount, description, dueDate }) => ({
          label,
          amount,
          description,
          dueDate
        }))
      };
      onExport(JSON.stringify(exportData, null, 2), `${filename}.json`, 'json');
    } else {
      // CSV
      const headers = ['label', 'amount', 'description', 'dueDate'];
      const quotedHeaders = headers.map(h => `${delimiter}${h}${delimiter}`);
      const csvRows = [quotedHeaders.join(separator)];

      for (const tx of filteredTransactions) {
        const row = headers.map(header => {
          let value = '';
          if (header === 'label') value = tx.label;
          else if (header === 'amount') value = tx.amount.toString();
          else if (header === 'description') value = tx.description || '';
          else if (header === 'dueDate') value = tx.dueDate;

          const escapedValue = value.split(delimiter).join(delimiter + delimiter);
          return `${delimiter}${escapedValue}${delimiter}`;
        });
        csvRows.push(row.join(separator));
      }

      onExport(csvRows.join('\n'), `${filename}.csv`, 'csv');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('export.title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>{t('export.format')}</InputLabel>
            <Select
              value={format}
              label={t('export.format')}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              <MenuItem value="json">{t('export.json')}</MenuItem>
              <MenuItem value="csv">{t('export.csv')}</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker
              label={t('export.startDate')}
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DatePicker
              label={t('export.endDate')}
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Box>

          {format === 'csv' && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={t('export.delimiter')}
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                fullWidth
                slotProps={{ htmlInput: { maxLength: 1 } }}
              />
              <TextField
                label={t('export.separator')}
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                fullWidth
                slotProps={{ htmlInput: { maxLength: 1 } }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleExport} variant="contained" color="primary">
          {t('export.export')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportTransactionDialog;
