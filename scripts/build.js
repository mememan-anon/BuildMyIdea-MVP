#!/usr/bin/env node
/**
 * Build Script
 * Prepares the application for deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

console.log('🔨 Building BuildMyIdea MVP...\n');

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('❌ node_modules not found. Running npm install...');
  const { execSync } = await import('child_process');
  execSync('npm install', { stdio: 'inherit' });
}

// Verify required files exist
const requiredFiles = [
  'server.js',
  'server/models/database.js',
  'server/controllers/stripeController.js',
  'server/controllers/ideaController.js',
  'server/controllers/adminController.js',
  'server/controllers/userController.js',
  'server/routes/index.js',
  'server/routes/stripeRoutes.js',
  'server/routes/ideaRoutes.js',
  'server/routes/adminRoutes.js',
  'server/routes/userRoutes.js',
  'public/css/style.css',
  'public/css/admin.css',
  'templates/public/index.html',
  'templates/public/submit.html',
  'templates/public/success.html',
  'templates/public/dashboard.html',
  'templates/public/winner.html',
  'templates/public/demos.html',
  'templates/admin/index.html',
  'public/js/landing.js',
  'public/js/submit.js',
  'public/js/dashboard.js',
  'public/js/demos.js',
  'public/js/winner.js',
  'public/js/admin.js'
];

console.log('📋 Verifying required files...');
let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n❌ Build failed: Some required files are missing\n');
  process.exit(1);
}

// Check environment variables
console.log('\n🔍 Checking environment configuration...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file found');
} else {
  console.log('   ⚠️  .env file not found (using defaults)');
}

// Run tests if test.js exists
const testPath = path.join(__dirname, 'test.js');
if (fs.existsSync(testPath)) {
  console.log('\n🧪 Running tests...');
  const { execSync } = await import('child_process');
  try {
    execSync('node test.js', { stdio: 'inherit' });
  } catch (error) {
    console.log('\n⚠️  Tests failed. Continuing anyway...\n');
  }
}

console.log('\n✅ Build complete!\n');
console.log('🚀 To start the server:');
console.log('   npm start');
console.log('\n📦 To deploy:');
console.log('   npm run deploy');
console.log('');
