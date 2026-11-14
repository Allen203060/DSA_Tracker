import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { generateToken } from '../src/middleware/auth.js';

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
    const regRes = await request(app)
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
        recoveryKey: regRes.body.recoveryKey,
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

  it('should prevent password reset and password modification for demo account', async () => {
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        username: 'demo',
        recoveryKey: 'any-key',
        newPassword: 'hackdemo123'
      });

    expect(resetRes.status).toBe(403);
    expect(resetRes.body.error).toContain('demo');

    // Attempt to change password via authenticated endpoint as demo
    const demoLogin = await request(app).post('/api/auth/demo');
    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${demoLogin.body.token}`)
      .send({
        currentPassword: 'demo_guest_pass_2026',
        newPassword: 'newdemopassword123'
      });

    expect(changeRes.status).toBe(403);
    expect(changeRes.body.error).toContain('demo');
  });

  it('should link an existing user to Google with valid token', async () => {
    // 1. Create a user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'linkuser',
        password: 'password123',
        displayName: 'Link User'
      });
    const token = regRes.body.token;

    // 2. Mock Google tokeninfo endpoint
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'google_user_unique_101',
        email: 'linkuser@gmail.com',
        name: 'Google User',
        picture: 'https://lh3.googleusercontent.com/avatar.jpg'
      })
    });

    const linkRes = await request(app)
      .post('/api/auth/link-google')
      .set('Authorization', `Bearer ${token}`)
      .send({ credential: 'mock_valid_google_jwt' });

    expect(linkRes.status).toBe(200);
    expect(linkRes.body.user.googleId).toBe('google_user_unique_101');
    expect(linkRes.body.user.email).toBe('linkuser@gmail.com');

    // Verify DB user record has googleId
    const dbUser = await User.findOne({ username: 'linkuser' });
    expect(dbUser.googleId).toBe('google_user_unique_101');

    fetchSpy.mockRestore();
  });

  it('should unlink Google account successfully if user has a password', async () => {
    // 1. Create user with Google ID and password
    await User.create({
      username: 'unlinkuser',
      password: 'password123',
      googleId: 'google_to_remove_102'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'unlinkuser', password: 'password123' });

    const unlinkRes = await request(app)
      .post('/api/auth/unlink-google')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send();

    expect(unlinkRes.status).toBe(200);
    expect(unlinkRes.body.user.googleId).toBeNull();

    const dbUser = await User.findOne({ username: 'unlinkuser' });
    expect(dbUser.googleId).toBeUndefined();
  });

  it('should prevent unlinking Google if account has no password set', async () => {
    // User created via pure OAuth without password
    const user = await User.create({
      username: 'googleonlyuser',
      googleId: 'google_only_103'
    });

    const token = generateToken(user);

    const unlinkRes = await request(app)
      .post('/api/auth/unlink-google')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(unlinkRes.status).toBe(400);
    expect(unlinkRes.body.error).toContain('Please set a password');
  });

  it('should link existing user account during Google sign-in with username and password', async () => {
    // 1. Create existing user
    await User.create({
      username: 'signinlinkuser',
      password: 'mypassword123',
      displayName: 'Sign In Link User'
    });

    // 2. Mock Google endpoint
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'google_signin_link_104',
        email: 'signinlink@gmail.com',
        name: 'Sign In Linker',
        picture: 'https://lh3.googleusercontent.com/avatar2.jpg'
      })
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({
        credential: 'mock_jwt_for_signin_link',
        linkUsername: 'signinlinkuser',
        linkPassword: 'mypassword123'
      });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('signinlinkuser');
    expect(res.body.user.googleId).toBe('google_signin_link_104');
    expect(res.body.token).toBeDefined();

    const dbUser = await User.findOne({ username: 'signinlinkuser' });
    expect(dbUser.googleId).toBe('google_signin_link_104');

    fetchSpy.mockRestore();
  });

  it('should reset password with Google verification when email matches', async () => {
    // 1. Create a user with matching email
    await User.create({
      username: 'googleresetuser',
      email: 'recoverme@gmail.com',
      password: 'oldpassword123'
    });

    // 2. Mock Google endpoint
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'google_recover_sub_201',
        email: 'recoverme@gmail.com',
        name: 'Recover User',
        picture: 'https://lh3.googleusercontent.com/avatar_rec.jpg'
      })
    });

    const res = await request(app)
      .post('/api/auth/reset-password-google')
      .send({
        credential: 'mock_jwt_for_google_recovery',
        username: 'googleresetuser',
        newPassword: 'brandnewpassword123'
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Password successfully reset');
    expect(res.body.token).toBeDefined();

    // 3. Verify user can log in with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'googleresetuser', password: 'brandnewpassword123' });
    expect(loginRes.status).toBe(200);

    fetchSpy.mockRestore();
  });

  it('should reject Google password reset if Google email does not match user account', async () => {
    await User.create({
      username: 'protecteduser',
      email: 'legitowner@gmail.com',
      password: 'originalpassword123'
    });

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'google_imposter_sub_202',
        email: 'imposter@gmail.com',
        name: 'Imposter'
      })
    });

    const res = await request(app)
      .post('/api/auth/reset-password-google')
      .send({
        credential: 'mock_jwt_imposter',
        username: 'protecteduser',
        newPassword: 'hackedpassword123'
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('does not match');

    fetchSpy.mockRestore();
  });
});

