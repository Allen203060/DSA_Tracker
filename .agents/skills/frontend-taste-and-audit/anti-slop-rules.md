# Anti-Slop Rules for AI Agents

These rules prohibit the most common generic mistakes AI coding assistants make when writing frontend interfaces.

---

## 1. Forbidden AI Tropes

### ❌ Never: The Generic "AI Purple Gradient" on Everything
- **Slop**: Making every card, button, heading, and border an oversaturated purple/pink gradient (`bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500`).
- **Standard**: Use deep obsidian base (`#0b0e17` / `#141826`) with solid, restrained indigo accents (`text-indigo-400`, `bg-indigo-600`), and reserve gradients exclusively for subtle ambient background lighting or major milestone celebrations.

### ❌ Never: Muddy Low-Contrast Text on Glass
- **Slop**: Using `text-slate-500` or `text-gray-600` on top of translucent `rgba(20,24,38,0.75)` backgrounds. The text vanishes and forces users to squint.
- **Standard**: Use `text-slate-100` for titles, `text-slate-300` for body, and `text-slate-400` for metadata. Verify WCAG AA 4.5:1 contrast minimums.

### ❌ Never: Unstyled Raw JSON or Code Dumps
- **Slop**: Rendering errors or API responses as `{JSON.stringify(data)}` directly in the DOM.
- **Standard**: Parse and display errors in human-readable alert boxes with an icon and actionable recovery steps.

### ❌ Never: Decorative Empty Spaces & Giant Hero Banners
- **Slop**: Pushing problem cards 800px down the page with a massive marketing hero banner saying *"Supercharge your DSA learning with AI!"*
- **Standard**: This is an active productivity tool. The header is compact (48-64px), stats are inline, and the user immediately sees their due questions and problem queues.

### ❌ Never: Breaking Layout Shifts (CLS)
- **Slop**: Jumping UI heights when AI notes or code snippets load asynchronously.
- **Standard**: Pre-allocate dimensions or use fixed minimum heights with skeleton loaders during async states.
