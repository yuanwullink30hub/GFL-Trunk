/**
 * Archetype Levensles Quotes — 72 Combination Profiles
 *
 * Keyed by MAINARCHETYPE_SUPPORTGROUP (all uppercase).
 * Each quote is the "Levensles" for that extended archetype.
 *
 * Used on the result card and PDF cover in place of the generic
 * base-archetype description, and on the login/boot loading screen.
 *
 * Two language tables, both complete (72 keys each).
 * getArchetypeQuote()/getArchetypeQuoteByKey() still fall back to the Dutch text
 * for any key missing from the English table, so a future key added on the Dutch
 * side never renders empty.
 */

import { ARCHETYPE_TO_GROUP } from './scoring/index.js';

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
  // ═══ JUDGE ═══════════════════════════════════════════════
  JUDGE_RULING: 'The system I build to make everything just must also leave room for what it cannot hold — the bow cannot stay drawn forever. The strongest foundation is not the perfect one. It is the one that can breathe.',
  JUDGE_RELATIONAL: 'The truth I soften to keep the peace is the same truth that slowly hollows out the bond. The bravest form of love is honesty that hurts — spoken by someone who stays.',
  JUDGE_SEEKER: 'I am not waiting for pure conditions that do not exist. Purity is not a precondition for beginning — it is what remains when I move honestly.',
  JUDGE_ABSTRACT: 'Seeing what is wrong is half the gift. The other half is choosing to build anyway — knowing it will be imperfect. Otherwise I am not the sharpest person in the room, only the loneliest.',
  JUDGE_AGENCY: 'A judge who no longer tests his own verdict is not a judge anymore — he is a weapon. The moment I am most convinced is the moment I am most often wrong.',
  JUDGE_CHAOS: 'Not every truth needs an explosion. Sometimes the most powerful act is not blowing up the system — but standing quietly inside it and refusing to lie along.',

  // ═══ LOVER ═══════════════════════════════════════════════
  LOVER_RELATIONAL: 'The person I am looking for is not the one who completes me. It is the one who can sit beside me in the unfinished — without filling it in.',
  LOVER_RULING: 'The skeleton I build around love protects it — but it also keeps the chemistry out. The strongest relationship is not the safest one. It is the one that makes use of separation.',
  LOVER_SEEKER: 'Not every feeling has to become a poem. Some things may simply exist without a witness — and it is those quiet moments that feed my art more than any crisis ever did.',
  LOVER_CHAOS: 'The playfulness with which I break the heaviness is real — but so is the depth I avoid with it. I want someone who stays when the light comes. I need someone who stays when the dark does.',
  LOVER_ABSTRACT: 'The cosmic unfolding I am looking for exists — but not beyond the earth. It is in the groceries I forget, the silence at the table, the hand on my shoulder. The sacred is not above me. It is beside me.',
  LOVER_AGENCY: 'The intensity with which I love is no proof that it is real. Sometimes it is the quietest moment — not the fiercest night — where the real space lies.',

  // ═══ CAREGIVER ═══════════════════════════════════════════
  CAREGIVER_RELATIONAL: 'The wound I heal in another still belongs to another. My bravest form of care is simply this: leaving the rising of the sun to the sun.',
  CAREGIVER_RULING: 'The system I build to protect others must keep running while I sleep — if it does not, I am the system. Tall trees catch a lot of wind, but I am only a..',
  CAREGIVER_SEEKER: 'I guide others toward a freedom I sometimes deny myself. The question is not whether they are ready to let go — but whether I am ready to no longer be needed.',
  CAREGIVER_CHAOS: 'Not everyone wants to heal the way I offer it. Sometimes the most powerful form of care is not breaking someone\'s pattern — but holding a hand open until they rise on their own.',
  CAREGIVER_ABSTRACT: 'Not all pain has a cause I can find. The moment I stop searching for the why and start carrying what is — that is when the real healing begins.',
  CAREGIVER_AGENCY: 'The shield I raise for others weighs more than I will ever admit. So consider this carefully: whoever never takes off his armour forgets how the sun feels on his skin. True protection begins with the courage to lower my own shield now and then.',

  // ═══ INNOCENT ════════════════════════════════════════════
  INNOCENT_SEEKER: 'My trust is not naivety — it is the bravest thing about me. And the world does not always have to earn it before I give it. While they trade, I choose to keep looking.',
  INNOCENT_RULING: 'The tradition I protect is not the point — it is the meadow. And sometimes the meadow has to move so that what grows in it can keep growing. Guarding is not the same as holding on.',
  INNOCENT_RELATIONAL: 'The forgiveness I offer is real. But so is the right to carry the darkness too. I do not always have to be the light in the room — because the price of innocence is always settled in the end.',
  INNOCENT_ABSTRACT: 'The ideal I see is beautiful — but it does not exist yet. And that is no reason for sorrow. The real world is messier, uglier and infinitely richer.',
  INNOCENT_AGENCY: 'I always step forward as if the unknown will be better. Usually it is. But the courage to stand still when it is dark — without moving, without fleeing — that is real flow.',
  INNOCENT_CHAOS: 'The bubble I live in is not a weakness — it is my laboratory. And the hard ground outside that bubble is where I find out whether these wings also work in the rain.',

  // ═══ EXPLORER ════════════════════════════════════════════
  EXPLORER_SEEKER: 'The map I draw while walking is brilliant — but a map is not a home. The hardest terrain I will ever chart is the place where I decide to stay.',
  EXPLORER_RULING: 'I explore the unknown with a soldier\'s discipline. But the wildest discovery is not the next territory — it is the moment I let go of the map and get lost. That is where I find it.',
  EXPLORER_RELATIONAL: 'I discover the world through connection — and that is my greatest gift. But the strongest connections are anchored. A friend to all is an enemy to himself.',
  EXPLORER_ABSTRACT: 'The theory I look for beyond the horizon — it is there. But matter only takes shape once I get my hands dirty. Knowledge that lives only in my head has nothing inside it.',
  EXPLORER_AGENCY: 'I survive everything. That much is proven. The question is not whether I will make it — but whether I ever arrive somewhere I do not have to survive. Resting is not giving up. It is recognising the harbour.',
  EXPLORER_CHAOS: 'The next big thing is always right in front of me — but the last big thing still needs me. The world has no shortage of inventions. It has a shortage of people who stay standing beside theirs.',

  // ═══ OUTLAW ══════════════════════════════════════════════
  OUTLAW_CHAOS: 'I break everything that is false — and that is necessary. But the morning needs someone who builds. If that is not me, the revolution was destruction. If it is, it was liberation.',
  OUTLAW_ABSTRACT: 'Every belief I tear down probably deserves it. But the emptiness I leave behind is not my gift — it is their problem. The real act is not destroying the idol. It is putting something better in its place.',
  OUTLAW_AGENCY: 'The people I mobilise rely on my fire. But fire that only burns destroys. The test is not whether I can get the crowd moving — but whether I lead them toward something instead of only away from something.',
  OUTLAW_RULING: 'I break the system from within and build the new one at the same time. That is rare. But the new system I am building — is it truly better? Or is it the same system with my signature underneath?',
  OUTLAW_RELATIONAL: 'I carry the pain of the world on my shoulders as if it were my assignment. But the chains I break for others — who breaks mine? A liberator who does not liberate himself becomes the next monument.',
  OUTLAW_SEEKER: 'The shockwave I set off is real — and needed. But provocation without direction is noise. The difference between a prophet and a shouter is not volume. It is whether anything is still standing once the paint dries.',

  // ═══ TRICKSTER ═══════════════════════════════════════════
  TRICKSTER_CHAOS: 'Everyone saw the abyss. I saw what lay beyond it. The dog barked, the world warned me — and they were right. Not about the abyss. About what it costs to see what they cannot.',
  TRICKSTER_ABSTRACT: 'The laughter with which I make the world bearable is real. But abstracting away the emotion underneath it can lead to emotional confusion — and that is not the end. That is where the real conversation begins.',
  TRICKSTER_AGENCY: 'The wrench I throw into the gears stops the machine — brilliant. But when there is no machine to stop, I struggle to keep existing. The cure is to use that wrench on my own wheel now and then.',
  TRICKSTER_RULING: 'I stand beside power and whisper what no one dares to say — that is my gift. But secretly I need the hierarchy in order to exist. What do I do when there is no power left? Look too deep into the glass and you may never find your way out again.',
  TRICKSTER_RELATIONAL: 'I make the room lighter and everyone feels better — the joke I do not make is the sentence left unspoken. The silence between the punchlines: that is the clue to my own mood.',
  TRICKSTER_SEEKER: 'I can be anything to anyone — and that is fascinating. Every shape I take is real; that was never the problem. The problem is the gravity pulling me in every direction at once.',

  // ═══ SAGE ════════════════════════════════════════════════
  SAGE_ABSTRACT: 'The truth beyond all illusions — it is there. But it does not sit beyond life. It is chained inside it. In the dishes, the traffic jam, the conversation going nowhere. Enlightenment that skips the ordinary is just a new illusion.',
  SAGE_AGENCY: 'I do not stop until I have the answer — and that is my strength. But some questions have no answer. And the courage to say "I do not know" without searching on — that is worth more than any unmasking.',
  SAGE_RULING: 'The system I build from my insights is watertight — but people are not watertight. The most brilliant analysis fails if it leaves no room for the irrational. And the irrational is where most people live.',
  SAGE_RELATIONAL: 'The wisdom I give changes lives — I can see that. What I am only now seeing is that I need another person\'s growth like oxygen. The day the student no longer needs me, my real lesson begins.',
  SAGE_SEEKER: 'The future I see is clear — clearer than most can bear. But a vision that does not land in the present is a dream no one can live in. So I build the first room. Not the whole palace.',
  SAGE_CHAOS: 'The silence I seek is real — and what I find there is priceless. But the world I am avoiding needs me. Not my wisdom. Me. The person, not the thinker.',

  // ═══ ARTIST ══════════════════════════════════════════════
  ARTIST_ABSTRACT: 'The universe I create is larger than reality — and that is my gift. But the people living in it are not characters. The moment I forget that they bleed, I am no longer a creator. I am a prison.',
  ARTIST_AGENCY: 'I forge with a willpower most people do not understand. But the machine I am building keeps running even while it grinds me up. The difference between a masterpiece and a sacrifice is knowing when to put the hammer down.',
  ARTIST_RULING: 'The structure I design is brilliant and beautiful — but it is also a cage if no one is allowed to breathe in it. The difference between architecture and tyranny is whether the inhabitant may open the window.',
  ARTIST_RELATIONAL: 'Every story I tell lands — because I know what people want to hear. The story that asked the most of me was the first one I told without asking whether it would land.',
  ARTIST_SEEKER: 'I can see what will stand here in ten years — but I miss what is standing in front of me now. The future needs me. The present needs me more. And the present is the only thing I can touch.',
  ARTIST_CHAOS: 'The dreams I send out into the world are bigger than reality can hold — and that is exactly the point. The day the bubble burst was not the end of my dream. It was the beginning of the real building.',

  // ═══ MAGICIAN ════════════════════════════════════════════
  MAGICIAN_AGENCY: 'I can transform anything — except death. And that is not my failure. That is the limit. The greatest alchemy is not turning lead into gold. It is accepting that some things are allowed to stay lead.',
  MAGICIAN_RULING: 'The sharpest blueprint I ever drew was the first one I dared to change while building. A plan that reality is not allowed to correct is not a vision — it is a dogma with a deadline.',
  MAGICIAN_RELATIONAL: 'I transform relationships with a force no one fully understands — myself included. But charm that steers is manipulation. The real magic is changing the other by changing myself — and then letting go.',
  MAGICIAN_SEEKER: 'I see what could be — and that vision is pure. But fate is a mirror, not a window. I choose carefully, because my visions are not an aim but a habit.',
  MAGICIAN_CHAOS: 'I bend reality with a spell and a smile — and it works. Until it does not. The situation I cannot conjure my way out of is my teacher. That essence is my evolution.',
  MAGICIAN_ABSTRACT: 'The depth I descend into to find the root is impressive — but the surface is where people live. The healing I offer only lands when I come back up out of the depth and sit beside someone. Not above them.',

  // ═══ HERO ════════════════════════════════════════════════
  HERO_AGENCY: 'The pitcher goes to the well until it breaks — and I was that pitcher. Stopping was not the hardest part. Discovering that I am made of clay was.',
  HERO_RULING: 'The battlefield obeys me — but the person across from me is not a pawn. The moment my team becomes a chessboard, I have not won. I have lost everyone who mattered.',
  HERO_RELATIONAL: 'I take every blow for the people I love — and that is not an exaggeration, it is how I survive. But the shield that never asks for help is the first to break. The shield must not become the expression of a debt.',
  HERO_SEEKER: 'Every problem I attack surrenders — sooner or later. The invention that took longest was paying attention to the conflicts that refused to surrender.',
  HERO_CHAOS: 'I have fought for every principle as if it were the last — integration took the longest, because the person who does not meet my principles is not always the opponent, but someone attempting the same thing with less strength.',
  HERO_ABSTRACT: 'I calculate the victory three moves ahead — but the calculation I missed was the cost to myself. The most brilliant strategy fails when the strategist sacrifices himself as a pawn.',

  // ═══ RULER ═══════════════════════════════════════════════
  RULER_RULING: 'The empire I build runs perfectly — but a perfect system without warmth is a law with no followers. It tells me that it works. It does not tell me what for.',
  RULER_RELATIONAL: 'I carry everything for the people who depend on me — and that is not noble, it is simply how I am put together. But the hand that always gives forgets what it feels like to receive.',
  RULER_SEEKER: 'The market bends to my vision — but the people who build it are not raw material. The moment ambition turns into greed, the difference is not the revenue. It is whether I can look in the mirror in the morning and still recognise the person there.',
  RULER_ABSTRACT: 'The system I design out of wisdom is better than what most could devise. But wisdom that does not listen is dogma. The crowd that does not understand me is not stupid — it lives in a reality my theory never reaches.',
  RULER_AGENCY: 'Everything I touch grows — but growth without a limit is disease. Trees do not grow into the sky. The root that lasts longest is the one that knows how deep is deep enough.',
  RULER_CHAOS: 'I have integrated the rebellion into my leadership — and that makes me rare. But the day I break my own rules and no longer feel it is the day integrity became a story I tell myself; and I am what I do, not what I say.',
};

