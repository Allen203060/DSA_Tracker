import { ChatOpenRouter } from "@langchain/openrouter";
import { z } from "zod";
import { cleanMarkdownNotes } from "../utils/cleanMarkdown.js";

const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct";

export const classifyPattern = async (req, res) => {
  const { title, url, notes, code, codeLanguage } = req.body;

  try {
    const patternSchema = z.object({
      topic: z.string().describe("The primary Core Data Structure or Topic category (e.g. 'Stack', 'Queue', 'Array & Two Pointers', 'Tree & Graph', 'Dynamic Programming', 'Heap / Priority Queue', 'String', 'Linked List'). Keep Stacks and Queues strictly distinct!"),
      subtopic: z.string().describe("The specific subtopic / pattern technique (e.g. 'Monotonic Stack', 'Index / Width Calculation', 'Topological Sort', 'Dijkstra', 'Monotonic Queue', 'Sliding Window', 'Parentheses Matching')."),
      difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The estimated LeetCode problem difficulty level based on problem complexity and notes."),
      patterns: z.array(z.string()).describe("A list of algorithmic patterns (e.g., 'Monotonic Stack', 'Sliding Window', 'Topological Sort') identified from the notes or code."),
      enhancedNotes: z.string().describe("Clean, highly readable, deeply pedagogical revision notes in rich Markdown with headers (###), bold text, bullet points (-), and inline code backticks."),
    });

    const modelName = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
    const llm = new ChatOpenRouter({
      model: modelName, 
      temperature: 0,
      maxTokens: 2200, 
    }).withStructuredOutput(patternSchema);

    const prompt = `
      You are an expert algorithms instructor and senior code reviewer conducting an in-depth pedagogical review.
      
      Problem Title: ${title || 'Algorithmic Problem'}
      ${url ? `Problem Link: ${url}` : ''}
      Student Raw Notes / Intent: ${notes || 'No raw notes provided'}
      ${code && code.trim() ? `Student Solution Code (${codeLanguage || 'cpp'}):\n\`\`\`${codeLanguage || 'cpp'}\n${code}\n\`\`\`` : ''}

      CRITICAL CLASSIFICATION RULE (STUDENT APPROACH IS THE SOURCE OF TRUTH):
      - You MUST classify the 'topic', 'subtopic', and 'patterns' based STRICTLY on the specific algorithm/technique in the student's solution or notes, NOT generic LeetCode default tags!
      - Keep 'Stack' and 'Queue' strictly SEPARATE as main topics! Never group Stack and Queue together.
      - Examples of Stack Subtopics: 'Monotonic Stack', 'Index / Width Calculation', 'Parentheses Matching', 'Expression Evaluation'.
      - Examples of Queue Subtopics: 'Monotonic Queue (Sliding Window Max)', 'BFS Level Order Traversal', 'Circular Queue'.
      - Graph Subtopics: 'Topological Sort (Kahn / DFS)', 'Dijkstra Shortest Path', 'Disjoint Set Union (DSU)', 'Bipartite Graph', etc.

      CRITICAL ENHANCEMENT RULES (NO VAGUE/SURFACE-LEVEL BULLET POINTS):
      - enhancedNotes MUST be a deeply insightful, crystal-clear, pedagogical breakdown of the student's exact solution.
      - Never produce vague 1-sentence summaries like "Step 1: Initialize dist and st". Always explain WHAT is initialized, WHY, and WHAT invariant it maintains!
      - If the student provided code, explicitly reference their exact variable names, data structures, and helper functions (e.g. \`topoSort\`, \`dist\`, \`vis\`, \`adj\`, \`st\`) in the explanation!
      - Format inline code identifiers in backticks (e.g. \`dist[node] + wt < dist[v]\`) INSIDE sentences without breaking them onto separate lines.
      - Format enhancedNotes strictly using the following 4 Markdown sections:

        ### 💡 Core Intuition
        Explain the foundational mathematical or structural insight that makes this solution work.
        - Why is this algorithm chosen over alternatives? (e.g. Why Topological Sort for DAG Shortest Path instead of Dijkstra? Because in a DAG with no cycles, topological ordering guarantees all incoming paths to any node are fully resolved before relaxing its outgoing edges, achieving linear O(V + E) runtime).
        - State the core recurrence / invariant clearly (e.g. \`dist[v] = min(dist[v], dist[u] + weight)\`).

        ### 🛠️ Algorithm & Key Steps
        Provide a detailed, step-by-step walkthrough referencing the student's exact implementation:
        - **Step 1: Graph Representation & Setup:** Explain how the adjacency list, visited tracking, and distance containers are initialized (e.g. initializing \`dist\` array with infinity \`INF\`, \`dist[src] = 0\`).
        - **Step 2: Core Algorithmic Mechanics:** Step-by-step trace of the main phase (e.g. DFS post-order stack pushing for topological order, then popping nodes sequentially).
        - **Step 3: State Transition / Relaxation:** How neighbors are processed and updated with the relaxation condition.
        - **Step 4: Result Formatting & Unreachability:** How final values are constructed (e.g. converting remaining \`INF\` entries to \`-1\` for unreachable vertices).

        ### ⚠️ Edge Cases & Boundary Conditions
        Provide CONCRETE scenarios with specific input/output examples:
        - **Disconnected / Unreachable Vertices:** (e.g. Vertices with no path from source must maintain \`INF\` and output \`-1\`).
        - **Boundary Graph Shapes:** (e.g. Linear chain graphs, single isolated vertex, or source vertex with no outgoing edges).
        - **Multiple / Zero Weights:** (e.g. Zero-weight edges, duplicate edges between vertex pairs).

        ### ⏱️ Complexity Analysis
        - **Time Complexity:** O(...) - Detailed derivation (e.g. O(V + E) because DFS topological sort visits each vertex and edge once, and relaxing all outgoing edges visits each edge once).
        - **Space Complexity:** O(...) - Detailed derivation (e.g. O(V + E) auxiliary space for adjacency list \`adj\`, visited array \`vis\`, topological stack \`st\`, and recursion call stack).
    `;

    const response = await llm.invoke([{ role: "user", content: prompt }]);
    if (response && response.enhancedNotes) {
      response.enhancedNotes = cleanMarkdownNotes(response.enhancedNotes);
    }
    res.json(response);
  } catch (error) {
    console.error("classifyPattern Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const gradeRecall = async (req, res) => {
  const { originalNotes, userRecall, title, url } = req.body;

  try {
    const gradingSchema = z.object({
      score: z.number().min(0).max(5).describe("A score from 0 to 5 representing recall accuracy."),
      feedback: z.string().describe("1-2 sentences of constructive feedback pointing out what they missed or praising their accuracy."),
    });

    const modelName = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
    const llm = new ChatOpenRouter({
      model: modelName, 
      temperature: 0,
      maxTokens: 1000,
    }).withStructuredOutput(gradingSchema);

    const prompt = `
      You are a super chill, friendly, and encouraging AI study buddy helping your friend practice Data Structures and Algorithms. 
      They are reviewing a problem for spaced repetition.
      
      Problem Title: ${title || 'DSA Problem'}
      ${url ? `Problem Reference Link: ${url}` : ''}
      
      Original Concept / Notes:
      "${originalNotes}"
      
      What your friend just typed from memory:
      "${userRecall}"
      
      Compare their answer to the original. Be supportive but honest!
      Score them from 0 to 5 based on how well they remembered the core logic:
      5 - Nailed it completely!
      4 - Got it, just minor hesitation or slightly off.
      3 - Core idea is there, but missed some details.
      2 - On the right track, but kinda flawed logic.
      1 - Remembered the name/vibe but totally wrong logic.
      0 - Complete blank.

      Return the integer score and 1-2 sentences of friendly, hype-up feedback! Use casual language, use emojis, and be their biggest cheerleader (but don't lie if they got a 0).
    `;

    const response = await llm.invoke([{ role: "user", content: prompt }]);
    if (response && response.feedback) {
      response.feedback = cleanMarkdownNotes(response.feedback);
    }
    res.json(response);
  } catch (error) {
    console.error("gradeRecall Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const gradeCode = async (req, res) => {
  const { title, code, codeLanguage, originalNotes, testCases } = req.body;

  try {
    const codeGradingSchema = z.object({
      score: z.number().min(0).max(100).describe("Overall score percentage (0 to 100) based on correctness, edge cases, and test case evaluation."),
      passed: z.boolean().describe("True if code correctly implements the solution and satisfies test cases without critical bugs."),
      timeComplexity: z.string().describe("Estimated Time Complexity in Big-O notation (e.g. O(N), O(N log N))."),
      spaceComplexity: z.string().describe("Estimated Auxiliary Space Complexity in Big-O notation (e.g. O(1), O(N))."),
      summary: z.string().describe("Concise 1-2 sentence executive evaluation summary of the student code."),
      testResults: z.array(z.object({
        input: z.string().describe("The input test case."),
        expectedOutput: z.string().describe("The expected output."),
        actualOutput: z.string().describe("The simulated output produced by running the student code."),
        passed: z.boolean().describe("Whether this test case passed."),
        explanation: z.string().describe("Execution detail or error hint if failed.")
      })).describe("Detailed evaluation breakdown for each test case."),
      feedback: z.string().describe("Formatted code review breakdown detailing key strengths, potential bugs, edge cases, and optimization tips.")
    });

    const modelName = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
    const llm = new ChatOpenRouter({
      model: modelName,
      temperature: 0,
      maxTokens: 2000,
    }).withStructuredOutput(codeGradingSchema);

    const formattedTestCases = Array.isArray(testCases) && testCases.length > 0
      ? testCases.map((tc, idx) => `Test Case ${idx + 1}:\n  Input: ${tc.input || 'Default'}\n  Expected Output: ${tc.expectedOutput || 'Default'}`).join('\n\n')
      : "No custom test cases provided. Generate 2 standard test cases relevant to this problem.";

    const prompt = `
      You are an expert C++/Python/Java/JS compiler simulator, static code analyzer, and DSA code grader.
      You are grading a student's solution submitted in an interactive code playground.

      Problem Title: ${title || 'Algorithmic Problem'}
      Programming Language: ${codeLanguage || 'cpp'}
      Original Problem Notes / Constraints: ${originalNotes || 'Standard DSA problem'}

      Student Submitted Code:
      \`\`\`${codeLanguage || 'cpp'}
      ${code || '// No code submitted'}
      \`\`\`

      Test Cases to Evaluate Against:
      ${formattedTestCases}

      INSTRUCTIONS:
      1. Perform mental execution and static analysis of the student's code.
      2. For each test case, simulate running the code step-by-step to compute the actual output.
      3. Check for compilation errors, off-by-one errors, infinite loops, memory leaks, uninitialized variables, or incorrect boundary conditions.
      4. Calculate Big-O Time Complexity and Space Complexity.
      5. Provide an overall score (0 to 100), pass/fail flag, and clear structured feedback.
    `;

    const response = await llm.invoke([{ role: "user", content: prompt }]);
    res.json(response);
  } catch (error) {
    console.error("gradeCode Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const generateBoilerplate = async (req, res) => {
  const { title, url, codeLanguage } = req.body;

  try {
    const boilerplateSchema = z.object({
      boilerplate: z.string().describe("The exact starting boilerplate code for the given language. Should look exactly like a LeetCode starting template.")
    });

    const modelName = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
    const llm = new ChatOpenRouter({
      model: modelName,
      temperature: 0,
      maxTokens: 1000,
    }).withStructuredOutput(boilerplateSchema);

    const prompt = `
      You are an expert DSA platform engineer. 
      Generate the EXACT starting boilerplate code snippet for the following algorithmic problem, perfectly mirroring how it would look in a LeetCode coding environment.
      
      Problem Title: ${title || 'Unknown Algorithm'}
      URL/Link (if provided, use it for context): ${url || 'None provided'}
      Target Programming Language: ${codeLanguage || 'cpp'}
      
      INSTRUCTIONS:
      - For C++, provide the includes and the class Solution with the correct public method signature.
      - For Java, provide the class Solution with the correct public method signature.
      - For Python, provide the class Solution: def ... signature.
      - Ensure the function name matches typical standard conventions (e.g., trap, twoSum, maxSlidingWindow).
      - Do NOT include any solution logic, just the empty method / class signature ready for the user to write their code.
    `;

    const response = await llm.invoke([{ role: "user", content: prompt }]);
    res.json(response);
  } catch (error) {
    console.error("generateBoilerplate Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const summarizeApproachFromCode = async (req, res) => {
  const { title, code, codeLanguage } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: "Please provide your solution code to summarize." });
  }

  try {
    const summarySchema = z.object({
      intuition: z.string().describe("A deep, crystal-clear explanation of the core algorithmic intuition and invariant: why this specific approach works, explicitly naming the student's exact variables (e.g. 'st', 'dist', 'adj', 'vis')."),
      keySteps: z.array(z.string()).describe("3-4 clear, granular step-by-step points explaining the execution flow and mechanics from the student's code."),
      edgeCases: z.array(z.string()).describe("2-3 concrete edge cases with specific inputs (e.g. disconnected nodes, empty graph, single node) handled or needed."),
      complexity: z.string().describe("Precise Time and Space complexity with brief derivation (e.g. 'O(V + E) Time (DFS topological sort + linear edge relaxations), O(V + E) Space (adjacency list and stack)').")
    });

    const modelName = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
    const llm = new ChatOpenRouter({
      model: modelName,
      temperature: 0,
      maxTokens: 1200,
    }).withStructuredOutput(summarySchema);

    const prompt = `
      You are an expert algorithms instructor and senior code reviewer.
      A student just solved an algorithmic problem and submitted their personal implementation below:

      Problem Title: ${title || 'Algorithmic Problem'}
      Language: ${codeLanguage || 'cpp'}

      Student Solution Code:
      \`\`\`${codeLanguage || 'cpp'}
      ${code}
      \`\`\`

      TASK:
      Generate a thorough, crystal-clear, high-retention algorithmic summary strictly based on the student's code.
      
      CRITICAL INSTRUCTIONS:
      1. intuition: Explain the foundational "Aha!" insight and WHY the algorithm works. Reference the student's specific variable names (e.g. \`st\`, \`dist\`, \`vis\`, \`adj\`).
         - Example: Do not just say "Uses topoSort and dist". Explain why Topological Sort is used for DAG Shortest Path (because in a DAG with no cycles, topological order guarantees all incoming paths to any node are evaluated before we relax its outgoing edges, achieving linear O(V + E) time without Dijkstra's priority queue).
         - Include the exact recurrence/invariant (e.g. \`dist[v] = min(dist[v], dist[u] + wt)\`).
      2. keySteps: Provide 3-4 granular, concrete steps explaining what the code actually does (e.g. Step 1: Build weighted adjacency list; Step 2: DFS topological sort pushing to stack; Step 3: Pop from stack and relax edges; Step 4: Convert unreachable INF entries to -1).
      3. edgeCases: 2-3 specific edge cases with concrete inputs (e.g. disconnected components returning -1, single vertex).
      4. complexity: Explicit Big-O Time & Space complexity with mathematical justification.
    `;

    const response = await llm.invoke([{ role: "user", content: prompt }]);
    res.json(response);
  } catch (error) {
    console.error("summarizeApproachFromCode Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const critiqueApproach = async (req, res) => {
  const { title, url, originalNotes, userApproach, codeLanguage } = req.body;

  if (!userApproach || !userApproach.trim()) {
    return res.status(400).json({ error: "Please explain your approach or pseudocode." });
  }

  try {
    const approachCritiqueSchema = z.object({
      score: z.number().min(0).max(5).describe("A conceptual recall score from 0 to 5 based on algorithmic correctness, invariant preservation, and edge cases. 5 = Flawless intuition & optimal pattern, 4 = Solid grasp with minor omission, 3 = Core idea intact but missing critical invariant/edge case, 2 = Flawed logic or suboptimal approach, 1 = Minimal recollection, 0 = Blank or completely wrong."),
      verdict: z.enum(['Mastered', 'Solid Understanding', 'Partial Recall', 'Flawed Logic', 'Complete Blackout']).describe("Concise verdict category summarizing recall quality."),
      critique: z.string().describe("A 2-3 sentence constructive, friendly critique of the student's algorithmic reasoning."),
      strengths: z.array(z.string()).describe("2-3 specific algorithmic points the student correctly identified (e.g. correct state definition, optimal data structure choice)."),
      gaps: z.array(z.string()).describe("1-2 key conceptual gaps, missed edge cases, or incorrect invariant assumptions."),
      suggestions: z.array(z.string()).describe("1-2 actionable tips or improvements before writing code."),
      keyInvariant: z.string().describe("The foundational algorithmic invariant or core truth needed for this problem (e.g., 'BFS guarantees shortest path length before backtracking reconstructs paths')."),
      readyForCode: z.boolean().describe("True if the approach is sound enough to proceed with code implementation.")
    });

    const modelName = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
    const llm = new ChatOpenRouter({
      model: modelName,
      temperature: 0,
      maxTokens: 1500,
    }).withStructuredOutput(approachCritiqueSchema);

    const prompt = `
      You are an expert algorithms instructor and friendly DSA mentor.
      A student is conducting an active recall review session for a spaced repetition schedule.
      Before writing any code, they must explain their approach, pseudocode, or algorithmic intuition in natural language.

      Problem Title: ${title || 'Algorithmic Problem'}
      ${url ? `Problem Reference Link: ${url}` : ''}
      Target Language: ${codeLanguage || 'cpp'}

      Original Problem Reference Notes:
      """
      ${originalNotes || 'No reference notes provided'}
      """

      Student's Recalled Approach / Pseudocode:
      """
      ${userApproach}
      """

      EVALUATION INSTRUCTIONS:
      1. Assess whether the student correctly identifies the optimal data structure(s) and algorithmic pattern (e.g., Two Pointers, BFS, DP, Monotonic Stack).
      2. Check if their stated state transitions, invariants, and edge cases are correct.
      3. Assign an integer conceptual score from 0 to 5:
         - 5: Flawless intuition, optimal pattern, clear invariants.
         - 4: Solid grasp, minor step or edge case missed.
         - 3: Core idea correct, but missing critical invariant or details.
         - 2: Flawed approach, suboptimal complexity, or hand-waving major logic.
         - 1: Surface memory only (remembered keywords, wrong algorithm).
         - 0: Completely blank or hallucinated nonsense.
      4. Highlight 2-3 specific strengths and 1-2 concrete gaps/edge cases.
      5. State the Single Key Invariant they must remember during implementation.
      6. Provide 1-2 actionable suggestions to polish their logic.
    `;

    const response = await llm.invoke([{ role: "user", content: prompt }]);
    if (response) {
      if (response.critique) response.critique = cleanMarkdownNotes(response.critique);
      if (response.keyInvariant) response.keyInvariant = cleanMarkdownNotes(response.keyInvariant);
    }
    res.json(response);
  } catch (error) {
    console.error("critiqueApproach Error:", error);
    res.status(500).json({ error: error.message });
  }
};

