/**
 * Garden For Life — Configuration
 *
 * All env vars with sensible defaults. Copy .env.example → .env and fill in.
 */
require('dotenv').config();
const { resolveStripeEnv } = require('./stripeEnv');

module.exports = {
  port: parseInt(process.env.PORT, 10) || 8080,

  // MongoDB
  mongoUri: process.env.MONGODB_URI || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: '7d',
  // Saved login in the desktop application ("Onthoudt mijn wachtwoord" ticked → `remember: true` on
  // login, registration or PDF-code login): the session stays valid for 30 days from that login. The
  // platform keeps its session stamp in step — LoginPage.jsx sessionMaxAge(). Browsers never send it.
  jwtRememberExpiresIn: '30d',

  // Field-Level Encryption
  encryptionKey: process.env.ENCRYPTION_KEY || '',

  // CORS — always include production origins
  corsOrigins: [
    ...new Set([
      ...(process.env.CORS_ORIGINS || 'http://localhost:3000')
        .split(',')
        .map(s => s.trim()),
      'http://localhost:3001',
      'https://gfl-trunk.pages.dev',
      'https://gardenforlife.nl',
      'https://www.gardenforlife.nl',
    ]),
  ],

  // AI provider keys
  ai: {
    defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'claude',
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o',
    },
    grok: {
      apiKey: process.env.GROK_API_KEY || '',
      baseUrl: 'https://api.x.ai/v1',
      defaultModel: 'grok-3',
    },
    claude: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      // Claude Fable 5.1: thinking is always on; depth is set by effort (low | medium | high | xhigh | max).
      // Requires 30-day data retention on the Anthropic org (not available under zero data retention).
      defaultModel: 'claude-fable-5-1',
      effort: 'high',
    },
  },

  // Report pipeline — decided here in the repo, never by a host environment variable (Render runs what
  // this file says). 'v5.2' = the Deltawerken engine pipeline (engine/reportV5.js: the Mongo Master Prompt,
  // runtime-engine payload, Corpus Manifest slice, Spec A1 two-curve chart); live since 2026-09-16.
  // 'v4.3' = the previous path (Mongo prompt, full corpus, cRuntime chart); free-form questions always use it.
  reportPipeline: 'v5.2',

  // Email (SMTP)
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@gardenforlife.nl',
    // Inbox that public contact/feedback/source-suggestion forms land in.
    contactTo: process.env.CONTACT_EMAIL || process.env.SMTP_USER || process.env.SMTP_FROM || 'noreply@gardenforlife.nl',
  },

  // Stripe — payment for the full report (services/stripe.js, services/payments.js). STRIPE_MODE
  // (test | live, default test) picks the key set; see config/stripeEnv.js for the accepted names.
  // Without the secret key, publishable key and both price IDs (and in production the webhook
  // secret), payments stay disabled everywhere and the paywall says so.
  stripe: resolveStripeEnv(process.env),

  // Public frontend base URL — used to build clickable links in transactional emails
  // (e.g. the password-change confirmation). Defaults to the production site, NOT the
  // request host (which would be localhost in dev / the API host in prod).
  siteUrl: (process.env.SITE_URL || 'https://www.gardenforlife.nl').replace(/\/+$/, ''),

};
