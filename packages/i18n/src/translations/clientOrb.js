/** clientOrb translations — see translations/index.js */
export default {
  clientOrb: {
    // ═══ ClientOrbExperience — the client landing ═══
    traveler: { nl: 'Reiziger', en: 'Traveller' },
    back: { nl: '← Terug', en: '← Back' },
    logout: { nl: 'Uitloggen', en: 'Log out' },

    // Product destinations (top-centre hub)
    nav: {
      data: { nl: 'Data', en: 'Data' },
      dataSub: { nl: 'tests & cursussen', en: 'tests & courses' },
      kook: { nl: 'Kook-eiland', en: 'Kitchen Island' },
      kookSub: { nl: 'kook je maaltijden', en: 'cook your meals' },
      gardens: { nl: 'Gardens', en: 'Gardens' },
      gardensSub: { nl: 'verbind', en: 'connect' },
    },

    // Centre orb
    profileLoading: { nl: 'Profiel laden…', en: 'Loading profile…' },
    noCrystal: { nl: 'Nog geen kristal.', en: 'No crystal yet.' },
    doTest: { nl: 'Doe de test', en: 'Take the test' },

    // Interaction nodes
    node: {
      report: { nl: 'Rapport', en: 'Report' },
      reportBusy: { nl: 'bezig…', en: 'working…' },
      reportSub: { nl: 'download PDF', en: 'download PDF' },
      code: { nl: 'Profielcode', en: 'Profile code' },
      codeSub: { nl: 'je unieke kristal-code', en: 'your unique crystal code' },
      history: { nl: 'Geschiedenis', en: 'History' },
      historySub: {
        nl: (n) => `${n} assessment${n === 1 ? '' : 's'}`,
        en: (n) => `${n} assessment${n === 1 ? '' : 's'}`,
      },
      account: { nl: 'Account', en: 'Account' },
      accountSub: { nl: 'beheer & verwijderen', en: 'manage & delete' },
    },

    // Code panel
    codeIntro: {
      nl: 'Dit is de unieke code van jouw vloeibare kristal — dezelfde die op je PDF staat. Bewaar hem; hij genereert je orb overal opnieuw, zonder dat wij iets opslaan.',
      en: 'This is the unique code of your liquid crystal — the same one printed on your PDF. Keep it; it regenerates your orb anywhere, without us storing anything.',
    },
    copyCode: { nl: 'Kopieer code', en: 'Copy code' },

    // History panel
    noAssessments: { nl: 'Geen assessments', en: 'No assessments' },

    // Account panel
    visibleName: { nl: 'Zichtbare naam', en: 'Visible name' },
    save: { nl: 'Opslaan', en: 'Save' },
    nameUnique: {
      nl: 'Uniek — geen twee gebruikers delen dezelfde naam.',
      en: 'Unique — no two users share the same name.',
    },
    emailLabel: { nl: 'E-mail', en: 'Email' },
    deleteWarnOrb: {
      nl: (w) => ['⚠ Dit verwijdert je account én alle assessments permanent (AVG/GDPR). Typ ', w, ' om te bevestigen:'],
      en: (w) => ['⚠ This permanently deletes your account and all assessments (GDPR). Type ', w, ' to confirm:'],
    },
    deleting: { nl: 'Bezig…', en: 'Working…' },
    deleteAction: { nl: 'Verwijderen', en: 'Delete' },

    // Messages
    downloadFailed: { nl: 'Download mislukt', en: 'Download failed' },
    deleteWord: { nl: 'VERWIJDER', en: 'DELETE' },
    deleteTypedError: { nl: 'Typ precies "VERWIJDER" om te bevestigen', en: 'Type exactly "DELETE" to confirm' },
    deleteFailed: { nl: 'Verwijderen mislukt', en: 'Delete failed' },
    savedCheck: { nl: 'Opgeslagen ✓', en: 'Saved ✓' },
    updateFailed: { nl: 'Bijwerken mislukt', en: 'Update failed' },

    // ═══ ClientProfileModal — legacy tabbed dashboard ═══
    modal: {
      loading: { nl: 'Laden...', en: 'Loading...' },
      dashboardTitle: { nl: 'Profiel Dashboard', en: 'Profile dashboard' },
      userLine: {
        nl: (name, role, email) => `GEBRUIKER: ${name} · ROL: ${role} · ${email}`,
        en: (name, role, email) => `USER: ${name} · ROLE: ${role} · ${email}`,
      },

      tabs: {
        overview: { nl: 'Overzicht', en: 'Overview' },
        assessments: { nl: 'Assessments', en: 'Assessments' },
        feedback: { nl: 'Feedback', en: 'Feedback' },
        inbox: { nl: 'Inbox', en: 'Inbox' },
        contacten: { nl: 'Contacten', en: 'Contacts' },
        agenda: { nl: 'Agenda', en: 'Calendar' },
      },

      // Delete-account flow
      deleteConfirm: {
        nl: '⚠ Dit verwijdert je account én alle bijbehorende assessments permanent. Weet je het zeker?',
        en: '⚠ This permanently deletes your account and every assessment that belongs to it. Are you sure?',
      },
      deleteProceed: { nl: 'Ja, doorgaan', en: 'Yes, continue' },
      cancel: { nl: 'Annuleren', en: 'Cancel' },
      typeToConfirm: {
        nl: (w) => ['Typ ', w, ' om te bevestigen:'],
        en: (w) => ['Type ', w, ' to confirm:'],
      },
      deleting: { nl: 'Bezig...', en: 'Working...' },
      deleteAccount: { nl: 'Account verwijderen', en: 'Delete account' },
      back: { nl: '← Terug', en: '← Back' },
      backPlain: { nl: 'Terug', en: 'Back' },
      logout: { nl: 'Uitloggen', en: 'Log out' },

      // Overview tab
      identityMatrix: { nl: 'Identiteitsmatrix', en: 'Identity matrix' },
      noArchetype: { nl: 'Geen archetype', en: 'No archetype' },
      activeBadge: { nl: 'ACTIEF', en: 'ACTIVE' },
      fieldUser: { nl: 'Gebruiker', en: 'User' },
      fieldEmail: { nl: 'E-mail', en: 'Email' },
      fieldAccessLevel: { nl: 'Toegangsniveau', en: 'Access level' },
      fieldAssessments: { nl: 'Assessments', en: 'Assessments' },
      fieldArchetype: { nl: 'Archetype', en: 'Archetype' },
      fieldHarmony: { nl: 'Harmonie', en: 'Harmony' },

      personalNotes: { nl: 'Persoonlijke Notities', en: 'Personal notes' },
      notePlaceholder: { nl: 'Notitie toevoegen...', en: 'Add a note...' },
      noteSaved: { nl: '✓ Opgeslagen', en: '✓ Saved' },
      noNotes: { nl: 'Geen notities', en: 'No notes' },

      recentAssessments: { nl: 'Recente Assessments', en: 'Recent assessments' },
      noAssessmentsFound: { nl: 'Geen assessments gevonden', en: 'No assessments found' },

      statLastArchetype: { nl: 'Laatste Archetype', en: 'Latest archetype' },
      statAvgHarmony: { nl: 'Gem. Harmonie', en: 'Avg. harmony' },
      statAccount: { nl: 'Account', en: 'Account' },

      // Assessments tab
      assessmentDetail: { nl: 'Assessment Detail', en: 'Assessment detail' },
      summaryArchetype: {
        nl: (key, group) => `Archetype: ${key} · Support Group: ${group}`,
        en: (key, group) => `Archetype: ${key} · Support group: ${group}`,
      },
      summaryHarmony: {
        nl: (n) => `Harmony Score: ${n}%`,
        en: (n) => `Harmony score: ${n}%`,
      },
      summaryConsciousness: {
        nl: (v) => `Bewustzijnsniveau: ${v}`,
        en: (v) => `Consciousness level: ${v}`,
      },
      summaryShadow: {
        nl: (v) => `Schaduw: ${v}`,
        en: (v) => `Shadow: ${v}`,
      },
      summaryDate: {
        nl: (d) => `Datum: ${d}`,
        en: (d) => `Date: ${d}`,
      },
      oceanScores: { nl: 'OCEAN Scores', en: 'OCEAN scores' },
      layerResults: { nl: 'Laag Resultaten', en: 'Layer results' },
      aiAnalysis: { nl: 'AI Analyse', en: 'AI analysis' },
      assessmentHistory: { nl: 'Assessment Geschiedenis', en: 'Assessment history' },
      detailButton: { nl: 'DETAIL', en: 'DETAIL' },

      // Feedback tab
      sendFeedback: { nl: 'Feedback Versturen', en: 'Send feedback' },
      typeFeedback: { nl: 'Feedback', en: 'Feedback' },
      typeReview: { nl: 'Review', en: 'Review' },
      typeQuestion: { nl: 'Vraag', en: 'Question' },
      typeBug: { nl: 'Bug Report', en: 'Bug report' },
      feedbackPlaceholder: {
        nl: 'Schrijf je feedback, review of vraag...',
        en: 'Write your feedback, review or question...',
      },
      send: { nl: 'Versturen', en: 'Send' },
      feedbackSent: { nl: '✓ Feedback verzonden', en: '✓ Feedback sent' },
      reviewsTitle: {
        nl: (n) => `Reviews & Feedback (${n})`,
        en: (n) => `Reviews & feedback (${n})`,
      },
      you: { nl: 'Jij', en: 'You' },
      noFeedback: { nl: 'Geen feedback of reviews', en: 'No feedback or reviews' },
      clientFallbackName: { nl: 'Client', en: 'Client' },

      // Inbox tab
      inboxTitle: {
        nl: (n) => (n > 0 ? `Inbox (${n} nieuw)` : 'Inbox'),
        en: (n) => (n > 0 ? `Inbox (${n} new)` : 'Inbox'),
      },
      noMessages: { nl: '📭 Geen berichten', en: '📭 No messages' },
      messageFallback: { nl: 'Bericht', en: 'Message' },
      markRead: { nl: 'Gelezen', en: 'Read' },

      // Contacts tab
      contactsTitle: {
        nl: (n) => `Contacten (${n})`,
        en: (n) => `Contacts (${n})`,
      },
      addContact: { nl: '+ Contact Toevoegen', en: '+ Add contact' },
      contactNamePlaceholder: { nl: 'Naam *', en: 'Name *' },
      contactEmailPlaceholder: { nl: 'E-mail', en: 'Email' },
      notePlaceholderPlain: { nl: 'Notitie', en: 'Note' },
      saveButton: { nl: 'Opslaan', en: 'Save' },
      noContacts: { nl: '👥 Geen contacten', en: '👥 No contacts' },

      // Agenda tab
      agendaTitle: {
        nl: (n) => `Agenda (${n} aankomend)`,
        en: (n) => `Calendar (${n} upcoming)`,
      },
      addEvent: { nl: '+ Afspraak Toevoegen', en: '+ Add appointment' },
      eventTitlePlaceholder: { nl: 'Titel *', en: 'Title *' },
      upcoming: { nl: 'Aankomend', en: 'Upcoming' },
      past: { nl: 'Verlopen', en: 'Past' },
      noEvents: { nl: '📅 Geen afspraken', en: '📅 No appointments' },
    },
  },
};
