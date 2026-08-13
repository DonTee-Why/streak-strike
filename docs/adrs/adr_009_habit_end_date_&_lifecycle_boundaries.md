# ADR-009: Habit End Date & Lifecycle Boundaries

## Status

Accepted

## Context

StreakStrike currently treats habits as open-ended commitments.

Each habit has a `startDate`, but once created, the habit continues indefinitely. All date-sensitive behaviour—including completion eligibility, streak calculations, and metrics—is therefore evaluated from the habit's start date through the current local calendar day.

The existing habit model is:

```ts
{
  id
  name
  color
  startDate
  createdAt
}
```

Some habits, however, represent commitments with a defined duration.

Examples:

- exercise every day for 30 days
- read daily until the end of the month
- complete a routine during a particular program or challenge
- maintain a habit until a specific target date

These habits should not continue accumulating missed days after their intended completion date.

The system therefore needs to support an optional end date while preserving the existing discipline model, grace-window rules, local-date strategy, and monthly bitset storage.

---

## Decision

Habits may optionally define an `endDate`.

The habit tracking period is an **inclusive date range**:

```text
[startDate, endDate]
```

If `endDate` is not defined, the habit continues indefinitely and behaves exactly as it does today.

Example:

```ts
{
  id: "habit_1",
  name: "Read Bible",
  color: "#D4A373",
  startDate: "2026-08-01",
  endDate: "2026-08-30",
  createdAt: "2026-08-01"
}
```

August 1 through August 30 are valid tracking days.

August 31 and later are outside the habit's active tracking period.

---

## Data Model

The Habit model becomes:

```ts
interface Habit {
  id: string
  name: string
  color: string
  startDate: string
  endDate?: string | null
  createdAt: string
}
```

`endDate` must use the same local calendar date format already established by ADR-004:

```text
YYYY-MM-DD
```

An absent or null `endDate` means the habit has no predefined end.

---

## Date Validation Rules

The following rules apply:

```text
startDate <= today
```

If an end date exists:

```text
endDate >= startDate
```

Future end dates are allowed.

Example:

```text
Today: August 12, 2026

Start Date: August 1, 2026
End Date: September 1, 2026
```

This is valid.

---

## Habit Lifecycle

Habit status is derived from dates and must not be stored as canonical state.

Possible lifecycle states:

```ts
type HabitStatus =
  | 'active'
  | 'ended'
```

Derivation:

```ts
if (!habit.endDate || today <= habit.endDate) {
  return 'active'
}

return 'ended'
```

The end date itself remains part of the active habit period.

Therefore:

```text
today == endDate → active
today > endDate  → ended
```

---

## Day State Changes

The existing day-state engine includes states for future, pre-start, active, grace-window, completed, and expired dates.

A new state is introduced:

```text
post_end
```

Day-state evaluation must first apply habit boundaries:

```text
date < startDate
    → pre_start

date > endDate, when endDate exists
    → post_end
```

Only dates within the habit's tracking range proceed through the existing day-state logic.

Conceptually:

```ts
if (date < habit.startDate) {
  return 'pre_start'
}

if (habit.endDate && date > habit.endDate) {
  return 'post_end'
}

return deriveExistingDayState(...)
```

`post_end` days are permanently non-interactive.

---

## Grace Window Behaviour

The existing 3-day grace-window and write-once locking model remains unchanged.

However, grace-window eligibility is bounded by both the start and end dates.

A past date may still be marked after the habit has ended if:

- the target date is on or before `endDate`
- the target date is within the normal 3-day grace window
- the date has not already been marked
- the date is not before `startDate`

Example:

```text
Habit End Date: August 10
Today: August 11
```

August 10 may still be marked because it is a valid habit day inside the grace window.

August 11 cannot be marked because it is after the habit's end date.

The habit ending does not remove legitimate grace-window access to valid historical habit dates.

---

## Metric Boundaries

Existing habit metrics currently operate from `startDate` through today.

For habits with an end date, metric calculations must stop at the earlier of:

- today
- endDate

Define:

```ts
effectiveEndDate = min(today, endDate ?? today)
```

Metrics therefore operate over:

```text
[startDate, effectiveEndDate]
```

---

## Tracking Days

The current `Days Since Start` metric is defined as the number of calendar days from `startDate` through today, inclusive.

For ended habits, the underlying calculation must stop at `endDate`.

```ts
trackingDays =
  daysBetween(
    habit.startDate,
    effectiveEndDate
  ) + 1
```

Example:

```text
Start Date: August 1
End Date: August 30
Today: December 10
```

Result:

```text
Tracking Days = 30
```

The number must not continue increasing after the habit has ended.

The UI may retain the existing `Days Since Start` label initially, but `Tracking Days` or `Days Tracked` is a more accurate long-term label.

