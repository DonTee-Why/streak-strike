# ADR-007: Insight and Metric Definitions

## Status

Accepted

## Context

StreakStrike is introducing weekly, monthly, and pattern-based insights.

To ensure consistency across releases, metric definitions must be standardized.

## Decision

All insights will be derived from monthly bitset completion history.

No insight metric will become canonical stored data.

Monthly bitsets remain the single source of truth.

## Weekly Completion Rate

Definition:

completedDays / eligibleDays

Eligible days are only days that have already occurred.

Future days are excluded.

Example:

Today = Wednesday

Eligible Days = Monday, Tuesday, Wednesday

Rate = completedDays / 3

## Monthly Completion Rate

Definition:

completedDays / elapsedDaysInMonth

Future days are excluded.

## Weekday Completion Rate

Definition:

completionCount / eligibleCount

Calculated independently for each weekday.

## Best Week

Historical week with the highest completion rate.

Ties are resolved using:

1. Higher completed day count
2. Most recent week

## Best Month

Historical month with the highest completion rate.

Ties are resolved using:

1. Higher completed day count
2. Most recent month

## Trend Direction

Improving:
Current period rate > previous period rate

Declining:
Current period rate < previous period rate

Stable:
Rates equal

## Consequences

### Positive

• Consistent metric definitions
• Predictable insight calculations
• No duplication of source-of-truth data

### Negative

• Additional derived computation required

## Decision Outcome

All insights remain derived from completion history and use fixed, documented definitions.
