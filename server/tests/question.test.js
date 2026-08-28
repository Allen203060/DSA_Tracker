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
});
