# Technical Specifications: Adding a Dashboard Tab

This document defines the detailed specifications for implementing a new **Dashboard** tab in the Tiny Compta application. It is structured to be directly consumable by an **AI Agent** for autonomous, end-to-end development.

---

## 1. Project Overview

The Tiny Compta application is built with:
- **Framework:** React (Vite + TypeScript)
- **Design System:** Material UI (MUI) v6
- **Date/Time:** Dayjs (French locale)
- **Persistence:** IndexedDB (via `idb` and `dbService`)
- **State Management:** React Context (`AccountContext` accessible via `useAccount`)
- **Internationalization:** i18next & react-i18next

The goal of this feature is to add a **Dashboard** tab positioned at index 0, in front of the current "Transactions" tab (which shifts to index 1) and "Recurring Payments" (index 2).

---

## 2. Technical Choices for the Chart

To maintain visual consistency and integrate seamlessly with the light/dark mode of Material UI, the recommended charting library is **`@mui/x-charts`**.

### Installation
The following command must be executed to install the library and its dependencies:
```bash
npm install @mui/x-charts
```

*Note: `@mui/x-charts` is the official MUI package for data visualization. It supports TypeScript out of the box, aligns with the active theme, and offers excellent rendering performance.*

---

## 3. Tab Structure and Wireframe Layout

The Dashboard tab is displayed only when a bank account is selected.

### Header
Horizontally centered at the top of the component, it displays:
- The active account name (`selectedAccount.label`).
- The month and year of the selected date (`selectedDate` from `useAccount`) in localized format (e.g., `Checking Account - June 2026`).

### Body (2-Column Layout)
The main content is split into two columns with a strict proportion of **1/3** (left) and **2/3** (right) using the MUI Grid system (e.g., `Grid2` with `size={{ xs: 12, md: 4 }}` for the left column and `size={{ xs: 12, md: 8 }}` for the right column).

#### Column 1: 1/3 Width (Left)
This column contains two elements stacked vertically:

