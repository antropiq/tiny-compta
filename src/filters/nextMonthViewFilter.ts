import type { Transaction } from '../types/transaction';
import type { Filterable } from '../types/filter';
import dayjs from 'dayjs';

class NextMonthViewFilter implements Filterable {
  label = 'transaction.next_month_view';
  active = false;
  autoactivate = false;

  private cutoffDate?: dayjs.Dayjs;

  setup(): void {
    this.cutoffDate = dayjs().endOf('month').add(5, 'day');
  }

  apply(transactionList: Transaction[]): Transaction[] {
    if (!this.cutoffDate) {
      return transactionList;
    }
    return transactionList.filter(tx => {
      const txDate = dayjs(tx.dueDate);
      return txDate.isSame(this.cutoffDate, 'day') || txDate.isBefore(this.cutoffDate, 'day');
    });
  }
}

export const nextMonthViewFilter = new NextMonthViewFilter();
