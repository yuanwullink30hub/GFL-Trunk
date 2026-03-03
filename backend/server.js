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
// Explicit preflight handler — ensures CORS headers are always present
app.options('*', cors({
  origin: config.corsOrigins,
  credentials: true,
  maxAge: 0, // prevent browsers from caching preflight responses
}));
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  maxAge: 0,
}));
app.use(express.json({ limit: '25mb' }));

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

// Diagnostic endpoint — reveals SMTP + DNS config for debugging
app.get('/api/debug/smtp', async (_req, res) => {
  const dnsModule = require('dns');
  const results = {
    nodeVersion: process.version,
    dnsOrder: dnsModule.getDefaultResultOrder?.() || 'unknown',
    smtpHost: config.email.host,
    smtpPort: config.email.port,
    smtpSecure: config.email.secure,
    smtpUser: config.email.user ? `${config.email.user.slice(0, 3)}***` : 'NOT SET',
    smtpPass: config.email.pass ? '***SET***' : 'NOT SET',
    smtpFrom: config.email.from,
    dnsLookup: null,
    dnsResolve4: null,
    dnsResolve6: null,
  };

  // Test DNS resolution
  try {
    const { promisify } = require('util');
    const lookup = promisify(dnsModule.lookup);
    const resolve4 = promisify(dnsModule.resolve4);
    const resolve6 = promisify(dnsModule.resolve6);

    try {
      const lookupResult = await lookup(config.email.host, { all: true });
      results.dnsLookup = lookupResult;
    } catch (e) { results.dnsLookup = e.message; }

    try {
      results.dnsResolve4 = await resolve4(config.email.host);
    } catch (e) { results.dnsResolve4 = e.message; }

    try {
      results.dnsResolve6 = await resolve6(config.email.host);
    } catch (e) { results.dnsResolve6 = e.message; }
  } catch (e) {
    results.error = e.message;
  }

  res.json(results);
});

// Test SMTP connectivity — actually attempts to connect (no email sent)
app.get('/api/debug/smtp-test', async (_req, res) => {
  const nodemailer = require('nodemailer');
  try {
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
    await transporter.verify();
    res.json({ success: true, message: 'SMTP connection verified — ready to send' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: err.code });
  }
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
