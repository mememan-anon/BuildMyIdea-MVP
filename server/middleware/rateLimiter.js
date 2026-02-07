/**
 * Rate Limiter Middleware
 * Protects API endpoints from abuse and DDoS attacks
 */

import { createRateLimiter, dynamicRateLimiter as dynamicLimiter } from './rateLimiter.config.js';

/**
 * Rate limiters for different tiers
 */
export const anonRateLimiter = createRateLimiter('anonymous');
export const authRateLimiter = createRateLimiter('authenticated');
export const adminRateLimiter = createRateLimiter('admin');

/**
 * Stricter rate limiter for sensitive operations (login, password reset)
 */
export const strictRateLimiter = createRateLimiter('strict');

/**
 * Apply rate limiting to API endpoints
 * Uses different limits based on user authentication status
 */
export function applyRateLimiting(req, res, next) {
  // Attach rate limiters to request for dynamic selection
  req.anonRateLimiter = anonRateLimiter;
  req.authRateLimiter = authRateLimiter;
  req.adminRateLimiter = adminRateLimiter;
  
  return dynamicLimiter(req, res, next);
}

/**
 * Rate limiter that skips authenticated users
 * For public endpoints that should be rate limited for anonymous users only
 */
export function publicOnlyRateLimiter(req, res, next) {
  if (req.session?.userId) {
    // Skip rate limiting for authenticated users
    return next();
  }
  return anonRateLimiter(req, res, next);
}

/**
 * Apply strict rate limiting to sensitive endpoints
 */
export function applyStrictRateLimit(req, res, next) {
  return strictRateLimiter(req, res, next);
}

/**
 * Get rate limit info for a tier
 * Returns the current rate limit configuration
 */
export function getRateLimitInfo(tier) {
  const configs = {
    anonymous: {
      windowMs: 15 * 60 * 1000,
      max: 100,
      windowMinutes: 15
    },
    authenticated: {
      windowMs: 15 * 60 * 1000,
      max: 300,
      windowMinutes: 15
    },
    admin: {
      windowMs: 15 * 60 * 1000,
      max: 1000,
      windowMinutes: 15
    },
    strict: {
      windowMs: 60 * 60 * 1000,
      max: 5,
      windowMinutes: 60
    }
  };
  
  return configs[tier] || configs.anonymous;
}

export default {
  anonRateLimiter,
  authRateLimiter,
  adminRateLimiter,
  strictRateLimiter,
  applyRateLimiting,
  publicOnlyRateLimiter,
  applyStrictRateLimit,
  getRateLimitInfo
};
