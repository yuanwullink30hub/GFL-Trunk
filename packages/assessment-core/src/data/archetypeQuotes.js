/**
 * Archetype Levensles Quotes — 72 Combination Profiles
 *
 * Keyed by MAINARCHETYPE_SUPPORTGROUP (all uppercase).
 * Each quote is the "Levensles" for that extended archetype.
 *
 * Used on the result card and PDF cover in place of the generic
 * base-archetype description, and on the login/boot loading screen.
 *
 * Two language tables. Dutch is complete; English is filled in over time —
 * getArchetypeQuote()/getArchetypeQuoteByKey() fall back to the Dutch text for
 * any key not yet translated, so English users see the Dutch lesson until its
 * translation lands (then it swaps automatically).
 */

const ARCHETYPE_QUOTES_NL = {
  // ═══ JUDGE ═══════════════════════════════════════════════
  JUDGE_RULING: 'Het systeem dat ik bouw om alles rechtvaardig te maken, moet ook ruimte hebben voor wat het niet kan bevatten — de boog kan niet altijd gespannen zijn. Het sterkste fundament is niet het perfecte. Het is het fundament dat kan ademen.',
  JUDGE_RELATIONAL: 'De waarheid die ik verzacht om de vrede te bewaren is dezelfde waarheid die de relatie langzaam uitholt. De moedigste vorm van liefde is eerlijkheid die pijn doet — uitgesproken door iemand die blijft.',
  JUDGE_SEEKER: 'Ik wacht niet op zuivere omstandigheden die niet bestaan. Zuiverheid is geen voorwaarde om te beginnen — het is wat overblijft als ik eerlijk beweeg.',
  JUDGE_ABSTRACT: 'Het vermogen om te zien wat er niet klopt is de helft van de gave. De andere helft is kiezen om tóch te bouwen — wetende dat het imperfect is. Anders ben ik niet de scherpste in de kamer, maar de eenzaamste.',
  JUDGE_AGENCY: 'De rechter die zijn eigen vonnis niet meer toetst, is geen rechter meer — hij is een wapen. Het moment dat ik het hardst overtuigd ben, is het moment dat ik het vaakst mis.',
  JUDGE_CHAOS: 'Niet elke waarheid heeft een explosie nodig. Soms is de krachtigste daad niet het systeem opblazen — maar er stil in blijven staan en weigeren mee te liegen.',

  // ═══ LOVER ═══════════════════════════════════════════════
  LOVER_RELATIONAL: 'De persoon die ik zoek is niet degene die mij compleet maakt. Het is degene die naast me kan zitten in het onvolmaakte — zonder het op te vullen.',
  LOVER_RULING: 'Het skelet dat ik om de liefde bouw beschermt het — maar het houdt ook de chemie buiten. De sterkste relatie is niet de veiligste. Het is de relatie die gebruik maakt van scheiding.',
  LOVER_SEEKER: 'Niet elk gevoel hoeft een gedicht te worden. Sommige dingen mogen gewoon bestaan zonder getuige — en juist die stille momenten voeden mijn kunst meer dan de crisis ooit deed.',
  LOVER_CHAOS: 'De speelsheid waarmee ik de zwaarte breek is echt — maar de diepte die ik ermee ontwijk ook. Iemand die blijft als het licht wordt, wil ik. Iemand die blijft als het donker wordt, heb ik nodig.',
  LOVER_ABSTRACT: 'De kosmische ontvouwing die ik zoek bestaat — maar niet voorbij de aarde. Ze zit in de boodschappen die ik vergeet, de stilte aan tafel, de hand op mijn schouder. Het heilige is niet boven. Het is naast mij.',
  LOVER_AGENCY: 'De intensiteit waarmee ik liefheb is geen bewijs dat het echt is. Soms is het \'t stilste moment — niet de heftigste nacht — waar de echte ruimte ligt.',

  // ═══ CAREGIVER ═══════════════════════════════════════════
  CAREGIVER_RELATIONAL: 'De wond die ik bij een ander genees, blijft van een ander. Mijn moedigste vorm van zorg is simpelweg, het rijzen van de zon — overlaten aan de zon.',
  CAREGIVER_RULING: 'Het systeem dat ik bouw om anderen te beschermen draait ook als ik slaap — als dit niet zo is, ben ik het systeem. Hoge bomen vangen veel wind, maar ik ben een..',
  CAREGIVER_SEEKER: 'Ik begeleid anderen naar vrijheid die ik mezelf soms niet gun. De vraag is niet of zij klaar zijn om los te laten — maar of ik klaar ben om niet meer nodig te zijn.',
  CAREGIVER_CHAOS: 'Niet iedereen wil genezen op de manier die ik aanbied. Soms is de krachtigste vorm van zorg niet het doorbreken van iemands patroon — maar een hand openhouden tot ze zelf rijzen.',
  CAREGIVER_ABSTRACT: 'Niet alle pijn heeft een oorzaak die ik kan vinden. Het moment dat ik stop met zoeken naar het waarom en begin met het dragen van wat is — begint de echte genezing.',
  CAREGIVER_AGENCY: 'Het schild dat ik hef voor anderen weegt meer dan ik ooit zal toegeven. Dus bedenk goed: wie zijn wapenrusting nooit afdoet, vergeet hoe de zon op zijn huid voelt. Ware bescherming begint met de moed om af en toe mijn eigen schild te laten zakken.',

  // ═══ INNOCENT ════════════════════════════════════════════
  INNOCENT_SEEKER: 'Mijn vertrouwen is geen naïviteit — het is het dapperste wat ik ben. En de wereld hoeft het niet altijd te verdienen voordat ik het geef. Terwijl zij ruilen kies ik ervoor om te blijven kijken.',
  INNOCENT_RULING: 'De traditie die ik bescherm is niet het doel — het is de weide. En soms moet de weide verplaatsen zodat de inhoud kan groeien. Bewaken is niet hetzelfde als vasthouden.',
  INNOCENT_RELATIONAL: 'De vergeving die ik bied is echt. Maar het recht om de duisternis mee te dragen is dat ook. Ik hoef niet altijd het licht in de kamer te zijn — want de prijs voor onschuld wordt altijd afgerekend.',
  INNOCENT_ABSTRACT: 'Het ideaal wat ik zie is prachtig — maar ze bestaat nog niet. En dat is geen reden voor verdriet. De echte wereld is rommeliger, lelijker en oneindig veel rijker.',
  INNOCENT_AGENCY: 'Ik stap altijd vooruit alsof het onbekende beter is. Meestal klopt dat. Maar de moed om stil te staan als het donker is — zonder te bewegen, zonder te vluchten — dat is echte flow.',
  INNOCENT_CHAOS: 'De bubbel waarin ik leef is geen zwakte — het is mijn laboratorium. En de harde grond buiten die bubbel is waar ik ontdek of deze vleugels ook werken als het regent.',

  // ═══ EXPLORER ════════════════════════════════════════════
  EXPLORER_SEEKER: 'De kaart die ik teken terwijl ik loop is briljant — maar een kaart is geen thuis. Het moeilijkste terrein dat ik ooit in kaart zal brengen is de plek waar ik besluit te blijven.',
  EXPLORER_RULING: 'Ik verken het onbekende met de discipline van een soldaat. Maar de wildste ontdekking is niet het volgende territorium — het is het moment dat ik de kaart loslaat en verdwaal. Dáár vind ik het.',
  EXPLORER_RELATIONAL: 'Ik ontdek de wereld via verbinding — en dat is mijn grootste gave. Maar de krachtigste verbindingen zijn verankerd. Een vriend voor allen is een vijand van zichzelf.',
  EXPLORER_ABSTRACT: 'De theorie die ik zoek voorbij de horizon — die is er. Maar materie vormt pas als ik mijn handen vuil maak. Kennis die alleen in mijn hoofd bestaat, heeft geen vulling.',
  EXPLORER_AGENCY: 'Ik overleef alles. Dat is bewezen. De vraag is niet of ik het red — maar of ik ooit ergens aankom waar ik niet hoef te overleven. Rusten is geen opgeven. Het is de haven herkennen.',
  EXPLORER_CHAOS: 'Het volgende grote ding staat altijd voor mijn neus — maar het vorige grote ding heeft me nodig. De wereld heeft geen tekort aan uitvindingen. Ze heeft een tekort aan mensen die bij hun uitvinding blijven staan.',

  // ═══ OUTLAW ══════════════════════════════════════════════
  OUTLAW_CHAOS: 'Ik breek alles wat niet klopt — en dat is nodig. Maar de ochtend heeft iemand nodig die bouwt. Als ik dat niet ben, was de revolutie vernietiging. Als ik dat wél ben, was het bevrijding.',
  OUTLAW_ABSTRACT: 'Elk geloof dat ik afbreek verdient het waarschijnlijk. Maar de leegte die ik achterlaat is niet mijn cadeau — het is hun probleem. De werkelijke daad is niet het idool vernietigen. Het is iets beters neerzetten.',
  OUTLAW_AGENCY: 'De mensen die ik mobiliseer vertrouwen op mijn vuur. Maar vuur dat alleen brandt, vernietigt. De test is niet of ik de menigte in beweging krijgt — maar of ik ze naar iets toe leid in plaats van alleen ergens vandaan.',
  OUTLAW_RULING: 'Ik breek het systeem van binnenuit en bouw tegelijk het nieuwe. Dat is zeldzaam. Maar het nieuwe systeem dat ik bouw — is dat werkelijk beter? Of is het hetzelfde systeem met mijn handtekening eronder?',
  OUTLAW_RELATIONAL: 'Ik draag de pijn van de wereld op mijn schouders alsof dat mijn opdracht is. Maar de ketens die ik bij anderen breek — wie breekt die van mij? De bevrijder die zichzelf niet bevrijdt, wordt het volgende monument.',
  OUTLAW_SEEKER: 'De shockwave die ik veroorzaakt is echt — en nodig. Maar provocatie zonder richting is ruis. Het verschil tussen een profeet en een schreeuwer is niet volume. Het is of er iets staat als de verf opdroogt.',

  // ═══ TRICKSTER ═══════════════════════════════════════════
  TRICKSTER_CHAOS: 'Iedereen zag de afgrond. Ik zag wat erachter lag. De hond blafte, de wereld waarschuwde — en ze hadden gelijk. Maar niet over de afgrond. Over wat het kost om te zien wat zij niet kunnen zien.',
  TRICKSTER_ABSTRACT: 'De lach waarmee ik de wereld draaglijk maakt is echt. Maar de abstractie van de emotie eronder kan leiden tot emotionele verwarring — dát is niet het einde. Dat is het begin van het echte gesprek.',
  TRICKSTER_AGENCY: 'De sleutel die ik in het tandwiel gooi stopt de machine — briljant. Maar als er geen machine is om te stoppen, heb ik moeite om te blijven bestaan. Dit is te voorkomen door af en toe die sleutel te gebruiken voor mijn eigen wiel.',
  TRICKSTER_RULING: 'Ik sta naast de macht en fluister wat niemand durft te zeggen — dat is mijn gave. Maar ik heb stiekem de hiërarchie nodig om te blijven bestaan. Wat doe ik als er geen macht meer is? Wie te diep in het glaasje kijkt, komt er mogelijk nooit meer uit.',
  TRICKSTER_RELATIONAL: 'Ik maak de kamer lichter en iedereen voelt zich beter — de grap die ik niet maak is de onuitgesproken zin. De stilte tussen de punchlines — dit is de clue voor mijn eigen humeur.',
  TRICKSTER_SEEKER: 'Ik kan alles zijn voor iedereen — en dat is fascinerend. Want elke vorm die ik aanneem is echt — dat is nooit het probleem geweest. Het probleem is de zwaartekracht die me alle kanten op trekt.',

  // ═══ SAGE ════════════════════════════════════════════════
  SAGE_ABSTRACT: 'De waarheid voorbij alle illusies — die is er. Maar ze zit niet voorbij het leven. Ze zit erin geketend. In de afwas, de file, het gesprek zonder richting. Verlichting die het gewone overslaat is een nieuwe illusie.',
  SAGE_AGENCY: 'Ik stop niet tot ik het antwoord heb — en dat is mijn kracht. Maar sommige vragen hebben geen antwoord. En de moed om te zeggen \'ik weet het niet\' zonder door te zoeken — die is waardevoller dan elke ontmaskering.',
  SAGE_RULING: 'Het systeem dat ik bouw uit mijn inzichten is waterdicht — maar mensen zijn niet waterdicht. De briljantste analyse faalt als ze geen ruimte laat voor het irrationele. En het irrationele is waar de meeste mensen leven.',
  SAGE_RELATIONAL: 'De wijsheid die ik geef verandert levens — dat zie ik. Wat ik nu pas zie is dat ik de groei van een ander als zuurstof nodig heb. Op de dag dat de leerling me niet meer nodig heeft, begint mijn werkelijke les.',
  SAGE_SEEKER: 'De toekomst die ik zie is helder — helderder dan de meesten kunnen verdragen. Maar een visioen dat niet landt in het nu is een droom die niemand kan bewonen. Dus bouw ik de eerste kamer. Niet het hele paleis.',
  SAGE_CHAOS: 'De stilte die ik zoek is echt — en wat ik daar vindt is van onschatbare waarde. Maar de wereld die ik ontwijk heeft me nodig. Niet mijn wijsheid. Ik. De persoon, niet de denker.',

  // ═══ ARTIST ══════════════════════════════════════════════
  ARTIST_ABSTRACT: 'Het universum dat ik schep is groter dan de werkelijkheid — en dat is mijn gave. Maar de mensen die erin leven zijn geen personages. Op het moment dat ik vergeet dat ze bloeden, ben ik geen schepper meer. Dan ben ik een gevangenis.',
  ARTIST_AGENCY: 'Ik smeed met een wilskracht die de meesten niet begrijpen. Maar de machine die ik bouw draait ook als ik erin wordt vermalen. Het verschil tussen een meesterwerk en een offer is weten wanneer ik de hamer neerleg.',
  ARTIST_RULING: 'De structuur die ik ontwerp is briljant en mooi — maar ze is ook een kooi als niemand erin mag ademen. Het verschil tussen architectuur en tirannie is of de bewoner het raam mag openen.',
  ARTIST_RELATIONAL: 'Elk verhaal dat ik vertel raakt — omdat ik weet wat mensen willen horen. Het verhaal dat het meest van me vroeg was het eerste dat ik vertelde zonder te vragen of het zou landen.',
  ARTIST_SEEKER: 'Ik zie wat er over tien jaar staat — maar ik mis wat er nu voor mijn neus staat. De toekomst heeft me nodig. Maar het heden heeft me nog harder nodig. En het heden is het enige dat ik kan aanraken.',
  ARTIST_CHAOS: 'De dromen die ik de wereld instuur zijn groter dan de werkelijkheid aankan — en dat is precies het punt. De dag dat de zeepbel knapte was niet het einde van mijn droom. Het was het begin van het echte bouwen.',

  // ═══ MAGICIAN ════════════════════════════════════════════
  MAGICIAN_AGENCY: 'Ik kan alles transformeren — behalve de dood. En dat is niet mijn falen. Dat is de grens. De grootste alchemie is niet lood in goud veranderen. Het is accepteren dat sommige dingen lood mogen blijven.',
  MAGICIAN_RULING: 'De scherpste blauwdruk die ik ooit tekende was de eerste die ik durfde aan te passen terwijl ik bouwde. Een plan dat de werkelijkheid niet mag corrigeren is geen visie — het is een dogma met een deadline.',
  MAGICIAN_RELATIONAL: 'Ik transformeer relaties met een kracht die niemand volledig begrijpt — inclusief ikzelf. Maar charme die stuurt is manipulatie. De echte magie is de ander veranderen door zelf te veranderen — en dan loslaten.',
  MAGICIAN_SEEKER: 'Ik zie wat er kan zijn — en dat visioen is zuiver. Maar het lot is een spiegel, geen raam. Ik kies zorgvuldig, want mijn visioenen zijn geen oogmerk maar een gewoonte.',
  MAGICIAN_CHAOS: 'Ik buig de werkelijkheid met een spreuk en een lach — en het werkt. Tot het niet werkt. De situatie waar ik me niet uit kan toveren is mijn leraar. Die essentie is mijn evolutie.',
  MAGICIAN_ABSTRACT: 'De diepte waarin ik afdaal om de wortel te vinden is indrukwekkend — maar de oppervlakte is waar mensen leven. De genezing die ik offer landt pas als ik terugkom uit de diepte en naast iemand gaat zitten. Niet erboven.',

  // ═══ HERO ════════════════════════════════════════════════
  HERO_AGENCY: 'De kruik gaat zo lang te water tot ze breekt — en ik wás die kruik. Niet het stoppen was het moeilijkst. Het was ontdekken dat ik van aardewerk ben.',
  HERO_RULING: 'Het slagveld gehoorzaamt mij — maar de mens tegenover me is geen pion. Op het moment dat mijn team een schaakbord wordt, heb ik niet gewonnen. Dan heb ik iedereen verloren die ertoe deed.',
  HERO_RELATIONAL: 'Ik vang elke klap voor de mensen die ik liefheb — en dat is niet overdreven, dat is hoe ik overleef. Maar het schild dat nooit om hulp vraagt, breekt als eerste. Het schild moet geen uiting worden van een schuld.',
  HERO_SEEKER: 'Elk probleem dat ik aanval geeft zich over — vroeg of laat. De uitvinding die het langst duurde was de aandacht voor de conflicten die zich niet over wilden geven.',
  HERO_CHAOS: 'Ik heb voor elk principe gevochten alsof het het laatste was — integratie duurde het langst want de persoon die niet aan mijn principes voldoet is niet altijd de tegenstander, maar iemand die hetzelfde probeert met minder kracht.',
  HERO_ABSTRACT: 'Ik bereken de overwinning drie zetten vooruit — maar de berekening die ik miste was de kosten voor mezelf. De briljantste strategie faalt als de strateeg zichzelf opoffert als pion.',

  // ═══ RULER ═══════════════════════════════════════════════
  RULER_RULING: 'Het rijk dat ik bouw draait perfect — maar een perfect systeem zonder warmte is een wet zonder volgers. Het vertelt mij dat het werkt. Het vertelt mij niet waarvoor.',
  RULER_RELATIONAL: 'Ik draag alles voor de mensen die van mij afhangen — en dat is niet nobel, het is hoe ik in elkaar zit. Maar de hand die altijd geeft, vergeet hoe het voelt om te ontvangen.',
  RULER_SEEKER: 'De markt buigt voor mijn visie — maar de mensen die het bouwen zijn geen grondstof. Op het moment dat ambitie hebzucht wordt, is het verschil niet de omzet. Het is of ik \'s ochtends in de spiegel kan kijken en de persoon nog herken.',
  RULER_ABSTRACT: 'Het systeem dat ik ontwerp vanuit wijsheid is beter dan wat de meesten kunnen bedenken. Maar wijsheid die niet luistert is dogma. De massa die me niet begrijpt is niet dom — ze leeft in een werkelijkheid die mijn theorie niet bereikt.',
  RULER_AGENCY: 'Alles wat ik aanraak, groeit — maar groei zonder grens is ziekte. Bomen groeien niet tot in de hemel. De wortel die zich het langste verhoudt, is de wortel die weet hoe diep genoeg is.',
  RULER_CHAOS: 'Ik heb de rebellie in mijn leiderschap geïntegreerd — en dat maakt me zeldzaam. Maar de dag dat ik mijn eigen regels breek en het niet meer voel, is de dag dat integriteit een verhaal werd dat ik mezelf vertel, en ik ben wat ik doe, niet wat ik zeg.',
};

