/**
 * Archetype Definitions — Master Index
 * 
 * Contains all 12 archetypes organized in two sets:
 *   Set A (Odd questions):  Sage, Hero, Lover, Artist, Ruler, Innocent
 *   Set B (Even questions): Explorer, Outlaw, Caregiver, Magician, Judge, Trickster
 *
 * 6 Functional Groups (Complementary Pairs for Harmony Bonus):
 *   Wisdom:     Sage (0)     + Explorer (6)    — Waarheidsvinding
 *   Action:     Hero (1)     + Outlaw (7)      — Transformatie door Actie
 *   Relational: Lover (2)    + Caregiver (8)   — Relatie & Verbinding
 *   Creative:   Artist (3)   + Magician (9)    — Manifestatie & Creatie
 *   Ruling:     Ruler (4)    + Judge (10)      — Autoriteit & Structuur
 *   Spirit:     Innocent (5) + Trickster (11)  — Eerlijkheid & Perspectief
 *
 * Shadow Pairs (Psychological Tension / Integration):
 *   Sage ↔ Trickster    — Ernst vs. Absurditeit
 *   Ruler ↔ Outlaw      — Orde vs. Chaos
 *   Hero ↔ Caregiver    — Kracht vs. Kwetsbaarheid
 *   Innocent ↔ Explorer — Veiligheid vs. Risico
 *   Artist ↔ Judge      — Expressie vs. Evaluatie
 *   Magician ↔ Lover    — Transformatie vs. Acceptatie
 */

export { ARCHETYPE_SCHEMA } from './archetypeSchema';

/**
 * Complete archetype definitions for scoring and result display.
 * Each archetype includes:
 *   - group: Functional group (determines Harmony Bonus pairing)
 *   - complementaryPartner: Same-group partner (+69 Harmony Bonus)
 *   - shadowPartner: Psychological tension/integration partner
 *   - motivation, positive, shadow: Jungian profile dimensions
 *   - traits: Which radar traits this archetype boosts
 */
