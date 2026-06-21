import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, IconButton, Tooltip, Snackbar, Alert, useTheme, Tabs, Tab, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { Download, Upload, Brightness4, Brightness7 } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Transaction } from '../types/transaction';
import type { Recurring } from '../types/recurring';
import { useAccount } from '../hooks/useAccount';
import { dbService } from '../services/db';
import { useAppTheme } from '../providers/ThemeContext';
import AccountList from './AccountList';
import RecurringApplyPromptDialog from './RecurringApplyPromptDialog';
import ExportTransactionDialog from './ExportTransactionDialog';
import ImportTransactionDialog from './ImportTransactionDialog';
import ExportRecurringDialog from './ExportRecurringDialog';
import ImportRecurringDialog from './ImportRecurringDialog';
import DashboardTab from './DashboardTab';
import TransactionsTab from './TransactionsTab';
import RecurringsTab from './RecurringsTab';
import './TransactionEditionArea.css';
import Logo from './logo';
import { RecurringUtils } from '../utils/recurringUtils';

interface TransactionEditionAreaProps {
  activeTab: number;
  onActiveTabChange: (tab: number) => void;
  recurrings: Recurring[];
  onRecurringsChange: (recurrings: Recurring[]) => void;
}

const TransactionEditionArea: React.FC<TransactionEditionAreaProps> = ({
  activeTab,
  onActiveTabChange,
  recurrings: parentRecurrings,
  onRecurringsChange,
}) => {
  const { t, i18n } = useTranslation();
  const { selectedAccount, selectedDate, setSelectedDate, setTransactionsVersion, transactionsVersion } = useAccount();
  const theme = useTheme();
  const { mode, toggleTheme } = useAppTheme();
  const primaryColor = theme.palette?.primary?.main || "#D4AF37";

  const handleLanguageChange = async (event: SelectChangeEvent) => {
    const newLang = event.target.value;
    await dbService.setSetting('selected_language', newLang);
    window.location.reload();
  };

  const [databaseTransactions, setDatabaseTransactions] = useState<Transaction[]>([]);
  const [recurringsVersion, setRecurringsVersion] = useState(0);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });


  const [isApplyPromptOpen, setIsApplyPromptOpen] = useState(false);
  const [applyPromptMonth, setApplyPromptMonth] = useState('');
  const [applyPromptMonthName, setApplyPromptMonthName] = useState('');

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleOpenSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

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
        onRecurringsChange(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [fetchRecurrings, recurringsVersion, onRecurringsChange]);

  const applyRecurringsForMonth = useCallback(async (monthStr: string) => {
    if (!selectedAccount) return;
    const accountRecurrings = await dbService.getRecurringsByAccountId(selectedAccount.id);
    if (accountRecurrings.length === 0) return;

    const generatedTxs = RecurringUtils.generateTransactionsForMonth(accountRecurrings, monthStr);
    
    // Fetch all existing transactions for this account and filter for the target month
    const allTxs = await dbService.getTransactionsByAccountId(selectedAccount.id);
    const existingMonthRecurringTxs = allTxs.filter(tx => 
      tx.dueDate.startsWith(monthStr) && tx.recurringId !== undefined
    );

    const generatedRecurringIds = new Set(generatedTxs.map(tx => tx.recurringId));

    // 1. Delete transactions that are no longer in the generated recurrings list
    const txsToDelete = existingMonthRecurringTxs.filter(tx => !generatedRecurringIds.has(tx.recurringId));
    for (const tx of txsToDelete) {
      await dbService.deleteTransaction(tx.id);
    }

    // 2. Add or update transactions
    for (const genTx of generatedTxs) {
      const existingTx = existingMonthRecurringTxs.find(tx => tx.recurringId === genTx.recurringId);
      if (existingTx) {
        // If modified, update
        if (
          existingTx.label !== genTx.label ||
          existingTx.description !== genTx.description ||
          existingTx.amount !== genTx.amount ||
          existingTx.dueDate !== genTx.dueDate
        ) {
          const updatedTx = {
            ...existingTx,
            label: genTx.label,
            description: genTx.description,
            amount: genTx.amount,
            dueDate: genTx.dueDate,
          };
          await dbService.updateTransaction(updatedTx);
        }
      } else {
        // Add new
        await dbService.addTransaction(genTx);
      }
    }

    const appliedKey = `applied_recurrings_${selectedAccount.id}_${monthStr}`;
    await dbService.setSetting(appliedKey, 'true');

    setTransactionsVersion(v => v + 1);
    await refreshTransactions();

    handleOpenSnackbar(t('recurring.apply_success', { date: monthStr }), 'success');
  }, [selectedAccount, t, setTransactionsVersion, refreshTransactions, handleOpenSnackbar]);

  const checkAutoApplyRecurrings = useCallback(async () => {
    if (!selectedAccount) return;

    const accountRecurrings = await dbService.getRecurringsByAccountId(selectedAccount.id);
    if (accountRecurrings.length === 0) return;

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

  const handleRecurringExport = (data: string, filename: string, type: 'json' | 'csv') => {
    const blob = new Blob([data], { type: type === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    handleOpenSnackbar(t('recurring.export_success', { count: parentRecurrings.length, filename }), 'success');
    setIsExportDialogOpen(false);
  };

  const handleRecurringImportSuccess = (count: number, accountLabel: string) => {
    handleOpenSnackbar(t('recurring.import_success', { count, accountLabel }), 'success');
    setRecurringsVersion(v => v + 1);
  };

  const handleRecurringImportError = (message: string) => {
    handleOpenSnackbar(message, 'error');
  };

  const handleTransactionsChanged = useCallback(() => {
    setTransactionsVersion(v => v + 1);
    refreshTransactions();
  }, [setTransactionsVersion, refreshTransactions]);

  const handleRecurringsChanged = useCallback(() => {
    setRecurringsVersion(v => v + 1);
  }, []);

  return (
    <Box className="transaction-edition-area">
      <Paper className="left-container" elevation={0} variant="outlined" >
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', width: '100%', borderBottom: '1px solid', borderColor: 'divider', mb: 1 }}>
          <AccountList />
        </Box>
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, pb: 1 }}>
          <Select
            value={i18n.language}
            onChange={handleLanguageChange}
            size="small"
            sx={{ minWidth: 90, height: 32, fontSize: '0.85rem' }}
          >
            <MenuItem value="fr" sx={{ fontSize: '0.85rem' }}>{t('header.languages.fr')}</MenuItem>
            <MenuItem value="en" sx={{ fontSize: '0.85rem' }}>{t('header.languages.en')}</MenuItem>
          </Select>

          <IconButton onClick={toggleTheme} size="small" color="inherit">
            {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
          </IconButton>

          <Tooltip title={activeTab === 2 ? t('recurring.export_title') : t('export.title')}>
            <IconButton onClick={() => setIsExportDialogOpen(true)} disabled={!selectedAccount || activeTab === 0} size="small">
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={activeTab === 2 ? t('recurring.import_title') : t('import.title')}>
            <IconButton onClick={() => setIsImportDialogOpen(true)} disabled={!selectedAccount || activeTab === 0} size="small">
              <Upload fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <Paper className="right-container" elevation={0} variant="outlined">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(_e, newValue) => onActiveTabChange(newValue)} aria-label="tabs">
            <Tab label={t('tabs.dashboard')} />
            <Tab label={t('tabs.transactions')} />
            <Tab label={t('tabs.recurrings')} />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <DashboardTab />
        )}

        {activeTab === 1 && (
          <TransactionsTab
            databaseTransactions={databaseTransactions}
            onTransactionsChanged={handleTransactionsChanged}
            onOpenSnackbar={handleOpenSnackbar}
          />
        )}

        {activeTab === 2 && (
          <RecurringsTab
            recurrings={parentRecurrings}
            onRecurringsChanged={handleRecurringsChanged}
            onTransactionsChanged={handleTransactionsChanged}
            applyRecurringsForMonth={applyRecurringsForMonth}
          />
        )}
      </Paper>

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
        open={isExportDialogOpen && activeTab === 1}
        onClose={() => setIsExportDialogOpen(false)}
        transactions={databaseTransactions}
        onExport={handleExport}
      />

      <ImportTransactionDialog
        open={isImportDialogOpen && activeTab === 1}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={handleImportSuccess}
        onError={handleImportError}
      />

      <ExportRecurringDialog
        open={isExportDialogOpen && activeTab === 2}
        onClose={() => setIsExportDialogOpen(false)}
        recurrings={parentRecurrings}
        onExport={handleRecurringExport}
      />

      <ImportRecurringDialog
        open={isImportDialogOpen && activeTab === 2}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={handleRecurringImportSuccess}
        onError={handleRecurringImportError}
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
