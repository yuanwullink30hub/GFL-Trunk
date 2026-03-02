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

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(s => s.trim()),

  // AI provider keys
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.5-flash-preview-05-20',
    },
    grok: {
      apiKey: process.env.GROK_API_KEY || '',
      baseUrl: 'https://api.x.ai/v1',
      defaultModel: 'grok-3',
    },
  },
};
