# Project Soul: Revalgo — AI-Powered Spaced Repetition Platform

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
- **Phase 7: Difficulty Scaling & Workload Management**:
  - **Question Difficulty Schema & Classification**: Enhanced `Question` schema, AI classification schema, and controllers to support `difficulty` (`Easy`, `Medium`, `Hard`).
  - **Priority-Based Dynamic Workload Rescheduling**: Implemented `getPriorityScore` in `questionController.js` weighting difficulty multipliers, overdue days, and student competence.
  - **User-Defined Daily Revision Workload Limit**: Added UI selector (`2`, `3`, `5`, `10`, `Unlimited` problems/day) persisting in `localStorage`. Overdue questions exceeding daily capacity are automatically rescheduled across future days based on priority urgency to prevent revision burnout.
  - **Dynamic Difficulty Pill Badges & Form Controls**: Added difficulty selection pills in the Log Question form and high-contrast color badges (`Easy` green, `Medium` amber, `Hard` rose) across question cards.
  - **Dynamic Daily Revision Quota Deduction**: Deducts reviews completed today from the daily limit (`remainingLimit = limit - reviewsCompletedToday`), ensuring that if you complete 2 out of 3 daily reviews, exactly 1 question remains in your queue.
  - **Random Question Practice Mode**: Added a dedicated `Practice Mode (Random Question)` trigger in the Header, empty due queue state, and Playground modal (`GET /api/questions/random`), allowing practice on solved questions anytime.
  - **Structured Markdown AI Notes & ReactMarkdown Rendering**: Enforced strict 4-tier Markdown section schema in `aiController.js` (`Core Intuition`, `Algorithm & Key Steps`, `Edge Cases & Boundary Conditions`, `Complexity Analysis`) and integrated `react-markdown` with custom glassmorphism styling in the UI.
  - **Repository Secret Sanitization & History Purge**: Purged exposed `server/.env` file from git history across all commits using `git-filter-repo` and configured global ignore rules (`.env`, `.env.*`, `*.env`) across root, server, and client directories.
- **Phase 8: Development Environment Resilience & State Restoration**:
  - **Antigravity IDE Unified State Sync (USS) Database Migration**: Successfully reverse-engineered the binary Protobuf wire format of `state.vscdb` (`antigravityUnifiedStateSync.trajectorySummaries` and `antigravityUnifiedStateSync.sidebarWorkspaces`), restoring 77 historical conversations and 23 workspace configurations from backup alongside newly initialized chats (79 total).
  - **Zero-Collision Process Lifecycle Management**: Implemented `watch_and_restore.sh` managed via systemd user services (`antigravity-restore.service`) to perform atomic database writes during application shutdown, bypassing in-memory cache overwrites from Electron's main process.
  - **Standalone Agent Manager Window Mode & Setting Sanitation**: Reverse-engineered Electron window lifecycle in `main.js` and confirmed removal of legacy `dh.Manager` window in v1.107; sanitized `"codeiumDev.enableStandaloneManager": false` to preserve inline `editorFeature` hooks.
  - **Multi-Window Desktop Integration & Symlink Remediation**: Created `/opt/Antigravity/antigravity` symlink repairing broken `antigravity-v2.desktop` launchers and established dedicated multi-window workflow via `--new-window`.
- **Phase 9: Frontend UI/UX AI Agent Skills System**:
  - **Curated Agent Skill Suite (`.agents/skills/`)**: Designed and implemented 4 modular, greppable skills modeled after Apple Skills (`Prisma-Labs-Dev/apple-skills`), Taste-Skill (`Leonxlnx/taste-skill`), and UI-UX Pro Max (`nextlevelbuilder/ui-ux-pro-max-skill`).
  - **Core Visual Token Standards (`dsa-tracker-design-system`)**: Codified Tailwind v4 `@theme` tokens, obsidian base colors (`base-950` to `800`), glassmorphism utilities (`glass-panel`), and standardized 3-tier difficulty badges (`Easy` emerald, `Medium` amber, `Hard` rose).
  - **Ergonomic Component Architecture (`dsa-tracker-component-patterns`)**: Built complete anatomical blueprints and recipes for Question Cards, Split-Pane Code Playground, AI Recall Review Modal, and the Hierarchical Taxonomy Sidebar.
  - **Motion & Accessibility Choreography (`dsa-tracker-interaction-motion`)**: Defined 150-350ms duration tiers, spring easings, clipboard copy states, code popout windows, and WCAG AA contrast standards.
  - **Anti-Slop Quality Gate (`frontend-taste-and-audit`)**: Established a strict 10-point pre-flight audit checklist and anti-slop rules prohibiting generic AI tropes (purple gradients, unreadable low-contrast text on glass, layout shifts).
  - **Pedagogical Theory Integration (`theory_concepts/`)**: Authored first-principles guide on agent skills architecture and prompt decoupling.
