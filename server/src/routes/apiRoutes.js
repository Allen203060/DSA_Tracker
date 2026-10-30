import express from 'express';
import { 
  addQuestion, 
  getDueQuestions, 
  reviewQuestion, 
  getAllQuestions, 
  deleteQuestion, 
  updateQuestion, 
  getActivityStats, 
  getRandomQuestion 
} from '../controllers/questionController.js';
import { 
  classifyPattern, 
  gradeRecall, 
  gradeCode, 
  generateBoilerplate 
} from '../controllers/aiController.js';
import { register, login, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// --- Authentication Endpoints ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, getMe);

// --- User-Scoped Question Management ---
router.post('/questions', requireAuth, addQuestion);
router.get('/questions', requireAuth, getAllQuestions);
router.get('/questions/due', requireAuth, getDueQuestions);
router.get('/questions/random', requireAuth, getRandomQuestion);
router.put('/questions/:id', requireAuth, updateQuestion);
router.post('/questions/:id/review', requireAuth, reviewQuestion);
router.delete('/questions/:id', requireAuth, deleteQuestion);

// --- User-Scoped Analytics & Streaks ---
router.get('/analytics/activity', requireAuth, getActivityStats);

// --- AI Study Buddy & Evaluator ---
router.post('/ai/classify', requireAuth, classifyPattern);
router.post('/ai/grade', requireAuth, gradeRecall);
router.post('/ai/grade-code', requireAuth, gradeCode);
router.post('/ai/generate-boilerplate', requireAuth, generateBoilerplate);

export default router;