# ADR-004: Time Handling & Local Date Strategy

## Status

Accepted

## Context

The application determines habit completion based on calendar days. Incorrect handling of timezones or timestamps can cause days to shift (for example, marking a habit late at night appearing on the next day).

Since this is a local-first, single-user application, the simplest and safest approach is to treat days purely as local calendar dates.

Global time synchronization is not required.

## Decision

The system will treat dates as local calendar days, not timestamps.

All completion operations are based on the user’s device local timezone.

Dates will be represented using the format:

YYYY-MM-DD

Example:

2026-03-09

This format represents a calendar day, not a specific moment in time.

## Key Rules

### Determining Today

The application determines "today" using the device’s local time.

Example logic:

```
const today = new Date()
const localDate = formatToYYYYMMDD(today)
```

### Calendar Operations

All operations use date strings rather than timestamps.

Example:

```
markCompletion(habitId, "2026-03-09")
```

This prevents timezone offsets from shifting recorded completion days.

### Grace Window Calculation

Grace window logic uses date differences rather than time differences.

Example:

```
difference = daysBetween(targetDate, today)
```

Rules:

```
difference = 0 → today
difference = 1–3 → grace window
difference > 3 → locked
```

### Storage Model Alignment

The monthly bitset storage model aligns naturally with this strategy.

Month records are stored using:

```
year
month
```

Example:

```
year: 2026
month: 3
```

The bit index directly corresponds to the day of the month.

## Consequences

### Positive

• Eliminates timezone conversion errors
• Simplifies streak calculations
• Matches the user's mental model of calendar days
• Works naturally with the monthly bitset architecture

### Negative

If the user manually changes their device timezone, the definition of "today" may shift.

However, because this is a private single-user system, this trade-off is acceptable.

## Alternatives Considered

### UTC Timestamp Storage

Rejected because habit tracking is calendar-based rather than time-based.

UTC timestamps introduce unnecessary complexity and can cause off-by-one-day errors.

## Decision Outcome

Habit completion will be tracked using local calendar dates only, ensuring predictable and intuitive behavior for users.
