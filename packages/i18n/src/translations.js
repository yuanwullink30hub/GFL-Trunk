/**
 * translations.js - Centralized translations for the entire assessment system
 * Default language: Dutch (nl)
 * Supported languages: nl, en
 */

import domainModules from './translations/index.js';

const translations = {
  // =======================================
  // ASSESSMENT INTRO MODAL
  // =======================================
  assessmentIntro: {
    title: {
      nl: "A+ Analyse Archetypes",
      en: "A+ Analyse Archetypes"
    },
    pyramidToLevelsText: {
      nl: "Kies je niveau gebaseerd op de zelfkennis die je al beheerst.",
      en: "Choose your level based on the self-knowledge you already master."
    },
    features: {
      layerAnalysis: {
        title: { nl: "5-Lagen Analyse", en: "5-Layer Analysis" },
        description: { nl: "Twaalf archetypen, gelezen als posities op een wiel. Niet een label — een landkaart van je navigatie.", en: "Twelve archetypes, read as positions on a wheel. Not a label — a map of your navigation." }
      },
      shadowIntegration: {
        title: { nl: "Schaduw Integratie", en: "Shadow Integration" },
        description: { nl: "Duidelijke stappen met ons Deltawerken framewerk, om je blinde vlekken weg te poetsen.", en: "Clear steps with our Deltawerken framework to wipe away your blind spots." }
      },
      researchBacked: {
        title: { nl: "Wetenschappelijk Onderbouwd", en: "Research-Backed" },
        description: { nl: "Carl Gustav Jung zijn archetypische diepte, mythologisch gedreven en neurobiologisch gelezen.", en: "Carl Gustav Jung's archetypal depth, mythologically driven and read through neurobiology." }
      },
      aiTraining: {
        title: { nl: "AI prompt generatie", en: "AI Prompt Generation" },
        description: { nl: "Genereer prompts om je AI-agenten af te stemmen op jouw psychologie.", en: "Generate prompts to harmonize your AI agents with your psychology." }
      }
    },
    pricing: {
      title: {
        nl: "Gratis Analyse — prompt waarde van gemiddeld €3.- en een onbetaalbare wetenschappelijke zelfkennis",
        en: "Free Analysis — a prompt worth ~€3 on average, plus priceless scientific self-knowledge"
      },
      free: {
        nl: "Download de fundering om je archetype in kaart te brengen — De identiteit, de verklaring, gevisualiseerd op ons eigen model, en uiteraard de prijs die je betaalt voor de belichaming van dit archetype.",
        en: "Download the basics to map your archetype — the identity, the explanation, visualized on our own model, and of course the price you pay for the embodiment of this archetype."
      },
      paid: {
        // {net} (excl. VAT) and {launch} are filled in by AssessmentIntro from config/pricing.js.
        nl: "Optioneel voor {net} excl. BTW{launch} — De volledige uiteenzetting (3x de hoeveelheid data), lezen = transformeren op zich. Incl. AI-prompt en toegang tot de complete online-extensie.",
        en: "Optional for {net} excl. VAT{launch} — The full exposition (3× the data), reading = transforming in itself. Incl. AI prompt and access to the complete online extension."
      },
      // Appended to the price while the launch price applies.
      launchSuffix: {
        nl: " — Lanceringsprijs tot Equinox {end}, daarna {regularNet} excl. BTW",
        en: " — Launch price until Equinox {end}, then {regularNet} excl. VAT"
      }
    },
    layersTitle: {
      nl: "De Vijf Lagen van het Zijn",
      en: "The Five Layers of Being"
    },
    layers: {
      mysterie: { name: { nl: "Mysterie / Magie", en: "Mystery / Magic" }, desc: { nl: "Het Transcendente", en: "The Transcendent" } },
      wereld: { name: { nl: "Wereld / Wijsheid", en: "World / Wisdom" }, desc: { nl: "De Buitenwereld", en: "The Outer World" } },
      massa: { name: { nl: "Massa / Macht", en: "Mass / Power" }, desc: { nl: "Het Collectief", en: "The Collective" } },
      ander: { name: { nl: "Ander / Attentie", en: "Other / Attention" }, desc: { nl: "De Relatie", en: "The Relationship" } },
      zelf: { name: { nl: "Zelf / Zonde", en: "Self / Sin" }, desc: { nl: "Het Innerlijk", en: "The Inner Self" } }
    },
    levels: {
      quick: {
        name: { nl: "Beginner", en: "Starter" },
        description: { nl: "36 vragen — 25 min • Basis niveau", en: "36 questions — 25 min • Foundation knowledge" }
      },
      standard: {
        name: { nl: "Gevorderd", en: "Intermediate" },
        description: { nl: "36 vragen — 25 min • Diepere zelfinzicht", en: "36 questions — 25 min • Deeper self-understanding" }
      },
      deep: {
        name: { nl: "Leerling", en: "Apprentice" },
        description: { nl: "36 QA - 30min - Vuurproef quickfire", en: "36 QA - 30min - Trial-by-fire quickfire" }
      }
    },
    footerButton: {
      nl: "Referenties",
      en: "References"
    },
    footerUpload: {
      nl: "Upload OCEAN",
      en: "Upload OCEAN"
    },
    referencesBack: {
      nl: "Terug",
      en: "Back"
    },
    referencesCardTitle: {
      nl: "Bronnen & Verantwoording — Open Onderzoek",
      en: "Sources & Accountability — Open Research"
    },
    oceanInfoLabel: {
      nl: "Optioneel: ",
      en: "Optional: "
    },
    oceanInfoText: {
      nl: "Heb je al een OCEAN / Big Five-rapport? Upload het als externe validatie naast je assessment — het verfijnt de analyse, maar is niet verplicht.",
      en: "Already have an OCEAN / Big Five report? Upload it as external validation alongside your assessment — it refines the analysis, but is not required."
    },
  },

  // =======================================
  // ASSESSMENT QUESTIONS
  // =======================================
  assessmentQuestions: {
    loadingQuestions: { nl: "Vragen laden...", en: "Loading questions..." },
  },

  // =======================================
  // ASSESSMENT UPLOAD
  // =======================================
  assessmentUpload: {
    assessmentComplete: { nl: "Analyse Voltooid", en: "Assessment Complete" },
    answeredAll: { nl: "Je hebt alle vragen beantwoord", en: "You've answered all questions" },
    optionalUpload: { nl: "Optioneel: Upload Ondersteunende Bestanden", en: "Optional: Upload Supporting Files" },
    dropFiles: { nl: "Sleep bestanden hierheen", en: "Drop files here" },
    dragDrop: { nl: "Sleep bestanden hierheen", en: "Drag & drop files here" },
    orClickBrowse: { nl: "of klik om te bladeren • PDF, DOCX, TXT • max. 3 bestanden, samen 15 MB", en: "or click to browse • PDF, DOCX, TXT • up to 3 files, 15 MB together" },
    // The same caps the server enforces (apps/backend/services/uploadParser.js); here only to say so early.
    fileTooLarge: { nl: "{name} is groter dan 10 MB en is niet toegevoegd.", en: "{name} is larger than 10 MB and was not added." },
    tooManyFiles: { nl: "Je kunt maximaal 3 bestanden toevoegen.", en: "You can add at most 3 files." },
    filesTooLarge: { nl: "{name} is niet toegevoegd: samen mogen de bestanden niet groter zijn dan 15 MB.", en: "{name} was not added: together the files may not exceed 15 MB." },
    filesProcessed: { nl: "Let op: de inhoud van dit bestand wordt verwerkt door het Claude AI-model (Anthropic, VS), nadat namen, e-mailadressen, telefoonnummers, postcodes en geboortedata er automatisch uit zijn verwijderd. Die verwijdering herkent niet alles. Upload geen bestanden met gevoelige persoonsgegevens van anderen. Garden For Life is niet verantwoordelijk voor de informatie die u in geüploade bestanden opneemt.", en: "Note: the contents of this file will be processed by the Claude AI model (Anthropic, US), after names, email addresses, phone numbers, postcodes and dates of birth have been removed automatically. That removal does not recognise everything. Do not upload files containing sensitive personal data of others. Garden For Life is not responsible for the information you include in uploaded files." },
    generateProfile: { nl: "Genereer Je Profiel", en: "Generate Your Profile" },
    skipUpload: { nl: "Upload overslaan en doorgaan →", en: "Skip upload and continue →" }
  },

  // =======================================
  // LAYER / SUBJECT NAMES
  // =======================================
  layerNames: {
    zelf: { nl: "Zelf / Zonde", en: "Self / Sin" },
    ander: { nl: "Ander / Attentie", en: "Other / Attention" },
    massa: { nl: "Massa / Macht", en: "Mass / Power" },
    wereld: { nl: "Wereld / Wijsheid", en: "World / Wisdom" },
    mysterie: { nl: "Mysterie / Magie", en: "Mystery / Magic" }
  },

  // =======================================
  // QUESTIONS - Text lives in assessmentData.js; only add overrides here if needed
  // =======================================
  questions: {
  },

  // =======================================
  // ANSWERS - Text lives in assessmentData.js; only add overrides here if needed
  // =======================================
  answers: {
  },

  // =======================================
  // SITE-WIDE TRANSLATIONS
  // =======================================

  // --- Header ---
  header: {
    versionText: {
      nl: "SCHADUW WERK",
      en: "SHADOW WORK"
    }
  },

  // --- Low-end Button ---
  lowEndButton: {
    start: {
      nl: "START ERVARING",
      en: "START EXPERIENCE"
    },
    synchronising: {
      nl: "SYNCHRONISEREN...",
      en: "SYNCHRONISING..."
    }
  },

  // --- Scroll Prompt ---
  scrollPrompt: {
    scroll: {
      nl: "SCROLL = SYNCHRONISATIE",
      en: "SCROLL = SYNCHRONISATION"
    },
    swipe: {
      nl: "SWIPE = SYNCHRONISATIE",
      en: "SWIPE = SYNCHRONISATION"
    }
  },

  // --- Desktop Layout ---
  desktopLayout: {
    locked: { nl: "VERGRENDELD", en: "LOCKED" },
    // Tools that work with personal data run from the user's own folder (desktop app).
    workspaceLocked: { nl: "Werkt vanuit je werkmap", en: "Works from your folder" },
    workspaceLockedWeb: { nl: "Werkt in de applicatie", en: "Works in the application" },
    workspaceWhy: { nl: "Waarom?", en: "Why?" },
    workspaceReminder: {
      nl: "Je werkmap is nog niet gekoppeld. De hulpmiddelen die met je persoonlijke gegevens werken blijven vergrendeld tot je dat doet.",
      en: "Your folder is not connected yet. The tools that work with your personal data stay locked until it is."
    },
    workspaceReminderWeb: {
      nl: "Je bent op de website. De hulpmiddelen die met je persoonlijke gegevens werken gebruik je in onze applicatie, met je eigen werkmap.",
      en: "You are on the website. The tools that work with your personal data are used in our application, with your own folder."
    },
    workspaceReminderAction: { nl: "Bekijk hoe", en: "See how" },
    updateReady: { nl: (v) => `Versie ${v} van Garden for Life staat klaar.`, en: (v) => `Version ${v} of Garden for Life is ready.` },
    updateRestart: { nl: "Nu herstarten", en: "Restart now" },
    updateLater: { nl: "Later", en: "Later" },
    workspaceReminderClose: { nl: "Sluiten", en: "Close" },
    dataStreamDescription: {
      nl: "Real-time systeemstatistieken <br /> en live datastromen",
      en: "Real-time system metrics <br /> and data streams flowing live"
    },
    // Filosofie container
    filosofieSubtext: {
      nl: "Masculien en Feminien gelijkgesteld <br/> De tuinierder moet zich overgeven aan en overkomen van de doorschijnende passie <br />",
      en: "Masculine and Feminine made equal <br/> The gardener must surrender to, and emerge from, the translucent passion <br />"
    },
    learnMore: { nl: "Leer meer", en: "Learn more" },
    seeMore: { nl: "Zie meer", en: "See more" },
    research: { nl: "onderzoek", en: "research" },
    // Container titles
    gardensTitle: { nl: "DE TUINEN", en: "THE GARDENS" },
    connectionsMenu: { nl: "VERBINDINGS_MENU", en: "CONNECTIONS_MENU" },
    kitchen: { nl: "KOOKEILAND", en: "KITCHEN ISLAND" },
    // Gardens slideshow (business types + shared prompt)
    gardenConnectPrompt: {
      nl: "Verbinden met ons platform? Maak de test en benader ons team.",
      en: "Connect with our platform? Take the test and reach out to our team."
    },
    businessTypes: {
      green: { nl: "ARTIEST", en: "ARTIST" },
      blue: { nl: "ZZP", en: "FREELANCER" },
      purple: { nl: "EENMANSZAAK", en: "SOLE PROPRIETOR" },
      red: { nl: "BV", en: "LTD" },
      orange: { nl: "INTERNATIONAL", en: "INTERNATIONAL" }
    },
    // Hover tooltips on the connections-menu icons
    identity: { nl: "Verbonden", en: "Connected" },
    login: { nl: "Account", en: "Account" },
    gardens: {
      karman: {
        tagline: { nl: "Underground Techno Events", en: "Underground Techno Events" },
        description: {
          nl: "Amsterdam-gebaseerde techno-organisatie, geboren uit het verlangen om de rauwe, intieme geest van underground bijeenkomsten te herstellen.",
          en: "Amsterdam-based techno organization, born from a desire to restore the raw, intimate spirit of underground gatherings."
        }
      },
      code49: {
        tagline: { nl: "AI Oplossingen", en: "AI Solutions" },
        description: {
          nl: "Geavanceerd softwareontwikkelingsbedrijf gespecialiseerd in AI-gedreven oplossingen en geavanceerde technologie-integratie.",
          en: "Cutting-edge software development company specializing in AI-driven solutions and advanced technology integration."
        }
      },
      elevenEleven: {
        tagline: { nl: "Artistieke Expressie & Body Art", en: "Artistic Expression & Body Art" },
        description: {
          nl: "Een vooraanstaande tattoostudio gespecialiseerd in maatwerkontwerpen, traditionele en moderne stijlen.",
          en: "A premier tattoo studio specializing in custom designs, traditional and modern styles."
        }
      },
      rengiFoods: {
        tagline: { nl: "Duurzame Biologische Voeding", en: "Sustainable Organic Nutrition" },
        description: {
          nl: "Toegewijd aan het leveren van de hoogste kwaliteit biologische en duurzaam verkregen voedingsproducten.",
          en: "Dedicated to providing the highest quality organic and sustainably-sourced food products."
        }
      }
    }
  },

  // --- Pages ---
  pages: {
    loginPage: {
      email: { nl: "E-mail", en: "Email" },
      password: { nl: "Wachtwoord", en: "Password" },
      displayName: { nl: "Weergavenaam", en: "Display Name" },
      loading: { nl: "Laden...", en: "Loading..." },
    },
    filosofiePage: {
      entropyDynamics: { nl: "ENTROPIE DYNAMIEK", en: "ENTROPY DYNAMICS" },
      chaos: { nl: "CHAOS", en: "CHAOS" },
      order: { nl: "ORDE", en: "ORDER" },
      supersymmetry: { nl: "SUPERSYMMETRIE", en: "SUPERSYMMETRY" },
      dimensionalConscious: { nl: "DIMENSIONAAL BEWUST", en: "DIMENSIONALLY CONSCIOUS" },
      dimensionalDescription: {
        nl: "Werkelijkheid waargenomen door geometrische constanten.",
        en: "Reality perceived through geometric constants."
      },
      supersymmetryDescription: {
        nl: "De geünificeerde theorie van bewustzijn en zijn.",
        en: "The unified theory of consciousness and being."
      },
      back: { nl: "Terug", en: "Back" }
    }
  },

  // --- Eyedentity (profile / policy tabs + feedback) ---
  eyedentity: {
    nav: {
      profile: { nl: "PERSOONLIJK PROFIEL", en: "PERSONAL PROFILE" },
      terms: { nl: "ALGEMENE VOORWAARDEN", en: "TERMS & CONDITIONS" },
      privacy: { nl: "PRIVACYBELEID", en: "PRIVACY POLICY" },
      cookies: { nl: "COOKIEBELEID", en: "COOKIE POLICY" },
      ai: { nl: "AI-TRANSPARANTIE", en: "AI TRANSPARENCY" },
      ip: { nl: "INTELLECTUEEL EIGENDOM", en: "INTELLECTUAL PROPERTY" },
      usage: { nl: "GEBRUIKSVOORWAARDEN", en: "TERMS OF USE" },
      retention: { nl: "GEGEVENSBEHOUD & VERWIJDERING", en: "DATA RETENTION & DELETION" },
      register: { nl: "VERWERKINGSREGISTER", en: "PROCESSING REGISTER" },
      feedback: { nl: "FEEDBACK", en: "FEEDBACK" }
    },
    contentUnavailable: { nl: "Inhoud niet beschikbaar.", en: "Content unavailable." },
    feedback: {
      intro: {
        nl: "Topper, hopelijk ben je wijzer geworden en wil je dit nu met ons delen — We horen graag wat je ervan vondt.",
        en: "Nice one — hopefully you've gained some insight and want to share it with us. We'd love to hear what you thought."
      },
      score: { nl: "Score", en: "Score" },
      email: { nl: "E-mailadres", en: "Email address" },
      emailPlaceholder: { nl: "jouw@email.nl", en: "you@email.com" },
      accuracyLabel: {
        nl: "Hoe accuraat is het resultaat volgens jouw kennis en gevoel?",
        en: "How accurate is the result, in your knowledge and gut feeling?"
      },
      accuracyPlaceholder: {
        nl: "Beschrijf in hoeverre het resultaat klopt met wie jij bent...",
        en: "Describe how well the result matches who you are..."
      },
      mismatchLabel: {
        nl: "Waar ben je zeker van dat niet overeenkomt met jouw persoonlijkheid?",
        en: "What are you certain does NOT match your personality?"
      },
      mismatchPlaceholder: {
        nl: "Bijv: ik ben helemaal niet competitief, want...",
        en: "E.g. I'm not competitive at all, because..."
      },
      suggestionsLabel: {
        nl: "Wat zou jij anders doen of toevoegen aan dit systeem?",
        en: "What would you do differently or add to this system?"
      },
      suggestionsPlaceholder: {
        nl: "Bijv: meer context bij de vragen, andere formulering...",
        en: "E.g. more context with the questions, different phrasing..."
      },
      submit: { nl: "VERSTUUR FEEDBACK", en: "SEND FEEDBACK" },
      submitting: { nl: "VERSTUREN...", en: "SENDING..." },
      submitError: { nl: "Versturen mislukt, probeer opnieuw.", en: "Submission failed, please try again." }
    }
  },

  // --- Brand / Gardens page ---
  // (Placeholder brand *content* lives bilingually in packages/brands/src/brandData.jsx.)
  brands: {
    back: { nl: "TERUG", en: "BACK" },
    backTitle: { nl: "Terug", en: "Back" },
    mission: { nl: "Missie", en: "Mission" },
    upcomingEvents: { nl: "Aankomende Events", en: "Upcoming Events" },
    noEventsPlanned: { nl: "Geen events gepland", en: "No events planned" },
    connections: { nl: "Verbindingen", en: "Connections" },
    noConnectionsYet: { nl: "Nog geen verbindingen", en: "No connections yet" },
    tabs: {
      overzicht: { nl: "Overzicht", en: "Overview" },
      events: { nl: "Events", en: "Events" },
      netwerk: { nl: "Netwerk", en: "Network" }
    }
  }
};

// Domain modules (packages/i18n/src/translations/) are merged in at the root so
// their namespaces resolve through the same t('namespace.key') lookup.
Object.assign(translations, domainModules);

/**
 * Add translation namespaces that are not part of the public bundle (the management app registers its
 * own `admin` namespace from @gfl/admin-ui, so that copy never ships with the website or the app).
 */
export function extendTranslations(extra) {
  Object.assign(translations, extra);
}

export default translations;
