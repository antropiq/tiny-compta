import type { Transaction } from '../types/transaction';

export function handleRangeSelection(
  viewableTransactions: Transaction[],
  selectedTransactions: Transaction[],
  clickedIndex: number,
): Transaction[] {
  // If there's a previously selected transaction, select all between it and the clicked one
  const firstSelectedIndex = viewableTransactions.findIndex(t =>
    selectedTransactions.some(s => s.id === t.id)
  );

  if (firstSelectedIndex !== -1) {
    const start = Math.min(firstSelectedIndex, clickedIndex);
    const end = Math.max(firstSelectedIndex, clickedIndex);
    const rangeTransactions = viewableTransactions.slice(start, end + 1);
    const currentSelected = new Set(selectedTransactions.map(t => t.id));
    rangeTransactions.forEach(t => currentSelected.add(t.id));
    return viewableTransactions.filter(t => currentSelected.has(t.id));
  }
  // No previously selected transaction - just return the clicked one
  return [viewableTransactions[clickedIndex]];
}
