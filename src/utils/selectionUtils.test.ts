import { describe, it, expect } from 'vitest';
import type { Transaction } from '../types/transaction';
import { handleRangeSelection } from './selectionUtils';

const createTransaction = (id: string, label: string): Transaction => ({
  id,
  accountId: 'acc-1',
  label,
  amount: 100,
  dueDate: '2024-01-01',
});

const tx1 = createTransaction('tx1', 'Transaction 1');
const tx2 = createTransaction('tx2', 'Transaction 2');
const tx3 = createTransaction('tx3', 'Transaction 3');
const tx4 = createTransaction('tx4', 'Transaction 4');
const tx5 = createTransaction('tx5', 'Transaction 5');

const viewableTransactions = [tx1, tx2, tx3, tx4, tx5];

describe('handleRangeSelection', () => {
  it('range selection forward: tx1 selected, click tx3 -> selects tx1, tx2, tx3', () => {
    const selected = handleRangeSelection(viewableTransactions, [tx1], 2);
    const ids = selected.map(t => t.id);
    expect(ids).toEqual(['tx1', 'tx2', 'tx3']);
  });

  it('range selection backward: tx3 selected, click tx1 -> selects tx1, tx2, tx3', () => {
    const selected = handleRangeSelection(viewableTransactions, [tx3], 0);
    const ids = selected.map(t => t.id);
    expect(ids).toEqual(['tx1', 'tx2', 'tx3']);
  });

  it('single selection when nothing selected: nothing selected, click tx2 -> selects only tx2', () => {
    const selected = handleRangeSelection(viewableTransactions, [], 1);
    const ids = selected.map(t => t.id);
    expect(ids).toEqual(['tx2']);
  });

  it('range selection with gaps: tx1 and tx3 already selected, click tx5 -> selects tx1 through tx5', () => {
    const selected = handleRangeSelection(viewableTransactions, [tx1, tx3], 4);
    const ids = selected.map(t => t.id);
    expect(ids).toEqual(['tx1', 'tx2', 'tx3', 'tx4', 'tx5']);
  });
});
