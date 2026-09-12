---
name: frontend-taste-and-audit
description: "Anti-slop frontend quality gate for AI agents working on DSA Tracker. Read before writing any UI code, redesigning views, or refactoring styles to avoid generic LLM design cliches, maintain high taste, and pass the pre-flight checklist."
---

# Frontend Taste & UI Audit Quality Gate

> *"Most AI-generated frontend code is disappointing not because LLMs cannot write code, but because they default to the same generic, repetitive aesthetic tropes: purple meshes, low-contrast text on muddy cards, and unneeded decorative bloat."*

This skill enforces high design standards and pre-flight quality gates for all AI agent modifications to the DSA Tracker user interface.

---

## Quick Reference Index

| Topic | Reference File | Summary |
|---|---|---|
| **Anti-Slop Rules** | [anti-slop-rules.md](anti-slop-rules.md) | Explicit list of forbidden AI tropes, unreadable contrasts, and layout blunders. |
| **10-Point Pre-Flight Checklist** | [quality-checklist.md](quality-checklist.md) | Verification checklist that must be reviewed before committing frontend edits. |

---

## The Design Read Protocol

Before modifying or generating any frontend code in DSA Tracker, formulate a one-line **Design Read**:

> **"Reading this as: [Component/View] for [Target Action], with [Tone/Density], adhering to [Design Tokens]."**

### Example Reads
- *"Reading this as: Problem Card Actions Toolbar for quick review navigation, high density, with crisp keyboard focus and semantic color accents."*
- *"Reading this as: Test Case Runner in Code Playground for rapid debugging, dark mono layout, with immediate pass/fail contrast feedback."*

---

## The Three Dials Configuration

| Dial | Setting (DSA Tracker Standard) | Guidance |
|---|---|---|
| **DESIGN VARIANCE** | `3 / 10` | High consistency. Keep cards, modals, and headers structured. Avoid experimental, chaotic, or asymmetrical layouts in a developer tool. |
| **MOTION INTENSITY** | `4 / 10` | Snappy, functional, restrained. 150-250ms transitions. No bouncing or slow decorative animations. |
| **INFORMATION DENSITY**| `8 / 10` | High density. Developers need to see problem difficulty, repetition intervals, taxonomy tags, and code solutions compactly without excessive whitespace padding. |
