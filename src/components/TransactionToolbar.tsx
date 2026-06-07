import React from 'react';
import { Box, IconButton, TextField, Tooltip } from '@mui/material';
import { Add, Clear, FilterList } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface TransactionToolbarProps {
  onAddTransaction: () => void;
  onFilterClick?: () => void;
  disabled?: boolean;
  searchLabel?: string;
  onSearchLabelChange?: (value: string) => void;
}

const TransactionToolbar: React.FC<TransactionToolbarProps> = ({ onAddTransaction, onFilterClick, disabled, searchLabel = '', onSearchLabelChange }) => {
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
    </Box>
  );
};

export default TransactionToolbar;
