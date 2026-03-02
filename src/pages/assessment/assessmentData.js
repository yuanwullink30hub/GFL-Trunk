/**
 * Garden for Life — Assessment Data (Level: Meester)
 *
 * 60 questions × 6 answers, split across 5 layers (12 questions each).
 *
 * ─── Neuraal Schakelbord — 12-Archetype Rotation System ───
 *
 * Archetype Nummering (1-12 op het wiel):
 *   1=Judge(G1)  2=Lover(G2)  3=Caregiver(G2)  4=Innocent(G3)
 *   5=Explorer(G3)  6=Outlaw(G4)  7=Trickster(G4)  8=Sage(G5)
 *   9=Artist(G5)  10=Magician(G6)  11=Hero(G6)  12=Ruler(G1)
 *
 * Set Alpha (Odd questions Q1,Q3,Q5,...): Judge, Lover, Innocent, Outlaw, Sage, Magician
 * Set Beta  (Even questions Q2,Q4,Q6,...): Trickster, Artist, Hero, Ruler, Caregiver, Explorer
 *
 * 4 Rotation Keys cycle Q1→Q2→Q3→Q4→Q1→... across all 60 questions:
 *   Q1 (ABCDEF) — De Grondhouding (G1→G6):      A→1  B→2  C→4  D→6  E→8  F→10
 *   Q2 (DEFABC) — De Verschuiving naar Chaos:     A→7  B→9  C→11 D→12 E→3  F→5
 *   Q3 (FEDCBA) — De Spiegeling van de Geest:     A→10 B→8  C→6  D→4  E→2  F→1
 *   Q4 (CBAFED) — De Omgekeerde Orde (G3→G4):    A→5  B→3  C→12 D→11 E→9  F→7
 *
 * Harmony Bonus (+69): Main & Support zijn directe buren binnen hun Neurale Zuil
 * Shadow Integration: 180°-as op het wiel (positie + 6)
 *
 * Each of the 12 archetypes appears exactly 30 times across all 360 answer slots.
 */

// ──────── Archetype Sets (Neuraal Schakelbord) ────────
// Set Alpha: positions 1,2,4,6,8,10 on the wheel
const SET_A = ['JUDGE', 'LOVER', 'INNOCENT', 'OUTLAW', 'SAGE', 'MAGICIAN'];
// Set Beta: positions 7,9,11,12,3,5 on the wheel
const SET_B = ['TRICKSTER', 'ARTIST', 'HERO', 'RULER', 'CAREGIVER', 'EXPLORER'];

// ──────── Rotation Patterns (answer-position → archetype-index) ────────
const PATTERNS = [
  [0, 1, 2, 3, 4, 5], // Q1 (ABCDEF): De Grondhouding — G1→G6 forward
  [0, 1, 2, 3, 4, 5], // Q2 (DEFABC): De Verschuiving naar Chaos — G4→G3
  [5, 4, 3, 2, 1, 0], // Q3 (FEDCBA): De Spiegeling van de Geest — G6→G1 mirror
  [5, 4, 3, 2, 1, 0], // Q4 (CBAFED): De Omgekeerde Orde — G3→G4
];

/**
 * Returns the archetype key for a given question number (1-60) and
 * answer position (0-5 = A-F).
 */
