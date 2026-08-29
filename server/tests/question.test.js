import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Question from '../src/models/Question.js';

describe('Question API Endpoints', () => {
  it('should create a new question', async () => {
    const res = await request(app)
      .post('/api/questions')
      .send({
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum/',
        difficulty: 'Easy',
        notes: 'Use a hash map to store complements',
        enhancedNotes: '# Two Sum\\nUse a hash map.',
        topic: 'Array & Two Pointers',
        subtopic: 'Hash Map'
      });
      
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Two Sum');
    expect(res.body.difficulty).toBe('Easy');
    
    // Verify it was saved to DB
    const questions = await Question.find({});
    expect(questions.length).toBe(1);
    expect(questions[0].title).toBe('Two Sum');
  });

  it('should get all questions', async () => {
    await Question.create({ title: 'Question 1', notes: 'Notes 1' });
    await Question.create({ title: 'Question 2', notes: 'Notes 2' });

    const res = await request(app).get('/api/questions');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('should update a question', async () => {
    const q = await Question.create({ title: 'Old Title', notes: 'Notes' });

    const res = await request(app)
      .put(`/api/questions/${q._id}`)
      .send({ title: 'New Title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New Title');

    const updated = await Question.findById(q._id);
    expect(updated.title).toBe('New Title');
  });

  it('should delete a question', async () => {
    const q = await Question.create({ title: 'To Delete', notes: 'Notes' });

    const res = await request(app).delete(`/api/questions/${q._id}`);
    expect(res.status).toBe(200);

    const deleted = await Question.findById(q._id);
    expect(deleted).toBeNull();
  });

  it('should review a question and reschedule it out of the due queue', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Create a question that is currently due (nextReviewDate in the past)
    const q = await Question.create({
      title: 'Due Question',
      notes: 'Notes',
      nextReviewDate: yesterday
    });

    // Confirm it appears in getDueQuestions
    const dueBefore = await request(app).get('/api/questions/due');
    expect(dueBefore.body.some(item => item._id === q._id.toString())).toBe(true);

    // Submit AI review score (e.g. quality score = 4 out of 5)
    const reviewRes = await request(app)
      .post(`/api/questions/${q._id}/review`)
      .send({ quality: 4 });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.interval).toBe(1);

    // Verify nextReviewDate is moved into the future
    const nextReview = new Date(reviewRes.body.nextReviewDate);
    expect(nextReview.getTime()).toBeGreaterThan(Date.now());

    // Confirm it is now removed from the due queue
    const dueAfter = await request(app).get('/api/questions/due');
    expect(dueAfter.body.some(item => item._id === q._id.toString())).toBe(false);
  });
});
