# ADR-002: Grace Window Correction Locking Model

## Status

Accepted

## Context

Users may forget to mark their habit completion on the exact day it occurred. A grace window is required to allow users to record recent completions without enabling full historical editing.

Without constraints, a grace period could allow users to rewrite their completion history and artificially maintain streaks.

Therefore the system must allow limited backfilling while preserving discipline integrity.

## Decision

The system will implement a **3-day grace window with one correction cycle**.

Users may mark completion for the previous three days if those days are not before the habit's start date.

The grace window only applies on or after the habit's start date. Previous days before the habit's start date are permanently locked and cannot be marked.

When a past day is marked during grace, it may be unmarked once while it remains inside the grace window. After that correction is used, it may be marked once more. Once marked after the correction is used, it becomes permanently locked and cannot be edited again.

Days older than the grace window are permanently locked.

## Rules

### Today

• Can be marked
• Can be unmarked
• Remains editable

### Previous 1–3 Days

If unmarked:

• May be marked, unless before the habit's start date

If marked during grace and the correction is unused:

• May be unmarked once

If marked after the correction is used:

• Permanently locked

### Before Habit Start Date

• Permanently locked
• Cannot be edited, even inside the grace window

### Older Days

• Permanently locked
• Cannot be edited

## Example Scenario

Today: Monday

Last marked day: Thursday

Grace window days:

Friday
Saturday
Sunday

User actions:

Mark Friday → Friday can be corrected once

Unmark Friday → Friday can be marked once more

Mark Friday again → Friday becomes permanently locked

Mark Saturday → Saturday can be corrected once

Sunday remains markable until grace window expires

## Consequences

### Positive

• Allows realistic delayed logging
• Prevents users from rewriting history
• Protects streak integrity

### Negative

• Slightly more complex UI state logic

## Alternatives Considered

### Unlimited Backfilling

Rejected because it allows users to fabricate streak history.

### No Grace Period

Rejected because it punishes users who forget to log a completion on the same day.

## Decision Outcome

The one-correction grace window provides a balanced approach between realistic mistake correction and discipline enforcement.
