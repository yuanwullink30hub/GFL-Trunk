/**
 * Garden For Life — Assessment Routes
 *
 * POST /api/assessment          — Save assessment result
 * GET  /api/assessment/history  — List user's past assessments
 * GET  /api/assessment/:id      — Get single assessment detail
 */
const { Router } = require('express');
const { ObjectId } = require('mongodb');
const { collections } = require('../db');
const { authRequired } = require('../middleware/auth');

const router = Router();

// All assessment routes require auth
router.use(authRequired);

// ─────────────────────────────────────────────────────────────
// POST /api/assessment — Save an assessment result
// ─────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const {
      archetypeKey,
      supportGroup,
      extendedArchetypeName,
      oceanScores,
      responses,
      subjectResults,
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
// GET /api/assessment/history — List past assessments
// ─────────────────────────────────────────────────────────────

router.get('/history', async (req, res) => {
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
// GET /api/assessment/:id — Get single assessment
// ─────────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
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
