import React from 'react';
import packageJson from '../../package.json';
import { Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useBalance } from '../hooks/useBalance';
import { useAccount } from '../hooks/useAccount';
import { FormatUtils } from '../utils/formatUtils';
import type { Recurring } from '../types/recurring';
import './ApplicationStatusBar.css';

interface ApplicationStatusBarProps {
  activeTab: number;
  recurrings: Recurring[];
}

const ApplicationStatusBar: React.FC<ApplicationStatusBarProps> = ({ activeTab, recurrings }) => {
  const { t } = useTranslation();
  const { selectedAccount, selectedDate, selectedTransactions } = useAccount();
  const { balance, hasTransactions } = useBalance();

  const formattedDate = (selectedDate || dayjs()).format('DD/MM/YYYY');
  const formattedBalance = FormatUtils.currency(balance);
  const selectedSum = selectedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const formattedSelectedSum = FormatUtils.currency(selectedSum);
  const today = dayjs().format('YYYY-MM-DD');
  const activeRecurrings = recurrings.filter(r => !r.endDate || r.endDate >= today);
  const recurringSum = activeRecurrings.reduce((sum, r) => sum + r.amount, 0);
  const formattedRecurringSum = FormatUtils.currency(recurringSum);

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
      <div className="status-center">
        {activeTab === 2 && recurrings.length > 0 && (
          t('recurring.sum', {
            sum: formattedRecurringSum
          })
        )}
        {selectedTransactions.length > 0 && (
          t('transaction.selected_sum', {
            sum: formattedSelectedSum
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
