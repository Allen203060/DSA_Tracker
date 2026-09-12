---
name: dsa-tracker-interaction-motion
description: "Micro-interactions, animation curves, feedback choreography, and accessibility standards for DSA Tracker. Consult when adding animations, loading feedback, transition states, or keyboard accessibility to UI components."
---

# DSA Tracker Interaction & Motion

Fluid, purposeful motion is essential to make DSA Tracker feel modern, responsive, and tactile without introducing distracting delay into a developer's workflow.

---

## Quick Reference Index

| Topic | Reference File | Summary |
|---|---|---|
| **Motion Tokens & Easings** | [motion-tokens.md](motion-tokens.md) | Standardized duration tiers (150ms, 250ms, 350ms) and cubic-bezier easing curves. |
| **State Feedback & Micro-interactions** | [state-feedback.md](state-feedback.md) | Toast notifications, clipboard feedback, popout windows, and AI grading spinners. |
| **Accessibility & Keyboard Flow** | [accessibility.md](accessibility.md) | `prefers-reduced-motion` compliance, ARIA labeling, focus rings, and Escape handlers. |

---

## Core Motion Principles

1. **Snappy over Scenic**: DSA Tracker is a developer tool. Transitions must complete in under 350ms. Never make the user wait for a decorative bounce before an action is actionable.
2. **Predictable Geometry**: Elements should expand from their origin (e.g. accordion drawers slide down naturally, modals fade + scale gently from `0.98` to `1.0`).
3. **Optimistic Feedback**: When an action is initiated (e.g. "Mark Reviewed" or "Copy Code"), provide visual acknowledgement instantly before network round-trips complete.
4. **Reduced Motion Respect**: Always support `motion-reduce:transition-none` and `motion-reduce:animate-none` for users sensitive to vestibular motion.
