/**
 * CSRF Protection Tests
 * Tests for CSRF token generation and validation
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { csrfProtection, strictCSRFValidation, generateCSRFToken } from '../server/middleware/csrfProtection.js';

describe('CSRF Protection Tests', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use(csrfProtection);
    
    // Test endpoints
    app.get('/api/test', (req, res) => {
      res.json({ 
        success: true, 
        csrfToken: req.csrfToken ? req.csrfToken() : null 
      });
    });
    
    app.post('/api/test', (req, res) => {
      res.json({ success: true, message: 'POST request successful' });
    });
    
    app.put('/api/test', (req, res) => {
      res.json({ success: true, message: 'PUT request successful' });
    });
    
    app.delete('/api/test', (req, res) => {
      res.json({ success: true, message: 'DELETE request successful' });
    });
  });
  
  describe('CSRF Token Generation', () => {
    test('Should generate CSRF token on GET request', async () => {
      const response = await request(app).get('/api/test');
      expect(response.status).toBe(200);
      expect(response.body.csrfToken).toBeDefined();
      expect(response.body.csrfToken).toMatch(/^[a-f0-9]{64}$/); // 64 hex characters
      expect(response.headers['set-cookie']).toBeDefined();
      
      // Check CSRF cookie
      const csrfCookie = response.headers['set-cookie'].find(c => c.startsWith('csrf_token='));
      expect(csrfCookie).toBeDefined();
    });
    
    test('Should generate unique tokens for each request', async () => {
      const response1 = await request(app).get('/api/test');
      const response2 = await request(app).get('/api/test');
      
      expect(response1.body.csrfToken).toBeDefined();
      expect(response2.body.csrfToken).toBeDefined();
      expect(response1.body.csrfToken).not.toBe(response2.body.csrfToken);
    });
  });
  
  describe('CSRF Token Validation', () => {
    test('Should reject POST request without CSRF token', async () => {
      const response = await request(app)
        .post('/api/test')
        .send({ data: 'test' });
      
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('CSRF token missing');
    });
    
    test('Should reject POST request with invalid CSRF token', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('X-CSRF-Token', 'invalid_token')
        .send({ data: 'test' });
      
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Invalid CSRF token');
    });
    
    test('Should accept POST request with valid CSRF token in header', async () => {
      // First, get a CSRF token
      const getResponse = await request(app).get('/api/test');
      const csrfToken = getResponse.body.csrfToken;
      
      // Use the token in POST request
      const postResponse = await request(app)
        .post('/api/test')
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' });
      
      expect(postResponse.status).toBe(200);
      expect(postResponse.body.success).toBe(true);
    });
    
    test('Should accept POST request with valid CSRF token in body', async () => {
      // First, get a CSRF token
      const getResponse = await request(app).get('/api/test');
      const csrfToken = getResponse.body.csrfToken;
      
      // Use the token in POST request body
      const postResponse = await request(app)
        .post('/api/test')
        .send({ 
          data: 'test',
          csrf_token: csrfToken 
        });
      
      expect(postResponse.status).toBe(200);
      expect(postResponse.body.success).toBe(true);
    });
    
    test('Should reject PUT request without CSRF token', async () => {
      const response = await request(app)
        .put('/api/test')
        .send({ data: 'test' });
      
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('CSRF token missing');
    });
    
    test('Should accept PUT request with valid CSRF token', async () => {
      const getResponse = await request(app).get('/api/test');
      const csrfToken = getResponse.body.csrfToken;
      
      const putResponse = await request(app)
        .put('/api/test')
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' });
      
      expect(putResponse.status).toBe(200);
    });
    
    test('Should reject DELETE request without CSRF token', async () => {
      const response = await request(app).delete('/api/test');
      
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('CSRF token missing');
    });
    
    test('Should accept DELETE request with valid CSRF token', async () => {
      const getResponse = await request(app).get('/api/test');
      const csrfToken = getResponse.body.csrfToken;
      
      const deleteResponse = await request(app)
        .delete('/api/test')
        .set('X-CSRF-Token', csrfToken);
      
      expect(deleteResponse.status).toBe(200);
    });
  });
  
  describe('Strict CSRF Validation (Admin)', () => {
    let adminApp;
    
    beforeEach(() => {
      adminApp = express();
      adminApp.use(cookieParser());
      adminApp.use(express.json());
      adminApp.use(csrfProtection);
      
      adminApp.post('/api/admin/test', strictCSRFValidation, (req, res) => {
        res.json({ success: true, message: 'Admin endpoint' });
      });
    });
    
    test('Should require CSRF token in header for admin endpoints', async () => {
      const getResponse = await request(adminApp).get('/api/test');
      const csrfToken = getResponse.body.csrfToken;
      
      // Try with token in body (should fail for admin)
      const response1 = await request(adminApp)
        .post('/api/admin/test')
        .send({ csrf_token: csrfToken });
      
      expect(response1.status).toBe(403);
      expect(response1.body.message).toContain('Include X-CSRF-Token header');
      
      // Try with token in header (should succeed)
      const response2 = await request(adminApp)
        .post('/api/admin/test')
        .set('X-CSRF-Token', csrfToken)
        .send({ data: 'test' });
      
      expect(response2.status).toBe(200);
    });
  });
  
  describe('CSRF Token Generation Utility', () => {
    test('Should generate valid hex tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      
      expect(token1).toMatch(/^[a-f0-9]{64}$/);
      expect(token2).toMatch(/^[a-f0-9]{64}$/);
      expect(token1).not.toBe(token2);
    });
  });
});

import { describe, test, expect, beforeEach } from '@jest/globals';
export { };
