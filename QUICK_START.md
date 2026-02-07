# BuildMyIdea MVP - Quick Start Guide

Get BuildMyIdea up and running in 5 minutes.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Stripe account (free test account works)

## Step 1: Install Dependencies

```bash
cd /home/node/.openclaw/workspace-main/buildmyidea-mvp
npm install
```

## Step 2: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Test Secret Key** (starts with `sk_test_`)
3. Copy your **Test Publishable Key** (starts with `pk_test_`)

## Step 3: Create a Stripe Product

1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Fill in:
   - Name: `Idea Submission`
   - Description: `Submit your idea for $1`
   - Price: `$1.00` (one-time payment)
4. Click "Save product"
5. Copy the **Price ID** (starts with `price_`)

## Step 4: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your favorite editor
nano .env
```

Update these values in `.env`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE

# Admin credentials
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=your_secure_password_here
```

## Step 5: Initialize Database

```bash
npm run migrate
```

You should see:
```
✅ Database schema initialized
✅ Default admin user created
```

## Step 6: Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Step 7: Visit the Site

Open http://localhost:3000 in your browser.

## Step 8: Test the Flow

### Submit an Idea
1. Click "Submit Idea"
2. Fill in the form
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete payment
5. See success page

### Access Admin Panel
1. Go to http://localhost:3000/admin
2. Login with your admin credentials
3. View queue, select winners, manage builds

### View Dashboard
1. Go to http://localhost:3000/dashboard
2. See your submitted ideas
3. Track their status

## Setting up Webhooks (Optional for Local Testing)

For local testing, you can use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Copy the webhook signing secret and add it to `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| PORT | No | Server port | `3000` |
| NODE_ENV | No | Environment | `development` |
| STRIPE_SECRET_KEY | Yes | Stripe secret key | `sk_test_...` |
| STRIPE_PUBLISHABLE_KEY | Yes | Stripe publishable key | `pk_test_...` |
| STRIPE_WEBHOOK_SECRET | Recommended | Webhook secret | `whsec_...` |
| STRIPE_PRICE_ID | Yes | Price ID for $1 product | `price_...` |
| SESSION_SECRET | Yes | Session encryption key | Random string |
| ADMIN_EMAIL | Yes | Admin email | `admin@example.com` |
| ADMIN_PASSWORD | Yes | Admin password | Secure password |

## Troubleshooting

### Stripe Test Cards

Use these cards for testing:

| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |

### Database Issues

If you encounter database errors:
```bash
# Remove existing database
rm -f database/bmi.db

# Re-run migration
npm run migrate
```

### Port Already in Use

Change the port in `.env`:
```bash
PORT=3001
```

## Next Steps

- [ ] Add your own branding and customization
- [ ] Configure production Stripe keys
- [ ] Set up webhook endpoint for production
- [ ] Deploy to Vercel, Railway, or your own server
- [ ] Add email notifications for winners
- [ ] Implement real AI build integration

## Support

For issues or questions:
- Check the main [README.md](README.md)
- Review the code in `server/` and `templates/`
- Check Stripe documentation: https://stripe.com/docs

Happy building! 🚀
