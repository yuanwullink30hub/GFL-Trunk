/**
 * Extended Archetype Descriptions — 72 Combination Profiles
 *
 * Each extended archetype is defined by MAIN + SUPPORT_GROUP.
 * The description explains WHY this combination produces the specific outcome,
 * how the Main and Support energies interact, and what the shadow tension means.
 *
 * Support Groups (Neurobiological):
 * - RULING: Judge, Ruler (CEN Dominantie)
 * - RELATIONAL: Lover, Caregiver (Limbic Coupling)
 * - SEEKER: Innocent, Explorer (Hoge Openness)
 * - CHAOS: Outlaw, Trickster (Salience Network)
 * - ABSTRACT: Sage, Artist (DMN Hyper-connectie)
 * - AGENCY: Magician, Hero (Extraversie/Wilskracht)
 *
 * 12 Main × 6 Support Groups = 72 entries
 */

const EXTENDED_DESCRIPTIONS = {
  // ═══════════════════════════════════════════════════════════════════
  // JUDGE (Positie 1) — Main Archetype  |  Shadow: Artist
  // ═══════════════════════════════════════════════════════════════════
  JUDGE_RULING: {
    name: 'The Arbiter',
    subtitle: 'Judge + Ruling',
    harmony: true,
    combination: 'De Arbiter is de Rechter op zijn troon — beoordelingsvermogen versterkt door de structuur van de Ruling-groep. Je beslist niet impulsief; elke uitspraak draagt het gewicht van een systeem. Rechtvaardigheid is je architectuur.',
    shadow: 'Onwrikbare rechtspraak wordt tirannie. De Artist herinnert je: de beste wetten hebben ruimte voor nuance en schoonheid.',
  },
  JUDGE_RELATIONAL: {
    name: 'The Mediator',
    subtitle: 'Judge + Relational',
    harmony: false,
    combination: 'De Mediator combineert beoordelingsvermogen met de verbindingskracht van de Relational-groep. Je oordeelt niet om te scheiden maar om te verbinden. Elk conflict dat je oplost is een nieuwe brug naar begrip.',
    shadow: 'Neutraliteit kan besluiteloosheid worden. De Artist fluistert: soms moet je positie kiezen om werkelijk te verbinden.',
  },
  JUDGE_SEEKER: {
    name: 'The Examiner',
    subtitle: 'Judge + Seeker',
    harmony: false,
    combination: 'De Onderzoeker combineert strikte beoordelingsvermogen met open, nieuwsgierige energie. Je stelt niet zomaar vast — je onderzoekt met het hart open. Waarheid is je zoektocht, niet je bezitting.',
    shadow: 'Eindeloos onderzoeken kan voorkomen dat je ook kiest. De Artist herinnert je: soms moet je het niet-weten omarmen.',
  },
  JUDGE_CHAOS: {
    name: 'The Whistleblower',
    subtitle: 'Judge + Chaos',
    harmony: false,
    combination: 'De Klokkenluider spreekt de waarheid uit, zonder angst voor gevolgen. De Judge voorziet van morele zekerheid, de Chaos-groep voorziet van de durf om disruptief te zijn. Je ontmaskert wat anderen willen verbergen.',
    shadow: 'Waarheid als wapen kan wreedheid maskeren. De Artist herinnert je: de waarheid moet met mededogen worden gesproken.',
  },
  JUDGE_ABSTRACT: {
    name: 'The Critic',
    subtitle: 'Judge + Abstract',
    harmony: false,
    combination: 'De Criticus combineert beoordelingsvermogen met de diepgang van het Default Mode Network. Je analyseert niet oppervlakkig — je gaat naar de wortels. Elk oordeel is een poging tot begrip, niet een afrekening.',
    shadow: 'Kritiek kan een schild worden tegen kwetsbaarheid. De Artist fluistert: de moedigste kritiek is zelfkritiek.',
  },
  JUDGE_AGENCY: {
    name: 'The Avenger',
    subtitle: 'Judge + Agency',
    harmony: false,
    combination: 'De Wreker is de Rechter die niet alleen oordeelt maar ook handelt. De Agency-groep geeft het oordeel transformatieve kracht. Onrecht wordt niet getolereerd — het wordt actief gecorrigeerd.',
    shadow: 'Gerechtigheid kan wraak maskeren. De Artist herinnert je: de meest nobele rechtspraak bevat vergeving.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // LOVER (Positie 2) — Main Archetype  |  Shadow: Magician
  // ═══════════════════════════════════════════════════════════════════
  LOVER_RELATIONAL: {
    name: 'The Soulmate',
    subtitle: 'Lover + Relational',
    harmony: true,
    combination: 'De Zielsverwant is de ultieme belichaming van verbinding — intimiteit versterkt door dezelfde limbische frequentie. Je zoekt niet alleen liefde; je zoekt eenheid van ziel. Twee levens worden één.',
    shadow: 'Versmelting kan verlies van zelf worden. De Magician herinnert je dat transformatie vereist je eigen kern te behouden.',
  },
  LOVER_SEEKER: {
    name: 'The Poet',
    subtitle: 'Lover + Seeker',
    harmony: false,
    combination: 'De Dichter geeft de taal van het hart een vorm. Onschuld en openheid maken je gevoelsleven tastbaar. Je bent de persoon wiens verzen mensen aan zichzelf doen denken.',
    shadow: 'Poëzie kan een vlucht worden uit echte intimiteit. De Magician fluistert: de krachtigste vers is die welke je zelf leeft.',
  },
  LOVER_CHAOS: {
    name: 'The Seducer',
    subtitle: 'Lover + Chaos',
    harmony: false,
    combination: 'De Verleidster is de passie zonder grenzen — charmante chaos. De Lover voelt alles, de Chaos-groep wil alles. Je bent magnetisch, impulsief, onweerstaanbaar. Intimiteit is je speelveld.',
    shadow: 'Verleiding kan manipulatie worden. De Magician herinnert je: ware schoonheid vereist eerlijkheid, niet bedrog.',
  },
  LOVER_ABSTRACT: {
    name: 'The Mystic',
    subtitle: 'Lover + Abstract',
    harmony: false,
    combination: 'De Mysticus combineert gevoelsdiepte met wijze reflectie. Emotie en intellect zijn geen tegenstelling maar een dans. Je heiligt wat anderen profaan vinden — alles wordt goddelijk.',
    shadow: 'Mystiek kan escapisme worden. De Magician fluistert: de diepste mystiek is in het alledaagse gegeven.',
  },
  LOVER_AGENCY: {
    name: 'The Romantic',
    subtitle: 'Lover + Agency',
    harmony: false,
    combination: 'De Romanticus voert liefde uit in grote, heldhaftige gebaren. Je bent niet passief in je liefde — je handelt, creëert, transformeert. De wereld is je toneel voor liefde.',
    shadow: 'Romantisch handelen kan egoïstisch worden. De Magician herinnert je: de meest romantische daad is luisteren.',
  },
  LOVER_RULING: {
    name: 'The Companion',
    subtitle: 'Lover + Ruling',
    harmony: false,
    combination: 'De Metgezel bouwt relaties die niet alleen intens maar ook duurzaam zijn. Liefde is voor jou geen chaos maar een architectuurproject. Je houdt van structuur niet ondanks je hart, maar omdat je hart het verdient.',
    shadow: 'Structuur kan de spontaniteit van liefde doden. De Magician fluistert: de mooiste relaties laten ruimte voor magie.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // CAREGIVER (Positie 3) — Main Archetype  |  Shadow: Hero
  // ═══════════════════════════════════════════════════════════════════
  CAREGIVER_RELATIONAL: {
    name: 'The Healer',
    subtitle: 'Caregiver + Relational',
    harmony: true,
    combination: 'De Genezer is de Verzorger in zijn diepste voelen. Limbische kracht versterkt door limbische kracht. Je heelt niet alleen wonden — je heelt het verbroken vertrouwen in verbinding.',
    shadow: 'Jezelf opofferen kan jezelf verliezen. De Hero herinnert je: je kunt pas echt helen als je je eigen wonden erkent.',
  },
  CAREGIVER_SEEKER: {
    name: 'The Pathfinder',
    subtitle: 'Caregiver + Seeker',
    harmony: false,
    combination: 'De Gids voert anderen de weg naar vrijheid. Je zorg gecombineerd met open nieuwsgierigheid creëert veilige routes naar het onbekende. Je bent de gids die weet dat het allerbelangrijkste is het reizen, niet het aankomstpunt.',
    shadow: 'Anderen voeren kan je eigen weg laten verdwalen. De Hero fluistert: soms is het meest liefdevol om los te laten.',
  },
  CAREGIVER_CHAOS: {
    name: 'The Cultivator',
    subtitle: 'Caregiver + Chaos',
    harmony: false,
    combination: 'De Kweker combineert zorg met vruchtbare chaos. Je plant zaden — soms disruptief, altijd met liefde. Groei vereist soms het afbreken van wat niet meer dient.',
    shadow: 'Controleren onder het mom van zorg is onderdrukking. De Hero herinnert je: ware zorg respecteert autonomie.',
  },
  CAREGIVER_ABSTRACT: {
    name: 'The Therapist',
    subtitle: 'Caregiver + Abstract',
    harmony: false,
    combination: 'De Therapeut combineert compassie met diep analytisch inzicht. Je begrijpt niet zomaar de pijn — je gaat tot de wortels. Genezing via begrip.',
    shadow: 'Analyse kan empathie verdrinken. De Hero fluistert: soms is een warm hart belangrijker dan een scherp verstand.',
  },
  CAREGIVER_AGENCY: {
    name: 'The Protector',
    subtitle: 'Caregiver + Agency',
    harmony: false,
    combination: 'De Beschermer is de Verzorger die opstaat en handelt. Zorg wordt actieve, gedreven bescherming. Je vecht niet voor jezelf — je vecht voor de veiligheid van degenen die je houdt.',
    shadow: 'Bescherming kan verstikking worden. De Hero herinnert je: soms is het moedigste wat je kunt doen de ander loslaten.',
  },
  CAREGIVER_RULING: {
    name: 'The Advocate',
    subtitle: 'Caregiver + Ruling',
    harmony: false,
    combination: 'De Pleitbezorger combineert zorg met bestuurskracht. Je bouwt systemen van zorg die generaties overleven. Je vecht voor rechten van kwetsbaren via structuur.',
    shadow: 'Institutionele zorg kan zijn menselijkheid verliezen. De Hero fluistert: het beste systeem kan nooit een warm hart vervangen.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // INNOCENT (Positie 4) — Main Archetype  |  Shadow: Explorer
  // ═══════════════════════════════════════════════════════════════════
  INNOCENT_SEEKER: {
    name: 'The Saint',
    subtitle: 'Innocent + Seeker',
    harmony: true,
    combination: 'De Heilige is onschuld in zijn meest transcendente vorm. Pure openheid gecombineerd met zuivere verkenning. Je gelooft niet ondanks de wereld, je gelooft doorheen de wereld.',
    shadow: 'Heiligheid kan een masker worden voor passiviteit. De Explorer herinnert je: de wereld heeft heiligen nodig die op weg gaan.',
  },
  INNOCENT_CHAOS: {
    name: 'The Free Spirit',
    subtitle: 'Innocent + Chaos',
    harmony: false,
    combination: 'De Vrije Geest combineert kindelijk vertrouwen met ongebondenheid. Je leeft volgens je eigen regels, niet uit rebellie maar uit zuiver wezen. Vrijheid is je geboorterecht.',
    shadow: 'Ongebreidelde vrijheid kan anderen pijn doen. De Explorer fluistert: echte vrijheid bevat verantwoordelijkheid.',
  },
  INNOCENT_ABSTRACT: {
    name: 'The Disciple',
    subtitle: 'Innocent + Abstract',
    harmony: false,
    combination: 'De Discipel leert met open hart en scherpe geest. Vertrouwen gecombineerd met reflectie. Je bent de eeuwige student die weet dat niet-weten het begin van wijsheid is.',
    shadow: 'Eeuwig leerling zijn kan excuus zijn voor niet bijdragen. De Explorer herinnert je: op gegeven moment moet je je eigen wijsheid delen.',
  },
  INNOCENT_AGENCY: {
    name: 'The Pioneer',
    subtitle: 'Innocent + Agency',
    harmony: false,
    combination: 'De Pionier gaat de wereld in zonder bagage, zonder voorkeur — alleen met moed en wilskracht. Vertrouwen wordt actieve transformatie. Elk begin is voor jou een avontuur.',
    shadow: 'Naïef handelen kan pijnlijk zijn. De Explorer fluistert: enthousiasme zonder onderscheid is een recept voor groei — en voor lijden.',
  },
  INNOCENT_RULING: {
    name: 'The Shepherd',
    subtitle: 'Innocent + Ruling',
    harmony: false,
    combination: 'De Herder leidt niet door dwang maar door voorbeeld. Vertrouwen gecombineerd met structuur. Je kudde volgt omdat ze voelen dat je hun welzijn wilt.',
    shadow: 'Paternalisme verstopt zich in zorg. De Explorer herinnert je: de beste herder luistert naar zijn schapen.',
  },
  INNOCENT_RELATIONAL: {
    name: 'The Samaritan',
    subtitle: 'Innocent + Relational',
    harmony: false,
    combination: 'De Samaritaan helpt zonder voorwaarde, zonder verwachting. Vertrouwen als basisniveau van verbinding. Je ziet in iedereen hun medemenswording.',
    shadow: 'Voorwaardloze hulp kan jezelf uitputten. De Explorer herinnert je: zelfzorg is geen egoïsme.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // EXPLORER (Positie 5) — Main Archetype  |  Shadow: Innocent
  // ═══════════════════════════════════════════════════════════════════
  EXPLORER_SEEKER: {
    name: 'The Navigator',
    subtitle: 'Explorer + Seeker',
    harmony: true,
    combination: 'De Navigator combineert ontdekkingsdrang met open nieuwsgierigheid. Je verkent niet blind — je navigeert met inzicht en kompas. Elke route die je uitstippelt is een bewuste keuze, geïnformeerd door kennis, ervaring en intuïtie.',
    shadow: 'Te veel nadenken voor je handelt kan je verlammen. De Innocent herinnert je: soms is de beste ontdekking die welke je doet zonder kaart.',
  },
  EXPLORER_CHAOS: {
    name: 'The Innovator',
    subtitle: 'Explorer + Chaos',
    harmony: false,
    combination: 'De Innovator ziet mogelijkheden waar anderen grenzen zien. De Explorer verlegt grenzen; de Chaos-groep geeft dat verleggen een creatieve, disruptieve dimensie. Elke ontdekking wordt een uitvinding.',
    shadow: 'Innovatie zonder doel is chaos. De Innocent herinnert je: de krachtigste innovatie dient de eenvoud, niet de complexiteit.',
  },
  EXPLORER_ABSTRACT: {
    name: 'The Scholar',
    subtitle: 'Explorer + Abstract',
    harmony: false,
    combination: 'De Geleerde is de Explorer die zijn reizen naar binnen richt. De Abstract-groep geeft de ontdekkingsdrang een reflectief karakter — je verkent niet alleen nieuwe plekken maar nieuwe staten van begrip.',
    shadow: 'Innerlijke reizen kunnen een excuus worden om de buitenwereld te vermijden. De Innocent fluistert: de meest verlichte ontdekker is degene die ook op straat loopt.',
  },
  EXPLORER_AGENCY: {
    name: 'The Sailor',
    subtitle: 'Explorer + Agency',
    harmony: false,
    combination: 'De Zeiler leeft op de weg — de Explorer aangedreven door de pure actiekracht van de Agency-groep. Stilstaan is geen optie; de horizon is altijd je volgende doel. Vrijheid is je zuurstof.',
    shadow: 'Eeuwig bewegen kan een vlucht zijn voor commitment. De Innocent herinnert je: de moedigste reis is soms ergens blijven.',
  },
  EXPLORER_RULING: {
    name: 'The Scout',
    subtitle: 'Explorer + Ruling',
    harmony: false,
    combination: 'De Verkenner combineert ontdekkingsdrang met strategisch overzicht van de Ruling-groep. Je verkent niet voor jezelf — je verkent voor het team. Elke kaart die je tekent dient het collectief.',
    shadow: 'Verkenning in opdracht verliest zijn spontaniteit. De Innocent herinnert je: de beste ontdekkingen zijn ongepland.',
  },
  EXPLORER_RELATIONAL: {
    name: 'The Networker',
    subtitle: 'Explorer + Relational',
    harmony: false,
    combination: 'De Netwerker verkent de wereld via menselijke verbinding. De Explorer ontdekt; de Relational-groep maakt van elke ontmoeting een blijvende connectie. Je bouwt bruggen tussen werelden.',
    shadow: 'Netwerken kan oppervlakkig worden. De Innocent fluistert: de diepste connectie vereist kwetsbaarheid, niet alleen charme.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // OUTLAW (Positie 6) — Main Archetype  |  Shadow: Ruler
  // ═══════════════════════════════════════════════════════════════════
  OUTLAW_CHAOS: {
    name: 'The Anarchist',
    subtitle: 'Outlaw + Chaos',
    harmony: true,
    combination: 'De Anarchist is de Rebel in actie — vernietiging als creatieve daad. Je breekt niet uit woede maar uit overtuiging. Elke structuur die je omverwerpt maakt ruimte voor iets beters. Chaos is je gereedschap.',
    shadow: 'Vernietiging zonder bouwplan is nihilisme. De Ruler herinnert je: ware revolutie bouwt terwijl ze breekt.',
  },
  OUTLAW_ABSTRACT: {
    name: 'The Iconoclast',
    subtitle: 'Outlaw + Abstract',
    harmony: false,
    combination: 'De Beeldenstormer combineert rebellie met diep inzicht. De Rebel breekt; het Default Mode Network weet precies wát en waaróm. Je vernietigt geen systemen — je ontmaskert illusies.',
    shadow: 'Kritiek zonder alternatief is cynisme. De Ruler fluistert: de wijste rebel biedt een beter verhaal.',
  },
  OUTLAW_AGENCY: {
    name: 'The Revolutionary',
    subtitle: 'Outlaw + Agency',
    harmony: false,
    combination: 'De Revolutionair vecht voor een hogere zaak. De Rebel levert de kracht; de Agency-groep geeft die kracht slagkracht en doorzettingsvermogen. Je rebelleert niet tegen mensen maar tegen onrecht.',
    shadow: 'Heilige woede kan fanatisme worden. De Ruler herinnert je: de ware revolutionair kent genade.',
  },
  OUTLAW_RULING: {
    name: 'The Reformer',
    subtitle: 'Outlaw + Ruling',
    harmony: false,
    combination: 'De Hervormer is de paradoxale Rebel die het systeem verandert van binnenuit. De Ruling-groep geeft de Rebel-energie structuur. Je breekt niet af — je herbouwt. Revolutie met een blauwdruk.',
    shadow: 'Het systeem dat je hervormt kan je absorberen. De Ruler fluistert: de gevaarlijkste val is de troon die je ooit wilde omverwerpen.',
  },
  OUTLAW_RELATIONAL: {
    name: 'The Liberator',
    subtitle: 'Outlaw + Relational',
    harmony: false,
    combination: 'De Bevrijder zet de Rebel-energie in voor de ander. De Relational-groep richt de rebellie op onderdrukking in menselijke relaties. Je vecht niet voor jezelf — je vecht voor iedereen.',
    shadow: 'Bevrijding opleggen is een contradictie. De Ruler herinnert je: ware vrijheid kan alleen gekozen worden.',
  },
  OUTLAW_SEEKER: {
    name: 'The Renegade',
    subtitle: 'Outlaw + Seeker',
    harmony: false,
    combination: 'De Renegaat combineert rebellie met open nieuwsgierigheid. Je zoekt de grenzen op niet om te vernietigen maar om te begrijpen waarom ze er zijn — en of ze het verdienen te bestaan.',
    shadow: 'Grenzen verleggen zonder anker kan je verliezen. De Ruler fluistert: de krachtigste renegaat weet waar hij vandaan komt.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // TRICKSTER (Positie 7) — Main Archetype  |  Shadow: Sage
  // ═══════════════════════════════════════════════════════════════════
  TRICKSTER_CHAOS: {
    name: 'The Fool',
    subtitle: 'Trickster + Chaos',
    harmony: true,
    combination: 'De zuivere waarheidsspreker. Ze zien de werkelijkheid zonder sociaal filter — zo direct dat de omgeving het niet kan plaatsen. Hun radicale eerlijkheid wordt gelezen als naïviteit of absurditeit, maar het is het tegenovergestelde: een weigering om mee te doen aan de collectieve afspraak om weg te kijken.',
    shadow: 'Trigger: Verraad van het collectief. Ze maskeren hun eigen diepe, donkere pijn met een lach. Ze storten in als ze beseffen dat hun eerlijkheid de pijn niet meer kan doorbreken — het moment dat de waarheid niet meer landt.',
  },
  TRICKSTER_ABSTRACT: {
    name: 'The Comedian',
    subtitle: 'Trickster + Abstract',
    harmony: false,
    combination: 'Ontregeling door diepe intellectuele observatie. Ze gebruiken satire als een Trojaans paard om briljante, pijnlijke waarheden de samenleving in te smokkelen zonder direct te preken.',
    shadow: 'Trigger: Intellectuele Stagnatie. Ze internaliseren hun angst voor de realiteit in donker gepieker (rumination) en gebruiken humor als een breekijzer om emotioneel te raken. Soms ongevraagd en slecht getimed.',
  },
  TRICKSTER_AGENCY: {
    name: 'The Saboteur',
    subtitle: 'Trickster + Agency',
    harmony: false,
    combination: 'Disruptie door asymmetrische actie. Ze ontmantelen oppressieve systemen niet met brute kracht, maar door slim een spreekwoordelijke \'sleutel in de tandwielen\' te gooien.',
    shadow: 'Trigger: Onmacht. Bij gebrek aan een \'Goliath\' om te verslaan, slaat hun actiedrang om in malafide vandalisme, waarbij ze dingen kapotmaken puur voor de kick van de chaos.',
  },
  TRICKSTER_RULING: {
    name: 'The Jester',
    subtitle: 'Trickster + Ruling',
    harmony: false,
    combination: 'De hofnar. Ze bevinden zich in de zwaarste corporate of politieke systemen om machthebbers de waarheid op een lichte manier te vertellen, en zo te voorkomen dat de structuur tiranniek wordt.',
    shadow: 'Trigger: Controleverlies. Net als de Rechter hechten ze stiekem aan de veiligheid van het systeem. Bij dreigende anarchie stopt hun humor en slaat de paniek toe.',
  },
  TRICKSTER_RELATIONAL: {
    name: 'The Clown',
    subtitle: 'Trickster + Relational',
    harmony: false,
    combination: 'Emotionele radar als gave. Ze lezen de staat van een kamer sneller dan wie ook (Limbische resonantie) en bieden precies wat er nodig is om de spanning te laten zakken — niet door te performen maar door aanwezig te zijn op de juiste frequentie.',
    shadow: 'Trigger: Emotionele disconnectie. Het \'Sad Clown\' syndroom; ze genezen de groep, maar negeren hun eigen behoefte aan liefde. Ze raken hevig in de war als hun partner hun diepe eenzaamheid niet \'ziet\'.',
  },
  TRICKSTER_SEEKER: {
    name: 'The Shapeshifter',
    subtitle: 'Trickster + Seeker',
    harmony: false,
    combination: 'Constante verandering van vorm, identiteit en perspectief. Ze spelen met de weefsels van de perceptie en laten anderen zien dat de realiteit veel fluïder is dan ze denken.',
    shadow: 'Trigger: Creatieve of identiteits-blokkades. Omdat ze geen vaste vorm hebben, kunnen ze meedogenloos manipulatief worden of in een diepe identiteitscrisis belanden als ze nergens meer bij horen.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // SAGE (Positie 8) — Main Archetype  |  Shadow: Trickster
  // ═══════════════════════════════════════════════════════════════════
  SAGE_ABSTRACT: {
    name: 'The Enlightened',
    subtitle: 'Sage + Abstract',
    harmony: true,
    combination: 'De Verlichte is de Wijze in zijn meest zuivere manifestatie — het Default Mode Network versterkt door dezelfde reflectieve kracht. Je zoekt niet kennis om te accumuleren maar om te transcenderen. Niet-weten is je diepste weten.',
    shadow: 'Verlichting claimen is de snelste weg naar verblinding. De Trickster herinnert je: de wijste woorden zijn soms een grap.',
  },
  SAGE_AGENCY: {
    name: 'The Detective',
    subtitle: 'Sage + Agency',
    harmony: false,
    combination: 'De Detective combineert wijsheid met de actiekracht van de Agency-groep. Je zoekt niet alleen waarheid — je achtervolgt het. Elk raadsel is een zaak, elke zaak een roeping.',
    shadow: 'Obsessieve waarheidszoektocht kan je menselijkheid verliezen. De Trickster fluistert: soms is de waarheid minder belangrijk dan de relatie.',
  },
  SAGE_RULING: {
    name: 'The Analyst',
    subtitle: 'Sage + Ruling',
    harmony: false,
    combination: 'De Analist combineert wijsheid met de structurerende kracht van de Ruling-groep. Je wijsheid krijgt bestuurlijke vorm — elke analyse is een blauwdruk voor actie. Kennis is macht, en jij geeft het richting.',
    shadow: 'Analyse kan verlamming maskeren. De Trickster herinnert je: soms is een intuïtieve sprong meer waard dan duizend analyses.',
  },
  SAGE_RELATIONAL: {
    name: 'The Mentor',
    subtitle: 'Sage + Relational',
    harmony: false,
    combination: 'De Mentor deelt wijsheid via verbinding. De Relational-groep maakt van de Sage niet alleen een kenner maar een begeleider. Je leert niet uit boeken maar uit relatie — van hart tot hart.',
    shadow: 'Mentorschap kan afhankelijkheid creëren. De Trickster fluistert: de beste mentor maakt zichzelf overbodig.',
  },
  SAGE_SEEKER: {
    name: 'The Dreamer',
    subtitle: 'Sage + Seeker',
    harmony: false,
    combination: 'De Dromer verbindt wijsheid met kinderlijke verwondering. De Seeker-groep opent de Sage voor het onbekende. Je droomt niet weg — je droomt vooruit. Visie is je navigatie-instrument.',
    shadow: 'Dromen zonder te handelen is escapisme. De Trickster herinnert je: de krachtigste dromen worden vertaald in actie.',
  },
  SAGE_CHAOS: {
    name: 'The Hermit',
    subtitle: 'Sage + Chaos',
    harmony: false,
    combination: 'De Heremiet trekt zich terug om de chaos van de wereld te doorgronden. De Chaos-groep confronteert de Sage met het irrationele — en de Sage vindt er patronen in. Je bent de kluizenaar die meer ziet dan de menigte.',
    shadow: 'Isolatie kan apathie maskeren. De Trickster herinnert je: de diepste wijsheid wordt gedeeld, niet bewaard.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // ARTIST (Positie 9) — Main Archetype  |  Shadow: Judge
  // ═══════════════════════════════════════════════════════════════════
  ARTIST_ABSTRACT: {
    name: 'The Demiurge',
    subtitle: 'Artist + Abstract',
    harmony: true,
    combination: 'De Demiurg is de Kunstenaar als schepper van werelden. Het Default Mode Network versterkt de creatieve kracht tot goddelijke proportie. Je schept niet kunst — je schept realiteiten.',
    shadow: 'Scheppen zonder grenzen kan megalomanie worden. De Judge herinnert je: ook de Demiurg is gebonden aan kosmische wetten.',
  },
  ARTIST_AGENCY: {
    name: 'The Forgemaster',
    subtitle: 'Artist + Agency',
    harmony: false,
    combination: 'De Smidmeester combineert creatieve visie met de wilskracht van de Agency-groep. Je smeedt niet alleen ideeën — je smeedt ze tot werkelijkheid. Ambitie en creativiteit zijn je hamer en aambeeld.',
    shadow: 'Niet elke creatie verdient te bestaan. De Judge herinnert je: soms is het magischer om te accepteren wat is.',
  },
  ARTIST_RULING: {
    name: 'The Architect',
    subtitle: 'Artist + Ruling',
    harmony: false,
    combination: 'De Architect combineert creatieve visie met de structurerende kracht van de Ruling-groep. Je ontwerpt niet alleen schoonheid — je ontwerpt systemen die schoonheid mogelijk maken. Orde is je canvas.',
    shadow: 'Rigide ontwerpen laten geen ruimte voor het onverwachte. De Judge fluistert: de beste architectuur stuurt het water, maar laat het stromen.',
  },
  ARTIST_RELATIONAL: {
    name: 'The Storyteller',
    subtitle: 'Artist + Relational',
    harmony: false,
    combination: 'De Verteller verbindt mensen door verhalen. De Kunstenaar geeft vorm, de Relational-groep geeft het verhaal een hart. Elk verhaal dat je vertelt is een brug tussen jou en je luisteraar.',
    shadow: 'Verhalen kunnen een masker worden. De Judge herinnert je: het eerlijkste verhaal is soms stilte.',
  },
  ARTIST_SEEKER: {
    name: 'The Visionary',
    subtitle: 'Artist + Seeker',
    harmony: false,
    combination: 'De Visionair ziet wat anderen niet zien — patronen in de chaos, schoonheid in het onzichtbare. De Seeker-groep opent de Kunstenaar voor het onbekende. Je bent de brug tussen het abstracte en het tastbare.',
    shadow: 'Visioenen zonder grounding zijn hallucinaties. De Judge herinnert je: een visioen dat niet getoetst wordt is een illusie.',
  },
  ARTIST_CHAOS: {
    name: 'The Illusionist',
    subtitle: 'Artist + Chaos',
    harmony: false,
    combination: 'De Illusionist is de Kunstenaar die de grenzen van perceptie verlegt. De Chaos-groep bevrijdt de creatieve kracht van conventie. Je creëert werelden die anderen niet kunnen onderscheiden van de werkelijkheid.',
    shadow: 'Illusie als levensstijl kan oneerlijkheid worden. De Judge herinnert je: de krachtigste kunst confronteert de werkelijkheid.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // MAGICIAN (Positie 10) — Main Archetype  |  Shadow: Lover
  // ═══════════════════════════════════════════════════════════════════
  MAGICIAN_AGENCY: {
    name: 'The Alchemist',
    subtitle: 'Magician + Agency',
    harmony: true,
    combination: 'De Alchemist is de Magiër in zijn meest actieve manifestatie — transformatie aangedreven door pure wilskracht. Je wacht niet tot de wereld verandert — je smeedt haar om met vuur en intentie.',
    shadow: 'Niet alles wat je transformeert wordt beter. De Lover herinnert je: soms is het magischer om te accepteren wat is.',
  },
  MAGICIAN_RULING: {
    name: 'The Engineer',
    subtitle: 'Magician + Ruling',
    harmony: false,
    combination: 'De Ingenieur combineert transformatief vermogen met de structurerende kracht van de Ruling-groep. Je bouwt niet dromen — je bouwt bruggen. Elke creatie heeft een functie, elke functie heeft elegantie.',
    shadow: 'Functionaliteit kan schoonheid doden. De Lover fluistert: niet alles hoeft nuttig te zijn om waardevol te zijn.',
  },
  MAGICIAN_RELATIONAL: {
    name: 'The Shaman',
    subtitle: 'Magician + Relational',
    harmony: false,
    combination: 'De Sjamaan combineert transformatief vermogen met de kracht van verbinding. De Relational-groep richt de magie op de tussenruimte — je transformeert niet de wereld maar de manier waarop mensen zich met elkaar verbinden.',
    shadow: 'Betovering kan manipulatie worden. De Lover herinnert je: ware verbinding vereist eerlijkheid, niet magie.',
  },
  MAGICIAN_SEEKER: {
    name: 'The Oracle',
    subtitle: 'Magician + Seeker',
    harmony: false,
    combination: 'Het Orakel combineert transformatieve kracht met de open nieuwsgierigheid van de Seeker-groep. Je ziet niet alleen wat is — je ziet wat kan zijn. Je voorspelt niet de toekomst; je creëert de mogelijkheden.',
    shadow: 'Voorspelling kan controle maskeren. De Lover fluistert: de krachtigste profetie laat ruimte voor het onverwachte.',
  },
  MAGICIAN_CHAOS: {
    name: 'The Enchanter',
    subtitle: 'Magician + Chaos',
    harmony: false,
    combination: 'De Betoverer combineert transformatief vermogen met chaotische energie. De Chaos-groep bevrijdt de magie van conventie. Je transformeert de werkelijkheid op manieren die niemand zag aankomen — verrassend, ontregelend, betoverend.',
    shadow: 'Ongecontroleerde magie is chaos zonder richting. De Lover herinnert je: de krachtigste betovering komt voort uit liefde.',
  },
  MAGICIAN_ABSTRACT: {
    name: 'The Sorcerer',
    subtitle: 'Magician + Abstract',
    harmony: false,
    combination: 'De Tovenaar is de Magiër in zijn meest reflectieve vorm — het Default Mode Network verdiept de magie tot innerlijke alchemie. Je transformeert niet de materie maar het bewustzijn.',
    shadow: 'Spirituele magie zonder grounding is waanzin. De Lover herinnert je: de meest krachtige magie is een oprecht gebaar van liefde.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // HERO (Positie 11) — Main Archetype  |  Shadow: Caregiver
  // ═══════════════════════════════════════════════════════════════════
  HERO_AGENCY: {
    name: 'The Legend',
    subtitle: 'Hero + Agency',
    harmony: true,
    combination: 'De Legende is de Held in zijn volle kracht — actie versterkt door dezelfde extraversie en wilskracht. Je handelt niet voor erkenning maar omdat je niet anders kan. Elke daad is een hoofdstuk in je episch verhaal.',
    shadow: 'Legendes vergeten soms dat ze ook mensen zijn. De Caregiver herinnert je: de grootste helden kennen kwetsbaarheid.',
  },
  HERO_RULING: {
    name: 'The Commander',
    subtitle: 'Hero + Ruling',
    harmony: false,
    combination: 'De Commandant combineert heldendom met strategisch leiderschap. De Ruling-groep geeft de Held een leger. Je vecht niet alleen — je leidt anderen de strijd in. Elk bevel is een belofte.',
    shadow: 'Leiden kan dicteren worden. De Caregiver fluistert: de beste commandant luistert naar zijn soldaten.',
  },
  HERO_RELATIONAL: {
    name: 'The Guardian',
    subtitle: 'Hero + Relational',
    harmony: false,
    combination: 'De Wachter combineert heldenmoed met de beschermende kracht van de Relational-groep. Je vecht niet voor glorie maar voor de mensen die je liefhebt. Elke strijd is persoonlijk.',
    shadow: 'Bescherming kan verstikking worden. De Caregiver herinnert je: soms is het heldhaftigste loslaten.',
  },
  HERO_SEEKER: {
    name: 'The Inventor',
    subtitle: 'Hero + Seeker',
    harmony: false,
    combination: 'De Uitvinder combineert heldenmoed met de open nieuwsgierigheid van de Seeker-groep. Je vecht niet met zwaarden maar met ideeën. Elke uitvinding is een heldendaad.',
    shadow: 'Uitvinden kan een excuus zijn om niet direct te handelen. De Caregiver fluistert: soms is de eenvoudigste hulp de heldhaftigste.',
  },
  HERO_CHAOS: {
    name: 'The Ronin',
    subtitle: 'Hero + Chaos',
    harmony: false,
    combination: 'De Ronin is de Held zonder meester — chaotische kracht gericht door persoonlijke eer. De Chaos-groep bevrijdt de Held van institutionele loyaliteit. Je volgt je eigen code, je eigen weg, je eigen zwaard.',
    shadow: 'Een zwaard zonder meester kan roekeloos worden. De Caregiver herinnert je: de eenzame held mist de warmte die hem menselijk maakt.',
  },
  HERO_ABSTRACT: {
    name: 'The Strategist',
    subtitle: 'Hero + Abstract',
    harmony: false,
    combination: 'De Strateeg combineert heldenmoed met het diepe inzicht van het Default Mode Network. Je vecht niet brute kracht — je vecht met plannen, patronen en positie. Elke zet is berekend, elke slag doorslaggevend.',
    shadow: 'Strategie kan empathie verdringen. De Caregiver fluistert: de beste strategie heeft ruimte voor menselijkheid.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // RULER (Positie 12) — Main Archetype  |  Shadow: Outlaw
  // ═══════════════════════════════════════════════════════════════════
  RULER_RULING: {
    name: 'The Emperor',
    subtitle: 'Ruler + Ruling',
    harmony: true,
    combination: 'De Keizer is de Heerser in zijn volle glorie — autoriteit versterkt door de Ruling-groep. Je bouwt koninkrijken niet voor macht maar voor orde. Structuur is je liefde, systeem je nalatenschap.',
    shadow: 'Absolute macht corrumpeert absoluut. De Outlaw herinnert je: de beste heerser sterft als eerste als het systeem verstijft.',
  },
  RULER_RELATIONAL: {
    name: 'The Patriarch',
    subtitle: 'Ruler + Relational',
    harmony: false,
    combination: 'De Patriarch/Matriarch bestuurt via verbinding. De Heerser biedt structuur, de Relational-groep vult die met warmte en zorg. Je bouwt dynastieën op fundament van liefde.',
    shadow: 'Familiebanden kunnen een gevangenis worden. De Outlaw fluistert: de gezondste families laten hun leden vrij.',
  },
  RULER_SEEKER: {
    name: 'The Entrepreneur',
    subtitle: 'Ruler + Seeker',
    harmony: false,
    combination: 'De Ondernemer combineert bestuurlijke visie met de open nieuwsgierigheid van de Seeker-groep. Je bouwt niet wat al bestaat — je creëert nieuwe markten, nieuwe mogelijkheden, nieuwe werelden.',
    shadow: 'Disruptie zonder verantwoordelijkheid is destructie. De Outlaw herinnert je: breek alleen af wat je bereid bent beter op te bouwen.',
  },
  RULER_CHAOS: {
    name: 'The Maverick',
    subtitle: 'Ruler + Chaos',
    harmony: false,
    combination: 'De Maverick combineert de bestuurskracht van de Heerser met de onconventionele disruptie van de Chaos-groep. De drang naar orde ontmoet de drang naar de onthullende waarheid. Dit levert een leider op die structuur bouwt én breekt wanneer evolutie dat vraagt — massieve, onvoorspelbare daadkracht die voortkomt uit het simultaan inzetten van controle en disruptie.',
    shadow: 'Onconventioneel leiderschap kan instabiliteit creëren. De Outlaw herinnert je: zelfs de meest disruptieve leider heeft een anker nodig.',
  },
  RULER_ABSTRACT: {
    name: 'The Philosopher-King',
    subtitle: 'Ruler + Abstract',
    harmony: false,
    combination: 'De Filosoof-Koning regeert niet door kracht maar door wijsheid. De Heerser biedt structuur, het Default Mode Network vult die structuur met diepgang en ethiek. Je bent de leider naar wie de wijzen opkijken.',
    shadow: 'Filosoferen kan een excuus worden om niet te handelen. De Outlaw fluistert: soms moet je de troon van de denker verlaten en de straat op gaan.',
  },
  RULER_AGENCY: {
    name: 'The Conqueror',
    subtitle: 'Ruler + Agency',
    harmony: false,
    combination: 'De Veroveraar combineert bestuurskracht met de actiedrang van de Agency-groep. Je breidt grenzen uit niet door diplomatie maar door daden. Elke grens is een uitnodiging om te overschrijden.',
    shadow: 'Niet elke grens hoeft verlegd te worden. De Outlaw herinnert je: ware vrijheid is soms accepteren wat is.',
  },
};

/**
 * Get the extended archetype description for a Main + SupportGroup combination.
 *
 * @param {string} mainKey      – e.g. 'SAGE'
 * @param {string} supportGroup – e.g. 'ABSTRACT'
 * @returns {{ name, subtitle, harmony, combination, shadow } | null}
 */
export function getExtendedDescription(mainKey, supportGroup) {
  const lookupKey = `${mainKey}_${supportGroup}`;
  return EXTENDED_DESCRIPTIONS[lookupKey] || null;
}

export default EXTENDED_DESCRIPTIONS;
