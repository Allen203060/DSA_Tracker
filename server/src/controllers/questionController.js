import Question from '../models/Question.js';
import Pattern from '../models/Pattern.js';

// CREATE Question
export const addQuestion = async (req, res) => {
  try {
    const { title, url, notes, patternNames } = req.body;
    
    // Find or create patterns
    const patternIds = [];
    if (patternNames && patternNames.length > 0) {
      for (const name of patternNames) {
        let pattern = await Pattern.findOne({ name });
        if (!pattern) {
          pattern = await Pattern.create({ name });
        }
        patternIds.push(pattern._id);
      }
    }

    const newQuestion = await Question.create({
      title,
      url,
      notes,
      patterns: patternIds
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET Questions Due for Review Today
export const getDueQuestions = async (req, res) => {
  try {
    const today = new Date();
    const questions = await Question.find({
      nextReviewDate: { $lte: today }
    }).populate('patterns');
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// REVIEW Question (The SM-2 Spaced Repetition Engine)
export const reviewQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    // quality is a score from 0 to 5. (5 = perfect recall, 0 = complete blackout)
    const { quality } = req.body; 
    
    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ message: "Question not found" });

    let { repetitions, easeFactor, interval } = question;

    // SM-2 Algorithm Implementation
    if (quality >= 3) {
      // Correct response
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      // Incorrect response - reset repetitions
      repetitions = 0;
      interval = 1;
    }

    // Adjust the Ease Factor (minimum 1.3)
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    // Save updates
    question.repetitions = repetitions;
    question.easeFactor = easeFactor;
    question.interval = interval;
    question.nextReviewDate = nextReviewDate;
    
    await question.save();

    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
