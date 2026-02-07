/**
 * Authentication Controller
 * Handles user registration, login, token refresh, and logout
 */

import bcrypt from 'bcrypt';
import { UserModel } from '../models/database.js';
import { TokenBlacklistModel } from '../models/tokenBlacklist.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../middleware/auth.js';

// Bcrypt work factor
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * Password validation
 */
export function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
}

/**
 * User registration
 */
export async function register(req, res) {
  try {
    const { email, password, isAdmin = false } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }
    
    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        error: 'Weak password',
        message: passwordErrors.join('. ')
      });
    }
    
    // Check if user already exists
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    
    // Create user
    const user = UserModel.create(email, passwordHash, isAdmin);
    
    // Generate tokens
    const accessToken = generateAccessToken(user.id, isAdmin);
    const refreshToken = generateRefreshToken(user.id);
    
    // Calculate expiry for refresh token (7 days from now)
    const refreshExpiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
    
    // Set refresh token cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    
    // Set access token cookie (optional, can use header instead)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        isAdmin: !!user.is_admin
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user'
    });
  }
}

/**
 * User login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }
    
    // Find user
    const user = UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user.id, !!user.is_admin);
    const refreshToken = generateRefreshToken(user.id);
    
    // Set refresh token cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    
    // Set access token cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        isAdmin: !!user.is_admin
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to login'
    });
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(req, res) {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token not found'
      });
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if refresh token is blacklisted
    const isBlacklisted = TokenBlacklistModel.isBlacklisted(refreshToken);
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token has been revoked'
      });
    }
    
    // Find user
    const user = UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }
    
    // Generate new access token
    const newAccessToken = generateAccessToken(user.id, !!user.is_admin);
    
    // Token rotation: generate new refresh token and blacklist old one
    const newRefreshToken = generateRefreshToken(user.id);
    const refreshExpiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
    
    // Blacklist old refresh token
    TokenBlacklistModel.add(
      refreshToken,
      'refresh',
      user.id,
      refreshExpiresAt
    );
    
    // Set new refresh token cookie
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    
    // Set new access token cookie
    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });
    
    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Failed to refresh token'
    });
  }
}

/**
 * Logout
 */
export async function logout(req, res) {
  try {
    // Get current access token
    const accessToken = req.cookies?.access_token || 
                        req.headers?.authorization?.replace('Bearer ', '');
    
    // Get refresh token
    const refreshToken = req.cookies?.refresh_token;
    
    // Blacklist access token (if present)
    if (accessToken) {
      try {
        // Get expiry from token (15 minutes from issue)
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + (15 * 60); // Max 15 minutes
        TokenBlacklistModel.add(accessToken, 'access', req.userId || 'unknown', expiresAt);
      } catch (e) {
        // Ignore errors during token blacklisting
      }
    }
    
    // Blacklist refresh token (if present)
    if (refreshToken) {
      try {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + (7 * 24 * 60 * 60); // Max 7 days
        TokenBlacklistModel.add(refreshToken, 'refresh', req.userId || 'unknown', expiresAt);
      } catch (e) {
        // Ignore errors during token blacklisting
      }
    }
    
    // Clear cookies
    res.clearCookie('refresh_token', { path: '/' });
    res.clearCookie('access_token', { path: '/' });
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to logout'
    });
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(req, res) {
  try {
    const user = UserModel.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: !!user.is_admin,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user info'
    });
  }
}

export default {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  validatePassword
};
