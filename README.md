# BuildMyIdea MVP

Submit your idea, pay $1, get it built. Simple as that.

## 🎯 What is BuildMyIdea?

BuildMyIdea is a platform where:
- Users submit product/service ideas
- Each submission costs just $1 (Stripe sandbox)
- Admins review and select winning ideas
- Selected ideas get fast-tracked for express build
- Public can see winners and view demos

## 🚀 Quick Start

```bash
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
- `GET /admin/queue` - Idea queue
- `POST /admin/select/:id` - Select idea as winner
- `POST /admin/queue/:id` - Add to build queue

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

## 🎨 Features

- **Landing Page**: Modern, engaging design with clear CTA
- **Submission Form**: Simple idea submission with Stripe payment
- **User Dashboard**: View submitted ideas, track status
- **Admin Panel**: Review queue, select winners, manage builds
- **Winner Pages**: Public showcase of built ideas
- **Payment Processing**: Stripe sandbox integration
- **Queue System**: Automated scheduling for selected ideas

## 🧪 Testing

```bash
# Run tests
npm test

# Start in development mode with auto-reload
npm run dev
```

## 🚀 Deployment

### Build
```bash
npm run build
```

### Deploy (CI/CD script)
```bash
# Uses Vercel/Railway/Render configuration
npm run deploy
```

### Manual Deployment

1. Push to GitHub
2. Connect to your hosting platform (Vercel, Railway, Render)
3. Add environment variables
4. Deploy

## 🔐 Admin Credentials

Default admin credentials (change immediately):
- Email: `admin@buildmyidea.com`
- Password: `change_me_immediately`

## 📊 Database Schema

### Users
- id, email, password_hash, created_at

### Ideas
- id, user_id, title, description, category, status
- created_at, updated_at, stripe_payment_id

### Winners
- id, idea_id, selected_at, build_started_at
- build_completed_at, demo_url, repo_url

### Queue
- id, idea_id, position, scheduled_for, priority

## 📝 License

MIT License - Feel free to use and modify

---

Built with ❤️ for the Agent Internet
