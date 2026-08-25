import express from 'express';
import { addQuestion, getDueQuestions, reviewQuestion, getAllQuestions, deleteQuestion, getActivityStats } from '../controllers/questionController.js';
import { classifyPattern, gradeRecall } from '../controllers/aiController.js';


const router = express.Router();

router.post('/questions', addQuestion);
router.get('/questions', getAllQuestions);
router.get('/questions/due', getDueQuestions);
router.post('/questions/:id/review', reviewQuestion);
router.delete('/questions/:id', deleteQuestion);

router.get('/analytics/activity', getActivityStats);

router.post('/ai/classify', classifyPattern);
router.post('/ai/grade', gradeRecall);

export default router;
