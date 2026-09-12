# Design Tokens: Colors, Glass & Utilities

This file defines the authoritative token values used in DSA Tracker's frontend (configured in `client/src/index.css`).

---

## 1. Palette Tokens (Tailwind CSS v4 `@theme`)

```css
@theme {
  /* Obsidian Base Hierarchy */
  --color-base-950: #0b0e17; /* Deepest canvas floor */
  --color-base-900: #0f131f; /* Secondary surface / inputs */
  --color-base-850: #141826; /* Card background baseline */
  --color-base-800: #1a1f33; /* Elevated hover / active panels */
  --color-base-700: #242a42; /* Inactive borders / dividers */

  /* Brand Primary Accents (Indigo / Violet) */
  --color-brand-400: #818cf8; /* High-contrast text & active icons */
  --color-brand-500: #6366f1; /* Primary brand fill & gradients */
  --color-brand-600: #4f46e5; /* Pressed states & glow bases */

  /* Semantic Accents */
  --color-accent: #f43f5e;     /* Rose warning / delete */
}
```

### Functional Semantic Palette

| Token | Hex Code | Purpose |
|---|---|---|
| `emerald-400` / `emerald-500` | `#34d399` / `#10b981` | Easy difficulty, success states, solved markers, code runner success. |
| `amber-400` / `amber-500` | `#fbbf24` / `#f59e0b` | Medium difficulty, pending review, warning notices, streak flame. |
| `rose-400` / `rose-500` | `#fb7185` / `#f43f5e` | Hard difficulty, destructive delete, compilation errors, overdue warnings. |
| `indigo-400` / `indigo-500` | `#818cf8` / `#6366f1` | Primary CTA, AI note enhancement, taxonomy highlights. |
| `cyan-400` / `cyan-500` | `#22d3ee` / `#06b6d4` | Code revision viewer, syntax indicators, execution playground. |

---

## 2. Glassmorphism Specifications

DSA Tracker uses a signature translucent glass recipe with high legibility:

### Standard Glass Panel (`@utility glass-panel`)
```css
.glass-panel {
  background: rgba(20, 24, 38, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
}
```

### Elevated Interactive Glass Card
When hovering over cards or focusable elements:
```css
/* Hover state */
border-color: rgba(99, 102, 241, 0.35);
box-shadow: 0 12px 30px -8px rgba(99, 102, 241, 0.15);
transform: translateY(-2px);
transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
```

---

## 3. Typography Scale & Fonts

- **Primary Typeface**: `'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
- **Monospace Code**: `'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, monospace`

| Role | Font Size | Weight | Color | Tracking |
|---|---|---|---|---|
| App Header Title | `text-xl` or `text-2xl` (20-24px) | `font-bold` (700) | `text-white` | `tracking-tight` |
| Section Headings | `text-lg` (18px) | `font-semibold` (600) | `text-white` | `tracking-normal` |
| Problem Card Title | `text-base` (16px) | `font-semibold` (600) | `text-slate-100 group-hover:text-indigo-400` | `tracking-normal` |
| Metadata & Chips | `text-xs` (12px) | `font-medium` (500) | `text-slate-400` | `tracking-wide uppercase` |
| Code & Input Text | `text-sm` (14px) | `font-mono` (400) | `text-slate-200` | `tracking-normal` |

---

## 4. Custom Scrollbar Specification

For modals, code editors, and the sidebar list:
```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(15, 19, 31, 0.6);
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
```
