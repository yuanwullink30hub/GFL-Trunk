import React, { memo, useEffect, useState, useCallback, useRef } from 'react';
import { useLanguage } from '@gfl/i18n';
import { ARCHETYPES, getArchetypeQuote } from '@gfl/assessment-core';
import { getArchetypeImage } from '@gfl/assessment-core/data/archetypeImages';
import { POLICY_CONTENT } from '../data/policyContent';
import { submitAssessmentReview } from '@gfl/api-client';
import { SciFiButton } from '@gfl/ui';
import { cleanTitle, getSectionAccent, renderMarkdownContent } from '@gfl/utils';
import SciFiRadarChart from '../components/assessment/SciFiRadarChart';
import SubgroupCounters from '../components/assessment/SubgroupCounters';

/**
 * ProfileResultCard â€” loads the admin's own assessment from localStorage
 * and renders a result card matching the AssessmentResultsModal visual.
 */
const MAVERICK_DEFAULT = {
  mainArchetype: 'RULER',
  supportArchetype: 'OUTLAW',
  supportGroup: 'CHAOS',
  extendedArchetype: 'The Maverick',
  harmonyActive: true,
  shadowBonusActive: true,
  shadowArchetype: 'OUTLAW',
  blindspotArchetype: 'TRICKSTER',
};

/**
 * ProfileResultCard â€” renders the user's assessment result.
 * Accepts a `result` prop matching the resultObj shape from AssessmentResultsModal.
 * Falls back to derived MAVERICK_DEFAULT demo data when no prop is provided.
 */
