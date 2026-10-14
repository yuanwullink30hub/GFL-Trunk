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

  // Public base URL of THIS API — for links the API sends out that point back at itself (the account
  // verification mail, OAuth redirect URIs). Always configured, never read from the request: the Host
  // header is the client's to set, so a link built from it could send a person's verification token to
  // a host of the requester's choosing. Production defaults to the live API host, the way siteUrl
  // defaults to the live site; API_PUBLIC_URL overrides it.
  apiPublicUrl: (process.env.API_PUBLIC_URL
    || (process.env.NODE_ENV === 'production' ? 'https://api.gardenforlife.nl' : `http://localhost:${parseInt(process.env.PORT, 10) || 8080}`)
  ).replace(/\/+$/, ''),

  // The two-layer Leerling test (scoring_version v2_two_layer): GET /api/questions/two-layer serves its
  // bank in the quarter's rotation order. Off in production until the real bank replaces the placeholder
  // (Bleed v2 gate G2); LEERLING_TWO_LAYER=1 or 0 overrides either way.
  twoLayerTest: process.env.LEERLING_TWO_LAYER
    ? process.env.LEERLING_TWO_LAYER === '1'
    : process.env.NODE_ENV !== 'production',

};
