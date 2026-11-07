# Tiny Compta Development Guide

## 1. Project Overview

Tiny Compta is a lightweight, browser-based bank account management application designed for personal finance tracking. It allows users to manage multiple bank accounts, track associated transactions, and manage recurring payment plans with automatic monthly generation. Features also include data importing/exporting (transactions and recurring payment plans) and real-time balance calculation based on an end date.

## 2. Technical Stack

- **Framework:** React (with Vite & TypeScript template)
- **Stylized UI:** Material UI (MUI)
- **Icons:** Material Icons
- **Date/Time Handling:** Dayjs (with French locale)
- **Date Pickers:** MUI X Date Pickers
- **Charts:** MUI X-Charts (used in Dashboard tab)
- **Persistence:** IndexedDB via the `idb` package
- **ID Generation:** `uuid` package
- **Build System:** Vite
- **Internationalization:** i18next & react-i18next
- **Testing:** Vitest & React Testing Library
- **Desktop App:** Tauri v2 (Rust backend + WebView)

## 3. Technical recommendations

- Always use the `UuidUtils` utility class to get a fresh UUID.
- Always use i18n for all user-facing text to ensure multi-language support.
- When adding new text, always update the corresponding translation files in `src/locales/{lang}/translation.json` for all supported languages.
- Always write a test case once a task is done.
- Always implement charts using `@mui/x-charts` with dynamic theme detection (`useTheme`) to ensure support for both light and dark modes.
- Definition of done is: build pass, lint pass and a test case is covering the feature.

## 4. Code Map

| Path | Contents |
|---|---|
| `src/main.tsx` | Entry point. Renders `<AppProviders><App/></AppProviders>` in `StrictMode`. |
| `src/App.tsx` | Holds `activeTab` + `recurrings` state; renders `TransactionEditionArea` + `ApplicationStatusBar`. |
| `src/providers/AppProviders.tsx` | Root wrapper: `ThemeContext` + MUI `ThemeProvider` (inline `createTheme`, default mode `dark`), `LocalizationProvider` (`AdapterDayjs`, locale hard-coded to `"fr"`), `AccountProvider`, `CssBaseline`, and i18n init from the `selected_language` setting. |
| `src/providers/AccountContext.tsx` | `AccountProvider` — the only stateful provider. |
| `src/contexts/AccountContext.ts` | The context **object** + `AccountContextType` interface. Provider lives in `providers/`. |
| `src/services/db.ts` | `DatabaseService` class + exported `dbService` singleton. All IndexedDB access. |
| `src/components/` | One `.tsx` per component, colocated `.test.tsx`. |
| `src/filters/` | Module-level filter **singletons**, re-exported by `filters/index.ts`. |
| `src/utils/` | Static-only helper classes (`UuidUtils`, `RecurringUtils`, `FormatUtils`). |
| `src/hooks/` | `useAccount()` (context accessor), `useBalance()`. |
| `src/locales/{fr,en}/translation.json` | Flat-ish nested translation resources. |
| `specs/` | Feature specs (e.g. `dashboard-spec.md`). Implement what is written there. |

### Data model (`src/types/`)
- `Account { id, label }`
- `Transaction { id, accountId, label, description?, amount, dueDate, recurringId? }`
- `Recurring { id, accountId, label, description?, amount, dayOfMonth, startDate, endDate? }`
- `Setting { id, key, value }` — generic KV store for persisted UI state.

`dueDate`, `startDate`, `endDate` are **`YYYY-MM-DD` strings**, not `Date` objects.

### Persistence
`db.ts` opens `TinyComptaDB` at **version 3** via `idb`'s `openDB` with a versioned
`upgrade()`. Stores: `accounts`, `transactions` (+`by-account` index),
`recurrings` (+`by-account`), `settings` (+`by-key`).

When adding a store or index: bump `DB_VERSION`, add an `if (oldVersion < N)`
branch, and guard with `objectStoreNames.contains()` — the existing branches
follow this pattern exactly. There are **no foreign keys**: `deleteAccount()`
cascades manually to transactions and recurrings, so any new entity holding an
`accountId` must be added to that cascade.

### State flow
`AccountProvider` exposes `selectedAccount`, `selectedDate`, `transactionsVersion`,
`selectedTransactions`, `isInitializing`. Read it with `useAccount()`, which throws
outside a provider.

`transactionsVersion` is a **bump counter, not data**: after any write, call
`setTransactionsVersion(v => v + 1)` and components refetch from IndexedDB.
Do not try to pass mutated rows between components — bump the version.

