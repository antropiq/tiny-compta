import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Account } from '../types/account';
import type { Transaction } from '../types/transaction';
import type { Recurring } from '../types/recurring';
import type { Setting } from '../types/settings';
import { UuidUtils } from '../utils/uuidUtils';

interface MyDB extends DBSchema {
  accounts: {
    key: string;
    value: Account;
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-account': string };
  };
  recurrings: {
    key: string;
    value: Recurring;
    indexes: { 'by-account': string };
  };
  settings: {
    key: string;
    value: Setting;
    indexes: { 'by-key': string };
  };
}

const DB_NAME = 'TinyComptaDB';
const DB_VERSION = 3;

export const initDB = async () => {
  return openDB<MyDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionStore.createIndex('by-account', 'accountId');
        }
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
          settingsStore.createIndex('by-key', 'key');

          const defaultSettings: Setting[] = [
            { id: UuidUtils.generate(), key: 'selected_account', value: '' },
            { id: UuidUtils.generate(), key: 'selected_language', value: 'fr' },
          ];
          for (const setting of defaultSettings) {
            settingsStore.put(setting);
          }
        }
      }
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains('recurrings')) {
          const recurringStore = db.createObjectStore('recurrings', { keyPath: 'id' });
          recurringStore.createIndex('by-account', 'accountId');
        }
      }
    },
  });
};

export class DatabaseService {
  private db!: IDBPDatabase<MyDB>;

  async connect() {
    if (!this.db) {
      this.db = await initDB();
    }
  }

  private async ensureConnected() {
    if (!this.db) {
      await this.connect();
    }
  }

  // Account CRUD
  async getAccount(id: string): Promise<Account | undefined> {
    await this.ensureConnected();
    return this.db.get('accounts', id);
  }

  async getAllAccounts(): Promise<Account[]> {
    await this.ensureConnected();
    return this.db.getAll('accounts');
  }

  async addAccount(account: Account): Promise<Account> {
    await this.ensureConnected();
    await this.db.put('accounts', account);
    return account;
  }

  async updateAccount(account: Account): Promise<void> {
    await this.ensureConnected();
    await this.db.put('accounts', account);
  }

  async deleteAccount(id: string): Promise<void> {
    await this.ensureConnected();
    
    // Cascading delete: find all transactions for this account and delete them
    const txs = await this.getTransactionsByAccountId(id);
    for (const tx of txs) {
      await this.db.delete('transactions', tx.id);
    }

    // Cascading delete: find all recurrings for this account and delete them
    const recurrings = await this.getRecurringsByAccountId(id);
    for (const rec of recurrings) {
      await this.db.delete('recurrings', rec.id);
    }
    
    await this.db.delete('accounts', id);
  }

  // Transaction CRUD
  async getTransaction(id: string): Promise<Transaction | undefined> {
    await this.ensureConnected();
    return this.db.get('transactions', id);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    await this.ensureConnected();
    return this.db.getAll('transactions');
  }

  async getTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
    await this.ensureConnected();
    return this.db.getAllFromIndex('transactions', 'by-account', accountId);
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    await this.ensureConnected();
    await this.db.put('transactions', transaction);
  }

  async updateTransaction(transaction: Transaction): Promise<void> {
    await this.ensureConnected();
    await this.db.put('transactions', transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.ensureConnected();
    await this.db.delete('transactions', id);
  }

  // Recurring CRUD
  async getRecurring(id: string): Promise<Recurring | undefined> {
    await this.ensureConnected();
    return this.db.get('recurrings', id);
  }

  async getAllRecurrings(): Promise<Recurring[]> {
    await this.ensureConnected();
    return this.db.getAll('recurrings');
  }

  async getRecurringsByAccountId(accountId: string): Promise<Recurring[]> {
    await this.ensureConnected();
    return this.db.getAllFromIndex('recurrings', 'by-account', accountId);
  }

  async addRecurring(recurring: Recurring): Promise<void> {
    await this.ensureConnected();
    await this.db.put('recurrings', recurring);
  }

  async updateRecurring(recurring: Recurring): Promise<void> {
    await this.ensureConnected();
    await this.db.put('recurrings', recurring);
  }

  async deleteRecurring(id: string): Promise<void> {
    await this.ensureConnected();
    await this.db.delete('recurrings', id);
  }

  // Settings CRUD
  async getSettingByKey(key: string): Promise<Setting | undefined> {
    await this.ensureConnected();
    return this.db.getFromIndex('settings', 'by-key', key);
  }

  async getAllSettings(): Promise<Setting[]> {
    await this.ensureConnected();
    return this.db.getAll('settings');
  }

  async updateSetting(setting: Setting): Promise<void> {
    await this.ensureConnected();
    await this.db.put('settings', setting);
  }

  async deleteSetting(id: string): Promise<void> {
    await this.ensureConnected();
    await this.db.delete('settings', id);
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.ensureConnected();
    const existing = await this.getSettingByKey(key);
    if (existing) {
      await this.updateSetting({ ...existing, value });
    } else {
      await this.db.put('settings', {
        id: UuidUtils.generate(),
        key,
        value,
      });
    }
  }
}

export const dbService = new DatabaseService();
