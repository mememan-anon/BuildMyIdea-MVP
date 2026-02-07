/**
 * Admin Routes
 */

import express from 'express';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Admin authentication
router.post('/login', adminController.login);
router.post('/logout', adminController.logout);
router.get('/check', adminController.checkAdmin);

// Admin dashboard
router.get('/stats', adminController.getDashboardStats);

export default router;
