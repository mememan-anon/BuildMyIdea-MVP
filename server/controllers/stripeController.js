/**
 * Stripe Payment Controller
 */

import Stripe from 'stripe';
import { IdeaModel } from '../models/database.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe checkout session for idea submission
 */
export async function createCheckoutSession(req, res) {
  try {
    const { title, description, category, email, userId, bid_amount = 1, is_priority = false, is_stealth = false } = req.body;

    // Validate input
    if (!title || !description || !email) {
      return res.status(400).json({
        error: 'Missing required fields: title, description, email'
      });
    }

    // Create or retrieve Stripe customer
    let customer;
    try {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        customer = await stripe.customers.create({
          email,
          metadata: {
            userId: userId || 'guest'
          }
        });
      }
    } catch (err) {
      console.error('Error creating Stripe customer:', err);
      return res.status(500).json({ error: 'Failed to create customer' });
    }

    // Get or create Stripe price based on bid amount
    let priceId = process.env.STRIPE_PRICE_ID; // Default $1 price

    // For MVP, use the configured price ID for all bids
    // In production, you'd create different price objects for different amounts
    const basePriceId = process.env.STRIPE_PRICE_ID;
    if (!basePriceId) {
      return res.status(500).json({ error: 'Stripe Price ID not configured' });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: basePriceId,
          quantity: bid_amount || 1, // Use bid_amount as quantity for MVP
          description: `Idea Submission${is_priority ? ' (Priority Build)' : ''}`,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/submit?cancelled=true`,
      metadata: {
        title,
        description,
        category: category || 'general',
        email,
        userId: userId || 'guest',
        bid_amount: bid_amount?.toString() || '1',
        is_priority: is_priority.toString(),
        is_stealth: is_stealth.toString()
      },
      customer_email: email,
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`📬 Received webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log(`✅ Payment succeeded for ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log(`❌ Payment failed: ${paymentIntent.last_payment_error?.message}`);
        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Process completed checkout session
 */
async function handleCheckoutCompleted(session) {
  const metadata = session.metadata;
  const userId = metadata.userId === 'guest' ? createGuestUser(metadata.email) : metadata.userId;

  const isPriority = metadata.is_priority === 'true';
  const isStealth = metadata.is_stealth === 'true';
  const bidAmount = parseInt(metadata.bid_amount) || 1;

  // Create the idea
  const idea = IdeaModel.create(
    userId,
    metadata.title,
    metadata.description,
    metadata.category,
    session.payment_intent,
    session.customer
  );

  // Set initial status
  let status = 'paid';
  if (isPriority) {
    status = 'priority';
  } else if (isStealth) {
    status = 'stealth';
  }

  IdeaModel.updateStatus(idea.id, status);

  console.log(`✅ Idea created: ${idea.id} for user ${userId}`);
  console.log(`   Title: ${metadata.title}`);
  console.log(`   Bid: $${bidAmount}${isPriority ? ' (Priority)' : ''}${isStealth ? ' (Stealth)' : ''}`);
  console.log(`   Payment: ${session.payment_intent}`);
  console.log(`   Amount: ${session.amount_total / 100} ${session.currency.toUpperCase()}`);

  return idea;
}

/**
 * Create a guest user (simplified - in production, you'd send a password reset email)
 */
function createGuestUser(email) {
  // For MVP, create a simple user with a placeholder password
  // In production, send email to set password
  const crypto = require('crypto');
  const passwordHash = crypto.createHash('sha256').update(email + Date.now()).digest('hex');

  const { UserModel } = require('../models/database.js');
  const user = UserModel.create(email, passwordHash);

  return user.id;
}

/**
 * Get session details
 */
export async function getSessionDetails(req, res) {
  try {
    const { session_id } = req.params;

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      session: {
        id: session.id,
        payment_status: session.payment_status,
        metadata: session.metadata,
        customer_email: session.customer_email,
        amount_total: session.amount_total,
      }
    });

  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
}
