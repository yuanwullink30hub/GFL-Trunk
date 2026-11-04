/**
 * The owner's own profile on the policy pages (Eyedentity → Profiel): De Protagonist, Magiër × Rebel.
 *
 * Source: the owner's report of 4-11-2026 (GardenForLife_The_Protagonist, the two-layer Leerling test),
 * rewritten in the first person — not a model reporting to a person, but the owner describing their own
 * profile to someone who wants to get to know us (owner, 2026-11-04; same form as the earlier Ronin page of
 * 2026-09-19). Shown: the card microcopy (gift, geometry), the wheel + the Big Five cross-reading, De
 * Hardware onder Druk, and De Stille Stem — Reflectie and Motivatie.
 *
 * Numbers are the report's own data block. Never add the orb signature (the login code) here.
 */

// The report's seven mandjes per archetype, in the radar's wheel order (ARCHETYPE_RADAR_LABELS):
// [keuze, passief, groen, blauw, blauw_intern, paars, geel]. Totals are the report's 12-point scores.
const MANDJES = [
  ['Ruler', 18.0, 0.0, 4.5, 0.0, 2.7, 6.6, 6.0],
  ['Judge', 13.5, 0.0, 6.0, 0.0, 3.6, 1.8, 4.2],
  ['Lover', 13.5, 6.0, 3.0, 6.0, 0.0, 3.0, 16.8],
  ['Caregiver', 9.0, 6.0, 4.5, 15.9, 0.0, 3.0, 5.4],
  ['Innocent', 22.5, 0.0, 3.0, 4.8, 0.0, 10.2, 5.4],
  ['Explorer', 9.0, 0.0, 7.5, 4.8, 0.0, 3.6, 4.8],
  ['Outlaw', 49.5, 3.0, 4.5, 0.0, 3.0, 2.4, 12.0],
  ['Trickster', 13.5, 3.0, 16.5, 0.0, 10.2, 1.8, 4.8],
  ['Sage', 22.5, 3.0, 7.5, 1.8, 0.0, 1.8, 5.4],
  ['Artist', 22.5, 3.0, 7.5, 4.5, 0.0, 1.2, 3.0],
  ['Magician', 76.5, 6.0, 9.0, 2.4, 0.0, 3.0, 8.4],
  ['Hero', 27.0, 6.0, 25.5, 3.3, 0.0, 1.2, 3.0],
];

/**
 * SciFiRadarChart data in the two-layer test's six bands, inside → out — built exactly as the report's own
 * card builds them (computeResultFromProfile): eigen echo = groen + blauw intern.
 */
const round1 = (x) => Math.round(x * 10) / 10;
export const OWNER_RADAR = MANDJES.map(([subject, keuze, passief, groen, blauw, blauwIntern, paars, geel]) => {
  const bands = [keuze, passief, groen + blauwIntern, blauw, geel, paars];
  const [g, l, o, b, y, p] = bands.reduce((acc, x) => [...acc, (acc[acc.length - 1] || 0) + x], []).map(round1);
  return {
    subject, v2: true, green: g, lime: l, orange: o, blue: b, gold: y, purple: p,
    keuze, passief, eigen_echo: round1(groen + blauwIntern), blauw, geel, paars,
    A: p, fullMark: 500,
  };
});

