# ADR-008: Insights Navigation Model

## Status

Accepted

## Context

The Habit screen currently contains:

• Habit metadata
• Calendar
• Rules
• Actions

Adding insight functionality directly to the calendar view would increase visual complexity and reduce focus.

## Decision

Habit functionality will be separated into:

[ Calendar ] [ Insights ]

Calendar focuses on tracking.

Insights focuses on analysis.

## Consequences

### Positive

• Cleaner tracking experience
• Better scalability for future insight features
• Reduced visual clutter

### Negative

• One additional navigation step

## Decision Outcome

Insights will be displayed on a dedicated tab rather than embedded within the Calendar view.
