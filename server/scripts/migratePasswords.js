#!/usr/bin/env node
/**
 * Password Migration Script
 * Migrates existing passwords from SHA-256 to bcrypt
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserModel } from '../models/database.js';
import { BCRYPT_ROUNDS } from '../config/passwordConfig.js';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * Check if a password hash is SHA-256 (64 hex characters)
 */
function isSha256Hash(hash) {
  return /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Migrate a single user's password
 */
async function migrateUserPassword(user) {
  try {
    // Skip if already using bcrypt (bcrypt hashes start with $2b$ or $2a$)
    if (!isSha256Hash(user.password_hash)) {
      console.log(`  ✓ User ${user.email}: Already using bcrypt`);
      return false;
    }
    
    // For SHA-256 passwords, we can't reverse them to get the original password
    // We need to:
    // 1. Ask users to reset their password
    // 2. Or have them re-authenticate with old hash and then update
    
    console.log(`  ⚠ User ${user.email}: Needs password reset (SHA-256 detected)`);
    
    // Mark user for password reset
    // You could add a column like password_reset_required to the users table
    
    return true;
  } catch (error) {
    console.error(`  ✗ Error migrating user ${user.email}:`, error.message);
    return false;
  }
}

/**
 * Main migration function
 */
export async function migratePasswords(dryRun = true) {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║       Password Migration: SHA-256 → Bcrypt              ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE MIGRATION'}`);
  console.log(`Bcrypt rounds: ${BCRYPT_ROUNDS}`);
  console.log('');
  
  // Get all users
  const users = UserModel.getAll();
  console.log(`Found ${users.length} users`);
  console.log('');
  
  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  // Migrate each user
  for (const user of users) {
    console.log(`Processing: ${user.email}`);
    
    try {
      const needsMigration = await migrateUserPassword(user);
      
      if (needsMigration) {
        migratedCount++;
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.error(`  ✗ Error:`, error.message);
      errorCount++;
    }
    
    console.log('');
  }
  
  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('Summary:');
  console.log(`  Total users:     ${users.length}`);
  console.log(`  Need migration:  ${migratedCount}`);
  console.log(`  Already bcrypt:  ${skippedCount}`);
  console.log(`  Errors:          ${errorCount}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  if (migratedCount > 0 && !dryRun) {
    console.log('⚠ Users with SHA-256 passwords need to reset their passwords.');
    console.log('Consider sending password reset emails to affected users.');
  }
  
  return {
    total: users.length,
    migrated: migratedCount,
    skipped: skippedCount,
    errors: errorCount
  };
}

/**
 * Run migration if executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = !process.argv.includes('--live');
  migratePasswords(dryRun)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default migratePasswords;
