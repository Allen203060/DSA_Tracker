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
  generateBoilerplate,
  summarizeApproachFromCode,
  critiqueApproach
} from '../controllers/aiController.js';
import { 
  importProblemFromUrl, 
  searchProblems 
} from '../controllers/importController.js';
import { register, login, getMe, googleAuth, resetPassword, changePassword, demoLogin, demoReset } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// --- Health Check & Keep-Alive Ping ---
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// --- Authentication Endpoints ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/demo', demoLogin);
router.post('/auth/demo/reset', demoReset);
router.post('/auth/google', googleAuth);
router.post('/auth/reset-password', resetPassword);
router.post('/auth/change-password', requireAuth, changePassword);
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

// --- Universal Smart Importer & Problem Search ---
router.post('/import/url', requireAuth, importProblemFromUrl);
router.get('/import/search', requireAuth, searchProblems);

// --- AI Study Buddy & Evaluator ---
router.post('/ai/classify', requireAuth, classifyPattern);
router.post('/ai/grade', requireAuth, gradeRecall);
router.post('/ai/critique-approach', requireAuth, critiqueApproach);
router.post('/ai/grade-code', requireAuth, gradeCode);
router.post('/ai/generate-boilerplate', requireAuth, generateBoilerplate);
router.post('/ai/summarize-code', requireAuth, summarizeApproachFromCode);

export default router;