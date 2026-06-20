import React, { useState } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Recurring } from '../types/recurring';
import { useAccount } from '../hooks/useAccount';
import { dbService } from '../services/db';
import RecurringToolbar from './RecurringToolbar';
import RecurringEditor from './RecurringEditor';
import RecurringDeleteCascadeDialog from './RecurringDeleteCascadeDialog';
import RecurringUpdateCascadeDialog from './RecurringUpdateCascadeDialog';
import { FormatUtils } from '../utils/formatUtils';
import dayjs from 'dayjs';

interface RecurringsTabProps {
  recurrings: Recurring[];
  onRecurringsChanged: () => void;
  onTransactionsChanged: () => void;
  applyRecurringsForMonth: (monthStr: string) => Promise<void>;
}

const RecurringsTab: React.FC<RecurringsTabProps> = ({
  recurrings,
  onRecurringsChanged,
  onTransactionsChanged,
  applyRecurringsForMonth,
}) => {
  const { t } = useTranslation();
  const { selectedAccount, selectedDate } = useAccount();

  const [isRecurringEditorOpen, setIsRecurringEditorOpen] = useState(false);
  const [recurringEditorMode, setRecurringEditorMode] = useState<'create' | 'edit'>('create');
  const [recurringToEdit, setRecurringToEdit] = useState<Recurring | undefined>(undefined);
  const [isRecurringDeleteCascadeOpen, setIsRecurringDeleteCascadeOpen] = useState(false);
  const [recurringToDelete, setRecurringToDelete] = useState<Recurring | undefined>(undefined);
  const [isRecurringUpdateCascadeOpen, setIsRecurringUpdateCascadeOpen] = useState(false);
  const [tempRecurringUpdateData, setTempRecurringUpdateData] = useState<Recurring | undefined>(undefined);

  const handleAddRecurring = () => {
    if (!selectedAccount) return;
    setRecurringEditorMode('create');
    setRecurringToEdit(undefined);
    setIsRecurringEditorOpen(true);
  };

  const handleEditRecurring = (rec: Recurring) => {
    setRecurringEditorMode('edit');
    setRecurringToEdit(rec);
    setIsRecurringEditorOpen(true);
  };

  const handleSaveRecurring = async (newRecurring: Recurring) => {
    if (recurringEditorMode === 'create') {
      await dbService.addRecurring(newRecurring);
      onRecurringsChanged();
    } else {
      if (recurringToEdit && recurringToEdit.amount !== newRecurring.amount) {
        setTempRecurringUpdateData(newRecurring);
        setIsRecurringUpdateCascadeOpen(true);
      } else {
        await dbService.updateRecurring(newRecurring);
        onRecurringsChanged();
      }
    }
  };

  const handleConfirmUpdateCascade = async (applyCascade: boolean) => {
    if (!tempRecurringUpdateData) return;

    await dbService.updateRecurring(tempRecurringUpdateData);

    if (applyCascade) {
      const firstDayOfCurrentMonth = dayjs().startOf('month').format('YYYY-MM-DD');
      const accountTxs = await dbService.getTransactionsByAccountId(tempRecurringUpdateData.accountId);
      const remainingTxs = accountTxs.filter(tx => 
        tx.recurringId === tempRecurringUpdateData.id && 
        (tx.dueDate > firstDayOfCurrentMonth || tx.dueDate === firstDayOfCurrentMonth)
      );

      for (const tx of remainingTxs) {
        await dbService.updateTransaction({
          ...tx,
          amount: tempRecurringUpdateData.amount,
        });
      }
      onTransactionsChanged();
    }

    onRecurringsChanged();
    setTempRecurringUpdateData(undefined);
    setIsRecurringUpdateCascadeOpen(false);
  };

  const handleDeleteRecurring = (rec: Recurring) => {
    setRecurringToDelete(rec);
    setIsRecurringDeleteCascadeOpen(true);
  };

  const handleConfirmDeleteCascade = async (action: 'keep' | 'delete') => {
    if (!recurringToDelete) return;

    if (action === 'delete') {
      const accountTxs = await dbService.getTransactionsByAccountId(recurringToDelete.accountId);
      const linkedTxs = accountTxs.filter(tx => tx.recurringId === recurringToDelete.id);
      for (const tx of linkedTxs) {
        await dbService.deleteTransaction(tx.id);
      }
      onTransactionsChanged();
    } else if (action === 'keep') {
      const accountTxs = await dbService.getTransactionsByAccountId(recurringToDelete.accountId);
      const linkedTxs = accountTxs.filter(tx => tx.recurringId === recurringToDelete.id);
      for (const tx of linkedTxs) {
        await dbService.updateTransaction({
          ...tx,
          recurringId: undefined,
        });
      }
      onTransactionsChanged();
    }

    await dbService.deleteRecurring(recurringToDelete.id);
    onRecurringsChanged();

    setRecurringToDelete(undefined);
    setIsRecurringDeleteCascadeOpen(false);
  };

  const handleApplyRecurringsToSelectedMonth = async () => {
    if (!selectedAccount || !selectedDate) return;
    const monthStr = selectedDate.format('YYYY-MM');
    await applyRecurringsForMonth(monthStr);
  };

  const sortedRecurrings = [...recurrings].sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  return (
    <>
      <RecurringToolbar
        onAddRecurring={handleAddRecurring}
        onApplyToSelectedMonth={handleApplyRecurringsToSelectedMonth}
        disabled={!selectedAccount}
      />
      <Box className="table-container">
        <Table size="small" sx={{ fontSize: '0.875rem' }} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{t('transaction.label')}</TableCell>
              <TableCell>{t('transaction.description')}</TableCell>
              <TableCell align="right">{t('transaction.amount')}</TableCell>
              <TableCell align="right">{t('recurring.dayOfMonth')}</TableCell>
              <TableCell>{t('recurring.startDate')} - {t('recurring.endDate')}</TableCell>
              <TableCell align="right" className="actions-cell">{t('transaction.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRecurrings.map((rec) => {
              return (
                <TableRow key={rec.id} className={rec.amount > 0 ? 'row-positive' : 'row-default'}>
                  <TableCell>{rec.label}</TableCell>
                  <TableCell>{rec.description}</TableCell>
                  <TableCell align="right">{FormatUtils.currency(rec.amount)}</TableCell>
                  <TableCell align="right">{rec.dayOfMonth}</TableCell>
                  <TableCell>
                    {FormatUtils.date(rec.startDate)}
                    {rec.endDate ? ` - ${FormatUtils.date(rec.endDate)}` : ''}
                  </TableCell>
                  <TableCell className="actions-cell" align="right">
                    <IconButton size="small" onClick={() => handleEditRecurring(rec)} aria-label="edit recurring"><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDeleteRecurring(rec)} aria-label="delete recurring"><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {sortedRecurrings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {selectedAccount ? t('transaction.no_transactions') : t('account.select')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <RecurringEditor
        open={isRecurringEditorOpen}
        onClose={() => setIsRecurringEditorOpen(false)}
        onSave={handleSaveRecurring}
        mode={recurringEditorMode}
        recurring={recurringToEdit}
        accountId={selectedAccount?.id || ''}
      />

      <RecurringDeleteCascadeDialog
        open={isRecurringDeleteCascadeOpen}
        onClose={() => setIsRecurringDeleteCascadeOpen(false)}
        onConfirm={handleConfirmDeleteCascade}
      />

      <RecurringUpdateCascadeDialog
        open={isRecurringUpdateCascadeOpen}
        onClose={() => setIsRecurringUpdateCascadeOpen(false)}
        onConfirm={handleConfirmUpdateCascade}
      />
    </>
  );
};

export default RecurringsTab;
