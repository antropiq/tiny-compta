# List of features to add & bug to fix

## How this TODO file works

Every TODO items that are done should be located at the bottom of this file.
For example, once a TODO item as been implemented:

1 - it's item number will be replaced by the world 'DONE'.
    For example: "3 - do a new feature" <-> "DONE - do a new feature"

2 - remaining TODO items placed after the one that is set to 'DONE' must be renumbered.
    For example: "4 - do another feature" <-> "3 - do another feature"
---

## 1 - Recurring payments

In order to manage recurring payments we need to add an extra table to the current idb db schema named recurring.

The relevant typescript types to manage this object are the following:

```typescript
export type RecurringType = 'loan' | 'credit_card' | 'subscription' | 'other';
export type StatusType = 'active' | 'completed' | 'paused' | 'cancelled';
export type Recurring = {
	id: string,
	accountId: string,
	label: string,
	recurringType : RecurringType,
	startDate: string,
	endDate: string,
	status: StatusType
};
```

We will also need to add a FK to the transaction table in order to link it eventually to a recurring item:

```typescript
export type Transaction = {
  id: string;
  accountId: string;
  recurringId?: string; // <- nouveau
  label: string;
  description?: string;
  amount: number;
  dueDate: string;
};

# DONE SECTION GOES BELLOW

DONE - Enhancement - transaction toolbar - left-container vertical viewport.
DONE - Transaction list visible items