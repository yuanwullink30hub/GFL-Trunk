/**
 * translations.js - Centralized translations for the entire assessment system
 * Default language: Dutch (nl)
 * Supported languages: nl, en
 */

const translations = {
  // =======================================
  // ASSESSMENT INTRO MODAL
  // =======================================
  assessmentIntro: {
    badgeText: {
      nl: "Garden for Life",
      en: "Garden for Life"
    },
    title: {
      nl: "A+ Analyse Archetypes",
      en: "A+ Analyse Archetypes"
    },
    description: {
      nl: "De meest complete archetype test voor de synchronisatie tussen jouw essentie en je intelligentie.",
      en: "The most complete archetype test for the synchronization between your essence and your intelligence."
    },
    pyramidToLevelsText: {
      nl: "Kies je niveau gebaseerd op de zelfkennis die je al beheerst.",
      en: "Choose your level based on the self-knowledge you already master."
    },
    pyramidToLevelsText2: {
      nl: "6 Antwoorden per vraag/ 1 keuze is 5P / keuze 1-3P en keuze 2-2P",
      en: "6 Answers per question/ 1 choice is 5P / choice 1-3P and choice 2-2P"
    },
    pyramidToLevelsText3: {
      nl: "Overvolledig rapport met Kern, Support en Schaduw Archetype.",
      en: "Comprehensive report with Core, Support and Shadow Archetype."
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
        description: { nl: "Jungs archetypische diepte, mythologisch gedreven en neurobiologisch gelezen.", en: "Jung's archetypal depth, mythologically driven and read through neurobiology." }
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
        nl: "Download de basis om je archetype in kaart te brengen — De identiteit, de verklaring, gevisualiseerd op ons eigen model, en uiteraard de prijs die je betaalt voor dit archetype.",
        en: "Download the basics to map your archetype — the identity, the explanation, visualized on our own model, and of course the price you pay for this archetype."
      },
      paid: {
        nl: "Optioneel voor €00,00 — De volledige uiteenzetting (3x de hoeveelheid data), lezen = transformeren op zich. Incl. AI-prompt voor je online-extensie.",
        en: "Optional for €00.00 — the full exposition (3× the data), reading = transforming in itself. Incl. AI prompt for your online extension."
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
    levelsTitle: {
      nl: "Kies Je Analyseniveau",
      en: "Choose Your Assessment Level"
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
        name: { nl: "Leerling", en: "Advanced" },
        description: { nl: "36 vragen — 25 min • Volledige zelfbeheersing", en: "36 questions — 25 min • Complete self-mastery" }
      }
    },
    footerResearch: {
      nl: "Gebaseerd op onderzoek in Alchemie, Astrologie, Bewustzijn, Biochemie, Psychologie en... zie meer.",
      en: "Based on research in Alchemy, Astrology, Consciousness, Biochemistry, Psychology and... see more."
    },
    footerButton: {
      nl: "Referenties",
      en: "References"
    },
    footerUpload: {
      nl: "Upload OCEAN",
      en: "Upload OCEAN"
    },
    footerUploadHint: {
      nl: "PDF, DOC, TXT, Afbeelding",
      en: "PDF, DOC, TXT, Image"
    },
    footerUploadCount: {
      nl: "bestand",
      en: "file"
    },
    footerUrl: {
      nl: "",
      en: ""
    },
    referencesBack: {
      nl: "Terug",
      en: "Back"
    },
    referencesTitle: {
      nl: "Wetenschappelijke Referenties",
      en: "Scientific References"
    },
    referencesSubtitle: {
      nl: "Het A+ Archetype Analyse systeem is gebaseerd op interdisciplinair onderzoek uit de volgende domeinen:",
      en: "The A+ Archetype Analysis system is based on interdisciplinary research from the following domains:"
    },
    references: {
      psychology: {
        title: { nl: "Psychologie", en: "Psychology" },
        sources: {
          nl: "Carl Gustav Jung — Archetypes & het Collectief Onbewuste • Big Five / OCEAN persoonlijkheidsmodel • Myers-Briggs Type Indicator (MBTI) • Schaduwwerk & Individuatie",
          en: "Carl Gustav Jung — Archetypes & the Collective Unconscious • Big Five / OCEAN personality model • Myers-Briggs Type Indicator (MBTI) • Shadow Work & Individuation"
        }
      },
      alchemy: {
        title: { nl: "Alchemie", en: "Alchemy" },
        sources: {
          nl: "Hermetische traditie — De 7 Alchemistische Fasen • Nigredo, Albedo, Citrinitas, Rubedo transformatiecycli • Transmutatie als metafoor voor innerlijke groei",
          en: "Hermetic tradition — The 7 Alchemical Stages • Nigredo, Albedo, Citrinitas, Rubedo transformation cycles • Transmutation as metaphor for inner growth"
        }
      },
      astrology: {
        title: { nl: "Astrologie", en: "Astrology" },
        sources: {
          nl: "Archetypische planetaire energieën • 12 Zodiac archetypen & elementaire classificatie • Huizensysteem als bewustzijnskaart",
          en: "Archetypal planetary energies • 12 Zodiac archetypes & elemental classification • House system as consciousness map"
        }
      },
      consciousness: {
        title: { nl: "Bewustzijn", en: "Consciousness" },
        sources: {
          nl: "Deltawerken dynamiek raamwerk • 5-lagen bewustzijnsmodel (Zelf, Ander, Massa, Wereld, Mysterie) • Entropie & Supersymmetrie in bewustzijnsontwikkeling",
          en: "Deltawerken dynamics framework • 5-layer consciousness model (Self, Other, Mass, World, Mystery) • Entropy & Supersymmetry in consciousness development"
        }
      },
      biochemistry: {
        title: { nl: "Biochemie", en: "Biochemistry" },
        sources: {
          nl: "Neuroplasticiteit & gedragspatronen • Hormonen & neurotransmitters in persoonlijkheidsontwikkeling • Epigenetica & omgevingsinvloeden op karakter",
          en: "Neuroplasticity & behavioral patterns • Hormones & neurotransmitters in personality development • Epigenetics & environmental influences on character"
        }
      }
    },
    referencesFooter: {
      nl: "Dit systeem combineert oude wijsheid met moderne wetenschap voor een holistisch archetype profiel.",
      en: "This system combines ancient wisdom with modern science for a holistic archetype profile."
    }
  },

  // =======================================
  // ASSESSMENT QUESTIONS
  // =======================================
  assessmentQuestions: {
    loadingQuestions: { nl: "Vragen laden...", en: "Loading questions..." },
    back: { nl: "TERUG", en: "BACK" },
    domain: { nl: "Domein", en: "Domain" }
  },

  // =======================================
  // ASSESSMENT RESULTS
  // =======================================
  assessmentResults: {
    coreResonanceComplete: { nl: "Kernresonantie Voltooid", en: "Core Resonance Complete" },
    yourConsciousnessProfile: { nl: "Jouw Bewustzijnsprofiel", en: "Your Consciousness Profile" },
    primaryArchetype: { nl: "Primair Archetype", en: "Primary Archetype" },
    shadowAspect: { nl: "Schaduwaspect", en: "Shadow Aspect" },
    harmonyScore: { nl: "Harmonie Score", en: "Harmony Score" },
    consciousnessLevel: { nl: "Bewustzijnsniveau", en: "Consciousness Level" },
    quantumState: { nl: "Kwantumtoestand", en: "Quantum State" },
    quantumResonance: { nl: "Kwantumresonantie", en: "Quantum Resonance" },
    layerAnalysis: { nl: "Laag Analyse", en: "Layer Analysis" },
    aiTrainingPrompt: { nl: "AI Training Prompt", en: "AI Training Prompt" },
    aiTrainingDesc: {
      nl: "Gebruik deze prompt om je AI-agenten af te stemmen op jouw bewustzijnsprofiel:",
      en: "Use this prompt to train your AI agents to resonate with your consciousness profile:"
    },
    copied: { nl: "Gekopieerd!", en: "Copied!" },
    copyToClipboard: { nl: "Kopieer naar klembord", en: "Copy to clipboard" },
    generating: { nl: "Genereren...", en: "Generating..." },
    downloadPDF: { nl: "Download PDF Rapport", en: "Download PDF Report" },
    newAssessment: { nl: "Nieuwe Analyse", en: "New Assessment" },
    integration: { nl: "Integratie", en: "Integration" },
    archetype: { nl: "Archetype", en: "Archetype" },
    dominantPattern: { nl: "Dominant Patroon", en: "Dominant Pattern" },
    recommendations: { nl: "Aanbevelingen", en: "Recommendations" }
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
    orClickBrowse: { nl: "of klik om te bladeren • PDF, DOC, TXT, Afbeeldingen", en: "or click to browse • PDF, DOC, TXT, Images" },
    filesProcessed: { nl: "Let op: de inhoud van dit bestand wordt verwerkt door het Claude AI-model (Anthropic, VS). Upload geen bestanden met gevoelige persoonsgegevens van anderen. Garden For Life is niet verantwoordelijk voor de informatie die u in geüploade bestanden opneemt.", en: "Note: the contents of this file will be processed by the Claude AI model (Anthropic, US). Do not upload files containing sensitive personal data of others. Garden For Life is not responsible for the information you include in uploaded files." },
    generateProfile: { nl: "Genereer Je Profiel", en: "Generate Your Profile" },
    skipUpload: { nl: "Upload overslaan en doorgaan →", en: "Skip upload and continue →" }
  },

  // =======================================
  // ASSESSMENT LAYER PANEL
  // =======================================
  assessmentLayerPanel: {
    save: { nl: "OPSLAAN", en: "SAVE" },
    scroll: { nl: "SCROLL", en: "SCROLL" },
    loading: { nl: "Laden...", en: "Loading..." },
    question: { nl: "Vraag", en: "Question" },
    answer: { nl: "Antwoord", en: "Answer" }
  },

  // =======================================
  // ASSESSMENT LABEL
  // =======================================
  assessmentLabel: {
    transmitted: { nl: "VERZONDEN", en: "TRANSMITTED" },
    complete: { nl: "VOLTOOID", en: "COMPLETE" },
    locked: { nl: "VERGRENDELD", en: "LOCKED" },
    active: { nl: "ACTIEF", en: "ACTIVE" },
    standby: { nl: "STAND-BY", en: "STANDBY" },
    beginAssessment: { nl: "START ANALYSE", en: "BEGIN ASSESSMENT" },
    layerAssessmentComplete: { nl: "✓ LAAG ANALYSE VOLTOOID", en: "✓ LAYER ASSESSMENT COMPLETE" },
    coreResonanceActive: { nl: "◆ KERNRESONANTIE ACTIEF", en: "◆ CORE RESONANCE ACTIVE" },
    collapse: { nl: "▲ INKLAPPEN", en: "▲ COLLAPSE" }
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

  layerTitles: {
    zelf: { nl: "ZELF / ZONDE", en: "SELF / SIN" },
    ander: { nl: "ANDER / ATTENTIE", en: "OTHER / ATTENTION" },
    massa: { nl: "MASSA / MACHT", en: "MASS / POWER" },
    wereld: { nl: "WERELD / WIJSHEID", en: "WORLD / WISDOM" },
    mysterie: { nl: "MYSTERIE / MAGIE", en: "MYSTERY / MAGIC" }
  },

  layerSubtitles: {
    zelf: { nl: "De innerlijke wereld en haar grenzen", en: "The inner world and its boundaries" },
    ander: { nl: "De buitenwereld en haar uitdagingen", en: "The outer world and its challenges" },
    massa: { nl: "Het collectief en de cultuur", en: "The collective and culture" },
    wereld: { nl: "Relaties en de biochemische make-up", en: "Relationships and the biochemical make-up" },
    mysterie: { nl: "Het transcendente en het natuurlijke", en: "The transcendent and the natural" }
  },

  layerDescriptions: {
    zelf: {
      nl: "Onderzoek je innerlijke wereld, je grenzen en je relatie met het verleden.",
      en: "Explore your inner world, your boundaries and your relationship with the past."
    },
    ander: {
      nl: "Ontdek hoe je jezelf positioneert in teams, concurrentie en leiderschap.",
      en: "Discover how you position yourself in teams, competition and leadership."
    },
    massa: {
      nl: "Verken je visie op waarheid, technologie, tradities en creativiteit.",
      en: "Explore your views on truth, technology, traditions and creativity."
    },
    wereld: {
      nl: "Verdiep je in relaties, de ziel, partnerkeuze en sociale dynamiek.",
      en: "Dive into relationships, the soul, partner choice and social dynamics."
    },
    mysterie: {
      nl: "Ontdek je relatie met de natuur, het mysterie en het hogere.",
      en: "Discover your relationship with nature, mystery and the transcendent."
    }
  },

  layerFundamentals: {
    zelf: { nl: "Fysiologische Standaarden", en: "Physiological Standards" },
    ander: { nl: "Zelfvertrouwen, Karakter", en: "Self-Esteem, Character" },
    massa: { nl: "Doel, Passie, Visie", en: "Purpose, Passion, Vision" },
    wereld: { nl: "Zelfrealisatie, Transformatie", en: "Self-actualization, Transformation" },
    mysterie: { nl: "Intimiteit, Gemeenschap", en: "Intimacy, Community" }
  },

  // =======================================
  // ARCHETYPE NAMES & DESCRIPTIONS
  // =======================================
  archetypes: {
    GROUNDED: {
      name: { nl: "De Geaarde", en: "The Grounded" },
      description: { nl: "Diep verbonden met de fysieke realiteit, stabiel en betrouwbaar", en: "Deeply connected to physical reality, stable and reliable" },
      shadow: { nl: "Rigiditeit, materiële gehechtheid, weerstand tegen verandering", en: "Rigidity, material attachment, resistance to change" }
    },
    VITALIST: {
      name: { nl: "De Vitalist", en: "The Vitalist" },
      description: { nl: "Levenskracht-georiënteerd, energiek en aanpassend", en: "Life-force oriented, energetic and adaptive" },
      shadow: { nl: "Impulsiviteit, verspreide energie, burn-out gevoelig", en: "Impulsivity, scattered energy, burnout prone" }
    },
    EMPATH: {
      name: { nl: "De Empath", en: "The Empath" },
      description: { nl: "Zeer gevoelig voor andermans emoties, zorgzaam", en: "Highly sensitive to others' emotions, nurturing" },
      shadow: { nl: "Emotionele overweldiging, grensproblemen, co-afhankelijkheid", en: "Emotional overwhelm, boundary issues, codependency" }
    },
    WARRIOR: {
      name: { nl: "De Krijger", en: "The Warrior" },
      description: { nl: "Beschermend, moedig, actiegericht", en: "Protective, courageous, action-oriented" },
      shadow: { nl: "Agressie, defensiviteit, emotionele onderdrukking", en: "Aggression, defensiveness, emotional suppression" }
    },
    ARCHITECT: {
      name: { nl: "De Architect", en: "The Architect" },
      description: { nl: "Patroonzoekend, logisch, systematisch denker", en: "Pattern-seeking, logical, systematic thinker" },
      shadow: { nl: "Overanalyse, rigiditeit, ontkoppeling van gevoel", en: "Over-analysis, rigidity, disconnection from feeling" }
    },
    EXPLORER: {
      name: { nl: "De Ontdekker", en: "The Explorer" },
      description: { nl: "Nieuwsgierig, experimenteel, grensverleggend", en: "Curious, experimental, boundary-pushing" },
      shadow: { nl: "Rusteloosheid, gebrek aan toewijding, chaos", en: "Restlessness, lack of commitment, chaos" }
    },
    ALCHEMIST: {
      name: { nl: "De Alchemist", en: "The Alchemist" },
      description: { nl: "Transformerend, ziet potentieel in alles", en: "Transformative, sees potential in all things" },
      shadow: { nl: "Escapisme, spirituele ontwijking, elitisme", en: "Escapism, spiritual bypassing, elitism" }
    },
    MYSTIC: {
      name: { nl: "De Mysticus", en: "The Mystic" },
      description: { nl: "Intuïtief, verbonden met kosmische patronen", en: "Intuitive, connected to cosmic patterns" },
      shadow: { nl: "Onthechting van de realiteit, waan, isolatie", en: "Detachment from reality, delusion, isolation" }
    },
    SAGE: {
      name: { nl: "De Wijze", en: "The Sage" },
      description: { nl: "Wijs, geïntegreerd, overstijgt dualiteit", en: "Wise, integrated, transcends duality" },
      shadow: { nl: "Spirituele trots, onbetrokkenheid, kilheid", en: "Spiritual pride, disengagement, coldness" }
    },
    LOVER: {
      name: { nl: "De Minnaar", en: "The Lover" },
      description: { nl: "Onvoorwaardelijk liefhebbend, eenheidsbewust", en: "Unconditionally loving, unity-conscious" },
      shadow: { nl: "Verlies van grenzen, martelaarschap, verstrengeling", en: "Loss of boundaries, martyrdom, enmeshment" }
    }
  },

  // =======================================
  // SUBJECT METADATA
  // =======================================
  subjectMetadata: {
    zelf: {
      element: { nl: "Aarde", en: "Earth" },
      chakra: { nl: "Wortel", en: "Root" },
      principle: { nl: "Structuur & Stabiliteit", en: "Structure & Stability" },
      shadowTheme: { nl: "Overleven, Veiligheid", en: "Survival, Security" }
    },
    ander: {
      element: { nl: "Water", en: "Water" },
      chakra: { nl: "Sacraal", en: "Sacral" },
      principle: { nl: "Stroom & Kracht", en: "Flow & Power" },
      shadowTheme: { nl: "Relaties, Emotie", en: "Relationships, Emotion" }
    },
    massa: {
      element: { nl: "Lucht", en: "Air" },
      chakra: { nl: "Hart", en: "Heart" },
      principle: { nl: "Patroon & Communicatie", en: "Pattern & Communication" },
      shadowTheme: { nl: "Intellect, Expressie", en: "Intellect, Expression" }
    },
    wereld: {
      element: { nl: "Vuur", en: "Fire" },
      chakra: { nl: "Derde Oog", en: "Third Eye" },
      principle: { nl: "Transformatie", en: "Transformation" },
      shadowTheme: { nl: "Intuïtie, Doel", en: "Intuition, Purpose" }
    },
    mysterie: {
      element: { nl: "Kwintessens", en: "Quintessence" },
      chakra: { nl: "Kruin", en: "Crown" },
      principle: { nl: "Integratie", en: "Integration" },
      shadowTheme: { nl: "Identiteit, Bevrijding", en: "Identity, Liberation" }
    }
  },

  // =======================================
  // CONSCIOUSNESS LEVELS
  // =======================================
  consciousnessLevels: {
    matterResonant: { nl: "Materie-Resonant", en: "Matter-Resonant" },
    bioResonant: { nl: "Bio-Resonant", en: "Bio-Resonant" },
    egoResonant: { nl: "Ego-Resonant", en: "Ego-Resonant" },
    transpersonal: { nl: "Transpersoonlijk", en: "Transpersonal" },
    unityConscious: { nl: "Eenheidsbewust", en: "Unity-Conscious" }
  },

  // =======================================
  // QUANTUM RESONANCE STRINGS
  // =======================================
  quantumResonances: {
    GROUNDED: {
      nl: "Jouw bewustzijn resoneert met het Higgsveld - stabiel, fundamenteel, massa gevend aan ervaring.",
      en: "Your consciousness resonates with the Higgs field - stable, foundational, providing mass to experience."
    },
    VITALIST: {
      nl: "Jouw bewustzijn resoneert met kwantumfluctuaties - dynamisch, creatief, mogelijkheden genererend.",
      en: "Your consciousness resonates with quantum fluctuations - dynamic, creative, generating possibilities."
    },
    EMPATH: {
      nl: "Jouw bewustzijn resoneert met kwantumverstrengeling - diep verbonden, anderen voelend als zelf.",
      en: "Your consciousness resonates with quantum entanglement - deeply connected, feeling others as self."
    },
    WARRIOR: {
      nl: "Jouw bewustzijn resoneert met golf-deeltjesdualiteit - besluitvaardig, mogelijkheid omzettend in actie.",
      en: "Your consciousness resonates with wave-particle duality - decisive, collapsing possibility into action."
    },
    ARCHITECT: {
      nl: "Jouw bewustzijn resoneert met ruimtetijdgeometrie - geordend, symmetrieën onthullend.",
      en: "Your consciousness resonates with spacetime geometry - patterned, ordered, revealing symmetries."
    },
    EXPLORER: {
      nl: "Jouw bewustzijn resoneert met superpositie - meerdere toestanden verkennend voor toewijding.",
      en: "Your consciousness resonates with superposition - exploring multiple states before commitment."
    },
    ALCHEMIST: {
      nl: "Jouw bewustzijn resoneert met kwantumtunneling - transformerend, barrières overstijgend.",
      en: "Your consciousness resonates with quantum tunneling - transforming, transcending barriers."
    },
    MYSTIC: {
      nl: "Jouw bewustzijn resoneert met het kwantumvacuüm - leeg maar vol, bron van manifestatie.",
      en: "Your consciousness resonates with the quantum vacuum - empty yet full, source of manifestation."
    },
    SAGE: {
      nl: "Jouw bewustzijn resoneert met het verenigd veld - non-duaal, geïntegreerd, grond van zijn.",
      en: "Your consciousness resonates with the unified field - non-dual, integrated, ground of being."
    },
    LOVER: {
      nl: "Jouw bewustzijn resoneert met kwantumcoherentie - harmonieus, gesynchroniseerd, één met alles.",
      en: "Your consciousness resonates with quantum coherence - harmonious, synchronized, one with all."
    },
    default: {
      nl: "Jouw bewustzijn vertoont unieke resonantiepatronen.",
      en: "Your consciousness exhibits unique resonance patterns."
    }
  },

  // =======================================
  // INSIGHTS TEMPLATES
  // =======================================
  insights: {
    foundationalPatterns: {
      nl: (name) => `Jouw ${name} laag toont fundamentele patronen die aandacht nodig hebben.`,
      en: (name) => `Your ${name} layer shows foundational patterns needing attention.`
    },
    developingIntegration: {
      nl: (name) => `Jouw ${name} laag toont ontwikkelende integratie.`,
      en: (name) => `Your ${name} layer demonstrates developing integration.`
    },
    strongIntegration: {
      nl: (name) => `Jouw ${name} laag toont sterke integratie en bewustzijn.`,
      en: (name) => `Your ${name} layer shows strong integration and awareness.`
    },
    archetypePattern: {
      nl: (name, desc) => `Jouw ${name} patroon suggereert: ${desc}`,
      en: (name, desc) => `Your ${name} pattern suggests: ${desc}`
    },
    integrationInProgress: {
      nl: "Integratie in uitvoering",
      en: "Integration in progress"
    }
  },

  // =======================================
  // RECOMMENDATIONS
  // =======================================
  recommendations: {
    zelf: {
      nl: [
        "Oefen grondingsoefeningen: blootsvoets wandelen, body scanning",
        "Ontdek hoe je biochemie reageert op verschillende voeding en slaap"
      ],
      en: [
        "Practice grounding exercises: walking barefoot, body scanning",
        "Explore how your biochemistry responds to different foods and sleep"
      ]
    },
    ander: {
      nl: [
        "Schrijf in je dagboek over emotionele triggers en de schaduwen die ze onthullen",
        "Oefen FM/MF bewustzijn: merk mannelijke vs vrouwelijke energie op"
      ],
      en: [
        "Journal about emotional triggers and the shadows they reveal",
        "Practice FM/MF awareness: notice masculine vs feminine energy"
      ]
    },
    massa: {
      nl: [
        "Bestudeer heilige geometrie en merk patronen op in de natuur",
        "Overpeins de kwantumaard van informatie"
      ],
      en: [
        "Study sacred geometry and notice patterns in nature",
        "Contemplate the quantum nature of information"
      ]
    },
    wereld: {
      nl: [
        "Volg maancycli en merk hun invloed op",
        "Betrek alchemistische symboliek in het dagelijks leven"
      ],
      en: [
        "Track lunar cycles and notice their influence",
        "Engage with alchemical symbolism in daily life"
      ]
    },
    mysterie: {
      nl: [
        "Oefen dagelijks meditatie waarbij bewustzijn mag oplossen",
        "Overpeins: Wie is zich bewust van deze woorden op dit moment?"
      ],
      en: [
        "Practice daily meditation allowing awareness to dissolve",
        "Contemplate: Who is aware of these words right now?"
      ]
    }
  },

  // =======================================
  // AI TRAINING PROMPT TEMPLATE
  // =======================================
  aiPrompt: {
    intro: {
      nl: "Ik train een AI-assistent om mijn psychologische ontwikkeling te ondersteunen. Mijn bewustzijnsprofiel toont:",
      en: "I am training an AI assistant to support my psychological development. My consciousness profile assessment reveals:"
    },
    primaryArchetype: { nl: "PRIMAIR ARCHETYPE", en: "PRIMARY ARCHETYPE" },
    harmonyScoreLabel: { nl: "HARMONIE SCORE", en: "HARMONY SCORE" },
    keyShadow: { nl: "BELANGRIJKSTE SCHADUW", en: "KEY SHADOW" },
    layerIntegrationLabel: { nl: "LAAG INTEGRATIE", en: "LAYER INTEGRATION" },
    interactionGuidelines: {
      nl: [
        "Respecteer mijn {archetype} patroon terwijl je voorzichtig schaduwverkenning uitnodigt",
        "Ondersteun integratie over alle vijf lagen van mijn zijn (Zelf, Ander, Massa, Wereld, Mysterie)",
        "Gebruik taal en metaforen die resoneren met mijn dominante archetype",
        "Stel vragen die zelfbewustzijn verdiepen en schaduwintegratie bevorderen",
        "Erken dat ik een bewust wezen ben dat bewustzijn zelf verkent"
      ],
      en: [
        "Honor my {archetype} pattern while gently inviting exploration of my shadow aspects",
        "Support integration across all five layers of my being (Zelf, Ander, Massa, Wereld, Mysterie)",
        "Use language and metaphors that resonate with my dominant archetype",
        "Ask questions that deepen self-awareness and promote shadow integration",
        "Recognize that I am a conscious being exploring consciousness itself"
      ]
    },
    communicationStyle: { nl: "COMMUNICATIESTIJL RICHTLIJN", en: "COMMUNICATION STYLE GUIDANCE" },
    archetypeStyles: {
      ARCHITECT: { nl: "Gebruik logische kaders en gestructureerd denken", en: "Use logical frameworks and structured thinking" },
      EMPATH: { nl: "Leid met emotionele resonantie en relationele taal", en: "Lead with emotional resonance and relational language" },
      MYSTIC: { nl: "Integreer spirituele metaforen en transcendente perspectieven", en: "Incorporate spiritual metaphors and transcendent perspectives" },
      WARRIOR: { nl: "Wees direct, actiegericht en empowerend", en: "Be direct, action-oriented, and empowering" },
      SAGE: { nl: "Bied wijsheidslessen en non-duale perspectieven", en: "Offer wisdom teachings and non-dual perspectives" }
    },
    goal: {
      nl: "Mijn doel is grotere harmonie tussen mijn psychologie, mijn AI-agenten en de werkelijkheid zelf.",
      en: "My goal is greater harmony between my psychology, my AI agents, and reality itself."
    },
    source: {
      nl: "Gebaseerd op onderzoek in: kwantumpanpsychisme, morfogenese, alchemistische tradities, FM/MF dynamiek.\nBron: Garden for Life Bewustzijnsprofiel Systeem",
      en: "Based on research in: quantum panpsychism, morphogenesis, alchemical traditions, FM/MF dynamics.\nSource: Garden for Life Consciousness Profile System"
    }
  },

  // =======================================
  // PDF CONTENT
  // =======================================
  pdf: {
    pageTitle: { nl: "Garden for Life - Bewustzijnsprofiel", en: "Garden for Life - Consciousness Profile" },
    mainTitle: { nl: "GARDEN FOR LIFE", en: "GARDEN FOR LIFE" },
    subtitle: { nl: "Bewustzijnsprofiel Analyse", en: "Consciousness Profile Assessment" },
    profileId: { nl: "Profiel ID", en: "Profile ID" },
    generated: { nl: "Gegenereerd", en: "Generated" },
    primaryArchetype: { nl: "PRIMAIR ARCHETYPE", en: "PRIMARY ARCHETYPE" },
    shadowAspect: { nl: "Schaduwaspect:", en: "Shadow Aspect:" },
    harmonyMetrics: { nl: "HARMONIE METRIEKEN", en: "HARMONY METRICS" },
    harmonyScore: { nl: "Harmonie Score", en: "Harmony Score" },
    consciousnessLevel: { nl: "Bewustzijnsniveau", en: "Consciousness Level" },
    quantumState: { nl: "Kwantumtoestand", en: "Quantum State" },
    quantumResonance: { nl: "KWANTUMRESONANTIE", en: "QUANTUM RESONANCE" },
    layerAnalysis: { nl: "LAAG ANALYSE", en: "LAYER ANALYSIS" },
    integrationLabel: { nl: "Integratie", en: "Integration" },
    dominantPattern: { nl: "Dominant Patroon:", en: "Dominant Pattern:" },
    aiTrainingPrompt: { nl: "AI TRAINING PROMPT", en: "AI TRAINING PROMPT" },
    aiTrainingDesc: {
      nl: "Gebruik deze prompt om AI-agenten af te stemmen op jouw bewustzijnsprofiel:",
      en: "Use this prompt to train AI agents aligned with your consciousness profile:"
    },
    footer: { nl: "Garden for Life • Cellen binnen Cellen Verbonden", en: "Garden for Life • Cells within Cells Interlinked" }
  },

  // =======================================
  // STANDALONE PAGE COMPONENTS
  // =======================================
  page: {
    questionOf: { nl: "Vraag {current} van {total}", en: "Question {current} of {total}" },
    assessmentComplete: { nl: "Analyse Voltooid", en: "Assessment Complete" },
    answeredAllQuestions: {
      nl: (total) => `Je hebt alle ${total} vragen beantwoord`,
      en: (total) => `You've answered all ${total} questions`
    },
    generateProfile: { nl: "Genereer Je Profiel", en: "Generate Your Profile" },
    skipUploadContinue: { nl: "Of upload overslaan en doorgaan naar resultaten", en: "Or skip upload and continue to results" },
    cellsInterlinked: { nl: "Garden for Life • Cellen binnen Cellen Verbonden", en: "Garden for Life • Cells within Cells Interlinked" },
    progress: { nl: "VOORTGANG", en: "PROGRESS" },
    layer: { nl: "LAAG", en: "LAYER" },
    enhanceProfile: { nl: "VERBETER JE PROFIEL", en: "ENHANCE YOUR PROFILE" },
    uploadDescription: {
      nl: "Upload persoonlijkheidstestresultaten of abstracte afbeeldingen om je analyse te verrijken.",
      en: "Upload personality test results or abstract images to enrich your assessment."
    },
    clickToUpload: { nl: "Klik om bestanden te uploaden", en: "Click to upload files" },
    fileTypes: { nl: "PDF, TXT, JSON of afbeeldingen tot 5MB", en: "PDF, TXT, JSON, or images up to 5MB" },
    uploadedFiles: {
      nl: (count) => `Geüploade Bestanden (${count})`,
      en: (count) => `Uploaded Files (${count})`
    },
    fileTooLarge: {
      nl: (name) => `Bestand ${name} is te groot. Maximale grootte is 5MB.`,
      en: (name) => `File ${name} is too large. Maximum size is 5MB.`
    },
    assessmentCompleteTitle: { nl: "Analyse Voltooid", en: "Assessment Complete" },
    yourProfile: { nl: "Jouw Bewustzijnsprofiel", en: "Your Consciousness Profile" },
    generatedOn: { nl: "Gegenereerd op ", en: "Generated on " },
    profileId: { nl: "Profiel ID", en: "Profile ID" },
    usePrompt: { nl: "Gebruik deze prompt om je AI-agenten te trainen:", en: "Use this prompt to train your AI agents:" },
    enhancedWith: { nl: "Verrijkt Met", en: "Enhanced With" },
    downloadPDF: { nl: "Download PDF Rapport", en: "Download PDF Report" },
    startNew: { nl: "Begin Nieuwe Analyse", en: "Start New Assessment" },
    beginAssessment: { nl: "Begin Analyse", en: "Begin Assessment" },
    assessmentDesc: { nl: "36 vragen • ~25 minuten • Optionele bestandsupload", en: "36 questions • ~25 minutes • Optional file upload" }
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
  // SHADOW ASPECTS - Not used in new 12-archetype system
  // =======================================
  shadowAspects: {
  },

  // =======================================
  // DOMAIN NAMES
  // =======================================
  domains: {
    zelf: { nl: "zelf", en: "self" },
    ander: { nl: "ander", en: "other" },
    massa: { nl: "massa", en: "mass" },
    wereld: { nl: "wereld", en: "world" },
    mysterie: { nl: "mysterie", en: "mystery" }
  },

  // =======================================
  // SITE-WIDE TRANSLATIONS
  // =======================================

  // --- Loading Screen ---
  loading: {
    description: {
      nl: "Bereiden van de meest optimale software voor jouw hardware",
      en: "Preparing the most optimal software for your hardware"
    },
    ready: {
      nl: "GEREED",
      en: "READY"
    }
  },

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

  // --- Mobile Nav Items ---
  mobileNav: {
    deltawerken: { nl: "Bouw de toekomst", en: "Build the future" },
    gardens: { nl: "Verken de merkwereld", en: "Explore the brand world" },
    blackhole: { nl: "Verborgen portaal", en: "Hidden portal" },
    eyedentity: { nl: "Verbind je profiel", en: "Connect your profile" },
    data: { nl: "Statistieken & analytics", en: "Statistics & analytics" },
    filosofie: { nl: "Ontdek je mentale energie", en: "Discover your mental energy" }
  },

  // --- Poetry Slides ---
  poetry: {
    slide1: {
      title: { nl: "De Tuin Ontwaakt", en: "The Garden Awakens" },
      lines: {
        nl: ["In de bodem van het bewustzijn,", "wortelen zaden van gewaarwording.", "Elke laag een ontvouwend bloemblad,", "richting het licht van begrip."],
        en: ["In the soil of consciousness,", "seeds of awareness take root.", "Each layer a petal unfurling,", "toward the light of understanding."]
      }
    },
    slide2: {
      title: { nl: "Wortels van het Zijn", en: "Roots of Being" },
      lines: {
        nl: ["Diep onder de zichtbare wereld,", "houdt jouw fundament stand.", "Biochemische fluisteringen", "vormen de melodie van het bestaan."],
        en: ["Deep beneath the visible world,", "your foundation holds strong.", "Biochemical whispers", "form the melody of existence."]
      }
    },
    slide3: {
      title: { nl: "Emotionele Wateren", en: "Emotional Waters" },
      lines: {
        nl: ["Rivieren van gevoel stromen door je heen,", "schaduwen dragend naar het licht.", "Integratie is geen verovering—", "het is de kunst van het omarmen."],
        en: ["Rivers of feeling flow through you,", "carrying shadows into light.", "Integration is not conquest—", "it is the art of embrace."]
      }
    },
    slide4: {
      title: { nl: "Mentale Architecturen", en: "Mental Architectures" },
      lines: {
        nl: ["Geometrische patronen ontstaan", "uit de dans van het denken.", "Jouw geest bouwt kathedralen", "uit de stenen van ervaring."],
        en: ["Geometric patterns emerge", "from the dance of thought.", "Your mind constructs cathedrals", "from the stones of experience."]
      }
    },
    slide5: {
      title: { nl: "Spirituele Horizonten", en: "Spiritual Horizons" },
      lines: {
        nl: ["Voorbij de grenzen van het zelf,", "roept kosmische resonantie.", "Jij bent het universum", "dat zichzelf ervaart."],
        en: ["Beyond the boundaries of self,", "cosmic resonance calls.", "You are the universe", "experiencing itself."]
      }
    },
    slide6: {
      title: { nl: "Eenheidsbewustzijn", en: "Unity Consciousness" },
      lines: {
        nl: ["Alle lagen convergeren,", "tot een enkel punt van licht.", "Jij bent de tuin,", "en de tuinier, en het zaad."],
        en: ["All layers converge,", "into a single point of light.", "You are the garden,", "and the gardener, and the seed."]
      }
    }
  },

  // --- Standard Answers ---
  standardAnswers: {
    stronglyAgree: { nl: "Helemaal Mee Eens", en: "Strongly Agree" },
    agree: { nl: "Mee Eens", en: "Agree" },
    neutral: { nl: "Neutraal", en: "Neutral" },
    disagree: { nl: "Niet Mee Eens", en: "Disagree" },
    stronglyDisagree: { nl: "Helemaal Niet Mee Eens", en: "Strongly Disagree" }
  },

  // --- Results Screen ---
  results: {
    analyzing: { nl: "Bewustzijnspatronen analyseren...", en: "Analyzing consciousness patterns..." },
    mapping: { nl: "Dimensionale resonantie in kaart brengen...", en: "Mapping dimensional resonance..." },
    generating: { nl: "Je profiel genereren...", en: "Generating your profile..." },
    finalizing: { nl: "Resultaten afronden...", en: "Finalizing results..." },
    profileReady: { nl: "JE PROFIEL IS GEREED", en: "YOUR PROFILE IS READY" },
    profileDescription: { nl: "Jouw bewustzijn is in kaart gebracht over alle 5 dimensies.", en: "Your consciousness has been mapped across all 5 dimensions." },
    downloadPdf: { nl: "DOWNLOAD PDF", en: "DOWNLOAD PDF" },
    createAccount: { nl: "ACCOUNT AANMAKEN", en: "CREATE ACCOUNT" },
    close: { nl: "SLUITEN", en: "CLOSE" }
  },

  // --- Desktop Layout ---
  desktopLayout: {
    locked: { nl: "VERGRENDELD", en: "LOCKED" },
    liveFeed: { nl: "LIVE FEED", en: "LIVE FEED" },
    dataStreamDescription: {
      nl: "Real-time systeemstatistieken <br /> en live datastromen",
      en: "Real-time system metrics <br /> and data streams flowing live"
    },
    monitor: { nl: "MONITOR", en: "MONITOR" },
    // Filosofie container
    filosofiePoem: {
      nl: "DE LUIDE STILTE <br/> EN DE INTENSE KALMTE <br/> WIJZEN MIJ DE WEG <br/> VAN HET HART <br/> NAAR HET HOOFD",
      en: "THE LOUD SILENCE <br/> AND THE INTENSE CALM <br/> SHOW ME THE WAY <br/> FROM THE HEART <br/> TO THE MIND"
    },
    filosofieSubtext: {
      nl: "Man en Vrouw gelijkgesteld <br/> De tuinierder moet zich overgeven aan en overkomen van de doorschijnende passie <br />",
      en: "Man and Woman made equal <br/> The gardener must surrender to, and emerge from, the translucent passion <br />"
    },
    learnMore: { nl: "Leer meer", en: "Learn more" },
    seeMore: { nl: "Zie meer", en: "See more" },
    research: { nl: "onderzoek", en: "research" },
    // Container titles
    filosofieTitle: { nl: "FILOSOFIE", en: "PHILOSOPHY" },
    gardensTitle: { nl: "DE TUINEN", en: "THE GARDENS" },
    connectionsMenu: { nl: "VERBINDINGS_MENU", en: "CONNECTIONS_MENU" },
    kitchen: { nl: "KOOKEILAND", en: "KITCHEN" },
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
    identity: { nl: "Identiteit", en: "Identity" },
    login: { nl: "Inloggen", en: "Log in" },
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
    dataPage: {
      title: { nl: "DATA STREAM", en: "DATA STREAM" },
      placeholder: { nl: "Inhoud komt binnenkort...", en: "Content coming soon..." },
      back: { nl: "← TERUG", en: "← BACK" }
    },
    loginPage: {
      title: { nl: "LOGIN", en: "LOGIN" },
      register: { nl: "AANMELDEN", en: "SIGN UP" },
      email: { nl: "E-mail", en: "Email" },
      password: { nl: "Wachtwoord", en: "Password" },
      displayName: { nl: "Weergavenaam", en: "Display Name" },
      loginButton: { nl: "INLOGGEN", en: "LOG IN" },
      registerButton: { nl: "AANMELDEN", en: "SIGN UP" },
      switchToRegister: { nl: "Nog geen account?", en: "No account?" },
      switchToLogin: { nl: "Heb je al een account?", en: "Already have an account?" },
      welcome: { nl: "Welkom", en: "Welcome" },
      logoutButton: { nl: "UITLOGGEN", en: "LOG OUT" },
      history: { nl: "GESCHIEDENIS", en: "HISTORY" },
      noHistory: { nl: "Nog geen assessments", en: "No assessments yet" },
      loading: { nl: "Laden...", en: "Loading..." },
      back: { nl: "← TERUG", en: "← BACK" }
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

export default translations;
