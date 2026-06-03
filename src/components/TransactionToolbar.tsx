import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Add, Search, FilterList } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface TransactionToolbarProps {
  onAddTransaction: () => void;
  onFilterClick?: () => void;
  disabled?: boolean;
}

const TransactionToolbar: React.FC<TransactionToolbarProps> = ({ onAddTransaction, onFilterClick, disabled }) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
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
      <Tooltip title={t('transaction.search')}>
        <IconButton color="inherit">
          <Search />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('transaction.filter')}>
        <IconButton color="inherit" onClick={onFilterClick}>
          <FilterList />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default TransactionToolbar;
