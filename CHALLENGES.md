# Development Challenges & Solutions

## Challenge 1: Connection Reset By Peer (Docker/Express)
**The Bug/Challenge:**
When attempting to `curl` the `/api/ai/classify` endpoint after transitioning to OpenRouter, the terminal returned `Connection reset by peer`.
**The Root Cause/Trade-off:**
Docker prioritized the existing anonymous volume (`/app/node_modules`) over the newly built image's dependencies, causing an `ERR_MODULE_NOT_FOUND` crash loop on startup.
**The Solution:**
Ran `docker compose up --build -V -d` to force Docker to renew anonymous volumes.

## Challenge 2: Mongoose Schema Validation Error (500 Internal Server Error)
**The Bug/Challenge:**
When submitting a new question from the React frontend, the UI threw a `500 Internal Server Error`.
**The Root Cause/Trade-off:**
By modifying the frontend `catch` block to expose `error.response.data.error`, we discovered: `Question validation failed: url: Path 'url' is required.` The Mongoose schema strictly required a URL, but the frontend was designed to treat the URL as an optional field. Because the URL string was empty, MongoDB rejected the document insertion, triggering a 500 error in the Express route.
**The Solution:**
Updated the Mongoose schema definition for the `url` field to `required: false`.

## Challenge 3: OpenRouter Credit Limit & 4096-Token Default Reserve Error
**The Problem:**
OpenRouter returned an error: `This request requires more credits, or fewer max_tokens. You requested up to 4096 tokens, but can only afford 1766`.
**Root Cause:**
By default, `ChatOpenRouter` requests the max context window (4096 tokens) if `maxTokens` is unconstrained, causing OpenRouter's pre-flight balance check to reject requests on accounts with remaining but smaller credit balances.
**Solution:**
1. Switched model to `nvidia/nemotron-3.5-lightning` (with free model fallback `nvidia/nemotron-3-super-120b-a12b:free`).
2. Explicitly configured `maxTokens: 1000` in `ChatOpenRouter` instantiation, limiting the pre-flight token reserve check to 1000 tokens.
**Key Takeaway:**
Always set an explicit `maxTokens` cap on LLM calls when using pay-per-token API gateways to avoid inflated pre-allocation checks.

## Challenge 4: Visual UI Alignment Without Breaking Complex Application Logic
**The Problem:**
Aligning the React UI (`client/src/App.jsx`) with the exact screenshot mockups in `README.md` (`dashboard.png`, `code_viewer.png`, `code_playground.png`) required restructuring layout grids, modal headers, stat cards, and sidebar accordion hierarchies without causing regressions in SM-2 spaced repetition state, code editor key handlers, or AI evaluation flows.
**Root Cause:**
Visual redesigns often risk inadvertently dropping subtle event handlers, state variables, or modal triggers when replacing nested JSX containers.
**Solution:**
Maintained a zero-touch policy on state variables and async handlers (`fetchQuestions`, `handleCodeKeyDown`, `submitRecall`, `handleRunCodeEvaluator`), while modularly updating the JSX layer with glassmorphism utility classes (`glass-panel`), responsive grid layouts (`grid-cols-2`, `grid-cols-1 md:grid-cols-2`), and high-contrast color tokens matching the reference designs.
**Key Takeaway:**
Decouple visual styling and structural containers from application state handlers during UI overhauls to ensure feature stability.

## Challenge 5: Workload Burnout & Priority-Based Revision Rescheduling
**The Problem:**
As users log dozens of DSA problems, SM-2 scheduling can cause a backlog of 20+ due problems on a single day, leading to revision fatigue and broken study habits. Simply hard-truncating the due list left overdue questions in limbo without updating their target review dates.
**Root Cause:**
Standard SM-2 algorithms evaluate each question independently without considering global daily human cognitive limits or problem difficulty weighting.
**Solution:**
1. Added a `difficulty` field (`Easy`, `Medium`, `Hard`) to the `Question` schema and Zod AI classifier.
2. Built `getPriorityScore` in `questionController.js` that dynamically ranks due questions based on `difficultyMultiplier` (Hard: 3x, Medium: 2x, Easy: 1x), `daysOverdue`, and student level (`repetition * easeFactor`).
**Key Takeaway:**
Combine algorithmic priority scoring with user-defined workload caps to balance long-term retention against daily cognitive capacity.

