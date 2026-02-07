/**
 * CSP Tests
 * Tests for Content Security Policy headers
 */

describe('CSP Header Tests', () => {
  test('CSP header exists', async () => {
    const response = await fetch('http://localhost:3000/');
    const csp = response.headers.get('Content-Security-Policy');
    
    if (process.env.NODE_ENV === 'development') {
      // In development, CSP should be report-only or more permissive
      expect(csp || response.headers.get('Content-Security-Policy-Report-Only')).toBeDefined();
    } else {
      // In production, CSP should be enforced
      expect(csp).toBeDefined();
    }
    
    if (csp) {
      expect(csp).toContain("default-src 'self'");
    }
  });
  
  test('CSP includes security headers', async () => {
    const response = await fetch('http://localhost:3000/');
    
    // Check for various security headers
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(response.headers.get('X-XSS-Protection')).toBeDefined();
    
    if (process.env.NODE_ENV === 'production') {
      expect(response.headers.get('Strict-Transport-Security')).toBeDefined();
    }
  });
});

import { describe, test, expect } from '@jest/globals';
export { };
