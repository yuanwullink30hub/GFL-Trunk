/**
 * OCEAN Deep-Dive Core Profiles — 12 Archetypes
 *
 * For each archetype this module provides the full psychological architecture:
 *   - ocean          : Big Five trait levels (O, C, E, A, N)
 *   - workplace      : Superpower + conflict style
 *   - relationships  : Attachment style + shadow trap
 *   - individuation  : Shadow integration path (180° paradox)
 *
 * Archetype Wheel:
 *   1=Judge  2=Lover  3=Caregiver  4=Innocent
 *   5=Explorer  6=Outlaw  7=Trickster  8=Sage
 *   9=Artist  10=Magician  11=Hero  12=Ruler
 */

export const OCEAN_CORE_PROFILES = {

  // ─── 1. De Rechter ───────────────────────────────────────────────────
  JUDGE: {
    key: 'JUDGE',
    position: 1,
    name: 'De Rechter',
    nameEn: 'The Judge',
    group: 'Ruling',
    neuralBasis: 'Central Executive Network (CEN) Dominantie',
    ocean: {
      openness: {
        level: 'Laag tot Gemiddeld',
        description: 'De Rechter vertrouwt op precedenten, logica en vastgelegde ethische kaders. Subjectieve of grillige veranderingen in een systeem worden gewantrouwd.',
      },
      conscientiousness: {
        level: 'Uitzonderlijk Hoog',
        description: 'Dit is de kern; ze zijn uiterst professioneel, integer en rechtvaardig. Ze auditeren situaties tot in de kleinste details om ongeschreven regels en structuren te corrigeren.',
      },
      extraversion: {
        level: 'Laag tot Gemiddeld',
        description: 'Ze zijn de ultieme waarnemers die pas naar voren stappen om een definitief, gezaghebbend oordeel te vellen nadat alle kanten zijn gehoord.',
      },
      agreeableness: {
        level: 'Laag',
        description: 'Waarheid en rechtvaardigheid gaan boven sociale harmonie. Ze kunnen niet worden omgekocht door affectie of geïntimideerd door woede.',
      },
      neuroticism: {
        level: 'Laag naar buiten toe',
        description: 'Ze blijven kalm onder druk, maar ervaren intense interne spanning bij onrecht waar ze geen directe controle over hebben.',
      },
    },
    workplace: {
      role: 'De Ethische Auditor',
      superpower: 'De Rechter bezit een ongeëvenaard onderscheidingsvermogen. Ze bieden morele helderheid in \'grijze gebieden\' en beschermen de organisatie tegen structurele corruptie of integriteitsfouten.',
      conflictStyle: 'De rechtszaal. Conflicten worden opgelost door feiten te verzamelen, emotionele bias te verwijderen en een uitspraak te doen op basis van wat objectief eerlijk is.',
    },
    relationships: {
      style: 'Het Grootboek',
      attachmentStyle: 'Veilig maar Afstandelijk',
      attachmentDescription: 'Ze zijn loyale partners, maar worstelen vaak met het bieden van warme, onvoorwaardelijke emotionele steun.',
      trap: 'Ze kunnen de partner behandelen als een verdachte in een kruisverhoor, waarbij ze vergeten dat menselijke relaties genade en vergeving nodig hebben, niet alleen rechtvaardigheid.',
    },
    individuation: {
      paradox: 'Ernst vs. Absurditeit',
      shadowArchetype: 'TRICKSTER',
      shadowName: 'De Nar',
      shadowPosition: 7,
      neuralSwitch: 'De Rechter zit vaak vast in de \'Aanpak-modus\' (CEN), waar alles serieus, feitelijk en gewichtig is. De \'switch\' naar de Nar activeert het Salience Network om de absurditeit van rigide systemen in te zien.',
      alchemy: 'Individuatie betekent dat je leert dat een oordeel \'objectief eerlijk\' kan zijn, maar toch menselijk lijden kan veroorzaken. Door de relativerende humor en chaos van de Nar toe te laten, voorkom je dat je integriteit verandert in een kil, steriel wapen. Je leert genade mee te wegen in je berekening van rechtvaardigheid.',
    },
  },

  // ─── 2. De Minnaar ──────────────────────────────────────────────────
  LOVER: {
    key: 'LOVER',
    position: 2,
    name: 'De Minnaar',
    nameEn: 'The Lover',
    group: 'Relational',
    neuralBasis: 'Limbic Coupling / Hoge Agreeableness',
    ocean: {
      openness: {
        level: 'Hoog',
        description: 'De Minnaar heeft een diepe waardering voor schoonheid, kunst en rauwe menselijke emoties. Ze staan open voor transformerende interpersoonlijke ervaringen.',
      },
      conscientiousness: {
        level: 'Gemiddeld tot Laag',
        description: 'Rigide structuren en regels zijn ondergeschikt aan menselijke gevoelens. Ze verlaten procedures als deze de harmonie schaden.',
      },
      extraversion: {
        level: 'Hoog',
        description: 'Ze fungeren als de primaire verbinder in sociale omgevingen en halen energie uit emotioneel rijke interacties.',
      },
      agreeableness: {
        level: 'Uitzonderlijk Hoog',
        description: 'Dit is hun definitie; ze bezitten grenzeloze empathie en zien ware overvloed als iets dat uitsluitend binnen relaties bestaat.',
      },
      neuroticism: {
        level: 'Hoog',
        description: 'Hun emotionele basislijn is zeer gevoelig voor de waargenomen afstand van anderen. Ze zijn vatbaar voor jaloezie en verlatingsangst.',
      },
    },
    workplace: {
      role: 'Het Culturele Anker',
      superpower: 'De Minnaar scant een kamer en kent direct de emotionele temperatuur. Ze fungeren als de ultieme verbinder die verschillende facties natuurlijk samenbrengt en collega\'s zich gezien laat voelen.',
      conflictStyle: 'Vermijding of totale aanpassing. Ze zien conflict als een bedreiging voor de verbinding en zullen hun eigen behoeften onderdrukken om de vrede te herstellen.',
    },
    relationships: {
      style: 'De Zoektocht naar Fusie',
      attachmentStyle: 'Angstig-Gepreoccupeerd',
      attachmentDescription: 'Ze monitoren de relatie constant op tekenen van disconnectie. Een vertraagde reactie kan al een paniekrespons triggeren.',
      trap: 'Codependentie: Ze kunnen volledig opgaan in de ander en hun eigen identiteit verliezen om de liefde van de ander maar niet te verliezen.',
    },
    individuation: {
      paradox: 'Emotie vs. Ratio',
      shadowArchetype: 'SAGE',
      shadowName: 'De Wijze',
      shadowPosition: 8,
      neuralSwitch: 'De Minnaar wordt vaak geregeerd door de \'Reflectie-modus\' van het limbische systeem (emotie). De \'switch\' naar de Wijze activeert de onthechte, analytische DMN-focus.',
      alchemy: 'Individuatie houdt in dat je leert om emotionele afstand te nemen en objectief te blijven zonder je hart te sluiten. Waar de Minnaar wil versmelten, leert de Wijze hem dat ware intimiteit twee afzonderlijke individuen vereist. Je transformeert van een \'emotionele spons\' naar een bewuste navigator die voelt met diepgang, maar handelt met intellectuele helderheid.',
    },
  },

  // ─── 3. De Verzorger ────────────────────────────────────────────────
  CAREGIVER: {
    key: 'CAREGIVER',
    position: 3,
    name: 'De Verzorger',
    nameEn: 'The Caregiver',
    group: 'Relational',
    neuralBasis: 'Limbic Coupling / Hoge Agreeableness',
    ocean: {
      openness: {
        level: 'Gemiddeld',
        description: 'Hun focus is praktisch en mensgericht, minder geïnteresseerd in abstracte theorieën en meer in de tastbare behoeften van mensen.',
      },
      conscientiousness: {
        level: 'Hoog',
        description: 'Ze zijn uitzonderlijk plichtsgetrouw en betrouwbaar. Ze dragen de logistieke lasten van de zorg met een stille, consistente discipline.',
      },
      extraversion: {
        level: 'Gemiddeld',
        description: 'Ze zijn warm en benaderbaar, maar blijven vaak op de achtergrond om de aandacht op degenen te richten die ze helpen.',
      },
      agreeableness: {
        level: 'Uitzonderlijk Hoog',
        description: 'Dit is hun drijfveer; ze bezitten een grenzeloze vrijgevigheid en genezende capaciteit.',
      },
      neuroticism: {
        level: 'Hoog - Geïnternaliseerd',
        description: 'Ze dragen het emotionele gewicht van de wereld. Door hun enorme empathie internaliseren ze het lijden van anderen, wat leidt tot chronische angst en compassiemoeheid.',
      },
    },
    workplace: {
      role: 'Het Voedende Anker',
      superpower: 'Ze bezitten het unieke vermogen om hiërarchieën te scannen op mensen die buiten de boot vallen. Ze zorgen ervoor dat het menselijke element niet verloren gaat in winstmarges.',
      conflictStyle: 'Totale aanpassing. Om anderen geen pijn te doen, negeren ze hun eigen behoeften en absorberen ze de schade zelf.',
    },
    relationships: {
      style: 'De Zelfloze Gever',
      attachmentStyle: 'Angstig-Gepreoccupeerd',
      attachmentDescription: 'Ze vinden hun waarde in het \'nodig zijn\' en zoeken vaak partners die \'gered\' moeten worden.',
      trap: 'Resentment: Omdat ze zoveel geven en zo weinig vragen, raken ze onvermijdelijk leeg. Hun vrijgevigheid kan omslaan in een diepe, stille wrok wanneer hun onuitgesproken behoeften te lang worden genegeerd.',
    },
    individuation: {
      paradox: 'Dienstbaarheid vs. Zelfexpressie',
      shadowArchetype: 'ARTIST',
      shadowName: 'De Kunstenaar',
      shadowPosition: 9,
      neuralSwitch: 'De Verzorger functioneert vanuit de modus van \'zorg voor de ander\' (extern gericht limbisch). De \'switch\' naar de Kunstenaar activeert de DMN-hyperfocus op subjectiviteit en de eigen binnenwereld.',
      alchemy: 'Individuatie betekent dat je erkent dat je eigen ego en subjectieve schoonheid ook bestaansrecht hebben. Je leert dat zelfexpressie geen \'egoïsme\' is, maar een noodzakelijke balans om martelaarschap te voorkomen. Door de visie en impulsen van de Kunstenaar toe te laten, transformeert je zorg van een verplichting naar een bewuste, creatieve daad. Je herstelt de balans tussen het voeden van de wereld en het voeden van je eigen ziel.',
    },
  },

  // ─── 4. De Onschuldige ──────────────────────────────────────────────
  INNOCENT: {
    key: 'INNOCENT',
    position: 4,
    name: 'De Onschuldige',
    nameEn: 'The Innocent',
    group: 'Seeker',
    neuralBasis: 'Hoge Openness / Gebaseerd op vertrouwen',
    ocean: {
      openness: {
        level: 'Hoog in Verwondering / Laag in Realisme',
        description: 'De Onschuldige bezit een grenzeloze hoop en openheid voor de schoonheid van het leven. Ze hebben echter vaak een lage openheid voor de donkere of tragische kanten van de menselijke natuur.',
      },
      conscientiousness: {
        level: 'Gemiddeld tot Hoog',
        description: 'Ze zijn doorgaans zeer volgzaam. Gedreven door de wens om in het \'paradijs\' (veiligheid en goedkeuring) te blijven, vermijden ze corruptie of \'zonde\'.',
      },
      extraversion: {
        level: 'Gemiddeld',
        description: 'Ze stralen een lichte, ongecompliceerde energie uit die mensen aantrekt.',
      },
      agreeableness: {
        level: 'Uitzonderlijk Hoog',
        description: 'Ze opereren op basis van puur vertrouwen en geloven inherent het beste van iedereen.',
      },
      neuroticism: {
        level: 'Pieken bij Crisis',
        description: 'Ze leven meestal in een kalme \'bubbel\', maar wanneer deze wordt doorprikt door verraad of harde realiteit, volgt een totale emotionele ineenstorting naar hulpeloosheid.',
      },
    },
    workplace: {
      role: 'Het Morele Kompas',
      superpower: 'In een cynische werkomgeving fungeert de Onschuldige als anker van licht en optimisme. Ze veren op na tegenslagen met een bijna kinderlijke veerkracht.',
      conflictStyle: 'Vermijding door ontkenning. Ze doen letterlijk alsof een conflict niet bestaat om de illusie van een gelukkig team in stand te houden.',
    },
    relationships: {
      style: 'Het Zuivere Hart',
      attachmentStyle: 'Angstig-leunend',
      attachmentDescription: 'Ze zoeken een \'hof van Eden\' waar ze onvoorwaardelijk kunnen vertrouwen. Ze zijn zeer toegewijd, maar vaak afhankelijk van hun partner voor een gevoel van veiligheid.',
      trap: 'De Eeuwige Ontkenning: Wanneer een partner destructief is, weigert de Onschuldige dit te zien. Ze focussen op de weinige goede momenten om hun \'paradijs\' niet te verliezen.',
    },
    individuation: {
      paradox: 'Acceptatie vs. Transformatie',
      shadowArchetype: 'MAGICIAN',
      shadowName: 'De Magiër',
      shadowPosition: 10,
      neuralSwitch: 'De Onschuldige accepteert de wereld zoals die is (Reflectie-modus). De \'switch\' naar de Magiër activeert de actieve \'Aanpak-modus\' om de realiteit te buigen.',
      alchemy: 'Individuatie betekent dat je leert dat puur vertrouwen pas echt krachtig wordt als het gepaard gaat met de wil om te veranderen. Waar de Onschuldige de realiteit ondergaat, leert de Magiër hem om de realiteit vorm te geven. Je transformeert van een passief slachtoffer van \'het lot\' naar een bewuste schepper die zijn innerlijke zuiverheid gebruikt als blauwdruk voor werkelijke verandering.',
    },
  },

  // ─── 5. De Ontdekker ────────────────────────────────────────────────
  EXPLORER: {
    key: 'EXPLORER',
    position: 5,
    name: 'De Ontdekker',
    nameEn: 'The Explorer',
    group: 'Seeker',
    neuralBasis: 'Hoge Openness / Gebaseerd op beweging',
    ocean: {
      openness: {
        level: 'Uitzonderlijk Hoog',
        description: 'Dit is hun drijfveer. Ze bezitten een diepe nieuwsgierigheid, onafhankelijkheid en een onverzadigbare dorst naar avontuur.',
      },
      conscientiousness: {
        level: 'Laag',
        description: 'Ze verzetten zich hevig tegen routine, conformiteit en gevestigde systemen. Standaard 9-tot-5 schema\'s voelen voor hen als een gevangenis.',
      },
      extraversion: {
        level: 'Gemiddeld tot Hoog, Contextueel',
        description: 'Ze zijn actief en zoeken spanning op, maar dit is vaker gericht op het ervaren van de wereld dan op sociaal contact; ze zijn prima alleen.',
      },
      agreeableness: {
        level: 'Gemiddeld tot Laag',
        description: 'Ze geven prioriteit aan hun eigen vrijheid en authenticiteit boven het bewaren van de lieve vrede.',
      },
      neuroticism: {
        level: 'Getriggerd door Opsluiting',
        description: 'Ze zijn stressbestendig in beweging, maar ervaren extreme rusteloosheid als ze worden gemanaged of vastgezet in een routine.',
      },
    },
    workplace: {
      role: 'De Autonome Pionier',
      superpower: 'De Ontdekker is de perfecte persoon om ongeteste markten te verkennen. Ze navigeren moeiteloos door onbekend terrein buiten de normale hiërarchieën om.',
      conflictStyle: 'Vlucht. Wanneer kantoorpolitiek te verstikkend wordt, neemt de Ontdekker fysiek of emotioneel afstand of neemt ontslag.',
    },
    relationships: {
      style: 'De Rusteloze Zoeker',
      attachmentStyle: 'Afwijzend-Vermijdend',
      attachmentDescription: 'Ze associëren toewijding vaak met gevangenschap. Ze zoeken een co-piloot, geen anker.',
      trap: 'Emotionele Vlucht: Wanneer emotionele intimiteit te \'zwaar\' wordt, boeken ze vaak een soloreis of worden ze onbereikbaar om hun autonomie te beschermen.',
    },
    individuation: {
      paradox: 'Vrijheid vs. Discipline',
      shadowArchetype: 'HERO',
      shadowName: 'De Held',
      shadowPosition: 11,
      neuralSwitch: 'De Ontdekker wil dwalen (Vrije-modus). De \'switch\' naar de Held activeert de laserfocus van de \'Aanpak-modus\'.',
      alchemy: 'Individuatie houdt in dat je ontdekt dat werkelijke vrijheid niet het gebrek aan muren is, maar het vermogen om een doel te kiezen en daarvoor te vechten. Waar de Ontdekker vlucht voor verantwoordelijkheid, leert de Held hem om een \'fortress\' van discipline te bouwen. Je transformeert van een doelloze zwerver naar een doelgerichte navigator die zijn ontdekkingsdrift inzet voor een grotere missie in plaats van pure ontsnapping.',
    },
  },

  // ─── 6. De Rebel ────────────────────────────────────────────────────
  OUTLAW: {
    key: 'OUTLAW',
    position: 6,
    name: 'De Rebel',
    nameEn: 'The Outlaw',
    group: 'Chaos',
    neuralBasis: 'Salience Network / Gebaseerd op disruptie',
    ocean: {
      openness: {
        level: 'Hoog',
        description: 'Ze staan open voor radicale nieuwe paradigma\'s. Om een systeem af te breken, moeten ze het vermogen hebben om een bevrijdend alternatief te visualiseren.',
      },
      conscientiousness: {
        level: 'Laag in conformiteit / Hoog in executie',
        description: 'Ze wijzen maatschappelijke normen resoluut af. Echter, het forceren van verandering vereist vaak een bijna militaire discipline.',
      },
      extraversion: {
        level: 'Gemiddeld tot Hoog',
        description: 'Ze rebelleren niet in stilte; hun disruptie moet gezien en gevoeld worden door het collectief.',
      },
      agreeableness: {
        level: 'Extreem Laag',
        description: 'Harmonie wordt gezien als medeplichtigheid. Ze vervreemden zichzelf liever van de maatschappij dan hun authenticiteit op te offeren.',
      },
      neuroticism: {
        level: 'Hoog - Specifiek Woede/Cynisme',
        description: 'Hun psychologische motor draait op verontwaardiging over systemische corruptie.',
      },
    },
    workplace: {
      role: 'De Systeembreker',
      superpower: 'De Rebel is de ultieme katalysator voor verandering. Waar anderen beleefd door een toxische cultuur navigeren, zal de Rebel de hypocrisie direct en publiekelijk benoemen.',
      conflictStyle: 'Confrontatie en escalatie. Ze willen niet bemiddelen; ze willen de lelijke waarheid blootleggen en de machtsdynamiek radicaal verschuiven.',
    },
    relationships: {
      style: 'De Radicale Waarheidspreker',
      attachmentStyle: 'Afwijzend-Vermijdend',
      attachmentDescription: 'Ze bewaken hun autonomie fel. Traditionele relatievormen (zoals het huwelijk) worden vaak gezien als een valstrik.',
      trap: 'Destructieve Sabotage: Wanneer ze zich gevangen voelen, blazen ze de relatie vaak op met provocaties om hun vrijheid terug te winnen en hun cynisme te bevestigen.',
    },
    individuation: {
      paradox: 'Vernieling vs. Constructie',
      shadowArchetype: 'RULER',
      shadowName: 'De Heerser',
      shadowPosition: 12,
      neuralSwitch: 'De Rebel ziet de fouten in het systeem (Chaos-modus). De \'switch\' naar de Heerser activeert het vermogen om orde en structuur te creëren.',
      alchemy: 'Individuatie betekent dat je erkent dat een revolutie pas geslaagd is als er iets beters voor in de plaats komt. Waar de Rebel alleen wil afbreken, leert de Heerser hem om verantwoordelijkheid te nemen voor wat er uit de as herrijst. Je transformeert van een anarchist die alleen vernietigt naar een soevereine leider die disruptie gebruikt als een noodzakelijk instrument voor evolutie, niet als een einddoel op zich.',
    },
  },

  // ─── 7. De Nar ──────────────────────────────────────────────────────
  TRICKSTER: {
    key: 'TRICKSTER',
    position: 7,
    name: 'De Nar',
    nameEn: 'The Trickster',
    group: 'Chaos',
    neuralBasis: 'Salience Network / Gebaseerd op disruptie',
    ocean: {
      openness: {
        level: 'Uitzonderlijk Hoog',
        description: 'De Nar bezit een vloeiend perspectief op de realiteit en is briljant in het verbinden van ongerelateerde concepten om hiërarchieën te doorbreken.',
      },
      conscientiousness: {
        level: 'Zeer Laag',
        description: 'Zij zijn de antithese van de Heerser; zij verzetten zich tegen schema\'s en regels en zien extreme menselijke ernst als iets inherent absurds.',
      },
      extraversion: {
        level: 'Hoog',
        description: 'Ze zijn performatief en halen energie uit de reactie van een publiek, waarbij ze charisma gebruiken om de emotionele staat van een groep te verschuiven.',
      },
      agreeableness: {
        level: 'Laag tot Gemiddeld',
        description: 'Hoewel ze mensen willen laten lachen, zijn ze bereid te beledigen om het ego van leiders te doorprikken.',
      },
      neuroticism: {
        level: 'Gemaskeerd',
        description: 'Naar buiten toe lijken ze onverstoorbaar, maar humor wordt vaak gebruikt als afweermechanisme om diepe angst of kwetsbaarheid te maskeren.',
      },
    },
    workplace: {
      role: 'De Corporate Jester',
      superpower: 'De Nar doorbreekt paniek in een team met een perfect getimede grap, waardoor de spanning wegvalt en iedereen weer helder kan denken.',
      conflictStyle: 'Afleiding. Ze zullen een grap maken om van onderwerp te veranderen in plaats van de \'saaie\' administratieve realiteit van een conflict onder ogen te zien.',
    },
    relationships: {
      style: 'De Speelse Provocateur',
      attachmentStyle: 'Afwijzend-Vermijdend leunend',
      attachmentDescription: 'Ze zijn magnetisch en leuk om te daten, maar houden partners op afstand omdat echte intimiteit gevaarlijker voelt dan optreden.',
      trap: 'Wrede Humor: In een schaduwstaat kunnen ze scherpe humor gebruiken als wapen om de onzekerheden van hun partner te bespotten onder het mom van "een grapje".',
    },
    individuation: {
      paradox: 'Absurditeit vs. Morele Weging',
      shadowArchetype: 'JUDGE',
      shadowName: 'De Rechter',
      shadowPosition: 1,
      neuralSwitch: 'De Nar drijft de spot met alles (Chaos-modus). De \'switch\' naar de Rechter activeert de CEN-modus voor objectieve evaluatie en morele ernst.',
      alchemy: 'Individuatie houdt in dat je humor niet langer gebruikt om de waarheid te ontwijken, maar om deze te onthullen. De Rechter zorgt ervoor dat de absurditeit van de Nar wordt verankerd in fundamentele waarden. Je transformeert van een clown die alleen voor de lach leeft naar een visionair die humor gebruikt als een chirurgisch instrument om systemische hypocrisie bloot te leggen met een diep gevoel voor integriteit.',
    },
  },

  // ─── 8. De Wijze ────────────────────────────────────────────────────
  SAGE: {
    key: 'SAGE',
    position: 8,
    name: 'De Wijze',
    nameEn: 'The Sage',
    group: 'Abstract',
    neuralBasis: 'Default Mode Network (DMN) Hyper-connectie',
    ocean: {
      openness: {
        level: 'Uitzonderlijk Hoog',
        description: 'De Wijze heeft een diepe behoefte om informatie te consumeren, complexe systemen te begrijpen en filosofische concepten te verkennen.',
      },
      conscientiousness: {
        level: 'Gemiddeld tot Hoog',
        description: 'Ze zijn zeer nauwgezet in hun denken en feitencontrole, maar kunnen lager scoren op uitvoering omdat hun focus op begrijpen ligt, niet op doen.',
      },
      extraversion: {
        level: 'Laag',
        description: 'De Wijze is een interne verwerker die eenzaamheid nodig heeft om data te zeven. Ze geven de voorkeur aan diepe één-op-één uitwisselingen boven groepen.',
      },
      agreeableness: {
        level: 'Laag tot Gemiddeld',
        description: 'Ze waarderen objectieve waarheid boven sociale harmonie en voelen een dwang om feitelijke onjuistheden direct te corrigeren.',
      },
      neuroticism: {
        level: 'Gemiddeld',
        description: 'Stress wordt geïnternaliseerd in de vorm van piekeren. Hun geest blijft eindeloos variabelen berekenen om intellectuele controle te herwinnen.',
      },
    },
    workplace: {
      role: 'De Objectieve Evaluator',
      superpower: 'In tijden van crisis blijft de Wijze kalm. Zij treden terug om data te analyseren en komen vaak met een briljant simpel inzicht dat door de ruis heen snijdt.',
      conflictStyle: 'Academisch debat. Ze proberen alle emoties uit het conflict te strippen en de logische fout in het argument van de tegenpartij te vinden.',
    },
    relationships: {
      style: 'Het Menselijk Laboratorium',
      attachmentStyle: 'Afwijzend-Vermijdend leunend',
      attachmentDescription: 'Ze beschermen hun mentale ruimte fel en trekken zich terug als een partner te "behoeftig" of chaotisch wordt.',
      trap: 'De Koude Observator: Ze behandelen hun partner soms als een fascinerend studieobject in plaats van als een gelijke, waarbij ze de emotionele behoefte aan nabijheid missen door deze rationeel te verklaren.',
    },
    individuation: {
      paradox: 'Observatie vs. Participatie',
      shadowArchetype: 'LOVER',
      shadowName: 'De Minnaar',
      shadowPosition: 2,
      neuralSwitch: 'De Wijze observeert veilig vanuit de DMN-modus. De \'switch\' naar de Minnaar dwingt het brein om het hart en het lichaam in te zetten voor participatie.',
      alchemy: 'Individuatie betekent dat je de angst voor de "onlogische" emotie loslaat. Waar de Wijze onthecht is, leert de Minnaar hem om het leven daadwerkelijk te voelen en te delen. Je transformeert van een eenzame bewoner van een ivoren toren naar een verlichte mentor wiens diepe wijsheid tot leven komt door menselijke verbinding en resonantie.',
    },
  },

  // ─── 9. De Kunstenaar ───────────────────────────────────────────────
  ARTIST: {
    key: 'ARTIST',
    position: 9,
    name: 'De Kunstenaar',
    nameEn: 'The Artist',
    group: 'Abstract',
    neuralBasis: 'Default Mode Network (DMN) Hyper-connectie',
    ocean: {
      openness: {
        level: 'Uitzonderlijk Hoog',
        description: 'De Kunstenaar ervaart de wereld als een canvas van oneindig potentieel en bezit een ongeëvenaarde visie en creatieve alchemie.',
      },
      conscientiousness: {
        level: 'Laag tot Gemiddeld',
        description: 'Zij verzetten zich tegen rigide schema\'s en administratieve taken omdat ze willen creëren zonder filters of restricties.',
      },
      extraversion: {
        level: 'Gemiddeld',
        description: 'Hun extraversie is contextueel; ze hebben isolatie nodig om te creëren, maar worden expressief wanneer ze hun werk delen.',
      },
      agreeableness: {
        level: 'Gemiddeld',
        description: 'Hoewel verbonden met gevoel, kunnen ze koppig en onverzettelijk zijn als het gaat om het compromitteren van hun artistieke visie.',
      },
      neuroticism: {
        level: 'Hoog',
        description: 'Ze voelen de pieken en dalen van het menselijk leven intenser, wat hen kwetsbaar maakt voor emotionele turbulentie en escapisme.',
      },
    },
    workplace: {
      role: 'De Visionaire Alchemist',
      superpower: 'De Kunstenaar ziet potentieel waar anderen een leegte zien. Zij behandelen fouten als onverwachte wendingen die leiden tot prachtige nieuwe creaties.',
      conflictStyle: 'Subjectief. Ze vatten kritiek op hun werk vaak op als een directe kritiek op hun ziel en trekken zich bij stress terug in hun eigen wereld.',
    },
    relationships: {
      style: 'Het Canvas van Intimiteit',
      attachmentStyle: 'Angstig-Vermijdend leunend',
      attachmentDescription: 'Ze verlangen naar diepe inspiratie van hun partner, maar hebben ook enorme hoeveelheden ongestructureerde eenzaamheid nodig om te creëren.',
      trap: 'Projectie: Ze projecteren vaak een geïdealiseerd beeld op hun partner. Wanneer de partner menselijke gebreken vertoont, volgt er een zware desillusie omdat de realiteit niet langer matcht met het beeld in hun hoofd.',
    },
    individuation: {
      paradox: 'Subjectiviteit vs. Zorg voor de ander',
      shadowArchetype: 'CAREGIVER',
      shadowName: 'De Verzorger',
      shadowPosition: 3,
      neuralSwitch: 'De Kunstenaar is verdwaald in de eigen subjectieve binnenwereld (DMN-modus). De \'switch\' naar de Verzorger trekt het brein terug naar de gemeenschap en de zorg voor de ander.',
      alchemy: 'Individuatie betekent dat je leert dat je creativiteit een doel kan dienen dat groter is dan je eigen expressie. De Verzorger herinnert de Kunstenaar aan de verantwoordelijkheid voor zijn medemens. Je transformeert van een egocentrische dromer naar een genezer die esthetiek gebruikt als een middel om anderen te voeden en te ondersteunen, waardoor je werk een diepere maatschappelijke resonantie krijgt.',
    },
  },

  // ─── 10. De Magiër ──────────────────────────────────────────────────
  MAGICIAN: {
    key: 'MAGICIAN',
    position: 10,
    name: 'De Magiër',
    nameEn: 'The Magician',
    group: 'Agency',
    neuralBasis: 'Extraversie & Wilskracht / Actie',
    ocean: {
      openness: {
        level: 'Uitzonderlijk Hoog',
        description: 'De Magiër is gericht op systemen, potentieel en de fundamentele wetten van transformatie. Zij bezitten een visionaire alchemie en het vermogen om de interface van de wereld te veranderen.',
      },
      conscientiousness: {
        level: 'Gemiddeld tot Laag',
        description: 'Ze zijn gefocust op de uitkomst, maar negeren vaak de standaardregels. Ze opereren via \'shortcuts\' en ongeziene dynamieken.',
      },
      extraversion: {
        level: 'Gemiddeld tot Introvert',
        description: 'De Magiër is vaak de "wizard behind the curtain" die liever de dynamiek vanuit de schaduw manipuleert dan vooraan te staan.',
      },
      agreeableness: {
        level: 'Laag tot Gemiddeld',
        description: 'Door hun focus op het veranderen van de realiteit kunnen ze onthecht raken van de directe menselijke gevolgen van hun acties.',
      },
      neuroticism: {
        level: 'Laag naar buiten toe',
        description: 'Ze stralen rust uit omdat ze geloven dat ze elke uitkomst kunnen beïnvloeden, maar ervaren een ineenstorting bij realiteiten die ze absoluut niet kunnen veranderen.',
      },
    },
    workplace: {
      role: 'De Katalysator',
      superpower: 'De Magiër kan een schijnbaar onmogelijke situatie herformuleren en machtsdynamieken verschuiven om een transformatie te forceren.',
      conflictStyle: 'Realiteitsvervorming. Ze veranderen de context van het argument zodat de ander gaat twijfelen aan de eigen perceptie van de feiten.',
    },
    relationships: {
      style: 'De Illusionist',
      attachmentStyle: 'Afwijzend-Vermijdend leunend',
      attachmentDescription: 'Ze zijn captiverend en magnetisch, maar houden vaak een laag van zichzelf ontoegankelijk om de controle over de dynamiek te behouden.',
      trap: 'Het God-complex: Ze kiezen vaak partners die "gered" of getransformeerd moeten worden, waardoor de partner zich eerder een renovatieproject voelt dan een gelijke.',
    },
    individuation: {
      paradox: 'Transformatie vs. Acceptatie',
      shadowArchetype: 'INNOCENT',
      shadowName: 'De Onschuldige',
      shadowPosition: 4,
      neuralSwitch: 'De Magiër is altijd bezig de realiteit te manipuleren (\'Aanpak-modus\'). De \'switch\' naar de Onschuldige activeert de \'Reflectie-modus\' van puur vertrouwen en acceptatie.',
      alchemy: 'Individuatie betekent dat je leert om de controle los te laten. Waar de Magiër de wereld wil buigen, leert de Onschuldige hem om de wereld simpelweg te accepteren zoals die is. Je transformeert van een manipulator naar een bewuste schepper die begrijpt dat ware macht soms voortkomt uit overgave en onvoorwaardelijke rust in het heden.',
    },
  },

  // ─── 11. De Held ────────────────────────────────────────────────────
  HERO: {
    key: 'HERO',
    position: 11,
    name: 'De Held',
    nameEn: 'The Hero',
    group: 'Agency',
    neuralBasis: 'Extraversie & Wilskracht / Actie',
    ocean: {
      openness: {
        level: 'Gemiddeld tot Laag',
        description: 'De Held is pragmatisch en heeft weinig geduld voor eindeloze debatten; ze willen actieplannen en tastbare resultaten.',
      },
      conscientiousness: {
        level: 'Uitzonderlijk Hoog',
        description: 'Dit is hun definitie. Ze zien hun geest en lichaam als gereedschappen die geslepen moeten worden door strikte, vaak afbeulende routines.',
      },
      extraversion: {
        level: 'Hoog',
        description: 'Ze zijn assertief en dominant; bij een crisis stappen ze natuurlijk naar voren om de leiding te nemen.',
      },
      agreeableness: {
        level: 'Laag tot Gemiddeld',
        description: 'Ze zijn competitief en voelen zich comfortabel bij conflict om de overwinning te behalen.',
      },
      neuroticism: {
        level: 'Laag naar buiten toe',
        description: 'Ze hebben een enorme stresstolerantie, maar dit komt vaak door agressieve onderdrukking van angst, wat kan leiden tot plotselinge burn-out.',
      },
    },
    workplace: {
      role: 'De High-Performing Apex',
      superpower: 'De Held bereikt doelen die voor anderen onmogelijk lijken. Ze gebruiken falen als brandstof om te bewijzen dat ze wel kunnen winnen.',
      conflictStyle: 'Confrontatie en besluitvaardigheid. Ze willen niet bemiddelen, ze willen winnen en verwachten dat anderen ook "harder" worden.',
    },
    relationships: {
      style: 'De Gepantserde Beschermer',
      attachmentStyle: 'Afwijzend-Vermijdend leunend',
      attachmentDescription: 'Ze zijn extreem zelfredzaam en weigeren vaak om op hun partner te leunen, omdat ze kwetsbaarheid als zwakte zien.',
      trap: 'De "Fixer": Wanneer een partner emotionele steun nodig heeft, komt de Held direct met een actieplan, terwijl de partner vaak alleen maar gehoord wil worden.',
    },
    individuation: {
      paradox: 'Prestatiedruk vs. Grenzeloos Ontdekken',
      shadowArchetype: 'EXPLORER',
      shadowName: 'De Ontdekker',
      shadowPosition: 5,
      neuralSwitch: 'De Held zit vast in de laserfocus van discipline en doelen (\'Aanpak-modus\'). De \'switch\' naar de Ontdekker activeert de modus van grenzeloze vrijheid en dwalen zonder doel.',
      alchemy: 'Individuatie houdt in dat je ontdekt dat je waarde niet alleen afhangt van wat je presteert. De Ontdekker herinnert de Held eraan dat het soms nodig is om het harnas af te leggen en simpelweg de horizon te verkennen. Je transformeert van een strijder die altijd moet winnen naar een legende die de discipline van de Held combineert met de onbevangen nieuwsgierigheid van de Ontdekker.',
    },
  },

  // ─── 12. De Heerser ─────────────────────────────────────────────────
  RULER: {
    key: 'RULER',
    position: 12,
    name: 'De Heerser',
    nameEn: 'The Ruler',
    group: 'Ruling',
    neuralBasis: 'Central Executive Network (CEN) Dominantie',
    ocean: {
      openness: {
        level: 'Laag tot Gemiddeld',
        description: 'De Heerser is een pragmaticus die de voorkeur geeft aan beproefde systemen en voorspelbare uitkomsten boven radicale ideeën.',
      },
      conscientiousness: {
        level: 'Uitzonderlijk Hoog',
        description: 'Dit is hun kernmerk; ze zijn de ultieme beheerders van tijd, middelen en mensen.',
      },
      extraversion: {
        level: 'Gemiddeld tot Hoog',
        description: 'Ze nemen natuurlijk autoriteit aan en stralen een rustige "executive presence" uit.',
      },
      agreeableness: {
        level: 'Laag tot Gemiddeld',
        description: 'Ze nemen zonder moeite onpopulaire beslissingen voor de stabiliteit van het systeem en waarderen respect boven populariteit.',
      },
      neuroticism: {
        level: 'Laag naar buiten toe',
        description: 'Binnen dit model is het aannemelijk dat het stresspatroon zich manifesteert als een diep gevoel van structurele incompetentie bij anderen — niet het eigen falen, maar het falen van systemen die men verantwoordelijk acht. De Outlaw-Support versterkt dit: wanneer regels worden gebroken zonder reden of autoriteit haar legitimiteit verliest, viert de stressrespons op. Met een uitzonderlijk lage N-score (2) zal deze trigger zelden vuren — maar wanneer hij dat doet, is de respons koel, doelgericht en potentieel langdurig vastgehouden.',
      },
    },
    workplace: {
      role: 'De Soevereine Manager',
      superpower: 'Vanuit dit scoreprofiel is het aannemelijk dat de professionele kernkwaliteit zich uit als het vermogen om systemen te bouwen die zichzelf bevragen. De Ruler-kern levert de architectuur; de Outlaw-Support levert de stresstest. Met een Authenticity Index die sterk Nature-dominant is (met name op de CEN- en Agency-as), opereert deze kwaliteit instinctief — niet nadenken over of een structuur robuust is, maar het voelen. Dit profiel gedijt in organisaties in transitie, bij complexe herstructureringen of waar anderen vastlopen in legacy-systemen.',
      conflictStyle: 'Binnen dit model is het aannemelijk dat conflict benaderd wordt als een correctiemechanisme, niet als emotionele ontlading. Lage A (39) gecombineerd met uitzonderlijk lage N (2) produceert een koelbloedige confrontatiestijl: rustig, doelgericht, zonder zichtbare emotie. De Ruler-Main confronteert via gezag en argumentstructuur; de Outlaw-Support voegt bereidheid toe om regels te breken als de situatie het vraagt. Escalatiepunt: wanneer de ander de structurele logica weigert te erkennen. Ná het conflict: het grootboek wordt bijgehouden, maar niet getoond.',
    },
    relationships: {
      style: 'De Vestingbouwer',
      attachmentStyle: 'Afwijzend-Vermijdend leunend naar Veilig',
      attachmentDescription: 'Dit antwoordprofiel suggereert een relatiedynamiek waarin de architect de ander ruimte geeft — maar wel binnen een kader dat zelf is ontworpen. Hoge E (88) gecombineerd met lage A (39) en lage N (2) creëert een dominant, aantrekkelijk maar onvermurwbaar patroon. De Ruler-Main biedt stabiliteit en richting; de Outlaw-Support maakt je onvoorspelbaar genoeg om fascinerend te blijven.',
      trap: 'De partner ervaart de structuur als veiligheid totdat ze haar beperking voelt. Dit profiel trekt mogelijk mensen aan die vrijheid zoeken — en biedt hen orde.',
    },
    individuation: {
      paradox: 'Absolute Orde vs. Chaos',
      shadowArchetype: 'OUTLAW',
      shadowName: 'De Rebel',
      shadowPosition: 6,
      neuralSwitch: 'De Heerser wordt geregeerd door de drang naar controle en orde (\'CEN-modus\'). De \'switch\' naar de Rebel activeert het Salience Network om systemen die gestold zijn open te breken.',
      alchemy: 'Binnen dit model wijst dit profiel op een individuatiepad waarin de paradox centraal staat: de Ruler die de Outlaw niet vreest, maar hem ook niet volledig loslaat. De spanning tussen Main en Support is hier geen externe frictie maar een intern architectuurprobleem — wanneer is het systeem goed genoeg om los te laten? Het schakelpunt is het moment dat je een structuur vertrouwt zonder haar te controleren. De 180° schaduw-energie van de Outlaw is niet de tegenstander — het is de brandstof die de systemen levend houdt. Het individuatiepad loopt via vertrouwen in onvolmaaktheid.',
    },
  },
};

/**
 * Look up a single core OCEAN profile by archetype key.
 * @param {string} key — e.g. 'SAGE', 'HERO'
 * @returns {object|undefined}
 */
export function getOceanCoreProfile(key) {
  return OCEAN_CORE_PROFILES[key];
}
