/** ocean translations — see translations/index.js
 *  Namespace for OceanManualInputModal (manual OCEAN / Big Five score entry).
 */
export default {
  ocean: {
    title: {
      nl: 'Persoonlijkheidsscores Invoeren',
      en: 'Enter Personality Scores',
    },
    subtitle: {
      nl: 'Verplichte hoofd-scores (0–100). Klik op ▾ om optionele sub-scores te tonen.',
      en: 'Required main scores (0–100). Click ▾ to show optional sub-scores.',
    },
    closeTitle: {
      nl: 'Sluiten',
      en: 'Close',
    },
    required: {
      nl: 'VEREIST',
      en: 'REQUIRED',
    },
    optional: {
      nl: 'optioneel',
      en: 'optional',
    },
    subToggleTitle: {
      nl: 'Sub-scores tonen/verbergen',
      en: 'Show/hide sub-scores',
    },
    subToggleLabel: {
      nl: 'sub',
      en: 'sub',
    },
    validationError: {
      nl: '✕ Vul alle scores met VEREIST in voordat u opslaat.',
      en: '✕ Fill in every score marked REQUIRED before you save.',
    },
    cancel: {
      nl: 'Annuleren',
      en: 'Cancel',
    },
    save: {
      nl: 'Scores opslaan',
      en: 'Save scores',
    },

    // Main traits — the English values match the `eng` field already on the TRAITS data.
    traits: {
      O: { nl: 'Openheid voor Ervaringen', en: 'Openness' },
      C: { nl: 'Consciëntieusheid', en: 'Conscientiousness' },
      E: { nl: 'Extraversie', en: 'Extraversion' },
      A: { nl: 'Meegaandheid', en: 'Agreeableness' },
      N: { nl: 'Neuroticisme', en: 'Neuroticism' },
      H: { nl: 'Eerlijkheid-Nederigheid', en: 'Honesty-Humility' },
    },

    // Sub-traits (aspect level).
    subTraits: {
      O_intellect: { nl: 'Intellect', en: 'Intellect' },
      O_esthetiek: { nl: 'Esthetiek', en: 'Aesthetics' },
      C_ijver: { nl: 'IJver', en: 'Industriousness' },
      C_ordelijkheid: { nl: 'Ordelijkheid', en: 'Orderliness' },
      E_enthousiasme: { nl: 'Enthousiasme', en: 'Enthusiasm' },
      E_assertiviteit: { nl: 'Assertiviteit', en: 'Assertiveness' },
      A_compassie: { nl: 'Compassie', en: 'Compassion' },
      A_beleefdheid: { nl: 'Beleefdheid', en: 'Politeness' },
      N_terughoudendheid: { nl: 'Terughoudendheid', en: 'Withdrawal' },
      N_volatiliteit: { nl: 'Volatiliteit', en: 'Volatility' },
    },
  },
};
