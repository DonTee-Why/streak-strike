# ADR-006: Habit Deletion Behavior

## Status

Accepted

## Context

Users need the ability to remove habits from the system.

Habit data includes:

• habit metadata  
• monthly completion records  
• derived statistics  

Improper deletion can lead to orphaned records or inconsistent state.

## Decision

Habit deletion will use **application-level cascading deletion**.

When a habit is deleted:

• all related completion data is deleted  
• all related stats are deleted  
• no orphaned data is allowed to remain  

## Rationale

In IndexedDB/Dexie, cascade behavior is not automatic.

Deletion logic must be explicitly implemented in application code.

Using where-based deletes ensures that all related records are removed consistently, even when data changes over time.  [oai_citation:1‡dexie.org](https://dexie.org/docs/cloud/best-practices?utm_source=chatgpt.com)

## Rules

1. Deletion must be atomic (single transaction)  
2. No partial deletion is allowed  
3. Deletion is irreversible  
4. UI must require confirmation before execution  

## Alternatives Considered

### Soft Delete

Rejected for V1 because:
• adds complexity  
• requires filtering everywhere  
• not needed for a private tool  

### Partial Deletion

Rejected because it creates orphaned data.

## Consequences

### Positive

• clean data model
• no orphaned records
• simple logic
• predictable behavior

### Negative

• no undo capability

## Decision Outcome

Deletion is handled explicitly at the application layer using transactional cascading deletes.
