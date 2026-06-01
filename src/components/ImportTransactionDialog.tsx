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
import type { Transaction } from '../types/transaction';
import { useAccount } from '../hooks/useAccount';
import { dbService } from '../services/db';
import { UuidUtils } from '../utils/uuidUtils';
import dayjs from 'dayjs';

interface ImportTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess: (count: number, accountLabel: string) => void;
  onError: (message: string) => void;
}

const ImportTransactionDialog: React.FC<ImportTransactionDialogProps> = ({
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
        let transactions: Partial<Transaction>[] = [];

        if (file.name.endsWith('.json')) {
          try {
            const json = JSON.parse(content);
            if (!json.transactions || !Array.isArray(json.transactions)) {
              throw new Error('Invalid JSON structure');
            }
            transactions = json.transactions;
          } catch (err) {
            onError(t('import.error_invalid_format'));
            setIsImporting(false);
            return;
          }
        } else if (file.name.endsWith('.csv')) {
          transactions = parseCSV(content);
        } else {
          onError(t('import.error_invalid_format'));
          setIsImporting(false);
          return;
        }

          const validatedTransactions: Transaction[] = [];
        for (const tx of transactions) {
          const amount = Number(tx.amount);
          const dueDate = tx.dueDate ? dayjs(tx.dueDate) : dayjs(NaN);

          if (
            typeof tx.label === 'string' && tx.label.trim() !== '' &&
            !isNaN(amount) &&
            dueDate.isValid()
          ) {
            validatedTransactions.push({
              id: UuidUtils.generate(),
              accountId: selectedAccount?.id || '',
              label: tx.label,
              description: tx.description || '',
              amount: amount,
              dueDate: dueDate.format('YYYY-MM-DD')
            });
          } else {
            onError(t('import.error_invalid_data'));
            setIsImporting(false);
            return;
          }
        }

        if (validatedTransactions.length > 0) {
          for (const tx of validatedTransactions) {
            await dbService.addTransaction(tx);
          }

          if (selectedAccount) {
            onImportSuccess(validatedTransactions.length, selectedAccount.label);
          }
        }

        onClose();
      } catch (err) {
        console.error(err);
        onError(t('import.error_invalid_data'));
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

  const parseCSV = (content: string): Partial<Transaction>[] => {
    const headerMap: Record<string, string> = {
      label: 'label',
      libellé: 'label',
      amount: 'amount',
      montant: 'amount',
      duedate: 'dueDate',
      date: 'dueDate',
      description: 'description',
      desc: 'description',
    };

    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    // Try to detect separator
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    
    const headers = firstLine.split(separator).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    const results: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // A very simple CSV parser that handles quoted values
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

      const obj: any = {};
      headers.forEach((header, index) => {
        let val = values[index] || '';
        // Remove outer quotes if they exist
        val = val.replace(/^"|"$/g, '');
        const mappedKey = headerMap[header] || header;
        obj[mappedKey] = val;
      });
      results.push(obj);
    }
    return results;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('import.title')}</DialogTitle>
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

export default ImportTransactionDialog;
