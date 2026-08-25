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

    // 2. Initialize the OpenRouter Chat Model
    const llm = new ChatOpenRouter({
      // You can replace this with any model on OpenRouter (e.g. meta-llama/llama-3.1-8b-instruct)
      model: "anthropic/claude-3-haiku", 
      temperature: 0, 
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

    const llm = new ChatOpenRouter({
      model: "anthropic/claude-3-haiku", 
      temperature: 0,
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
