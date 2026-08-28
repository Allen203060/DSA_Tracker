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
- **Phase 6: Advanced Feature Implementation**:
  - **AI-Graded SM-2 Loop**: Replaced manual 0-5 self-rating with a chill, friendly AI study buddy evaluator.
  - **AI Enhanced Notes**: LangChain automatically cleans up, structures, and converts raw student notes into pedagogical Markdown guides stored in `enhancedNotes`.
  - **Collapsible Notes & Full Schedule View**: Toggle between "Due Today" and "All Questions" with collapsible AI notes.
  - **Question Deletion**: Added full CRUD capability to remove questions from the database.
  - **Problem URL Context in AI Prompt & UI**: Optional LeetCode link is now passed directly into AI classification & grading prompts.
  - **Initial Revision Schedule Offset**: Newly logged questions automatically schedule 1 day into the future (tomorrow).
  - **User-Approach First AI Classification & Enhancement**: System prompt treats student raw notes as source of truth.
  - **Left Sidebar Hierarchical Accordion**: Two-tiered taxonomy system (Topics -> Subtopics).
  - **Graft AI Agent Integration**: Knowledge graph mappings in `graft/`.
  - **NVIDIA Nemotron LLM & Token Cap Optimization**: Configured `maxTokens: 1000` for OpenRouter models.
  - **Solution Code Storage & Standalone Revision Window**: Save solution code with `CodeViewerModal` & popout windows.
  - **Interactive Coding Space & AI Compiler/Grader**: `CodePlaygroundModal` for step-by-step test execution & Big-O complexity feedback.
  - **Visual UI Refinement & Readme Alignment**: Aligned frontend strictly with visual documentation images.
- **Phase 7: Difficulty Scaling & Workload Management** (Current):
  - **Question Difficulty Schema & Classification**: Enhanced `Question` schema, AI classification schema, and controllers to support `difficulty` (`Easy`, `Medium`, `Hard`).
  - **Priority-Based Dynamic Workload Rescheduling**: Implemented `getPriorityScore` in `questionController.js` weighting difficulty multipliers, overdue days, and student competence.
  - **User-Defined Daily Revision Workload Limit**: Added UI selector (`2`, `3`, `5`, `10`, `Unlimited` problems/day) persisting in `localStorage`. Overdue questions exceeding daily capacity are automatically rescheduled across future days based on priority urgency to prevent revision burnout.
  - **Dynamic Difficulty Pill Badges & Form Controls**: Added difficulty selection pills in the Log Question form and high-contrast color badges (`Easy` green, `Medium` amber, `Hard` rose) across question cards.

## Next Logical Steps
1. Add `react-markdown` and `react-syntax-highlighter` to render AI Enhanced Notes with code blocks.
2. 3D Knowledge Graph (`react-force-graph`) to visualize pattern dependencies.

## Key Decisions
- Shifted away from standard self-reported flashcard mechanics. By forcing the user to type out the logic in Natural Language and having a friendly AI grade it, we eliminate the "illusion of competence".
- Non-Destructive Daily Revision Slicing: The daily revision limit acts as a dynamic priority-weighted filter (`questions.slice(0, limit)`) on due items without mutating `nextReviewDate` in MongoDB. This ensures that adjusting the daily limit (decreasing or increasing back up) dynamically shows or hides due items without permanently postponing them.
