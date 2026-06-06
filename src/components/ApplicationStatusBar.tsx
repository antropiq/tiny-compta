import React from 'react';
import packageJson from '../../package.json';
import { Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useBalance } from '../hooks/useBalance';
import { useAccount } from '../hooks/useAccount';
import { FormatUtils } from '../utils/formatUtils';
import './ApplicationStatusBar.css';

const ApplicationStatusBar: React.FC = () => {
  const { t } = useTranslation();
  const { selectedAccount, selectedDate } = useAccount();
  const { balance, hasTransactions } = useBalance();

  const formattedDate = (selectedDate || dayjs()).format('DD/MM/YYYY');
  const formattedBalance = FormatUtils.currency(balance);

  return (
    <Paper component="div" className="status-bar" elevation={1}>
      <div className="status-left">
        {selectedAccount && hasTransactions && (
          t('transaction.balance_status', {
            date: formattedDate,
            balance: formattedBalance
          })
        )}
      </div>
      <span className="status-label">
        Tiny compta version @{packageJson.version}
      </span>
    </Paper>
  );
};

export default ApplicationStatusBar;