- **Phase 10: Modern Minimal Aesthetic UI Redesign**:
  - **Holistic Visual Overhaul (`client/src/App.jsx`)**: Re-architected the entire user interface leveraging the newly authored agent skills. Replaced garish, over-saturated purple glows with a cohesive, refined Obsidian Glass aesthetic (`#0b0e17` canvas, `glass-panel-interactive`, and high-contrast semantic indicators).
  - **Typography Precision**: Loaded Google Fonts (`Inter` for body/headings and `JetBrains Mono` for code/metrics) in `client/index.html` with explicit weight scales and font smoothing.
  - **Component Refinement**: Re-engineered the header, 4-stat learning metrics bar, GitHub-style 24-week contribution heatmap, hierarchical taxonomy tree, log problem form, 2-column question card grid, and all 3 interactive modals.
  - **Accessible Modal Interactions**: Implemented global `Escape` key listeners to dismiss active modals, WCAG AA contrast compliance, and autofocusing keyboard ergonomics.
  - **Zero Backend/Database Impact**: Maintained 100% functional integrity across all API endpoints, SuperMemo-2 scheduling, and code execution flows without altering backend schemas or controllers.
- **Phase 11: Dual-Theme Architecture (Light Mode & Softer Dark Palette)**:
  - **Luminance Tuning (Softer Dark Mode)**: Elevated the dark mode canvas from pitch-black `#0b0e17` to a much softer, eye-friendly `#141926` (Slate-Obsidian Navy) with `rgba(26, 33, 52, 0.78)` glass panels, dramatically reducing eye fatigue and halation during extended revision sessions.
  - **Clean Porcelain Light Mode**: Implemented a modern light mode with a `#f4f6fb` canvas, `rgba(255, 255, 255, 0.88)` glass panels, crisp borders, and high-contrast slate typography (`text-slate-900` / `text-slate-600`), while maintaining dark developer code blocks.
  - **Theme Toggle & Zero-Flash Hydration**: Added an interactive `Sun`/`Moon` toggle button in the header bar, instant inline hydration script in `client/index.html` to eliminate initial load flashing, and `localStorage` persistence.
  - **Pedagogical Theory Documentation**: Authored `/theory_concepts/theme_architecture_css_variables_and_dark_mode.md`.
- **Phase 12: Radial Theme Transition, Box Harmonization & Tactile Card Depth**:
  - **Radial Outward Circular View Transition**: Implemented the Chrome/Webkit View Transitions API (`document.startViewTransition`) in `App.jsx` and `index.css`. Upon clicking the Sun/Moon toggle, the new theme expands outward radially in an expanding circle centered exactly on the button's Euclidean coordinates, calculating hypotenuse distance to screen corners with graceful instant fallback for unsupported environments.
  - **Elimination of Stark White Boxes in Heatmap & Taxonomy**: Harmonized all empty contribution heatmap cells, legend markers, category badges, and taxonomy tree counter chips to translucent glass tints (`bg-slate-200/50 dark:bg-slate-800/40 border-slate-300/30 dark:border-white/[0.04]`), resolving visual harshness in both light and dark modes.
  - **Tactile Card Depth & 3-Tier Elevation Physics**: Enhanced `.glass-panel-interactive` with a multi-layered shadow stack (tight contact shadow + wide ambient shadow + specular top inner bevel highlight) and spring elevation (`translateY(-4px) scale(1.008)`), delivering genuine physical presence without visual clutter.
  - **Pedagogical Concept Note**: Authored `/theory_concepts/radial_view_transitions_and_card_depth.md` documenting Euclidean clip-path geometry, shadow physics, and glass neutralization.
