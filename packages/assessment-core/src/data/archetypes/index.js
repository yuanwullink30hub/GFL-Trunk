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
    motivationEn: 'Fathoming the truth, understanding, objective detachment',
    positive: 'Helderheid, mentorschap, diep analytisch inzicht',
    positiveEn: 'Clarity, mentorship, deep analytical insight',
    description: 'Analytisch, reflectief en zoekend naar diepere waarheid. De Sage analyseert de realiteit en zoekt objectieve filosofische waarheden via het Default Mode Network.',
    descriptionEn: 'Analytical, reflective and seeking deeper truth. The Sage analyzes reality and seeks objective philosophical truths through the Default Mode Network.',
    shadow: 'Verlamming door over-analyse (paralysis-by-analysis), emotionele kilte, dogmatisme',
    shadowEn: 'Paralysis by over-analysis, emotional coldness, dogmatism',
    complementaryPartner: 'ARTIST',
    shadowPartner: 'LOVER',
    complementaryAxis: 'Interne Reflectie (DMN Hyper-connectie): De Sage analyseert de realiteit en zoekt objectieve filosofische waarheden; de Artist pakt deze complexe waarheden en vertaalt ze naar een voelbare, esthetische vorm.',
    complementaryAxisEn: 'Internal Reflection (DMN hyper-connectivity): The Sage analyses reality and seeks objective philosophical truths; the Artist takes those complex truths and translates them into a tangible, aesthetic form.',
    shadowTension: 'Observatie vs. Participatie: De Sage observeert de werkelijkheid veilig, koud en objectief vanuit het eigen hoofd (DMN); de Lover dwingt de Sage om het lichaam en het hart in te zetten en het leven daadwerkelijk te voelen en te delen.',
    shadowTensionEn: 'Observation vs. Participation: The Sage observes reality safely, coldly and objectively from inside its own head (DMN); the Lover forces the Sage to bring in the body and the heart, and to actually feel and share life.',
    element: 'Lucht',
    elementEn: 'Air',
    color: '#3b82f6',
    traits: ['Bewustzijn', 'Logica', 'Reflectie'],
    traitsEn: ['Awareness', 'Logic', 'Reflection'],
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
    motivationEn: 'Mastery, courage, physical and mental victory over obstacles',
    positive: 'Kracht, extreme discipline, het vermogen om zwakkeren te beschermen',
    positiveEn: 'Strength, extreme discipline, the ability to protect the weaker',
    description: 'Moedig, gedisciplineerd en gedreven om te presteren. De Hero focust zich op het fysiek overwinnen van het obstakel met pure wilskracht.',
    descriptionEn: 'Courageous, disciplined and driven to perform. The Hero focuses on physically overcoming obstacles through pure willpower.',
    shadow: 'Arrogantie, terminale fysieke/mentale burn-out, de absolute ontkenning van eigen kwetsbaarheid',
    shadowEn: 'Arrogance, terminal physical/mental burnout, the absolute denial of one’s own vulnerability',
    complementaryPartner: 'MAGICIAN',
    shadowPartner: 'EXPLORER',
    complementaryAxis: 'Transformatie door Wilskracht (Extraversie): De Hero focust zich op het fysiek overwinnen van het obstakel; de Magician zorgt ervoor dat de Held zijn kracht strategisch inzet om een geheel nieuwe realiteit te manifesteren.',
    complementaryAxisEn: 'Transformation through Willpower (Extraversion): The Hero focuses on physically overcoming the obstacle; the Magician makes sure the Hero deploys that strength strategically to manifest an entirely new reality.',
    shadowTension: 'Prestatiedruk vs. Grenzeloos ontdekken: De Hero brandt zichzelf op in strakke discipline en eindeloze gevechten; de Explorer herinnert de Held eraan dat het soms nodig is om het harnas af te leggen.',
    shadowTensionEn: 'Performance pressure vs. Boundless discovery: The Hero burns himself out in tight discipline and endless battles; the Explorer reminds the Hero that sometimes the armour has to come off.',
    element: 'Vuur',
    elementEn: 'Fire',
    color: '#ef4444',
    traits: ['Actie', 'Veerkracht', 'Geduld'],
    traitsEn: ['Action', 'Resilience', 'Patience'],
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
    motivationEn: 'Connection, intimacy, emotional and physical beauty',
    positive: 'Diepe empathie, passie, eenheid en affectie',
    positiveEn: 'Deep empathy, passion, union and affection',
    description: 'Diep emotioneel, verbindend en gericht op intimiteit. De Lover wil alles voelen en zonder grenzen met de ander samensmelten.',
    descriptionEn: 'Deeply emotional, connecting and focused on intimacy. The Lover seeks deep fusion and passion in all relationships.',
    shadow: 'Codependentie, het instorten van grenzen, zware verlatingsangst (HPA-as pieken)',
    shadowEn: 'Codependency, the collapse of boundaries, severe fear of abandonment (HPA-axis spikes)',
    complementaryPartner: 'CAREGIVER',
    shadowPartner: 'SAGE',
    complementaryAxis: 'Emotionele Fusie (Limbic Coupling): De Lover levert de intense passie en wens tot versmelting; de Caregiver levert de onvoorwaardelijke veiligheid en voeding om die relatie te borgen.',
    complementaryAxisEn: 'Emotional Fusion (Limbic Coupling): The Lover supplies the intense passion and the wish to merge; the Caregiver supplies the unconditional safety and nourishment that secures the relationship.',
    shadowTension: 'Emotionele fusie vs. Intellectuele onthechting: De Lover wil alles voelen en zonder grenzen samensmelten; de Sage leert de Lover om emotioneel afstand te nemen en objectief te blijven.',
    shadowTensionEn: 'Emotional fusion vs. Intellectual detachment: The Lover wants to feel everything and merge without boundaries; the Sage teaches the Lover to take emotional distance and stay objective.',
    element: 'Water',
    elementEn: 'Water',
    color: '#ec4899',
    traits: ['Empathie', 'Gemeenschap', 'Geduld'],
    traitsEn: ['Empathy', 'Community', 'Patience'],
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
    motivationEn: 'Subjective expression, inner beauty, emotional exploration',
    positive: 'Innovatie, esthetische visie, resonantie met het onbewuste',
    positiveEn: 'Innovation, aesthetic vision, resonance with the unconscious',
    description: 'Creatief, eigenzinnig en gedreven door esthetiek. De Artist duikt diep in het subjectieve onbewuste en vertaalt abstracte visioenen naar voelbare expressie.',
    descriptionEn: 'Creative, idiosyncratic and driven by aesthetics. The Artist dives deep into the subjective unconscious and translates abstract visions into tangible expression.',
    shadow: 'Verlammend perfectionisme, escapisme, volledige dissociatie in abstracte ideeën',
    shadowEn: 'Paralysing perfectionism, escapism, complete dissociation into abstract ideas',
    complementaryPartner: 'SAGE',
    shadowPartner: 'CAREGIVER',
    complementaryAxis: 'Interne Reflectie (DMN Hyper-connectie): De Artist duikt diep in het subjectieve onbewuste; de Sage biedt de analytische kaders om deze abstracte visioenen te ordenen en te begrijpen.',
    complementaryAxisEn: 'Internal Reflection (DMN hyper-connectivity): The Artist dives deep into the subjective unconscious; the Sage offers the analytical frameworks to order and understand those abstract visions.',
    shadowTension: 'Subjectief Narcisme vs. Zorg voor de ander: De Artist kan verdwalen in pure zelfexpressie; de Caregiver trekt de Artist terug naar de gemeenschap en de verantwoordelijkheid voor zijn medemens.',
    shadowTensionEn: 'Subjective narcissism vs. Care for the other: The Artist can get lost in pure self-expression; the Caregiver pulls the Artist back to the community and to responsibility for others.',
    element: 'Ether',
    elementEn: 'Ether',
    color: '#a855f7',
    traits: ['Intuïtie', 'Innovatie', 'Spirit'],
    traitsEn: ['Intuition', 'Innovation', 'Spirit'],
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
    motivationEn: 'Order, hierarchical stability, taking responsibility',
    positive: 'Autoriteit, leiderschap, het creëren van welvaart en veiligheid',
    positiveEn: 'Authority, leadership, creating prosperity and safety',
    description: 'Binnen dit model wordt de Ruler geassocieerd met het Central Executive Network — de cognitieve architectuur die prioriteert, beslist en organiseert. Dit is een modelterm, geen neurologisch meetgegeven.\n\nDe Ruler-lens functioneert in dit model als een permanente architectuurscanner: ik lees omgevingen op hun structurele logica. Wie heeft welke rol? Waar liggen de verantwoordelijkheden? Wat ontbreekt er aan het systeem? Dit antwoordpatroon maakt je effectief als ontwerper van kaders — maar kan ook betekenen dat je omgevingen die geen structuur kennen als onveilig of inefficiënt ervaart.',
    descriptionEn: 'Within this model the Ruler is associated with the Central Executive Network — the cognitive architecture that prioritises, decides and organises. This is a model term, not a neurological measurement.\n\nWithin this model the Ruler lens functions as a permanent architecture scanner: I read environments for their structural logic. Who holds which role? Where do the responsibilities lie? What is missing from the system? This answer pattern makes you effective as a designer of frameworks — but it can also mean that you experience environments without structure as unsafe or inefficient.',
    shadow: 'Tirannie, obsessieve micromanagement, blinde terreur voor anarchie',
    shadowEn: 'Tyranny, obsessive micromanagement, blind terror of anarchy',
    complementaryPartner: 'JUDGE',
    shadowPartner: 'OUTLAW',
    complementaryAxis: 'Systeem & Objectiviteit (CEN Dominantie): De Ruler neemt de leiding en bouwt het rijk; de Judge fungeert als het interne kompas dat voorkomt dat de Ruler in een tiran verandert.',
    complementaryAxisEn: 'System & Objectivity (CEN dominance): The Ruler takes the lead and builds the realm; the Judge acts as the internal compass that keeps the Ruler from turning into a tyrant.',
    shadowTension: 'Binnen dit model is de schaduw van de Ruler de Outlaw — en in dit geval is dit tegelijkertijd het Support-archetype. Dit maakt de schaduwpositie uitzonderlijk: de Outlaw-energie is niet verdrongen maar gedeeltelijk geïntegreerd als strategisch instrument.\n\nDe Polarization Index suggereert een actieve integratie: de Outlaw-score is hoog genoeg om als Support te functioneren, maar de Ruler-kern domineert nog steeds. Dit plaatst in de 30–60% gap — gezonde spanning, geen onderdrukking.\n\nWat de schaduw hier vraagt, is niet méér Outlaw-energie. Het vraagt om bewust onderscheid: wanneer functioneert de Outlaw als correctiemechanisme voor het systeem, en wanneer als rechtvaardiging voor eigen wil? De Outlaw als brandstof zegt: dit systeem klopt niet, ik breek het om iets beters te bouwen. De Outlaw als schaduw zegt: dit systeem staat mij in de weg. Het groeipad ligt in het herkennen van dit verschil — in het moment zelf.',
    shadowTensionEn: 'Within this model the shadow of the Ruler is the Outlaw — and in this case that is at the same time the Support archetype. This makes the shadow position exceptional: the Outlaw energy is not repressed but partly integrated as a strategic instrument.\n\nThe Polarization Index suggests an active integration: the Outlaw score is high enough to function as Support, but the Ruler core still dominates. That places it in the 30–60% gap — healthy tension, not suppression.\n\nWhat the shadow asks for here is not more Outlaw energy. It asks for a conscious distinction: when does the Outlaw function as a correction mechanism for the system, and when as a justification for your own will? The Outlaw as fuel says: this system is wrong, I break it to build something better. The Outlaw as shadow says: this system is in my way. The path of growth lies in recognising that difference — in the moment itself.',
    element: 'Aarde',
    elementEn: 'Earth',
    color: '#fbbf24',
    traits: ['Logica', 'Traditie', 'Geduld'],
    traitsEn: ['Logic', 'Tradition', 'Patience'],
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
    motivationEn: 'Trust, purity, keeping or finding paradise',
    positive: 'Hoop, onvoorwaardelijke openheid, pure vreugde',
    positiveEn: 'Hope, unconditional openness, pure joy',
    description: 'Puur, vertrouwend en open. De Innocent behoudt het fundamentele vertrouwen in de wereld en benadert het leven met pure hoop.',
    descriptionEn: 'Pure, trusting and open. The Innocent maintains fundamental trust in the world and approaches life with pure hope.',
    shadow: 'Naïviteit, slachtofferrol, de weigering om gevaar of complexiteit onder ogen te zien',
    shadowEn: 'Naivety, the victim role, the refusal to face danger or complexity',
    complementaryPartner: 'EXPLORER',
    shadowPartner: 'MAGICIAN',
    complementaryAxis: 'Zuiverheid & Vrijheid (Hoge Openness): De Innocent behoudt het fundamentele vertrouwen in de wereld; de Explorer gebruikt dit vertrouwen om zonder angst nieuwe horizonten te ontdekken.',
    complementaryAxisEn: 'Purity & Freedom (High Openness): The Innocent keeps the fundamental trust in the world; the Explorer uses that trust to discover new horizons without fear.',
    shadowTension: 'Pure acceptatie vs. Transformatie: De Innocent vertrouwt naïef en ondergaat de realiteit zoals die is; de Magician vult de schaduw door de Innocent de wilskracht te geven om de realiteit actief naar eigen hand te zetten.',
    shadowTensionEn: 'Pure acceptance vs. Transformation: The Innocent trusts naively and undergoes reality as it is; the Magician fills the shadow by giving the Innocent the willpower to actively shape reality.',
    element: 'Licht',
    elementEn: 'Light',
    color: '#f0fdf4',
    traits: ['Spirit', 'Gemeenschap', 'Reflectie'],
    traitsEn: ['Spirit', 'Community', 'Reflection'],
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
    motivationEn: 'Absolute freedom, discovery, authenticity',
    positive: 'Avontuur, grensverleggende nieuwsgierigheid, onafhankelijkheid',
    positiveEn: 'Adventure, boundary-pushing curiosity, independence',
    description: 'Nieuwsgierig, onafhankelijk en altijd op zoek naar het onbekende. De Explorer brengt de dynamiek van de reis en zoekt grenzeloze horizonten.',
    descriptionEn: 'Curious, independent and always seeking the unknown. The Explorer brings the dynamics of the journey and seeks boundless horizons.',
    shadow: 'Doelloos ronddwalen, een onvermogen om zich te binden, diepe sociale isolatie',
    shadowEn: 'Aimless wandering, an inability to commit, deep social isolation',
    complementaryPartner: 'INNOCENT',
    shadowPartner: 'HERO',
    complementaryAxis: 'Zuiverheid & Vrijheid (Hoge Openness): De Explorer brengt de dynamiek van de reis; de Innocent zorgt ervoor dat de ontdekker zich overal verwondert en nergens cynisch wordt.',
    complementaryAxisEn: 'Purity & Freedom (High Openness): The Explorer brings the dynamics of the journey; the Innocent makes sure the explorer keeps wondering everywhere and turns cynical nowhere.',
    shadowTension: 'Vrijheid vs. Gedisciplineerde verovering: De Explorer vermijdt binding om te dwalen; de Hero leert dat werkelijke impact eist dat je een doel kiest en obstakels overwint.',
    shadowTensionEn: 'Freedom vs. Disciplined conquest: The Explorer avoids commitment in order to roam; the Hero teaches that real impact demands choosing a goal and overcoming obstacles.',
    element: 'Lucht',
    elementEn: 'Air',
    color: '#06b6d4',
    traits: ['Innovatie', 'Actie', 'Bewustzijn'],
    traitsEn: ['Innovation', 'Action', 'Awareness'],
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
    motivationEn: 'Revolution, liberation, telling the radical truth',
    positive: 'Authenticiteit, het vermogen om corrupte systemen te doorbreken',
    positiveEn: 'Authenticity, the ability to break through corrupt systems',
    description: 'Binnen dit model wordt de Outlaw geassocieerd met het Salience Network — de detector van wat urgent, onrechtvaardig of onecht is. Modelterm, geen klinisch gegeven.\n\nDe Outlaw-energie vult de Ruler niet aan — zij daagt hem uit. Waar de Ruler consolideert, wil de Outlaw weten of het systeem de waarheid dient of zichzelf. Dit creëert een intern spanningsveld dat in dit model als productieve frictie gelezen wordt.',
    descriptionEn: 'Within this model the Outlaw is associated with the Salience Network — the detector of what is urgent, unjust or inauthentic. A model term, not a clinical fact.\n\nThe Outlaw energy does not complement the Ruler — it challenges him. Where the Ruler consolidates, the Outlaw wants to know whether the system serves the truth or itself. This creates an internal field of tension that within this model is read as productive friction.',
    shadow: 'Zinloze destructie, diep cynisme, chronische rebellie die leidt tot vervreemding',
    shadowEn: 'Pointless destruction, deep cynicism, chronic rebellion that leads to alienation',
    complementaryPartner: 'TRICKSTER',
    shadowPartner: 'RULER',
    complementaryAxis: 'Disruptie & Waarheid (Salience Network): De Outlaw breekt een stagnerend systeem fysiek af; de Trickster breekt de onderliggende ego\'s en regels af door middel van radicale absurditeit.',
    complementaryAxisEn: 'Disruption & Truth (Salience Network): The Outlaw physically tears down a stagnating system; the Trickster tears down the underlying egos and rules through radical absurdity.',
    shadowTension: 'Paarse Lijn Verbinding — Main en Support zijn 180° tegenpolen: de Ruler (positie 12) en de Outlaw (positie 6) staan diametraal tegenover elkaar op het wiel. Binnen dit model is dit geen conflict maar een schaduw-integratie in actieve vorm: de Outlaw is zowel Support-archetype als schaduw. Dit suggereert actief werken met de energie die de meeste Rulers vermijden — maar het vraagt constante bewuste navigatie om niet te oscilleren tussen overcontrole en destructie.',
    shadowTensionEn: 'Purple Line Connection — Main and Support are 180° opposites: the Ruler (position 12) and the Outlaw (position 6) stand diametrically opposed on the wheel. Within this model that is not a conflict but shadow integration in active form: the Outlaw is both Support archetype and shadow. This suggests actively working with the energy most Rulers avoid — but it demands constant conscious navigation to avoid oscillating between overcontrol and destruction.',
    element: 'Vuur',
    elementEn: 'Fire',
    color: '#f97316',
    traits: ['Actie', 'Veerkracht', 'Innovatie'],
    traitsEn: ['Action', 'Resilience', 'Innovation'],
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
    motivationEn: 'Compassion, protection, service to the other',
    positive: 'Vrijgevigheid, genezing, onvoorwaardelijke steun',
    positiveEn: 'Generosity, healing, unconditional support',
    description: 'Zorgzaam, beschermend en altruïstisch. De Caregiver creëert een veilige thuishaven via oxytocine-gedreven zorginstinct.',
    descriptionEn: 'Caring, protective and altruistic. The Caregiver creates a safe haven through oxytocin-driven care instinct.',
    shadow: 'Martelaarschap, het ongewild faciliteren van zwakte (enabling), onderdrukte wrok',
    shadowEn: 'Martyrdom, unintentionally enabling weakness, suppressed resentment',
    complementaryPartner: 'LOVER',
    shadowPartner: 'ARTIST',
    complementaryAxis: 'Emotionele Fusie (Limbic Coupling): De Caregiver creëert een veilige thuishaven; de Lover vult deze haven met intimiteit, schoonheid en diepe affectie.',
    complementaryAxisEn: 'Emotional Fusion (Limbic Coupling): The Caregiver creates a safe haven; the Lover fills that haven with intimacy, beauty and deep affection.',
    shadowTension: 'Dienstbaarheid vs. Zelfexpressie: De Caregiver offert de eigen identiteit op voor de groep; de Artist herinnert de Caregiver eraan dat het eigen ego en persoonlijke expressie ook bestaansrecht hebben.',
    shadowTensionEn: 'Service vs. Self-expression: The Caregiver sacrifices their own identity for the group; the Artist reminds the Caregiver that their own ego and personal expression have a right to exist too.',
    element: 'Water',
    elementEn: 'Water',
    color: '#22d3ee',
    traits: ['Empathie', 'Gemeenschap', 'Geduld'],
    traitsEn: ['Empathy', 'Community', 'Patience'],
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
    motivationEn: 'Esoteric transformation, paradigm shift, manifestation',
    positive: 'Alchemie, ongekende innovatie, het hervormen van de realiteit',
    positiveEn: 'Alchemy, unprecedented innovation, reshaping reality',
    description: 'Transformatief, visionair en in staat om de werkelijkheid te veranderen. De Magician ontwerpt de esoterische visie om de realiteit te buigen.',
    descriptionEn: 'Transformative, visionary and able to change reality. The Magician designs the esoteric vision to bend reality.',
    shadow: 'Complexe manipulatie, god-complex, verlies van verbinding met materiële consequenties',
    shadowEn: 'Complex manipulation, god complex, loss of connection with material consequences',
    complementaryPartner: 'HERO',
    shadowPartner: 'INNOCENT',
    complementaryAxis: 'Transformatie door Wilskracht (Extraversie): De Magician ontwerpt de esoterische visie om de realiteit te buigen; de Hero levert de pure, gedisciplineerde actie om het uit te voeren.',
    complementaryAxisEn: 'Transformation through Willpower (Extraversion): The Magician designs the esoteric vision to bend reality; the Hero delivers the pure, disciplined action to carry it out.',
    shadowTension: 'Constante alchemie vs. Puur vertrouwen: De Magician manipuleert constant de realiteit; de Innocent is de schaduw die leert hoe controle los te laten en onvoorwaardelijke rust te vinden.',
    shadowTensionEn: 'Constant alchemy vs. Pure trust: The Magician manipulates reality constantly; the Innocent is the shadow that teaches how to let go of control and find unconditional rest.',
    element: 'Quintessence',
    elementEn: 'Quintessence',
    color: '#eab308',
    traits: ['Intuïtie', 'Spirit', 'Veerkracht'],
    traitsEn: ['Intuition', 'Spirit', 'Resilience'],
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
    motivationEn: 'Objective truth, systemic integrity, strict justice',
    positive: 'Eerlijkheid, structurele evaluatie, moreel gewicht',
    positiveEn: 'Fairness, structural evaluation, moral weight',
    description: 'Rechtvaardig, principieel en moreel scherp. De Judge levert het morele oordeel en de wet via het Central Executive Network.',
    descriptionEn: 'Just, principled and morally sharp. The Judge delivers moral judgment and law through the Central Executive Network.',
    shadow: 'Draconische rigiditeit, meedogenloosheid, absolute emotionele onthechting',
    shadowEn: 'Draconian rigidity, ruthlessness, absolute emotional detachment',
    complementaryPartner: 'RULER',
    shadowPartner: 'TRICKSTER',
    complementaryAxis: 'Systeem & Objectiviteit (CEN Dominantie): De Judge levert het morele oordeel en de wet; de Ruler biedt de autoriteit en structuur om deze wet te handhaven.',
    complementaryAxisEn: 'System & Objectivity (CEN dominance): The Judge delivers the moral verdict and the law; the Ruler provides the authority and the structure to uphold that law.',
    shadowTension: 'Objectieve ernst vs. Relativerende absurditeit: De Judge neemt de wetten loodzwaar; de Trickster vult de schaduw door de chaos toe te laten en te laten zien dat niet alles perfect gereguleerd hoeft te worden.',
    shadowTensionEn: 'Objective gravity vs. Relativising absurdity: The Judge takes the laws deadly seriously; the Trickster fills the shadow by letting the chaos in and showing that not everything has to be perfectly regulated.',
    element: 'Aarde',
    elementEn: 'Earth',
    color: '#8b5cf6',
    traits: ['Logica', 'Traditie', 'Bewustzijn'],
    traitsEn: ['Logic', 'Tradition', 'Awareness'],
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
    motivationEn: 'Joy, absurdity, disrupting rigid structures and egos',
    positive: 'Speelsheid, snelle sociale disruptie, briljant perspectief',
    positiveEn: 'Playfulness, rapid social disruption, brilliant perspective',
    description: 'Binnen dit model is de Trickster de structurele blinde vlek van de Ruler. De Rode Lijn genereert geen punten en geen bleed — wat betekent dat de Trickster-energie buiten het gezichtsveld opereert.\n\nHet is aannemelijk dat gedrag gekenmerkt door speelse ambiguïteit, bewuste onbetrouwbaarheid of het gebruik van humor als machtsinstrument onbewust een sterke reactie triggert. Waar de Outlaw de structuur aanvalt met reden, ondermijnt de Trickster haar zonder aanwijsbare logica — en dat is precies wat de Ruler niet kan plaatsen.\n\nIn sociale interacties betekent dit: mensen die inconsistent zijn kunnen weerstand oproepen die groter is dan de situatie rechtvaardigt. De blindspot-check is hier relevant: wanneer iemand als \'onbetrouwbaar\' of \'niet serieus\' gelabeld wordt — klopt dat, of ontgaat je de intelligentie achter hun spel?',
    descriptionEn: 'Within this model the Trickster is the structural blind spot of the Ruler. The Red Line generates no points and no bleed — which means that Trickster energy operates outside the field of view.\n\nIt is plausible that behaviour marked by playful ambiguity, deliberate unreliability or the use of humour as an instrument of power unconsciously triggers a strong reaction. Where the Outlaw attacks the structure for a reason, the Trickster undermines it without any traceable logic — and that is precisely what the Ruler cannot place.\n\nIn social interactions this means: people who are inconsistent can provoke resistance greater than the situation warrants. The blindspot check is relevant here: when someone is labelled ‘unreliable’ or ‘not serious’ — is that accurate, or are you missing the intelligence behind their play?',
    shadow: 'Frivoliteit, wreedheid, de "sad clown" paradox (het maskeren van diepe interne pijn)',
    shadowEn: 'Frivolity, cruelty, the "sad clown" paradox (masking deep inner pain)',
    complementaryPartner: 'OUTLAW',
    shadowPartner: 'JUDGE',
    complementaryAxis: 'Disruptie & Waarheid (Salience Network): De Trickster legt met humor de hypocrisie bloot; de Outlaw zet deze inzichten om in een daadwerkelijke opstand.',
    complementaryAxisEn: 'Disruption & Truth (Salience Network): The Trickster exposes hypocrisy with humour; the Outlaw turns those insights into an actual uprising.',
    shadowTension: 'Absurditeit vs. Morele weging: De Trickster drijft overal de spot mee; de Judge zorgt ervoor dat deze humor niet wegglijdt in toxisch nihilisme, maar wordt verankerd in fundamentele waarden.',
    shadowTensionEn: 'Absurdity vs. Moral weighing: The Trickster mocks everything; the Judge makes sure that this humour does not slide into toxic nihilism, but stays anchored in fundamental values.',
    element: 'Lucht',
    elementEn: 'Air',
    color: '#f472b6',
    traits: ['Innovatie', 'Bewustzijn', 'Spirit'],
    traitsEn: ['Innovation', 'Awareness', 'Spirit'],
  },
};

