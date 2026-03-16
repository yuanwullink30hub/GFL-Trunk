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
      // Brand line — centered, top of page
      doc.fontSize(8).fillColor(LIGHT_GRAY)
        .text('GARDEN FOR LIFE', MARGIN, MARGIN + 40, {
          width: CONTENT_W, align: 'center',
          characterSpacing: 5,
        });
      doc.fontSize(7).fillColor(GRAY)
        .text('Advanced Consciousness Assessment', MARGIN, MARGIN + 56, {
          width: CONTENT_W, align: 'center',
          characterSpacing: 2,
        });

      // Profile image circle (centered, below brand)
      const imgCenterX = PAGE_W / 2;
      const imgCenterY = 260;
      const imgRadius = 80;
      doc.save();
      doc.circle(imgCenterX, imgCenterY, imgRadius).clip();
      // Placeholder circle with purple fill (actual image would replace this)
      doc.circle(imgCenterX, imgCenterY, imgRadius)
        .fillColor('#1a1a2e').fill();
      doc.restore();
      // Circle border
      doc.circle(imgCenterX, imgCenterY, imgRadius)
        .strokeColor(PURPLE).lineWidth(2).stroke();

      // Extended Archetype Name — large centered
      const displayName = data.extendedArchetypeName || data.archetypeKey || 'Unknown';
      let y = imgCenterY + imgRadius + 30;
      doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold')
        .text(displayName, MARGIN, y, {
          width: CONTENT_W, align: 'center',
        });
      y += 40;

      // Support archetype subtitle
      if (data.supportGroup) {
        doc.fontSize(11).fillColor(PURPLE).font('Helvetica')
          .text(`Support: ${data.supportGroup}`, MARGIN, y, {
            width: CONTENT_W, align: 'center',
          });
        y += 24;
      }

      // Quote / archetype description
      const quote = data.archetypeDescription || '';
      if (quote) {
        y += 10;
        // Purple left bar
        doc.rect(MARGIN + 80, y, 3, 60).fillColor(PURPLE).fill();
        doc.fontSize(10).fillColor(LIGHT_GRAY).font('Helvetica-Oblique')
          .text(`"${quote}"`, MARGIN + 92, y + 6, {
            width: CONTENT_W - 180, align: 'left',
            lineGap: 4,
          });
        y = Math.max(y + 70, doc.y + 10);
      }

      // Date
      const dateStr = data.createdAt
        ? new Date(data.createdAt).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('nl-NL');
      doc.fontSize(8).fillColor(GRAY).font('Helvetica')
        .text(`Datum: ${dateStr}`, MARGIN, PAGE_H - MARGIN - 30, {
          width: CONTENT_W, align: 'center',
        });

      // ── Page 2: Juridische Informatie ──
      doc.addPage();
      y = MARGIN;

      // Legal header
      doc.fontSize(14).fillColor(ORANGE).font('Helvetica-Bold')
        .text('JURIDISCHE INFORMATIE', MARGIN, y, {
          width: CONTENT_W, align: 'center',
          characterSpacing: 2,
        });
      y += 22;
      doc.fontSize(7).fillColor(GRAY).font('Helvetica')
        .text('Lees deze pagina zorgvuldig door voordat u verder leest', MARGIN, y, {
          width: CONTENT_W, align: 'center',
        });
      y += 16;
      doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y)
        .strokeColor(LIGHT_GRAY).lineWidth(0.5).stroke();
      y += 12;

      // Main disclaimer box
      doc.rect(MARGIN, y, CONTENT_W, 52)
        .fillColor('#1a1308').fill();
      doc.rect(MARGIN, y, CONTENT_W, 52)
        .strokeColor(ORANGE).lineWidth(0.5).stroke();
      doc.fontSize(8).fillColor(ORANGE).font('Helvetica-Bold')
        .text('Dit rapport is gegenereerd door een AI-model en vormt geen klinische diagnose, medisch advies of psychologisch oordeel. De resultaten zijn indicatief binnen het Garden for Life-model en mogen niet worden gebruikt als vervanging voor professionele hulpverlening.',
          MARGIN + 10, y + 8, { width: CONTENT_W - 20, align: 'center', lineGap: 3 });
      y += 64;

      // Legal sections
      const legalSections = [
        {
          title: '1. MODELDISCLAIMER',
          text: 'Garden for Life gebruikt het Deltawerken-Model, een metaforisch raamwerk gebaseerd op 12 archetypische patronen. Alle termen zoals "Nature", "Culture", "Shadow" en "Polarization" zijn modelconcepten — geen biologische, neurologische of medische feiten. De analyse beschrijft antwoordpatronen, niet uw persoonlijkheid als vaststaand gegeven.',
        },
        {
          title: '2. AI-TRANSPARANTIE (EU AI ACT)',
          text: 'De persoonlijkheidsanalyse is gegenereerd door een groot taalmodel (LLM). De analyse is gebaseerd op uw antwoorden en eventueel geüploade documenten. Het AI-systeem kan onnauwkeurigheden of hallucinaties bevatten. De output mag niet worden beschouwd als objectieve waarheid. Er vindt géén geautomatiseerde besluitvorming plaats.',
        },
        {
          title: '3. GEGEVENSBESCHERMING (AVG / GDPR)',
          text: 'Uw gegevens worden verwerkt op grond van uitdrukkelijke toestemming (Art. 6 lid 1a AVG). Bijzondere persoonsgegevens worden verwerkt op grond van Art. 9 lid 2a AVG. U heeft recht op inzage, rectificatie, verwijdering, intrekking van toestemming, dataportabiliteit, en het indienen van een klacht bij de Autoriteit Persoonsgegevens.',
        },
        {
          title: '4. GEGEVENSBEWARING',
          text: 'Uw assessment-resultaten worden maximaal 90 dagen bewaard op beveiligde servers, waarna ze automatisch en onherroepelijk worden verwijderd. Dit rapport is uw persoonlijke kopie. Garden for Life bewaart na verwijdering geen kopie.',
        },
        {
          title: '5. INTELLECTUEEL EIGENDOM',
          text: 'Het Deltawerken-Model, de archetypische geometrie, de vragenlijst en de visuele ontwerpen zijn intellectueel eigendom van Garden for Life / Yuan Wu. Dit rapport is uitsluitend voor persoonlijk gebruik. Reproductie, distributie of commerciële exploitatie zonder toestemming is verboden.',
        },
        {
          title: '6. BEPERKINGEN & AANSPRAKELIJKHEID',
          text: 'Garden for Life aanvaardt geen aansprakelijkheid voor beslissingen genomen op basis van dit rapport. Bij psychische klachten wordt u dringend aangeraden contact op te nemen met een gekwalificeerde zorgprofessional. De resultaten zijn een startpunt voor zelfreflectie, niet een eindoordeel.',
        },
      ];

      legalSections.forEach((section) => {
        if (y > PAGE_H - MARGIN - 70) {
          doc.addPage();
          y = MARGIN;
        }
        doc.fontSize(8).fillColor(GREEN).font('Helvetica-Bold')
          .text(section.title, MARGIN, y);
        y += 12;
        doc.fontSize(7.5).fillColor(GRAY).font('Helvetica')
          .text(section.text, MARGIN + 4, y, {
            width: CONTENT_W - 8,
            lineGap: 2,
          });
        y = doc.y + 10;
      });

      // Legal footer
      y += 4;
      doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y)
        .strokeColor(LIGHT_GRAY).lineWidth(0.5).stroke();
      y += 8;
      doc.fontSize(6.5).fillColor(GRAY).font('Helvetica')
        .text('Door dit rapport te downloaden bevestigt u kennis te hebben genomen van bovenstaande voorwaarden.', MARGIN, y, {
          width: CONTENT_W, align: 'center',
        });
      y += 10;
      doc.fontSize(6.5).fillColor(GRAY).font('Helvetica')
        .text('Volledige juridische documenten: www.gardenforlife.nl  •  Contact: info@gardenforlife.nl', MARGIN, y, {
          width: CONTENT_W, align: 'center',
        });

      // ── Page 3+: Assessment Results ──
      doc.addPage();
      y = MARGIN;

      // Brand line for results pages
      doc.fontSize(8).fillColor(LIGHT_GRAY)
        .text('GARDEN FOR LIFE  —  Advanced Consciousness Assessment', MARGIN, y);
      doc.moveTo(MARGIN, y + 14)
        .lineTo(PAGE_W - MARGIN, y + 14)
        .strokeColor(GREEN).lineWidth(1).stroke();
      y += 30;

      // ── OCEAN Scores (0-100) ──
      if (data.oceanScores) {
        y = sectionHeading(doc, 'OCEAN Personality Profile', GREEN, y);

        const labels = {
          O: 'Openness (Openheid)',
          C: 'Conscientiousness (Ordelijkheid)',
          E: 'Extraversion (Extraversie)',
          A: 'Agreeableness (Meegaandheid)',
          N: 'Neuroticism (Neuroticisme)',
        };

        const dimColors = {
          O: '#a855f7', C: '#22d3ee', E: '#fbbf24', A: '#f472b6', N: '#ef4444',
        };

        Object.entries(data.oceanScores).forEach(([dim, score]) => {
          if (y > PAGE_H - MARGIN - 30) {
            doc.addPage();
            y = MARGIN;
          }
          const label = labels[dim] || dim;
          const pct = Math.min(Math.max(score, 0), 100);
          const barWidth = (pct / 100) * (CONTENT_W - 160);

          doc.fontSize(9).fillColor(BLACK).font('Helvetica')
            .text(`${label}:`, MARGIN + 4, y, { width: 150 });

          // Score bar background
          doc.rect(MARGIN + 152, y + 1, CONTENT_W - 162, 10)
            .fillColor('#f0f0f0').fill();
          // Score bar fill
          doc.rect(MARGIN + 152, y + 1, barWidth, 10)
            .fillColor(dimColors[dim] || GREEN).fill();

          doc.fontSize(8).fillColor(BLACK).font('Helvetica-Bold')
            .text(`${pct}%`, MARGIN + CONTENT_W - 30, y + 1);

          y += 18;
        });
        y += 8;
      }

      // ── AI Analysis — 12 Sections ──
      if (data.analysis) {
        const sections = parseAnalysisSections(data.analysis);

        if (sections.length > 0) {
          // Section accent colors cycle through brand palette
          const sectionColors = [
            PURPLE, GREEN, ORANGE, PURPLE, GREEN, ORANGE,
            PURPLE, GREEN, ORANGE, PURPLE, GREEN, ORANGE,
          ];

          for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const color = sectionColors[i % sectionColors.length];

            // Always start a new page for each section (clean layout)
            if (i > 0 || y > PAGE_H - MARGIN - 120) {
              doc.addPage();
              y = MARGIN;
            }

            // Section heading with colored sidebar
            y = sectionHeading(doc, section.title, color, y);

            // Render body with markdown-aware formatting
            y = renderMarkdownBody(doc, section.body, y);
          }
        } else {
          // Fallback: no parseable sections — render as plain text
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

/**
 * Parse AI analysis text into sections by ## headers.
 * Returns array of { title, body } objects.
 */
function parseAnalysisSections(text) {
  if (!text) return [];
  const sections = [];
  // Split on ## headers (e.g. "## 1. De Identiteit" or "## 12. Genereer een ...")
  const parts = text.split(/^##\s+/m);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // First line is the title, rest is body
    const newlineIdx = trimmed.indexOf('\n');
    if (newlineIdx === -1) {
      sections.push({ title: trimmed, body: '' });
    } else {
      sections.push({
        title: trimmed.substring(0, newlineIdx).trim(),
        body: trimmed.substring(newlineIdx + 1).trim(),
      });
    }
  }
  return sections;
}

/**
 * Render markdown-ish body text into PDFKit with basic formatting:
 * - **bold** text
 * - ### sub-headers
 * - - bullet lists
 * - Regular paragraphs
 * Returns updated y position.
 */
function renderMarkdownBody(doc, body, startY) {
  if (!body) return startY;

  let y = startY;
  const lines = body.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Page overflow check
    if (y > PAGE_H - MARGIN - 30) {
      doc.addPage();
      y = MARGIN;
    }

    // Skip empty lines (add small gap)
    if (!line.trim()) {
      y += 6;
      continue;
    }

    // Sub-header (### or ####)
    const subHeaderMatch = line.match(/^#{3,4}\s+(.+)/);
    if (subHeaderMatch) {
      y += 4;
      doc.fontSize(10).fillColor(PURPLE).font('Helvetica-Bold')
        .text(subHeaderMatch[1], MARGIN + 4, y, { width: CONTENT_W - 8 });
      y = doc.y + 6;
      continue;
    }

    // Bullet line (- or •)
    const bulletMatch = line.match(/^\s*[-•]\s+(.+)/);
    if (bulletMatch) {
      const bulletText = bulletMatch[1];
      doc.fontSize(9).fillColor(GREEN).font('Helvetica')
        .text('•', MARGIN + 8, y);
      renderInlineFormatted(doc, bulletText, MARGIN + 20, y, CONTENT_W - 28);
      y = doc.y + 4;
      continue;
    }

    // Numbered list (1. 2. 3.)
    const numberedMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      doc.fontSize(9).fillColor(ORANGE).font('Helvetica-Bold')
        .text(`${numberedMatch[1]}.`, MARGIN + 8, y);
      renderInlineFormatted(doc, numberedMatch[2], MARGIN + 24, y, CONTENT_W - 32);
      y = doc.y + 4;
      continue;
    }

    // Regular paragraph
    renderInlineFormatted(doc, line, MARGIN + 4, y, CONTENT_W - 8);
    y = doc.y + 4;
  }

  return y + 8;
}

/**
 * Render a single line with inline **bold** formatting.
 */
function renderInlineFormatted(doc, text, x, y, width) {
  // Split on **bold** markers
  const segments = text.split(/(\*\*[^*]+\*\*)/);
  let first = true;

  for (const segment of segments) {
    if (!segment) continue;
    const boldMatch = segment.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
        .text(boldMatch[1], first ? x : undefined, first ? y : undefined, {
          width, continued: true,
        });
    } else {
      doc.fontSize(9).fillColor(BLACK).font('Helvetica')
        .text(segment, first ? x : undefined, first ? y : undefined, {
          width, continued: true,
        });
    }
    first = false;
  }
  // End the line
  doc.text('', { continued: false });
}

module.exports = { generatePdf };
