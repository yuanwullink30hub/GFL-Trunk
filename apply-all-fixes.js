const fs = require('fs');
const path = 'src/components/assessment/AssessmentResultsModal.js';
let f = fs.readFileSync(path, 'utf8');
const orig = f.length;

// ── 1. Green color replacements (skip radar chart) ──
// #00b46e → #1d9904
f = f.replace(/#00b46e/g, '#1d9904');
// #22c55e → #1d9904
f = f.replace(/#22c55e/g, '#1d9904');
// rgba(0, 180, 110, ...) → rgba(29, 153, 4, ...)
f = f.replace(/rgba\(0, 180, 110/g, 'rgba(29, 153, 4');
// rgba(0,180,110, ...) → rgba(29,153,4, ...)
f = f.replace(/rgba\(0,180,110/g, 'rgba(29,153,4');
// rgb string '0, 180, 110' used in template literals for rgb prop
f = f.replace(/'0, 180, 110'/g, "'29, 153, 4'");
// [21, 85, 12] → [29, 153, 4] (PDF RGB arrays)
f = f.replace(/\[21, 85, 12\]/g, '[29, 153, 4]');
// [34, 197, 94] → [29, 153, 4]
f = f.replace(/\[34, 197, 94\]/g, '[29, 153, 4]');

// ── 2. OCEAN rainbow bar → blue gradient ──
f = f.replace(
  "linear-gradient(to right, #f97316, #a855f7, #fbbf24, #ef4444, #1d9904)",
  "linear-gradient(to right, transparent, #3b82f6, transparent)"
);

// ── 3. Download button: remove reviewSubmitted gate, change label ──
// onClick gate: reviewSubmitted → true (always allow if email filled)
f = f.replace(
  "if (!isGeneratingPdf && reviewSubmitted) { setPdfConsentChecked(false); setShowPdfConsent(true); }",
  "if (!isGeneratingPdf) { setPdfConsentChecked(false); setShowPdfConsent(true); }"
);
// disabled prop
f = f.replace(
  "disabled={isGeneratingPdf || !reviewSubmitted}",
  "disabled={isGeneratingPdf}"
);
// title prop
f = f.replace(
  "title={!reviewSubmitted ? 'Please submit feedback first' : undefined}\n                      style={{",
  "style={{"
);
// cursor
f = f.replace(
  "cursor: (isGeneratingPdf || !reviewSubmitted) ? 'not-allowed' : 'pointer',",
  "cursor: isGeneratingPdf ? 'not-allowed' : 'pointer',"
);
// opacity
f = f.replace(
  "opacity: (isGeneratingPdf || !reviewSubmitted) ? 0.5 : 1,",
  "opacity: isGeneratingPdf ? 0.5 : 1,"
);
// hover guard
f = f.replace(
  "if (!isGeneratingPdf && reviewSubmitted) {\n                          e.currentTarget.style.background = '#1d9904';",
  "if (!isGeneratingPdf) {\n                          e.currentTarget.style.background = '#1d9904';"
);
// Button text: t('results.downloadPdf') → VOLLEDIGE RAPPORT
f = f.replace("{t('results.downloadPdf')}", "VOLLEDIGE RAPPORT");

// ── 4. Create Account button: remove reviewSubmitted gate ──
f = f.replace(
  "disabled={!reviewSubmitted}\n                      title={!reviewSubmitted ? 'Please submit feedback first' : undefined}\n                      style={{",
  "style={{"
);
f = f.replace(
  "cursor: !reviewSubmitted ? 'not-allowed' : 'pointer',",
  "cursor: 'pointer',"
);
f = f.replace(
  "opacity: !reviewSubmitted ? 0.5 : 1,",
  "opacity: 1,"
);
f = f.replace(
  "if (reviewSubmitted) {\n                          e.currentTarget.style.boxShadow",
  "{\n                          e.currentTarget.style.boxShadow"
);

// ── 5. Email form: offwhite text, normal brightness ──
// Label color: dimmed gray → offwhite
f = f.replace(
  "color: '#a855f7',\n                            fontFamily: \"'Figtree', sans-serif\",\n                            fontSize: '0.85rem',\n                            fontWeight: 'bold',\n                            marginBottom: '0.5rem',\n                          }}>\n                            E-mailadres",
  "color: '#e2e8f0',\n                            fontFamily: \"'Figtree', sans-serif\",\n                            fontSize: '0.85rem',\n                            fontWeight: 'bold',\n                            marginBottom: '0.5rem',\n                          }}>\n                            E-mailadres"
);

fs.writeFileSync(path, f, 'utf8');

// Verify
const f2 = fs.readFileSync(path, 'utf8');
const verify = {
  '#1d9904': (f2.match(/#1d9904/g)||[]).length,
  '#00b46e': (f2.match(/#00b46e/g)||[]).length,
  '#22c55e': (f2.match(/#22c55e/g)||[]).length,
  'rgba(0, 180, 110': (f2.match(/rgba\(0, 180, 110/g)||[]).length,
  'rgba(0,180,110': (f2.match(/rgba\(0,180,110/g)||[]).length,
  'reviewSubmitted_in_JSX': (f2.match(/reviewSubmitted/g)||[]).length,
  'VOLLEDIGE RAPPORT': (f2.match(/VOLLEDIGE RAPPORT/g)||[]).length,
  'rainbow_bar': (f2.match(/f97316.*a855f7.*fbbf24/g)||[]).length,
  'blue_bar': (f2.match(/transparent.*3b82f6.*transparent/g)||[]).length,
  'e2e8f0': (f2.match(/#e2e8f0/g)||[]).length,
};
console.log('File size:', orig, '→', f2.length);
console.log(JSON.stringify(verify, null, 2));
