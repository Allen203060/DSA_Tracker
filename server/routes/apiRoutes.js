import express from 'express';
import { addQuestion, getDueQuestions, reviewQuestion } from '../controllers/questionController.js';
import { classifyPattern } from '../controllers/aiController.js';

const router = express.Router();

router.post('/questions', addQuestion);
router.get('/questions/due', getDueQuestions);
router.post('/questions/:id/review', reviewQuestion);

router.post('/ai/classify', classifyPattern);

export default router;
