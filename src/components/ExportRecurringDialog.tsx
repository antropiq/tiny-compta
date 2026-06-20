import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Recurring } from '../types/recurring';

interface ExportRecurringDialogProps {
  open: boolean;
  onClose: () => void;
  recurrings: Recurring[];
  onExport: (data: string, filename: string, type: 'json' | 'csv') => void;
}

type ExportFormat = 'json' | 'csv';

interface ExportFormProps {
  recurrings: Recurring[];
  onExport: (data: string, filename: string, type: 'json' | 'csv') => void;
  onClose: () => void;
}

const ExportForm: React.FC<ExportFormProps> = ({ recurrings, onExport, onClose }) => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>('json');
  const [delimiter, setDelimiter] = useState<string>('"');
  const [separator, setSeparator] = useState<string>(';');

  const handleExport = () => {
    if (recurrings.length === 0) {
      onClose();
      return;
    }

    const dateStr = dayjs().format('YYYY_MM_DD');
    const filename = `${dateStr}_recurrings`;

    if (format === 'json') {
      const exportData = {
        recurrings: recurrings.map(({ label, amount, description, dayOfMonth, startDate, endDate }) => ({
          label,
          amount,
          description,
          dayOfMonth,
          startDate,
          endDate
        }))
      };
      onExport(JSON.stringify(exportData, null, 2), `${filename}.json`, 'json');
    } else {
      const headers = ['label', 'amount', 'description', 'dayOfMonth', 'startDate', 'endDate'];
      const quotedHeaders = headers.map(h => `${delimiter}${h}${delimiter}`);
      const csvRows = [quotedHeaders.join(separator)];

      for (const rec of recurrings) {
        const row = headers.map(header => {
          let value = '';
          if (header === 'label') value = rec.label;
          else if (header === 'amount') value = rec.amount.toString();
          else if (header === 'description') value = rec.description || '';
          else if (header === 'dayOfMonth') value = rec.dayOfMonth.toString();
          else if (header === 'startDate') value = rec.startDate;
          else if (header === 'endDate') value = rec.endDate || '';

          const escapedValue = value.split(delimiter).join(delimiter + delimiter);
          return `${delimiter}${escapedValue}${delimiter}`;
        });
        csvRows.push(row.join(separator));
      }

      onExport(csvRows.join('\n'), `${filename}.csv`, 'csv');
    }
  };

  return (
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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleExport} variant="contained" color="primary">
          {t('export.export')}
        </Button>
      </Box>
    </Box>
  );
};

const ExportRecurringDialog: React.FC<ExportRecurringDialogProps> = ({
  open,
  onClose,
  recurrings,
  onExport
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('recurring.export_title')}</DialogTitle>
      <DialogContent>
        {open && (
          <ExportForm
            key={`${recurrings.length}-${open}`}
            recurrings={recurrings}
            onExport={onExport}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExportRecurringDialog;
