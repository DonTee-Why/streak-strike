# StreakStrike

StreakStrike is a private habit discipline PWA. Each habit has its own calendar, and completion is tracked by crossing out local calendar days.

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