// The configuration and the portrait live in ownerPortrait.js, which App warms right after the landing.
export { OWNER_ARCHETYPES } from './ownerPortrait';

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
    name: 'De Protagonist',
    pairing: 'Magiër × Rebel — mijn profiel',
    lesson: 'De wereld vormt zich rond wie het verhaal durft te dragen, dus droeg ik het — overal, altijd. Maar een hoofdrol zonder tegenspelers speelt voor een lege zaal. Mijn beste hoofdstuk begon toen ik iemand anders de opening gaf.',
    lessonLabel: 'Mijn levensles',
    intro: 'Dit is mijn eigen profiel, zoals het Deltawerken-model het las: De Protagonist, met de Magiër als kern en de Rebel als tweede stem. Ik heb het rapport herschreven in mijn eigen woorden, zodat je ziet hoe zo’n lezing eruitziet. Het is een spiegel voor zelfreflectie, geen diagnose.',
    giftTitle: 'Mijn gave',
    gift: 'Werkelijkheid buigen door het verhaal te grijpen. Waar anderen afwachten, zie ik waar een vastgelopen situatie kantelt — en ik wacht niet op toestemming om die draai te maken. Ik stap midden in het verhaal en geef het een wending, hardop en zichtbaar. Mensen merken dat er iets gebeurt zodra ik de kamer binnenkom. Verhalen die vastzitten, komen in beweging omdat ik erin durf te stappen.',
    geometryTitle: 'Mijn geometrie',
    geometry: 'Mijn kracht zit overduidelijk op één plek: de Magiër, die ver boven alles uitsteekt. Twee stemmen bepalen hóe die kracht eruitziet — de Rebel, die kaders openbreekt en wil dat iedereen het ziet, en de Held, die uit dezelfde hardware komt als mijn kern en doorduwt tot het resultaat er staat. De Magiër en de Rebel verbindt een gele lijn: geen gedeelde hardware, wel twee netwerken die elkaars denken aanscherpen. De rest van mijn wiel klinkt mee zonder te sturen. Tegenover mijn kern staat de Onschuldige, een stem van vertrouwen en loslaten, op ruim minder dan de helft van mijn kern: hoorbaar, maar zelden aan het woord.',
    wheelTitle: 'Mijn wiel',
    wheel: [
      'Het wiel laat zien waar mijn punten vandaan komen. De donkergroene kern zijn mijn eigen keuzes; de lagen daaromheen zijn wat via de vaste lijnen van het wiel binnenstroomde — echo uit mijn eigen hardware, de blauwe brug, de gele driehoek en de schaduw.',
      'De Magiër staat ver bovenaan, en het grootste deel van zijn gewicht koos ik zelf: van alles wat in de groep van mijn kern terechtkwam, ruim twee derde. Het is een gekozen identiteit, geen echo. De Rebel is ook overwegend eigen keuze. De Held zit ertussenin: een flink deel van zijn gewicht kwam binnen via mijn keuzes voor de Magiër, dus ik lees hem als mijn eigen hardware die zichzelf versterkt, niet als een derde identiteit. De Nar staat bijna even hoog als de Held, maar dat is grotendeels echo van de Rebel: ik klink soms als een Nar omdat we hardware delen, niet omdat ik er een ben. Het lichtst wegen de Rechter en de Ontdekker, de Heerser niet veel zwaarder. Dat is geen gebrek; het is terrein waar ik nog niet geweest ben.',
    ],
    oceanTitle: 'Mijn Big Five',
    oceanIntro: 'Ik heb mijn eigen Big Five-rapport meegegeven. Het model meet die traits niet; het vertaalt hoe mijn configuratie ze uitdrukt en legt de twee instrumenten naast elkaar — waar zeggen ze hetzelfde over mij, en waar niet.',
    // Named so the numbers below are verifiable: they come from an outside instrument, not from us.
    oceanSource: { text: 'De cijfers hieronder komen uit dat externe rapport, afgenomen en gerapporteerd door', name: 'persoonlijkheid.nl', url: 'https://www.persoonlijkheid.nl' },
    oceanNames: { O: 'Openheid', C: 'Consciëntieusheid', E: 'Extraversie', A: 'Meegaandheid', N: 'Neuroticisme' },
    aspectNames: {
      intellect: 'Intellect', aesthetic: 'Esthetische openheid', industriousness: 'IJver', orderliness: 'Ordelijkheid',
      assertiveness: 'Assertiviteit', enthusiasm: 'Enthousiasme', compassion: 'Compassie', politeness: 'Beleefdheid',
      volatility: 'Volatiliteit', withdrawal: 'Terugtrekking',
    },
    ocean: {
      O: 'Mijn openheid is niet de breedte van wat ik opneem, maar van wat ik bereid ben te verbouwen. Intellect ligt boven esthetische openheid: ik ben open via systemen, modellen en wat-als, minder via schoonheid om de schoonheid. Dat spoort met mijn wiel tot in het detail, want de hardware waar esthetiek leeft — de Kunstenaar — is precies mijn blindspot. Hier zeggen beide instrumenten hetzelfde: ik zoek niet receptief, maar disruptief.',
      C: 'Hier wringt het, en dat vind ik de interessantste plek. Het wiel leest mijn Magiër en mijn Rebel als weinig gehecht aan regels: kortere wegen, kaders breken. En toch meldt mijn zelfrapport 96. Ik lees dat als discipline in dienst van het doel — de volharding die nodig is om een systeem echt te breken en te herbouwen. IJver verklaart mijn Held moeiteloos. Ordelijkheid niet: de Heerser en de Rechter zijn mijn lichtste gewichten. Het wiel zegt kaderbreker, het zelfrapport zegt ordelijk, en ik kies geen winnaar.',
      E: 'Volgens het wiel werkt de Magiër liever van achter het gordijn. Mijn 88 zegt iets anders, en dat is De Protagonist letterlijk: de tovenaar die niet achter het gordijn blijft, maar het toneel op loopt. Assertiviteit ligt ver boven enthousiasme. Ik stap naar voren, neem de leiding en zet door; de warmte van anticipatie en verbinding weegt bij mij lichter. Ik ben eerder iemand die de ruimte inneemt dan iemand die hem opwarmt.',
      A: 'Een 39 past bij een Magiër en een Rebel: ik ruil de waarheid niet in voor een prettige sfeer. Maar de aspecten zijn de echte bevinding. Compassie 76, beleefdheid 9. Dat is geen tegenspraak; het is mijn handtekening. Ik voel scherp wat er met mensen gebeurt, en ik zeg ze toch de waarheid in het gezicht. Ik saboteer de etiquette, niet de persoon.',
      N: 'Twee van de honderd. Dat lees ik niet als onverstoorbaar, maar als een configuratie die haar kost niet voelt: bij mijn actiehardware is de afwezigheid van gevoelde spanning juist het signaal. Volatiliteit 7 wringt met mijn Rebel, die het wiel leest als een motor op verontwaardiging. Terugtrekking 2 klopt wel: mijn kern werkt naar buiten. Wat dit getal niet ziet, is wáár mijn afdaling landt — en bij mij landt ze op één plek, laat en hard.',
    },
    hardwareTitle: 'Mijn hardware onder druk',
    hardware: [
      'Mijn curve is vlak, vlak, vlak — en dan de klif. Dat begint bij mijn actiemotor, gebouwd rond dopamine dat niet op de beloning reageert maar op het najagen ervan. Oplopende druk verhoogt bij mij niet de weerstand, maar de drive: ik lees spanning als “nog niet gewonnen” en antwoord met meer uitvoering. Het alarmsignaal — de berekening van wat dit gaat kosten — wordt bij de Magiër gedempt zolang ik de variabelen kan bespelen, en bij de Held actief naar beneden geregeld. Twee stemmen in mij zetten het alarm dus uit, elk op hun eigen manier.',
      'Ondertussen vergrendelt mijn netwerk voor doelgerichte controle zich in toenaderingsstand. Eerst versmalt mijn aandacht tot tunnelvisie, dan reguleer ik mijn drive in plaats van mijn kalmte, en ten slotte verdwijnt het vermogen om de missie zelf ter discussie te stellen. Wat zich in die tijd opbouwt, is de slijtage van een lichaam dat nooit terugschakelt. Die rekening voel ik niet; ze wordt verzameld.',
      'Het ene netwerk dat dit zou kunnen onderbreken, is het Salience Network: de schakelaar tussen doen en reflecteren. Precies dat netwerk voert mijn Rebel aan — maar hij zet de schakelaar in disruptiestand en maakt van spanning meteen actie. Bij mij is de rem aanwezig, en afgesteld als gaspedaal.',
      'Op het wiel delen de Magiër en de Held dezelfde groene boog: versterking zonder tegengewicht. De Rebel hangt aan een gele lijn, geen oppositie. De enige echte tegenkracht in mijn geometrie, de Kunstenaar, ligt op de rode naad die niets doorgeeft, en de Onschuldige, die overgave zou brengen, zit buiten mijn actieve set. Er zit in mij geen anker dat afremt. Alles duwt, breekt of verdubbelt — tot in de vierde fase de kost die niemand prijsde in één keer betaald moet worden.',
    ],
    reflectionTitle: 'Mijn stille stem — Reflectie',
    reflection: [
      'Mijn tweede stem staat nooit uit. De Rebel bewerkt mijn Magiër voortdurend en zichtbaar, en altijd in dezelfde richting.',
      'Wat hij omhoog duwt: Modulatie, Perceptie en Abstractie. Modulatie niet als kalmering maar als loslaten — een kader laten vallen zodra het knelt. Perceptie als het snelle lezen van de kamer: wie liegt, wat stagneert, waar de scheur zit. Abstractie als herkaderen, niet als beschouwen. Wat hij omlaag trekt: Differentiatie, Coördinatie en Aandacht — minder vaste grenzen, minder regelen, minder vergrendelde focus.',
      'Die gedempte Coördinatie is geen tekort; het is de stille kant van dezelfde hardware. Ik zet niet eerst het hele bord neer, maar verplaats meteen de ene steen die de rest doet schuiven, en laat het veld zich herschikken nadat ik het heb opengebroken.',
      'De Held klinkt daarnaast mee uit mijn eigen hardware. Hij verandert de richting niet, hij drukt haar aan. Van binnen voelt dat als één stem met een scherpe rand: doorgaan — en als het niet beweegt, breken.',
    ],
    motivationTitle: 'Mijn stille stem — Motivatie',
    motivation: [
      'De rekening valt niet overal even hard. Ik lees haar langs mijn eigen curve.',
      { h: 'Werk' },
      'Hier floreer ik, en lang. De eerste drie fasen lezen van buiten als prestatie: escaleren onder druk ziet eruit als iemand die meer doet dan iedereen. Ik breek wat vastzit, voer uit en herbouw — en precies dat wordt beloond. Werk is bij mij het domein dat maskeert: de rekening is er laag, tot ze dat niet meer is.',
      { h: 'Vrienden' },
      'Hier verschijnen de eerste scheuren, in de derde fase. Het dwingende moeten-transformeren maakt van vriendschap een project en van vrienden bijrollen; wie niet mee wil in het verhaal, verdwijnt uit beeld. Niemand loopt met een knal weg. Mensen worden stiller — en ik merk het laat, omdat mijn afdaling geen kleur heeft.',
      { h: 'Intiem' },
      'Hier landt de klif het eerst. In de vierde fase ontmoet ik het onbeweegbare: de partner die niet gered wil worden, de wil die niet buigt, het verhaal dat echt niet om mij draait. Mijn kern ervaart dat als existentieel, en de Rebel en de Held hebben er niets tegenover te zetten. De uitputting die erop volgt, ziet wie het dichtst bij me staat het eerst.',
      'Kort gezegd: intiem draagt het zwaarst, vrienden merken het, werk betaalt het laatst. Dezelfde curve, drie adressen.',
    ],
    footnote: 'Zelfreflectie binnen het Deltawerken-model: de neurobiologische termen zijn beeldspraak binnen dit model, geen klinische beschrijving.',
  },

  en: {
    name: 'The Protagonist',
    pairing: 'Magician × Rebel — my profile',
    lesson: 'The world takes shape around whoever dares to carry the story, so I carried it — everywhere, always. But a lead without fellow players performs to an empty hall. My best chapter began when I gave someone else the opening.',
    lessonLabel: 'My life lesson',
    intro: 'This is my own profile, as the Deltawerken model read it: The Protagonist, with the Magician as my core and the Rebel as my second voice. I rewrote the report in my own words so you can see what such a reading looks like. It is a mirror for self-reflection, not a diagnosis.',
    giftTitle: 'My gift',
    gift: 'Bending reality by seizing the story. Where others wait, I see where a stuck situation tips — and I do not wait for permission to make that turn. I step into the middle of the story and give it a twist, out loud and in plain sight. People notice that something is happening as soon as I walk into the room. Stories that are stuck start moving because I dare to step into them.',
    geometryTitle: 'My geometry',
    geometry: 'My strength sits clearly in one place: the Magician, standing far above everything else. Two voices decide how that strength shows — the Rebel, who breaks frames open and wants everyone to see it, and the Hero, who comes from the same hardware as my core and pushes on until the result is there. A yellow line connects the Magician and the Rebel: no shared hardware, but two networks that sharpen each other’s thinking. The rest of my wheel sounds along without steering. Opposite my core stands the Innocent, a voice of trust and letting go, at well under half of my core: audible, but rarely speaking.',
    wheelTitle: 'My wheel',
    wheel: [
      'The wheel shows where my points come from. The dark-green core is my own choices; the layers around it are what flowed in along the wheel’s fixed lines — echo from my own hardware, the blue bridge, the yellow triangle and the shadow.',
      'The Magician stands far at the top, and I chose most of its weight myself: of everything that landed in my core’s group, well over two thirds. It is a chosen identity, not an echo. The Rebel is mostly my own choice too. The Hero sits in between: a good part of its weight came in through my choices for the Magician, so I read it as my own hardware reinforcing itself, not as a third identity. The Trickster stands almost as high as the Hero, but that is mostly an echo of the Rebel: I sometimes sound like a Trickster because we share hardware, not because I am one. The Judge and the Explorer weigh the least, the Ruler not much more. That is not a lack; it is ground I have not walked yet.',
    ],
    oceanTitle: 'My Big Five',
    oceanIntro: 'I added my own Big Five report. The model does not measure those traits; it translates how my configuration expresses them and sets the two instruments side by side — where do they say the same about me, and where not.',
    oceanSource: { text: 'The figures below come from that outside report, administered and reported by', name: 'persoonlijkheid.nl', url: 'https://www.persoonlijkheid.nl' },
    oceanNames: { O: 'Openness', C: 'Conscientiousness', E: 'Extraversion', A: 'Agreeableness', N: 'Neuroticism' },
    aspectNames: {
      intellect: 'Intellect', aesthetic: 'Aesthetic openness', industriousness: 'Industriousness', orderliness: 'Orderliness',
      assertiveness: 'Assertiveness', enthusiasm: 'Enthusiasm', compassion: 'Compassion', politeness: 'Politeness',
      volatility: 'Volatility', withdrawal: 'Withdrawal',
    },
    ocean: {
      O: 'My openness is not the breadth of what I take in, but of what I am willing to rebuild. Intellect sits above aesthetic openness: I am open through systems, models and what-ifs, less through beauty for its own sake. That matches my wheel down to the detail, because the hardware where aesthetics lives — the Artist — is exactly my blind spot. Here both instruments say the same: I do not seek receptively, but disruptively.',
      C: 'This is where it grinds, and I find it the most interesting place. The wheel reads my Magician and my Rebel as hardly attached to rules: shortcuts, broken frames. And yet my self-report says 96. I read that as discipline in service of the goal — the persistence it takes to really break a system and rebuild it. Industriousness explains my Hero effortlessly. Orderliness does not: the Ruler and the Judge are my lightest weights. The wheel says frame-breaker, the self-report says orderly, and I do not pick a winner.',
      E: 'According to the wheel, the Magician prefers to work from behind the curtain. My 88 says something else, and that is The Protagonist literally: the magician who does not stay behind the curtain, but walks onto the stage. Assertiveness sits far above enthusiasm. I step forward, take the lead and push through; the warmth of anticipation and connection weighs less in me. I am more someone who takes up the room than someone who warms it.',
      A: 'A 39 fits a Magician and a Rebel: I do not trade the truth for a pleasant atmosphere. But the aspects are the real finding. Compassion 76, politeness 9. That is not a contradiction; it is my signature. I feel sharply what happens to people, and I still tell them the truth to their face. I sabotage the etiquette, not the person.',
      N: 'Two out of a hundred. I do not read that as unflappable, but as a configuration that does not feel its cost: in my action hardware, the absence of felt tension is the signal itself. Volatility 7 grinds against my Rebel, whom the wheel reads as an engine running on indignation. Withdrawal 2 does fit: my core works outward. What this number does not see is where my descent lands — and in me it lands in one place, late and hard.',
    },
    hardwareTitle: 'My hardware under pressure',
    hardware: [
      'My curve is flat, flat, flat — and then the cliff. It starts with my action engine, built around dopamine that responds not to the reward but to chasing it. Rising pressure does not raise my resistance, it raises my drive: I read tension as “not won yet” and answer with more execution. The alarm signal — the calculation of what this will cost — is dampened in the Magician as long as I can play the variables, and actively turned down in the Hero. So two voices in me switch the alarm off, each in its own way.',
      'Meanwhile my network for goal-directed control locks into approach mode. First my attention narrows to tunnel vision, then I regulate my drive instead of my calm, and finally the ability to question the mission itself disappears. What builds up in that time is the wear of a body that never shifts down. I do not feel that bill; it is being collected.',
      'The one network that could interrupt this is the Salience Network: the switch between doing and reflecting. That is exactly the network my Rebel leads — but he sets the switch to disruption and turns tension straight into action. In me the brake is there, and tuned as an accelerator.',
      'On the wheel the Magician and the Hero share the same green arc: reinforcement without a counterweight. The Rebel hangs on a yellow line, not an opposition. The only real counterforce in my geometry, the Artist, sits on the red seam that passes nothing on, and the Innocent, who would bring surrender, sits outside my active set. There is no anchor in me that slows things down. Everything pushes, breaks or doubles — until in the fourth phase the cost nobody priced has to be paid at once.',
    ],
    reflectionTitle: 'My quiet voice — Reflection',
    reflection: [
      'My second voice is never off. The Rebel works on my Magician constantly and visibly, and always in the same direction.',
      'What he pushes up: Modulation, Perception and Abstraction. Modulation not as calming but as letting go — dropping a frame as soon as it pinches. Perception as reading the room fast: who is lying, what is stagnating, where the crack is. Abstraction as reframing, not as contemplating. What he pulls down: Differentiation, Coordination and Attention — fewer fixed boundaries, less arranging, less locked focus.',
      'That dampened Coordination is not a shortfall; it is the quiet side of the same hardware. I do not set up the whole board first, but move the one stone that makes the rest shift, and let the field rearrange itself after I have broken it open.',
      'Next to him the Hero sounds along from my own hardware. He does not change the direction, he presses it home. From the inside that feels like one voice with a sharp edge: keep going — and if it does not move, break it.',
    ],
    motivationTitle: 'My quiet voice — Motivation',
    motivation: [
      'The bill does not fall equally hard everywhere. I read it along my own curve.',
      { h: 'Work' },
      'Here I flourish, and for a long time. From the outside the first three phases read as performance: escalating under pressure looks like someone doing more than everyone else. I break what is stuck, execute and rebuild — and that is exactly what gets rewarded. For me work is the domain that masks: the bill is low there, until it is not.',
      { h: 'Friends' },
      'This is where the first cracks appear, in the third phase. The urgent need to transform turns friendship into a project and friends into supporting roles; whoever does not want to join the story drops out of the picture. Nobody leaves with a bang. People go quieter — and I notice it late, because my descent has no colour.',
      { h: 'Intimate' },
      'Here the cliff lands first. In the fourth phase I meet the immovable: the partner who does not want to be rescued, the will that does not bend, the story that really is not about me. My core experiences that as existential, and the Rebel and the Hero have nothing to set against it. The exhaustion that follows is seen first by whoever stands closest to me.',
      'In short: intimacy carries it hardest, friends notice it, work pays last. The same curve, three addresses.',
    ],
    footnote: 'Self-reflection within the Deltawerken model: the neurobiological terms are imagery within this model, not a clinical description.',
  },
};
