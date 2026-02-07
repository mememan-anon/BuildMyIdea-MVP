---
name: x-api
description: Post to X (Twitter) using the official API with OAuth 1.0a. Publish tweets reliably via the official API.
metadata: {"clawdbot":{"emoji":"🐦","primaryEnv":"X_API_KEY","requires":{"bins":["node"]}}}
---

# x-api 🐦

Post to X using the official API (OAuth 1.0a).

## When to Use
- Posting tweets where official API access is required for reliability and lower bot detection risk.
- Use `bird` CLI for reads (timeline, search, mentions).

## Setup

### 1. Get API Credentials
1. Go to https://developer.x.com/en/portal/dashboard
2. Create a Project and App
3. Set App permissions to **Read and Write**
4. From "Keys and tokens", collect:
   - API Key (Consumer Key)
   - API Key Secret (Consumer Secret)
   - Access Token
   - Access Token Secret

### 2. Configure Credentials
Option A: Environment variables

```bash
export X_API_KEY="your-api-key"
export X_API_SECRET="your-api-secret"
export X_ACCESS_TOKEN="your-access-token"
export X_ACCESS_SECRET="your-access-token-secret"
```

Option B: Config file at `~/.clawdbot/secrets/x-api.json`

```json
{
  "consumerKey":"your-api-key",
  "consumerSecret":"your-api-secret",
  "accessToken":"your-access-token",
  "accessTokenSecret":"your-access-token-secret"
}
```

### 3. Install Dependency

```bash
npm install twitter-api-v2
```

## Usage

Post a tweet (local script):

```bash
node ./scripts/x-post.mjs "Hello from x-api"
```

Or use the wrapper `x-post` if you add it to PATH.

## Troubleshooting
- 401 Unauthorized: Check tokens and permissions (must be Read+Write)
- 402 Credits Depleted: Add credits in X Developer Portal
- No credentials: Set env vars or config file
