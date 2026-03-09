# PRODUCT REQUIREMENTS DOCUMENT

# PRODUCT: StreakStrike

## 1. Product Overview

StreakStrike is a private habit discipline application that helps users keep promises to themselves by visually marking completed days on a calendar.

The core interaction is simple and intentional: users cross out a date when they complete a habit for that day.

The product focuses on discipline and commitment tracking rather than productivity management or analytics.

This is a **single‑player tool** designed to replicate the psychological experience of crossing out days on a physical calendar.

No social features, reminders, or gamification are included in the initial version.

---

# 2. Product Philosophy

The application is built around a single behavioral principle:

**Do not break the chain.**

Seeing a growing chain of completed days encourages consistency and discipline.

The product intentionally avoids complex productivity systems. The goal is to create a calm, focused tool that allows users to visually track their commitment to habits.

Key principles:

• Simplicity
• Visual progress
• Discipline reinforcement
• Minimal friction

---

# 3. Target User

Primary user:

Individuals who want a simple system to track habits and maintain discipline.

Examples:

• Fitness tracking
• Daily reading
• Journaling
• Prayer or meditation
• Learning routines

Users prefer a minimal interface over productivity dashboards.

---

# 4. Core Product Concept

Each habit has its own calendar.

Users mark the day when the habit is completed.

The application visually crosses out the date to indicate completion.

Example mental model:

A wall calendar where the user draws an "X" over each day they successfully complete a commitment.

---

# 5. Core Features

## 5.1 Habit Creation

Users can create a habit with the following fields:

• Habit name
• Color
• Start date

No scheduling or frequency rules are required.

## 5.2 Habit List

The home screen displays all habits.

Each habit shows:

• Habit name
• Current streak
• Habit color

Users can tap a habit to open its calendar.

## 5.3 Habit Calendar

Each habit has a dedicated calendar view.

The calendar shows:

• Completed days
• Markable days
• Locked days

Completed days display a visual "X".

## 5.4 Day Completion Interaction

Users tap a date to mark completion.

The system draws an animated "X" across the day.

If the date is eligible, tapping will mark completion.

## 5.5 Streak Display

Each habit displays:

• Current streak
• Longest streak

The streak is calculated from the completion history.

---

# 6. Grace Period Rule

Users may mark previous dates within a **3‑day grace window**.

Example:

If today is Monday, users may mark:

• Sunday
• Saturday
• Friday

However, the following restrictions apply:

1. Past dates can only be marked **once**.
2. Once marked, the date becomes **permanently locked**.
3. Past dates that were never marked become **permanently missed** after the grace window expires.

This rule prevents users from rewriting history while allowing reasonable flexibility.

---

# 7. Day States

Each day can exist in one of the following states:

1. Future day
2. Today (editable)
3. Grace period day (markable if unmarked)
4. Grace period completed day (locked)
5. Expired missed day
6. Expired completed day

---

# 8. Visual Indicators

Calendar legend:

• X = completed
• . = markable
• – = locked/missed

---

# 9. Interaction Rules

### Today

Users can mark or unmark today's completion.

### Grace Window Days

Users can mark a day **once** if it has not previously been marked.

Once marked, the day cannot be edited again.

### Expired Days

Dates older than the grace window are permanently locked.

---

# 10. Out of Scope (V1)

The following features are intentionally excluded from V1:

• Notifications
• Reminders
• Social challenges
• Habit analytics dashboards
• Coaching systems
• Gamification

These may be considered for future versions.

---

# 11. Version 1 Success Criteria

The application is successful if users can:

1. Create habits
2. Mark completed days
3. Maintain visible streaks
4. Quickly log daily completion

The entire daily interaction should take **less than 10 seconds**.

---

# 12. Long‑Term Vision

Future versions may introduce:

• habit insights
• pattern analysis
• streak risk detection
• visual discipline timelines

However, the product must always remain focused on **discipline rather than productivity management**.
