# Accessibility & Keyboard Flow

Guidelines for ensuring DSA Tracker remains accessible, keyboard-friendly, and compliant with accessibility standards.

---

## 1. Focus Visible Rings

Never remove outline styles without providing an explicit `:focus-visible` alternative. All interactive buttons, links, and form fields must have a crisp 2px offset focus ring:

```css
focus-visible:outline-none 
focus-visible:ring-2 
focus-visible:ring-indigo-500/80 
focus-visible:ring-offset-2 
focus-visible:ring-offset-base-950
```

---

## 2. Keyboard Modal Escape Management

Every modal (Playground, Code Viewer, Recall Review) must bind a window-level keydown listener for `Escape`:

```jsx
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

---

## 3. Reduced Motion Support

For users who have requested reduced motion in their OS settings:

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Or in Tailwind: `motion-reduce:transition-none motion-reduce:animate-none`.

---

## 4. Color Contrast Ratios

Text on dark glass surfaces must satisfy WCAG AA contrast (minimum 4.5:1 for normal text, 3:1 for large text):
- Secondary text on `#141826` glass must be at least `text-slate-400` (`#94a3b8`), never darker.
- High-priority interactive labels should be `text-slate-100` (`#f1f5f9`) or `text-white`.
- Disabled buttons should retain legible text (`text-slate-500` on `bg-base-900`) with an explicit `cursor-not-allowed` cursor.
