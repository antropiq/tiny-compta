import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { dbService } from './db';
import type { Account } from '../types/account';
import type { Transaction } from '../types/transaction';
import type { Recurring } from '../types/recurring';

describe('DatabaseService', () => {
  beforeEach(async () => {
    await dbService.connect();
  });

  afterEach(async () => {
    // Clear the database between tests
    const accounts = await dbService.getAllAccounts();
    for (const account of accounts) {
      await dbService.deleteAccount(account.id);
    }
    const transactions = await dbService.getAllTransactions();
    for (const tx of transactions) {
      await dbService.deleteTransaction(tx.id);
    }
    const recurrings = await dbService.getAllRecurrings();
    for (const rec of recurrings) {
      await dbService.deleteRecurring(rec.id);
    }
    const settings = await dbService.getAllSettings();
    for (const setting of settings) {
      await dbService.deleteSetting(setting.id);
    }
  });

  it('should add and get an account', async () => {
    const account: Account = { id: 'acc-1', label: 'My Account' };
    await dbService.addAccount(account);
    const retrieved = await dbService.getAccount('acc-1');
    expect(retrieved).toEqual(account);
  });

  it('should get all accounts', async () => {
    const acc1: Account = { id: 'acc-1', label: 'Acc 1' };
    const acc2: Account = { id: 'acc-2', label: 'Acc 2' };
    await dbService.addAccount(acc1);
    await dbService.addAccount(acc2);
    const all = await dbService.getAllAccounts();
    expect(all).toHaveLength(2);
    expect(all).toContainEqual(acc1);
    expect(all).toContainEqual(acc2);
  });

  it('should update an account', async () => {
    const account: Account = { id: 'acc-1', label: 'My Account' };
    await dbService.addAccount(account);
    const updatedAccount: Account = { id: 'acc-1', label: 'Updated Account' };
    await dbService.updateAccount(updatedAccount);
    const retrieved = await dbService.getAccount('acc-1');
    expect(retrieved).toEqual(updatedAccount);
  });

  it('should delete an account and its transactions', async () => {
    const account: Account = { id: 'acc-1', label: 'Acc 1' };
    await dbService.addAccount(account);
    
    const tx: Transaction = {
      id: 'tx-1',
      accountId: 'acc-1',
      label: 'Tx 1',
      amount: 100,
      dueDate: '2023-01-01'
    };
    await dbService.addTransaction(tx);

    await dbService.deleteAccount('acc-1');
    
    const retrievedAcc = await dbService.getAccount('acc-1');
    expect(retrievedAcc).toBeUndefined();
    
    const retrievedTx = await dbService.getTransaction('tx-1');
    expect(retrievedTx).toBeUndefined();
  });

  it('should add and get a transaction', async () => {
    const account: Account = { id: 'acc-1', label: 'Acc 1' };
    await dbService.addAccount(account);
    
    const tx: Transaction = {
      id: 'tx-1',
      accountId: 'acc-1',
      label: 'Tx 1',
      amount: 100,
      dueDate: '2023-01-01'
    };
    await dbService.addTransaction(tx);
    
    const retrieved = await dbService.getTransaction('tx-1');
    expect(retrieved).toEqual(tx);
  });

  it('should get transactions by account id', async () => {
    const acc1: Account = { id: 'acc-1', label: 'Acc 1' };
    const acc2: Account = { id: 'acc-2', label: 'Acc 2' };
    await dbService.addAccount(acc1);
    await dbService.addAccount(acc2);

    const tx1: Transaction = { id: 'tx-1', accountId: 'acc-1', label: 'T1', amount: 10, dueDate: '2023-01-01' };
    const tx2: Transaction = { id: 'tx-2', accountId: 'acc-1', label: 'T2', amount: 20, dueDate: '2023-01-02' };
    const tx3: Transaction = { id: 'tx-3', accountId: 'acc-2', label: 'T3', amount: 30, dueDate: '2023-01-03' };

    await dbService.addTransaction(tx1);
    await dbService.addTransaction(tx2);
    await dbService.addTransaction(tx3);

    const acc1Txs = await dbService.getTransactionsByAccountId('acc-1');
    expect(acc1Txs).toHaveLength(2);
    expect(acc1Txs).toContainEqual(tx1);
    expect(acc1Txs).toContainEqual(tx2);
  });

  it('should update a transaction', async () => {
    const account: Account = { id: 'acc-1', label: 'Acc 1' };
    await dbService.addAccount(account);
    const tx: Transaction = { id: 'tx-1', accountId: 'acc-1', label: 'T1', amount: 10, dueDate: '2023-01-01' };
    await dbService.addTransaction(tx);
    
    const updatedTx: Transaction = { ...tx, label: 'Updated T1' };
    await dbService.updateTransaction(updatedTx);
    
    const retrieved = await dbService.getTransaction('tx-1');
    expect(retrieved).toEqual(updatedTx);
  });

  it('should add and get a setting by key', async () => {
    await dbService.setSetting('test_key', 'test_value');
    const setting = await dbService.getSettingByKey('test_key');
    expect(setting?.key).toBe('test_key');
    expect(setting?.value).toBe('test_value');
  });

  it('should update an existing setting', async () => {
    await dbService.setSetting('test_key', 'test_value');
    await dbService.setSetting('test_key', 'new_value');
    const setting = await dbService.getSettingByKey('test_key');
    expect(setting?.value).toBe('new_value');
  });

  it('should delete a setting', async () => {
    await dbService.setSetting('test_key', 'test_value');
    const setting = await dbService.getSettingByKey('test_key');
    expect(setting).toBeDefined();
    
    await dbService.deleteSetting(setting!.id);
    const retrieved = await dbService.getSettingByKey('test_key');
    expect(retrieved).toBeUndefined();
  });

  it('should add, get and update a recurring payment template', async () => {
    const account: Account = { id: 'acc-1', label: 'Acc 1' };
    await dbService.addAccount(account);

    const recurring: Recurring = {
      id: 'rec-1',
      accountId: 'acc-1',
      label: 'Electricity Subscription',
      amount: -50.5,
      dayOfMonth: 15,
      startDate: '2026-01-01',
    };
    await dbService.addRecurring(recurring);

    const retrieved = await dbService.getRecurring('rec-1');
    expect(retrieved).toEqual(recurring);

    const updated: Recurring = { ...recurring, amount: -55.0 };
    await dbService.updateRecurring(updated);

    const retrievedUpdated = await dbService.getRecurring('rec-1');
    expect(retrievedUpdated?.amount).toBe(-55.0);
  });

  it('should get recurrings by account id', async () => {
    const acc1: Account = { id: 'acc-1', label: 'Acc 1' };
    const acc2: Account = { id: 'acc-2', label: 'Acc 2' };
    await dbService.addAccount(acc1);
    await dbService.addAccount(acc2);

    const rec1: Recurring = { id: 'rec-1', accountId: 'acc-1', label: 'R1', amount: 10, dayOfMonth: 5, startDate: '2026-01-01' };
    const rec2: Recurring = { id: 'rec-2', accountId: 'acc-1', label: 'R2', amount: 20, dayOfMonth: 10, startDate: '2026-01-01' };
    const rec3: Recurring = { id: 'rec-3', accountId: 'acc-2', label: 'R3', amount: 30, dayOfMonth: 15, startDate: '2026-01-01' };

    await dbService.addRecurring(rec1);
    await dbService.addRecurring(rec2);
    await dbService.addRecurring(rec3);

    const acc1Recs = await dbService.getRecurringsByAccountId('acc-1');
    expect(acc1Recs).toHaveLength(2);
    expect(acc1Recs).toContainEqual(rec1);
    expect(acc1Recs).toContainEqual(rec2);
  });

  it('should delete a recurring payment template and cascading delete from account', async () => {
    const account: Account = { id: 'acc-1', label: 'Acc 1' };
    await dbService.addAccount(account);

    const recurring: Recurring = {
      id: 'rec-1',
      accountId: 'acc-1',
      label: 'Electricity Subscription',
      amount: -50.5,
      dayOfMonth: 15,
      startDate: '2026-01-01',
    };
    await dbService.addRecurring(recurring);

    await dbService.deleteRecurring('rec-1');
    const retrieved = await dbService.getRecurring('rec-1');
    expect(retrieved).toBeUndefined();

    // Test cascading delete
    await dbService.addRecurring(recurring);
    await dbService.deleteAccount('acc-1');
    const retrievedCascade = await dbService.getRecurring('rec-1');
    expect(retrievedCascade).toBeUndefined();
  });
});
