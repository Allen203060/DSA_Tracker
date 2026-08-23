# Project Soul: DSA Tracker & Spaced Repetition App

## Core Architecture
- **Stack**: MERN (MongoDB, Express.js, React, Node.js)
- **AI Integration**: LangChain.js for auto-classification of algorithmic patterns based on user notes.
- **Environment**: Standard isolated Node workspaces (Monorepo approach with `client` and `server`).
- **Spaced Repetition Algorithm**: SuperMemo-2 (SM-2) for intelligent revision scheduling.

## Current Progress
- **Phase 1: Architecture & Planning**:
  - Established project structure and environment initialization steps.
  - Designed Mongoose schemas for `Question` and `Pattern` models, integrating SM-2 tracking fields.
  - Prepared initial terminal commands for user execution.
- **Phase 2: Backend API & AI Integration** (Current):
  - Setting up the Express server (`index.js`, DB config).
  - Building the LangChain.js endpoint using `withStructuredOutput` to auto-extract algorithmic patterns from user notes.
  - Building CRUD controllers for Questions with SM-2 logic (updating `easeFactor`, `interval`, `repetitions`).

## Next Logical Steps
1. User creates the provided backend files (`index.js`, config, controllers, routes).
2. Test the LangChain AI endpoint to ensure it correctly classifies a "trick" into a known pattern (e.g., "NGE" -> "Monotonic Stack").
3. Construction of the React frontend dashboard and spaced repetition view.

## Key Decisions
- Adopted SM-2 fields (`easeFactor`, `interval`, `repetitions`) directly into the `Question` schema for streamlined spaced repetition.
- Using Zod with LangChain.js `.withStructuredOutput()` to guarantee the LLM returns an exact JSON array of pattern names.
- Decoupled the AI logic into a separate controller so it can be called explicitly when saving a question, ensuring we don't accidentally create duplicates.
