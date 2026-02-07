/**
 * User Controller
 */

import crypto from 'crypto';
import { UserModel } from '../models/database.js';

/**
 * Create user account
 */
export async function createUser(req, res) {
  try {
    const { email, password, isAdmin = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Check if user already exists
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Create user
    const user = UserModel.create(email, passwordHash, isAdmin);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        is_admin: !!user.is_admin
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

/**
 * User login
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Hash password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Find user
    const user = UserModel.findByEmail(email);
    
    if (!user || user.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        is_admin: !!user.is_admin
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * User logout
 */
export async function logout(req, res) {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(req, res) {
  try {
    if (req.session.userId) {
      const user = UserModel.findById(req.session.userId);
      res.json({
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email,
          is_admin: !!user.is_admin
        }
      });
    } else {
      res.json({ isAuthenticated: false });
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
}
