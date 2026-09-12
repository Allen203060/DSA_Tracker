# Badges, Chips & Metric Indicators

Standardized component specifications for badges, status chips, and numerical indicators across DSA Tracker.

---

## 1. Difficulty Badges

DSA Tracker uses a 3-tier difficulty model (`Easy`, `Medium`, `Hard`). All difficulty badges must use subtle translucent fills, crisp borders, and colored indicator dots for accessibility.

```jsx
// Easy
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
  Easy
</span>

// Medium
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
  Medium
</span>

// Hard
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
  Hard
</span>
```

---

## 2. Topic & Pattern Tags

For categorizing problems by algorithmic archetype (e.g. `Two Pointers`, `Monotonic Stack`, `Sliding Window`):

```jsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
  <Tag className="w-3 h-3 text-indigo-400" />
  Two Pointers
</span>
```

---

## 3. SM-2 Spaced Repetition Metrics

To display learning metrics without overwhelming the student:

```jsx
// Next Due Chip
<span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
  Due: <span className="text-slate-200 font-medium">Tomorrow</span>
</span>

// Repetitions Counter
<span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
  Rep: <span className="text-slate-200 font-medium">3</span>
</span>

// Ease Factor (EF)
<span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
  <Activity className="w-3.5 h-3.5 text-purple-400" />
  EF: <span className="text-slate-200 font-medium">2.5</span>
</span>
```

---

## 4. Priority Score Badge

The backend calculates a priority score weighting overdue days, difficulty, and competence. When score exceeds critical threshold (> 80), highlight with high urgency:

```jsx
<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold ${
  priorityScore > 80 
    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
    : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
}`}>
  Priority {Math.round(priorityScore)}
</span>
```
