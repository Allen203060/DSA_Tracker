# Question Card Pattern

The Question Card is the primary unit of interaction in DSA Tracker. It presents an algorithmic problem along with its difficulty, learning metrics, notes drawer, and action buttons.

---

## 1. Visual Hierarchy & Anatomy

A Question Card consists of 4 distinct functional zones:

```
+-------------------------------------------------------------+
| [Topic / Subtopic Tag]                 [Difficulty Badge]    |
| Problem Title (with LeetCode link icon)                     |
| Next Due Date | Repetition Count | Priority Score           |
+-------------------------------------------------------------+
| [Collapsible Notes Drawer: AI Enhanced vs Raw Markdown]     |
+-------------------------------------------------------------+
| [Review Recall]  [View Code]  [Playground]        [Delete]  |
+-------------------------------------------------------------+
```

---

## 2. Card Container Code Recipe

```jsx
<div className="glass-panel rounded-xl p-5 border border-white/10 hover:border-indigo-500/30 transition-all duration-200 flex flex-col justify-between group shadow-lg hover:shadow-indigo-500/5">
  {/* Header Section */}
  <div>
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
        {question.topic} • {question.subtopic}
      </span>
      <DifficultyBadge difficulty={question.difficulty} />
    </div>

    <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors flex items-center gap-2">
      {question.title}
      {question.url && (
        <a href={question.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </h3>

    {/* Metrics Bar */}
    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5 text-xs text-slate-400 font-mono">
      <span>Due: <strong className="text-slate-200">{formatDueDate(question.nextReviewDate)}</strong></span>
      <span>Rep: <strong className="text-slate-200">{question.repetitions}</strong></span>
      {question.priorityScore && (
        <span className="text-indigo-400">Score: {Math.round(question.priorityScore)}</span>
      )}
    </div>
  </div>

  {/* Notes Accordion */}
  {question.notes && (
    <div className="mt-4 pt-3 border-t border-white/5">
      <button 
        onClick={() => toggleNotes(question._id)}
        className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
      >
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {isExpanded ? "Hide Notes" : "View Intuition & Notes"}
      </button>

      {isExpanded && (
        <div className="mt-2 text-xs text-slate-300 bg-base-950/70 p-3 rounded-lg border border-white/5 max-h-48 overflow-y-auto">
          <ReactMarkdown>{question.enhancedNotes || question.notes}</ReactMarkdown>
        </div>
      )}
    </div>
  )}

  {/* Actions Toolbar */}
  <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/10">
    <div className="flex items-center gap-2">
      <button 
        onClick={() => openRecallModal(question)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
      >
        Review Recall
      </button>
      <button 
        onClick={() => openCodeViewer(question)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-base-800 hover:bg-base-700 text-slate-200 border border-white/10 transition-all"
      >
        View Code
      </button>
      <button 
        onClick={() => openPlayground(question)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
        title="Practice in Playground"
      >
        <Play className="w-4 h-4" />
      </button>
    </div>

    <button 
      onClick={() => handleDelete(question._id)}
      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
      title="Delete Question"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
</div>
```
