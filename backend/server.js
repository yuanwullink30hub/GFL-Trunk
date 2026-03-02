/**
 * Garden For Life — Express Server
 */
const express = require('express');
const cors = require('cors');
const config = require('./config');
const { connectDB, closeDB } = require('./db');
const { isEnabled: encryptionEnabled } = require('./services/encryption');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessment');
const adminRoutes = require('./routes/admin');
const pdfRoutes = require('./routes/pdf');
const questionsRoutes = require('./routes/questions');

const app = express();

// ── Middleware ──
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ── Routes ──
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/questions', questionsRoutes);

// Health check
app.get('/api/status', (_req, res) => {
  const providers = Object.entries(config.ai)
    .filter(([, v]) => v.apiKey && v.apiKey !== '' && !v.apiKey.includes('placeholder'))
    .map(([k, v]) => ({ provider: k, model: v.defaultModel }));

  res.json({
    status: 'ready',
    providers,
    encryption: encryptionEnabled() ? 'AES-256-GCM' : 'disabled',
  });
});

// ── All 4 modules mounted ──

// ── Start ──
async function start() {
  // Connect to MongoDB (skips gracefully if MONGODB_URI not set)
  if (config.mongoUri) {
    await connectDB();
    console.log('[GFL-API] MongoDB connected');
  } else {
    console.log('[GFL-API] MONGODB_URI not set — auth & assessment routes will fail');
  }

  app.listen(config.port, () => {
    console.log(`[GFL-API] Running on http://localhost:${config.port}`);

    const active = Object.entries(config.ai)
      .filter(([, v]) => v.apiKey && !v.apiKey.includes('placeholder'))
      .map(([k]) => k);
    console.log(`[GFL-API] Active AI providers: ${active.length ? active.join(', ') : 'none (set keys in .env)'}`);
    console.log(`[GFL-API] Field encryption: ${encryptionEnabled() ? 'ENABLED (AES-256-GCM)' : 'DISABLED (set ENCRYPTION_KEY in .env)'}`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[GFL-API] Shutting down...');
  await closeDB();
  process.exit(0);
});

start().catch((err) => {
  console.error('[GFL-API] Failed to start:', err);
  process.exit(1);
});

module.exports = app;
