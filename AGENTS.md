# Tiny Compta Development Guide

## 1. Project Overview

Tiny Compta is a lightweight, browser-based bank account management application designed for personal finance tracking. It allows users to manage multiple bank accounts and their associated transactions with features for importing/exporting data and real-time balance calculation based on an end date..

## 2. Technical Stack

- **Framework:** React (with Vite & TypeScript template)
- **Stylized UI:** Material UI (MUI)
- **Icons:** Material Icons
- **Date/Time Handling:** Dayjs (with French locale)
- **Date Pickers:** MUI X Date Pickers
- **Persistence:** IndexedDB via the `idb` package
- **ID Generation:** `uuid` package
- **Build System:** Vite
- **Internationalization:** i18next & react-i18next
- **Testing:** Vitest & React Testing Library

## 3. Technical recommendations

- Always use the `UuidUtils` utility class to get a fresh UUID.
- Always use i18n for all user-facing text to ensure multi-language support.
- When adding new text, always update the corresponding translation files in `src/locales/{lang}/translation.json` for all supported languages.
- Always write a test case once a task is done.
- Definition of done is: build pass, lint pass and a test case is covering the feature.
