import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Universal Import & Live Search API Endpoints', () => {
  let authToken;

  beforeEach(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'import_tester',
        displayName: 'Import Tester',
        password: 'password123'
      });
    authToken = regRes.body.token;
  });

  it('should reject unauthenticated import requests', async () => {
    const res = await request(app)
      .post('/api/import/url')
      .send({ url: 'https://leetcode.com/problems/two-sum/' });
    expect(res.status).toBe(401);
  });

  it('should import problem details from a valid LeetCode URL', async () => {
    const res = await request(app)
      .post('/api/import/url')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ url: 'https://leetcode.com/problems/two-sum/' });

    expect(res.status).toBe(200);
    expect(res.body.platform).toBe('leetcode');
    expect(res.body.title).toContain('Two Sum');
    expect(res.body.difficulty).toBe('Easy');
    expect(Array.isArray(res.body.tags)).toBe(true);
    expect(res.body.tags).toContain('Array');
  });

  it('should import problem details from a GeeksforGeeks URL', async () => {
    const res = await request(app)
      .post('/api/import/url')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ url: 'https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1' });

    expect(res.status).toBe(200);
    expect(res.body.platform).toBe('geeksforgeeks');
    expect(res.body.title).toMatch(/Kadane'?s Algorithm/i);
    expect(res.body.difficulty).toBe('Medium');
  });

  it('should handle generic fallback URLs gracefully', async () => {
    const res = await request(app)
      .post('/api/import/url')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ url: 'https://example.com/problems/custom-tree-traversal' });

    expect(res.status).toBe(200);
    expect(res.body.platform).toBe('generic');
    expect(res.body.title).toBeDefined();
    expect(res.body.difficulty).toBe('Medium');
  });

  it('should return live search results for problem keyword or number', async () => {
    const res = await request(app)
      .get('/api/import/search?query=739')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.questions)).toBe(true);
    expect(res.body.questions.length).toBeGreaterThanOrEqual(1);
    expect(res.body.questions[0].title).toContain('Daily Temperatures');
    expect(res.body.questions[0].difficulty).toBe('Medium');
  });
});
