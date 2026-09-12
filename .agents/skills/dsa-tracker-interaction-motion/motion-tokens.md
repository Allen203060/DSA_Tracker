# Motion Tokens & Easings

This document establishes the official animation durations and easing curves for DSA Tracker.

---

## 1. Duration Tiers

| Tier | Duration | Class Equivalent | Use Cases |
|---|---|---|---|
| **Micro / Instant** | 100ms - 150ms | `duration-150` | Button presses, checkbox toggles, hover color shifts, icon rotations. |
| **Standard** | 200ms - 250ms | `duration-200` / `duration-250` | Card elevation on hover, accordion expand/collapse, tab switching. |
| **Deliberate / Overlay** | 300ms - 350ms | `duration-300` | Fullscreen modal entrance/exit, sidebar sliding on mobile, toast entrances. |
| **Long Feedback** | 1500ms - 2000ms | `duration-1000`+ | Temporary "Copied to Clipboard" badge reversion, streak fire celebration. |

---

## 2. Easing Curves

```css
/* Standard Smooth Out (Deceleration for entrances & hovers) */
--ease-out-quad: cubic-bezier(0.16, 1, 0.3, 1);

/* Responsive Spring-like Snappiness */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Tailwind Equivalents
- For interactive controls: `transition-all duration-150 ease-out`
- For cards and modals: `transition-all duration-250 ease-out`

---

## 3. Scale & Elevation Transforms

Never over-scale cards or modals. Keep transforms subtle:
- **Card Hover**: `hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5`
- **Button Active**: `active:scale-[0.98]`
- **Modal Entrance**: `animate-in fade-in zoom-in-95 duration-200`
- **Icon Rotation (Chevrons)**: `transition-transform duration-200 rotate-0` to `rotate-180`
