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
      ans(1, 1, 'Dat ik er {ORANGE>een grap} van maakte terwijl het ertoe deed. Ergens heb ik geleerd dat lichtheid me beschermt \u2014 maar soms beschermt het me tegen precies dat wat ik had moeten voelen.'),
      ans(1, 2, 'Dat ik {PURPLE>afstand hield} terwijl iemand dichtbij wilde komen. Het besef dat iemand zich naar me uitstrekte en ik er niet was \u2014 dat blijft hangen.'),
      ans(1, 3, 'Dat ik {ORANGE>begrijpen} ben gaan gebruiken {ORANGE>als excuus} om niet te bewegen. Ergens heb ik mezelf aangeleerd dat zolang ik het nog aan het analyseren ben, ik nog niet hoef te kiezen. Dat voelt als scherpte, maar het werkt als uitstel.'),
      ans(1, 4, 'Dat ik {PURPLE>cynisch werd}. Dat er een moment was waarop ik stopte met geloven dat het goed zou komen. Niet de tegenslag \u2014 maar dat ik mijn eigen hoop liet varen.'),
      ans(1, 5, 'Dat ik {ORANGE>prestatie} gelijk ben gaan stellen {ORANGE>aan waarde}. Ergens heb ik geleerd dat stilstaan falen is \u2014 en nu veroordeel ik mezelf voor elke keer dat ik rust nam.'),
    ],
  },

  // ─── Q2 (Key 2, Mirror) ───
  {
    id: 2,
    text: 'Je ontdekt dat iets waar je lang in geloofde niet klopt. Wat is je eerste beweging?',
    domain: 'introversie',
    answers: [
      ans(2, 0, 'Ik {PURPLE>scan} meteen wat er nu {PURPLE>mogelijk is}. Want een overtuiging die valt maakt altijd meer ruimte vrij dan ze innam \u2014 dat is inmiddels een reflex.'),
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
      ans(3, 1, 'Mijn twijfel. Want zodra {ORANGE>mensen} die zien, {ORANGE>leunen ze minder} op me \u2014 en ergens onderweg is dat het laatste geworden dat ik wil.'),
      ans(3, 2, 'Dat ik nog steeds {PURPLE>geloof} dat het goed komt. In een {PURPLE>wereld die daar cynisch over doet}, voelt die hoop kwetsbaar \u2014 alsof ik het moet bewaken.'),
      ans(3, 3, 'Mijn binnenwereld. Wat ik naar buiten breng is altijd al {ORANGE>vertaald} \u2014 want het {ORANGE>ruwe origineel} verdampt zodra ik het te vroeg deel. Dat weet ik inmiddels.'),
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
      ans(4, 0, 'Als ik functioneer {PURPLE>in plaats van voel}. Inmiddels herken ik dat moment \u2014 het is hoe ik overleef, niet hoe ik leef.'),
      ans(4, 1, 'Als het {ORANGE>chaos} is en ik er {ORANGE>niks aan kan doen}. Niet andermans chaos \u2014 die van mijzelf. Dat is geen ongemak, dat is alarm.'),
      ans(4, 2, 'Als ik {PURPLE>te lang op dezelfde plek} zit. Over de jaren is dat mijn betrouwbaarste waarschuwing geworden \u2014 herhaling is mijn signaal dat ik vastzit.'),
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
      ans(5, 1, 'Op het juiste moment. Want {ORANGE>timing is alles} \u2014 te vroeg bewegen verspilt de impact. Inmiddels weet ik dat \u00e9\u00e9n goed getimede zet meer doet dan tien gehaaste.'),
      ans(5, 2, 'Op niks. Ik stel het niet uit omdat ik wacht \u2014 ik stel het uit omdat het {PURPLE>systeem eromheen niet deugt}. Bouwen op een rot fundament gaat me niet gebeuren.'),
      ans(5, 3, 'Op het moment dat ik de {ORANGE>uitvoering volledig kan regisseren}. Want half werk levert dubbele schade \u2014 dat is over de jaren mijn duurste les geweest.'),
      ans(5, 4, 'Op een moment waarop het niemand raakt. Ik weet wat ik moet doen, maar elke optie heeft {PURPLE>gevolgen voor iemand anders}. Dus ik wacht.'),
      ans(5, 5, 'Op het gevoel dat het klopt. Ik kan het technisch uitvoeren wanneer ik wil, maar zonder die {ORANGE>innerlijke resonantie} wordt het een lege handeling. Dat verschil herken ik inmiddels feilloos.'),
    ],
  },

  // ─── Q6 (Key 6, Mirror) ───
  {
    id: 6,
    text: 'Wat is het gevaarlijkste dat je ooit tegen jezelf hebt gezegd \u2014 en geloofde?',
    domain: 'introversie',
    answers: [
      ans(6, 0, '"{PURPLE>Het maakt niet uit wat ik vind}." Want zodra ik dat geloofde, ging ik meedoen met dingen die niet klopten \u2014 en het duurde lang voor ik doorhad dat het stilzwijgen de schade was.'),
      ans(6, 1, '"{ORANGE>Ik snap het}." Terwijl ik het helemaal niet snapte \u2014 ik had alleen een model dat klopte. Het gevaarlijkste moment is wanneer begrip aanvoelt als controle.'),
      ans(6, 2, '"{PURPLE>Ze hebben me nodig}." Dat klonk als liefde, maar over de jaren is het een ketting geworden. Zolang ik onmisbaar was, hoefde ik niet naar jezelf te kijken.'),
      ans(6, 3, '"{ORANGE>Ik kan dit fixen}." Alles. Altijd. Het gevaarlijke is niet de arrogantie \u2014 het is dat het vaak klopt. En juist omdat het klopt, stopte ik met vragen of ik het ook m\u00f3est.'),
      ans(6, 4, '"{PURPLE>Ik hoef nergens bij te horen}." Want dat voelde als vrijheid, maar inmiddels weet ik dat het een verdedigingslinie was. Achter die linie werd het steeds stiller.'),
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
      ans(7, 2, 'Dat ik soms {PURPLE>geef om te krijgen}. Het voelde als een klap \u2014 want ik had altijd gedacht dat mijn warmte onvoorwaardelijk was.'),
      ans(7, 3, 'Dat ik meer weet dan ik durf toe te passen. De {ORANGE>kennis is er}, het inzicht is er \u2014 maar de moed om {ORANGE>ernaar te handelen} blijft achter.'),
      ans(7, 4, 'Dat mijn {PURPLE>optimisme soms een schild} werkt. Er zijn momenten waarop ik het positieve opzoek niet omdat ik erin geloof, maar omdat het alternatief te zwaar voelt.'),
      ans(7, 5, 'Dat ik niet stop omdat ik gedreven ben, maar omdat ik {ORANGE>bang} ben voor wat er overblijft {ORANGE>als ik stilsta}. Die motor draait niet op ambitie \u2014 hij draait op vermijding.'),
    ],
  },

  // ─── Q8 (Key 2, Standard) ───
  {
    id: 8,
    text: 'Wat is de prijs die je betaalt voor wie je bent \u2014 en die je nooit hardop uitspreekt?',
    domain: 'introversie',
    answers: [
      ans(8, 0, 'Dat ik nergens helemaal land. Mensen, plekken, projecten \u2014 ik ben er altijd net niet helemaal. De {PURPLE>vrijheid die dat oplevert is dezelfde vrijheid die me eenzaam} maakt.'),
      ans(8, 1, 'Dat de {ORANGE>intensiteit waarmee ik de wereld zie} me soms ongeschikt maakt voor het gewone leven. Over de jaren heb ik dat leren verpakken \u2014 maar de grondstof is rauw.'),
      ans(8, 2, 'Dat mensen me respecteren maar zelden warmte geven. Mijn {PURPLE>eerlijkheid schept afstand} \u2014 niet omdat ik dat wil, maar omdat de waarheid scherper snijdt dan een leugen.'),
      ans(8, 3, 'Dat {ORANGE>niemand me helemaal serieus neemt}. Zelfs als ik iets meen, zoeken mensen naar de grap. Inmiddels besef ik dat ik die dynamiek zelf heb opgebouwd \u2014 en nu zit ik erin.'),
      ans(8, 4, 'Dat ik te veel voel. De wereld raakt me harder dan anderen, en dat maakt me goed in {PURPLE>verbinden maar kwetsbaar} op plekken waar anderen beschermd zijn.'),
      ans(8, 5, 'Dat ik altijd bezig ben met de volgende versie. Van alles \u2014 van mezelf, van het plan. Die constante transformatie dient als motor maar houdt me {ORANGE>weg van het nu}. Dat patroon herken ik, maar stoppen kan ik niet.'),
    ],
  },

  // ─── Q9 (Key 3, Mirror) ───
  {
    id: 9,
    text: 'Als je alles zou verliezen \u2014 status, bezit, relaties \u2014 wat blijft er dan over?',
    domain: 'introversie',
    answers: [
      ans(9, 0, 'De drang om iets {PURPLE>voor iemand te betekenen}. Want zelfs zonder al het andere blijf ik overeind zolang er iemand is die me nodig heeft. Dat klinkt mooi, maar inmiddels weet ik dat het ook een val is.'),
      ans(9, 1, 'De weigering om te stoppen. Alles kan weg \u2014 als die {ORANGE>motor maar blijft draaien}. Het is geen keuze, het is wat er overblijft als al het andere stilvalt.'),
      ans(9, 2, 'De {PURPLE>overtuiging dat het weer goed komt}. Niet blind \u2014 ik heb genoeg meegemaakt om te weten dat hoop geen garantie is. Maar ergens onderweg is het kiezen voor die hoop een bewuste houding geworden.'),
      ans(9, 3, 'De binnenkant. Alles wat ik van buiten opbouwde is een vertaling \u2014 {ORANGE>het origineel zit in mij}. Dat kan niemand afpakken, niet omdat ik het bescherm, maar omdat het nergens anders bestaat.'),
      ans(9, 4, '{PURPLE>Mijn code}. Want alles wat ik bezat was gebouwd op een fundament van principes. Als het gebouw instort, toets ik wat overblijft aan datzelfde fundament \u2014 zo heb ik het altijd gedaan.'),
      ans(9, 5, '{ORANGE>De lach}. Serieus. Neem alles weg en ik zit in een leeg veld en vind het grappig. Niet cynisch \u2014 \u00e9cht grappig. Omdat alles absurd is. En in die absurditeit zit iets onverwoestbaars.'),
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
      ans(10, 0, 'Of ze {PURPLE>echt aanwezig} zijn. Niet wat ze zeggen — maar of er iemand thuis is achter de ogen. Dat {PURPLE>voel ik} binnen een seconde.'),
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
      ans(13, 3, 'Aan de consistentie van hun denken. Ik heb ontdekt dat wie {ORANGE>helder redoneert ook helder handelt} — en dat tegenstrijdigheid het eerste alarmsignaal is.'),
      ans(13, 4, 'Ik begin met {PURPLE>vertrouwen}. Dat {PURPLE>is mijn startpositie}. Pas als iemand het actief breekt, schakelt dat om — en dat kost ze moeite.'),
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
      ans(15, 0, '{PURPLE>Veiligheid}. {PURPLE>Niet een plek} — {PURPLE>een gevoel}. Ik creëer het om mensen heen zonder erbij na te denken — zonder oordeel, zonder agenda. Dat stroomt vanzelf.'),
      ans(15, 1, '{ORANGE>Zekerheid}. Mensen leunen op mij alsof ik het altijd weet. Ergens onderweg is {ORANGE>die rol geen keuze meer} geworden maar een automatisme.'),
      ans(15, 2, '{PURPLE>Vertrouwen}. Ik geef het weg {PURPLE>alsof het oneindig is} — aan iedereen, steeds opnieuw. Zelfs als het al eerder gebroken werd.'),
      ans(15, 3, '{ORANGE>Aandacht}. Ik zie {ORANGE>nuances in mensen die ze zelf nog niet zien}. Over de jaren is dat mijn scherpste gave geworden — maar het {ORANGE>vreet veel energie}.'),
      ans(15, 4, '{PURPLE>Eerlijkheid}. De {PURPLE>onversneden versie}. Al heeft wijsheid me geleerd dat niet alles wat waar is gezegd hoeft te worden.'),
      ans(15, 5, '{ORANGE>Lichtheid}. Ik {ORANGE>maak het dragelijk}. De lach, de relativering, de draai. Ik merk dat ik dat niet voor mezelf kan doen. Alleen voor anderen.'),
    ],
  },

  // ─── Q16 (Key 4, Mirror) ───
  {
    id: 16,
    text: 'Wanneer trek jij je terug uit een relatie of vriendschap?',
    domain: 'introversie',
    answers: [
      ans(16, 0, 'Als ik {ORANGE>meer aandacht investeer dan er terugkomt}. Ik zie mezelf {ORANGE>dat kantelpunt naderen} — het punt waarop verbinding overgaat in eenrichtingsverkeer.'),
      ans(16, 1, 'Als iemand {PURPLE>bewust mijn principes ondermijnt}. Dan {PURPLE>gaat er een deur dicht} waar ik niet over onderhandel.'),
      ans(16, 2, 'Als het {ORANGE>voorspelbaar} wordt. Ik {ORANGE>vertrek} niet uit boosheid maar {ORANGE>uit verveling} — en dat laatste doet meer schade dan ik lang dacht.'),
      ans(16, 3, 'Als iemand {PURPLE>weigert voor zichzelf te vechten}. Ik kan lang meevechten, maar op het moment dat zij stoppen, {PURPLE>stopt er iets in mij}.'),
      ans(16, 4, 'Als de {ORANGE>oneerlijkheid groter wordt} dan wat ons verbindt. Want zodra we die grens over zijn, {ORANGE>ben ik weg} zonder waarschuwing.'),
      ans(16, 5, '{PURPLE>Als gesprekken circulair} worden. Dezelfde patronen, dezelfde blinde vlekken. Dan {PURPLE>droogt mijn interesse op} als water voor de zon.'),
    ],
  },

  // ─── Q17 (Key 5, Standard) ───
  {
    id: 17,
    text: 'Wat heb je van een ander nodig dat je nooit hardop vraagt?',
    domain: 'introversie',
    answers: [
      ans(17, 0, '{PURPLE>Dat ze het niet kapotmaken}. Niet beschermen — gewoon niet kapotmaken. Ik kan tegen tegenslag, maar tegen {PURPLE>bewuste vergiftiging} van iets dat goed is {PURPLE>heb ik geen verdediging}.'),
      ans(17, 1, 'Dat ze {ORANGE>me laten} werken {ORANGE>zonder} het te hoeven {ORANGE>uitleggen}. Het verantwoorden van processen die ik zelf nog aan het ontdekken ben — dat {ORANGE>remt me} meer dan welke tegenslag ook.'),
      ans(17, 2, 'Dat ze er nog zijn nadat ik alles heb gezegd. {PURPLE>Ik spreek me altijd uit} — dat is niet het probleem. Het probleem is de {PURPLE>stilte erna}.'),
      ans(17, 3, 'Dat iemand {ORANGE>een keer de regie overneemt}. Maar de {ORANGE>rol van degene die het nooit vraagt, speelt zichzelf voort}.'),
      ans(17, 4, 'Dat iemand {PURPLE>ziet dat ik moe ben} zonder dat ik het hoef te laten zien. Dat verlangen {PURPLE>zit in mijn botten} — het is {PURPLE>te groot om in woorden} te passen.'),
      ans(17, 5, 'Dat ze me {ORANGE>niet vragen} het uit te leggen. De vraag {ORANGE>\'waarom?\'} {ORANGE>vernietigt} precies datgene wat ik probeer te delen.'),
    ],
  },

  // ─── Q18 (Key 6, Mirror) ───
  {
    id: 18,
    text: 'Wat projecteer jij op anderen dat eigenlijk van jou is?',
    domain: 'introversie',
    answers: [
      ans(18, 0, '{ORANGE>Meeloperij}. Ik veroordeel mensen die meedoen met systemen die niet kloppen. Maar ik {ORANGE>betrap mezelf} erop dat die woede {ORANGE>dubbelzijdig} is — de momenten waarop ik zelf zweeg, branden het hardst.'),
      ans(18, 1, '{PURPLE>Onverschilligheid voor diepte}. Als iemand niet nadenkt, {PURPLE>voel ik} iets dat lijkt op {PURPLE>walging}. Alsof ze bewust de {PURPLE>deur dichtdoen} naar iets dat voor mij alles is.'),
      ans(18, 2, '{ORANGE>Egoïsme}. Als iemand voor zichzelf kiest, {ORANGE>voel ik} iets scherps. Die scherpte {ORANGE>werkt als spiegel} — ik gun hen wat ik mezelf niet geef.'),
      ans(18, 3, '{PURPLE>Passiviteit}. Als iemand lijdt aan iets dat op te lossen is en het niet doet — {PURPLE>mijn handen jeuken}. Het is {PURPLE>fysiek}. Alsof hun stilstand mij persoonlijk raakt.'),
      ans(18, 4, '{ORANGE>Vastklampen}. Als iemand vasthoudt aan wat was, {ORANGE>voel ik} ongeduld. Die {ORANGE>irritatie} herken ik als mijn eigen {ORANGE>angst} — de angst dat ik zelf ooit zo vast kom te zitten.'),
      ans(18, 5, '{PURPLE>Zwakte}. Als iemand de controle verliest, {PURPLE>voel ik} geen medelijden — ik {PURPLE>voel ongemak}. {PURPLE>Alsof hun chaos besmettelijk} is en ik er afstand van moet nemen.'),
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
      ans(19, 0, '{ORANGE>De standaard stijgt}. Ik merk dat {ORANGE>mensen scherper worden} — en {ORANGE>die functie vervul ik} bewust.'),
      ans(19, 1, 'Het wordt {PURPLE>sfeervoller}. Niet door mij — het is {PURPLE>alsof de spanning zakt} zodra ik er ben. Ik zeg niks, het {PURPLE>is er gewoon}.'),
      ans(19, 2, '{ORANGE>Mensen ontspannen}. Ik {ORANGE>zie mezelf} die ruimte creëren — het is een automatisme {ORANGE>waar ik de kosten} van ken.'),
      ans(19, 3, '{PURPLE>Gesprekken worden dieper}. Niet altijd gewild — maar mensen {PURPLE>schakelen over} zodra ik er ben. Alsof {PURPLE>oppervlakte} niet meer werkt.'),
      ans(19, 4, 'Het {ORANGE>wordt lichter}. Mensen {ORANGE>laten hun scherpe randjes} vallen — die dynamiek {ORANGE>herken ik als mijn} eigen werking.'),
      ans(19, 5, '{PURPLE>Mensen gaan op aan}. Niet richting mij — maar {PURPLE>alsof ze plots} iets hebben {PURPLE>besloten}. Die verwachting {PURPLE>hang ik} niet op, die {PURPLE>is er}.'),
    ],
  },

  // ─── Q20 (Key 2, Standard) ───
  {
    id: 20,
    text: 'Wat is jouw relatie tot ambitie?',
    domain: 'massa',
    answers: [
      ans(20, 0, 'Ambitie is {PURPLE>richting, niet bestemming}. Zodra het doel {PURPLE>vaststaat}, {PURPLE>verliest het} zijn lading. {PURPLE>Het IS de zoektocht}.'),
      ans(20, 1, '{ORANGE>Ambitie dient} als {ORANGE>brandstof}, maar zodra het het werk {ORANGE>gaat sturen} in plaats van voeden, {ORANGE>merk ik} dat het {ORANGE>me leegtrekt}.'),
      ans(20, 2, '{PURPLE>Ambitie is niet het punt}. De {PURPLE>standaard} is het punt. Als wat ik doe niet klopt, doet {PURPLE>bereiken} er niet toe.'),
      ans(20, 3, 'Ambitie? Die heb ik — maar zodra het {ORANGE>serieus} wordt, {ORANGE>betrap ik mezelf} erop dat ik er {ORANGE>een draai} aan geef. {ORANGE>Het doel bereiken} EN het {ORANGE>licht houden} — die {ORANGE>balans} navigeer ik bewust.'),
      ans(20, 4, 'Ambitie voelt alleen echt {PURPLE>als het iemand} raakt. {PURPLE>Bereiken voor mezelf} is {PURPLE>hol} — het moet {PURPLE>landen} bij een ander.'),
      ans(20, 5, '{ORANGE>Ambitie werkt} bij mij {ORANGE>als hefboom} — niet het {ORANGE>doel zelf}, maar {ORANGE>wat ik ermee} kan {ORANGE>transformeren}. Die {ORANGE>mechanica} doorzie ik scherp.'),
    ],
  },

  // ─── Q21 (Key 3, Mirror) ───
  {
    id: 21,
    text: 'Hoe ga jij om met erkenning?',
    domain: 'massa',
    answers: [
      ans(21, 0, 'Ik neem het aan maar het {ORANGE>voelt ongemakkelijk}. Ik {ORANGE>merk dat ik} het {ORANGE>meteen doorgeef} — die {ORANGE>reflex vervult} een {ORANGE>functie} die ik ken.'),
      ans(21, 1, '{PURPLE>Ik neem het aan} en {PURPLE>ga door}. Niet uit bescheidenheid — er is {PURPLE>gewoon altijd} een {PURPLE>volgend ding}. {PURPLE>Stilstaan} bij erkenning {PURPLE>voelt} als {PURPLE>remmen}.'),
      ans(21, 2, 'Het {ORANGE>raakt me oprecht} — maar ik {ORANGE>betrap mezelf} erop dat ik het {ORANGE>nodig heb} als {ORANGE>bevestiging}. Die {ORANGE>afhankelijkheid} {ORANGE>zie ik} scherp.'),
      ans(21, 3, 'Meestal {PURPLE>verkeerd gericht}. Ze {PURPLE>erkennen} het {PURPLE>resultaat}. Niet het {PURPLE>proces}. {PURPLE>Het deel} dat ertoe deed {PURPLE>is onzichtbaar} — en dat is oké.'),
      ans(21, 4, 'Erkenning {ORANGE>weeg ik} aan de {ORANGE>bron}. Niet {ORANGE>elke stem} telt {ORANGE>gelijk} — dat is {ORANGE>een selectie} die ik {ORANGE>bewust} hanteer.'),
      ans(21, 5, '{PURPLE>Ik lach} het {PURPLE>weg}. Niet om het {PURPLE>af te wijzen} — het is meer dat het {PURPLE>serieus nemen} ervan {PURPLE>iets breekt}. {PURPLE>Erkenning} is het {PURPLE>grappigste} compliment.'),
    ],
  },

  // ─── Q22 (Key 4, Standard) ───
  {
    id: 22,
    text: 'Wat doe jij als niemand kijkt?',
    domain: 'massa',
    answers: [
      ans(22, 0, '{PURPLE>Hetzelfde. Maar zachter}. {PURPLE>Zonder publiek} val ik {PURPLE>terug} op wat {PURPLE>echt} is — en dat {PURPLE>is stiller} dan mensen denken.'),
      ans(22, 1, '{ORANGE>Structuur houden}. De {ORANGE>systemen} draaien of er {ORANGE>publiek} is of niet — maar ik {ORANGE>merk} dat de {ORANGE>scherpte} daalt {ORANGE>als} er niemand {ORANGE>meekijkt}. Die {ORANGE>val} ken ik.'),
      ans(22, 2, 'Dan pas {PURPLE>beweeg ik} echt. {PURPLE>Zonder kijkers} {PURPLE>verdwijnt} de {PURPLE>richting} en {PURPLE>begint} het {PURPLE>ontdekken}. {PURPLE>Dat} is waar ik het {PURPLE>scherpst} ben.'),
      ans(22, 3, '{ORANGE>Minder}. Ik {ORANGE>betrap mezelf} erop dat {ORANGE>de motor zachter} draait {ORANGE>als} er {ORANGE>niemand} leunt. Die {ORANGE>afhankelijkheid} van een {ORANGE>publiek} — die {ORANGE>rol} doorzie ik.'),
      ans(22, 4, '{PURPLE>Precies hetzelfde}. {PURPLE>Publiek} verandert {PURPLE>niks} — {PURPLE>mijn kompas} draait {PURPLE>niet} op {PURPLE>goedkeuring}. Het {PURPLE>is} het {PURPLE>enige} dat ik {PURPLE>vertrouw}.'),
      ans(22, 5, '{ORANGE>Dan denk ik het helderst}. {ORANGE>Zonder input} van {ORANGE>buitenaf} {ORANGE>werkt} mijn {ORANGE>hoofd} als {ORANGE>schoonste} instrument. {ORANGE>Dat verschil} {ORANGE>herken ik} als {ORANGE>mijn} kwetsbaarheid.'),
    ],
  },

  // ─── Q23 (Key 5, Mirror) ───
  {
    id: 23,
    text: 'Wanneer zeg jij nee tegen meer?',
    domain: 'massa',
    answers: [
      ans(23, 0, 'Als meer de {ORANGE>zuiverheid} van wat er {ORANGE>is} {ORANGE>bedreigt}. Die {ORANGE>grens herken ik} als {ORANGE>mijn} {ORANGE>beschermingsmechanisme} — niet {ORANGE>alles} wat groeit {ORANGE>wordt} beter.'),
      ans(23, 1, 'Als meer {PURPLE>transformatie} in de {PURPLE>weg} staat. Het {PURPLE>punt} is niet {PURPLE>hoeveel} — het {PURPLE>punt} is wat ik {PURPLE>ermee} kan {PURPLE>doen}. {PURPLE>Meer} zonder {PURPLE>hefboom} is {PURPLE>ballast}.'),
      ans(23, 2, 'Als meer {ORANGE>betekent} dat ik me moet {ORANGE>aanpassen} aan een {ORANGE>systeem} dat {ORANGE>niet} klopt. Die {ORANGE>conditie} is {ORANGE>mijn} {ORANGE>hardste} grens.'),
      ans(23, 3, 'Als de {PURPLE>complexiteit} de {PURPLE>architectuur} overstijgt. {PURPLE>Chaos} is {PURPLE>mijn} grondstof, maar {PURPLE>als} patronen {PURPLE>vervagen} verliest {PURPLE>de} constructie {PURPLE>haar} fundament.'),
      ans(23, 4, 'Als meer {ORANGE>betekent} {ORANGE>dat iemand} {ORANGE>tekortkomt}. Die afweging {ORANGE>maak} ik {ORANGE>bewust} — de {ORANGE>schaal} waarop ik {ORANGE>weeg} heeft {ORANGE>altijd} een {ORANGE>ander} erop.'),
      ans(23, 5, 'Als het {PURPLE>niet} meer {PURPLE>resoneert}. {PURPLE>Meer} is {PURPLE>niet} dieper — het {PURPLE>is} luider. {PURPLE>En} luid {PURPLE>maakt} dat ik {PURPLE>het} signaal {PURPLE>verlies}.'),
    ],
  },

  // ─── Q24 (Key 6, Standard) ───
  {
    id: 24,
    text: 'Wat triggert jou als iemand anders de leiding heeft?',
    domain: 'massa',
    answers: [
      ans(24, 0, 'Als ze {PURPLE>leiden vanuit positie} en niet {PURPLE>vanuit waarheid}. Dan {PURPLE>voelt} het als {PURPLE>bedrog} — mijn {PURPLE>lijf} verzet zich {PURPLE>voor} mijn {PURPLE>hoofd} het registreert.'),
      ans(24, 1, 'Als ze {ORANGE>niet snappen} waarom ze {ORANGE>leiden}. {ORANGE>Leiderschap} zonder {ORANGE>zelfkennis} is {ORANGE>gevaarlijk} — die {ORANGE>inschatting} werkt {ORANGE>bij} mij {ORANGE>als} automatische {ORANGE>scan}.'),
      ans(24, 2, '{PURPLE>Als} de {PURPLE>groep} eronder {PURPLE>lijdt}. Niet het {PURPLE>leiderschap} zelf — maar het {PURPLE>effect} op {PURPLE>de} mensen {PURPLE>erin}. {PURPLE>Dat} registreer ik {PURPLE>eerder} dan {PURPLE>wie} ook.'),
      ans(24, 3, 'Als ze de {ORANGE>situatie} niet {ORANGE>lezen}. Ik zie de {ORANGE>hefbomen} die ze {ORANGE>missen} — dat {ORANGE>ongeduld} werkt {ORANGE>als} motor, maar {ORANGE>ik} betrap {ORANGE>mezelf} erop dat het {ORANGE>niet} altijd {ORANGE>fair} is.'),
      ans(24, 4, '{PURPLE>Als} ze {PURPLE>de} {PURPLE>ruimte} {PURPLE>dichtmetselen}. {PURPLE>Leiding} is {PURPLE>prima} — maar {PURPLE>zodra} het {PURPLE>verstikt}, {PURPLE>ga} ik {PURPLE>weg}. Niet uit protest, {PURPLE>uit} noodzaak.'),
      ans(24, 5, 'Als ze {ORANGE>slordiger} zijn {ORANGE>dan} ik {ORANGE>zou} zijn. Die {ORANGE>vergelijking} maak ik {ORANGE>automatisch} — en {ORANGE>ik} doorzie {ORANGE>dat} dat {ORANGE>meer} over {ORANGE>mijn} {ORANGE>standaard} zegt {ORANGE>dan} over {ORANGE>hun} leiderschap.'),
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
      ans(25, 0, 'Als de {ORANGE>ander} er {ORANGE>niet} {ORANGE>klaar} {ORANGE>voor} {ORANGE>is}. Ik {ORANGE>voel} dat — niet {ORANGE>als} {ORANGE>oordeel} {ORANGE>maar} {ORANGE>als} timing.'),
      ans(25, 1, 'Als het {PURPLE>deelmoment} de {PURPLE>vibe} zou {PURPLE>doden}. Ik {PURPLE>doorzie} dat {PURPLE>timing} meer {PURPLE>doet} dan {PURPLE>inhoud} — {PURPLE>die} mechanica {PURPLE>zet} ik {PURPLE>bewust} in.'),
      ans(25, 2, 'Als het {ORANGE>de} {ORANGE>ander} zou {ORANGE>raken} op {ORANGE>een} {ORANGE>plek} die {ORANGE>nog} {ORANGE>niet} {ORANGE>geheeld} {ORANGE>is}. {ORANGE>Dat} {ORANGE>voel} ik {ORANGE>sneller} dan {ORANGE>ik} het {ORANGE>kan} {ORANGE>uitleggen}.'),
      ans(25, 3, 'Als het {PURPLE>ontvangen} van {PURPLE>de} {PURPLE>kennis} meer {PURPLE>schade} zou {PURPLE>doen} dan {PURPLE>het} {PURPLE>niet-weten}. {PURPLE>Deze} {PURPLE>afweging} {PURPLE>is} {PURPLE>mijn} handvat.'),
      ans(25, 4, 'Als het {ORANGE>iemands} {ORANGE>vertrouwen} zou {ORANGE>breken}. {ORANGE>Kennis} die {ORANGE>het} {ORANGE>licht} {ORANGE>uitdoet}, {ORANGE>hou} ik vast. {ORANGE>Dat} {ORANGE>is} geen {ORANGE>keuze} — dat {ORANGE>is} bescherming.'),
      ans(25, 5, 'Als het {PURPLE>de} {PURPLE>actie} zou {PURPLE>vertragen}. {PURPLE>Kennis} die {PURPLE>verlamt} in plaats van {PURPLE>activeert} — {PURPLE>die} selectie {PURPLE>maak} ik {PURPLE>automatisch}, en {PURPLE>ik} {PURPLE>merk} dat het {PURPLE>soms} meer {PURPLE>filtert} dan {PURPLE>nodig}.'),
    ],
  },

  // ─── Q26 (Key 2, Mirror) ───
  {
    id: 26,
    text: 'Wat weet je zeker — zonder bewijs?',
    domain: 'wijsheid',
    answers: [
      ans(26, 0, 'Dat {ORANGE>er altijd meer} is. Die {ORANGE>overtuiging} {ORANGE>werkt} als {ORANGE>kompas} — het {ORANGE>stuurt} elke {ORANGE>keuze} die ik {ORANGE>maak}.'),
      ans(26, 1, '{PURPLE>Dat schoonheid} {PURPLE>er} de {PURPLE>doet}. Niet {PURPLE>als} mening — {PURPLE>als} feit. Het {PURPLE>zit} in {PURPLE>alles}, en {PURPLE>ik} {PURPLE>voel} het {PURPLE>voor} ik het {PURPLE>zie}.'),
      ans(26, 2, '{ORANGE>Dat integriteit werkt}. Niet {ORANGE>als} moreel ideaal — {ORANGE>als} operationeel {ORANGE>systeem}. Die {ORANGE>overtuiging} {ORANGE>functioneert} als {ORANGE>fundament} voor {ORANGE>alles} wat ik {ORANGE>bouw}.'),
      ans(26, 3, '{PURPLE>Dat niks permanent} is. Niet {PURPLE>nihilistisch} — {PURPLE>bevrijdend}. Het {PURPLE>is} de {PURPLE>grond} {PURPLE>onder} alles {PURPLE>wat} ik {PURPLE>doe} en {PURPLE>voel}.'),
      ans(26, 4, '{ORANGE>Dat verbinding geneest}. Niet {ORANGE>als} geloof — {ORANGE>als} observatie. Ik {ORANGE>zie} dat {ORANGE>patroon} in {ORANGE>elke} relatie {ORANGE>die} ik {ORANGE>aanraak}, en het {ORANGE>functioneert} als {ORANGE>mijn} diepste {ORANGE>kompas}.'),
      ans(26, 5, '{PURPLE>Dat bijna alles} {PURPLE>maakbaar} {PURPLE>is}. Niet {PURPLE>als} arrogantie — {PURPLE>als} waarneming. {PURPLE>Elke} situatie {PURPLE>heeft} een {PURPLE>hefboom}. Ik {PURPLE>zie} ze {PURPLE>voor} ik ze {PURPLE>zoek}.'),
    ],
  },

  // ─── Q27 (Key 3, Standard) ───
  {
    id: 27,
    text: 'Wat heb je moeten loslaten om te groeien?',
    domain: 'wijsheid',
    answers: [
      ans(27, 0, 'De {PURPLE>overtuiging} {PURPLE>dat} {PURPLE>ik} {PURPLE>onmisbaar} {PURPLE>ben}. {PURPLE>Niet} {PURPLE>iedereen} {PURPLE>had} {PURPLE>mij} {PURPLE>nodig} — {PURPLE>sommigen} {PURPLE>hadden} {PURPLE>nodig} {PURPLE>dat} ik {PURPLE>losliet}.'),
      ans(27, 1, 'De {ORANGE>overtuiging} {ORANGE>dat} {ORANGE>rust} {ORANGE>zwakte} {ORANGE>is}. Die {ORANGE>gelijkstelling} {ORANGE>kost} me {ORANGE>tot} op {ORANGE>de} {ORANGE>dag} van {ORANGE>vandaag} {ORANGE>moeite} — {ORANGE>maar} de {ORANGE>rol} van {ORANGE>degene} die {ORANGE>nooit} {ORANGE>stopt}, speel ik niet meer.'),
      ans(27, 2, 'Het {PURPLE>geloof} {PURPLE>dat} {PURPLE>iedereen} {PURPLE>het} {PURPLE>goed} {PURPLE>bedoelt}. Niet mijn {PURPLE>vertrouwen} — {PURPLE>dat} {PURPLE>is} er {PURPLE>nog}. Maar de {PURPLE>naïviteit} {PURPLE>die} er {PURPLE>aan} {PURPLE>vastzat}, {PURPLE>is} eraf.'),
      ans(27, 3, 'De {ORANGE>overtuiging} {ORANGE>dat} {ORANGE>het} {ORANGE>perfect} {ORANGE>moet} {ORANGE>zijn}. Het {ORANGE>ruwe} {ORANGE>werkt} {ORANGE>beter} — {ORANGE>die} {ORANGE>ontdekking} {ORANGE>functioneert} als {ORANGE>mijn} {ORANGE>grootste} {ORANGE>bevrijding}.'),
      ans(27, 4, 'De {PURPLE>overtuiging} {PURPLE>dat} {PURPLE>ik} {PURPLE>altijd} {PURPLE>gelijk} {PURPLE>heb}. Het {PURPLE>kompas} {PURPLE>klopt} — {PURPLE>maar} {PURPLE>niet} elke {PURPLE>richting} {PURPLE>is} de {PURPLE>mijne} om te {PURPLE>bewandelen}.'),
      ans(27, 5, 'De {ORANGE>overtuiging} {ORANGE>dat} {ORANGE>lichtheid} {ORANGE>alles} {ORANGE>oplost}. {ORANGE>Sommige} {ORANGE>dingen} {ORANGE>moeten} {ORANGE>zwaar} {ORANGE>zijn} — {ORANGE>die} {ORANGE>conditie} {ORANGE>heb} ik {ORANGE>leren} {ORANGE>herkennen}: zodra {ORANGE>de} grap {ORANGE>het} gevoel {ORANGE>vervangt}, {ORANGE>werkt} het {ORANGE>tegen} me.'),
    ],
  },

  // ─── Q28 (Key 4, Mirror) ───
  {
    id: 28,
    text: 'Wat zie jij in de wereld dat de meeste mensen missen?',
    domain: 'wijsheid',
    answers: [
      ans(28, 0, '{ORANGE>De onderstroom} {ORANGE>tussen} {ORANGE>mensen}. Wat {ORANGE>er} {ORANGE>niet} gezegd {ORANGE>wordt} {ORANGE>maar} {ORANGE>wél} speelt — {ORANGE>die} {ORANGE>laag} {ORANGE>lees} ik {ORANGE>als} een {ORANGE>partituur}.'),
      ans(28, 1, '{PURPLE>Waar} de {PURPLE>structuur} {PURPLE>het} {PURPLE>gaat} {PURPLE>begeven}. Niet {PURPLE>het} probleem {PURPLE>zelf} — {PURPLE>de} {PURPLE>barst} {PURPLE>die} eraan {PURPLE>voorafgaat}. {PURPLE>Dat} zie ik {PURPLE>voor} anderen het voelen.'),
      ans(28, 2, '{ORANGE>De uitweg}. In {ORANGE>elke} situatie, {ORANGE>elk} systeem, {ORANGE>elke} kamer — {ORANGE>ik} {ORANGE>zie} waar {ORANGE>de} {ORANGE>opening} zit. Die {ORANGE>scan} {ORANGE>functioneert} als {ORANGE>mijn} snelste {ORANGE>reflex}.'),
      ans(28, 3, '{PURPLE>Wie} er {PURPLE>moeite} {PURPLE>heeft} maar het niet {PURPLE>laat} {PURPLE>zien}. {PURPLE>Die} {PURPLE>stille} {PURPLE>strijd} — {PURPLE>ik} {PURPLE>herken} het {PURPLE>direct}. Alsof {PURPLE>ik} het {PURPLE>gewicht} {PURPLE>voel} dat {PURPLE>zij} dragen.'),
      ans(28, 4, '{ORANGE>Waar} de {ORANGE>macht} {ORANGE>eigenlijk} {ORANGE>zit} — {ORANGE>en} {ORANGE>wie} eronder {ORANGE>lijdt}. {ORANGE>Dat} {ORANGE>mechanisme} {ORANGE>doorzie} ik {ORANGE>feilloos}, en {ORANGE>ik} {ORANGE>betrap} {ORANGE>mezelf} {ORANGE>erop} {ORANGE>dat} het {ORANGE>me} {ORANGE>nooit} met rust {ORANGE>laat}.'),
      ans(28, 5, '{PURPLE>De patren} {PURPLE>achter} {PURPLE>de} {PURPLE>patronen}. Niet {PURPLE>wat} er {PURPLE>gebeurt} — {PURPLE>maar} {PURPLE>waarom} het {PURPLE>steeds} {PURPLE>opnieuw} {PURPLE>gebeurt}. {PURPLE>Dat} {PURPLE>zien} stopt nooit.'),
    ],
  },

  // ─── Q29 (Key 5, Standard) ───
  {
    id: 29,
    text: 'Welke waarheid draag je die je liever niet had?',
    domain: 'wijsheid',
    answers: [
      ans(29, 0, '{PURPLE>Dat} {PURPLE>niet} {PURPLE>iedereen} {PURPLE>te} {PURPLE>redden} {PURPLE>is}. Mijn {PURPLE>vertrouwen} {PURPLE>is} {PURPLE>er} {PURPLE>nog} — {PURPLE>maar} het {PURPLE>bijt} {PURPLE>nu}.'),
      ans(29, 1, 'Dat {ORANGE>niet alles} {ORANGE>maakbaar} {ORANGE>is}. Die {ORANGE>grens} {ORANGE>werkt} als {ORANGE>de} {ORANGE>strengste} {ORANGE>les} die {ORANGE>ik} {ORANGE>draag} — {ORANGE>hij} {ORANGE>definieert} {ORANGE>waar} {ORANGE>mijn} {ORANGE>kracht} {ORANGE>ophoudt}.'),
      ans(29, 2, 'Dat {PURPLE>het} {PURPLE>systeem} {PURPLE>niet} {PURPLE>gaat} {PURPLE>veranderen} in {PURPLE>mijn} {PURPLE>leven}. De {PURPLE>woede} {PURPLE>is} {PURPLE>er} {PURPLE>nog} — {PURPLE>maar} het {PURPLE>is} een {PURPLE>stille} {PURPLE>woede} {PURPLE>nu}. Geïntegreerd, niet gedoofd.'),
      ans(29, 3, 'Dat {ORANGE>controle} een {ORANGE>illusie} {ORANGE>is}. Ik {ORANGE>merk} dat {ORANGE>ik} hem {ORANGE>toch} {ORANGE>vasthoud} — {ORANGE>die} {ORANGE>paradox} {ORANGE>doorzie} ik {ORANGE>scherp}, maar {ORANGE>loslaten} {ORANGE>kost} me {ORANGE>meer} dan {ORANGE>vasthouden}.'),
      ans(29, 4, 'Dat {PURPLE>zorgen} {PURPLE>niet} {PURPLE>altijd} {PURPLE>helpt}. {PURPLE>Soms} {PURPLE>is} {PURPLE>de} {PURPLE>beste} {PURPLE>zorg} {PURPLE>afstand} — {PURPLE>en} {PURPLE>dat} {PURPLE>voelt} {PURPLE>als} {PURPLE>verraad} aan {PURPLE>alles} wat {PURPLE>ik} {PURPLE>ben}.'),
      ans(29, 5, 'Dat {ORANGE>mijn} {ORANGE>esthetiek} {ORANGE>de} {ORANGE>werkelijkheid} {ORANGE>eigenlijk} {ORANGE>op} {ORANGE>afstand} {ORANGE>houdt}. Ik {ORANGE>polijst} het {ORANGE>rauwe} {ORANGE>zo} {ORANGE>automatisch} {ORANGE>weg} dat {ORANGE>het} {ORANGE>filteren} {ORANGE>zelf} {ORANGE>onzichtbaar} {ORANGE>is} geworden.'),
    ],
  },

  // ─── Q30 (Key 6, Mirror) ───
  {
    id: 30,
    text: 'Wat weet je nu door je participatie in de wereld?',
    domain: 'wijsheid',
    answers: [
      ans(30, 0, 'Dat {ORANGE>verandering} {ORANGE>niet} {ORANGE>komt} {ORANGE>van} {ORANGE>de} {ORANGE>mensen} {ORANGE>die} het {ORANGE>hardst} {ORANGE>schreeuwen}. Die {ORANGE>les} {ORANGE>werkt} als {ORANGE>mijn} {ORANGE>strengste} {ORANGE>correctie} — {ORANGE>ik} {ORANGE>betrap} {ORANGE>mezelf} {ORANGE>erop} {ORANGE>dat} {ORANGE>ik} het {ORANGE>nog} steeds {ORANGE>vergeet}.'),
      ans(30, 1, 'Dat {PURPLE>de} {PURPLE>diepste} {PURPLE>kennis} {PURPLE>niet} {PURPLE>in} {PURPLE>boeken} {PURPLE>zit} {PURPLE>maar} {PURPLE>in} {PURPLE>gezichten}. Het {PURPLE>denken} {PURPLE>bracht} me {PURPLE>ver} — {PURPLE>maar} {PURPLE>de} wereld {PURPLE>zelf} {PURPLE>leerde} me {PURPLE>meer}. {PURPLE>Dat} {PURPLE>weten} {PURPLE>zit} {PURPLE>in} {PURPLE>mijn} {PURPLE>huid}, {PURPLE>niet} in {PURPLE>mijn} {PURPLE>hoofd}.'),
      ans(30, 2, 'Dat {ORANGE>zorgen} {ORANGE>pas} {ORANGE>werkt} {ORANGE>als} het {ORANGE>niet} {ORANGE>om} {ORANGE>mij} {ORANGE>gaat}. Die {ORANGE>dubbelheid} {ORANGE>doorzie} ik {ORANGE>scherp} — het {ORANGE>zuiverste} {ORANGE>geven} is {ORANGE>waar} ik {ORANGE>er} {ORANGE>niet} {ORANGE>meer} {ORANGE>in} {ORANGE>voorkom}.'),
      ans(30, 3, 'Dat {PURPLE>de} wereld {PURPLE>niet} {PURPLE>wacht} {PURPLE>op} {PURPLE>mijn} {PURPLE>plan}. {PURPLE>Ze} {PURPLE>beweegt} — {PURPLE>en} {PURPLE>het} {PURPLE>beste} {PURPLE>wat} {PURPLE>ik} {PURPLE>kan} {PURPLE>doen} {PURPLE>is} {PURPLE>meebewegen} en {PURPLE>bijsturen}. {PURPLE>Dat} {PURPLE>voelde} ik {PURPLE>voor} ik het {PURPLE>begreep}.'),
      ans(30, 4, 'Dat {ORANGE>eindeloos} {ORANGE>zoeken} {ORANGE>het} {ORANGE>perfecte} {ORANGE>afweermechanisme} {ORANGE>is} {ORANGE>om} {ORANGE>nergens} {ORANGE>echt} {ORANGE>te} {ORANGE>hoeven} {ORANGE>landen}. Ik {ORANGE>doorzie} {ORANGE>mijn} {ORANGE>eigen} {ORANGE>onrust} {ORANGE>nu} {ORANGE>als} {ORANGE>een} {ORANGE>strategie}, {ORANGE>niet} {ORANGE>meer} {ORANGE>als} {ORANGE>een} {ORANGE>roeping}.'),
      ans(30, 5, 'Dat {PURPLE>loslaten} {PURPLE>meer} {PURPLE>kracht} {PURPLE>vraagt} {PURPLE>dan} {PURPLE>vasthouden}. Niet {PURPLE>als} les — {PURPLE>als} {PURPLE>lichaamskennis}. {PURPLE>Mijn} {PURPLE>handen} {PURPLE>weten} het, {PURPLE>mijn} {PURPLE>hoofd} {PURPLE>nog} niet {PURPLE>helemaal}.'),
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LAYER 5 — Mysterie / Magie  Q31-Q36
// ═══════════════════════════════════════════════════════════════════════

const layer5Questions = [
  // ─── Q31 (Key 1, Standard) ───
  {
    id: 31,
    text: 'Wat voel je als je iets niet kunt verklaren?',
    domain: 'mysterie',
    answers: [
      ans(31, 0, '{ORANGE>Een drang} {ORANGE>om} {ORANGE>het} {ORANGE>te} {ORANGE>ordenen}. Ik {ORANGE>merk} {ORANGE>dat} {ORANGE>mijn} {ORANGE>systeem} {ORANGE>blijft} {ORANGE>zoeken} — {ORANGE>ook} {ORANGE>als} {ORANGE>er} {ORANGE>niks} {ORANGE>te} {ORANGE>vinden} {ORANGE>is}.'),
      ans(31, 1, '{PURPLE>Ik vind} het {PURPLE>grappig}. Niet {PURPLE>alles} {PURPLE>hoeft} {PURPLE>te} {PURPLE>kloppen}. Het {PURPLE>mysterie} {PURPLE>is} het {PURPLE>beste} {PURPLE>deel}.'),
      ans(31, 2, '{ORANGE>Verbinding}. Alsof het {ORANGE>onverklaarbare} me {ORANGE>dichter} {ORANGE>bij} {ORANGE>iets} {ORANGE>brengt}. Die {ORANGE>sensatie} {ORANGE>herken} ik {ORANGE>als} {ORANGE>mijn} {ORANGE>diepste} {ORANGE>kompas}.'),
      ans(31, 3, '{PURPLE>Honger}. {PURPLE>Diepere} {PURPLE>honger}. Het {PURPLE>onkenbare} {PURPLE>is} {PURPLE>geen} {PURPLE>muur} — het {PURPLE>is} {PURPLE>een} {PURPLE>deur} {PURPLE>die} {PURPLE>harder} {PURPLE>trekt} {PURPLE>dan} {PURPLE>elk} {PURPLE>antwoord}.'),
      ans(31, 4, '{ORANGE>Vertrouwen}. Niet {ORANGE>alles} {ORANGE>hoeft} {ORANGE>begrepen} {ORANGE>te} {ORANGE>worden}. Die {ORANGE>overgave} {ORANGE>werkt} {ORANGE>als} {ORANGE>mijn} {ORANGE>stilste} {ORANGE>kracht}.'),
      ans(31, 5, '{PURPLE>Onrust}. Mijn {PURPLE>handen} {PURPLE>willen} {PURPLE>iets} {PURPLE>vast} {PURPLE>pakken} — {PURPLE>en} {PURPLE>er} {PURPLE>is} {PURPLE>niks}. {PURPLE>Dat} {PURPLE>is} de {PURPLE>onzekerste} {PURPLE>leegte}.'),
    ],
  },

  // ─── Q32 (Key 2, Standard) ───
  {
    id: 32,
    text: 'Wat is groter dan jij?',
    domain: 'mysterie',
    answers: [
      ans(32, 0, 'Dat {PURPLE>wat} {PURPLE>ik} {PURPLE>nog} {PURPLE>niet} {PURPLE>heb} {PURPLE>gezien}. {PURPLE>Het} {PURPLE>onontdekte} {PURPLE>is} {PURPLE>altijd} {PURPLE>groter}. Dat {PURPLE>voelt} niet {PURPLE>als} {PURPLE>dreiging} — {PURPLE>als} {PURPLE>uitnodiging}.'),
      ans(32, 1, '{ORANGE>Schoonheid}. Niet {ORANGE>de} {ORANGE>mijne} — {ORANGE>die} {ORANGE>van} {ORANGE>alles}. Die {ORANGE>ervaring} {ORANGE>dient} {ORANGE>als} {ORANGE>bron} {ORANGE>voor} {ORANGE>alles} {ORANGE>wat} {ORANGE>ik} {ORANGE>maak}.'),
      ans(32, 2, '{PURPLE>De} {PURPLE>waarheid}. Niet {PURPLE>mijn} {PURPLE>versie} — {PURPLE>de} {PURPLE>echte}. Die {PURPLE>is} {PURPLE>altijd} {PURPLE>groter} {PURPLE>dan} {PURPLE>wat} {PURPLE>ik} {PURPLE>kan} {PURPLE>wegen}.'),
      ans(32, 3, '{ORANGE>Het} {ORANGE>absurde}. Het {ORANGE>feit} {ORANGE>dat} {ORANGE>alles} {ORANGE>tegelijk} {ORANGE>serieus} {ORANGE>en} {ORANGE>zinloos} {ORANGE>is} — {ORANGE>die} {ORANGE>paradox} {ORANGE>functioneert} {ORANGE>als} {ORANGE>mijn} {ORANGE>fundering}.'),
      ans(32, 4, '{PURPLE>Wat} {PURPLE>er} {PURPLE>tussen} {PURPLE>mensen} {PURPLE>zit}. Die {PURPLE>stroom} {PURPLE>is} {PURPLE>groter} {PURPLE>dan} {PURPLE>wie} {PURPLE>er} {PURPLE>ook} {PURPLE>in} {PURPLE>staat}. {PURPLE>Dat} {PURPLE>voel} ik {PURPLE>als} {PURPLE>zwaartekracht}.'),
      ans(32, 5, '{ORANGE>Het} {ORANGE>systeem}. Ik {ORANGE>kan} {ORANGE>sturen}, {ORANGE>buigen}, {ORANGE>transformeren} — {ORANGE>maar} {ORANGE>het} {ORANGE>geheel} {ORANGE>beweegt} {ORANGE>op} {ORANGE>een} {ORANGE>schaal} {ORANGE>die} {ORANGE>ik} {ORANGE>niet} {ORANGE>bepaal}.'),
    ],
  },

  // ─── Q33 (Key 3, Mirror) ───
  {
    id: 33,
    text: 'Hoe verhoud je je tot wat je niet kunt beheersen?',
    domain: 'mysterie',
    answers: [
      ans(33, 0, 'Ik {ORANGE>vang} {ORANGE>op} wat {ORANGE>het} {ORANGE>achterlaat}. Niet {ORANGE>het} {ORANGE>onbeheersbare} {ORANGE>zelf} — {ORANGE>de} {ORANGE>mensen} die {ORANGE>erdoor} {ORANGE>geraakt} {ORANGE>worden}. Die {ORANGE>reflex} {ORANGE>ken} ik.'),
      ans(33, 1, '{PURPLE>Ik} {PURPLE>ga} {PURPLE>erop} {PURPLE>af}. Niet {PURPLE>om} {PURPLE>het} {PURPLE>te} {PURPLE>overwinnen} — {PURPLE>maar} {PURPLE>stilzitten} {PURPLE>is} {PURPLE>dodelijker} {PURPLE>dan} {PURPLE>verliezen}.'),
      ans(33, 2, 'Ik {ORANGE>vertrouw} {ORANGE>erop} {ORANGE>dat} {ORANGE>het} {ORANGE>ergens} {ORANGE>goed} {ORANGE>voor} {ORANGE>is}. Die {ORANGE>overgave} {ORANGE>werkt} {ORANGE>als} {ORANGE>instrument} — {ORANGE>ook} {ORANGE>als} {ORANGE>ik} {ORANGE>niet} {ORANGE>zie} {ORANGE>waarvoor}.'),
      ans(33, 3, '{PURPLE>Ik} {PURPLE>laat} {PURPLE>het} {PURPLE>door} {PURPLE>me} {PURPLE>heen}. Niet {PURPLE>vasthouden}, {PURPLE>niet} {PURPLE>afweren} — {PURPLE>doorlaten}. {PURPLE>Wat} {PURPLE>overblijft} {PURPLE>is} {PURPLE>materiaal}.'),
      ans(33, 4, '{ORANGE>Ik} {ORANGE>maak} {ORANGE>onderscheid} {ORANGE>tussen} {ORANGE>wat} {ORANGE>ik} {ORANGE>wél} {ORANGE>en} {ORANGE>niet} {ORANGE>kan} {ORANGE>sturen}. Die {ORANGE>scheidslijn} {ORANGE>is} {ORANGE>mijn} {ORANGE>meest} {ORANGE>bewuste} {ORANGE>grens}.'),
      ans(33, 5, '{PURPLE>Ik} {PURPLE>lach}. Niet {PURPLE>omdat} {PURPLE>het} {PURPLE>grappig} {PURPLE>is} — {PURPLE>maar} {PURPLE>omdat} {PURPLE>verzet} {PURPLE>nog} {PURPLE>absurder} {PURPLE>zou} {PURPLE>zijn}.'),
    ],
  },

  // ─── Q34 (Key 4, Standard) ───
  {
    id: 34,
    text: 'Wanneer voelde je je het kleinst — en was dat oké?',
    domain: 'mysterie',
    answers: [
      ans(34, 0, 'Toen ik {PURPLE>besefte} {PURPLE>dat} {PURPLE>liefde} {PURPLE>niet} {PURPLE>genoeg} {PURPLE>was} {PURPLE>om} {PURPLE>iemand} {PURPLE>te} {PURPLE>houden}. {PURPLE>Dat} {PURPLE>was} {PURPLE>niet} {PURPLE>oké}. {PURPLE>Maar} {PURPLE>het} {PURPLE>was} {PURPLE>eerlijk}.'),
      ans(34, 1, '{ORANGE>Toen} {ORANGE>controle} {ORANGE>er} {ORANGE>niks} {ORANGE>meer} {ORANGE>toe} {ORANGE>deed}. Die {ORANGE>ervaring} {ORANGE>dient} {ORANGE>als} {ORANGE>ijkpunt} — {ORANGE>het} {ORANGE>herinnert} {ORANGE>me} {ORANGE>waar} {ORANGE>mijn} {ORANGE>grip} {ORANGE>ophoudt}.'),
      ans(34, 2, '{PURPLE>Toen} {PURPLE>er} {PURPLE>niks} {PURPLE>meer} {PURPLE>te} {PURPLE>ontdekken} {PURPLE>viel} {PURPLE>en} {PURPLE>ik} {PURPLE>toch} {PURPLE>ergens} {PURPLE>moest} {PURPLE>zijn}. {PURPLE>Dat} {PURPLE>was} {PURPLE>niet} {PURPLE>oké} — {PURPLE>het} {PURPLE>was} {PURPLE>verstikkend}.'),
      ans(34, 3, '{ORANGE>Toen} {ORANGE>ik} {ORANGE>niet} {ORANGE>kon} {ORANGE>helpen}. Die {ORANGE>machteloosheid} {ORANGE>doorzie} ik {ORANGE>als} {ORANGE>mijn} {ORANGE>kwetsbaarste} {ORANGE>plek} — {ORANGE>het} {ORANGE>is} {ORANGE>waar} {ORANGE>de} {ORANGE>rol} {ORANGE>stopt}.'),
      ans(34, 4, 'Toen {PURPLE>het} {PURPLE>systeem} {PURPLE>won} {PURPLE>en} {PURPLE>ik} {PURPLE>er} {PURPLE>niks} {PURPLE>aan} {PURPLE>kon} {PURPLE>doen}. {PURPLE>Dat} {PURPLE>voelde} {PURPLE>als} {PURPLE>verraad} — {PURPLE>door} {PURPLE>de} {PURPLE>werkelijkheid} {PURPLE>zelf}.'),
      ans(34, 5, 'Toen {ORANGE>ik} {ORANGE>doorhad} {ORANGE>dat} {ORANGE>kennis} {ORANGE>niets} {ORANGE>oploste}. Die {ORANGE>les} {ORANGE>werkt} {ORANGE>als} {ORANGE>mijn} {ORANGE>strengste} {ORANGE>correctie} — {ORANGE>weten} {ORANGE>is} {ORANGE>niet} {ORANGE>genoeg}.'),
    ],
  },

  // ─── Q35 (Key 5, Mirror) ───
  {
    id: 35,
    text: 'Waar zit de grens van jouw controle?',
    domain: 'mysterie',
    answers: [
      ans(35, 0, '{ORANGE>Waar} het {ORANGE>vertrouwen} {ORANGE>begint}. {ORANGE>Voorbij} {ORANGE>die} {ORANGE>grens} {ORANGE>kan} {ORANGE>ik} {ORANGE>niet} {ORANGE>sturen} — {ORANGE>die} {ORANGE>overgave} {ORANGE>herken} ik {ORANGE>als} {ORANGE>mijn} {ORANGE>sterkste} {ORANGE>positie}.'),
      ans(35, 1, '{PURPLE>Bij} {PURPLE>de} {PURPLE>dood}. {PURPLE>Alles} {PURPLE>daarvoor} {PURPLE>is} {PURPLE>buigbaar}. Dat {PURPLE>ene} {PURPLE>niet}. En {PURPLE>dat} {PURPLE>voelt} {PURPLE>als} {PURPLE>de} {PURPLE>enige} {PURPLE>muur} {PURPLE>die} {PURPLE>ik} {PURPLE>respecteer}.'),
      ans(35, 2, 'Waar {ORANGE>mijn} {ORANGE>eerlijkheid} {ORANGE>de} {ORANGE>ander} {ORANGE>meer} {ORANGE>schaadt} {ORANGE>dan} {ORANGE>beschermt}. Die {ORANGE>lijn} {ORANGE>betrap} ik {ORANGE>mezelf} {ORANGE>op} — {ORANGE>het} {ORANGE>is} {ORANGE>mijn} {ORANGE>dunste} {ORANGE>koord}.'),
      ans(35, 3, '{PURPLE>Bij} {PURPLE>andere} {PURPLE>mensen}. {PURPLE>Systemen} {PURPLE>kan} {PURPLE>ik} {PURPLE>sturen}. {PURPLE>Mensen} {PURPLE>niet}. {PURPLE>Dat} {PURPLE>voelt} {PURPLE>als} {PURPLE>de} {PURPLE>enige} {PURPLE>chaos} {PURPLE>die} {PURPLE>ik} {PURPLE>niet} {PURPLE>wil} {PURPLE>en} {PURPLE>kan} {PURPLE>temmen}.'),
      ans(35, 4, 'Waar {ORANGE>mijn} {ORANGE>zorg} {ORANGE>de} {ORANGE>ander} {ORANGE>kleiner} {ORANGE>maakt} {ORANGE>in} {ORANGE>plaats} {ORANGE>van} {ORANGE>sterker}. Die {ORANGE>grens} {ORANGE>herken} ik {ORANGE>als} {ORANGE>mijn} {ORANGE>gevaarlijkste} {ORANGE>valkuil}.'),
      ans(35, 5, '{PURPLE>Bij} {PURPLE>het} {PURPLE>onbenoembare}. {PURPLE>Waar} {PURPLE>taal} {PURPLE>stopt} {PURPLE>en} {PURPLE>het} {PURPLE>beeld} {PURPLE>begint} — {PURPLE>daar} {PURPLE>stopt} {PURPLE>mijn} {PURPLE>controle} {PURPLE>en} {PURPLE>begint} {PURPLE>alles} {PURPLE>wat} {PURPLE>ertoe} {PURPLE>doet}.'),
    ],
  },

  // ─── Q36 (Key 6, Standard) ───
  {
    id: 36,
    text: 'Wat is heilig voor jou?',
    domain: 'mysterie',
    answers: [
      ans(36, 0, '{PURPLE>De} {PURPLE>waarheid}. Niet {PURPLE>mijn} {PURPLE>waarheid} — {PURPLE>de} {PURPLE>waarheid}. Die {PURPLE>is} {PURPLE>er} {PURPLE>voor} {PURPLE>iedereen} {PURPLE>of} {PURPLE>voor} {PURPLE>niemand}.'),
      ans(36, 1, '{ORANGE>De} {ORANGE>vraag}. Niet {ORANGE>het} {ORANGE>antwoord} — {ORANGE>de} {ORANGE>vraag} {ORANGE>zelf}. Die {ORANGE>overtuiging} {ORANGE>functioneert} {ORANGE>als} {ORANGE>mijn} {ORANGE>diepste} {ORANGE>kompas}.'),
      ans(36, 2, '{PURPLE>De} {PURPLE>kwetsbaarheid}, {PURPLE>van} {PURPLE>iedereen}. Het {PURPLE>moment} {PURPLE>dat} {PURPLE>iemand} {PURPLE>laat} {PURPLE>zien} {PURPLE>wat} {PURPLE>ze} {PURPLE>verbergen} — {PURPLE>dat} {PURPLE>is} {PURPLE>het} {PURPLE>heiligste}.'),
      ans(36, 3, 'Het {ORANGE>moment} {ORANGE>van} {ORANGE>transformatie}. Die {ORANGE>seconde} {ORANGE>waarop} {ORANGE>iets} {ORANGE>verandert} — {ORANGE>die} {ORANGE>dynamiek} {ORANGE>doorzie} ik {ORANGE>als} {ORANGE>het} {ORANGE>enige} {ORANGE>dat} {ORANGE>echt} {ORANGE>telt}.'),
      ans(36, 4, '{PURPLE>De} {PURPLE>eerste} {PURPLE>keer}. Iets {PURPLE>zien}, {PURPLE>voelen}, {PURPLE>ergens} {PURPLE>zijn} — {PURPLE>voor} {PURPLE>het} {PURPLE>eerst}. {PURPLE>Niet} {PURPLE>herhaalbaar}. {PURPLE>Daarin} {PURPLE>zit} {PURPLE>het} {PURPLE>heilige}.'),
      ans(36, 5, '{ORANGE>Mijn} {ORANGE>woord}. Als {ORANGE>ik} {ORANGE>iets} {ORANGE>zeg}, {ORANGE>staat} {ORANGE>het}. Die {ORANGE>standaard} {ORANGE>is} {ORANGE>mijn} {ORANGE>fundament} — {ORANGE>ik} {ORANGE>hou} {ORANGE>daar} {ORANGE>meer} {ORANGE>aan} {ORANGE>vast} {ORANGE>dan} {ORANGE>aan} {ORANGE>wat} {ORANGE>ook}.'),
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
