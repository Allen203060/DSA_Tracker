ffffffffffffffffffffffffffffffffffffff# Project Soul: DSA Tracker & Spaced Repetition App

## Core Architecture
- **Stack**: MERN (MongoDB, Express.js, React, Node.js)
- **AI Integration**: LangChain.js for auto-classification of algorithmic patterns based on user notes.
- **Environment**: Standard isolated Node workspaces (Monorepo approach with `client` and `server`).
- **Spaced Repetition Algorithm**: SuperMemo-2 (SM-2) for intelligent revision scheduling.

## Current Progress
- **Phase 1: Architecture & Planning**:
  - Established project structure and environment initialization steps.
  - Designed Mongoose schemas for `Question` and `Pattern` models, integrating SM-2 tracking fields.
  - Prepared initial terminal commands for user execution (adhering to Manual Handoff rules).

## Next Logical Steps
1. User confirmation of schemas and directory structure.
2. Setup of Express API endpoints for CRUD operations.
3. Implementation of LangChain.js auto-classifier logic.
4. Construction of the React frontend dashboard and spaced repetition view.

## Key Decisions
- Adopted SM-2 fields (`easeFactor`, `interval`, `repetitions`) directly into the `Question` schema for streamlined spaced repetition.
- Emphasized strict relation between questions and patterns to support the progressive learning workflow (e.g., standard stacks -> NGE -> Monotonic Stack).
- Kept the backend decoupled to easily swap AI wrappers or models in the future.
