import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Recurring } from '../types/recurring';
import { useAccount } from '../hooks/useAccount';
import { dbService } from '../services/db';
import { UuidUtils } from '../utils/uuidUtils';
import dayjs from 'dayjs';

interface ImportRecurringDialogProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess: (count: number, accountLabel: string) => void;
  onError: (message: string) => void;
}

const ImportRecurringDialog: React.FC<ImportRecurringDialogProps> = ({
  open,
  onClose,
  onImportSuccess,
  onError
}) => {
  const { t } = useTranslation();
  const { selectedAccount } = useAccount();
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) {
        onError(t('import.error_file_read'));
        setIsImporting(false);
        return;
      }

      try {
        let recurrings: Partial<Recurring>[] = [];

        if (file.name.endsWith('.json')) {
          try {
            const json = JSON.parse(content);
            if (!json.recurrings || !Array.isArray(json.recurrings)) {
              throw new Error('Invalid JSON structure');
            }
            recurrings = json.recurrings;
          } catch {
            onError(t('recurring.import_error_invalid_format'));
            setIsImporting(false);
            return;
          }
        } else if (file.name.endsWith('.csv')) {
          recurrings = parseCSV(content);
        } else {
          onError(t('recurring.import_error_invalid_format'));
          setIsImporting(false);
          return;
        }

        const validatedRecurrings: Recurring[] = [];
        for (const rec of recurrings) {
          const amount = Number(rec.amount);
          const dayOfMonth = Number(rec.dayOfMonth);
          const startDate = rec.startDate ? dayjs(rec.startDate) : dayjs(NaN);
          const endDate = rec.endDate ? dayjs(rec.endDate) : null;

          const isDayOfMonthValid = !isNaN(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31;
          const isEndDateValid = !endDate || endDate.isValid();

          if (
            typeof rec.label === 'string' && rec.label.trim() !== '' &&
            !isNaN(amount) &&
            isDayOfMonthValid &&
            startDate.isValid() &&
            isEndDateValid
          ) {
            validatedRecurrings.push({
              id: UuidUtils.generate(),
              accountId: selectedAccount?.id || '',
              label: rec.label,
              description: rec.description || '',
              amount: amount,
              dayOfMonth: dayOfMonth,
              startDate: startDate.format('YYYY-MM-DD'),
              endDate: endDate ? endDate.format('YYYY-MM-DD') : undefined
            });
          } else {
            onError(t('recurring.import_error_invalid_data'));
            setIsImporting(false);
            return;
          }
        }

        if (validatedRecurrings.length > 0) {
          for (const rec of validatedRecurrings) {
            await dbService.addRecurring(rec);
          }

          if (selectedAccount) {
            onImportSuccess(validatedRecurrings.length, selectedAccount.label);
          }
        }

        onClose();
      } catch (err) {
        console.error(err);
        onError(t('recurring.import_error_invalid_data'));
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      onError(t('import.error_file_read'));
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  const parseCSV = (content: string): Partial<Recurring>[] => {
    const headerMap: Record<string, string> = {
      label: 'label',
      libellé: 'label',
      amount: 'amount',
      montant: 'amount',
      dayofmonth: 'dayOfMonth',
      jour: 'dayOfMonth',
      startdate: 'startDate',
      start: 'startDate',
      enddate: 'endDate',
      end: 'endDate',
      description: 'description',
      desc: 'description',
    };

    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // Try to detect separator
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    
    const headers = firstLine.split(separator).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    const results: Partial<Recurring>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        let val = values[index] || '';
        val = val.replace(/^"|"$/g, '');
        const mappedKey = headerMap[header] || header;
        obj[mappedKey] = val;
      });
      results.push(obj as Partial<Recurring>);
    }
    return results;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('recurring.import_title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, mt: 2, mb: 2 }}>
          <Typography variant="body1">{t('import.selectFile')}</Typography>
          <Button
            variant="outlined"
            component="label"
            disabled={isImporting}
          >
            {isImporting ? t('import.loading') : t('import.browseFile')}
            <input
              type="file"
              hidden
              accept=".csv,.json"
              onChange={handleFileChange}
            />
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportRecurringDialog;