- **Phase 13: Three.js Algorithmic Constellation Background & Silky View Transitions**:
  - **Three.js Algorithmic Graph Constellation**: Created `ThreeBackground.jsx` rendering 75 floating nodes with dynamic Euclidean connecting lines simulating algorithmic graph theory/data structures. Features mouse-reactive exponential lerping (`alpha = 0.045`), camera parallax, and interactive cursor repulsion with theme-reactive palette updates (indigo/cyan glow in dark mode, slate/azure in light mode).
  - **Headless Environment Resilience**: Implemented defensive WebGL detection ensuring zero crashes during jsdom/Vitest execution or non-WebGL environments.
  - **Silky Smooth View Transitions with `flushSync`**: Integrated React 19's `flushSync` within `document.startViewTransition` to synchronously commit theme DOM mutations before snapshotting, while applying `.theme-transitioning` suppression to eliminate CSS property transition tearing.
  - **Pedagogical Theory Documentation**: Authored `/theory_concepts/threejs_particle_graph_and_smooth_view_transitions.md`.
- **Phase 14: Deep Obsidian Black Canvas, Luminous Shockwave Reveal & Enhanced Constellation**:
  - **Deep Cosmic Obsidian Canvas**: Elevated dark mode canvas from `#141926` to sleek `#07090e` with translucent obsidian glass panels (`rgba(13, 17, 26, 0.82)`) and inset borders, providing high contrast and making neon particle graphs pop vividly.
  - **Stacking Context Correction (`z-0`)**: Fixed container placement from `-z-10` to `z-0` so particles and dynamic edges are fully visible directly on top of the canvas and cleanly refract through frosted glass cards (`backdrop-filter: blur(16px)`).
  - **Multi-Hue Constellation Expansion**: Increased particle count to 110 with a multi-hue vertex color palette (electric indigo, neon cyan, soft purple, mint emerald), dynamic lines with 140 connection threshold, and 165px repulsion field.
  - **Dramatic Luminous Shockwave Transition**: Implemented an expanding luminous radial wavefront ring (`box-shadow: 0 0 60px 18px ...`) synchronized with the 720ms View Transition circular clip-path alongside a 360° icon spin micro-interaction on the toggle button.
- **Phase 15: Volumetric 3D Depth Fog & High-Contrast Light Mode Constellation** (Current):
  - **Atmospheric Volumetric Depth Fog**: Added `THREE.FogExp2` (`#07090e` in dark, `#f4f6fb` in light) causing distant nodes to naturally dissolve into atmospheric depth while foreground nodes remain razor sharp.
  - **Multi-Plane 3D Z-Depth & Parallax Orbit**: Expanded Z-bounds to 300 with differential velocity weighting, size attenuation (`5.4px - 6.2px`), and pitch/yaw camera orbit responding to mouse position in 3D space.
  - **High-Contrast Light Mode Overhaul**: Solved light mode invisibility by implementing saturated jewel-tone vertex colors (`#4338ca` indigo, `#0369a1` sky blue, `#0f766e` teal, `#1e293b` slate) combined with pure alpha-mask particle textures, `0.82` node opacity, and `0.38` line opacity with dynamic color attribute synchronization on theme change.
- **Phase 17: Multi-User Authentication, Tenant Isolation & Safe Data Migration**:
  - **User & Auth Architecture**: Implemented JWT-based stateless authentication (`jsonwebtoken`) with `bcryptjs` password hashing, establishing `User` model with unique normalized usernames.
  - **Data Safety & Allen's Question Migration**: Built `server/src/utils/bootstrapUser.js` that automatically initializes account `Allen` (`@allen`) upon database connection and safely migrated all 78 unassigned historical questions under Allen's `userId`.
  - **Complete Tenant Isolation**: Added `userId` foreign index to `Question` schema and updated all controllers (`addQuestion`, `getDueQuestions`, `getAllQuestions`, `getRandomQuestion`, `reviewQuestion`, `updateQuestion`, `deleteQuestion`, `getActivityStats`) to strictly scope queries and mutations to `req.user._id`.
  - **Frontend Auth & Peer Management**: Created dynamic Axios JWT request interceptor (`localStorage`), active user header chip with avatar, and a glassmorphism Authentication & Peer Switcher modal supporting both peer registration and rapid 1-click Allen demo login.
  - **Deployment Readiness**: Added production CORS configuration in `server/src/app.js` with `CLIENT_URL` support, and expanded test coverage with 8 passing integration tests.

