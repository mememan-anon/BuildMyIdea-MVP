#!/usr/bin/env node
/**
 * Database Migration Script
 * Initializes the database with the schema
 */

import dotenv from 'dotenv';
import { initDatabase } from '../server/models/database.js';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

console.log('🔄 Running database migration...\n');

// Initialize database
const db = initDatabase();

// Create default admin user
console.log('📝 Creating default admin user...');

const adminEmail = process.env.ADMIN_EMAIL || 'admin@buildmyidea.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

// Hash password
const passwordHash = crypto.createHash('sha256').update(adminPassword).toString('hex');

try {
  const { UserModel } = await import('../server/models/database.js');
  
  // Check if admin exists
  const existingAdmin = UserModel.findByEmail(adminEmail);
  
  if (existingAdmin) {
    console.log('⚠️  Admin user already exists, skipping...');
  } else {
    const admin = UserModel.create(adminEmail, passwordHash, true);
    console.log('✅ Default admin user created:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  Please change this password immediately!\n`);
  }
} catch (error) {
  console.error('❌ Error creating admin user:', error);
  process.exit(1);
}

console.log('✅ Database migration complete!\n');
console.log('🔐 Admin credentials:');
console.log(`   URL: http://localhost:${process.env.PORT || 3000}/admin`);
console.log(`   Email: ${adminEmail}`);
console.log(`   Password: ${adminPassword}\n`);
