import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip, Snackbar, Alert, useTheme } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { ContentCopy, Edit, Delete, Download, Upload } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Transaction } from '../types/transaction';
import { useAccount } from '../hooks/useAccount';
import { dbService } from '../services/db';
import TransactionEditor from './TransactionEditor';
import type { TransactionEditorMode } from './TransactionEditor';
import TransactionToolbar from './TransactionToolbar';
import ConfirmDialog from './ConfirmDialog';
import ExportTransactionDialog from './ExportTransactionDialog';
import ImportTransactionDialog from './ImportTransactionDialog';
import './TransactionEditionArea.css';
import Logo from './logo';

const TransactionEditionArea: React.FC = () => {
  const { t } = useTranslation();
  const { selectedAccount, selectedDate, setSelectedDate, setTransactionsVersion } = useAccount();
  const theme = useTheme();
  const primaryColor = theme.palette?.primary?.main || "#D4AF37";
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<TransactionEditorMode>('create');
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined);

  // Confirm dialog state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | undefined>(undefined);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Export/Import state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleOpenSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const loadTransactions = useCallback(async () => {
    if (selectedAccount) {
      const txs = await dbService.getTransactionsByAccountId(selectedAccount.id);
      const sortedTxs = [...txs].sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());
      setTransactions(sortedTxs);
    } else {
      setTransactions([]);
    }
  }, [selectedAccount]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTransactions();
  }, [loadTransactions]);

  const handleAddTransaction = () => {
    if (!selectedAccount) return;
    setEditorMode('create');
    setTransactionToEdit(undefined);
    setIsEditorOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditorMode('edit');
    setTransactionToEdit(transaction);
    setIsEditorOpen(true);
  };

  const handleCloneTransaction = (transaction: Transaction) => {
    setEditorMode('clone');
    setTransactionToEdit(transaction);
    setIsEditorOpen(true);
  };

  const handleSaveTransaction = async (newTransaction: Transaction) => {
    if (editorMode === 'create' || editorMode === 'clone') {
      await dbService.addTransaction(newTransaction);
    } else {
      await dbService.updateTransaction(newTransaction);
    }
    setTransactionsVersion(v => v + 1);
    await loadTransactions();
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setConfirmMessage(t('transaction.delete_confirmation'));
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete) {
      await dbService.deleteTransaction(transactionToDelete.id);
      setTransactionsVersion(v => v + 1);
      await loadTransactions();
    }
    setTransactionToDelete(undefined);
    setIsConfirmDialogOpen(false);
  };

  const handleExport = (data: string, filename: string, type: 'json' | 'csv') => {
    const blob = new Blob([data], { type: type === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    handleOpenSnackbar(t('export.success', { count: transactions.length, filename }), 'success');
    setIsExportDialogOpen(false);
  };

  const handleImportSuccess = (count: number, accountLabel: string) => {
    handleOpenSnackbar(t('import.success', { count, accountLabel }), 'success');
    setTransactionsVersion(v => v + 1);
    loadTransactions();
  };

  const handleImportError = (message: string) => {
    handleOpenSnackbar(message, 'error');
  };

  return (
    <Box className="transaction-edition-area">
      <Paper className="left-container" elevation={0} variant="outlined" >
        <Box className="calendar-container">
          <DateCalendar
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            sx={{
              transform: 'scale(0.85)',
              transformOrigin: 'center',
            }}
          />
        </Box>
        <Box className="logo-container">
           <Logo color={primaryColor} size={150} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={t('export.title')}>
            <IconButton onClick={() => setIsExportDialogOpen(true)} disabled={!selectedAccount}>
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('import.title')}>
            <IconButton onClick={() => setIsImportDialogOpen(true)} disabled={!selectedAccount}>
              <Upload fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <Paper className="right-container" elevation={0} variant="outlined">
        <TransactionToolbar onAddTransaction={handleAddTransaction} disabled={!selectedAccount} />
        <Box className="table-container">
          <Table size="small" sx={{ fontSize: '0.875rem' }} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('transaction.dueDate')}</TableCell>
                  <TableCell>{t('transaction.label')}</TableCell>
                  <TableCell>{t('transaction.description')}</TableCell>
                  <TableCell>{t('transaction.amount')}</TableCell>
                  <TableCell align="right">{t('transaction.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{dayjs(transaction.dueDate).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>{transaction.label}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.amount.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleCloneTransaction(transaction)} aria-label="clone transaction"><ContentCopy fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleEditTransaction(transaction)} aria-label="edit transaction"><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDeleteTransaction(transaction)} aria-label="delete transaction"><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      {selectedAccount ? t('transaction.no_transactions') : t('account.select')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </Box>
      </Paper>

      <TransactionEditor
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveTransaction}
        mode={editorMode}
        transaction={transactionToEdit}
        accountId={selectedAccount?.id || ''}
      />

      <ConfirmDialog
        open={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        message={confirmMessage}
      />

      <ExportTransactionDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        transactions={transactions}
        onExport={handleExport}
      />

      <ImportTransactionDialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={handleImportSuccess}
        onError={handleImportError}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TransactionEditionArea;
