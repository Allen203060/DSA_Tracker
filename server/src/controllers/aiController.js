import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

export const classifyPattern = async (req, res) => {
  const { title, notes } = req.body;

  try {
    // 1. Define the exact JSON structure we want back from the LLM using Zod
    const patternSchema = z.object({
      patterns: z.array(z.string()).describe("A list of algorithmic patterns (e.g., 'Monotonic Stack', 'Sliding Window') identified from the notes."),
    });

    // 2. Initialize the Chat Model and enforce the structured output
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0, // 0 for deterministic outputs
    }).withStructuredOutput(patternSchema, {
      name: "extract_patterns",
      strict: true,
    });

    // 3. Craft the prompt
    const prompt = `
      You are an expert algorithms instructor.
      Given the following problem title and a student's notes, identify the core algorithmic patterns used to solve it.
      
      Problem Title: ${title}
      Student Notes: ${notes}
    `;

    // 4. Invoke the model
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    
    // response is guaranteed to be { patterns: ["Pattern1", "Pattern2"] }
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
