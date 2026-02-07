/**
 * Token Blacklist Model
 * Tracks revoked JWT tokens for logout and security
 */

import { initDatabase } from './database.js';

const db = initDatabase();

/**
 * Initialize token blacklist table
 */
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      id TEXT PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      token_type TEXT NOT NULL,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
  
  // Create index for faster lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_blacklist_token ON token_blacklist(token);
    CREATE INDEX IF NOT EXISTS idx_blacklist_user ON token_blacklist(user_id);
    CREATE INDEX IF NOT EXISTS idx_blacklist_expires ON token_blacklist(expires_at);
  `);
  
  console.log('✅ Token blacklist schema initialized');
}

// Initialize schema on load
initSchema();

/**
 * Token Blacklist Model
 */
export const TokenBlacklistModel = {
  /**
   * Add a token to the blacklist
   */
  add(token, tokenType, userId, expiresAt) {
    const id = `blacklist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = db.prepare(`
      INSERT INTO token_blacklist (id, token, token_type, user_id, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, token, tokenType, userId, expiresAt);
    return this.findById(id);
  },
  
  /**
   * Check if a token is blacklisted
   */
  isBlacklisted(token) {
    const stmt = db.prepare("SELECT * FROM token_blacklist WHERE token = ? AND expires_at > strftime('%s', 'now')");
    const result = stmt.get(token);
    return !!result;
  },
  
  /**
   * Blacklist all tokens for a user (for password reset, etc.)
   */
  blacklistAllForUser(userId) {
    const stmt = db.prepare('DELETE FROM token_blacklist WHERE user_id = ?');
    stmt.run(userId);
  },
  
  /**
   * Clean up expired blacklisted tokens
   */
  cleanupExpired() {
    const stmt = db.prepare("DELETE FROM token_blacklist WHERE expires_at <= strftime('%s', 'now')");
    const info = stmt.run();
    return info.changes;
  },
  
  /**
   * Get blacklisted tokens for a user
   */
  findByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM token_blacklist WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId);
  },
  
  /**
   * Find by ID
   */
  findById(id) {
    const stmt = db.prepare('SELECT * FROM token_blacklist WHERE id = ?');
    return stmt.get(id);
  },
  
  /**
   * Generate ID
   */
  generateId() {
    return `blacklist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Schedule cleanup of expired tokens (runs every hour)
 */
let cleanupInterval;

export function startTokenCleanup() {
  // Clean up every hour
  cleanupInterval = setInterval(() => {
    const deleted = TokenBlacklistModel.cleanupExpired();
    if (deleted > 0) {
      console.log(`🧹 Cleaned up ${deleted} expired blacklisted tokens`);
    }
  }, 60 * 60 * 1000); // 1 hour
  
  // Run once on startup
  TokenBlacklistModel.cleanupExpired();
}

export function stopTokenCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

export default TokenBlacklistModel;
