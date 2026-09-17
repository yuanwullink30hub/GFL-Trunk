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
const activityRoutes = require('./routes/activity');
const filesRoutes = require('./routes/files');
const pdfRoutes = require('./routes/pdf');
const questionsRoutes = require('./routes/questions');
const contactRoutes = require('./routes/contact');
const orbRoutes = require('./routes/orb');
const socialRoutes = require('./routes/social');
const messagesRoutes = require('./routes/messages');
const toolsRoutes = require('./routes/tools');
const verbondRoutes = require('./routes/verbond');
const activationCodeRoutes = require('./routes/activationCodes');
const paymentRoutes = require('./routes/payments');
const stripeWebhookRoutes = require('./routes/stripeWebhook');

const app = express();
const PRIVATE_DEV_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
// Cloudflare Pages preview deployments: every non-production branch is served from its own
// <branch|hash>.gfl-trunk.pages.dev subdomain, which an exact-match allowlist can never cover.
// Scoped to this project's subdomains only — Cloudflare will not serve another account there.
// The desktop app serves its UI from this fixed origin (apps/desktop/src/appProtocol.js).
const DESKTOP_APP_ORIGIN = 'app://gardenforlife';
// The management app (apps/admin-desktop), installed only on the management computer.
const MANAGEMENT_APP_ORIGIN = 'app://gflbeheer';
const PAGES_PREVIEW_ORIGIN_RE = /^https:\/\/[a-z0-9][a-z0-9-]*\.gfl-trunk\.pages\.dev$/;

// ── Middleware ──
app.use(cors({
  origin: (origin, cb) => {
    // Allow same-machine and LAN dev origins without forcing .env edits.
    if (!origin || origin === DESKTOP_APP_ORIGIN || origin === MANAGEMENT_APP_ORIGIN || config.corsOrigins.includes(origin)
        || PRIVATE_DEV_ORIGIN_RE.test(origin) || PAGES_PREVIEW_ORIGIN_RE.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
// Stripe signs the raw request bytes — this route must see the body before express.json parses it.
app.use('/api/payments/webhook', stripeWebhookRoutes);
app.use(express.json({ limit: '25mb' }));

// ── Routes ──
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/orb', orbRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/messages', messagesRoutes);
// Anonymous tool gateway — docs/LOCAL_WORKSTATION_CONTRACT.md §7a.
app.use('/api/tools', toolsRoutes);
app.use('/api/verbond', verbondRoutes);
app.use('/api/activation-codes', activationCodeRoutes);
app.use('/api/payments', paymentRoutes);

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
    reportPipeline: config.reportPipeline,
    encryption: encryptionEnabled() ? 'AES-256-GCM' : 'disabled',
  });
});

// (The mobile admin passkey route, /api/beta/verify, is gone: it issued an admin token for a single
// code. Admin work happens only in the local admin app, which logs in like any account.)

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

    // Reports that were never unlocked: their crystal code only ever existed sealed in the tab
    // (services/sealedCode.js) and that seal has expired, so the card draft keyed by the code's
    // hash can go too. Only drafts authored under the sealed model (sealed: true) are touched.
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const stale = await db.collection('kaartDrafts').find({ sealed: true, at: { $lt: cutoff } }, { projection: { codeHash: 1 } }).toArray();
      if (stale.length) {
        const unlocked = new Set((await db.collection('reportUnlocks')
          .find({ codeHash: { $in: stale.map((x) => x.codeHash) } }, { projection: { codeHash: 1 } }).toArray())
          .map((x) => x.codeHash));
        // A payment under way (or paid, awaiting its ledger row) keeps its report's draft.
        const { codeHashesWithLivePayment } = require('./services/payments');
        const paying = await codeHashesWithLivePayment(stale.map((x) => x.codeHash));
        const orphan = stale.filter((x) => !unlocked.has(x.codeHash) && !paying.has(x.codeHash)).map((x) => x._id);
        if (orphan.length) {
          const r = await db.collection('kaartDrafts').deleteMany({ _id: { $in: orphan } });
          console.log(`[GFL-API] 🧹 Unpaid report drafts removed: ${r.deletedCount}`);
        }
      }
      const { stripExpiredUnlockEmails } = require('./services/reportAccess');
      const stripped = await stripExpiredUnlockEmails();
      if (stripped) console.log(`[GFL-API] 🧹 Payer emails removed after the refund window: ${stripped}`);
      // After the refund window the Stripe payment is unlinked from the report (no PDF → person path).
      const { unlinkExpiredPayments } = require('./services/reportAccess');
      const unlinked = await unlinkExpiredPayments();
      if (unlinked) console.log(`[GFL-API] 🧹 Payments unlinked from their reports after the refund window: ${unlinked}`);
    } catch (e) {
      console.error('[GFL-API] ❌ Unlock cleanup failed:', e.message);
    }
    if (result.deletedCount > 0) {
      db.collection('devActivity').insertOne({
        // The TTL now keys on expiresAt; a row without it would live forever.
        expiresAt: new Date(Date.now() + 90 * 86400 * 1000),
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
      // The TTL now keys on expiresAt; a row without it would live forever.
      expiresAt: new Date(Date.now() + 90 * 86400 * 1000),
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

    // Which Stripe pieces are present for the active mode (never the values).
    const d = require('./services/paymentConfig').paymentDiagnostics();
    const mark = (ok) => (ok ? '✓' : '✗');
    console.log(`[GFL-API] Stripe mode=${d.mode} · secret ${mark(d.secretKey)} · publishable ${mark(d.publishableKey)} · webhook ${mark(d.webhookSecret)} · price launch ${mark(d.priceLaunch)} · price normal ${mark(d.priceNormal)}${d.production && d.mode === 'test' ? ` · test token ${mark(d.testAccessToken)} (test mode locked to it)` : ''}`);
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