## Challenge 6: Permanent DB State Mutation During View Filtering
**The Problem:**
When decreasing the daily revision limit (e.g. from 5 to 2), the number of due questions decreased as expected, but increasing the limit back to 5 or Unlimited did not bring back the hidden questions.
**Root Cause:**
`getDueQuestions` was updating `nextReviewDate` directly in MongoDB (`Question.findByIdAndUpdate`) for excess questions when applying the daily limit. This permanently pushed their due dates into future days in the database, preventing them from matching `{ nextReviewDate: { $lte: today } }` when the limit was raised again.
**Solution:**
Removed DB date mutations inside `getDueQuestions`. The daily revision limit now functions as a non-destructive, priority-ranked slice (`questions.slice(0, limit)`). Questions retain their true `nextReviewDate` in MongoDB and only advance their schedule upon actual completion of an SM-2 review.
**Key Takeaway:**
Filtering parameters in GET requests must be non-destructive views. Never mutate core domain model schedules inside query endpoints.

## Challenge 7: OpenRouter AI Request Hanging & Reasoning Token Truncation
**The Problem:**
When logging a question, the UI loading bar stayed stuck on `"AI is analyzing your approach..."` indefinitely, failing to create the problem or extract patterns.
**Root Cause:**
1. `process.env.OPENROUTER_MODEL` was configured to `nvidia/nemotron-3.5-lightning`. On OpenRouter, reasoning models spend 900+ tokens on internal reasoning (`reasoning_tokens`). Because `maxTokens: 1000` was hardcoded, the output tokens exceeded the token limit and truncated the JSON response (`Unexpected end of JSON input`), causing HTTP requests to hang or fail.
2. Passing `{ strict: true }` in `withStructuredOutput` caused OpenRouter parameter mismatches on non-OpenAI model endpoints.
**Solution:**
1. Switched `OPENROUTER_MODEL` to `meta-llama/llama-3.3-70b-instruct`, a non-reasoning LLM that returns clean, structured outputs in **1.5 seconds**.
2. Increased `maxTokens` to `2000` and removed `{ strict: true }` from `withStructuredOutput` calls.
**Key Takeaway (Interview Insight):**
When using reasoning models (like DeepSeek-R1 or Nemotron 3.5), account for reasoning token overhead when setting `maxTokens`. For structured JSON output, non-reasoning models (like Llama 3.3 70B or GPT-4o-mini) provide vastly superior latency (<1.5s) and reliability.

## Challenge 8: Exposed `.env` File & Git History Secret Purge
**The Problem:**
`server/.env` containing sensitive credentials (`OPENROUTER_API_KEY`) was accidentally tracked and committed to git, then pushed to GitHub. Adding `.env` to `.gitignore` after the fact did not remove it from Git's tracking index or historical commits.
**Root Cause:**
1. Git ignores only untracked files. Files already in the index remain tracked even if added to `.gitignore`.
2. Standard `git add .` and `git push` sent committed `.env` files into public GitHub repository history.
**Solution:**
1. Updated `.gitignore` across root, `server/`, and `client/` directories to ignore `.env`, `.env.*`, and `*.env`.
2. Backed up local `.env` configuration, then executed `git-filter-repo --invert-paths --path server/.env --force` to purge all historical occurrences from commit logs across all branches.
3. Restored local `.env` and performed a forced remote sync (`git push origin main --force`).
**Key Takeaway (Interview Insight):**
Adding a file to `.gitignore` after committing it does NOT scrub it from Git history or stop Git from tracking it. To completely remediate exposed secrets: (1) Purge the file from history using `git-filter-repo`, (2) Force push cleaned branches to remotes, and (3) Immediately rotate/revoke all exposed API keys or secrets on the service provider side.
