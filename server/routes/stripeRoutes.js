/**
 * Stripe Routes
 */

import express from 'express';
import * as stripeController from '../controllers/stripeController.js';

const router = express.Router();

// Create checkout session
router.post('/checkout', stripeController.createCheckoutSession);

// Get session details
router.get('/session/:session_id', stripeController.getSessionDetails);

// Webhook endpoint (must be before body parser for raw body)
router.post('/webhook', stripeController.handleWebhook);

export default router;
