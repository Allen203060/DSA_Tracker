import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import Question from '../src/models/Question.js';
import User from '../src/models/User.js';

describe('Question API Endpoints & Multi-User Authentication', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    // Register and authenticate a test user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'allen_tester',
        displayName: 'Allen Tester',
        password: 'password123'
      });

    authToken = regRes.body.token;
    testUser = regRes.body.user;
  });

  it('should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/questions');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Authentication required');
  });

  it('should create a new question linked to the authenticated user', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum/',
        difficulty: 'Easy',
        notes: 'Use a hash map to store complements',
        enhancedNotes: '# Two Sum\nUse a hash map.',
        topic: 'Array & Two Pointers',
        subtopic: 'Hash Map'
      });
      
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Two Sum');
    expect(res.body.difficulty).toBe('Easy');
    expect(res.body.userId).toBe(testUser.id);
    
    // Verify it was saved to DB with userId
    const questions = await Question.find({ userId: testUser.id });
    expect(questions.length).toBe(1);
    expect(questions[0].title).toBe('Two Sum');
  });

  it('should get all questions for the authenticated user', async () => {
    await Question.create({ title: 'Question 1', notes: 'Notes 1', userId: testUser.id });
    await Question.create({ title: 'Question 2', notes: 'Notes 2', userId: testUser.id });

    const res = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('should get questions sorted by recently logged (?sort=recent)', async () => {
    await Question.create({ title: 'Older Problem', notes: 'Old', userId: testUser.id, createdAt: new Date(Date.now() - 10000) });
    await Question.create({ title: 'Newer Problem', notes: 'New', userId: testUser.id, createdAt: new Date(Date.now()) });

    const res = await request(app)
      .get('/api/questions?sort=recent')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].title).toBe('Newer Problem');
    expect(res.body[1].title).toBe('Older Problem');
  });

  it('should isolate questions between different users (User A cannot see User B questions)', async () => {
    // User A (testUser) question
    await Question.create({ title: "Allen's Secret Question", notes: 'Notes', userId: testUser.id });

    // Register User B (Peer)
    const peerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'peer_bob',
        displayName: 'Bob',
        password: 'bobpassword123'
      });
    const peerToken = peerRes.body.token;
    const peerUser = peerRes.body.user;

    // User B adds their own question
    await Question.create({ title: "Bob's Public Question", notes: 'Notes', userId: peerUser.id });

    // When User B fetches questions, they should ONLY see Bob's Question
    const bobRes = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${peerToken}`);

    expect(bobRes.status).toBe(200);
    expect(bobRes.body.length).toBe(1);
    expect(bobRes.body[0].title).toBe("Bob's Public Question");

    // When Allen fetches questions, Allen should ONLY see Allen's Question
    const allenRes = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(allenRes.status).toBe(200);
    expect(allenRes.body.length).toBe(1);
    expect(allenRes.body[0].title).toBe("Allen's Secret Question");
  });

  it('should update a question owned by the user', async () => {
    const q = await Question.create({ title: 'Old Title', notes: 'Notes', userId: testUser.id });

    const res = await request(app)
      .put(`/api/questions/${q._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'New Title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New Title');

    const updated = await Question.findById(q._id);
    expect(updated.title).toBe('New Title');
  });

  it('should delete a question owned by the user', async () => {
    const q = await Question.create({ title: 'To Delete', notes: 'Notes', userId: testUser.id });

    const res = await request(app)
      .delete(`/api/questions/${q._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);

    const deleted = await Question.findById(q._id);
    expect(deleted).toBeNull();
  });

  it('should review a question and reschedule it out of the due queue', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Create a question that is currently due for this user
    const q = await Question.create({
      title: 'Due Question',
      notes: 'Notes',
      nextReviewDate: yesterday,
      userId: testUser.id
    });

    // Confirm it appears in getDueQuestions
    const dueBefore = await request(app)
      .get('/api/questions/due')
      .set('Authorization', `Bearer ${authToken}`);
    expect(dueBefore.body.some(item => item._id === q._id.toString())).toBe(true);

    // Submit AI review score (e.g. quality score = 4 out of 5)
    const reviewRes = await request(app)
      .post(`/api/questions/${q._id}/review`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ quality: 4 });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.interval).toBe(1);

    // Verify nextReviewDate is moved into the future
    const nextReview = new Date(reviewRes.body.nextReviewDate);
    expect(nextReview.getTime()).toBeGreaterThan(Date.now());

    // Confirm it is now removed from the due queue
    const dueAfter = await request(app)
      .get('/api/questions/due')
      .set('Authorization', `Bearer ${authToken}`);
    expect(dueAfter.body.some(item => item._id === q._id.toString())).toBe(false);
  });

  it('should fetch a random question for Practice Mode', async () => {
    await Question.create({ title: 'Random Solved Problem 1', notes: 'Notes 1', userId: testUser.id });
    await Question.create({ title: 'Random Solved Problem 2', notes: 'Notes 2', userId: testUser.id });

    const res = await request(app)
      .get('/api/questions/random')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(['Random Solved Problem 1', 'Random Solved Problem 2']).toContain(res.body.title);
  });

  it('should calculate Wall of Shame metrics and shame activity matrix in getActivityStats', async () => {
    // Create an overdue question to verify activeDebtCount
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 5);

    await Question.create({
      title: 'Overdue DP Problem',
      notes: 'Must revise state transitions',
      userId: testUser.id,
      nextReviewDate: overdueDate,
      createdAt: overdueDate
    });

    const res = await request(app)
      .get('/api/analytics/activity')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dailyActivity');
    expect(res.body).toHaveProperty('shameActivity');
    expect(res.body).toHaveProperty('stats');

    // Check Fame & Shame stats
    expect(res.body.stats).toHaveProperty('currentStreak');
    expect(res.body.stats).toHaveProperty('longestStreak');
    expect(res.body.stats).toHaveProperty('activeDebtCount');
    expect(res.body.stats.activeDebtCount).toBeGreaterThanOrEqual(1);
    expect(res.body.stats).toHaveProperty('totalSlackedDays');
    expect(res.body.stats).toHaveProperty('currentSlackedStreak');
    expect(res.body.stats).toHaveProperty('longestSlackedStreak');

    // Check shameActivity structure
    const keys = Object.keys(res.body.shameActivity);
    expect(keys.length).toBe(168);
    const sampleDay = res.body.shameActivity[keys[keys.length - 1]];
    expect(sampleDay).toHaveProperty('shameLevel');
    expect(sampleDay).toHaveProperty('status');
  });
});

