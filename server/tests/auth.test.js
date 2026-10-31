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
});
