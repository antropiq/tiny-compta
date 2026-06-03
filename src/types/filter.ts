import type { Transaction } from './transaction';

export interface Filterable {
  label: string;
  active: boolean;
  autoactivate?: boolean;
  setup(): void;
  apply(transactionList: Transaction[]): Transaction[];
}
