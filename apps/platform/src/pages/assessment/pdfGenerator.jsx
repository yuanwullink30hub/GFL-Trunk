import { ARCHETYPES } from '@gfl/assessment-core/data/archetypes';
import { getArchetypeQuote } from '@gfl/assessment-core/data/archetypeQuotes';

export async function generatePDF(result) {
  const content = generatePDFContent(result);
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      // Small delay so styles/fonts render before print dialog
      setTimeout(() => {
        printWindow.print();
        URL.revokeObjectURL(url);
      }, 400);
    };
  }
}

/* ── Helpers ─────────────────────────────────────────── */

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMarkdownish(text) {
  if (!text) return '';
  return text.split('\n').map(line => {
    if (!line.trim()) return '<br/>';
    if (line.startsWith('### ')) return `<h5 class="ai-h4">${esc(line.slice(4))}</h5>`;
    if (line.startsWith('## '))  return `<h4 class="ai-h3">${esc(line.slice(3))}</h4>`;
    if (line.startsWith('# '))   return `<h3 class="ai-h2">${esc(line.slice(2))}</h3>`;
    if (line.startsWith('- ') || line.startsWith('* '))
      return `<p class="ai-bullet">&bull; ${esc(line.slice(2))}</p>`;
    // bold lines
    if (line.startsWith('**') && line.endsWith('**'))
      return `<p class="ai-bold">${esc(line.slice(2, -2))}</p>`;
    return `<p class="ai-body">${esc(line)}</p>`;
  }).join('\n');
}

/* ── Main template ───────────────────────────────────── */

