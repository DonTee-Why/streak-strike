# StreakStrike

StreakStrike is a private habit discipline PWA. Each habit has its own calendar, and completion is tracked by crossing out local calendar days.

## Rollover Sync Note

The app previously had a stale-date bug when it stayed open across local midnight: UI state and write actions could continue using the previous day as `today`, which could misclassify grace days, stale streaks, and target the wrong date.

The app now keeps `today` as synchronized local `YYYY-MM-DD` state and refreshes date-sensitive data on:

- app initialization
- the next local midnight timer
- window focus
- visibility recovery / `pageshow`
- before any mark or unmark write action

Caveat: if the device timezone is manually changed while the app is open, the app will adopt the new local calendar day the next time one of those sync triggers runs.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Run tests:

```bash
npm run test
```

4. Build production app:

```bash
npm run build
```

## Architecture Summary

- Framework: Next.js App Router + TypeScript + TailwindCSS
- State: Zustand
- Storage: IndexedDB via Dexie
- App model: local-first PWA, no backend
- Domain logic is in `lib/*` and remains separate from UI.

## Storage Model

Canonical completion history uses monthly bitsets (`HabitMonth`):

- `bit 0 => day 1` ... `bit 30 => day 31`
- `1 = completed`, `0 = not completed`
- one month record per `habitId + year + month`

Streaks are derived from completion history and can be cached, but cache is rebuildable.

## Grace Window Rules

- Today (`YYYY-MM-DD` local day) is editable: mark/unmark allowed.
- Previous 1-3 days are grace days:
  - if unmarked, can be marked once
  - once marked, permanently locked
- Older than 3 days: permanently locked.

## Streak Rules

- Current streak:
  - starts at today
  - if today incomplete, streak is `0`
  - otherwise scans backward day-by-day across month boundaries
- Longest streak:
  - iterates all completion history chronologically
  - tracks max contiguous completed run

## Offline / PWA

- Installable web app via `manifest.webmanifest`
- Service worker generated in production (`next-pwa`) for offline shell/static assets
- All habit data remains local in IndexedDB on device

## Desktop (Tauri v2)

### Prerequisites

- Node.js and npm
- Rust toolchain (`rustup`)
- Platform build tooling required by Tauri:
  - Windows: Visual Studio C++ Build Tools + WebView2
  - macOS: Xcode Command Line Tools
  - Linux: `webkit2gtk` and related GTK/WebKit dependencies

### Development

Run the desktop app with the Next.js dev server:

```bash
npm run desktop:dev
```

This runs `next dev` on `http://localhost:3003` and opens it in a Tauri window.

### Production Desktop Build

Build the web assets for desktop packaging:

```bash
npm run build:desktop:web
```

Then package the desktop app:

```bash
npm run desktop:build
```

Desktop bundles/installers are generated under:

`src-tauri/target/release/bundle/*` (platform dependent)

### Next.js + Tauri Notes

- Desktop packaging uses a conditional static export path (`TAURI_DESKTOP_EXPORT=1`) so Tauri can load `out/` as local assets.
- PWA service worker generation is disabled for desktop export builds to avoid packaging conflicts.
- Habit route uses query params in desktop-compatible static output (`/habits?habitId=...`) while preserving app behavior and business logic.
