# Tiny Compta

**Tiny Compta** is a lightweight, browser-based bank account management application for personal finance tracking. It lets you manage multiple bank accounts, track associated transactions, and manage recurring payment plans with automatic monthly generation. Features also include data importing/exporting (transactions and recurring payment plans) and real-time balance calculation based on an end date.

![Screenshot](./resources/cpecran.png)

## Features

- **Dashboard:** Interactive tracking of cumulative/daily inflows and outflows with MUI X-Charts, including account balances (today and forecasted end-of-month) and detailed tables of non-recurring incomes.
- Manage multiple bank accounts
- Track transactions with labels, descriptions, amounts, and due dates
- Manage recurring payment plans with custom intervals, start/end dates, and automatic/manual generation
- Import and export transaction and recurring payment data (JSON and CSV formats)
- Real-time balance calculation
- Persistent storage via IndexedDB
- Multi-language support (English & French)

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **UI:** Material UI (MUI) 9
- **Charts:** MUI X-Charts
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

### Build Desktop App (Tauri v2)

> **Prerequisites:** Rust toolchain + Node.js

Install Rust (if not already installed):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### Linux (Manjaro/Arch)

Install required system dependencies (runtime **and** the headers/`.pc` files
that `pkg-config` needs to link against them):

```bash
sudo pacman -S --needed webkit2gtk-4.1 libsoup3 librsvg pkgconf base-devel
```

> `libappindicator-gtk3` is only needed if you enable a tray icon; the app
> builds without it.

##### Troubleshooting: `pkg-config` / `The system library ... was not found`

The Rust crates behind Tauri (`soup3-sys`, `gdk-sys`, `webkit2gtk-sys`, ...)
locate system libraries through `pkg-config`. Arch splits those `.pc` files
across **two** directories:

| Directory | Contains |
|---|---|
| `/usr/lib/pkgconfig` | `gdk-3.0.pc`, `x11.pc`, `xrender.pc`, `xft.pc`, `libsoup-3.0.pc`, ... |
| `/usr/share/pkgconfig` | `xproto.pc`, `renderproto.pc`, `kbproto.pc`, `xextproto.pc`, `shared-mime-info.pc`, ... |

The X protocol headers and shared-mime-info are architecture-independent, so
they live in `/usr/share`. If `PKG_CONFIG_PATH` is set to a list that omits
`/usr/share/pkgconfig`, the build fails with errors naming packages that
**do not exist as installable packages** on Arch:

```
Package 'xproto', required by 'x11', not found
Package 'shared-mime-info', required by 'gdk-pixbuf-2.0', not found
```

Those files ship inside `xorgproto` and `shared-mime-info`, which are already
installed as dependencies. **Do not go hunting for a `-dev` package** — the
error's `HINT:` line is misleading on Arch. The fix is the search path:

```bash
export PKG_CONFIG_PATH="/usr/lib/pkgconfig:/usr/share/pkgconfig:$PKG_CONFIG_PATH"
```

Verify before rebuilding (versions must resolve, not error):

```bash
pkg-config --modversion gdk-3.0 webkit2gtk-4.1 libsoup-3.0
```

**Known cause:** the Vulkan SDK (`VULKAN_SDK=/opt/vulkan/<version>/x86_64`)
exports a `PKG_CONFIG_PATH` containing only its own directories, which
*replaces* pkgconf's built-in defaults instead of extending them. If you have
the Vulkan SDK installed, either append the two system directories above in
your shell profile, or unset `PKG_CONFIG_PATH` for the build so pkgconf falls
back to its defaults (which already include both).

#### macOS

No additional dependencies required.

#### Windows

WebView2 is included with Windows 10/11. No additional dependencies required.

#### Build & Bundle

In Tauri v2, bundling is explicit. Choose your target:

```bash
npm run tauri build -- --bundles deb      # Debian package (.deb)
npm run tauri build -- --bundles rpm       # RPM package (.rpm)
npm run tauri build -- --bundles msi       # Windows MSI installer (.msi)
npm run tauri build -- --bundles nsis      # Windows NSIS installer (.exe)
npm run tauri build -- --bundles all       # All available bundles for current platform
```

**AppImage (Linux):**

AppImage bundling requires the `NO_STRIP=true` environment variable:

```bash
NO_STRIP=true npm run tauri build -- --bundles appimage
```

No additional tools (like linuxdeploy) are needed — Tauri bundles everything automatically.

**Install the packages:**

- **Debian/Ubuntu:** `sudo dpkg -i src-tauri/target/release/bundle/deb/tiny-compta_*.deb`
- **Manjaro/Arch:** See [Installing on Manjaro/Arch](#installing-on-manjaroarch) below
- **RPM-based (Fedora, openSUSE):** `sudo rpm -ivh src-tauri/target/release/bundle/rpm/tiny-compta-*.rpm`
- **AppImage:** `chmod +x src-tauri/target/release/bundle/appimage/tiny-compta_*.AppImage && ./src-tauri/target/release/bundle/appimage/tiny-compta_*.AppImage`
- **Windows:** Run the `.msi` or `.exe` installer

#### Run in Development Mode

```bash
npm run tauri dev
```

This launches the app with hot-reload pointing to the Vite dev server.

### Installing on Manjaro/Arch

Manjaro and other Arch-based distributions do not natively support RPM packages. Use the following steps to install the RPM bundle:

**Step 1: Install `rpmextract`**

```bash
sudo pacman -S rpmextract
```

**Step 2: Extract the RPM package**

```bash
rpmextract.sh src-tauri/target/release/bundle/rpm/tiny-compta-*.rpm
```

This creates a `usr/` directory in the current folder.

**Step 3: Copy the extracted files to the system**

```bash
sudo cp -r usr/* /usr
```

This merges the extracted files into your system's filesystem.

**Step 4: Verify the installation by running the app**

```bash
tiny-compta
```

**Step 5: Remove the usr folder from the repo**

```bash
rm -rf usr
```