export const ARCHETYPES = {
  // ═══════ SET A — Odd Questions ═══════

  SAGE: {
    key: 'SAGE',
    index: 0,
    set: 'A',
    group: 'Wisdom',
    name: 'De Wijze',
    nameEn: 'The Sage',
    motivation: 'Waarheid, begrip, onthechting',
    positive: 'Helderheid, mentorschap, diep inzicht',
    description: 'Analytisch, reflectief en zoekend naar diepere waarheid. De Sage zoekt de waarheid intern via logica en inzicht om de wereld te begrijpen en te navigeren.',
    descriptionEn: 'Analytical, reflective and seeking deeper truth. The Sage seeks truth internally through logic and insight to understand and navigate the world.',
    shadow: 'Dogmatisme, emotionele kilheid, verlamming door overanalyse',
    complementaryPartner: 'EXPLORER',
    shadowPartner: 'TRICKSTER',
    complementaryAxis: 'Waarheidsvinding: De Sage zoekt de waarheid intern via logica; de Explorer zoekt de waarheid extern door grenzen te verleggen.',
    shadowTension: 'Ernst vs. Absurditeit: De Sage neemt de wereld te serieus; de Trickster vult de schaduw met relativering en chaos.',
    element: 'Lucht',
    color: '#3b82f6',
    traits: ['Bewustzijn', 'Logica', 'Reflectie'],
    imageUrl: 'https://picsum.photos/seed/gfl-sage/400/400',
  },
  HERO: {
    key: 'HERO',
    index: 1,
    set: 'A',
    group: 'Action',
    name: 'De Held',
    nameEn: 'The Hero',
    motivation: 'Meesterschap, moed, overwinning',
    positive: 'Kracht, discipline, bescherming',
    description: 'Moedig, gedisciplineerd en gedreven om te presteren. De Hero verbetert het systeem door kracht en overwint obstakels met wilskracht.',
    descriptionEn: 'Courageous, disciplined and driven to perform. The Hero improves the system through strength and overcomes obstacles through willpower.',
    shadow: 'Arrogantie, agressie, burnout, onvermogen om kwetsbaarheid te tonen',
    complementaryPartner: 'OUTLAW',
    shadowPartner: 'CAREGIVER',
    complementaryAxis: 'Transformatie door Actie: De Hero verbetert het systeem door kracht; de Outlaw breekt het systeem om vrijheid te creëren.',
    shadowTension: 'Kracht vs. Kwetsbaarheid: De Hero wil winnen en presteren; de Caregiver herinnert hem eraan dat zelfopoffering en zorg ook kracht zijn.',
    element: 'Vuur',
    color: '#ef4444',
    traits: ['Actie', 'Veerkracht', 'Geduld'],
    imageUrl: 'https://picsum.photos/seed/gfl-hero/400/400',
  },
  LOVER: {
    key: 'LOVER',
    index: 2,
    set: 'A',
    group: 'Relational',
    name: 'De Minnaar',
    nameEn: 'The Lover',
    motivation: 'Verbinding, intimiteit, schoonheid',
    positive: 'Empathie, passie, eenheid',
    description: 'Diep emotioneel, verbindend en gericht op intimiteit. De Lover zoekt naar diepe versmelting en passie in alle relaties.',
    descriptionEn: 'Deeply emotional, connecting and focused on intimacy. The Lover seeks deep merger and passion in all relationships.',
    shadow: 'Co-afhankelijkheid, jaloezie, verlies van het zelf',
    complementaryPartner: 'CAREGIVER',
    shadowPartner: 'MAGICIAN',
    complementaryAxis: 'Relatie: De Lover zoekt naar diepe versmelting en passie; de Caregiver zorgt voor veiligheid en voeding.',
    shadowTension: 'Resonantie vs. Intentie: De Lover heeft de Magician nodig om de emotionele verstrengeling om te zetten in werkelijke verandering.',
    element: 'Water',
    color: '#ec4899',
    traits: ['Empathie', 'Gemeenschap', 'Geduld'],
    imageUrl: 'https://picsum.photos/seed/gfl-lover/400/400',
  },
  ARTIST: {
    key: 'ARTIST',
    index: 3,
    set: 'A',
    group: 'Creative',
    name: 'De Kunstenaar',
    nameEn: 'The Artist',
    motivation: 'Transformatie, schoonheid, manifestatie',
    positive: 'Innovatie, visie, alchemie',
    description: 'Creatief, eigenzinnig en gedreven door esthetiek. De Artist geeft vorm aan innerlijke beelden (qualia) en vertaalt ze naar unieke expressie.',
    descriptionEn: 'Creative, idiosyncratic and driven by aesthetics. The Artist shapes inner images (qualia) and translates them into unique expression.',
    shadow: 'Narcisme, perfectionisme, escapisme, isolatie',
    complementaryPartner: 'MAGICIAN',
    shadowPartner: 'JUDGE',
    complementaryAxis: 'Manifestatie: De Artist geeft vorm aan innerlijke beelden; de Magician verandert de interface van de werkelijkheid zelf.',
    shadowTension: 'Expressie vs. Evaluatie: De Artist creëert zonder filter; de Judge is de noodzakelijke schaduw die structuur, maat en oordeel aanbrengt.',
    element: 'Ether',
    color: '#a855f7',
    traits: ['Intuïtie', 'Innovatie', 'Spirit'],
    imageUrl: 'https://picsum.photos/seed/gfl-artist/400/400',
  },
  RULER: {
    key: 'RULER',
    index: 4,
    set: 'A',
    group: 'Ruling',
    name: 'De Heerser',
    nameEn: 'The Ruler',
    motivation: 'Orde, leiderschap, verantwoordelijkheid',
    positive: 'Structuur, autoriteit, welvaart',
    description: 'Gestructureerd, verantwoordelijk en gericht op orde. De Ruler bewaakt de orde en soevereiniteit en bouwt stabiele systemen die standhouden.',
    descriptionEn: 'Structured, responsible and focused on order. The Ruler guards order and sovereignty, building stable systems that endure.',
    shadow: 'Tirannie, controle, aanspraken op bezit',
    complementaryPartner: 'JUDGE',
    shadowPartner: 'OUTLAW',
    complementaryAxis: 'Autoriteit: De Ruler bewaakt de orde en soevereiniteit; de Judge bewaakt de morele integriteit en de weging van die orde.',
    shadowTension: 'Orde vs. Chaos: De Ruler is doodsbang voor anarchie; de Outlaw is de kracht die nodig is om een gestold systeem open te breken.',
    element: 'Aarde',
    color: '#fbbf24',
    traits: ['Logica', 'Traditie', 'Geduld'],
    imageUrl: 'https://picsum.photos/seed/gfl-ruler/400/400',
  },
  INNOCENT: {
    key: 'INNOCENT',
    index: 5,
    set: 'A',
    group: 'Spirit',
    name: 'De Onschuldige',
    nameEn: 'The Innocent',
    motivation: 'Vertrouwen, zuiverheid, verwondering',
    positive: 'Hoop, openheid, vreugde',
    description: 'Puur, vertrouwend en open. De Innocent belichaamt de zuivere waarheid en benadert het leven met fundamentele hoop en eenvoud.',
    descriptionEn: 'Pure, trusting and open. The Innocent embodies pure truth and approaches life with fundamental hope and simplicity.',
    shadow: 'Naïviteit, slachtofferschap, ontkenning van de realiteit',
    complementaryPartner: 'TRICKSTER',
    shadowPartner: 'EXPLORER',
    complementaryAxis: 'Eerlijkheid: De Innocent belichaamt de zuivere waarheid; de Trickster onthult de waarheid door de absurditeit van de leugen te tonen.',
    shadowTension: 'Veiligheid vs. Risico: De Innocent blijft in het paradijs; de Explorer is de schaduwdrang om het bekende te verlaten voor het onbekende.',
    element: 'Licht',
    color: '#f0fdf4',
    traits: ['Spirit', 'Gemeenschap', 'Reflectie'],
    imageUrl: 'https://picsum.photos/seed/gfl-innocent/400/400',
  },

  // ═══════ SET B — Even Questions ═══════

  EXPLORER: {
    key: 'EXPLORER',
    index: 6,
    set: 'B',
    group: 'Wisdom',
    name: 'De Ontdekker',
    nameEn: 'The Explorer',
    motivation: 'Vrijheid, ontdekking, authenticiteit',
    positive: 'Avontuur, nieuwsgierigheid, onafhankelijkheid',
    description: 'Nieuwsgierig, onafhankelijk en altijd op zoek naar het onbekende. De Explorer zoekt de waarheid extern door grenzen te verleggen.',
    descriptionEn: 'Curious, independent and always seeking the unknown. The Explorer seeks truth externally by pushing boundaries.',
    shadow: 'Rusteloosheid, vermijding, isolatie, bindingsangst',
    complementaryPartner: 'SAGE',
    shadowPartner: 'INNOCENT',
    complementaryAxis: 'Wijsheid: Beweging (Explorer) versus Reflectie (Sage). Samen vormen ze de volledige kaart van inzicht.',
    shadowTension: 'Zoektocht vs. Thuiskomst: De Explorer heeft de Innocent nodig om een moreel kompas en innerlijke rust te behouden tijdens de reis.',
    element: 'Lucht',
    color: '#06b6d4',
    traits: ['Innovatie', 'Actie', 'Bewustzijn'],
    imageUrl: 'https://picsum.photos/seed/gfl-explorer/400/400',
  },
  OUTLAW: {
    key: 'OUTLAW',
    index: 7,
    set: 'B',
    group: 'Action',
    name: 'De Rebel',
    nameEn: 'The Outlaw',
    motivation: 'Revolutie, bevrijding, waarheid vertellen',
    positive: 'Authenticiteit, verandering, creatieve destructie',
    description: 'Onconventioneel, autonoom en bereid om regels te breken. De Outlaw breekt het systeem om vrijheid te creëren.',
    descriptionEn: 'Unconventional, autonomous and willing to break rules. The Outlaw breaks the system to create freedom.',
    shadow: 'Destructiviteit, cynisme, vervreemding, sabotage',
    complementaryPartner: 'HERO',
    shadowPartner: 'RULER',
    complementaryAxis: 'Impact: Vernietiging van het oude (Outlaw) versus constructie van het nieuwe (Hero).',
    shadowTension: 'Vernieling vs. Constructie: De Outlaw heeft de Ruler nodig om te voorkomen dat zijn rebellie zinloze destructie wordt.',
    element: 'Vuur',
    color: '#f97316',
    traits: ['Actie', 'Veerkracht', 'Innovatie'],
    imageUrl: 'https://picsum.photos/seed/gfl-outlaw/400/400',
  },
  CAREGIVER: {
    key: 'CAREGIVER',
    index: 8,
    set: 'B',
    group: 'Relational',
    name: 'De Verzorger',
    nameEn: 'The Caregiver',
    motivation: 'Compassie, bescherming, dienstbaarheid',
    positive: 'Vrijgevigheid, genezing, ondersteuning',
    description: 'Zorgzaam, beschermend en altruïstisch. De Caregiver zorgt voor veiligheid en voeding en bouwt veilige havens voor anderen.',
    descriptionEn: 'Caring, protective and altruistic. The Caregiver provides safety and nourishment, building safe havens for others.',
    shadow: 'Martelaarschap, enabling, wrok, zelfverwaarlozing',
    complementaryPartner: 'LOVER',
    shadowPartner: 'HERO',
    complementaryAxis: 'Verbinding: De intensiteit van de Lover versus de stabiliteit van de Caregiver.',
    shadowTension: 'Dienstbaarheid vs. Zelfbeschikking: De Caregiver heeft de Hero nodig om grenzen te stellen en niet opgebrand te raken door anderen.',
    element: 'Water',
    color: '#22d3ee',
    traits: ['Empathie', 'Gemeenschap', 'Geduld'],
    imageUrl: 'https://picsum.photos/seed/gfl-caregiver/400/400',
  },
  MAGICIAN: {
    key: 'MAGICIAN',
    index: 9,
    set: 'B',
    group: 'Creative',
    name: 'De Magiër',
    nameEn: 'The Magician',
    motivation: 'Transformatie, manifestatie, visie',
    positive: 'Alchemie, visionair vermogen, catalysator',
    description: 'Transformatief, visionair en in staat om de werkelijkheid te veranderen. De Magician verandert de interface van de werkelijkheid zelf.',
    descriptionEn: 'Transformative, visionary and able to change reality. The Magician changes the interface of reality itself.',
    shadow: 'Manipulatie, perfectionism, escapisme, afgescheidenheid van de materie',
    complementaryPartner: 'ARTIST',
    shadowPartner: 'LOVER',
    complementaryAxis: 'Creatie: De Magische transformatie heeft de Artistieke vorm nodig om begrepen te worden.',
    shadowTension: 'Transformatie vs. Acceptatie: De Magician wil de werkelijkheid veranderen; de Lover wil de werkelijkheid simpelweg zijn en beminnen.',
    element: 'Quintessence',
    color: '#eab308',
    traits: ['Intuïtie', 'Spirit', 'Veerkracht'],
    imageUrl: 'https://picsum.photos/seed/gfl-magician/400/400',
  },
  JUDGE: {
    key: 'JUDGE',
    index: 10,
    set: 'B',
    group: 'Ruling',
    name: 'De Rechter',
    nameEn: 'The Judge',
    motivation: 'Rechtvaardigheid, integriteit, morele helderheid',
    positive: 'Leiderschap, welvaart, gerechtigheid',
    description: 'Rechtvaardig, principieel en moreel scherp. De Judge bewaakt de morele integriteit en weegt alles tegen een innerlijk kompas van waarheid.',
    descriptionEn: 'Just, principled and morally sharp. The Judge guards moral integrity, weighing everything against an inner compass of truth.',
    shadow: 'Veroordelend, onbuigzaamheid, morele superioriteit',
    complementaryPartner: 'RULER',
    shadowPartner: 'ARTIST',
    complementaryAxis: 'Structuur: De Judge geeft het morele gewicht aan de troon waarop de Ruler zit.',
    shadowTension: 'Objectiviteit vs. Subjectiviteit: De Judge vult zijn kille oordeel aan met de bezieling en visie van de Artist.',
    element: 'Aarde',
    color: '#8b5cf6',
    traits: ['Logica', 'Traditie', 'Bewustzijn'],
    imageUrl: 'https://picsum.photos/seed/gfl-judge/400/400',
  },
  TRICKSTER: {
    key: 'TRICKSTER',
    index: 11,
    set: 'B',
    group: 'Spirit',
    name: 'De Nar',
    nameEn: 'The Trickster',
    motivation: 'Vreugde, humor, doorbreken van rigiditeit',
    positive: 'Speelsheid, creativiteit, perspectief',
    description: 'Humoristisch, ontwrichtend en wijs door absurditeit. De Trickster onthult de waarheid door de absurditeit van de leugen te tonen.',
    descriptionEn: 'Humorous, disruptive and wise through absurdity. The Trickster reveals truth by showing the absurdity of the lie.',
    shadow: 'Onverantwoordelijkheid, wreedheid, manipulatie, cynisme',
    complementaryPartner: 'INNOCENT',
    shadowPartner: 'SAGE',
    complementaryAxis: 'Perspectief: De ernst van de Innocent versus de relativering van de Trickster houden de psyche in balans.',
    shadowTension: 'Spot vs. Diepgang: De Trickster heeft de Sage nodig om te voorkomen dat zijn grappen oppervlakkig en betekenisloos worden.',
    element: 'Lucht',
    color: '#f472b6',
    traits: ['Innovatie', 'Bewustzijn', 'Spirit'],
    imageUrl: 'https://picsum.photos/seed/gfl-trickster/400/400',
  },
};

