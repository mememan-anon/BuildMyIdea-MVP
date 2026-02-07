/**
 * Authentication Routes
 * Routes for user registration, login, token management
 */

import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', login);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', refreshToken);

/**
 * POST /api/auth/logout
 * Logout and invalidate tokens
 */
router.post('/logout', logout);

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', authenticate, getCurrentUser);

export default router;
