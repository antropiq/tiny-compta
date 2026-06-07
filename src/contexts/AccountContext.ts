import { createContext } from 'react';
import type { Account } from '../types/account';
import type { Dayjs } from 'dayjs';
import type { Transaction } from '../types/transaction';

export interface AccountContextType {
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account | null) => void | Promise<void>;
  selectedDate: Dayjs | null;
  setSelectedDate: (date: Dayjs | null) => void;
  transactionsVersion: number;
  setTransactionsVersion: React.Dispatch<React.SetStateAction<number>>;
  isInitializing: boolean;
  selectedTransactions: Transaction[];
  setSelectedTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export const AccountContext = createContext<AccountContextType | undefined>(undefined);
