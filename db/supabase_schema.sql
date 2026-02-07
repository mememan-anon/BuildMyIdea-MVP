-- Supabase schema for BuildMyIdea MVP
-- Tables: users, ideas, winners, queue, payments

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Ideas (submissions)
CREATE TABLE IF NOT EXISTS ideas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category text,
  status text DEFAULT 'pending', -- pending, paid, queued, building, completed, winner
  priority integer DEFAULT 0,
  stealth boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  selected_at timestamptz,
  demo_url text,
  repo_url text
);

CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at);

-- Winners
CREATE TABLE IF NOT EXISTS winners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  selected_by uuid REFERENCES users(id),
  selected_at timestamptz DEFAULT now(),
  build_started_at timestamptz,
  build_completed_at timestamptz,
  status text DEFAULT 'selected' -- selected, building, completed
);

-- Queue
CREATE TABLE IF NOT EXISTS build_queue (
  id serial PRIMARY KEY,
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  position integer NOT NULL,
  priority integer DEFAULT 0,
  enqueued_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_queue_idea ON build_queue(idea_id);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  provider text NOT NULL, -- stripe, supabase, etc.
  provider_payment_id text,
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending', -- pending, succeeded, failed, refunded
  created_at timestamptz DEFAULT now(),
  succeeded_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Useful Views
CREATE OR REPLACE VIEW vw_pending_ideas AS
SELECT i.* FROM ideas i WHERE i.status IN ('pending','paid') ORDER BY i.created_at DESC;

-- Note: For Supabase, enable pgcrypto extension for gen_random_uuid
-- Run: CREATE EXTENSION IF NOT EXISTS pgcrypto;
