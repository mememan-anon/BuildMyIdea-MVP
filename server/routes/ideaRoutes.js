/**
 * Idea Routes
 */

import express from 'express';
import * as ideaController from '../controllers/ideaController.js';

const router = express.Router();

// Public routes
router.get('/winner/:id', ideaController.getWinner);
router.get('/winners', ideaController.getWinners);

// User routes (would require auth in production)
router.get('/user/:userId', ideaController.getUserIdeas);
router.get('/:id', ideaController.getIdea);

// Admin routes (would require admin auth in production)
router.get('/', ideaController.getAllIdeas);
router.post('/', ideaController.submitIdea);
router.put('/:id/status', ideaController.updateIdeaStatus);
router.post('/:id/winner', ideaController.selectWinner);
router.post('/:id/queue', ideaController.addToQueue);
router.delete('/:id/queue', ideaController.removeFromQueue);
router.get('/queue/all', ideaController.getQueue);
router.get('/queue/next', ideaController.getNextInQueue);
router.put('/winner/:id/build', ideaController.updateWinnerBuild);

export default router;
