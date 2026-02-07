#!/usr/bin/env node
/**
 * Test Suite for BuildMyIdea MVP
 */

import dotenv from 'dotenv';
import { initDatabase, UserModel, IdeaModel, WinnerModel, QueueModel } from './server/models/database.js';

// Load environment variables
dotenv.config();

console.log('🧪 Running Tests for BuildMyIdea MVP\n');

let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Initialize database
console.log('📊 Initializing test database...\n');
process.env.DB_PATH = './test-bmi.db';
const db = initDatabase();

// User Model Tests
console.log('Testing UserModel...');
const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'test123';
const testUser = UserModel.create(testEmail, testPassword);

test('UserModel.create - creates user with valid data', () => {
  assert(testUser.id, 'User should have ID');
  assert(testUser.email === testEmail, 'User email should match');
  assert(testUser.password_hash, 'User should have password hash');
});

test('UserModel.findByEmail - finds user by email', () => {
  const found = UserModel.findByEmail(testEmail);
  assert(found.id === testUser.id, 'Found user should match created user');
});

test('UserModel.findById - finds user by ID', () => {
  const found = UserModel.findById(testUser.id);
  assert(found.email === testEmail, 'Found user email should match');
});

console.log('');

// Idea Model Tests
console.log('Testing IdeaModel...');
const testIdea = IdeaModel.create(
  testUser.id,
  'Test Idea',
  'This is a test idea',
  'general',
  'pi_test_123',
  'cus_test_123'
);

test('IdeaModel.create - creates idea with valid data', () => {
  assert(testIdea.id, 'Idea should have ID');
  assert(testIdea.user_id === testUser.id, 'Idea user ID should match');
  assert(testIdea.title === 'Test Idea', 'Idea title should match');
});

test('IdeaModel.updateStatus - updates idea status', () => {
  const updated = IdeaModel.updateStatus(testIdea.id, 'winner');
  assert(updated.status === 'winner', 'Idea status should be updated');
});

test('IdeaModel.findByUserId - finds ideas by user ID', () => {
  const ideas = IdeaModel.findByUserId(testUser.id);
  assert(ideas.length > 0, 'Should find at least one idea');
});

console.log('');

// Winner Model Tests
console.log('Testing WinnerModel...');
const testWinner = WinnerModel.create(testIdea.id);

test('WinnerModel.create - creates winner with valid data', () => {
  assert(testWinner.id, 'Winner should have ID');
  assert(testWinner.idea_id === testIdea.id, 'Winner idea ID should match');
});

test('WinnerModel.findByIdeaId - finds winner by idea ID', () => {
  const found = WinnerModel.findByIdeaId(testIdea.id);
  assert(found.id === testWinner.id, 'Found winner should match');
});

test('WinnerModel.updateBuildStatus - updates build status', () => {
  const updated = WinnerModel.updateBuildStatus(
    testWinner.id,
    Math.floor(Date.now() / 1000),
    Math.floor(Date.now() / 1000),
    'https://demo.example.com',
    'https://github.com/example',
    'completed'
  );
  assert(updated.status === 'completed', 'Winner status should be completed');
  assert(updated.demo_url === 'https://demo.example.com', 'Demo URL should match');
});

console.log('');

// Queue Model Tests
console.log('Testing QueueModel...');
const queueItem = QueueModel.add(testIdea.id, 5);

test('QueueModel.add - adds item to queue', () => {
  assert(queueItem.id, 'Queue item should have ID');
  assert(queueItem.idea_id === testIdea.id, 'Queue idea ID should match');
  assert(queueItem.position > 0, 'Queue position should be positive');
});

test('QueueModel.getAll - retrieves all queue items', () => {
  const queue = QueueModel.getAll();
  assert(queue.length > 0, 'Queue should have at least one item');
});

test('QueueModel.remove - removes item from queue', () => {
  QueueModel.remove(testIdea.id);
  const queue = QueueModel.getAll();
  assert(!queue.find(q => q.idea_id === testIdea.id), 'Item should be removed');
});

console.log('');

// API Endpoint Tests
console.log('Testing API Endpoints...');
// These would require starting the server, so we'll skip for now
console.log('⏭️  Skipping API endpoint tests (requires server running)\n');

// Cleanup
console.log('Cleaning up test data...');
db.close();

// Remove test database file
try {
  const fs = await import('fs');
  fs.unlinkSync('./test-bmi.db');
  console.log('✅ Test database removed\n');
} catch (error) {
  console.log('⚠️  Could not remove test database\n');
}

// Results
console.log('═══════════════════════════════════════');
console.log(`📊 Test Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log('═══════════════════════════════════════\n');

if (testsFailed > 0) {
  console.log('❌ Some tests failed. Please review and fix.\n');
  process.exit(1);
} else {
  console.log('✅ All tests passed!\n');
  process.exit(0);
}
