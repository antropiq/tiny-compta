import React, { useState, useMemo } from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Checkbox } from '@mui/material';
import { ContentCopy, Edit, Delete } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Transaction } from '../types/transaction';
import { useAccount } from '../hooks/useAccount';
import { dbService } from '../services/db';
import TransactionEditor from './TransactionEditor';
import type { TransactionEditorMode } from './TransactionEditor';
import TransactionToolbar from './TransactionToolbar';
import ConfirmDialog from './ConfirmDialog';
import TransactionFilterDialog from './TransactionFilterDialog';
import TransactionCloningDialog from './TransactionCloningDialog';
import { monthlyViewFilter, nextMonthViewFilter } from '../filters';
import type { Filterable } from '../types/filter';
import { FormatUtils } from '../utils/formatUtils';
import { UuidUtils } from '../utils/uuidUtils';
import { handleRangeSelection } from '../utils/selectionUtils';

interface TransactionsTabProps {
  databaseTransactions: Transaction[];
  onTransactionsChanged: () => void;
  onOpenSnackbar: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  databaseTransactions,
  onTransactionsChanged,
  onOpenSnackbar,
}) => {
  const { t } = useTranslation();
  const { selectedAccount, selectedTransactions, setSelectedTransactions } = useAccount();

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
  const [searchLabel, setSearchLabel] = useState('');
  const [selectAll, setSelectAll] = useState(false);

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
    onTransactionsChanged();
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setConfirmMessage(t('transaction.delete_confirmation'));
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDelete) {
      await dbService.deleteTransaction(transactionToDelete.id);
      onTransactionsChanged();
    }
    setTransactionToDelete(undefined);
    setIsConfirmDialogOpen(false);
  };

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
    onTransactionsChanged();
    onOpenSnackbar(t('transaction.clone_success', { count: newTransactions.length }), 'success');
  };

  const handleConfirmRemoveSelected = async () => {
    const selectedIds = selectedTransactions.map(t => t.id);
    await Promise.all(selectedIds.map(id => dbService.deleteTransaction(id)));
    setSelectedTransactions([]);
    onTransactionsChanged();
    setIsRemoveSelectedDialogOpen(false);
  };

  const handleToggleTransaction = (transaction: Transaction, event: React.ChangeEvent<HTMLInputElement>) => {
    const clickedIndex = viewableTransactions.findIndex(t => t.id === transaction.id);

    if ((event.nativeEvent as unknown as MouseEvent).shiftKey) {
      const newSelection = handleRangeSelection(viewableTransactions, selectedTransactions, clickedIndex);
      setSelectedTransactions(newSelection);
    } else {
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
    </>
  );
};

export default TransactionsTab;
