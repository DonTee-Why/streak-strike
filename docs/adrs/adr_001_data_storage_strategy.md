# ADR-001: Data Storage Strategy — Monthly Bitsets

## Status

Accepted

## Context

The application must store habit completion history efficiently while supporting fast calendar rendering and streak calculations.

A naïve approach would store one database record per habit per day. Over long periods this would create thousands of records per user and introduce unnecessary storage and query overhead.

Example scenario:

20 habits tracked for 5 years

Daily record model:
20 × 365 × 5 ≈ 36,500 records

While manageable, this structure is unnecessarily verbose for binary completion data.

The application UI is calendar-based and naturally grouped by month. Therefore a storage model aligned with calendar months is more appropriate.

## Decision

Habit completion data will be stored using **monthly bitsets**.

Each habit will have one record per month representing completion status for each day.

### Data Structure

HabitMonth

habitId
year
month
bits
completedCount
updatedAt

### Bitset Representation

Each bit represents the completion state of a day.

Mapping:

bit 0  → day 1
bit 1  → day 2
bit 2  → day 3
...
bit 30 → day 31

Value meaning:

1 = habit completed
0 = habit not completed

Example bitset:

"1010010000000000000000000000000"

Meaning:

Day 1 completed
Day 2 not completed
Day 3 completed
Day 4 not completed
Day 5 not completed
Day 6 completed

## Consequences

### Positive

• Extremely compact storage
• Natural alignment with calendar UI
• Fast month retrieval
• Efficient streak calculations
• Scales easily to many years of usage

### Negative

• Requires bit manipulation logic
• Requires cross-month streak calculations

## Alternatives Considered

### Daily Row Storage

One row per habit per day.

Rejected because it produces unnecessary database growth and more complex queries.

### Range-based Streak Storage

Store streak start/end ranges.

Rejected because streaks are derived data and would become inconsistent if past days are edited.

## Decision Outcome

Monthly bitsets provide the best balance of storage efficiency, query simplicity, and alignment with the calendar-based UI of the application.
