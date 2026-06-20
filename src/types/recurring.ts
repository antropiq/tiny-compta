export type Recurring = {
  id: string;
  accountId: string;
  label: string;
  description?: string;
  amount: number;
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
};
