/**
 * Garden For Life — PDF Routes (Module 4)
 *
 * GET /api/pdf/:assessmentId  — Generate & download PDF for a saved assessment
 */
const { Router } = require('express');
const { ObjectId } = require('mongodb');
const { collections } = require('../db');
const { authRequired } = require('../middleware/auth');
const { generatePdf } = require('../services/pdfGenerator');

const router = Router();

// All PDF routes require auth
router.use(authRequired);

// ─────────────────────────────────────────────────────────────
// GET /api/pdf/:assessmentId — Generate PDF for assessment
// ─────────────────────────────────────────────────────────────

router.get('/:assessmentId', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.assessmentId)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    // Build query — admins can download any user's PDF
    const query = { _id: new ObjectId(req.params.assessmentId) };
    if (req.user.role !== 'admin') {
      query.userId = req.user.userId;
    }

    const assessment = await collections.assessments().findOne(query);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const pdfBuffer = await generatePdf(assessment);

    const filename = `GFL-${(assessment.extendedArchetypeName || assessment.archetypeKey || 'Assessment').replace(/\s+/g, '_')}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error('[PDF] Generation error:', err.message);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

module.exports = router;
