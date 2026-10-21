/**
 * Garden For Life — Assessment Questions Routes
 *
 * GET    /api/questions                        — The old test's layers (public; read-only since 16 Oct 2026)
 * GET    /api/questions/two-layer?level=…      — A level's two-layer bank in this quarter's rotation order (public;
 *                                                 leerling unless level=gevorderd)
 * POST   /api/questions/publish                — Publish the public questions file to R2 now (admin)
 * GET    /api/questions/bank/:level            — The two-layer bank's drafts for the admin editor (admin)
 * PATCH  /api/questions/bank/:level/:id        — Save part of one question, pinned to its version (admin)
 * POST   /api/questions/bank/:level/publish    — Make the drafts the live bank (admin)
 *
 * The old test's editor (seed, import, export, Word import/export, per-question edits) was removed with its
 * dashboard screen (owner, 16 Oct 2026). Its layers stay readable for the old test while it is still served.
 */
const { Router } = require('express');
const { collections } = require('../db');
const { twoLayerPlan, loadPublishedBank, bankSource, servedQuestion, LEVELS: BANK_LEVELS } = require('../services/twoLayerBank');
const { publishQuestions } = require('../services/questionsPublisher');
const bankStore = require('../services/questionBankStore');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/questions — Public: the old test's layers + questions
// ─────────────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  try {
    const layers = await collections.questions()
      .find({})
      .sort({ layerIndex: 1 })
      .toArray();

    if (layers.length === 0) {
      return res.json({ layers: [], seeded: false });
    }

    res.json({ layers, seeded: true });
  } catch (err) {
    console.error('[Questions] Fetch error:', err.message);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/questions/two-layer — Public: a level's two-layer bank in this quarter's rotation order
// (services/twoLayerBank.js): ?level=gevorderd, otherwise Leerling. Always on: the owner switched the test live
// on 16 Oct, without a switch; Gevorderd has its own bank since 21 Oct.
// ─────────────────────────────────────────────────────────────

router.get('/two-layer', (req, res) => {
  const level = req.query.level ? String(req.query.level) : 'leerling';
  if (!BANK_LEVELS.includes(level)) return res.status(404).json({ error: `no two-layer bank for level ${level}` });
  try {
    res.json(twoLayerPlan(new Date(), level));
  } catch (err) {
    console.error('[Questions] Two-layer plan error:', err.message);
    res.status(500).json({ error: 'Failed to load the two-layer test' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/questions/publish — Admin: publish the public questions file now (the first time, or to retry);
// answers { published, bytes?, url?, reason? }. Publishing the bank (below) does this too.
// ─────────────────────────────────────────────────────────────

router.post('/publish', authRequired, adminRequired, async (_req, res) => {
  const result = await publishQuestions();
  res.status(result.published ? 200 : 503).json(result);
});

// ─────────────────────────────────────────────────────────────
// The two-layer bank editor (services/questionBankStore.js): drafts save on their own; only publish
// changes what respondents see.
// ─────────────────────────────────────────────────────────────

/** Does this draft read exactly like the question the test serves now? */
function isLive(draft) {
  const served = servedQuestion(draft.question_id, draft.level);
  if (!served) return false;
  const q = bankStore.bankQuestionOf(draft);
  return served.text === q.text
    && q.l1_answers.every((a) => (served.l1_answers.find((x) => x.group === a.group) || {}).text === a.text)
    && q.l2_answers.every((a) => (served.l2_answers.find((x) => x.archetype === a.archetype) || {}).text === a.text);
}

const withLive = (d) => ({ ...d, live: BANK_LEVELS.includes(d.level) ? isLive(d) : false });

function sendBankError(res, err, what) {
  if (err instanceof bankStore.BankError) {
    const { status, message, current, problems } = err;
    return res.status(status).json({ error: message, ...(current ? { current: withLive(current) } : {}), ...(problems ? { problems } : {}) });
  }
  console.error(`[Questions] ${what}:`, err.message);
  return res.status(500).json({ error: `${what} failed` });
}

router.get('/bank/:level', authRequired, adminRequired, async (req, res) => {
  try {
    const questions = await bankStore.listDrafts(req.params.level);
    const snap = await bankStore.getPublished(req.params.level);
    res.json({
      level: req.params.level,
      groups: bankStore.GROUPS,
      archetypes: bankStore.ARCHETYPES.map((a) => ({ name: a, group: bankStore.GROUP_OF[a] })),
      questions: questions.map(withLive),
      published: snap ? { revision: snap.revision, publishedAt: snap.publishedAt, publishedBy: snap.publishedBy } : null,
      serving: bankSource(req.params.level),
    });
  } catch (err) {
    sendBankError(res, err, 'Loading the question bank');
  }
});

router.patch('/bank/:level/:questionId', authRequired, adminRequired, async (req, res) => {
  try {
    const saved = await bankStore.saveDraft(req.params.level, req.params.questionId, req.body, req.user.email);
    res.json({ question: withLive(saved) });
  } catch (err) {
    sendBankError(res, err, 'Saving the question');
  }
});

router.post('/bank/:level/publish', authRequired, adminRequired, async (req, res) => {
  try {
    const snap = await bankStore.publishBank(req.params.level, req.user.email);
    await loadPublishedBank();
    console.log(`[Questions] ${req.params.level} bank published: revision ${snap.revision} by ${req.user.email}`);
    const file = await publishQuestions();
    res.json({ revision: snap.revision, publishedAt: snap.publishedAt, publishedBy: snap.publishedBy, file });
  } catch (err) {
    sendBankError(res, err, 'Publishing the question bank');
  }
});

module.exports = router;
