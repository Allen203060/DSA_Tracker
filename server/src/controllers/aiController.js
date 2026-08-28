import { ChatOpenRouter } from "@langchain/openrouter";
import { z } from "zod";

export const classifyPattern = async (req, res) => {
  const { title, url, notes } = req.body;

  try {
    // 1. Define the exact JSON structure we want back from the LLM using Zod
    const patternSchema = z.object({
      topic: z.string().describe("The primary Core Data Structure or Topic category (e.g. 'Stack', 'Queue', 'Array & Two Pointers', 'Tree & Graph', 'Dynamic Programming', 'Heap / Priority Queue', 'String', 'Linked List'). Keep Stacks and Queues strictly distinct!"),
      subtopic: z.string().describe("The specific subtopic / pattern technique (e.g. 'Monotonic Stack', 'Index / Width Calculation', 'Monotonic Queue', 'Sliding Window', 'Parentheses Matching')."),
      patterns: z.array(z.string()).describe("A list of algorithmic patterns (e.g., 'Monotonic Stack', 'Sliding Window') identified from the notes."),
      enhancedNotes: z.string().describe("Clean, highly readable, structured revision notes formatted with bulleted points and spaced paragraphs."),
    });

    // 2. Initialize the OpenRouter Chat Model with NVIDIA Nemotron model & maxTokens limit
    const modelName = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-lightning";
    const llm = new ChatOpenRouter({
      model: modelName, 
      temperature: 0,
      maxTokens: 1000, 
    }).withStructuredOutput(patternSchema, {
      name: "extract_patterns",
      strict: true,
    });

    // 3. Craft the prompt with strict focus on student's actual approach
    const prompt = `
      You are an expert algorithms instructor and code reviewer.
      Given the following problem title, optional problem URL, and a student's raw notes:
      
      Problem Title: ${title}
      ${url ? `Problem Link: ${url}` : ''}
      Student Raw Notes: ${notes}

      CRITICAL CLASSIFICATION RULE (STUDENT APPROACH IS THE SOURCE OF TRUTH):
      - You MUST classify the 'topic', 'subtopic', and 'patterns' based STRICTLY on the specific algorithm/technique described in the "Student Raw Notes", NOT based on general LeetCode default tags!
      - Example: If a problem like "Maximum Width Ramp" has multiple known solutions, but the student's notes explicitly describe using a Monotonic Stack (e.g., pushing decreasing indices), you MUST classify Topic = "Stack" and Subtopic = "Monotonic Stack" (or "Index / Width Calculation").
      - Keep 'Stack' and 'Queue' strictly SEPARATE as main topics! Never group Stack and Queue together.
      - Examples of Stack Subtopics: 'Monotonic Stack', 'Index / Width Calculation', 'Parentheses Matching', 'Expression Evaluation'.
      - Examples of Queue Subtopics: 'Monotonic Queue (Sliding Window Max)', 'BFS Level Order Traversal', 'Circular Queue'.
      - Other main topics include 'Array & Two Pointers', 'Tree & Graph', 'Dynamic Programming', 'Heap / Priority Queue', etc.

      CRITICAL ENHANCEMENT RULE (ENHANCE STUDENT THOUGHTS ONLY):
      - enhancedNotes MUST BE a refined, polished, and beautifully structured version of THE STUDENT'S EXPLICIT APPROACH.
      - DO NOT substitute or introduce a different solution/algorithm that the student did not write about.
      - Take their raw intuition, aha-moments, and code logic, and structure them with emojis, clear bullet points (-), and spaced paragraphs:
        - 💡 Core Intuition (from student's approach)
        - 🛠️ Algorithm Steps & Logic Breakdown
        - ⚠️ Edge Cases & Gotchas
    `;

    // 4. Invoke the model
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    
    // response is guaranteed to match patternSchema
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const gradeRecall = async (req, res) => {
  const { originalNotes, userRecall, title, url } = req.body;

  try {
    // 1. Define strict JSON output for grading
    const gradingSchema = z.object({
      score: z.number().min(0).max(5).describe("A score from 0 to 5 representing recall accuracy."),
      feedback: z.string().describe("1-2 sentences of constructive feedback pointing out what they missed or praising their accuracy."),
    });

    const modelName = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-lightning";
    const llm = new ChatOpenRouter({
      model: modelName, 
      temperature: 0,
      maxTokens: 1000,
    }).withStructuredOutput(gradingSchema, {
      name: "grade_recall",
      strict: true,
    });

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
    res.json(response);
  } catch (error) {
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

    const modelName = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-lightning";
    const llm = new ChatOpenRouter({
      model: modelName,
      temperature: 0,
      maxTokens: 1500,
    }).withStructuredOutput(codeGradingSchema, {
      name: "grade_code",
      strict: true,
    });

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
    res.status(500).json({ error: error.message });
  }
};

export const generateBoilerplate = async (req, res) => {
  const { title, url, codeLanguage } = req.body;

  try {
    const boilerplateSchema = z.object({
      boilerplate: z.string().describe("The exact starting boilerplate code for the given language. Should look exactly like a LeetCode starting template.")
    });

    const modelName = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-lightning";
    const llm = new ChatOpenRouter({
      model: modelName,
      temperature: 0,
      maxTokens: 500,
    }).withStructuredOutput(boilerplateSchema, {
      name: "generate_boilerplate",
      strict: true,
    });

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
    res.status(500).json({ error: error.message });
  }
};
