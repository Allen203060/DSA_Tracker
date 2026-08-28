import express from 'express';
import { addQuestion, getDueQuestions, reviewQuestion, getAllQuestions, deleteQuestion, updateQuestion, getActivityStats } from '../controllers/questionController.js';
import { classifyPattern, gradeRecall, gradeCode, generateBoilerplate } from '../controllers/aiController.js';

const router = express.Router();

router.post('/questions', addQuestion);
router.get('/questions', getAllQuestions);
router.get('/questions/due', getDueQuestions);
router.put('/questions/:id', updateQuestion);
router.post('/questions/:id/review', reviewQuestion);
router.delete('/questions/:id', deleteQuestion);

router.get('/analytics/activity', getActivityStats);

router.post('/ai/classify', classifyPattern);
router.post('/ai/grade', gradeRecall);
router.post('/ai/grade-code', gradeCode);
router.post('/ai/generate-boilerplate', generateBoilerplate);

export default router;
    