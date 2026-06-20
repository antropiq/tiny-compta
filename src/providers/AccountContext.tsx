import { useState, useEffect, type ReactNode } from 'react';
import type { Account } from '../types/account';
import type { Transaction } from '../types/transaction';
import dayjs, { Dayjs } from 'dayjs';
import { dbService } from '../services/db';
import { AccountContext } from '../contexts/AccountContext';

export const AccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedAccount, setSelectedAccountState] = useState<Account | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [transactionsVersion, setTransactionsVersion] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[]>([]);

  const setSelectedAccount = async (account: Account | null) => {
    setSelectedAccountState(account);
    setSelectedDate(dayjs());
    if (account) {
      await dbService.setSetting('selected_account', account.label);
    } else {
      await dbService.setSetting('selected_account', '');
    }
  };

  useEffect(() => {
    const initAccount = async () => {
      try {
        const accounts = await dbService.getAllAccounts();
        const setting = await dbService.getSettingByKey('selected_account');
        let initialized = false;

        if (setting && setting.value) {
          const account = accounts.find(a => a.label === setting.value);
          if (account) {
            setSelectedAccountState(account);
            initialized = true;
          }
        }

        if (!initialized && accounts.length > 0) {
          setSelectedAccountState(accounts[0]);
          await dbService.setSetting('selected_account', accounts[0].label);
        }
      } catch (error) {
        console.error('Error initializing account from settings:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    initAccount();
  }, []);

  return (
    <AccountContext.Provider 
      value={{ 
        selectedAccount, 
        setSelectedAccount, 
        selectedDate, 
        setSelectedDate,
        transactionsVersion,
        setTransactionsVersion,
        isInitializing,
        selectedTransactions,
        setSelectedTransactions
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};
