import { ARCHETYPES } from '../../data/assessment/archetypes';

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
  const colors = ['#22d3ee', '#a855f7', '#f472b6', '#fbbf24', '#f97316'];
  const date = result.timestamp?.toLocaleDateString() || new Date().toLocaleDateString();

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

  /* ── Screen preview tweaks (hidden in print) ────── */
  @media screen {
    body { padding: 10mm 0; }
  }
</style>
</head>
<body>
<div class="page">

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
  <div class="card card-cyan">
    <p class="card-title" style="color:#22d3ee;">
      <span class="dot" style="background:#22d3ee;"></span>
      De Essentie &mdash; Main Archetype
    </p>
    <h1 class="hero-archetype">${esc(result.extendedArchetypeName || archetypeInfo?.name || result.overallArchetype)}</h1>
    <p class="hero-desc">${esc(archetypeInfo?.description || '')}</p>
    ${result.supportArchetype ? `
    <div style="margin-top:3mm;padding:3mm;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:4px;">
      <p style="color:#c084fc;font-size:9pt;margin:0;">De Vermenigvuldiging &mdash; Support: <strong>${esc(result.supportArchetype)}</strong></p>
      ${result.hasHarmonyBonus ? '<p style="color:#34d399;font-size:8pt;margin:2mm 0 0;">&starf; Harmony Bonus toegepast</p>' : ''}
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
