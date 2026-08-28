import Question from '../models/Question.js';
import Pattern from '../models/Pattern.js';

// CREATE Question
export const addQuestion = async (req, res) => {
  try {
    const { title, url, notes, enhancedNotes, topic, subtopic, patternNames, code, codeLanguage, testCases } = req.body;
    
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

    // Calculate initial review date (scheduled 1 day in the future so it's not due today)
    const initialReviewDate = new Date();
    initialReviewDate.setDate(initialReviewDate.getDate() + 1);

    const newQuestion = await Question.create({
      title,
      url,
      notes,
      enhancedNotes,
      topic: topic || 'General',
      subtopic: subtopic || 'General',
      patterns: patternIds,
      code: code || '',
      codeLanguage: codeLanguage || 'cpp',
      testCases: Array.isArray(testCases) ? testCases : [],
      interval: 1,
      nextReviewDate: initialReviewDate
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

    // Save updates & record activity review log
    question.repetitions = repetitions;
    question.easeFactor = easeFactor;
    question.interval = interval;
    question.nextReviewDate = nextReviewDate;
    
    if (!question.reviewHistory) question.reviewHistory = [];
    question.reviewHistory.push({
      reviewedAt: new Date(),
      quality: quality
    });

    await question.save();

    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL Questions (To see the future schedule)
export const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find()
      .populate('patterns')
      .sort({ nextReviewDate: 1 }); // Sort by closest review date first
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE Question
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedQuestion = await Question.findByIdAndDelete(id);
    if (!deletedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json({ message: "Question deleted successfully", id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE Question (Code, Notes, Test Cases, Language)
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, notes, enhancedNotes, topic, subtopic, code, codeLanguage, testCases } = req.body;

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (url !== undefined) updateFields.url = url;
    if (notes !== undefined) updateFields.notes = notes;
    if (enhancedNotes !== undefined) updateFields.enhancedNotes = enhancedNotes;
    if (topic !== undefined) updateFields.topic = topic;
    if (subtopic !== undefined) updateFields.subtopic = subtopic;
    if (code !== undefined) updateFields.code = code;
    if (codeLanguage !== undefined) updateFields.codeLanguage = codeLanguage;
    if (testCases !== undefined) updateFields.testCases = testCases;

    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('patterns');

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET LeetCode Style Activity & Streak Statistics
export const getActivityStats = async (req, res) => {
  try {
    const questions = await Question.find();
    
    const dailyActivity = {};
    let totalNew = questions.length;
    let totalRecalls = 0;

    questions.forEach(q => {
      // 1. Creation Date (New Question Solved)
      if (q.createdAt) {
        const dateKey = new Date(q.createdAt).toISOString().split('T')[0];
        if (!dailyActivity[dateKey]) {
          dailyActivity[dateKey] = { newCount: 0, recallCount: 0, total: 0 };
        }
        dailyActivity[dateKey].newCount += 1;
        dailyActivity[dateKey].total += 1;
      }

      // 2. Review History (Recall Sessions)
      if (q.reviewHistory && q.reviewHistory.length > 0) {
        totalRecalls += q.reviewHistory.length;
        q.reviewHistory.forEach(rev => {
          const revDateKey = new Date(rev.reviewedAt).toISOString().split('T')[0];
          if (!dailyActivity[revDateKey]) {
            dailyActivity[revDateKey] = { newCount: 0, recallCount: 0, total: 0 };
          }
          dailyActivity[revDateKey].recallCount += 1;
          dailyActivity[revDateKey].total += 1;
        });
      }
    });

    // Calculate Streaks
    const activeDates = Object.keys(dailyActivity).sort();
    let currentStreak = 0;
    let longestStreak = 0;

    if (activeDates.length > 0) {
      const todayKey = new Date().toISOString().split('T')[0];
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayKey = yesterdayDate.toISOString().split('T')[0];

      let checkDate = new Date();
      if (!dailyActivity[todayKey] && dailyActivity[yesterdayKey]) {
        checkDate = yesterdayDate;
      }

      while (true) {
        const key = checkDate.toISOString().split('T')[0];
        if (dailyActivity[key] && dailyActivity[key].total > 0) {
          currentStreak += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      let tempStreak = 0;
      let prevDate = null;

      activeDates.forEach(dateStr => {
        const currDate = new Date(dateStr);
        if (prevDate) {
          const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak += 1;
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        prevDate = currDate;
      });
    }

    res.json({
      dailyActivity,
      stats: {
        currentStreak,
        longestStreak,
        totalNew,
        totalRecalls
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
