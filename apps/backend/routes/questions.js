/**
 * Garden For Life — Assessment Questions Routes
 *
 * Questions are stored in MongoDB so admins can edit them from the website.
 * The frontend fetches questions from here instead of using hardcoded data.
 *
 * GET    /api/questions              — Get all questions (public, no auth)
 * GET    /api/questions/export       — Export as clean JSON (admin)
 * GET    /api/questions/export/docx  — Export as Word document (admin)
 * POST   /api/questions/seed         — Seed default questions into DB (admin only)
 * POST   /api/questions/seed?force=1 — Wipe + re-seed from backend code (admin)
 * POST   /api/questions/import       — Bulk import full JSON payload (admin)
 * POST   /api/questions/import/docx  — Import from Word document (admin)
 * PUT    /api/questions/layer/:i     — Update a full layer (admin only)
 * PUT    /api/questions/:id          — Update a single question (admin only)
 */
const { Router } = require('express');
const { collections } = require('../db');
const { authRequired, adminRequired } = require('../middleware/auth');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
        WidthType, BorderStyle, AlignmentType, ShadingType } = require('docx');
const mammoth = require('mammoth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/questions — Public: fetch all layers + questions
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
// POST /api/questions/seed — Admin: seed default questions
// ?force=1 → wipe existing and re-seed from backend code
// Without force → only works if collection is empty
// ─────────────────────────────────────────────────────────────

router.post('/seed', authRequired, adminRequired, async (req, res) => {
  try {
    const force = req.query.force === '1' || req.query.force === 'true';
    const count = await collections.questions().countDocuments();

    if (count > 0 && !force) {
      return res.status(409).json({
        error: 'Questions already seeded. Use ?force=1 to wipe and re-seed.',
        existing: count,
      });
    }

    if (count > 0 && force) {
      await collections.questions().deleteMany({});
      console.log(`[Questions] Force re-seed: deleted ${count} existing layers`);
    }

    const layers = getDefaultLayers();

    await collections.questions().insertMany(layers);
    console.log(`[Questions] Seeded ${layers.length} layers with questions`);

    res.json({ success: true, layersSeeded: layers.length, forced: force });
  } catch (err) {
    console.error('[Questions] Seed error:', err.message);
    res.status(500).json({ error: 'Failed to seed questions' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/questions/export — Admin: export clean JSON
// Strips MongoDB _id fields for easy re-import
// ─────────────────────────────────────────────────────────────

router.get('/export', authRequired, adminRequired, async (_req, res) => {
  try {
    const layers = await collections.questions()
      .find({})
      .sort({ layerIndex: 1 })
      .toArray();

    // Strip internal fields for clean export
    const clean = layers.map(({ _id, updatedAt, updatedBy, createdAt, ...rest }) => rest);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="gfl-questions-${Date.now()}.json"`);
    res.json(clean);
  } catch (err) {
    console.error('[Questions] Export error:', err.message);
    res.status(500).json({ error: 'Failed to export questions' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/questions/import — Admin: bulk import full JSON
// Expects body: { layers: [...] } — replaces ALL existing data
// ─────────────────────────────────────────────────────────────

router.post('/import', authRequired, adminRequired, async (req, res) => {
  try {
    const { layers } = req.body;

    if (!Array.isArray(layers) || layers.length === 0) {
      return res.status(400).json({ error: 'Body must contain a "layers" array with at least 1 layer' });
    }

    // Validate basic structure
    for (const layer of layers) {
      if (layer.layerIndex === undefined || !Array.isArray(layer.questions)) {
        return res.status(400).json({
          error: `Each layer must have layerIndex and questions array. Problem at: ${layer.name || 'unknown'}`,
        });
      }
      for (const q of layer.questions) {
        if (!q.id || !q.text || !Array.isArray(q.answers) || q.answers.length !== 6) {
          return res.status(400).json({
            error: `Each question needs id, text, and 6 answers. Problem at Q${q.id || '?'}`,
          });
        }
      }
    }

    // Wipe and replace — but carry over any English copy the payload omits.
    const existing = await collections.questions().find({}).toArray();
    const merged = preserveTranslations(layers, existing);
    await collections.questions().deleteMany({});

    const docs = merged.map((layer) => ({
      ...layer,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: req.user.userId,
    }));

    await collections.questions().insertMany(docs);
    console.log(`[Questions] Bulk imported ${docs.length} layers (${docs.reduce((s, l) => s + l.questions.length, 0)} questions)`);

    res.json({ success: true, layersImported: docs.length });
  } catch (err) {
    console.error('[Questions] Import error:', err.message);
    res.status(500).json({ error: 'Failed to import questions' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/questions/layer/:layerIndex — Admin: update an entire layer
// ─────────────────────────────────────────────────────────────

router.put('/layer/:layerIndex', authRequired, adminRequired, async (req, res) => {
  try {
    const layerIndex = parseInt(req.params.layerIndex);
    if (isNaN(layerIndex) || layerIndex < 0 || layerIndex > 4) {
      return res.status(400).json({ error: 'layerIndex must be 0-4' });
    }

    const updates = {};
    const allowed = ['name', 'title', 'subtitle', 'color', 'description', 'fundamental', 'questions',
                     'nameEn', 'titleEn', 'subtitleEn', 'descriptionEn', 'fundamentalEn'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updatedAt = new Date();
    updates.updatedBy = req.user.userId;

    const result = await collections.questions().updateOne(
      { layerIndex },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Layer not found. Run /seed first.' });
    }

    const layer = await collections.questions().findOne({ layerIndex });
    res.json(layer);
  } catch (err) {
    console.error('[Questions] Layer update error:', err.message);
    res.status(500).json({ error: 'Failed to update layer' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/questions/:questionId — Admin: update a single question
// Updates question text, domain, or individual answer texts.
// ─────────────────────────────────────────────────────────────

router.put('/:questionId', authRequired, adminRequired, async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    if (isNaN(questionId) || questionId < 1 || questionId > 60) {
      return res.status(400).json({ error: 'questionId must be 1-60' });
    }

    // Find which layer actually contains this question (don't assume 12/layer)
    const allLayers = await collections.questions().find({}).toArray();
    let layer = null;
    let questionIdx = -1;
    for (const l of allLayers) {
      const idx = l.questions.findIndex(q => q.id === questionId);
      if (idx !== -1) { layer = l; questionIdx = idx; break; }
    }
    if (!layer) {
      return res.status(404).json({ error: `Question ${questionId} not found in any layer. Run /seed first.` });
    }
    const layerIndex = layer.layerIndex;

    // Build update
    const { text, textEn, domain, answers } = req.body;
    const setOps = {};

    if (text !== undefined) {
      setOps[`questions.${questionIdx}.text`] = text;
    }
    if (textEn !== undefined) {
      setOps[`questions.${questionIdx}.textEn`] = textEn;
    }
    if (domain !== undefined) {
      setOps[`questions.${questionIdx}.domain`] = domain;
    }
    if (answers !== undefined && Array.isArray(answers)) {
      // Update individual answer texts (preserve id, value, archetype)
      answers.forEach((a, i) => {
        if (a.text !== undefined) {
          setOps[`questions.${questionIdx}.answers.${i}.text`] = a.text;
        }
        if (a.textEn !== undefined) {
          setOps[`questions.${questionIdx}.answers.${i}.textEn`] = a.textEn;
        }
      });
    }

    if (Object.keys(setOps).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    setOps.updatedAt = new Date();
    setOps.updatedBy = req.user.userId;

    await collections.questions().updateOne({ layerIndex }, { $set: setOps });

    // Return updated layer
    const updated = await collections.questions().findOne({ layerIndex });
    const updatedQuestion = updated.questions.find(q => q.id === questionId);

    res.json({ success: true, question: updatedQuestion });
  } catch (err) {
    console.error('[Questions] Question update error:', err.message);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/questions/export/docx — Admin: export as Word document
// Generates a styled .docx with all layers and questions
// ─────────────────────────────────────────────────────────────

router.get('/export/docx', authRequired, adminRequired, async (_req, res) => {
  try {
    const layers = await collections.questions()
      .find({})
      .sort({ layerIndex: 1 })
      .toArray();

    if (layers.length === 0) {
      return res.status(404).json({ error: 'No questions found. Seed first.' });
    }

    const children = [];

    // Title page
    children.push(
      new Paragraph({
        text: 'Garden For Life — Assessment Vragen',
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Geëxporteerd: ${new Date().toLocaleString('nl-NL')}`, italics: true, size: 20, color: '888888' }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Dit document bevat alle assessment vragen. Bewerk de teksten en importeer opnieuw via het admin dashboard.', size: 22 }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'FORMAT REGELS:', bold: true, size: 22 }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• Verander NIET de structuur markering teksten: [LAAG ...], [VRAAG ...], [A], [B], etc.', size: 20 }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• U mag de vraagteksten en antwoordteksten vrij aanpassen.', size: 20 }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '• Het domein (bijv. O, C, E, A, N) mag worden gewijzigd.', size: 20 }),
        ],
        spacing: { after: 400 },
      })
    );

    // Each layer
    for (const layer of layers) {
      // Layer header
      children.push(
        new Paragraph({
          text: `[LAAG ${layer.layerIndex}] ${layer.name} — ${layer.title}`,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 100 },
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFF3D4' },
        })
      );

      if (layer.subtitle) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: layer.subtitle, italics: true, size: 20, color: '666666' })],
            spacing: { after: 200 },
          })
        );
      }

      // Each question
      for (const q of layer.questions) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `[VRAAG ${q.id}]`, bold: true, size: 24, color: 'B8860B' }),
              new TextRun({ text: `  Domein: ${q.domain}`, size: 20, color: '888888' }),
            ],
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: q.text, size: 22 })],
            spacing: { after: 150 },
          })
        );

        // Answers as a table
        const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const rows = q.answers.map((a, i) => {
          return new TableRow({
            children: [
              new TableCell({
                width: { size: 800, type: WidthType.DXA },
                children: [new Paragraph({
                  children: [new TextRun({ text: `[${answerLetters[i]}]`, bold: true, size: 20 })],
                  alignment: AlignmentType.CENTER,
                })],
                shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F5F5F5' },
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                           bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                           left: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                           right: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' } },
              }),
              new TableCell({
                width: { size: 1500, type: WidthType.DXA },
                children: [new Paragraph({
                  children: [new TextRun({ text: a.archetype || '', size: 18, italics: true, color: '999999' })],
                })],
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                           bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                           left: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                           right: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' } },
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: a.text, size: 20 })],
                })],
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                           bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                           left: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
                           right: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' } },
              }),
            ],
          });
        });

        children.push(
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );

        children.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      }
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Calibri', size: 22 },
          },
        },
      },
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="gfl-vragen-${Date.now()}.docx"`);
    res.send(buffer);
  } catch (err) {
    console.error('[Questions] DOCX export error:', err.message);
    res.status(500).json({ error: 'Failed to export Word document' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/questions/import/docx — Admin: import from Word document
// Parses .docx using ONDERWERP / Q / bullet-answer markers
//
// Expected format:
//   ONDERWERP 1: ZELF / ZONDE (Nederlandse Spreekwoorden Editie)
//   Q1: Question text here?
//   •  A [Judge - 1 - Nature]: "Quoted prefix." Answer text (Label).
//   •  B [Lover - 2 - Culture]: Answer text (Label).
//   ...F
//   Q2: Next question...
//   ONDERWERP 2: ...
// ─────────────────────────────────────────────────────────────

router.post('/import/docx', authRequired, adminRequired, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Send a .docx file as "file" field.' });
    }

    // Extract raw text from Word doc
    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const text = result.value;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Parse structure using markers
    const layers = [];
    let currentLayer = null;
    let currentQuestion = null;

    // ONDERWERP 1: ZELF / ZONDE (Nederlandse Spreekwoorden Editie)
    const onderwerpRegex = /^ONDERWERP\s+(\d+)\s*:\s*(.+)$/i;

    // Q1: Question text   or   Q12: Question text
    const questionRegex = /^Q(\d+)\s*:\s*(.+)$/i;

    // •  A [Judge - 1 - Nature]: answer text   or   A [Judge - 1 - Nature]: answer text
    // Also handles missing bullet: A [...]: text
    const answerRegex = /^[•·\-\*]?\s*([A-F])\s*\[([^\]]*)\]\s*:\s*(.+)$/i;

    // Archetype tag parser: "Judge - 1 - Nature" → { archetype, position, bucket }
    function parseArchetypeTag(tag) {
      const parts = tag.split('-').map(s => s.trim());
      return {
        archetype: (parts[0] || '').toUpperCase(),
        position: parseInt(parts[1]) || 0,
        bucket: (parts[2] || '').toUpperCase(), // NATURE or CULTURE
      };
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for ONDERWERP marker (layer/subject)
      const onderwerpMatch = line.match(onderwerpRegex);
      if (onderwerpMatch) {
        // Push last question of previous layer
        if (currentQuestion && currentLayer) {
          currentLayer.questions.push(currentQuestion);
          currentQuestion = null;
        }

        const layerNum = parseInt(onderwerpMatch[1]);
        const layerIndex = layerNum - 1; // ONDERWERP 1 → layerIndex 0
        const rawName = onderwerpMatch[2].trim();

        // Split on common separators: "ZELF / ZONDE (label)" or "RELATIE — Verbinding"
        // Extract parenthetical edition label if present
        const editionMatch = rawName.match(/\(([^)]+)\)\s*$/);
        const nameWithoutEdition = editionMatch ? rawName.slice(0, editionMatch.index).trim() : rawName;

        currentLayer = {
          layerIndex,
          name: nameWithoutEdition,
          title: rawName,
          subtitle: editionMatch ? editionMatch[1] : '',
          questions: [],
        };
        layers.push(currentLayer);
        continue;
      }

      // Check for Q marker (question)
      const questionMatch = line.match(questionRegex);
      if (questionMatch) {
        // Push previous question
        if (currentQuestion && currentLayer) {
          currentLayer.questions.push(currentQuestion);
        }

        const qId = parseInt(questionMatch[1]);
        const questionText = questionMatch[2].trim();

        currentQuestion = {
          id: qId,
          text: questionText,
          domain: '',
          answers: [],
        };
        continue;
      }

      // Check for answer marker (• A [...]: text)
      const answerMatch = line.match(answerRegex);
      if (answerMatch && currentQuestion) {
        const letter = answerMatch[1].toUpperCase();
        const tag = answerMatch[2];
        const answerText = answerMatch[3].trim();
        const letterIndex = letter.charCodeAt(0) - 65; // A=0, B=1, ...F=5

        const parsed = parseArchetypeTag(tag);

        currentQuestion.answers[letterIndex] = {
          id: `${currentQuestion.id}${letter.toLowerCase()}`,
          text: `[${tag}] ${answerText}`,  // Store full text with metadata (stripped on frontend)
          value: letterIndex + 1,
          archetype: parsed.archetype,
        };
        continue;
      }

      // Continuation text: if in a question and no answers yet, append to question text
      if (currentQuestion && currentQuestion.answers.length === 0) {
        if (line.length > 2) {
          currentQuestion.text = currentQuestion.text
            ? currentQuestion.text + ' ' + line
            : line;
        }
      }
    }

    // Push last question
    if (currentQuestion && currentLayer) {
      currentLayer.questions.push(currentQuestion);
    }

    if (layers.length === 0) {
      return res.status(400).json({
        error: 'Geen ONDERWERP markers gevonden in dit document. Verwacht formaat: "ONDERWERP 1: Naam"',
      });
    }

    // Recover layer metadata (colors, descriptions) from existing DB data if available
    const existingLayers = await collections.questions().find({}).sort({ layerIndex: 1 }).toArray();

    // If archetypes are missing from the document, fall back to rotation key computation
    let totalQuestions = 0;
    for (const layer of layers) {
      const existing = existingLayers.find(l => l.layerIndex === layer.layerIndex);
      if (existing) {
        layer.color = layer.color || existing.color;
        layer.description = layer.description || existing.description;
        layer.fundamental = layer.fundamental || existing.fundamental;
        if (!layer.subtitle && existing.subtitle) layer.subtitle = existing.subtitle;
      }

      // Default colors for each layer if no existing data
      if (!layer.color) {
        const defaultColors = ['#22d3ee', '#a855f7', '#f472b6', '#fbbf24', '#f97316'];
        layer.color = defaultColors[layer.layerIndex] || '#22d3ee';
      }

      for (const q of layer.questions) {
        // Fill missing archetypes from rotation key computation
        for (let i = 0; i < q.answers.length; i++) {
          const a = q.answers[i];
          if (!a || !a.archetype) {
            const letter = String.fromCharCode(97 + i);
            const computed = getArchetypeForAnswer(q.id, i);
            if (!a) {
              q.answers[i] = {
                id: `${q.id}${letter}`,
                text: '',
                value: i + 1,
                archetype: computed,
              };
            } else {
              a.archetype = computed;
            }
          }
        }

        // Ensure exactly 6 answers
        while (q.answers.length < 6) {
          const idx = q.answers.length;
          const letter = String.fromCharCode(97 + idx);
          q.answers.push({
            id: `${q.id}${letter}`,
            text: '',
            value: idx + 1,
            archetype: getArchetypeForAnswer(q.id, idx),
          });
        }

        totalQuestions++;
      }
    }

    // Replace in database — the Word document carries no English, so merge the
    // existing translations back in rather than losing them.
    const existing = await collections.questions().find({}).toArray();
    const mergedLayers = preserveTranslations(layers, existing);
    await collections.questions().deleteMany({});
    const docs = mergedLayers.map((layer) => ({
      ...layer,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: req.user.userId,
    }));
    await collections.questions().insertMany(docs);

    console.log(`[Questions] Word import: ${layers.length} layers, ${totalQuestions} questions`);
    res.json({
      success: true,
      layersImported: layers.length,
      questionsImported: totalQuestions,
    });
  } catch (err) {
    console.error('[Questions] DOCX import error:', err.message);
    res.status(500).json({ error: `Failed to import Word document: ${err.message}` });
  }
});

module.exports = router;
// Exposed for scripts/backfill-question-translations.js (the non-destructive EN backfill).
module.exports.getDefaultLayers = () => getDefaultLayers();

// ─────────────────────────────────────────────────────────────
// Default Question Data (for seeding)
// ─────────────────────────────────────────────────────────────

// Archetype Sets (Neuraal Schakelbord — must match frontend assessmentData.js)
// Set Alpha (odd steps 1&3): positions 1,2,4,6,8,10 on the wheel
const SET_A = ['JUDGE', 'LOVER', 'INNOCENT', 'OUTLAW', 'SAGE', 'MAGICIAN'];
// Set Beta (even steps 2&4): positions 12,3,5,7,9,11 on the wheel
const SET_B = ['RULER', 'CAREGIVER', 'EXPLORER', 'TRICKSTER', 'ARTIST', 'HERO'];

const PATTERNS = [
  [0, 1, 2, 3, 4, 5], // Stap 1 — Set A Base: De Grondhouding (A→1, B→2, C→4, D→6, E→8, F→10)
  [0, 1, 2, 3, 4, 5], // Stap 2 — Set B Base: De Grondhouding (A→12, B→3, C→5, D→7, E→9, F→11)
  [5, 0, 1, 2, 3, 4], // Stap 3 — Set A +1 Shift: De Spiegeling (A→10, B→1, C→2, D→4, E→6, F→8)
  [5, 0, 1, 2, 3, 4], // Stap 4 — Set B +1 Shift: De Spiegeling (A→11, B→12, C→3, D→5, E→7, F→9)
];

function getArchetypeForAnswer(questionNum, answerPos) {
  const isOdd = questionNum % 2 !== 0;
  const set = isOdd ? SET_A : SET_B;
  const patternIndex = (questionNum - 1) % 4;
  return set[PATTERNS[patternIndex][answerPos]];
}

/**
 * Carry English copy across a wipe-and-replace import.
 *
 * The JSON and DOCX import paths replace the whole collection, but neither the
 * Word document nor a hand-built JSON payload necessarily carries the `*En`
 * fields. Without this merge an admin who exports to Word, edits one question
 * and re-imports would silently drop every English translation in the bank.
 *
 * Incoming values always win; existing English is only used to fill a gap.
 * Matching is by the stable ids (layerId/layerIndex, question id, answer id),
 * so reordering is safe and unmatched entries are simply left alone.
 */
function preserveTranslations(incomingLayers, existingLayers) {
  const LAYER_EN = ['nameEn', 'titleEn', 'subtitleEn', 'fundamentalEn', 'descriptionEn'];
  const byLayer = new Map();
  for (const l of existingLayers || []) {
    if (l.layerId) byLayer.set(String(l.layerId), l);
    if (l.layerIndex !== undefined) byLayer.set(`idx:${l.layerIndex}`, l);
  }

  return (incomingLayers || []).map((layer) => {
    const prev = byLayer.get(String(layer.layerId)) || byLayer.get(`idx:${layer.layerIndex}`);
    if (!prev) return layer;

    const merged = { ...layer };
    for (const k of LAYER_EN) {
      if (merged[k] === undefined && prev[k] !== undefined) merged[k] = prev[k];
    }

    const prevQ = new Map((prev.questions || []).map((q) => [String(q.id), q]));
    merged.questions = (layer.questions || []).map((q) => {
      const pq = prevQ.get(String(q.id));
      if (!pq) return q;
      const mq = { ...q };
      if (mq.textEn === undefined && pq.textEn !== undefined) mq.textEn = pq.textEn;

      const prevA = new Map((pq.answers || []).map((a) => [String(a.id), a]));
      mq.answers = (q.answers || []).map((a) => {
        const pa = prevA.get(String(a.id));
        if (!pa || a.textEn !== undefined || pa.textEn === undefined) return a;
        return { ...a, textEn: pa.textEn };
      });
      return mq;
    });
    return merged;
  });
}

function ans(questionNum, pos, text, textEn) {
  const letter = String.fromCharCode(97 + pos);
  return {
    id: `${questionNum}${letter}`,
    text,
    textEn,
    value: pos + 1,
    archetype: getArchetypeForAnswer(questionNum, pos),
  };
}

// WARNING — this seed no longer matches production. As of 2026-09-08 the live
// collection holds a different, newer corpus: 36 questions (not 60), different
// wording, and no `layerId` field. Seeding with ?force=1 would REPLACE the real
// question bank with this older set. Treat this as bootstrap data for an empty
// database only. English for the live corpus lives in
// data/questionTranslations.en.json and is applied by
// scripts/backfill-question-translations.js.
function getDefaultLayers() {
  return [
    {
      layerId: 'layer-zelf',
      name: 'Zelf / Zonde',
      nameEn: 'Self / Sin',
      title: 'ZELF / ZONDE',
      titleEn: 'SELF / SIN',
      subtitle: 'De innerlijke wereld en haar grenzen',
      subtitleEn: 'The inner world and its boundaries',
      color: '#22d3ee',
      layerIndex: 0,
      fundamental: 'Fysiologische Standaarden',
      fundamentalEn: 'Physiological Standards',
      description: 'Onderzoek je innerlijke wereld, je grenzen en je relatie met het verleden.',
      descriptionEn: 'Examine your inner world, your boundaries and your relationship with the past.',
      createdAt: new Date(),
      questions: [
        { id: 1, text: 'Hoe bewaak je de grens tussen jouw rijke binnenwereld en de verwachtingen van de buitenwereld?', textEn: 'How do you guard the boundary between your rich inner world and the expectations of the outside world?', domain: 'introversie', answers: [
          ans(1,0,'Ik gebruik mijn binnenwereld als een laboratorium; ik trek me terug om de data van buiten te analyseren voordat ik reageer.','I use my inner world as a laboratory; I withdraw to analyse the data from outside before I respond.'),
          ans(1,1,'Ik zie mijn binnenwereld als een vesting; ik train mezelf in stilte om sterker en gedisciplineerder naar buiten te treden.','I see my inner world as a fortress; I train myself in silence so that I step out stronger and more disciplined.'),
          ans(1,2,'Ik vind de grens moeilijk; ik wil mijn diepste gevoelens delen, maar ben bang dat de rauwheid ervan de harmonie verstoort.','I find the boundary difficult; I want to share my deepest feelings, but I fear their rawness will disturb the harmony.'),
          ans(1,3,'De grens is mijn canvas; ik vertaal mijn innerlijke beelden naar buiten, zodat anderen mijn unieke realiteit kunnen zien.','The boundary is my canvas; I translate my inner images outward, so that others can see my unique reality.'),
          ans(1,4,'Ik bewaak de grens strak; mijn privéleven is een soeverein gebied waar ik alleen mensen toelaat die mijn regels respecteren.','I guard the boundary tightly; my private life is sovereign territory where I admit only people who respect my rules.'),
          ans(1,5,'Ik ervaar nauwelijks een grens; ik geloof dat als ik puur en eerlijk ben de wereld mij ook zo behandelt.','I barely experience a boundary; I believe that if I am pure and honest, the world will treat me that way too.'),
        ]},
        { id: 2, text: 'Hoe navigeer je door sociale hiërarchieën en ongeschreven groepsregels?', textEn: 'How do you navigate social hierarchies and unwritten group rules?', domain: 'introversie', answers: [
          ans(2,0,'Ik speel met de groepsbalans om mijn eigen plek vast te stellen, goedschiks of kwaadschiks.','I play with the balance of the group to establish my own place in it, by fair means or foul.'),
          ans(2,1,'Ik toets de structuur en vind overal wel wat van, ik krijg snel de neiging om te sturen in de ongeschreven regels.','I test the structure and have an opinion about everything; I quickly feel the urge to steer the unwritten rules.'),
          ans(2,2,'Ik relativeer de status; ik prik met humor door de opgeblazen ego\'s van de leiders heen.','I put status into perspective; I use humour to puncture the inflated egos of the leaders.'),
          ans(2,3,'Ik bemoei me er niet mee; ik observeer de vreemde gewoontes van de groep zonder er echt deel van te worden.','I keep out of it; I observe the group\'s strange habits without ever really becoming part of it.'),
          ans(2,4,'Ik voel instinctief weerstand; ik weiger mee te doen aan sociale spelletjes die mijn autonomie beperken.','I feel instinctive resistance; I refuse to join social games that limit my autonomy.'),
          ans(2,5,'Ik zoek naar degenen die buiten de boot vallen; mijn drang is om de buitenbeentjes op te vangen.','I look for the ones who fall outside the boat; my urge is to take in the odd ones out.'),
        ]},
        { id: 3, text: 'Wat is jouw natuurlijke rol in de sociale hiërarchie van een vriendengroep?', textEn: 'What is your natural role in the social hierarchy of a group of friends?', domain: 'introversie', answers: [
          ans(3,0,'De trouwe volger die vertrouwt op de goede bedoelingen van de groep.','The loyal follower who trusts in the good intentions of the group.'),
          ans(3,1,'De manager die de structuur neerzet en zorgt dat alles ordelijk verloopt.','The manager who sets up the structure and makes sure everything runs in an orderly way.'),
          ans(3,2,'De smaakmaker die de groep kleur geeft met explosieve energie en \'extreme\' ideeën.','The one who sets the tone, giving the group colour with explosive energy and \'extreme\' ideas.'),
          ans(3,3,'De verbinder die zorgt voor de emotionele harmonie en de vriendschappen in de groep.','The connector who looks after the emotional harmony and the friendships within the group.'),
          ans(3,4,'De stille kracht op de achtergrond, vaak een rol die onzichtbaar of onnodig is.','The quiet force in the background, often a role that feels invisible or unnecessary.'),
          ans(3,5,'De serieuze vriend, jij verrast je vrienden nog wel eens met de kennis die je in huis hebt.','The serious friend; you still surprise your friends now and then with the knowledge you carry.'),
        ]},
        { id: 4, text: 'Hoe draag je de \'belasting\' van de geschiedenis en voorouders met je mee?', textEn: 'How do you carry the \'burden\' of history and your ancestors with you?', domain: 'introversie', answers: [
          ans(4,0,'Als een wond die ik moet verzorgen; ik probeer de pijn van mijn familie en gemeenschap te helen met liefde.','As a wound I have to tend; I try to heal the pain of my family and community with love.'),
          ans(4,1,'Als een ketting die ik moet breken; ik weiger de fouten van mijn voorouders te herhalen.','As a chain I have to break; I refuse to repeat the mistakes of my ancestors.'),
          ans(4,2,'Als een zoektocht; ik moet uitzoeken wat van mij is en wat van hen, om mijn eigen pad te vinden.','As a search; I have to work out what is mine and what is theirs, in order to find my own path.'),
          ans(4,3,'Als een absurd verhaal; ik laat me niet raken door de zwaarte en bekijk het met een korrel zout.','As an absurd story; I don\'t let the heaviness get to me and take it with a pinch of salt.'),
          ans(4,4,'Als een balans; ik weeg wat er is gebeurd en probeer het onrecht uit het verleden recht te zetten.','As a balance; I weigh what has happened and try to set right the injustice of the past.'),
          ans(4,5,'Als brandstof; ik transformeer het oude verdriet in nieuwe kracht en wijsheid.','As fuel; I transform the old grief into new strength and wisdom.'),
        ]},
        { id: 5, text: 'Wat is jouw fundamentele houding tegenover \'Tekort\' versus \'Overvloed\'?', textEn: 'What is your fundamental attitude towards \'Scarcity\' versus \'Abundance\'?', domain: 'introversie', answers: [
          ans(5,0,'Ik zie het als een logische puzzel; ik wil de wetmatigheden begrijpen van hoe middelen verdeeld worden.','I see it as a logical puzzle; I want to understand the laws by which resources get distributed.'),
          ans(5,1,'Ik zie schaarste als een uitdaging die ik moet overwinnen door hard te werken en te presteren.','I see scarcity as a challenge to overcome through hard work and performance.'),
          ans(5,2,'Ik zie overvloed in de rijkdom van relaties; als we elkaar hebben, hebben we genoeg.','I see abundance in the richness of relationships; if we have each other, we have enough.'),
          ans(5,3,'Ik zie zoveel potentie in de leegte; met mijn creativiteit maak ik van niets iets bijzonders.','I see so much potential in emptiness; with my creativity I make something remarkable out of nothing.'),
          ans(5,4,'Ik zie een voorraad als iets dat ik moet beheren en strategisch moet verdelen.','I see a supply as something I have to manage and distribute strategically.'),
          ans(5,5,'Ik vertrouw erop dat er altijd genoeg zal zijn en dat er voor mij gezorgd wordt.','I trust that there will always be enough and that I will be taken care of.'),
        ]},
        { id: 6, text: 'Wat doet het besef van sterfelijkheid en de dood met jouw levenshouding?', textEn: 'What does the awareness of mortality and death do to your attitude to life?', domain: 'introversie', answers: [
          ans(6,0,'Het is een overgang; ik zie de dood als een transformatie naar een andere vorm van energie.','It is a passage; I see death as a transformation into another form of energy.'),
          ans(6,1,'Het roept de vraag op naar het eind-oordeel; heb ik rechtvaardig en integer geleefd?','It raises the question of the final judgement; have I lived justly and with integrity?'),
          ans(6,2,'Het laat zien hoe absurd onze zorgen zijn; ik lach om de ernst van het leven omdat het toch eindigt.','It shows how absurd our worries are; I laugh at the seriousness of life because it ends anyway.'),
          ans(6,3,'Het is de ultieme grens; de gedachte aan het einde drijft me om nu alles te ontdekken wat er is.','It is the ultimate boundary; the thought of the end drives me to discover everything there is, now.'),
          ans(6,4,'Het is de enige autoriteit die ik niet kan verslaan, dus ik leef radicaal vrij zolang het kan.','It is the one authority I cannot defeat, so I live radically free for as long as I can.'),
          ans(6,5,'Het maakt me beschermend; ik wil alles wat kwetsbaar is behoeden voor pijn en verlies.','It makes me protective; I want to shield everything vulnerable from pain and loss.'),
        ]},
        { id: 7, text: 'Hoe ga je om met strikte morele regels, religie of dogma\'s uit je opvoeding?', textEn: 'How do you deal with strict moral rules, religion or dogmas from your upbringing?', domain: 'introversie', answers: [
          ans(7,0,'Ik vertrouw op de intentie ervan en vaker wel dan niet volg ik ze blindelings.','I trust the intention behind them and more often than not I follow them blindly.'),
          ans(7,1,'Ik omarm ze als noodzakelijk; zonder morele wetten en vrees voor oordeel vervalt de mens in chaos.','I embrace them as necessary; without moral laws and the fear of judgement, people fall into chaos.'),
          ans(7,2,'Ik zie ze als referentie waarbuiten ik zoek naar mijn eigen, unieke vrijheid.','I see them as a reference point, beyond which I search for my own, unique freedom.'),
          ans(7,3,'Ik volg ze om de harmonie te bewaren; ik wil niemand kwetsen of de relatie verstoren.','I follow them to preserve the harmony; I don\'t want to hurt anyone or damage the relationship.'),
          ans(7,4,'Ik volg plichtsgetrouw morele regels zolang ze in lijn staan met mijn eigen ervaring.','I follow moral rules dutifully as long as they line up with my own experience.'),
          ans(7,5,'Ik analyseer ze eerst; ik volg ze alleen als ik de logica en het nut ervan begrijp.','I analyse them first; I only follow them if I understand their logic and their use.'),
        ]},
        { id: 8, text: 'Waarom heb je behoefte aan momenten van stilte en afzondering?', textEn: 'Why do you need moments of silence and solitude?', domain: 'introversie', answers: [
          ans(8,0,'Om op te laden, zodat ik daarna weer met volle energie voor anderen kan zorgen.','To recharge, so that afterwards I can care for others with full energy again.'),
          ans(8,1,'Om te ontsnappen aan de druk van de maatschappij en mijn autonomie te voelen.','To escape the pressure of society and feel my autonomy.'),
          ans(8,2,'Om op expeditie te gaan in mijn eigen geest en nieuwe ideeën te ontdekken.','To go on expedition through my own mind and discover new ideas.'),
          ans(8,3,'Om even mijn masker af te zetten en niet mee te hoeven doen aan het sociale spel.','To take off my mask for a while and not have to join in the social game.'),
          ans(8,4,'Om mijn eigen gedrag en keuzes in alle rust te toetsen aan mijn geweten.','To weigh my own behaviour and choices against my conscience in complete quiet.'),
          ans(8,5,'Om mijn innerlijke energie te focussen en te transformeren zonder afleiding.','To focus and transform my inner energy without distraction.'),
        ]},
        { id: 9, text: 'Welke invloed heeft je opvoeding op wie je nu bent?', textEn: 'What influence has your upbringing had on who you are now?', domain: 'introversie', answers: [
          ans(9,0,'Het heeft me de kennis gegeven waarmee ik de wereld nu begrijp en analyseer.','It gave me the knowledge with which I now understand and analyse the world.'),
          ans(9,1,'Het was de training die mij sterk heeft gemaakt en heeft geleerd om door te zetten.','It was the training that made me strong and taught me to persevere.'),
          ans(9,2,'Het heeft me geleerd hoe belangrijk liefde en verbinding zijn in het leven.','It taught me how important love and connection are in life.'),
          ans(9,3,'Het heeft me de ruimte gegeven (of juist niet) om mijn eigen unieke vorm te maken.','It gave me the room (or precisely didn\'t) to shape my own unique form.'),
          ans(9,4,'Het heeft me de structuur geboden die ik nu gebruik om mijn eigen leven te leiden.','It offered me the structure I now use to run my own life.'),
          ans(9,5,'Het heeft me het basisvertrouwen gegeven in mensen.','It gave me a basic trust in people.'),
        ]},
        { id: 10, text: 'Hoe ervaar je de constante prikkels van de moderne wereld?', textEn: 'How do you experience the constant stimuli of the modern world?', domain: 'introversie', answers: [
          ans(10,0,'Als een stroom van energie die ik kan sturen en gebruiken voor mijn doelen.','As a stream of energy I can steer and put to work for my own aims.'),
          ans(10,1,'Als chaotisch; ik probeer de ruis te filteren om te zien wat echt waar en belangrijk is.','As chaotic; I try to filter out the noise to see what is really true and important.'),
          ans(10,2,'Als een kermis; ik laat me niet gek maken en pik eruit wat ik leuk vind.','As a funfair; I don\'t let it rattle me and pick out what I enjoy.'),
          ans(10,3,'Als een oceaan van mogelijkheden waarin ik steeds nieuwe dingen kan vinden.','As an ocean of possibilities in which I can keep finding new things.'),
          ans(10,4,'Als een dwingend systeem waar ik me bewust voor afsluit om mezelf te blijven.','As a coercive system I deliberately shut out in order to stay myself.'),
          ans(10,5,'Als vermoeiend, omdat ik steeds voel waar anderen behoefte aan hebben.','As exhausting, because I constantly feel what others need.'),
        ]},
        { id: 11, text: 'Wat betekent het voor jou om een fout te maken?', textEn: 'What does making a mistake mean to you?', domain: 'introversie', answers: [
          ans(11,0,'Een fout maakt me bang; ik voel me schuldig en hoop dat het me vergeven wordt.','A mistake frightens me; I feel guilty and hope that it will be forgiven.'),
          ans(11,1,'Ik oordeel zwaar en snel over fouten; ik wil graag direct ingrijpen om de stabiliteit te herstellen.','I judge mistakes harshly and quickly; I want to step in at once to restore stability.'),
          ans(11,2,'Een fout is een onverwachte wending; vaak ontstaan hieruit de mooiste creaties.','A mistake is an unexpected turn; the most beautiful creations often come out of it.'),
          ans(11,3,'Een fout is pijnlijk als het de ander kwetst; ik zoek direct naar herstel van de band.','A mistake hurts when it wounds the other; I look straight away for a way to repair the bond.'),
          ans(11,4,'Een fout is onvermijdelijk op de weg naar succes.','A mistake is unavoidable on the road to success.'),
          ans(11,5,'Een fout is data; het is noodzakelijke informatie om mijn inzicht te verbeteren.','A mistake is data; it is necessary information for improving my understanding.'),
        ]},
        { id: 12, text: 'Hoe kijk je naar autoriteit en machtsverhoudingen?', textEn: 'How do you look at authority and power relations?', domain: 'introversie', answers: [
          ans(12,0,'Macht is er om te dienen; wie de leiding heeft, moet zorgen voor de zwakkeren.','Power exists to serve; whoever leads must look after the weaker ones.'),
          ans(12,1,'Met wantrouwen; ik verzet me tegen iedereen die macht over mij probeert uit te oefenen.','With distrust; I resist anyone who tries to exercise power over me.'),
          ans(12,2,'Als grenzen die ik wil testen; ik ben benieuwd wat er gebeurt als ik eroverheen ga.','As boundaries I want to test; I\'m curious what happens when I cross them.'),
          ans(12,3,'Macht is een illusie; ik saboteer graag de opgeblazen ego\'s van leiders.','Power is an illusion; I enjoy sabotaging the inflated egos of leaders.'),
          ans(12,4,'Macht moet rechtvaardig zijn; ik accepteer autoriteit alleen als die integer handelt.','Power has to be just; I only accept authority that acts with integrity.'),
          ans(12,5,'Macht is energie; het is een middel om dingen in beweging te zetten en te veranderen.','Power is energy; it is a means to set things in motion and change them.'),
        ]},
      ],
    },
    {
      layerId: 'layer-ander',
      name: 'Ander / Attentie',
      nameEn: 'Other / Attention',
      title: 'ANDER / ATTENTIE',
      titleEn: 'OTHER / ATTENTION',
      subtitle: 'De dans met de ander en de groep',
      subtitleEn: 'The dance with the other and the group',
      color: '#a855f7',
      layerIndex: 1,
      fundamental: 'Zelfbeeld & Karakter',
      fundamentalEn: 'Self-Image & Character',
      description: 'Ontdek hoe je jezelf positioneert in teams, concurrentie en leiderschap.',
      descriptionEn: 'Discover how you position yourself in teams, competition and leadership.',
      createdAt: new Date(),
      questions: [
        { id: 13, text: 'Hoe positioneer jij jezelf in een team dat onder hoge druk staat?', textEn: 'How do you position yourself in a team under high pressure?', domain: 'extraversie', answers: [
          ans(13,0,'Als het brein; ik stap uit de hectiek om het overzicht te bewaren en de strategie te bepalen.','As the brain; I step out of the frenzy to keep the overview and set the strategy.'),
          ans(13,1,'Als de motor; ik werk twee keer zo hard als de rest om te zorgen dat we de deadline halen.','As the engine; I work twice as hard as the rest to make sure we hit the deadline.'),
          ans(13,2,'Als de lijm; ik let op de sfeer en zorg dat niemand onderdoor gaat aan de stress.','As the glue; I watch the atmosphere and make sure nobody buckles under the stress.'),
          ans(13,3,'Als de vernieuwer; ik zoek naar een onorthodoxe oplossing om de druk te verlichten.','As the innovator; I look for an unorthodox solution to relieve the pressure.'),
          ans(13,4,'Als de manager; ik neem de leiding, deel taken uit en bewaak de structuur.','As the manager; I take the lead, hand out tasks and guard the structure.'),
          ans(13,5,'Als de loyale soldaat; ik doe precies wat me gezegd wordt en klaag niet.','As the loyal soldier; I do exactly what I am told and don\'t complain.'),
        ]},
        { id: 14, text: 'Hoe ga je om met felle concurrentie en rivaliteit in je vakgebied?', textEn: 'How do you deal with fierce competition and rivalry in your field?', domain: 'extraversie', answers: [
          ans(14,0,'Ik verander het spel; door innovatie maak ik wat de concurrent doet irrelevant.','I change the game; through innovation I make what the competition does irrelevant.'),
          ans(14,1,'Ik vind concurrentie goed, zolang het maar eerlijk en volgens de regels gaat.','I think competition is good, as long as it is fair and by the rules.'),
          ans(14,2,'Ik neem het niet te serieus; winnen of verliezen is ook maar een momentopname.','I don\'t take it too seriously; winning or losing is only a snapshot in time.'),
          ans(14,3,'Ik zoek naar een niche waar nog niemand is; ik wil niet vechten, maar ontdekken.','I look for a niche where nobody else is; I don\'t want to fight, I want to discover.'),
          ans(14,4,'Ik wil de gevestigde orde omverwerpen; ik doe het totaal anders dan de rest.','I want to overturn the established order; I do it completely differently from the rest.'),
          ans(14,5,'Ik vind concurrentie lastig; ik werk liever samen en help anderen ook vooruit.','I find competition difficult; I would rather work together and help others get ahead too.'),
        ]},
        { id: 15, text: 'Wat doe je als je een kamer vol onbekenden binnenstapt op een netwerkevenement?', textEn: 'What do you do when you walk into a room full of strangers at a networking event?', domain: 'extraversie', answers: [
          ans(15,0,'Ik wacht rustig af en sta open voor iedereen die een praatje wil maken.','I wait calmly and stay open to anyone who wants to strike up a conversation.'),
          ans(15,1,'Ik straal autoriteit uit en zorg dat ik met de sleutelfiguren in gesprek kom.','I radiate authority and make sure I get talking to the key figures.'),
          ans(15,2,'Ik laat mezelf zien zoals ik ben en trek vanzelf mensen aan die daarbij passen.','I show myself as I am and naturally draw in the people who fit that.'),
          ans(15,3,'Ik zoek naar die ene persoon met wie ik echt een diepe klik voel.','I look for that one person with whom I feel a really deep click.'),
          ans(15,4,'Ik doe liever dingen alleen, als ik al met iemand wil praten dan de persoon die in lijn staan met mijn missie.','I would rather do things alone; if I do want to talk to someone, it is the person whose direction lines up with my mission.'),
          ans(15,5,'Ik observeer eerst de ruimte en stap berekend op mensen af.','I observe the room first and approach people in a calculated way.'),
        ]},
        { id: 16, text: 'Wat is je primaire reactie op een groot zakelijk falen of een crisis?', textEn: 'What is your primary reaction to a major business failure or a crisis?', domain: 'extraversie', answers: [
          ans(16,0,'Overweldigd door emotie, de energie die ik nog over heb gebruik ik om anderen te ondersteunen.','Overwhelmed by emotion; whatever energy I have left I use to support others.'),
          ans(16,1,'Snel geërgerd door menselijk falen en zet druk op de orde ongeacht wie of wat de oorzaak is.','Quickly irritated by human failure, and I press for order regardless of who or what caused it.'),
          ans(16,2,'Ik onderzoek wat er misging en zie het als springplank voor mijn volgende expeditie.','I investigate what went wrong and see it as a springboard for my next expedition.'),
          ans(16,3,'Ik maak een grap om de spanning te breken en het probleem te vermijden.','I crack a joke to break the tension and avoid the problem.'),
          ans(16,4,'Ik wil precies weten wie of wat de oorzaak is en hoe we dit rechtzetten.','I want to know exactly who or what the cause is and how we set it right.'),
          ans(16,5,'Ik zie de crisis als het perfecte moment om alles radicaal om te transformeren.','I see the crisis as the perfect moment to transform everything radically.'),
        ]},
        { id: 17, text: 'Welke rol neem je in binnen een gemeenschap of vereniging?', textEn: 'What role do you take on within a community or association?', domain: 'extraversie', answers: [
          ans(17,0,'De adviseur; mensen komen naar mij toe voor wijsheid en inzicht.','The adviser; people come to me for wisdom and insight.'),
          ans(17,1,'De kartrekker; als er iets moet gebeuren, sta ik vooraan.','The driving force; if something has to happen, I am at the front.'),
          ans(17,2,'Het hart; ik zorg dat de sfeer goed is en iedereen zich verbonden voelt.','The heart; I make sure the atmosphere is good and everyone feels connected.'),
          ans(17,3,'De vernieuwer; ik breng leven in de brouwerij met frisse ideeën.','The innovator; I liven things up with fresh ideas.'),
          ans(17,4,'De voorzitter; ik bewaak de structuur en de lange termijn.','The chair; I guard the structure and the long term.'),
          ans(17,5,'Het loyale lid; ik ben er altijd en steun de club onvoorwaardelijk.','The loyal member; I am always there and support the club unconditionally.'),
        ]},
        { id: 18, text: 'Hoe creëer je waarde en impact in de buitenwereld?', textEn: 'How do you create value and impact in the outside world?', domain: 'extraversie', answers: [
          ans(18,0,'Door situaties te veranderen en problemen als sneeuw voor de zon te laten verdwijnen.','By changing situations and making problems melt away like snow in the sun.'),
          ans(18,1,'Door duidelijkheid en rechtvaardigheid te bieden in verwarrende tijden.','By offering clarity and justice in confusing times.'),
          ans(18,2,'Door mensen te laten lachen en de zwaarte van het leven te relativeren.','By making people laugh and putting the heaviness of life into perspective.'),
          ans(18,3,'Door nieuwe wegen te openen die anderen nog niet durfden te gaan.','By opening new routes that others did not yet dare to take.'),
          ans(18,4,'Door mensen te bevrijden van vastgeroeste patronen en regels.','By freeing people from entrenched patterns and rules.'),
          ans(18,5,'Door er onvoorwaardelijk te zijn en mensen te helpen groeien.','By being there unconditionally and helping people grow.'),
        ]},
        { id: 19, text: 'Hoe neem je beslissingen als de belangen groot zijn en de uitkomst onzeker?', textEn: 'How do you make decisions when the stakes are high and the outcome uncertain?', domain: 'extraversie', answers: [
          ans(19,0,'Ik kies wat goed en eerlijk is, en vertrouw erop dat de uitkomst dan ook goed zal zijn.','I choose what is good and honest, and trust that the outcome will then be good too.'),
          ans(19,1,'Ik kies wat op de lange termijn de stabiliteit en macht van de organisatie waarborgt.','I choose what secures the organisation\'s stability and power in the long term.'),
          ans(19,2,'Ik kies de weg die het meest \'kloppend\' en inspirerend voelt, los van de cijfers.','I choose the path that feels most \'right\' and inspiring, apart from the numbers.'),
          ans(19,3,'Ik beslis op basis van wat het beste voelt voor de mensen om wie ik geef.','I decide on the basis of what feels best for the people I care about.'),
          ans(19,4,'Ik hak de knoop door en vertrouw op mijn vermogen om problemen onderweg op te lossen.','I cut the knot and trust my ability to solve problems along the way.'),
          ans(19,5,'Ik verzamel alle feiten en kies de optie met de hoogste statistische kans van slagen.','I gather all the facts and choose the option with the highest statistical chance of success.'),
        ]},
        { id: 20, text: 'Wat is de diepere drijfveer achter jouw ambitie?', textEn: 'What is the deeper driver behind your ambition?', domain: 'extraversie', answers: [
          ans(20,0,'Ik wil invloed hebben zodat ik op grotere schaal voor anderen kan zorgen.','I want influence so that I can care for others on a larger scale.'),
          ans(20,1,'Ik wil degenen die niet in mij geloofden laten zien dat ze fout zaten.','I want to show the ones who did not believe in me that they were wrong.'),
          ans(20,2,'Ik wil succesvol zijn zodat ik de middelen heb om te gaan en staan waar ik wil.','I want to be successful so that I have the means to come and go where I please.'),
          ans(20,3,'Ik ben ambitieus zolang ik het spel leuk vind, ik gebruik mijn positie om de bourgeoisie te herinneren dat ook zij gewoon mensen zijn.','I am ambitious as long as I enjoy the game; I use my position to remind the bourgeoisie that they are ordinary people too.'),
          ans(20,4,'Ik wil op een positie komen waar ik kan zorgen dat dingen rechtvaardig geregeld worden.','I want to reach a position where I can make sure things are arranged justly.'),
          ans(20,5,'Ik wil zien of ik de beelden in mijn hoofd werkelijkheid kan maken in de materie.','I want to see whether I can make the images in my head real in matter.'),
        ]},
        { id: 21, text: 'Hoe ga je om met kritiek en professionele grenzen?', textEn: 'How do you handle criticism and professional boundaries?', domain: 'extraversie', answers: [
          ans(21,0,'Ik luister objectief en kijk of ik er iets van kan leren.','I listen objectively and see whether there is something in it I can learn from.'),
          ans(21,1,'Ik zie het als een uitdaging om nog competenter te worden.','I see it as a challenge to become even more competent.'),
          ans(21,2,'Ik neem het ter harte, maar het kost me tijd om bij te sturen.','I take it to heart, but it costs me time to adjust.'),
          ans(21,3,'Ik gebruik het als inspiratie, maar blijf trouw aan mijn eigen stijl.','I use it as inspiration, but stay true to my own style.'),
          ans(21,4,'Ik beoordeel of de feedback nuttig is voor het resultaat en pas me zo nodig aan.','I judge whether the feedback is useful for the result and adapt if need be.'),
          ans(21,5,'De kritiek is terecht en probeer het de volgende keer precies goed te doen.','The criticism is fair, and I try to get it exactly right next time.'),
        ]},
        { id: 22, text: 'Welk businessmodel is leidend voor je eigen zaak?', textEn: 'Which business model leads the way in your own venture?', domain: 'extraversie', answers: [
          ans(22,0,'Een model gericht op transformatie en innovatie; ik wil producten of diensten creëren die de werkelijkheid en de beleving van de klant fundamenteel veranderen.','A model aimed at transformation and innovation; I want to create products or services that fundamentally change the client\'s reality and experience.'),
          ans(22,1,'Een model gebaseerd op absolute integriteit en objectieve kwaliteit; alles binnen de bedrijfsvoering moet toetsbaar, rechtvaardig en moreel zuiver zijn.','A model built on absolute integrity and objective quality; everything inside the business has to be verifiable, fair and morally clean.'),
          ans(22,2,'Een model dat draait om plezier en verrassing; ik wil de markt opschudden met humor en laten zien hoe absurd de traditionele businesswereld soms kan zijn.','A model that runs on fun and surprise; I want to shake up the market with humour and show how absurd the traditional business world can be.'),
          ans(22,3,'Een model dat voortdurend op zoek is naar \'onontgonnen terrein\'; ik wil pionieren in niches en markten waar anderen nog niet durven of willen kijken.','A model that is constantly looking for \'uncharted terrain\'; I want to pioneer in niches and markets where others do not yet dare or care to look.'),
          ans(22,4,'Een model dat de gevestigde orde en monopolies aanvalt; ik wil een onafhankelijke koers varen die de vastgeroeste wetten van de industrie radicaal doorbreekt.','A model that attacks the established order and its monopolies; I want to steer an independent course that radically breaks the entrenched laws of the industry.'),
          ans(22,5,'Een model gericht op sociale zorg en gemeenschapszin; de zaak is in de eerste plaats een middel om anderen te ondersteunen en een veilige haven te bieden.','A model aimed at social care and community spirit; the business is first and foremost a means to support others and offer a safe harbour.'),
        ]},
        { id: 23, text: 'Wat kenmerkt jouw natuurlijke leiderschapsstijl?', textEn: 'What characterises your natural leadership style?', domain: 'extraversie', answers: [
          ans(23,0,'Ik dien door het goede voorbeeld te geven en bescheiden te blijven.','I serve by setting a good example and staying modest.'),
          ans(23,1,'Ik zorg voor duidelijke kaders, rollen en verantwoordelijkheden.','I provide clear frameworks, roles and responsibilities.'),
          ans(23,2,'Ik inspireer mensen door mijn passie en unieke manier van kijken.','I inspire people through my passion and my unique way of seeing.'),
          ans(23,3,'Ik verbind de individuele belangen tot een saamhorige symfonie.','I bind the individual interests into one cohesive symphony.'),
          ans(23,4,'Ik loop als eerste door het vuur en geef het ritme aan.','I walk through the fire first and set the rhythm.'),
          ans(23,5,'Ik schets de grote lijnen van de toekomst, de details laat ik aan anderen.','I sketch the broad lines of the future and leave the details to others.'),
        ]},
        { id: 24, text: 'Hoe ga je om met ethische dilemma\'s?', textEn: 'How do you deal with ethical dilemmas?', domain: 'extraversie', answers: [
          ans(24,0,'Ik kies voor de optie die de minste pijn veroorzaakt bij anderen.','I choose the option that causes the least pain to others.'),
          ans(24,1,'Ik kies voor wat juist voelt, ook als dat tegen de regels ingaat.','I choose what feels right, even when it goes against the rules.'),
          ans(24,2,'Ik zoek naar een nieuwe weg waarbij we het dilemma kunnen omzeilen.','I look for a new route along which we can bypass the dilemma.'),
          ans(24,3,'Ik laat zien dat het dilemma zelf eigenlijk een farce is.','I show that the dilemma itself is really a farce.'),
          ans(24,4,'Ik houd me strikt aan de principes van recht en waarheid, ongeacht de gevolgen.','I hold strictly to the principles of justice and truth, whatever the consequences.'),
          ans(24,5,'Ik probeer de situatie zo te draaien dat beide kanten winnen (win-win).','I try to turn the situation so that both sides win (win-win).'),
        ]},
      ],
    },
    {
      layerId: 'layer-massa',
      name: 'Massa / Macht',
      nameEn: 'Mass / Power',
      title: 'MASSA / MACHT',
      titleEn: 'MASS / POWER',
      subtitle: 'De kracht van de collectieve stroom',
      subtitleEn: 'The force of the collective current',
      color: '#f472b6',
      layerIndex: 2,
      fundamental: 'Carrière & Maatschappelijke Positie',
      fundamentalEn: 'Career & Social Position',
      description: 'Verken je visie op waarheid, technologie, tradities en creativiteit.',
      descriptionEn: 'Explore your view on truth, technology, traditions and creativity.',
      createdAt: new Date(),
      questions: [
        { id: 25, text: 'Hoe zoek jij naar \'waarheid\' in een tijd waarin media en algoritmes bepalen wat we zien?', textEn: 'How do you search for \'truth\' in an age where media and algorithms decide what we see?', domain: 'cultuur', answers: [
          ans(25,0,'Door historische patronen te analyseren; waarheid zit in de herhaling van feiten, niet in de hype.','By analysing historical patterns; truth lies in the repetition of facts, not in the hype.'),
          ans(25,1,'Door de strijd aan te gaan; ik vecht voor mijn overtuiging, ongeacht wat de massa vindt.','By taking up the fight; I fight for my conviction, whatever the masses think.'),
          ans(25,2,'Door verbinding; waarheid is wat resoneert in het contact tussen mensen, niet wat op een scherm staat.','Through connection; truth is what resonates in the contact between people, not what stands on a screen.'),
          ans(25,3,'Door expressie; waarheid is een persoonlijke creatie die ik zelf vormgeef en uitdraag.','Through expression; truth is a personal creation that I shape and carry out myself.'),
          ans(25,4,'Door autoriteit; ik vertrouw op bewezen bronnen en instituten die de orde bewaken.','Through authority; I trust proven sources and the institutions that guard the order.'),
          ans(25,5,'Door vertrouwen; ik ga uit van het goede in de mens en laat me niet leiden door cynisme.','Through trust; I assume the good in people and refuse to be led by cynicism.'),
        ]},
        { id: 26, text: 'Wat is jouw houding tegenover technologische revoluties die onze cultuur op zijn kop zetten?', textEn: 'What is your attitude towards technological revolutions that turn our culture upside down?', domain: 'cultuur', answers: [
          ans(26,0,'Ik zie technologie als moderne alchemie om de mensheid naar een hogere realiteit te tillen.','I see technology as modern alchemy, a way to lift humanity into a higher reality.'),
          ans(26,1,'Ik toets of de vooruitgang wel ethisch verantwoord en rechtvaardig is.','I test whether the progress is really ethical and just.'),
          ans(26,2,'Met humor laat ik zien wat het echt betekent om mens te zijn.','With humour I show what it truly means to be human.'),
          ans(26,3,'Ik wil weten welke nieuwe werelden we kunnen ontdekken met deze tools.','I want to know which new worlds we can discover with these tools.'),
          ans(26,4,'Ik zie het vaak als een manier van de elite om meer controle over ons te krijgen.','I often see it as a way for the elite to gain more control over us.'),
          ans(26,5,'Ik maak me druk over wie er achterblijft en hoe we de menselijke maat bewaken.','I worry about who gets left behind and how we keep things on a human scale.'),
        ]},
        { id: 27, text: 'Hoe kijk je naar veranderende idealen (zoals vrijheid van spreken) door de tijd heen?', textEn: 'How do you view changing ideals (such as freedom of speech) over the course of time?', domain: 'cultuur', answers: [
          ans(27,0,'Als een belofte; ik hoop dat we toegroeien naar een wereld van harmonie en eenvoud.','As a promise; I hope we are growing towards a world of harmony and simplicity.'),
          ans(27,1,'Als een fundament; ik bescherm de kernwaarden die de beschaving stabiel houden.','As a foundation; I protect the core values that keep civilisation stable.'),
          ans(27,2,'Als een inspiratiebron; nieuwe tijden vragen om nieuwe beelden en verhalen.','As a source of inspiration; new times ask for new images and stories.'),
          ans(27,3,'Als een gevoel; ik wil me gepassioneerd verbinden met de tijdgeest en de mensen om me heen.','As a feeling; I want to connect passionately with the spirit of the age and the people around me.'),
          ans(27,4,'Als een missie; idealen zijn er om voor te vechten en te verdedigen tegen verval.','As a mission; ideals exist to be fought for and defended against decay.'),
          ans(27,5,'Als een evolutionair proces; ik bestudeer hoe waarden zich ontwikkelen volgens vaste wetmatigheden.','As an evolutionary process; I study how values develop according to fixed laws.'),
        ]},
        { id: 28, text: 'Wat is de rol van tradities in een digitale wereld?', textEn: 'What is the role of traditions in a digital world?', domain: 'cultuur', answers: [
          ans(28,0,'Tradities zijn verbinding; ze bieden de veiligheid en geborgenheid die mensen nodig hebben.','Traditions are connection; they offer the safety and shelter people need.'),
          ans(28,1,'Tradities zijn kettingen; we moeten breken met het oude om echt vrij te kunnen zijn.','Traditions are chains; we have to break with the old to be truly free.'),
          ans(28,2,'Tradities zijn startpunten; we moeten ze kennen om ze te kunnen overstijgen.','Traditions are starting points; we have to know them in order to transcend them.'),
          ans(28,3,'Tradities zijn theater; het is leuk om mee te doen, maar ik neem het niet te serieus.','Traditions are theatre; it is fun to join in, but I do not take it too seriously.'),
          ans(28,4,'Tradities zijn ankers; velen vertegenwoordigen de morele afspraken die we niet mogen vergeten.','Traditions are anchors; many of them carry the moral agreements we must not forget.'),
          ans(28,5,'Tradities zijn rituelen; we kunnen de oude vormen vullen met nieuwe energie.','Traditions are rituals; we can fill the old forms with new energy.'),
        ]},
        { id: 29, text: 'Hoe integreer jij AI in je eigen leven?', textEn: 'How do you integrate AI into your own life?', domain: 'cultuur', answers: [
          ans(29,0,'Door begrip; wie de magie begrijpt, hoeft er niet bang voor te zijn.','Through understanding; whoever understands the magic has no need to fear it.'),
          ans(29,1,'Door leiderschap; wij moeten onszelf en onze discipline rechttrekken, alleen dan blijft de menselijke wil een kracht voor de meting.','Through leadership; we have to straighten out ourselves and our discipline, because only then does the human will remain a force that counts.'),
          ans(29,2,'Door menselijkheid; aanvullende entiteiten hebben een plek naast ons zoals ze dat altijd al hebben gehad.','Through humanity; additional entities have a place beside us, as they always have had.'),
          ans(29,3,'Door creativiteit; ik zie AI als een collectieve spiegel; wij als makers bouwen immers altijd al voort op eerdere creaties.','Through creativity; I see AI as a collective mirror, since as makers we have always built on earlier creations anyway.'),
          ans(29,4,'Door regulering; we moeten duidelijke kaders stellen om de maatschappij te beschermen.','Through regulation; we have to set clear frameworks to protect society.'),
          ans(29,5,'Door eenvoud; ik geloof in de zuiverheid van de menselijke geest en dat een machine nooit de bezieling kan vervangen.','Through simplicity; I believe in the purity of the human spirit and that a machine can never replace soul.'),
        ]},
        { id: 30, text: 'Hoe kijk je naar de macht van \'Big Tech\' over onze informatie?', textEn: 'How do you view the power of \'Big Tech\' over our information?', domain: 'cultuur', answers: [
          ans(30,0,'Als een tool; deze bedrijven beheren de infrastructuur van onze nieuwe werkelijkheid.','As a tool; these companies manage the infrastructure of our new reality.'),
          ans(30,1,'Als een monopolie; ze moeten getoetst worden aan wetten van eerlijkheid en privacy.','As a monopoly; they have to be tested against laws of fairness and privacy.'),
          ans(30,2,'Als een grap; ze denken dat ze alles weten, maar het leven is onvoorspelbaar.','As a joke; they think they know everything, but life is unpredictable.'),
          ans(30,3,'Als een digitale wildernis; ik gebruik hun technologie niet om te volgen, maar om mijn eigen koers te varen en mijn persoonlijke horizon te verbreden.','As a digital wilderness; I use their technology not to follow, but to steer my own course and widen my personal horizon.'),
          ans(30,4,'Als een vijand; we moeten onze data terugveroveren en ons verzetten tegen hun controle.','As an enemy; we have to reclaim our data and resist their control.'),
          ans(30,5,'Als een risico; we moeten zorgen dat kwetsbare mensen niet gemanipuleerd worden.','As a risk; we have to make sure vulnerable people are not manipulated.'),
        ]},
        { id: 31, text: 'Wat leert de geschiedenis ons over vooruitgang?', textEn: 'What does history teach us about progress?', domain: 'cultuur', answers: [
          ans(31,0,'Dat het uiteindelijk goed komt; de mensheid groeit langzaam naar het licht.','That it comes right in the end; humanity grows slowly towards the light.'),
          ans(31,1,'Dat orde noodzakelijk is; zonder structuur leidt vooruitgang tot chaos.','That order is necessary; without structure, progress leads to chaos.'),
          ans(31,2,'Dat de mens een schepper is; wij dromen de wereld van morgen in elkaar.','That the human being is a creator; we dream up the world of tomorrow.'),
          ans(31,3,'Dat verbinding de sleutel is; culturen overleven alleen als mensen elkaar vasthouden.','That connection is the key; cultures survive only when people hold on to each other.'),
          ans(31,4,'Dat vooruitgang strijd vereist; niets wordt beter zonder moed en opoffering.','That progress demands struggle; nothing gets better without courage and sacrifice.'),
          ans(31,5,'Dat alles in cycli gaat; wat we nu meemaken is al eerder gebeurd in een andere vorm.','That everything moves in cycles; what we are living through now has happened before in another form.'),
        ]},
        { id: 32, text: 'Hoe reageer je op sociale eenzaamheid door digitalisering?', textEn: 'How do you respond to social loneliness caused by digitalisation?', domain: 'cultuur', answers: [
          ans(32,0,'Ik zoek contact; ik bel mensen op en vraag hoe het echt met ze gaat.','I seek contact; I call people up and ask how they are really doing.'),
          ans(32,1,'Ik gooi mijn telefoon weg; echte vrijheid is onbereikbaar zijn.','I throw my phone away; real freedom is being unreachable.'),
          ans(32,2,'Ik zoek nieuwe manieren om mensen te ontmoeten, online of offline.','I look for new ways to meet people, online or offline.'),
          ans(32,3,'Ik relativeer het; we zitten allemaal alleen op een schermpje, dat is best komisch.','I put it into perspective; we are all sitting alone behind a little screen, which is rather comic.'),
          ans(32,4,'Ik wijs op de verantwoordelijkheid; we moeten elkaar aanspreken op asociaal gedrag.','I point to responsibility; we have to call each other out on antisocial behaviour.'),
          ans(32,5,'Ik gebruik de techniek; ik bouw communities die fysieke grenzen overstijgen.','I use the technology; I build communities that transcend physical borders.'),
        ]},
        { id: 33, text: 'Wat is de rol van persoonlijke creativiteit in deze tijd?', textEn: 'What is the role of personal creativity in this age?', domain: 'cultuur', answers: [
          ans(33,0,'Het is een manier om complexe problemen op te lossen.','It is a way to solve complex problems.'),
          ans(33,1,'Het is een middel; met creativiteit kun je de gebroken fundamenten doorbreken.','It is a means; with creativity you can break through broken foundations.'),
          ans(33,2,'Het is een uiting van passie; iets moois maken dat verbindt.','It is an expression of passion; making something beautiful that connects.'),
          ans(33,3,'Het is essentieel; zonder schoonheid en verbeelding is de wereld doods.','It is essential; without beauty and imagination the world is lifeless.'),
          ans(33,4,'Het moet dienen; creativiteit is nuttig als het bijdraagt aan de bouw van de samenleving.','It has to serve; creativity is useful when it contributes to building society.'),
          ans(33,5,'Het is spelen; onbevangen iets maken zonder oordeel.','It is play; making something openly, without judgement.'),
        ]},
        { id: 34, text: 'Hoe reageer je op de vraag om je levensstijl op te offeren voor een \'hoger doel\' (zoals klimaat)?', textEn: 'How do you respond when asked to sacrifice your lifestyle for a \'higher purpose\' (such as the climate)?', domain: 'cultuur', answers: [
          ans(34,0,'Ik zie het als transformatie; we moeten onze relatie met de aarde fundamenteel veranderen.','I see it as transformation; we have to change our relationship with the earth fundamentally.'),
          ans(34,1,'Ik wil dat het eerlijk gaat; iedereen moet zijn deel doen, niet alleen de gewone man.','I want it to be done fairly; everyone has to do their part, not just the ordinary person.'),
          ans(34,2,'Ik zie de ironie; mensen vliegen de wereld over om te praten over niet vliegen.','I see the irony; people fly around the world to talk about not flying.'),
          ans(34,3,'Ik zie het als een uitdaging om een nieuwe manier van leven te ontdekken.','I see it as a challenge to discover a new way of living.'),
          ans(34,4,'Ik verzet me tegen dwang; ik bepaal zelf wel wat goed is, ik volg de kudde niet.','I resist coercion; I decide for myself what is good, I do not follow the herd.'),
          ans(34,5,'Ik doe het graag; als ik daarmee de wereld voor anderen beter maak, is dat vanzelfsprekend.','I do it gladly; if it makes the world better for others, that goes without saying.'),
        ]},
        { id: 35, text: 'Hoe doorzie je machtsspelletjes in de cultuur?', textEn: 'How do you see through power games in the culture?', domain: 'cultuur', answers: [
          ans(35,0,'Door zuiverheid; ik houd me er niet mee bezig en blijf bij mezelf.','Through purity; I do not get involved and stay with myself.'),
          ans(35,1,'Door inzicht in de structuur; ik weet hoe macht werkt omdat ik de regels ken.','Through insight into the structure; I know how power works because I know the rules.'),
          ans(35,2,'Door verbeelding; ik kijk voorbij het masker naar de ware intentie.','Through imagination; I look past the mask to the true intention.'),
          ans(35,3,'Door gevoel; ik voel instinctief aan of iemand oprecht is of manipuleert.','Through feeling; I sense instinctively whether someone is sincere or manipulating.'),
          ans(35,4,'Door confrontatie; ik test de regels met mijn eigen waarden en bemoei me met principes die niet kloppen.','Through confrontation; I test the rules against my own values and speak up about principles that do not add up.'),
          ans(35,5,'Door analyse; ik kijk wie er echt profiteert van bepaalde ideeën.','Through analysis; I look at who really profits from certain ideas.'),
        ]},
        { id: 36, text: 'Wat is de taak van de cultuur in een diverse wereld?', textEn: 'What is the task of culture in a diverse world?', domain: 'cultuur', answers: [
          ans(36,0,'Helen en koesteren; cultuur moet zorgen voor de emotionele veiligheid en een verzorgende bodem bieden waarin elk individu zich beschermd en verbonden voelt.','Healing and nurturing; culture has to provide emotional safety and a caring soil in which every individual feels protected and connected.'),
          ans(36,1,'Systemen ontregelen; cultuur moet de confrontatie opzoeken met de gevestigde orde om ons te bevrijden van verstikkende tradities en achterhaalde regels.','Disrupting systems; culture has to seek confrontation with the established order in order to free us from suffocating traditions and outdated rules.'),
          ans(36,2,'Een onbegrensde wildernis; cultuur is een open ruimte van totale vrijheid waarin we door interactie met het onbekende voortdurend onze eigen horizon verleggen.','A boundless wilderness; culture is an open space of total freedom in which, through contact with the unknown, we keep pushing our own horizon further.'),
          ans(36,3,'De lach als spiegel; cultuur moet de absurditeit van onze sociale \'rollen\' en hokjes blootleggen door alles wat wij als \'heilig\' of \'serieus\' beschouwen te relativeren.','Laughter as a mirror; culture has to expose the absurdity of our social \'roles\' and boxes by putting into perspective everything we hold \'sacred\' or \'serious\'.'),
          ans(36,4,'Morele toetsing; cultuur is de instantie die waakt over de integriteit en rechtvaardigheid van hoe we als verschillende groepen en individuen met elkaar omgaan.','Moral testing; culture is the authority that watches over the integrity and fairness of how we deal with one another as different groups and individuals.'),
          ans(36,5,'Creatieve alchemie; cultuur moet de verschillende stromen in de maatschappij samenbrengen en transformeren tot een fundamenteel nieuwe, hogere werkelijkheid.','Creative alchemy; culture has to bring the different currents in society together and transform them into a fundamentally new, higher reality.'),
        ]},
      ],
    },
    {
      layerId: 'layer-wereld',
      name: 'Wereld / Wijsheid',
      nameEn: 'World / Wisdom',
      title: 'WERELD / WIJSHEID',
      titleEn: 'WORLD / WISDOM',
      subtitle: 'De wijsheid van verbinding en balans',
      subtitleEn: 'The wisdom of connection and balance',
      color: '#fbbf24',
      layerIndex: 3,
      fundamental: 'Verbondenheid & Zingeving',
      fundamentalEn: 'Connectedness & Meaning',
      description: 'Verdiep je in relaties, de ziel, partnerkeuze en sociale dynamiek.',
      descriptionEn: 'Go deeper into relationships, the soul, choosing a partner and social dynamics.',
      createdAt: new Date(),
      questions: [
        { id: 37, text: 'Hoe ga je in een relatie om met ongelijke behandeling?', textEn: 'How do you deal with unequal treatment within a relationship?', domain: 'huwelijk', answers: [
          ans(37,0,'Ik analyseer de onderliggende dynamiek; ik wil de oorzaak van de scheefgroei begrijpen om de situatie met objectieve argumenten recht te zetten.','I analyse the underlying dynamic; I want to understand the cause of the imbalance so that I can set the situation right with objective arguments.'),
          ans(37,1,'Ik zie het als een uitdaging voor mijn karakter.','I see it as a challenge for my character.'),
          ans(37,2,'Het raakt me in mijn kern; ik zoek onmiddellijk de diepe verbinding op om de passie te herstellen.','It hits me at my core; I immediately seek out the deep connection to restore the passion.'),
          ans(37,3,'Ik gebruik mijn eigenzinnigheid en creatieve expressie om de verhoudingen binnen onze relatie op een unieke manier open te breken.','I use my wilfulness and creative expression to break open the balance within our relationship in a unique way.'),
          ans(37,4,'Ik trek een harde grens; ik eis heldere rollen en verantwoordelijkheden binnen een kader dat voor beide partijen eerlijk en stabiel is.','I draw a hard line; I demand clear roles and responsibilities within a framework that is fair and stable for both parties.'),
          ans(37,5,'Ik blijf zachtmoedig en geduldig; ik focus op het behoud van de vrede en vertrouw erop dat intenties goed bedoeld zijn.','I stay gentle and patient; I focus on keeping the peace and trust that intentions are well meant.'),
        ]},
        { id: 38, text: 'Hoe kijk je naar technologie die onze ziel beïnvloedt?', textEn: 'How do you view technology that influences our soul?', domain: 'huwelijk', answers: [
          ans(38,0,'Ik zie het als alchemie; we kunnen onszelf transformeren naar een hogere vorm.','I see it as alchemy; we can transform ourselves into a higher form.'),
          ans(38,1,'Ik ben voorzichtig; we mogen de integriteit van de menselijke vorm niet schenden.','I am cautious; we must not violate the integrity of the human form.'),
          ans(38,2,'Ik vind het bizar; we slikken pillen om gelukkig te zijn in plaats van onszelf uit te vinden.','I find it bizarre; we swallow pills to be happy instead of finding out who we are.'),
          ans(38,3,'Ik ben nieuwsgierig; wat kunnen we bereiken als we onze realiteit optimaliseren?','I am curious; what could we reach if we optimised our reality?'),
          ans(38,4,'Ik verdoem het; ik laat niet rommelen aan mijn natuurlijke staat van zijn.','I condemn it; I will not have anyone tampering with my natural state of being.'),
          ans(38,5,'Ik steun het als het helpt; als het lijden verlicht, is het een zegen.','I support it when it helps; if it eases suffering, it is a blessing.'),
        ]},
        { id: 39, text: 'Wat betekent muziek voor jouw persoonlijkheid?', textEn: 'What does music mean for your personality?', domain: 'huwelijk', answers: [
          ans(39,0,'Muziek is vreugde; ik word er simpelweg blij van.','Music is joy; it simply makes me happy.'),
          ans(39,1,'Muziek is cultuur; het is een ritueel die de groep samenbindt en verheft.','Music is culture; it is a ritual that binds the group together and lifts it up.'),
          ans(39,2,'Muziek is expressie; het is de taal van de ziel in tastbare vorm.','Music is expression; it is the language of the soul in tangible form.'),
          ans(39,3,'Muziek is emotie; het verbindt onze harten zonder woorden.','Music is emotion; it connects our hearts without words.'),
          ans(39,4,'Muziek is energie; het versterkt de vibe waar ik al in zit.','Music is energy; it amplifies the vibe I am already in.'),
          ans(39,5,'Muziek is harmonie, het is een raam naar diepere waarheden.','Music is harmony; it is a window onto deeper truths.'),
        ]},
        { id: 40, text: 'Wat is jouw ideaalbeeld van een huwelijk of partnerschap?', textEn: 'What is your ideal picture of a marriage or partnership?', domain: 'huwelijk', answers: [
          ans(40,0,'Een veilige haven; voor elkaar zorgen in voor- en tegenspoed.','A safe harbour; caring for each other for better and for worse.'),
          ans(40,1,'Een verbond; bonnie en clyde, joker en harley, volgens onze eigen regels.','A pact; Bonnie and Clyde, Joker and Harley, by our own rules.'),
          ans(40,2,'Een avontuur; samen de wereld ontdekken en elkaar vrijlaten om te groeien.','An adventure; discovering the world together and leaving each other free to grow.'),
          ans(40,3,'Een feestje; het moet vooral leuk en speels blijven, leef en laat.','A party; above all it has to stay fun and playful, live and let live.'),
          ans(40,4,'Een contract; een afspraak gebaseerd op trouw en wederzijds respect.','A contract; an agreement built on loyalty and mutual respect.'),
          ans(40,5,'Een transformatie; elkaar helpen om de beste versie van onszelf te worden.','A transformation; helping each other become the best version of ourselves.'),
        ]},
        { id: 41, text: 'Hoe zie jij de menselijke ziel?', textEn: 'How do you see the human soul?', domain: 'huwelijk', answers: [
          ans(41,0,'Als stroming; een complex patroon van bewustzijn en geheugen.','As a current; a complex pattern of consciousness and memory.'),
          ans(41,1,'Als een vlam; de bron van mijn wilskracht en moed.','As a flame; the source of my willpower and courage.'),
          ans(41,2,'Als een mysterie; datgene wat resoneert met de ziel van een ander.','As a mystery; the thing that resonates with the soul of another.'),
          ans(41,3,'Als een kunstwerk; uniek, schoon en steeds in verandering.','As a work of art; unique, beautiful and always changing.'),
          ans(41,4,'Als een verantwoordelijkheid; de morele kern die ik zuiver moet houden.','As a responsibility; the moral core I have to keep clean.'),
          ans(41,5,'Als een lichtje; puur en onsterfelijk.','As a small light; pure and immortal.'),
        ]},
        { id: 42, text: 'Hoe beïnvloedt jouw sociale klasse/achtergrond je relaties?', textEn: 'How does your social class/background influence your relationships?', domain: 'huwelijk', answers: [
          ans(42,0,'Ik transformeer het; ik bepaal zelf mijn status, los van mijn afkomst.','I transform it; I decide my own status, apart from where I come from.'),
          ans(42,1,'Ik ben me ervan bewust; ik vind dat iedereen gelijke kansen verdient, ongeacht afkomst.','I am aware of it; I believe everyone deserves equal chances, whatever their background.'),
          ans(42,2,'Ik speel ermee; ik beweeg als een kameleon met elke laag mee.','I play with it; I move like a chameleon through every layer.'),
          ans(42,3,'Ik stap eroverheen; ik vind het interessant om mensen uit andere milieus te ontmoeten.','I step over it; I find it interesting to meet people from other backgrounds.'),
          ans(42,4,'Ik heb sch*t; ik laat me niet beoordelen op waar ik vandaan kom.','I do not give a damn; I refuse to be judged on where I come from.'),
          ans(42,5,'Ik zorg voor mijn directe kring; ik voel me verantwoordelijk voor mijn gemeenschap.','I look after my immediate circle; I feel responsible for my community.'),
        ]},
        { id: 43, text: 'Hoe ga je om met asymmetrie (ongelijkheid) in geven en nemen?', textEn: 'How do you handle asymmetry (inequality) in giving and taking?', domain: 'huwelijk', answers: [
          ans(43,0,'Ik merk het niet eens; ik ben dankbaar voor wat ik krijg en geef wat ik kan.','I do not even notice it; I am grateful for what I get and give what I can.'),
          ans(43,1,'Ik herstel de balans; een relatie moet uiteindelijk in evenwicht zijn om stabiel te blijven.','I restore the balance; a relationship has to even out in the end to stay stable.'),
          ans(43,2,'Ik geef wat ik kan creëren; mijn bijdrage is uniek en niet in geld uit te drukken.','I give what I can create; my contribution is unique and cannot be expressed in money.'),
          ans(43,3,'Ik reken niet; als je van iemand houdt, geef je alles wat je hebt.','I do not keep score; when you love someone, you give everything you have.'),
          ans(43,4,'Ik geef graag meer; het bewijst mijn kracht en onafhankelijkheid.','I am happy to give more; it proves my strength and independence.'),
          ans(43,5,'Ik bekijk het over de lange termijn; het hoeft niet elke dag gelijk te zijn, als het totaal maar ongeveer klopt.','I look at it over the long term; it does not have to be equal every day, as long as the total roughly adds up.'),
        ]},
        { id: 44, text: 'Hoe belangrijk is biochemie (aantrekkingskracht) versus verstand bij partnerkeuze?', textEn: 'How important is biochemistry (attraction) versus reason in choosing a partner?', domain: 'huwelijk', answers: [
          ans(44,0,'Ik kies voor de stabiele basis; hoewel de chemie een prikkel is, zoek ik primair naar een partner op wie ik een veilige en zorgzame toekomst kan bouwen.','I choose the stable foundation; chemistry is a spark, but above all I look for a partner with whom I can build a safe and caring future.'),
          ans(44,1,'Ik volg de rauwe biologische impuls; ik weiger mijn verlangen te laten temmen door wat de maatschappij \'verstandig\' of \'gepast\' vindt.','I follow the raw biological impulse; I refuse to let my desire be tamed by what society finds \'sensible\' or \'appropriate\'.'),
          ans(44,2,'Ik zie chemie als mijn gids; de sterke biochemische prikkel is voor mij het signaal dat er een nieuw gebied in mezelf ontdekt wil worden via de ander.','I treat chemistry as my guide; a strong biochemical pull is the signal that a new territory inside me wants to be discovered through the other.'),
          ans(44,3,'Ik omarm de onlogica; verliefdheid is de ultieme grap van de natuur die alle rationele plannen en verstandige keuzes in één klap zinloos maakt.','I embrace the illogic; falling in love is nature\'s ultimate joke, wiping out every rational plan and sensible choice in one stroke.'),
          ans(44,4,'Ik zoek naar cognitieve en morele symmetrie; voor mij is een relatie pas werkelijk \'chemisch\' als de waarden, het karakter en het verstand van de ander naadloos op de mijne aansluiten.','I look for cognitive and moral symmetry; for me a relationship is only truly \'chemical\' when the other\'s values, character and mind fit seamlessly with mine.'),
          ans(44,5,'Ik zoek de alchemistische vonk; een partner moet mijn hele wezen — zowel mijn lichaam als mijn geest — in een staat van transformatie en bezieling brengen.','I look for the alchemical spark; a partner has to bring my whole being, body as well as mind, into a state of transformation and inspiration.'),
        ]},
        { id: 45, text: 'Welke rol speelt competentie in jouw eigenwaarde?', textEn: 'What role does competence play in your self-worth?', domain: 'huwelijk', answers: [
          ans(45,0,'Ik wil de dingen begrijpen en beheersen.','I want to understand and master things.'),
          ans(45,1,'Ik ben wat ik doe.','I am what I do.'),
          ans(45,2,'Het gaat erom dat ik liefdevol ben.','What matters is that I am loving.'),
          ans(45,3,'Ik wil mijn visie kunnen uiten.','I want to be able to voice my vision.'),
          ans(45,4,'Leiderschap vereist dat je competent en bekwaam bent.','Leadership demands that you are competent and capable.'),
          ans(45,5,'Ik ben goed zoals ik ben, ook als ik niks bijzonders kan.','I am good as I am, even if I am not especially able at anything.'),
        ]},
        { id: 46, text: 'Hoe kijk je naar de \'ziel\' van je partner?', textEn: 'How do you look at the \'soul\' of your partner?', domain: 'huwelijk', answers: [
          ans(46,0,'Als een spiegel die mij dingen over mezelf laat zien.','As a mirror that shows me things about myself.'),
          ans(46,1,'Als een moreel kompas; ik bewonder de integriteit van de ander.','As a moral compass; I admire the other\'s integrity.'),
          ans(46,2,'Als een verrassing; je weet nooit wat er morgen uitkomt.','As a surprise; you never know what will come out tomorrow.'),
          ans(46,3,'Als een landschap dat ik nooit helemaal in kaart zal kunnen brengen.','As a landscape I will never be able to map completely.'),
          ans(46,4,'Als een wilde kracht die ik niet wil temmen, maar wel wil ontmoeten.','As a wild force I do not want to tame, but do want to meet.'),
          ans(46,5,'Als iets kwetsbaars dat ik wil koesteren en beschermen.','As something fragile that I want to cherish and protect.'),
        ]},
        { id: 47, text: 'Hoe belangrijk is een gedeelde culturele achtergrond?', textEn: 'How important is a shared cultural background?', domain: 'huwelijk', answers: [
          ans(47,0,'Maakt niet uit, liefde spreekt alle talen.','Does not matter; love speaks every language.'),
          ans(47,1,'Belangrijk, het zorgt voor stabiliteit en continuïteit van de waarden.','Important; it provides stability and continuity of the values.'),
          ans(47,2,'Saai, ik word liever geprikkeld door iemand die anders is.','Boring; I would rather be stirred by someone who is different.'),
          ans(47,3,'Fijn, het geeft een diepere laag van herkenning en verbinding.','Lovely; it gives a deeper layer of recognition and connection.'),
          ans(47,4,'Onbelangrijk; ik kies mijn eigen weg, los van waar ik vandaan kom.','Unimportant; I choose my own path, apart from where I come from.'),
          ans(47,5,'Handig, het maakt de communicatie efficiënter, maar niet noodzakelijk.','Handy; it makes communication more efficient, but it is not necessary.'),
        ]},
        { id: 48, text: 'Sommige relaties zijn tijdelijk; wat betekenen deze in jouw verhaal?', textEn: 'Some relationships are temporary; what do they mean in your story?', domain: 'huwelijk', answers: [
          ans(48,0,'Het zijn periodes waarin ik mijn warmte en steun heb kunnen geven aan een ander, ook al was het pad dat we deelden eindig.','They are periods in which I was able to give my warmth and support to another, even though the path we shared was finite.'),
          ans(48,1,'Ondanks mijn drang naar vrijheid heb ik wel moeite met het accepteren van het lot.','For all my drive towards freedom, I do struggle to accept fate.'),
          ans(48,2,'Mijn levensreis heeft geen einde, de gedeelde momenten koester ik.','My life\'s journey has no end; the shared moments I treasure.'),
          ans(48,3,'Tijdelijke verbindingen laten zien hoe komisch onze pogingen zijn om de veranderlijke stroom te manipuleren.','Temporary bonds show how comic our attempts are to manipulate a stream that keeps changing.'),
          ans(48,4,'Ik zie ze als afgesloten lessen in integriteit; elke relatie die stopt is een steen op de weegschaal van waarde.','I see them as closed lessons in integrity; every relationship that ends is a weight on the scales of worth.'),
          ans(48,5,'Elke interactie transformeert mij en de ander, ik geef de relatie pas op als ik het nut er niet meer van in zie.','Every interaction transforms me and the other; I only give up on a relationship when I no longer see the point of it.'),
        ]},
      ],
    },
    {
      layerId: 'layer-mysterie',
      name: 'Mysterie / Magie',
      nameEn: 'Mystery / Magic',
      title: 'MYSTERIE / MAGIE',
      titleEn: 'MYSTERY / MAGIC',
      subtitle: 'De samenvloeiing van alles',
      subtitleEn: 'The confluence of everything',
      color: '#f97316',
      layerIndex: 4,
      fundamental: 'Transcendentie & Nalatenschap',
      fundamentalEn: 'Transcendence & Legacy',
      description: 'Ontdek je relatie met de natuur, het mysterie en het hogere.',
      descriptionEn: 'Discover your relationship with nature, the mystery and the higher.',
      createdAt: new Date(),
      questions: [
        { id: 49, text: 'Wat ervaar je als je alleen in de overweldigende natuur bent?', textEn: 'What do you experience when you are alone in overwhelming nature?', domain: 'spiritualiteit', answers: [
          ans(49,0,'De orde; ik zie de complexe ecosystemen en de wetten van de natuur.','The order; I see the complex ecosystems and the laws of nature.'),
          ans(49,1,'De kwetsbaarheid; ik voel de kracht van de elementen en mijn eigen nietigheid.','The vulnerability; I feel the force of the elements and my own smallness.'),
          ans(49,2,'De eenheid; ik voel me versmelten met alles wat leeft en ademt.','The oneness; I feel myself merging with everything that lives and breathes.'),
          ans(49,3,'De schoonheid; ik word geraakt door de kleuren, vormen en het licht.','The beauty; I am moved by the colours, the shapes and the light.'),
          ans(49,4,'De grootsheid; ik voel respect voor de schepping die groter is dan wij.','The grandeur; I feel respect for a creation greater than we are.'),
          ans(49,5,'De vrede; ik voel me thuis en veilig in de schoot van de natuur.','The peace; I feel at home and safe in the lap of nature.'),
        ]},
        { id: 50, text: 'Is er een grens tussen technologie en magie?', textEn: 'Is there a boundary between technology and magic?', domain: 'spiritualiteit', answers: [
          ans(50,0,'Technologie IS magie; het is het manipuleren van de werkelijkheid met symbolen (code).','Technology IS magic; it is the manipulation of reality with symbols (code).'),
          ans(50,1,'Weet ik niet, maar we moeten ethische kaders opzetten voor onze tech.','I do not know, but we do have to set up ethical frameworks for our tech.'),
          ans(50,2,'We denken dat we tovenaars zijn met onze gadgets, maar zoals wij ermee omgaan lijken we eerder clowns.','We think we are wizards with our gadgets, but the way we handle them we look more like clowns.'),
          ans(50,3,'Nee, magie is gewoon technologie die we nog niet begrijpen.','No; magic is simply technology we do not understand yet.'),
          ans(50,4,'De grens is irrelevant; voor mij telt alleen of ik de ongekende kracht van nieuwe technologie kan gebruiken voor mijn eigen idealen.','The boundary is irrelevant; all that counts for me is whether I can use the untapped power of new technology for my own ideals.'),
          ans(50,5,'De grens is de menselijke ziel; technologie kan wonderen verrichten, maar de magie van echte zorg en empathie is gebonden aan ons.','The boundary is the human soul; technology can work wonders, but the magic of real care and empathy is bound to us.'),
        ]},
        { id: 51, text: 'Hoe ga je om met de elementen (aarde, water, vuur, lucht)?', textEn: 'How do you relate to the elements (earth, water, fire, air)?', domain: 'spiritualiteit', answers: [
          ans(51,0,'Ik bewonder ze.','I admire them.'),
          ans(51,1,'Ik beheer ze.','I manage them.'),
          ans(51,2,'Ik gebruik ze.','I use them.'),
          ans(51,3,'Ik voel ze.','I feel them.'),
          ans(51,4,'Ik trotseer ze.','I brave them.'),
          ans(51,5,'Ik bestudeer ze.','I study them.'),
        ]},
        { id: 52, text: 'Hoe verhoud jij je tot het \'Grote Mysterie\'?', textEn: 'How do you relate to the \'Great Mystery\'?', domain: 'spiritualiteit', answers: [
          ans(52,0,'Als iets dat nederig maakt; in het besef dat we zo weinig weten, zoek ik houvast in verbinding en de hoop dat we gedragen worden.','As something that humbles; knowing how little we know, I find my footing in connection and in the hope that we are carried.'),
          ans(52,1,'Als de ultieme vrijheid; in het mysterie gelden geen regels, wetten of dogma\'s van anderen, en daar vind ik mijn radicale autonomie.','As the ultimate freedom; in the mystery no one else\'s rules, laws or dogmas apply, and there I find my radical autonomy.'),
          ans(52,2,'Als een onontgonnen gebied; het niet-weten maakt me niet bang, maar juist nieuwsgierig om steeds diepere lagen van het bestaan te verkennen.','As uncharted terrain; not knowing does not frighten me, it makes me curious to explore ever deeper layers of existence.'),
          ans(52,3,'Als een kosmische relativering; het feit dat we de essentie niet begrijpen, laat zien hoe lachwekkend onze menselijke arrogantie en serieuze plannen eigenlijk zijn.','As a cosmic sense of proportion; the fact that we do not grasp the essence shows how laughable our human arrogance and serious plans really are.'),
          ans(52,4,'Als een vraagstuk van geloof; waar de feitelijke kennis ophoudt, biedt een moreel of spiritueel kader de noodzakelijke structuur en richting.','As a question of faith; where factual knowledge stops, a moral or spiritual framework offers the necessary structure and direction.'),
          ans(52,5,'Als de bron van creatie; ik zie het \'niets\' niet als leegte, maar als de pure potentie waaruit ik door intentie een nieuwe werkelijkheid kan laten ontstaan.','As the source of creation; I see the \'nothing\' not as emptiness but as pure potential, out of which intention lets me bring a new reality into being.'),
        ]},
        { id: 53, text: 'Wat betekent nederigheid voor jou?', textEn: 'What does humility mean to you?', domain: 'spiritualiteit', answers: [
          ans(53,0,'Erkennen hoeveel ik nog niet weet.','Acknowledging how much I still do not know.'),
          ans(53,1,'Mijn kracht gebruiken om te dienen, niet om te heersen.','Using my strength to serve, not to rule.'),
          ans(53,2,'Mezelf openstellen en kwetsbaar durven zijn.','Opening myself up and daring to be vulnerable.'),
          ans(53,3,'Weten dat mijn inspiratie niet van mij komt, maar door mij heen stroomt.','Knowing that my inspiration does not come from me, but flows through me.'),
          ans(53,4,'Beseffen dat macht slechts geleend is en tijdelijk.','Realising that power is only on loan and temporary.'),
          ans(53,5,'Simpelweg dankbaar zijn voor wat er is.','Simply being grateful for what is.'),
        ]},
        { id: 54, text: 'Hoe positioneer jij de mens in de natuurlijke hiërarchie?', textEn: 'Where do you place the human being in the natural hierarchy?', domain: 'spiritualiteit', answers: [
          ans(54,0,'Als de alchemist; de mens staat bovenaan, niet om te heersen, maar om de ruwe materie van de natuur bewustzijn te geven en naar een hoger plan te tillen.','As the alchemist; the human stands at the top, not to rule, but to give consciousness to the raw matter of nature and lift it to a higher plane.'),
          ans(54,1,'Als de rentmeester; onze hoge positie in de rangorde is geen vrijbrief voor macht, maar een zware morele verplichting om rechtvaardig over de aarde te waken.','As the steward; our high position in the order is no licence for power, but a heavy moral duty to watch justly over the earth.'),
          ans(54,2,'Als een arrogante passant; we wanen ons de koningen van de schepping, maar de natuur zal ons uiteindelijk lachend van de troon stoten als we niet oppassen.','As an arrogant passer-by; we imagine ourselves kings of creation, but nature will laugh us off the throne in the end if we are not careful.'),
          ans(54,3,'Als de grensverlegger; ik zie de hiërarchie niet als een ladder maar als een speelveld, waarbij de mens de unieke rol heeft om de uiterste grenzen van het mogelijke te verkennen.','As the boundary-pusher; I see the hierarchy not as a ladder but as a playing field, in which the human has the unique role of exploring the outer limits of the possible.'),
          ans(54,4,'Als een overwinnaar; de natuur is wreed en de enige hiërarchie die telt is kracht; wij moeten ons constant invechten om niet door de elementen overheerst te worden.','As a conqueror; nature is cruel and the only hierarchy that counts is strength; we have to keep fighting our way up so as not to be ruled by the elements.'),
          ans(54,5,'Als een onderdeel van het web; er is geen boven of onder, wij zijn slechts één draad in het weefsel en volledig afhankelijk van het welzijn van het geheel.','As one part of the web; there is no above or below, we are only one thread in the weave and entirely dependent on the wellbeing of the whole.'),
        ]},
        { id: 55, text: 'Hoe verklaar je wonderen of onverklaarbare toevalligheden?', textEn: 'How do you explain miracles or inexplicable coincidences?', domain: 'spiritualiteit', answers: [
          ans(55,0,'Ik geloof in wonderen, ze maken het leven magisch.','I believe in miracles; they make life magical.'),
          ans(55,1,'Ik ben sceptisch; ik vertrouw liever op wat bewijsbaar is.','I am sceptical; I would rather trust what can be proven.'),
          ans(55,2,'Als pure poëzie van de werkelijkheid.','As pure poetry of reality.'),
          ans(55,3,'Als een knipoog van het universum.','As a wink from the universe.'),
          ans(55,4,'Als een teken dat ik op de goede weg ben.','As a sign that I am on the right path.'),
          ans(55,5,'Als statistische onwaarschijnlijkheden die we nog niet kunnen uitleggen.','As statistical improbabilities we cannot explain yet.'),
        ]},
        { id: 56, text: 'Hoe kijk je naar de dood?', textEn: 'How do you look at death?', domain: 'spiritualiteit', answers: [
          ans(56,0,'Als rust; een vredig einde na een leven van verbinding.','As rest; a peaceful end after a life of connection.'),
          ans(56,1,'Ik ga niet zonder slag of stoot; ik wil leven tot de laatste snik.','I will not go without a fight; I want to live to the last breath.'),
          ans(56,2,'Als het volgende grote avontuur naar het onbekende.','As the next great adventure into the unknown.'),
          ans(56,3,'Als de punchline van de grap die het leven is.','As the punchline of the joke that life is.'),
          ans(56,4,'Als het moment van de waarheid; wat heb ik van mijn leven gemaakt?','As the moment of truth; what have I made of my life?'),
          ans(56,5,'Als het afpellen van een schil; de essentie gaat verder.','As the peeling away of a husk; the essence carries on.'),
        ]},
        { id: 57, text: 'Hoe ervaar jij de leiding van jouw innerlijke kompas of spirituele intuïtie?', textEn: 'How do you experience the guidance of your inner compass or spiritual intuition?', domain: 'spiritualiteit', answers: [
          ans(57,0,'Als de stem van de ratio; ik vertrouw op de helderheid van mijn eigen logica en de analyse van universele wetmatigheden om mijn weg te vinden.','As the voice of reason; I trust the clarity of my own logic and the analysis of universal laws to find my way.'),
          ans(57,1,'Als de roep van de strijd; ik voel een interne, instinctieve drang om op te staan en krachtig te handelen wanneer mijn waarden of doelen in het geding zijn.','As the call to battle; I feel an inner, instinctive urge to rise and act with force whenever my values or goals are at stake.'),
          ans(57,2,'Als het kloppen van mijn hart; ik word geleid door een diepe, emotionele resonantie en het verlangen naar werkelijke versmelting met het geheel.','As the beating of my heart; I am led by a deep, emotional resonance and by the longing to truly merge with the whole.'),
          ans(57,3,'Als een stroom van beelden en symbolen; ik vertrouw op de plotselinge visioenen uit mijn verbeelding die een nieuwe werkelijkheid aankondigen.','As a stream of images and symbols; I trust the sudden visions from my imagination that announce a new reality.'),
          ans(57,4,'Als een onwrikbaar moreel dictaat; ik voel een soevereine plicht om de juiste orde te bewaren en verantwoordelijkheid te dragen voor de toekomst.','As an unshakeable moral dictate; I feel a sovereign duty to preserve the right order and to carry responsibility for the future.'),
          ans(57,5,'Als een stil, onschuldig weten; ik vertrouw intuïtief op de fundamentele goedheid van het leven en geloof dat de juiste weg zich vanzelf ontvouwt.','As a quiet, innocent knowing; I trust intuitively in the fundamental goodness of life and believe the right path unfolds by itself.'),
        ]},
        { id: 58, text: 'Hoe ervaar jij de invloed van onzichtbare informatievelden op jouw leven?', textEn: 'How do you experience the influence of invisible information fields on your life?', domain: 'spiritualiteit', answers: [
          ans(58,0,'Als een actieve krachtbron; ik stem me bewust af op dit veld om intenties te zetten en de werkelijkheid om mij heen vorm te geven.','As an active source of power; I deliberately tune in to this field to set intentions and shape the reality around me.'),
          ans(58,1,'Met gezonde scepsis; ik erken dat er krachten zijn die we niet zien, maar ik vertrouw pas op informatie als deze getoetst is aan de feitelijke realiteit.','With healthy scepticism; I accept that there are forces we do not see, but I only trust information once it has been tested against factual reality.'),
          ans(58,2,'Als een bron van chaos; ik vind het fascinerend hoe \'toevallige\' informatie uit de omgeving mijn plannen overhoop gooit en me dwingt om te relativeren.','As a source of chaos; I find it fascinating how \'random\' information from the surroundings upends my plans and forces me to keep things in perspective.'),
          ans(58,3,'Als een kompas voor ontdekking; ik gebruik subtiele signalen als aanwijzingen om nieuwe wegen te verkennen die buiten het bereik van mijn vijf zintuigen liggen.','As a compass for discovery; I use subtle signals as clues to explore new paths that lie beyond the reach of my five senses.'),
          ans(58,4,'Ik voel instinctief wanneer de collectieve energie gemanipuleerd wordt, en gebruik dat inzicht om mijn autonome koers te varen.','I feel instinctively when the collective energy is being manipulated, and I use that insight to steer my own autonomous course.'),
          ans(58,5,'Als een diepe, emotionele verbondenheid; unus mundus.','As a deep, emotional connectedness; unus mundus.'),
        ]},
        { id: 59, text: 'Hoe ga je om met de donkere kant van de natuur (rampen, ziekte)?', textEn: 'How do you deal with the dark side of nature (disasters, illness)?', domain: 'spiritualiteit', answers: [
          ans(59,0,'Ik bid dat het mij en mijn naasten bespaard blijft.','I pray that it will be spared me and those close to me.'),
          ans(59,1,'We moeten systemen bouwen die bestand zijn tegen chaos.','We have to build systems that can withstand chaos.'),
          ans(59,2,'Zelfs in de vernietiging zit een vreselijke schoonheid.','Even in the destruction there is a terrible beauty.'),
          ans(59,3,'Het maakt me verdrietig, ik wil de pijn verzachten.','It makes me sad; I want to ease the pain.'),
          ans(59,4,'We moeten ons wapenen en beschermen tegen het noodlot.','We have to arm ourselves and guard against fate.'),
          ans(59,5,'Het is onderdeel van de cyclus van opbouw en afbraak.','It is part of the cycle of building up and breaking down.'),
        ]},
        { id: 60, text: 'Wat is de waarde van rituelen?', textEn: 'What is the value of rituals?', domain: 'spiritualiteit', answers: [
          ans(60,0,'Ze brengen mensen samen en geven troost.','They bring people together and give comfort.'),
          ans(60,1,'Ik heb mijn eigen rituelen, ik volg die van anderen niet.','I have my own rituals; I do not follow other people\'s.'),
          ans(60,2,'Ze geven inzicht in de cultuur waar je bent.','They give insight into the culture you are in.'),
          ans(60,3,'Ze zijn theater, maar soms heb je theater nodig om het leven zin te geven.','They are theatre, but sometimes you need theatre to give life meaning.'),
          ans(60,4,'Ze markeren belangrijke overgangen en bevestigen de orde.','They mark important transitions and confirm the order.'),
          ans(60,5,'Ze zijn krachtige tools om energie te focussen en intenties te zetten.','They are powerful tools for focusing energy and setting intentions.'),
        ]},
      ],
    },
  ];
}
