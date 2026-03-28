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

      // ── Pages 3–4: Methodological Context ──
      drawContextPages(doc);

      // ── Page 5+: Assessment Results ──
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
          // Disclaimer block before sections
          if (y > PAGE_H - MARGIN - 100) { doc.addPage(); y = MARGIN; }
          y = drawDisclaimer(doc, y);

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

      // ── Model Images Page ──
      doc.addPage();
      y = MARGIN;

      // Page heading
      doc.fontSize(8).fillColor(LIGHT_GRAY)
        .text('GARDEN FOR LIFE  —  Advanced Consciousness Assessment', MARGIN, y);
      doc.moveTo(MARGIN, y + 14)
        .lineTo(PAGE_W - MARGIN, y + 14)
        .strokeColor(GREEN).lineWidth(1).stroke();
      y += 30;

      doc.fontSize(12).fillColor(GREEN).font('Helvetica-Bold')
        .text('HET MODEL', MARGIN, y, { width: CONTENT_W, align: 'center', characterSpacing: 2 });
      y += 24;

      const modelImages = [
        {
          path: require('path').join(__dirname, '../../src/images/Model imports/Deltawerken png.png'),
          label: 'Het Deltawerken-Model',
        },
        {
          path: require('path').join(__dirname, '../../src/images/Model imports/TNM wheel PNG.png'),
          label: 'De TNM Wheel',
        },
        {
          path: require('path').join(__dirname, '../../src/images/Model imports/Cells within Cells png.png'),
          label: 'Cells within Cells',
        },
      ];

      const imgW = CONTENT_W;
      const imgH = Math.floor((PAGE_H - MARGIN * 2 - 80) / 3) - 16;

      for (const { path: imgPath, label } of modelImages) {
        const fs = require('fs');
        if (y + imgH + 20 > PAGE_H - MARGIN) {
          doc.addPage();
          y = MARGIN;
        }

        // Label
        doc.fontSize(8).fillColor(PURPLE).font('Helvetica-Bold')
          .text(label, MARGIN, y, { width: CONTENT_W, align: 'center' });
        y += 14;

        // Image (skip gracefully if file missing)
        if (fs.existsSync(imgPath)) {
          doc.image(imgPath, MARGIN, y, { width: imgW, height: imgH, fit: [imgW, imgH], align: 'center', valign: 'center' });
        } else {
          doc.rect(MARGIN, y, imgW, imgH)
            .strokeColor(LIGHT_GRAY).lineWidth(0.5).stroke();
          doc.fontSize(8).fillColor(LIGHT_GRAY).font('Helvetica')
            .text('[afbeelding niet beschikbaar]', MARGIN, y + imgH / 2 - 8, { width: CONTENT_W, align: 'center' });
        }

        y += imgH + 16;
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

/**
 * Draw the two fixed context/methodology pages (Belangrijke Context).
 */
function drawContextPages(doc) {
  const ctxSections = [
    {
      heading: 'Belangrijke Context',
      headingColor: PURPLE,
      body: [
        { type: 'para', text: 'Waar traditionele persoonlijkheidstesten je in één hokje plaatsen, brengt het Deltawerken Model in kaart hoe jouw zenuwstelsel navigeert tussen instinct en aanpassing — en wat dat je kost.' },
        { type: 'para', text: 'Het theoretische fundament combineert drie onderzoekstradities: de archetypische psychologie van Carl Jung, het neurobiologische Triple Network Model, en de Big Five persoonlijkheidstheorie (OCEAN). Deze worden samengebracht in het Deltawerken framework dat niet alleen meet wát je doet, maar vanuit welke laag je opereert.' },
      ],
    },
    {
      heading: 'Garden For Life Bronmodellen',
      headingColor: GREEN,
      body: [
        { type: 'sub', text: 'De Deltawerken Driehoek' },
        { type: 'para', text: 'Structureert de verhouding tussen drie fundamentele waardenoriëntaties: waarheid, goedheid en schoonheid. Verwant aan Plato\u2019s transcendentalia bepaalt deze driehoek de dieptelaag van de assessment. In dit model navigeert elk archetype op deze driehoek: niet alleen als gedragskenmerken, maar als oriëntatie op wat er werkelijk toe doet.' },
        { type: 'sub', text: 'Het Triple Network Wiel' },
        { type: 'para', text: 'Positioneert de 12 kern-archetypen op een geometrisch wiel op basis van de drie grote hersennetwerken die Vinod Menon en collega\u2019s beschreven: het Central Executive Network (orde, executie), het Default Mode Network (reflectie, betekenisgeving) en het Salience Network (responsiviteit, adaptatie). De 12 posities zijn verbonden via vijf lijntypes \u2014 gedeelde hardware, feedback-bruggen, schaduwassen, cognitieve synergiedriehoeken en frictie-assen.' },
        { type: 'sub', text: 'Cells within Cells Interlinked' },
        { type: 'para', text: '\u2018Cells within Cells Interlinked\u2019 is het hi\u00EBrarchische model dat de ontologische lagen relationeert naar de maatschappij: van fysiologische basisbehoeften (verwant aan Maslows behoeftehi\u00EBrarchie) via zelfactualisatie en collectief geheugen naar intimiteit en transcendentie. Dit model verklaart waarom onze test niet alleen persoonlijkheid meet, maar de ontwikkelingslaag als dynamiek tussen natuurlijke aanleg en culturele conditionering blootlegt. \u2014 een principe dat Jean Piaget beschreef als cognitieve stadia en dat Carl Jung benaderde als individuatie.' },
      ],
    },
    {
      heading: 'Van Vraag Naar Score',
      headingColor: ORANGE,
      body: [
        { type: 'para', text: 'Het onderzoek bestaat uit 36 vragen verdeeld over vijf onderwerpen: Zelf, Ander, Macht, Wijsheid en Mysterie. Elke vraag biedt zes antwoorden \u2014 drie vanuit Nature (het ongedwongen instinct) en drie vanuit Culture (de aangeleerde strategie). Je kiest er twee: de eerste is je kern, de tweede resoneert maar minder sterk. Dit levert 72 datapunten.' },
        { type: 'para', text: 'Het onderscheid tussen Nature en Culture is gebaseerd op John Vervaeke\u2019s 4P-framework: participatory en perspectival knowing (je weet het doordat je het BENT \u2014 Nature) versus propositional en procedural knowing (je weet DAT je het hebt en HOE je ermee navigeert \u2014 Culture).' },
        { type: 'para', text: 'Elke keuze distribueert punten niet alleen naar het gekozen archetype, maar vloeit via de geometrische verbindingen van het wiel. Een Nature-keuze activeert de biologische hardware (groene en blauwe verbindingen) en werpt een schaduw naar de 180\u00b0 tegenpool (paarse verbinding). Een Culture-keuze activeert het aangeleerde cognitieve netwerk (gele driehoeken).' },
      ],
    },
    {
      heading: 'De Archetypische Laag',
      headingColor: PURPLE,
      body: [
        { type: 'para', text: 'De 12 archetypen zijn geen hokjes maar navigatiestijlen, geworteld in Jungs archetypische theorie en geactualiseerd via de OCEAN-dimensies van Paul Costa en Robert McCrae. Elk archetype heeft een specifiek Big Five-profiel: de Judge scoort hoog op Conscientiousness en laag op Agreeableness; de Lover hoog op Agreeableness en Openness; de Trickster hoog op Openness en laag op Conscientiousness.' },
        { type: 'para', text: 'De zes biologische groepen (Ruling, Relational, Seeker, Chaos, Abstract, Agency) delen neurale hardware. De 180\u00b0 schaduwparen (Judge\u2194Trickster, Lover\u2194Sage, Caregiver\u2194Artist, Innocent\u2194Magician, Explorer\u2194Hero, Outlaw\u2194Ruler) volgen Jungs schaduwtheorie: je grootste groeirichting zit in de integratie van je absolute tegenpool.' },
      ],
    },
    {
      heading: 'Hoe Het Rapport Ontstaat',
      headingColor: GREEN,
      body: [
        { type: 'para', text: 'Na het assessment berekent het systeem je volledige scoreprofiel inclusief de geometrische echo\u2019s. Een AI-model (Claude, Anthropic) analyseert dit profiel aan de hand van het volledige Deltawerken-framework: de drie bronmodellen, de biochemische archetypeprofielen, de 72 Extended Archetypes (Main \u00d7 Support-groep), en \u2014 indien aangeleverd \u2014 je OCEAN-data als externe validatie.' },
        { type: 'para', text: 'Het rapport is geen generieke beschrijving van een type. Het is een dynamische analyse van jouw specifieke scoreprofiel: waar je hardware het sterkst resoneert, welke aangeleerde strategieën je inzet, waar je blinde vlekken zitten, en welke schaduw-integratie je groeirichting vormt.' },
        { type: 'italic', text: 'En mocht je nog twijfelen over de gegenereerde content, alles wat je zojuist hebt gelezen is geschreven door hetzelfde model dat jouw score heeft geanalyseerd.' },
      ],
    },
    {
      heading: 'Wetenschappelijke Context',
      headingColor: ORANGE,
      body: [
        { type: 'para', text: 'Het Deltawerken Model is een zelfreflectie-instrument, geen klinisch diagnostisch systeem. De neurobiologische termen zijn conceptuele metaforen die wetenschappelijk onderzoek als inspiratiebron gebruiken \u2014 geen diagnostische claims.' },
        { type: 'bullet', text: 'Archetypische psychologie: C.G. Jung (1921), Collected Works Vol. 6; Carol Pearson (1991), Awakening the Heroes Within.' },
        { type: 'bullet', text: 'Neurale netwerken: V. Menon (2011), Large-scale brain networks in cognition, Trends in Cognitive Sciences; M.E. Raichle (2001), A default mode of brain function, PNAS.' },
        { type: 'bullet', text: 'Persoonlijkheidstheorie: P.T. Costa & R.R. McCrae (1992), Revised NEO Personality Inventory; L.R. Goldberg (1993), The structure of phenotypic personality traits, American Psychologist.' },
        { type: 'bullet', text: 'Cognitieve ontwikkeling: J. Piaget (1954), The Construction of Reality in the Child; J. Vervaeke (2019), Awakening from the Meaning Crisis; J. Peterson (1999), Maps of Meaning.' },
        { type: 'bullet', text: 'Affectieve neurowetenschappen: J. Panksepp (1998), Affective Neuroscience; S. Porges (2011), The Polyvagal Theory.' },
        { type: 'bullet', text: 'Creativiteit & neurale integratie: M. Benedek et al. (2014), Brain connectivity during creative cognition, Neuropsychologia; R.E. Beaty et al. (2018), Robust prediction of creativity from brain activity, PNAS.' },
      ],
    },
  ];

  doc.addPage();
  let y = MARGIN;

  // Page header
  doc.fontSize(8).fillColor(LIGHT_GRAY).font('Helvetica')
    .text('GARDEN FOR LIFE  \u2014  Methodologische Achtergrond', MARGIN, y);
  doc.moveTo(MARGIN, y + 14).lineTo(PAGE_W - MARGIN, y + 14)
    .strokeColor(PURPLE).lineWidth(0.5).stroke();
  y += 28;

  for (const section of ctxSections) {
    // New page if not enough space for heading + a few lines
    if (y > PAGE_H - MARGIN - 80) {
      doc.addPage();
      y = MARGIN;
      doc.fontSize(8).fillColor(LIGHT_GRAY).font('Helvetica')
        .text('GARDEN FOR LIFE  \u2014  Methodologische Achtergrond', MARGIN, y);
      doc.moveTo(MARGIN, y + 14).lineTo(PAGE_W - MARGIN, y + 14)
        .strokeColor(PURPLE).lineWidth(0.5).stroke();
      y += 28;
    }

    // Section heading with colored left bar
    doc.rect(MARGIN, y, 3, 13).fillColor(section.headingColor).fill();
    doc.fontSize(11).fillColor(section.headingColor).font('Helvetica-Bold')
      .text(section.heading, MARGIN + 8, y);
    y += 18;

    for (const item of section.body) {
      if (y > PAGE_H - MARGIN - 40) {
        doc.addPage();
        y = MARGIN;
        doc.fontSize(8).fillColor(LIGHT_GRAY).font('Helvetica')
          .text('GARDEN FOR LIFE  \u2014  Methodologische Achtergrond', MARGIN, y);
        doc.moveTo(MARGIN, y + 14).lineTo(PAGE_W - MARGIN, y + 14)
          .strokeColor(PURPLE).lineWidth(0.5).stroke();
        y += 28;
      }

      if (item.type === 'sub') {
        y += 2;
        doc.fontSize(9).fillColor(BLACK).font('Helvetica-Bold')
          .text(item.text, MARGIN + 6, y);
        y = doc.y + 3;
      } else if (item.type === 'para') {
        doc.fontSize(8.5).fillColor(GRAY).font('Helvetica')
          .text(item.text, MARGIN + 6, y, { width: CONTENT_W - 6, lineGap: 2 });
        y = doc.y + 7;
      } else if (item.type === 'italic') {
        y += 2;
        doc.fontSize(8.5).fillColor(GRAY).font('Helvetica-Oblique')
          .text(item.text, MARGIN + 6, y, { width: CONTENT_W - 6, lineGap: 2 });
        y = doc.y + 7;
      } else if (item.type === 'bullet') {
        doc.fontSize(8).fillColor(GRAY).font('Helvetica')
          .text('\u2022  ' + item.text, MARGIN + 10, y, { width: CONTENT_W - 10, lineGap: 2 });
        y = doc.y + 4;
      }
    }
    y += 8;
  }
}

function sectionHeading(doc, title, color, y) {
  doc.rect(MARGIN, y - 2, 3, 14).fillColor(color).fill();
  doc.fontSize(12).fillColor(color).font('Helvetica-Bold')
    .text(title.toUpperCase(), MARGIN + 8, y);
  return y + 20;
}

/**
 * Draw a disclaimer block with a red left-side annotation bar.
 * Returns updated y position.
 */
function drawDisclaimer(doc, y) {
  const DISCLAIMER = 'Dit rapport is gegenereerd door het Garden For Life Deltawerken Model \u2014 een zelfreflectie-instrument, geen klinische diagnose. De gebruikte neurobiologische termen zijn metaforen binnen dit specifieke model. Raadpleeg een professional voor medisch of psychologisch advies.';
  const BAR_W = 3;
  const PAD_LEFT = 10;
  const PAD_V = 7;
  const textX = MARGIN + BAR_W + PAD_LEFT;
  const textW = CONTENT_W - BAR_W - PAD_LEFT;

  // Measure text height first
  const textHeight = doc.heightOfString(DISCLAIMER, { width: textW, lineGap: 2 });
  const boxH = textHeight + PAD_V * 2;

  // Light red background fill
  doc.save();
  doc.rect(MARGIN, y, CONTENT_W, boxH).fillColor('#fff5f5').fill();
  // Red left bar
  doc.rect(MARGIN, y, BAR_W, boxH).fillColor(RED).fill();
  doc.restore();

  // Disclaimer text
  doc.fontSize(8.5).fillColor('#7a1f1f').font('Helvetica')
    .text(DISCLAIMER, textX, y + PAD_V, { width: textW, lineGap: 2 });

  return y + boxH + 12;
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
    const title = newlineIdx === -1 ? trimmed : trimmed.substring(0, newlineIdx).trim();
    const body  = newlineIdx === -1 ? ''      : trimmed.substring(newlineIdx + 1).trim();

    // Skip "Leerling Ontologisch Rapport" or standalone "Introductie"/"Inleiding" headers
    if (/leerling\s+ontologisch/i.test(title)) continue;
    if (/^(introductie|inleiding)$/i.test(title)) continue;

    sections.push({ title, body });
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

    // Page overflow check — 100pt safety margin to prevent long paragraphs overflowing off page
    if (y > PAGE_H - MARGIN - 100) {
      doc.addPage();
      y = MARGIN;
    }

    // Skip empty lines (add small gap)
    if (!line.trim()) {
      y += 6;
      continue;
    }

    // Skip horizontal rules (--- or ***)
    if (/^[-*]{3,}\s*$/.test(line.trim())) {
      continue;
    }

    // Sub-header (### or ####)
    const subHeaderMatch = line.match(/^#{3,4}\s+(.+)/);
    if (subHeaderMatch) {
      // Extra safety for headers — needs more space
      if (y > PAGE_H - MARGIN - 60) { doc.addPage(); y = MARGIN; }
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
      if (y > PAGE_H - MARGIN - 20) { doc.addPage(); y = MARGIN; }
      continue;
    }

    // Numbered list (1. 2. 3.)
    const numberedMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      doc.fontSize(9).fillColor(ORANGE).font('Helvetica-Bold')
        .text(`${numberedMatch[1]}.`, MARGIN + 8, y);
      renderInlineFormatted(doc, numberedMatch[2], MARGIN + 24, y, CONTENT_W - 32);
      y = doc.y + 4;
      if (y > PAGE_H - MARGIN - 20) { doc.addPage(); y = MARGIN; }
      continue;
    }

    // Regular paragraph
    renderInlineFormatted(doc, line, MARGIN + 4, y, CONTENT_W - 8);
    y = doc.y + 4;
    // Post-render overflow: if we went past the safe zone, start fresh on next iteration
    if (y > PAGE_H - MARGIN - 20) {
      doc.addPage();
      y = MARGIN;
    }
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
