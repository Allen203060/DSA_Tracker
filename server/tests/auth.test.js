import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

describe('Auth API Endpoints (Login, Reset, Change, Google)', () => {
  beforeEach(async () => {
    await User.deleteMany({ username: { $ne: 'allen' } });
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'alice',
        password: 'password123',
        displayName: 'Alice Engineer'
      });

    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('alice');
    expect(res.body.user.displayName).toBe('Alice Engineer');
    expect(res.body.token).toBeDefined();
  });

  it('should login an existing user with correct credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'bob',
        password: 'password123',
        displayName: 'Bob Dev'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'bob',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('bob');
    expect(res.body.token).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'carol',
        password: 'correctpassword',
        displayName: 'Carol'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'carol',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid username or password');
  });

  it('should reset password with valid recovery key', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'dave',
        password: 'oldpassword123',
        displayName: 'Dave'
      });

    // Reset password using recovery key
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        username: 'dave',
        recoveryKey: 'dave-recovery',
        newPassword: 'newsecurepassword'
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toContain('Password reset successfully');
    expect(resetRes.body.token).toBeDefined();

    // Verify login with new password works
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'dave',
        password: 'newsecurepassword'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.username).toBe('dave');
  });

  it('should reject password reset with incorrect recovery key', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'eve',
        password: 'originalpass123'
      });

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        username: 'eve',
        recoveryKey: 'wrong-key',
        newPassword: 'brandnewpass123'
      });

    expect(resetRes.status).toBe(403);
    expect(resetRes.body.error).toContain('Invalid recovery key');
  });

  it('should reject Google auth when no credential is provided', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Google credential token is required');
  });

  it('should allow 1-click guest demo login with seeded showcase questions', async () => {
    const res = await request(app)
      .post('/api/auth/demo');

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('demo');
    expect(res.body.user.displayName).toBe('Demo Explorer');
    expect(res.body.user.isDemo).toBe(true);
    expect(res.body.token).toBeDefined();

    // Verify demo questions are accessible using the demo token
    const questionsRes = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${res.body.token}`);

    expect(questionsRes.status).toBe(200);
    expect(questionsRes.body.length).toBeGreaterThanOrEqual(4);
    const titles = questionsRes.body.map(q => q.title);
    expect(titles).toContain('Two Sum');
    expect(titles).toContain('Daily Temperatures');
    expect(titles).toContain('Trapping Rain Water');
    expect(titles).toContain('Sliding Window Maximum');
  });

  it('should reset demo showcase questions back to pristine state', async () => {
    const resetRes = await request(app)
      .post('/api/auth/demo/reset');

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toContain('reset');
  });
});

