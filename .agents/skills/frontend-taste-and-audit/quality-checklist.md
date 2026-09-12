# 10-Point UI Quality Pre-Flight Checklist

Before proposing or finalizing any frontend UI change in DSA Tracker, verify all 10 criteria below:

---

## The Checklist

1. [ ] **Color Tokens**: Are colors drawn exclusively from the Tailwind v4 `@theme` palette (`base-950` through `800`, `brand-400`/`500`, semantic emerald/amber/rose)?
2. [ ] **Glass Legibility**: Is background text guaranteed >= 4.5:1 contrast ratio against the `glass-panel` background?
3. [ ] **Responsive Breakpoints**: Does the layout work seamlessly at 375px (mobile), 768px (tablet), and 1280px+ (desktop)?
4. [ ] **Interactive States**: Does every interactive element (button, link, input) provide distinct `:hover`, `:active`, and `:focus-visible` styles?
5. [ ] **Keyboard Navigability**: Can the user navigate with `Tab`, close open modals with `Escape`, and indent code with `Tab`/`Shift-Tab`?
6. [ ] **Loading Feedback**: Does every asynchronous operation (AI enhancement, code execution, recall grading) display an animated spinner or skeleton state?
7. [ ] **Error Boundaries**: Are network failures and compilation errors displayed clearly with recovery instructions, rather than crashing or freezing?
8. [ ] **Empty State Handling**: When there are zero items (e.g. empty category filter or zero due problems), does the UI show a meaningful placeholder and call-to-action?
9. [ ] **Icon Alignment**: Are Lucide icons properly sized (`w-3.5 h-3.5` to `w-5 h-5`), vertically centered with text, and given accessible meanings?
10. [ ] **No Artificial Lag**: Are animation durations kept under 300ms, with transitions strictly applied to `opacity`, `transform`, `background-color`, and `border-color` (avoiding transitions on `width`, `height`, or layout properties)?