function getArchetypeForAnswer(questionNum, answerPos) {
  const isOdd = questionNum % 2 !== 0;
  const set = isOdd ? SET_A : SET_B;
  const patternIndex = (questionNum - 1) % 4;
  const archetypeIdx = PATTERNS[patternIndex][answerPos];
  return set[archetypeIdx];
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
// LAYER 1 — Foundation (Introversie / Nurture / Zonde)  Q1-Q12
// ═══════════════════════════════════════════════════════════════════════

const layer1Questions = [
  // ─── Q1 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 1,
    text: 'Hoe bewaak je de grens tussen jouw rijke binnenwereld en de verwachtingen van de buitenwereld?',
    domain: 'introversie',
    answers: [
      ans(1, 0, 'Ik gebruik mijn binnenwereld als een laboratorium; ik trek me terug om de data van buiten te analyseren voordat ik reageer.'),
      ans(1, 1, 'Ik zie mijn binnenwereld als een vesting; ik train mezelf in stilte om sterker en gedisciplineerder naar buiten te treden.'),
      ans(1, 2, 'Ik vind de grens moeilijk; ik wil mijn diepste gevoelens delen, maar ben bang dat de rauwheid ervan de harmonie verstoort.'),
      ans(1, 3, 'De grens is mijn canvas; ik vertaal mijn innerlijke beelden naar buiten, zodat anderen mijn unieke realiteit kunnen zien.'),
      ans(1, 4, 'Ik bewaak de grens strak; mijn privéleven is een soeverein gebied waar ik alleen mensen toelaat die mijn regels respecteren.'),
      ans(1, 5, 'Ik ervaar nauwelijks een grens; ik geloof dat als ik puur en eerlijk ben de wereld mij ook zo behandelt.'),
    ],
  },

  // ─── Q2 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 2,
    text: 'Hoe navigeer je door sociale hiërarchieën en ongeschreven groepsregels?',
    domain: 'introversie',
    answers: [
      ans(2, 0, 'Ik speel met de groepsbalans om mijn eigen plek vast te stellen, goedschiks of kwaadschiks.'),
      ans(2, 1, 'Ik toets de structuur en vind overal wel wat van, ik krijg snel de neiging om te sturen in de ongeschreven regels.'),
      ans(2, 2, 'Ik relativeer de status; ik prik met humor door de opgeblazen ego\'s van de leiders heen.'),
      ans(2, 3, 'Ik bemoei me er niet mee; ik observeer de vreemde gewoontes van de groep zonder er echt deel van te worden.'),
      ans(2, 4, 'Ik voel instinctief weerstand; ik weiger mee te doen aan sociale spelletjes die mijn autonomie beperken.'),
      ans(2, 5, 'Ik zoek naar degenen die buiten de boot vallen; mijn drang is om de buitenbeentjes op te vangen.'),
    ],
  },

  // ─── Q3 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 3,
    text: 'Wat is jouw natuurlijke rol in de sociale hiërarchie van een vriendengroep?',
    domain: 'introversie',
    answers: [
      ans(3, 0, 'De trouwe volger die vertrouwt op de goede bedoelingen van de groep.'),
      ans(3, 1, 'De manager die de structuur neerzet en zorgt dat alles ordelijk verloopt.'),
      ans(3, 2, 'De smaakmaker die de groep kleur geeft met explosieve energie en \'extreme\' ideeën.'),
      ans(3, 3, 'De verbinder die zorgt voor de emotionele harmonie en de vriendschappen in de groep.'),
      ans(3, 4, 'De stille kracht op de achtergrond, vaak een rol die onzichtbaar of onnodig is.'),
      ans(3, 5, 'De serieuze vriend, jij verrast je vrienden nog wel eens met de kennis die je in huis hebt.'),
    ],
  },

  // ─── Q4 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 4,
    text: 'Hoe draag je de \'belasting\' van de geschiedenis en voorouders met je mee?',
    domain: 'introversie',
    answers: [
      ans(4, 0, 'Als een wond die ik moet verzorgen; ik probeer de pijn van mijn familie en gemeenschap te helen met liefde.'),
      ans(4, 1, 'Als een ketting die ik moet breken; ik weiger de fouten van mijn voorouders te herhalen.'),
      ans(4, 2, 'Als een zoektocht; ik moet uitzoeken wat van mij is en wat van hen, om mijn eigen pad te vinden.'),
      ans(4, 3, 'Als een absurd verhaal; ik laat me niet raken door de zwaarte en bekijk het met een korrel zout.'),
      ans(4, 4, 'Als een balans; ik weeg wat er is gebeurd en probeer het onrecht uit het verleden recht te zetten.'),
      ans(4, 5, 'Als brandstof; ik transformeer het oude verdriet in nieuwe kracht en wijsheid.'),
    ],
  },

  // ─── Q5 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 5,
    text: 'Wat is jouw fundamentele houding tegenover \'Tekort\' versus \'Overvloed\'?',
    domain: 'introversie',
    answers: [
      ans(5, 0, 'Ik zie het als een logische puzzel; ik wil de wetmatigheden begrijpen van hoe middelen verdeeld worden.'),
      ans(5, 1, 'Ik zie schaarste als een uitdaging die ik moet overwinnen door hard te werken en te presteren.'),
      ans(5, 2, 'Ik zie overvloed in de rijkdom van relaties; als we elkaar hebben, hebben we genoeg.'),
      ans(5, 3, 'Ik zie zoveel potentie in de leegte; met mijn creativiteit maak ik van niets iets bijzonders.'),
      ans(5, 4, 'Ik zie een voorraad als iets dat ik moet beheren en strategisch moet verdelen.'),
      ans(5, 5, 'Ik vertrouw erop dat er altijd genoeg zal zijn en dat er voor mij gezorgd wordt.'),
    ],
  },

  // ─── Q6 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 6,
    text: 'Wat doet het besef van sterfelijkheid en de dood met jouw levenshouding?',
    domain: 'introversie',
    answers: [
      ans(6, 0, 'Het is een overgang; ik zie de dood als een transformatie naar een andere vorm van energie.'),
      ans(6, 1, 'Het roept de vraag op naar het eind-oordeel; heb ik rechtvaardig en integer geleefd?'),
      ans(6, 2, 'Het laat zien hoe absurd onze zorgen zijn; ik lach om de ernst van het leven omdat het toch eindigt.'),
      ans(6, 3, 'Het is de ultieme grens; de gedachte aan het einde drijft me om nu alles te ontdekken wat er is.'),
      ans(6, 4, 'Het is de enige autoriteit die ik niet kan verslaan, dus ik leef radicaal vrij zolang het kan.'),
      ans(6, 5, 'Het maakt me beschermend; ik wil alles wat kwetsbaar is behoeden voor pijn en verlies.'),
    ],
  },

  // ─── Q7 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 7,
    text: 'Hoe ga je om met strikte morele regels, religie of dogma\'s uit je opvoeding?',
    domain: 'introversie',
    answers: [
      ans(7, 0, 'Ik vertrouw op de intentie ervan en vaker wel dan niet volg ik ze blindelings.'),
      ans(7, 1, 'Ik omarm ze als noodzakelijk; zonder morele wetten en vrees voor oordeel vervalt de mens in chaos.'),
      ans(7, 2, 'Ik zie ze als referentie waarbuiten ik zoek naar mijn eigen, unieke vrijheid.'),
      ans(7, 3, 'Ik volg ze om de harmonie te bewaren; ik wil niemand kwetsen of de relatie verstoren.'),
      ans(7, 4, 'Ik volg plichtsgetrouw morele regels zolang ze in lijn staan met mijn eigen ervaring.'),
      ans(7, 5, 'Ik analyseer ze eerst; ik volg ze alleen als ik de logica en het nut ervan begrijp.'),
    ],
  },

  // ─── Q8 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 8,
    text: 'Waarom heb je behoefte aan momenten van stilte en afzondering?',
    domain: 'introversie',
    answers: [
      ans(8, 0, 'Om op te laden, zodat ik daarna weer met volle energie voor anderen kan zorgen.'),
      ans(8, 1, 'Om te ontsnappen aan de druk van de maatschappij en mijn autonomie te voelen.'),
      ans(8, 2, 'Om op expeditie te gaan in mijn eigen geest en nieuwe ideeën te ontdekken.'),
      ans(8, 3, 'Om even mijn masker af te zetten en niet mee te hoeven doen aan het sociale spel.'),
      ans(8, 4, 'Om mijn eigen gedrag en keuzes in alle rust te toetsen aan mijn geweten.'),
      ans(8, 5, 'Om mijn innerlijke energie te focussen en te transformeren zonder afleiding.'),
    ],
  },

  // ─── Q9 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 9,
    text: 'Welke invloed heeft je opvoeding op wie je nu bent?',
    domain: 'introversie',
    answers: [
      ans(9, 0, 'Het heeft me de kennis gegeven waarmee ik de wereld nu begrijp en analyseer.'),
      ans(9, 1, 'Het was de training die mij sterk heeft gemaakt en heeft geleerd om door te zetten.'),
      ans(9, 2, 'Het heeft me geleerd hoe belangrijk liefde en verbinding zijn in het leven.'),
      ans(9, 3, 'Het heeft me de ruimte gegeven (of juist niet) om mijn eigen unieke vorm te maken.'),
      ans(9, 4, 'Het heeft me de structuur geboden die ik nu gebruik om mijn eigen leven te leiden.'),
      ans(9, 5, 'Het heeft me het basisvertrouwen gegeven in mensen.'),
    ],
  },

  // ─── Q10 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
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
];