const COG_TRIANGLES = {
  RULER:     { id: 1, mode: 'Idealisme Modus',  color: '#a855f7', members: ['Ruler', 'Innocent', 'Sage'],     networks: 'CEN · Openness · DMN',
    tagline: 'Ik navigeer via principes, visie en structuur.',
    what: 'Mijn aangeleerde cognitieve gedrag organiseert zich rondom het bouwen van systemen die kloppen. Niet alleen praktisch — ook moreel. Ruler, Innocent en Sage vormen samen een driehoek die zoekt naar de ideale orde: een wereld die gehoorzaamt aan beginselen waarvan ik geloof dat ze universeel geldig zijn.',
    drive: 'Aangeleerde navigatie: Mijn Culture picks tonen dat ik heb leren navigeren via autoriteit en visie (Ruler), reinheid en beginseltrouw (Innocent), en kennis als kompas (Sage). Je bouwt mentale architectuur — frameworks, overtuigingen, systemen — als aangeleerde strategie om de chaos te beheersen.',
    high: 'Hoog geel profiel: Hoge gele activatie hier betekent dat ik sterk leef vanuit geleerde regels, idealen en kenniskaders. Ik beoordeel situaties langs de lat van hoe het "zou moeten" zijn. Dit geeft stabiliteit en richting — maar kan ook rigiditeit en teleurstelling opleveren wanneer de werkelijkheid niet aan mijn architectuur voldoet.',
    growth: 'Groeirichting: Duik in de driehoeken die ik het minst activeert — met name Impact Modus (Lover · Outlaw · Magician). Dat is precies het territorium die mijn systemen niet kunnen verklaren: emotionele chaos en blinde disruptie.',
  },
  INNOCENT:  { id: 1, mode: 'Idealisme Modus',  color: '#a855f7', members: ['Ruler', 'Innocent', 'Sage'],     networks: 'CEN · Openness · DMN',
    tagline: 'Ik navigeer via principes, visie en structuur.',
    what: 'Mijn aangeleerde cognitieve gedrag organiseert zich rondom het bouwen van systemen die kloppen. Niet alleen praktisch — ook moreel. Ruler, Innocent en Sage vormen samen een driehoek die zoekt naar de ideale orde: een wereld die gehoorzaamt aan beginselen waarvan ik geloof dat ze universeel geldig zijn.',
    drive: 'Aangeleerde navigatie: Mijn Culture picks tonen dat ik heb leren navigeren via autoriteit en visie (Ruler), reinheid en beginseltrouw (Innocent), en kennis als kompas (Sage). Je bouwt mentale architectuur — frameworks, overtuigingen, systemen — als aangeleerde strategie om de chaos te beheersen.',
    high: 'Hoog geel profiel: Hoge gele activatie hier betekent dat ik sterk leef vanuit geleerde regels, idealen en kenniskaders. Ik beoordeel situaties langs de lat van hoe het "zou moeten" zijn. Dit geeft stabiliteit en richting — maar kan ook rigiditeit en teleurstelling opleveren wanneer de werkelijkheid niet aan mijn architectuur voldoet.',
    growth: 'Groeirichting: Duik in de driehoeken die ik het minst activeert — met name Impact Modus (Lover · Outlaw · Magician). Dat is precies het territorium die mijn systemen niet kunnen verklaren: emotionele chaos en blinde disruptie.',
  },
  SAGE:      { id: 1, mode: 'Idealisme Modus',  color: '#a855f7', members: ['Ruler', 'Innocent', 'Sage'],     networks: 'CEN · Openness · DMN',
    tagline: 'Ik navigeer via principes, visie en structuur.',
    what: 'Mijn aangeleerde cognitieve gedrag organiseert zich rondom het bouwen van systemen die kloppen. Niet alleen praktisch — ook moreel. Ruler, Innocent en Sage vormen samen een driehoek die zoekt naar de ideale orde: een wereld die gehoorzaamt aan beginselen waarvan ik geloof dat ze universeel geldig zijn.',
    drive: 'Aangeleerde navigatie: Mijn Culture picks tonen dat ik heb leren navigeren via autoriteit en visie (Ruler), reinheid en beginseltrouw (Innocent), en kennis als kompas (Sage). Je bouwt mentale architectuur — frameworks, overtuigingen, systemen — als aangeleerde strategie om de chaos te beheersen.',
    high: 'Hoog geel profiel: Hoge gele activatie hier betekent dat ik sterk leef vanuit geleerde regels, idealen en kenniskaders. Ik beoordeel situaties langs de lat van hoe het "zou moeten" zijn. Dit geeft stabiliteit en richting — maar kan ook rigiditeit en teleurstelling opleveren wanneer de werkelijkheid niet aan mijn architectuur voldoet.',
    growth: 'Groeirichting: Duik in de driehoeken die ik het minst activeert — met name Impact Modus (Lover · Outlaw · Magician). Dat is precies het territorium die mijn systemen niet kunnen verklaren: emotionele chaos en blinde disruptie.',
  },
  JUDGE:    { id: 2, mode: 'Exploratie Modus', color: '#3b82f6', members: ['Judge', 'Explorer', 'Artist'],   networks: 'CEN · Openness · DMN',
    tagline: 'Jij navigeert via perceptie, ontdekking en vorm.',
    what: 'Rechter, Ontdekker en Kunstenaar vormen de cognitieve driehoek van verfijning. Je hebt leren navigeren door scherp te analyseren (Judge), grenzen te verleggen (Explorer) en ervaring te vertalen naar expressie (Artist). Dit is het patroon van iemand die de wereld wil begrijpen door haar te doorzoeken — en wat ze vinden willen verwerken tot iets wat méér zegt dan de feiten.',
    drive: 'Je Culture picks activeren een netwerk dat evalueert, verkent en synthetiseert. Je hebt aangeleerd dat begrijpen meer waard is dan accepteren. Je cognitieve motor draait op nieuwsgierigheid en het verlangen om patronen te zien waar anderen ruis zien.',
    high: 'Hoge activatie in deze driehoek betekent dat je een sterke aangeleerde tendens hebt om te beoordelen vóór je handelt, breed te verkennen vóór je kiest, en ervaring te willen distilleren tot iets zinvols. Dit geeft diepgang en oorspronkelijkheid — maar kan leiden tot analyse-verlamming of overprikkeling wanneer de input de verwerkingscapaciteit overstijgt.',
    growth: 'De tegenhanger hier is Engagement Modus (Caregiver · Trickster · Hero) — de driehoek van concrete actie, spelende subversie en directe inzet. Dat is het domein dat jouw verfijnde analyse soms overslaat: het gewoon dóen, het verbinden, het inzetten.',
  },
  EXPLORER: { id: 2, mode: 'Exploratie Modus', color: '#3b82f6', members: ['Judge', 'Explorer', 'Artist'],   networks: 'CEN · Openness · DMN',
    tagline: 'Jij navigeert via perceptie, ontdekking en vorm.',
    what: 'Rechter, Ontdekker en Kunstenaar vormen de cognitieve driehoek van verfijning. Je hebt leren navigeren door scherp te analyseren (Judge), grenzen te verleggen (Explorer) en ervaring te vertalen naar expressie (Artist). Dit is het patroon van iemand die de wereld wil begrijpen door haar te doorzoeken — en wat ze vinden willen verwerken tot iets wat méér zegt dan de feiten.',
    drive: 'Je Culture picks activeren een netwerk dat evalueert, verkent en synthetiseert. Je hebt aangeleerd dat begrijpen meer waard is dan accepteren. Je cognitieve motor draait op nieuwsgierigheid en het verlangen om patronen te zien waar anderen ruis zien.',
    high: 'Hoge activatie in deze driehoek betekent dat je een sterke aangeleerde tendens hebt om te beoordelen vóór je handelt, breed te verkennen vóór je kiest, en ervaring te willen distilleren tot iets zinvols. Dit geeft diepgang en oorspronkelijkheid — maar kan leiden tot analyse-verlamming of overprikkeling wanneer de input de verwerkingscapaciteit overstijgt.',
    growth: 'De tegenhanger hier is Engagement Modus (Caregiver · Trickster · Hero) — de driehoek van concrete actie, spelende subversie en directe inzet. Dat is het domein dat jouw verfijnde analyse soms overslaat: het gewoon dóen, het verbinden, het inzetten.',
  },
  ARTIST:   { id: 2, mode: 'Exploratie Modus', color: '#3b82f6', members: ['Judge', 'Explorer', 'Artist'],   networks: 'CEN · Openness · DMN',
    tagline: 'Jij navigeert via perceptie, ontdekking en vorm.',
    what: 'Rechter, Ontdekker en Kunstenaar vormen de cognitieve driehoek van verfijning. Je hebt leren navigeren door scherp te analyseren (Judge), grenzen te verleggen (Explorer) en ervaring te vertalen naar expressie (Artist). Dit is het patroon van iemand die de wereld wil begrijpen door haar te doorzoeken — en wat ze vinden willen verwerken tot iets wat méér zegt dan de feiten.',
    drive: 'Je Culture picks activeren een netwerk dat evalueert, verkent en synthetiseert. Je hebt aangeleerd dat begrijpen meer waard is dan accepteren. Je cognitieve motor draait op nieuwsgierigheid en het verlangen om patronen te zien waar anderen ruis zien.',
    high: 'Hoge activatie in deze driehoek betekent dat je een sterke aangeleerde tendens hebt om te beoordelen vóór je handelt, breed te verkennen vóór je kiest, en ervaring te willen distilleren tot iets zinvols. Dit geeft diepgang en oorspronkelijkheid — maar kan leiden tot analyse-verlamming of overprikkeling wanneer de input de verwerkingscapaciteit overstijgt.',
    growth: 'De tegenhanger hier is Engagement Modus (Caregiver · Trickster · Hero) — de driehoek van concrete actie, spelende subversie en directe inzet. Dat is het domein dat jouw verfijnde analyse soms overslaat: het gewoon dóen, het verbinden, het inzetten.',
  },
  LOVER:    { id: 3, mode: 'Impact Modus',     color: '#ec4899', members: ['Lover', 'Outlaw', 'Magician'],   networks: 'Limbisch · Salience · Agency',
    tagline: 'Jij navigeert via emotie, disruptie en transformatie.',
    what: 'Minnaar, Outlaw en Magiër vormen de cognitieve driehoek van alchemie. Je hebt leren navigeren door je diep te verbinden (Lover), te doorbreken wat vast zit (Outlaw) en de werkelijkheid actief te her-schrijven (Magician). Dit is het patroon van iemand die verandering niet afwacht — maar haar veroorzaakt door aanwezig te zijn.',
    drive: 'Je Culture picks activeren een netwerk dat voelt, confronteert en transformeert. Je aangeleerde navigatiestijl draait op intensiteit: verbinding als instrument, disruptie als methode, magie als overtuiging dat alles anders kan. Je hebt geleerd dat passiviteit de grootste kostenpost is.',
    high: 'Hoge activatie in Impact Modus betekent dat je sterk reageert vanuit emotionele intensiteit en het verlangen om impact te maken. Je bent aangeleerd om niet te accepteren wat is — maar het te bewegen. Dit geeft transformatieve kracht en magnetische aanwezigheid — maar kan leiden tot uitputting, overdrive of brandend gevoel als de transformatie uitblijft.',
    growth: 'De tegenhanger hier is Idealisme Modus (Ruler · Innocent · Sage) — de driehoek van structuur, principe en kennis. Dat is wat jouw vuur soms mist: het kader dat de energie kanaliseert, het principe dat de richting houdt, de wijsheid die de actie vertraagt.',
  },
  OUTLAW:   { id: 3, mode: 'Impact Modus',     color: '#ec4899', members: ['Lover', 'Outlaw', 'Magician'],   networks: 'Limbisch · Salience · Agency',
    tagline: 'Jij navigeert via emotie, disruptie en transformatie.',
    what: 'Minnaar, Outlaw en Magiër vormen de cognitieve driehoek van alchemie. Je hebt leren navigeren door je diep te verbinden (Lover), te doorbreken wat vast zit (Outlaw) en de werkelijkheid actief te her-schrijven (Magician). Dit is het patroon van iemand die verandering niet afwacht — maar haar veroorzaakt door aanwezig te zijn.',
    drive: 'Je Culture picks activeren een netwerk dat voelt, confronteert en transformeert. Je aangeleerde navigatiestijl draait op intensiteit: verbinding als instrument, disruptie als methode, magie als overtuiging dat alles anders kan. Je hebt geleerd dat passiviteit de grootste kostenpost is.',
    high: 'Hoge activatie in Impact Modus betekent dat je sterk reageert vanuit emotionele intensiteit en het verlangen om impact te maken. Je bent aangeleerd om niet te accepteren wat is — maar het te bewegen. Dit geeft transformatieve kracht en magnetische aanwezigheid — maar kan leiden tot uitputting, overdrive of brandend gevoel als de transformatie uitblijft.',
    growth: 'De tegenhanger hier is Idealisme Modus (Ruler · Innocent · Sage) — de driehoek van structuur, principe en kennis. Dat is wat jouw vuur soms mist: het kader dat de energie kanaliseert, het principe dat de richting houdt, de wijsheid die de actie vertraagt.',
  },
  MAGICIAN: { id: 3, mode: 'Impact Modus',     color: '#ec4899', members: ['Lover', 'Outlaw', 'Magician'],   networks: 'Limbisch · Salience · Agency',
    tagline: 'Jij navigeert via emotie, disruptie en transformatie.',
    what: 'Minnaar, Outlaw en Magiër vormen de cognitieve driehoek van alchemie. Je hebt leren navigeren door je diep te verbinden (Lover), te doorbreken wat vast zit (Outlaw) en de werkelijkheid actief te her-schrijven (Magician). Dit is het patroon van iemand die verandering niet afwacht — maar haar veroorzaakt door aanwezig te zijn.',
    drive: 'Je Culture picks activeren een netwerk dat voelt, confronteert en transformeert. Je aangeleerde navigatiestijl draait op intensiteit: verbinding als instrument, disruptie als methode, magie als overtuiging dat alles anders kan. Je hebt geleerd dat passiviteit de grootste kostenpost is.',
    high: 'Hoge activatie in Impact Modus betekent dat je sterk reageert vanuit emotionele intensiteit en het verlangen om impact te maken. Je bent aangeleerd om niet te accepteren wat is — maar het te bewegen. Dit geeft transformatieve kracht en magnetische aanwezigheid — maar kan leiden tot uitputting, overdrive of brandend gevoel als de transformatie uitblijft.',
    growth: 'De tegenhanger hier is Idealisme Modus (Ruler · Innocent · Sage) — de driehoek van structuur, principe en kennis. Dat is wat jouw vuur soms mist: het kader dat de energie kanaliseert, het principe dat de richting houdt, de wijsheid die de actie vertraagt.',
  },
  CAREGIVER: { id: 4, mode: 'Engagement Modus', color: '#1d9904', members: ['Caregiver', 'Trickster', 'Hero'], networks: 'Limbisch · Salience · Agency',
    tagline: 'Jij navigeert via verbinding, subversie en directe actie.',
    what: 'Verzorger, Trickster en Held vormen de cognitieve driehoek van actieve inzet. Je hebt leren navigeren door te beschermen en te voeden (Caregiver), door spelend te ontregelen (Trickster) en door direct in te grijpen wanneer het ertoe doet (Hero). Dit is het patroon van iemand die niet toekijkt — die zich inmengt, inzet en daadwerkelijk verschijnt.',
    drive: 'Je Culture picks activeren een netwerk dat de ander centraal stelt — zelfs wanneer dat via de achterdeur gaat (Trickster) of via frontale actie (Hero). Je hebt aangeleerd dat betrokkenheid de maatstaf is. Niet wat je weet of wilt — maar wat je doet.',
    high: 'Hoge activatie in Engagement Modus betekent dat je sterk aanwezig bent in de levens van anderen, snel handelt wanneer iemand hulp nodig heeft, en moeite hebt om op afstand te blijven van wat fout gaat. Dit geeft loyaliteit en daadkracht — maar kan leiden tot overbelasting, het dragen van andermans last, of verlies van eigen richting.',
    growth: 'De tegenhanger hier is Exploratie Modus (Judge · Explorer · Artist) — de driehoek van perceptie, ontdekking en expressie. Dat is het domein dat jouw actiegeoriënteerde stijl soms overslaat: de tijd nemen om te beoordelen, te verkennen en iets voor jezelf te maken.',
  },
  TRICKSTER: { id: 4, mode: 'Engagement Modus', color: '#1d9904', members: ['Caregiver', 'Trickster', 'Hero'], networks: 'Limbisch · Salience · Agency',
    tagline: 'Jij navigeert via verbinding, subversie en directe actie.',
    what: 'Verzorger, Trickster en Held vormen de cognitieve driehoek van actieve inzet. Je hebt leren navigeren door te beschermen en te voeden (Caregiver), door spelend te ontregelen (Trickster) en door direct in te grijpen wanneer het ertoe doet (Hero). Dit is het patroon van iemand die niet toekijkt — die zich inmengt, inzet en daadwerkelijk verschijnt.',
    drive: 'Je Culture picks activeren een netwerk dat de ander centraal stelt — zelfs wanneer dat via de achterdeur gaat (Trickster) of via frontale actie (Hero). Je hebt aangeleerd dat betrokkenheid de maatstaf is. Niet wat je weet of wilt — maar wat je doet.',
    high: 'Hoge activatie in Engagement Modus betekent dat je sterk aanwezig bent in de levens van anderen, snel handelt wanneer iemand hulp nodig heeft, en moeite hebt om op afstand te blijven van wat fout gaat. Dit geeft loyaliteit en daadkracht — maar kan leiden tot overbelasting, het dragen van andermans last, of verlies van eigen richting.',
    growth: 'De tegenhanger hier is Exploratie Modus (Judge · Explorer · Artist) — de driehoek van perceptie, ontdekking en expressie. Dat is het domein dat jouw actiegeoriënteerde stijl soms overslaat: de tijd nemen om te beoordelen, te verkennen en iets voor jezelf te maken.',
  },
  HERO:     { id: 4, mode: 'Engagement Modus', color: '#1d9904', members: ['Caregiver', 'Trickster', 'Hero'], networks: 'Limbisch · Salience · Agency',
    tagline: 'Jij navigeert via verbinding, subversie en directe actie.',
    what: 'Verzorger, Trickster en Held vormen de cognitieve driehoek van actieve inzet. Je hebt leren navigeren door te beschermen en te voeden (Caregiver), door spelend te ontregelen (Trickster) en door direct in te grijpen wanneer het ertoe doet (Hero). Dit is het patroon van iemand die niet toekijkt — die zich inmengt, inzet en daadwerkelijk verschijnt.',
    drive: 'Je Culture picks activeren een netwerk dat de ander centraal stelt — zelfs wanneer dat via de achterdeur gaat (Trickster) of via frontale actie (Hero). Je hebt aangeleerd dat betrokkenheid de maatstaf is. Niet wat je weet of wilt — maar wat je doet.',
    high: 'Hoge activatie in Engagement Modus betekent dat je sterk aanwezig bent in de levens van anderen, snel handelt wanneer iemand hulp nodig heeft, en moeite hebt om op afstand te blijven van wat fout gaat. Dit geeft loyaliteit en daadkracht — maar kan leiden tot overbelasting, het dragen van andermans last, of verlies van eigen richting.',
    growth: 'De tegenhanger hier is Exploratie Modus (Judge · Explorer · Artist) — de driehoek van perceptie, ontdekking en expressie. Dat is het domein dat jouw actiegeoriënteerde stijl soms overslaat: de tijd nemen om te beoordelen, te verkennen en iets voor jezelf te maken.',
  },
};
const ALL_COG_TRIANGLES = [
  { id: 1, mode: 'Idealisme Modus',  color: '#a855f7', members: 'Ruler · Innocent · Sage' },
  { id: 2, mode: 'Exploratie Modus', color: '#3b82f6', members: 'Judge · Explorer · Artist' },
  { id: 3, mode: 'Impact Modus',     color: '#f97316', members: 'Lover · Outlaw · Magician' },
  { id: 4, mode: 'Engagement Modus', color: '#1d9904', members: 'Caregiver · Trickster · Hero' },
];

