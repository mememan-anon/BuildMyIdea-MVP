/**
 * JWT Authentication Middleware
 * Provides JWT-based authentication with access and refresh tokens
 */

import jwt from 'jsonwebtoken';
import { TokenBlacklistModel } from '../models/tokenBlacklist.js';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-change-in-production';

/**
 * Generate access token
 */
export function generateAccessToken(userId, isAdmin = false) {
  return jwt.sign(
    { userId, isAdmin, type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    }
    throw new Error('Invalid access token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw new Error('Invalid refresh token');
  }
}

/**
 * Middleware to protect routes with JWT authentication
 */
export function authenticate(req, res, next) {
  // Try to get token from Authorization header
  let token = null;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  // If not in header, try cookie
  if (!token && req.cookies?.access_token) {
    token = req.cookies.access_token;
  }
  
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }
  
  try {
    const decoded = verifyAccessToken(token);
    
    // Check if token is blacklisted
    const isBlacklisted = TokenBlacklistModel.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has been revoked'
      });
    }
    
    // Attach user info to request
    req.userId = decoded.userId;
    req.isAdmin = decoded.isAdmin;
    req.token = token;
    
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Invalid or expired token'
    });
  }
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req, res, next) {
  if (!req.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  next();
}

/**
 * Optional authentication - attaches user info if token present
 * Doesn't fail if no token
 */
export function optionalAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }
  
  if (!token) {
    return next();
  }
  
  try {
    const decoded = verifyAccessToken(token);
    const isBlacklisted = TokenBlacklistModel.isBlacklisted(token);
    
    if (!isBlacklisted) {
      req.userId = decoded.userId;
      req.isAdmin = decoded.isAdmin;
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  
  next();
}

/**
 * Extract token from request
 */
export function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return req.cookies?.access_token || null;
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  authenticate,
  requireAdmin,
  optionalAuth,
  extractToken
};
