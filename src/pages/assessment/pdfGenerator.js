import { ARCHETYPES } from './assessmentTypes';

export async function generatePDF(result) {
  const content = generatePDFContent(result);
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      URL.revokeObjectURL(url);
    };
  }
}

function generatePDFContent(result) {
  const archetypeInfo = ARCHETYPES[result.overallArchetype];

  return `<!DOCTYPE html>
<html>
<head>
  <title>Garden for Life - Consciousness Profile</title>
  <style>
    body { font-family: 'Courier New', monospace; background: #050510; color: #f5f5f5; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #22d3ee; font-size: 28px; margin-bottom: 10px; }
    h2 { color: #a855f7; font-size: 18px; margin-bottom: 30px; }
    h3 { color: #fbbf24; font-size: 16px; margin-top: 30px; margin-bottom: 15px; }
    .archetype { font-size: 24px; color: #fff; margin: 20px 0; }
    .shadow { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 15px; border-radius: 8px; margin: 15px 0; }
    .stat { display: inline-block; margin-right: 30px; margin-bottom: 15px; }
    .stat-label { font-size: 12px; color: #888; text-transform: uppercase; }
    .stat-value { font-size: 18px; color: #22d3ee; }
    .layer { border: 1px solid #333; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .layer-header { display: flex; justify-content: space-between; align-items: center; }
    .progress-bar { height: 8px; background: #222; border-radius: 4px; margin: 10px 0; }
    .progress-fill { height: 100%; border-radius: 4px; }
    .insight { font-size: 13px; color: #aaa; margin: 5px 0; }
    .recommendation { font-size: 13px; color: #22d3ee; margin: 5px 0; }
    .prompt { background: #0a0a15; border: 1px solid #333; padding: 15px; border-radius: 8px; font-size: 12px; white-space: pre-wrap; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #555; }
  </style>
</head>
<body>
  <h1>GARDEN FOR LIFE</h1>
  <h2>CONSCIOUSNESS PROFILE</h2>
  <p style="color: #666; font-size: 12px;">ID: ${result.id} | Generated: ${result.timestamp.toLocaleDateString()}</p>

  <h3>PRIMARY ARCHETYPE</h3>
  <div class="archetype">${archetypeInfo?.name || result.overallArchetype}</div>
  <p>${archetypeInfo?.description}</p>
  <div class="shadow">
    <strong>Shadow Aspect:</strong> ${archetypeInfo?.shadow}
  </div>

  <h3>HARMONY METRICS</h3>
  <div class="stat">
    <div class="stat-label">Harmony Score</div>
    <div class="stat-value">${result.harmonyScore}%</div>
  </div>
  <div class="stat">
    <div class="stat-label">Consciousness Level</div>
    <div class="stat-value">${result.consciousnessLevel}</div>
  </div>

  <h3>QUANTUM RESONANCE</h3>
  <p style="font-style: italic; color: #ccc;">"${result.quantumResonance}"</p>

  <h3>LAYER ANALYSIS</h3>
  ${result.subjectResults.map((s, i) => {
    const colors = ["#22d3ee", "#a855f7", "#f472b6", "#fbbf24", "#f97316"];
    return `
  <div class="layer">
    <div class="layer-header">
      <strong style="color: ${colors[i]}">${i + 1}. ${s.subjectName}</strong>
      <span>${s.percentage}% Integration</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${s.percentage}%; background: ${colors[i]}"></div>
    </div>
    <p style="font-size: 12px; color: #888;">Archetype: ${s.dominantArchetype}</p>
    ${s.insights.map(insight => `<div class="insight">• ${insight}</div>`).join("")}
    ${s.recommendations.map(rec => `<div class="recommendation">→ ${rec}</div>`).join("")}
  </div>`;
  }).join("")}

  <h3>AI TRAINING PROMPT</h3>
  <div class="prompt">${result.aiTrainingPrompt}</div>

  <div class="footer">
    www.gardenforlife.nl<br>
    Cells within Cells Interlinked
  </div>
</body>
</html>`;
}

export default generatePDF;
