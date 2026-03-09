# ADR-003: Streak Calculation Strategy

## Status

Accepted

## Context

The application displays two important metrics for each habit:

• Current streak
• Longest streak

A streak represents consecutive completed days.

The system must calculate streaks reliably while supporting the grace-window editing rules and monthly bitset storage model.

## Decision

Streaks will be **derived values** calculated from completion history rather than stored as canonical data.

Completion data stored in monthly bitsets will be treated as the source of truth.

Streak values may optionally be cached for performance but must always be rebuildable.

## Current Streak Algorithm

Steps:

1. Start from today's date
2. Check if the day is completed
3. If not completed, streak = 0
4. If completed, begin counting backward
5. Continue scanning previous days
6. Stop when the first incomplete day is found

If the scan reaches the start of the month, the algorithm loads the previous month record and continues scanning.

Example:

June 1 → completed
May 31 → completed
May 30 → completed
May 29 → not completed

Current streak = 3

## Longest Streak Algorithm

Steps:

1. Load all monthly completion records for the habit
2. Iterate through each day chronologically
3. Track consecutive completion runs
4. Record the maximum streak length

Because the dataset size is small, full iteration is acceptable.

## Performance Considerations

Even with many years of usage the data size remains small.

Example:

20 habits × 5 years

Monthly records:

20 × 12 × 5 = 1200 records

This makes streak recalculation inexpensive.

## Optional Cache

A derived statistics cache may store:

habitId
currentStreak
longestStreak
totalCompletions
updatedAt

The cache must be recomputed whenever completion history changes.

## Alternatives Considered

### Persisting Streak State

Rejected because streak values become inconsistent when past days are edited within the grace window.

### Range-based Streak Storage

Rejected because it complicates updates when editing completion history.

## Decision Outcome

Streaks will be computed from completion bitsets, ensuring correctness and avoiding synchronization issues between stored streak values and completion history.
