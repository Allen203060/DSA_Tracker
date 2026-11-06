# Multi-Stage Socratic Recall & Spaced Retrieval Architecture

## 1. Theoretical Foundations of Active Recall in Technical Problem Solving

Traditional spaced repetition software (such as Anki or SuperMemo) relies primarily on **binary or scalar flashcard recall** (e.g., front/back cards graded from 0 to 5). While effective for declarative knowledge (vocabulary, medical terminology, API names), it suffers from severe limitations when applied to algorithmic problem solving (Data Structures & Algorithms):

1. **The Illusion of Competence (Recognition vs. Generation)**:
   A student reviewing *Trapping Rain Water* might read the prompt, think *"Oh yeah, two pointers or monotonic stack"*, and rate themselves a 5. However, when faced with an actual coding interview or blank editor, they stumble on pointer updates, invariant preservation, or off-by-one boundary conditions.
2. **The Generation Effect**:
   Cognitive science demonstrates that actively generating an explanation, pseudocode, and edge-case justifications produces significantly deeper memory traces and synaptic consolidation than passive recognition.
3. **Socratic Inquiry vs. Immediate Answer Dumping**:
   When a student makes an algorithmic mistake (e.g., forgetting that dynamic programming states require non-negative weights in Dijkstra), immediately providing the solution triggers passive reading. Challenging the student with a **counter-example / adversarial test case** forces cognitive disequilibrium and self-correction.

---

## 2. Multi-Stage Recall Pipeline (Free Tier Specification)

```
   ┌────────────────────────────────────────────────────────┐
   │ Step 1: Conceptual Retrieval & Invariant Explanation    │
   │ - Student writes approach, invariants, and pseudocode   │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ Step 2: AI Approach Critique & Conceptual Feedback     │
   │ - AI validates logic against optimal pattern           │
   │ - Surfaces missed invariants & edge cases              │
   │ - Computes Conceptual Recall Score (0–5)               │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ Step 3: Hands-On Implementation (In-App IDE / URL)      │
   │ - Student implements code in in-app IDE (Monaco)       │
   │   or pastes verified LeetCode/GFG solution             │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │ Step 4: Composite SM-2 Grading & Interval Reschedule   │
   │ - Weighted composite: 40% Conceptual + 60% Code        │
   │ - Calculates SuperMemo-2 interval & updates next review│
   └────────────────────────────────────────────────────────┘
```

---

## 3. Conversational Socratic Agent (Paid Tier / LangGraph Specification)

In advanced conversational mode, the review transforms into an interactive mock interview powered by a stateful **LangGraph** execution graph:

```
          [Student Submits Approach]
                      │
                      ▼
            [Analyze Approach Node]
                      │
           Does approach contain flaws?
           ├── YES ──► [Generate Counter-Testcase Node]
           │                    │
           │                    ▼
           │          [Socratic Dialogue Node]
           │          (Ask: "How does your logic
           │           handle this input?")
           │                    │
           │                    ▼
           │          [Await Student Revision]
           │                    │
           │                    └──────┐
           └── NO ─────────────────────┼─────────┐
                                       ▼         │
                        [Code Implementation]    │
                                       │         │
                                       ▼         │
                       [Static Simulation Node]  │
                                       │         │
                                       ▼         ▼
                    [Synthesize Key Insights & Grade Node]
                                       │
                                       ▼
                       [SM-2 Rescheduling & Badging]
```

### Key Components of the Conversational Agent:
1. **Adversarial Input Synthesis**: Dynamically generating edge-case arrays, empty collections, or skewed tree topologies that break naive assumptions.
2. **Contextual Memory**: Maintaining multi-turn chat history grounded in the problem's optimal solution, student's historical notes, and previous attempts.
3. **Scaffolding**: Providing tiered hints (Level 1: General question; Level 2: Target invariant; Level 3: Code structure) rather than giving away the answer.

