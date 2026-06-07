# Tiny Compta

**Tiny Compta** is a lightweight, browser-based bank account management application for personal finance tracking. It lets you manage multiple bank accounts and their transactions with features for importing/exporting data and real-time balance calculation based on an end date.

![Screenshot](./resources/screenshot-2026-06-07-153709.png)

## Features

- Manage multiple bank accounts
- Track transactions with labels, descriptions, amounts, and due dates
- Import and export transaction data
- Real-time balance calculation
- Persistent storage via IndexedDB
- Multi-language support (English & French)

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **UI:** Material UI (MUI) 9
- **Dates:** Day.js + MUI X Date Pickers
- **Persistence:** IndexedDB (`idb`)
- **i18n:** i18next + react-i18next
- **Testing:** Vitest + React Testing Library

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

### Tests

```bash
npm run test
```

### build desktop app

> Rust must be installed on your environment (ex for windows: winget install --id Rustlang.Rustup)

```bash
npm run tauri build
```
