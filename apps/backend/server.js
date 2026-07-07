/**
 * Garden For Life — Express Server
 */
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const config = require('./config');
const { connectDB, closeDB } = require('./db');
const { isEnabled: encryptionEnabled, decryptUser } = require('./services/encryption');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessment');
const adminRoutes = require('./routes/admin');
const pdfRoutes = require('./routes/pdf');
const questionsRoutes = require('./routes/questions');
const contactRoutes = require('./routes/contact');
const orbRoutes = require('./routes/orb');
const socialRoutes = require('./routes/social');
const messagesRoutes = require('./routes/messages');

const app = express();
const PRIVATE_DEV_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

// ── Middleware ──
app.use(cors({
  origin: (origin, cb) => {
    // Allow same-machine and LAN dev origins without forcing .env edits.
    if (!origin || config.corsOrigins.includes(origin) || PRIVATE_DEV_ORIGIN_RE.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
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
app.use('/api/contact', contactRoutes);
app.use('/api/orb', orbRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/messages', messagesRoutes);

// Lightweight keepalive — frontend pings on every card save to prevent Render sleep
app.get('/api/ping', (_req, res) => res.json({ pong: true }));

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
      label: pk?.label || null,
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

    const result = { valid, adminMode: !!(pk && pk.isAdminPasskey) };

    // Auto-login: issue JWT when admin passkey is used
    if (valid && pk.isAdminPasskey) {
      try {
        const adminUser = await collections.users().findOne({ role: 'admin' });
        if (adminUser) {
          const decrypted = decryptUser(adminUser);
          result.token = jwt.sign(
            { sub: adminUser._id.toString(), email: decrypted.email, role: adminUser.role },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn }
          );
          result.user = {
            id: adminUser._id.toString(),
            email: decrypted.email,
            displayName: decrypted.displayName,
            role: adminUser.role,
          };
        } else {
          console.warn('[Beta] Admin passkey used but no admin user found in DB');
        }
      } catch (adminErr) {
        console.error('[Beta] Admin auto-login failed:', adminErr.message);
      }
    }

    res.json(result);
  } catch (err) {
    console.error('[Beta] Verify error:', err.message);
    res.status(500).json({ valid: false, error: 'Server error' });
  }
});

// ── BETA END: delete all assessment data on 27-08-2026 12:00 UTC ──
// Keeps: user accounts, audit logs (devActivity), questions.
// Deletes: assessments, assessmentReviews.
const BETA_WIPE_DATE = new Date('2026-09-27T12:00:00Z');
// Node's setTimeout delay is a 32-bit signed int: anything over ~24.8 days overflows and gets
// clamped to 1ms (fires immediately). The wipe is months out, so we re-arm in safe chunks.
const MAX_TIMEOUT = 2147483647; // 2^31 - 1 ms

function scheduleBetaWipe() {
  const msUntilWipe = BETA_WIPE_DATE.getTime() - Date.now();

  if (msUntilWipe <= 0) {
    // Already past the deadline — run immediately on startup
    console.log('[GFL-API] ⚠️  Beta wipe deadline has passed — executing now');
    executeBetaWipe();
    return;
  }

  if (msUntilWipe > MAX_TIMEOUT) {
    // Too far out for a single timer — re-check after one max chunk (never fires early).
    console.log(`[GFL-API] Beta data wipe scheduled for ${BETA_WIPE_DATE.toISOString()} (in ${Math.round(msUntilWipe / 86400000)}d)`);
    setTimeout(scheduleBetaWipe, MAX_TIMEOUT).unref?.();
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
