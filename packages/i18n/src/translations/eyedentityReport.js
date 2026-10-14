/**
 * eyedentityReport — copy for the Eyedentity "Persoonlijk Profiel" tab.
 *
 * Covers the page shell and the standalone feedback form messages.
 */
export default {
  eyedentityReport: {
    // ── Page shell ──
    shell: {
      protocolLabel: {
        nl: 'Persoonlijk Protocol Interface',
        en: 'Personal Protocol Interface',
      },
    },

    // ── Standalone feedback form (validation + success copy) ──
    feedback: {
      emailRequired: { nl: 'Vul je e-mailadres in', en: 'Please enter your email address' },
      scoreRequired: { nl: 'Selecteer een score (1-9)', en: 'Please select a score (1-9)' },
      textRequired: {
        nl: 'Vul minimaal één tekstveld in',
        en: 'Please fill in at least one text field',
      },
      thanksTitle: { nl: 'Dank je wel voor je feedback!', en: 'Thank you for your feedback!' },
      thanksBody: {
        nl: 'Jouw reactie is ontvangen en draagt bij aan de verbetering van dit systeem.',
        en: 'Your response has been received and helps improve this system.',
      },
    },

  },
};