/**
 * English translations of the 72 Levensles quotes. Fill in per key (same
 * MAINARCHETYPE_SUPPORTGROUP keys as ARCHETYPE_QUOTES_NL). Any key left out (or
 * empty) automatically falls back to the Dutch text via the getters below.
 *
 * Example:
 *   JUDGE_RULING: 'The system I build to make everything just must also leave room…',
 */
const ARCHETYPE_QUOTES_EN = {
  // TODO: English translations — mirror the keys of ARCHETYPE_QUOTES_NL above.
};

// Back-compat alias (Dutch table was the original default export).
const ARCHETYPE_QUOTES = ARCHETYPE_QUOTES_NL;

// Pick the table for a language, defaulting to Dutch.
function quotesFor(lang) {
  return (lang === 'en' || lang === 'EN') ? ARCHETYPE_QUOTES_EN : ARCHETYPE_QUOTES_NL;
}

/**
 * Levensles quote by the combined MAINARCHETYPE_SUPPORTGROUP key.
 * Falls back to Dutch when the requested language has no translation for that key.
 * @param {string} key  — e.g. "CAREGIVER_RELATIONAL"
 * @param {string} [lang='nl'] — 'nl' | 'en'
 * @returns {string|null}
 */
export function getArchetypeQuoteByKey(key, lang = 'nl') {
  if (!key) return null;
  const k = String(key).toUpperCase();
  return quotesFor(lang)[k] || ARCHETYPE_QUOTES_NL[k] || null;
}

/**
 * Get the levensles quote for a given main archetype + support group combo.
 * @param {string} mainKey — e.g. "CAREGIVER"
 * @param {string} supportGroup — e.g. "Relational" or "RELATIONAL"
 * @param {string} [lang='nl'] — 'nl' | 'en'
 * @returns {string|null}
 */
export function getArchetypeQuote(mainKey, supportGroup, lang = 'nl') {
  if (!mainKey || !supportGroup) return null;
  return getArchetypeQuoteByKey(`${mainKey.toUpperCase()}_${supportGroup.toUpperCase()}`, lang);
}

export { ARCHETYPE_QUOTES_NL, ARCHETYPE_QUOTES_EN };
export default ARCHETYPE_QUOTES;
