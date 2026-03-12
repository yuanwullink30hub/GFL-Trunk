/**
 * Archetype Definitions — Master Index
 *
 * Contains all 12 archetypes organized by the Triple Network Model (Neurobiological Framework).
 *
 * Archetype Positions on the 12-point wheel:
 *   1=Judge  2=Lover  3=Caregiver  4=Innocent
 *   5=Explorer  6=Outlaw  7=Trickster  8=Sage
 *   9=Artist  10=Magician  11=Hero  12=Ruler
 *
 * 6 Biological Support Groups (Neurale Zuilen):
 *   G1 Ruling (CEN):        Judge(1)   + Ruler(12)   — Systeem & Objectiviteit
 *   G2 Relational (Limbic):  Lover(2)   + Caregiver(3)— Emotionele Fusie
 *   G3 Seeker (Openness):    Innocent(4)+ Explorer(5) — Zuiverheid & Vrijheid
 *   G4 Chaos (Salience):     Outlaw(6)  + Trickster(7)— Disruptie & Waarheid
 *   G5 Abstract (DMN):       Sage(8)    + Artist(9)   — Interne Reflectie
 *   G6 Agency (Extraversie): Magician(10)+ Hero(11)   — Transformatie door Wilskracht
 *
 * Shadow Pairs (180° on 12-point wheel — position + 6):
 *   Judge(1)    ↔ Trickster(7)  — CEN ↔ Salience
 *   Lover(2)    ↔ Sage(8)       — Limbic ↔ DMN
 *   Caregiver(3)↔ Artist(9)     — Limbic ↔ DMN
 *   Innocent(4) ↔ Magician(10)  — Openness ↔ Agency
 *   Explorer(5) ↔ Hero(11)      — Openness ↔ Agency
 *   Outlaw(6)   ↔ Ruler(12)     — Salience ↔ CEN
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
    position: 8,
    set: 'A',
    group: 'Abstract',
    neuralBasis: 'DMN Hyper-connectie',
    name: 'De Wijze',
    nameEn: 'The Sage',
    motivation: 'Het doorgronden van de waarheid, begrip, objectieve onthechting',
    positive: 'Helderheid, mentorschap, diep analytisch inzicht',
    description: 'Analytisch, reflectief en zoekend naar diepere waarheid. De Sage analyseert de realiteit en zoekt objectieve filosofische waarheden via het Default Mode Network.',
    descriptionEn: 'Analytical, reflective and seeking deeper truth. The Sage analyzes reality and seeks objective philosophical truths through the Default Mode Network.',
    shadow: 'Verlamming door over-analyse (paralysis-by-analysis), emotionele kilte, dogmatisme',
    complementaryPartner: 'ARTIST',
    shadowPartner: 'LOVER',
    complementaryAxis: 'Interne Reflectie (DMN Hyper-connectie): De Sage analyseert de realiteit en zoekt objectieve filosofische waarheden; de Artist pakt deze complexe waarheden en vertaalt ze naar een voelbare, esthetische vorm.',
    shadowTension: 'Observatie vs. Participatie: De Sage observeert de werkelijkheid veilig, koud en objectief vanuit het eigen hoofd (DMN); de Lover dwingt de Sage om het lichaam en het hart in te zetten en het leven daadwerkelijk te voelen en te delen.',
    element: 'Lucht',
    color: '#3b82f6',
    traits: ['Bewustzijn', 'Logica', 'Reflectie'],
    imageUrl: 'https://picsum.photos/seed/gfl-sage/400/400',
  },
  HERO: {
    key: 'HERO',
    position: 11,
    set: 'A',
    group: 'Agency',
    neuralBasis: 'Extraversie & Wilskracht',
    name: 'De Held',
    nameEn: 'The Hero',
    motivation: 'Meesterschap, moed, fysieke en mentale overwinning op obstakels',
    positive: 'Kracht, extreme discipline, het vermogen om zwakkeren te beschermen',
    description: 'Moedig, gedisciplineerd en gedreven om te presteren. De Hero focust zich op het fysiek overwinnen van het obstakel met pure wilskracht.',
    descriptionEn: 'Courageous, disciplined and driven to perform. The Hero focuses on physically overcoming obstacles through pure willpower.',
    shadow: 'Arrogantie, terminale fysieke/mentale burn-out, de absolute ontkenning van eigen kwetsbaarheid',
    complementaryPartner: 'MAGICIAN',
    shadowPartner: 'EXPLORER',
    complementaryAxis: 'Transformatie door Wilskracht (Extraversie): De Hero focust zich op het fysiek overwinnen van het obstakel; de Magician zorgt ervoor dat de Held zijn kracht strategisch inzet om een geheel nieuwe realiteit te manifesteren.',
    shadowTension: 'Prestatiedruk vs. Grenzeloos ontdekken: De Hero brandt zichzelf op in strakke discipline en eindeloze gevechten; de Explorer herinnert de Held eraan dat het soms nodig is om het harnas af te leggen.',
    element: 'Vuur',
    color: '#ef4444',
    traits: ['Actie', 'Veerkracht', 'Geduld'],
    imageUrl: 'https://picsum.photos/seed/gfl-hero/400/400',
  },
  LOVER: {
    key: 'LOVER',
    position: 2,
    set: 'A',
    group: 'Relational',
    neuralBasis: 'Limbic Coupling',
    name: 'De Minnaar',
    nameEn: 'The Lover',
    motivation: 'Connectie, intimiteit, emotionele en fysieke schoonheid',
    positive: 'Diepe empathie, passie, eenheid en affectie',
    description: 'Diep emotioneel, verbindend en gericht op intimiteit. De Lover wil alles voelen en zonder grenzen met de ander samensmelten.',
    descriptionEn: 'Deeply emotional, connecting and focused on intimacy. The Lover seeks deep fusion and passion in all relationships.',
    shadow: 'Codependentie, het instorten van grenzen, zware verlatingsangst (HPA-as pieken)',
    complementaryPartner: 'CAREGIVER',
    shadowPartner: 'SAGE',
    complementaryAxis: 'Emotionele Fusie (Limbic Coupling): De Lover levert de intense passie en wens tot versmelting; de Caregiver levert de onvoorwaardelijke veiligheid en voeding om die relatie te borgen.',
    shadowTension: 'Emotionele fusie vs. Intellectuele onthechting: De Lover wil alles voelen en zonder grenzen samensmelten; de Sage leert de Lover om emotioneel afstand te nemen en objectief te blijven.',
    element: 'Water',
    color: '#ec4899',
    traits: ['Empathie', 'Gemeenschap', 'Geduld'],
    imageUrl: 'https://picsum.photos/seed/gfl-lover/400/400',
  },
  ARTIST: {
    key: 'ARTIST',
    position: 9,
    set: 'A',
    group: 'Abstract',
    neuralBasis: 'DMN Hyper-connectie',
    name: 'De Kunstenaar',
    nameEn: 'The Artist',
    motivation: 'Subjectieve expressie, interne schoonheid, emotionele verkenning',
    positive: 'Innovatie, esthetische visie, resonantie met het onbewuste',
    description: 'Creatief, eigenzinnig en gedreven door esthetiek. De Artist duikt diep in het subjectieve onbewuste en vertaalt abstracte visioenen naar voelbare expressie.',
    descriptionEn: 'Creative, idiosyncratic and driven by aesthetics. The Artist dives deep into the subjective unconscious and translates abstract visions into tangible expression.',
    shadow: 'Verlammend perfectionisme, escapisme, volledige dissociatie in abstracte ideeën',
    complementaryPartner: 'SAGE',
    shadowPartner: 'CAREGIVER',
    complementaryAxis: 'Interne Reflectie (DMN Hyper-connectie): De Artist duikt diep in het subjectieve onbewuste; de Sage biedt de analytische kaders om deze abstracte visioenen te ordenen en te begrijpen.',
    shadowTension: 'Subjectief Narcisme vs. Zorg voor de ander: De Artist kan verdwalen in pure zelfexpressie; de Caregiver trekt de Artist terug naar de gemeenschap en de verantwoordelijkheid voor zijn medemens.',
    element: 'Ether',
    color: '#a855f7',
    traits: ['Intuïtie', 'Innovatie', 'Spirit'],
    imageUrl: 'https://picsum.photos/seed/gfl-artist/400/400',
  },
  RULER: {
    key: 'RULER',
    position: 12,
    set: 'A',
    group: 'Ruling',
    neuralBasis: 'CEN Dominantie',
    name: 'De Heerser',
    nameEn: 'The Ruler',
    motivation: 'Orde, hiërarchische stabiliteit, verantwoordelijkheid nemen',
    positive: 'Autoriteit, leiderschap, het creëren van welvaart en veiligheid',
    description: 'Gestructureerd, verantwoordelijk en gericht op orde. De Ruler neemt de leiding en bouwt het rijk via het Central Executive Network.',
    descriptionEn: 'Structured, responsible and focused on order. The Ruler takes the lead and builds the realm through the Central Executive Network.',
    shadow: 'Tirannie, obsessieve micromanagement, blinde terreur voor anarchie',
    complementaryPartner: 'JUDGE',
    shadowPartner: 'OUTLAW',
    complementaryAxis: 'Systeem & Objectiviteit (CEN Dominantie): De Ruler neemt de leiding en bouwt het rijk; de Judge fungeert als het interne kompas dat voorkomt dat de Ruler in een tiran verandert.',
    shadowTension: 'Absolute Orde vs. Chaos: De Ruler is doodsbang voor controleverlies; de Outlaw is de levensreddende schaduw die de systemen van de Ruler dwingt om af te breken en te evolueren.',
    element: 'Aarde',
    color: '#fbbf24',
    traits: ['Logica', 'Traditie', 'Geduld'],
    imageUrl: 'https://picsum.photos/seed/gfl-ruler/400/400',
  },
  INNOCENT: {
    key: 'INNOCENT',
    position: 4,
    set: 'A',
    group: 'Seeker',
    neuralBasis: 'Hoge Openness',
    name: 'De Onschuldige',
    nameEn: 'The Innocent',
    motivation: 'Vertrouwen, zuiverheid, het behouden of vinden van het paradijs',
    positive: 'Hoop, onvoorwaardelijke openheid, pure vreugde',
    description: 'Puur, vertrouwend en open. De Innocent behoudt het fundamentele vertrouwen in de wereld en benadert het leven met pure hoop.',
    descriptionEn: 'Pure, trusting and open. The Innocent maintains fundamental trust in the world and approaches life with pure hope.',
    shadow: 'Naïviteit, slachtofferrol, de weigering om gevaar of complexiteit onder ogen te zien',
    complementaryPartner: 'EXPLORER',
    shadowPartner: 'MAGICIAN',
    complementaryAxis: 'Zuiverheid & Vrijheid (Hoge Openness): De Innocent behoudt het fundamentele vertrouwen in de wereld; de Explorer gebruikt dit vertrouwen om zonder angst nieuwe horizonten te ontdekken.',
    shadowTension: 'Pure acceptatie vs. Transformatie: De Innocent vertrouwt naïef en ondergaat de realiteit zoals die is; de Magician vult de schaduw door de Innocent de wilskracht te geven om de realiteit actief naar eigen hand te zetten.',
    element: 'Licht',
    color: '#f0fdf4',
    traits: ['Spirit', 'Gemeenschap', 'Reflectie'],
    imageUrl: 'https://picsum.photos/seed/gfl-innocent/400/400',
  },

  // ═══════ SET B — Even Questions ═══════

  EXPLORER: {
    key: 'EXPLORER',
    position: 5,
    set: 'B',
    group: 'Seeker',
    neuralBasis: 'Hoge Openness',
    name: 'De Ontdekker',
    nameEn: 'The Explorer',
    motivation: 'Absolute vrijheid, ontdekking, authenticiteit',
    positive: 'Avontuur, grensverleggende nieuwsgierigheid, onafhankelijkheid',
    description: 'Nieuwsgierig, onafhankelijk en altijd op zoek naar het onbekende. De Explorer brengt de dynamiek van de reis en zoekt grenzeloze horizonten.',
    descriptionEn: 'Curious, independent and always seeking the unknown. The Explorer brings the dynamics of the journey and seeks boundless horizons.',
    shadow: 'Doelloos ronddwalen, een onvermogen om zich te binden, diepe sociale isolatie',
    complementaryPartner: 'INNOCENT',
    shadowPartner: 'HERO',
    complementaryAxis: 'Zuiverheid & Vrijheid (Hoge Openness): De Explorer brengt de dynamiek van de reis; de Innocent zorgt ervoor dat de ontdekker zich overal verwondert en nergens cynisch wordt.',
    shadowTension: 'Vrijheid vs. Gedisciplineerde verovering: De Explorer vermijdt binding om te dwalen; de Hero leert dat werkelijke impact eist dat je een doel kiest en obstakels overwint.',
    element: 'Lucht',
    color: '#06b6d4',
    traits: ['Innovatie', 'Actie', 'Bewustzijn'],
    imageUrl: 'https://picsum.photos/seed/gfl-explorer/400/400',
  },
  OUTLAW: {
    key: 'OUTLAW',
    position: 6,
    set: 'B',
    group: 'Chaos',
    neuralBasis: 'Salience Network',
    name: 'De Rebel',
    nameEn: 'The Outlaw',
    motivation: 'Revolutie, bevrijding, het vertellen van de radicale waarheid',
    positive: 'Authenticiteit, het vermogen om corrupte systemen te doorbreken',
    description: 'Onconventioneel, autonoom en bereid om regels te breken. De Outlaw breekt stagnerende systemen af via het Salience Network.',
    descriptionEn: 'Unconventional, autonomous and willing to break rules. The Outlaw breaks stagnating systems through the Salience Network.',
    shadow: 'Zinloze destructie, diep cynisme, chronische rebellie die leidt tot vervreemding',
    complementaryPartner: 'TRICKSTER',
    shadowPartner: 'RULER',
    complementaryAxis: 'Disruptie & Waarheid (Salience Network): De Outlaw breekt een stagnerend systeem fysiek af; de Trickster breekt de onderliggende ego\'s en regels af door middel van radicale absurditeit.',
    shadowTension: 'Vernieling vs. Constructie: De Outlaw is gericht op het afbreken; de Ruler is de noodzakelijke schaduw die structuur biedt zodat de rebellie leidt tot een beter systeem.',
    element: 'Vuur',
    color: '#f97316',
    traits: ['Actie', 'Veerkracht', 'Innovatie'],
    imageUrl: 'https://picsum.photos/seed/gfl-outlaw/400/400',
  },
  CAREGIVER: {
    key: 'CAREGIVER',
    position: 3,
    set: 'B',
    group: 'Relational',
    neuralBasis: 'Limbic Coupling',
    name: 'De Verzorger',
    nameEn: 'The Caregiver',
    motivation: 'Compassie, bescherming, dienstbaarheid aan de ander',
    positive: 'Vrijgevigheid, genezing, onvoorwaardelijke steun',
    description: 'Zorgzaam, beschermend en altruïstisch. De Caregiver creëert een veilige thuishaven via oxytocine-gedreven zorginstinct.',
    descriptionEn: 'Caring, protective and altruistic. The Caregiver creates a safe haven through oxytocin-driven care instinct.',
    shadow: 'Martelaarschap, het ongewild faciliteren van zwakte (enabling), onderdrukte wrok',
    complementaryPartner: 'LOVER',
    shadowPartner: 'ARTIST',
    complementaryAxis: 'Emotionele Fusie (Limbic Coupling): De Caregiver creëert een veilige thuishaven; de Lover vult deze haven met intimiteit, schoonheid en diepe affectie.',
    shadowTension: 'Dienstbaarheid vs. Zelfexpressie: De Caregiver offert de eigen identiteit op voor de groep; de Artist herinnert de Caregiver eraan dat het eigen ego en persoonlijke expressie ook bestaansrecht hebben.',
    element: 'Water',
    color: '#22d3ee',
    traits: ['Empathie', 'Gemeenschap', 'Geduld'],
    imageUrl: 'https://picsum.photos/seed/gfl-caregiver/400/400',
  },
  MAGICIAN: {
    key: 'MAGICIAN',
    position: 10,
    set: 'B',
    group: 'Agency',
    neuralBasis: 'Extraversie & Wilskracht',
    name: 'De Magiër',
    nameEn: 'The Magician',
    motivation: 'Esoterische transformatie, paradigmaverschuiving, manifestatie',
    positive: 'Alchemie, ongekende innovatie, het hervormen van de realiteit',
    description: 'Transformatief, visionair en in staat om de werkelijkheid te veranderen. De Magician ontwerpt de esoterische visie om de realiteit te buigen.',
    descriptionEn: 'Transformative, visionary and able to change reality. The Magician designs the esoteric vision to bend reality.',
    shadow: 'Complexe manipulatie, god-complex, verlies van verbinding met materiële consequenties',
    complementaryPartner: 'HERO',
    shadowPartner: 'INNOCENT',
    complementaryAxis: 'Transformatie door Wilskracht (Extraversie): De Magician ontwerpt de esoterische visie om de realiteit te buigen; de Hero levert de pure, gedisciplineerde actie om het uit te voeren.',
    shadowTension: 'Constante alchemie vs. Puur vertrouwen: De Magician manipuleert constant de realiteit; de Innocent is de schaduw die leert hoe controle los te laten en onvoorwaardelijke rust te vinden.',
    element: 'Quintessence',
    color: '#eab308',
    traits: ['Intuïtie', 'Spirit', 'Veerkracht'],
    imageUrl: 'https://picsum.photos/seed/gfl-magician/400/400',
  },
  JUDGE: {
    key: 'JUDGE',
    position: 1,
    set: 'B',
    group: 'Ruling',
    neuralBasis: 'CEN Dominantie',
    name: 'De Rechter',
    nameEn: 'The Judge',
    motivation: 'Objectieve waarheid, systemische integriteit, strikte rechtvaardigheid',
    positive: 'Eerlijkheid, structurele evaluatie, moreel gewicht',
    description: 'Rechtvaardig, principieel en moreel scherp. De Judge levert het morele oordeel en de wet via het Central Executive Network.',
    descriptionEn: 'Just, principled and morally sharp. The Judge delivers moral judgment and law through the Central Executive Network.',
    shadow: 'Draconische rigiditeit, meedogenloosheid, absolute emotionele onthechting',
    complementaryPartner: 'RULER',
    shadowPartner: 'TRICKSTER',
    complementaryAxis: 'Systeem & Objectiviteit (CEN Dominantie): De Judge levert het morele oordeel en de wet; de Ruler biedt de autoriteit en structuur om deze wet te handhaven.',
    shadowTension: 'Objectieve ernst vs. Relativerende absurditeit: De Judge neemt de wetten loodzwaar; de Trickster vult de schaduw door de chaos toe te laten en te laten zien dat niet alles perfect gereguleerd hoeft te worden.',
    element: 'Aarde',
    color: '#8b5cf6',
    traits: ['Logica', 'Traditie', 'Bewustzijn'],
    imageUrl: 'https://picsum.photos/seed/gfl-judge/400/400',
  },
  TRICKSTER: {
    key: 'TRICKSTER',
    position: 7,
    set: 'B',
    group: 'Chaos',
    neuralBasis: 'Salience Network',
    name: 'De Nar',
    nameEn: 'The Trickster',
    motivation: 'Vreugde, absurditeit, het ontwrichten van stijve structuren en ego\'s',
    positive: 'Speelsheid, snelle sociale disruptie, briljant perspectief',
    description: 'Humoristisch, ontwrichtend en wijs door absurditeit. De Trickster legt met humor de hypocrisie van de realiteit bloot via het Salience Network.',
    descriptionEn: 'Humorous, disruptive and wise through absurdity. The Trickster exposes the hypocrisy of reality through humor via the Salience Network.',
    shadow: 'Frivoliteit, wreedheid, de "sad clown" paradox (het maskeren van diepe interne pijn)',
    complementaryPartner: 'OUTLAW',
    shadowPartner: 'JUDGE',
    complementaryAxis: 'Disruptie & Waarheid (Salience Network): De Trickster legt met humor de hypocrisie bloot; de Outlaw zet deze inzichten om in een daadwerkelijke opstand.',
    shadowTension: 'Absurditeit vs. Morele weging: De Trickster drijft overal de spot mee; de Judge zorgt ervoor dat deze humor niet wegglijdt in toxisch nihilisme, maar wordt verankerd in fundamentele waarden.',
    element: 'Lucht',
    color: '#f472b6',
    traits: ['Innovatie', 'Bewustzijn', 'Spirit'],
    imageUrl: 'https://picsum.photos/seed/gfl-trickster/400/400',
  },
};

/**
 * Archetype Functional Groups — Neurale Zuilen (Biological Support Groups).
 * Each group maps to a specific neural network and contains two complementary
 * archetypes that together form a complete biological axis.
 * When both appear as Main + Support, the Harmony Bonus (+69) is triggered.
 */
export const ARCHETYPE_GROUPS = {
  'Ruling':     { archetypeA: 'JUDGE',     archetypeB: 'RULER',    axis: 'Systeem & Objectiviteit',        neuralBasis: 'CEN Dominantie' },
  'Relational': { archetypeA: 'LOVER',     archetypeB: 'CAREGIVER', axis: 'Emotionele Fusie',              neuralBasis: 'Limbic Coupling' },
  'Seeker':     { archetypeA: 'INNOCENT',  archetypeB: 'EXPLORER', axis: 'Zuiverheid & Vrijheid',          neuralBasis: 'Hoge Openness' },
  'Chaos':      { archetypeA: 'OUTLAW',    archetypeB: 'TRICKSTER', axis: 'Disruptie & Waarheid',          neuralBasis: 'Salience Network' },
  'Abstract':   { archetypeA: 'SAGE',      archetypeB: 'ARTIST',   axis: 'Interne Reflectie',              neuralBasis: 'DMN Hyper-connectie' },
  'Agency':     { archetypeA: 'MAGICIAN',  archetypeB: 'HERO',     axis: 'Transformatie door Wilskracht',  neuralBasis: 'Extraversie/Wilskracht' },
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
