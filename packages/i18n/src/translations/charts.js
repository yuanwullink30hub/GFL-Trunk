/**
 * charts.js — assessment chart copy: SubgroupCounters, SciFiRadarChart, MorphologyChart.
 *
 * Merged into the root translations object by ./index.js under the `charts` key.
 * Series/legend labels here are also what recharts shows in tooltips and legends.
 */
export default {
  charts: {
    // ── SubgroupCounters (Dual-Core Dynamics) ──
    subgroups: {
      title:    { nl: 'Dual-Core Dynamics', en: 'Dual-Core Dynamics' },
      subtitle: {
        nl: 'Niet goed of slecht, maar meer of minder in gebruik.',
        en: 'Not good or bad, just more or less in use.',
      },
      nature:  { nl: 'NATURE', en: 'NATURE' },
      culture: { nl: 'CULTURE', en: 'CULTURE' },
      maxNote: { nl: '( /36 max )', en: '( /36 max )' },
      groups: {
        Ruling:     { network: { nl: 'CEN Dominantie', en: 'CEN Dominance' },              drive: { nl: 'Externe structuur en orde', en: 'External structure and order' } },
        Relational: { network: { nl: 'Limbic Coupling', en: 'Limbic Coupling' },            drive: { nl: 'Emotionele fusie en empathie', en: 'Emotional fusion and empathy' } },
        Seeker:     { network: { nl: 'Hoge Openness', en: 'High Openness' },                drive: { nl: 'Zuiverheid en ontdekking', en: 'Purity and discovery' } },
        Chaos:      { network: { nl: 'Salience Network', en: 'Salience Network' },          drive: { nl: 'Disruptie en lage consciëntieusheid', en: 'Disruption and low conscientiousness' } },
        Abstract:   { network: { nl: 'DMN Hyper-connectie', en: 'DMN Hyper-connectivity' },   drive: { nl: 'Interne reflectie en subjectiviteit', en: 'Internal reflection and subjectivity' } },
        Agency:     { network: { nl: 'Extraversie / Wilskracht', en: 'Extraversion / Willpower' }, drive: { nl: 'Actie en transformatie', en: 'Action and transformation' } },
      },
    },

    // ── SciFiRadarChart (5-layer stacked radar): series, legend and tooltip rows ──
    radar: {
      natureCore:  { nl: 'Natuur Kern',  en: 'Nature Core' },
      hardware:    { nl: 'Hardware',     en: 'Hardware' },
      cultureCore: { nl: 'Cultuur Kern', en: 'Culture Core' },
      hwFeedback:  { nl: 'HW Feedback',  en: 'HW Feedback' },
      cognitive:   { nl: 'Cognitief',    en: 'Cognitive' },
      shadow:      { nl: 'Schaduw',      en: 'Shadow' },
      cognitiveLens: { nl: 'Cognitieve Lens', en: 'Cognitive Lens' },
      feedbackLoop:  { nl: 'Feedback loop',   en: 'Feedback loop' },
      bioHardware:   { nl: 'Bio Hardware',    en: 'Bio Hardware' },
      total:       { nl: 'Total', en: 'Total' },
    },

    // ── MorphologyChart (D-curve) ──
    morphology: {
      composed: { nl: 'Samengesteld', en: 'Composed' },
    },
  },
};
