-- Migration 001: Add login tracking to users table
-- Adds failed login attempt tracking and account lockout

-- Add failed_login_attempts column
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;

-- Add locked_until column
ALTER TABLE users ADD COLUMN locked_until INTEGER;

-- Create index for faster lookups of locked accounts
CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked_until) WHERE locked_until IS NOT NULL;
