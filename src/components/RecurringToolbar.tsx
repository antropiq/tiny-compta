import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Add, PlayArrow } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface RecurringToolbarProps {
  onAddRecurring: () => void;
  onApplyToSelectedMonth: () => void;
  disabled?: boolean;
}

const RecurringToolbar: React.FC<RecurringToolbarProps> = ({
  onAddRecurring,
  onApplyToSelectedMonth,
  disabled,
}) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
      <Tooltip title={t('recurring.create')}>
        <span style={{ display: 'inline-block' }}>
          <IconButton
            onClick={onAddRecurring}
            color="primary"
            disabled={disabled}
            aria-label={t('recurring.create')}
          >
            <Add />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('recurring.apply_to_selected_month')}>
        <span style={{ display: 'inline-block' }}>
          <IconButton
            onClick={onApplyToSelectedMonth}
            color="secondary"
            disabled={disabled}
            aria-label={t('recurring.apply_to_selected_month')}
          >
            <PlayArrow />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export default RecurringToolbar;
