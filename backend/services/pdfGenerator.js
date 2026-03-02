/**
 * Garden For Life — PDF Generation Service (Module 4)
 *
 * Generates a clean A4 assessment report using PDFKit.
 * Called from routes/pdf.js with assessment data.
 */
const PDFDocument = require('pdfkit');

const PAGE_W = 595.28; // A4 width in points
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Colors
const GREEN = '#00b46e';
const ORANGE = '#f97316';
const PURPLE = '#a855f7';
const RED = '#dc3c3c';
const BLACK = '#1e1e1e';
const GRAY = '#646464';
const LIGHT_GRAY = '#b4b4b4';

/**
 * Generate a PDF Buffer from assessment data.
 * @param {Object} data - assessment document from MongoDB
 * @returns {Promise<Buffer>}
 */
async function generatePdf(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        info: {
          Title: `Garden For Life — ${data.extendedArchetypeName || data.archetypeKey}`,
          Author: 'Garden For Life Assessment System',
          Subject: 'Consciousness Assessment Report',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Page 1: Cover / Identity ──
      // Brand line
      doc.fontSize(8).fillColor(LIGHT_GRAY)
        .text('GARDEN FOR LIFE  —  Advanced Consciousness Assessment', MARGIN, MARGIN);

      doc.moveTo(MARGIN, MARGIN + 14)
        .lineTo(PAGE_W - MARGIN, MARGIN + 14)
        .strokeColor(GREEN).lineWidth(1).stroke();

      let y = MARGIN + 30;

      // Extended Archetype Name
      doc.fontSize(24).fillColor(PURPLE).font('Helvetica-Bold')
        .text(data.extendedArchetypeName || data.archetypeKey || 'Unknown', MARGIN, y, {
          width: CONTENT_W, align: 'center',
        });
      y += 36;

      // Subtitle (support group)
      if (data.supportGroup) {
        doc.fontSize(11).fillColor(ORANGE).font('Helvetica')
          .text(`Support Group: ${data.supportGroup}`, MARGIN, y, {
            width: CONTENT_W, align: 'center',
          });
        y += 20;
      }

      // Date
      const dateStr = data.createdAt
        ? new Date(data.createdAt).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('nl-NL');
      doc.fontSize(9).fillColor(GRAY).font('Helvetica')
        .text(`Datum: ${dateStr}`, MARGIN, y, {
          width: CONTENT_W, align: 'center',
        });
      y += 30;

      // Horizontal rule
      doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y)
        .strokeColor(LIGHT_GRAY).lineWidth(0.5).stroke();
      y += 16;

      // ── OCEAN Scores ──
      if (data.oceanScores) {
        y = sectionHeading(doc, 'OCEAN Personality Profile', GREEN, y);

        const labels = {
          O: 'Openness (Openheid)',
          C: 'Conscientiousness (Ordelijkheid)',
          E: 'Extraversion (Extraversie)',
          A: 'Agreeableness (Meegaandheid)',
          N: 'Neuroticism (Neuroticisme)',
        };

        Object.entries(data.oceanScores).forEach(([dim, score]) => {
          if (y > PAGE_H - MARGIN - 30) {
            doc.addPage();
            y = MARGIN;
          }
          const label = labels[dim] || dim;
          const barWidth = (score / 10) * (CONTENT_W - 140);

          doc.fontSize(9).fillColor(BLACK).font('Helvetica')
            .text(`${label}:`, MARGIN + 4, y, { width: 140 });

          // Score bar
          doc.rect(MARGIN + 142, y + 1, CONTENT_W - 144, 10)
            .fillColor('#f0f0f0').fill();
          doc.rect(MARGIN + 142, y + 1, barWidth, 10)
            .fillColor(dim === 'N' ? RED : GREEN).fill();

          doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
            .text(`${score}/10`, MARGIN + CONTENT_W - 30, y + 1);

          y += 18;
        });
        y += 8;
      }

      // ── AI Analysis ──
      if (data.analysis) {
        if (y > PAGE_H - MARGIN - 60) {
          doc.addPage();
          y = MARGIN;
        }
        y = sectionHeading(doc, 'AI Analyse', PURPLE, y);

        doc.fontSize(10).fillColor(BLACK).font('Helvetica')
          .text(data.analysis, MARGIN + 4, y, {
            width: CONTENT_W - 8,
            lineGap: 3,
          });
        y = doc.y + 16;
      }

      // ── Layer Results ──
      if (data.subjectResults && data.subjectResults.length > 0) {
        if (y > PAGE_H - MARGIN - 60) {
          doc.addPage();
          y = MARGIN;
        }
        y = sectionHeading(doc, 'Layer Resultaten', GREEN, y);

        data.subjectResults.forEach((sr) => {
          if (y > PAGE_H - MARGIN - 40) {
            doc.addPage();
            y = MARGIN;
          }
          const pct = sr.percentage || 0;
          const barWidth = (pct / 100) * (CONTENT_W - 160);

          doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
            .text(sr.subjectName || 'Layer', MARGIN + 4, y, { width: 130 });

          // Progress bar background
          doc.rect(MARGIN + 140, y + 1, CONTENT_W - 162, 10)
            .fillColor('#f0f0f0').fill();
          // Progress bar fill
          doc.rect(MARGIN + 140, y + 1, Math.max(barWidth, 0), 10)
            .fillColor(GREEN).fill();

          doc.fontSize(8).fillColor(BLACK).font('Helvetica')
            .text(`${pct}%  ·  ${sr.dominantArchetype || ''}`, MARGIN + CONTENT_W - 80, y + 1);

          y += 18;
        });
        y += 8;
      }

      // ── Harmony & Consciousness ──
      if (data.harmonyScore != null || data.consciousnessLevel) {
        if (y > PAGE_H - MARGIN - 40) {
          doc.addPage();
          y = MARGIN;
        }
        y = sectionHeading(doc, 'Bewustzijnsprofiel', PURPLE, y);

        if (data.harmonyScore != null) {
          doc.fontSize(9).fillColor(BLACK).font('Helvetica')
            .text(`Harmony Score: ${data.harmonyScore}`, MARGIN + 4, y);
          y += 14;
        }
        if (data.consciousnessLevel) {
          doc.fontSize(9).fillColor(BLACK).font('Helvetica')
            .text(`Consciousness Level: ${data.consciousnessLevel}`, MARGIN + 4, y);
          y += 14;
        }
        if (data.overallShadow) {
          doc.fontSize(9).fillColor(BLACK).font('Helvetica')
            .text(`Shadow: ${data.overallShadow}`, MARGIN + 4, y);
          y += 14;
        }
        y += 6;
      }

      // ── Individual Question Responses ──
      if (data.responses && data.responses.length > 0) {
        doc.addPage();
        y = MARGIN;
        y = sectionHeading(doc, 'Antwoorden per Vraag', ORANGE, y);

        let currentLayer = null;
        data.responses.forEach((r) => {
          // Layer header when layer changes
          const layerLabel = r.layerName || `Layer ${r.layerIndex}`;
          if (layerLabel !== currentLayer) {
            if (y > PAGE_H - MARGIN - 50) {
              doc.addPage();
              y = MARGIN;
            }
            currentLayer = layerLabel;
            doc.fontSize(10).fillColor(PURPLE).font('Helvetica-Bold')
              .text(layerLabel.toUpperCase(), MARGIN + 4, y);
            y += 16;
          }

          // Check page overflow
          if (y > PAGE_H - MARGIN - 50) {
            doc.addPage();
            y = MARGIN;
          }

          // Question number + archetype badge
          const qNum = r.questionNumber || r.questionId || '?';
          doc.fontSize(8).fillColor(GRAY).font('Helvetica-Bold')
            .text(`Q${qNum}`, MARGIN + 4, y, { continued: true });
          doc.fontSize(8).fillColor(GREEN).font('Helvetica')
            .text(`  [${r.archetypeName || r.archetype || ''}]`, { continued: false });
          y += 12;

          // Question text
          if (r.questionText) {
            doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
              .text(r.questionText, MARGIN + 14, y, { width: CONTENT_W - 24 });
            y = doc.y + 4;
          }

          // Answer text
          if (r.answerText) {
            doc.fontSize(8).fillColor(GREEN).font('Helvetica')
              .text(`→ ${r.answerText}`, MARGIN + 14, y, { width: CONTENT_W - 24 });
            y = doc.y + 8;
          } else {
            y += 4;
          }
        });
        y += 8;
      }

      // ── AI Provider info ──
      if (data.aiProvider) {
        if (y > PAGE_H - MARGIN - 30) {
          doc.addPage();
          y = MARGIN;
        }
        doc.fontSize(7).fillColor(LIGHT_GRAY).font('Helvetica')
          .text(
            `Geanalyseerd door ${data.aiProvider}${data.aiModel ? ` (${data.aiModel})` : ''} — ${data.promptTokens || 0} prompt tokens, ${data.completionTokens || 0} completion tokens`,
            MARGIN, y, { width: CONTENT_W, align: 'center' }
          );
        y += 16;
      }

      // ── Footer ──
      doc.fontSize(7).fillColor(LIGHT_GRAY).font('Helvetica')
        .text('Garden For Life — gardenforlife.nl — Dit rapport is vertrouwelijk',
          MARGIN, PAGE_H - MARGIN - 10, { width: CONTENT_W, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function sectionHeading(doc, title, color, y) {
  doc.rect(MARGIN, y - 2, 3, 14).fillColor(color).fill();
  doc.fontSize(12).fillColor(color).font('Helvetica-Bold')
    .text(title.toUpperCase(), MARGIN + 8, y);
  return y + 20;
}

module.exports = { generatePdf };
