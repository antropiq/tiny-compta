export type Transaction = {
  id: string;
  accountId: string;
  label: string;
  description?: string;
  amount: number;
  dueDate: string;
};
