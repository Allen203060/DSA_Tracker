import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: false },
  
  // Your personal notes on the "trick", pattern application, and aha-moments.
  notes: { type: String, required: true },
  
  // AI-enhanced version of your notes (cleaned up, better formatting)
  enhancedNotes: { type: String, required: false },
  
  // Solution Code & Language for Quick Revision
  code: { type: String, default: '' },
  codeLanguage: { type: String, default: 'cpp' },

  // Custom Test Cases for Playground Practice
  testCases: [{
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' }
  }],

  // Hierarchical categorization: Topic (e.g. Stack) & Subtopic (e.g. Monotonic Stack, Index/Width Calc)
  topic: { type: String, default: 'General', trim: true },
  subtopic: { type: String, default: 'General', trim: true },
  
  // Algorithmic Difficulty: Easy, Medium, Hard
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium', trim: true },

  // The patterns applied in this question (can be auto-populated by LangChain)
  patterns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pattern' }],

  // --- SPACED REPETITION (SM-2 Algorithm Fields) ---
  
  // How many times you've successfully recalled this in a row
  repetitions: { type: Number, default: 0 }, 
  
  // The "Ease" multiplier (starts at 2.5). Dictates how quickly the interval grows.
  easeFactor: { type: Number, default: 2.5 }, 
  
  // The current interval in days before you need to review it again
  interval: { type: Number, default: 0 }, 
  
  // The exact date this question should show up on your dashboard next (defaults to tomorrow)
  nextReviewDate: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }, 
  
  // History of recall reviews performed on this question
  reviewHistory: [{
    reviewedAt: { type: Date, default: Date.now },
    quality: { type: Number, required: true }
  }],

}, { timestamps: true });

export default mongoose.model('Question', questionSchema);
 