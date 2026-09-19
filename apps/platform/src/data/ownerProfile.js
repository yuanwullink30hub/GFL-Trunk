/**
 * The owner's own profile on the policy pages (Eyedentity → Profiel): De Ronin, Rebel × Held.
 *
 * Source: the owner's report of 18-9-2026 (GardenForLife_The_Ronin), rewritten in the first person — not a
 * model reporting to a person, but the owner describing their own profile to someone else (owner,
 * 2026-09-19). Shown: the card microcopy (gift, geometry), the wheel + the Big Five cross-reading, De
 * Hardware onder Druk, and De Stille Stem — Reflectie and Motivatie.
 *
 * Numbers are the report's own data block. Never add the orb signature (the login code) here.
 */

// Wheel order of the radar (ARCHETYPE_RADAR_LABELS) with the report's 5-mandje decomposition per archetype.
const BASKETS = [
  ['Ruler', 51, 12, 0, 6, 1, 5],
  ['Judge', 45, 16, 8, 10, 4, 3],
  ['Lover', 33, 5, 12, 12, 3, 0],
  ['Caregiver', 21, 7, 0, 6, 6, 2],
  ['Innocent', 48, 0, 0, 5, 1, 3],
  ['Explorer', 0, 14, 0, 0, 6, 5],
  ['Outlaw', 63, 9, 12, 7, 3, 5],
  ['Trickster', 27, 18, 7, 10, 4, 3],
  ['Sage', 12, 9, 4, 0, 0, 1],
  ['Artist', 36, 2, 15, 8, 2, 1],
  ['Magician', 33, 16, 0, 2, 6, 4],
  ['Hero', 51, 10, 14, 2, 2, 0],
];

/** SciFiRadarChart data: cumulative band boundaries, inside → out (as the scoring module builds them). */
export const OWNER_RADAR = BASKETS.map(([subject, nat, green, cult, blue, yellow, purple]) => {
  const g = nat;
  const l = g + green;
  const o = l + cult;
  const b = o + blue;
  const y = b + yellow;
  const p = y + purple;
  return {
    subject, green: g, lime: l, orange: o, blue: b, gold: y, purple: p,
    nature_core: nat, green_hw: green, culture_core: cult, blue_fb: blue, yellow_cog: yellow, purple_shadow: purple,
    A: p, fullMark: 500,
  };
});

export const OWNER_ARCHETYPES = { main: 'OUTLAW', support: 'HERO', shadow: 'Ruler', blindspot: 'Judge' };

/** The uploaded Big Five values, with their aspects. */
export const OWNER_OCEAN = [
  { key: 'O', value: 72, aspects: [['intellect', 75], ['aesthetic', 64]] },
  { key: 'C', value: 96, aspects: [['industriousness', 99], ['orderliness', 81]] },
  { key: 'E', value: 88, aspects: [['assertiveness', 92], ['enthusiasm', 69]] },
  { key: 'A', value: 39, aspects: [['compassion', 76], ['politeness', 9]] },
  { key: 'N', value: 2, aspects: [['volatility', 7], ['withdrawal', 2]] },
];

