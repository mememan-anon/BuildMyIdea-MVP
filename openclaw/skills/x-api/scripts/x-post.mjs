#!/usr/bin/env node
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';

const text = process.argv.slice(2).join(' ');
if (!text) {
  console.error('Usage: node x-post.mjs "Your tweet text"');
  process.exit(2);
}

function loadConfig() {
  if (process.env.X_API_KEY && process.env.X_API_SECRET && process.env.X_ACCESS_TOKEN && process.env.X_ACCESS_SECRET) {
    return {
      consumerKey: process.env.X_API_KEY,
      consumerSecret: process.env.X_API_SECRET,
      accessToken: process.env.X_ACCESS_TOKEN,
      accessTokenSecret: process.env.X_ACCESS_SECRET
    };
  }
  const path = process.env.HOME + '/.clawdbot/secrets/x-api.json';
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path,'utf8'));
  }
  console.error('No X API credentials found in env or ~/.clawdbot/secrets/x-api.json');
  process.exit(3);
}

const cfg = loadConfig();
const client = new TwitterApi({
  appKey: cfg.consumerKey,
  appSecret: cfg.consumerSecret,
  accessToken: cfg.accessToken,
  accessSecret: cfg.accessTokenSecret
});

(async () => {
  try {
    // Use the v2 Tweets API where available. This may work when v1.1 endpoints
    // are restricted but v2 write access is enabled for the app.
    const rw = client.readWrite;
    // twitter-api-v2 exposes v2 client at .v2
    const res = await rw.v2.tweet(text);
    if (res && res.data && res.data.id) {
      console.log('OK https://twitter.com/i/web/status/' + res.data.id);
    } else if (res && res.id) {
      console.log('OK https://twitter.com/i/web/status/' + res.id);
    } else {
      console.log('OK', JSON.stringify(res));
    }
  } catch (e) {
    console.error('ERROR', e.toString());
    process.exit(1);
  }
})();