1. **Table of non-recurring incomes:**
   - **Applied Filters:** Transactions for the selected month (`selectedDate`'s month) with an amount greater than zero (`amount > 0`) and not associated with a recurring payment (`recurringId` is `undefined` or absent).
   - **Table Columns:**
     - Transaction Label (`label`)
     - Amount (formatted in currency via `FormatUtils.currency`)
     - Due Date (`dueDate` formatted as `DD/MM/YYYY`)
   - **Empty State:** If no incomes match, display a user-friendly message.
   - **Total Row:** Display the total sum of all listed incomes below the table rows.

2. **Table of Account Balances:**
   - Placed directly under the incomes table.
   - Contains exactly two rows:
     - **Today's Balance:** Sum of all active account transactions whose `dueDate` is less than or equal to the actual current date (real-world today).
     - **Forecasted Balance:** Sum of all active account transactions whose `dueDate` is less than or equal to the last day of the currently selected month (`selectedDate`).

#### Column 2: 2/3 Width (Right)
Displays a **LineChart** from `@mui/x-charts`:
- **X-Axis:** Days of the selected month (numbered from 1 to $N$, where $N$ is the number of days in the selected month).
- **Y-Axis:** Transaction amounts (cumulative or daily).
- **Curve 1 (Green - `#2e7d32` / `theme.palette.success.main`):** Incoming flow over time (transactions with `amount > 0`).
- **Curve 2 (Red - `#d32f2f` / `theme.palette.error.main`):** Outgoing flow over time (transactions with `amount < 0`, plotted as positive absolute values for easier visual comparison).
- The chart must feature an interactive tooltip formatting amounts with `FormatUtils.currency` and days with the full date.

---

## 4. Computational Logic & Algorithms

These are the exact algorithmic formulas that the AI Agent should implement in `DashboardTab.tsx`:

### 4.1. Fetching and Filtering Transactions
All transactions for the active account are retrieved via:
```typescript
const transactions = await dbService.getTransactionsByAccountId(selectedAccount.id);
```

Let $D$ be the selected date (`selectedDate` as a Dayjs object, defaulting to current date if null).
- Start of month: $D_{start} = D.\text{startOf}('month')$
- End of month: $D_{end} = D.\text{endOf}('month')$

#### Filtering Non-Recurring Incomes:
```typescript
const nonRecurringIncomes = transactions.filter(tx => {
  const txDate = dayjs(tx.dueDate);
  const isWithinMonth = (txDate.isAfter(D_start) || txDate.isSame(D_start, 'day')) &&
                        (txDate.isBefore(D_end) || txDate.isSame(D_end, 'day'));
  return isWithinMonth && tx.amount > 0 && !tx.recurringId;
});
```

### 4.2. Balances Computation

#### Today's Balance:
Sum of all historical transactions up to today inclusive:
```typescript
const today = dayjs().endOf('day');
const balanceToday = transactions.reduce((sum, tx) => {
  const txDate = dayjs(tx.dueDate);
  return (txDate.isBefore(today) || txDate.isSame(today, 'day')) ? sum + tx.amount : sum;
}, 0);
```

#### Forecasted End of Month Balance:
Sum of all historical transactions up to the last day of the selected month inclusive:
```typescript
const endOfMonth = D.endOf('month').endOf('day');
const balanceForecast = transactions.reduce((sum, tx) => {
  const txDate = dayjs(tx.dueDate);
  return (txDate.isBefore(endOfMonth) || txDate.isSame(endOfMonth, 'day')) ? sum + tx.amount : sum;
}, 0);
```

### 4.3. Plotting Curve Series Data
The chart should display the cumulative trend over the entire month to provide a beautiful visualization of financial flows.

Let $N$ be the number of days in the selected month: `const daysInMonth = D.daysInMonth();`
Initialize two arrays of size $N$ filled with zeros to represent daily flows:
- `dailyIncomes` of size $N$
- `dailyExpenses` of size $N$

#### Populating Daily Flows:
For each transaction $tx$ in the selected month:
1. Determine the transaction day: `const day = dayjs(tx.dueDate).date();` (value from 1 to $N$).
2. If `tx.amount > 0`: `dailyIncomes[day - 1] += tx.amount;`
3. If `tx.amount < 0`: `dailyExpenses[day - 1] += Math.abs(tx.amount);`

#### Computing Cumulative Curves (Recommended):
To draw beautiful curves showing progressive earnings and spendings over the month, calculate the cumulative sums:
```typescript
const cumulativeIncomes = [];
const cumulativeExpenses = [];
let sumIn = 0;
let sumOut = 0;

for (let i = 0; i < daysInMonth; i++) {
  sumIn += dailyIncomes[i];
  sumOut += dailyExpenses[i];
  cumulativeIncomes.push(sumIn);
  cumulativeExpenses.push(sumOut);
}
```

*Note: The AI Agent may also provide a toggle button to switch between daily and cumulative views, but the cumulative view must be rendered by default.*

---

## 5. Modifying Existing Code (Index Shifting)

Since the new "Dashboard" tab is added as the first tab (index 0), the global active tab state must be updated to shift existing indexes:
1. **Index 0:** Dashboard (`DashboardTab`)
2. **Index 1:** Transactions (`TransactionsTab`)
3. **Index 2:** Recurring Payments (`RecurringsTab`)

### Files to Modify and Adapt:

#### `src/components/TransactionEditionArea.tsx`:
- Update the tab header with the new tab:
  ```tsx
  <Tabs value={activeTab} onChange={(_e, newValue) => onActiveTabChange(newValue)} aria-label="tabs">
    <Tab label={t('tabs.dashboard')} />
    <Tab label={t('tabs.transactions')} />
    <Tab label={t('tabs.recurrings')} />
  </Tabs>
  ```
- Render `<DashboardTab />` when `activeTab === 0`.
- Update the rendering conditions for other tabs: `activeTab === 1` for `<TransactionsTab />` and `activeTab === 2` for `<RecurringsTab />`.
- Adjust import/export buttons and dialog conditionals to be active or disabled based on the correct active tab index.

#### `src/components/ApplicationStatusBar.tsx`:
- Update the logic showing the sum of recurrings which was previously bound to index 1, shifting it to index 2:
  ```tsx
  {activeTab === 2 && recurrings.length > 0 && (
    t('recurring.sum', { sum: formattedRecurringSum })
  )}
  ```

#### Unit Test Files:
All existing tests that verify tab selection or index-related behaviors must be updated to reflect the new tab ordering:
- `src/components/TransactionEditionArea.test.tsx`
- `src/components/ApplicationStatusBar.test.tsx`

---

## 6. Internationalization (i18n)

All user-facing text must be defined in the translation files.

### Keys to add in `src/locales/fr/translation.json`:
```json
  "tabs": {
    "dashboard": "Tableau de Bord",
    "transactions": "Transactions",
    "recurrings": "Paiements Récurrents"
  },
  "dashboard": {
    "title": "Tableau de Bord",
    "no_account_selected": "Veuillez sélectionner un compte pour afficher le tableau de bord.",
    "account_summary_title": "{{accountLabel}} - {{date}}",
    "non_recurring_incomes_title": "Entrées hors récurrents",
    "no_incomes": "Aucune entrée hors récurrents sur cette période.",
    "balance_table_title": "Soldes du compte",
    "balance_today": "Solde aujourd'hui",
    "balance_forecast": "Solde prévisionnel fin de mois",
    "chart_title": "Suivi des flux financiers",
    "chart_incomes": "Entrées cumulées",
    "chart_expenses": "Sorties cumulées",
    "chart_day": "Jour {{day}}"
  }
```

### Keys to add in `src/locales/en/translation.json`:
```json
  "tabs": {
    "dashboard": "Dashboard",
    "transactions": "Transactions",
    "recurrings": "Recurring Payments"
  },
  "dashboard": {
    "title": "Dashboard",
    "no_account_selected": "Please select an account to view the dashboard.",
    "account_summary_title": "{{accountLabel}} - {{date}}",
    "non_recurring_incomes_title": "Non-recurring income",
    "no_incomes": "No non-recurring income for this period.",
    "balance_table_title": "Account balances",
    "balance_today": "Today's balance",
    "balance_forecast": "Forecasted end of month balance",
    "chart_title": "Financial flow tracking",
    "chart_incomes": "Cumulative incomes",
    "chart_expenses": "Cumulative expenses",
    "chart_day": "Day {{day}}"
  }
```

---

## 7. Step-by-Step AI Agent Action Plan

This is the exact sequence of actions expected from the AI Agent to complete the implementation:

1. **Install `@mui/x-charts`** via npm.
2. **Add translation keys** to both locale files (`src/locales/fr/translation.json` and `src/locales/en/translation.json`).
3. **Create the `DashboardTab.tsx` component** in `src/components/`:
   - Import `LineChart` from `@mui/x-charts/LineChart`.
   - Use `useAccount` and `useBalance` hooks to fetch global state.
   - Implement the transaction filtering, balances computation, and data series structuring.
   - Structure the layout with MUI components (`Box`, `Grid` or `Grid2`, `Paper`, `Table`, `Typography`).
   - Implement light/dark theme adaptation for chart curves and text colors.
4. **Integrate the component** in `TransactionEditionArea.tsx`:
   - Update tab index definitions.
   - Import and render `<DashboardTab />` on `activeTab === 0`.
5. **Adapt `ApplicationStatusBar.tsx`** to show the recurring sum on the correct tab index (index 2).
6. **Update existing unit tests** that are broken by the tab index changes.
7. **Create a robust test suite `DashboardTab.test.tsx`**:
   - Verify rendering with and without a selected account.
   - Validate Today's and Forecasted Balances calculations using mock data.
   - Verify filtering of non-recurring incomes and the display of the **Total Row**.
   - Validate that the chart component receives correctly computed series data.
8. **Verify code quality** by running linting and testing tools:
   ```bash
   npm run lint
   npm run test
   ```
9. Verify that the project builds successfully via `npm run build`.