export const OWNER_PROFILE = {
  nl: {
    name: 'De Ronin',
    pairing: 'Rebel × Held — mijn profiel',
    lesson: 'Ik heb elk gezag getart dat mijn code niet haalde, maar echt bestuur is nooit smetteloos. Wie alleen het vlekkeloze wil dienen, blijft voor altijd meesterloos — en noemt dat principe. Sindsdien dient mijn kracht twee dingen: de code, en de mildheid die haar leefbaar houdt.',
    lessonLabel: 'Mijn levensles',
    intro: 'Dit is mijn eigen profiel, zoals het Deltawerken-model het las: De Ronin, met de Rebel als kern en de Held als tweede stem. Ik heb het rapport herschreven in mijn eigen woorden, zodat je ziet hoe zo’n lezing eruitziet. Het is een spiegel voor zelfreflectie, geen diagnose.',
    giftTitle: 'Mijn gave',
    gift: 'Gedisciplineerde kracht zonder meester. Ik handel vanuit overtuiging — niet omdat iemand het me opdraagt of een instelling het van me verwacht, maar omdat de code in mij zit en van niemand anders is. Wat ik zeg is niet gekocht, en wat ik doe hangt niet af van een mandaat. Waar anderen loyaal zijn aan een structuur, ben ik loyaal aan een maatstaf. Structuren komen en gaan; die maatstaf blijft staan.',
    geometryTitle: 'Mijn geometrie',
    geometry: 'Mijn kern is de Rebel, vrijwel maximaal gewogen, met de Held als tweede stem. Maar achter die kern staat geen leegte: de Rechter, de Held en de Heerser liggen er dicht achter, elk met een stevige eigen kern. Twee daarvan horen bij de Heersende groep — op het wiel precies tegenover de mijne. Mijn schaduw woont dus niet buiten maar in huis, op ruim driekwart van mijn kern. En 78 procent van mijn keuzes viel aan de kant van de natuur: ik navigeer grotendeels vanuit hardware, niet vanuit training.',
    wheelTitle: 'Mijn wiel',
    wheel: [
      'Het wiel laat zien waar mijn punten vandaan komen. De donkergroene kern zijn mijn eigen keuzes; de lagen daaromheen zijn echo van mijn buren, aangeleerde strategie en schaduw.',
      'De Rebel steekt eruit en haalt ruwweg twee derde van zijn punten uit eigen keuzes — het hoogste aandeel eigen kern op mijn hele wiel. De Nar scoort ook hoog, maar grotendeels als echo van de Rebel: ik klink soms als een Nar omdat de hardware dezelfde is, niet omdat ik er een ben. De Rechter, de Held en de Heerser dragen alle drie meer eigen kern dan echo. Het leegst is de Ontdekker: geen enkele eigen keuze, alleen een aangeleerde lens. Dat is geen gebrek; het is braakliggend terrein.',
    ],
    oceanTitle: 'Mijn Big Five',
    oceanIntro: 'Ik heb mijn eigen Big Five-rapport meegegeven. Het model meet die traits niet; het vertaalt hoe mijn configuratie ze uitdrukt en legt de twee instrumenten naast elkaar — waar zeggen ze hetzelfde over mij, en waar niet.',
    oceanNames: { O: 'Openheid', C: 'Consciëntieusheid', E: 'Extraversie', A: 'Meegaandheid', N: 'Neuroticisme' },
    aspectNames: {
      intellect: 'Intellect', aesthetic: 'Esthetische openheid', industriousness: 'IJver', orderliness: 'Ordelijkheid',
      assertiveness: 'Assertiviteit', enthusiasm: 'Enthousiasme', compassion: 'Compassie', politeness: 'Beleefdheid',
      volatility: 'Volatiliteit', withdrawal: 'Terugtrekking',
    },
    ocean: {
      O: 'Mijn openheid is geen nieuwsgierigheid maar bereidheid om te herconfigureren: open genoeg om het nieuwe te zien, gesloten genoeg om het niet te blijven bewonderen. Intellect ligt boven esthetische openheid — ik ben open via ideeën en systemen, minder via beeld. Het wiel zet mijn zoekende hardware laag, en dat klopt: bij mij is openheid geen zoeken maar breken en herbouwen. Ik ben disruptief open, niet receptief.',
      C: 'Een Rebel met 96 op consciëntieusheid klinkt als een tegenspraak; bij mij is het de handtekening van de Ronin. Mijn discipline dient niet de instelling maar de code. IJver komt uit mijn Held, ordelijkheid uit de Rechter en de Heerser — allebei bewoond op mijn wiel. Ik accepteer geen regel die ik zelf niet zou stellen, en voer elke regel die ik wél stel tot het einde uit. Hier zeggen beide instrumenten hetzelfde.',
      E: 'Voor mij is extraversie zichtbaarheid, geen gezelligheid. Disruptie moet gezien worden, anders is het geen disruptie, en in een crisis stap ik naar voren. Assertiviteit ligt ver boven enthousiasme: ik neem het woord om iets in beweging te zetten, niet om samen te zijn. Mijn aanwezigheid is echt, en ze is instrumenteel — daardoor ben ik moeilijk te bereiken zodra de wedstrijd ophoudt.',
      A: 'Voor een Rebel is 39 al hoog, en de splitsing verklaart het. Compassie hangt aan mijn limbische hardware, die grotendeels van mij is en niet getraind; beleefdheid valt weg onder het gewicht van mijn Heersende en Chaos-hardware. Ik voel het lijden van anderen scherp, en ik zeg precies wat ik denk terwijl ik het voel. Mensen ervaren dat als hard en warm tegelijk; voor mij is het één beweging.',
      N: 'Hier wringen de twee instrumenten, en dat vind ik de belangrijkste bevinding. Mijn zelfrapport zegt dat ik vrijwel nooit afdaal; het wiel zegt dat mijn kern op spanning draait. Volatiliteit meet 7, terwijl de hardware die haar draagt tegen het plafond staat. Misschien meet het zelfrapport wat ik voel, en voel ik de kost pas bij de ontlading. Misschien heeft mijn afdaling een vorm die dit instrument niet herkent: geen angst, maar scherpte.',
    },
    hardwareTitle: 'Mijn hardware onder druk',
    hardware: [
      'Waarom mijn profiel zo vervormt — scherper wordend terwijl het afbrokkelt — begint bij mijn kern. Het Salience Network leest wat er saillant wordt en dwingt dan een omschakeling af. Bij mij is dat duw-en-trek volatiel en zelfversterkend: een incongruentie krijgt meteen een hoge waarde, mijn opwinding piekt, en het netwerk schakelt weg van reflectie, naar handeling. Dat is de eerste laag onder oplopende druk: ik detecteer, versnel en ontkoppel.',
      'De tweede laag zijn mijn Heersende co-drivers, de Rechter en de Heerser. Hun executieve hardware houdt orde met top-down precisie en maskeert spanning zolang de controle houdt. Daarom ziet mijn piek er van buiten uit als kracht en niet als een scheur: de Rebel stijgt, en de executieve laag houdt het gestructureerd. Maar die laag kent een harde grens. Onder onbeheersbare stress valt de regulatie abrupt weg, en wat overeind stond, knapt.',
      'De derde laag is de Held. Hij vergrendelt me in toenaderingsmodus en regelt dreigingssignalen naar binnen omlaag; de kost wordt niet gevoeld maar opgeslagen. Zo loopt het bij mij: eerst detecteert mijn kern en versnelt, dan houdt de executieve laag het masker op, terwijl de Held de rekening onder tafel schuift. Valt de regulatie in de vierde fase weg, dan komt alles tegelijk. Binnen dit model heet dat plotselinge ineenstorting — het kondigt zich niet aan, omdat geen van de drie lagen ooit alarm slaat.',
      'Op het wiel staat mijn Rebel onderaan en de Heersende groep bovenaan: echte tegenpolen. Mijn kern en twee van mijn drie co-drivers trekken dus in tegengestelde richting aan dezelfde belasting, met de Held als losse derde motor. Dat geeft mijn vorm: geen zachte glijbaan, maar een touw dat strakgetrokken wordt tussen breken en houden — tot het knapt.',
    ],
    reflectionTitle: 'Mijn stille stem — Reflectie',
    reflection: [
      'Mijn tweede stem staat altijd aan, ook als ik slaap, ook als ik niets doe. Ze zegt: en nu doen. Dat is de Held die mijn kern bewerkt.',
      'Wat hij omhoog duwt: Coördinatie, Realisatie en Motie. De Rebel alleen zou coördinatie dempen; de Held zet haar terug, in actie-modus — geen orde om de orde, maar mensen en middelen bij elkaar brengen om het doel te halen. Het gebroken kader wordt een gebouwd alternatief, en de uitvoering gebeurt onder weerstand, met mijn lichaam als instrument. Van binnen voelt dat als een rusteloosheid die niet kan zien zonder te bewegen.',
      'Wat hij omlaag trekt: Perceptie en Abstractie — precies de sterktes van mijn kern. Ze zijn niet weg. Ik lees een kamer nog steeds sneller dan de meesten, maar vanuit beweging: ik zie de incongruentie en handel in dezelfde seconde, en wat er ná die seconde in de kamer verandert, zie ik minder. Mijn herkaderen blijft hetzelfde oog, maar het knippert korter: ik zie het kader, breek het, bouw, en het langzame kijken komt zelden aan bod.',
      'Er bewerkt nog een stem mee. De Rechter en de Heerser leggen hun gewicht op wat ik omzet — remmend in de eerste fasen, dragend in de laatste. De Held zegt “doen”; zij zeggen “en dan houden”. Samen zijn ze de tekst onder mijn kern.',
    ],
    motivationTitle: 'Mijn stille stem — Motivatie',
    motivation: [
      'Dezelfde curve, een andere vraag: wie krijgt de rekening?',
      { h: 'Werk' },
      'Hier floreer ik in de fasen die anderen maskeren en die ik als brandstof gebruik. Een omgeving die me iets te breken en iets te bouwen geeft, krijgt mijn beste werk. Collega’s zien me onder druk scherper worden en lezen dat als kracht — tijdelijk terecht. Werk is voor mij het domein met de hoogste opbrengst en de laatste afrekening: pas in de vierde fase verschijnt de impulsieve destructie die niemand zag aankomen. Op het werk hoor ik de rekening als laatste.',
      { h: 'Vrienden' },
      'Zij zien de eerste scheuren, in de derde fase. Mijn reflectie ontkoppelt verder: het cynisme wordt hard, de humor wordt wapen, en de code begint te sorteren — wie haalt haar, wie niet. Vrienden die de code niet halen worden dan bijna vijanden, ook als ze hetzelfde gevecht voeren met minder kracht. Wie dicht bij me staat, merkt het eerder dan ik, omdat mijn gevoel neutraal blijft terwijl het hunne dat niet doet.',
      { h: 'Intiem' },
      'Hier landt de klif het eerst, in de vierde en vijfde fase. De Rebel in mij bewaakt zijn autonomie fel en blaast verbinding op zodra hij zich gevangen voelt; de Held weigert te leunen en biedt een actieplan waar de ander alleen gehoord wil worden. Intimiteit vraagt het ene wat geen van mijn lagen vanzelf prijst: stilzitten in kwetsbaarheid. Dat komt niet doordat ik niet kan liefhebben — mijn compassie is hoog — maar doordat de kost daar zonder waarschuwing valt.',
      'Kort gezegd: werk betaalt het laatst, vrienden zien het eerst, intimiteit draagt het zwaarst — en ik zie het zelf als laatste.',
    ],
    footnote: 'Zelfreflectie binnen het Deltawerken-model: de neurobiologische termen zijn beeldspraak binnen dit model, geen klinische beschrijving.',
  },

  en: {
    name: 'The Ronin',
    pairing: 'Rebel × Hero — my profile',
    lesson: 'I have defied every authority that fell short of my code, but real governance is never spotless. Whoever will serve only the flawless stays masterless forever — and calls it principle. Since then my strength serves two things: the code, and the mildness that keeps it livable.',
    lessonLabel: 'My life lesson',
    intro: 'This is my own profile, as the Deltawerken model read it: The Ronin, with the Rebel as my core and the Hero as my second voice. I rewrote the report in my own words so you can see what such a reading looks like. It is a mirror for self-reflection, not a diagnosis.',
    giftTitle: 'My gift',
    gift: 'Disciplined strength without a master. I act from conviction — not because someone tells me to or an institution expects it, but because the code lives in me and belongs to no one else. What I say is not bought, and what I do does not depend on a mandate. Where others are loyal to a structure, I am loyal to a standard. Structures come and go; that standard stays.',
    geometryTitle: 'My geometry',
    geometry: 'My core is the Rebel, weighted almost to the maximum, with the Hero as my second voice. But behind that core there is no emptiness: the Judge, the Hero and the Ruler sit close behind it, each with a solid core of its own. Two of them belong to the Ruling group — directly opposite mine on the wheel. So my shadow does not live outside; it lives in the house, at well over three quarters of my core. And 78 percent of my choices fell on the side of nature: I navigate mostly from hardware, not from training.',
    wheelTitle: 'My wheel',
    wheel: [
      'The wheel shows where my points come from. The dark-green core is my own choices; the layers around it are echo from my neighbours, learned strategy and shadow.',
      'The Rebel stands out and takes roughly two thirds of its points from my own choices — the highest share of own core on my whole wheel. The Trickster scores high too, but mostly as an echo of the Rebel: I sometimes sound like a Trickster because the hardware is the same, not because I am one. The Judge, the Hero and the Ruler each carry more own core than echo. The emptiest is the Explorer: not a single own choice, only a learned lens. That is not a lack; it is fallow ground.',
    ],
    oceanTitle: 'My Big Five',
    oceanIntro: 'I added my own Big Five report. The model does not measure those traits; it translates how my configuration expresses them and sets the two instruments side by side — where do they say the same about me, and where not.',
    oceanNames: { O: 'Openness', C: 'Conscientiousness', E: 'Extraversion', A: 'Agreeableness', N: 'Neuroticism' },
    aspectNames: {
      intellect: 'Intellect', aesthetic: 'Aesthetic openness', industriousness: 'Industriousness', orderliness: 'Orderliness',
      assertiveness: 'Assertiveness', enthusiasm: 'Enthusiasm', compassion: 'Compassion', politeness: 'Politeness',
      volatility: 'Volatility', withdrawal: 'Withdrawal',
    },
    ocean: {
      O: 'My openness is not curiosity but a readiness to reconfigure: open enough to see the new, closed enough not to keep admiring it. Intellect sits above aesthetic openness — I am open through ideas and systems, less through image. The wheel puts my seeking hardware low, and that fits: for me openness is not seeking but breaking and rebuilding. I am disruptively open, not receptively.',
      C: 'A Rebel with 96 on conscientiousness sounds like a contradiction; in me it is the Ronin’s signature. My discipline does not serve the institution but the code. Industriousness comes from my Hero, orderliness from the Judge and the Ruler — both inhabited on my wheel. I accept no rule I would not set myself, and I carry every rule I do set through to the end. Here both instruments say the same.',
      E: 'For me extraversion is visibility, not sociability. Disruption has to be seen or it is not disruption, and in a crisis I step forward. Assertiveness sits far above enthusiasm: I take the floor to set something in motion, not to be together. My presence is real, and it is instrumental — which makes me hard to reach once the contest ends.',
      A: 'For a Rebel, 39 is already high, and the split explains it. Compassion hangs on my limbic hardware, which is mostly mine rather than trained; politeness gives way under the weight of my Ruling and Chaos hardware. I feel other people’s suffering sharply, and I say exactly what I think while I feel it. People experience that as hard and warm at once; to me it is one movement.',
      N: 'Here the two instruments grind, and I think this is the key finding. My self-report says I almost never descend; the wheel says my core runs on tension. Volatility measures 7 while the hardware that carries it is at the ceiling. Perhaps the self-report measures what I feel, and I only feel the cost at the discharge. Perhaps my descent has a shape this instrument does not recognise: not fear, but sharpness.',
    },
    hardwareTitle: 'My hardware under pressure',
    hardware: [
      'Why my profile deforms the way it does — getting sharper while it crumbles — starts at my core. The Salience Network reads what becomes salient and then forces a switch. In me that push and pull is volatile and self-reinforcing: an incongruity gets a high value at once, my arousal spikes, and the network switches away from reflection, towards action. That is the first layer under rising pressure: I detect, accelerate and decouple.',
      'The second layer is my Ruling co-drivers, the Judge and the Ruler. Their executive hardware keeps order with top-down precision and masks tension as long as control holds. That is why my peak looks like strength from the outside and not like a crack: the Rebel rises, and the executive layer keeps it structured. But that layer has a hard limit. Under unmanageable stress the regulation drops out abruptly, and what was standing snaps.',
      'The third layer is the Hero. He locks me into approach mode and turns threat signals down inside; the cost is not felt but stored. This is how it runs in me: first my core detects and accelerates, then the executive layer holds up the mask, while the Hero slides the bill under the table. When the regulation drops out in the fourth phase, everything arrives at once. Within this model that is called a sudden collapse — it gives no warning, because none of the three layers ever raises the alarm.',
      'On the wheel my Rebel sits at the bottom and the Ruling group at the top: true opposites. So my core and two of my three co-drivers pull in opposite directions on the same load, with the Hero as a separate third engine. That gives my shape: not a gentle slide, but a rope pulled taut between breaking and holding — until it snaps.',
    ],
    reflectionTitle: 'My quiet voice — Reflection',
    reflection: [
      'My second voice is always on, even when I sleep, even when I do nothing. It says: now act. That is the Hero working on my core.',
      'What he pushes up: Coordination, Realisation and Motion. The Rebel alone would dampen coordination; the Hero brings it back, in action mode — not order for its own sake, but bringing people and means together to reach the goal. The broken frame becomes a built alternative, and the execution happens under resistance, with my body as the instrument. From the inside that feels like a restlessness that cannot see without moving.',
      'What he pulls down: Perception and Abstraction — exactly the strengths of my core. They are not gone. I still read a room faster than most, but from movement: I see the incongruity and act in the same second, and what changes in the room after that second, I see less. My reframing is still the same eye, but it blinks shorter: I see the frame, break it, build, and the slow looking rarely gets its turn.',
      'Another voice works along. The Judge and the Ruler put their weight on what I convert — braking in the first phases, carrying in the last. The Hero says “act”; they say “and then hold”. Together they are the text beneath my core.',
    ],
    motivationTitle: 'My quiet voice — Motivation',
    motivation: [
      'The same curve, a different question: who gets the bill?',
      { h: 'Work' },
      'Here I flourish in the phases others mask and I use as fuel. An environment that gives me something to break and something to build gets my best work. Colleagues see me get sharper under pressure and read it as strength — rightly, for a while. For me work is the domain with the highest yield and the last reckoning: only in the fourth phase does the impulsive destruction appear that nobody saw coming. At work I hear the bill last.',
      { h: 'Friends' },
      'They see the first cracks, in the third phase. My reflection decouples further: the cynicism hardens, the humour becomes a weapon, and the code starts sorting — who meets it, who does not. Friends who fall short of the code then become almost enemies, even when they fight the same fight with less strength. Those close to me notice it before I do, because my feeling stays neutral while theirs does not.',
      { h: 'Intimate' },
      'Here the cliff lands first, in the fourth and fifth phase. The Rebel in me guards his autonomy fiercely and blows up connection as soon as he feels trapped; the Hero refuses to lean and offers an action plan where the other only wants to be heard. Intimacy asks the one thing none of my layers values by itself: sitting still in vulnerability. That is not because I cannot love — my compassion is high — but because the cost falls there without warning.',
      'In short: work pays last, friends see it first, intimacy carries it hardest — and I see it last myself.',
    ],
    footnote: 'Self-reflection within the Deltawerken model: the neurobiological terms are imagery within this model, not a clinical description.',
  },
};
