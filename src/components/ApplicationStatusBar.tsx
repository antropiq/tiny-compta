import React from 'react';
import packageJson from '../../package.json';
import { Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useBalance } from '../hooks/useBalance';
import { useAccount } from '../hooks/useAccount';
import './ApplicationStatusBar.css';

const ApplicationStatusBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { selectedAccount, selectedDate } = useAccount();
  const { balance, hasTransactions } = useBalance();

  const getCurrencySymbol = () => {
    const lang = i18n.language;
    if (lang.startsWith('fr')) {
      return '€';
    }
    return '$';
  };

  const currencySymbol = getCurrencySymbol();
  const formattedDate = (selectedDate || dayjs()).format('DD/MM/YYYY');

  return (
    <Paper component="div" className="status-bar" elevation={1}>
      <div className="status-left">
        {selectedAccount && hasTransactions && (
          t('transaction.balance_status', {
            date: formattedDate,
            amount: balance.toFixed(2),
            currency: currencySymbol
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
