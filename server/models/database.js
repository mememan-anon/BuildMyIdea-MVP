/**
 * Database Model - SQLite with better-sqlite3
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './database/bmi.db';
const DB_DIR = path.dirname(DB_PATH);

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database connection
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

/**
 * Initialize database schema
 */
function initSchema() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      is_admin INTEGER DEFAULT 0
    )
  `);

  // Ideas table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      status TEXT DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      stripe_payment_id TEXT,
      stripe_customer_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Winners table
  db.exec(`
    CREATE TABLE IF NOT EXISTS winners (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL UNIQUE,
      selected_at INTEGER DEFAULT (strftime('%s', 'now')),
      build_started_at INTEGER,
      build_completed_at INTEGER,
      demo_url TEXT,
      repo_url TEXT,
      status TEXT DEFAULT 'selected',
      FOREIGN KEY (idea_id) REFERENCES ideas(id)
    )
  `);

  // Build queue table
  db.exec(`
    CREATE TABLE IF NOT EXISTS queue (
      id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL UNIQUE,
      position INTEGER NOT NULL,
      scheduled_for INTEGER,
      priority INTEGER DEFAULT 5,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (idea_id) REFERENCES ideas(id)
    )
  `);

  // Indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);
    CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
    CREATE INDEX IF NOT EXISTS idx_winners_idea_id ON winners(idea_id);
    CREATE INDEX IF NOT EXISTS idx_queue_position ON queue(position);
  `);

  console.log('✅ Database schema initialized');
}

/**
 * User operations
 */
export const UserModel = {
  create(email, passwordHash, isAdmin = false) {
    const id = this.generateId();
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, is_admin)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, email, passwordHash, isAdmin ? 1 : 0);
    return this.findById(id);
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  getAll() {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all();
  },

  generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Idea operations
 */
export const IdeaModel = {
  create(userId, title, description, category, stripePaymentId, stripeCustomerId) {
    const id = this.generateId();
    const stmt = db.prepare(`
      INSERT INTO ideas (id, user_id, title, description, category, stripe_payment_id, stripe_customer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, title, description, category, stripePaymentId, stripeCustomerId);
    return this.findById(id);
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM ideas WHERE id = ?');
    return stmt.get(id);
  },

  findByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM ideas WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId);
  },

  updateStatus(id, status) {
    const stmt = db.prepare(`
      UPDATE ideas SET status = ?, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `);
    stmt.run(status, id);
    return this.findById(id);
  },

  getAll(limit = 50) {
    const stmt = db.prepare('SELECT * FROM ideas ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit);
  },

  getByStatus(status, limit = 50) {
    const stmt = db.prepare('SELECT * FROM ideas WHERE status = ? ORDER BY created_at DESC LIMIT ?');
    return stmt.all(status, limit);
  },

  withUser(ideaId) {
    const stmt = db.prepare(`
      SELECT i.*, u.email as user_email
      FROM ideas i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `);
    return stmt.get(ideaId);
  },

  getAllWithUser(limit = 50) {
    const stmt = db.prepare(`
      SELECT i.*, u.email as user_email
      FROM ideas i
      JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  },

  generateId() {
    return `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Winner operations
 */
export const WinnerModel = {
  create(ideaId) {
    const id = this.generateId();
    const stmt = db.prepare('INSERT INTO winners (id, idea_id) VALUES (?, ?)');
    stmt.run(id, ideaId);
    return this.findById(id);
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM winners WHERE id = ?');
    return stmt.get(id);
  },

  findByIdeaId(ideaId) {
    const stmt = db.prepare('SELECT * FROM winners WHERE idea_id = ?');
    return stmt.get(ideaId);
  },

  getAll(limit = 50) {
    const stmt = db.prepare(`
      SELECT w.*, i.title, i.description, i.user_id, u.email as user_email
      FROM winners w
      JOIN ideas i ON w.idea_id = i.id
      JOIN users u ON i.user_id = u.id
      ORDER BY w.selected_at DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  },

  updateBuildStatus(id, buildStartedAt, buildCompletedAt, demoUrl, repoUrl, status) {
    const stmt = db.prepare(`
      UPDATE winners
      SET build_started_at = ?, build_completed_at = ?, demo_url = ?, repo_url = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(buildStartedAt, buildCompletedAt, demoUrl, repoUrl, status, id);
    return this.findById(id);
  },

  generateId() {
    return `winner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Queue operations
 */
export const QueueModel = {
  add(ideaId, priority = 5) {
    const id = this.generateId();
    // Get next position
    const maxPos = db.prepare('SELECT MAX(position) as max_pos FROM queue').get();
    const position = (maxPos.max_pos || 0) + 1;
    
    const stmt = db.prepare('INSERT INTO queue (id, idea_id, position, priority) VALUES (?, ?, ?, ?)');
    stmt.run(id, ideaId, position, priority);
    return this.findById(id);
  },

  remove(ideaId) {
    const stmt = db.prepare('DELETE FROM queue WHERE idea_id = ?');
    stmt.run(ideaId);
    this.reorder();
  },

  getAll() {
    const stmt = db.prepare(`
      SELECT q.*, i.title, i.description, i.user_id, u.email as user_email
      FROM queue q
      JOIN ideas i ON q.idea_id = i.id
      JOIN users u ON i.user_id = u.id
      ORDER BY q.position ASC
    `);
    return stmt.all();
  },

  getNext() {
    const stmt = db.prepare(`
      SELECT q.*, i.title, i.description, i.user_id, u.email as user_email
      FROM queue q
      JOIN ideas i ON q.idea_id = i.id
      JOIN users u ON i.user_id = u.id
      ORDER BY q.priority ASC, q.position ASC
      LIMIT 1
    `);
    return stmt.get();
  },

  reorder() {
    const items = db.prepare('SELECT id, idea_id FROM queue ORDER BY position ASC').all();
    const updateStmt = db.prepare('UPDATE queue SET position = ? WHERE id = ?');
    const reorder = db.transaction((items) => {
      items.forEach((item, index) => {
        updateStmt.run(index + 1, item.id);
      });
    });
    reorder(items);
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM queue WHERE id = ?');
    return stmt.get(id);
  },

  generateId() {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Database initialization
 */
export function initDatabase() {
  initSchema();
  return db;
}

export default db;
