/**
 * Garden for Life — Assessment Data (Level: Meester — Neurobiological Edition)
 *
 * 36 questions × 6 answers × 2 picks = 72 datapunten
 * 5 subjects: Zelf/Zonde (Q1-Q9), Ander/Attentie (Q10-Q18),
 *             Massa/Macht (Q19-Q24), Wereld/Wijsheid (Q25-Q30),
 *             Mysterie/Magie (Q31-Q36)
 *
 * ─── Neuraal Schakelbord v3 — 6 Numbered Rotation Keys (1-6) ───
 *
 * Archetype Nummering (1-12 op het wiel):
 *   1=Judge(G1)  2=Lover(G2)  3=Caregiver(G2)  4=Innocent(G3)
 *   5=Explorer(G3)  6=Outlaw(G4)  7=Trickster(G4)  8=Sage(G5)
 *   9=Artist(G5)  10=Magician(G6)  11=Hero(G6)  12=Ruler(G1)
 *
 * 6 Rotation Keys (Slot A→F per key):
 *   Key 1: Judge(1), Trickster(7), Lover(2),     Sage(8),      Innocent(4),  Hero(11)
 *   Key 2: Explorer(5), Artist(9), Judge(1),      Trickster(7), Lover(2),     Magician(10)
 *   Key 3: Caregiver(3), Hero(11), Innocent(4),   Artist(9),    Judge(1),     Trickster(7)
 *   Key 4: Lover(2), Ruler(12),    Explorer(5),   Hero(11),     Outlaw(6),    Sage(8)
 *   Key 5: Innocent(4), Magician(10), Outlaw(6),  Ruler(12),    Caregiver(3), Artist(9)
 *   Key 6: Outlaw(6), Sage(8),     Caregiver(3),  Magician(10), Explorer(5),  Ruler(12)
 *
 * N/C Routing (PER SLOT, not per question):
 *   Standard (S): Slot A,C,E = Nature; Slot B,D,F = Culture
 *   Mirror   (M): Slot A,C,E = Culture; Slot B,D,F = Nature
 *
 * Mode per question follows 36Q rotation matrix:
 *   Block 0 (Q1-Q6):   S,M,S,M,S,M    Block 3 (Q19-Q24): M,S,M,S,M,S
 *   Block 1 (Q7-Q12):  M,S,M,S,M,S    Block 4 (Q25-Q30): S,M,S,M,S,M
 *   Block 2 (Q13-Q18): S,M,S,M,S,M    Block 5 (Q31-Q36): M,S,M,S,M,S
 *
 * Dual-Pick scoring per question (1st = Identity, 2nd = Navigation):
 *   Core: 1st pick +9(Nature)/+7(Culture), 2nd pick +6(Nature)/+4(Culture)
 *   Shadow Drip: 1st pick + Nature slot only → +1 to 180° partner
 *   Relations (between pick 1 & pick 2): Green +4, Blue +3, Purple +5, Yellow +2×2, Red +1
 *
 * Beheersing Counter: +7 per question where both picks share a bio group (Green+Blue)
 * Harmony Counter: +5 per question where picks are 180° shadow opposites (Purple)
 * Frictie Counter: +1 per question where picks are Red Line pairs
 *
 * Symmetrie: each archetype has exactly 9 Nature + 9 Culture appearances = 50/50
 */

// ──────── 6 Rotation Keys (Neuraal Schakelbord v3) ────────
// Each key maps slots A-F (positions 0-5) to archetypes.
// Keys cycle 1→2→3→4→5→6 per block of 6 questions.
const ROTATION_KEYS = {
  1: ['JUDGE', 'TRICKSTER', 'LOVER', 'SAGE', 'INNOCENT', 'HERO'],
  2: ['EXPLORER', 'ARTIST', 'JUDGE', 'TRICKSTER', 'LOVER', 'MAGICIAN'],
  3: ['CAREGIVER', 'HERO', 'INNOCENT', 'ARTIST', 'JUDGE', 'TRICKSTER'],
  4: ['LOVER', 'RULER', 'EXPLORER', 'HERO', 'OUTLAW', 'SAGE'],
  5: ['INNOCENT', 'MAGICIAN', 'OUTLAW', 'RULER', 'CAREGIVER', 'ARTIST'],
  6: ['OUTLAW', 'SAGE', 'CAREGIVER', 'MAGICIAN', 'EXPLORER', 'RULER'],
};

/**
 * Get the rotation key number (1-6) for a given question number (1-based).
 * Keys cycle 1→2→3→4→5→6 repeatedly across all 36 questions.
 */
function getKeyForQuestion(questionNum) {
  return ((questionNum - 1) % 6) + 1;
}

/**
 * Get the Standard/Mirror mode for a given question number (1-based).
 * Based on a 2-factor pattern: block parity × position parity.
 *   Even blocks (0,2,4): even positions = Standard, odd = Mirror
 *   Odd  blocks (1,3,5): even positions = Mirror,   odd = Standard
 *
 * @returns {boolean} true = Standard, false = Mirror
 */
function isStandardMode(questionNum) {
  const block = Math.floor((questionNum - 1) / 6);
  const posInBlock = (questionNum - 1) % 6;
  return (posInBlock % 2) === (block % 2);
}

/**
 * Determine N/C routing for a specific answer SLOT within a question.
 * Standard: even slots (A=0, C=2, E=4) → Nature, odd slots (B=1, D=3, F=5) → Culture
 * Mirror:   reversed — even slots → Culture, odd slots → Nature
 *
 * @param {number} questionNum - 1-based question number
 * @param {number} slotPos     - 0-based answer slot position (0=A, 1=B, ..., 5=F)
 * @returns {boolean} true if this slot routes to Nature
 */
function isNatureSlot(questionNum, slotPos) {
  const standard = isStandardMode(questionNum);
  const isEvenSlot = slotPos % 2 === 0;
  return standard ? isEvenSlot : !isEvenSlot;
}

/**
 * Get the layer index for a given question number (1-based).
 * Layer 0: Q1-Q9, Layer 1: Q10-Q18, Layer 2: Q19-Q24,
 * Layer 3: Q25-Q30, Layer 4: Q31-Q36.
 */
function getLayerForQuestion(questionNum) {
  if (questionNum <= 9) return 0;
  if (questionNum <= 18) return 1;
  if (questionNum <= 24) return 2;
  if (questionNum <= 30) return 3;
  return 4;
}

/**
 * Legacy isNatureRouting — returns Nature status for the QUESTION overall.
 * In the new system, routing is per-slot. This returns Nature for Position 0 (Slot A).
 * @deprecated Use isNatureSlot(questionNum, slotPos) instead.
 */
function isNatureRouting(questionNum) {
  return isNatureSlot(questionNum, 0);
}

/**
 * Returns the archetype key for a given question number (1-36) and
 * answer position (0-5 = slots A-F).
 */
function getArchetypeForAnswer(questionNum, answerPos) {
  const keyNum = getKeyForQuestion(questionNum);
  return ROTATION_KEYS[keyNum][answerPos];
}

