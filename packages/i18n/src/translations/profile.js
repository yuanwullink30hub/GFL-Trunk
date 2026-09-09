/** profile translations — see translations/index.js
 *
 *  Covers: ProfileCard, ProfileDashboard (Openbaar / Privé / Instellingen),
 *  PublicProfile, and the two copy data modules (profileCardMicrocopy,
 *  presetKernels).
 */
export default {
  profile: {
    /* ── ProfileCard — the public profile card ─────────────────────────── */
    card: {
      transparentProfile: { nl: 'Transparant profiel', en: 'Transparent profile' },
      expressionProfile: { nl: 'Expressieprofiel', en: 'Expression profile' },
      modelNote: {
        nl: 'Binnen dit model: een waarschijnlijke tendens, geen bepaling.',
        en: 'Within this model: a likely tendency, not a verdict.',
      },
      travellerFallback: { nl: 'Reiziger', en: 'Traveller' },
      memberSince: {
        nl: (date) => `Lid sinds ${date}`,
        en: (date) => `Member since ${date}`,
      },
      shadowProfiles: {
        nl: (n) => `SCHADUWPROFIELEN · ${n} ${n === 1 ? 'LEZING' : 'LEZINGEN'}`,
        en: (n) => `SHADOW PROFILES · ${n} ${n === 1 ? 'READING' : 'READINGS'}`,
      },
      giftLine: {
        nl: (gift) => `*Gift* — ${gift}.`,
        en: (gift) => `*Gift* — ${gift}.`,
      },
      lastReading: {
        nl: (date) => `LAATSTE LEZING ${date}`,
        en: (date) => `LAST READING ${date}`,
      },
      lastOnline: {
        nl: (date) => `LAATST ONLINE ${date}`,
        en: (date) => `LAST ONLINE ${date}`,
      },
      linkPlaceholder: { nl: 'https://jouweigenlink.nl', en: 'https://yourownlink.com' },
      socialNotLinked: {
        nl: (label) => `${label} — niet gekoppeld`,
        en: (label) => `${label} — not linked`,
      },
      socialSyncedSuffix: { nl: ' — gesynchroniseerd', en: ' — synchronised' },
      descriptionLabel: { nl: 'Profiel beschrijving', en: 'Profile description' },
      descriptionEmpty: {
        nl: 'Nog geen beschrijving — voeg er een toe onder Privé.',
        en: 'No description yet — add one under Private.',
      },
      intentionLabel: { nl: 'Intentie', en: 'Intention' },
      intentionEmpty: {
        nl: 'Wat zoek je hier? Samenwerking, werk, uitwisseling — schrijf het in je eigen woorden.',
        en: 'What are you looking for here? Collaboration, work, exchange — write it in your own words.',
      },
    },

    /* ── PublicProfile — the shareable ?u= view ────────────────────────── */
    publicView: {
      close: { nl: '✕ Sluiten', en: '✕ Close' },
      loading: { nl: 'Kristal laden…', en: 'Loading crystal…' },
      notFoundTitle: { nl: 'Profiel niet gevonden', en: 'Profile not found' },
      notFoundError: { nl: 'Profiel niet gevonden.', en: 'Profile not found.' },
    },

    /* ── ProfileDashboard ─────────────────────────────────────────────── */
    dashboard: {
      tabs: {
        openbaar: { nl: 'Openbaar', en: 'Public' },
        prive: { nl: 'Privé', en: 'Private' },
        instellingen: { nl: 'Instellingen', en: 'Settings' },
      },

      cardLoading: { nl: 'Kaart laden…', en: 'Loading card…' },
      close: { nl: '← Sluiten', en: '← Close' },
      save: { nl: 'Opslaan', en: 'Save' },
      busy: { nl: 'Bezig…', en: 'Working…' },

      policy: {
        heading: { nl: 'Voorwaarden & beleid', en: 'Terms & policies' },
        terms: { nl: 'Algemene voorwaarden', en: 'Terms and conditions' },
        privacy: { nl: 'Privacybeleid', en: 'Privacy policy' },
        cookies: { nl: 'Cookiebeleid', en: 'Cookie policy' },
        ai: { nl: 'AI-transparantie', en: 'AI transparency' },
        ip: { nl: 'Intellectueel eigendom', en: 'Intellectual property' },
        usage: { nl: 'Gebruiksvoorwaarden & misbruik', en: 'Acceptable use & abuse' },
        retention: { nl: 'Gegevensbehoud & verwijdering', en: 'Data retention & deletion' },
        register: { nl: 'Verwerkingsregister', en: 'Record of processing activities' },
      },

      expired: {
        title: { nl: 'Toegang verlopen', en: 'Access expired' },
        p1: { nl: 'Je toegang was geldig tot', en: 'Your access was valid until' },
        p2: { nl: '. Upload een nieuw rapport-PDF onder', en: '. Upload a new report PDF under' },
        p3: {
          nl: ' om je profiel opnieuw te ontgrendelen — elke nieuwe kristal-code opent 3 maanden toegang.',
          en: ' to unlock your profile again — every new crystal code opens 3 months of access.',
        },
        toPrive: { nl: 'Naar Privé — upload rapport', en: 'Go to Private — upload report' },
        priveNotice: {
          nl: 'Je toegang is verlopen. Upload hierboven een nieuw rapport-PDF om je profiel opnieuw te ontgrendelen.',
          en: 'Your access has expired. Upload a new report PDF above to unlock your profile again.',
        },
      },

      /* §6b preset-question chips */
      questions: {
        prompt: { nl: 'Prompt', en: 'Prompt' },
        bundleHint: {
          nl: 'Al je antwoorden gebundeld — gebruik dit als grondstof voor je eigen verhaal.',
          en: 'All your answers bundled together — use this as raw material for your own story.',
        },
        bundleEmpty: {
          nl: 'Nog geen antwoorden — vul eerst een of meer vragen in.',
          en: 'No answers yet — fill in one or more questions first.',
        },
        copy: { nl: 'Kopieer', en: 'Copy' },
        copied: { nl: 'Gekopieerd ✓', en: 'Copied ✓' },
        answerPlaceholder: {
          nl: 'Schrijf je eigen antwoord — 2–3 zinnen is genoeg.',
          en: 'Write your own answer — 2–3 sentences is enough.',
        },
      },

      prive: {
        title: { nl: 'Privégegevens', en: 'Private details' },
        syncTitle: { nl: 'Synchroniseer nieuw kristal', en: 'Synchronise a new crystal' },
        syncBody: {
          nl: 'Nieuwe lezing gedaan? Upload de rapport-PDF — we halen alleen je kristal en archetype eruit om je profiel bij te werken, de rest wordt genegeerd. De nieuwe orb wordt je actieve profiel-orb, de vorige schuift door naar je individuatiepad.',
          en: 'Done a new reading? Upload the report PDF — we only pull out your crystal and archetype to update your profile, the rest is ignored. The new orb becomes your active profile orb, and the previous one moves into your individuation path.',
        },
        uploadPdf: { nl: 'Upload rapport-PDF', en: 'Upload report PDF' },
        uploadGate: {
          nl: (date) => `Nieuw rapport uploaden kan vanaf ${date}`,
          en: (date) => `You can upload a new report from ${date}`,
        },
        age: { nl: 'Leeftijd', en: 'Age' },
        country: { nl: 'Land', en: 'Country' },
        publicSection: { nl: 'Openbaar profiel — kaartinhoud', en: 'Public profile — card content' },
        listedToggle: {
          nl: (on) => `Openbaar: ${on ? 'AAN' : 'UIT'}`,
          en: (on) => `Public: ${on ? 'ON' : 'OFF'}`,
        },
        listedOnNote: {
          nl: 'Je kaart is zichtbaar voor bezoekers en staat in de profielen-lijst.',
          en: 'Your card is visible to visitors and appears in the profiles directory.',
        },
        listedOffNote: {
          nl: 'Je kaart is verborgen — niet vindbaar via link of profielen-lijst.',
          en: 'Your card is hidden — not reachable via link or the profiles directory.',
        },
        visibleName: { nl: 'Zichtbare naam — op je kaart', en: 'Visible name — on your card' },
        visibleNamePlaceholder: {
          nl: 'Zoals getoond op je profielkaart',
          en: 'As shown on your profile card',
        },
        roleLine: { nl: 'Rolregel — optioneel', en: 'Role line — optional' },
        roleLinePlaceholder: { nl: 'Platformbouwer · Ontwerper', en: 'Platform builder · Designer' },
        languages: { nl: 'Talen', en: 'Languages' },
        description: { nl: 'Beschrijving', en: 'Description' },
        questionsHint: {
          nl: 'Vragen — vul in wat je wil; antwoorden verschijnen als apart blok op je kaart',
          en: 'Questions — answer whichever you like; answers appear as a separate block on your card',
        },
        storyPlaceholder: {
          nl: 'Schrijf een diep verhaal over jezelf — je kan de bovenstaande vragen gebruiken als kompas.',
          en: 'Write a deep story about yourself — you can use the questions above as a compass.',
        },
        intention: { nl: 'Intentie', en: 'Intention' },
        intentionPlaceholder: {
          nl: 'Schrijf wat je hier komt zoeken én brengen — de vragen hierboven wijzen de richting.',
          en: 'Write what you come here to seek and to bring — the questions above point the way.',
        },
        link: { nl: 'Link', en: 'Link' },
        socials: { nl: 'Socials — optioneel (handle of URL)', en: 'Socials — optional (handle or URL)' },
        socialVerified: { nl: 'Gesynchroniseerd via het platform', en: 'Synchronised via the platform' },
        socialSyncTitle: {
          nl: (platform) => `Bewijs eigenaarschap via ${platform} zelf`,
          en: (platform) => `Prove ownership through ${platform} itself`,
        },
        sync: { nl: 'Sync', en: 'Sync' },
        saveProfile: { nl: 'Profiel opslaan', en: 'Save profile' },
      },

      settings: {
        title: { nl: 'Instellingen', en: 'Settings' },
        logout: { nl: 'Uitloggen', en: 'Log out' },
        loginName: { nl: 'Inlognaam — uniek', en: 'Login name — unique' },
        emailLabel: { nl: 'E-mailadres', en: 'Email address' },
        emailPlaceholder: { nl: 'jij@voorbeeld.nl', en: 'you@example.com' },
        currentPassword: { nl: 'Huidig wachtwoord', en: 'Current password' },
        newPassword: { nl: 'Nieuw wachtwoord', en: 'New password' },
        changeEmail: { nl: 'E-mailadres wijzigen', en: 'Change email address' },
        pending1: { nl: 'In afwachting van bevestiging:', en: 'Awaiting confirmation:' },
        pending2: {
          nl: (current) => `. Je huidige e-mailadres (${current}) blijft actief tot je de link in die inbox opent.`,
          en: (current) => `. Your current email address (${current}) stays active until you open the link in that inbox.`,
        },
        passwordLabel: { nl: 'Wachtwoord', en: 'Password' },
        hide: { nl: 'verberg', en: 'hide' },
        show: { nl: 'toon', en: 'show' },
        changePassword: { nl: 'Wachtwoord wijzigen', en: 'Change password' },
        downloads: { nl: 'Downloaden', en: 'Downloads' },
        archetypePhoto: { nl: 'Archetype profielfoto', en: 'Archetype profile photo' },
        crystalScreenshot: { nl: 'Kristal screenshot', en: 'Crystal screenshot' },
        crystalLoop: { nl: 'Kristal 60fps 12s-Loop', en: 'Crystal 60fps 12s loop' },
        recording: { nl: 'Opnemen…', en: 'Recording…' },
        accessTitle: { nl: 'Toegang', en: 'Access' },
        accessBody: {
          nl: 'Je hebt drie kristal-codes gekoppeld — vanaf nu kun je je toegang ook zonder nieuwe test voortzetten.',
          en: 'You have linked three crystal codes — from now on you can continue your access without taking a new test.',
        },
        accessValidPre: { nl: ' Je huidige toegang is geldig tot', en: ' Your current access is valid until' },
        accessValidPost: { nl: '.', en: '.' },
        planQuarter: { nl: 'Abonnement — per 3 maanden', en: 'Subscription — every 3 months' },
        planYear: { nl: 'Jaartoegang', en: 'Yearly access' },
        planLifetime: { nl: 'Levenslange toegang', en: 'Lifetime access' },
        comingSoon: { nl: 'Binnenkort beschikbaar', en: 'Coming soon' },
        deleteWord: { nl: 'VERWIJDER', en: 'DELETE' },
        deleteWarnPre: { nl: '⚠ Verwijdert je account permanent (AVG/GDPR). Typ', en: '⚠ Permanently deletes your account (GDPR). Type' },
        deleteWarnPost: { nl: ':', en: ':' },
        deleteButton: { nl: 'Verwijderen', en: 'Delete' },
      },

      msg: {
        nameSaved: { nl: 'Naam opgeslagen ✓', en: 'Name saved ✓' },
        nameFailed: { nl: 'Naam bijwerken mislukt', en: 'Updating your name failed' },
        profileSaved: { nl: 'Profiel opgeslagen ✓', en: 'Profile saved ✓' },
        saveFailed: { nl: 'Opslaan mislukt', en: 'Saving failed' },
        pwTooShort: { nl: 'Nieuw wachtwoord: minstens 6 tekens.', en: 'New password: at least 6 characters.' },
        pwChanged: { nl: 'Wachtwoord gewijzigd ✓', en: 'Password changed ✓' },
        pwPending: {
          nl: 'Bevestigingsmail verzonden — activeer je nieuwe wachtwoord via je inbox ✓',
          en: 'Confirmation email sent — activate your new password from your inbox ✓',
        },
        pwFailed: { nl: 'Wachtwoord bijwerken mislukt', en: 'Updating your password failed' },
        emailInvalid: { nl: 'Voer een geldig e-mailadres in.', en: 'Enter a valid email address.' },
        emailSame: { nl: 'Dit is al je huidige e-mailadres.', en: 'That is already your current email address.' },
        emailNeedPw: { nl: 'Vul je huidige wachtwoord in ter bevestiging.', en: 'Enter your current password to confirm.' },
        emailChanged: { nl: 'E-mailadres gewijzigd ✓', en: 'Email address changed ✓' },
        emailPending: {
          nl: (address) => `Bevestigingsmail verzonden naar ${address} — je e-mailadres verandert pas na bevestiging.`,
          en: (address) => `Confirmation email sent to ${address} — your email address only changes after you confirm.`,
        },
        // substring the UI looks for to tint a "mail on its way" message
        emailSentMarker: { nl: 'verzonden', en: 'sent' },
        emailFailed: { nl: 'E-mailadres bijwerken mislukt', en: 'Updating your email address failed' },
        deleteTypeExactly: {
          nl: (word) => `Typ precies "${word}".`,
          en: (word) => `Type exactly "${word}".`,
        },
        deleteFailed: { nl: 'Verwijderen mislukt', en: 'Deleting failed' },
        socialSyncFailed: { nl: 'Synchronisatie mislukt', en: 'Synchronisation failed' },
        socialSynced: { nl: 'Social gesynchroniseerd ✓', en: 'Social synchronised ✓' },
        crystalSynced: { nl: 'Nieuw kristal gesynchroniseerd ✓', en: 'New crystal synchronised ✓' },
        noCodeInPdf: { nl: 'Geen kristal-code gevonden in deze PDF.', en: 'No crystal code found in this PDF.' },
        syncFailed: { nl: 'Synchroniseren mislukt', en: 'Synchronising failed' },
        noArchetypeImage: { nl: 'Geen archetype-afbeelding gevonden.', en: 'No archetype image found.' },
        photoSaved: { nl: 'Profielfoto opgeslagen ✓', en: 'Profile photo saved ✓' },
        downloadFailed: { nl: 'Download mislukt.', en: 'Download failed.' },
        videoUnsupported: {
          nl: 'Video wordt niet ondersteund in deze browser.',
          en: 'Video is not supported in this browser.',
        },
        orbNotReady: { nl: 'Orb nog niet gereed.', en: 'Orb not ready yet.' },
        imageSaved: { nl: 'Afbeelding opgeslagen ✓ (FHD)', en: 'Image saved ✓ (FHD)' },
        imageFailed: { nl: 'Afbeelding mislukt.', en: 'Image failed.' },
        recordingStart: { nl: 'Opnemen… (12s · 60fps · FHD)', en: 'Recording… (12s · 60fps · FHD)' },
        recordingProgress: {
          nl: (pct) => `Opnemen… ${pct}% (60fps FHD · MP4)`,
          en: (pct) => `Recording… ${pct}% (60fps FHD · MP4)`,
        },
        loopSaved: {
          nl: (ext) => `12s-loop opgeslagen ✓ (60fps FHD · ${ext})`,
          en: (ext) => `12s loop saved ✓ (60fps FHD · ${ext})`,
        },
        recordFailed: { nl: 'Opname mislukt.', en: 'Recording failed.' },
      },

      files: {
        crystalFallback: { nl: 'kristal', en: 'crystal' },
        photoSuffix: { nl: 'profielfoto', en: 'profile-photo' },
      },
    },

    /* ── profileCardMicrocopy.js — placeholder per-archetype copy ─────── */
    microcopy: {
      tendency: {
        nl: 'PLACEHOLDER — tendens-microcopy volgt uit de schrijfronde.',
        en: 'PLACEHOLDER — tendency microcopy follows from the writing round.',
      },
      expression: {
        nl: 'PLACEHOLDER — dit expressieprofiel beschrijft straks in *waarschijnlijke tendensen* hoe deze configuratie zich doorgaans uitdrukt. De definitieve twaalf teksten worden apart geschreven en hier ingeladen.',
        en: 'PLACEHOLDER — this expression profile will soon describe, in *likely tendencies*, how this configuration usually expresses itself. The definitive twelve texts are written separately and loaded in here.',
      },
    },
  },
};
