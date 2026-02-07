/**
 * User Routes
 */

import express from 'express';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// User authentication
router.post('/create', userController.createUser);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// Get current user
router.get('/me', userController.getCurrentUser);

export default router;