// ──────── Helper: build an answer object ────────
function ans(questionNum, pos, text) {
  const letter = String.fromCharCode(97 + pos); // a-f
  return {
    id: `${questionNum}${letter}`,
    text,
    value: pos + 1, // 1-6
    archetype: getArchetypeForAnswer(questionNum, pos),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// LAYER 1 — Zelf / Zonde  Q1-Q9
// ═══════════════════════════════════════════════════════════════════════

const layer1Questions = [
  // ─── Q1 (Key 1, Standard) ───
  {
    id: 1,
    text: 'Wat vergeef je jezelf het moeilijkst?',
    domain: 'introversie',
    answers: [
      ans(1, 0, 'Dat ik wist dat het niet klopte en er toch in meeging. Niet de fout zelf \u2014 maar dat ik mijn {PURPLE>eigen kompas} negeerde.'),
      ans(1, 1, 'Dat ik er {ORANGE>een grap} van maakte terwijl het ertoe deed. Ik betrap mezelf erop dat lichtheid me beschermt \u2014 maar soms beschermt het me tegen precies dat wat ik had moeten voelen.'),
      ans(1, 2, 'Dat ik {PURPLE>afstand hield} terwijl iemand dichtbij wilde komen. Het besef dat iemand zich naar me uitstrekte en ik er niet was \u2014 dat blijft hangen.'),
      ans(1, 3, 'Dat ik {ORANGE>begrijpen} ben gaan gebruiken {ORANGE>als excuus} om niet te bewegen. Dat voelt als scherpte, maar het werkt als uitstel \u2014 die dubbele bodem zie ik scherp.'),
      ans(1, 4, 'Dat ik {PURPLE>cynisch werd}. Dat er een moment was waarop ik stopte met geloven dat het goed zou komen. Niet de tegenslag \u2014 maar dat ik mijn eigen hoop liet varen.'),
      ans(1, 5, 'Dat ik {ORANGE>prestatie} gelijk ben gaan stellen {ORANGE>aan waarde}. Die vergelijking kost me elke keer dat ik rust neem \u2014 alsof stilstaan een schuld oplevert.'),
    ],
  },

  // ─── Q2 (Key 2, Mirror) ───
  {
    id: 2,
    text: 'Je ontdekt dat iets waar je lang in geloofde niet klopt. Wat is je eerste beweging?',
    domain: 'introversie',
    answers: [
      ans(2, 0, 'Ik {PURPLE>scan} meteen wat er nu {PURPLE>mogelijk is}. Want een overtuiging die valt maakt altijd meer ruimte vrij dan ze innam \u2014 die dynamiek herken ik als mijn eigen operating system.'),
      ans(2, 1, 'Het voelt alsof er iets {ORANGE>scheurt}. Niet in mijn hoofd \u2014 {ORANGE>dieper}. Dat gat moet ik eerst voelen voordat ik er iets mee kan.'),
      ans(2, 2, 'Ik {PURPLE>ga na} welke beslissingen op die overtuiging rustten. Want als het {PURPLE>fundament} niet klopt, wil ik weten wat er nog overeind staat voordat ik verder bouw.'),
      ans(2, 3, 'Eerlijk gezegd vind ik het {ORANGE>grappig} \u2014 dat ik er zo lang in trapte. Geloven is sowieso een tijdelijk contract.'),
      ans(2, 4, 'Mijn eerste gedachte gaat naar de {PURPLE>mensen} met wie ik {PURPLE>dit deelde}. Inmiddels herken ik dat patroon \u2014 eerst zij, dan pas ik.'),
      ans(2, 5, 'Ik word wakker. Alsof er een laag wegvalt en ik {ORANGE>scherper} zie. Een {ORANGE>illusie minder} is een hefboom meer.'),
    ],
  },

  // ─── Q3 (Key 3, Standard) ───
  {
    id: 3,
    text: 'Welk deel van jezelf bescherm je het felst \u2014 ook tegen de mensen die het dichtst bij je staan?',
    domain: 'introversie',
    answers: [
      ans(3, 0, '{PURPLE>Hoeveel de zorg me kost}. Als ze zouden weten hoe leeg de tank soms is, zouden ze zich inhouden \u2014 en dat kan ik niet hebben.'),
      ans(3, 1, 'Mijn twijfel. Want zodra {ORANGE>mensen} die zien, {ORANGE>leunen ze minder} op me \u2014 en die rol geef ik niet op.'),
      ans(3, 2, 'Dat ik nog steeds {PURPLE>geloof} dat het goed komt. In een {PURPLE>wereld die daar cynisch over doet}, voelt die hoop kwetsbaar \u2014 alsof ik het moet bewaken.'),
      ans(3, 3, 'Mijn binnenwereld. Wat ik naar buiten breng is altijd al {ORANGE>vertaald} \u2014 het {ORANGE>ruwe origineel} verdampt te snel, en die vertaling kost kracht.'),
      ans(3, 4, 'Hoe hard ik over {PURPLE>mezelf oordeel}. Die interne rechtbank draait dag en nacht. Als mensen dat zouden zien, zouden ze schrikken.'),
      ans(3, 5, 'Hoe {ORANGE>serieus het er vanbinnen} aan toe gaat. Want zodra ik dat laat zien, worden mensen voorzichtig \u2014 en dan verlies ik de enige ruimte waarin ik eerlijk kan zijn.'),
    ],
  },

  // ─── Q4 (Key 4, Mirror) ───
  {
    id: 4,
    text: 'Wanneer voel jij je het verst van jezelf verwijderd?',
    domain: 'introversie',
    answers: [
      ans(4, 0, 'Als ik functioneer {PURPLE>in plaats van voel}. Ik betrap mezelf op het moment dat het kantelt \u2014 het is hoe ik overleef, niet hoe ik leef.'),
      ans(4, 1, 'Als het {ORANGE>chaos} is en ik er {ORANGE>niks aan kan doen}. Niet andermans chaos \u2014 die van mijzelf. Dat is geen ongemak, dat is alarm.'),
      ans(4, 2, 'Als ik {PURPLE>te lang op dezelfde plek} zit. Door de tijd heen is dat mijn betrouwbaarste waarschuwing geworden \u2014 herhaling is mijn signaal dat ik vastzit.'),
      ans(4, 3, 'Als ik niks heb om voor te vechten. {ORANGE>Geen doel}, geen weerstand. Die leegte is het engste \u2014 alsof ik zonder strijd verdamp.'),
      ans(4, 4, '{PURPLE>Als ik meedoe} aan iets waar ik niet achter sta. Want elke dag dat ik mijn mond hou, merk ik dat er iets in me stilvalt.'),
      ans(4, 5, 'Als ik {ORANGE>niet meer kan denken}. Niet vermoeidheid \u2014 ruis. Te veel prikkels, te weinig stilte. Dan verlies ik het signaal.'),
    ],
  },

  // ─── Q5 (Key 5, Standard) ───
  {
    id: 5,
    text: 'Er is iets in je leven dat je al maanden uitstelt. Waar wacht je eigenlijk op?',
    domain: 'introversie',
    answers: [
      ans(5, 0, 'Op een teken dat {PURPLE>het veilig is}. Niet rationeel \u2014 ik weet dat het er misschien nooit komt. Maar iets in mij weigert te springen zolang de landing onzeker is.'),
      ans(5, 1, 'Op het juiste moment. Want {ORANGE>timing is alles} \u2014 te vroeg bewegen verspilt de impact. \u00c9\u00e9n goed getimede zet doet meer dienst dan tien gehaaste.'),
      ans(5, 2, 'Op niks. Ik stel het niet uit omdat ik wacht \u2014 ik stel het uit omdat het {PURPLE>systeem eromheen niet deugt}. Vroeger zou ik het hebben opgeblazen. Nu wacht ik tot ik weet w\u00e1t er moet veranderen.'),
      ans(5, 3, 'Op het moment dat ik de {ORANGE>uitvoering volledig kan regisseren}. Want half werk levert dubbele schade \u2014 dat is de duurste les die ik draag.'),
      ans(5, 4, 'Op een moment waarop het niemand raakt. Ik weet wat ik moet doen, maar elke optie heeft {PURPLE>gevolgen voor iemand anders}. Dus ik wacht.'),
      ans(5, 5, 'Op het gevoel dat het klopt. Ik kan het technisch uitvoeren wanneer ik wil, maar zonder die {ORANGE>innerlijke resonantie} wordt het een lege handeling. Dat verschil peil ik feilloos.'),
    ],
  },

  // ─── Q6 (Key 6, Mirror) ───
  {
    id: 6,
    text: 'Wat is het gevaarlijkste dat je ooit tegen jezelf hebt gezegd \u2014 en geloofde?',
    domain: 'introversie',
    answers: [
      ans(6, 0, '"{PURPLE>Het maakt niet uit wat ik vind}." Want zodra ik dat geloofde, ging ik meedoen met dingen die niet klopten \u2014 en het stilzwijgen bleek de werkelijke schade.'),
      ans(6, 1, '"{ORANGE>Ik snap het}." Terwijl ik het helemaal niet snapte \u2014 ik had alleen een model dat klopte. Het gevaarlijkste moment is wanneer begrip aanvoelt als controle.'),
      ans(6, 2, '"{PURPLE>Ze hebben me nodig}." Dat klonk als liefde, maar het deed dienst als ketting. Zolang ik onmisbaar was, hoefde ik niet naar mezelf te kijken.'),
      ans(6, 3, '"{ORANGE>Ik kan dit fixen}." Alles. Altijd. Het gevaarlijke is niet de arrogantie \u2014 het is dat het vaak klopt. En juist omdat het klopt, stopte ik met vragen of ik het ook m\u00f3est.'),
      ans(6, 4, '"{PURPLE>Ik hoef nergens bij te horen}." Want dat voelde als vrijheid, maar het functioneerde als verdedigingslinie. Achter die linie werd het steeds stiller.'),
      ans(6, 5, '"{ORANGE>Als ik het niet doe, doet niemand het}." En het klopt \u2014 meestal. Maar die overtuiging vult elke ruimte. Er blijft niks over voor de twijfel, de rust, het loslaten.'),
    ],
  },

  // ─── Q7 (Key 1, Mirror) ───
  {
    id: 7,
    text: 'Wanneer heb je voor het laatst iets over jezelf ontdekt dat je liever niet had geweten?',
    domain: 'introversie',
    answers: [
      ans(7, 0, 'Toen ik merkte dat {PURPLE>mijn strengheid} naar anderen een omweg was om mezelf niet aan te kijken. Dat inzicht bouwde zich over maanden op.'),
      ans(7, 1, 'Dat ik {ORANGE>grappen maak als het pijn doet}. Niet als strategie \u2014 het gebeurt gewoon. De lach zit er eerder dan de traan, en ik weet niet of dat kracht is of een reflex waar ik niks aan kan doen.'),
      ans(7, 2, 'Dat ik soms {PURPLE>geef om te krijgen}. Die ontdekking ondermijnt het verhaal dat ik mijn warmte onvoorwaardelijk deel.'),
      ans(7, 3, 'Dat ik meer weet dan ik durf toe te passen. De {ORANGE>kennis is er}, het inzicht is er \u2014 maar de moed om {ORANGE>ernaar te handelen blijft achter}.'),
      ans(7, 4, 'Dat mijn {PURPLE>optimisme soms als schild werkt}. Er zijn momenten waarop ik het positieve opzoek niet omdat ik erin geloof, maar omdat het alternatief te zwaar voelt.'),
      ans(7, 5, 'Dat ik niet stop omdat ik gedreven ben, maar omdat ik {ORANGE>bang} ben voor wat er overblijft {ORANGE>als ik stilsta}. Die motor draait altijd \u2014 en ik weet niet hoe het voelt als hij stopt.'),
    ],
  },

  // ─── Q8 (Key 2, Standard) ───
  {
    id: 8,
    text: 'Wat is de prijs die je betaalt voor wie je bent \u2014 en die je nooit hardop uitspreekt?',
    domain: 'introversie',
    answers: [
      ans(8, 0, 'Dat ik nergens helemaal land. Mensen, plekken, projecten \u2014 ik ben er altijd net niet helemaal. De {PURPLE>vrijheid die dat oplevert is dezelfde vrijheid die me eenzaam maakt}.'),
      ans(8, 1, 'Dat de {ORANGE>intensiteit waarmee ik de wereld zie} me soms ongeschikt maakt voor het gewone leven. Ik heb dat leren verpakken \u2014 maar de grondstof blijft rauw en het verpakken vreet.'),
      ans(8, 2, 'Dat mensen me respecteren maar zelden warmte geven. Mijn {PURPLE>eerlijkheid schept afstand} \u2014 niet omdat ik dat wil, maar omdat de waarheid scherper snijdt dan een leugen.'),
      ans(8, 3, 'Dat {ORANGE>niemand me helemaal serieus neemt}. Zelfs als ik iets meen, zoeken mensen naar de grap. Ik zie mezelf die dynamiek in stand houden \u2014 en tegelijk erin vastzitten.'),
      ans(8, 4, 'Dat ik te veel voel. De wereld raakt me harder dan anderen, en dat maakt me goed in {PURPLE>verbinden maar kwetsbaar} op plekken waar anderen beschermd zijn.'),
      ans(8, 5, 'Dat ik altijd bezig ben met de volgende versie. Van alles \u2014 van mezelf, van het plan. Die constante transformatie dient als motor maar houdt me {ORANGE>weg van het nu}.'),
    ],
  },

  // ─── Q9 (Key 3, Mirror) ───
  {
    id: 9,
    text: 'Als je alles zou verliezen \u2014 status, bezit, relaties \u2014 wat blijft er dan over?',
    domain: 'introversie',
    answers: [
      ans(9, 0, 'De drang om iets {PURPLE>voor iemand te betekenen}. Zelfs zonder al het andere blijf ik overeind zolang er iemand is die me nodig heeft. Ik betrap mezelf erop dat dat mooi klinkt \u00e9n een val is.'),
      ans(9, 1, 'De weigering om te stoppen. Alles kan weg \u2014 als die {ORANGE>motor maar blijft draaien}. Het is geen keuze, het is wat er overblijft als al het andere stilvalt.'),
      ans(9, 2, 'De {PURPLE>overtuiging dat het weer goed komt}. Niet blind \u2014 ik heb genoeg meegemaakt om te weten dat hoop geen garantie is \u2014 dus kies ik er bewust voor.'),
      ans(9, 3, 'De binnenkant. Alles wat ik van buiten opbouwde is een vertaling \u2014 {ORANGE>het origineel zit in mij}. Dat kan niemand afpakken, niet omdat ik het bescherm, maar omdat het nergens anders bestaat.'),
      ans(9, 4, '{PURPLE>Mijn code}. Want alles wat ik bezat was gebouwd op een fundament van principes. Als het gebouw instort, toets ik wat overblijft aan datzelfde fundament \u2014 die procedure is mijn kompas.'),
      ans(9, 5, '{ORANGE>De lach}. Serieus. Neem alles weg en ik zit in een leeg veld en vind het grappig. Niet cynisch \u2014 \u00e9cht grappig. En in die absurditeit zit iets onverwoestbaars.'),
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LAYER 2 — Ander / Attentie  Q10-Q18
// ═══════════════════════════════════════════════════════════════════════

const layer2Questions = [
  // ─── Q10 (Key 4, Standard) ───
  {
    id: 10,
    text: 'Wat merk je het eerst op aan een ander mens?',
    domain: 'introversie',
    answers: [
      ans(10, 0, 'Of ze {PURPLE>echt aanwezig} zijn. Niet wat ze zeggen — maar of er iemand thuis is achter de ogen. Dat voel ik binnen een seconde.'),
      ans(10, 1, '{ORANGE>Hoe ze zich positioneren}. Wie beweegt alsof de ruimte van hen is, wie zich aanpast — die hiërarchie lees ik als een dashboard.'),
      ans(10, 2, '{PURPLE>Of ze me verrassen}. Één onverwachte zin, één draai die ik niet zag aankomen — dan ben ik wakker. Voorspelbaarheid maakt me blind.'),
      ans(10, 3, '{ORANGE>Of ze ergens voor staan}. Mensen zonder ruggengraat— ik merk dat ik ze automatisch lager inschat.'),
      ans(10, 4, '{PURPLE>Niet beleefd, eerlijk, echt}. Ik ruik aanpassing van kilometers. Vroeger stootte het me af. Nu lees ik het.'),
      ans(10, 5, '{ORANGE>Hoe hun hoofd werkt}. Niet wát ze weten, maar welke verbanden ze leggen. Over de jaren is dat mijn scherpste filter geworden.'),
    ],
  },

  // ─── Q11 (Key 5, Mirror) ───
  {
    id: 11,
    text: 'Wat irriteert je het meest aan andere mensen?',
    domain: 'introversie',
    answers: [
      ans(11, 0, '{PURPLE>Bewust cynisch}. De keuze om niet te geloven terwijl vertrouwen mogelijk is. Die keuze begrijp ik — verdragen kost me nog steeds moeite.'),
      ans(11, 1, 'Als iemand {ORANGE>vastloopt terwijl de deur al open staat}. Ik zie de opening die zij niet zien — en dat verschil frustreert me fysiek, op een manier die ik niet kan uitleggen.'),
      ans(11, 2, 'Als iemand {PURPLE>liegt en denkt dat ik het niet doorheb}. Niet de leugen irriteert me — het gebrek aan respect dat erachter zit. Die ontleding heb ik scherp.'),
      ans(11, 3, 'Als iemand {ORANGE>chaos veroorzaakt die te voorkomen was}. Als iets dat ik vertrouw begint te schuiven door nalatigheid — dat voelt niet als ergernis maar als alarm.'),
      ans(11, 4, '{PURPLE>Opzettelijke wreedheid}. Dat is het enige moment waarop mijn geduld opraakt — en ik merk dat mijn reactie dan feller is dan de situatie vraagt.'),
      ans(11, 5, 'Als {ORANGE>iemand oppervlakkig is en het niet eens merkt}. Niet oppervlakkig als keuze — maar als staat. Die platte blik op de wereld maakt iets in me dicht.'),
    ],
  },

  // ─── Q12 (Key 6, Standard) ───
  {
    id: 12,
    text: 'Waar ben jij mild voor bij een ander — en strict voor bij jezelf?',
    domain: 'introversie',
    answers: [
      ans(12, 0, '{PURPLE>Fouten uit eerlijkheid}. Als iemand iets kapotmaakt terwijl ze het juiste probeerden — dat snap ik meteen, dit is mijn taal.'),
      ans(12, 1, '{ORANGE>Dat ze het niet zien}. Niet iedereen kijkt op dezelfde diepte — die correctie op mijn eigen verwachting heb ik bewust moeten maken.'),
      ans(12, 2, '{PURPLE>Het moment dat iemand het niet redt} en het probeert te verbergen. Dan verdwijnt oordeel en blijft alleen de drang.'),
      ans(12, 3, '{ORANGE>Als iemand het probeert en faalt}. Elke poging verdient respect — die overtuiging heb ik bewust geconstrueerd. Bij mezelf geldt hij minder.'),
      ans(12, 4, '{PURPLE>Het niet kunnen landen}. Iemand die steeds opnieuw vertrekt — dat herken ik als ademhaling, niet als gebrek. Behalve bij mezelf.'),
      ans(12, 5, '{ORANGE>Fouten in de uitvoering}. Leiderschap is feilbaar — die mildheid is aangeleerd en kost me nog steeds moeite.'),
    ],
  },

  // ─── Q13 (Key 1, Mirror) ───
  {
    id: 13,
    text: 'Hoe weet jij of je iemand kunt vertrouwen?',
    domain: 'introversie',
    answers: [
      ans(13, 0, 'Aan of hun {PURPLE>woorden en hun daden kloppen}. Die check draait continu — ik doe het niet bewust, het is hoe ik luister.'),
      ans(13, 1, 'Aan of ze kunnen lachen om zichzelf. {ORANGE>Zelfspot is mijn betrouwbaarste detector}.'),
      ans(13, 2, '{PURPLE>Ik voel het}. Niet aan wat ze zeggen — aan wat er onder zit. Een soort temperatuur die ik binnen een paar seconden peil.'),
      ans(13, 3, 'Aan de consistentie van hun denken. Ik heb ontdekt dat wie {ORANGE>helder redeneert ook helder handelt} — en dat tegenstrijdigheid het eerste alarmsignaal is.'),
      ans(13, 4, 'Ik begin met {PURPLE>vertrouwen — dat is mijn startpositie}. Pas als iemand het actief breekt, schakelt dat om — en dat kost ze moeite.'),
      ans(13, 5, 'Aan of ze doen wat ze zeggen als het moeilijk wordt. Niet intentie maar {ORANGE>actie onder druk} — dat is de enige meetlat die ik nog hanteer.'),
    ],
  },

  // ─── Q14 (Key 2, Mirror) ───
  {
    id: 14,
    text: 'Wat zien andere mensen bij jou over het hoofd?',
    domain: 'introversie',
    answers: [
      ans(14, 0, 'Dat mijn vertrek niet over hen gaat. Mensen lezen mijn behoefte aan {PURPLE>ruimte als afwijzing} — terwijl het precies het tegenovergestelde doet: het houdt me beschikbaar.'),
      ans(14, 1, '{ORANGE>Hoeveel ik waarneem}. Ze denken dat ik in mijn eigen wereld zit — maar ik zie alles. Elk detail, elke verschuiving. Ik reageer er alleen niet op.'),
      ans(14, 2, '{PURPLE>Dat mijn strengheid zorg is}. Het ziet eruit als afstand— maar de rol die ik daarin speel is die van iemand die wil dat mensen hun beste versie zijn.'),
      ans(14, 3, '{ORANGE>Hoe serieus het er vanbinnen aan toe gaat}. Ze zien de grap. Niet de pijn die eronder zit. En eerlijk gezegd is dat ook de bedoeling.'),
      ans(14, 4, '{PURPLE>Dat mijn warmte me moeite kost}. Mensen denken dat het vanzelf gaat — maar elke keer dat ik geef, gaat er iets af. Die energiebalans hou ik stil.'),
      ans(14, 5, '{ORANGE>Dat ik altijd drie stappen verder ben}. Wat eruitziet als geduld is eigenlijk wachten tot zij inhalen. Dat zien ze niet — ze denken dat ik naast ze loop.'),
    ],
  },

  // ─── Q15 (Key 3, Standard) ───
  {
    id: 15,
    text: 'Wat geef jij onverminderd aan anderen?',
    domain: 'introversie',
    answers: [
      ans(15, 0, '{PURPLE>Veiligheid}. Niet een plek — een gevoel. Ik creëer het om mensen heen zonder erbij na te denken — zonder oordeel, zonder agenda. Dat stroomt vanzelf.'),
      ans(15, 1, '{ORANGE>Zekerheid}. Mensen leunen op mij alsof ik het altijd weet. Ergens onderweg is die rol geen keuze meer geworden maar een automatisme.'),
      ans(15, 2, '{PURPLE>Vertrouwen}. Ik geef het weg alsof het oneindig is — aan iedereen, steeds opnieuw. Zelfs als het al eerder gebroken werd.'),
      ans(15, 3, '{ORANGE>Aandacht}. Ik zie nuances in mensen die ze zelf nog niet zien. Over de jaren is dat mijn scherpste gave geworden — maar het {ORANGE>vreet veel energie}.'),
      ans(15, 4, '{PURPLE>Eerlijkheid}. De onversneden versie. Al heeft wijsheid me geleerd dat niet alles wat waar is gezegd hoeft te worden.'),
      ans(15, 5, '{ORANGE>Lichtheid}. Ik maak het dragelijk. De lach, de relativering, de draai. Ik merk dat ik dat niet voor mezelf kan doen. Alleen voor anderen.'),
    ],
  },

  // ─── Q16 (Key 4, Mirror) ───
  {
    id: 16,
    text: 'Wanneer trek jij je terug uit een relatie of vriendschap?',
    domain: 'introversie',
    answers: [
      ans(16, 0, 'Als ik meer aandacht investeer dan er terugkomt. Ik zie mezelf {ORANGE>dat kantelpunt naderen} — het punt waarop verbinding overgaat in eenrichtingsverkeer.'),
      ans(16, 1, 'Als iemand {PURPLE>bewust mijn principes ondermijnt}. Dan {PURPLE>gaat er een deur dicht} waar ik niet over onderhandel.'),
      ans(16, 2, 'Als het voorspelbaar wordt. Ik vertrek niet uit boosheid maar {ORANGE>uit verveling} — en dat laatste doet meer schade dan ik lang dacht.'),
      ans(16, 3, 'Als iemand weigert voor zichzelf te vechten. Ik kan lang meevechten, maar op het moment dat zij stoppen, {PURPLE>stopt er iets in mij}.'),
      ans(16, 4, 'Als de oneerlijkheid groter wordt dan wat ons verbindt. Want zodra we die grens over zijn, {ORANGE>ben ik weg zonder waarschuwing}.'),
      ans(16, 5, 'Als gesprekken circulair worden. Dezelfde patronen, dezelfde blinde vlekken. Dan {PURPLE>droogt mijn interesse op} als water voor de zon.'),
    ],
  },

  // ─── Q17 (Key 5, Standard) ───
  {
    id: 17,
    text: 'Wat heb je van een ander nodig dat je nooit hardop vraagt?',
    domain: 'introversie',
    answers: [
      ans(17, 0, 'Dat ze het niet kapotmaken. Niet beschermen — gewoon niet kapotmaken. Ik kan tegen tegenslag, maar tegen bewuste vergiftiging van iets dat goed is {PURPLE>heb ik geen verdediging}.'),
      ans(17, 1, 'Dat ze me laten werken {ORANGE>zonder het te hoeven uitleggen}. Het verantwoorden van processen die ik zelf nog aan het ontdekken ben — dat remt me meer dan welke tegenslag ook.'),
      ans(17, 2, 'Dat ze er nog zijn nadat ik alles heb gezegd. {PURPLE>Ik spreek me altijd uit} — dat is niet het probleem. Het probleem is de {PURPLE>stilte erna}.'),
      ans(17, 3, 'Dat iemand een keer de regie overneemt. Maar {ORANGE>de rol van degene die het nooit vraagt, speelt zichzelf voort}.'),
      ans(17, 4, 'Dat iemand ziet dat ik moe ben zonder dat ik het hoef te laten zien. Dat verlangen {PURPLE>zit in mijn botten} — het is te groot om in woorden te passen.'),
      ans(17, 5, 'Dat ze me niet vragen het uit te leggen. {ORANGE>De vraag \'waarom?\' vernietigt} precies datgene wat ik probeer te delen.'),
    ],
  },

  // ─── Q18 (Key 6, Mirror) ───
  {
    id: 18,
    text: 'Wat projecteer jij op anderen dat eigenlijk van jou is?',
    domain: 'introversie',
    answers: [
      ans(18, 0, '{ORANGE>Meeloperij}. Ik veroordeel mensen die meedoen met systemen die niet kloppen. Maar ik {ORANGE>betrap mezelf} erop dat die woede dubbelzijdig is — de momenten waarop ik zelf zweeg, branden het hardst.'),
      ans(18, 1, '{PURPLE>Onverschilligheid voor diepte}. Als iemand niet nadenkt, voel ik iets dat lijkt op {PURPLE>walging}. Alsof ze bewust de deur dichtdoen naar iets dat voor mij alles is.'),
      ans(18, 2, '{ORANGE>Egoïsme}. Als iemand voor zichzelf kiest, voel ik iets scherps. Die scherpte {ORANGE>werkt als spiegel} — ik gun hen wat ik mezelf niet geef.'),
      ans(18, 3, '{PURPLE>Passiviteit}. Als iemand lijdt aan iets dat op te lossen is en het niet doet — {PURPLE>mijn handen jeuken}. Het is fysiek. Alsof hun stilstand mij persoonlijk raakt.'),
      ans(18, 4, '{ORANGE>Vastklampen}. Als iemand vasthoudt aan wat was, voel ik ongeduld. Die irritatie {ORANGE>herken ik als mijn eigen angst} — de angst dat ik zelf ooit zo vast kom te zitten.'),
      ans(18, 5, '{PURPLE>Zwakte}. Als iemand de controle verliest, voel ik geen medelijden — ik voel ongemak. {PURPLE>Alsof hun chaos besmettelijk is} en ik er afstand van moet nemen.'),
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LAYER 3 — Massa / Macht  Q19-Q24
// ═══════════════════════════════════════════════════════════════════════

const layer3Questions = [
  // ─── Q19 (Key 1, Mirror) ───
  {
    id: 19,
    text: 'Wat verandert er als jij een ruimte binnenkomt?',
    domain: 'massa',
    answers: [
      ans(19, 0, '{ORANGE>De standaard stijgt}. Ik merk dat mensen scherper worden — en {ORANGE>die functie vervul ik bewust}.'),
      ans(19, 1, 'Het wordt {PURPLE>sfeervoller}. Niet door mij — het is alsof de spanning zakt zodra ik er ben. Ik zeg niks, het {PURPLE>is er gewoon}.'),
      ans(19, 2, '{ORANGE>Mensen ontspannen}. Ik zie mezelf die ruimte creëren — het is een automatisme waar ik de kosten van ken.'),
      ans(19, 3, '{PURPLE>Gesprekken worden dieper}. Niet altijd gewild — maar mensen schakelen over zodra ik er ben. Alsof oppervlakte niet meer werkt.'),
      ans(19, 4, 'Het {ORANGE>wordt lichter}. Mensen laten hun scherpe randjes vallen — die dynamiek herken ik als mijn eigen werking.'),
      ans(19, 5, '{PURPLE>Mensen gaan op aan}. Niet richting mij — maar {PURPLE>alsof ze plots iets hebben besloten}. Die verwachting hang ik niet op, die is er.'),
    ],
  },

  // ─── Q20 (Key 2, Standard) ───
  {
    id: 20,
    text: 'Wat is jouw relatie tot ambitie?',
    domain: 'massa',
    answers: [
      ans(20, 0, 'Ambitie is {PURPLE>richting, niet bestemming}. Het doel staat vast of niet — {PURPLE>Het IS de zoektocht}.'),
      ans(20, 1, '{ORANGE>Ambitie dient als brandstof}, maar zodra het het werk gaat sturen in plaats van voeden, merk ik dat het {ORANGE>me leegtrekt}.'),
      ans(20, 2, '{PURPLE>Ambitie is niet het punt}. De standaard is het punt. Als wat ik doe niet klopt, doet bereiken er niet toe.'),
      ans(20, 3, 'Ambitie? Die heb ik — maar zodra het serieus wordt, geef ik het een draai. {ORANGE>Het doel bereiken én het licht houden} — die balans navigeer ik bewust.'),
      ans(20, 4, 'Ambitie voelt alleen echt {PURPLE>als het iemand raakt}. {PURPLE>Bereiken voor mezelf} is {PURPLE>hol} — het moet landen bij een ander.'),
      ans(20, 5, '{ORANGE>Ambitie werkt bij mij als hefboom} — niet het doel zelf, maar {ORANGE>wat ik ermee kan transformeren}. Die mechanica doorzie ik scherp.'),
    ],
  },

  // ─── Q21 (Key 3, Mirror) ───
  {
    id: 21,
    text: 'Hoe ga jij om met erkenning?',
    domain: 'massa',
    answers: [
      ans(21, 0, 'Het voelt ongemakkelijk. Ik merk dat ik het {ORANGE>meteen doorgeef} — die reflex vervult een functie die ik ken.'),
      ans(21, 1, '{PURPLE>Ik neem het aan en ga door}. Niet uit bescheidenheid — er is gewoon altijd een volgend ding. {PURPLE>Stilstaan bij erkenning voelt als remmen}.'),
      ans(21, 2, 'Het raakt me oprecht — maar ik {ORANGE>betrap mezelf} erop dat ik het {ORANGE>nodig heb als bevestiging}. Die afhankelijkheid zie ik scherp.'),
      ans(21, 3, 'Meestal verkeerd gericht. Ze erkennen het resultaat, niet het proces. {PURPLE>Het deel dat ertoe deed is onzichtbaar} — en dat is oké.'),
      ans(21, 4, 'Erkenning weeg ik aan de bron. Niet elke stem telt gelijk — dat is {ORANGE>een selectie die ik bewust hanteer}.'),
      ans(21, 5, '{PURPLE>Ik lach het weg}. Niet om het af te wijzen — het is meer dat het {PURPLE>serieus nemen ervan iets breekt}. Erkenning is het grappigste compliment.'),
    ],
  },

  // ─── Q22 (Key 4, Standard) ───
  {
    id: 22,
    text: 'Wat doe jij als niemand kijkt?',
    domain: 'massa',
    answers: [
      ans(22, 0, '{PURPLE>Hetzelfde. Maar zachter}. Zonder publiek val ik terug op wat echt is — en dat is stiller dan mensen denken.'),
      ans(22, 1, '{ORANGE>Structuur houden}. De systemen draaien of er publiek is of niet — maar ik merk dat {ORANGE>de scherpte daalt als er niemand meekijkt}. Die val ken ik.'),
      ans(22, 2, 'Dan pas {PURPLE>beweeg ik echt}. Zonder kijkers verdwijnt de richting en {PURPLE>begint het ontdekken}. Dat is waar ik het scherpst ben.'),
      ans(22, 3, '{ORANGE>Minder}. Ik betrap mezelf erop dat {ORANGE>de motor zachter draait als er niemand leunt}. Die afhankelijkheid van een publiek — die rol doorzie ik.'),
      ans(22, 4, '{PURPLE>Precies hetzelfde}. Publiek verandert niks — {PURPLE>mijn kompas draait niet op goedkeuring}. Het is het enige dat ik vertrouw.'),
      ans(22, 5, '{ORANGE>Dan denk ik het helderst}. Zonder input van buitenaf {ORANGE>werkt mijn hoofd als schoonste instrument}. Dat verschil herken ik als mijn kwetsbaarheid.'),
    ],
  },

  // ─── Q23 (Key 5, Mirror) ───
  {
    id: 23,
    text: 'Wanneer zeg jij nee tegen meer?',
    domain: 'massa',
    answers: [
      ans(23, 0, 'Als meer de {ORANGE>zuiverheid van wat er is bedreigt}. Die grens herken ik als mijn beschermingsmechanisme — niet alles wat groeit wordt beter.'),
      ans(23, 1, 'Als meer {PURPLE>transformatie in de weg staat}. Het punt is niet hoeveel — het punt is wat ik ermee kan doen. Meer zonder hefboom is ballast.'),
      ans(23, 2, 'Als meer betekent dat ik me moet {ORANGE>aanpassen aan een systeem dat niet klopt}. Die conditie is mijn hardste grens.'),
      ans(23, 3, 'Als de {PURPLE>complexiteit de architectuur overstijgt}. {PURPLE>Chaos is mijn grondstof}, maar als patronen vervagen verliest de constructie haar fundament.'),
      ans(23, 4, 'Als meer betekent {ORANGE>dat iemand tekortkomt}. Die afweging maak ik bewust — de schaal waarop ik weeg heeft altijd een ander erop.'),
      ans(23, 5, 'Als het {PURPLE>niet meer resoneert}. Meer is niet dieper — het is luider. En luid maakt dat ik het signaal verlies.'),
    ],
  },

  // ─── Q24 (Key 6, Standard) ───
  {
    id: 24,
    text: 'Wat triggert jou als iemand anders de leiding heeft?',
    domain: 'massa',
    answers: [
      ans(24, 0, 'Als ze leiden vanuit positie en niet vanuit waarheid. Dan voelt het als {PURPLE>bedrog} — mijn {PURPLE>lijf verzet zich voor mijn hoofd het registreert}.'),
      ans(24, 1, 'Als ze niet snappen waarom ze leiden. {ORANGE>Leiderschap zonder zelfkennis is gevaarlijk} — die inschatting werkt bij mij als automatische scan.'),
      ans(24, 2, '{PURPLE>Als de groep eronder lijdt}. Niet het leiderschap zelf — maar het effect op de mensen erin. Dat registreer ik eerder dan wie ook.'),
      ans(24, 3, 'Als ze de situatie niet lezen. Ik zie de {ORANGE>hefbomen die ze missen} — dat {ORANGE>ongeduld werkt als motor}, maar ik betrap mezelf erop dat het niet altijd fair is.'),
      ans(24, 4, '{PURPLE>Als ze de ruimte dichtmetselen}. Leiding is prima — maar zodra het verstikt, ga ik weg. Niet uit protest, uit noodzaak.'),
      ans(24, 5, 'Als ze {ORANGE>slordiger zijn dan ik zou zijn}. Die vergelijking maak ik automatisch — en ik doorzie dat dat meer over {ORANGE>mijn standaard} zegt dan over hun leiderschap.'),
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LAYER 4 — Wereld / Wijsheid  Q25-Q30
// ═══════════════════════════════════════════════════════════════════════

const layer4Questions = [
  // ─── Q25 (Key 1, Standard) ───
  {
    id: 25,
    text: 'Wanneer houd je kennis voor jezelf?',
    domain: 'wijsheid',
    answers: [
      ans(25, 0, 'Als de ander er niet klaar voor is. Ik voel dat — {PURPLE>niet als oordeel maar als timing}.'),
      ans(25, 1, 'Als het {ORANGE>deelmoment de vibe zou doden}. Ik doorzie dat {ORANGE>timing meer doet dan inhoud} — die mechanica zet ik bewust in.'),
      ans(25, 2, 'Als het {PURPLE>de ander zou raken op een plek die nog niet geheeld is}. Dat voel ik sneller dan ik het kan uitleggen.'),
      ans(25, 3, 'Als het {ORANGE>ontvangen van de kennis meer schade zou doen dan het niet-weten}. Deze afweging is mijn handvat.'),
      ans(25, 4, 'Als het {PURPLE>iemands vertrouwen zou breken}. Kennis die het licht uitdoet, hou ik vast. Dat is geen keuze — dat is bescherming.'),
      ans(25, 5, 'Als het {ORANGE>de actie zou vertragen}. Kennis die verlamt in plaats van activeert — die selectie maak ik automatisch, en ik merk dat het soms meer filtert dan nodig.'),
    ],
  },

  // ─── Q26 (Key 2, Mirror) ───
  {
    id: 26,
    text: 'Wat weet je zeker — zonder bewijs?',
    domain: 'wijsheid',
    answers: [
      ans(26, 0, 'Dat {ORANGE>er altijd meer is}. Die overtuiging werkt als kompas — het stuurt elke keuze die ik maak.'),
      ans(26, 1, '{PURPLE>Dat schoonheid er toe doet}. Niet als mening — als feit. Het zit in alles, en ik voel het voor ik het zie.'),
      ans(26, 2, '{ORANGE>Dat integriteit werkt}. Niet als moreel ideaal — als operationeel systeem. Die overtuiging functioneert als fundament voor alles wat ik bouw.'),
      ans(26, 3, '{PURPLE>Dat niks permanent is}. Niet nihilistisch — bevrijdend. Het is de grond onder alles wat ik doe en voel.'),
      ans(26, 4, '{ORANGE>Dat verbinding geneest}. Niet als geloof — als observatie. Ik zie dat patroon in elke relatie die ik aanraak, en het functioneert als mijn diepste kompas.'),
      ans(26, 5, '{PURPLE>Dat bijna alles maakbaar is}. Niet als arrogantie — als waarneming. Elke situatie heeft een hefboom. Ik zie ze voor ik ze zoek.'),
    ],
  },

  // ─── Q27 (Key 3, Standard) ───
  {
    id: 27,
    text: 'Wat heb je moeten loslaten om te groeien?',
    domain: 'wijsheid',
    answers: [
      ans(27, 0, 'De {PURPLE>overtuiging dat ik onmisbaar ben}. Niet iedereen had mij nodig — sommigen hadden nodig dat ik losliet.'),
      ans(27, 1, 'De {ORANGE>overtuiging dat rust zwakte is}. Die gelijkstelling kost me tot op de dag van vandaag moeite — maar de rol van degene die nooit stopt, speel ik niet meer.'),
      ans(27, 2, 'Het {PURPLE>geloof dat iedereen het goed bedoelt}. Niet mijn vertrouwen — dat is er nog. Maar de naïviteit die er aan vastzat, is eraf.'),
      ans(27, 3, 'De {ORANGE>overtuiging dat het perfect moet zijn}. Het ruwe werkt beter — die ontdekking functioneert als mijn grootste bevrijding.'),
      ans(27, 4, 'De {PURPLE>overtuiging dat ik altijd gelijk heb}. Het kompas klopt — maar niet elke richting is de mijne om te bewandelen.'),
      ans(27, 5, 'De {ORANGE>overtuiging dat lichtheid alles oplost}. Sommige dingen moeten zwaar zijn — die conditie heb ik leren herkennen: zodra de grap het gevoel vervangt, werkt het tegen me.'),
    ],
  },

  // ─── Q28 (Key 4, Mirror) ───
  {
    id: 28,
    text: 'Wat zie jij in de wereld dat de meeste mensen missen?',
    domain: 'wijsheid',
    answers: [
      ans(28, 0, '{ORANGE>De onderstroom tussen mensen}. Wat er niet gezegd wordt maar wél speelt — die laag lees ik als een partituur.'),
      ans(28, 1, '{PURPLE>Waar de structuur het gaat begeven}. Niet het probleem zelf — de barst die eraan voorafgaat. Dat zie ik voor anderen het voelen.'),
      ans(28, 2, '{ORANGE>De uitweg}. In elke situatie, elk systeem, elke kamer — ik zie waar de opening zit. Die scan functioneert als mijn snelste reflex.'),
      ans(28, 3, '{PURPLE>Die stille strijd}. Wie er moeite heeft maar het niet laat zien — ik herken het direct. Alsof ik het gewicht voel dat zij dragen.'),
      ans(28, 4, '{ORANGE>Waar de macht eigenlijk zit} — en wie eronder lijdt. Dat mechanisme doorzie ik feilloos, en ik betrap mezelf erop dat het me nooit met rust laat.'),
      ans(28, 5, '{PURPLE>De patronen achter de patronen}. Niet wat er gebeurt — maar waarom het steeds opnieuw gebeurt. Dat zien stopt nooit.'),
    ],
  },

  // ─── Q29 (Key 5, Standard) ───
  {
    id: 29,
    text: 'Welke waarheid draag je die je liever niet had?',
    domain: 'wijsheid',
    answers: [
      ans(29, 0, '{PURPLE>Dat niet iedereen te redden is}. Mijn vertrouwen is er nog — maar het bijt nu.'),
      ans(29, 1, 'Dat {ORANGE>niet alles maakbaar is}. Die grens werkt als de strengste les die ik draag — hij definieert waar mijn kracht ophoudt.'),
      ans(29, 2, 'Dat {PURPLE>het systeem niet gaat veranderen} in mijn leven. De woede is er nog — maar het is een stille woede nu. Geïntegreerd, niet gedoofd.'),
      ans(29, 3, 'Dat {ORANGE>controle een illusie is}. Ik merk dat ik hem toch vasthoud — die paradox doorzie ik scherp, maar loslaten kost me meer dan vasthouden.'),
      ans(29, 4, 'Dat zorgen niet altijd helpt. {PURPLE>Soms is de beste zorg afstand} — en dat voelt als verraad aan alles wat ik ben.'),
      ans(29, 5, 'Dat {ORANGE>mijn esthetiek de werkelijkheid eigenlijk op afstand houdt}. Ik polijst het rauwe zo automatisch weg dat het filteren zelf onzichtbaar is geworden.'),
    ],
  },

  // ─── Q30 (Key 6, Mirror) ───
  {
    id: 30,
    text: 'Wat weet je nu door je participatie in de wereld?',
    domain: 'wijsheid',
    answers: [
      ans(30, 0, 'Dat {ORANGE>verandering niet komt van de mensen die het hardst schreeuwen}. Die les werkt als mijn strengste correctie — ik betrap mezelf erop dat ik het nog steeds vergeet.'),
      ans(30, 1, 'Dat {PURPLE>de diepste kennis niet in boeken zit maar in gezichten}. Het denken bracht me ver — maar de wereld zelf leerde me meer. Dat weten zit in mijn huid, niet in mijn hoofd.'),
      ans(30, 2, 'Dat {ORANGE>zorgen pas werkt als het niet om mij gaat}. Die dubbelheid doorzie ik scherp — het zuiverste geven is waar ik er niet meer in voorkom.'),
      ans(30, 3, 'Dat {PURPLE>de wereld niet wacht op mijn plan}. Ze beweegt — en het beste wat ik kan doen is meebewegen en bijsturen. Dat voelde ik voor ik het begreep.'),
      ans(30, 4, 'Dat {ORANGE>eindeloos zoeken het perfecte afweermechanisme is om nergens echt te hoeven landen}. Ik doorzie mijn eigen onrust nu als een strategie, niet meer als een roeping.'),
      ans(30, 5, 'Dat {PURPLE>loslaten meer kracht vraagt dan vasthouden}. Niet als les — als lichaamskennis. Mijn handen weten het, mijn hoofd nog niet helemaal.'),
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LAYER 5 — Mysterie / Magie  Q31-Q36
// ═══════════════════════════════════════════════════════════════════════

const layer5Questions = [
  // ─── Q31 (Key 1, Mirror) ───
  {
    id: 31,
    text: 'Wat voel je als je iets niet kunt verklaren?',
    domain: 'mysterie',
    answers: [
      ans(31, 0, '{ORANGE>Een drang om het te ordenen}. Ik merk dat mijn systeem blijft zoeken — ook als er niks te vinden is.'),
      ans(31, 1, '{PURPLE>Ik vind het grappig}. Niet alles hoeft te kloppen. Het mysterie is het beste deel.'),
      ans(31, 2, '{ORANGE>Verbinding}. Alsof het onverklaarbare me dichter bij iets brengt. Die sensatie herken ik als mijn diepste kompas.'),
      ans(31, 3, '{PURPLE>Honger}. {PURPLE>Diepere honger}. Het onkenbare is geen muur — het is een deur die harder trekt dan elk antwoord.'),
      ans(31, 4, '{ORANGE>Vertrouwen}. Niet alles hoeft begrepen te worden. Die overgave werkt als mijn stilste kracht.'),
      ans(31, 5, '{PURPLE>Onrust}. Mijn handen willen iets vasthouden — en er is niks. Dat is de onzekerste leegte.'),
    ],
  },

  // ─── Q32 (Key 2, Standard) ───
  {
    id: 32,
    text: 'Wat is groter dan jij?',
    domain: 'mysterie',
    answers: [
      ans(32, 0, '{PURPLE>Wat ik nog niet heb gezien}. {PURPLE>Het onontdekte is altijd groter}. Dat voelt niet als dreiging — als uitnodiging.'),
      ans(32, 1, '{ORANGE>Schoonheid}. Niet de mijne — die van alles. Die ervaring dient als bron voor alles wat ik maak.'),
      ans(32, 2, '{PURPLE>De waarheid}. Niet mijn versie — de echte. Die is altijd groter dan wat ik kan wegen.'),
      ans(32, 3, '{ORANGE>Het absurde}. Het feit dat alles tegelijk serieus en zinloos is — die paradox functioneert als mijn fundering.'),
      ans(32, 4, '{PURPLE>Wat er tussen mensen zit}. Die stroom is groter dan wie er ook in staat. Dat voel ik als zwaartekracht.'),
      ans(32, 5, '{ORANGE>Het systeem}. Ik kan sturen, buigen, transformeren — maar het geheel beweegt op een schaal die ik niet bepaal.'),
    ],
  },

  // ─── Q33 (Key 3, Mirror) ───
  {
    id: 33,
    text: 'Hoe verhoud je je tot wat je niet kunt beheersen?',
    domain: 'mysterie',
    answers: [
      ans(33, 0, 'Ik {ORANGE>vang op wat het achterlaat}. Niet het onbeheersbare zelf — {ORANGE>de mensen die erdoor geraakt worden}. Die reflex ken ik.'),
      ans(33, 1, '{PURPLE>Ik ga erop af}. Niet om het te overwinnen — maar {PURPLE>stilzitten is dodelijker dan verliezen}.'),
      ans(33, 2, 'Ik {ORANGE>vertrouw erop dat het ergens goed voor is}. Die overgave werkt als instrument — ook als ik niet zie waarvoor.'),
      ans(33, 3, '{PURPLE>Ik laat het door me heen}. Niet vasthouden, niet afweren — doorlaten. Wat overblijft is materiaal.'),
      ans(33, 4, '{ORANGE>Ik maak onderscheid tussen wat ik wél en niet kan sturen}. Die scheidslijn is mijn meest bewuste grens.'),
      ans(33, 5, '{PURPLE>Ik lach}. Niet omdat het grappig is — maar omdat verzet nog absurder zou zijn.'),
    ],
  },

  // ─── Q34 (Key 4, Standard) ───
  {
    id: 34,
    text: 'Wanneer voelde je je het kleinst — en was dat oké?',
    domain: 'mysterie',
    answers: [
      ans(34, 0, 'Toen ik {PURPLE>besefte dat liefde niet genoeg was om iemand te houden}. Dat was niet oké. Maar het was eerlijk.'),
      ans(34, 1, '{ORANGE>Toen controle er niks meer toe deed}. Die ervaring dient als ijkpunt — het herinnert me waar mijn grip ophoudt.'),
      ans(34, 2, '{PURPLE>Toen er niks meer te ontdekken viel} en ik toch ergens moest zijn. Dat was niet oké — het was verstikkend.'),
      ans(34, 3, '{ORANGE>Toen ik niet kon helpen}. Die machteloosheid doorzie ik als mijn kwetsbaarste plek — het is waar de rol stopt.'),
      ans(34, 4, 'Toen {PURPLE>het systeem won en ik er niks aan kon doen}. Dat voelde als verraad — door de werkelijkheid zelf.'),
      ans(34, 5, 'Toen {ORANGE>ik doorhad dat kennis niets oploste}. Die les werkt als mijn strengste correctie — weten is niet genoeg.'),
    ],
  },

  // ─── Q35 (Key 5, Mirror) ───
  {
    id: 35,
    text: 'Waar zit de grens van jouw controle?',
    domain: 'mysterie',
    answers: [
      ans(35, 0, '{ORANGE>Waar het vertrouwen begint}. Voorbij die grens kan ik niet sturen — die overgave herken ik als mijn sterkste positie.'),
      ans(35, 1, '{PURPLE>Bij de dood}. Alles daarvoor is buigbaar. Dat ene niet. En dat voelt als de enige muur die ik respecteer.'),
      ans(35, 2, 'Waar {ORANGE>mijn eerlijkheid de ander meer schaadt dan beschermt}. Die lijn betrap ik mezelf op — het is mijn dunste koord.'),
      ans(35, 3, '{PURPLE>Bij andere mensen}. Systemen kan ik sturen. Mensen niet. Dat voelt als de enige chaos die ik niet wil en kan temmen.'),
      ans(35, 4, 'Waar {ORANGE>mijn zorg de ander kleiner maakt in plaats van sterker}. Die grens herken ik als mijn gevaarlijkste valkuil.'),
      ans(35, 5, '{PURPLE>Bij het onbenoembare}. Waar taal stopt en het beeld begint — daar stopt mijn controle en begint alles wat ertoe doet.'),
    ],
  },

  // ─── Q36 (Key 6, Standard) ───
  {
    id: 36,
    text: 'Wat is heilig voor jou?',
    domain: 'mysterie',
    answers: [
      ans(36, 0, '{PURPLE>De waarheid}. Niet mijn waarheid — de waarheid. Die is er voor iedereen of voor niemand.'),
      ans(36, 1, '{ORANGE>De vraag}. Niet het antwoord — de vraag zelf. Die overtuiging functioneert als mijn diepste kompas.'),
      ans(36, 2, '{PURPLE>De kwetsbaarheid}, van iedereen. Het moment dat iemand laat zien wat ze verbergen — dat is het heiligste.'),
      ans(36, 3, 'Het {ORANGE>moment van transformatie}. Die seconde waarop iets verandert — die dynamiek doorzie ik als het enige dat echt telt.'),
      ans(36, 4, '{PURPLE>De eerste keer}. Iets zien, voelen, ergens zijn — voor het eerst. Niet herhaalbaar. Daarin zit het heilige.'),
      ans(36, 5, '{ORANGE>Mijn woord}. Als ik iets zeg, staat het. Die standaard is mijn fundament — ik hou daar meer aan vast dan aan wat ook.'),
    ],
  },
];

export const assessmentSubjects = [
  {
    id: 'layer-zelf',
    name: 'Zelf / Zonde',
    title: 'ZELF / ZONDE',
    subtitle: 'De innerlijke wereld en haar grenzen',
    color: '#22c55e',
    layerIndex: 0,
    fundamental: 'Fysiologische Standaarden',
    description: 'Onderzoek je innerlijke wereld, je grenzen en je relatie met het verleden.',
    questions: layer1Questions,
  },
  {
    id: 'layer-ander',
    name: 'Ander / Attentie',
    title: 'ANDER / ATTENTIE',
    subtitle: 'De buitenwereld en haar uitdagingen',
    color: '#3b82f6',
    layerIndex: 1,
    fundamental: 'Zelfvertrouwen, Karakter',
    description: 'Ontdek hoe je jezelf positioneert in teams, concurrentie en leiderschap.',
    questions: layer2Questions,
  },
  {
    id: 'layer-massa',
    name: 'Massa / Macht',
    title: 'MASSA / MACHT',
    subtitle: 'Het collectief en de cultuur',
    color: '#a855f7',
    layerIndex: 2,
    fundamental: 'Doel, Passie, Visie',
    description: 'Verken je visie op waarheid, technologie, tradities en creativiteit.',
    questions: layer3Questions,
  },
  {
    id: 'layer-wereld',
    name: 'Wereld / Wijsheid',
    title: 'WERELD / WIJSHEID',
    subtitle: 'Relaties en de biochemische make-up',
    color: '#ef4444',
    layerIndex: 3,
    fundamental: 'Zelfrealisatie, Transformatie',
    description: 'Verdiep je in relaties, de ziel, partnerkeuze en sociale dynamiek.',
    questions: layer4Questions,
  },
  {
    id: 'layer-mysterie',
    name: 'Mysterie / Magie',
    title: 'MYSTERIE / MAGIE',
    subtitle: 'Het transcendente en het natuurlijke',
    color: '#f97316',
    layerIndex: 4,
    fundamental: 'Intimiteit, Gemeenschap',
    description: 'Ontdek je relatie met de natuur, het mysterie en het hogere.',
    questions: layer5Questions,
  },
];

/**
 * Helper: get questions for a specific layer by index (0-4).
 */
export function getLayerQuestions(layerIndex) {
  const layer = assessmentSubjects[layerIndex];
  return layer ? layer.questions : [];
}

/**
 * Archetype rotation metadata — exported for scoring/analysis modules.
 */
export { ROTATION_KEYS, getKeyForQuestion, getLayerForQuestion, isStandardMode, isNatureRouting, isNatureSlot };
