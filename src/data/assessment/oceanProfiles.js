/**
 * OCEAN (Big Five) Personality Profiles — Core & Extended Archetypes
 *
 * Neurobiological Framework (180° Individuation Model)
 *
 * 1. CORE_ARCHETYPE_PROFILES (12 entries)
 *    Deep psychological portrait for each of the 12 Jungian archetypes.
 *    Includes: OCEAN scores (1–10), workplace superpower, conflict style,
 *    attachment/relationship pattern, 180° shadow integration path, neural basis.
 *
 * 2. EXTENDED_ARCHETYPE_OCEAN (72 entries)
 *    OCEAN dimension ratings for every Main × SupportGroup combination.
 *    Harmony (+69) = Main's own group matches the Support group.
 *    Each entry includes neuroticismTrigger — the specific biological stress
 *    boundary where the dominant neural network overloads.
 *
 * OCEAN Dimensions:
 *   O = Openness to Experience (Openheid)
 *   C = Conscientiousness (Consciëntieusheid)
 *   E = Extraversion (Extraversie)
 *   A = Agreeableness (Inschikkelijkheid)
 *   N = Neuroticism (Neuroticisme)
 *
 * Rating Scale (text → numeric):
 *   Extreem Laag     = 1
 *   Zeer Laag        = 2
 *   Laag             = 3
 *   Laag-Gemiddeld   = 3
 *   Gemiddeld-Laag   = 4
 *   Gemiddeld        = 5
 *   Gemiddeld-Hoog   = 6
 *   Hoog             = 7
 *   Zeer Hoog        = 8
 *   Extreem Hoog     = 9
 *   Uitzonderlijk    = 10
 *
 * 180° Shadow Pairs (Individuation):
 *   Judge(1) ↔ Trickster(7)    — CEN ↔ Salience
 *   Lover(2) ↔ Sage(8)         — Limbic ↔ DMN
 *   Caregiver(3) ↔ Artist(9)   — Limbic ↔ DMN
 *   Innocent(4) ↔ Magician(10) — Openness ↔ Agency
 *   Explorer(5) ↔ Hero(11)     — Openness ↔ Agency
 *   Outlaw(6) ↔ Ruler(12)      — Salience ↔ CEN
 *
 * Support Groups (Neurobiological):
 *   RULING     = CEN Dominantie (Judge, Ruler)
 *   RELATIONAL = Limbic Coupling (Lover, Caregiver)
 *   SEEKER     = Hoge Openness (Innocent, Explorer)
 *   CHAOS      = Salience Network (Outlaw, Trickster)
 *   ABSTRACT   = DMN Hyper-connectie (Sage, Artist)
 *   AGENCY     = Extraversie/Wilskracht (Magician, Hero)
 */

// ═══════════════════════════════════════════════════════════════════
// 1. CORE ARCHETYPE PROFILES — 12 Deep Psychological Portraits
// ═══════════════════════════════════════════════════════════════════

