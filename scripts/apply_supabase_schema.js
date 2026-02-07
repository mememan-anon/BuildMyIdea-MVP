#!/usr/bin/env node
/**
 * Apply Supabase/Postgres schema locally or to a given Postgres connection.
 * Usage:
 *   node apply_supabase_schema.js postgresql://user:pass@host:port/dbname
 * Or set env var DATABASE_URL and run: node apply_supabase_schema.js
 *
 * This script runs the SQL in ../db/supabase_schema.sql against the target DB.
 */

import fs from 'fs';
import { Client } from 'pg';
import path from 'path';

const sqlPath = path.resolve(new URL(import.meta.url).pathname, '../../db/supabase_schema.sql');
const envUrl = process.env.DATABASE_URL;
const argUrl = process.argv[2];
const dbUrl = argUrl || envUrl;

if (!dbUrl) {
  console.error('Error: Provide DATABASE_URL as env or pass Postgres connection string as first argument.');
  console.error('Example: node apply_supabase_schema.js postgresql://user:pass@localhost:5432/mydb');
  process.exit(2);
}

(async () => {
  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    console.log('Connected to DB. Running schema...');

    // Ensure pgcrypto extension (for gen_random_uuid)
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
      console.log('Ensured pgcrypto extension exists.');
    } catch (e) {
      console.warn('Warning: Could not create pgcrypto extension (may require superuser).', e.message);
    }

    await client.query('BEGIN;');
    await client.query(sql);
    await client.query('COMMIT;');
    console.log('Schema applied successfully.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to apply schema:', err.message || err);
    process.exit(1);
  }
})();
