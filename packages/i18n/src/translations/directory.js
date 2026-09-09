/** directory translations — see translations/index.js */
export default {
  directory: {
    // ── Canonical-12 archetype display names (main + support facets) ──
    arch12: {
      judge: { nl: 'De Rechter', en: 'The Judge' },
      lover: { nl: 'De Minnaar', en: 'The Lover' },
      caregiver: { nl: 'De Verzorger', en: 'The Caregiver' },
      innocent: { nl: 'De Onschuldige', en: 'The Innocent' },
      explorer: { nl: 'De Ontdekkingsreiziger', en: 'The Explorer' },
      outlaw: { nl: 'De Rebel', en: 'The Outlaw' },
      trickster: { nl: 'De Nar', en: 'The Trickster' },
      sage: { nl: 'De Wijze', en: 'The Sage' },
      artist: { nl: 'De Kunstenaar', en: 'The Artist' },
      magician: { nl: 'De Magiër', en: 'The Magician' },
      hero: { nl: 'De Held', en: 'The Hero' },
      ruler: { nl: 'De Heerser', en: 'The Ruler' },
    },
    // Bare form (no article) — used inside the extension dropdown brackets.
    arch12Short: {
      judge: { nl: 'Rechter', en: 'Judge' },
      lover: { nl: 'Minnaar', en: 'Lover' },
      caregiver: { nl: 'Verzorger', en: 'Caregiver' },
      innocent: { nl: 'Onschuldige', en: 'Innocent' },
      explorer: { nl: 'Ontdekkingsreiziger', en: 'Explorer' },
      outlaw: { nl: 'Rebel', en: 'Outlaw' },
      trickster: { nl: 'Nar', en: 'Trickster' },
      sage: { nl: 'Wijze', en: 'Sage' },
      artist: { nl: 'Kunstenaar', en: 'Artist' },
      magician: { nl: 'Magiër', en: 'Magician' },
      hero: { nl: 'Held', en: 'Hero' },
      ruler: { nl: 'Heerser', en: 'Ruler' },
    },

    // ── Activity facet ──
    activity: {
      alle: { nl: 'Alle activiteit', en: 'All activity' },
      vandaag: { nl: 'Actief vandaag', en: 'Active today' },
      week: { nl: 'Actief deze week', en: 'Active this week' },
      maand: { nl: 'Actief deze maand', en: 'Active this month' },
    },
    // ── Integration (reading count) facet ──
    readings: {
      alle: { nl: 'Alle integraties', en: 'All integrations' },
      one: { nl: '1+ integraties', en: '1+ integrations' },
      two: { nl: '2+ integraties', en: '2+ integrations' },
      three: { nl: '3+ integraties', en: '3+ integrations' },
    },

    // ── Errors / loading ──
    profilesFailed: { nl: 'Profielen ophalen mislukt', en: 'Could not load profiles' },
    cardFailed: { nl: 'Kaart ophalen mislukt', en: 'Could not load card' },
    profilesLoading: { nl: 'Profielen laden…', en: 'Loading profiles…' },
    cardLoading: { nl: 'Kaart laden…', en: 'Loading card…' },

    // ── Open state (quick-nav) ──
    backToSearch: { nl: '← Zoeken', en: '← Search' },
    searchPlaceholder: { nl: 'Zoeken…', en: 'Search…' },

    // ── Closed state (lookup) ──
    title: { nl: 'Zoek een profiel', en: 'Find a profile' },
    labelName: { nl: 'Naam', en: 'Name' },
    namePlaceholder: { nl: 'Typ een naam…', en: 'Type a name…' },
    labelMain: { nl: 'Main archetype', en: 'Main archetype' },
    allMains: { nl: 'Alle mains', en: 'All mains' },
    labelExtension: { nl: 'Extensie — optioneel', en: 'Extension — optional' },
    allExtensions: { nl: 'Alle extensies', en: 'All extensions' },
    labelActivity: { nl: 'Activiteit', en: 'Activity' },
    labelIntegration: { nl: 'Integratie', en: 'Integration' },

    // ── Results ──
    useSearchOptions: {
      nl: 'Gebruik de zoekopties hierboven om profielen te vinden.',
      en: 'Use the search options above to find profiles.',
    },
    noResults: {
      nl: 'Geen profielen gevonden met deze filters.',
      en: 'No profiles found with these filters.',
    },
    lastActive: {
      nl: (d) => `Laatst actief ${d}`,
      en: (d) => `Last active ${d}`,
    },
    memberSince: {
      nl: (d) => `Lid sinds ${d}`,
      en: (d) => `Member since ${d}`,
    },

    // ── "+ Verbond" connection button ──
    verbond: {
      loading: { nl: '…', en: '…' },
      accepted: { nl: 'Verbonden ✓', en: 'Bonded ✓' },
      pendingOut: { nl: 'Verbond aangevraagd', en: 'Bond requested' },
      pendingIn: { nl: 'Verzoek ontvangen — zie Berichten', en: 'Request received — see Messages' },
      request: { nl: '+ Verbond', en: '+ Bond' },
      requestFailed: { nl: 'Verzoek mislukt', en: 'Request failed' },
    },

    // ── Orb archive strip ──
    orbArchive: {
      title: { nl: 'Kristal-geschiedenis', en: 'Crystal history' },
      crystalAlt: { nl: 'kristal', en: 'crystal' },
    },
  },
};
