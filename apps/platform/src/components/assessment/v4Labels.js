/**
 * Deltawerken — v4 surface label map (restructure part 2.3)
 * =========================================================
 * THE single place to tune user-facing terminology for the result surface
 * (post-AI). Structural codes (D1–D5, slot ids, machine tags) stay as the model
 * /parser anchors; this maps them to friendly, language-aware display labels so
 * the renderer can relabel everything in one pass.
 *
 *   - Edit a term here → it changes everywhere it renders (chart, prose, headings).
 *   - Add new entries as more terminology notes come in (extend LABELS + a getter).
 *
 * Language: 'nl' | 'en' (default nl). For 'en'/'uk' use the en maps.
 */

export function langKey(l) {
  return String(l || 'nl').toLowerCase() === 'en' ? 'en' : 'nl';
}

export const LABELS = {
  // ── D-curve phases: "D2" reads as a code; show "Delta-curve fase 2" instead. ──
  // Full (headings/prose) and short (chart axis) forms.
  dPhase: {
    nl: {
      D1: 'Delta-curve fase 1 — Coherent',
      D2: 'Delta-curve fase 2 — Onder spanning',
      D3: 'Delta-curve fase 3 — Vastgezet',
      D4: 'Delta-curve fase 4 — Acuut',
      D5: 'Delta-curve fase 5 — Ineenstorting',
    },
    en: {
      D1: 'Delta-curve phase 1 — Coherent',
      D2: 'Delta-curve phase 2 — Strained',
      D3: 'Delta-curve phase 3 — Entrenched',
      D4: 'Delta-curve phase 4 — Acute',
      D5: 'Delta-curve phase 5 — Collapse',
    },
  },
  dPhaseShort: {
    nl: { D1: 'Fase 1', D2: 'Fase 2', D3: 'Fase 3', D4: 'Fase 4', D5: 'Fase 5' },
    en: { D1: 'Phase 1', D2: 'Phase 2', D3: 'Phase 3', D4: 'Phase 4', D5: 'Phase 5' },
  },

  // ── Section/slot display titles (page-map slot id → heading). Extend as needed. ──
  sectionTitle: {
    nl: {
      identity: 'De Identiteit',
      why_perspective: 'Waarom jij dit perspectief gebruikt',
      main_essence: 'De Essentie',
      support_mult: 'De Vermenigvuldiging',
      shadow: 'De Schaduw',
      blindspot: 'De Blindspot',
      radar_analysis: 'Visuele Analyse — Triple Network Wiel',
      ocean: 'Het OCEAN-profiel',
      morphology: 'Plastische Morfologie — de vorm onder belasting',
      stille_stem: 'De Stille Stem',
      prof_resonance: 'Professionele Resonantie',
      creative_resonance: 'Creatieve Resonantie',
      dual_core: 'Dual-Core Dynamics',
      alchemy: 'De Alchemie van Individuatie',
      neural_board: 'Het Neurale Schakelbord',
      ontological: 'Ontologische Evolutie',
      ocean_compare: 'Persoonlijkheidsrapport Vergelijking',
      ai_prompt: 'De Volledige AI Prompt',
    },
    en: {
      identity: 'The Identity',
      why_perspective: 'Why You Use This Perspective',
      main_essence: 'The Essence',
      support_mult: 'The Multiplication',
      shadow: 'The Shadow',
      blindspot: 'The Blindspot',
      radar_analysis: 'Visual Analysis — Triple Network Wheel',
      ocean: 'The OCEAN Profile',
      morphology: 'Plastic Morphology — the shape under load',
      stille_stem: 'The Quiet Voice',
      prof_resonance: 'Professional Resonance',
      creative_resonance: 'Creative Resonance',
      dual_core: 'Dual-Core Dynamics',
      alchemy: 'The Alchemy of Individuation',
      neural_board: 'The Neural Switchboard',
      ontological: 'Ontological Evolution',
      ocean_compare: 'Personality Report Comparison',
      ai_prompt: 'The Full AI Prompt',
    },
  },
};

/** Friendly D-phase label. `short` → the chart-axis form ("Fase 2"). */
export function dPhaseLabel(d, language, short = false) {
  const map = (short ? LABELS.dPhaseShort : LABELS.dPhase)[langKey(language)];
  return (map && map[d]) || d;
}

/** Display title for a slot id. */
export function sectionTitle(slot, language) {
  const map = LABELS.sectionTitle[langKey(language)];
  return (map && map[slot]) || slot;
}

/**
 * Relabel a prose string for display: standalone "D2" → "Fase 2" etc. Runs after
 * the parser's cleanup (raw D-value lines are already stripped), so this only
 * catches conceptual mentions ("op D2 functioneer je…").
 */
export function relabelProse(text, language) {
  if (!text) return text;
  return text.replace(/\bD([1-5])\b/g, (_m, n) => dPhaseLabel('D' + n, language, true));
}
