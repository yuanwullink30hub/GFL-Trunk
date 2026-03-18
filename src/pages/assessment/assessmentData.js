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
      ans(1, 0, 'Dat ik wist dat het niet klopte en er toch in meeging. Niet de fout zelf \u2014 maar dat ik mijn eigen kompas negeerde.'),
      ans(1, 1, 'Dat ik er een grap van maakte terwijl het ertoe deed. Ergens heb ik geleerd dat lichtheid me beschermt \u2014 maar soms beschermt het me tegen precies dat wat ik had moeten voelen.'),
      ans(1, 2, 'Dat ik afstand hield terwijl iemand dichtbij wilde komen. Het besef dat iemand zich naar me uitstrekte en ik er niet was \u2014 dat blijft hangen.'),
      ans(1, 3, 'Dat ik begrijpen ben gaan gebruiken als excuus om niet te bewegen. Ergens heb ik mezelf aangeleerd dat zolang ik het nog aan het analyseren ben, ik nog niet hoef te kiezen. Dat voelt als scherpte, maar het werkt als uitstel.'),
      ans(1, 4, 'Dat ik cynisch werd. Dat er een moment was waarop ik stopte met geloven dat het goed zou komen. Niet de tegenslag \u2014 maar dat ik mijn eigen hoop liet varen.'),
      ans(1, 5, 'Dat ik prestatie gelijk ben gaan stellen aan waarde. Ergens heb ik geleerd dat stilstaan falen is \u2014 en nu veroordeel ik mezelf voor elke keer dat ik rust nam.'),
    ],
  },

  // ─── Q2 (Key 2, Mirror) ───
  {
    id: 2,
    text: 'Je ontdekt dat iets waar je lang in geloofde niet klopt. Wat is je eerste beweging?',
    domain: 'introversie',
    answers: [
      ans(2, 0, 'Ik scan meteen wat er nu mogelijk is. Want een overtuiging die valt maakt altijd meer ruimte vrij dan ze innam \u2014 dat is inmiddels een reflex.'),
      ans(2, 1, 'Het voelt alsof er iets scheurt. Niet in mijn hoofd \u2014 dieper. Dat gat moet ik eerst voelen voordat ik er iets mee kan.'),
      ans(2, 2, 'Ik ga na welke beslissingen op die overtuiging rustten. Want als het fundament niet klopt, wil ik weten wat er nog overeind staat voordat ik verder bouw.'),
      ans(2, 3, 'Eerlijk gezegd vind ik het grappig \u2014 dat ik er zo lang in trapte. Geloven is sowieso een tijdelijk contract.'),
      ans(2, 4, 'Mijn eerste gedachte gaat naar de mensen met wie ik dit deelde. Inmiddels herken ik dat patroon \u2014 eerst zij, dan pas ik.'),
      ans(2, 5, 'Ik word wakker. Alsof er een laag wegvalt en ik scherper zie. Een illusie minder is een hefboom meer.'),
    ],
  },

  // ─── Q3 (Key 3, Standard) ───
  {
    id: 3,
    text: 'Welk deel van jezelf bescherm je het felst \u2014 ook tegen de mensen die het dichtst bij je staan?',
    domain: 'introversie',
    answers: [
      ans(3, 0, 'Hoeveel het me kost. Als ze zouden weten hoe leeg de tank soms is, zouden ze zich inhouden \u2014 en dat kan ik niet hebben.'),
      ans(3, 1, 'Mijn twijfel. Want zodra mensen die zien, leunen ze minder op me \u2014 en ergens onderweg is dat het laatste geworden dat ik wil.'),
      ans(3, 2, 'Dat ik nog steeds geloof dat het goed komt. In een wereld die daar cynisch over doet, voelt die hoop kwetsbaar \u2014 alsof ik het moet bewaken.'),
      ans(3, 3, 'Mijn binnenwereld. Wat ik naar buiten breng is altijd al vertaald \u2014 want het ruwe origineel verdampt zodra ik het te vroeg deel. Dat weet ik inmiddels.'),
      ans(3, 4, 'Hoe hard ik over mezelf oordeel. Die interne rechtbank draait dag en nacht. Als mensen dat zouden zien, zouden ze schrikken.'),
      ans(3, 5, 'Hoe serieus het er vanbinnen aan toe gaat. Want zodra ik dat laat zien, worden mensen voorzichtig \u2014 en dan verlies ik de enige ruimte waarin ik eerlijk kan zijn.'),
    ],
  },

  // ─── Q4 (Key 4, Mirror) ───
  {
    id: 4,
    text: 'Wanneer voel jij je het verst van jezelf verwijderd?',
    domain: 'introversie',
    answers: [
      ans(4, 0, 'Als ik functioneer in plaats van voel. Inmiddels herken ik dat moment \u2014 het is hoe ik overleef, niet hoe ik leef.'),
      ans(4, 1, 'Als het chaos is en ik er niks aan kan doen. Niet andermans chaos \u2014 die van mijzelf. Dat is geen ongemak, dat is alarm.'),
      ans(4, 2, 'Als ik te lang op dezelfde plek zit. Over de jaren is dat mijn betrouwbaarste waarschuwing geworden \u2014 herhaling is mijn signaal dat ik vastzit.'),
      ans(4, 3, 'Als ik niks heb om voor te vechten. Geen doel, geen weerstand. Die leegte is het engste \u2014 alsof ik zonder strijd verdamp.'),
      ans(4, 4, 'Als ik meedoe aan iets waar ik niet achter sta. Want elke dag dat ik mijn mond hou, merk ik dat er iets in me stilvalt.'),
      ans(4, 5, 'Als ik niet meer kan denken. Niet vermoeidheid \u2014 ruis. Te veel prikkels, te weinig stilte. Dan verlies ik het signaal.'),
    ],
  },

  // ─── Q5 (Key 5, Standard) ───
  {
    id: 5,
    text: 'Er is iets in je leven dat je al maanden uitstelt. Waar wacht je eigenlijk op?',
    domain: 'introversie',
    answers: [
      ans(5, 0, 'Op een teken dat het veilig is. Niet rationeel \u2014 ik weet dat het er misschien nooit komt. Maar iets in mij weigert te springen zolang de landing onzeker is.'),
      ans(5, 1, 'Op het juiste moment. Want timing is alles \u2014 te vroeg bewegen verspilt de impact. Inmiddels weet ik dat \u00e9\u00e9n goed getimede zet meer doet dan tien gehaaste.'),
      ans(5, 2, 'Op niks. Ik stel het niet uit omdat ik wacht \u2014 ik stel het uit omdat het systeem eromheen niet deugt. Bouwen op een rot fundament gaat me niet gebeuren.'),
      ans(5, 3, 'Op het moment dat ik de uitvoering volledig kan regisseren. Want half werk levert dubbele schade \u2014 dat is over de jaren mijn duurste les geweest.'),
      ans(5, 4, 'Op een moment waarop het niemand raakt. Ik weet wat ik moet doen, maar elke optie heeft gevolgen voor iemand anders. Dus ik wacht.'),
      ans(5, 5, 'Op het gevoel dat het klopt. Ik kan het technisch uitvoeren wanneer ik wil, maar zonder die innerlijke resonantie wordt het een lege handeling. Dat verschil herken ik inmiddels feilloos.'),
    ],
  },

  // ─── Q6 (Key 6, Mirror) ───
  {
    id: 6,
    text: 'Wat is het gevaarlijkste dat je ooit tegen jezelf hebt gezegd \u2014 en geloofde?',
    domain: 'introversie',
    answers: [
      ans(6, 0, '"Het maakt niet uit wat ik vind." Want zodra ik dat geloofde, ging ik meedoen met dingen die niet klopten \u2014 en het duurde lang voor ik doorhad dat het stilzwijgen de schade was.'),
      ans(6, 1, '"Ik snap het." Terwijl ik het helemaal niet snapte \u2014 ik had alleen een model dat klopte. Het gevaarlijkste moment is wanneer begrip aanvoelt als controle.'),
      ans(6, 2, '"Ze hebben me nodig." Dat klonk als liefde, maar over de jaren is het een ketting geworden. Zolang ik onmisbaar was, hoefde ik niet naar mezelf te kijken.'),
      ans(6, 3, '"Ik kan dit fixen." Alles. Altijd. Het gevaarlijke is niet de arrogantie \u2014 het is dat het vaak klopt. En juist omdat het klopt, stopte ik met vragen of ik het ook m\u00f3est.'),
      ans(6, 4, '"Ik hoef nergens bij te horen." Want dat voelde als vrijheid, maar inmiddels weet ik dat het een verdedigingslinie was. Achter die linie werd het steeds stiller.'),
      ans(6, 5, '"Als ik het niet doe, doet niemand het." En het klopt \u2014 meestal. Maar die overtuiging vult elke ruimte. Er blijft niks over voor de twijfel, de rust, het loslaten.'),
    ],
  },

  // ─── Q7 (Key 1, Mirror) ───
  {
    id: 7,
    text: 'Wanneer heb je voor het laatst iets over jezelf ontdekt dat je liever niet had geweten?',
    domain: 'introversie',
    answers: [
      ans(7, 0, 'Toen ik merkte dat mijn strengheid naar anderen een omweg was om mezelf niet aan te kijken. Dat inzicht bouwde zich over maanden op.'),
      ans(7, 1, 'Dat ik grappen maak als het pijn doet. Niet als strategie \u2014 het gebeurt gewoon. De lach zit er eerder dan de traan, en ik weet niet of dat kracht is of een reflex waar ik niks aan kan doen.'),
      ans(7, 2, 'Dat ik soms geef om te krijgen. Het voelde als een klap \u2014 want ik had altijd gedacht dat mijn warmte onvoorwaardelijk was.'),
      ans(7, 3, 'Dat ik meer weet dan ik durf toe te passen. De kennis is er, het inzicht is er \u2014 maar de moed om ernaar te handelen blijft achter.'),
      ans(7, 4, 'Dat mijn optimisme soms een schild is. Er zijn momenten waarop ik het positieve opzoek niet omdat ik erin geloof, maar omdat het alternatief te zwaar voelt.'),
      ans(7, 5, 'Dat ik niet stop omdat ik gedreven ben, maar omdat ik bang ben voor wat er overblijft als ik stilsta. Die motor draait niet op ambitie \u2014 hij draait op vermijding.'),
    ],
  },

  // ─── Q8 (Key 2, Standard) ───
  {
    id: 8,
    text: 'Wat is de prijs die je betaalt voor wie je bent \u2014 en die je nooit hardop uitspreekt?',
    domain: 'introversie',
    answers: [
      ans(8, 0, 'Dat ik nergens helemaal land. Mensen, plekken, projecten \u2014 ik ben er altijd net niet helemaal. De vrijheid die dat oplevert is dezelfde vrijheid die me eenzaam maakt.'),
      ans(8, 1, 'Dat de intensiteit waarmee ik de wereld zie me soms ongeschikt maakt voor het gewone leven. Over de jaren heb ik dat leren verpakken \u2014 maar de grondstof is rauw.'),
      ans(8, 2, 'Dat mensen me respecteren maar zelden warmte geven. Mijn eerlijkheid schept afstand \u2014 niet omdat ik dat wil, maar omdat de waarheid scherper snijdt dan een leugen.'),
      ans(8, 3, 'Dat niemand me helemaal serieus neemt. Zelfs als ik iets meen, zoeken mensen naar de grap. Inmiddels besef ik dat ik die dynamiek zelf heb opgebouwd \u2014 en nu zit ik erin.'),
      ans(8, 4, 'Dat ik te veel voel. De wereld raakt me harder dan anderen, en dat maakt me goed in verbinden maar kwetsbaar op plekken waar anderen beschermd zijn.'),
      ans(8, 5, 'Dat ik altijd bezig ben met de volgende versie. Van alles \u2014 van mezelf, van het plan. Die constante transformatie betekent dat ik zelden aanwezig ben in wat er nu is. Dat patroon herken ik, maar stoppen kan ik niet.'),
    ],
  },

  // ─── Q9 (Key 3, Mirror) ───
  {
    id: 9,
    text: 'Als je alles zou verliezen \u2014 status, bezit, relaties \u2014 wat blijft er dan over?',
    domain: 'introversie',
    answers: [
      ans(9, 0, 'De drang om iets voor iemand te betekenen. Want zelfs zonder al het andere blijf ik overeind zolang er iemand is die me nodig heeft. Dat klinkt mooi, maar inmiddels weet ik dat het ook een val is.'),
      ans(9, 1, 'De weigering om te stoppen. Alles kan weg \u2014 als die motor maar blijft draaien. Het is geen keuze, het is wat er overblijft als al het andere stilvalt.'),
      ans(9, 2, 'De overtuiging dat het weer goed komt. Niet blind \u2014 ik heb genoeg meegemaakt om te weten dat hoop geen garantie is. Maar ergens onderweg is het kiezen voor die hoop een bewuste houding geworden.'),
      ans(9, 3, 'De binnenkant. Alles wat ik van buiten opbouwde is een vertaling \u2014 het origineel zit in mij. Dat kan niemand afpakken, niet omdat ik het bescherm, maar omdat het nergens anders bestaat.'),
      ans(9, 4, 'Mijn code. Want alles wat ik bezat was gebouwd op een fundament van principes. Als het gebouw instort, toets ik wat overblijft aan datzelfde fundament \u2014 zo heb ik het altijd gedaan.'),
      ans(9, 5, 'De lach. Serieus. Neem alles weg en ik zit in een leeg veld en vind het grappig. Niet cynisch \u2014 \u00e9cht grappig. Omdat alles absurd is. En in die absurditeit zit iets onverwoestbaars.'),
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
    text: 'Hoe ervaar je de constante prikkels van de moderne wereld?',
    domain: 'introversie',
    answers: [
      ans(10, 0, 'Als een stroom van energie die ik kan sturen en gebruiken voor mijn doelen.'),
      ans(10, 1, 'Als chaotisch; ik probeer de ruis te filteren om te zien wat echt waar en belangrijk is.'),
      ans(10, 2, 'Als een kermis; ik laat me niet gek maken en pik eruit wat ik leuk vind.'),
      ans(10, 3, 'Als een oceaan van mogelijkheden waarin ik steeds nieuwe dingen kan vinden.'),
      ans(10, 4, 'Als een dwingend systeem waar ik me bewust voor afsluit om mezelf te blijven.'),
      ans(10, 5, 'Als vermoeiend, omdat ik steeds voel waar anderen behoefte aan hebben.'),
    ],
  },

  // ─── Q11 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 11,
    text: 'Wat betekent het voor jou om een fout te maken?',
    domain: 'introversie',
    answers: [
      ans(11, 0, 'Een fout maakt me bang; ik voel me schuldig en hoop dat het me vergeven wordt.'),
      ans(11, 1, 'Ik oordeel zwaar en snel over fouten; ik wil graag direct ingrijpen om de stabiliteit te herstellen.'),
      ans(11, 2, 'Een fout is een onverwachte wending; vaak ontstaan hieruit de mooiste creaties.'),
      ans(11, 3, 'Een fout is pijnlijk als het de ander kwetst; ik zoek direct naar herstel van de band.'),
      ans(11, 4, 'Een fout is onvermijdelijk op de weg naar succes.'),
      ans(11, 5, 'Een fout is data; het is noodzakelijke informatie om mijn inzicht te verbeteren.'),
    ],
  },

  // ─── Q12 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 12,
    text: 'Hoe kijk je naar autoriteit en machtsverhoudingen?',
    domain: 'introversie',
    answers: [
      ans(12, 0, 'Macht is er om te dienen; wie de leiding heeft, moet zorgen voor de zwakkeren.'),
      ans(12, 1, 'Met wantrouwen; ik verzet me tegen iedereen die macht over mij probeert uit te oefenen.'),
      ans(12, 2, 'Als grenzen die ik wil testen; ik ben benieuwd wat er gebeurt als ik eroverheen ga.'),
      ans(12, 3, 'Macht is een illusie; ik saboteer graag de opgeblazen ego\'s van leiders.'),
      ans(12, 4, 'Macht moet rechtvaardig zijn; ik accepteer autoriteit alleen als die integer handelt.'),
      ans(12, 5, 'Macht is energie; het is een middel om dingen in beweging te zetten en te veranderen.'),
    ],
  },

  // ─── Q13 (Key 1, Standard) ───
  {
    id: 13,
    text: 'Hoe positioneer jij jezelf in een team dat onder hoge druk staat?',
    domain: 'extraversie',
    answers: [
      ans(13, 0, 'Als het brein; ik stap uit de hectiek om het overzicht te bewaren en de strategie te bepalen.'),
      ans(13, 1, 'Als de motor; ik werk twee keer zo hard als de rest om te zorgen dat we de deadline halen.'),
      ans(13, 2, 'Als de lijm; ik let op de sfeer en zorg dat niemand onderdoor gaat aan de stress.'),
      ans(13, 3, 'Als de vernieuwer; ik zoek naar een onorthodoxe oplossing om de druk te verlichten.'),
      ans(13, 4, 'Als de manager; ik neem de leiding, deel taken uit en bewaak de structuur.'),
      ans(13, 5, 'Als de loyale soldaat; ik doe precies wat me gezegd wordt en klaag niet.'),
    ],
  },

  // ─── Q14 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 14,
    text: 'Hoe ga je om met felle concurrentie en rivaliteit in je vakgebied?',
    domain: 'extraversie',
    answers: [
      ans(14, 0, 'Ik verander het spel; door innovatie maak ik wat de concurrent doet irrelevant.'),
      ans(14, 1, 'Ik vind concurrentie goed, zolang het maar eerlijk en volgens de regels gaat.'),
      ans(14, 2, 'Ik neem het niet te serieus; winnen of verliezen is ook maar een momentopname.'),
      ans(14, 3, 'Ik zoek naar een niche waar nog niemand is; ik wil niet vechten, maar ontdekken.'),
      ans(14, 4, 'Ik wil de gevestigde orde omverwerpen; ik doe het totaal anders dan de rest.'),
      ans(14, 5, 'Ik vind concurrentie lastig; ik werk liever samen en help anderen ook vooruit.'),
    ],
  },

  // ─── Q15 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 15,
    text: 'Wat doe je als je een kamer vol onbekenden binnenstapt op een netwerkevenement?',
    domain: 'extraversie',
    answers: [
      ans(15, 0, 'Ik wacht rustig af en sta open voor iedereen die een praatje wil maken.'),
      ans(15, 1, 'Ik straal autoriteit uit en zorg dat ik met de sleutelfiguren in gesprek kom.'),
      ans(15, 2, 'Ik laat mezelf zien zoals ik ben en trek vanzelf mensen aan die daarbij passen.'),
      ans(15, 3, 'Ik zoek naar die ene persoon met wie ik echt een diepe klik voel.'),
      ans(15, 4, 'Ik doe liever dingen alleen, als ik al met iemand wil praten dan de persoon die in lijn staan met mijn missie.'),
      ans(15, 5, 'Ik observeer eerst de ruimte en stap berekend op mensen af.'),
    ],
  },

  // ─── Q16 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 16,
    text: 'Wat is je primaire reactie op een groot zakelijk falen of een crisis?',
    domain: 'extraversie',
    answers: [
      ans(16, 0, 'Overweldigd door emotie, de energie die ik nog over heb gebruik ik om anderen te ondersteunen.'),
      ans(16, 1, 'Snel geërgerd door menselijk falen en zet druk op de orde ongeacht wie of wat de oorzaak is.'),
      ans(16, 2, 'Ik onderzoek wat er misging en zie het als springplank voor mijn volgende expeditie.'),
      ans(16, 3, 'Ik maak een grap om de spanning te breken en het probleem te vermijden.'),
      ans(16, 4, 'Ik wil precies weten wie of wat de oorzaak is en hoe we dit rechtzetten.'),
      ans(16, 5, 'Ik zie de crisis als het perfecte moment om alles radicaal om te transformeren.'),
    ],
  },

  // ─── Q17 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 17,
    text: 'Welke rol neem je in binnen een gemeenschap of vereniging?',
    domain: 'extraversie',
    answers: [
      ans(17, 0, 'De adviseur; mensen komen naar mij toe voor wijsheid en inzicht.'),
      ans(17, 1, 'De kartrekker; als er iets moet gebeuren, sta ik vooraan.'),
      ans(17, 2, 'Het hart; ik zorg dat de sfeer goed is en iedereen zich verbonden voelt.'),
      ans(17, 3, 'De vernieuwer; ik breng leven in de brouwerij met frisse ideeën.'),
      ans(17, 4, 'De voorzitter; ik bewaak de structuur en de lange termijn.'),
      ans(17, 5, 'Het loyale lid; ik ben er altijd en steun de club onvoorwaardelijk.'),
    ],
  },

  // ─── Q18 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 18,
    text: 'Hoe creëer je waarde en impact in de buitenwereld?',
    domain: 'extraversie',
    answers: [
      ans(18, 0, 'Door situaties te veranderen en problemen als sneeuw voor de zon te laten verdwijnen.'),
      ans(18, 1, 'Door duidelijkheid en rechtvaardigheid te bieden in verwarrende tijden.'),
      ans(18, 2, 'Door mensen te laten lachen en de zwaarte van het leven te relativeren.'),
      ans(18, 3, 'Door nieuwe wegen te openen die anderen nog niet durfden te gaan.'),
      ans(18, 4, 'Door mensen te bevrijden van vastgeroeste patronen en regels.'),
      ans(18, 5, 'Door er onvoorwaardelijk te zijn en mensen te helpen groeien.'),
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
    text: 'Hoe neem je beslissingen als de belangen groot zijn en de uitkomst onzeker?',
    domain: 'extraversie',
    answers: [
      ans(19, 0, 'Ik kies wat goed en eerlijk is, en vertrouw erop dat de uitkomst dan ook goed zal zijn.'),
      ans(19, 1, 'Ik kies wat op de lange termijn de stabiliteit en macht van de organisatie waarborgt.'),
      ans(19, 2, 'Ik kies de weg die het meest \'kloppend\' en inspirerend voelt, los van de cijfers.'),
      ans(19, 3, 'Ik beslis op basis van wat het beste voelt voor de mensen om wie ik geef.'),
      ans(19, 4, 'Ik hak de knoop door en vertrouw op mijn vermogen om problemen onderweg op te lossen.'),
      ans(19, 5, 'Ik verzamel alle feiten en kies de optie met de hoogste statistische kans van slagen.'),
    ],
  },

  // ─── Q20 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 20,
    text: 'Wat is de diepere drijfveer achter jouw ambitie?',
    domain: 'extraversie',
    answers: [
      ans(20, 0, 'Ik wil invloed hebben zodat ik op grotere schaal voor anderen kan zorgen.'),
      ans(20, 1, 'Ik wil degenen die niet in mij geloofden laten zien dat ze fout zaten.'),
      ans(20, 2, 'Ik wil succesvol zijn zodat ik de middelen heb om te gaan en staan waar ik wil.'),
      ans(20, 3, 'Ik ben ambitieus zolang ik het spel leuk vind, ik gebruik mijn positie om de bourgeoisie te herinneren dat ook zij gewoon mensen zijn.'),
      ans(20, 4, 'Ik wil op een positie komen waar ik kan zorgen dat dingen rechtvaardig geregeld worden.'),
      ans(20, 5, 'Ik wil zien of ik de beelden in mijn hoofd werkelijkheid kan maken in de materie.'),
    ],
  },

  // ─── Q21 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 21,
    text: 'Hoe ga je om met kritiek en professionele grenzen?',
    domain: 'extraversie',
    answers: [
      ans(21, 0, 'Ik luister objectief en kijk of ik er iets van kan leren.'),
      ans(21, 1, 'Ik zie het als een uitdaging om nog competenter te worden.'),
      ans(21, 2, 'Ik neem het ter harte, maar het kost me tijd om bij te sturen.'),
      ans(21, 3, 'Ik gebruik het als inspiratie, maar blijf trouw aan mijn eigen stijl.'),
      ans(21, 4, 'Ik beoordeel of de feedback nuttig is voor het resultaat en pas me zo nodig aan.'),
      ans(21, 5, 'De kritiek is terecht en probeer het de volgende keer precies goed te doen.'),
    ],
  },

  // ─── Q22 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 22,
    text: 'Welk businessmodel is leidend voor je eigen zaak?',
    domain: 'extraversie',
    answers: [
      ans(22, 0, 'Een model gericht op transformatie en innovatie; ik wil producten of diensten creëren die de werkelijkheid en de beleving van de klant fundamenteel veranderen.'),
      ans(22, 1, 'Een model gebaseerd op absolute integriteit en objectieve kwaliteit; alles binnen de bedrijfsvoering moet toetsbaar, rechtvaardig en moreel zuiver zijn.'),
      ans(22, 2, 'Een model dat draait om plezier en verrassing; ik wil de markt opschudden met humor en laten zien hoe absurd de traditionele businesswereld soms kan zijn.'),
      ans(22, 3, 'Een model dat voortdurend op zoek is naar \'onontgonnen terrein\'; ik wil pionieren in niches en markten waar anderen nog niet durven of willen kijken.'),
      ans(22, 4, 'Een model dat de gevestigde orde en monopolies aanvalt; ik wil een onafhankelijke koers varen die de vastgeroeste wetten van de industrie radicaal doorbreekt.'),
      ans(22, 5, 'Een model gericht op sociale zorg en gemeenschapszin; de zaak is in de eerste plaats een middel om anderen te ondersteunen en een veilige haven te bieden.'),
    ],
  },

  // ─── Q23 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 23,
    text: 'Wat kenmerkt jouw natuurlijke leiderschapsstijl?',
    domain: 'extraversie',
    answers: [
      ans(23, 0, 'Ik dien door het goede voorbeeld te geven en bescheiden te blijven.'),
      ans(23, 1, 'Ik zorg voor duidelijke kaders, rollen en verantwoordelijkheden.'),
      ans(23, 2, 'Ik inspireer mensen door mijn passie en unieke manier van kijken.'),
      ans(23, 3, 'Ik verbind de individuele belangen tot een saamhorige symfonie.'),
      ans(23, 4, 'Ik loop als eerste door het vuur en geef het ritme aan.'),
      ans(23, 5, 'Ik schets de grote lijnen van de toekomst, de details laat ik aan anderen.'),
    ],
  },

  // ─── Q24 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 24,
    text: 'Hoe ga je om met ethische dilemma\'s?',
    domain: 'extraversie',
    answers: [
      ans(24, 0, 'Ik kies voor de optie die de minste pijn veroorzaakt bij anderen.'),
      ans(24, 1, 'Ik kies voor wat juist voelt, ook als dat tegen de regels ingaat.'),
      ans(24, 2, 'Ik zoek naar een nieuwe weg waarbij we het dilemma kunnen omzeilen.'),
      ans(24, 3, 'Ik laat zien dat het dilemma zelf eigenlijk een farce is.'),
      ans(24, 4, 'Ik houd me strikt aan de principes van recht en waarheid, ongeacht de gevolgen.'),
      ans(24, 5, 'Ik probeer de situatie zo te draaien dat beide kanten winnen (win-win).'),
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
    text: 'Hoe zoek jij naar \'waarheid\' in een tijd waarin media en algoritmes bepalen wat we zien?',
    domain: 'cultuur',
    answers: [
      ans(25, 0, 'Door historische patronen te analyseren; waarheid zit in de herhaling van feiten, niet in de hype.'),
      ans(25, 1, 'Door de strijd aan te gaan; ik vecht voor mijn overtuiging, ongeacht wat de massa vindt.'),
      ans(25, 2, 'Door verbinding; waarheid is wat resoneert in het contact tussen mensen, niet wat op een scherm staat.'),
      ans(25, 3, 'Door expressie; waarheid is een persoonlijke creatie die ik zelf vormgeef en uitdraag.'),
      ans(25, 4, 'Door autoriteit; ik vertrouw op bewezen bronnen en instituten die de orde bewaken.'),
      ans(25, 5, 'Door vertrouwen; ik ga uit van het goede in de mens en laat me niet leiden door cynisme.'),
    ],
  },

  // ─── Q26 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 26,
    text: 'Wat is jouw houding tegenover technologische revoluties die onze cultuur op zijn kop zetten?',
    domain: 'cultuur',
    answers: [
      ans(26, 0, 'Ik zie technologie als moderne alchemie om de mensheid naar een hogere realiteit te tillen.'),
      ans(26, 1, 'Ik toets of de vooruitgang wel ethisch verantwoord en rechtvaardig is.'),
      ans(26, 2, 'Met humor laat ik zien wat het echt betekent om mens te zijn.'),
      ans(26, 3, 'Ik wil weten welke nieuwe werelden we kunnen ontdekken met deze tools.'),
      ans(26, 4, 'Ik zie het vaak als een manier van de elite om meer controle over ons te krijgen.'),
      ans(26, 5, 'Ik maak me druk over wie er achterblijft en hoe we de menselijke maat bewaken.'),
    ],
  },

  // ─── Q27 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 27,
    text: 'Hoe kijk je naar veranderende idealen (zoals vrijheid van spreken) door de tijd heen?',
    domain: 'cultuur',
    answers: [
      ans(27, 0, 'Als een belofte; ik hoop dat we toegroeien naar een wereld van harmonie en eenvoud.'),
      ans(27, 1, 'Als een fundament; ik bescherm de kernwaarden die de beschaving stabiel houden.'),
      ans(27, 2, 'Als een inspiratiebron; nieuwe tijden vragen om nieuwe beelden en verhalen.'),
      ans(27, 3, 'Als een gevoel; ik wil me gepassioneerd verbinden met de tijdgeest en de mensen om me heen.'),
      ans(27, 4, 'Als een missie; idealen zijn er om voor te vechten en te verdedigen tegen verval.'),
      ans(27, 5, 'Als een evolutionair proces; ik bestudeer hoe waarden zich ontwikkelen volgens vaste wetmatigheden.'),
    ],
  },

  // ─── Q28 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 28,
    text: 'Wat is de rol van tradities in een digitale wereld?',
    domain: 'cultuur',
    answers: [
      ans(28, 0, 'Tradities zijn verbinding; ze bieden de veiligheid en geborgenheid die mensen nodig hebben.'),
      ans(28, 1, 'Tradities zijn kettingen; we moeten breken met het oude om echt vrij te kunnen zijn.'),
      ans(28, 2, 'Tradities zijn startpunten; we moeten ze kennen om ze te kunnen overstijgen.'),
      ans(28, 3, 'Tradities zijn theater; het is leuk om mee te doen, maar ik neem het niet te serieus.'),
      ans(28, 4, 'Tradities zijn ankers; velen vertegenwoordigen de morele afspraken die we niet mogen vergeten.'),
      ans(28, 5, 'Tradities zijn rituelen; we kunnen de oude vormen vullen met nieuwe energie.'),
    ],
  },

  // ─── Q29 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 29,
    text: 'Hoe integreer jij AI in je eigen leven?',
    domain: 'cultuur',
    answers: [
      ans(29, 0, 'Door begrip; wie de magie begrijpt, hoeft er niet bang voor te zijn.'),
      ans(29, 1, 'Door leiderschap; wij moeten onszelf en onze discipline rechttrekken, alleen dan blijft de menselijke wil een kracht voor de meting.'),
      ans(29, 2, 'Door menselijkheid; aanvullende entiteiten hebben een plek naast ons zoals ze dat altijd al hebben gehad.'),
      ans(29, 3, 'Door creativiteit; ik zie AI als een collectieve spiegel; wij als makers bouwen immers altijd al voort op eerdere creaties.'),
      ans(29, 4, 'Door regulering; we moeten duidelijke kaders stellen om de maatschappij te beschermen.'),
      ans(29, 5, 'Door eenvoud; ik geloof in de zuiverheid van de menselijke geest en dat een machine nooit de bezieling kan vervangen.'),
    ],
  },

  // ─── Q30 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 30,
    text: 'Hoe kijk je naar de macht van \'Big Tech\' over onze informatie?',
    domain: 'cultuur',
    answers: [
      ans(30, 0, 'Als een tool; deze bedrijven beheren de infrastructuur van onze nieuwe werkelijkheid.'),
      ans(30, 1, 'Als een monopolie; ze moeten getoetst worden aan wetten van eerlijkheid en privacy.'),
      ans(30, 2, 'Als een grap; ze denken dat ze alles weten, maar het leven is onvoorspelbaar.'),
      ans(30, 3, 'Als een digitale wildernis; ik gebruik hun technologie niet om te volgen, maar om mijn eigen koers te varen en mijn persoonlijke horizon te verbreden.'),
      ans(30, 4, 'Als een vijand; we moeten onze data terugveroveren en ons verzetten tegen hun controle.'),
      ans(30, 5, 'Als een risico; we moeten zorgen dat kwetsbare mensen niet gemanipuleerd worden.'),
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
    text: 'Wat leert de geschiedenis ons over vooruitgang?',
    domain: 'cultuur',
    answers: [
      ans(31, 0, 'Dat het uiteindelijk goed komt; de mensheid groeit langzaam naar het licht.'),
      ans(31, 1, 'Dat orde noodzakelijk is; zonder structuur leidt vooruitgang tot chaos.'),
      ans(31, 2, 'Dat de mens een schepper is; wij dromen de wereld van morgen in elkaar.'),
      ans(31, 3, 'Dat verbinding de sleutel is; culturen overleven alleen als mensen elkaar vasthouden.'),
      ans(31, 4, 'Dat vooruitgang strijd vereist; niets wordt beter zonder moed en opoffering.'),
      ans(31, 5, 'Dat alles in cycli gaat; wat we nu meemaken is al eerder gebeurd in een andere vorm.'),
    ],
  },

  // ─── Q32 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 32,
    text: 'Hoe reageer je op sociale eenzaamheid door digitalisering?',
    domain: 'cultuur',
    answers: [
      ans(32, 0, 'Ik zoek contact; ik bel mensen op en vraag hoe het echt met ze gaat.'),
      ans(32, 1, 'Ik gooi mijn telefoon weg; echte vrijheid is onbereikbaar zijn.'),
      ans(32, 2, 'Ik zoek nieuwe manieren om mensen te ontmoeten, online of offline.'),
      ans(32, 3, 'Ik relativeer het; we zitten allemaal alleen op een schermpje, dat is best komisch.'),
      ans(32, 4, 'Ik wijs op de verantwoordelijkheid; we moeten elkaar aanspreken op asociaal gedrag.'),
      ans(32, 5, 'Ik gebruik de techniek; ik bouw communities die fysieke grenzen overstijgen.'),
    ],
  },

  // ─── Q33 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 33,
    text: 'Wat is de rol van persoonlijke creativiteit in deze tijd?',
    domain: 'cultuur',
    answers: [
      ans(33, 0, 'Het is een manier om complexe problemen op te lossen.'),
      ans(33, 1, 'Het is een middel; met creativiteit kun je de gebroken fundamenten doorbreken.'),
      ans(33, 2, 'Het is een uiting van passie; iets moois maken dat verbindt.'),
      ans(33, 3, 'Het is essentieel; zonder schoonheid en verbeelding is de wereld doods.'),
      ans(33, 4, 'Het moet dienen; creativiteit is nuttig als het bijdraagt aan de bouw van de samenleving.'),
      ans(33, 5, 'Het is spelen; onbevangen iets maken zonder oordeel.'),
    ],
  },

  // ─── Q34 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 34,
    text: 'Hoe reageer je op de vraag om je levensstijl op te offeren voor een \'hoger doel\' (zoals klimaat)?',
    domain: 'cultuur',
    answers: [
      ans(34, 0, 'Ik zie het als transformatie; we moeten onze relatie met de aarde fundamenteel veranderen.'),
      ans(34, 1, 'Ik wil dat het eerlijk gaat; iedereen moet zijn deel doen, niet alleen de gewone man.'),
      ans(34, 2, 'Ik zie de ironie; mensen vliegen de wereld over om te praten over niet vliegen.'),
      ans(34, 3, 'Ik zie het als een uitdaging om een nieuwe manier van leven te ontdekken.'),
      ans(34, 4, 'Ik verzet me tegen dwang; ik bepaal zelf wel wat goed is, ik volg de kudde niet.'),
      ans(34, 5, 'Ik doe het graag; als ik daarmee de wereld voor anderen beter maak, is dat vanzelfsprekend.'),
    ],
  },

  // ─── Q35 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 35,
    text: 'Hoe doorzie je machtsspelletjes in de cultuur?',
    domain: 'cultuur',
    answers: [
      ans(35, 0, 'Door zuiverheid; ik houd me er niet mee bezig en blijf bij mezelf.'),
      ans(35, 1, 'Door inzicht in de structuur; ik weet hoe macht werkt omdat ik de regels ken.'),
      ans(35, 2, 'Door verbeelding; ik kijk voorbij het masker naar de ware intentie.'),
      ans(35, 3, 'Door gevoel; ik voel instinctief aan of iemand oprecht is of manipuleert.'),
      ans(35, 4, 'Door confrontatie; ik test de regels met mijn eigen waarden en bemoei me met principes die niet kloppen.'),
      ans(35, 5, 'Door analyse; ik kijk wie er echt profiteert van bepaalde ideeën.'),
    ],
  },

  // ─── Q36 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 36,
    text: 'Wat is de taak van de cultuur in een diverse wereld?',
    domain: 'cultuur',
    answers: [
      ans(36, 0, 'Helen en koesteren; cultuur moet zorgen voor de emotionele veiligheid en een verzorgende bodem bieden waarin elk individu zich beschermd en verbonden voelt.'),
      ans(36, 1, 'Systemen ontregelen; cultuur moet de confrontatie opzoeken met de gevestigde orde om ons te bevrijden van verstikkende tradities en achterhaalde regels.'),
      ans(36, 2, 'Een onbegrensde wildernis; cultuur is een open ruimte van totale vrijheid waarin we door interactie met het onbekende voortdurend onze eigen horizon verleggen.'),
      ans(36, 3, 'De lach als spiegel; cultuur moet de absurditeit van onze sociale \'rollen\' en hokjes blootleggen door alles wat wij als \'heilig\' of \'serieus\' beschouwen te relativeren.'),
      ans(36, 4, 'Morele toetsing; cultuur is de instantie die waakt over de integriteit en rechtvaardigheid van hoe we als verschillende groepen en individuen met elkaar omgaan.'),
      ans(36, 5, 'Creatieve alchemie; cultuur moet de verschillende stromen in de maatschappij samenbrengen en transformeren tot een fundamenteel nieuwe, hogere werkelijkheid.'),
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