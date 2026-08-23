import mongoose from 'mongoose';

const patternSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  description: { 
    type: String 
  },
  // We can track dependencies. e.g., "Monotonic Stack" depends on "Standard Stack"
  relatedPatterns: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pattern' 
  }],
}, { timestamps: true });

export default mongoose.model('Pattern', patternSchema);
