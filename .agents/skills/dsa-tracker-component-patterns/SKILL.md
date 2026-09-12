---
name: dsa-tracker-component-patterns
description: "Component architecture and UX specifications for DSA Tracker. Consult when creating, updating, or debugging question cards, modals, the code playground, the topic sidebar, or form controls in client/src/App.jsx."
---

# DSA Tracker Component Patterns & Architecture

This skill provides blueprints for the core UI components in the DSA Tracker application. It ensures every component follows established layout conventions, responsive behavior, and accessibility requirements.

---

## Component Index

| Component | Specification File | Description |
|---|---|---|
| **Question Cards Grid** | [question-cards.md](question-cards.md) | 2-column responsive layout, problem metadata, collapsible notes drawer, and action buttons. |
| **Code Playground Modal** | [code-playground-modal.md](code-playground-modal.md) | Split-pane IDE, custom test-runner console, keyboard shortcuts, and Big-O feedback. |
| **AI Recall Modal** | [ai-recall-modal.md](ai-recall-modal.md) | Natural language explanation form, grading spinner, and SM-2 feedback score cards. |
| **Navigation & Filtering** | [navigation-and-filters.md](navigation-and-filters.md) | Topic -> Subtopic tree accordion, daily revision capacity selector, and practice trigger. |

---

## Universal Component Guidelines

1. **State Isolation**: Complex modal states (Playground, Code Viewer, Recall Review) should manage their transient UI state cleanly without causing full re-renders of background question feeds.
2. **Keyboard Ergonomics**: Any modal must support `Escape` to close. Any code editor must support `Tab` for 4-space indentation and auto-closing bracket pairs.
3. **Empty State Continuity**: Every list or container must handle empty states gracefully (e.g., zero questions due today shows the celebration trophy and a direct "Practice Random Question" CTA).
4. **Responsive Layouts**: Breakpoints follow:
   - Mobile (`< 768px`): Single column cards, vertically stacked playground panes.
   - Tablet (`768px - 1024px`): Single column main feed, simplified sidebar.
   - Desktop (`> 1024px`): 12-column grid (`col-span-3` sidebar + `col-span-9` main feed), 2-column question grid, 50/50 split playground.
