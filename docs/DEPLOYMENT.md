# BuildMyIdea Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Git installed
- Stripe account (test mode)
- Hosting account (Vercel/Railway/Render/VPS)

---

## Environment Variables

Required environment variables:

```env
# Server
NODE_ENV=production
PORT=3000

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx

# Session
SESSION_SECRET=your-random-secret-key

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password-here

# Site
SITE_URL=https://your-domain.com
SITE_NAME=BuildMyIdea
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Prepare for deployment:**
   ```bash
   npm run build
   npm run deploy vercel
   ```

2. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

3. **Deploy:**
   ```bash
   vercel login
   vercel
   ```

4. **Add environment variables in Vercel Dashboard:**
   - Go to project settings → Environment Variables
   - Add all required variables from above

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

6. **Set up Stripe webhook:**
   - Add webhook URL: `https://your-site.vercel.app/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy webhook secret to environment variables

---

### Option 2: Railway

1. **Prepare for deployment:**
   ```bash
   npm run build
   npm run deploy railway
   ```

2. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

3. **Deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

4. **Add environment variables in Railway Dashboard:**
   - Click project → Variables
   - Add all required variables

5. **Set up Stripe webhook:**
   - Add webhook URL: `https://your-app.railway.app/webhooks/stripe`
   - Configure webhook events

---

### Option 3: Render

1. **Prepare for deployment:**
   ```bash
   npm run build
   npm run deploy render
   ```

2. **Push code to GitHub**

3. **Create Web Service on Render:**
   - Go to render.com → New → Web Service
   - Connect your GitHub repository
   - Add environment variables
   - Deploy

4. **Set up Stripe webhook:**
   - Add webhook URL: `https://your-app.onrender.com/webhooks/stripe`

---

### Option 4: VPS / Dedicated Server

1. **Connect to server:**
   ```bash
   ssh user@your-server.com
   ```

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone repository:**
   ```bash
   git clone https://github.com/mememan-anon/BuildMyIdea-MVP.git
   cd BuildMyIdea-MVP
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env  # Add your variables
   ```

6. **Initialize database:**
   ```bash
   npm run migrate
   npm run seed  # Optional
   ```

7. **Install PM2:**
   ```bash
   npm i -g pm2
   ```

8. **Start application:**
   ```bash
   pm2 start server.js --name buildmyidea
   pm2 save
   pm2 startup
   ```

9. **Configure Nginx:**
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/buildmyidea
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/buildmyidea /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Set up SSL with Let's Encrypt:**
    ```bash
    sudo apt-get install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

11. **Set up Stripe webhook:**
    - Add webhook URL: `https://your-domain.com/webhooks/stripe`

---

## Stripe Setup

### 1. Create a Product

1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Configure:
   - Name: "Idea Submission"
   - Description: "Submit your idea for $1"
4. Add price:
   - Amount: $1.00
   - Currency: USD
   - Billing: One-time
5. Copy the **Price ID** to your environment variables

### 2. Set Up Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://your-domain.com/webhooks/stripe`
4. Select events to send:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - (Optional) `payment_intent.payment_failed`
5. Click "Add endpoint"
6. Copy the **Webhook Secret** to your environment variables

---

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database initialized (`npm run migrate`)
- [ ] Admin user created with secure password
- [ ] Stripe webhook endpoint configured and tested
- [ ] HTTPS/SSL enabled
- [ ] Custom domain configured (if applicable)
- [ ] DNS records updated
- [ ] Test payment flow in test mode
- [ ] Monitor logs for errors
- [ ] Set up monitoring/alerting (optional)

---

## Monitoring

### View Application Logs

**Vercel:**
```bash
vercel logs
```

**Railway:**
```bash
railway logs
```

**Render:**
View logs in Render Dashboard

**PM2 (VPS):**
```bash
pm2 logs buildmyidea
pm2 monit
```

---

## Updating the Application

1. Pull latest changes:
   ```bash
   git pull origin main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Restart application:
   ```bash
   pm2 restart buildmyidea  # VPS
   # Or your platform's restart method
   ```

---

## Troubleshooting

### Stripe webhook not working

1. Verify webhook secret matches
2. Check webhook endpoint is accessible: `curl https://your-domain.com/health`
3. Review Stripe webhook delivery logs

### Database issues

1. Check DB_PATH environment variable
2. Ensure database directory is writable
3. Re-run migration: `npm run migrate`

### Payment not completing

1. Verify Stripe keys are correct
2. Check Price ID exists and is active
3. Review Stripe Dashboard for payment events

### 502 Bad Gateway

1. Check if server is running
2. Verify PORT is correct
3. Review application logs

---

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use strong, unique passwords** for admin account
3. **Enable HTTPS** in production
4. **Set up firewall rules** (VPS)
5. **Regular updates** - Keep dependencies updated
6. **Monitor for suspicious activity** - Review Stripe logs
7. **Rate limiting** - Implement API rate limiting in production
8. **Input validation** - Validate all user inputs

---

## Scaling Considerations

For higher traffic:
- Use a managed database (PostgreSQL, MySQL) instead of SQLite
- Implement Redis for session storage and caching
- Use a CDN for static assets
- Set up load balancing
- Implement proper logging (Sentry, LogRocket)
- Add API rate limiting
- Implement background job processing for queue

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/mememan-anon/BuildMyIdea-MVP/issues
- Email: support@buildmyidea.com (in production)
