/**
 * Garden For Life — Admin Routes
 *
 * All routes require admin role.
 * Manages: users, assessment overview, AI prompt configuration.
 *
 * GET    /api/admin/users            — List all users
 * PATCH  /api/admin/users/:id/role   — Change user role
 * DELETE /api/admin/users/:id        — Delete a user and their assessments
 * GET    /api/admin/assessments      — List all assessments (any user)
 * GET    /api/admin/assessments/:id  — Get full assessment detail (any user)
 * DELETE /api/admin/assessments/:id  — Delete an assessment
 * GET    /api/admin/stats            — Dashboard stats
 * GET    /api/admin/prompts          — Get AI prompt config
 * PUT    /api/admin/prompts          — Update AI prompt config
 */
const { Router } = require('express');
const { ObjectId } = require('mongodb');
const { collections, getDB } = require('../db');
const { authRequired, adminRequired } = require('../middleware/auth');
const { decryptUser, decryptUsers, decrypt } = require('../services/encryption');

const router = Router();

// All admin routes need auth + admin
router.use(authRequired, adminRequired);

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats — Dashboard overview
// ─────────────────────────────────────────────────────────────

router.get('/stats', async (_req, res) => {
  try {
    const [userCount, assessmentCount, recentAssessments] = await Promise.all([
      collections.users().countDocuments(),
      collections.assessments().countDocuments(),
      collections.assessments()
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .project({ archetypeKey: 1, extendedArchetypeName: 1, userId: 1, createdAt: 1 })
        .toArray(),
    ]);

    res.json({ userCount, assessmentCount, recentAssessments });
  } catch (err) {
    console.error('[Admin] Stats error:', err.message);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users — List all users
// ─────────────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = parseInt(req.query.skip) || 0;

    const users = await collections.users()
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .project({ passwordHash: 0 })
      .toArray();

    const total = await collections.users().countDocuments();

    // Decrypt PII fields before sending to admin
    res.json({ users: decryptUsers(users), total, limit, skip });
  } catch (err) {
    console.error('[Admin] Users error:', err.message);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/role — Change user role
// ─────────────────────────────────────────────────────────────

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['client', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "client" or "admin"' });
    }

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Prevent removing your own admin
    if (req.params.id === req.user.userId && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }

    const result = await collections.users().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, userId: req.params.id, role });
  } catch (err) {
    console.error('[Admin] Role change error:', err.message);
    res.status(500).json({ error: 'Failed to change role' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id — Delete a user and their assessments
// ─────────────────────────────────────────────────────────────

router.delete('/users/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Prevent deleting yourself
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const userId = req.params.id;

    // Delete user's assessments first
    const assessmentResult = await collections.assessments().deleteMany({ userId });

    // Delete the user
    const userResult = await collections.users().deleteOne({ _id: new ObjectId(userId) });

    if (userResult.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] Deleted user ${userId} and ${assessmentResult.deletedCount} assessments`);
    res.json({ success: true, deletedUserId: userId, deletedAssessments: assessmentResult.deletedCount });
  } catch (err) {
    console.error('[Admin] Delete user error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/assessments — List all assessments
// ─────────────────────────────────────────────────────────────

router.get('/assessments', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = parseInt(req.query.skip) || 0;

    const assessments = await collections.assessments()
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .project({
        userId: 1,
        archetypeKey: 1,
        supportGroup: 1,
        extendedArchetypeName: 1,
        aiProvider: 1,
        aiModel: 1,
        createdAt: 1,
      })
      .toArray();

    const total = await collections.assessments().countDocuments();

    res.json({ assessments, total, limit, skip });
  } catch (err) {
    console.error('[Admin] Assessments error:', err.message);
    res.status(500).json({ error: 'Failed to load assessments' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/assessments/:id — Get full assessment detail
// ─────────────────────────────────────────────────────────────

router.get('/assessments/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    const assessment = await collections.assessments().findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Lookup user display name
    const user = await collections.users().findOne(
      { _id: new ObjectId(assessment.userId) },
      { projection: { displayName: 1, email: 1 } }
    );

    // Decrypt user PII
    const decryptedUser = user ? decryptUser(user) : null;

    res.json({ ...assessment, userDisplayName: decryptedUser?.displayName, userEmail: decryptedUser?.email });
  } catch (err) {
    console.error('[Admin] Assessment detail error:', err.message);
    res.status(500).json({ error: 'Failed to load assessment detail' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/assessments/:id — Delete an assessment
// ─────────────────────────────────────────────────────────────

router.delete('/assessments/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    const result = await collections.assessments().deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    console.log(`[Admin] Deleted assessment ${req.params.id}`);
    res.json({ success: true, deletedId: req.params.id });
  } catch (err) {
    console.error('[Admin] Delete assessment error:', err.message);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/prompts — Get AI prompt configuration
// ─────────────────────────────────────────────────────────────

router.get('/prompts', async (_req, res) => {
  try {
    const config = await promptsCollection().findOne({ _id: 'default' });
    res.json(config || getDefaultPromptConfig());
  } catch (err) {
    console.error('[Admin] Get prompts error:', err.message);
    res.status(500).json({ error: 'Failed to load prompt config' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/prompts — Update AI prompt configuration
// ─────────────────────────────────────────────────────────────

router.put('/prompts', async (req, res) => {
  try {
    const { systemPromptTemplate, userPromptTemplate, defaultProvider, defaultModel, temperature, maxTokens } = req.body;

    const update = {
      ...(systemPromptTemplate !== undefined && { systemPromptTemplate }),
      ...(userPromptTemplate !== undefined && { userPromptTemplate }),
      ...(defaultProvider !== undefined && { defaultProvider }),
      ...(defaultModel !== undefined && { defaultModel }),
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { maxTokens }),
      updatedAt: new Date(),
      updatedBy: req.user.userId,
    };

    await promptsCollection().updateOne(
      { _id: 'default' },
      { $set: update },
      { upsert: true }
    );

    const config = await promptsCollection().findOne({ _id: 'default' });
    res.json(config);
  } catch (err) {
    console.error('[Admin] Update prompts error:', err.message);
    res.status(500).json({ error: 'Failed to update prompt config' });
  }
});

module.exports = router;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function promptsCollection() {
  return getDB().collection('promptConfigs');
}

function getDefaultPromptConfig() {
  return {
    _id: 'default',
    systemPromptTemplate:
      'Je bent een persoonlijke ontwikkelingscoach gespecialiseerd in Jungiaanse archetypen, ' +
      'het OCEAN (Big Five) persoonlijkheidsmodel, en neurobiologische persoonlijkheidstheorie. ' +
      'Je werkt voor Garden For Life, een bewustzijnsplatform.\n\n' +
      'Antwoord altijd in het Nederlands tenzij de gebruiker in het Engels schrijft. ' +
      'Wees empathisch, genuanceerd en concreet. Vermijd vage algemeenheden.',
    userPromptTemplate:
      'Geef een diepgaande persoonlijkheidsanalyse voor het archetype {archetypeKey} ' +
      'met steungroep {supportGroup}. Gebruik de OCEAN-dimensies en neurobiologische inzichten. ' +
      'Geef concrete adviezen voor persoonlijke groei en individuatie.',
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2048,
    updatedAt: null,
    updatedBy: null,
  };
}
