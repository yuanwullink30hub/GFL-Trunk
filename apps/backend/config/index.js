/**
 * Garden For Life — Configuration
 *
 * All env vars with sensible defaults. Copy .env.example → .env and fill in.
 */
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 8080,

  // MongoDB
  mongoUri: process.env.MONGODB_URI || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: '7d',

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
      defaultModel: 'claude-opus-4-8',
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

  // Public frontend base URL — used to build clickable links in transactional emails
  // (e.g. the password-change confirmation). Defaults to the production site, NOT the
  // request host (which would be localhost in dev / the API host in prod).
  siteUrl: (process.env.SITE_URL || 'https://www.gardenforlife.nl').replace(/\/+$/, ''),

  // Beta access passkeys (comma-separated list)
  betaPasskeys: (process.env.BETA_PASSKEYS || 'Beta-4.9').split(',').map(s => s.trim()),
};
