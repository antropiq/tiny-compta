import dayjs from 'dayjs';
import type { Recurring } from '../types/recurring';
import type { Transaction } from '../types/transaction';
import { UuidUtils } from './uuidUtils';

export class RecurringUtils {
  static generateTransactionsForMonth(
    recurrings: Recurring[],
    targetMonth: string
  ): Transaction[] {
    const target = dayjs(targetMonth, 'YYYY-MM');
    if (!target.isValid()) {
      return [];
    }

    const daysInMonth = target.daysInMonth();
    const year = target.year();
    const month = target.month() + 1;
    const targetMonthStart = target.startOf('month');
    const targetMonthEnd = target.endOf('month');

    const transactions: Transaction[] = [];

    for (const rec of recurrings) {
      const start = dayjs(rec.startDate);
      const end = rec.endDate ? dayjs(rec.endDate) : null;

      const isActive = targetMonthEnd.isAfter(start) || targetMonthEnd.isSame(start, 'day');
      const isBeforeEnd = !end || targetMonthStart.isBefore(end) || targetMonthStart.isSame(end, 'day');

      if (isActive && isBeforeEnd) {
        const finalDay = Math.min(rec.dayOfMonth, daysInMonth);
        const dayStr = String(finalDay).padStart(2, '0');
        const monthStr = String(month).padStart(2, '0');
        const dueDate = `${year}-${monthStr}-${dayStr}`;

        const targetDueDate = dayjs(dueDate);
        const isWithinRange = (targetDueDate.isAfter(start) || targetDueDate.isSame(start, 'day')) &&
          (!end || targetDueDate.isBefore(end) || targetDueDate.isSame(end, 'day'));

        if (isWithinRange) {
          transactions.push({
            id: UuidUtils.generate(),
            accountId: rec.accountId,
            label: rec.label,
            description: rec.description,
            amount: rec.amount,
            dueDate,
            recurringId: rec.id,
          });
        }
      }
    }

    return transactions;
  }
}
