/**
 * Admin Controller
 */

import crypto from 'crypto';
import { UserModel } from '../models/database.js';

/**
 * Admin login
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
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.password_hash !== passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_admin) {
      return res.status(403).json({ error: 'Not authorized as admin' });
    }

    // Set session
    req.session.adminId = user.id;
    req.session.adminEmail = user.email;

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
 * Admin logout
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
 * Check admin status
 */
export async function checkAdmin(req, res) {
  try {
    if (req.session.adminId) {
      const user = UserModel.findById(req.session.adminId);
      res.json({
        isAdmin: true,
        user: {
          id: user.id,
          email: user.email
        }
      });
    } else {
      res.json({ isAdmin: false });
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ error: 'Failed to check admin status' });
  }
}

/**
 * Get dashboard stats
 */
export async function getDashboardStats(req, res) {
  try {
    const { IdeaModel, WinnerModel, QueueModel, UserModel } = await import('../models/database.js');

    const totalUsers = UserModel.getAll().length;
    const totalIdeas = IdeaModel.getAll().length;
    const totalWinners = WinnerModel.getAll().length;
    const queueCount = QueueModel.getAll().length;
    
    const pendingIdeas = IdeaModel.getByStatus('paid').length;
    const queuedIdeas = IdeaModel.getByStatus('queued').length;

    res.json({
      totalUsers,
      totalIdeas,
      totalWinners,
      queueCount,
      pendingIdeas,
      queuedIdeas
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}