/* ═══ Hardcoded AI analysis sections for the Maverick profile ═══ */
const HARDCODED_SECTIONS = [
  {
    title: 'De Identiteit',
    content: `**The Maverick**

De Maverick combineert de architecturale kracht van de Ruler met de disruptieve eerlijkheid van de Outlaw. Jij bouwt systemen die de wereld kunnen veranderen — en bent tegelijkertijd bereid die systemen te slopen wanneer ze niet meer dienen wat ze zouden moeten dienen.

*Dit is een modelinterpretatie van jouw antwoordprofiel, geen vastgestelde identiteit.*`,
  },
  {
    title: 'Waarom Jij Dit Perspectief Gebruikt',
    content: `Jouw antwoordpatronen suggereren een zeldzame combinatie: de drang om orde te scheppen én de weigering om orde te accepteren die niet op waarheid is gebouwd. Binnen dit model wijst de hoge CEN-dominantie (76% Nature) op een biologisch verankerd vermogen om structuur te zien, te bouwen en te handhaven. Tegelijkertijd activeert de Salience-as (Outlaw/Trickster, 60% Nature) een scherp radar voor wat niet klopt — voor hypocrisie, voor systemen die zichzelf in stand houden ten koste van mensen.

De combinatie van Ruler en Outlaw is geen contradictie. Het is een navigatiestijl: jij bouwt vanuit principes, niet vanuit conventie. Binnen dit model suggereert jouw data dat je gezag erkent wanneer het verdiend is — en het aanvecht wanneer dat niet zo is.`,
  },
  {
    title: 'De Essentie (Main Archetype)',
    content: `**Archetype & Groep:** Ruler | Ruling (CEN — Externe Structuur & Wet)

**TNM-Associatie:** Binnen dit model wordt de Ruler geassocieerd met het Central Executive Network — de verwerkingsmodus die gericht is op externe structuur, hiërarchie en langetermijnarchitectuur.

**Drijfveer:** Primair Nature-gedreven (76% Nature binnen de CEN-as). Vanuit dit scoreprofiel is het aannemelijk dat jouw drang om te leiden en te structureren biologisch verankerd is — geen aangeleerde strategie maar een instinctieve oriëntatie op verantwoordelijkheid.

**Meester Inzicht:** De Ruler functioneert als primaire gedragslens wanneer er iets op het spel staat. Jij ziet de architectuur van een situatie voordat anderen de details zien. Binnen dit model suggereert jouw data dat dit patroon het sterkst actief is onder druk — dat is het moment waarop de Ruler niet reageert maar regeert.`,
  },
  {
    title: 'De Vermenigvuldiging (Support Archetype)',
    content: `**Archetype & Groep:** Outlaw | Chaos (Salience — Disruptie & Waarheid)

**TNM-Associatie:** Binnen dit model wordt de Outlaw geassocieerd met het Salience Network — de verwerkingsmodus die gericht is op wat urgent, authentiek en onaanvaardbaar is.

**Rol:** De Outlaw vult de Ruler niet aan — hij daagt hem uit. Vanuit jouw scoreprofiel is het aannemelijk dat deze spanning productief is: de Ruler bouwt de structuur, de Outlaw test of die structuur de waarheid verdraagt.

**Hardware / Schaduw Check:** Main (Ruler, positie 12) en Support (Outlaw, positie 6) staan op de Paarse Lijn — 180° tegenpolen. Dit is geen hardware-resonantie maar schaduw-integratie. Binnen dit model is het aannemelijk dat jij bewust of onbewust werkt met de spanning tussen bouwen en vernietigen, tussen orde en chaos, tussen institutie en rebellie. Dit is het kernmechanisme van The Maverick.`,
  },
  {
    title: 'De Schaduw',
    content: `Binnen dit model is het opmerkelijk dat jouw Shadow-archetype identiek is aan jouw Support-archetype. Dit suggereert dat jij al actief werkt met de energie van de Outlaw — maar de vraag is of dat bewust gebeurt of als reactie op externe druk.

**De Polarization Index:** Main (Ruler) en Shadow (Outlaw) staan op 180°. Vanuit de scoreverhoudingen is de gap significant — dit wijst op een gezonde maar nog niet volledig geïntegreerde spanning.

De Outlaw als schaduw betekent: de energie van radicale eerlijkheid, van het doorbreken van conventies omwille van waarheid, van het accepteren van verlies als prijs voor integriteit — dit is de brandstof die de Ruler nodig heeft om niet te degenereren tot een systeem dat zichzelf in stand houdt. Binnen dit model is het aannemelijk dat jouw groeipad ligt in het bewust kiezen voor Outlaw-energie, in plaats van er door omstandigheden in gedwongen te worden.`,
  },
  {
    title: 'De Blindspot',
    content: `Vanuit het scoreprofiel is het aannemelijk dat het gedragspatroon van de Trickster — speelsheid, ambiguïteit, het gebruik van humor en indirect taalgebruik als navigatiemiddel — bij anderen onbewust een reactie triggert die jij niet altijd ziet aankomen.

De Trickster opereert in de ruimte tussen regels. Jij, als Ruler-dominant profiel, leest die ruimte als ruis of als onbetrouwbaarheid. Het is aannemelijk dat jij mensen die via indirectheid opereren systematisch onderschat — en dat zij jou als rigide of voorspelbaar lezen, wat hen een strategisch voordeel geeft.

De Rode Lijn genereert geen punten en ontvangt geen bleed. Dit is structurele spanning: de Trickster is niet jouw vijand, maar jouw blinde vlek. Houd er rekening mee dat situaties die om diplomatieke ambiguïteit vragen — onderhandelingen, politieke omgevingen, creatieve chaos — de context zijn waar dit profiel het meeste adaptatie-energie kost.`,
  },
  {
    title: 'Visuele Analyse',
    content: `De radar chart toont een profiel met twee dominante pieken: Ruler en Judge vormen samen een uitgesproken CEN-cluster aan de ordezijde van het wiel. De eerste laag (paars, Nature picks) is sterk geconcentreerd op deze as, met een secundaire piek op de Outlaw-Magician-Hero cluster.

De tweede schil (oranje, Culture picks) waaiert breder uit — met zichtbare activiteit op Trickster, Artist en Sage — wat suggereert dat de aangeleerde strategieën het profiel diversifiëren buiten de biologische kern.

Het dal tussen Trickster en Caregiver is opvallend: hier stroomt geen Green, Blue of Yellow bleed naartoe. Dit is de structurele blindezone van het profiel. De Innocent-score is aanwezig maar laag, wat binnen dit model wijst op beperkte resonantie met naïviteit of onbevangen vertrouwen. De Magician-piek in de Agency-groep is geometrisch interessant: als CultureForce-signaal suggereert het dat de aangeleerde strategie transformationele taal en systeemdenken inzet als primair communicatie-instrument.`,
  },
  {
    title: 'De Alchemie van Individuatie',
    content: `**De Switch:** Vanuit dit scoreprofiel is het aannemelijk dat de schakelbeweging tussen Ruler-modus en Outlaw-modus snel en grotendeels onbewust verloopt. De hoge Nature-percentages op beide assen (76% CEN, 60% Salience) suggereren dat beide modi biologisch beschikbaar zijn — geen van beide vereist significante adaptatie-energie. Het risico is niet dat de switch niet werkt, maar dat hij ongecontroleerd werkt: van structuurbouwer naar systeembreker zonder bewuste keuze.

**Nature vs. Culture Balans:** De Authenticity Index is sterk Nature-dominant. Met name op de Agency-as (Magician/Hero: 90% Nature) en de Limbic-as (Lover/Caregiver: 86% Nature) is de biologische stroom overweldigend. Binnen dit model suggereert dit dat ik grotendeels opereert vanuit instinctieve gedragspatronen — met weinig energieverlies door sociale aanpassing.

**De Paradox:** De spanning tussen Ruler (orde) en Outlaw (disruptie) is niet pathologisch — het is het centrale generatieve principe van dit profiel. De paradox vraagt niet om oplossing maar om bewoning.

**Hardware Resonantie:** De Judge-Ruler hardware-as is sterk actief. Beide groepsleden scoren hoog, wat binnen dit model wijst op een robuust structuurcircuit.

**CultureForce Netwerk:** De Gele Driehoek-activiteit concentreert zich rond Magician, Trickster en Artist — wat suggereert dat het aangeleerde cognitieve netwerk transformationeel en creatief gekleurd is, ondanks de dominante Nature-kern.`,
  },
  {
    title: 'Het Neurale Schakelbord',
    content: `**De Focus-hendel:** Wanneer ik merk dat ik een situatie primair beoordeel op haar structurele tekortkomingen — pauzeer en stel mezelf de vraag: wat werkt hier al? Dit is geen positief denken, maar een bewust activeren van de Ruler-modus vóór de Outlaw het frame overneemt. Als experiment: begin één vergadering per week met een expliciete inventarisatie van wat al functioneert, voordat je je agenda voor verbetering presenteert.

**De Schaduw-injectie:** De Outlaw-energie is al aanwezig in dit profiel — de uitdaging is niet hem te activeren maar hem bewust te richten. Experiment: kies één systeem of afspraak in mijn omgeving die ik al lang als inefficiënt ervaar maar nooit hebt aangevochten. Schrijf in drie zinnen op waarom je het hebt laten bestaan. Dit opent de vraag of de Outlaw hier brandstof levert of comfort beschermt.

**De Blindspot-check:** Let deze week op momenten waarop ik iemand als 'onserious' of 'onbetrouwbaar' ervaar. Stel jezelf de reflectievraag: wat probeert deze persoon te communiceren via de indirecte route die ik niet zie? De Trickster-blindspot manifesteert zich vaak als ongeduld met mensen die spelen waar jij werkt.`,
  },
  {
    title: 'Ontologische Evolutie',
    content: `**Richting het Centrum:** Vanuit jouw scoreprofiel is het aannemelijk dat de meest vruchtbare beweging richting balans niet ligt in het temperen van de Ruler of de Outlaw — maar in het bewust verbinden van beide. De extreme uitslagen aan de CEN-kant (Judge + Ruler samen dominant) kunnen richting meer balans bewegen door de DMN-as (Sage, Artist) bewust te voeden: reflectie, abstractie, het loslaten van de uitkomst.

**Ontologische Vraag:** Wanneer je een systeem hebt gebouwd dat werkt — wie ben jij dan nog?

Deze vraag raakt de kern van de Maverick-paradox: identiteit die gebonden is aan het bouwen van orde heeft een existentieel probleem wanneer de orde er is. Het individuatiepad van dit profiel loopt via de ontdekking dat de waarde niet in het systeem zit — maar in de intentie waarmee het gebouwd werd.

**AI Agent Prompt:** Zie Sectie 11.`,
  },
  {
    title: 'Neuroticisme Trigger',
    content: `Binnen dit model is het aannemelijk dat mijn stresspatroon zich manifesteert als een diep gevoel van structurele incompetentie bij anderen — niet mijn eigen falen, maar het falen van systemen die ik verantwoordelijk acht. De Outlaw-Support versterkt dit: wanneer regels worden gebroken zonder reden of autoriteit haar legitimiteit verliest, viert de stressrespons op. Met een uitzonderlijk lage N-score (2) zal deze trigger zelden vuren — maar wanneer hij dat doet, is de respons koel, doelgericht en potentieel langdurig vastgehouden.`,
  },
  {
    title: 'Superkracht op de Werkvloer',
    content: `Vanuit dit scoreprofiel is het aannemelijk dat mijn professionele kernkwaliteit zich uit als het vermogen om *systemen te bouwen die zichzelf bevragen*. De Ruler-kern levert de architectuur; de Outlaw-Support levert de stresstest. Met een Authenticity Index die sterk Nature-dominant is (met name op de CEN- en Agency-as), opereert deze kwaliteit instinctief — ik hoef niet na te denken over of een structuur robuust is, ik voel het. Dit profiel gedijt bij organisaties in transitie, bij complexe herstructureringen of waar anderen vastlopen in legacy-systemen.`,
  },
  {
    title: 'Conflictstijl',
    content: `Binnen dit model is het aannemelijk dat ik conflict benader als een *correctiemechanisme*, niet als emotionele ontlading. Lage A (39) gecombineerd met uitzonderlijk lage N (2) produceert een koelbloedige confrontatiestijl: rustig, doelgericht, zonder zichtbare emotie. De Ruler-Main confronteert via gezag en argumentstructuur; de Outlaw-Support voegt bereidheid toe om regels te breken als de situatie het vraagt. Escalatiepunt: wanneer de ander de structurele logica weigert te erkennen. Ná het conflict: het grootboek wordt bijgehouden, maar niet getoond.`,
  },
  {
    title: 'Relatiepatroon',
    content: `Mijn antwoordprofiel suggereert een relatiedynamiek waarin ik *de architect ben die de ander ruimte geeft* — maar wel binnen een kader dat ik heb ontworpen. Hoge E (88) gecombineerd met lage A (39) en lage N (2) creëert een dominant, aantrekkelijk maar onvermurwbaar patroon. De Ruler-Main biedt stabiliteit en richting; de Outlaw-Support maakt me onvoorspelbaar genoeg om fascinerend te blijven. Valkuil: de partner ervaart de structuur als veiligheid totdat ze haar beperking voelt. Ik trek mogelijk mensen aan die vrijheid zoeken — en biedt hen orde.`,
  },
  {
    title: 'Individuatiepad',
    content: `Binnen dit model wijst mijn profiel op een individuatiepad waarin de paradox centraal staat: *de Ruler die de Outlaw niet vreest, maar hem ook niet volledig loslaat*. De spanning tussen Main en Support is hier geen externe frictie maar een intern architectuurprobleem — wanneer is het systeem of persoon goed genoeg om los te laten? Het schakelpunt is het moment dat ik iets vertrouw zonder het te controleren. De 180° schaduw-energie van de Outlaw is niet mijn tegenstander — het is de brandstof die mijn systemen levend houdt. Het individuatiepad loopt via *vertrouwen in onvolmaaktheid*.`,
  },
];