### Recurring generation
`RecurringUtils.generateTransactionsForMonth(recurrings, 'YYYY-MM')` is pure and
returns freshly-ID'd transactions. `RecurringsTab` diffs that result against the
rows already stored for the month (delete orphans / update changed / insert new).
`dayOfMonth` is clamped to the month's real length, so a 31st template lands on
the 28th/30th in short months.

## 5. Conventions & Gotchas

- **Never edit `src/theme.ts`** — it is dead code. `AppProviders` builds its theme inline.
- **MUI 9**: `fontWeight` is not a valid `Typography` prop; use `sx={{ fontWeight: 'bold' }}`.
- **Currency formatting**: `FormatUtils.currency(value, locale)` — pass `i18n.language`
  explicitly (as `DashboardTab` does). Omitting it falls back to `navigator.language`,
  which will not match the app language.
- **i18n keys are grouped under one top-level namespace per area**: `header`, `common`,
  `account`, `transaction`, `export`, `import`, `tabs`, `dashboard`, `recurring`. Reuse
  `common.*` for generic verbs (`cancel`, `save`, `yes`, `no`) rather than re-adding them.
  Keep both locale files key-identical.
- **Date pickers are always French**: `LocalizationProvider` passes `adapterLocale="fr"`
  regardless of `i18n.language`, so switching to English changes labels but not the
  calendar. Don't assume picker formatting follows the app language.
- **Filters are singletons** with a mutable `active` flag. Mutating one leaks state
  across accounts and across tests — reset it in test teardown if you toggle it.
- **Selected account is persisted by `label`, not `id`** (`AccountContext.tsx`). Renaming
  an account or creating a duplicate label breaks restore. Don't build on this.
- **Tests**: 26 files / 256 tests, run with `fake-indexeddb` (loaded in `src/setupTests.ts`)
  and `jsdom`. Components under test are wrapped in a hand-built `AccountContext.Provider`
  value — copy an existing test file rather than inventing a new harness. MUI X Charts is
  `vi.mock`'d in `DashboardTab.test.tsx`.
- **Pre-existing stderr noise** in the test run (React `act(...)` warnings, a swallowed
  `initAccount` rejection, MUI disabled-button Tooltip warnings) is not caused by your
  change. Judge green by the pass/fail counts, not by a clean console.

## 6. Build & Verification

```bash
npm run dev          # Vite dev server, port 1420
npm run build        # vite build  -- does NOT type-check, see below
npm run lint         # eslint .
npm test             # vitest (watch); use: npx vitest run
npx tsc -b           # type-check (NOT wired into any npm script)
```

**`npm run build` does not type-check.** The script is bare `vite build`, so
`tsconfig.app.json`'s strict flags (`noUnusedLocals`, `noUnusedParameters`,
`verbatimModuleSyntax`, `erasableSyntaxOnly`) are never enforced by it — esbuild
strips types without checking them. Run `npx tsc -b` yourself before declaring
work done. As of writing it reports 4 pre-existing errors in `DashboardTab.tsx`
(three `fontWeight` props, one `AxisId` widening); treat that as the baseline and
do not add to it.

`tsconfig.node.json` sets `"composite": true` without `"noEmit"`, so `tsc -b`
writes `vite.config.js`, `vite.config.d.ts` and `tsconfig.node.tsbuildinfo` into
the repo root. These are untracked and unignored — delete them before committing.

**Definition of done:** `npx tsc -b` no worse than baseline, `npm run build` passes,
`npm run lint` clean, `npx vitest run` all green, and a test covers the change.

## 7. Desktop App (Tauri v2)

### Structure

- **Frontend:** React app in `src/` (shared with web build)
- **Backend:** Rust code in `src-tauri/`
- **Config:** `src-tauri/tauri.conf.json` (v2 schema)
- **Capabilities:** `src-tauri/capabilities/migrated.json`
- **Dependencies:** `src-tauri/Cargo.toml`

### Building

```bash
# Build web app + desktop binary
npm run tauri build

# Build with specific bundle targets
npm run tauri build -- --bundles deb          # Debian package
npm run tauri build -- --bundles rpm           # RPM package
NO_STRIP=true npm run tauri build -- --bundles appimage  # AppImage
npm run tauri build -- --bundles msi           # Windows MSI
npm run tauri build -- --bundles nsis          # Windows NSIS
npm run tauri build -- --bundles all           # All available bundles

# Run in development mode with hot-reload
npm run tauri dev
```

### Key Points

- Tauri v2 requires explicit `--bundles` flag (no default bundling)
- AppImage requires `NO_STRIP=true` environment variable
- Linux requires `webkit2gtk-4.1` system library
- The `src-tauri/src/main.rs` contains the Tauri entry point and commands
- Frontend communicates with Rust backend via Tauri's IPC (`@tauri-apps/api`)
