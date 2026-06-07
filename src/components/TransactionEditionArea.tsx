import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip, Snackbar, Alert, useTheme, Checkbox } from '@mui/material';
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
import TransactionFilterDialog from './TransactionFilterDialog';
import { monthlyViewFilter, nextMonthViewFilter } from '../filters';
import type { Filterable } from '../types/filter';
import './TransactionEditionArea.css';
import Logo from './logo';
import { FormatUtils } from '../utils/formatUtils';

const TransactionEditionArea: React.FC = () => {
  const { t } = useTranslation();
  const { selectedAccount, selectedDate, setSelectedDate, setTransactionsVersion, transactionsVersion, selectedTransactions, setSelectedTransactions } = useAccount();
  const theme = useTheme();
  const primaryColor = theme.palette?.primary?.main || "#D4AF37";

  const [databaseTransactions, setDatabaseTransactions] = useState<Transaction[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<TransactionEditorMode>('create');
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState<Filterable[]>([monthlyViewFilter, nextMonthViewFilter]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | undefined>(undefined);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [isRemoveSelectedDialogOpen, setIsRemoveSelectedDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [searchLabel, setSearchLabel] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const fetchTransactions = useCallback(async () => {
    if (!selectedAccount) {
      return [];
    }
    return await dbService.getTransactionsByAccountId(selectedAccount.id);
  }, [selectedAccount]);

  const refreshTransactions = useCallback(async () => {
    const transactions = await fetchTransactions();
    setDatabaseTransactions(transactions);
  }, [fetchTransactions]);

  useEffect(() => {
    let isMounted = true;
    fetchTransactions().then((transactions) => {
      if (isMounted) {
        setDatabaseTransactions(transactions);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchTransactions, transactionsVersion]);

  const viewableTransactions = useMemo(() => {
    if (databaseTransactions.length === 0) {
      return [];
    }
    filters.forEach(f => f.setup());
    let filtered = [...databaseTransactions];
    filters.forEach(f => {
      if (f.active) {
        filtered = f.apply(filtered);
      }
    });
    if (searchLabel) {
      filtered = filtered.filter(t => t.label.toLowerCase().includes(searchLabel.toLowerCase()));
    }
    return filtered.sort((a, b) => dayjs(a.dueDate).diff(dayjs(b.dueDate)));
  }, [databaseTransactions, filters, searchLabel]);

  const handleFilterChange = (filter: Filterable) => {
    setFilters(prevFilters => {
      const index = prevFilters.findIndex(f => f === filter);
      if (index !== -1) {
        const newFilters = [...prevFilters];
        newFilters[index] = filter;
        return newFilters;
      }
      return prevFilters;
    });
  };

  const handleOpenFilterDialog = () => {
    setIsFilterDialogOpen(true);
  };

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
    await refreshTransactions();
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
      await refreshTransactions();
    }
    setTransactionToDelete(undefined);
    setIsConfirmDialogOpen(false);
  };

  const handleRemoveSelected = () => {
    setConfirmMessage(t('transaction.remove_selected_confirmation'));
    setIsRemoveSelectedDialogOpen(true);
  };

  const handleConfirmRemoveSelected = async () => {
    const selectedIds = selectedTransactions.map(t => t.id);
    await Promise.all(selectedIds.map(id => dbService.deleteTransaction(id)));
    setSelectedTransactions([]);
    setTransactionsVersion(v => v + 1);
    await refreshTransactions();
    setIsRemoveSelectedDialogOpen(false);
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

    handleOpenSnackbar(t('export.success', { count: databaseTransactions.length, filename }), 'success');
    setIsExportDialogOpen(false);
  };

  const handleImportSuccess = (count: number, accountLabel: string) => {
    handleOpenSnackbar(t('import.success', { count, accountLabel }), 'success');
    setTransactionsVersion(v => v + 1);
    refreshTransactions();
  };

  const handleImportError = (message: string) => {
    handleOpenSnackbar(message, 'error');
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleOpenSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleToggleTransaction = (transaction: Transaction) => {
    setSelectedTransactions(prev => {
      const isSelected = prev.some(t => t.id === transaction.id);
      if (isSelected) {
        return prev.filter(t => t.id !== transaction.id);
      }
      return [...prev, transaction];
    });
  };

  const handleToggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    if (newSelectAll) {
      setSelectedTransactions([...viewableTransactions]);
    } else {
      setSelectedTransactions([]);
    }
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
        <TransactionToolbar onAddTransaction={handleAddTransaction} onFilterClick={handleOpenFilterDialog} onRemoveSelected={handleRemoveSelected} disabled={!selectedAccount} hasSelectedTransactions={selectedTransactions.length > 0} searchLabel={searchLabel} onSearchLabelChange={setSearchLabel} />
        <Box className="table-container">
          <Table size="small" sx={{ fontSize: '0.875rem' }} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className="indicator-cell-header" />
                  <TableCell className="checkbox-cell-header">
                    <Checkbox
                      indeterminate={selectedTransactions.length > 0 && selectedTransactions.length < viewableTransactions.length && viewableTransactions.length > 0}
                      checked={selectAll}
                      onChange={handleToggleSelectAll}
                      size="small"
                      aria-label={t('transaction.select_all')}
                      data-testid="select-all-checkbox"
                    />
                  </TableCell>
                  <TableCell>{t('transaction.dueDate')}</TableCell>
                  <TableCell>{t('transaction.label')}</TableCell>
                  <TableCell>{t('transaction.description')}</TableCell>
                  <TableCell align="right">{t('transaction.amount')}</TableCell>
                  <TableCell align="right" className="actions-cell">{t('transaction.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewableTransactions.map((transaction) => {
                  const isToday = dayjs(transaction.dueDate).isSame(dayjs(), 'day');
                  const isSelected = selectedTransactions.some(t => t.id === transaction.id);
                  return (
                    <TableRow key={transaction.id} className={transaction.amount > 0 ? 'row-positive' : 'row-default'}>
                      <TableCell className={`indicator-cell ${isToday ? 'indicator-cell-today' : ''}`} />
                      <TableCell className="checkbox-cell">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleTransaction(transaction)}
                          size="small"
                          aria-label={t('transaction.select')}
                          data-testid={`checkbox-${transaction.id}`}
                        />
                      </TableCell>
                      <TableCell>{FormatUtils.date(transaction.dueDate)}</TableCell>
                      <TableCell>{transaction.label}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell align="right">{FormatUtils.currency(transaction.amount)}</TableCell>
                      <TableCell className="actions-cell" align="right">
                        <IconButton size="small" onClick={() => handleCloneTransaction(transaction)} aria-label="clone transaction"><ContentCopy fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => handleEditTransaction(transaction)} aria-label="edit transaction"><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => handleDeleteTransaction(transaction)} aria-label="delete transaction"><Delete fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {viewableTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
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

      <ConfirmDialog
        open={isRemoveSelectedDialogOpen}
        onClose={() => setIsRemoveSelectedDialogOpen(false)}
        onConfirm={handleConfirmRemoveSelected}
        message={confirmMessage}
      />

      <ExportTransactionDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        transactions={databaseTransactions}
        onExport={handleExport}
      />

      <ImportTransactionDialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={handleImportSuccess}
        onError={handleImportError}
      />

      <TransactionFilterDialog
        open={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
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