- **Phase 18: Production Resilience, Render Heartbeat & Zero-Cold-Start UX**:
  - **Public Health Endpoint**: Implemented `/api/health` in `server/src/routes/apiRoutes.js` providing sub-millisecond status responses for monitoring services.
  - **Active Session Heartbeat**: Added a 10-minute periodic keepalive ping in `client/src/App.jsx` preventing Render free-tier instances from spinning down while any browser tab remains open.
  - **Cold-Start Awareness Toast**: Implemented an automated wake-up detection heuristic that displays a glassmorphism floating status badge (`Connecting to cloud backend...`) if cloud spin-up exceeds 2 seconds, eliminating user confusion during cold boots.
- **Phase 19: Password Recovery, Account Security & Google OAuth 2.0 Integration**:
  - **Account Recovery Protocol**: Implemented an account recovery architecture utilizing personal `recoveryKey` strings generated during registration and account bootstrapping (`server/src/controllers/authController.js`, `server/src/models/User.js`). Added `/api/auth/reset-password` allowing peers to reset lost credentials without administrative intervention.
  - **Authenticated Password Management**: Added `/api/auth/change-password` requiring active JWT authentication and current password verification, allowing logged-in users to update credentials from their profile view.
  - **Google OAuth 2.0 Authentication**: Implemented official Google Identity Services integration with server-side ID token verification via `https://oauth2.googleapis.com/tokeninfo`. Automatically maps Google profiles (`googleId`, `email`, `picture`) into isolated Revalgo accounts or links existing peers.
  - **Google Setup Assistant**: Integrated a zero-friction configuration modal on the frontend providing step-by-step guidance on setting up Google Cloud Console credentials and `VITE_GOOGLE_CLIENT_ID`.
  - **Comprehensive Auth Test Suite**: Authored `server/tests/auth.test.js` validating registration, credential verification, recovery key resets, change password workflows, and token security (14/14 server tests passing).

- **Phase 20: AI Summary Markdown Formatting, Unicode Decoding & Escape Sanitization**:
  - **Root Cause Remediation for All-Caps Bloat**: Diagnosed LLM structured output escape issue where `withStructuredOutput` serialized line breaks as literal `\n` and emojis as `\uXXXX`. Because markdown requires real `\n` characters to break lines, ReactMarkdown parsed the entire 1,000+ character summary as a single `###` heading, turning all text uppercase via heading CSS.
  - **Bidirectional Sanitization Engine**: Authored `cleanMarkdownNotes` in both `server/src/utils/cleanMarkdown.js` and `client/src/utils/cleanMarkdown.js`, automatically unescaping literal `\n`, `\r`, and multi-digit unicode sequences (`\u270e`, `\u1f6e0`, `\u{1f6e0}`) and stripping stray backslashes.
  - **Rich Markdown Typography**: Enhanced `ReactMarkdown` component map in `client/src/App.jsx` with dedicated, readable styles for `ul`, `ol`, `li`, `strong`, `p`, and `h3`, removing forced heading capitalization.
  - **Database Sanitization Migration**: Created and executed `scripts/sanitize_enhanced_notes.js` sanitizing all 16 affected questions in MongoDB Atlas and 13 in local MongoDB, restoring proper visual formatting across all user cards.

