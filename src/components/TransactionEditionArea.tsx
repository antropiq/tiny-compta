import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip, Snackbar, Alert, useTheme, Checkbox, Tabs, Tab } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { ContentCopy, Edit, Delete, Download, Upload } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Transaction } from '../types/transaction';
import type { Recurring } from '../types/recurring';
import { useAccount } from '../hooks/useAccount';
import { dbService } from '../services/db';
import TransactionEditor from './TransactionEditor';
import type { TransactionEditorMode } from './TransactionEditor';
import TransactionToolbar from './TransactionToolbar';
import RecurringToolbar from './RecurringToolbar';
import RecurringEditor from './RecurringEditor';
import RecurringDeleteCascadeDialog from './RecurringDeleteCascadeDialog';
import RecurringUpdateCascadeDialog from './RecurringUpdateCascadeDialog';
import RecurringApplyPromptDialog from './RecurringApplyPromptDialog';
import ConfirmDialog from './ConfirmDialog';
import ExportTransactionDialog from './ExportTransactionDialog';
import ImportTransactionDialog from './ImportTransactionDialog';
import TransactionFilterDialog from './TransactionFilterDialog';
import TransactionCloningDialog from './TransactionCloningDialog';
import { monthlyViewFilter, nextMonthViewFilter } from '../filters';
import type { Filterable } from '../types/filter';
import './TransactionEditionArea.css';
import Logo from './logo';
import { FormatUtils } from '../utils/formatUtils';
import { UuidUtils } from '../utils/uuidUtils';
import { handleRangeSelection } from '../utils/selectionUtils';
import { RecurringUtils } from '../utils/recurringUtils';

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
  const [isCloningDialogOpen, setIsCloningDialogOpen] = useState(false);
  const [transactionToClone, setTransactionToClone] = useState<Transaction | undefined>(undefined);
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

  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [recurrings, setRecurrings] = useState<Recurring[]>([]);
  const [recurringsVersion, setRecurringsVersion] = useState(0);
  const [isRecurringEditorOpen, setIsRecurringEditorOpen] = useState(false);
  const [recurringEditorMode, setRecurringEditorMode] = useState<'create' | 'edit'>('create');
  const [recurringToEdit, setRecurringToEdit] = useState<Recurring | undefined>(undefined);
  const [isRecurringDeleteCascadeOpen, setIsRecurringDeleteCascadeOpen] = useState(false);
  const [recurringToDelete, setRecurringToDelete] = useState<Recurring | undefined>(undefined);
  const [isRecurringUpdateCascadeOpen, setIsRecurringUpdateCascadeOpen] = useState(false);
  const [tempRecurringUpdateData, setTempRecurringUpdateData] = useState<Recurring | undefined>(undefined);
  const [isApplyPromptOpen, setIsApplyPromptOpen] = useState(false);
  const [applyPromptMonth, setApplyPromptMonth] = useState('');
  const [applyPromptMonthName, setApplyPromptMonthName] = useState('');

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

  const fetchRecurrings = useCallback(async () => {
    if (!selectedAccount) {
      return [];
    }
    return await dbService.getRecurringsByAccountId(selectedAccount.id);
  }, [selectedAccount]);

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

  useEffect(() => {
    let isMounted = true;
    fetchRecurrings().then((data) => {
      if (isMounted) {
        setRecurrings(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchRecurrings, recurringsVersion]);

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
      setRecurringsVersion(v => v + 1);
    } else {
      if (recurringToEdit && recurringToEdit.amount !== newRecurring.amount) {
        setTempRecurringUpdateData(newRecurring);
        setIsRecurringUpdateCascadeOpen(true);
      } else {
        await dbService.updateRecurring(newRecurring);
        setRecurringsVersion(v => v + 1);
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
      setTransactionsVersion(v => v + 1);
      await refreshTransactions();
    }

    setRecurringsVersion(v => v + 1);
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
      setTransactionsVersion(v => v + 1);
      await refreshTransactions();
    } else if (action === 'keep') {
      const accountTxs = await dbService.getTransactionsByAccountId(recurringToDelete.accountId);
      const linkedTxs = accountTxs.filter(tx => tx.recurringId === recurringToDelete.id);
      for (const tx of linkedTxs) {
        await dbService.updateTransaction({
          ...tx,
          recurringId: undefined,
        });
      }
      setTransactionsVersion(v => v + 1);
      await refreshTransactions();
    }

    await dbService.deleteRecurring(recurringToDelete.id);
    setRecurringsVersion(v => v + 1);

    setRecurringToDelete(undefined);
    setIsRecurringDeleteCascadeOpen(false);
  };

  const applyRecurringsForMonth = async (monthStr: string) => {
    if (!selectedAccount) return;
    const accountRecurrings = await dbService.getRecurringsByAccountId(selectedAccount.id);
    if (accountRecurrings.length === 0) return;

    const generatedTxs = RecurringUtils.generateTransactionsForMonth(accountRecurrings, monthStr);
    for (const tx of generatedTxs) {
      await dbService.addTransaction(tx);
    }

    const appliedKey = `applied_recurrings_${selectedAccount.id}_${monthStr}`;
    await dbService.setSetting(appliedKey, 'true');

    setTransactionsVersion(v => v + 1);
    await refreshTransactions();

    handleOpenSnackbar(t('recurring.apply_success', { date: monthStr }), 'success');
  };

  const handleApplyRecurringsToSelectedMonth = async () => {
    if (!selectedAccount || !selectedDate) return;
    const monthStr = selectedDate.format('YYYY-MM');
    await applyRecurringsForMonth(monthStr);
  };

  const checkAutoApplyRecurrings = useCallback(async () => {
    if (!selectedAccount) return;

    const today = dayjs();
    const currentMonthStr = today.format('YYYY-MM');
    const currentMonthKey = `applied_recurrings_${selectedAccount.id}_${currentMonthStr}`;

    const currentMonthSetting = await dbService.getSettingByKey(currentMonthKey);
    if (!currentMonthSetting || currentMonthSetting.value !== 'true') {
      setApplyPromptMonth(currentMonthStr);
      setApplyPromptMonthName(today.locale(i18n.language).format('MMMM YYYY'));
      setIsApplyPromptOpen(true);
      return;
    }

    const daysInMonth = today.daysInMonth();
    const isLast5Days = today.date() > (daysInMonth - 5);
    if (isLast5Days) {
      const nextMonth = today.add(1, 'month');
      const nextMonthStr = nextMonth.format('YYYY-MM');
      const nextMonthKey = `applied_recurrings_${selectedAccount.id}_${nextMonthStr}`;
      const nextMonthSetting = await dbService.getSettingByKey(nextMonthKey);
      if (!nextMonthSetting || nextMonthSetting.value !== 'true') {
        setApplyPromptMonth(nextMonthStr);
        setApplyPromptMonthName(nextMonth.locale(i18n.language).format('MMMM YYYY'));
        setIsApplyPromptOpen(true);
      }
    }
  }, [selectedAccount, i18n.language]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAutoApplyRecurrings();
  }, [selectedAccount, checkAutoApplyRecurrings]);

  const handleRemoveSelected = () => {
    setConfirmMessage(t('transaction.remove_selected_confirmation'));
    setIsRemoveSelectedDialogOpen(true);
  };

  const handleCloneSelected = (transaction: Transaction) => {
    if (selectedTransactions.length === 1) {
      setTransactionToClone(transaction);
      setIsCloningDialogOpen(true);
    }
  };

  const handleConfirmCloning = async (targetDate: dayjs.Dayjs) => {
    if (!selectedAccount || selectedTransactions.length !== 1) return;

    const source = selectedTransactions[0];
    const sourceDate = dayjs(source.dueDate);
    const target = dayjs(targetDate);

    // Calculate the number of months between source and target
    const monthsDiff = target.year() * 12 + target.month() - (sourceDate.year() * 12 + sourceDate.month());

    const newTransactions: Transaction[] = [];
    for (let i = 1; i <= monthsDiff; i++) {
      const clonedDate = sourceDate.add(i, 'month');
      newTransactions.push({
        id: UuidUtils.generate(),
        accountId: selectedAccount.id,
        label: source.label,
        description: source.description,
        amount: source.amount,
        dueDate: clonedDate.format('YYYY-MM-DD'),
      });
    }

    await Promise.all(newTransactions.map(tx => dbService.addTransaction(tx)));
    setSelectedTransactions([]);
    setTransactionsVersion(v => v + 1);
    await refreshTransactions();
    handleOpenSnackbar(t('transaction.clone_success', { count: newTransactions.length }), 'success');
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

  const handleToggleTransaction = (transaction: Transaction, event: React.ChangeEvent<HTMLInputElement>) => {
    const clickedIndex = viewableTransactions.findIndex(t => t.id === transaction.id);

    if ((event.nativeEvent as unknown as MouseEvent).shiftKey) {
      const newSelection = handleRangeSelection(viewableTransactions, selectedTransactions, clickedIndex);
      setSelectedTransactions(newSelection);
    } else {
      // Normal toggle
      setSelectedTransactions(prev => {
        const isSelected = prev.some(t => t.id === transaction.id);
        if (isSelected) {
          return prev.filter(t => t.id !== transaction.id);
        }
        return [...prev, transaction];
      });
    }
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(_e, newValue) => setActiveTab(newValue)} aria-label="tabs">
            <Tab label={t('tabs.transactions')} />
            <Tab label={t('tabs.recurrings')} />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <>
            <TransactionToolbar 
              onAddTransaction={handleAddTransaction} 
              onFilterClick={handleOpenFilterDialog} 
              onRemoveSelected={handleRemoveSelected}
              onCloneSelected={handleCloneSelected}
              disabled={!selectedAccount} 
              hasSelectedTransactions={selectedTransactions.length > 0}
              selectedTransactionsCount={selectedTransactions.length}
              searchLabel={searchLabel} 
              onSearchLabelChange={setSearchLabel} 
            />
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
                              onChange={(e) => handleToggleTransaction(transaction, e)}
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
          </>
        )}

        {activeTab === 1 && (
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
                  {recurrings.map((rec) => {
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
                  {recurrings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        {selectedAccount ? t('transaction.no_transactions') : t('account.select')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </>
        )}
      </Paper>

      <TransactionEditor
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveTransaction}
        mode={editorMode}
        transaction={transactionToEdit}
        accountId={selectedAccount?.id || ''}
      />

      <RecurringEditor
        open={isRecurringEditorOpen}
        onClose={() => setIsRecurringEditorOpen(false)}
        onSave={handleSaveRecurring}
        mode={recurringEditorMode}
        recurring={recurringToEdit}
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

      <RecurringApplyPromptDialog
        open={isApplyPromptOpen}
        onClose={() => setIsApplyPromptOpen(false)}
        onConfirm={() => {
          applyRecurringsForMonth(applyPromptMonth);
          setIsApplyPromptOpen(false);
        }}
        monthName={applyPromptMonthName}
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

      <TransactionCloningDialog
        open={isCloningDialogOpen}
        onClose={() => setIsCloningDialogOpen(false)}
        onConfirm={handleConfirmCloning}
        sourceTransaction={transactionToClone || selectedTransactions[0]}
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
