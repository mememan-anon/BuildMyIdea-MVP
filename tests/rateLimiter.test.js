/**
 * Rate Limiter Tests
 * Tests for rate limiting functionality
 */

import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { applyRateLimiting, strictRateLimiter, getRateLimitInfo } from '../server/middleware/rateLimiter.js';

// Create a test app with rate limiting
function createTestApp() {
  const app = express();
  
  app.use(express.json());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  }));
  
  // Test endpoint with normal rate limiting
  app.get('/api/test', applyRateLimiting, (req, res) => {
    res.json({ success: true, message: 'Test endpoint' });
  });
  
  // Test endpoint with strict rate limiting
  app.post('/api/login', strictRateLimiter, (req, res) => {
    res.json({ success: true, message: 'Login endpoint' });
  });
  
  // Test endpoint without rate limiting
  app.get('/api/unlimited', (req, res) => {
    res.json({ success: true, message: 'Unlimited endpoint' });
  });
  
  return app;
}

describe('Rate Limiter Tests', () => {
  let app;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  describe('Anonymous User Rate Limiting', () => {
    test('Should allow requests within limit', async () => {
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('Should return rate limit headers', async () => {
      const response = await request(app).get('/api/test');
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });
    
    test('Should rate limit after exceeding threshold', async () => {
      // Make multiple requests quickly
      const promises = [];
      for (let i = 0; i < 105; i++) {
        promises.push(request(app).get('/api/test'));
      }
      
      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      // Rate limited response should have error message
      const rateLimited = rateLimitedResponses[0];
      expect(rateLimited.body.error).toContain('Too many requests');
    });
  });
  
  describe('Strict Rate Limiting', () => {
    test('Should allow few requests within strict limit', async () => {
      const response1 = await request(app).post('/api/login');
      expect(response1.status).toBe(200);
      
      const response2 = await request(app).post('/api/login');
      expect(response2.status).toBe(200);
    });
    
    test('Should strictly limit sensitive endpoints', async () => {
      // Make 6 requests (strict limit is 5)
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(request(app).post('/api/login'));
      }
      
      const responses = await Promise.all(promises);
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });
  
  describe('Rate Limit Info', () => {
    test('Should return anonymous tier info', () => {
      const info = getRateLimitInfo('anonymous');
      expect(info.windowMinutes).toBe(15);
      expect(info.max).toBe(100);
    });
    
    test('Should return authenticated tier info', () => {
      const info = getRateLimitInfo('authenticated');
      expect(info.windowMinutes).toBe(15);
      expect(info.max).toBe(300);
    });
    
    test('Should return admin tier info', () => {
      const info = getRateLimitInfo('admin');
      expect(info.windowMinutes).toBe(15);
      expect(info.max).toBe(1000);
    });
    
    test('Should return strict tier info', () => {
      const info = getRateLimitInfo('strict');
      expect(info.windowMinutes).toBe(60);
      expect(info.max).toBe(5);
    });
  });
  
  describe('No Rate Limiting on Unlimited Endpoints', () => {
    test('Should allow unlimited requests on unlimited endpoint', async () => {
      // Make many requests
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(request(app).get('/api/unlimited'));
      }
      
      const responses = await Promise.all(promises);
      const allSuccessful = responses.every(r => r.status === 200);
      expect(allSuccessful).toBe(true);
    });
  });
});

// Run tests
import { describe, test, expect, beforeAll } from '@jest/globals';
export { };
