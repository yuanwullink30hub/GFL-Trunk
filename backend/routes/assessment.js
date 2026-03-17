/**
 * Garden For Life — Assessment Routes
 *
 * POST /api/assessment          — Save assessment result (requires auth)
 * GET  /api/assessment/history  — List user's past assessments (requires auth)
 * POST /api/assessment/review   — Save assessment feedback (optional auth)
 * GET  /api/assessment/:id      — Get single assessment detail (requires auth)
 */
const { Router } = require('express');
const { ObjectId } = require('mongodb');
const { collections } = require('../db');
const { authRequired } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('../config');

const router = Router();

/**
 * Optional auth middleware — attaches req.user if token is provided,
 * but doesn't fail if token is missing. Allows anonymous submissions.
 */
function authOptional(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    // No token provided — continue as anonymous
    req.user = null;
    return next();
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { userId: payload.sub, email: payload.email, role: payload.role || 'client' };
  } catch (err) {
    // Invalid token — still continue as anonymous
    console.warn('[Assessment] Invalid token in review submission, continuing as anonymous');
    req.user = null;
  }
  next();
}

// ─────────────────────────────────────────────────────────────
// POST /api/assessment — Save an assessment result (requires auth)
// ─────────────────────────────────────────────────────────────

router.post('/', authRequired, async (req, res) => {
  try {
    const {
      archetypeKey,
      supportGroup,
      extendedArchetypeName,
      oceanScores,
      responses,
      subjectResults,
      scores,
      archetypeDetails,
      harmonyScore,
      consciousnessLevel,
      overallShadow,
      aiProvider,
      aiModel,
      analysis,
      promptTokens,
      completionTokens,
    } = req.body;

    if (!archetypeKey) {
      return res.status(400).json({ error: 'archetypeKey is required' });
    }

    const doc = {
      userId: req.user.userId,
      archetypeKey,
      supportGroup: supportGroup || null,
      extendedArchetypeName: extendedArchetypeName || null,
      oceanScores: oceanScores || null,
      responses: Array.isArray(responses) ? responses : [],
      subjectResults: Array.isArray(subjectResults) ? subjectResults : [],
      scores: scores || null,
      archetypeDetails: Array.isArray(archetypeDetails) ? archetypeDetails : null,
      harmonyScore: harmonyScore ?? null,
      consciousnessLevel: consciousnessLevel || null,
      overallShadow: overallShadow || null,
      aiProvider: aiProvider || null,
      aiModel: aiModel || null,
      analysis: analysis || null,
      promptTokens: promptTokens || 0,
      completionTokens: completionTokens || 0,
      pdfUrl: null,
      createdAt: new Date(),
    };

    const result = await collections.assessments().insertOne(doc);

    res.status(201).json({
      id: result.insertedId,
      ...doc,
    });
  } catch (err) {
    console.error('[Assessment] Save error:', err.message);
    res.status(500).json({ error: 'Failed to save assessment' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/assessment/history — List past assessments (requires auth)
// ─────────────────────────────────────────────────────────────

router.get('/history', authRequired, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = parseInt(req.query.skip) || 0;

    const assessments = await collections
      .assessments()
      .find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .project({
        archetypeKey: 1,
        supportGroup: 1,
        extendedArchetypeName: 1,
        aiProvider: 1,
        aiModel: 1,
        createdAt: 1,
      })
      .toArray();

    const total = await collections
      .assessments()
      .countDocuments({ userId: req.user.userId });

    res.json({ assessments, total, limit, skip });
  } catch (err) {
    console.error('[Assessment] History error:', err.message);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/assessment/review — Save assessment feedback (optional auth)
// ─────────────────────────────────────────────────────────────

router.post('/review', authOptional, async (req, res) => {
  console.log('[Assessment] POST /review received');
  try {
    const {
      assessmentId,
      email,
      whatWorked,
      whatDidntWork,
      suggestions,
      archetypeKey,
      timestamp,
    } = req.body;

    console.log('[Assessment] Review data:', { assessmentId, whatWorked: whatWorked?.slice(0, 50), archetypeKey });

    // Validate at least one field is filled
    if (!whatWorked?.trim() && !whatDidntWork?.trim() && !suggestions?.trim()) {
      console.log('[Assessment] ❌ Review validation failed — no data provided');
      return res.status(400).json({ error: 'At least one feedback field is required' });
    }

    // Create review document
    const review = {
      userId: req.user?.userId || null,
      email: email?.trim() || null,
      assessmentId: assessmentId || 'anonymous',
      archetypeKey: archetypeKey || null,
      whatWorked: whatWorked?.trim() || '',
      whatDidntWork: whatDidntWork?.trim() || '',
      suggestions: suggestions?.trim() || '',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      userAgent: req.get('user-agent'),
    };

    const result = await collections.assessmentReviews().insertOne(review);
    console.log('[Assessment] ✅ Review saved:', result.insertedId);

    res.status(201).json({
      id: result.insertedId,
      ...review,
    });
  } catch (err) {
    console.error('[Assessment] ❌ Review save error:', err.message);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/assessment/:id — Get single assessment (requires auth)
// ─────────────────────────────────────────────────────────────

router.get('/:id', authRequired, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    const assessment = await collections.assessments().findOne({
      _id: new ObjectId(req.params.id),
      userId: req.user.userId, // ensure user owns it
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (err) {
    console.error('[Assessment] Get error:', err.message);
    res.status(500).json({ error: 'Failed to load assessment' });
  }
});

module.exports = router;
