#!/usr/bin/env node
/**
 * Database Seeding Script
 * Populates the database with sample data for testing
 */

import dotenv from 'dotenv';
import { initDatabase, UserModel, IdeaModel, WinnerModel } from '../server/models/database.js';

// Load environment variables
dotenv.config();

console.log('🌱 Seeding database with sample data...\n');

// Initialize database
const db = initDatabase();

const sampleIdeas = [
  {
    email: 'user1@example.com',
    title: 'AI Recipe Finder',
    description: 'An AI-powered recipe finder that suggests meals based on ingredients you have at home. Users can input available ingredients, dietary restrictions, and cuisine preferences. The system uses GPT to generate unique recipes with step-by-step instructions.',
    category: 'ai'
  },
  {
    email: 'user2@example.com',
    title: 'Plant Care Companion',
    description: 'A mobile app that helps users track and care for their plants. Features include watering schedules, sunlight requirements, fertilizer reminders, and plant identification using image recognition. Users can also connect with a community of plant enthusiasts.',
    category: 'mobile'
  },
  {
    email: 'user3@example.com',
    title: 'Freelance Invoice Generator',
    description: 'A web app for freelancers to create professional invoices quickly. Includes templates, automatic calculations, payment tracking, and the ability to send invoices directly to clients. Supports multiple currencies and tax rates.',
    category: 'productivity'
  },
  {
    email: 'user4@example.com',
    title: 'Book Club Social',
    description: 'A social platform for book clubs. Users can create or join book clubs, schedule meetings, vote on book selections, and discuss chapters. Features include reading progress tracking, recommended reads based on preferences, and virtual meeting integration.',
    category: 'social'
  },
  {
    email: 'user5@example.com',
    title: 'Habit Tracker with AI Coach',
    description: 'A smart habit tracking app that uses AI to provide personalized coaching. Users set habits they want to build, and the app analyzes patterns, suggests optimal times, provides motivation, and adapts recommendations based on success rates.',
    category: 'productivity'
  }
];

async function seed() {
  try {
    let usersCreated = 0;
    let ideasCreated = 0;
    let winnersCreated = 0;

    for (const sample of sampleIdeas) {
      // Create user
      const { email } = sample;
      let user = UserModel.findByEmail(email);
      
      if (!user) {
        user = UserModel.create(email, crypto.createHash('sha256').update(email).digest('hex'));
        usersCreated++;
      }

      // Create idea
      const idea = IdeaModel.create(
        user.id,
        sample.title,
        sample.description,
        sample.category,
        `pi_test_${Date.now()}`,
        `cus_test_${Date.now()}`
      );
      IdeaModel.updateStatus(idea.id, 'paid');
      ideasCreated++;

      // Randomly select some as winners
      if (Math.random() > 0.6) {
        const winner = WinnerModel.create(idea.id);
        winnersCreated++;
        
        // Randomly mark some as completed
        if (Math.random() > 0.5) {
          WinnerModel.updateBuildStatus(
            winner.id,
            Math.floor(Date.now() / 1000) - 86400 * 7, // 7 days ago
            Math.floor(Date.now() / 1000),
            'https://demo.example.com',
            'https://github.com/example/demo',
            'completed'
          );
        }
      }
    }

    console.log('✅ Seeding complete!');
    console.log(`   Users created: ${usersCreated}`);
    console.log(`   Ideas created: ${ideasCreated}`);
    console.log(`   Winners created: ${winnersCreated}\n`);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();