/**
 * Archetype Functional Groups — Neurale Zuilen (Biological Support Groups).
 * Each group maps to a specific neural network and contains two complementary
 * archetypes that together form a complete biological axis.
 * When both appear as Main + Support, the Harmony Bonus (+69) is triggered.
 */
export const ARCHETYPE_GROUPS = {
  'Ruling':     { archetypeA: 'JUDGE',     archetypeB: 'RULER',    axis: 'Systeem & Objectiviteit',        axisEn: 'System & Objectivity', neuralBasis: 'CEN Dominantie' },
  'Relational': { archetypeA: 'LOVER',     archetypeB: 'CAREGIVER', axis: 'Emotionele Fusie',              axisEn: 'Emotional Fusion', neuralBasis: 'Limbic Coupling' },
  'Seeker':     { archetypeA: 'INNOCENT',  archetypeB: 'EXPLORER', axis: 'Zuiverheid & Vrijheid',          axisEn: 'Purity & Freedom', neuralBasis: 'Hoge Openness' },
  'Chaos':      { archetypeA: 'OUTLAW',    archetypeB: 'TRICKSTER', axis: 'Disruptie & Waarheid',          axisEn: 'Disruption & Truth', neuralBasis: 'Salience Network' },
  'Abstract':   { archetypeA: 'SAGE',      archetypeB: 'ARTIST',   axis: 'Interne Reflectie',              axisEn: 'Internal Reflection', neuralBasis: 'DMN Hyper-connectie' },
  'Agency':     { archetypeA: 'MAGICIAN',  archetypeB: 'HERO',     axis: 'Transformatie door Wilskracht',  axisEn: 'Transformation through Willpower', neuralBasis: 'Extraversie/Wilskracht' },
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

/**
 * Language-aware field accessor. Returns the `<field>En` variant when lang is
 * 'en' and that variant exists; otherwise the Dutch original.
 * @param {Object|string} archetype — archetype object or its key ("SAGE")
 * @param {string} field — base (Dutch) field name, e.g. 'motivation' or 'traits'
 * @param {string} [lang='nl'] — 'nl' | 'en'
 * @returns {*}
 */
export function archetypeField(archetype, field, lang = 'nl') {
  const a = typeof archetype === 'string' ? ARCHETYPES[archetype] : archetype;
  if (!a || !field) return undefined;
  if (lang !== 'en' && lang !== 'EN') return a[field];
  const en = a[`${field}En`];
  if (en === undefined || en === null || en === '') return a[field];
  if (Array.isArray(en) && en.length === 0) return a[field];
  return en;
}

/**
 * Language-aware accessor for ARCHETYPE_GROUPS fields (e.g. 'axis').
 * @param {string} groupKey — 'Ruling' | 'Relational' | ...
 * @param {string} field
 * @param {string} [lang='nl']
 * @returns {*}
 */
export function archetypeGroupField(groupKey, field, lang = 'nl') {
  const g = ARCHETYPE_GROUPS[groupKey];
  if (!g || !field) return undefined;
  if (lang !== 'en' && lang !== 'EN') return g[field];
  const en = g[`${field}En`];
  return (en === undefined || en === null || en === '') ? g[field] : en;
}
