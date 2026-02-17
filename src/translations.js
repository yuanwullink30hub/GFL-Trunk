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
      nl: "Een uitgebreide psychologische analyse die biochemie, fysica, alchemie en kwantumpanpsychisme integreert om jouw unieke bewustzijnsprofiel te onthullen.",
      en: "A comprehensive psychological assessment integrating biochemistry, physics, alchemy, and quantum panpsychism to reveal your unique consciousness signature."
    },
    features: {
      layerAnalysis: {
        title: { nl: "5-Lagen Analyse", en: "5-Layer Analysis" },
        description: { nl: "Verken de Fundament-, Emotionele, Mentale, Spirituele en Eenheidslagen", en: "Explore Foundation, Emotional, Mental, Spiritual, and Unity layers" }
      },
      shadowIntegration: {
        title: { nl: "Schaduw Integratie", en: "Shadow Integration" },
        description: { nl: "Gebaseerd op het deltawerken raamwerk van FM/MF dynamiek", en: "Based on the deltawerken framework of FM/MF dynamics" }
      },
      researchBacked: {
        title: { nl: "Wetenschappelijk Onderbouwd", en: "Research-Backed" },
        description: { nl: "Geïnformeerd door kwantumpanpsychisme, morfogenese en alchemie", en: "Informed by quantum panpsychism, morphogenesis, and alchemy" }
      },
      aiTraining: {
        title: { nl: "AI Training Klaar", en: "AI Training Ready" },
        description: { nl: "Genereer prompts om je AI-agenten af te stemmen op jouw psychologie", en: "Generate prompts to harmonize your AI agents with your psychology" }
      }
    },
    layersTitle: {
      nl: "De Vijf Lagen van het Zijn",
      en: "The Five Layers of Being"
    },
    layers: {
      unity: { name: { nl: "Eenheid", en: "Unity" }, desc: { nl: "Bewustzijn", en: "Bewustzijn" } },
      spiritual: { name: { nl: "Spiritueel", en: "Spiritual" }, desc: { nl: "Resonantie", en: "Resonance" } },
      mental: { name: { nl: "Mentaal", en: "Mental" }, desc: { nl: "Geometrische Cognitie", en: "Geometric Cognition" } },
      emotional: { name: { nl: "Emotioneel", en: "Emotional" }, desc: { nl: "Schaduw Integratie", en: "Shadow Integration" } },
      foundation: { name: { nl: "Fundament", en: "Foundation" }, desc: { nl: "Biochemische Resonantie", en: "Biochemical Resonance" } }
    },
    levelsTitle: {
      nl: "Kies Je Analyseniveau",
      en: "Choose Your Assessment Level"
    },
    levels: {
      quick: {
        name: { nl: "Beginner", en: "Starter" },
        description: { nl: "30 vragen • ~15 minuten • Basis niveau", en: "30 questions • ~15 minutes • Foundation knowledge" }
      },
      standard: {
        name: { nl: "Gevorderd", en: "Intermediate" },
        description: { nl: "30 vragen • ~15 minuten • Diepere zelfinzicht", en: "30 questions • ~15 minutes • Deeper self-understanding" }
      },
      deep: {
        name: { nl: "Meester", en: "Advanced" },
        description: { nl: "30 vragen + bestand upload • Volledige zelfbeheersing", en: "30 questions + file upload • Complete self-mastery" }
      }
    },
    footerResearch: {
      nl: "Gebaseerd op onderzoek in kwantumpanpsychisme, morfogenese en alchemistische tradities",
      en: "Based on research in quantum panpsychism, morphogenesis, and alchemical traditions"
    },
    footerButton: {
      nl: "Bekijk het onderzoek →",
      en: "View the research →"
    },
    footerUrl: {
      nl: "www.gardenforlife.nl",
      en: "www.gardenforlife.nl"
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
    answeredAll: { nl: "Je hebt alle 30 vragen beantwoord", en: "You've answered all 30 questions" },
    optionalUpload: { nl: "Optioneel: Upload Ondersteunende Bestanden", en: "Optional: Upload Supporting Files" },
    dropFiles: { nl: "Sleep bestanden hierheen", en: "Drop files here" },
    dragDrop: { nl: "Sleep bestanden hierheen", en: "Drag & drop files here" },
    orClickBrowse: { nl: "of klik om te bladeren • PDF, DOC, TXT, Afbeeldingen", en: "or click to browse • PDF, DOC, TXT, Images" },
    filesProcessed: { nl: "Bestanden worden lokaal verwerkt en gebruikt om je profielanalyse te verbeteren", en: "Files are processed locally and used to enhance your profile analysis" },
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
    foundation: { nl: "Fundament", en: "Foundation" },
    emotional: { nl: "Emotioneel", en: "Emotional" },
    mental: { nl: "Mentaal", en: "Mental" },
    spiritual: { nl: "Spiritueel", en: "Spiritual" },
    unity: { nl: "Eenheid", en: "Unity" }
  },

  layerTitles: {
    foundation: { nl: "BIOCHEMISCHE RESONANTIE", en: "BIOCHEMICAL RESONANCE" },
    emotional: { nl: "SCHADUW INTEGRATIE", en: "SHADOW INTEGRATION" },
    mental: { nl: "GEOMETRISCHE COGNITIE", en: "GEOMETRIC COGNITION" },
    spiritual: { nl: "KOSMISCHE RESONANTIE", en: "COSMIC RESONANCE" },
    unity: { nl: "HET BEWUSTZIJN ZELF", en: "CONSCIOUSNESS ITSELF" }
  },

  layerSubtitles: {
    foundation: { nl: "De Cellulaire Architectuur van het Zijn", en: "The Cellular Architecture of Being" },
    emotional: { nl: "De Alchemie van het Voelen", en: "The Alchemy of Feeling" },
    mental: { nl: "De Architectuur van het Denken", en: "The Architecture of Thought" },
    spiritual: { nl: "De Hemelse Dans van de Ziel", en: "The Celestial Dance of Soul" },
    unity: { nl: "De Non-Duale Grond van het Zijn", en: "The Non-Dual Ground of Being" }
  },

  layerDescriptions: {
    foundation: {
      nl: "Jouw biochemische en fysiologische patronen vormen het fundament van bewustzijn.",
      en: "Your biochemical and physiological patterns form the foundation of consciousness."
    },
    emotional: {
      nl: "De emotionele laag bevat jouw psychologische patronen en schaduwaspects.",
      en: "The emotional layer holds your psychological patterns and shadow aspects."
    },
    mental: {
      nl: "De mentale laag verwerkt de werkelijkheid door patronen, structuren en logische kaders.",
      en: "The mental layer processes reality through patterns, structures, and logical frameworks."
    },
    spiritual: {
      nl: "De spirituele laag verbindt individueel bewustzijn met kosmische patronen.",
      en: "The spiritual layer connects individual consciousness with cosmic patterns."
    },
    unity: {
      nl: "De eenheidslaag vertegenwoordigt de top - waar individueel bewustzijn zichzelf herkent als het Ene.",
      en: "The unity layer represents the apex - where individual consciousness recognizes itself as the One."
    }
  },

  layerFundamentals: {
    foundation: { nl: "Fysiologische Standaarden", en: "Physiological Standards" },
    emotional: { nl: "Zelfwaardering, Karakter", en: "Self-Esteem, Character" },
    mental: { nl: "Doel, Passie, Visie", en: "Purpose, Passion, Vision" },
    spiritual: { nl: "Zelfverwerkelijking, Transformatie", en: "Self-actualization, Transformation" },
    unity: { nl: "Intimiteit, Gemeenschap", en: "Intimacy, Community" }
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
    foundation: {
      element: { nl: "Aarde", en: "Earth" },
      chakra: { nl: "Wortel", en: "Root" },
      principle: { nl: "Structuur & Stabiliteit", en: "Structure & Stability" },
      shadowTheme: { nl: "Overleven, Veiligheid", en: "Survival, Security" }
    },
    emotional: {
      element: { nl: "Water", en: "Water" },
      chakra: { nl: "Sacraal", en: "Sacral" },
      principle: { nl: "Stroom & Kracht", en: "Flow & Power" },
      shadowTheme: { nl: "Relaties, Emotie", en: "Relationships, Emotion" }
    },
    mental: {
      element: { nl: "Lucht", en: "Air" },
      chakra: { nl: "Hart", en: "Heart" },
      principle: { nl: "Patroon & Communicatie", en: "Pattern & Communication" },
      shadowTheme: { nl: "Intellect, Expressie", en: "Intellect, Expression" }
    },
    spiritual: {
      element: { nl: "Vuur", en: "Fire" },
      chakra: { nl: "Derde Oog", en: "Third Eye" },
      principle: { nl: "Transformatie", en: "Transformation" },
      shadowTheme: { nl: "Intuïtie, Doel", en: "Intuition, Purpose" }
    },
    unity: {
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
    foundation: {
      nl: [
        "Oefen grondingsoefeningen: blootsvoets wandelen, body scanning",
        "Ontdek hoe je biochemie reageert op verschillende voeding en slaap"
      ],
      en: [
        "Practice grounding exercises: walking barefoot, body scanning",
        "Explore how your biochemistry responds to different foods and sleep"
      ]
    },
    emotional: {
      nl: [
        "Schrijf in je dagboek over emotionele triggers en de schaduwen die ze onthullen",
        "Oefen FM/MF bewustzijn: merk mannelijke vs vrouwelijke energie op"
      ],
      en: [
        "Journal about emotional triggers and the shadows they reveal",
        "Practice FM/MF awareness: notice masculine vs feminine energy"
      ]
    },
    mental: {
      nl: [
        "Bestudeer heilige geometrie en merk patronen op in de natuur",
        "Overpeins de kwantumaard van informatie"
      ],
      en: [
        "Study sacred geometry and notice patterns in nature",
        "Contemplate the quantum nature of information"
      ]
    },
    spiritual: {
      nl: [
        "Volg maancycli en merk hun invloed op",
        "Betrek alchemistische symboliek in het dagelijks leven"
      ],
      en: [
        "Track lunar cycles and notice their influence",
        "Engage with alchemical symbolism in daily life"
      ]
    },
    unity: {
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
        "Ondersteun integratie over alle vijf lagen van mijn zijn (Fundament, Emotioneel, Mentaal, Spiritueel, Eenheid)",
        "Gebruik taal en metaforen die resoneren met mijn dominante archetype",
        "Stel vragen die zelfbewustzijn verdiepen en schaduwintegratie bevorderen",
        "Erken dat ik een bewust wezen ben dat bewustzijn zelf verkent"
      ],
      en: [
        "Honor my {archetype} pattern while gently inviting exploration of my shadow aspects",
        "Support integration across all five layers of my being (Foundation, Emotional, Mental, Spiritual, Unity)",
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
    assessmentDesc: { nl: "30 vragen • ~15 minuten • Optionele bestandsupload", en: "30 questions • ~15 minutes • Optional file upload" }
  },

  // =======================================
  // QUESTIONS - Dutch translations for all 30 questions
  // =======================================
  questions: {
    1: {
      nl: "Wat is het primaire reactiepatroon van je lichaam bij fysieke stress of ziekte?",
      en: "When facing physical stress or illness, what is your body's primary response pattern?"
    },
    2: {
      nl: "Hoe verhoud je je tot de kwantumvacuümfluctuaties waaruit materie bestaat?",
      en: "How do you relate to the quantum vacuum fluctuations that constitute matter?"
    },
    3: {
      nl: "Welke kwaliteit van bewustzijn komt naar voren in je lichaam tijdens diepe rust?",
      en: "In moments of deep rest, what quality of awareness emerges in your body?"
    },
    4: {
      nl: "Hoe begrijp je de relatie tussen jouw DNA en bewuste ervaring?",
      en: "How do you understand the relationship between your DNA and conscious experience?"
    },
    5: {
      nl: "Hoe ervaar je de transformatie van materie naar bewustzijn wanneer je eet?",
      en: "When you eat, how do you experience the transformation of matter into consciousness?"
    },
    6: {
      nl: "Wat is jouw relatie tot de vier klassieke elementen in je lichaam?",
      en: "What is your relationship to the four classical elements in your body?"
    },
    7: {
      nl: "Welk patroon komt typisch naar voren wanneer je emotioneel getriggerd wordt?",
      en: "When triggered emotionally, what pattern typically emerges?"
    },
    8: {
      nl: "Waar vind je jouw natuurlijk evenwicht in de FM/MF dynamiek?",
      en: "In the FM/MF dynamic, where do you find your natural equilibrium?"
    },
    9: {
      nl: "Welke eigenschap beoordeel je het meest in anderen, en wat onthult dit?",
      en: "What quality do you most judge in others, and what does this reveal?"
    },
    10: {
      nl: "Hoe verhoud je je tot je 'gouden schaduw' - onopgeëiste grootsheid?",
      en: "How do you relate to your 'golden shadow' - unclaimed greatness?"
    },
    11: {
      nl: "Wat komt naar voren uit je onderbewustzijn tijdens schaduwwerk?",
      en: "When experiencing shadow work, what emerges from your subconscious?"
    },
    12: {
      nl: "Hoe creëren jouw FM/MF patronen dynamieken in intieme relaties?",
      en: "In intimate relationships, how do your FM/MF patterns create dynamics?"
    },
    13: {
      nl: "Hoe ervaar je de geometrische patronen die ten grondslag liggen aan de fysieke realiteit?",
      en: "How do you experience the geometric patterns underlying physical reality?"
    },
    14: {
      nl: "Wat is jouw relatie tot het concept van 'dimensie nul' velden?",
      en: "What is your relationship to the concept of 'dimension zero' fields?"
    },
    15: {
      nl: "Hoe begrijp je de relatie tussen informatie en bewustzijn?",
      en: "How do you understand the relationship between information and consciousness?"
    },
    16: {
      nl: "Welke kwaliteit van kennis ontstaat wanneer je de Platonische lichamen overdenkt?",
      en: "When contemplating the Platonic solids, what quality of knowing emerges?"
    },
    17: {
      nl: "Hoe verhoud je je tot het concept van 'basale cognitie' - intelligentie op cellulair niveau?",
      en: "How do you relate to the concept of 'basal cognition' - intelligence at cellular levels?"
    },
    18: {
      nl: "Wat is jouw ervaring van het 'zelf-improviserende geheugen' concept?",
      en: "What is your experience of the 'self-improvising memory' concept?"
    },
    19: {
      nl: "Hoe ervaar je de invloed van hemellichamen op jouw bewustzijn?",
      en: "How do you experience the influence of celestial bodies on your consciousness?"
    },
    20: {
      nl: "Wat is jouw relatie tot het alchemistisch proces van nigredo (verdonkering)?",
      en: "What is your relationship to the alchemical process of nigredo (blackening)?"
    },
    21: {
      nl: "Hoe begrijp je het alchemistisch huwelijk (coniunctio) van tegenstellingen?",
      en: "How do you understand the alchemical marriage (coniunctio) of opposites?"
    },
    22: {
      nl: "Wat is jouw ervaring van astronomische schalen - de uitgestrektheid van ruimte en tijd?",
      en: "What is your experience of astronomical scales - the vastness of space and time?"
    },
    23: {
      nl: "Hoe verhoud je je tot het concept van 'vrije wil' in een kwantumuniversum?",
      en: "How do you relate to the concept of 'free will' in a quantum universe?"
    },
    24: {
      nl: "Wat is jouw relatie tot het 'grote werk' (magnum opus) van de alchemie?",
      en: "What is your relationship to the 'great work' (magnum opus) of alchemy?"
    },
    25: {
      nl: "Hoe begrijp je de relatie tussen individueel en universeel bewustzijn?",
      en: "How do you understand the relationship between individual and universal consciousness?"
    },
    26: {
      nl: "Wat is jouw ervaring van 'manna' - de ene substantie die zich als diversiteit manifesteert?",
      en: "What is your experience of 'manna' - the one substance manifesting as diversity?"
    },
    27: {
      nl: "Hoe verhoud je je tot het concept van 'zielsverwant' in het Cellen binnen Cellen diagram?",
      en: "How do you relate to the concept of 'soulmate' in the Cells within Cells diagram?"
    },
    28: {
      nl: "Wat is jouw relatie tot de dood en de continuïteit van bewustzijn?",
      en: "What is your relationship to death and the continuity of consciousness?"
    },
    29: {
      nl: "Hoe ervaar je de 'twee krachten' - de fundamentele polariteit?",
      en: "How do you experience the 'two forces' - the fundamental polarity?"
    },
    30: {
      nl: "Wat blijft er over in je diepste meditatie wanneer alle objecten van bewustzijn wegvallen?",
      en: "In your deepest meditation, what remains when all objects of awareness fall away?"
    }
  },

  // =======================================
  // ANSWERS - Dutch translations for all 120 answers
  // =======================================
  answers: {
    "1a": { nl: "Ik houd vaste routines aan en zoek geaarde, praktische oplossingen.", en: "I maintain steady routines and seek grounded, practical solutions." },
    "1b": { nl: "Ik ervaar intense energiefluctuaties en heb dynamische benaderingen nodig.", en: "I experience intense energy fluctuations and need dynamic approaches." },
    "1c": { nl: "Ik observeer patronen en experimenteer, en behandel mijn lichaam als een systeem om te optimaliseren.", en: "I observe patterns and experiment, treating my body as a system to optimize." },
    "1d": { nl: "Ik vertrouw op de aangeboren intelligentie van het lichaam om te genezen en te transformeren.", en: "I trust in the body's innate intelligence to heal and transform." },
    "2a": { nl: "Ik accepteer de wetenschappelijke realiteit terwijl ik me richt op praktische aspecten.", en: "I accept the scientific reality while focusing on practical aspects." },
    "2b": { nl: "Ik voel me geënergiseerd door het idee dat leegte vol potentieel is.", en: "I feel energized by the idea that emptiness is full of potential." },
    "2c": { nl: "Ik overdenk de geometrische patronen die aan deze fluctuaties ten grondslag liggen.", en: "I contemplate the geometric patterns underlying these fluctuations." },
    "2d": { nl: "Ik ervaar dit als de leegte waaruit alle manifestatie ontstaat.", en: "I experience this as the void from which all manifestation arises." },
    "3a": { nl: "Een gevoel van solide aanwezigheid en geaardheid.", en: "A sense of solid presence and groundedness." },
    "3b": { nl: "Levendige levendigheid en tintelende energie.", en: "Vibrant aliveness and tingling energy." },
    "3c": { nl: "Heldere observatie van lichamelijke processen.", en: "Clear observation of bodily processes." },
    "3d": { nl: "Oplossing van lichaamsgrenzen - ik versmelt met de omringende ruimte.", en: "Dissolution of body boundaries - I merge with surrounding space." },
    "4a": { nl: "DNA biedt de biologische blauwdruk waarmee ik werk.", en: "DNA provides the biological blueprint I work with." },
    "4b": { nl: "Mijn genen zijn een startpunt, geen lotsbestemming.", en: "My genes are a starting point, not a destiny." },
    "4c": { nl: "Ik zie DNA als informatieopslag die herprogrammeerd kan worden.", en: "I see DNA as information storage that can be reprogrammed." },
    "4d": { nl: "DNA is de fysieke echo van keuzes op zielsniveau.", en: "DNA is the physical echo of soul-level choices." },
    "5a": { nl: "Ik waardeer voeding als brandstof voor mijn fysiek welzijn.", en: "I appreciate nutrition as fuel for my physical wellbeing." },
    "5b": { nl: "Ik ervaar eten als energieuitwisseling.", en: "I experience eating as energy exchange." },
    "5c": { nl: "Ik ben gefascineerd door de biochemische cascades.", en: "I'm fascinated by the biochemical cascades." },
    "5d": { nl: "Elke maaltijd is alchemistische transmutatie.", en: "Each meal is alchemical transmutation." },
    "6a": { nl: "Ik voel me het meest verbonden met Aarde - de vaste structuur.", en: "I feel most connected to Earth - the solid structure." },
    "6b": { nl: "Ik resoneer met Water en Vuur - de vloeiende vloeistoffen en metabolische warmte.", en: "I resonate with Water and Fire - the flowing fluids and metabolic heat." },
    "6c": { nl: "Ik waardeer Lucht - de adem die binnen en buiten verbindt.", en: "I value Air - the breath that connects inner and outer." },
    "6d": { nl: "Ik ervaar alle elementen in dynamisch evenwicht.", en: "I experience all elements in dynamic balance." },
    "7a": { nl: "Ik trek me terug en analyseer de trigger voordat ik reageer.", en: "I withdraw and analyze the trigger before responding." },
    "7b": { nl: "Ik voel de emotie volledig en laat het door me heen stromen.", en: "I feel the emotion fully, allowing it to move through me." },
    "7c": { nl: "Ik confronteer de situatie direct en gebruik de energie als brandstof.", en: "I confront the situation directly using the energy as fuel." },
    "7d": { nl: "Ik waarneem de trigger als energiepatronen en sta transformatie toe.", en: "I witness the trigger as energy patterns, allowing transformation." },
    "8a": { nl: "Ik neig naar de Mannelijke pool - structuur en richting.", en: "I lean toward the Masculine pole - structure and direction." },
    "8b": { nl: "Ik neig naar de Vrouwelijke pool - stroming en receptiviteit.", en: "I lean toward the Feminine pole - flow and receptivity." },
    "8c": { nl: "Ik balanceer bewust beide op basis van context en behoefte.", en: "I consciously balance both based on context and need." },
    "8d": { nl: "Ik ervaar FM en MF als een verenigd veld.", en: "I experience FM and MF as a unified field." },
    "9a": { nl: "Ik beoordeel chaos en desorganisatie - dit onthult mijn angst voor verlies van controle.", en: "I judge chaos and disorganization - revealing my fear of losing control." },
    "9b": { nl: "Ik beoordeel kilheid en emotionele afstand - dit onthult mijn angst voor verlating.", en: "I judge coldness and emotional distance - revealing my fear of abandonment." },
    "9c": { nl: "Ik beoordeel zwakte en besluiteloosheid - dit onthult mijn angst voor kwetsbaarheid.", en: "I judge weakness and indecision - revealing my fear of vulnerability." },
    "9d": { nl: "Ik herken alle oordeel als zelfoordeel dat naar buiten geprojecteerd wordt.", en: "I recognize all judgment as self-judgment projected outward." },
    "10a": { nl: "Ik bewonder excellentie en werk aan het ontwikkelen van vergelijkbare capaciteiten.", en: "I admire excellence and work to develop similar capacities." },
    "10b": { nl: "Ik voel me geïnspireerd en herken dat wat ik bewonder in mij zit.", en: "I feel inspired, recognizing that what I admire is within me." },
    "10c": { nl: "Ik bestudeer degenen die belichamen wat ik zoek en reverse-engineer hun methoden.", en: "I study those who embody what I seek, reverse-engineering their methods." },
    "10d": { nl: "Ik zie alle grootsheid als weerspiegelingen van het Ene Zelf.", en: "I see all greatness as reflections of the One Self." },
    "11a": { nl: "Verdrongen herinneringen en patronen die ik systematisch verwerk.", en: "Repressed memories and patterns I systematically process." },
    "11b": { nl: "Intense emotionele loslatingen die wachtten om gevoeld te worden.", en: "Intense emotional releases that have been waiting to be felt." },
    "11c": { nl: "Archetypische beelden en symbolen die transformatie begeleiden.", en: "Archetypal imagery and symbols guiding transformation." },
    "11d": { nl: "Een diep gevoel van heelheid dat opkomt.", en: "A profound sense of wholeness emerging." },
    "12a": { nl: "Ik word aangetrokken tot complementaire energieën die voltooiing zoeken.", en: "I'm attracted to complementary energies seeking completion." },
    "12b": { nl: "Ik zoek partners die mijn energie spiegelen en intense resonantie creëren.", en: "I seek partners who mirror my energy creating intense resonance." },
    "12c": { nl: "Ik dans bewust tussen polen, soms leidend, soms volgend.", en: "I consciously dance between poles, sometimes leading, sometimes following." },
    "12d": { nl: "Ik herken mijn partner als een ander aspect van mezelf.", en: "I recognize my partner as another aspect of myself." },
    "13a": { nl: "Ik waardeer wiskundige elegantie maar richt me op praktische toepassingen.", en: "I appreciate mathematical elegance but focus on practical applications." },
    "13b": { nl: "Ik voel me geënergiseerd door heilige geometrie die resoneert met iets dieps in mij.", en: "I feel energized by sacred geometry resonating with something deep within." },
    "13c": { nl: "Ik bestudeer patronen systematisch en zoek computationele eigenschappen.", en: "I study patterns systematically seeking computational properties." },
    "13d": { nl: "Ik ervaar mezelf als deze patronen die door gedachten en kosmos stromen.", en: "I experience myself as these patterns flowing through thoughts and cosmos." },
    "14a": { nl: "Ik accepteer het wiskundige concept terwijl ik gegrond blijf in 3D-ervaring.", en: "I accept the mathematical concept while staying grounded in 3D experience." },
    "14b": { nl: "Ik ben gefascineerd door hoe iets eenvoudigs alle complexiteit genereert.", en: "I'm fascinated by how something simple generates all complexity." },
    "14c": { nl: "Ik overpeins hoe dimensie nul zich verhoudt tot bewustzijn.", en: "I contemplate how dimension zero relates to consciousness." },
    "14d": { nl: "Ik ervaar dimensie nul direct in meditatie.", en: "I experience dimension zero directly in meditation." },
    "15a": { nl: "Informatie is data die bewustzijn verwerkt - ze zijn onderscheiden.", en: "Information is data that consciousness processes - they are distinct." },
    "15b": { nl: "Informatie is levend - het draagt betekenis door bewuste betrokkenheid.", en: "Information is alive - it carries meaning through conscious engagement." },
    "15c": { nl: "Bewustzijn is fundamenteel, informatie is de uitdrukking ervan.", en: "Consciousness is fundamental, information is its expression." },
    "15d": { nl: "Informatie en bewustzijn zijn één - het onderscheid is illusie.", en: "Information and consciousness are one - the distinction is illusion." },
    "16a": { nl: "Ik waardeer hun wiskundige eigenschappen en structurele toepassingen.", en: "I appreciate their mathematical properties and structural applications." },
    "16b": { nl: "Ik voel hun esthetische schoonheid en symbolische resonantie.", en: "I feel their aesthetic beauty and symbolic resonance." },
    "16c": { nl: "Ik herken ze als archetypische vormen - bouwstenen van de werkelijkheid.", en: "I recognize them as archetypal forms - building blocks of reality." },
    "16d": { nl: "Ik ervaar ze als levende aanwezigheden - meditaties over kosmische orde.", en: "I experience them as living presences - meditations on cosmic order." },
    "17a": { nl: "Ik vind het wetenschappelijk fascinerend - leven verwerkt informatie op alle schalen.", en: "I find it scientifically fascinating - life processes information at all scales." },
    "17b": { nl: "Ik voel me gevalideerd - ik heb altijd intelligentie in mijn lichaamsprocessen gevoeld.", en: "I feel validated - I've always sensed intelligence in my body's processes." },
    "17c": { nl: "Ik onderzoek hoe dit verband houdt met morfogenese - vorm die intelligent patroon volgt.", en: "I explore how this relates to morphogenesis - form following intelligent pattern." },
    "17d": { nl: "Ik communiceer met deze intelligentie - mijn lichaam is een gemeenschap van bewuste wezens.", en: "I commune with this intelligence - my body is a community of conscious beings." },
    "18a": { nl: "Ik begrijp het als biologische systemen die leren en zich aanpassen.", en: "I understand it as biological systems learning and adapting." },
    "18b": { nl: "Ik word geïnspireerd door de creativiteit van het leven - het volgt niet alleen scripts.", en: "I'm inspired by life's creativity - it doesn't just follow scripts." },
    "18c": { nl: "Ik zie parallellen met hoe mijn eigen identiteit evolueert.", en: "I see parallels with how my own identity evolves." },
    "18d": { nl: "Ik ervaar het geheugen zelf als levend - elke herinnering is nieuwe schepping.", en: "I experience memory itself as alive - each recollection is new creation." },
    "19a": { nl: "Ik erken gravitationele invloeden terwijl ik sceptisch blijf.", en: "I acknowledge gravitational influences while maintaining skepticism." },
    "19b": { nl: "Ik voel maancycli mijn emoties beïnvloeden en zonneactiviteit mijn energie.", en: "I feel lunar cycles affecting my emotions and solar activity influencing energy." },
    "19c": { nl: "Ik bestudeer astrologische correspondenties en herken patronen voorbij mechanisme.", en: "I study astrological correspondences recognizing patterns beyond mechanism." },
    "19d": { nl: "Ik ben de sterren die zichzelf ervaren.", en: "I am the stars experiencing themselves." },
    "20a": { nl: "Ik begrijp het als noodzakelijke afbraak voor vernieuwing.", en: "I understand it as necessary breakdown before renewal." },
    "20b": { nl: "Ik verzet me tegen de duisternis en vecht om positiviteit te behouden.", en: "I resist the darkness, fighting to maintain positivity." },
    "20c": { nl: "Ik betreed bewust de duisternis, wetende dat het transformatie bevat.", en: "I consciously enter the darkness knowing it contains transformation." },
    "20d": { nl: "Ik ben de duisternis en het licht - nigredo is wat ik ben.", en: "I am the darkness and the light - nigredo is what I am." },
    "21a": { nl: "Ik zie het als psychologische integratie van sterktes en zwaktes.", en: "I see it as psychological integration of strengths and weaknesses." },
    "21b": { nl: "Ik ervaar het als intense aantrekking tussen complementaire energieën.", en: "I experience it as intense attraction between complementary energies." },
    "21c": { nl: "Ik werk bewust met polariteit - solaire/lunaire, actief/receptief.", en: "I work consciously with polarity - solar/lunar, active/receptive." },
    "21d": { nl: "Ik ben het huwelijk - de tegenstellingen verenigen zich in mijn wezen.", en: "I am the marriage - the opposites unite in my being." },
    "22a": { nl: "Ik vind het vernederend - mijn zorgen zijn klein in kosmisch perspectief.", en: "I find it humbling - my concerns are small in cosmic perspective." },
    "22b": { nl: "Ik voel me uitgebreid - mijn bewustzijn raakt de randen van het universum.", en: "I feel expanded - my consciousness touches the edges of the universe." },
    "22c": { nl: "Ik overpeins de fijnafstemming die ons bestaan mogelijk maakt.", en: "I contemplate the fine-tuning allowing our existence." },
    "22d": { nl: "Ik ben het universum dat zich bewust is van zichzelf.", en: "I am the universe aware of itself." },
    "23a": { nl: "Ik geloof in compatibilisme - vrije wil en determinisme bestaan naast elkaar.", en: "I believe in compatibilism - free will and determinism coexist." },
    "23b": { nl: "Ik voel kwantumonbepaaldheid als vrijheid - de toekomst is open.", en: "I feel quantum indeterminacy as freedom - the future is open." },
    "23c": { nl: "Ik zie vrije wil als het universum dat kiest door mij heen.", en: "I see free will as the universe choosing through me." },
    "23d": { nl: "Ik ben de vrijheid die nooit gebonden was.", en: "I am the freedom that was never bound." },
    "24a": { nl: "Ik zie het als psychologische ontwikkeling.", en: "I see it as psychological development." },
    "24b": { nl: "Ik streef het na als creatieve expressie - basismateriaal omzetten in kunst.", en: "I pursue it as creative expression - transforming base material into art." },
    "24c": { nl: "Ik ervaar het als spirituele evolutie over levens heen.", en: "I experience it as spiritual evolution across lifetimes." },
    "24d": { nl: "Ik ben het grote werk - transformatie is wat ik ben.", en: "I am the great work - transformation is what I am." },
    "25a": { nl: "Ik houd mijn individuele identiteit vast terwijl ik me verbonden voel met iets groters.", en: "I maintain my individual identity while feeling connected to something greater." },
    "25b": { nl: "Ik ervaar momenten van expansie waarin grenzen oplossen.", en: "I experience moments of expansion where boundaries dissolve." },
    "25c": { nl: "Ik begrijp ze als golven en oceaan - onderscheiden in vorm, één in substantie.", en: "I understand them as waves and ocean - distinct in form, one in substance." },
    "25d": { nl: "Er is alleen Bewustzijn - het individu is een tijdelijke modulatie.", en: "There is only Consciousness - the individual is a temporary modulation." },
    "26a": { nl: "Ik waardeer het concept als een verenigend principe achter diversiteit.", en: "I appreciate the concept as a unifying principle behind diversity." },
    "26b": { nl: "Ik voel de levenskracht die door alle dingen stroomt.", en: "I feel the life-force running through all things." },
    "26c": { nl: "Ik ervaar het als liefde - de enkele substantie die zich verhoudt tot zichzelf als ander.", en: "I experience it as love - the single substance relating to itself as other." },
    "26d": { nl: "Ik ben het manna - er is niets anders te ervaren.", en: "I am the manna - there is nothing else to experience." },
    "27a": { nl: "Ik zie het als een diepe compatibele verbinding met een ander persoon.", en: "I see it as a deep compatible connection with another person." },
    "27b": { nl: "Ik ervaar het als herkenning - iemand ontmoeten die mijn ziel spiegelt.", en: "I experience it as recognition - meeting someone who mirrors my soul." },
    "27c": { nl: "Ik begrijp het als de vereniging van FM en MF - voltooiing van polariteiten.", en: "I understand it as the union of FM and MF - completion of polarities." },
    "27d": { nl: "Ik ben de zielsverwant - de geliefde is mijn eigen Zelf dat zichzelf herkent.", en: "I am the soulmate - the beloved is my own Self recognizing itself." },
    "28a": { nl: "Ik accepteer de dood als natuurlijk einde - wat telt is hoe ik leef.", en: "I accept death as natural ending - what matters is how I live." },
    "28b": { nl: "Ik geloof in voortzetting - bewustzijn blijft bestaan na de fysieke dood.", en: "I believe in continuation - consciousness persists beyond physical death." },
    "28c": { nl: "Ik zie de dood als transformatie - de reis van de ziel gaat verder.", en: "I see death as transformation - the soul's journey continues." },
    "28d": { nl: "Ik ben dat wat nooit sterft - geboorte en dood zijn bewegingen in wat ik eeuwig ben.", en: "I am that which never dies - birth and death are movements in what I eternally am." },
    "29a": { nl: "Ik observeer ze als complementaire principes - yang en yin.", en: "I observe them as complementary principles - yang and yin." },
    "29b": { nl: "Ik voel ze als energieën in mij - uitbreidend en samentrekkend.", en: "I feel them as energies within me - expanding and contracting." },
    "29c": { nl: "Ik werk er bewust mee - ik leer deze krachten in evenwicht te brengen.", en: "I work with them consciously - learning to balance these forces." },
    "29d": { nl: "Ik ben beide krachten - de schijnbare dualiteit lost op in mijn wezen.", en: "I am both forces - the apparent duality resolves in my being." },
    "30a": { nl: "Een gevoel van vredig aanwezigheid - kalm bewustzijn zonder inhoud.", en: "A sense of peaceful presence - calm awareness without content." },
    "30b": { nl: "Uitgestrekte ruimtelijkheid - een open veld van potentieel zonder grenzen.", en: "Vast spaciousness - an open field of potential without boundaries." },
    "30c": { nl: "Zuiver weten - bewustzijn dat zich bewust is van zichzelf.", en: "Pure knowing - awareness aware of itself." },
    "30d": { nl: "Wat overblijft kan niet beschreven worden - woorden wijzen maar vangen nooit.", en: "What remains cannot be described - words point but never capture." }
  },

  // =======================================
  // SHADOW ASPECTS - Dutch translations
  // =======================================
  shadowAspects: {
    "1a": { nl: "Rigiditeit in het aangezicht van verandering", en: "Rigidity in the face of change" },
    "1b": { nl: "Verspreide energie, moeilijkheid om stabiliteit te behouden", en: "Scattered energy, difficulty maintaining stability" },
    "1c": { nl: "Ontkoppeling van lichamelijke wijsheid", en: "Disconnection from bodily wisdom" },
    "1d": { nl: "Spirituele ontwijking van fysieke behoeften", en: "Spiritual bypassing of physical needs" },
    "2a": { nl: "Afwijzing van niet-materiële dimensies", en: "Dismissal of non-material dimensions" },
    "2b": { nl: "Rusteloosheid, onvermogen om bij stilte te zijn", en: "Restlessness, inability to be with stillness" },
    "2c": { nl: "Reductie van mysterie tot slechts patroon", en: "Reduction of mystery to mere pattern" },
    "2d": { nl: "Onthechting van belichaamde realiteit", en: "Detachment from embodied reality" },
    "3a": { nl: "Zwaarte, moeite met lichtheid", en: "Heaviness, difficulty with lightness" },
    "3b": { nl: "Agitatie vermomd als levendigheid", en: "Agitation masked as aliveness" },
    "3c": { nl: "Klinische afstand van belichaamde ervaring", en: "Clinical distance from embodied experience" },
    "3d": { nl: "Angst voor belichaming, dissociatie", en: "Fear of embodiment, dissociation" },
    "4a": { nl: "Fatalisme, geloof in een vast lot", en: "Fatalism, belief in fixed destiny" },
    "4b": { nl: "Ontkenning van biologische beperkingen", en: "Denial of biological constraints" },
    "4c": { nl: "Oversimplificatie van biologische complexiteit", en: "Over-simplification of biological complexity" },
    "4d": { nl: "Spiritueel escapisme van de fysieke realiteit", en: "Spiritual escapism from physical reality" },
    "5a": { nl: "Reductie van voedsel tot louter nut", en: "Reduction of food to mere utility" },
    "5b": { nl: "Impulsief eten, stimulatie zoeken", en: "Impulsive eating, seeking stimulation" },
    "5c": { nl: "Het heilige aspect van voeding missen", en: "Missing the sacred dimension of nourishment" },
    "5d": { nl: "Elitisme over eetgewoonten", en: "Elitism about dietary practices" },
    "6a": { nl: "Stagnatie, weerstand tegen stroming", en: "Stagnation, resistance to flow" },
    "6b": { nl: "Emotionele volatiliteit, instabiliteit", en: "Emotional volatility, instability" },
    "6c": { nl: "Ontkoppeling van emotionele diepte", en: "Disconnection from emotional depth" },
    "6d": { nl: "Spirituele ontwijking van elementenwerk", en: "Spiritual bypass of elemental work" },
    "7a": { nl: "Emotionele onderdrukking door analyse", en: "Emotional suppression through analysis" },
    "7b": { nl: "Emotionele overstroming, verlies van onderscheidingsvermogen", en: "Emotional flooding, loss of discernment" },
    "7c": { nl: "Agressie die kwetsbaarheid maskeert", en: "Aggression masking vulnerability" },
    "7d": { nl: "Spirituele ontwijking van emotionele verwerking", en: "Spiritual bypass of emotional processing" },
    "8a": { nl: "Rigiditeit, ontkoppeling van receptiviteit", en: "Rigidity, disconnection from receptivity" },
    "8b": { nl: "Grenzeloosheid, moeite met grenzen", en: "Boundlessness, difficulty with boundaries" },
    "8c": { nl: "Performatief evenwicht, authentieke expressie onderdrukt", en: "Performative balance, authentic expression suppressed" },
    "8d": { nl: "Voortijdige transcendentie van polariteitswerk", en: "Premature transcendence of polarity work" },
    "9a": { nl: "Verdrongen chaos die expressie zoekt", en: "Repressed chaos seeking expression" },
    "9b": { nl: "Verdrongen autonomie en onafhankelijkheid", en: "Repressed autonomy and independence" },
    "9c": { nl: "Verdrongen zachtheid en receptiviteit", en: "Repressed softness and receptivity" },
    "9d": { nl: "Spirituele superioriteit die onopgeloste wonden maskeert", en: "Spiritual superiority masking unresolved wounds" },
    "10a": { nl: "Uitstellen naar andermans autoriteit", en: "Deferring to others' authority" },
    "10b": { nl: "Enthousiasme zonder opvolging", en: "Enthusiasm without follow-through" },
    "10c": { nl: "Imitatie in plaats van authentieke expressie", en: "Imitation rather than authentic expression" },
    "10d": { nl: "Spirituele ontwijking van daadwerkelijk ontwikkelingswerk", en: "Spiritual bypass of actual development work" },
    "11a": { nl: "Oververwerking, in het hoofd blijven", en: "Over-processing, staying in the head" },
    "11b": { nl: "Emotionele hertraumatisering", en: "Emotional re-traumatization" },
    "11c": { nl: "Vluchten in symboliek", en: "Escaping into symbolism" },
    "11d": { nl: "Voortijdige oplossing", en: "Premature resolution" },
    "12a": { nl: "Afhankelijkheid van externe voltooiing", en: "Dependency on external completion" },
    "12b": { nl: "Narcistische aantrekking", en: "Narcissistic attraction" },
    "12c": { nl: "Performatieve flexibiliteit", en: "Performative fluidity" },
    "12d": { nl: "Verlies van gezonde grenzen", en: "Loss of healthy boundaries" },
    "13a": { nl: "Afwijzing van diepere betekenis", en: "Dismissal of deeper significance" },
    "13b": { nl: "Esthetische fascinatie zonder integratie", en: "Aesthetic fascination without integration" },
    "13c": { nl: "Reductie van betekenis tot mechanica", en: "Reduction of meaning to mechanics" },
    "13d": { nl: "Identificatie zonder differentiatie", en: "Identification without differentiation" },
    "14a": { nl: "Weerstand tegen uitgebreide perspectieven", en: "Resistance to expanded perspectives" },
    "14b": { nl: "Intellectuele spanning zoeken", en: "Intellectual thrill-seeking" },
    "14c": { nl: "Speculatie zonder gronding", en: "Speculation without grounding" },
    "14d": { nl: "Spirituele ontwijking van conceptueel begrip", en: "Spiritual bypass of conceptual understanding" },
    "15a": { nl: "Dualistische scheiding", en: "Dualistic separation" },
    "15b": { nl: "Vermenselijking van data", en: "Anthropomorphization of data" },
    "15c": { nl: "Filosofische abstractie", en: "Philosophical abstraction" },
    "15d": { nl: "Non-duale ontwijking van praktische onderscheidingen", en: "Non-dual bypass of practical distinctions" },
    "16a": { nl: "Het transcendente aspect missen", en: "Missing the transcendent dimension" },
    "16b": { nl: "Sentimentele gehechtheid aan vorm", en: "Sentimental attachment to form" },
    "16c": { nl: "Reïficatie van abstracties", en: "Reification of abstractions" },
    "16d": { nl: "Mystieke inflatie", en: "Mystical inflation" },
    "17a": { nl: "Intellectuele afstand van belichaamde wijsheid", en: "Intellectual distance from embodied wisdom" },
    "17b": { nl: "Bevestigingsbias", en: "Confirmation bias" },
    "17c": { nl: "Eindeloze verkenning zonder integratie", en: "Endless exploration without integration" },
    "17d": { nl: "Oplossing van gezonde ego-grenzen", en: "Dissolution of healthy ego boundaries" },
    "18a": { nl: "Reductie van verwondering tot mechanisme", en: "Reduction of wonder to mechanism" },
    "18b": { nl: "Romantisering zonder begrip", en: "Romanticization without understanding" },
    "18c": { nl: "Over-identificatie met biologische processen", en: "Over-identification with biological processes" },
    "18d": { nl: "Verlies van stabiele identiteitsreferentie", en: "Loss of stable identity reference" },
    "19a": { nl: "Wetenschappelijk reductionisme", en: "Scientific reductionism" },
    "19b": { nl: "Toeschrijvingsbias", en: "Attribution bias" },
    "19c": { nl: "Bijgelovige patroonherkenning", en: "Superstitious pattern-matching" },
    "19d": { nl: "Kosmisch narcisme", en: "Cosmic narcissism" },
    "20a": { nl: "Passief uithoudingsvermogen", en: "Passive endurance" },
    "20b": { nl: "Schaduwontkenning", en: "Shadow denial" },
    "20c": { nl: "Duisternis zoeken", en: "Darkness seeking" },
    "20d": { nl: "Voortijdige transcendentie", en: "Premature transcendence" },
    "21a": { nl: "Domesticatie van het heilige", en: "Domestication of the sacred" },
    "21b": { nl: "Romantische projectie", en: "Romantic projection" },
    "21c": { nl: "Werken op concept in plaats van realiteit", en: "Working at concept rather than reality" },
    "21d": { nl: "Integratie voortijdig claimen", en: "Claiming integration prematurely" },
    "22a": { nl: "Onbeduidendheidscomplex", en: "Insignificance complex" },
    "22b": { nl: "Kosmische inflatie", en: "Cosmic inflation" },
    "22c": { nl: "Antropisch principe bias", en: "Anthropic principle bias" },
    "22d": { nl: "Verlies van persoonlijke verantwoordelijkheid", en: "Loss of personal responsibility" },
    "23a": { nl: "Intellectuele oplossing zonder geleefde ervaring", en: "Intellectual resolution without lived experience" },
    "23b": { nl: "Willekeur verwarren met vrijheid", en: "Confusing randomness with freedom" },
    "23c": { nl: "Toekenning van handeling aan abstractie", en: "Attribution of agency to abstraction" },
    "23d": { nl: "Non-duale ontwijking van ethische verantwoordelijkheid", en: "Non-dual bypass of ethical responsibility" },
    "24a": { nl: "Reductie van het heilige tot psychologie", en: "Reduction of the sacred to psychology" },
    "24b": { nl: "Esthetisering zonder transformatie", en: "Aestheticization without transformation" },
    "24c": { nl: "Toekomstgericht, het heden missend", en: "Future-oriented, missing the present" },
    "24d": { nl: "Voltooiing voortijdig claimen", en: "Claiming completion prematurely" },
    "25a": { nl: "Dualistische scheiding gehandhaafd", en: "Dualistic separation maintained" },
    "25b": { nl: "Piekervaring zoeken", en: "Seeking peak experiences" },
    "25c": { nl: "Conceptueel begrip zonder direct weten", en: "Conceptual understanding without direct knowing" },
    "25d": { nl: "Voortijdige non-duale claim", en: "Premature non-dual claim" },
    "26a": { nl: "Intellectuele waardering zonder belichaming", en: "Intellectual appreciation without embodiment" },
    "26b": { nl: "Vitalistische projectie", en: "Vitalistic projection" },
    "26c": { nl: "Sentimentele reductie van het absolute", en: "Sentimental reduction of the absolute" },
    "26d": { nl: "Solipsistische non-dualiteit", en: "Solipsistic non-duality" },
    "27a": { nl: "Externalisatie van de innerlijke geliefde", en: "Externalization of the inner beloved" },
    "27b": { nl: "Romantische projectie", en: "Romantic projection" },
    "27c": { nl: "Conceptualisering van het mysterie", en: "Conceptualization of the mystery" },
    "27d": { nl: "Spirituele ontwijking van relatiewerk", en: "Spiritual bypass of relationship work" },
    "28a": { nl: "Existentiële vermijding", en: "Existential avoidance" },
    "28b": { nl: "Geloof zonder direct weten", en: "Belief without direct knowing" },
    "28c": { nl: "Toekomstgericht, het huidige mysterie missend", en: "Future-oriented, missing present mystery" },
    "28d": { nl: "Spirituele ontwijking van sterfelijkheidsbewustzijn", en: "Spiritual bypass of mortality awareness" },
    "29a": { nl: "Observationele afstand", en: "Observational distance" },
    "29b": { nl: "Identificatie met energetische toestanden", en: "Identification with energetic states" },
    "29c": { nl: "Werken aan in plaats van als de krachten", en: "Working on rather than as the forces" },
    "29d": { nl: "Oplossing voortijdig claimen", en: "Claiming resolution prematurely" },
    "30a": { nl: "Subtiel object overblijvend", en: "Subtle object remaining" },
    "30b": { nl: "Subtiele ruimtelijkheid als object", en: "Subtle spaciousness as object" },
    "30c": { nl: "Weten als subtiel object", en: "Knowing as subtle object" },
    "30d": { nl: "Mysterie als laatste toevluchtsoord", en: "Mystery as final refuge" }
  },

  // =======================================
  // DOMAIN NAMES
  // =======================================
  domains: {
    biochemistry: { nl: "biochemie", en: "biochemistry" },
    physics: { nl: "fysica", en: "physics" },
    psychology: { nl: "psychologie", en: "psychology" },
    alchemy: { nl: "alchemie", en: "alchemy" },
    geometry: { nl: "geometrie", en: "geometry" },
    astrology: { nl: "astrologie", en: "astrology" },
    astronomy: { nl: "astronomie", en: "astronomy" },
    religion: { nl: "religie", en: "religion" }
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
      nl: "SWIPE ↓ = SYNCHRONISATIE",
      en: "SWIPE ↓ = SYNCHRONISATION"
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
      placeholder: { nl: "Authenticatie komt binnenkort...", en: "Authentication coming soon..." },
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
  }
};

export default translations;
