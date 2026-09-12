# AI Recall Review Modal Pattern

The AI Recall Modal implements the active recall spaced repetition test. Instead of passive flashcards, the student writes out their core algorithmic intuition and edge cases in plain English, which an AI tutor evaluates against the canonical solution.

---

## 1. Flow & State Progressions

1. **State: Input Formulation**:
   - Displays problem title and difficulty.
   - Textarea prompting: *"Explain your core approach, data structures, and edge cases from memory..."*
   - Character count and minimum length guideline (>= 20 characters).
2. **State: Evaluating (Loading)**:
   - Evaluator button turns to animated spinner: `Evaluating your intuition...`
   - Shimmering pulse effect across the container.
3. **State: Result & Grade (Completed)**:
   - Displays SuperMemo-2 grade (0 to 5) with color rating:
     - 5: Perfect recall (Emerald)
     - 3-4: Solid grasp with minor omissions (Amber/Sky)
     - 0-2: Fundamental gap (Rose)
   - Formatted AI commentary highlighting:
     - Strengths of student's explanation
     - Missed boundary conditions or time complexities
     - New scheduled review date (e.g. `Next review: in 6 days`).

---

## 2. Modal Overlay Layout Recipe

```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
  <div className="glass-panel w-full max-w-2xl rounded-2xl border border-indigo-500/30 p-6 space-y-5 shadow-2xl">
    {/* Header */}
    <div className="flex items-center justify-between border-b border-white/10 pb-4">
      <div>
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Active Recall Review</span>
        <h2 className="text-lg font-bold text-white mt-0.5">{question.title}</h2>
      </div>
      <button onClick={closeModal} className="text-slate-400 hover:text-white p-1 rounded-lg">
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* Explanation Input or Result */}
    {!gradeResult ? (
      <div className="space-y-3">
        <label className="text-xs text-slate-300 font-medium block">
          Describe your algorithmic intuition, time complexity, and edge cases:
        </label>
        <textarea
          rows={6}
          value={recallText}
          onChange={e => setRecallText(e.target.value)}
          placeholder="e.g., We use a Monotonic Decreasing Stack. As we iterate through temperatures, we pop from the stack while current temp is greater..."
          className="w-full text-sm bg-base-950/80 border border-white/10 rounded-xl p-3.5 text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none resize-none"
        />
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={closeModal} className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white">
            Cancel
          </button>
          <button 
            onClick={submitRecall}
            disabled={isGrading || recallText.trim().length < 15}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGrading ? "Grading Intuition..." : "Submit to AI Tutor"}
          </button>
        </div>
      </div>
    ) : (
      /* Result Display */
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl bg-base-950/80 border border-indigo-500/20">
          <div>
            <span className="text-xs text-slate-400">SM-2 Competence Score</span>
            <div className="text-2xl font-bold text-indigo-400">{gradeResult.grade} / 5</div>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            Next review in {gradeResult.interval} days
          </span>
        </div>
        <div className="p-4 rounded-xl bg-base-900/60 border border-white/5 text-sm text-slate-200">
          <ReactMarkdown>{gradeResult.feedback}</ReactMarkdown>
        </div>
      </div>
    )}
  </div>
</div>
```
