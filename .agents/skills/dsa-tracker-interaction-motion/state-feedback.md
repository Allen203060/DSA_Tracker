# State Feedback & Micro-Interactions

Design patterns for communicative user feedback across interactive operations.

---

## 1. Copy-to-Clipboard Feedback

When copying code from the Solution Viewer or Playground:

```jsx
const [copied, setCopied] = useState(false);

const handleCopy = () => {
  navigator.clipboard.writeText(code);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

return (
  <button 
    onClick={handleCopy}
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
      copied 
        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
        : 'bg-base-800 text-slate-300 hover:text-white border border-white/10'
    }`}
  >
    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    {copied ? "Copied!" : "Copy Code"}
  </button>
);
```

---

## 2. Popout Standalone Window Feedback

DSA Tracker allows popping code into a standalone native browser window:

```jsx
const popoutCodeWindow = (title, code, language) => {
  const popout = window.open('', '_blank', 'width=850,height=750,menubar=no,toolbar=no,location=no,status=no');
  if (!popout) {
    alert("Pop-up blocked! Please allow pop-ups for this site.");
    return;
  }
  // Inject clean dark-mode syntax HTML into popup
};
```

---

## 3. Shimmer Loading & Skeleton Gradients

During AI evaluation or question fetching, replace blank spaces with subtle animated shimmers:

```jsx
<div className="space-y-3 animate-pulse">
  <div className="h-4 bg-white/5 rounded w-3/4"></div>
  <div className="h-3 bg-white/5 rounded w-1/2"></div>
  <div className="h-20 bg-white/5 rounded-xl"></div>
</div>
```

---

## 4. Streak Fire Celebration

When all due questions for the day have been completed:
- Show a congratulatory trophy banner with a vibrant emerald glow.
- Provide clear next steps (e.g. "Practice a Random Question").
- Maintain high contrast so the user feels rewarded, not blinded.