- **Phase 21: Wall of Shame & 3D Accountability Mirror**:
  - **Accountability Inversion Matrix**: Conceived and implemented the "Wall of Shame"—a counter-dashboard to the traditional GitHub-style contribution heatmap. Instead of celebrating green activity, it exposes inactivity slumps, missed SuperMemo-2 spaced repetitions, and accumulated revision debt.
  - **Multi-Tiered Slacking Severity**: Architected a 4-tier inactivity classification in `server/src/controllers/questionController.js` (`0`: Clean/Prior, `1`: Idle Day, `2`: Missed Repetitions, `3`: Critical Ghosting Streak >= 3 days) calibrated against the user's initial activity date.
  - **Shame Analytics**: Computes real-time `activeDebtCount` (overdue questions awaiting review), `currentSlackedStreak` (consecutive idle days), `longestSlackedStreak` (worst drought), and `totalSlackedDays`.
  - **Interactive 3D Flipping Dashboard**: Added a 1200px perspective 3D card flip animation (`.flip-panel` with dynamic `rotateX(90deg)` to `rotateX(0deg)`) triggered by a toggle button `[ 🟢 Wall of Fame ]` <-> `[ 🩸 Wall of Shame ]`.
  - **Dynamic Blood-Crimson Aesthetic**: In Shame Mode, the 4 left stat cards transform into Revision Debt, Slacking, Worst Slump, and Total Ghosted, and the heatmap matrix shifts to high-contrast amber/rose/crimson cells with a pulsing red ambient glow (`shame-pulse`) and custom accountability tooltips.

- **Phase 22: Universal Smart Importer, Multi-Platform Scraper & Code-Anchored Retention Engine** (Current):
  - **Universal Smart Importer**: Created `/api/import/url` (`server/src/controllers/importController.js`) enabling 1-click metadata scraping from LeetCode (via public GraphQL `getQuestionDetail`), GeeksforGeeks (via OpenGraph & JSON-LD parsing), and generic fallback platforms (HackerRank, Codeforces, NeetCode). Automatically pulls frontend ID, Title, Difficulty, Topics, and official sample test cases in under 150ms.
  - **Live Omnibox Problem Search**: Implemented `/api/import/search` querying LeetCode problemsets in real-time. Users can simply type a problem number (e.g. `739`, `42`) or keyword (`daily`, `lru`) to trigger a live autocomplete dropdown that auto-populates all question fields with zero URL copying.
  - **Language Auto-Detection**: Authored `client/src/utils/codeDetector.js` automatically identifying C++, Python, Java, JavaScript, and Go syntax from student solution code and updating form selectors with a high-visibility badge.
  - **Code-Anchored Intuition Generator**: Implemented `/api/ai/summarize-code` in `server/src/controllers/aiController.js` and a 1-click `[ ✨ Auto-Fill Notes from Code ]` button that summarizes core algorithmic invariants using the student's exact variable names and custom helpers to maximize long-term retention.

## Next Logical Steps
1. Revalgo Web Clipper (Chrome / Brave Manifest V3 browser extension) for 1-click submission directly from LeetCode and GFG tabs.
2. 3D Knowledge Graph (`react-force-graph`) to visualize pattern dependencies.
3. Automated CI/Pre-commit hook checking UI changes against the 10-point Quality Checklist.

## Key Decisions
- Shifted away from standard self-reported flashcard mechanics. By forcing the user to type out the logic in Natural Language and having a friendly AI grade it, we eliminate the "illusion of competence".
- Non-Destructive Daily Revision Slicing with Today's Review Deduction: The daily limit dynamically factors in `reviewsCompletedToday` (`countDocuments({ 'reviewHistory.reviewedAt': { $gte: startOfDay } })`), ensuring a zero-inbox experience where completed questions decrease the active due count down to 0 for the day.
- Electron/USS State Migration Strategy: Rather than performing live writes to SQLite that get overwritten upon graceful exit, decoupled DB migration into a post-shutdown hook triggered before the next process boot.
- Modular Markdown Reference Corpora over Monolithic Prompts: Adopting the Apple Skills pattern where each domain is split into focused markdown documents (`tokens.md`, `motion-tokens.md`, etc.). This preserves LLM token budgets and allows precise, targeted retrieval without hallucination.
- Strict UI/UX Redesign Boundary: Kept frontend presentation completely decoupled from API contracts and business logic, ensuring visual modernizations never introduce regression into core spaced repetition workflows.
- Semantic CSS Variable Layering for Theming: Centralized theming in `:root` and `.dark` variables rather than ad-hoc class branches, allowing instant global re-skinning without DOM re-renders.
