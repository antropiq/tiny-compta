import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { dbService } from './db';
import type { Account } from '../types/account';
import type { Transaction } from '../types/transaction';

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
});
