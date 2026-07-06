/**
 * §6b preset kernels (Dutch, EXACT — locked copy). The chips are QUESTIONS the user can
 * answer; each answer becomes a section in cardPayload v1.1 (declared channel). The main
 * Beschrijving/Intentie text stays entirely self-written — these answers form a SEPARATE
 * readable block the user can draw inspiration from for their own storyline. Nothing is
 * ever pre-filled into their text.
 *
 * Chip order is fixed as listed (WAARDEN precedes PRIJS — the "daarvoor" coupling).
 * Reserved key: `vrij` (freeform).
 */

export const PRESET_KERNELS = {
  description: [
    { key: 'richting', lead: 'RICHTING', kernel: 'Waar beweeg je naartoe — en wat is er al veranderd?', sub: null },
    { key: 'praktijk', lead: 'PRAKTIJK', kernel: 'Wat doe je werkelijk, week in week uit?', sub: 'Niet je titel — je handelingen. Opleiding hoort hier, als materiaal.' },
    { key: 'zelfkennis', lead: 'ZELFKENNIS', kernel: 'Hoe werk jij — en wanneer kantelt dat?', sub: null },
    { key: 'waarden', lead: 'WAARDEN', kernel: 'Wat is voor jou werkelijk van waarde?', sub: null },
    { key: 'prijs', lead: 'PRIJS', kernel: 'Wat betaal je daarvoor — en wat heb je al betaald?', sub: 'In tijd, zekerheid, comfort.' },
  ],
  intention: [
    { key: 'zoeken', lead: 'ZOEKEN', kernel: 'Wat zoek je hier concreet?', sub: null },
    { key: 'bieden', lead: 'BIEDEN', kernel: 'Wat breng je mee — ook bínnen de samenwerking zelf?', sub: 'Niet alleen wat je kunt — wat heeft de ander aan jou in de relatie.' },
    { key: 'vorm', lead: 'VORM', kernel: 'Hoe wil je verbonden worden?', sub: null },
    { key: 'nu', lead: 'NU', kernel: 'Wat is je eerstvolgende stap?', sub: null },
  ],
};

/** lead-in label for a section key (card render anchors) */
export function leadFor(block, key) {
  const k = (PRESET_KERNELS[block] || []).find((p) => p.key === key);
  return k ? k.lead : key.toUpperCase();
}
