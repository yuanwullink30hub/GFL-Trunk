/**
 * §6b preset kernels (Dutch, EXACT — locked copy). The chips are QUESTIONS the user can
 * answer; each answer becomes a section in cardPayload v1.1 (declared channel). The main
 * Beschrijving/Intentie text stays entirely self-written — these answers form a SEPARATE
 * readable block the user can draw inspiration from for their own storyline. Nothing is
 * ever pre-filled into their text.
 *
 * Chip order is fixed as listed (WAARDEN precedes PRIJS — the "daarvoor" coupling).
 * Reserved key: `vrij` (freeform).
 *
 * i18n: the Dutch stays the locked copy verbatim; every copy value is an { nl, en } pair.
 * Components resolve them with t(value) (LanguageContext accepts an inline object) or via
 * `leadFor(block, key, language)`.
 */

export const PRESET_KERNELS = {
  description: [
    {
      key: 'richting',
      lead: { nl: 'RICHTING', en: 'DIRECTION' },
      kernel: {
        nl: 'Waar beweeg je naartoe — en wat is er al veranderd?',
        en: 'Where are you moving towards — and what has already changed?',
      },
      sub: null,
    },
    {
      key: 'praktijk',
      lead: { nl: 'PRAKTIJK', en: 'PRACTICE' },
      kernel: {
        nl: 'Wat doe je werkelijk, week in week uit?',
        en: 'What do you actually do, week in, week out?',
      },
      sub: {
        nl: 'Niet je titel — je handelingen. Opleiding hoort hier, als materiaal.',
        en: 'Not your title — your actions. Training belongs here too, as material.',
      },
    },
    {
      key: 'zelfkennis',
      lead: { nl: 'ZELFKENNIS', en: 'SELF-KNOWLEDGE' },
      kernel: {
        nl: 'Hoe werk jij — en wanneer kantelt dat?',
        en: 'How do you work — and when does that tip over?',
      },
      sub: null,
    },
    {
      key: 'waarden',
      lead: { nl: 'WAARDEN', en: 'VALUES' },
      kernel: {
        nl: 'Wat is voor jou werkelijk van waarde?',
        en: 'What truly holds value for you?',
      },
      sub: null,
    },
    {
      key: 'prijs',
      lead: { nl: 'PRIJS', en: 'PRICE' },
      kernel: {
        nl: 'Wat betaal je daarvoor — en wat heb je al betaald?',
        en: 'What do you pay for that — and what have you already paid?',
      },
      sub: { nl: 'In tijd, zekerheid, comfort.', en: 'In time, security, comfort.' },
    },
  ],
  intention: [
    {
      key: 'zoeken',
      lead: { nl: 'ZOEKEN', en: 'SEEKING' },
      kernel: { nl: 'Wat zoek je hier concreet?', en: 'What are you concretely looking for here?' },
      sub: null,
    },
    {
      key: 'bieden',
      lead: { nl: 'BIEDEN', en: 'OFFERING' },
      kernel: {
        nl: 'Wat breng je mee — ook bínnen de samenwerking zelf?',
        en: 'What do you bring — including within the collaboration itself?',
      },
      sub: {
        nl: 'Niet alleen wat je kunt — wat heeft de ander aan jou in de relatie.',
        en: 'Not just what you can do — what the other person gets from you in the relationship.',
      },
    },
    {
      key: 'vorm',
      lead: { nl: 'VORM', en: 'FORM' },
      kernel: { nl: 'Hoe wil je verbonden worden?', en: 'How do you want to be connected?' },
      sub: null,
    },
    {
      key: 'nu',
      lead: { nl: 'NU', en: 'NOW' },
      kernel: { nl: 'Wat is je eerstvolgende stap?', en: 'What is your very next step?' },
      sub: null,
    },
  ],
};

/** lead-in label for a section key (card render anchors) */
export function leadFor(block, key, language = 'nl') {
  const k = (PRESET_KERNELS[block] || []).find((p) => p.key === key);
  if (!k) return String(key).toUpperCase();
  return k.lead[language] || k.lead.nl;
}