function generatePDFContent(result) {
  const archetypeInfo = ARCHETYPES[result.overallArchetype];
  const levensles = getArchetypeQuote(result.mainArchetype || result.overallArchetype, result.supportGroup);
  const colors = ['#22d3ee', '#a855f7', '#f472b6', '#fbbf24', '#f97316'];
  const date = result.timestamp?.toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' }) || new Date().toLocaleDateString('nl-NL');
  const displayName = result.extendedArchetypeName || archetypeInfo?.name || result.overallArchetype;
  const profileImage = archetypeInfo?.imageUrl || '';

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8"/>
<title>Garden for Life — Consciousness Profile</title>
<style>
  /* ── Print-critical ─────────────────────────────── */
  @page {
    size: A4;
    margin: 16mm 14mm 18mm 14mm;
  }
  *, *::before, *::after { box-sizing: border-box; }

  html, body {
    margin: 0; padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    background: #060612;
    color: #e2e8f0;
  }

  /* ── Layout container ───────────────────────────── */
  .page { max-width: 700px; margin: 0 auto; padding: 0 4mm; }

  /* ── Brand header ───────────────────────────────── */
  .brand {
    text-align: center;
    padding: 10mm 0 6mm;
    border-bottom: 1px solid #22d3ee33;
    margin-bottom: 6mm;
  }
  .brand-name {
    font-size: 9pt;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: #22d3ee;
    margin: 0 0 3mm;
  }
  .brand-sub {
    font-size: 7pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #64748b;
    margin: 0;
  }

  /* ── Cards ──────────────────────────────────────── */
  .card {
    background: #0c0c1d;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 5mm 6mm;
    margin-bottom: 4mm;
    page-break-inside: avoid;
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
  }
  .card-cyan::before  { background: linear-gradient(90deg, #22d3ee, transparent 70%); }
  .card-purple::before { background: linear-gradient(90deg, #a855f7, transparent 70%); }
  .card-emerald::before { background: linear-gradient(90deg, #10b981, transparent 70%); }
  .card-amber::before { background: linear-gradient(90deg, #f59e0b, transparent 70%); }

  .card-title {
    font-size: 8pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0 0 3mm;
    display: flex;
    align-items: center;
    gap: 2mm;
  }
  .card-title .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    display: inline-block;
  }

  /* ── Primary archetype hero ─────────────────────── */
  .hero-archetype {
    font-size: 22pt;
    font-weight: 300;
    color: #fff;
    margin: 2mm 0 3mm;
    line-height: 1.2;
  }
  .hero-desc {
    color: #94a3b8;
    font-size: 9.5pt;
    line-height: 1.6;
    margin: 0 0 4mm;
  }
  .shadow-box {
    background: #1a0a0a;
    border: 1px solid #7f1d1d;
    border-radius: 6px;
    padding: 3mm 4mm;
    color: #fca5a5;
    font-size: 9pt;
  }
  .shadow-box strong { color: #f87171; }

  /* ── Stats row ──────────────────────────────────── */
  .stats-grid {
    display: flex;
    gap: 3mm;
    margin-bottom: 4mm;
  }
  .stat-card {
    flex: 1;
    background: #0c0c1d;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 4mm 4mm;
    text-align: center;
    page-break-inside: avoid;
  }
  .stat-label {
    font-size: 6.5pt;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #64748b;
    margin: 0 0 1.5mm;
  }
  .stat-value {
    font-size: 14pt;
    font-weight: 600;
    margin: 0;
  }

  /* ── Quantum resonance ──────────────────────────── */
  .quote {
    font-style: italic;
    color: #cbd5e1;
    line-height: 1.7;
    font-size: 10pt;
  }

  /* ── Layer bars ─────────────────────────────────── */
  .layer {
    background: #0c0c1d;
    border: 1px solid #1e293b;
    border-radius: 6px;
    padding: 3.5mm 4mm;
    margin-bottom: 2.5mm;
    page-break-inside: avoid;
  }
  .layer-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2mm;
  }
  .layer-name {
    font-weight: 600;
    font-size: 9.5pt;
  }
  .layer-pct {
    font-size: 9pt;
    font-weight: 600;
  }
  .bar-track {
    height: 5px;
    background: #1e293b;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 2mm;
  }
  .bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: none;
  }
  .layer-detail {
    font-size: 8pt;
    color: #64748b;
    margin: 0.5mm 0;
  }
  .layer-insight {
    font-size: 8.5pt;
    color: #94a3b8;
    margin: 0.5mm 0;
  }
  .layer-rec {
    font-size: 8.5pt;
    color: #22d3ee;
    margin: 0.5mm 0;
  }

  /* ── AI Analysis ────────────────────────────────── */
  .ai-h2 { font-size: 12pt; font-weight: 500; color: #6ee7b7; margin: 4mm 0 2mm; }
  .ai-h3 { font-size: 10.5pt; font-weight: 500; color: #34d399; margin: 3mm 0 1.5mm; }
  .ai-h4 { font-size: 9.5pt; font-weight: 500; color: #10b981; margin: 2mm 0 1mm; }
  .ai-bullet { margin: 0.5mm 0; padding-left: 4mm; color: #cbd5e1; font-size: 9pt; }
  .ai-bold { font-weight: 600; color: #e2e8f0; margin: 2mm 0; font-size: 9pt; }
  .ai-body { color: #cbd5e1; margin: 0.5mm 0; font-size: 9pt; line-height: 1.6; }
  .ai-provider {
    font-size: 6.5pt;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 1px;
    float: right;
    margin-top: -3mm;
  }

  /* ── Footer ─────────────────────────────────────── */
  .footer {
    text-align: center;
    font-size: 7pt;
    color: #334155;
    padding: 6mm 0 2mm;
    border-top: 1px solid #1e293b;
    margin-top: 6mm;
    letter-spacing: 1px;
  }

  /* ── Page-break hints ───────────────────────────── */
  .section-break { page-break-before: auto; }
  .keep-together { page-break-inside: avoid; }

  /* ── Cover Page ─────────────────────────────────── */
  .cover-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 90vh;
    text-align: center;
    page-break-after: always;
  }
  .cover-image-wrap {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid rgba(168, 85, 247, 0.5);
    box-shadow: 0 0 40px rgba(168, 85, 247, 0.2), 0 0 80px rgba(34, 211, 238, 0.1);
    margin-bottom: 8mm;
  }
  .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transform: scale(1.05);
  }
  .cover-name {
    font-size: 26pt;
    font-weight: 300;
    color: #fff;
    margin: 0 0 3mm;
    letter-spacing: 1px;
  }
  .cover-subtitle {
    font-size: 10pt;
    color: #a855f7;
    margin: 0 0 8mm;
  }
  .cover-quote {
    font-style: italic;
    font-size: 10pt;
    color: #cbd5e1;
    max-width: 420px;
    line-height: 1.7;
    border-left: 3px solid #a855f7;
    padding: 10px 18px;
    background: rgba(168, 85, 247, 0.06);
    text-align: left;
  }
  .cover-date {
    font-size: 7.5pt;
    color: #475569;
    margin-top: 10mm;
    letter-spacing: 1px;
  }

  /* ── Legal Page ─────────────────────────────────── */
  .legal-page {
    page-break-after: always;
  }
  .legal-header {
    text-align: center;
    margin-bottom: 6mm;
    padding-bottom: 3mm;
    border-bottom: 1px solid #1e293b;
  }
  .legal-header h2 {
    font-size: 13pt;
    color: #f59e0b;
    margin: 0 0 2mm;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-weight: 600;
  }
  .legal-header p {
    font-size: 7.5pt;
    color: #64748b;
    margin: 0;
  }
  .legal-section {
    margin-bottom: 4mm;
    page-break-inside: avoid;
  }
  .legal-section h4 {
    font-size: 8.5pt;
    color: #22d3ee;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 0 0 1.5mm;
    padding-bottom: 1mm;
    border-bottom: 1px solid rgba(34, 211, 238, 0.15);
  }
  .legal-section p, .legal-section li {
    font-size: 7.5pt;
    color: #94a3b8;
    line-height: 1.55;
    margin: 0.8mm 0;
  }
  .legal-section ul {
    margin: 1mm 0;
    padding-left: 5mm;
  }
  .legal-highlight {
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 6px;
    padding: 3mm 4mm;
    margin: 4mm 0;
  }
  .legal-highlight p {
    font-size: 8pt;
    color: #fbbf24;
    margin: 0;
    text-align: center;
    line-height: 1.6;
  }
  .legal-footer-note {
    text-align: center;
    font-size: 6.5pt;
    color: #334155;
    margin-top: 6mm;
    padding-top: 3mm;
    border-top: 1px solid #1e293b;
    letter-spacing: 1px;
  }

  /* ── Screen preview tweaks (hidden in print) ────── */
  @media screen {
    body { padding: 10mm 0; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- ════════════════════════════════════════════ -->
  <!-- PAGE 1: COVER                               -->
  <!-- ════════════════════════════════════════════ -->
  <div class="cover-page">
    <p class="brand-name">Garden for Life</p>
    <p class="brand-sub">Advanced Consciousness Assessment</p>
    ${profileImage ? `<div class="cover-image-wrap"><img class="cover-image" src="${profileImage}" alt="${esc(displayName)}" /></div>` : ''}
    <h1 class="cover-name">${esc(displayName)}</h1>
    ${result.supportArchetype ? `<p class="cover-subtitle">Support: ${esc(result.supportArchetype)}</p>` : ''}
    ${levensles ? `<div class="cover-quote">&ldquo;${esc(levensles)}&rdquo;</div>` : ''}
    <p class="cover-date">${esc(date)}</p>
  </div>

  <!-- ════════════════════════════════════════════ -->
  <!-- PAGE 2: JURIDISCHE INFORMATIE               -->
  <!-- ════════════════════════════════════════════ -->
  <div class="legal-page">
    <div class="legal-header">
      <h2>Juridische Informatie</h2>
      <p>Lees deze pagina zorgvuldig door voordat u verder leest</p>
    </div>

    <div class="legal-highlight">
      <p>Dit rapport is gegenereerd door een AI-model en vormt <strong>geen klinische diagnose</strong>,
      medisch advies of psychologisch oordeel. De resultaten zijn indicatief binnen het
      Garden for Life-model en mogen niet worden gebruikt als vervanging voor professionele hulpverlening.</p>
    </div>

    <div class="legal-section">
      <h4>1. Modeldisclaimer</h4>
      <p>Garden for Life gebruikt het Deltawerken-Model, een metaforisch raamwerk gebaseerd op 12 archetypische
      patronen. Alle termen zoals &ldquo;Nature&rdquo;, &ldquo;Culture&rdquo;, &ldquo;Shadow&rdquo; en
      &ldquo;Polarization&rdquo; zijn <em>modelconcepten</em> &mdash; geen biologische, neurologische of
      medische feiten. De analyse beschrijft antwoordpatronen, niet uw persoonlijkheid als vaststaand gegeven.</p>
    </div>

    <div class="legal-section">
      <h4>2. AI-Transparantie (EU AI Act)</h4>
      <p>De persoonlijkheidsanalyse in dit rapport is gegenereerd door een groot taalmodel (LLM).
      Conform de EU AI Act informeren wij u dat:</p>
      <ul>
        <li>De analyse is gebaseerd op uw antwoorden op de assessment-vragen en eventueel ge&uuml;ploade documenten</li>
        <li>Het AI-systeem kan onnauwkeurigheden, vooroordelen of hallucinaties bevatten</li>
        <li>De output mag niet worden beschouwd als objectieve waarheid of wetenschappelijk bewijs</li>
        <li>Er vindt g&eacute;&eacute;n geautomatiseerde besluitvorming plaats op basis van deze resultaten</li>
      </ul>
    </div>

    <div class="legal-section">
      <h4>3. Gegevensbescherming (AVG / GDPR)</h4>
      <p>Uw assessment-gegevens worden verwerkt op grond van uw uitdrukkelijke toestemming (Art. 6 lid 1a AVG).
      Bijzondere persoonsgegevens (antwoordpatronen die indirect psychologische kenmerken kunnen onthullen) worden
      verwerkt op grond van Art. 9 lid 2a AVG. U heeft te allen tijde het recht op:</p>
      <ul>
        <li>Inzage, rectificatie en verwijdering van uw gegevens</li>
        <li>Intrekking van uw toestemming</li>
        <li>Overdraagbaarheid van uw gegevens (dataportabiliteit)</li>
        <li>Het indienen van een klacht bij de Autoriteit Persoonsgegevens</li>
      </ul>
    </div>

    <div class="legal-section">
      <h4>4. Gegevensbewaring</h4>
      <p>Uw assessment-resultaten worden maximaal <strong>90 dagen</strong> bewaard op beveiligde servers,
      waarna ze automatisch en onherroepelijk worden verwijderd. Dit rapport is uw persoonlijke kopie.
      Garden for Life bewaart na verwijdering geen kopie van uw resultaten.</p>
    </div>

    <div class="legal-section">
      <h4>5. Intellectueel Eigendom</h4>
      <p>Het Deltawerken-Model, de archetypische geometrie, de vragenlijst en de visuele ontwerpen zijn
      intellectueel eigendom van Garden for Life / Yuan Wu. Dit rapport is uitsluitend voor persoonlijk gebruik.
      Reproductie, distributie of commerci&euml;le exploitatie zonder schriftelijke toestemming is verboden.</p>
    </div>

    <div class="legal-section">
      <h4>6. Beperkingen &amp; Aansprakelijkheid</h4>
      <p>Garden for Life aanvaardt geen aansprakelijkheid voor beslissingen genomen op basis van dit rapport.
      Bij psychische klachten of zorgen wordt u dringend aangeraden contact op te nemen met een gekwalificeerde
      zorgprofessional. De resultaten zijn een startpunt voor zelfreflectie, niet een eindoordeel.</p>
    </div>

    <div class="legal-footer-note">
      Door dit rapport te downloaden bevestigt u kennis te hebben genomen van bovenstaande voorwaarden.<br/>
      Volledige juridische documenten: www.gardenforlife.nl &nbsp;&bull;&nbsp; Contact: info@gardenforlife.nl
    </div>
  </div>

  <!-- ════════════════════════════════════════════ -->
  <!-- PAGE 3+: ASSESSMENT RESULTATEN              -->
  <!-- ════════════════════════════════════════════ -->

  <!-- Brand header -->
  <div class="brand">
    <p class="brand-name">Garden for Life</p>
    <p class="brand-sub">Advanced Consciousness Assessment</p>
  </div>

  <!-- Meta line -->
  <p style="text-align:center;font-size:7pt;color:#475569;margin:0 0 6mm;">
    Profile ${esc(result.id)} &nbsp;&middot;&nbsp; ${esc(date)}
  </p>

  <!-- PRIMARY ARCHETYPE -->
  <div class="card card-purple">
    <p class="card-title" style="color:#a855f7;">
      <span class="dot" style="background:#a855f7;"></span>
      De Essentie &mdash; Main Archetype
    </p>
    <h1 class="hero-archetype">${esc(result.extendedArchetypeName || archetypeInfo?.name || result.overallArchetype)}</h1>
    <p class="hero-desc">${esc(levensles || '')}</p>
    ${result.supportArchetype ? `
    <div style="margin-top:3mm;padding:3mm;background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);border-radius:4px;">
      <p style="color:#f97316;font-size:9pt;margin:0;">De Vermenigvuldiging &mdash; Support: <strong>${esc(result.supportArchetype)}</strong></p>
    </div>` : ''}
    <div class="shadow-box">
      <strong>Schaduw: </strong>${esc(result.shadowArchetype || archetypeInfo?.shadow || '')}
      ${result.blindspotArchetype ? `<br/><strong>Blindspot: </strong>${esc(result.blindspotArchetype)}` : ''}
    </div>
    ${result.isIndividuated ? '<p style="color:#34d399;font-size:8pt;margin-top:2mm;">&lowast; Individuatie Gedetecteerd &mdash; Meesterschap over de Paradox</p>' : ''}
  </div>

  <!-- STATS ROW -->
  <div class="stats-grid">
    <div class="stat-card">
      <p class="stat-label">Authenticity</p>
      <p class="stat-value" style="color:#22d3ee;">${esc(String(result.authenticityIndex || 0))}%</p>
    </div>
    <div class="stat-card">
      <p class="stat-label">Polarization</p>
      <p class="stat-value" style="color:#a855f7;">${esc(String(result.polarizationIndex || 0))}</p>
    </div>
    <div class="stat-card">
      <p class="stat-label">Nature</p>
      <p class="stat-value" style="color:#10b981;">${esc(String(result.totalNaturePoints || 0))}</p>
    </div>
    <div class="stat-card">
      <p class="stat-label">Culture</p>
      <p class="stat-value" style="color:#fbbf24;">${esc(String(result.totalCulturePoints || 0))}</p>
    </div>
  </div>


  ${result.aiAnalysis ? `
  <!-- AI ANALYSIS -->
  <div class="card card-emerald section-break">
    <p class="card-title" style="color:#10b981;">
      <span class="dot" style="background:#10b981;"></span>
      AI Persoonlijkheidsanalyse
    </p>
    ${result.aiProvider ? `<span class="ai-provider">${esc(result.aiProvider)} / ${esc(result.aiModel)}</span>` : ''}
    <div>${renderMarkdownish(result.aiAnalysis)}</div>
  </div>
  ` : ''}

  <!-- LAYER ANALYSIS -->
  <div class="section-break">
    <div class="card card-amber" style="margin-bottom:3mm;">
      <p class="card-title" style="color:#f59e0b;">
        <span class="dot" style="background:#f59e0b;"></span>
        Layer Analysis
      </p>
    </div>

    ${result.subjectResults.map((s, i) => `
    <div class="layer keep-together">
      <div class="layer-head">
        <span class="layer-name" style="color:${colors[i]};">${i + 1}. ${esc(s.subjectName)}</span>
        <span class="layer-pct" style="color:${colors[i]};">${s.percentage}%</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${s.percentage}%;background:${colors[i]};"></div>
      </div>
      <p class="layer-detail">Archetype: ${esc(s.dominantArchetype)}</p>
    </div>`).join('')}
  </div>

  <!-- FOOTER -->
  <div class="footer">
    WWW.GARDENFORLIFE.NL &nbsp;&bull;&nbsp; CONSCIOUSNESS PROFILE
  </div>

</div>
</body>
</html>`;
}

export default generatePDF;
