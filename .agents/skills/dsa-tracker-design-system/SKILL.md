---
name: dsa-tracker-design-system
description: "Foundational visual design tokens and styling rules for DSA Tracker. Consult when styling new components, adjusting color themes, creating badges, or modifying glassmorphism and Tailwind v4 @theme values in client/src/index.css."
---

# DSA Tracker Design System

The visual language of DSA Tracker is built on a **Deep Obsidian Glassmorphism** aesthetic — engineered specifically for developers studying algorithmic problems in long, focused sessions. It avoids eye strain while delivering a tactile, high-contrast, state-of-the-art interface.

---

## Quick Reference Index

| Topic | Reference File | Summary |
|---|---|---|
| **Color & Glass Tokens** | [tokens.md](tokens.md) | Tailwind v4 `@theme` colors, backdrop blur, border opacities, and glass container utilities. |
| **Badges, Tags & Metrics** | [badges-and-chips.md](badges-and-chips.md) | Standardized difficulty chips (`Easy`, `Medium`, `Hard`), SM-2 status pills, and topic tags. |

---

## Core Aesthetic Principles

### 1. Deep Obsidian Base (Not Flat Charcoal)
- The application background is NOT a flat `#000000` or generic gray `#1e1e1e`.
- Base background: `#0b0e17` with subtle, fixed radial ambient gradients:
  ```css
  background-image: 
    radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.08), transparent 35%),
    radial-gradient(circle at 85% 80%, rgba(16, 185, 129, 0.06), transparent 35%);
  background-attachment: fixed;
  ```
- This gives depth and ambient lighting behind semi-translucent glass panels without creating visual noise.

### 2. Physical Glass Depth Hierarchy
Never stack opaque blocks. Every container follows a 3-tier elevation model:
- **Layer 0 (Canvas)**: Background canvas (`#0b0e17`).
- **Layer 1 (Panels & Cards)**: `glass-panel` class:
  ```css
  background: rgba(20, 24, 38, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
  ```
- **Layer 2 (Overlays & Modals)**: Darker backdrop backdrop overlay (`bg-black/75 backdrop-blur-md`) with elevated modal shell (`border-indigo-500/30`, `shadow-2xl shadow-indigo-500/10`).
- **Layer 3 (Interactive Controls & Inputs)**: Inset backgrounds (`bg-base-950/60` or `bg-base-900/80`) with active focus rings (`focus:ring-2 focus:ring-indigo-500/40`).

### 3. High-Contrast Semantic Signaling
In algorithm practice, cognitive load must be minimized:
- **Difficulty indicators** must use instantly recognizable traffic-light semantics with muted backgrounds and vibrant text/borders.
- **Action buttons** (Run, Recall, Edit) must have distinct visual weights — primary actions in glowing Indigo/Violet, execution in Emerald, and destructive actions in Rose.