// ═══════════════════════════════════════════════════════════════════════
// LAYER 2 — Emotional (Extraversie / Business / Prestatie)  Q13-Q24
// ═══════════════════════════════════════════════════════════════════════

const layer2Questions = [
  // ─── Q13 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
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

  // ─── Q19 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
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
// LAYER 3 — Mental (Cultuur / Wijsheid / Ideaal)  Q25-Q36
// ═══════════════════════════════════════════════════════════════════════

const layer3Questions = [
  // ─── Q25 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
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

  // ─── Q31 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
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

// ═══════════════════════════════════════════════════════════════════════
// LAYER 4 — Spiritual (Huwelijk / Sociale Balans / De Ziel)  Q37-Q48
// ═══════════════════════════════════════════════════════════════════════

const layer4Questions = [
  // ─── Q37 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 37,
    text: 'Hoe ga je in een relatie om met ongelijke behandeling?',
    domain: 'huwelijk',
    answers: [
      ans(37, 0, 'Ik analyseer de onderliggende dynamiek; ik wil de oorzaak van de scheefgroei begrijpen om de situatie met objectieve argumenten recht te zetten.'),
      ans(37, 1, 'Ik zie het als een uitdaging voor mijn karakter.'),
      ans(37, 2, 'Het raakt me in mijn kern; ik zoek onmiddellijk de diepe verbinding op om de passie te herstellen.'),
      ans(37, 3, 'Ik gebruik mijn eigenzinnigheid en creatieve expressie om de verhoudingen binnen onze relatie op een unieke manier open te breken.'),
      ans(37, 4, 'Ik trek een harde grens; ik eis heldere rollen en verantwoordelijkheden binnen een kader dat voor beide partijen eerlijk en stabiel is.'),
      ans(37, 5, 'Ik blijf zachtmoedig en geduldig; ik focus op het behoud van de vrede en vertrouw erop dat intenties goed bedoeld zijn.'),
    ],
  },

  // ─── Q38 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 38,
    text: 'Hoe kijk je naar technologie die onze ziel beïnvloedt?',
    domain: 'huwelijk',
    answers: [
      ans(38, 0, 'Ik zie het als alchemie; we kunnen onszelf transformeren naar een hogere vorm.'),
      ans(38, 1, 'Ik ben voorzichtig; we mogen de integriteit van de menselijke vorm niet schenden.'),
      ans(38, 2, 'Ik vind het bizar; we slikken pillen om gelukkig te zijn in plaats van onszelf uit te vinden.'),
      ans(38, 3, 'Ik ben nieuwsgierig; wat kunnen we bereiken als we onze realiteit optimaliseren?'),
      ans(38, 4, 'Ik verdoem het; ik laat niet rommelen aan mijn natuurlijke staat van zijn.'),
      ans(38, 5, 'Ik steun het als het helpt; als het lijden verlicht, is het een zegen.'),
    ],
  },

  // ─── Q39 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 39,
    text: 'Wat betekent muziek voor jouw persoonlijkheid?',
    domain: 'huwelijk',
    answers: [
      ans(39, 0, 'Muziek is vreugde; ik word er simpelweg blij van.'),
      ans(39, 1, 'Muziek is cultuur; het is een ritueel die de groep samenbindt en verheft.'),
      ans(39, 2, 'Muziek is expressie; het is de taal van de ziel in tastbare vorm.'),
      ans(39, 3, 'Muziek is emotie; het verbindt onze harten zonder woorden.'),
      ans(39, 4, 'Muziek is energie; het versterkt de vibe waar ik al in zit.'),
      ans(39, 5, 'Muziek is harmonie, het is een raam naar diepere waarheden.'),
    ],
  },

  // ─── Q40 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 40,
    text: 'Wat is jouw ideaalbeeld van een huwelijk of partnerschap?',
    domain: 'huwelijk',
    answers: [
      ans(40, 0, 'Een veilige haven; voor elkaar zorgen in voor- en tegenspoed.'),
      ans(40, 1, 'Een verbond; bonnie en clyde, joker en harley, volgens onze eigen regels.'),
      ans(40, 2, 'Een avontuur; samen de wereld ontdekken en elkaar vrijlaten om te groeien.'),
      ans(40, 3, 'Een feestje; het moet vooral leuk en speels blijven, leef en laat.'),
      ans(40, 4, 'Een contract; een afspraak gebaseerd op trouw en wederzijds respect.'),
      ans(40, 5, 'Een transformatie; elkaar helpen om de beste versie van onszelf te worden.'),
    ],
  },

  // ─── Q41 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 41,
    text: 'Hoe zie jij de menselijke ziel?',
    domain: 'huwelijk',
    answers: [
      ans(41, 0, 'Als stroming; een complex patroon van bewustzijn en geheugen.'),
      ans(41, 1, 'Als een vlam; de bron van mijn wilskracht en moed.'),
      ans(41, 2, 'Als een mysterie; datgene wat resoneert met de ziel van een ander.'),
      ans(41, 3, 'Als een kunstwerk; uniek, schoon en steeds in verandering.'),
      ans(41, 4, 'Als een verantwoordelijkheid; de morele kern die ik zuiver moet houden.'),
      ans(41, 5, 'Als een lichtje; puur en onsterfelijk.'),
    ],
  },

  // ─── Q42 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 42,
    text: 'Hoe beïnvloedt jouw sociale klasse/achtergrond je relaties?',
    domain: 'huwelijk',
    answers: [
      ans(42, 0, 'Ik transformeer het; ik bepaal zelf mijn status, los van mijn afkomst.'),
      ans(42, 1, 'Ik ben me ervan bewust; ik vind dat iedereen gelijke kansen verdient, ongeacht afkomst.'),
      ans(42, 2, 'Ik speel ermee; ik beweeg als een kameleon met elke laag mee.'),
      ans(42, 3, 'Ik stap eroverheen; ik vind het interessant om mensen uit andere milieus te ontmoeten.'),
      ans(42, 4, 'Ik heb sch*t; ik laat me niet beoordelen op waar ik vandaan kom.'),
      ans(42, 5, 'Ik zorg voor mijn directe kring; ik voel me verantwoordelijk voor mijn gemeenschap.'),
    ],
  },

  // ─── Q43 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 43,
    text: 'Hoe ga je om met asymmetrie (ongelijkheid) in geven en nemen?',
    domain: 'huwelijk',
    answers: [
      ans(43, 0, 'Ik merk het niet eens; ik ben dankbaar voor wat ik krijg en geef wat ik kan.'),
      ans(43, 1, 'Ik herstel de balans; een relatie moet uiteindelijk in evenwicht zijn om stabiel te blijven.'),
      ans(43, 2, 'Ik geef wat ik kan creëren; mijn bijdrage is uniek en niet in geld uit te drukken.'),
      ans(43, 3, 'Ik reken niet; als je van iemand houdt, geef je alles wat je hebt.'),
      ans(43, 4, 'Ik geef graag meer; het bewijst mijn kracht en onafhankelijkheid.'),
      ans(43, 5, 'Ik bekijk het over de lange termijn; het hoeft niet elke dag gelijk te zijn, als het totaal maar ongeveer klopt.'),
    ],
  },

  // ─── Q44 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 44,
    text: 'Hoe belangrijk is biochemie (aantrekkingskracht) versus verstand bij partnerkeuze?',
    domain: 'huwelijk',
    answers: [
      ans(44, 0, 'Ik kies voor de stabiele basis; hoewel de chemie een prikkel is, zoek ik primair naar een partner op wie ik een veilige en zorgzame toekomst kan bouwen.'),
      ans(44, 1, 'Ik volg de rauwe biologische impuls; ik weiger mijn verlangen te laten temmen door wat de maatschappij \'verstandig\' of \'gepast\' vindt.'),
      ans(44, 2, 'Ik zie chemie als mijn gids; de sterke biochemische prikkel is voor mij het signaal dat er een nieuw gebied in mezelf ontdekt wil worden via de ander.'),
      ans(44, 3, 'Ik omarm de onlogica; verliefdheid is de ultieme grap van de natuur die alle rationele plannen en verstandige keuzes in één klap zinloos maakt.'),
      ans(44, 4, 'Ik zoek naar cognitieve en morele symmetrie; voor mij is een relatie pas werkelijk \'chemisch\' als de waarden, het karakter en het verstand van de ander naadloos op de mijne aansluiten.'),
      ans(44, 5, 'Ik zoek de alchemistische vonk; een partner moet mijn hele wezen — zowel mijn lichaam als mijn geest — in een staat van transformatie en bezieling brengen.'),
    ],
  },

  // ─── Q45 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 45,
    text: 'Welke rol speelt competentie in jouw eigenwaarde?',
    domain: 'huwelijk',
    answers: [
      ans(45, 0, 'Ik wil de dingen begrijpen en beheersen.'),
      ans(45, 1, 'Ik ben wat ik doe.'),
      ans(45, 2, 'Het gaat erom dat ik liefdevol ben.'),
      ans(45, 3, 'Ik wil mijn visie kunnen uiten.'),
      ans(45, 4, 'Leiderschap vereist dat je competent en bekwaam bent.'),
      ans(45, 5, 'Ik ben goed zoals ik ben, ook als ik niks bijzonders kan.'),
    ],
  },

  // ─── Q46 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 46,
    text: 'Hoe kijk je naar de \'ziel\' van je partner?',
    domain: 'huwelijk',
    answers: [
      ans(46, 0, 'Als een spiegel die mij dingen over mezelf laat zien.'),
      ans(46, 1, 'Als een moreel kompas; ik bewonder de integriteit van de ander.'),
      ans(46, 2, 'Als een verrassing; je weet nooit wat er morgen uitkomt.'),
      ans(46, 3, 'Als een landschap dat ik nooit helemaal in kaart zal kunnen brengen.'),
      ans(46, 4, 'Als een wilde kracht die ik niet wil temmen, maar wel wil ontmoeten.'),
      ans(46, 5, 'Als iets kwetsbaars dat ik wil koesteren en beschermen.'),
    ],
  },

  // ─── Q47 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 47,
    text: 'Hoe belangrijk is een gedeelde culturele achtergrond?',
    domain: 'huwelijk',
    answers: [
      ans(47, 0, 'Maakt niet uit, liefde spreekt alle talen.'),
      ans(47, 1, 'Belangrijk, het zorgt voor stabiliteit en continuïteit van de waarden.'),
      ans(47, 2, 'Saai, ik word liever geprikkeld door iemand die anders is.'),
      ans(47, 3, 'Fijn, het geeft een diepere laag van herkenning en verbinding.'),
      ans(47, 4, 'Onbelangrijk; ik kies mijn eigen weg, los van waar ik vandaan kom.'),
      ans(47, 5, 'Handig, het maakt de communicatie efficiënter, maar niet noodzakelijk.'),
    ],
  },

  // ─── Q48 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 48,
    text: 'Sommige relaties zijn tijdelijk; wat betekenen deze in jouw verhaal?',
    domain: 'huwelijk',
    answers: [
      ans(48, 0, 'Het zijn periodes waarin ik mijn warmte en steun heb kunnen geven aan een ander, ook al was het pad dat we deelden eindig.'),
      ans(48, 1, 'Ondanks mijn drang naar vrijheid heb ik wel moeite met het accepteren van het lot.'),
      ans(48, 2, 'Mijn levensreis heeft geen einde, de gedeelde momenten koester ik.'),
      ans(48, 3, 'Tijdelijke verbindingen laten zien hoe komisch onze pogingen zijn om de veranderlijke stroom te manipuleren.'),
      ans(48, 4, 'Ik zie ze als afgesloten lessen in integriteit; elke relatie die stopt is een steen op de weegschaal van waarde.'),
      ans(48, 5, 'Elke interactie transformeert mij en de ander, ik geef de relatie pas op als ik het nut er niet meer van in zie.'),
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// LAYER 5 — Unity (Spiritualiteit / Magie / Natuur)  Q49-Q60
// ═══════════════════════════════════════════════════════════════════════

const layer5Questions = [
  // ─── Q49 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 49,
    text: 'Wat ervaar je als je alleen in de overweldigende natuur bent?',
    domain: 'spiritualiteit',
    answers: [
      ans(49, 0, 'De orde; ik zie de complexe ecosystemen en de wetten van de natuur.'),
      ans(49, 1, 'De kwetsbaarheid; ik voel de kracht van de elementen en mijn eigen nietigheid.'),
      ans(49, 2, 'De eenheid; ik voel me versmelten met alles wat leeft en ademt.'),
      ans(49, 3, 'De schoonheid; ik word geraakt door de kleuren, vormen en het licht.'),
      ans(49, 4, 'De grootsheid; ik voel respect voor de schepping die groter is dan wij.'),
      ans(49, 5, 'De vrede; ik voel me thuis en veilig in de schoot van de natuur.'),
    ],
  },

  // ─── Q50 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 50,
    text: 'Is er een grens tussen technologie en magie?',
    domain: 'spiritualiteit',
    answers: [
      ans(50, 0, 'Technologie IS magie; het is het manipuleren van de werkelijkheid met symbolen (code).'),
      ans(50, 1, 'Weet ik niet, maar we moeten ethische kaders opzetten voor onze tech.'),
      ans(50, 2, 'We denken dat we tovenaars zijn met onze gadgets, maar zoals wij ermee omgaan lijken we eerder clowns.'),
      ans(50, 3, 'Nee, magie is gewoon technologie die we nog niet begrijpen.'),
      ans(50, 4, 'De grens is irrelevant; voor mij telt alleen of ik de ongekende kracht van nieuwe technologie kan gebruiken voor mijn eigen idealen.'),
      ans(50, 5, 'De grens is de menselijke ziel; technologie kan wonderen verrichten, maar de magie van echte zorg en empathie is gebonden aan ons.'),
    ],
  },

  // ─── Q51 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 51,
    text: 'Hoe ga je om met de elementen (aarde, water, vuur, lucht)?',
    domain: 'spiritualiteit',
    answers: [
      ans(51, 0, 'Ik bewonder ze.'),
      ans(51, 1, 'Ik beheer ze.'),
      ans(51, 2, 'Ik gebruik ze.'),
      ans(51, 3, 'Ik voel ze.'),
      ans(51, 4, 'Ik trotseer ze.'),
      ans(51, 5, 'Ik bestudeer ze.'),
    ],
  },

  // ─── Q52 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 52,
    text: 'Hoe verhoud jij je tot het \'Grote Mysterie\'?',
    domain: 'spiritualiteit',
    answers: [
      ans(52, 0, 'Als iets dat nederig maakt; in het besef dat we zo weinig weten, zoek ik houvast in verbinding en de hoop dat we gedragen worden.'),
      ans(52, 1, 'Als de ultieme vrijheid; in het mysterie gelden geen regels, wetten of dogma\'s van anderen, en daar vind ik mijn radicale autonomie.'),
      ans(52, 2, 'Als een onontgonnen gebied; het niet-weten maakt me niet bang, maar juist nieuwsgierig om steeds diepere lagen van het bestaan te verkennen.'),
      ans(52, 3, 'Als een kosmische relativering; het feit dat we de essentie niet begrijpen, laat zien hoe lachwekkend onze menselijke arrogantie en serieuze plannen eigenlijk zijn.'),
      ans(52, 4, 'Als een vraagstuk van geloof; waar de feitelijke kennis ophoudt, biedt een moreel of spiritueel kader de noodzakelijke structuur en richting.'),
      ans(52, 5, 'Als de bron van creatie; ik zie het \'niets\' niet als leegte, maar als de pure potentie waaruit ik door intentie een nieuwe werkelijkheid kan laten ontstaan.'),
    ],
  },

  // ─── Q53 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 53,
    text: 'Wat betekent nederigheid voor jou?',
    domain: 'spiritualiteit',
    answers: [
      ans(53, 0, 'Erkennen hoeveel ik nog niet weet.'),
      ans(53, 1, 'Mijn kracht gebruiken om te dienen, niet om te heersen.'),
      ans(53, 2, 'Mezelf openstellen en kwetsbaar durven zijn.'),
      ans(53, 3, 'Weten dat mijn inspiratie niet van mij komt, maar door mij heen stroomt.'),
      ans(53, 4, 'Beseffen dat macht slechts geleend is en tijdelijk.'),
      ans(53, 5, 'Simpelweg dankbaar zijn voor wat er is.'),
    ],
  },

  // ─── Q54 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 54,
    text: 'Hoe positioneer jij de mens in de natuurlijke hiërarchie?',
    domain: 'spiritualiteit',
    answers: [
      ans(54, 0, 'Als de alchemist; de mens staat bovenaan, niet om te heersen, maar om de ruwe materie van de natuur bewustzijn te geven en naar een hoger plan te tillen.'),
      ans(54, 1, 'Als de rentmeester; onze hoge positie in de rangorde is geen vrijbrief voor macht, maar een zware morele verplichting om rechtvaardig over de aarde te waken.'),
      ans(54, 2, 'Als een arrogante passant; we wanen ons de koningen van de schepping, maar de natuur zal ons uiteindelijk lachend van de troon stoten als we niet oppassen.'),
      ans(54, 3, 'Als de grensverlegger; ik zie de hiërarchie niet als een ladder maar als een speelveld, waarbij de mens de unieke rol heeft om de uiterste grenzen van het mogelijke te verkennen.'),
      ans(54, 4, 'Als een overwinnaar; de natuur is wreed en de enige hiërarchie die telt is kracht; wij moeten ons constant invechten om niet door de elementen overheerst te worden.'),
      ans(54, 5, 'Als een onderdeel van het web; er is geen boven of onder, wij zijn slechts één draad in het weefsel en volledig afhankelijk van het welzijn van het geheel.'),
    ],
  },

  // ─── Q55 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 55,
    text: 'Hoe verklaar je wonderen of onverklaarbare toevalligheden?',
    domain: 'spiritualiteit',
    answers: [
      ans(55, 0, 'Ik geloof in wonderen, ze maken het leven magisch.'),
      ans(55, 1, 'Ik ben sceptisch; ik vertrouw liever op wat bewijsbaar is.'),
      ans(55, 2, 'Als pure poëzie van de werkelijkheid.'),
      ans(55, 3, 'Als een knipoog van het universum.'),
      ans(55, 4, 'Als een teken dat ik op de goede weg ben.'),
      ans(55, 5, 'Als statistische onwaarschijnlijkheden die we nog niet kunnen uitleggen.'),
    ],
  },

  // ─── Q56 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 56,
    text: 'Hoe kijk je naar de dood?',
    domain: 'spiritualiteit',
    answers: [
      ans(56, 0, 'Als rust; een vredig einde na een leven van verbinding.'),
      ans(56, 1, 'Ik ga niet zonder slag of stoot; ik wil leven tot de laatste snik.'),
      ans(56, 2, 'Als het volgende grote avontuur naar het onbekende.'),
      ans(56, 3, 'Als de punchline van de grap die het leven is.'),
      ans(56, 4, 'Als het moment van de waarheid; wat heb ik van mijn leven gemaakt?'),
      ans(56, 5, 'Als het afpellen van een schil; de essentie gaat verder.'),
    ],
  },

  // ─── Q57 (odd, pattern 1 → A:Sage B:Hero C:Lover D:Artist E:Ruler F:Innocent) ───
  {
    id: 57,
    text: 'Hoe ervaar jij de leiding van jouw innerlijke kompas of spirituele intuïtie?',
    domain: 'spiritualiteit',
    answers: [
      ans(57, 0, 'Als de stem van de ratio; ik vertrouw op de helderheid van mijn eigen logica en de analyse van universele wetmatigheden om mijn weg te vinden.'),
      ans(57, 1, 'Als de roep van de strijd; ik voel een interne, instinctieve drang om op te staan en krachtig te handelen wanneer mijn waarden of doelen in het geding zijn.'),
      ans(57, 2, 'Als het kloppen van mijn hart; ik word geleid door een diepe, emotionele resonantie en het verlangen naar werkelijke versmelting met het geheel.'),
      ans(57, 3, 'Als een stroom van beelden en symbolen; ik vertrouw op de plotselinge visioenen uit mijn verbeelding die een nieuwe werkelijkheid aankondigen.'),
      ans(57, 4, 'Als een onwrikbaar moreel dictaat; ik voel een soevereine plicht om de juiste orde te bewaren en verantwoordelijkheid te dragen voor de toekomst.'),
      ans(57, 5, 'Als een stil, onschuldig weten; ik vertrouw intuïtief op de fundamentele goedheid van het leven en geloof dat de juiste weg zich vanzelf ontvouwt.'),
    ],
  },

  // ─── Q58 (even, pattern 2 → A:Magician B:Judge C:Trickster D:Explorer E:Outlaw F:Caregiver) ───
  {
    id: 58,
    text: 'Hoe ervaar jij de invloed van onzichtbare informatievelden op jouw leven?',
    domain: 'spiritualiteit',
    answers: [
      ans(58, 0, 'Als een actieve krachtbron; ik stem me bewust af op dit veld om intenties te zetten en de werkelijkheid om mij heen vorm te geven.'),
      ans(58, 1, 'Met gezonde scepsis; ik erken dat er krachten zijn die we niet zien, maar ik vertrouw pas op informatie als deze getoetst is aan de feitelijke realiteit.'),
      ans(58, 2, 'Als een bron van chaos; ik vind het fascinerend hoe \'toevallige\' informatie uit de omgeving mijn plannen overhoop gooit en me dwingt om te relativeren.'),
      ans(58, 3, 'Als een kompas voor ontdekking; ik gebruik subtiele signalen als aanwijzingen om nieuwe wegen te verkennen die buiten het bereik van mijn vijf zintuigen liggen.'),
      ans(58, 4, 'Ik voel instinctief wanneer de collectieve energie gemanipuleerd wordt, en gebruik dat inzicht om mijn autonome koers te varen.'),
      ans(58, 5, 'Als een diepe, emotionele verbondenheid; unus mundus.'),
    ],
  },

  // ─── Q59 (odd, pattern 3 → A:Innocent B:Ruler C:Artist D:Lover E:Hero F:Sage) ───
  {
    id: 59,
    text: 'Hoe ga je om met de donkere kant van de natuur (rampen, ziekte)?',
    domain: 'spiritualiteit',
    answers: [
      ans(59, 0, 'Ik bid dat het mij en mijn naasten bespaard blijft.'),
      ans(59, 1, 'We moeten systemen bouwen die bestand zijn tegen chaos.'),
      ans(59, 2, 'Zelfs in de vernietiging zit een vreselijke schoonheid.'),
      ans(59, 3, 'Het maakt me verdrietig, ik wil de pijn verzachten.'),
      ans(59, 4, 'We moeten ons wapenen en beschermen tegen het noodlot.'),
      ans(59, 5, 'Het is onderdeel van de cyclus van opbouw en afbraak.'),
    ],
  },

  // ─── Q60 (even, pattern 4 → A:Caregiver B:Outlaw C:Explorer D:Trickster E:Judge F:Magician) ───
  {
    id: 60,
    text: 'Wat is de waarde van rituelen?',
    domain: 'spiritualiteit',
    answers: [
      ans(60, 0, 'Ze brengen mensen samen en geven troost.'),
      ans(60, 1, 'Ik heb mijn eigen rituelen, ik volg die van anderen niet.'),
      ans(60, 2, 'Ze geven inzicht in de cultuur waar je bent.'),
      ans(60, 3, 'Ze zijn theater, maar soms heb je theater nodig om het leven zin te geven.'),
      ans(60, 4, 'Ze markeren belangrijke overgangen en bevestigen de orde.'),
      ans(60, 5, 'Ze zijn krachtige tools om energie te focussen en intenties te zetten.'),
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Assembled Subject / Layer Definitions
// ═══════════════════════════════════════════════════════════════════════

export const assessmentSubjects = [
  {
    id: 'layer-foundation',
    name: 'Foundation',
    title: 'INTROVERSIE / NURTURE / ZONDE',
    subtitle: 'The Cellular Architecture of Being',
    color: '#22d3ee',
    layerIndex: 0,
    fundamental: 'Physiological Standards',
    description: 'Onderzoek je innerlijke wereld, je grenzen en je relatie met het verleden.',
    questions: layer1Questions,
  },
  {
    id: 'layer-emotional',
    name: 'Emotional',
    title: 'EXTRAVERSIE / BUSINESS / PRESTATIE',
    subtitle: 'The Alchemy of Feeling',
    color: '#a855f7',
    layerIndex: 1,
    fundamental: 'Self-Esteem, Character',
    description: 'Ontdek hoe je jezelf positioneert in teams, concurrentie en leiderschap.',
    questions: layer2Questions,
  },
  {
    id: 'layer-mental',
    name: 'Mental',
    title: 'CULTUUR / WIJSHEID / IDEAAL',
    subtitle: 'The Architecture of Thought',
    color: '#f472b6',
    layerIndex: 2,
    fundamental: 'Career & Community Standing',
    description: 'Verken je visie op waarheid, technologie, tradities en creativiteit.',
    questions: layer3Questions,
  },
  {
    id: 'layer-spiritual',
    name: 'Spiritual',
    title: 'HUWELIJK / SOCIALE BALANS / DE ZIEL',
    subtitle: 'The Resonance of Soul',
    color: '#fbbf24',
    layerIndex: 3,
    fundamental: 'Belonging & Purpose',
    description: 'Verdiep je in relaties, de ziel, partnerkeuze en sociale dynamiek.',
    questions: layer4Questions,
  },
  {
    id: 'layer-unity',
    name: 'Unity',
    title: 'SPIRITUALITEIT / MAGIE / NATUUR',
    subtitle: 'The Convergence of All',
    color: '#f97316',
    layerIndex: 4,
    fundamental: 'Transcendence & Legacy',
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
export const ARCHETYPE_SETS = { SET_A, SET_B };
export const ROTATION_PATTERNS = PATTERNS;
