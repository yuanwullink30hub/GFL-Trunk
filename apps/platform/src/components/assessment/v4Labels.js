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

  // ── Section/slot display titles (page-map slot id → heading), Master Prompt v4.1 §5. ──
  sectionTitle: {
    nl: {
      identity: 'De Identiteit',
      verklaring: 'De Verklaring',
      main_essence: 'De Essentie',
      support_mult: 'De Vermenigvuldiging',
      shadow: 'De Schaduw',
      blindspot: 'De Blindspot',
      ocean_o: 'Trait O (Openheid)',
      ocean_c: 'Trait C (Ordelijkheid)',
      ocean_e: 'Trait E (Extraversie)',
      ocean_a: 'Trait A (Meegaandheid)',
      ocean_n: 'Trait N (Neuroticisme)',
      morph_vorm: 'De Vorm',
      morph_hardware: 'De Hardware Onder Druk',
      morph_overgang: 'De Overgang naar de Stille Stem',
      stille_reflectie: 'Reflectie',
      stille_motivatie: 'Motivatie',
      stille_beweging: 'Beweging',
      prof_resonance: 'Professionele Resonantie',
      creative_resonance: 'Creatieve Resonantie',
      alchemy: 'De Alchemie van Individuatie',
      neural_board: 'Het Neurale Schakelbord',
      ontological: 'Ontologische Evolutie',
      ai_prompt: 'De Volledige AI Prompt',
      // page-level titles (render-side)
      morphology_page: 'Plastische Morfologie',
      stille_page: 'De Stille Stem — de Support die de Kern bewerkt',
      ocean_page: 'Persoonlijkheidsrapport Vergelijking',
      ocean_subtitle: 'OCEAN-Gereedschap',
    },
    en: {
      identity: 'The Identity',
      verklaring: 'The Explanation',
      main_essence: 'The Essence',
      support_mult: 'The Multiplication',
      shadow: 'The Shadow',
      blindspot: 'The Blindspot',
      ocean_o: 'Trait O (Openness)',
      ocean_c: 'Trait C (Conscientiousness)',
      ocean_e: 'Trait E (Extraversion)',
      ocean_a: 'Trait A (Agreeableness)',
      ocean_n: 'Trait N (Neuroticism)',
      morph_vorm: 'The Shape',
      morph_hardware: 'The Hardware Under Pressure',
      morph_overgang: 'The Bridge to the Quiet Voice',
      stille_reflectie: 'Reflection',
      stille_motivatie: 'Motivation',
      stille_beweging: 'Movement',
      prof_resonance: 'Professional Resonance',
      creative_resonance: 'Creative Resonance',
      alchemy: 'The Alchemy of Individuation',
      neural_board: 'The Neural Switchboard',
      ontological: 'Ontological Evolution',
      ai_prompt: 'The Full AI Prompt',
      // page-level titles (render-side)
      morphology_page: 'Plastic Morphology',
      stille_page: 'The Quiet Voice — the Support that edits the Core',
      ocean_page: 'Personality Report Comparison',
      ocean_subtitle: 'OCEAN Instrument',
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