const ProfileResultCard = ({ result: resultProp }) => {
  const green = '#1d9904';
  const sectionPad = '1.25rem';

  const mainKey      = resultProp?.mainArchetype      || MAVERICK_DEFAULT.mainArchetype;
  const supportKey   = resultProp?.secondaryArchetype || MAVERICK_DEFAULT.supportArchetype;
  const supportGroup = resultProp?.supportGroup       || MAVERICK_DEFAULT.supportGroup;
  const extendedName = resultProp?.name               || MAVERICK_DEFAULT.extendedArchetype;
  const harmonyActive     = resultProp?.harmonyActive     ?? MAVERICK_DEFAULT.harmonyActive;
  const shadowBonusActive = resultProp?.shadowBonusActive ?? MAVERICK_DEFAULT.shadowBonusActive;

  const main         = ARCHETYPES[mainKey]    || {};
  const support      = ARCHETYPES[supportKey] || {};
  const levenslesQuote = resultProp?.levensles || getArchetypeQuote(mainKey, supportGroup);
  const imageUrl       = resultProp?.imageUrl  || getArchetypeImage(mainKey, supportGroup) || main.imageUrl;

  // Data for visualizations — fall back to hardcoded session data when localStorage lacks these fields
  const FALLBACK_RADAR = [
    { subject: 'Ruler',     green: 45, lime: 62, orange: 74, blue: 85, gold: 90, purple: 96, nature_core: 45, green_hw: 17, culture_core: 12, blue_fb: 11, yellow_cog: 5,  purple_shadow: 6, A: 96, fullMark: 500 },
    { subject: 'Judge',     green: 57, lime: 69, orange: 81, blue: 88, gold: 91, purple: 92, nature_core: 57, green_hw: 12, culture_core: 12, blue_fb: 7,  yellow_cog: 3,  purple_shadow: 1, A: 92, fullMark: 500 },
    { subject: 'Lover',     green: 27, lime: 29, orange: 33, blue: 33, gold: 40, purple: 40, nature_core: 27, green_hw: 2,  culture_core: 4,  blue_fb: 0,  yellow_cog: 7,  purple_shadow: 0, A: 40, fullMark: 500 },
    { subject: 'Caregiver', green: 12, lime: 18, orange: 18, blue: 20, gold: 24, purple: 28, nature_core: 12, green_hw: 6,  culture_core: 0,  blue_fb: 2,  yellow_cog: 4,  purple_shadow: 4, A: 28, fullMark: 500 },
    { subject: 'Innocent',  green: 33, lime: 33, orange: 41, blue: 41, gold: 47, purple: 50, nature_core: 33, green_hw: 0,  culture_core: 8,  blue_fb: 0,  yellow_cog: 6,  purple_shadow: 3, A: 50, fullMark: 500 },
    { subject: 'Explorer',  green: 0,  lime: 7,  orange: 7,  blue: 9,  gold: 15, purple: 19, nature_core: 0,  green_hw: 7,  culture_core: 0,  blue_fb: 2,  yellow_cog: 6,  purple_shadow: 4, A: 19, fullMark: 500 },
    { subject: 'Outlaw',    green: 54, lime: 59, orange: 87, blue: 90, gold: 91, purple: 94, nature_core: 54, green_hw: 5,  culture_core: 28, blue_fb: 3,  yellow_cog: 1,  purple_shadow: 3, A: 94, fullMark: 500 },
    { subject: 'Trickster', green: 21, lime: 39, orange: 47, blue: 61, gold: 63, purple: 68, nature_core: 21, green_hw: 18, culture_core: 8,  blue_fb: 14, yellow_cog: 2,  purple_shadow: 5, A: 68, fullMark: 500 },
    { subject: 'Sage',      green: 6,  lime: 19, orange: 31, blue: 40, gold: 45, purple: 46, nature_core: 6,  green_hw: 13, culture_core: 12, blue_fb: 9,  yellow_cog: 5,  purple_shadow: 1, A: 46, fullMark: 500 },
    { subject: 'Artist',    green: 42, lime: 43, orange: 55, blue: 56, gold: 59, purple: 59, nature_core: 42, green_hw: 1,  culture_core: 12, blue_fb: 1,  yellow_cog: 3,  purple_shadow: 0, A: 59, fullMark: 500 },
    { subject: 'Magician',  green: 27, lime: 41, orange: 41, blue: 50, gold: 58, purple: 59, nature_core: 27, green_hw: 14, culture_core: 0,  blue_fb: 9,  yellow_cog: 8,  purple_shadow: 1, A: 59, fullMark: 500 },
    { subject: 'Hero',      green: 48, lime: 57, orange: 65, blue: 71, gold: 73, purple: 73, nature_core: 48, green_hw: 9,  culture_core: 8,  blue_fb: 6,  yellow_cog: 2,  purple_shadow: 0, A: 73, fullMark: 500 },
  ];
  const FALLBACK_SUBGROUPS = [
    { id: 1, leftLabel: 'Judge', rightLabel: 'Ruler', group: 'Ruling', axis: 'Autoriteit & Structuur', leftScore: 45, rightScore: 40, leftNature: 7, leftCulture: 2, rightNature: 6, rightCulture: 2, harmonyPoints: 0, shadowPoints: 0 },
    { id: 2, leftLabel: 'Lover', rightLabel: 'Caregiver', group: 'Relational', axis: 'Relatie & Verbinding', leftScore: 25, rightScore: 10, leftNature: 4, leftCulture: 1, rightNature: 2, rightCulture: 0, harmonyPoints: 0, shadowPoints: 0 },
    { id: 3, leftLabel: 'Innocent', rightLabel: 'Explorer', group: 'Seeker', axis: 'Waarheid & Ontdekking', leftScore: 35, rightScore: 0, leftNature: 5, leftCulture: 2, rightNature: 0, rightCulture: 0, harmonyPoints: 0, shadowPoints: 0 },
    { id: 4, leftLabel: 'Outlaw', rightLabel: 'Trickster', group: 'Chaos', axis: 'Disruptie & Perspectief', leftScore: 55, rightScore: 20, leftNature: 6, leftCulture: 5, rightNature: 3, rightCulture: 1, harmonyPoints: 0, shadowPoints: 0 },
    { id: 5, leftLabel: 'Sage', rightLabel: 'Artist', group: 'Abstract', axis: 'Wijsheid & Creatie', leftScore: 15, rightScore: 35, leftNature: 1, leftCulture: 2, rightNature: 5, rightCulture: 2, harmonyPoints: 0, shadowPoints: 0 },
    { id: 6, leftLabel: 'Magician', rightLabel: 'Hero', group: 'Agency', axis: 'Manifestatie & Actie', leftScore: 15, rightScore: 35, leftNature: 3, leftCulture: 0, rightNature: 6, rightCulture: 1, harmonyPoints: 0, shadowPoints: 0 },
  ];
  const radarData = resultProp?.radarData || FALLBACK_RADAR;
  const subgroups = resultProp?.subgroups || FALLBACK_SUBGROUPS;
  const shadowArchetype = resultProp?.shadowArchetype || MAVERICK_DEFAULT.shadowArchetype;
  const blindspotArchetype = resultProp?.blindspotArchetype || MAVERICK_DEFAULT.blindspotArchetype;
  const overallArchetype = resultProp?.overallArchetype || mainKey;
  const supportArchetypeProp = resultProp?.supportArchetype || supportKey;

  const allSections = HARDCODED_SECTIONS;

  // ── Section grouping (matching AssessmentResultsModal) ──
  const visibleSections = allSections.filter(s => {
    if (s.isComparison) return false;
    if (s.isResonantie) return false;
    const t = (s.title || '').trim();
    if (/persoonlijkheidsrapport.*vergelijk|ocean.*vergelijk|vergelijk.*profiel/i.test(t)) return false;
    if (/^(spanningsvelden|vergelijkingsrapport|vergelijkings\s*rapport|conclusie)$/i.test(t)) return false;
    return true;
  });

  const aiGroup1a = visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('identiteit') || t.includes('waarom') || t.includes('essentie') || t.includes('vermenigvuldiging');
  });

  const aiGroup1b = visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('schaduw') || t.includes('blindspot') || t.includes('visuele');
  });

  const aiGroup2 = visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi');
  });

  const aiGroepDyn = visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('groep dynamiek') || t.includes('neurobiologisch');
  });

  const isPromptLike = (s) =>
    s.isAgentPrompt ||
    /ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt|reflectie.*prompt|ai.*reflectie/i.test(s.title);

  const aiPromptSection = visibleSections.filter(s => isPromptLike(s));

  const aiIntroSection = visibleSections.filter(s =>
    (s.title || '').toLowerCase().includes('introductie')
  );

  const aiGroupedIds = new Set();
  [aiGroup1a, aiGroup1b, aiGroup2, aiGroepDyn, aiPromptSection, aiIntroSection].forEach(g => g.forEach(s => aiGroupedIds.add(s)));

  const aiOtherSections = visibleSections.filter(s => !aiGroupedIds.has(s) && !isPromptLike(s));

  // Cognitive triangle data
  const archKey = (mainKey || '').toUpperCase();
  const tri = COG_TRIANGLES[archKey];

  // Accent color cycling fallback
  const accentCycle = [
    { color: '#1d9904', rgb: '29, 153, 4' },
    { color: '#a855f7', rgb: '168, 85, 247' },
    { color: '#f97316', rgb: '249, 115, 22' },
    { color: '#3b82f6', rgb: '59, 130, 246' },
    { color: '#ec4899', rgb: '236, 72, 153' },
    { color: '#14b8a6', rgb: '20, 184, 166' },
  ];

  // ── renderAiSectionCard (matching AssessmentResultsModal) ──
  const renderAiSectionCard = (section, idx) => {
    const accent = getSectionAccent(section.title) || accentCycle[idx % accentCycle.length];
    const isEven = idx % 2 === 0;
    return (
      <div key={`ai-${cleanTitle(section.title)}-${idx}`} style={{
        width: '100%',
        position: 'relative',
        ...(isEven ? {} : {
          background: 'transparent',
          border: `1px solid rgba(${accent.rgb}, 0.2)`,
          padding: sectionPad,
          borderRadius: '0.75rem',
        }),
      }}>
        {isEven && (
          <div style={{
            position: 'absolute', left: '-1rem', top: 0, bottom: 0, width: '3px',
            background: `linear-gradient(to bottom, transparent, rgba(${accent.rgb}, 0.5), transparent)`,
          }} />
        )}
        <h3 style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: accent.color,
          fontFamily: "'Lexend Mega', sans-serif",
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '0.75rem',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '1.5rem', height: '1.5rem', borderRadius: '50%',
            border: `1px solid rgba(${accent.rgb}, 0.4)`,
            fontSize: '0.75rem', fontFamily: "'Rajdhani', sans-serif",
            color: accent.color, flexShrink: 0,
          }}>
            {idx + 1}
          </span>
          {cleanTitle(section.title)}
        </h3>
        <div style={{
          color: 'rgba(209, 213, 219, 1)',
          fontFamily: "'Figtree', sans-serif",
          fontSize: '0.95rem',
          lineHeight: 1.7,
          textAlign: 'justify',
          ...(isEven ? {
            background: 'rgba(0, 0, 0, 0.4)',
            padding: sectionPad,
            borderRadius: '0 0.75rem 0.75rem 0',
            borderRight: `1px solid rgba(${accent.rgb}, 0.2)`,
            borderTop: `1px solid rgba(${accent.rgb}, 0.2)`,
            borderBottom: `1px solid rgba(${accent.rgb}, 0.2)`,
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
          } : {}),
        }}>
          {renderMarkdownContent(section.content, accent.color)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── 1. Header & Profile ── */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem', paddingBottom: '1.5rem', borderBottom: `1px solid rgba(29, 153, 4, 0.2)` }}>
        <div style={{ position: 'relative', width: '9rem', height: '9rem', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px dashed rgba(29, 153, 4, 0.4)', animation: 'spin 20s linear infinite' }} />
          <div style={{ position: 'absolute', inset: '-0.75rem', borderRadius: '50%', border: '1px dotted rgba(168, 85, 247, 0.4)', animation: 'spin 15s linear infinite reverse' }} />
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${green}`, background: '#000', position: 'relative' }}>
            {imageUrl && <img src={imageUrl} alt={extendedName} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.25) sepia(0.2)', transform: 'scale(1.05)' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 'clamp(1.2rem, 2vw, 2rem)', fontFamily: "'Lexend Mega', sans-serif", fontWeight: 'bold', background: 'linear-gradient(to right, #a855f7, #d8b4fe, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))', marginBottom: '0.5rem' }}>
            {extendedName}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(249, 115, 22, 0.9)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {main.name} {harmonyActive ? '\u27F7' : '+'} {support.name}
          </p>
          {levenslesQuote && (
            <p style={{ fontSize: '0.9rem', color: 'rgba(156, 163, 175, 1)', fontFamily: "'Figtree', sans-serif", fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
              "{levenslesQuote}"
            </p>
          )}
        </div>
      </div>

      {/* ── 2. Meta-Disclaimer ── */}
      <div style={{
        width: '100%',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: sectionPad,
        borderRadius: '0.75rem',
        borderLeft: '3px solid rgba(168, 85, 247, 0.5)',
        marginBottom: '0.5rem',
      }}>
        <p style={{
          margin: 0,
          color: 'rgba(209, 213, 219, 0.85)',
          fontFamily: "'Figtree', sans-serif",
          fontSize: '0.88rem',
          lineHeight: 1.7,
          fontStyle: 'italic',
        }}>
          <strong style={{ color: '#a855f7' }}>Meta-Disclaimer:</strong>{' '}
          Dit rapport is gegenereerd door het Garden For Life Deltawerken Model — een zelfreflectie-instrument, geen klinische diagnose. De gebruikte neurobiologische termen zijn metaforen binnen dit specifieke model. Raadpleeg een professional voor medisch of psychologisch advies.
        </p>
      </div>

      {/* ── 3. AI Introductie ── */}
      {aiIntroSection.map((s, i) => renderAiSectionCard(s, i))}

      {/* ── 4. Group 1a: Identiteit / Waarom / Essentie / Vermenigvuldiging ── */}
      {aiGroup1a.map((s, i) => renderAiSectionCard(s, i + aiIntroSection.length))}

      {/* ── 5. Group 1b: Schaduw / Blindspot / Visuele ── */}
      {aiGroup1b.map((s, i) => renderAiSectionCard(s, i + aiIntroSection.length + aiGroup1a.length))}

      {/* ── 6. Groep Dynamiek ── */}
      {aiGroepDyn.map((s, i) => renderAiSectionCard(s, i + aiIntroSection.length + aiGroup1a.length + aiGroup1b.length))}

      {/* ── 7. Radar Chart ── */}
      {radarData && (
        <div style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid rgba(29, 153, 4, 0.15)',
          borderRadius: '0.75rem',
          padding: sectionPad,
          overflow: 'hidden',
        }}>
          <SciFiRadarChart
            data={radarData}
            shadow={shadowArchetype}
            blindspot={blindspotArchetype}
            mainArchetype={overallArchetype}
            supportArchetype={supportArchetypeProp}
          />
        </div>
      )}

      {/* ── 8. Subgroup Dynamics (Dual-Core) ── */}
      {subgroups && (
        <div style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid rgba(168, 85, 247, 0.1)',
          borderRadius: '0.75rem',
          padding: sectionPad,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            padding: '0.5rem',
            opacity: 0.15,
          }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <SubgroupCounters subgroups={subgroups} />
        </div>
      )}

      {/* ── 9. Cognitieve Driehoek ── */}
      {tri && (
        <div style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: '0.75rem',
          padding: sectionPad,
        }}>
          <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.05rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Cognitieve Driehoek
          </h3>
          <p style={{ margin: '0.3rem 0 0.85rem', fontSize: '0.85rem', color: 'rgba(148,163,184,0.75)', fontFamily: "'Figtree', sans-serif", lineHeight: 1.6, textAlign: 'justify', overflowWrap: 'break-word' }}>
            Gele driehoeken vuren uitsluitend op <strong style={{ color: 'rgba(251,191,36,0.85)' }}>Culture picks</strong> — ze representeren aangeleerd cognitief gedrag, niet biologische hardware. Groene en blauwe signalen tonen wie je <em>bent</em>; gele signalen tonen hoe je hebt <em>leren navigeren</em>.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ width: '1.4rem', height: '1.4rem', borderRadius: '50%', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#fbbf24', flexShrink: 0 }}>
              {tri.id}
            </span>
            <div>
              <div style={{ fontSize: '0.9rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#1d9904', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{tri.mode}</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(209,213,219,0.6)', fontFamily: "'Figtree', sans-serif" }}>{tri.members.join(' · ')} — {tri.networks}</div>
            </div>
          </div>
          <p style={{ margin: '0 0 0.1rem', fontSize: '0.85rem', fontFamily: "'Figtree', sans-serif", color: 'rgba(251,191,36,0.9)', fontWeight: 600, fontStyle: 'italic' }}>
            {tri.tagline}
          </p>
          <p style={{ margin: '0.45rem 0 0', fontSize: '0.85rem', fontFamily: "'Figtree', sans-serif", color: 'rgba(209,213,219,0.85)', lineHeight: 1.65, textAlign: 'justify', overflowWrap: 'break-word' }}>
            {tri.what}
          </p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', fontFamily: "'Figtree', sans-serif", color: 'rgba(209,213,219,0.9)', lineHeight: 1.6, textAlign: 'justify', overflowWrap: 'break-word' }}>
            <span style={{ color: 'rgba(251,191,36,0.9)', fontWeight: 600 }}>Aangeleerde navigatie: </span>{tri.drive}
          </p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', fontFamily: "'Figtree', sans-serif", color: 'rgba(209,213,219,0.9)', lineHeight: 1.6, textAlign: 'justify', overflowWrap: 'break-word' }}>
            <span style={{ color: 'rgba(251,191,36,0.9)', fontWeight: 600 }}>Hoog geel profiel: </span>{tri.high}
          </p>
          <p style={{ margin: '0.4rem 0 0.75rem', fontSize: '0.85rem', fontFamily: "'Figtree', sans-serif", color: 'rgba(209,213,219,0.9)', lineHeight: 1.6, textAlign: 'justify', overflowWrap: 'break-word' }}>
            <span style={{ color: 'rgba(251,191,36,0.9)', fontWeight: 600 }}>Groeirichting: </span>{tri.growth}
          </p>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {ALL_COG_TRIANGLES.filter(t => t.id !== tri.id).map(t => (
              <div key={t.id} style={{ flex: 1, border: '1px solid rgba(251,191,36,0.15)', borderRadius: '0.4rem', padding: '0.4rem 0.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#1d9904', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>{t.mode}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(148,163,184,0.8)', fontFamily: "'Figtree', sans-serif" }}>{t.members}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 10. Group 2: Alchemie / Schakelbord / Evolutie / Ontologie ── */}
      {aiGroup2.map((s, i) => renderAiSectionCard(s, i + aiIntroSection.length + aiGroup1a.length + aiGroup1b.length + aiGroepDyn.length))}

      {/* ── 11. Other ungrouped sections ── */}
      {aiOtherSections.map((s, i) => renderAiSectionCard(s, i + aiIntroSection.length + aiGroup1a.length + aiGroup1b.length + aiGroepDyn.length + aiGroup2.length))}

    </div>
  );
};

const CornerStone = ({ variant = 'purple' }) => {
  const accentColor = variant === 'orange' ? '#f59e0b' : '#a855f7';
  return {
    topLeft: (
      <div style={{
        position: 'absolute',
        top: '-2px',
        left: '-2px',
        width: '16px',
        height: '16px',
        border: `1.5px solid ${accentColor}`,
        borderRadius: '10px 0 0 0',
        borderBottom: 'none',
        borderRight: 'none'
      }} />
    ),
    topRight: (
      <div style={{
        position: 'absolute',
        top: '-2px',
        right: '-2px',
        width: '16px',
        height: '16px',
        border: `1.5px solid ${accentColor}`,
        borderRadius: '0 10px 0 0',
        borderBottom: 'none',
        borderLeft: 'none'
      }} />
    ),
    bottomLeft: (
      <div style={{
        position: 'absolute',
        bottom: '-2px',
        left: '-2px',
        width: '16px',
        height: '16px',
        border: `1.5px solid ${accentColor}`,
        borderRadius: '0 0 0 10px',
        borderTop: 'none',
        borderRight: 'none'
      }} />
    ),
    bottomRight: (
      <div style={{
        position: 'absolute',
        bottom: '-2px',
        right: '-2px',
        width: '16px',
        height: '16px',
        border: `1.5px solid ${accentColor}`,
        borderRadius: '0 0 10px 0',
        borderTop: 'none',
        borderLeft: 'none'
      }} />
    )
  };
};

// â”€â”€â”€ Standalone feedback form â€” linked from confirmation email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FeedbackStandaloneForm = () => {
  const { t } = useLanguage();
  const params = new URLSearchParams(window.location.search);
  const [formData, setFormData] = useState({
    email: params.get('email') || '', starRating: 0, whatWorked: '', whatDidntWork: '', suggestions: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const assessmentId = params.get('id') || 'anonymous';

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const { email, whatWorked, whatDidntWork, suggestions } = formData;
    if (!email.trim()) { setError('Vul je e-mailadres in'); return; }
    if (!formData.starRating) { setError('Selecteer een score (1-9)'); return; }
    if (!whatWorked.trim() && !whatDidntWork.trim() && !suggestions.trim()) {
      setError('Vul minimaal \u00e9\u00e9n tekstveld in'); return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await submitAssessmentReview({
        assessmentId,
        email: email.trim(),
        starRating: formData.starRating,
        whatWorked: whatWorked.trim(),
        whatDidntWork: whatDidntWork.trim(),
        suggestions: suggestions.trim(),
        archetypeKey: '',
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || t('eyedentity.feedback.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, assessmentId]);

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{'\u2705'}</div>
        <p style={{ color: '#22c55e', fontFamily: "'Figtree', sans-serif", fontSize: '1rem', marginBottom: '0.5rem', margin: '0 0 0.5rem' }}>
          Dank je wel voor je feedback!
        </p>
        <p style={{ color: 'rgba(209,213,219,0.6)', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', margin: 0 }}>
          Jouw reactie is ontvangen en draagt bij aan de verbetering van dit systeem.
        </p>
      </div>
    );
  }

  const baseField = {
    width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(0,0,0,0.8)',
    border: '1px solid rgba(168,85,247,0.2)', borderRadius: '0.5rem',
    color: '#fff', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', boxSizing: 'border-box',
  };

  return (
    <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', paddingBottom: '2rem' }}>
      <p style={{ color: 'rgba(209,213,219,0.7)', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', marginTop: 0, marginBottom: '1rem' }}>
        {t('eyedentity.feedback.intro')}
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Star Rating 1-9 */}
        <div>
          <label style={{ display: 'block', color: '#f59e0b', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('eyedentity.feedback.score')} *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
            {[...Array(9)].map((_, i) => (
              <button key={i} type="button" onClick={() => setFormData({ ...formData, starRating: i + 1 })} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem',
                color: i < formData.starRating ? '#f59e0b' : 'rgba(245,158,11,0.2)',
                padding: '0.15rem', transition: 'color 0.15s, transform 0.15s',
                transform: i < formData.starRating ? 'scale(1.1)' : 'scale(1)',
              }}>{'\u2605'}</button>
            ))}
            {formData.starRating > 0 && (
              <span style={{ marginLeft: '0.5rem', color: '#f59e0b', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold' }}>{formData.starRating}/9</span>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', color: '#a855f7', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('eyedentity.feedback.email')} *</label>
          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder={t('eyedentity.feedback.emailPlaceholder')} style={baseField} />
        </div>

        {/* Accuraatheid */}
        <div>
          <label style={{ display: 'block', color: '#22c55e', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
            {t('eyedentity.feedback.accuracyLabel')}
          </label>
          <textarea value={formData.whatWorked} onChange={(e) => setFormData({ ...formData, whatWorked: e.target.value })}
            placeholder={t('eyedentity.feedback.accuracyPlaceholder')}
            style={{ ...baseField, minHeight: '60px', maxHeight: '120px', border: '1px solid rgba(34,197,94,0.2)', resize: 'vertical' }} />
        </div>

        {/* Niet overeenkomend */}
        <div>
          <label style={{ display: 'block', color: '#ef4444', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
            {t('eyedentity.feedback.mismatchLabel')}
          </label>
          <textarea value={formData.whatDidntWork} onChange={(e) => setFormData({ ...formData, whatDidntWork: e.target.value })}
            placeholder={t('eyedentity.feedback.mismatchPlaceholder')}
            style={{ ...baseField, minHeight: '60px', maxHeight: '120px', border: '1px solid rgba(239,68,68,0.2)', resize: 'vertical' }} />
        </div>

        {/* Suggesties */}
        <div>
          <label style={{ display: 'block', color: '#a855f7', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
            {t('eyedentity.feedback.suggestionsLabel')}
          </label>
          <textarea value={formData.suggestions} onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
            placeholder={t('eyedentity.feedback.suggestionsPlaceholder')}
            style={{ ...baseField, minHeight: '60px', maxHeight: '120px', resize: 'vertical' }} />
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex' }}>
          <SciFiButton type="submit" disabled={isSubmitting} variant="purple" size="md">
            {isSubmitting ? t('eyedentity.feedback.submitting') : t('eyedentity.feedback.submit')}
          </SciFiButton>
        </div>
      </form>
    </div>
  );
};

const NAV_ITEMS = [
  { id: 'profile', slug: 'profiel', titleKey: 'eyedentity.nav.profile', icon: '\u{1F9EC}', version: 'v1.0' },
  { id: 'terms', slug: 'algemene-voorwaarden', titleKey: 'eyedentity.nav.terms', icon: '\u{1F4CB}', version: 'Beta 1.0' },
  { id: 'privacy', slug: 'privacybeleid', titleKey: 'eyedentity.nav.privacy', icon: '\u{1F512}', version: 'v1.0' },
  { id: 'cookies', slug: 'cookiebeleid', titleKey: 'eyedentity.nav.cookies', icon: '\u{1F36A}', version: 'v1.1' },
  { id: 'ai', slug: 'ai-transparantie', titleKey: 'eyedentity.nav.ai', icon: '\u{1F916}', version: 'v1.0' },
  { id: 'ip', slug: 'intellectueel-eigendom', titleKey: 'eyedentity.nav.ip', icon: '\u{00A9}', version: 'v2.0' },
  { id: 'usage', slug: 'gebruiksvoorwaarden-misbruik', titleKey: 'eyedentity.nav.usage', icon: '\u{2696}', version: 'v2.1' },
  { id: 'retention', slug: 'gegevensbehoud-en-verwijdering', titleKey: 'eyedentity.nav.retention', icon: '\u{1F5C2}', version: 'v1.0' },
  { id: 'register', slug: 'verwerkingsregister', titleKey: 'eyedentity.nav.register', icon: '\u{1F4DC}', version: 'v2.0' },
  { id: 'feedback', slug: 'feedback', titleKey: 'eyedentity.nav.feedback', icon: '\u{2B50}', version: 'Beta' },
];

const SLUG_TO_ID = Object.fromEntries(NAV_ITEMS.map(item => [item.slug, item.id]));

const EyedentityPage = memo(({ isVisible, onBack }) => {
  const { t } = useLanguage();
  const getTabFromPath = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page && SLUG_TO_ID[page]) return SLUG_TO_ID[page];
    return 'profile';
  }, []);

  const [selectedId, setSelectedId] = useState(getTabFromPath);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [selectedId]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const onPopState = () => setSelectedId(getTabFromPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [getTabFromPath]);

  const handleTabClick = useCallback((id) => {
    const item = NAV_ITEMS.find(i => i.id === id);
    setSelectedId(id);
    window.history.pushState(null, '', `/?page=${item?.slug || 'profiel'}`);
  }, []);

  const selectedItem = NAV_ITEMS.find(item => item.id === selectedId);
  const accentColor = '#a855f7';
  const corners = CornerStone({ variant: 'purple' });
  const shellW = windowWidth >= 1800 ? '70vw' : windowWidth >= 1079 ? '77vw' : '96vw';
  const shellH = windowWidth >= 1800 ? '70vh' : windowWidth >= 1079 ? '77vh' : '96vh';

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
      pointerEvents: isVisible ? 'auto' : 'none',
    }}>
      <style>{`
        @keyframes eyeHoloSheen {
          0%   { background-position: 200% 200%; }
          50%  { background-position: 0% 0%; }
          100% { background-position: 200% 200%; }
        }
        @keyframes eyeHoloScanline {
          0%   { background-position: 0 -200%; }
          100% { background-position: 0 200%; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      {/* â”€â”€ Outer shell â€” positioning context only, corners live here so overflow:hidden can't clip them â”€â”€ */}
      <div style={{ position: 'relative', width: shellW, height: shellH, flexShrink: 0 }}>
        {/* Purple L-bracket corners â€” exact SectorFrame pattern */}
        <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '1rem', height: '1rem', border: '1.5px solid #a855f7', borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none', pointerEvents: 'none', zIndex: 10 }} />
        <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '1rem', height: '1rem', border: '1.5px solid #a855f7', borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none', pointerEvents: 'none', zIndex: 10 }} />
        <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '1rem', height: '1rem', border: '1.5px solid #a855f7', borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none', pointerEvents: 'none', zIndex: 10 }} />
        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '1rem', height: '1rem', border: '1.5px solid #a855f7', borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none', pointerEvents: 'none', zIndex: 10 }} />
        {/* â”€â”€ Inner panel â€” glass effects + overflow:hidden â”€â”€ */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '0.5rem',
          backgroundColor: 'rgba(2, 0, 3, 0.3)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03)',
        }}>
        {/* Holographic sheen */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '0.5rem', pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)',
          backgroundSize: '400% 400%',
          animation: 'eyeHoloSheen 45s ease-in-out infinite',
          mixBlendMode: 'screen',
        }} />
        {/* Scanline sweep */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '0.5rem', pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)',
          backgroundSize: '100% 300%',
          animation: 'eyeHoloScanline 14s linear infinite',
        }} />
        {/* Content layer */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '1.5rem 2rem' }}>

          {/* â”€â”€ Header â”€â”€ */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderBottom: '1px solid rgba(168,85,247,0.2)',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <div style={{ width: '6px', height: '6px', backgroundColor: accentColor, borderRadius: '1px' }} />
              <span style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '10px',
                letterSpacing: '0.3em',
                color: 'rgba(168,85,247,0.7)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}>
                Persoonlijk Protocol Interface
              </span>
            </div>
            <h1 style={{
              fontFamily: "'Lexend Mega', sans-serif",
              fontSize: 'clamp(1.5rem, 3vw, 2.8rem)',
              fontWeight: 'bold',
              letterSpacing: '-0.02em',
              color: '#ffffff',
              margin: 0,
            }}>
              EYEDENTITY
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <SciFiButton onClick={onBack} variant="purple" size="md">
              ← TERUG
            </SciFiButton>
          </div>
        </div>

        {/* â”€â”€ Main: Sidebar + Content â”€â”€ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, auto) 1fr',
          gridTemplateRows: '1fr',
          gap: '1.5rem',
          flex: 1,
          minHeight: 0,
        }}>

          {/* Left Navigation */}
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            overflowY: 'auto',
            width: 'max-content',
            minWidth: 0,
            minHeight: 0,
          }}>
            {NAV_ITEMS.map(item => {
              const isActive = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.6rem 0.75rem',
                    background: isActive ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.03)',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    borderLeft: isActive ? `3px solid ${accentColor}` : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.03)'; }}
                >
                  <div style={{
                    fontSize: '1rem',
                    opacity: isActive ? 1 : 0.4,
                    transition: 'opacity 0.3s',
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '9px',
                      fontWeight: 600,
                      color: isActive ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.2)',
                      letterSpacing: '0.1em',
                      marginBottom: '1px',
                      transition: 'color 0.3s',
                    }}>
                      {item.version}
                    </div>
                    <div style={{
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '10px',
                      letterSpacing: '0.04em',
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
                      transition: 'color 0.3s',
                    }}>
                      {t(item.titleKey)}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Right Content Panel */}
          <div style={{
            position: 'relative',
            backgroundColor: 'rgba(2, 0, 3, 0.3)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '0.5rem',
            padding: '1.5rem 2rem 0 2rem',
            boxShadow: 'inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03), inset -3rem -3rem 6rem rgba(168,85,247,0.04), 0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}>
            {corners.topLeft}
            {corners.topRight}
            {corners.bottomLeft}
            {corners.bottomRight}

            {/* Bottom gradient line */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(168,85,247,0.2), transparent)',
            }} />

            {/* Content Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem',
              flexShrink: 0,
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(168,85,247,0.2)',
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                flexShrink: 0,
              }}>
                {selectedItem?.icon}
              </div>
              <div>
                <h2 style={{
                  fontFamily: "'Lexend Mega', sans-serif",
                  fontSize: 'clamp(0.75rem, 1.1vw, 1.2rem)',
                  fontWeight: 'bold',
                  letterSpacing: '0.02em',
                  color: '#ffffff',
                  margin: 0,
                }}>
                  {selectedItem ? t(selectedItem.titleKey) : ''}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: "'Rajdhani', sans-serif",
                    color: 'rgba(168,85,247,0.6)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                  }}>
                    {new Date().toLocaleDateString('nl-NL')}
                  </span>
                </div>
              </div>
            </div>

            {/* Header / Body divider */}
            <div style={{
              height: '1px',
              background: 'rgba(168,85,247,0.4)',
              marginBottom: '0',
              flexShrink: 0,
            }} />

            {/* Content Body */}
            <div ref={contentRef} style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              minHeight: 0,
              paddingTop: '1.25rem',
            }}>
              {selectedId === 'profile' ? (
                isVisible && <ProfileResultCard />
              ) : selectedId === 'feedback' ? (
                <FeedbackStandaloneForm />
              ) : (
                POLICY_CONTENT[selectedId] || <p style={{ color: '#94a3b8' }}>{t('eyedentity.contentUnavailable')}</p>
              )}
            </div>

          </div>
        </div>
        </div>{/* /content layer */}
        </div>{/* /inner panel */}
      </div>{/* /outer shell */}
    </div>
  );
});

EyedentityPage.displayName = 'EyedentityPage';

export default EyedentityPage;
