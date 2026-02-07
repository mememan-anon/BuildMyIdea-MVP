/**
 * Content Security Policy Middleware
 * Configures CSP headers to prevent XSS attacks
 */

import helmet from 'helmet';

/**
 * CSP configuration
 */
const CSP_DIRECTIVES = {
  // Default policy: only allow resources from same origin
  'default-src': ["'self'"],
  
  // Scripts: only from same origin, allow inline if needed for development
  'script-src': process.env.NODE_ENV === 'development' 
    ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
    : ["'self'"],
  
  // Styles: allow inline styles for dynamic styling
  'style-src': ["'self'", "'unsafe-inline'", "https:"],
  
  // Images: allow data URLs and HTTPS images
  'img-src': ["'self'", "data:", "https:"],
  
  // Fonts: from same origin and Google Fonts (if used)
  'font-src': ["'self'", "data:", "https:"],
  
  // Connect: allow API calls and websockets
  'connect-src': ["'self'", "https://api.stripe.com"],
  
  // Media: allow media from same origin and HTTPS
  'media-src': ["'self'", "https:"],
  
  // Objects: block objects (flash, etc)
  'object-src': ["'none'"],
  
  // Base: restrict base URLs
  'base-uri': ["'self'"],
  
  // Form actions: only forms to same origin
  'form-action': ["'self'"],
  
  // Frame ancestors: prevent clickjacking
  'frame-ancestors': ["'self'"],
  
  // Upgrade insecure requests
  'upgrade-insecure-requests': []
};

/**
 * Generate nonce for inline scripts
 */
export function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * CSP nonce middleware
 * Adds nonce to request for use in templates
 */
export function cspNonce(req, res, next) {
  req.cspNonce = generateNonce();
  res.locals.cspNonce = req.cspNonce;
  next();
}

/**
 * Get CSP configuration for current environment
 */
export function getCspConfig() {
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    // Report-only mode in development
    return {
      contentSecurityPolicy: {
        directives: CSP_DIRECTIVES,
        reportOnly: true
      }
    };
  }
  
  // Enforced mode in production
  return {
    contentSecurityPolicy: {
      directives: CSP_DIRECTIVES
    }
  };
}

/**
 * CSP middleware
 */
export function cspProtection() {
  const config = getCspConfig();
  return helmet.contentSecurityPolicy(config);
}

/**
 * CSP middleware with nonce support
 * Adds nonce for inline scripts
 */
export function cspWithNonce(req, res, next) {
  // Generate nonce
  const nonce = generateNonce();
  req.cspNonce = nonce;
  res.locals.cspNonce = nonce;
  
  // Configure CSP with nonce
  const scriptSrc = process.env.NODE_ENV === 'development'
    ? ["'self'", "'unsafe-inline'", `'nonce-${nonce}'`]
    : ["'self'", `'nonce-${nonce}'`];
  
  return helmet.contentSecurityPolicy({
    directives: {
      ...CSP_DIRECTIVES,
      'script-src': scriptSrc
    }
  })(req, res, next);
}

export default {
  generateNonce,
  cspNonce,
  getCspConfig,
  cspProtection,
  cspWithNonce
};
