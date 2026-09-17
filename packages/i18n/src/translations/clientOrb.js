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
      nl: (w) => ['⚠ Dit verwijdert je account én alle bijbehorende lezingen permanent (AVG/GDPR). Typ ', w, ' om te bevestigen:'],
      en: (w) => ['⚠ This permanently deletes your account and all readings that belong to it (GDPR). Type ', w, ' to confirm:'],
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
        whyTitle: { nl: 'Archetypische Applicatie', en: 'Archetypal Application' },
        whyLead: {
          nl: 'Wij zijn zeer data-bewust en opereren middels een applicatie om een afgeschermde omgeving te faciliteren.\nDe enkele keer dat er een volledig profiel van jou online komt is zonder naam, adres en gezicht (PDF-generatie) — zodra deze gegevens nodig zijn ben je al ontkoppeld van de cloud.',
          en: 'We are very data-conscious and operate through an application to provide a shielded environment.\nThe only time a full profile of you is online is without name, address or face (PDF generation) — by the time this data is needed, you are already disconnected from the cloud.',
        },
        why1: {
          nl: 'Wij hebben geen toegang tot die map en bewaren er geen kopie van. (De applicatie maakt één eigen werkmap aan in je gebruikersmap en werkt alleen in die map. Je kunt hem verplaatsen.)',
          en: 'We have no access to that folder and keep no copy of it. (The application creates one folder of its own in your user folder and works only in that folder. You can move it.)',
        },
        why2: {
          nl: 'Op onze servers blijft alleen wat je account nodig heeft om te bestaan: je archetype-naam, de vorm van je orb en de teksten op je kaart.',
          en: 'What stays on our servers is only what your account needs in order to exist: your archetype name, the shape of your orb and the texts on your card.',
        },
        why3: {
          nl: "Alle modellen en programma's blijven op onze servers — alleen de gegevens waarmee ze rekenen staan bij jou.",
          en: 'All models and programs stay on our servers — only the data they work with lives with you.',
        },
        whyTail: {
          nl: 'Dit is dezelfde afspraak als in artikel 5a van de voorwaarden en artikel 6 van het privacybeleid.',
          en: 'This is the same arrangement set out in article 5a of the terms and article 6 of the privacy policy.',
        },

        grantTitle: { nl: 'Wat je toestemming precies inhoudt', en: 'What your permission actually covers' },
        grant1: {
          nl: 'De applicatie doorzoekt je apparaat niet en opent geen andere mappen.',
          en: 'The application does not scan your device and opens no other folder.',
        },
        grant2: {
          nl: 'Elk component kun je daarna apart toestemming geven, eenmalig of zolang jij toezegt — met vooraf de vermelding welke gegevens het gebruikt en wat er naar ons wordt verstuurd.',
          en: 'You can then give each component its own permission, once or for as long as you agree — with a note in advance of which data it uses and what is sent to us.',
        },
        grant3: {
          nl: 'Je kunt de toestemming op elk moment intrekken; de map en de inhoud blijven van jou.',
          en: 'You can withdraw the permission at any time; the folder and its contents remain yours.',
        },
        grantWarning: {
          nl: 'Jij draagt volledige verantwoordelijkheid voor het veiligstellen van die map. Raakt hij kwijt — dan is de inhoud onherstelbaar weg.\nWij raden aan een externe geheugen als backup te gebruiken — laten wij die nou net toevallig verkopen!',
          en: 'You carry full responsibility for safeguarding that folder. If it is lost — its contents are gone for good.\nWe recommend using external storage as a backup — and as it happens, we sell exactly that!',
        },

        getTitle: { nl: 'De applicatie ophalen', en: 'Get the application' },
        gate: {
          chip: { nl: 'Desktop-applicatie', en: 'Desktop application' },
          sameInterface: { nl: 'Zelfde interface', en: 'Same interface' },
          ownFolder: { nl: 'Lokale werkmap', en: 'Local folder' },
          autoUpdate: { nl: 'Automatische updates', en: 'Automatic updates' },
        },
        appTitle: { nl: 'De applicatie', en: 'The application' },
        appVersion: { nl: 'Versie', en: 'Version' },
        appUpdate: { nl: 'Updates', en: 'Updates' },
        updateChecking: { nl: 'Zoeken naar een nieuwe versie…', en: 'Looking for a new version…' },
        updateCurrent: { nl: 'Je hebt de nieuwste versie', en: 'You have the latest version' },
        updateDownloading: {
          nl: (v, p) => `Versie ${v} wordt gedownload${p ? ` (${p}%)` : ''}…`,
          en: (v, p) => `Downloading version ${v}${p ? ` (${p}%)` : ''}…`,
        },
        updateReady: { nl: (v) => `Versie ${v} staat klaar`, en: (v) => `Version ${v} is ready` },
        updateError: { nl: 'Kon niet op updates controleren — ben je online?', en: 'Could not check for updates — are you online?' },
        updateErrorMac: {
          nl: 'Op de Mac installeert de applicatie updates voorlopig niet zelf. Download de nieuwste versie via gardenforlife.nl en installeer hem over deze heen — je werkmap blijft staan.',
          en: 'On a Mac the application cannot install updates by itself yet. Download the latest version from gardenforlife.nl and install it over this one — your folder stays where it is.',
        },
        updateDev: { nl: 'Ontwikkelversie — updates staan uit', en: 'Development build — updates are off' },
        updateCheck: { nl: 'Controleren op updates', en: 'Check for updates' },
        updateRestart: { nl: 'Herstarten en bijwerken', en: 'Restart and update' },
        updateNote: {
          nl: 'Nieuwe versies worden vanzelf op de achtergrond gedownload. Jij kiest wanneer je herstart; sluit je de applicatie eerder, dan wordt de update bij het afsluiten geïnstalleerd. Je werkmap blijft daarbij onaangeroerd.',
          en: 'New versions download by themselves in the background. You choose when to restart; if you close the application first, the update installs when it quits. Your folder is left untouched.',
        },
        getLead: {
          nl: 'De app ontkoppelt de privé-data van de cloud en laat apparaten met elkaar verbinden.',
          en: 'The app decouples your private data from the cloud and lets your devices connect to each other.',
        },
        download: {
          win: { nl: 'Download voor Windows', en: 'Download for Windows' },
          macArm: { nl: 'Download voor Mac (Apple Silicon)', en: 'Download for Mac (Apple Silicon)' },
          macIntel: { nl: 'Download voor Mac (Intel)', en: 'Download for Mac (Intel)' },
          linux: { nl: 'Download voor Linux', en: 'Download for Linux' },
          cta: { nl: 'App downloaden', en: 'Download app' },
          other: { nl: 'Ander systeem', en: 'Other system' },
          short: {
            win: { nl: 'Windows', en: 'Windows' },
            macArm: { nl: 'Mac · Apple Silicon', en: 'Mac · Apple Silicon' },
            macIntel: { nl: 'Mac · Intel', en: 'Mac · Intel' },
            linux: { nl: 'Linux', en: 'Linux' },
          },
        },
        unsigned: {
          nl: 'Testversie zonder uitgeverscertificaat: Windows en macOS melden een onbekende uitgever. Dat is normaal. Installeer alleen via de knop hierboven, nooit via een kopie.',
          en: 'Test version without a publisher certificate: Windows and macOS will report an unknown publisher. That is normal. Install only via the button above, never from a copy.',
        },

        // No folder connected: the saved one is missing (moved outside the app, a drive not plugged in)
        // or it was disconnected.
        chooseTitle: { nl: 'Geen werkmap gevonden', en: 'No folder found' },
        chooseLead: {
          nl: 'De applicatie vindt je werkmap niet. Heb je hem zelf verplaatst of staat hij op een externe schijf, koppel hem dan opnieuw. Anders maken we een nieuwe aan in je gebruikersmap.',
          en: 'The application cannot find your folder. If you moved it yourself or it is on an external drive, reconnect it. Otherwise we create a new one in your user folder.',
        },
        createButton: { nl: 'Nieuwe werkmap aanmaken', en: 'Create a new folder' },
        chooseButton: { nl: 'Bestaande werkmap koppelen', en: 'Reconnect an existing folder' },
        choosing: { nl: 'Bezig...', en: 'Working...' },

        // A connected folder that is not (yet) this account's.
        linkTitle: { nl: 'Koppel deze map aan je account', en: 'Link this folder to your account' },
        linkLead: {
          nl: 'Deze map is nog niet aan een account gekoppeld. Een werkmap hoort bij één account; koppel hem aan het jouwe om je hulpmiddelen te ontgrendelen.',
          en: 'This folder is not linked to an account yet. A folder belongs to one account; link it to yours to unlock your tools.',
        },
        linkButton: { nl: 'Koppelen', en: 'Link' },
        foreignTitle: { nl: 'Deze map hoort bij een ander account', en: 'This folder belongs to another account' },
        foreignLead: {
          nl: 'Een werkmap hoort bij één account, zodat gegevens van twee mensen nooit door elkaar raken. Dit account krijgt een eigen werkmap.',
          en: 'A folder belongs to one account, so two people’s data never mix. This account gets a folder of its own.',
        },
        chooseOwn: { nl: 'Eigen map kiezen', en: 'Choose my own folder' },
        createOwn: { nl: 'Eigen werkmap aanmaken', en: 'Create my own folder' },
        rowAccount: { nl: 'Account', en: 'Account' },
        rowAccountLinked: { nl: 'Gekoppeld aan dit account', en: 'Linked to this account' },

        connectedTitle: { nl: 'Je werkmap', en: 'Your folder' },
        rowFolder: { nl: 'Locatie', en: 'Location' },
        rowLayout: { nl: 'Indeling', en: 'Layout' },
        rowId: { nl: 'Map-id', en: 'Folder id' },
        openFolder: { nl: 'Map openen', en: 'Open folder' },
        backup: { nl: 'Reservekopie maken', en: 'Make a backup' },
        backingUp: { nl: 'Bezig...', en: 'Working...' },
        move: { nl: 'Verplaatsen', en: 'Move' },
        moving: { nl: 'Bezig met verplaatsen...', en: 'Moving...' },
        moveNote: {
          nl: 'Je werkmap staat standaard in je gebruikersmap. Verplaatsen zet alles op de plek die je kiest en verwijdert de oude map pas als alles is overgekomen. Kies liever geen map die met OneDrive, iCloud of een andere cloud wordt gesynchroniseerd.',
          en: 'Your folder lives in your user folder by default. Moving puts everything at the location you pick and removes the old folder only once everything has arrived. Preferably avoid a folder synchronised with OneDrive, iCloud or another cloud.',
        },
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
        nl: '⚠ Dit verwijdert je account én alle bijbehorende lezingen permanent. Weet je het zeker?',
        en: '⚠ This permanently deletes your account and every reading that belongs to it. Are you sure?',
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
