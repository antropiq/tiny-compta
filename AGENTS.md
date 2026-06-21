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

## 4. Desktop App (Tauri v2)

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
