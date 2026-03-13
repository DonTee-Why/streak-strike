# ADR-005: Day Rollover State Synchronization

## Status
Accepted

## Context

The application is date-sensitive. Core business rules depend on the correct value of the current local calendar day, including:

• day state derivation
• grace window eligibility
• streak calculation
• marking and locking behavior

If the application remains open across midnight and the current day is only computed once at load time, the UI and write logic can become stale.

This can cause users to:

• mark the wrong day
• see incorrect grace window states
• see stale streak values
• interact with an outdated definition of "today"

Because StreakStrike is a discipline application, stale day state is unacceptable.


## Decision

The application will treat the current local calendar date as live application state.

The system must automatically resynchronize date-sensitive state whenever the local calendar day changes while the app remains open.


## Required Synchronization Triggers

The application must resync the current local date using all of the following triggers:

### 1. App Initialization

When the application starts, it must compute and store the current local calendar day.


### 2. Midnight Rollover Timer

The application must schedule a timer to the next local midnight.

When the timer fires, the application must:

• recompute today
• refresh date-sensitive derived state
• schedule the next midnight timer


### 3. Window Focus / App Resume

Whenever the application regains focus or resumes from background/sleep state, it must check whether the stored current day is stale and refresh if needed.


### 4. Visibility Recovery

When the document or desktop window becomes visible again, the application must check whether the day has changed and refresh if needed.


### 5. Pre-Write Guard

Before any mark or unmark action is processed, the application must verify that the stored current day is still correct.

This protects data integrity even if the UI becomes stale.


## Consequences

### Positive

• Prevents stale "today" state
• Prevents marking the wrong day after midnight
• Keeps grace window logic accurate
• Keeps streak calculations accurate
• Improves reliability for long-running sessions


### Negative

• Introduces a small amount of additional state synchronization logic


## Implementation Guidance

The system should maintain a central source of truth for the current local date.

Suggested state shape:

```
currentLocalDate: YYYY-MM-DD
```

The state should be used by:

• day-state engine
• grace window evaluation
• streak calculation
• mark/unmark write operations

The system should not rely on ad hoc calls to `new Date()` across components.


## Alternatives Considered

### Compute Today Only at Initial Load

Rejected because the application may remain open across midnight, causing stale day state.


### Refresh Only on Render

Rejected because React renders do not automatically occur when the calendar day changes.


### Refresh Only on Focus

Rejected because the app may remain visible and active through midnight without a focus event.


## Decision Outcome

StreakStrike will maintain a live, synchronized local-date state and refresh all date-sensitive logic at midnight, on focus/visibility recovery, and before write actions.

