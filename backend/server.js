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

// Beta passkey verification (checks DB, logs usage)
app.post('/api/beta/verify', async (req, res) => {
  const { passkey } = req.body;
  if (!passkey || typeof passkey !== 'string') {
    return res.status(400).json({ valid: false, error: 'Passkey is required' });
  }
  const trimmed = passkey.trim();
  try {
    const { collections, getDB } = require('./db');
    const pk = await collections.passkeys().findOne({ code: trimmed, isActive: true });
    const valid = !!pk;

    // Log usage attempt to devActivity
    await getDB().collection('devActivity').insertOne({
      type: 'passkey_use',
      timestamp: new Date(),
      code: trimmed,
      valid,
      ip: req.ip || req.connection?.remoteAddress || '',
      userAgent: (req.get('user-agent') || '').slice(0, 512),
    });

    if (valid) {
      // Bump usage counter
      await collections.passkeys().updateOne(
        { _id: pk._id },
        { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } }
      );
    }

    res.json({ valid });
  } catch (err) {
    console.error('[Beta] Verify error:', err.message);
    res.status(500).json({ valid: false, error: 'Server error' });
  }
});

// ── BETA END: delete all assessment data on 27-08-2026 12:00 UTC ──
// Keeps: user accounts, audit logs (devActivity), questions.
// Deletes: assessments, assessmentReviews.
const BETA_WIPE_DATE = new Date('2026-09-27T12:00:00Z');

function scheduleBetaWipe() {
  const now = Date.now();
  const msUntilWipe = BETA_WIPE_DATE.getTime() - now;

  if (msUntilWipe <= 0) {
    // Already past the deadline — run immediately on startup
    console.log('[GFL-API] ⚠️  Beta wipe deadline has passed — executing now');
    executeBetaWipe();
    return;
  }

  console.log(`[GFL-API] Beta data wipe scheduled for ${BETA_WIPE_DATE.toISOString()} (in ${Math.round(msUntilWipe / 86400000)}d)`);
  setTimeout(() => executeBetaWipe(), msUntilWipe);
}

async function executeBetaWipe() {
  try {
    const { getDB } = require('./db');
    const db = getDB();

    const [assessments, reviews] = await Promise.all([
      db.collection('assessments').deleteMany({}),
      db.collection('assessmentReviews').deleteMany({}),
    ]);

    // Log the wipe in the audit trail
    db.collection('devActivity').insertOne({
      type: 'admin_login',
      timestamp: new Date(),
      userId: 'SYSTEM',
      email: 'system@gardenforlife.nl',
      message: `BETA WIPE: deleted ${assessments.deletedCount} assessments, ${reviews.deletedCount} reviews`,
      branch: '', hash: '', reportId: null, reportType: '',
    }).catch(() => {});

    console.log(`[GFL-API] ✅ Beta wipe complete: ${assessments.deletedCount} assessments, ${reviews.deletedCount} reviews deleted`);
  } catch (err) {
    console.error('[GFL-API] ❌ Beta wipe failed:', err.message);
  }
}

// ── Start ──
async function start() {
  // Connect to MongoDB (skips gracefully if MONGODB_URI not set)
  if (config.mongoUri) {
    await connectDB();
    console.log('[GFL-API] MongoDB connected');

    // ── BETA END: hard-coded wipe of all assessment data on 27-08-2026 12:00 UTC ──
    scheduleBetaWipe();
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