export const CORE_ARCHETYPE_PROFILES = {

  // ── I. De Rechter (Positie 1) ─────────────────────────────────
  JUDGE: {
    name: 'The Judge',
    dutchName: 'De Rechter',
    position: 1,
    group: 'RULING',
    shadow: 'TRICKSTER',
    neuralBasis: 'Central Executive Network (CEN) — analytisch oordeel & regelgebaseerde verwerking',
    ocean: { O: 4, C: 9, E: 4, A: 3, N: 3 },
    oceanSummary: 'Uitzonderlijk Hoge Conscientiousness, Lage Agreeableness — de ethische scheidsrechter die vertrouwt op precedenten, logica en vastgelegde ethische kaders.',
    workplaceSuperpower: 'Objectieve Integriteit: ongeëvenaard onderscheidingsvermogen. Biedt morele helderheid in \'grijze gebieden\' en beschermt de organisatie tegen structurele corruptie of integriteitsfouten.',
    conflictStyle: 'De rechtszaal. Conflicten worden opgelost door feiten te verzamelen, emotionele bias te verwijderen en een uitspraak te doen op basis van wat objectief eerlijk is.',
    relationshipPattern: 'Veilig maar Afstandelijk. Loyale partner die dezelfde integriteit van anderen verwacht. Worstelt met het bieden van warme, onvoorwaardelijke emotionele steun. Valkuil: behandelt de partner als verdachte in een kruisverhoor — vergeet dat relaties genade en vergeving nodig hebben, niet alleen rechtvaardigheid.',
    individuationPath: 'De Paradox van Ernst vs. Absurditeit — integratie van De Nar (7). De \'switch\' naar de Nar activeert het Salience Network om de absurditeit van rigide systemen in te zien. Leer dat een oordeel \'objectief eerlijk\' kan zijn maar toch menselijk lijden veroorzaakt. Door relativerende humor en chaos toe te laten, voorkom je dat integriteit een kil, steriel wapen wordt. Genade meewegen in de berekening van rechtvaardigheid.',
  },

  // ── II. De Minnaar (Positie 2) ────────────────────────────────
  LOVER: {
    name: 'The Lover',
    dutchName: 'De Minnaar',
    position: 2,
    group: 'RELATIONAL',
    shadow: 'SAGE',
    neuralBasis: 'Limbic Coupling — diepe emotionele resonantie & spiegelneuronen',
    ocean: { O: 7, C: 4, E: 7, A: 9, N: 7 },
    oceanSummary: 'Uitzonderlijk Hoge Agreeableness, Hoge Openness & Extraversion — de emotionele verbinder met grenzeloze empathie.',
    workplaceSuperpower: 'Empathie & Eenheid: scant een kamer en kent direct de emotionele temperatuur. Fungeert als de ultieme verbinder die verschillende facties samenbrengt en collega\'s zich gezien laat voelen.',
    conflictStyle: 'Vermijding of totale aanpassing. Ziet conflict als bedreiging voor de verbinding en onderdrukt eigen behoeften om de vrede te herstellen.',
    relationshipPattern: 'Angstig-Gepreoccupeerd. Monitort de relatie constant op tekenen van disconnectie — een vertraagde reactie kan al een paniekrespons triggeren. Valkuil (Codependentie): gaat volledig op in de ander en verliest eigen identiteit om de liefde niet te verliezen.',
    individuationPath: 'De Paradox van Emotie vs. Ratio — integratie van De Wijze (8). De \'switch\' naar de Wijze activeert de onthechte, analytische DMN-focus. Leer emotionele afstand te nemen en objectief te blijven zonder het hart te sluiten. Ware intimiteit vereist twee afzonderlijke individuen. Transformeer van \'emotionele spons\' naar bewuste navigator die voelt met diepgang maar handelt met intellectuele helderheid.',
  },

  // ── III. De Verzorger (Positie 3) ─────────────────────────────
  CAREGIVER: {
    name: 'The Caregiver',
    dutchName: 'De Verzorger',
    position: 3,
    group: 'RELATIONAL',
    shadow: 'ARTIST',
    neuralBasis: 'Limbic Coupling — oxytocine-gedreven zorginstinct & empathische resonantie',
    ocean: { O: 5, C: 7, E: 5, A: 9, N: 7 },
    oceanSummary: 'Uitzonderlijk Hoge Agreeableness, Hoge Conscientiousness — de beschermende nurturer met grenzeloze vrijgevigheid.',
    workplaceSuperpower: 'Beschermende Empathie: uniek vermogen om hiërarchieën te scannen op mensen die buiten de boot vallen. Zorgt ervoor dat het menselijke element niet verloren gaat in winstmarges.',
    conflictStyle: 'Totale aanpassing. Om anderen geen pijn te doen, negeert eigen behoeften en absorbeert de schade zelf.',
    relationshipPattern: 'Angstig-Gepreoccupeerd. Vindt waarde in het \'nodig zijn\' en zoekt partners die \'gered\' moeten worden. Valkuil (Resentment): geeft zoveel en vraagt zo weinig dat onvermijdelijk leegte volgt. Vrijgevigheid slaat om in diepe, stille wrok wanneer onuitgesproken behoeften te lang worden genegeerd.',
    individuationPath: 'De Paradox van Dienstbaarheid vs. Zelfexpressie — integratie van De Kunstenaar (9). De \'switch\' naar de Kunstenaar activeert DMN-hyperfocus op subjectiviteit en de eigen binnenwereld. Erken dat je eigen ego en subjectieve schoonheid bestaansrecht hebben. Zelfexpressie is geen egoïsme maar een noodzakelijke balans om martelaarschap te voorkomen. Transformeer zorg van verplichting naar bewuste, creatieve daad.',
  },

  // ── IV. De Onschuldige (Positie 4) ────────────────────────────
  INNOCENT: {
    name: 'The Innocent',
    dutchName: 'De Onschuldige',
    position: 4,
    group: 'SEEKER',
    shadow: 'MAGICIAN',
    neuralBasis: 'Hoge Openness — vertrouwen als neurologisch uitgangspunt, lage threat-detectie',
    ocean: { O: 7, C: 6, E: 5, A: 9, N: 3 },
    oceanSummary: 'Uitzonderlijk Hoge Agreeableness, Hoge Openness — het zuivere vertrouwen. Grenzeloze hoop maar lage openheid voor de donkere kanten.',
    workplaceSuperpower: 'Hoop & Veerkracht: fungeert als anker van licht en optimisme in een cynische werkomgeving. Veert op na tegenslagen met bijna kinderlijke veerkracht.',
    conflictStyle: 'Vermijding door ontkenning. Doet letterlijk alsof een conflict niet bestaat om de illusie van een gelukkig team in stand te houden.',
    relationshipPattern: 'Angstig-leunend. Zoekt een \'hof van Eden\' met onvoorwaardelijk vertrouwen. Zeer toegewijd maar afhankelijk van partner voor gevoel van veiligheid. Valkuil (Eeuwige Ontkenning): weigert destructief partnergedrag te zien — focust op de weinige goede momenten om het \'paradijs\' niet te verliezen.',
    individuationPath: 'De Paradox van Acceptatie vs. Transformatie — integratie van De Magiër (10). De \'switch\' naar de Magiër activeert de actieve \'Aanpak-modus\' om de realiteit te buigen. Puur vertrouwen wordt pas echt krachtig als het gepaard gaat met de wil om te veranderen. Transformeer van passief slachtoffer van \'het lot\' naar bewuste schepper die innerlijke zuiverheid gebruikt als blauwdruk voor werkelijke verandering.',
  },

  // ── V. De Ontdekker (Positie 5) ───────────────────────────────
  EXPLORER: {
    name: 'The Explorer',
    dutchName: 'De Ontdekker',
    position: 5,
    group: 'SEEKER',
    shadow: 'HERO',
    neuralBasis: 'Hoge Openness — noviteitszoekend neuraal systeem, dopamine-gedreven verkenning',
    ocean: { O: 9, C: 3, E: 6, A: 4, N: 4 },
    oceanSummary: 'Uitzonderlijk Hoge Openness, Lage Conscientiousness — de grenzeloze ontdekker met onverzadigbare nieuwsgierigheid.',
    workplaceSuperpower: 'Grenzen Verleggen: perfekte persoon om ongeteste markten te verkennen. Navigeert moeiteloos door onbekend terrein buiten de normale hiërarchieën om.',
    conflictStyle: 'Vlucht. Wanneer kantoorpolitiek te verstikkend wordt, neemt fysiek of emotioneel afstand of neemt ontslag.',
    relationshipPattern: 'Afwijzend-Vermijdend. Associeert toewijding met gevangenschap — zoekt een co-piloot, geen anker. Valkuil (Emotionele Vlucht): wanneer emotionele intimiteit te \'zwaar\' wordt, boekt een soloreis of wordt onbereikbaar om autonomie te beschermen.',
    individuationPath: 'De Paradox van Vrijheid vs. Discipline — integratie van De Held (11). De \'switch\' naar de Held activeert de laserfocus van de \'Aanpak-modus\'. Werkelijke vrijheid is niet het gebrek aan muren maar het vermogen een doel te kiezen en ervoor te vechten. Transformeer van doelloze zwerver naar doelgerichte navigator die ontdekkingsdrift inzet voor een grotere missie.',
  },

  // ── VI. De Rebel (Positie 6) ──────────────────────────────────
  OUTLAW: {
    name: 'The Outlaw',
    dutchName: 'De Rebel',
    position: 6,
    group: 'CHAOS',
    shadow: 'RULER',
    neuralBasis: 'Salience Network — hypervigilant threat-detectie, anti-autoritair response systeem',
    ocean: { O: 7, C: 3, E: 6, A: 1, N: 7 },
    oceanSummary: 'Extreem Lage Agreeableness, Hoge Openness, Hoge Neuroticism — de systeembreker gedreven door woede over corruptie.',
    workplaceSuperpower: 'Absolute Authenticiteit: ultieme katalysator voor verandering. Waar anderen beleefd door een toxische cultuur navigeren, benoemt de Rebel de hypocrisie direct en publiekelijk.',
    conflictStyle: 'Confrontatie en escalatie. Wil niet bemiddelen maar de lelijke waarheid blootleggen en de machtsdynamiek radicaal verschuiven.',
    relationshipPattern: 'Afwijzend-Vermijdend. Bewaakt autonomie fel — traditionele relatievormen worden vaak gezien als valstrik. Valkuil (Destructieve Sabotage): wanneer gevangen, blaast de relatie op met provocaties om vrijheid terug te winnen en cynisme te bevestigen.',
    individuationPath: 'De Paradox van Vernieling vs. Constructie — integratie van De Heerser (12). De \'switch\' naar de Heerser activeert het vermogen om orde en structuur te creëren. Een revolutie is pas geslaagd als er iets beters voor in de plaats komt. Transformeer van anarchist die alleen vernietigt naar soevereine leider die disruptie gebruikt als instrument voor evolutie, niet als einddoel.',
  },

  // ── VII. De Nar (Positie 7) ───────────────────────────────────
  TRICKSTER: {
    name: 'The Trickster',
    dutchName: 'De Nar',
    position: 7,
    group: 'CHAOS',
    shadow: 'JUDGE',
    neuralBasis: 'Salience Network + Lateraal Denken — patroonbreking, humor als cognitief wapen',
    ocean: { O: 9, C: 2, E: 7, A: 4, N: 4 },
    oceanSummary: 'Uitzonderlijk Hoge Openness, Zeer Lage Conscientiousness, Hoge Extraversion — de kosmische grappenmaker met vloeiend perspectief.',
    workplaceSuperpower: 'Vitaal Perspectief: doorbreekt paniek in een team met een perfect getimede grap, waardoor spanning wegvalt en iedereen weer helder kan denken.',
    conflictStyle: 'Afleiding. Maakt een grap om van onderwerp te veranderen in plaats van de \'saaie\' administratieve realiteit van een conflict onder ogen te zien.',
    relationshipPattern: 'Afwijzend-Vermijdend leunend. Magnetisch en leuk om te daten, maar houdt partners op afstand omdat echte intimiteit gevaarlijker voelt dan optreden. Valkuil (Wrede Humor): in schaduwstaat kan scherpe humor als wapen worden gebruikt om onzekerheden van partner te bespotten onder het mom van "een grapje".',
    individuationPath: 'De Paradox van Absurditeit vs. Morele Weging — integratie van De Rechter (1). De \'switch\' naar de Rechter activeert de CEN-modus voor objectieve evaluatie en morele ernst. Humor niet langer gebruiken om de waarheid te ontwijken maar om deze te onthullen. Transformeer van clown die alleen voor de lach leeft naar visionair die humor als chirurgisch instrument gebruikt om hypocrisie bloot te leggen met een diep gevoel voor integriteit.',
  },

  // ── VIII. De Wijze (Positie 8) ────────────────────────────────
  SAGE: {
    name: 'The Sage',
    dutchName: 'De Wijze',
    position: 8,
    group: 'ABSTRACT',
    shadow: 'LOVER',
    neuralBasis: 'Default Mode Network (DMN) — zelfreflectie, abstracte kennisverwerving, metacognitie',
    ocean: { O: 9, C: 6, E: 3, A: 4, N: 5 },
    oceanSummary: 'Uitzonderlijk Hoge Openness, Lage Extraversion — de contemplatieve kenner met diepe behoefte informatie te consumeren en systemen te begrijpen.',
    workplaceSuperpower: 'Helderheid & Onthechting: blijft kalm in crisis. Treedt terug om data te analyseren en komt met briljant simpel inzicht dat door de ruis heen snijdt.',
    conflictStyle: 'Academisch debat. Probeert alle emoties uit het conflict te strippen en de logische fout in het argument van de tegenpartij te vinden.',
    relationshipPattern: 'Afwijzend-Vermijdend leunend. Beschermt mentale ruimte fel en trekt zich terug als partner te \'behoeftig\' of chaotisch wordt. Valkuil (De Koude Observator): behandelt partner soms als fascinerend studieobject in plaats van gelijke — mist de emotionele behoefte aan nabijheid door deze rationeel te verklaren.',
    individuationPath: 'De Paradox van Observatie vs. Participatie — integratie van De Minnaar (2). De \'switch\' naar de Minnaar dwingt het brein om het hart en het lichaam in te zetten voor participatie. Laat de angst voor de \'onlogische\' emotie los. Transformeer van eenzame bewoner van een ivoren toren naar verlichte mentor wiens diepe wijsheid tot leven komt door menselijke verbinding en resonantie.',
  },

  // ── IX. De Kunstenaar (Positie 9) ─────────────────────────────
  ARTIST: {
    name: 'The Artist',
    dutchName: 'De Kunstenaar',
    position: 9,
    group: 'ABSTRACT',
    shadow: 'CAREGIVER',
    neuralBasis: 'Default Mode Network (DMN) — verbeeldingskracht, esthetische verwerking, creatieve synthese',
    ocean: { O: 9, C: 4, E: 5, A: 5, N: 7 },
    oceanSummary: 'Uitzonderlijk Hoge Openness, Hoge Neuroticism — de gevoelige schepper die de wereld ervaart als canvas van oneindig potentieel.',
    workplaceSuperpower: 'Alchemie & Potentie: ziet potentieel waar anderen leegte zien. Behandelt fouten als onverwachte wendingen die leiden tot prachtige nieuwe creaties.',
    conflictStyle: 'Subjectief. Vat kritiek op werk op als directe kritiek op de ziel en trekt zich bij stress terug in eigen wereld.',
    relationshipPattern: 'Angstig-Vermijdend leunend. Verlangt naar diepe inspiratie van partner maar heeft ook enorme hoeveelheden ongestructureerde eenzaamheid nodig om te creëren. Valkuil (Projectie): projecteert geïdealiseerd beeld op partner — wanneer die menselijke gebreken vertoont, volgt zware desillusie.',
    individuationPath: 'De Paradox van Subjectiviteit vs. Zorg voor de ander — integratie van De Verzorger (3). De \'switch\' naar de Verzorger trekt het brein terug naar de gemeenschap en zorg voor de ander. Creativiteit kan een doel dienen groter dan eigen expressie. Transformeer van egocentrische dromer naar genezer die esthetiek gebruikt om anderen te voeden en ondersteunen.',
  },

  // ── X. De Magiër (Positie 10) ─────────────────────────────────
  MAGICIAN: {
    name: 'The Magician',
    dutchName: 'De Magiër',
    position: 10,
    group: 'AGENCY',
    shadow: 'INNOCENT',
    neuralBasis: 'Extraversie & Wilskracht — transformatief agentschap, catalytische neurale activiteit',
    ocean: { O: 9, C: 4, E: 5, A: 4, N: 3 },
    oceanSummary: 'Uitzonderlijk Hoge Openness, Laag naar buiten toe Neuroticism — de visionair die de interface van de wereld kan veranderen.',
    workplaceSuperpower: 'Visionaire Alchemie: kan een schijnbaar onmogelijke situatie herformuleren en machtsdynamieken verschuiven om een transformatie te forceren.',
    conflictStyle: 'Realiteitsvervorming. Verandert de context van het argument zodat de ander gaat twijfelen aan de eigen perceptie van de feiten.',
    relationshipPattern: 'Afwijzend-Vermijdend leunend. Captiverend en magnetisch, maar houdt een laag van zichzelf ontoegankelijk om controle over de dynamiek te behouden. Valkuil (Het God-complex): kiest partners die \'gered\' of getransformeerd moeten worden — partner voelt zich eerder renovatieproject dan gelijke.',
    individuationPath: 'De Paradox van Transformatie vs. Acceptatie — integratie van De Onschuldige (4). De \'switch\' naar de Onschuldige activeert de \'Reflectie-modus\' van puur vertrouwen en acceptatie. Leer de controle los te laten. Ware macht komt soms voort uit overgave en onvoorwaardelijke rust in het heden. Transformeer van manipulator naar bewuste schepper.',
  },

  // ── XI. De Held (Positie 11) ──────────────────────────────────
  HERO: {
    name: 'The Hero',
    dutchName: 'De Held',
    position: 11,
    group: 'AGENCY',
    shadow: 'EXPLORER',
    neuralBasis: 'Extraversie & Wilskracht — doelgerichte actie, adrenaline-gedreven prestatie',
    ocean: { O: 4, C: 9, E: 7, A: 4, N: 3 },
    oceanSummary: 'Uitzonderlijk Hoge Conscientiousness, Hoge Extraversion, Laag Neuroticism — de moedige daadkrachtige die geest en lichaam slijpt.',
    workplaceSuperpower: 'Executie & Veerkracht: bereikt doelen die voor anderen onmogelijk lijken. Gebruikt falen als brandstof om te bewijzen dat ze wel kunnen winnen.',
    conflictStyle: 'Confrontatie en besluitvaardigheid. Wil niet bemiddelen maar winnen en verwacht dat anderen ook \'harder\' worden.',
    relationshipPattern: 'Afwijzend-Vermijdend leunend. Extreem zelfredzaam — weigert op partner te leunen omdat kwetsbaarheid als zwakte wordt gezien. Valkuil (De "Fixer"): wanneer partner emotionele steun nodig heeft, komt direct met actieplan terwijl die alleen maar gehoord wil worden.',
    individuationPath: 'De Paradox van Prestatiedruk vs. Grenzeloos Ontdekken — integratie van De Ontdekker (5). De \'switch\' naar de Ontdekker activeert de modus van grenzeloze vrijheid en dwalen zonder doel. Je waarde hangt niet alleen af van wat je presteert. Transformeer van strijder die altijd moet winnen naar legende die discipline combineert met de onbevangen nieuwsgierigheid van de Ontdekker.',
  },

  // ── XII. De Heerser (Positie 12) ──────────────────────────────
  RULER: {
    name: 'The Ruler',
    dutchName: 'De Heerser',
    position: 12,
    group: 'RULING',
    shadow: 'OUTLAW',
    neuralBasis: 'Central Executive Network (CEN) — hiërarchisch denken, strategische controle',
    ocean: { O: 4, C: 9, E: 6, A: 4, N: 3 },
    oceanSummary: 'Uitzonderlijk Hoge Conscientiousness, Gemiddeld-Hoge Extraversion — de soevereine systeembouwer en pragmaticus.',
    workplaceSuperpower: 'Structuur & Welvaart: uitzonderlijk in het creëren van stabiliteit en het omzetten van chaotische ideeën in duurzame, winstgevende realiteiten.',
    conflictStyle: 'Autoriteit. Wil geen gevoelens bemiddelen maar regels vaststellen om te voorkomen dat het conflict zich herhaalt.',
    relationshipPattern: 'Afwijzend-Vermijdend leunend naar Veilig. Toont liefde door voorziening en bescherming maar ziet emotionele kwetsbaarheid als barst in het pantser. Valkuil (De "Ondergeschikte" Dynamiek): behandelt gezinsleden soms als werknemers door opdrachten te geven in plaats van verzoeken.',
    individuationPath: 'De Paradox van Absolute Orde vs. Chaos — integratie van De Rebel (6). De \'switch\' naar de Rebel activeert het Salience Network om gestolde systemen open te breken. Een systeem dat nooit verandert, sterft uiteindelijk. Transformeer van starre tiran naar soevereine leider die orde als fundament voor vrijheid gebruikt en chaos als instrument voor evolutie.',
  },
};