// Back-compat alias (Dutch table was the original default export).
const ARCHETYPE_QUOTES = ARCHETYPE_QUOTES_NL;

// Pick the table for a language, defaulting to Dutch.
function quotesFor(lang) {
  return (lang === 'en' || lang === 'EN') ? ARCHETYPE_QUOTES_EN : ARCHETYPE_QUOTES_NL;
}

/**
 * Levensles quote by key. Quotes are stored per MAINARCHETYPE_SUPPORTGROUP
 * (72 lessons); a 132-matrix key (MAINARCHETYPE_SUPPORTARCHETYPE, e.g.
 * "SAGE_OUTLAW") is accepted too and folds onto the support archetype's
 * hardware group ("SAGE_CHAOS") — the two supports in one group share the
 * same Levensles by design.
 * @param {string} key  — e.g. "CAREGIVER_RELATIONAL" or "CAREGIVER_LOVER"
 * @param {string} [lang='nl'] — 'nl' | 'en'
 * @returns {string|null}
 */
export function getArchetypeQuoteByKey(key, lang = 'nl') {
  if (!key) return null;
  const k = String(key).toUpperCase();
  const direct = quotesFor(lang)[k] || ARCHETYPE_QUOTES_NL[k];
  if (direct) return direct;
  // 132-matrix key: MAIN_SUPPORTARCHETYPE → MAIN_SUPPORTGROUP
  const sep = k.lastIndexOf('_');
  if (sep > 0) {
    const group = ARCHETYPE_TO_GROUP[k.slice(sep + 1)];
    if (group) {
      const gk = `${k.slice(0, sep)}_${group}`;
      return quotesFor(lang)[gk] || ARCHETYPE_QUOTES_NL[gk] || null;
    }
  }
  return null;
}

/**
 * Get the levensles quote for a given main archetype + support combo.
 * @param {string} mainKey — e.g. "CAREGIVER"
 * @param {string} support — support GROUP ("Relational") or support
 *                           ARCHETYPE key ("LOVER"); both resolve.
 * @param {string} [lang='nl'] — 'nl' | 'en'
 * @returns {string|null}
 */
export function getArchetypeQuote(mainKey, support, lang = 'nl') {
  if (!mainKey || !support) return null;
  return getArchetypeQuoteByKey(`${mainKey.toUpperCase()}_${String(support).toUpperCase()}`, lang);
}

export { ARCHETYPE_QUOTES_NL, ARCHETYPE_QUOTES_EN };
export default ARCHETYPE_QUOTES;
