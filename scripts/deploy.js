#!/usr/bin/env node
/**
 * CI/CD Deployment Script
 * Supports multiple deployment platforms
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

console.log('🚀 Deployment Script\n');

// Parse deployment platform
const platform = process.argv[2] || 'vercel';
const supportedPlatforms = ['vercel', 'railway', 'render', 'manual'];

if (!supportedPlatforms.includes(platform)) {
  console.log(`❌ Unsupported platform: ${platform}`);
  console.log(`   Supported: ${supportedPlatforms.join(', ')}`);
  process.exit(1);
}

console.log(`📦 Platform: ${platform}\n`);

// Generate deployment configuration
function generateConfig() {
  switch (platform) {
    case 'vercel':
      generateVercelConfig();
      break;
    case 'railway':
      generateRailwayConfig();
      break;
    case 'render':
      generateRenderConfig();
      break;
    case 'manual':
      generateManualInstructions();
      break;
  }
}

function generateVercelConfig() {
  const config = {
    "version": 2,
    "builds": [
      {
        "src": "server.js",
        "use": "@vercel/node"
      }
    ],
    "routes": [
      {
        "src": "/(.*)",
        "dest": "/server.js"
      }
    ],
    "env": {
      "NODE_ENV": "production",
      "PORT": "3000"
    }
  };

  const configPath = path.join(__dirname, 'vercel.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('✅ Generated vercel.json\n');
  console.log('📋 Required Environment Variables in Vercel Dashboard:');
  console.log('   - STRIPE_SECRET_KEY');
  console.log('   - STRIPE_PUBLISHABLE_KEY');
  console.log('   - STRIPE_WEBHOOK_SECRET');
  console.log('   - STRIPE_PRICE_ID');
  console.log('   - SESSION_SECRET');
  console.log('   - ADMIN_EMAIL');
  console.log('   - ADMIN_PASSWORD\n');
  console.log('🚀 To deploy:');
  console.log('   1. Install Vercel CLI: npm i -g vercel');
  console.log('   2. Run: vercel');
  console.log('   3. Add environment variables in Vercel dashboard');
  console.log('   4. Run: vercel --prod\n');
}

function generateRailwayConfig() {
  const config = {
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
      "builder": "NIXPACKS"
    },
    "deploy": {
      "startCommand": "node server.js",
      "healthcheckPath": "/health"
    }
  };

  const configPath = path.join(__dirname, 'railway.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('✅ Generated railway.json\n');
  console.log('📋 Required Environment Variables in Railway Dashboard:');
  console.log('   - STRIPE_SECRET_KEY');
  console.log('   - STRIPE_PUBLISHABLE_KEY');
  console.log('   - STRIPE_WEBHOOK_SECRET');
  console.log('   - STRIPE_PRICE_ID');
  console.log('   - SESSION_SECRET');
  console.log('   - ADMIN_EMAIL');
  console.log('   - ADMIN_PASSWORD\n');
  console.log('🚀 To deploy:');
  console.log('   1. Install Railway CLI: npm i -g @railway/cli');
  console.log('   2. Login: railway login');
  console.log('   3. Initialize: railway init');
  console.log('   4. Deploy: railway up\n');
}

function generateRenderConfig() {
  const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma migrate deploy

EXPOSE 3000

CMD ["node", "server.js"]`;

  const dockerfilePath = path.join(__dirname, 'Dockerfile');
  fs.writeFileSync(dockerFilePath, dockerfile);
  
  console.log('✅ Generated Dockerfile\n');
  console.log('📋 Required Environment Variables in Render Dashboard:');
  console.log('   - STRIPE_SECRET_KEY');
  console.log('   - STRIPE_PUBLISHABLE_KEY');
  console.log('   - STRIPE_WEBHOOK_SECRET');
  console.log('   - STRIPE_PRICE_ID');
  console.log('   - SESSION_SECRET');
  console.log('   - ADMIN_EMAIL');
  console.log('   - ADMIN_PASSWORD\n');
  console.log('🚀 To deploy:');
  console.log('   1. Push code to GitHub');
  console.log('   2. Create Web Service on Render');
  console.log('   3. Connect repository');
  console.log('   4. Add environment variables');
  console.log('   5. Deploy\n');
}

function generateManualInstructions() {
  console.log('📋 Manual Deployment Instructions\n');
  console.log('1. Prepare your server:');
  console.log('   - Install Node.js 18+');
  console.log('   - Clone the repository');
  console.log('   - Run: npm install\n');
  console.log('2. Set up environment:');
  console.log('   - Copy .env.example to .env');
  console.log('   - Add your Stripe keys and configuration\n');
  console.log('3. Initialize database:');
  console.log('   - Run: npm run migrate');
  console.log('   - (Optional) Run: npm run seed\n');
  console.log('4. Start the server:');
  console.log('   - For development: npm run dev');
  console.log('   - For production: npm start\n');
  console.log('5. Set up a process manager (PM2):');
  console.log('   - Install: npm i -g pm2');
  console.log('   - Start: pm2 start server.js --name buildmyidea');
  console.log('   - Monitor: pm2 monit\n');
  console.log('6. Set up reverse proxy (Nginx):');
  console.log('   - Configure Nginx to proxy to localhost:3000');
  console.log('   - Set up SSL certificate (Let\'s Encrypt)\n');
  console.log('7. Set up Stripe webhooks:');
  console.log('   - Add webhook URL: https://your-domain.com/webhooks/stripe');
  console.log('   - Select events: checkout.session.completed, payment_intent.succeeded');
  console.log('   - Copy webhook secret to .env\n');
}

// Check for GITHUB_TOKEN
if (!process.env.GITHUB_TOKEN) {
  console.log('⚠️  GITHUB_TOKEN not set. Git operations may fail.');
  console.log('   Set it with: export GITHUB_TOKEN=your_token\n');
}

// Generate deployment instructions
generateConfig();

console.log('📝 Pre-commit checklist:');
console.log('   [ ] All tests passing');
console.log('   [ ] Environment variables configured');
console.log('   [ ] Stripe webhook endpoint set up');
console.log('   [ ] Database initialized');
console.log('   [ ] Admin password changed from default\n');
