# BuildMyIdea MVP - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- Stripe account (test mode)

### Step 1: Clone and Install

```bash
git clone https://github.com/mememan-anon/BuildMyIdea-MVP.git
cd BuildMyIdea-MVP
npm install
```

### Step 2: Configure Stripe

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_`)
3. Copy your **Publishable key** (starts with `pk_test_`)

### Step 3: Create a $1 Product

1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Name: `Idea Submission`
4. Price: `$1.00 USD` (One-time)
5. Copy the **Price ID** (starts with `price_`)

### Step 4: Set Up Environment

```bash
cp .env.example .env
nano .env  # Edit with your values
```

Add these values:
```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_PRICE_ID=price_xxx
SESSION_SECRET=any-random-string-here
```

### Step 5: Initialize Database

```bash
npm run migrate
```

This creates the database and default admin user:
- **Email:** `admin@buildmyidea.com`
- **Password:** `change_me_immediately`

### Step 6: Start Server

```bash
npm start
```

Visit: http://localhost:3000

### Step 7: Test the Flow

1. **Submit an idea** - Go to /submit and fill out the form
2. **Pay $1** - Use Stripe test card: `4242 4242 4242 4242` (any future date, any CVC)
3. **Check admin panel** - Go to /admin and login
4. **Select winner** - Mark idea as winner or add to queue

## 📱 Pages

- **Landing:** http://localhost:3000/
- **Submit:** http://localhost:3000/submit
- **Dashboard:** http://localhost:3000/dashboard
- **Admin:** http://localhost:3000/admin
- **Demos:** http://localhost:3000/demos

## 🧪 Add Sample Data

```bash
npm run seed
```

This adds 5 sample ideas and random winners for testing.

## 🔧 Development Mode

Auto-reload on changes:
```bash
npm run dev
```

## 📦 Deploy

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Railway
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Manual/VPS
See `docs/DEPLOYMENT.md` for detailed instructions.

## ❓ Troubleshooting

### Stripe webhook errors
- Make sure webhook endpoint is accessible: `curl http://localhost:3000/health`
- Verify webhook secret matches Stripe dashboard

### Database errors
- Delete database file: `rm database/bmi.db`
- Re-run: `npm run migrate`

### Port 3000 already in use
- Change port in `.env`: `PORT=3001`
- Or kill the process using port 3000

## 📚 Documentation

- **API Docs:** `docs/API.md`
- **Deployment:** `docs/DEPLOYMENT.md`
- **Project Summary:** `PROJECT_SUMMARY.md`

## 🆘 Need Help?

- GitHub Issues: https://github.com/mememan-anon/BuildMyIdea-MVP/issues
- Check logs: View terminal output for error messages

---

**Happy Building! 🚀**
