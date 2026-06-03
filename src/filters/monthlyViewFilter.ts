import type { Transaction } from '../types/transaction';
import type { Filterable } from '../types/filter';
import dayjs from 'dayjs';

class MonthlyViewFilter implements Filterable {
  label = 'transaction.monthly_view';
  active = true;
  autoactivate = true;
  private startDate?: dayjs.Dayjs;

  setup(): void {
    // We don't need transactionList to compute the start date,
    // but we accept it to satisfy the interface.
    this.startDate = dayjs().startOf('month').subtract(5, 'day');
  }

  apply(transactionList: Transaction[]): Transaction[] {
    if (!this.startDate) {
      return transactionList;
    }
    return transactionList.filter(tx => {
      const txDate = dayjs(tx.dueDate);
      return txDate.isAfter(this.startDate) || txDate.isSame(this.startDate, 'day');
    });
  }
}

export const monthlyViewFilter = new MonthlyViewFilter();
