// Assessment Data - Plain JavaScript version

export const assessmentSubjects = [
  {
    id: 1, name: "Foundation", title: "BIOCHEMICAL RESONANCE", subtitle: "The Cellular Architecture of Being",
    color: "#22d3ee", layerIndex: 0, fundamental: "Physiological Standards",
    description: "Your biochemical and physiological patterns form the foundation of consciousness.",
    questions: [
      { id: 1, text: "When facing physical stress or illness, what is your body's primary response pattern?", domain: "biochemistry",
        answers: [
          { id: "1a", text: "I maintain steady routines and seek grounded, practical solutions.", value: 1, archetype: "GROUNDED", shadowAspect: "Rigidity in the face of change" },
          { id: "1b", text: "I experience intense energy fluctuations and need dynamic approaches.", value: 2, archetype: "VITALIST", shadowAspect: "Scattered energy, difficulty maintaining stability" },
          { id: "1c", text: "I observe patterns and experiment, treating my body as a system to optimize.", value: 3, archetype: "ARCHITECT", shadowAspect: "Disconnection from bodily wisdom" },
          { id: "1d", text: "I trust in the body's innate intelligence to heal and transform.", value: 4, archetype: "ALCHEMIST", shadowAspect: "Spiritual bypassing of physical needs" }
        ]
      },
      { id: 2, text: "How do you relate to the quantum vacuum fluctuations that constitute matter?", domain: "physics",
        answers: [
          { id: "2a", text: "I accept the scientific reality while focusing on practical aspects.", value: 1, archetype: "GROUNDED", shadowAspect: "Dismissal of non-material dimensions" },
          { id: "2b", text: "I feel energized by the idea that emptiness is full of potential.", value: 2, archetype: "VITALIST", shadowAspect: "Restlessness, inability to be with stillness" },
          { id: "2c", text: "I contemplate the geometric patterns underlying these fluctuations.", value: 3, archetype: "ARCHITECT", shadowAspect: "Reduction of mystery to mere pattern" },
          { id: "2d", text: "I experience this as the void from which all manifestation arises.", value: 4, archetype: "MYSTIC", shadowAspect: "Detachment from embodied reality" }
        ]
      },
      { id: 3, text: "In moments of deep rest, what quality of awareness emerges in your body?", domain: "psychology",
        answers: [
          { id: "3a", text: "A sense of solid presence and groundedness.", value: 1, archetype: "GROUNDED", shadowAspect: "Heaviness, difficulty with lightness" },
          { id: "3b", text: "Vibrant aliveness and tingling energy.", value: 2, archetype: "VITALIST", shadowAspect: "Agitation masked as aliveness" },
          { id: "3c", text: "Clear observation of bodily processes.", value: 3, archetype: "ARCHITECT", shadowAspect: "Clinical distance from embodied experience" },
          { id: "3d", text: "Dissolution of body boundaries - I merge with surrounding space.", value: 4, archetype: "MYSTIC", shadowAspect: "Fear of embodiment, dissociation" }
        ]
      },
      { id: 4, text: "How do you understand the relationship between your DNA and conscious experience?", domain: "biochemistry",
        answers: [
          { id: "4a", text: "DNA provides the biological blueprint I work with.", value: 1, archetype: "GROUNDED", shadowAspect: "Fatalism, belief in fixed destiny" },
          { id: "4b", text: "My genes are a starting point, not a destiny.", value: 2, archetype: "VITALIST", shadowAspect: "Denial of biological constraints" },
          { id: "4c", text: "I see DNA as information storage that can be reprogrammed.", value: 3, archetype: "ARCHITECT", shadowAspect: "Over-simplification of biological complexity" },
          { id: "4d", text: "DNA is the physical echo of soul-level choices.", value: 4, archetype: "MYSTIC", shadowAspect: "Spiritual escapism from physical reality" }
        ]
      },
      { id: 5, text: "When you eat, how do you experience the transformation of matter into consciousness?", domain: "alchemy",
        answers: [
          { id: "5a", text: "I appreciate nutrition as fuel for my physical wellbeing.", value: 1, archetype: "GROUNDED", shadowAspect: "Reduction of food to mere utility" },
          { id: "5b", text: "I experience eating as energy exchange.", value: 2, archetype: "VITALIST", shadowAspect: "Impulsive eating, seeking stimulation" },
          { id: "5c", text: "I'm fascinated by the biochemical cascades.", value: 3, archetype: "ARCHITECT", shadowAspect: "Missing the sacred dimension of nourishment" },
          { id: "5d", text: "Each meal is alchemical transmutation.", value: 4, archetype: "ALCHEMIST", shadowAspect: "Elitism about dietary practices" }
        ]
      },
      { id: 6, text: "What is your relationship to the four classical elements in your body?", domain: "alchemy",
        answers: [
          { id: "6a", text: "I feel most connected to Earth - the solid structure.", value: 1, archetype: "GROUNDED", shadowAspect: "Stagnation, resistance to flow" },
          { id: "6b", text: "I resonate with Water and Fire - the flowing fluids and metabolic heat.", value: 2, archetype: "VITALIST", shadowAspect: "Emotional volatility, instability" },
          { id: "6c", text: "I value Air - the breath that connects inner and outer.", value: 3, archetype: "ARCHITECT", shadowAspect: "Disconnection from emotional depth" },
          { id: "6d", text: "I experience all elements in dynamic balance.", value: 4, archetype: "SAGE", shadowAspect: "Spiritual bypass of elemental work" }
        ]
      }
    ]
  },
  {
    id: 2, name: "Emotional", title: "SHADOW INTEGRATION", subtitle: "The Alchemy of Feeling",
    color: "#a855f7", layerIndex: 1, fundamental: "Self-Esteem, Character",
    description: "The emotional layer holds your psychological patterns and shadow aspects.",
    questions: [
      { id: 7, text: "When triggered emotionally, what pattern typically emerges?", domain: "psychology",
        answers: [
          { id: "7a", text: "I withdraw and analyze the trigger before responding.", value: 1, archetype: "ARCHITECT", shadowAspect: "Emotional suppression through analysis" },
          { id: "7b", text: "I feel the emotion fully, allowing it to move through me.", value: 2, archetype: "EMPATH", shadowAspect: "Emotional flooding, loss of discernment" },
          { id: "7c", text: "I confront the situation directly using the energy as fuel.", value: 3, archetype: "WARRIOR", shadowAspect: "Aggression masking vulnerability" },
          { id: "7d", text: "I witness the trigger as energy patterns, allowing transformation.", value: 4, archetype: "ALCHEMIST", shadowAspect: "Spiritual bypass of emotional processing" }
        ]
      },
      { id: 8, text: "In the FM/MF dynamic, where do you find your natural equilibrium?", domain: "psychology",
        answers: [
          { id: "8a", text: "I lean toward the Masculine pole - structure and direction.", value: 1, archetype: "WARRIOR", shadowAspect: "Rigidity, disconnection from receptivity" },
          { id: "8b", text: "I lean toward the Feminine pole - flow and receptivity.", value: 2, archetype: "EMPATH", shadowAspect: "Boundlessness, difficulty with boundaries" },
          { id: "8c", text: "I consciously balance both based on context and need.", value: 3, archetype: "ALCHEMIST", shadowAspect: "Performative balance, authentic expression suppressed" },
          { id: "8d", text: "I experience FM and MF as a unified field.", value: 4, archetype: "SAGE", shadowAspect: "Premature transcendence of polarity work" }
        ]
      },
      { id: 9, text: "What quality do you most judge in others, and what does this reveal?", domain: "psychology",
        answers: [
          { id: "9a", text: "I judge chaos and disorganization - revealing my fear of losing control.", value: 1, archetype: "ARCHITECT", shadowAspect: "Repressed chaos seeking expression" },
          { id: "9b", text: "I judge coldness and emotional distance - revealing my fear of abandonment.", value: 2, archetype: "EMPATH", shadowAspect: "Repressed autonomy and independence" },
          { id: "9c", text: "I judge weakness and indecision - revealing my fear of vulnerability.", value: 3, archetype: "WARRIOR", shadowAspect: "Repressed softness and receptivity" },
          { id: "9d", text: "I recognize all judgment as self-judgment projected outward.", value: 4, archetype: "SAGE", shadowAspect: "Spiritual superiority masking unresolved wounds" }
        ]
      },
      { id: 10, text: "How do you relate to your 'golden shadow' - unclaimed greatness?", domain: "psychology",
        answers: [
          { id: "10a", text: "I admire excellence and work to develop similar capacities.", value: 1, archetype: "GROUNDED", shadowAspect: "Deferring to others' authority" },
          { id: "10b", text: "I feel inspired, recognizing that what I admire is within me.", value: 2, archetype: "VITALIST", shadowAspect: "Enthusiasm without follow-through" },
          { id: "10c", text: "I study those who embody what I seek, reverse-engineering their methods.", value: 3, archetype: "ARCHITECT", shadowAspect: "Imitation rather than authentic expression" },
          { id: "10d", text: "I see all greatness as reflections of the One Self.", value: 4, archetype: "SAGE", shadowAspect: "Spiritual bypass of actual development work" }
        ]
      },
      { id: 11, text: "When experiencing shadow work, what emerges from your subconscious?", domain: "psychology",
        answers: [
          { id: "11a", text: "Repressed memories and patterns I systematically process.", value: 1, archetype: "ARCHITECT", shadowAspect: "Over-processing, staying in the head" },
          { id: "11b", text: "Intense emotional releases that have been waiting to be felt.", value: 2, archetype: "EMPATH", shadowAspect: "Emotional re-traumatization" },
          { id: "11c", text: "Archetypal imagery and symbols guiding transformation.", value: 3, archetype: "MYSTIC", shadowAspect: "Escaping into symbolism" },
          { id: "11d", text: "A profound sense of wholeness emerging.", value: 4, archetype: "ALCHEMIST", shadowAspect: "Premature resolution" }
        ]
      },
      { id: 12, text: "In intimate relationships, how do your FM/MF patterns create dynamics?", domain: "psychology",
        answers: [
          { id: "12a", text: "I'm attracted to complementary energies seeking completion.", value: 1, archetype: "GROUNDED", shadowAspect: "Dependency on external completion" },
          { id: "12b", text: "I seek partners who mirror my energy creating intense resonance.", value: 2, archetype: "VITALIST", shadowAspect: "Narcissistic attraction" },
          { id: "12c", text: "I consciously dance between poles, sometimes leading, sometimes following.", value: 3, archetype: "ALCHEMIST", shadowAspect: "Performative fluidity" },
          { id: "12d", text: "I recognize my partner as another aspect of myself.", value: 4, archetype: "LOVER", shadowAspect: "Loss of healthy boundaries" }
        ]
      }
    ]
  },
  {
    id: 3, name: "Mental", title: "GEOMETRIC COGNITION", subtitle: "The Architecture of Thought",
    color: "#f472b6", layerIndex: 2, fundamental: "Purpose, Passion, Vision",
    description: "The mental layer processes reality through patterns, structures, and logical frameworks.",
    questions: [
      { id: 13, text: "How do you experience the geometric patterns underlying physical reality?", domain: "geometry",
        answers: [
          { id: "13a", text: "I appreciate mathematical elegance but focus on practical applications.", value: 1, archetype: "GROUNDED", shadowAspect: "Dismissal of deeper significance" },
          { id: "13b", text: "I feel energized by sacred geometry resonating with something deep within.", value: 2, archetype: "MYSTIC", shadowAspect: "Aesthetic fascination without integration" },
          { id: "13c", text: "I study patterns systematically seeking computational properties.", value: 3, archetype: "ARCHITECT", shadowAspect: "Reduction of meaning to mechanics" },
          { id: "13d", text: "I experience myself as these patterns flowing through thoughts and cosmos.", value: 4, archetype: "SAGE", shadowAspect: "Identification without differentiation" }
        ]
      },
      { id: 14, text: "What is your relationship to the concept of 'dimension zero' fields?", domain: "physics",
        answers: [
          { id: "14a", text: "I accept the mathematical concept while staying grounded in 3D experience.", value: 1, archetype: "GROUNDED", shadowAspect: "Resistance to expanded perspectives" },
          { id: "14b", text: "I'm fascinated by how something simple generates all complexity.", value: 2, archetype: "EXPLORER", shadowAspect: "Intellectual thrill-seeking" },
          { id: "14c", text: "I contemplate how dimension zero relates to consciousness.", value: 3, archetype: "MYSTIC", shadowAspect: "Speculation without grounding" },
          { id: "14d", text: "I experience dimension zero directly in meditation.", value: 4, archetype: "SAGE", shadowAspect: "Spiritual bypass of conceptual understanding" }
        ]
      },
      { id: 15, text: "How do you understand the relationship between information and consciousness?", domain: "physics",
        answers: [
          { id: "15a", text: "Information is data that consciousness processes - they are distinct.", value: 1, archetype: "ARCHITECT", shadowAspect: "Dualistic separation" },
          { id: "15b", text: "Information is alive - it carries meaning through conscious engagement.", value: 2, archetype: "VITALIST", shadowAspect: "Anthropomorphization of data" },
          { id: "15c", text: "Consciousness is fundamental, information is its expression.", value: 3, archetype: "MYSTIC", shadowAspect: "Philosophical abstraction" },
          { id: "15d", text: "Information and consciousness are one - the distinction is illusion.", value: 4, archetype: "SAGE", shadowAspect: "Non-dual bypass of practical distinctions" }
        ]
      },
      { id: 16, text: "When contemplating the Platonic solids, what quality of knowing emerges?", domain: "geometry",
        answers: [
          { id: "16a", text: "I appreciate their mathematical properties and structural applications.", value: 1, archetype: "ARCHITECT", shadowAspect: "Missing the transcendent dimension" },
          { id: "16b", text: "I feel their aesthetic beauty and symbolic resonance.", value: 2, archetype: "EMPATH", shadowAspect: "Sentimental attachment to form" },
          { id: "16c", text: "I recognize them as archetypal forms - building blocks of reality.", value: 3, archetype: "MYSTIC", shadowAspect: "Reification of abstractions" },
          { id: "16d", text: "I experience them as living presences - meditations on cosmic order.", value: 4, archetype: "SAGE", shadowAspect: "Mystical inflation" }
        ]
      },
      { id: 17, text: "How do you relate to the concept of 'basal cognition' - intelligence at cellular levels?", domain: "physics",
        answers: [
          { id: "17a", text: "I find it scientifically fascinating - life processes information at all scales.", value: 1, archetype: "ARCHITECT", shadowAspect: "Intellectual distance from embodied wisdom" },
          { id: "17b", text: "I feel validated - I've always sensed intelligence in my body's processes.", value: 2, archetype: "EMPATH", shadowAspect: "Confirmation bias" },
          { id: "17c", text: "I explore how this relates to morphogenesis - form following intelligent pattern.", value: 3, archetype: "EXPLORER", shadowAspect: "Endless exploration without integration" },
          { id: "17d", text: "I commune with this intelligence - my body is a community of conscious beings.", value: 4, archetype: "SAGE", shadowAspect: "Dissolution of healthy ego boundaries" }
        ]
      },
      { id: 18, text: "What is your experience of the 'self-improvising memory' concept?", domain: "physics",
        answers: [
          { id: "18a", text: "I understand it as biological systems learning and adapting.", value: 1, archetype: "ARCHITECT", shadowAspect: "Reduction of wonder to mechanism" },
          { id: "18b", text: "I'm inspired by life's creativity - it doesn't just follow scripts.", value: 2, archetype: "VITALIST", shadowAspect: "Romanticization without understanding" },
          { id: "18c", text: "I see parallels with how my own identity evolves.", value: 3, archetype: "ALCHEMIST", shadowAspect: "Over-identification with biological processes" },
          { id: "18d", text: "I experience memory itself as alive - each recollection is new creation.", value: 4, archetype: "SAGE", shadowAspect: "Loss of stable identity reference" }
        ]
      }
    ]
  },
  {
    id: 4, name: "Spiritual", title: "COSMIC RESONANCE", subtitle: "The Celestial Dance of Soul",
    color: "#fbbf24", layerIndex: 3, fundamental: "Self-actualization, Transformation",
    description: "The spiritual layer connects individual consciousness with cosmic patterns.",
    questions: [
      { id: 19, text: "How do you experience the influence of celestial bodies on your consciousness?", domain: "astrology",
        answers: [
          { id: "19a", text: "I acknowledge gravitational influences while maintaining skepticism.", value: 1, archetype: "ARCHITECT", shadowAspect: "Scientific reductionism" },
          { id: "19b", text: "I feel lunar cycles affecting my emotions and solar activity influencing energy.", value: 2, archetype: "EMPATH", shadowAspect: "Attribution bias" },
          { id: "19c", text: "I study astrological correspondences recognizing patterns beyond mechanism.", value: 3, archetype: "MYSTIC", shadowAspect: "Superstitious pattern-matching" },
          { id: "19d", text: "I am the stars experiencing themselves.", value: 4, archetype: "SAGE", shadowAspect: "Cosmic narcissism" }
        ]
      },
      { id: 20, text: "What is your relationship to the alchemical process of nigredo (blackening)?", domain: "alchemy",
        answers: [
          { id: "20a", text: "I understand it as necessary breakdown before renewal.", value: 1, archetype: "GROUNDED", shadowAspect: "Passive endurance" },
          { id: "20b", text: "I resist the darkness, fighting to maintain positivity.", value: 2, archetype: "WARRIOR", shadowAspect: "Shadow denial" },
          { id: "20c", text: "I consciously enter the darkness knowing it contains transformation.", value: 3, archetype: "ALCHEMIST", shadowAspect: "Darkness seeking" },
          { id: "20d", text: "I am the darkness and the light - nigredo is what I am.", value: 4, archetype: "SAGE", shadowAspect: "Premature transcendence" }
        ]
      },
      { id: 21, text: "How do you understand the alchemical marriage (coniunctio) of opposites?", domain: "alchemy",
        answers: [
          { id: "21a", text: "I see it as psychological integration of strengths and weaknesses.", value: 1, archetype: "GROUNDED", shadowAspect: "Domestication of the sacred" },
          { id: "21b", text: "I experience it as intense attraction between complementary energies.", value: 2, archetype: "LOVER", shadowAspect: "Romantic projection" },
          { id: "21c", text: "I work consciously with polarity - solar/lunar, active/receptive.", value: 3, archetype: "ALCHEMIST", shadowAspect: "Working at concept rather than reality" },
          { id: "21d", text: "I am the marriage - the opposites unite in my being.", value: 4, archetype: "SAGE", shadowAspect: "Claiming integration prematurely" }
        ]
      },
      { id: 22, text: "What is your experience of astronomical scales - the vastness of space and time?", domain: "astronomy",
        answers: [
          { id: "22a", text: "I find it humbling - my concerns are small in cosmic perspective.", value: 1, archetype: "GROUNDED", shadowAspect: "Insignificance complex" },
          { id: "22b", text: "I feel expanded - my consciousness touches the edges of the universe.", value: 2, archetype: "MYSTIC", shadowAspect: "Cosmic inflation" },
          { id: "22c", text: "I contemplate the fine-tuning allowing our existence.", value: 3, archetype: "ARCHITECT", shadowAspect: "Anthropic principle bias" },
          { id: "22d", text: "I am the universe aware of itself.", value: 4, archetype: "SAGE", shadowAspect: "Loss of personal responsibility" }
        ]
      },
      { id: 23, text: "How do you relate to the concept of 'free will' in a quantum universe?", domain: "astronomy",
        answers: [
          { id: "23a", text: "I believe in compatibilism - free will and determinism coexist.", value: 1, archetype: "ARCHITECT", shadowAspect: "Intellectual resolution without lived experience" },
          { id: "23b", text: "I feel quantum indeterminacy as freedom - the future is open.", value: 2, archetype: "VITALIST", shadowAspect: "Confusing randomness with freedom" },
          { id: "23c", text: "I see free will as the universe choosing through me.", value: 3, archetype: "MYSTIC", shadowAspect: "Attribution of agency to abstraction" },
          { id: "23d", text: "I am the freedom that was never bound.", value: 4, archetype: "SAGE", shadowAspect: "Non-dual bypass of ethical responsibility" }
        ]
      },
      { id: 24, text: "What is your relationship to the 'great work' (magnum opus) of alchemy?", domain: "alchemy",
        answers: [
          { id: "24a", text: "I see it as psychological development.", value: 1, archetype: "GROUNDED", shadowAspect: "Reduction of the sacred to psychology" },
          { id: "24b", text: "I pursue it as creative expression - transforming base material into art.", value: 2, archetype: "ALCHEMIST", shadowAspect: "Aestheticization without transformation" },
          { id: "24c", text: "I experience it as spiritual evolution across lifetimes.", value: 3, archetype: "MYSTIC", shadowAspect: "Future-oriented, missing the present" },
          { id: "24d", text: "I am the great work - transformation is what I am.", value: 4, archetype: "SAGE", shadowAspect: "Claiming completion prematurely" }
        ]
      }
    ]
  },
  {
    id: 5, name: "Unity", title: "CONSCIOUSNESS ITSELF", subtitle: "The Non-Dual Ground of Being",
    color: "#f97316", layerIndex: 4, fundamental: "Intimacy, Community",
    description: "The unity layer represents the apex - where individual consciousness recognizes itself as the One.",
    questions: [
      { id: 25, text: "How do you understand the relationship between individual and universal consciousness?", domain: "religion",
        answers: [
          { id: "25a", text: "I maintain my individual identity while feeling connected to something greater.", value: 1, archetype: "GROUNDED", shadowAspect: "Dualistic separation maintained" },
          { id: "25b", text: "I experience moments of expansion where boundaries dissolve.", value: 2, archetype: "MYSTIC", shadowAspect: "Seeking peak experiences" },
          { id: "25c", text: "I understand them as waves and ocean - distinct in form, one in substance.", value: 3, archetype: "SAGE", shadowAspect: "Conceptual understanding without direct knowing" },
          { id: "25d", text: "There is only Consciousness - the individual is a temporary modulation.", value: 4, archetype: "SAGE", shadowAspect: "Premature non-dual claim" }
        ]
      },
      { id: 26, text: "What is your experience of 'manna' - the one substance manifesting as diversity?", domain: "religion",
        answers: [
          { id: "26a", text: "I appreciate the concept as a unifying principle behind diversity.", value: 1, archetype: "ARCHITECT", shadowAspect: "Intellectual appreciation without embodiment" },
          { id: "26b", text: "I feel the life-force running through all things.", value: 2, archetype: "VITALIST", shadowAspect: "Vitalistic projection" },
          { id: "26c", text: "I experience it as love - the single substance relating to itself as other.", value: 3, archetype: "LOVER", shadowAspect: "Sentimental reduction of the absolute" },
          { id: "26d", text: "I am the manna - there is nothing else to experience.", value: 4, archetype: "SAGE", shadowAspect: "Solipsistic non-duality" }
        ]
      },
      { id: 27, text: "How do you relate to the concept of 'soulmate' in the Cells within Cells diagram?", domain: "religion",
        answers: [
          { id: "27a", text: "I see it as a deep compatible connection with another person.", value: 1, archetype: "GROUNDED", shadowAspect: "Externalization of the inner beloved" },
          { id: "27b", text: "I experience it as recognition - meeting someone who mirrors my soul.", value: 2, archetype: "LOVER", shadowAspect: "Romantic projection" },
          { id: "27c", text: "I understand it as the union of FM and MF - completion of polarities.", value: 3, archetype: "ALCHEMIST", shadowAspect: "Conceptualization of the mystery" },
          { id: "27d", text: "I am the soulmate - the beloved is my own Self recognizing itself.", value: 4, archetype: "SAGE", shadowAspect: "Spiritual bypass of relationship work" }
        ]
      },
      { id: 28, text: "What is your relationship to death and the continuity of consciousness?", domain: "religion",
        answers: [
          { id: "28a", text: "I accept death as natural ending - what matters is how I live.", value: 1, archetype: "GROUNDED", shadowAspect: "Existential avoidance" },
          { id: "28b", text: "I believe in continuation - consciousness persists beyond physical death.", value: 2, archetype: "MYSTIC", shadowAspect: "Belief without direct knowing" },
          { id: "28c", text: "I see death as transformation - the soul's journey continues.", value: 3, archetype: "ALCHEMIST", shadowAspect: "Future-oriented, missing present mystery" },
          { id: "28d", text: "I am that which never dies - birth and death are movements in what I eternally am.", value: 4, archetype: "SAGE", shadowAspect: "Spiritual bypass of mortality awareness" }
        ]
      },
      { id: 29, text: "How do you experience the 'two forces' - the fundamental polarity?", domain: "religion",
        answers: [
          { id: "29a", text: "I observe them as complementary principles - yang and yin.", value: 1, archetype: "ARCHITECT", shadowAspect: "Observational distance" },
          { id: "29b", text: "I feel them as energies within me - expanding and contracting.", value: 2, archetype: "EMPATH", shadowAspect: "Identification with energetic states" },
          { id: "29c", text: "I work with them consciously - learning to balance these forces.", value: 3, archetype: "ALCHEMIST", shadowAspect: "Working on rather than as the forces" },
          { id: "29d", text: "I am both forces - the apparent duality resolves in my being.", value: 4, archetype: "SAGE", shadowAspect: "Claiming resolution prematurely" }
        ]
      },
      { id: 30, text: "In your deepest meditation, what remains when all objects of awareness fall away?", domain: "religion",
        answers: [
          { id: "30a", text: "A sense of peaceful presence - calm awareness without content.", value: 1, archetype: "GROUNDED", shadowAspect: "Subtle object remaining" },
          { id: "30b", text: "Vast spaciousness - an open field of potential without boundaries.", value: 2, archetype: "MYSTIC", shadowAspect: "Subtle spaciousness as object" },
          { id: "30c", text: "Pure knowing - awareness aware of itself.", value: 3, archetype: "SAGE", shadowAspect: "Knowing as subtle object" },
          { id: "30d", text: "What remains cannot be described - words point but never capture.", value: 4, archetype: "SAGE", shadowAspect: "Mystery as final refuge" }
        ]
      }
    ]
  }
];
