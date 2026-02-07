#!/usr/bin/env node
/**
 * BuildMyIdea MVP - Main Server
 */

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Import models and initialize database
import { initDatabase } from './server/models/database.js';
const db = initDatabase();

// Import routes
import { ideaRoutes, stripeRoutes, adminRoutes, userRoutes } from './server/routes/index.js';

// Get file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'buildmyidea-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// API Routes
app.use('/api/ideas', ideaRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'public', 'index.html'));
});

app.get('/submit', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'public', 'submit.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'admin', 'index.html'));
});

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'public', 'success.html'));
});

app.get('/winner/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'public', 'winner.html'));
});

app.get('/demos', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'public', 'demos.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.status(404).sendFile(path.join(__dirname, 'templates', 'public', '404.html'));
  }
});

// Start server
app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║         BuildMyIdea MVP - Server Started            ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💳 Stripe Mode: ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? 'Test/Sandbox' : 'Production'}`);
  console.log('');
  console.log('📄 Pages:');
  console.log(`   - Landing:      http://localhost:${PORT}/`);
  console.log(`   - Submit:       http://localhost:${PORT}/submit`);
  console.log(`   - Dashboard:    http://localhost:${PORT}/dashboard`);
  console.log(`   - Admin:        http://localhost:${PORT}/admin`);
  console.log(`   - Demos:        http://localhost:${PORT}/demos`);
  console.log('');
  console.log('🔌 API Endpoints:');
  console.log(`   - Ideas:        http://localhost:${PORT}/api/ideas`);
  console.log(`   - Stripe:       http://localhost:${PORT}/api/stripe`);
  console.log(`   - Admin:        http://localhost:${PORT}/api/admin`);
  console.log(`   - Users:        http://localhost:${PORT}/api/users`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});
