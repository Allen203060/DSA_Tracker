# Code Playground Modal Pattern

The Code Playground is an in-browser development environment enabling students to write, test, and execute algorithmic solutions with real-time test case feedback and Big-O evaluation.

---

## 1. Split-Pane Architecture

On screens `>= 1024px`, the modal splits into two synchronized columns:
- **Left Column (7 cols)**: Monaco-style code editor with line numbers, syntax template selector, and formatting keyboard shortcuts.
- **Right Column (5 cols)**: Test case parameters, custom inputs, execution console, and AI complexity analysis.

On screens `< 1024px`, columns stack vertically with scrollable overflow.

---

## 2. Editor Keyboard Shortcuts Spec

The editor must implement intuitive IDE keyboard ergonomics:

1. **Tab Key**:
   - Single line: Inserts 4 spaces at cursor.
   - Multi-line selection: Indents selected lines by 4 spaces.
2. **Shift + Tab**:
   - Multi-line selection: Outdents lines by 4 spaces.
3. **Enter Key**:
   - Auto-indents to match the indentation depth of the preceding line.
   - If the preceding line ended in `{`, `(`, or `[`, increments indentation by 4 spaces and places closing bracket on a new indented line.
4. **Auto-Closing Brackets & Quotes**:
   - Typing `(`, `[`, `{`, `"`, or `'` automatically inserts closing character and positions cursor between them.
5. **Backspace over Empty Pair**:
   - Pressing backspace between `()` or `{}` removes both characters simultaneously.

---

## 3. Test Cases & Execution Runner Layout

```jsx
<div className="space-y-4">
  {/* Test Cases Accordion / Tabs */}
  <div className="flex items-center justify-between">
    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Test Cases</h4>
    <button onClick={addTestCase} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
      <Plus className="w-3.5 h-3.5" /> Add Case
    </button>
  </div>

  {/* Individual Test Case Card */}
  <div className="p-3 rounded-lg bg-base-950/80 border border-white/5 space-y-2">
    <div>
      <label className="text-[11px] text-slate-500 uppercase font-mono">Input:</label>
      <input 
        value={tc.input} 
        onChange={e => updateInput(idx, e.target.value)} 
        className="w-full text-xs font-mono bg-base-900 px-2 py-1 rounded border border-white/10 text-slate-200"
      />
    </div>
    <div>
      <label className="text-[11px] text-slate-500 uppercase font-mono">Expected Output:</label>
      <input 
        value={tc.expectedOutput} 
        onChange={e => updateExpected(idx, e.target.value)} 
        className="w-full text-xs font-mono bg-base-900 px-2 py-1 rounded border border-white/10 text-slate-200"
      />
    </div>
  </div>

  {/* Execution Output Console */}
  <div className="p-3 rounded-lg bg-black/90 border border-white/10 font-mono text-xs">
    <div className="flex items-center justify-between text-slate-400 mb-2 border-b border-white/10 pb-1">
      <span>Console Output</span>
      {status === 'Passed' && <span className="text-emerald-400 font-bold">ALL TESTS PASSED</span>}
      {status === 'Failed' && <span className="text-rose-400 font-bold">TEST FAILED</span>}
    </div>
    <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">{stdout || "Ready to execute..."}</pre>
  </div>
</div>
```
