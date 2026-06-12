// Symbol definitions from Universal Constants project
export const SYMBOLS = [
  {
    id: 'reality',
    dutchName: 'Realiteit',
    englishName: 'Reality',
    meaning: 'Creatie / Visie / Waarde',
    shape: 'circle',
    description: 'The absolute wholeness. The container of all potential.',
    color: '#00ff41'
  },
  {
    id: 'consciousness',
    dutchName: 'Bewustzijn',
    englishName: 'Consciousness',
    meaning: 'Evolutie / Sensatie / Entropie',
    shape: 'wave',
    description: 'The vibration that observes reality. Moves from formless to form.',
    color: '#39ff14'
  },
  {
    id: 'space',
    dutchName: 'Ruimte',
    englishName: 'Space',
    meaning: 'Realisatie / Licht / Innovatie',
    shape: 'triangle',
    description: 'Geometric description of self-knowledge within authentic realization.',
    color: '#00ff65'
  },
  {
    id: 'time',
    dutchName: 'Tijd',
    englishName: 'Time',
    meaning: 'Evaluatie / Focus / Intuïtie',
    shape: 'plus',
    description: 'The intersection of being. Focus points in the infinite.',
    color: '#00ff99'
  },
  {
    id: 'relation',
    dutchName: 'Relatie',
    englishName: 'Relation',
    meaning: 'Wijsheid / Roeping / Systeem',
    shape: 'square',
    description: 'Supersymmetry: Connection and cooperation of multiple callings.',
    color: '#33ff77'
  }
];

export const QUOTES = [
  { id: 1, text: "I think therefore I am", category: "Logic" },
  { id: 2, text: "Father please forgive me for these gains I'm about to make", category: "Ambition" },
  { id: 3, text: "Science is a beautiful gift to humanity", category: "Science" },
  { id: 4, text: "Ik geloof dat ik niet geloof... wacht huh?", category: "Faith" },
  { id: 5, text: "Mijn entropie is sterker en eist dus meer realisatie", category: "Entropy" },
];

// Symbol combination insights - different combinations reveal different wisdom
export const SYMBOL_COMBINATIONS = {
  // Single symbols
  'reality': {
    title: 'THE WHOLE',
    insight: 'Reality is the container of all potential. Everything that exists, existed, or will exist emerges from this infinite source.',
    category: 'Foundation'
  },
  'consciousness': {
    title: 'THE OBSERVER',
    insight: 'Consciousness is the vibration that makes reality aware of itself. Without the observer, potential remains unmanifested.',
    category: 'Awareness'
  },
  'space': {
    title: 'THE DIMENSION',
    insight: 'Space provides the geometric framework for experience. It is the canvas upon which consciousness paints reality.',
    category: 'Structure'
  },
  'time': {
    title: 'THE FLOW',
    insight: 'Time is the intersection of moments. Each focus point in the infinite creates the experience of sequence.',
    category: 'Movement'
  },
  'relation': {
    title: 'THE CONNECTION',
    insight: 'Relation creates meaning through connection. Supersymmetry emerges when separate elements cooperate.',
    category: 'Unity'
  },
  // Two symbol combinations
  'reality+consciousness': {
    title: 'MANIFESTATION',
    insight: 'When consciousness meets reality, potential becomes actual. This is the creative force of the universe.',
    category: 'Creation'
  },
  'reality+space': {
    title: 'EXISTENCE',
    insight: 'Reality expressing through space creates the framework for being. The infinite takes form.',
    category: 'Being'
  },
  'reality+time': {
    title: 'ETERNITY',
    insight: 'Reality flowing through time reveals the eternal present. Past and future collapse into now.',
    category: 'Presence'
  },
  'consciousness+space': {
    title: 'PERCEPTION',
    insight: 'Consciousness observing space creates perspective. Each viewpoint reveals different truths.',
    category: 'Vision'
  },
  'consciousness+time': {
    title: 'EXPERIENCE',
    insight: 'Consciousness moving through time generates experience. Memory and anticipation create the story.',
    category: 'Journey'
  },
  'space+time': {
    title: 'DIMENSION',
    insight: 'Space and time interweave to form spacetime. Einstein showed us they are one fabric.',
    category: 'Physics'
  },
  'consciousness+relation': {
    title: 'EMPATHY',
    insight: 'When consciousness connects with relation, we feel others as ourselves. Separation dissolves.',
    category: 'Connection'
  },
  'reality+relation': {
    title: 'NETWORK',
    insight: 'Reality expressing through relation creates the web of existence. All things are connected.',
    category: 'Web'
  },
  'space+relation': {
    title: 'COMMUNITY',
    insight: 'Space shared through relation creates community. Distance becomes connection.',
    category: 'Society'
  },
  'time+relation': {
    title: 'LEGACY',
    insight: 'Time flowing through relation creates legacy. What we connect with outlasts us.',
    category: 'Memory'
  },
  // Three or more symbols
  'reality+consciousness+space': {
    title: 'UNIVERSE',
    insight: 'The trinity of reality, consciousness, and space forms the universe we inhabit. Mind meets matter.',
    category: 'Cosmos'
  },
  'reality+consciousness+time': {
    title: 'EVOLUTION',
    insight: 'Reality, consciousness, and time together drive evolution. The universe becomes aware of itself.',
    category: 'Growth'
  },
  'consciousness+space+time': {
    title: 'HUMAN EXPERIENCE',
    insight: 'We are consciousness moving through space and time. This is the essence of being human.',
    category: 'Life'
  },
  'reality+space+time': {
    title: 'PHYSICS',
    insight: 'Reality manifesting through spacetime is the domain of physics. The laws that govern form.',
    category: 'Science'
  },
  'reality+consciousness+relation': {
    title: 'LOVE',
    insight: 'When reality, consciousness, and relation merge, love emerges. The fundamental force of connection.',
    category: 'Heart'
  },
  'reality+consciousness+space+time': {
    title: 'EXISTENCE ITSELF',
    insight: 'Four fundamental aspects unite: the container, the observer, the canvas, and the flow. Almost complete.',
    category: 'Philosophy'
  },
  'reality+consciousness+space+time+relation': {
    title: 'SUPERSYMMETRY',
    insight: 'All five aspects unified: Reality observed by Consciousness in Space through Time via Relation. The complete formula for existence.',
    category: 'Enlightenment'
  }
};

// Get combination insight based on active symbols
export const getCombinationInsight = (symbols) => {
  if (!symbols || symbols.length === 0) return null;
  
  // Sort symbol IDs alphabetically and join to create a key
  const key = symbols.map(s => s.id).sort().join('+');
  
  // Check for exact match first
  if (SYMBOL_COMBINATIONS[key]) {
    return SYMBOL_COMBINATIONS[key];
  }
  
  // If no exact match, find the best partial match
  const sortedIds = symbols.map(s => s.id).sort();
  
  // Try to find any combination that matches
  for (const [comboKey, value] of Object.entries(SYMBOL_COMBINATIONS)) {
    const comboIds = comboKey.split('+').sort();
    if (comboIds.length === sortedIds.length && 
        comboIds.every((id, i) => id === sortedIds[i])) {
      return value;
    }
  }
  
  // Default fallback for any combination
  return {
    title: 'EMERGENCE',
    insight: `${symbols.length} symbols combine in unique harmony. Each combination reveals hidden truths.`,
    category: 'Mystery'
  };
};

export const NEON_GREEN = '#00ff41';
