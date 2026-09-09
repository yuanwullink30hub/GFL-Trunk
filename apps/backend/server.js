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
const verbondRoutes = require('./routes/verbond');

const app = express();
const PRIVATE_DEV_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
// Cloudflare Pages preview deployments: every non-production branch is served from its own
// <branch|hash>.gfl-trunk.pages.dev subdomain, which an exact-match allowlist can never cover.
// Scoped to this project's subdomains only — Cloudflare will not serve another account there.
const PAGES_PREVIEW_ORIGIN_RE = /^https:\/\/[a-z0-9][a-z0-9-]*\.gfl-trunk\.pages\.dev$/;

// ── Middleware ──
app.use(cors({
  origin: (origin, cb) => {
    // Allow same-machine and LAN dev origins without forcing .env edits.
    if (!origin || config.corsOrigins.includes(origin)
        || PRIVATE_DEV_ORIGIN_RE.test(origin) || PAGES_PREVIEW_ORIGIN_RE.test(origin)) {
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
app.use('/api/verbond', verbondRoutes);

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
    // ADMIN ONLY. The beta access gate is gone; the sole surviving use of a passkey is
    // the mobile admin portal, so a non-admin code is treated exactly like a wrong one.
    const pk = await collections.passkeys().findOne({ code: trimmed, isActive: true, isAdminPasskey: true });
    const valid = !!pk;

    // Attempts are deliberately NOT logged: the beta gate is gone, this endpoint only
    // serves the mobile admin passkey, and passkey telemetry has no consumer.

    if (valid) {
      // Bump usage counter
      await collections.passkeys().updateOne(
        { _id: pk._id },
        { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } }
      );
    }

    const result = { valid, adminMode: valid };

    // Auto-login: issue JWT for the admin passkey
    if (valid) {
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

// ── Nightly profile purge — 00:00 Europe/Amsterdam ──
// A computed profile is a working cache, not a record. The account keeps only the partial
// profile (users.orbHistory: archetype names, shape vector, card texts); everything the
// engine computed to get there is swept at midnight. The 24h TTL index on
// assessments.createdAt (db/index.js) is the safety net for restarts — this sweep is what
// makes "cleared daily at 00:00" literally true.
const PURGE_TZ = 'Europe/Amsterdam';

/**
 * Milliseconds until the next 00:00 wall-clock in PURGE_TZ.
 * Derived from the zone's own clock rather than the server's, so the sweep lands at
 * midnight in Amsterdam wherever the host runs. On the two DST switch days the computed
 * delay is an hour off (the day is 23h or 25h long); the sweep fires at 23:00 or 01:00
 * that once and re-arms correctly for the next day.
 */
function msUntilMidnight(tz = PURGE_TZ) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(now).reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {});
  const secondsIntoDay = Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second);
  const ms = (86400 - secondsIntoDay) * 1000 - now.getMilliseconds();
  return ms > 0 ? ms : 86400000;
}

async function purgeProfiles() {
  try {
    const { getDB } = require('./db');
    const db = getDB();
    const result = await db.collection('assessments').deleteMany({});
    console.log(`[GFL-API] 🧹 Nightly profile purge: ${result.deletedCount} computed profile(s) removed`);
    if (result.deletedCount > 0) {
      db.collection('devActivity').insertOne({
        type: 'admin_login',
        timestamp: new Date(),
        userId: 'SYSTEM',
        email: 'system@gardenforlife.nl',
        message: `PROFILE PURGE: deleted ${result.deletedCount} computed profiles (00:00 ${PURGE_TZ})`,
        branch: '', hash: '', reportId: null, reportType: '',
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[GFL-API] ❌ Nightly profile purge failed:', err.message);
  }
}

function scheduleProfilePurge() {
  const delay = msUntilMidnight();
  console.log(`[GFL-API] Profile purge scheduled for 00:00 ${PURGE_TZ} (in ${Math.round(delay / 60000)} min)`);
  setTimeout(() => { purgeProfiles().finally(scheduleProfilePurge); }, delay);
}

// ── BETA END: delete all assessment data on 27-09-2026 12:00 UTC (launch day) ──
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

    // ── BETA END: hard-coded wipe of all assessment data on 27-09-2026 12:00 UTC ──
    scheduleBetaWipe();

    // Computed profiles never survive the night — swept at 00:00 Europe/Amsterdam.
    scheduleProfilePurge();
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
