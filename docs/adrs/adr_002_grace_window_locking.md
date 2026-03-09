# ADR-002: Grace Window Locking Model

## Status

Accepted

## Context

Users may forget to mark their habit completion on the exact day it occurred. A grace window is required to allow users to record recent completions without enabling full historical editing.

Without constraints, a grace period could allow users to rewrite their completion history and artificially maintain streaks.

Therefore the system must allow limited backfilling while preserving discipline integrity.

## Decision

The system will implement a **3-day grace window with write-once locking**.

Users may mark completion for the previous three days if those days were not previously marked.

Once a past day is marked, it becomes permanently locked and cannot be edited again.

Days older than the grace window are permanently locked.

## Rules

### Today

• Can be marked
• Can be unmarked
• Remains editable

### Previous 1–3 Days

If unmarked:

• May be marked once

If marked:

• Permanently locked

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

Mark Friday → Friday becomes permanently locked

Mark Saturday → Saturday becomes permanently locked

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

The write-once grace window provides a balanced approach between usability and discipline enforcement.
