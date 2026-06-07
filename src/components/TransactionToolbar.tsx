import React from 'react';
import { Box, IconButton, TextField, Tooltip } from '@mui/material';
import { Add, Clear, CopyAll, DeleteSweep, FilterList } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '../types/transaction';

interface TransactionToolbarProps {
  onAddTransaction: () => void;
  onFilterClick?: () => void;
  onRemoveSelected?: () => void;
  onCloneSelected?: (transaction: Transaction) => void;
  disabled?: boolean;
  hasSelectedTransactions?: boolean;
  selectedTransactionsCount?: number;
  selectedTransactions?: Transaction[];
  searchLabel?: string;
  onSearchLabelChange?: (value: string) => void;
}

const TransactionToolbar: React.FC<TransactionToolbarProps> = ({ onAddTransaction, onFilterClick, onRemoveSelected, onCloneSelected, disabled, hasSelectedTransactions = false, selectedTransactionsCount = 0, selectedTransactions = [], searchLabel = '', onSearchLabelChange }) => {
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchLabelChange?.(e.target.value);
  };

  const handleClear = () => {
    onSearchLabelChange?.('');
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', justifyContent: 'center' }}>
      <Tooltip title={t('transaction.create')}>
        <span style={{ display: 'inline-block' }}>
          <IconButton
            onClick={onAddTransaction}
            color="primary"
            disabled={disabled}
            aria-label={t('transaction.create')}
          >
            <Add />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('transaction.filter')}>
        <IconButton color="inherit" onClick={onFilterClick}>
          <FilterList />
        </IconButton>
      </Tooltip>
      <TextField
        size="small"
        placeholder={t('transaction.search_by_label')}
        value={searchLabel}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            handleClear();
          }
        }}
        slotProps={{
          input: {
            endAdornment: searchLabel ? (
              <IconButton size="small" onClick={handleClear} aria-label="clear search" data-testid="clear-search">
                <Clear fontSize="small" />
              </IconButton>
            ) : null,
          },
        }}
        sx={{ maxWidth: 300, flexGrow: 1 }}
      />
      <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
        <Tooltip title={t('transaction.clone_selected')}>
          <span>
            <IconButton
              onClick={() => onCloneSelected?.(selectedTransactions[0])}
              color="primary"
              disabled={selectedTransactionsCount !== 1}
              aria-label={t('transaction.clone_selected')}
            >
              <CopyAll />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('transaction.remove_selected')}>
          <span>
            <IconButton
              onClick={onRemoveSelected}
              color="error"
              disabled={!hasSelectedTransactions}
              aria-label={t('transaction.remove_selected')}
            >
              <DeleteSweep />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default TransactionToolbar;
