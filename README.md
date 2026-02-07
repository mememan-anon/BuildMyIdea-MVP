# BuildMyIdea MVP

Submit your idea, pay $1, get it built. Simple as that.

## 🎯 What is BuildMyIdea?

BuildMyIdea is a platform where:
- Users submit product/service ideas with bids ($1 minimum)
- $500+ bids skip the queue as Priority Builds
- Every night at 10PM CST, one idea from the queue is selected
- Selected ideas are fast-tracked for AI-powered development
- Public can see winners and view completed demos

## 🚀 Quick Start

```bash
# Clone or navigate to the project
cd /home/node/.openclaw/workspace-main/buildmyidea-mvp

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add your Stripe keys
# Get keys from: https://dashboard.stripe.com/test/apikeys

# Create a $1 Price ID in Stripe
# Product: "Idea Submission"
# Price: $1.00 USD (one-time)
# Copy the Price ID to STRIPE_PRICE_ID in .env

# Initialize database
npm run migrate

# (Optional) Seed with sample data
npm run seed

# Start server
npm start
```

Visit http://localhost:3000 to see the site.

## 📁 Project Structure

```
buildmyidea-mvp/
├── server/
│   ├── controllers/    # Request handlers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   └── middleware/    # Express middleware
├── public/            # Static assets
│   ├── css/          # Stylesheets
│   ├── js/           # Client-side scripts
│   └── images/       # Images
├── templates/         # HTML templates
│   ├── public/       # Public-facing pages
│   └── admin/        # Admin pages
├── scripts/           # Utility scripts
└── database/          # SQLite database (generated)
```

## 🛠️ API Endpoints

### Public
- `GET /` - Landing page
- `GET /submit` - Submission form
- `POST /api/submit` - Submit idea (creates Stripe checkout)
- `GET /dashboard` - User dashboard
- `GET /winner/:id` - Public winner page
- `GET /demos` - All demos page

### Admin
- `GET /admin` - Admin panel
- `POST /admin/login` - Admin login
- `GET /admin/stats` - Dashboard stats
- `GET /api/ideas` - All ideas
- `POST /api/ideas/:id/winner` - Select idea as winner
- `POST /api/ideas/:id/queue` - Add to build queue
- `DELETE /api/ideas/:id/queue` - Remove from queue
- `PUT /api/ideas/winner/:id/build` - Update winner build status

### Webhooks
- `POST /webhooks/stripe` - Stripe payment webhook

## 💳 Stripe Setup

### Creating the $1 Product

1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Name: "Idea Submission"
4. Description: "Submit your idea for $1"
5. Pricing:
   - Amount: $1.00
   - Currency: USD
   - Billing: One-time
6. Copy the Price ID to `STRIPE_PRICE_ID` in `.env`

### Setting up Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-site.com/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` in `.env`

## 🔐 Environment Variables

Create a `.env` file with the following:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Stripe Configuration (Sandbox/Test Mode)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price ID for $1 submission
STRIPE_PRICE_ID=price_your_price_id_here

# Session Secret
SESSION_SECRET=your-random-session-secret-here

# Database
DB_PATH=./database/bmi.db

# Site Configuration
SITE_URL=http://localhost:3000
SITE_NAME=BuildMyIdea
IDEA_PRICE=100
IDEA_PRICE_DISPLAY="$1"

# Admin Settings
ADMIN_EMAIL=admin@buildmyidea.com
ADMIN_PASSWORD=change_me_immediately
```

## 🎨 Features

- **Landing Page**: Dark theme matching original BuildMyIdea.com with countdown timer
- **Submission Form**: Supports stealth mode and priority build ($500+)
- **Queue System**: Live queue display showing pending submissions
- **User Dashboard**: Track submitted ideas, view status
- **Admin Panel**: Review queue, select winners, manage builds
- **Winner Pages**: Public showcase of built ideas
- **Payment Processing**: Stripe sandbox integration
- **Daily Selection**: Countdown to 10PM CST selection
- **Status Tracking**: Pending, Paid, Queued, Winner, Building, Completed
- **Stealth Mode**: Keep submissions private
- **Priority Build**: Skip queue with $500+ bid

## 🧪 Testing

```bash
# Run unit tests
npm test

# Start in development mode with auto-reload
npm run dev
```

Test coverage includes:
- User model operations
- Idea model operations
- Winner model operations
- Queue model operations
- Stripe webhook handling

## 🚀 Deployment

### Quick Deploy with Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
npm run deploy vercel

# Set environment variables in Vercel dashboard:
# - STRIPE_SECRET_KEY
# - STRIPE_PUBLISHABLE_KEY
# - STRIPE_WEBHOOK_SECRET
# - STRIPE_PRICE_ID
# - SESSION_SECRET
# - ADMIN_EMAIL
# - ADMIN_PASSWORD
```

### Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
npm run deploy railway
```

### Deploy to Render

```bash
# Build Docker image
npm run build

# Deploy via Render dashboard or CLI
npm run deploy render
```

### Manual Deployment

1. Push to GitHub
2. Set up a VPS (DigitalOcean, AWS, etc.)
3. Install Node.js 18+
4. Clone the repository
5. Run: `npm install`
6. Copy `.env.example` to `.env` and configure
7. Run: `npm run migrate`
8. Set up process manager: `pm2 start server.js --name buildmyidea`
9. Set up reverse proxy (Nginx)
10. Configure SSL (Let's Encrypt)
11. Set up Stripe webhook endpoint

## 🔐 Admin Credentials

Default admin credentials (change immediately):
- Email: `admin@buildmyidea.com`
- Password: `admin123`

To change password, edit `.env` and re-run migration, or use a secure method in production.

## 📊 Database Schema

### Users
- id, email, password_hash, created_at, is_admin

### Ideas
- id, user_id, title, description, category, status
- created_at, updated_at, stripe_payment_id, stripe_customer_id
- Status: pending, paid, priority, stealth, queued, winner

### Winners
- id, idea_id, selected_at, build_started_at
- build_completed_at, demo_url, repo_url, status
- Status: selected, building, completed

### Queue
- id, idea_id, position, scheduled_for, priority, created_at

## 🔄 Daily Selection Process

1. Every night at 10PM CST, the system selects one idea from the queue
2. Selected ideas are marked as winners
3. Winners are added to the build queue
4. Development begins and takes approximately 7 days
5. Completed demos are published on the site

Priority builds ($500+) skip the nightly selection and are queued immediately.

## 📝 License

MIT License - Feel free to use and modify

---

Built with ❤️ for the Agent Internet
