# BuildMyIdea - Deployment Guide

Complete guide for deploying BuildMyIdea to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variables](#environment-variables)
3. [Deployment Platforms](#deployment-platforms)
   - [Vercel](#vercel)
   - [Railway](#railway)
   - [Render](#render)
   - [VPS/DigitalOcean](#vpsdigitalocean)
4. [Stripe Production Setup](#stripe-production-setup)
5. [Domain Configuration](#domain-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests passing: `npm test`
- [ ] Environment variables configured
- [ ] Stripe production API keys ready
- [ ] Stripe webhook endpoint configured
- [ ] Admin password changed from default
- [ ] Database backup strategy in place
- [ ] SSL certificate ready
- [ ] Monitoring/alerting configured

## Environment Variables

Required for production:

```bash
# Server
NODE_ENV=production
PORT=3000

# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
STRIPE_PRICE_ID=price_YOUR_LIVE_PRICE_ID

# Security
SESSION_SECRET=long-random-string-min-32-chars

# Admin
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=secure-password-here

# Database
DB_PATH=./database/bmi.db

# Site
SITE_URL=https://your-domain.com
```

## Deployment Platforms

### Vercel

Vercel is the easiest option for serverless deployment.

#### Steps:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Generate Vercel config**
   ```bash
   npm run deploy vercel
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Add Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables from above

6. **Configure Stripe Webhook**
   - Webhook URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

#### Pros:
- Zero configuration
- Automatic SSL
- Global CDN
- Preview deployments

#### Cons:
- Serverless (may need adjustments for long-running tasks)
- Database file not persistent (use external DB)

### Railway

Railway provides a full VPS experience with managed databases.

#### Steps:

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize project**
   ```bash
   railway init
   ```

4. **Generate config**
   ```bash
   npm run deploy railway
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Add environment variables**
   - Railway Dashboard → Your Project → Variables
   - Add all required variables

#### Pros:
- Full VPS control
- Persistent storage
- Easy database integration
- Automatic SSL

### Render

Render offers free tiers and easy deployment.

#### Steps:

1. **Push code to GitHub**
2. **Create Web Service on Render**
   - Go to render.com
   - Click "New +"
   - Connect your GitHub repository
3. **Configure build**
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. **Add environment variables** in Render dashboard
5. **Deploy**

#### Pros:
- Free tier available
- Automatic deploys from git
- SSL included

### VPS / DigitalOcean

For full control over your infrastructure.

#### Steps:

1. **Provision a VPS**
   - DigitalOcean Droplet ($6/month recommended)
   - Ubuntu 22.04 LTS

2. **Connect to VPS**
   ```bash
   ssh root@your-vps-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

4. **Install PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   ```

5. **Install Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

6. **Clone your repository**
   ```bash
   cd /var/www
   git clone https://github.com/your-username/buildmyidea-mvp.git
   cd buildmyidea-mvp
   ```

7. **Install dependencies**
   ```bash
   npm install --production
   ```

8. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env
   # Add your production environment variables
   ```

9. **Initialize database**
   ```bash
   npm run migrate
   ```

10. **Start with PM2**
    ```bash
    pm2 start server.js --name buildmyidea
    pm2 save
    pm2 startup
    ```

11. **Configure Nginx**
    ```bash
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

12. **Enable site**
    ```bash
    sudo ln -s /etc/nginx/sites-available/buildmyidea /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

13. **Setup SSL with Certbot**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

#### Pros:
- Full control
- Cheapest option ($6/month)
- Persistent storage
- Can host multiple apps

## Stripe Production Setup

### 1. Switch to Live Mode

1. Go to Stripe Dashboard
2. Click "Test mode" toggle to turn it off
3. This activates live mode

### 2. Create Live Product

1. Go to Products in live mode
2. Create "Idea Submission" product
3. Price: $1.00 USD (one-time)
4. Copy the live Price ID

### 3. Get Live API Keys

1. Go to Developers → API keys
2. Copy the live Secret Key (`sk_live_...`)
3. Copy the live Publishable Key (`pk_live_...`)

### 4. Configure Webhook

1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret

### 5. Update Environment Variables

Add to your production environment:
- `STRIPE_SECRET_KEY=sk_live_...`
- `STRIPE_PUBLISHABLE_KEY=pk_live_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `STRIPE_PRICE_ID=price_...`

## Domain Configuration

### Buy a Domain

- Namecheap
- GoDaddy
- Cloudflare Registrar

### Point Domain to Your Server

#### For VPS:

1. **A Record**
   - Type: A
   - Name: @
   - Value: Your VPS IP address

2. **CNAME Record** (for www)
   - Type: CNAME
   - Name: www
   - Value: @

#### For Vercel/Railway/Render:

1. Follow platform's domain setup guide
2. Update DNS settings at your domain registrar
3. Platform will handle SSL automatically

## Monitoring & Maintenance

### Logging

For VPS deployments:

```bash
# View PM2 logs
pm2 logs buildmyidea

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Backups

Set up automated backups:

```bash
# Create backup script
nano /var/www/buildmyidea-mvp/backup.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/buildmyidea-mvp/database/bmi.db /var/www/backups/bmi_$DATE.db
# Keep last 7 days
find /var/www/backups -name "bmi_*.db" -mtime +7 -delete
```

```bash
chmod +x /var/www/buildmyidea-mvp/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /var/www/buildmyidea-mvp/backup.sh
```

### Uptime Monitoring

Use services like:
- UptimeRobot (free)
- Pingdom
- Better Uptime

### Security

1. **Update system regularly**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. **Configure firewall**
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

3. **Disable root login**
   ```bash
   # Create a new user first
   adduser deployer
   usermod -aG sudo deployer

   # Edit SSH config
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart ssh
   ```

## Scaling Considerations

### Database

For production with high traffic:
- Switch to PostgreSQL or MySQL
- Use managed database service (Railway, Render, AWS RDS)
- Implement read replicas

### Storage

For large file uploads:
- Use AWS S3, Cloudflare R2, or similar
- Store file URLs in database

### CDN

For static assets:
- Cloudflare CDN (free)
- AWS CloudFront
- Vercel Edge Network (if using Vercel)

## Troubleshooting

### Stripe Webhook Not Working

1. Check webhook secret is correct
2. Verify webhook URL is accessible
3. Check server logs
4. Use Stripe webhook testing tool

### Database Locked

```bash
# Delete WAL and SHM files
rm -f database/bmi.db-wal database/bmi.db-shm
```

### PM2 App Not Starting

```bash
# Check logs
pm2 logs buildmyidea

# Restart
pm2 restart buildmyidea

# If still failing, delete and recreate
pm2 delete buildmyidea
pm2 start server.js --name buildmyidea
pm2 save
```

## Support

For deployment issues:
- Check platform-specific documentation
- Review server logs
- Test webhook endpoints with Stripe CLI
- Check Stripe Dashboard for payment events

---

Good luck with your deployment! 🚀
