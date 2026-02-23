/**
 * Extended Archetype Descriptions — 72 Combination Profiles
 * 
 * Each extended archetype is defined by MAIN + SUPPORT_GROUP.
 * The description explains WHY this combination produces the specific outcome,
 * how the Main and Support energies interact, and what the shadow tension means.
 *
 * Structure: EXTENDED_DESCRIPTIONS[`${MAIN}_${SUPPORT_GROUP}`] = {
 *   name:        'The Detective',
 *   subtitle:    'Sage + Action',
 *   combination: Short text explaining how Main + Support create this archetype
 *   shadow:      Short text about the shadow tension for this combination
 * }
 *
 * 12 Main × 6 Support Groups = 72 entries
 */

const EXTENDED_DESCRIPTIONS = {
  // ═══════════════════════════════════════════════════════════════════
  // SAGE — Main Archetype
  // ═══════════════════════════════════════════════════════════════════
  SAGE_WISDOM: {
    name: 'The Enlightened',
    subtitle: 'Sage + Wisdom',
    combination: 'Wanneer de Wijze zichzelf ontmoet in de spiegel van de waarheid, ontstaat de Verlichte — een zeldzame synthese van intern inzicht en extern onderzoek. Je zoekt niet alleen kennis, je bent kennis geworden. De Sage verdiept zich; de Wisdom-groep verankert die diepte in universeel begrip.',
    shadow: 'Het risico is een ivoren toren van intellectuele zelfgenoegzaamheid. De Trickster herinnert je: wijsheid zonder speelsheid wordt dogma.',
  },
  SAGE_ACTION: {
    name: 'The Detective',
    subtitle: 'Sage + Action',
    combination: 'De analytische geest van de Sage gecombineerd met de slagkracht van de Action-groep creëert de Detective — iemand die niet alleen patronen ziet, maar ze ook achtervolgt. Je rust niet tot de waarheid boven tafel ligt. Logica is je kompas, actie je voertuig.',
    shadow: 'Je kunt obsessief worden in je zoektocht. De Trickster fluistert dat sommige mysteries beter onopgelost blijven.',
  },
  SAGE_RELATIONAL: {
    name: 'The Mentor',
    subtitle: 'Sage + Relational',
    combination: 'De Sage die zijn wijsheid kanalisseert via menselijke verbinding wordt de Mentor. Je leert niet door te dicteren, maar door te luisteren en het juiste moment af te wachten. Je inzicht wordt pas krachtig als het een ander raakt.',
    shadow: 'De gevaar is dat je je emotioneel afsluit achter je wijsheid. De Trickster herinnert je: een mentor die niet kan lachen, leert niets essentieels.',
  },
  SAGE_CREATIVE: {
    name: 'The Alchemist',
    subtitle: 'Sage + Creative',
    combination: 'De Alchemist combineert de analytische precisie van de Sage met het creatieve visioen van de Creative-groep. Je ziet niet alleen hoe dingen zijn — je ziet hoe ze getransformeerd kunnen worden. Kennis wordt in jouw handen een grondstof voor metamorfose.',
    shadow: 'Je kunt verdwalen in theoretische mogelijkheden zonder ooit lood in goud te veranderen. De Trickster fluistert: "Doe het, of lach erom."',
  },
  SAGE_RULING: {
    name: 'The Analyst',
    subtitle: 'Sage + Ruling',
    combination: 'De Analyst combineert de diepte van de Sage met de structurele kracht van de Ruling-groep. Je bent de strateeg die systemen niet alleen begrijpt maar ook ontwerpt. Data is je taal, optimalisatie je roeping.',
    shadow: 'Overanalyse kan je verlammen. De Trickster herinnert je dat perfecte systemen niet bestaan — en dat het grappig is om dat te accepteren.',
  },
  SAGE_SPIRIT: {
    name: 'The Hermit',
    subtitle: 'Sage + Spirit',
    combination: 'De Kluizenaar trekt zich terug van het lawaai om in stilte de diepste waarheden te vinden. De Sage zoekt kennis, de Spirit-groep geeft die zoektocht een transcendent karakter. Je wijsheid komt niet uit boeken maar uit stilte.',
    shadow: 'Isolatie kan een vlucht worden in plaats van een keuze. De Trickster roept je terug naar de wereld met een grap die je hart opent.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // HERO — Main Archetype
  // ═══════════════════════════════════════════════════════════════════
  HERO_ACTION: {
    name: 'The Legend',
    subtitle: 'Hero + Action',
    combination: 'De Legende is de Held in zijn puurste vorm — actie versterkt door actie. Je bent niet tevreden met vechten; je wilt geschiedenis schrijven. Elke uitdaging is een kans om je naam in steen te beitelen. Kracht vermenigvuldigd door kracht.',
    shadow: 'Onoverwinlijkheid is een illusie. De Caregiver herinnert je dat de grootste helden hun zwakheid kennen en koesteren.',
  },
  HERO_WISDOM: {
    name: 'The Strategist',
    subtitle: 'Hero + Wisdom',
    combination: 'De Strateeg combineert de daadkracht van de Held met het overzicht van de Wisdom-groep. Je vecht niet blind — elk gevecht is berekend, elke stap onderdeel van een groter plan. De pen en het zwaard zijn in jouw handen gelijkwaardig.',
    shadow: 'Je kunt zo veel plannen dat je vergeet te handelen. De Caregiver vraagt: voor wie vecht je eigenlijk?',
  },
  HERO_RELATIONAL: {
    name: 'The Guardian',
    subtitle: 'Hero + Relational',
    combination: 'De Beschermer is de Held die zijn kracht inzet niet voor roem, maar voor de mensen die hij liefheeft. Elke slag die je levert is in dienst van verbinding. Je bent het schild, niet het zwaard.',
    shadow: 'Bescherming kan verstikking worden. De Caregiver fluistert dat de beste bescherming soms loslaten is.',
  },
  HERO_CREATIVE: {
    name: 'The Inventor',
    subtitle: 'Hero + Creative',
    combination: 'De Uitvinder combineert de moed van de Held met de innovatie van de Creative-groep. Je vecht niet met bestaande wapens — je smeedt nieuwe. Elke uitdaging is een creatief probleem dat wacht op een onverwachte oplossing.',
    shadow: 'Niet elk probleem vereist een nieuwe uitvinding. De Caregiver herinnert je dat soms een luisterend oor meer doet dan een geniaal plan.',
  },
  HERO_RULING: {
    name: 'The Commander',
    subtitle: 'Hero + Ruling',
    combination: 'De Commandant is de Held die leidt vanuit de frontlinie. Je bent niet alleen sterk — je organiseert die kracht en richt hem op doelen. Teams volgen je niet uit verplichting maar uit bewondering voor je integriteit.',
    shadow: 'Controle is niet altijd leiderschap. De Caregiver herinnert je dat echte commandanten ook weten wanneer ze moeten dienen.',
  },
  HERO_SPIRIT: {
    name: 'The Paladin',
    subtitle: 'Hero + Spirit',
    combination: 'De Paladijn is de heilige strijder — kracht gewijd aan een hoger doel. De Held levert de actie, de Spirit-groep geeft die actie een ziel. Je vecht niet voor jezelf; je vecht voor iets groters dan jezelf.',
    shadow: 'Heilige missies kunnen fanatisme worden. De Caregiver fluistert: "Het meest spirituele dat je kunt doen is menselijk blijven."',
  },

  // ═══════════════════════════════════════════════════════════════════
  // LOVER — Main Archetype
  // ═══════════════════════════════════════════════════════════════════
  LOVER_RELATIONAL: {
    name: 'The Soulmate',
    subtitle: 'Lover + Relational',
    combination: 'De Zielsverwant is de ultieme belichaming van verbinding — de Minnaar versterkt door de Relational-groep. Je leeft voor het moment waarop twee zielen elkaar werkelijk herkennen. Intimiteit is je superkracht.',
    shadow: 'Versmelting kan verlies van zelf worden. De Magician herinnert je dat transformatie vereist dat je jezelf niet verliest in de ander.',
  },
  LOVER_WISDOM: {
    name: 'The Mystic',
    subtitle: 'Lover + Wisdom',
    combination: 'De Mysticus combineert de gevoelsdiepte van de Minnaar met de wijsheid van de Wisdom-groep. Je voelt waarheid voordat je hem denkt. Emotie en intellect zijn in jou geen tegenstelling maar een dans.',
    shadow: 'Je kunt je terugtrekken in innerlijke werelden. De Magician herinnert je: mystiek zonder manifestatie is dagdromen.',
  },
  LOVER_ACTION: {
    name: 'The Hedonist',
    subtitle: 'Lover + Action',
    combination: 'De Hedonist leeft vol in het moment — de Minnaar aangedreven door de daadkracht van de Action-groep. Genot is niet je ontsnapping maar je filosofie. Je gelooft dat het leven geleefd moet worden, niet overleefd.',
    shadow: 'Ongebreideld genot kan destructief worden. De Magician fluistert: transformeer genot in een bron van wijsheid, niet in een vlucht.',
  },
  LOVER_CREATIVE: {
    name: 'The Poet',
    subtitle: 'Lover + Creative',
    combination: 'De Dichter geeft de taal van het hart een vorm. De Minnaar voelt alles; de Creative-groep geeft die gevoelens stem. Elke emotie wordt een vers, elke ervaring een kunstwerk.',
    shadow: 'Je kunt zo opgesloten raken in je eigen gevoelsexpressie dat je de ander vergeet. De Magician herinnert je: kunst moet ook transformeren, niet alleen ventileren.',
  },
  LOVER_RULING: {
    name: 'The Partner',
    subtitle: 'Lover + Ruling',
    combination: 'De Partner combineert de liefdescapaciteit van de Minnaar met de structuur van de Ruling-groep. Je bouwt relaties die niet alleen diep maar ook duurzaam zijn. Liefde is voor jou geen chaos maar een archief architectuurproject.',
    shadow: 'Structuur kan de spontaniteit van liefde doden. De Magician fluistert: de beste relaties laten ruimte voor magie.',
  },
  LOVER_SPIRIT: {
    name: 'The Companion',
    subtitle: 'Lover + Spirit',
    combination: 'De Metgezel is de Minnaar die verbinding ervaart als een spirituele praktijk. Elke relatie is een reis naar het goddelijke in de ander. Je liefde transcendeert het fysieke zonder het te ontkennen.',
    shadow: 'Spiritueel bypass kan echte intimiteit vermijden. De Magician herinnert je: het heiligste is het meest menselijke.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // ARTIST — Main Archetype
  // ═══════════════════════════════════════════════════════════════════
  ARTIST_CREATIVE: {
    name: 'The Demiurge',
    subtitle: 'Artist + Creative',
    combination: 'De Demiurg is de schepper in zijn puurste vorm — de Kunstenaar versterkt door de volle kracht van de Creative-groep. Je maakt niet uit noodzaak maar uit een kosmische drang om te scheppen. Creatie is je bestaansreden.',
    shadow: 'Scheppingsdrang kan obsessie worden. De Judge herinnert je dat niet alles wat je maakt de wereld nodig heeft — en dat is oké.',
  },
  ARTIST_WISDOM: {
    name: 'The Visionary',
    subtitle: 'Artist + Wisdom',
    combination: 'De Visionair ziet wat anderen niet zien — patronen in de chaos, schoonheid in het onzichtbare. De Kunstenaar geeft vorm aan wat de Wisdom-groep doorleef. Je bent de brug tussen het abstracte en het tastbare.',
    shadow: 'Visioenen zonder grounding zijn hallucinaties. De Judge herinnert je: een visioen dat niet getoetst wordt aan de werkelijkheid is een illusie.',
  },
  ARTIST_ACTION: {
    name: 'The Engineer',
    subtitle: 'Artist + Action',
    combination: 'De Ingenieur combineert creatief denken met de doelgerichtheid van de Action-groep. Je bouwt niet dromen — je bouwt bruggen. Elke creatie heeft een functie, elke functie heeft elegantie.',
    shadow: 'Functionaliteit kan schoonheid doden. De Judge fluistert: niet alles hoeft nuttig te zijn om waardevol te zijn.',
  },
  ARTIST_RELATIONAL: {
    name: 'The Storyteller',
    subtitle: 'Artist + Relational',
    combination: 'De Verteller verbindt mensen door verhalen. De Kunstenaar geeft vorm, de Relational-groep geeft het verhaal een hart. Elk verhaal dat je vertelt is een brug tussen jou en je luisteraar.',
    shadow: 'Verhalen kunnen een masker worden. De Judge herinnert je: het eerlijkste verhaal is soms stilte.',
  },
  ARTIST_RULING: {
    name: 'The Architect',
    subtitle: 'Artist + Ruling',
    combination: 'De Architect combineert creatieve visie met de structurerende kracht van de Ruling-groep. Je ontwerpt niet alleen schoonheid — je ontwerpt systemen die schoonheid mogelijk maken. Orde is je canvas.',
    shadow: 'Rigide ontwerpen laten geen ruimte voor het onverwachte. De Judge fluistert: de beste architectuur stuurt het water, maar laat het stromen.',
  },
  ARTIST_SPIRIT: {
    name: 'The Dreamer',
    subtitle: 'Artist + Spirit',
    combination: 'De Dromer leeft op de grens van werkelijkheid en verbeelding. De Kunstenaar schept, de Spirit-groep verdiept die schepping tot iets dat de ziel raakt. Je kunst is niet decoratie — het is een portaal.',
    shadow: 'Dromen kunnen een vlucht worden uit de werkelijkheid. De Judge herinnert je: de krachtigste dromen worden vertaald in actie.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // RULER — Main Archetype
  // ═══════════════════════════════════════════════════════════════════
  RULER_RULING: {
    name: 'The Emperor',
    subtitle: 'Ruler + Ruling',
    combination: 'De Keizer is de Heerser in zijn volle glorie — autoriteit versterkt door de Ruling-groep. Je bouwt koninkrijken niet voor macht maar voor orde. Structuur is je liefde, systeem je nalatenschap.',
    shadow: 'Absolute macht corrumpeert absoluut. De Outlaw herinnert je: de beste sterft als eerste als het systeem verstijft.',
  },
  RULER_WISDOM: {
    name: 'The Philosopher-King',
    subtitle: 'Ruler + Wisdom',
    combination: 'De Filosoof-Koning regeert niet door kracht maar door wijsheid. De Heerser biedt structuur, de Wisdom-groep vult die structuur met diepgang en ethiek. Je bent de leider naar wie de wijzen opkijken.',
    shadow: 'Filosoferen kan een excuus worden om niet te handelen. De Outlaw fluistert: soms moet je de troon van de denker verlaten en de straat op gaan.',
  },
  RULER_ACTION: {
    name: 'The Conqueror',
    subtitle: 'Ruler + Action',
    combination: 'De Veroveraar combineert bestuurskracht met de actiedrang van de Action-groep. Je breidt grenzen uit, niet door diplomatie maar door daden. Elke grens is een uitnodiging om te overschrijden.',
    shadow: 'Niet elke grens hoeft verlegd te worden. De Outlaw herinnert je: ware vrijheid is soms accepteren wat is.',
  },
  RULER_RELATIONAL: {
    name: 'The Patriarch',
    subtitle: 'Ruler + Relational',
    combination: 'De Patriarch/Matriarch bestuurt via verbinding. De Heerser biedt structuur, de Relational-groep vult die structuur met warmte en zorg. Je bouwt dynastieën op fundament van liefde.',
    shadow: 'Familiebanden kunnen een gevangenis worden. De Outlaw fluistert: de gezondste families laten hun leden vrij.',
  },
  RULER_CREATIVE: {
    name: 'The Entrepreneur',
    subtitle: 'Ruler + Creative',
    combination: 'De Ondernemer combineert bestuurlijke visie met creatieve innovatie. Je bouwt niet wat al bestaat — je creëert nieuwe markten, nieuwe mogelijkheden, nieuwe werelden. Orde en chaos zijn je grondstoffen.',
    shadow: 'Disruptie zonder verantwoordelijkheid is destructie. De Outlaw herinnert je: breek alleen af wat je bereid bent beter op te bouwen.',
  },
  RULER_SPIRIT: {
    name: 'The Sovereign',
    subtitle: 'Ruler + Spirit',
    combination: 'De Soeverein regeert vanuit innerlijke koningschap. De Heerser biedt externe structuur, de Spirit-groep verankert die structuur in spiritueel gezag. Je leidt niet door controle maar door aanwezigheid.',
    shadow: 'Spiritueel leiderschap kan narcisme maskeren. De Outlaw fluistert: de ware soeverein dient, en de schijn-soeverein eist aanbidding.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // INNOCENT — Main Archetype
  // ═══════════════════════════════════════════════════════════════════
  INNOCENT_SPIRIT: {
    name: 'The Saint',
    subtitle: 'Innocent + Spirit',
    combination: 'De Heilige is de Onschuldige in zijn meest transcendente vorm — puriteit versterkt door de Spirit-groep. Je gelooft niet ondanks de wereld, je gelooft doorheen de wereld. Je onschuld is geen naïviteit maar een spirituele keuze.',
    shadow: 'Heiligheid kan een masker worden voor passiviteit. De Explorer herinnert je: de wereld heeft geen heiligen nodig die zich verstoppen, maar die op weg gaan.',
  },
  INNOCENT_WISDOM: {
    name: 'The Disciple',
    subtitle: 'Innocent + Wisdom',
    combination: 'De Discipel leert met open hart en scherpe geest. De Onschuldige brengt ontvankelijkheid, de Wisdom-groep geeft die ontvankelijkheid richting. Je bent de eeuwige student die weet dat niet-weten het begin van alle wijsheid is.',
    shadow: 'Eeuwig leerling blijven kan een excuus zijn om nooit verantwoordelijkheid te nemen. De Explorer herinnert je: op een gegeven moment moet je je eigen pad lopen.',
  },
  INNOCENT_ACTION: {
    name: 'The Pioneer',
    subtitle: 'Innocent + Action',
    combination: 'De Pionier combineert de onbevangenheid van de Onschuldige met de daadkracht van de Action-groep. Je gaat de wereld in zonder bagage, zonder vooroordelen — alleen met moed en vertrouwen. Ieder begin is voor jou een avontuur.',
    shadow: 'Naïeve actie kan gevaarlijk zijn. De Explorer fluistert: enthousiasme zonder ervaring is een recept voor pijn — maar ook voor groei.',
  },
  INNOCENT_RELATIONAL: {
    name: 'The Child',
    subtitle: 'Innocent + Relational',
    combination: 'Het Kind combineert de puriteit van de Onschuldige met de verbindingskracht van de Relational-groep. Je bent de persoon in de kamer die iedereen onmiddellijk vertrouwt — en die dat vertrouwen meestal verdient. Je herinnert anderen aan hun eigen goedheid.',
    shadow: 'Kinderlijke openheid kan uitgebuit worden. De Explorer herinnert je: groei betekent soms grenzen leren stellen zonder je openheid te verliezen.',
  },
  INNOCENT_CREATIVE: {
    name: 'The Utopian',
    subtitle: 'Innocent + Creative',
    combination: 'De Utopist droomt van een betere wereld en heeft de creatieve kracht om die droom vorm te geven. De Onschuldige gelooft dat het beter kan; de Creative-groep geeft dat geloof handen en voeten.',
    shadow: 'Utopieën die de menselijke natuur ontkennen worden dystopieën. De Explorer herinnert je: de perfecte wereld bestaat in het omarmen van imperfectie.',
  },
  INNOCENT_RULING: {
    name: 'The Traditionalist',
    subtitle: 'Innocent + Ruling',
    combination: 'De Traditionalist combineert de puriteit van de Onschuldige met de orde van de Ruling-groep. Je gelooft in structuren die werken, in tradities die bewijzen dat goedheid mogelijk is. Het verleden is voor jou geen gevangenis maar een fundament.',
    shadow: 'Traditie kan verstarring worden. De Explorer fluistert: de gezondste tradities evolueren mee met de wereld.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // EXPLORER — Main Archetype
  // ═══════════════════════════════════════════════════════════════════
  EXPLORER_WISDOM: {
    name: 'The Navigator',
    subtitle: 'Explorer + Wisdom',
    combination: 'De Navigator combineert de ontdekkingsdrang van de Explorer met de diepgang van de Wisdom-groep. Je verkent niet blind — je navigeert met inzicht en kompas. Elke route die je uitstippelt is een bewuste keuze, geïnformeerd door kennis, ervaring en intuïtie.',
    shadow: 'Te veel nadenken voor je handelt kan je verlammen. De Innocent herinnert je: soms is de beste ontdekking die welke je doet zonder kaart.',
  },
  EXPLORER_ACTION: {
    name: 'The Wanderer',
    subtitle: 'Explorer + Action',
    combination: 'De Zwerver leeft op de weg — de Explorer aangedreven door de pure actiekracht van de Action-groep. Stilstaan is geen optie; de horizon is altijd je volgende doel. Vrijheid is je zuurstof.',
    shadow: 'Eeuwig bewegen kan een vlucht zijn voor commitment. De Innocent herinnert je: de moedigste reis is soms ergens blijven.',
  },
  EXPLORER_RELATIONAL: {
    name: 'The Networker',
    subtitle: 'Explorer + Relational',
    combination: 'De Netwerker verkent de wereld via menselijke verbinding. De Explorer ontdekt; de Relational-groep maakt van elke ontmoeting een blijvende connectie. Je bouwt bruggen tussen werelden die niet wisten dat ze bestonden.',
    shadow: 'Netwerken kan oppervlakkig worden. De Innocent fluistert: de diepste connectie vereist kwetsbaarheid, niet alleen charme.',
  },
  EXPLORER_CREATIVE: {
    name: 'The Innovator',
    subtitle: 'Explorer + Creative',
    combination: 'De Innovator ziet mogelijkheden waar anderen grenzen zien. De Explorer verlegt grenzen; de Creative-groep geeft dat verleggen een creatieve dimensie. Elke ontdekking wordt een uitvinding.',
    shadow: 'Innovatie zonder doel is chaos. De Innocent herinnert je: de krachtigste innovatie dient de eenvoud, niet de complexiteit.',
  },
  EXPLORER_RULING: {
    name: 'The Scout',
    subtitle: 'Explorer + Ruling',
    combination: 'De Verkenner combineert ontdekkingsdrang met strategisch overzicht van de Ruling-groep. Je verkent niet voor jezelf — je verkent voor het team. Elke kaart die je tekent, elke route die je vindbaar maakt, dient het collectief.',
    shadow: 'Verkenning in opdracht verliest zijn spontaniteit. De Innocent herinnert je: de beste ontdekkingen zijn ongepland.',
  },
  EXPLORER_SPIRIT: {
    name: 'The Scholar',
    subtitle: 'Explorer + Spirit',
    combination: 'De Geleerde is de Explorer die zijn reizen naar binnen richt. De Spirit-groep geeft de ontdekkingsdrang een transcendent karakter — je verkent niet alleen nieuwe plekken maar nieuwe staten van bewustzijn.',
    shadow: 'Innerlijke reizen kunnen een excuus worden om de buitenwereld te vermijden. De Innocent fluistert: de meest verlichte ontdekker is degene die ook op straat loopt.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // OUTLAW — Main Archetype
  // ═══════════════════════════════════════════════════════════════════
  OUTLAW_ACTION: {
    name: 'The Anarchist',
    subtitle: 'Outlaw + Action',
    combination: 'De Anarchist is de Rebel in actie — vernietiging als creatieve daad. Je breekt niet uit woede maar uit overtuiging. Elke structuur die je omverwerpt maakt ruimte voor iets beters. Chaos is je gereedschap.',
    shadow: 'Vernietiging zonder bouwplan is nihilisme. De Ruler herinnert je: ware revolutie bouwt terwijl ze breekt.',
  },
  OUTLAW_WISDOM: {
    name: 'The Iconoclast',
    subtitle: 'Outlaw + Wisdom',
    combination: 'De Beeldenstormer combineert rebellie met diep inzicht. De Rebel breekt; de Wisdom-groep weet precies wát en waaróm. Je vernietigt geen systemen — je ontmaskert illusies. Waarheid is je wapen.',
    shadow: 'Kritiek zonder alternatief is cynisme. De Ruler fluistert: de wijste rebel biedt een beter verhaal, niet alleen een betere analyse.',
  },
  OUTLAW_RELATIONAL: {
    name: 'The Liberator',
    subtitle: 'Outlaw + Relational',
    combination: 'De Bevrijder zet de Rebel-energie in voor de ander. De Relational-groep richt de rebellie op onderdrukking in menselijke relaties. Je vecht niet voor jezelf — je vecht voor de vrijheid van de mensen om je heen.',
    shadow: 'Bevrijding opleggen is een contradictie. De Ruler herinnert je: ware vrijheid kan alleen gekozen worden, niet geschonken.',
  },
  OUTLAW_CREATIVE: {
    name: 'The Provocateur',
    subtitle: 'Outlaw + Creative',
    combination: 'De Provocateur combineert rebellie met creatieve expressie. De Rebel valt aan; de Creative-groep maakt van die aanval kunst. Je schokt niet om te shockeren — je schokt om te wekken.',
    shadow: 'Provocatie kan een verslaving worden. De Ruler fluistert: de krachtigste kunst provoceert het hart, niet het ego.',
  },
  OUTLAW_RULING: {
    name: 'The Reformer',
    subtitle: 'Outlaw + Ruling',
    combination: 'De Hervormer is de paradoxale Rebel die het systeem verandert van binnenuit. De Ruling-groep geeft de Rebel-energie structuur. Je breekt niet af — je herbouwt. Revolutie met een blauwdruk.',
    shadow: 'Het systeem dat je hervormt kan je absorberen. De Ruler fluistert: de gevaarlijkste val is de troon die je ooit wilde omverwerpen.',
  },
  OUTLAW_SPIRIT: {
    name: 'The Revolutionary',
    subtitle: 'Outlaw + Spirit',
    combination: 'De Revolutionair vecht voor een hogere zaak. De Rebel levert de kracht; de Spirit-groep geeft die kracht een ziel. Je rebelleert niet tegen mensen maar tegen onrecht — met de overtuiging dat een betere wereld mogelijk is.',
    shadow: 'Heilige woede kan fanatisme worden. De Ruler herinnert je: de ware revolutionair kent genade.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // CAREGIVER — Main Archetype
  // ═══════════════════════════════════════════════════════════════════
  CAREGIVER_RELATIONAL: {
    name: 'The Healer',
    subtitle: 'Caregiver + Relational',
    combination: 'De Genezer is de Verzorger in zijn diepste relationale vorm. De Relational-groep versterkt de zorgcapaciteit tot genezende kracht. Je heelt niet alleen wonden — je heelt verbindingen. Aanraking is je medicijn.',
    shadow: 'Anderen genezen kan een vlucht zijn van je eigen pijn. De Hero herinnert je: je kunt pas helen als je je eigen wonden erkent.',
  },
  CAREGIVER_WISDOM: {
    name: 'The Therapist',
    subtitle: 'Caregiver + Wisdom',
    combination: 'De Therapeut combineert de zorg van de Verzorger met het inzicht van de Wisdom-groep. Je troost niet alleen — je begrijpt de oorzaak van de pijn. Compassie gecombineerd met analyse maakt je een katalysator voor werkelijke genezing.',
    shadow: 'Objectiviteit kan empathie verdrinken. De Hero herinnert je: soms is een warm hart belangrijker dan een scherp verstand.',
  },
  CAREGIVER_ACTION: {
    name: 'The Protector',
    subtitle: 'Caregiver + Action',
    combination: 'De Beschermer is de Verzorger die opstaat en handelt. De Action-groep transformeert zorg in directe beschermende actie. Je vecht niet voor roem — je vecht voor de veiligheid van degenen die je liefhebt.',
    shadow: 'Bescherming kan verstikking worden. De Hero fluistert: soms is het moedigste wat je kunt doen de ander loslaten.',
  },
  CAREGIVER_CREATIVE: {
    name: 'The Cultivator',
    subtitle: 'Caregiver + Creative',
    combination: 'De Cultivator combineert zorgen met scheppend vermogen. De Creative-groep geeft de Verzorger het vermogen om groei te ontwerpen. Je plant zaden — in tuinen, in mensen, in gemeenschappen — en je wacht geduldig tot ze bloeien.',
    shadow: 'Niet alles wat je plant zal bloeien. De Hero herinnert je: soms is loslaten de meest creatieve daad van zorg.',
  },
  CAREGIVER_RULING: {
    name: 'The Advocate',
    subtitle: 'Caregiver + Ruling',
    combination: 'De Pleitbezorger combineert zorg met bestuurlijke kracht. De Ruling-groep geeft compassie een systeem. Je bouwt zorgsystemen die generaties overleven — van hospitalen tot gemeenschappen. Je vecht voor de rechten van degenen die je beschermt.',
    shadow: 'Institutionele zorg kan zijn menselijkheid verliezen. De Hero fluistert: het beste systeem ter wereld kan nooit een warm hart vervangen.',
  },
  CAREGIVER_SPIRIT: {
    name: 'The Samaritan',
    subtitle: 'Caregiver + Spirit',
    combination: 'De Samaritaan bewaakt niet het fysieke maar het geestelijke welzijn. De Spirit-groep geeft de Verzorger een transcendente dimensie — je helpt zonder voorwaarden, zonder verwachting van beloning. Zuivere onbaatzuchtigheid is je kracht.',
    shadow: 'Onvoorwaardelijke zorg kan zelfverwaarlozing worden. De Hero herinnert je: de beste samaritaan zorgt ook voor zichzelf.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // MAGICIAN — Main Archetype
  // ═══════════════════════════════════════════════════════════════════
  MAGICIAN_CREATIVE: {
    name: 'The Illusionist',
    subtitle: 'Magician + Creative',
    combination: 'De Illusionist is de Magiër in zijn meest creatieve manifestatie. De Creative-groep versterkt het transformatieve vermogen tot scheppingskracht. Je creëert werelden die anderen niet kunnen onderscheiden van de werkelijkheid — illusie als kunst, perceptie als speelveld.',
    shadow: 'Ongecontroleerde creatieve magie is chaos. De Lover herinnert je: de krachtigste magie komt voort uit liefde, niet uit wil.',
  },
  MAGICIAN_WISDOM: {
    name: 'The Shaman',
    subtitle: 'Magician + Wisdom',
    combination: 'De Sjamaan combineert transformatief vermogen met diep inzicht. De Wisdom-groep geeft de Magiër een analytisch fundament. Je reist tussen werelden — de fysieke en de onzichtbare — en vertaalt wat je vindt.',
    shadow: 'Paranormale claims zonder onderbouwing zijn zelfbedrog. De Lover fluistert: de meest authentieke sjamaan dient in nederigheid.',
  },
  MAGICIAN_ACTION: {
    name: 'The Forgemaster',
    subtitle: 'Magician + Action',
    combination: 'De Forgemaster is de Magiër die niet wacht tot transformatie vanzelf komt — hij smeedt haar met wilskracht en vuur. De Action-groep geeft de Magiër momentum en slagkracht. Je bent de smid van de werkelijkheid, de vonk die materie hervormt tot iets machtigs.',
    shadow: 'Niet elke creatie verdient te bestaan. De Lover herinnert je: soms is het magischer om te accepteren wat is dan om het te hersmeden.',
  },
  MAGICIAN_RELATIONAL: {
    name: 'The Enchanter',
    subtitle: 'Magician + Relational',
    combination: 'De Betoverer combineert transformatief vermogen met de kracht van verbinding. De Relational-groep richt de magie op menselijke relaties. Je transformeert niet de wereld — je transformeert de manier waarop mensen naar elkaar kijken.',
    shadow: 'Betovering kan manipulatie worden. De Lover herinnert je: ware verbinding vereist eerlijkheid, niet magie.',
  },
  MAGICIAN_RULING: {
    name: 'The Oracle',
    subtitle: 'Magician + Ruling',
    combination: 'Het Orakel combineert transformatieve kracht met het vermogen om systemen te doorgronden en te voorspellen. De Ruling-groep geeft de Magiër structureel overzicht. Je ziet niet alleen wat is — je ziet wat komen gaat, en je bouwt de structuren die de toekomst vormgeven.',
    shadow: 'Voorspelling kan controle maskeren. De Lover fluistert: de krachtigste profetie is er een die ruimte laat voor liefde en verrassing.',
  },
  MAGICIAN_SPIRIT: {
    name: 'The Sorcerer',
    subtitle: 'Magician + Spirit',
    combination: 'De Tovenaar is de Magiër in zijn meest transcendente vorm — de Spirit-groep verdiept de magie tot iets dat de ziel raakt. Je transformeert niet de materie maar het bewustzijn. Innerlijke alchemie is je domein.',
    shadow: 'Spirituele magie zonder grounding is waanzin. De Lover herinnert je: de meest krachtige magie is een oprecht gebaar van liefde.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // JUDGE — Main Archetype
  // ═══════════════════════════════════════════════════════════════════
  JUDGE_RULING: {
    name: 'The Arbiter',
    subtitle: 'Judge + Ruling',
    combination: 'De Arbiter is de Rechter op zijn troon — beoordelingsvermogen versterkt door de structuur van de Ruling-groep. Je beslist niet impulsief; elke uitspraak draagt het gewicht van een systeem. Rechtvaardigheid is je architectuur.',
    shadow: 'Onwrikbare rechtspraak wordt tirannie. De Artist herinnert je: de beste wetten hebben ruimte voor nuance en schoonheid.',
  },
  JUDGE_WISDOM: {
    name: 'The Critic',
    subtitle: 'Judge + Wisdom',
    combination: 'De Criticus combineert beoordelingsvermogen met de diepgang van de Wisdom-groep. Je oordeelt niet oppervlakkig — je analyseert de wortels. Elk oordeel is een bijdrage aan begrip, niet een afrekening.',
    shadow: 'Kritiek kan een schild worden tegen kwetsbaarheid. De Artist fluistert: de moedigste kritiek is zelfkritiek.',
  },
  JUDGE_ACTION: {
    name: 'The Avenger',
    subtitle: 'Judge + Action',
    combination: 'De Wreker is de Rechter die niet alleen oordeelt maar ook handelt. De Action-groep geeft het oordeel kracht. Onrecht wordt niet getolereerd — het wordt gecorrigeerd, met kracht als het moet.',
    shadow: 'Gerechtigheid kan wraak maskeren. De Artist herinnert je: de hoogste vorm van rechtvaardigheid is vergeving.',
  },
  JUDGE_RELATIONAL: {
    name: 'The Mediator',
    subtitle: 'Judge + Relational',
    combination: 'De Mediator combineert beoordelingsvermogen met de verbindingskracht van de Relational-groep. Je oordeelt niet om te scheiden maar om te verbinden. Elk conflict dat je oplost is een nieuwe brug.',
    shadow: 'Neutraliteit kan besluiteloosheid worden. De Artist fluistert: soms moet je positie kiezen om werkelijk te verbinden.',
  },
  JUDGE_CREATIVE: {
    name: 'The Evaluator',
    subtitle: 'Judge + Creative',
    combination: 'De Evaluator combineert beoordelingsvermogen met creatieve visie. De Creative-groep geeft de Rechter een esthetisch oog. Je beoordeelt niet alleen op effectiviteit — je evalueert op schoonheid, originaliteit en impact. Elk oordeel is een creatieve daad.',
    shadow: 'Eindeloze evaluatie kan besluitvorming verlammen. De Artist herinnert je: soms is het beter om te scheppen dan te beoordelen.',
  },
  JUDGE_SPIRIT: {
    name: 'The Shepherd',
    subtitle: 'Judge + Spirit',
    combination: 'De Herder is de Rechter die oordeelt met een spirituele kompas. De Spirit-groep geeft het beoordelingsvermogen een transcendente dimensie. Je leidt je kudde niet door te dwingen maar door het juiste pad te wijzen — met wijsheid, geduld en onwankelbaar moreel gezag.',
    shadow: 'Spiritueel leiderschap kan paternalisme worden. De Artist herinnert je: de ware herder luistert ook naar zijn schapen.',
  },

  // ═══════════════════════════════════════════════════════════════════
  // TRICKSTER — Main Archetype
  // ═══════════════════════════════════════════════════════════════════
  TRICKSTER_SPIRIT: {
    name: 'The Fool',
    subtitle: 'Trickster + Spirit',
    combination: 'De Dwaas is de kosmische grappenmaker — de Nar versterkt door de Spirit-groep. Je dwaasheid is geen zwakte maar wijsheid in vermomming. De Fool weet dat het bestaan absurd is, en omarmt die absurditeit als bevrijding. Lachen is je meditatie, de grap je sutra.',
    shadow: 'Spirituele humor kan nihilisme maskeren. De Sage herinnert je: de diepste grap bevat een kern van waarheid die pijn kan doen.',
  },
  TRICKSTER_WISDOM: {
    name: 'The Comedian',
    subtitle: 'Trickster + Wisdom',
    combination: 'De Komiek combineert de speelsheid van de Nar met het inzicht van de Wisdom-groep. Je ziet het absurde in het serieuze — en maakt het bespreekbaar. Humor is je filosofie, het podium je universiteit.',
    shadow: 'Humor als wapen kan mensen kwetsen. De Sage fluistert: de wijste komiek lacht het hardst om zichzelf.',
  },
  TRICKSTER_ACTION: {
    name: 'The Saboteur',
    subtitle: 'Trickster + Action',
    combination: 'De Saboteur is de Nar die handelt — chaos als strategie. De Action-groep geeft de speelsheid slagkracht. Je bent de wrensch in de machine, de glitch in de matrix die het systeem wakker schudt.',
    shadow: 'Sabotage zonder constructieve bedoeling is destructie. De Sage herinnert je: de krachtigste disruptie biedt een alternatief.',
  },
  TRICKSTER_RELATIONAL: {
    name: 'The Clown',
    subtitle: 'Trickster + Relational',
    combination: 'De Clown verbindt mensen door humor. De Relational-groep richt de speelsheid van de Nar op menselijke relaties. Je maakt niet voor niets grappen — je maakt het leven lichter voor iedereen om je heen.',
    shadow: 'Altijd de clown spelen kan echte intimiteit vermijden. De Sage fluistert: de diepste verbinding ontstaat als je de rode neus even afzet.',
  },
  TRICKSTER_CREATIVE: {
    name: 'The Shapeshifter',
    subtitle: 'Trickster + Creative',
    combination: 'De Gedaantewisselaar combineert de vloeibaarheid van de Nar met de scheppingskracht van de Creative-groep. Je bent nooit hetzelfde tweemaal — elke dag is een nieuwe versie van jezelf. Identiteit is je canvas.',
    shadow: 'Voortdurend veranderen kan een vlucht zijn voor je ware zelf. De Sage herinnert je: de krachtigste metamorfose is trouw blijven aan je kern.',
  },
  TRICKSTER_RULING: {
    name: 'The Jester',
    subtitle: 'Trickster + Ruling',
    combination: 'De Hofnar fluistert waarheid in het oor van de macht. De Ruling-groep geeft de Nar toegang tot de troon. Je bent de enige die de koning de waarheid mag vertellen — vermomd als een grap.',
    shadow: 'Macht via humor kan manipulatief worden. De Sage herinnert je: de ware hofnar dient de waarheid, niet zijn eigen positie aan het hof.',
  },
};

/**
 * Get the extended archetype description for a Main + SupportGroup combination.
 *
 * @param {string} mainKey      – e.g. 'SAGE'
 * @param {string} supportGroup – e.g. 'CREATIVE'
 * @returns {{ name, subtitle, combination, shadow } | null}
 */
export function getExtendedDescription(mainKey, supportGroup) {
  const lookupKey = `${mainKey}_${supportGroup}`;
  return EXTENDED_DESCRIPTIONS[lookupKey] || null;
}

export default EXTENDED_DESCRIPTIONS;