---

## Completion Rate

Completion Rate remains:

```text
totalCompletions / trackingDays
```

Completion records after `endDate` must never contribute to the metric.

Existing completion-rate integrity rules remain unchanged:

- value must remain between 0 and 1
- tracking days must be at least 1

---

## Streak Calculation

Streaks remain derived from monthly completion bitsets as defined by ADR-003.

However, the reference date for current streak calculation must respect the habit's end date.

Define:

```ts
streakReferenceDate = min(
  today,
  habit.endDate ?? today
)
```

The current-streak algorithm then executes using `streakReferenceDate` instead of always using today.

Example:

```text
End Date: August 30

August 27 ✓
August 28 ✓
August 29 ✓
August 30 ✓
```

If the user opens StreakStrike on September 10:

```text
Current/Final Streak = 4
```

The habit must not appear to have broken its streak simply because dates after August 30 are incomplete.

Dates outside the tracking period are not missed days.

Longest streak calculation also ignores any dates after `endDate`.

---

## Completion Storage

No changes are required to the monthly bitset storage strategy.

Completion records continue to use:

```text
habitId
year
month
bits
completedCount
updatedAt
```

The existing monthly bitset architecture remains the canonical completion store.

The end date affects eligibility and derived calculations, not completion storage.

---

## Editing the End Date

Changing an end date can alter historical metrics and potentially allow users to remove missed days from their record.

To preserve StreakStrike's discipline model, historical boundaries must not be freely rewritten.

### Before the End Date

While the habit is still active, the user may:

- extend the end date
- shorten the end date, provided the new date is not before today
- remove the end date and make the habit indefinite

### After the Habit Has Ended

Once:

```text
today > endDate
```

the user must not move the end date backwards.

This prevents a user from shortening a failed commitment after the fact in order to remove missed days.

The user may still:

- extend the end date forward
- remove the end date to continue indefinitely

Example of prohibited behaviour:

```text
Start Date: August 1
Original End Date: August 30
Stopped completing after: August 17
Today: September 1

Change End Date → August 17
```

This would rewrite the historical commitment and artificially improve the completion rate.

This behaviour is rejected because it conflicts with the discipline-preserving principles behind the grace-window locking model.

---

## UI Behaviour

Habit creation must support:

```text
Habit Name
Color
Start Date
End Date (optional)
```

Suggested end-date helper text:

```text
Leave empty to track indefinitely.
```

Ended habits should remain visible because their history and metrics remain valuable.

The UI should visually distinguish them using an `Ended` status.

Example:

```text
Read Bible
Mar 1 – Jun 30, 2026
Ended
```

Ended habits must not be automatically deleted.

Habit deletion remains an explicit, irreversible action governed by ADR-006.

---

## Local Date Synchronization

All lifecycle checks must use the application's synchronized current local date.

The existing rollover rules from ADR-005 continue to apply.

When the local day changes, the application must recompute:

- habit lifecycle status
- post-end day states
- streak values
- tracking-day metrics
- completion rate

A habit whose `endDate` was yesterday must transition from `active` to `ended` automatically after local midnight.

---

## Backward Compatibility

Existing habits will not contain an `endDate`.

They must be interpreted as:

```ts
endDate = null
```

Therefore all existing habits continue behaving exactly as they do today.

No completion-history migration is required.

---

## Consequences

### Positive

- Supports finite commitments and challenges
- Prevents ended habits from accumulating artificial missed days
- Preserves meaningful final streaks
- Fits the existing local-calendar model
- Requires no change to monthly completion storage
- Maintains backward compatibility with existing habits

### Negative

- Introduces another boundary into day-state logic
- Requires metric and streak calculations to respect an effective end date
- End-date editing rules become more restrictive after a habit ends

---

## Alternatives Considered

### Store Habit Status

Rejected because `active` and `ended` can be deterministically derived from `endDate` and the current local date.

Persisting the status would introduce unnecessary synchronization risk.

### Automatically Archive Ended Habits

Rejected because ending and archiving represent different concepts.

An ended habit still contains useful history and metrics.

### Allow Unlimited Historical End-Date Editing

Rejected because users could retroactively shorten commitments to erase missed days and improve their statistics.

This conflicts with StreakStrike's discipline model.

### Delete Completion Data Outside a New End Date

Rejected.

Historical completion data must never be silently destroyed as a side effect of metadata editing.

---

## Decision Outcome

StreakStrike will support an optional habit `endDate`.

The habit's active tracking period is inclusive from `startDate` through `endDate`.

Dates after the end date are outside the habit and must not count as missed days, affect streaks, or contribute to completion metrics.

Ended habits preserve their history and derived statistics.

End-date modification must prevent retroactive shortening of completed commitments, preserving the integrity of the user's historical discipline record.