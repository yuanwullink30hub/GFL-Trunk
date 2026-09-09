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

      // ═══ Werkruimte tab — the local workstation ═══
      // Wording tracks Terms art. 5a/5b and privacy art. 6. If those change, change these.
      workspace: {
        whyTitle: { nl: 'Waarom een eigen werkmap', en: 'Why your own folder' },
        whyLead: {
          nl: 'Je rapport, je volledige profiel en alles wat toekomstige hulpmiddelen voor je maken horen bij jou — niet bij ons. Daarom bewaren we ze niet op onze servers, maar in een map op je eigen apparaat die jij kiest.',
          en: 'Your report, your full profile and everything future tools produce for you belong to you — not to us. So we do not keep them on our servers; they live in a folder on your own device that you choose.',
        },
        why1: {
          nl: 'Wij hebben geen toegang tot die map en bewaren er geen kopie van.',
          en: 'We have no access to that folder and keep no copy of it.',
        },
        why2: {
          nl: 'Op onze servers blijft alleen wat je account nodig heeft om te bestaan: je archetype-naam, de vorm van je orb en de teksten op je kaart.',
          en: 'What stays on our servers is only what your account needs in order to exist: your archetype name, the shape of your orb and the texts on your card.',
        },
        why3: {
          nl: 'Het model en de hulpmiddelen blijven bij ons draaien — alleen de gegevens waarmee ze rekenen staan bij jou.',
          en: 'The model and the tools keep running on our side — only the data they work with lives with you.',
        },
        whyTail: {
          nl: 'Dit is dezelfde afspraak als in artikel 5a van de voorwaarden en artikel 6 van het privacybeleid.',
          en: 'This is the same arrangement set out in article 5a of the terms and article 6 of the privacy policy.',
        },

        grantTitle: { nl: 'Wat je toestemming precies inhoudt', en: 'What your permission actually covers' },
        grantLead: {
          nl: 'Je geeft eenmalig toegang tot één map die je zelf aanwijst. Die toestemming geldt alleen voor die map.',
          en: 'You grant access once, to one folder that you choose yourself. That permission applies to that folder alone.',
        },
        grant1: {
          nl: 'De applicatie doorzoekt je apparaat niet en opent geen andere mappen.',
          en: 'The application does not scan your device and opens no other folder.',
        },
        grant2: {
          nl: 'Elk hulpmiddel vraagt daarna apart om toestemming, met vooraf de vermelding welke gegevens het gebruikt en wat er naar ons wordt verstuurd.',
          en: 'Each tool then asks for consent separately, stating in advance which data it uses and what is sent to us.',
        },
        grant3: {
          nl: 'Je kunt de toestemming op elk moment intrekken; de map en de inhoud blijven van jou.',
          en: 'You can withdraw the permission at any time; the folder and its contents remain yours.',
        },
        grantWarning: {
          nl: 'Omdat wij geen kopie bewaren, ben jij verantwoordelijk voor het veiligstellen van die map. Raakt hij kwijt — door gewiste gegevens, een kapot apparaat of verplaatste bestanden — dan is de inhoud onherstelbaar weg. Wij kunnen die niet terughalen.',
          en: 'Because we keep no copy, safeguarding that folder is your responsibility. If it is lost — through erased data, a failed device or moved files — its contents are gone for good. We cannot recover them.',
        },

        getTitle: { nl: 'De applicatie ophalen', en: 'Get the application' },
        getLead: {
          nl: 'De werkmap werkt via een programma dat je op je computer installeert. De website blijft gewoon werken voor de test, je rapport en je openbare profiel — het programma heb je alleen nodig voor de werkmap en de hulpmiddelen die daarop bouwen.',
          en: 'The folder works through a program you install on your computer. The website keeps working for the test, your report and your public profile — you only need the program for the folder and the tools built on it.',
        },
        download: {
          win: { nl: 'Download voor Windows', en: 'Download for Windows' },
          macArm: { nl: 'Download voor Mac (Apple Silicon)', en: 'Download for Mac (Apple Silicon)' },
          macIntel: { nl: 'Download voor Mac (Intel)', en: 'Download for Mac (Intel)' },
          linux: { nl: 'Download voor Linux', en: 'Download for Linux' },
        },
        notYet: {
          nl: 'De applicatie is er bijna. Zodra hij klaar is verschijnt de downloadknop hier en krijg je bericht op het e-mailadres van je account.',
          en: 'The application is nearly ready. As soon as it is, the download button appears here and you will hear from us at your account email address.',
        },
        unsigned: {
          nl: 'Tijdens de testfase brengen wij de applicatie uit zonder uitgeverscertificaat. Windows en macOS waarschuwen dan dat de uitgever niet geverifieerd is. Dat hoort erbij en betekent niet dat er iets mis is — maar installeer hem uitsluitend via de knop hierboven en nooit via een kopie van iemand anders.',
          en: 'During the testing phase we release the application without a publisher certificate, so Windows and macOS will warn that the publisher cannot be verified. That is expected and does not mean anything is wrong — but install it only via the button above, never from a copy obtained elsewhere.',
        },

        chooseTitle: { nl: 'Kies je werkmap', en: 'Choose your folder' },
        chooseLead: {
          nl: 'Kies een map waarin je gegevens komen te staan. Een lege map op een plek die je zelf terugvindt werkt het prettigst — bijvoorbeeld in je documentenmap.',
          en: 'Pick a folder for your data to live in. An empty folder somewhere you will find it again works best — inside your documents folder, for instance.',
        },
        chooseButton: { nl: 'Map kiezen', en: 'Choose folder' },
        choosing: { nl: 'Bezig...', en: 'Working...' },

        connectedTitle: { nl: 'Je werkmap', en: 'Your folder' },
        rowFolder: { nl: 'Locatie', en: 'Location' },
        rowLayout: { nl: 'Indeling', en: 'Layout' },
        rowId: { nl: 'Map-id', en: 'Folder id' },
        openFolder: { nl: 'Map openen', en: 'Open folder' },
        backup: { nl: 'Reservekopie maken', en: 'Make a backup' },
        backingUp: { nl: 'Bezig...', en: 'Working...' },
        disconnect: { nl: 'Loskoppelen', en: 'Disconnect' },
        disconnectNote: {
          nl: 'Loskoppelen vergeet alleen waar de map staat. De map zelf en alles erin blijven op je apparaat staan.',
          en: 'Disconnecting only forgets where the folder is. The folder itself and everything in it stay on your device.',
        },
      },

      tabs: {
        overview: { nl: 'Overzicht', en: 'Overview' },
        werkruimte: { nl: 'Werkruimte', en: 'Workspace' },
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
