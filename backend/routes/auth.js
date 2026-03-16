/**
 * Garden For Life — Auth Routes
 *
 * POST /api/auth/register  — Create account (email + password)
 * POST /api/auth/login     — Login, returns JWT
 * GET  /api/auth/me        — Get current user (auth required)
 */
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const config = require('../config');
const { collections, getDB } = require('../db');
const { authRequired } = require('../middleware/auth');
const { encrypt, decrypt, hash, decryptUser } = require('../services/encryption');

const router = Router();

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase();
    const emailHash = hash(normalizedEmail);

    // Check for existing user by deterministic hash (encrypted email can't be searched)
    const existing = await collections.users().findOne({ emailHash });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    // First user ever gets admin role; all others are clients
    const userCount = await collections.users().countDocuments();
    const role = userCount === 0 ? 'admin' : 'client';

    const resolvedDisplayName = displayName || normalizedEmail.split('@')[0];

    const result = await collections.users().insertOne({
      emailHash,                             // deterministic — for lookups
      email: encrypt(normalizedEmail),       // encrypted PII
      displayName: encrypt(resolvedDisplayName), // encrypted PII
      passwordHash,
      role,
      createdAt: now,
      updatedAt: now,
    });

    const token = signToken(result.insertedId, normalizedEmail, role);

    res.status(201).json({
      token,
      user: {
        id: result.insertedId,
        email: normalizedEmail,
        displayName: resolvedDisplayName,
        role,
      },
    });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const emailHash = hash(normalizedEmail);

    // Lookup by deterministic hash (encrypted email can't be searched)
    const user = await collections.users().findOne({ emailHash });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Decrypt PII for the response
    const decryptedEmail = decrypt(user.email);
    const decryptedDisplayName = decrypt(user.displayName);
    const token = signToken(user._id, decryptedEmail, user.role || 'client');

    // Audit log: record admin logins asynchronously (fire-and-forget)
    if (user.role === 'admin') {
      getDB().collection('devActivity').insertOne({
        type: 'admin_login',
        timestamp: new Date(),
        userId: String(user._id),
        email: decryptedEmail,
        message: '', branch: '', hash: '', reportId: null, reportType: '',
        userAgent: req.get('user-agent') || '',
      }).catch((err) => console.warn('[Auth] Audit log failed:', err.message));
    }

    res.json({
      token,
      user: {
        id: user._id,
        email: decryptedEmail,
        displayName: decryptedDisplayName,
        role: user.role || 'client',
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me  (auth required)
// ─────────────────────────────────────────────────────────────

router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await collections.users().findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { passwordHash: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Decrypt PII fields before sending to client
    const decrypted = decryptUser(user);

    res.json({
      id: decrypted._id,
      email: decrypted.email,
      displayName: decrypted.displayName,
      role: decrypted.role || 'client',
      createdAt: decrypted.createdAt,
    });
  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/auth/account  (auth required)
// GDPR right-to-erasure: deletes the authenticated user's account,
// all their assessments, and all their assessment reviews.
// ─────────────────────────────────────────────────────────────

router.delete('/account', authRequired, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Prevent the sole admin from deleting themselves
    const user = await collections.users().findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin') {
      const adminCount = await collections.users().countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the only admin account' });
      }
    }

    // Delete all associated data
    const [assessmentResult, reviewResult] = await Promise.all([
      collections.assessments().deleteMany({ userId }),
      getDB().collection('assessmentReviews').deleteMany({ userId }),
    ]);

    // Delete the user record last
    await collections.users().deleteOne({ _id: new ObjectId(userId) });

    console.log(`[Auth] Account deleted: ${userId} — ${assessmentResult.deletedCount} assessments, ${reviewResult.deletedCount} reviews`);

    res.json({
      success: true,
      deletedAssessments: assessmentResult.deletedCount,
      deletedReviews: reviewResult.deletedCount,
    });
  } catch (err) {
    console.error('[Auth] Delete account error:', err.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────

function signToken(userId, email, role) {
  return jwt.sign(
    { sub: userId.toString(), email, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}
