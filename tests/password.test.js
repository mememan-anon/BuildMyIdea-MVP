/**
 * Password Tests
 * Tests for password validation and account lockout
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import authRoutes from '../server/routes/authRoutes.js';

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
  
  app.use('/api/auth', authRoutes);
  
  return app;
}

describe('Password Validation Tests', () => {
  let app;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  test('Should reject password less than 8 characters', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test${Date.now()}@example.com`,
        password: 'Short1!'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Weak password');
  });
  
  test('Should reject password without uppercase', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test${Date.now()}@example.com`,
        password: 'nouppercase1!'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('uppercase');
  });
  
  test('Should reject password without lowercase', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test${Date.now()}@example.com`,
        password: 'NOLOWERCASE1!'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('lowercase');
  });
  
  test('Should reject password without number', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test${Date.now()}@example.com`,
        password: 'NoNumber!'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('number');
  });
  
  test('Should reject password without special character', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test${Date.now()}@example.com`,
        password: 'NoSpecial123'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('special character');
  });
  
  test('Should accept strong password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test${Date.now()}@example.com`,
        password: 'StrongPassword123!'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});

describe('Account Lockout Tests', () => {
  let app;
  let testEmail = 'lockout_test@example.com';
  const testPassword = 'LockoutTest123!';
  
  beforeAll(async () => {
    app = createTestApp();
    // Create a test user
    await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });
  });
  
  test('Should lock account after 5 failed attempts', async () => {
    // Attempt 1-5: Wrong password
    for (let i = 1; i <= 5; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword'
        });
      
      if (i < 5) {
        expect(response.status).toBe(401);
      } else {
        // 5th attempt should trigger lockout
        expect(response.status).toBe(423);
        expect(response.body.error).toBe('Locked');
      }
    }
  });
  
  test('Should prevent login when account is locked', async () => {
    // Try to login with correct password while locked
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword
      });
    
    expect(response.status).toBe(423);
    expect(response.body.error).toBe('Locked');
    expect(response.body.message).toContain('Account locked');
  });
});

import { describe, test, expect, beforeAll } from '@jest/globals';
export { };
