# TECHNICAL PRODUCT REQUIREMENTS DOCUMENT

# PRODUCT: StreakStrike

# 1. System Overview

StreakStrike is a local‑first Progressive Web Application designed to track habit discipline through calendar‑based completion marking.

The system prioritizes:

• simplicity
• performance
• small data footprint
• offline capability

Version 1 is designed to run entirely on the client without requiring a backend service.

---

# 2. Architecture Overview

The application uses a local‑first architecture.

Frontend and persistence exist entirely in the client environment.

### Architecture Components

Frontend
• Next.js
• TypeScript
• TailwindCSS

State Management
• Zustand

Local Database
• IndexedDB via Dexie.js

Application Type
• Progressive Web App (PWA)

---

# 3. Data Model

The system uses three primary data structures.

## 3.1 Habits Table

Stores habit metadata.

Fields:

id
name
color
startDate
createdAt

Example:

{
  id: "habit_1",
  name: "Read Bible",
  color: "#D4A373",
  startDate: "2026-03-01",
  createdAt: "2026-03-01"
}

---

## 3.2 Habit Month Completion Table

Stores completion data using monthly bitsets.

Each record represents one habit for one calendar month.

Fields:

habitId
year
month
bits
completedCount
updatedAt

Example:

{
  habitId: "habit_1",
  year: 2026,
  month: 3,
  bits: "1010010000000000000000000000000",
  completedCount: 4
}

### Bitset Structure

Each bit represents one day of the month.

Index mapping:

bit 0 = day 1
bit 1 = day 2
bit 2 = day 3
...
bit 30 = day 31

Value meaning:

1 = completed
0 = not completed

---

## 3.3 Habit Stats Cache (Optional)

Derived statistics may be cached for performance.

Fields:

habitId
currentStreak
longestStreak
totalCompletions
updatedAt

This cache is rebuildable and not treated as canonical data.

---

# 4. Dexie Schema

Example database configuration:

```
db.version(1).stores({
  habits: 'id, name, createdAt',
  habitMonths: '[habitId+year+month], habitId, year, month',
  habitStats: 'habitId'
})
```

---

# 5. Completion Operations

## Mark Day

Process:

1. Determine habitId
2. Determine target date
3. Fetch month record
4. Update bit in bitset
5. Persist record
6. Update completedCount
7. Recalculate cached stats

Pseudo example:

```
mask = mask | (1 << (day - 1))
```

---

## Unmark Day

Allowed only for "today".

Pseudo example:

```
mask = mask & ~(1 << (day - 1))
```

---

# 6. Grace Window Logic

The system allows marking of previous days within a three day window.

Rules:

• today is editable
• previous 1‑3 days may be marked if unmarked
• once marked they become locked
• days older than the grace window are locked

Pseudo logic:

```
if date > today
  disable

if date == today
  editable

if date in [today-3, today-1]
  if completed
    locked
  else
    markable

if date < today-3
  locked
```

---

# 7. Day State Engine

The UI should derive a state for each day.

Possible states:

future

open_today

completed_today

grace_open

grace_locked

expired_missed

expired_completed

These states control UI behavior.

---

# 8. Streak Calculation

Streaks are derived from completion history.

## Current Streak

Algorithm:

1. Start at today's date
2. Check completion bit
3. If completed continue backward
4. Stop at first incomplete day

The algorithm must support crossing month boundaries.

## Longest Streak

Algorithm:

1. Load all monthly completion records
2. Iterate chronologically
3. Count contiguous completion runs
4. Track maximum

Because the dataset is small, full iteration is acceptable.

---

# 9. Month Boundary Handling

When streak calculation crosses month boundaries:

1. load previous month bitset
2. continue scanning

Example:

March 1 completed
February 28 completed
February 27 completed

Streak continues across months.

---

# 10. Performance Expectations

Expected dataset size is small.

Example scenario:

20 habits
5 years of usage

Monthly storage model:

20 × 12 × 5 = 1200 records

This is trivial for IndexedDB.

---

# 11. Time Handling

Dates must be stored using local calendar dates.

Recommended format:

YYYY-MM-DD

The system should rely on the user's local timezone for determining "today".

---

# 12. UI Data Requirements

Calendar screen requires:

• current month record
• previous month record

These two records are sufficient for streak continuation.

---

# 13. Future Technical Extensions

Potential future improvements:

• encrypted local storage
• data export
• optional cloud sync
• analytics engine

These features are intentionally excluded from Version 1.

---

# 14. Version 1 Technical Goals

The system must:

• run fully offline
• maintain minimal storage size
• compute streaks efficiently
• support multiple habits

All functionality must remain fast even on low powered mobile devices.
