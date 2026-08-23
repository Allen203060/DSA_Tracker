import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  
  // Your personal notes on the "trick", pattern application, and aha-moments.
  notes: { type: String, required: true },
  
  // The patterns applied in this question (can be auto-populated by LangChain)
  patterns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pattern' }],

  // --- SPACED REPETITION (SM-2 Algorithm Fields) ---
  
  // How many times you've successfully recalled this in a row
  repetitions: { type: Number, default: 0 }, 
  
  // The "Ease" multiplier (starts at 2.5). Dictates how quickly the interval grows.
  easeFactor: { type: Number, default: 2.5 }, 
  
  // The current interval in days before you need to review it again
  interval: { type: Number, default: 0 }, 
  
  // The exact date this question should show up on your dashboard next
  nextReviewDate: { type: Date, default: Date.now }, 

}, { timestamps: true });

export default mongoose.model('Question', questionSchema);
 