/**
 * Archetype Functional Groups — Complementary Pairs.
 * Each group contains one Set A and one Set B archetype that together
 * form a complete axis. When both appear as Main + Support, the
 * Harmony Bonus (+69) is triggered.
 */
export const ARCHETYPE_GROUPS = {
  'Wisdom':     { setA: 'SAGE',     setB: 'EXPLORER',  axis: 'Waarheidsvinding' },
  'Action':     { setA: 'HERO',     setB: 'OUTLAW',    axis: 'Transformatie door Actie' },
  'Relational': { setA: 'LOVER',    setB: 'CAREGIVER', axis: 'Relatie & Verbinding' },
  'Creative':   { setA: 'ARTIST',   setB: 'MAGICIAN',  axis: 'Manifestatie & Creatie' },
  'Ruling':     { setA: 'RULER',    setB: 'JUDGE',     axis: 'Autoriteit & Structuur' },
  'Spirit':     { setA: 'INNOCENT', setB: 'TRICKSTER', axis: 'Eerlijkheid & Perspectief' },
};

/**
 * Ordered list of archetype keys for iteration.
 */
export const ARCHETYPE_KEYS = Object.keys(ARCHETYPES);

/**
 * Get archetype by key.
 * @param {string} key
 * @returns {Object|undefined}
 */
export function getArchetype(key) {
  return ARCHETYPES[key];
}
