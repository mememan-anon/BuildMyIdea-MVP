/**
 * Rate Limiter Configuration
 * Configures different rate limits for different user tiers
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limit tiers
 */
const RATE_LIMIT_TIERS = {
  // Anonymous users (no authentication)
  anonymous: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      error: 'Too many requests from this IP, please try again after 15 minutes'
    }
  },
  
  // Authenticated users
  authenticated: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per window
    message: {
      error: 'Too many requests, please try again after 15 minutes'
    }
  },
  
  // Admin users
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window (effectively unlimited for normal use)
    message: {
      error: 'Too many requests, please try again after 15 minutes'
    }
  },
  
  // Stricter limits for sensitive operations
  strict: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour (for login, password reset, etc.)
    message: {
      error: 'Too many attempts, please try again after 1 hour'
    }
  }
};

/**
 * Get rate limit config for a tier
 */
export function getRateLimitConfig(tier) {
  return RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.anonymous;
}

/**
 * Create rate limiter for a specific tier
 */
export function createRateLimiter(tier, options = {}) {
  const config = getRateLimitConfig(tier);
  
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: options.skip,
    keyGenerator: options.keyGenerator,
    handler: (req, res) => {
      res.status(429).json(config.message);
    }
  });
}

/**
 * Dynamic rate limiter that checks authentication status
 */
export function dynamicRateLimiter(req, res, next) {
  // Check if user is authenticated
  if (req.session?.userId) {
    // Check if user is admin
    const isAdmin = req.session?.isAdmin || false;
    if (isAdmin) {
      // Use admin rate limiter (stored as request property)
      return req.adminRateLimiter(req, res, next);
    } else {
      // Use authenticated rate limiter
      return req.authRateLimiter(req, res, next);
    }
  } else {
    // Use anonymous rate limiter
    return req.anonRateLimiter(req, res, next);
  }
}

export default {
  getRateLimitConfig,
  createRateLimiter,
  dynamicRateLimiter
};
