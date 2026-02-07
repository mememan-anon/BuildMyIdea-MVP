/**
 * CSRF Protection Middleware
 * Custom implementation since csurf is deprecated
 * Generates and validates CSRF tokens for state-changing operations
 */

import crypto from 'crypto';

/**
 * Generate a secure random CSRF token
 */
export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate CSRF token for the request
 */
export function generateToken(req, res, next) {
  const token = generateCSRFToken();
  req.csrfToken = () => token;
  res.cookie('csrf_token', token, {
    httpOnly: false, // Need to access via JavaScript for AJAX
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Also make token available via res.locals for templates
  res.locals.csrfToken = token;
  
  next();
}

/**
 * Validate CSRF token
 */
export function validateToken(req, res, next) {
  const tokenFromCookie = req.cookies?.csrf_token;
  const tokenFromHeader = req.headers['x-csrf-token'];
  const tokenFromBody = req.body?.csrf_token;
  
  // Use the token from header (preferred for AJAX) or body
  const tokenFromRequest = tokenFromHeader || tokenFromBody;
  
  if (!tokenFromCookie || !tokenFromRequest) {
    return res.status(403).json({
      error: 'CSRF token missing',
      message: 'CSRF token is required for this request'
    });
  }
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(tokenFromCookie, 'hex'),
      Buffer.from(tokenFromRequest, 'hex')
    );
    
    if (!isValid) {
      return res.status(403).json({
        error: 'Invalid CSRF token',
        message: 'CSRF token validation failed'
      });
    }
    
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'CSRF token validation failed'
    });
  }
}

/**
 * CSRF protection middleware
 * Generates token for GET requests, validates for POST/PUT/DELETE/PATCH
 */
export function csrfProtection(req, res, next) {
  // Skip for GET, HEAD, OPTIONS requests (these are safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return generateToken(req, res, next);
  }
  
  // For state-changing methods, validate token
  return validateToken(req, res, next);
}

/**
 * Get CSRF token from request (helper for templates)
 */
export function getCSRFToken(req) {
  return req.csrfToken ? req.csrfToken() : req.cookies?.csrf_token;
}

/**
 * Stricter CSRF validation for admin endpoints
 * Requires both cookie and header validation
 */
export function strictCSRFValidation(req, res, next) {
  const tokenFromCookie = req.cookies?.csrf_token;
  const tokenFromHeader = req.headers['x-csrf-token'];
  
  // Admin endpoints MUST have token in header
  if (!tokenFromCookie || !tokenFromHeader) {
    return res.status(403).json({
      error: 'CSRF token missing',
      message: 'CSRF token is required for admin endpoints. Include X-CSRF-Token header.'
    });
  }
  
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(tokenFromCookie, 'hex'),
      Buffer.from(tokenFromHeader, 'hex')
    );
    
    if (!isValid) {
      return res.status(403).json({
        error: 'Invalid CSRF token',
        message: 'CSRF token validation failed for admin endpoint'
      });
    }
    
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'CSRF token validation failed'
    });
  }
}

/**
 * Skip CSRF protection for specific routes (e.g., webhooks)
 * Returns middleware that skips validation
 */
export function skipCSRF(req, res, next) {
  next();
}

export default {
  generateCSRFToken,
  generateToken,
  validateToken,
  csrfProtection,
  getCSRFToken,
  strictCSRFValidation,
  skipCSRF
};
