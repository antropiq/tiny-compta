import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useAccount } from './useAccount';
import { dbService } from '../services/db';

export const useBalance = () => {
  const { selectedAccount, selectedDate, transactionsVersion } = useAccount();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasTransactions, setHasTransactions] = useState<boolean>(false);

  useEffect(() => {
    const calculateBalance = async () => {
      if (!selectedAccount || !selectedDate) {
        setBalance(0);
        setHasTransactions(false);
        return;
      }

      setLoading(true);
      try {
        const transactions = await dbService.getTransactionsByAccountId(selectedAccount.id);
        
        setHasTransactions(transactions.length > 0);

        const endLimit = selectedDate.endOf('day');
        
        const total = transactions.reduce((acc, tx) => {
          const txDate = dayjs(tx.dueDate);
          if (txDate.isBefore(endLimit) || txDate.isSame(endLimit, 'day')) {
            return acc + tx.amount;
          }
          return acc;
        }, 0);

        setBalance(total);
      } catch (error) {
        console.error('Error calculating balance:', error);
        setBalance(0);
        setHasTransactions(false);
      } finally {
        setLoading(false);
      }
    };

    calculateBalance();
  }, [selectedAccount, selectedDate, transactionsVersion]);

  return { balance, loading, hasTransactions };
};