// ═══════════════════════════════════════════════════════════════════
// 2. EXTENDED ARCHETYPE OCEAN — 72 Combination Profiles
// ═══════════════════════════════════════════════════════════════════

/**
 * Each entry contains:
 *   - group: Support group key
 *   - harmony: Whether Main's group matches Support group (+69 bonus)
 *   - ocean: { O, C, E, A, N } on 1-10 scale
 *   - oceanText: { O, C, E, A, N } as Dutch text ratings
 *   - neuroticismTrigger: Specific biological stress boundary description
 */
export const EXTENDED_ARCHETYPE_OCEAN = {

  // ═══════════════════════════════════════════════════════════════
  // JUDGE (Positie 1) — CEN Dominantie
  // ═══════════════════════════════════════════════════════════════
  JUDGE_RULING: {
    group: 'RULING', harmony: true,
    ocean: { O: 3, C: 9, E: 3, A: 3, N: 5 },
    oceanText: { O: 'Laag-Gemiddeld', C: 'Extreem Hoog', E: 'Laag-Gemiddeld', A: 'Laag', N: 'Gemiddeld' },
    neuroticismTrigger: 'Gestrest door het moeten oplossen van onrecht of systeemfouten.',
  },
  JUDGE_RELATIONAL: {
    group: 'RELATIONAL', harmony: false,
    ocean: { O: 7, C: 4, E: 7, A: 9, N: 6 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Gevoelig voor waargenomen afstand bij partners.',
  },
  JUDGE_SEEKER: {
    group: 'SEEKER', harmony: false,
    ocean: { O: 7, C: 6, E: 5, A: 7, N: 7 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Hoog', N: 'Hoog' },
    neuroticismTrigger: 'Psychologische basislijn is zeer gevoelig voor stagnatie in onderzoek.',
  },
  JUDGE_CHAOS: {
    group: 'CHAOS', harmony: false,
    ocean: { O: 7, C: 5, E: 5, A: 3, N: 8 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld', E: 'Gemiddeld', A: 'Laag', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Gewelddadige piek bij het ontdekken van diepe corruptie in de top.',
  },
  JUDGE_ABSTRACT: {
    group: 'ABSTRACT', harmony: false,
    ocean: { O: 9, C: 7, E: 3, A: 3, N: 7 },
    oceanText: { O: 'Extreem Hoog', C: 'Hoog', E: 'Laag', A: 'Laag-Gemiddeld', N: 'Hoog' },
    neuroticismTrigger: 'Internaliseert angst in eindeloos piekeren (rumination) over intellectuele fouten.',
  },
  JUDGE_AGENCY: {
    group: 'AGENCY', harmony: false,
    ocean: { O: 4, C: 9, E: 7, A: 3, N: 4 },
    oceanText: { O: 'Gemiddeld-Laag', C: 'Extreem Hoog', E: 'Hoog', A: 'Laag-Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Enorme stresstolerantie, maar onderdrukt stress agressief naar binnen toe.',
  },

  // ═══════════════════════════════════════════════════════════════
  // LOVER (Positie 2) — Limbic Coupling
  // ═══════════════════════════════════════════════════════════════
  LOVER_RULING: {
    group: 'RULING', harmony: false,
    ocean: { O: 5, C: 7, E: 5, A: 7, N: 6 },
    oceanText: { O: 'Gemiddeld', C: 'Hoog', E: 'Gemiddeld', A: 'Hoog', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Intern bang voor instabiliteit of het verlies van relationele kaders.',
  },
  LOVER_RELATIONAL: {
    group: 'RELATIONAL', harmony: true,
    ocean: { O: 7, C: 4, E: 7, A: 9, N: 8 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Zeer gevoelig voor waargenomen afstand van anderen en verlatingsangst.',
  },
  LOVER_SEEKER: {
    group: 'SEEKER', harmony: false,
    ocean: { O: 9, C: 3, E: 5, A: 7, N: 7 },
    oceanText: { O: 'Extreem Hoog', C: 'Laag', E: 'Gemiddeld', A: 'Hoog', N: 'Hoog' },
    neuroticismTrigger: 'Kwetsbaar voor extreme emotionele turbulentie en verlies van inspiratie.',
  },
  LOVER_CHAOS: {
    group: 'CHAOS', harmony: false,
    ocean: { O: 7, C: 3, E: 9, A: 6, N: 7 },
    oceanText: { O: 'Hoog', C: 'Laag', E: 'Extreem Hoog', A: 'Gemiddeld-Hoog', N: 'Hoog' },
    neuroticismTrigger: 'Getriggerd door relationele beknelling of verlies van authentieke expressie.',
  },
  LOVER_ABSTRACT: {
    group: 'ABSTRACT', harmony: false,
    ocean: { O: 9, C: 5, E: 3, A: 7, N: 7 },
    oceanText: { O: 'Extreem Hoog', C: 'Gemiddeld', E: 'Laag-Gemiddeld', A: 'Hoog', N: 'Hoog' },
    neuroticismTrigger: 'Internaliseert verlatingsangst in complex piekeren of spirituele onrust.',
  },
  LOVER_AGENCY: {
    group: 'AGENCY', harmony: false,
    ocean: { O: 7, C: 4, E: 9, A: 7, N: 5 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Extreem Hoog', A: 'Hoog', N: 'Gemiddeld' },
    neuroticismTrigger: 'Onderdrukt eenzaamheid agressief door constante fysieke of sociale actie.',
  },

  // ═══════════════════════════════════════════════════════════════
  // CAREGIVER (Positie 3) — Limbic Coupling
  // ═══════════════════════════════════════════════════════════════
  CAREGIVER_RULING: {
    group: 'RULING', harmony: false,
    ocean: { O: 3, C: 9, E: 6, A: 3, N: 4 },
    oceanText: { O: 'Laag-Gemiddeld', C: 'Extreem Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Rots van stabiliteit, maar intern doodsbang voor anarchie.',
  },
  CAREGIVER_RELATIONAL: {
    group: 'RELATIONAL', harmony: true,
    ocean: { O: 7, C: 3, E: 7, A: 9, N: 7 },
    oceanText: { O: 'Hoog', C: 'Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Hoog' },
    neuroticismTrigger: 'Gevoelig voor waargenomen afstand of emotionele disharmonie.',
  },
  CAREGIVER_SEEKER: {
    group: 'SEEKER', harmony: false,
    ocean: { O: 7, C: 6, E: 5, A: 9, N: 6 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Stress piekt wanneer de vrijheid van degenen die ze beschermen wordt geblokkeerd.',
  },
  CAREGIVER_CHAOS: {
    group: 'CHAOS', harmony: false,
    ocean: { O: 9, C: 3, E: 5, A: 5, N: 7 },
    oceanText: { O: 'Extreem Hoog', C: 'Laag-Gemiddeld', E: 'Gemiddeld', A: 'Gemiddeld', N: 'Hoog' },
    neuroticismTrigger: 'Zeer gevoelig voor emotionele turbulentie en tegenslagen.',
  },
  CAREGIVER_ABSTRACT: {
    group: 'ABSTRACT', harmony: false,
    ocean: { O: 7, C: 7, E: 3, A: 3, N: 7 },
    oceanText: { O: 'Hoog', C: 'Hoog', E: 'Laag', A: 'Laag-Gemiddeld', N: 'Hoog' },
    neuroticismTrigger: 'Internaliseert angst in piekeren en berekent worst-case scenario\'s.',
  },
  CAREGIVER_AGENCY: {
    group: 'AGENCY', harmony: false,
    ocean: { O: 4, C: 9, E: 7, A: 3, N: 4 },
    oceanText: { O: 'Gemiddeld-Laag', C: 'Extreem Hoog', E: 'Hoog', A: 'Laag-Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Enorme stresstolerantie, maar onderdrukt angst naar buiten toe.',
  },

  // ═══════════════════════════════════════════════════════════════
  // INNOCENT (Positie 4) — Hoge Openness
  // ═══════════════════════════════════════════════════════════════
  INNOCENT_RULING: {
    group: 'RULING', harmony: false,
    ocean: { O: 3, C: 9, E: 6, A: 3, N: 4 },
    oceanText: { O: 'Laag', C: 'Extreem Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Rots van stabiliteit, maar is intern doodsbang voor verandering.',
  },
  INNOCENT_RELATIONAL: {
    group: 'RELATIONAL', harmony: false,
    ocean: { O: 7, C: 7, E: 7, A: 9, N: 6 },
    oceanText: { O: 'Hoog', C: 'Hoog', E: 'Hoog', A: 'Extreem Hoog', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Gevoelig voor waargenomen afstand of emotionele pijn.',
  },
  INNOCENT_SEEKER: {
    group: 'SEEKER', harmony: true,
    ocean: { O: 7, C: 7, E: 5, A: 9, N: 8 },
    oceanText: { O: 'Hoog', C: 'Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Gewelddadige reactie op "fout" zijn of het idee gestraft te worden.',
  },
  INNOCENT_CHAOS: {
    group: 'CHAOS', harmony: false,
    ocean: { O: 9, C: 3, E: 5, A: 7, N: 8 },
    oceanText: { O: 'Extreem Hoog', C: 'Laag', E: 'Gemiddeld', A: 'Hoog', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Gewelddadige reactie wanneer de "bubbel" wordt doorprikt door rigide autoriteit.',
  },
  INNOCENT_ABSTRACT: {
    group: 'ABSTRACT', harmony: false,
    ocean: { O: 5, C: 7, E: 3, A: 7, N: 6 },
    oceanText: { O: 'Gemiddeld', C: 'Hoog', E: 'Laag', A: 'Hoog', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Begint onrustig de "juiste" variabelen te berekenen bij ambiguïteit.',
  },
  INNOCENT_AGENCY: {
    group: 'AGENCY', harmony: false,
    ocean: { O: 7, C: 7, E: 7, A: 5, N: 4 },
    oceanText: { O: 'Hoog', C: 'Hoog', E: 'Hoog', A: 'Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Stresstolerantie gevoed door hun doel; angst wordt niet getoond.',
  },

  // ═══════════════════════════════════════════════════════════════
  // EXPLORER (Positie 5) — Hoge Openness
  // ═══════════════════════════════════════════════════════════════
  EXPLORER_RULING: {
    group: 'RULING', harmony: false,
    ocean: { O: 3, C: 9, E: 6, A: 3, N: 4 },
    oceanText: { O: 'Laag-Gemiddeld', C: 'Extreem Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Rots van stabiliteit, maar is doodsbang voor controleverlies.',
  },
  EXPLORER_RELATIONAL: {
    group: 'RELATIONAL', harmony: false,
    ocean: { O: 7, C: 3, E: 7, A: 9, N: 6 },
    oceanText: { O: 'Hoog', C: 'Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Gevoelig voor waargenomen disconnectie of sociale afstand.',
  },
  EXPLORER_SEEKER: {
    group: 'SEEKER', harmony: true,
    ocean: { O: 9, C: 5, E: 3, A: 3, N: 6 },
    oceanText: { O: 'Extreem Hoog', C: 'Gemiddeld', E: 'Laag', A: 'Laag-Gemiddeld', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Vreest stagnatie en begint wanhopig variabelen te berekenen.',
  },
  EXPLORER_CHAOS: {
    group: 'CHAOS', harmony: false,
    ocean: { O: 9, C: 3, E: 5, A: 5, N: 7 },
    oceanText: { O: 'Extreem Hoog', C: 'Laag', E: 'Contextueel', A: 'Gemiddeld', N: 'Hoog' },
    neuroticismTrigger: 'Zeer gevoelig en kwetsbaar voor emotionele turbulentie en vastgeroeste ideeën.',
  },
  EXPLORER_ABSTRACT: {
    group: 'ABSTRACT', harmony: false,
    ocean: { O: 7, C: 6, E: 5, A: 9, N: 8 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Gewelddadige reactie wanneer hun theorie verraden wordt.',
  },
  EXPLORER_AGENCY: {
    group: 'AGENCY', harmony: false,
    ocean: { O: 7, C: 3, E: 7, A: 1, N: 7 },
    oceanText: { O: 'Hoog', C: 'Laag', E: 'Hoog', A: 'Extreem Laag', N: 'Hoog' },
    neuroticismTrigger: 'Stress wordt omgezet in woede over opsluiting of systemische restricties.',
  },

  // ═══════════════════════════════════════════════════════════════
  // OUTLAW (Positie 6) — Salience Network
  // ═══════════════════════════════════════════════════════════════
  OUTLAW_RULING: {
    group: 'RULING', harmony: false,
    ocean: { O: 3, C: 9, E: 6, A: 3, N: 4 },
    oceanText: { O: 'Laag-Gemiddeld', C: 'Extreem Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Rots van stabiliteit, maar is intern doodsbang voor complete anarchie.',
  },
  OUTLAW_RELATIONAL: {
    group: 'RELATIONAL', harmony: false,
    ocean: { O: 5, C: 7, E: 5, A: 9, N: 7 },
    oceanText: { O: 'Gemiddeld', C: 'Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Hoog' },
    neuroticismTrigger: 'Vatbaar voor chronische angst en zware compassiemoeheid.',
  },
  OUTLAW_SEEKER: {
    group: 'SEEKER', harmony: false,
    ocean: { O: 9, C: 3, E: 5, A: 5, N: 8 },
    oceanText: { O: 'Extreem Hoog', C: 'Laag', E: 'Contextueel', A: 'Gemiddeld', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Gewelddadig neuroticisme wanneer de pure visie verraden wordt.',
  },
  OUTLAW_CHAOS: {
    group: 'CHAOS', harmony: true,
    ocean: { O: 7, C: 3, E: 7, A: 1, N: 8 },
    oceanText: { O: 'Hoog', C: 'Laag', E: 'Hoog', A: 'Extreem Laag', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Woede en stress worden gevoed door diepgewortelde systemische corruptie.',
  },
  OUTLAW_ABSTRACT: {
    group: 'ABSTRACT', harmony: false,
    ocean: { O: 7, C: 5, E: 3, A: 3, N: 7 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld', E: 'Laag', A: 'Laag', N: 'Hoog' },
    neuroticismTrigger: 'Internaliseert angst in piekeren en opstellen van worst-case scenario\'s.',
  },
  OUTLAW_AGENCY: {
    group: 'AGENCY', harmony: false,
    ocean: { O: 7, C: 6, E: 5, A: 9, N: 8 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Blinde stress-reactie als bondgenoten de strijd en visie verraden.',
  },

  // ═══════════════════════════════════════════════════════════════
  // TRICKSTER (Positie 7) — Salience Network
  // ═══════════════════════════════════════════════════════════════
  TRICKSTER_RULING: {
    group: 'RULING', harmony: false,
    ocean: { O: 3, C: 9, E: 6, A: 3, N: 4 },
    oceanText: { O: 'Laag-Gemiddeld', C: 'Extreem Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Rots van stabiliteit, maar vreest stiekem absolute anarchie.',
  },
  TRICKSTER_RELATIONAL: {
    group: 'RELATIONAL', harmony: false,
    ocean: { O: 7, C: 4, E: 7, A: 9, N: 7 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Hoog' },
    neuroticismTrigger: 'Zeer gevoelig voor disconnectie met hun partner of hun publiek.',
  },
  TRICKSTER_SEEKER: {
    group: 'SEEKER', harmony: false,
    ocean: { O: 9, C: 4, E: 5, A: 5, N: 8 },
    oceanText: { O: 'Extreem Hoog', C: 'Gemiddeld-Laag', E: 'Gemiddeld', A: 'Gemiddeld', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Hun psychologische basislijn is uiterst gevoelig en instabiel.',
  },
  TRICKSTER_CHAOS: {
    group: 'CHAOS', harmony: true,
    ocean: { O: 7, C: 6, E: 5, A: 9, N: 8 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Gewelddadige paniekreactie wanneer het veilige "paradijs" verraden wordt.',
  },
  TRICKSTER_ABSTRACT: {
    group: 'ABSTRACT', harmony: false,
    ocean: { O: 9, C: 7, E: 3, A: 3, N: 7 },
    oceanText: { O: 'Extreem Hoog', C: 'Hoog', E: 'Laag', A: 'Laag-Gemiddeld', N: 'Hoog' },
    neuroticismTrigger: 'Internaliseert angst over de realiteit in donker, obsessief piekeren.',
  },
  TRICKSTER_AGENCY: {
    group: 'AGENCY', harmony: false,
    ocean: { O: 4, C: 9, E: 7, A: 3, N: 4 },
    oceanText: { O: 'Gemiddeld-Laag', C: 'Extreem Hoog', E: 'Hoog', A: 'Laag-Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Heeft een hoge stresstolerantie doordat ze interne paniek agressief onderdrukken.',
  },

  // ═══════════════════════════════════════════════════════════════
  // SAGE (Positie 8) — Default Mode Network
  // ═══════════════════════════════════════════════════════════════
  SAGE_RULING: {
    group: 'RULING', harmony: false,
    ocean: { O: 5, C: 9, E: 3, A: 3, N: 5 },
    oceanText: { O: 'Gemiddeld', C: 'Extreem Hoog', E: 'Laag', A: 'Laag', N: 'Gemiddeld' },
    neuroticismTrigger: 'Onrustig door ambiguïteit of onkwantificeerbare variabelen.',
  },
  SAGE_RELATIONAL: {
    group: 'RELATIONAL', harmony: false,
    ocean: { O: 7, C: 7, E: 5, A: 8, N: 5 },
    oceanText: { O: 'Hoog', C: 'Hoog', E: 'Gemiddeld', A: 'Zeer Hoog', N: 'Gemiddeld' },
    neuroticismTrigger: 'Een gereguleerd anker, maar vreest het falen of verlies van hun student.',
  },
  SAGE_SEEKER: {
    group: 'SEEKER', harmony: false,
    ocean: { O: 9, C: 5, E: 5, A: 5, N: 8 },
    oceanText: { O: 'Extreem Hoog', C: 'Gemiddeld', E: 'Gemiddeld', A: 'Gemiddeld', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Uiterst volatiel; direct getriggerd door de vernietiging van de theorie.',
  },
  SAGE_CHAOS: {
    group: 'CHAOS', harmony: false,
    ocean: { O: 7, C: 3, E: 3, A: 3, N: 6 },
    oceanText: { O: 'Hoog', C: 'Laag', E: 'Laag', A: 'Laag', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Tweeledige grens: deelt diepe vrede, maar ervaart ernstige fobie voor sociale druk.',
  },
  SAGE_ABSTRACT: {
    group: 'ABSTRACT', harmony: true,
    ocean: { O: 9, C: 5, E: 3, A: 7, N: 4 },
    oceanText: { O: 'Extreem Hoog', C: 'Gemiddeld', E: 'Laag', A: 'Hoog', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Naar buiten toe rustig; getriggerd door materiële beknelling of trivialiteit.',
  },
  SAGE_AGENCY: {
    group: 'AGENCY', harmony: false,
    ocean: { O: 7, C: 10, E: 5, A: 2, N: 7 },
    oceanText: { O: 'Hoog', C: 'Uitzonderlijk Hoog', E: 'Gemiddeld', A: 'Zeer Laag', N: 'Hoog' },
    neuroticismTrigger: 'Raakt geobsedeerd en gestrest door onopgeloste anomalieën.',
  },

  // ═══════════════════════════════════════════════════════════════
  // ARTIST (Positie 9) — Default Mode Network
  // ═══════════════════════════════════════════════════════════════
  ARTIST_RULING: {
    group: 'RULING', harmony: false,
    ocean: { O: 7, C: 9, E: 5, A: 3, N: 6 },
    oceanText: { O: 'Hoog', C: 'Extreem Hoog', E: 'Gemiddeld', A: 'Laag-Gemiddeld', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Getriggerd door controleverlies of dreigende systemische anarchie.',
  },
  ARTIST_RELATIONAL: {
    group: 'RELATIONAL', harmony: false,
    ocean: { O: 7, C: 4, E: 7, A: 9, N: 8 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Extreem gevoelig voor waargenomen afstand of disharmonie in de groep.',
  },
  ARTIST_SEEKER: {
    group: 'SEEKER', harmony: false,
    ocean: { O: 7, C: 7, E: 3, A: 3, N: 8 },
    oceanText: { O: 'Hoog', C: 'Hoog', E: 'Laag', A: 'Laag-Gemiddeld', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Gewelddadige reactie wanneer de verbeelding wordt ingeperkt door de harde realiteit.',
  },
  ARTIST_CHAOS: {
    group: 'CHAOS', harmony: false,
    ocean: { O: 9, C: 3, E: 5, A: 5, N: 7 },
    oceanText: { O: 'Extreem Hoog', C: 'Laag', E: 'Gemiddeld', A: 'Gemiddeld', N: 'Hoog' },
    neuroticismTrigger: 'Volatiel; getriggerd door emotionele turbulentie in het breken van kaders.',
  },
  ARTIST_ABSTRACT: {
    group: 'ABSTRACT', harmony: true,
    ocean: { O: 9, C: 5, E: 5, A: 4, N: 6 },
    oceanText: { O: 'Extreem Hoog', C: 'Variabel', E: 'Gemiddeld', A: 'Gemiddeld-Laag', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Gevoelig voor overdenken, piekeren of \'analyse verlamming\'.',
  },
  ARTIST_AGENCY: {
    group: 'AGENCY', harmony: false,
    ocean: { O: 7, C: 4, E: 7, A: 3, N: 4 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Hoog', A: 'Laag-Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Hoge stresstolerantie, maar onderdrukt angst agressief door een tunnelvisie te creëren.',
  },

  // ═══════════════════════════════════════════════════════════════
  // MAGICIAN (Positie 10) — Extraversie & Wilskracht
  // ═══════════════════════════════════════════════════════════════
  MAGICIAN_RULING: {
    group: 'RULING', harmony: false,
    ocean: { O: 3, C: 9, E: 6, A: 3, N: 4 },
    oceanText: { O: 'Laag-Gemiddeld', C: 'Extreem Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Rots van stabiliteit, maar intern doodsbang voor anarchie.',
  },
  MAGICIAN_RELATIONAL: {
    group: 'RELATIONAL', harmony: false,
    ocean: { O: 7, C: 3, E: 7, A: 9, N: 8 },
    oceanText: { O: 'Hoog', C: 'Laag', E: 'Hoog', A: 'Extreem Hoog', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Uiterst gevoelig voor de kleinste tekenen van disconnectie of afwijzing.',
  },
  MAGICIAN_SEEKER: {
    group: 'SEEKER', harmony: false,
    ocean: { O: 7, C: 6, E: 5, A: 9, N: 8 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Piekt gewelddadig wanneer de voorspelbaarheid wordt doorprikt.',
  },
  MAGICIAN_CHAOS: {
    group: 'CHAOS', harmony: false,
    ocean: { O: 9, C: 3, E: 5, A: 3, N: 4 },
    oceanText: { O: 'Extreem Hoog', C: 'Laag-Gemiddeld', E: 'Gemiddeld', A: 'Laag-Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Naar buiten toe kalm; hoge stresstolerantie onder vuur en onderdrukt interne angst.',
  },
  MAGICIAN_ABSTRACT: {
    group: 'ABSTRACT', harmony: false,
    ocean: { O: 9, C: 6, E: 3, A: 3, N: 6 },
    oceanText: { O: 'Extreem Hoog', C: 'Gemiddeld-Hoog', E: 'Laag', A: 'Laag-Gemiddeld', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Raakt gestrest en begint snel variabelen en worst-case scenario\'s te berekenen.',
  },
  MAGICIAN_AGENCY: {
    group: 'AGENCY', harmony: true,
    ocean: { O: 9, C: 3, E: 5, A: 3, N: 8 },
    oceanText: { O: 'Extreem Hoog', C: 'Laag-Gemiddeld', E: 'Gemiddeld', A: 'Laag-Gemiddeld', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Psychologische instorting als de realiteit zich niet wil aanpassen aan hun wil.',
  },

  // ═══════════════════════════════════════════════════════════════
  // HERO (Positie 11) — Extraversie & Wilskracht
  // ═══════════════════════════════════════════════════════════════
  HERO_RULING: {
    group: 'RULING', harmony: false,
    ocean: { O: 3, C: 9, E: 7, A: 3, N: 5 },
    oceanText: { O: 'Laag', C: 'Extreem Hoog', E: 'Hoog', A: 'Laag', N: 'Gemiddeld' },
    neuroticismTrigger: 'Intern doodsbang voor anarchie of het verlies van hiërarchische controle.',
  },
  HERO_RELATIONAL: {
    group: 'RELATIONAL', harmony: false,
    ocean: { O: 4, C: 9, E: 5, A: 8, N: 7 },
    oceanText: { O: 'Gemiddeld-Laag', C: 'Extreem Hoog', E: 'Gemiddeld', A: 'Zeer Hoog', N: 'Hoog' },
    neuroticismTrigger: 'Internaliseert het emotionele lijden van degenen die ze beschermen.',
  },
  HERO_SEEKER: {
    group: 'SEEKER', harmony: false,
    ocean: { O: 7, C: 5, E: 7, A: 4, N: 7 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld', E: 'Hoog', A: 'Gemiddeld-Laag', N: 'Hoog' },
    neuroticismTrigger: 'Zeer gevoelig voor creatieve tegenslagen of onoverkomelijke innovatie-blokkades.',
  },
  HERO_CHAOS: {
    group: 'CHAOS', harmony: false,
    ocean: { O: 5, C: 7, E: 5, A: 7, N: 8 },
    oceanText: { O: 'Gemiddeld', C: 'Hoog', E: 'Gemiddeld', A: 'Hoog', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Gewelddadige, agressieve reactie op moreel verraad of stagnerende beperkingen.',
  },
  HERO_ABSTRACT: {
    group: 'ABSTRACT', harmony: false,
    ocean: { O: 5, C: 9, E: 5, A: 3, N: 7 },
    oceanText: { O: 'Gemiddeld', C: 'Extreem Hoog', E: 'Gemiddeld', A: 'Laag', N: 'Hoog' },
    neuroticismTrigger: 'Rend intern om direct alle worst-case scenario\'s in kaart te brengen.',
  },
  HERO_AGENCY: {
    group: 'AGENCY', harmony: true,
    ocean: { O: 5, C: 7, E: 7, A: 3, N: 7 },
    oceanText: { O: 'Gemiddeld', C: 'Hoog', E: 'Hoog', A: 'Laag', N: 'Hoog' },
    neuroticismTrigger: 'Stress slaat om in woede over corruptie of tegenwerking.',
  },

  // ═══════════════════════════════════════════════════════════════
  // RULER (Positie 12) — CEN Dominantie
  // ═══════════════════════════════════════════════════════════════
  RULER_RULING: {
    group: 'RULING', harmony: true,
    ocean: { O: 3, C: 10, E: 6, A: 3, N: 4 },
    oceanText: { O: 'Laag-Gemiddeld', C: 'Uitzonderlijk Hoog', E: 'Gemiddeld-Hoog', A: 'Laag-Gemiddeld', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Rots van stabiliteit, maar is intern doodsbang voor pure anarchie.',
  },
  RULER_RELATIONAL: {
    group: 'RELATIONAL', harmony: false,
    ocean: { O: 5, C: 7, E: 5, A: 9, N: 6 },
    oceanText: { O: 'Gemiddeld', C: 'Hoog', E: 'Gemiddeld', A: 'Extreem Hoog', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Wordt gestrest door het dragen van het emotionele gewicht van afhankelijken.',
  },
  RULER_SEEKER: {
    group: 'SEEKER', harmony: false,
    ocean: { O: 7, C: 4, E: 5, A: 3, N: 8 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Laag', E: 'Gemiddeld', A: 'Laag-Gemiddeld', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Volatiel vanbinnen; direct getriggerd door het onvermogen om de markt te sturen.',
  },
  RULER_CHAOS: {
    group: 'CHAOS', harmony: false,
    ocean: { O: 7, C: 6, E: 5, A: 10, N: 8 },
    oceanText: { O: 'Hoog', C: 'Gemiddeld-Hoog', E: 'Gemiddeld', A: 'Uitzonderlijk Hoog', N: 'Zeer Hoog' },
    neuroticismTrigger: 'Gewelddadige reactie op bureaucratie, intern verraad of persoonlijke fouten.',
  },
  RULER_ABSTRACT: {
    group: 'ABSTRACT', harmony: false,
    ocean: { O: 6, C: 7, E: 5, A: 3, N: 6 },
    oceanText: { O: 'Gemiddeld-Hoog', C: 'Hoog', E: 'Gemiddeld', A: 'Laag-Gemiddeld', N: 'Gemiddeld-Hoog' },
    neuroticismTrigger: 'Raakt gestrest en gefrustreerd door systemische onwetendheid.',
  },
  RULER_AGENCY: {
    group: 'AGENCY', harmony: false,
    ocean: { O: 3, C: 10, E: 7, A: 3, N: 4 },
    oceanText: { O: 'Laag-Gemiddeld', C: 'Uitzonderlijk Hoog', E: 'Hoog', A: 'Laag', N: 'Laag-Gemiddeld' },
    neuroticismTrigger: 'Enorme stresstolerantie; angst wordt agressief onderdrukt.',
  },
};


// ═══════════════════════════════════════════════════════════════════
// 3. HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get the core archetype profile for a given archetype key.
 * @param {string} key – e.g. 'SAGE', 'HERO'
 * @returns {Object|null}
 */
export function getCoreProfile(key) {
  return CORE_ARCHETYPE_PROFILES[key] || null;
}

/**
 * Get the OCEAN profile for an extended archetype.
 * @param {string} mainKey – e.g. 'SAGE'
 * @param {string} supportGroup – e.g. 'ABSTRACT'
 * @returns {Object|null} { group, harmony, ocean, oceanText, neuroticismTrigger }
 */
export function getExtendedOcean(mainKey, supportGroup) {
  const lookupKey = `${mainKey}_${supportGroup}`;
  return EXTENDED_ARCHETYPE_OCEAN[lookupKey] || null;
}

/**
 * Get OCEAN label map for display.
 */
export const OCEAN_LABELS = {
  O: { short: 'O', full: 'Openness', dutch: 'Openheid voor Ervaring' },
  C: { short: 'C', full: 'Conscientiousness', dutch: 'Consciëntieusheid' },
  E: { short: 'E', full: 'Extraversion', dutch: 'Extraversie' },
  A: { short: 'A', full: 'Agreeableness', dutch: 'Inschikkelijkheid' },
  N: { short: 'N', full: 'Neuroticism', dutch: 'Neuroticisme' },
};

/**
 * OCEAN dimension color mapping for UI.
 */
export const OCEAN_COLORS = {
  O: '#a78bfa', // soft violet-purple — Openness
  C: '#22d3ee', // cyan — Conscientiousness
  E: '#67e8f9', // light cyan — Extraversion
  A: '#818cf8', // indigo-purple — Agreeableness
  N: '#c4b5fd', // pale lavender — Neuroticism
};

/**
 * 180° Shadow/Individuation pairs (wheel position + 6).
 * Used for psychological individuation path display.
 */
export const INDIVIDUATION_PAIRS = {
  JUDGE: 'TRICKSTER',
  LOVER: 'SAGE',
  CAREGIVER: 'ARTIST',
  INNOCENT: 'MAGICIAN',
  EXPLORER: 'HERO',
  OUTLAW: 'RULER',
  TRICKSTER: 'JUDGE',
  SAGE: 'LOVER',
  ARTIST: 'CAREGIVER',
  MAGICIAN: 'INNOCENT',
  HERO: 'EXPLORER',
  RULER: 'OUTLAW',
};

export default EXTENDED_ARCHETYPE_OCEAN;
