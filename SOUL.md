# Project Soul: DSA Tracker & Spaced Repetition App

## Core Architecture
- **Stack**: MERN (MongoDB, Express.js, React, Node.js)
- **Frontend Styling**: React + Tailwind CSS (Aesthetic: Modern, Dark Mode, Glassmorphism)
- **AI Integration**: LangChain.js (OpenRouter)
- **Environment**: Docker Compose (Full Stack Isolated Dev Environment).
- **Spaced Repetition Algorithm**: SuperMemo-2 (SM-2) for intelligent revision scheduling.

## Current Progress
- **Phase 1-4**: Architecture, Backend, Docker, and Core UI complete.
- **Phase 5: State & API Integration**: Forms and queues connected to DB.
- **Phase 6: Advanced Feature Implementation** (Current):
  - **AI-Graded SM-2 Loop**: Replaced manual 0-5 self-rating with a chill, friendly AI study buddy evaluator. The user types their recalled logic, and the AI compares it to the original notes, scores it 0-5, and updates the SM-2 algorithm.
  - **AI Enhanced Notes**: LangChain automatically cleans up, structures, and converts raw student notes into pedagogical Markdown guides stored in `enhancedNotes`.
  - **Collapsible Notes & Full Schedule View**: Toggle between "Due Today" and "All Questions" with collapsible AI notes.
  - **Question Deletion**: Added full CRUD capability to remove questions from the database.
  - **Problem URL Context in AI Prompt & UI**: Optional LeetCode link is now passed directly into AI classification & grading prompts, and displayed with an external link icon on question cards and review modal headers.
  - **Initial Revision Schedule Offset**: Newly logged questions now automatically schedule 1 day into the future (tomorrow) instead of showing up as due on the day they were solved.
  - **User-Approach First AI Classification & Enhancement**: Updated the AI system prompt (`aiController.js`) to treat the student's raw notes as the absolute source of truth. The LLM must classify the topic/subtopic based on the algorithm the user *actually implemented* (e.g. `Stack` > `Monotonic Stack` for Max Width Ramp if the user used a stack), NOT based on generic LeetCode tags. Added a UI toggle on question cards allowing instant switching between "Your Raw Thoughts" and "AI Structured Guide".
  - **Left Sidebar Hierarchical Accordion**: Implemented a two-tiered taxonomy system where primary topics (e.g. `Stack`, `Queue`, `Array & Two Pointers`) are kept strictly distinct, with expandable subtopics (e.g. `Monotonic Stack`, `Index / Width Calculation`, `Monotonic Queue`, `Sliding Window`). Added an inline dynamic taxonomy inference engine so existing questions are auto-categorized into topics based on their pattern tags. Selecting any topic in the sidebar searches across all logged questions so every question is instantly accessible.
  - **Graft AI Agent Integration**: Integrated NanoNets Graft (`@nanonets/graft`) to turbocharge AI coding agents by providing context-aware graph mappings of the entire repository. This generates deterministic, local knowledge graphs in `graft/` and wires into our agents (`.gemini/`, `GEMINI.md`, `AGENTS.md`) to eliminate exploration overhead and improve response correctness.
  - **LeetCode Progress System & Streak Heatmap**: Added a full LeetCode-style activity tracking dashboard at the top of the app featuring a 22-week contribution grid (color-coded activity levels), live streak calculation (Current Streak 🔥, Best Streak 🏆), and real-time breakdowns of new questions solved vs active recall sessions logged per day.

## Next Logical Steps
1. Add `react-markdown` to render the AI Enhanced Notes with full formatting and code syntax highlighting.
2. 3D Knowledge Graph (`react-force-graph`) to visualize pattern dependencies.

## Key Decisions
- Shifted away from standard self-reported flashcard mechanics. By forcing the user to type out the logic in Natural Language and having a friendly AI grade it, we eliminate the "illusion of competence".
