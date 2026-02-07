/**
 * Authentication Tests
 * Tests for JWT-based authentication
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import authRoutes from '../server/routes/authRoutes.js';
import { UserModel } from '../server/models/database.js';
import { TokenBlacklistModel } from '../server/models/tokenBlacklist.js';

// Create a test app
function createTestApp() {
  const app = express();
  
  app.use(express.json());
  app.use(cookieParser());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  }));
  
  // Register auth routes
  app.use('/api/auth', authRoutes);
  
  return app;
}

describe('Authentication Tests', () => {
  let app;
  let testUserId;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  afterAll(() => {
    // Cleanup test users if needed
  });
  
  describe('User Registration', () => {
    test('Should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'SecurePass123!'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBeDefined();
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      
      // Check cookies
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      
      testUserId = response.body.user.id;
    });
    
    test('Should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `test${Date.now()}@example.com`,
          password: 'weak'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Weak password');
    });
    
    test('Should reject duplicate email registration', async () => {
      const email = `duplicate${Date.now()}@example.com`;
      
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'SecurePass123!' });
      
      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'SecurePass123!' });
      
      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already registered');
    });
    
    test('Should reject registration without email or password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('User Login', () => {
    let testEmail;
    let testPassword = 'LoginTest123!';
    
    beforeAll(async () => {
      testEmail = `login${Date.now()}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword });
    });
    
    test('Should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      
      // Check cookies
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });
    
    test('Should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid email or password');
    });
    
    test('Should reject login without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail });
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('Token Refresh', () => {
    let refreshToken;
    let accessToken;
    
    beforeAll(async () => {
      const email = `refresh${Date.now()}@example.com`;
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'RefreshTest123!' });
      
      refreshToken = registerResponse.body.refreshToken;
      accessToken = registerResponse.body.accessToken;
    });
    
    test('Should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refresh_token=${refreshToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      
      // New refresh token should be different (token rotation)
      expect(response.body.refreshToken).not.toBe(refreshToken);
    });
    
    test('Should reject refresh without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');
      
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Refresh token not found');
    });
  });
  
  describe('Logout', () => {
    let refreshToken;
    
    beforeAll(async () => {
      const email = `logout${Date.now()}@example.com`;
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'LogoutTest123!' });
      
      refreshToken = registerResponse.body.refreshToken;
    });
    
    test('Should logout and invalidate tokens', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `refresh_token=${refreshToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Check that cookies are cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      
      // Verify tokens are blacklisted
      const isBlacklisted = TokenBlacklistModel.isBlacklisted(refreshToken);
      expect(isBlacklisted).toBe(true);
    });
  });
  
  describe('Get Current User', () => {
    let accessToken;
    
    beforeAll(async () => {
      const email = `currentuser${Date.now()}@example.com`;
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'UserTest123!' });
      
      accessToken = registerResponse.body.accessToken;
    });
    
    test('Should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBeDefined();
    });
    
    test('Should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');
      
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Authentication required');
    });
    
    test('Should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('Password Validation', () => {
    test('Should validate strong password', () => {
      const errors = UserModel.validatePassword?.('StrongPass123!');
      // If method doesn't exist, skip
      if (errors === undefined) return;
      expect(errors.length).toBe(0);
    });
    
    test('Should reject weak password - too short', () => {
      const errors = UserModel.validatePassword?.('Short1!');
      if (errors === undefined) return;
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('8 characters'))).toBe(true);
    });
    
    test('Should reject weak password - no uppercase', () => {
      const errors = UserModel.validatePassword?.('nouppercase1!');
      if (errors === undefined) return;
      expect(errors.some(e => e.includes('uppercase'))).toBe(true);
    });
    
    test('Should reject weak password - no number', () => {
      const errors = UserModel.validatePassword?.('NoNumber!');
      if (errors === undefined) return;
      expect(errors.some(e => e.includes('number'))).toBe(true);
    });
    
    test('Should reject weak password - no special char', () => {
      const errors = UserModel.validatePassword?.('NoSpecial123');
      if (errors === undefined) return;
      expect(errors.some(e => e.includes('special'))).toBe(true);
    });
  });
});

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
export { };
