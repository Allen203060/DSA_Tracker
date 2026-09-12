# Navigation, Filters & Controls Pattern

This file documents the specifications for the hierarchical Topic Sidebar, Daily Revision Limit controls, and quick Practice mode triggers.

---

## 1. Two-Tiered Topic Accordion Sidebar

The left navigation column houses the taxonomy tree (`Topic -> Subtopic`).

### Interaction Specifications
- Clicking a Topic expands/collapses its subtopics while filtering the feed to all questions in that topic.
- Clicking a Subtopic filters specifically to that subtopic.
- A clear visual badge indicates question count per category (e.g. `Stack (12)` -> `Monotonic Stack (5)`).
- Clicking "All Topics" resets the active filter.

```jsx
<aside className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
  <div className="flex items-center justify-between border-b border-white/5 pb-3">
    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
      <Layers className="w-4 h-4 text-indigo-400" />
      Taxonomy
    </h3>
    <button 
      onClick={resetFilter}
      className="text-[11px] text-slate-400 hover:text-indigo-300 font-medium"
    >
      Clear Filter
    </button>
  </div>

  {/* Topic Tree */}
  <div className="space-y-1">
    {Object.entries(taxonomyTree).map(([topic, subtopics]) => (
      <div key={topic} className="space-y-0.5">
        <button
          onClick={() => toggleTopic(topic)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedTopic === topic ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <span className="flex items-center gap-2">
            <Folder className="w-3.5 h-3.5 text-slate-400" />
            {topic}
          </span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        {isExpanded && (
          <div className="ml-4 pl-2 border-l border-white/10 space-y-0.5 my-1">
            {subtopics.map(sub => (
              <button
                key={sub}
                onClick={() => selectSubtopic(sub)}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                  selectedSubtopic === sub ? 'text-indigo-400 font-semibold bg-indigo-500/10' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
</aside>
```

---

## 2. Daily Revision Limit Selector

Located in the app header, allowing users to bound their daily workload to prevent burnout:

```jsx
<div className="flex items-center gap-2 bg-base-950/60 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
  <span className="text-slate-400 font-medium">Daily Quota:</span>
  <select
    value={dailyRevisionLimit}
    onChange={e => handleLimitChange(Number(e.target.value))}
    className="bg-transparent text-indigo-400 font-semibold outline-none cursor-pointer"
  >
    <option value={2} className="bg-base-900 text-slate-200">2 / day</option>
    <option value={3} className="bg-base-900 text-slate-200">3 / day</option>
    <option value={5} className="bg-base-900 text-slate-200">5 / day</option>
    <option value={10} className="bg-base-900 text-slate-200">10 / day</option>
    <option value={999} className="bg-base-900 text-slate-200">Unlimited</option>
  </select>
</div>
```
