import React, { memo, useEffect, useState, useCallback, useRef } from 'react';
import { ARCHETYPES, getArchetypeQuote } from '../data/assessment';
import { getArchetypeImage } from '../data/assessment/archetypeImages';
import { POLICY_CONTENT } from '../data/policyContent';
import { submitAssessmentReview } from '../utils/apiClient';
import { SciFiButton } from '../components/assessment/dashboardStyles';
import { cleanTitle, getSectionAccent, renderMarkdownContent } from '../utils/markdownRenderer';
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
  harmonyActive: false,
  shadowBonusActive: false,
  totalScore: 94,
  maxScore: 100,
  timestamp: null,
  archetypeScores: {},
  answerLog: [],
};

/**
 * ProfileResultCard â€” renders the user's assessment result.
 * Accepts a `result` prop matching the resultObj shape from AssessmentResultsModal.
 * Falls back to derived MAVERICK_DEFAULT demo data when no prop is provided.
 */
const COG_TRIANGLES = {
  RULER:     { id: 1, mode: 'Idealisme Modus',  color: '#a855f7', members: ['Ruler', 'Innocent', 'Sage'],     networks: 'CEN · Openness · DMN',
    tagline: 'Jij navigeert via principes, visie en structuur.',
    what: 'Je aangeleerde cognitief gedrag organiseert zich rondom het bouwen van systemen die kloppen. Niet alleen praktisch — ook moreel. Ruler, Innocent en Sage vormen samen een driehoek die zoekt naar de ideale orde: een wereld die gehoorzaamt aan beginselen die jij gelooft dat universeel geldig zijn.',
    drive: 'Je Culture picks tonen dat je hebt leren navigeren via autoriteit en visie (Ruler), reinheid en beginseltrouw (Innocent), en kennis als kompas (Sage). Je bouwt mentale architectuur — frameworks, overtuigingen, systemen — als aangeleerde strategie om de chaos te beheersen.',
    high: 'Hoge gele activatie hier betekent dat jij sterk leeft vanuit geleerde regels, idealen en kenniskaders. Je beoordeelt situaties langs de lat van hoe het "zou moeten" zijn. Dit geeft stabiliteit en richting — maar kan ook rigiditeit en teleurstelling opleveren wanneer de werkelijkheid niet aan jouw architectuur voldoet.',
    growth: 'Duik in de driehoeken die jij het minst activeert — met name Impact Modus (Lover · Outlaw · Magician). Dat is precies het territorium dat jouw systemen niet kunnen verklaren: emotionele chaos, disruptie, alchemie.',
  },
  INNOCENT:  { id: 1, mode: 'Idealisme Modus',  color: '#a855f7', members: ['Ruler', 'Innocent', 'Sage'],     networks: 'CEN · Openness · DMN',
    tagline: 'Jij navigeert via principes, visie en structuur.',
    what: 'Je aangeleerde cognitief gedrag organiseert zich rondom het bouwen van systemen die kloppen. Niet alleen praktisch — ook moreel. Ruler, Innocent en Sage vormen samen een driehoek die zoekt naar de ideale orde: een wereld die gehoorzaamt aan beginselen die jij gelooft dat universeel geldig zijn.',
    drive: 'Je Culture picks tonen dat je hebt leren navigeren via autoriteit en visie (Ruler), reinheid en beginseltrouw (Innocent), en kennis als kompas (Sage). Je bouwt mentale architectuur — frameworks, overtuigingen, systemen — als aangeleerde strategie om de chaos te beheersen.',
    high: 'Hoge gele activatie hier betekent dat jij sterk leeft vanuit geleerde regels, idealen en kenniskaders. Je beoordeelt situaties langs de lat van hoe het "zou moeten" zijn. Dit geeft stabiliteit en richting — maar kan ook rigiditeit en teleurstelling opleveren wanneer de werkelijkheid niet aan jouw architectuur voldoet.',
    growth: 'Duik in de driehoeken die jij het minst activeert — met name Impact Modus (Lover · Outlaw · Magician). Dat is precies het territorium dat jouw systemen niet kunnen verklaren: emotionele chaos, disruptie, alchemie.',
  },
  SAGE:      { id: 1, mode: 'Idealisme Modus',  color: '#a855f7', members: ['Ruler', 'Innocent', 'Sage'],     networks: 'CEN · Openness · DMN',
    tagline: 'Jij navigeert via principes, visie en structuur.',
    what: 'Je aangeleerde cognitief gedrag organiseert zich rondom het bouwen van systemen die kloppen. Niet alleen praktisch — ook moreel. Ruler, Innocent en Sage vormen samen een driehoek die zoekt naar de ideale orde: een wereld die gehoorzaamt aan beginselen die jij gelooft dat universeel geldig zijn.',
    drive: 'Je Culture picks tonen dat je hebt leren navigeren via autoriteit en visie (Ruler), reinheid en beginseltrouw (Innocent), en kennis als kompas (Sage). Je bouwt mentale architectuur — frameworks, overtuigingen, systemen — als aangeleerde strategie om de chaos te beheersen.',
    high: 'Hoge gele activatie hier betekent dat jij sterk leeft vanuit geleerde regels, idealen en kenniskaders. Je beoordeelt situaties langs de lat van hoe het "zou moeten" zijn. Dit geeft stabiliteit en richting — maar kan ook rigiditeit en teleurstelling opleveren wanneer de werkelijkheid niet aan jouw architectuur voldoet.',
    growth: 'Duik in de driehoeken die jij het minst activeert — met name Impact Modus (Lover · Outlaw · Magician). Dat is precies het territorium dat jouw systemen niet kunnen verklaren: emotionele chaos, disruptie, alchemie.',
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
];const ProfileResultCard = ({ result: resultProp }) => {
  const green = '#1d9904';
  const sectionPad = '1.25rem';

  // Load saved data from localStorage
  const savedSession = (() => { try { return JSON.parse(localStorage.getItem('gfl_assessment_session') || 'null'); } catch { return null; } })();
  const savedSections = (() => { try { return JSON.parse(localStorage.getItem('gfl_analysis_sections') || 'null'); } catch { return null; } })();

  const mainKey      = resultProp?.mainArchetype      || savedSession?.mainArchetype      || MAVERICK_DEFAULT.mainArchetype;
  const supportKey   = resultProp?.secondaryArchetype || savedSession?.supportArchetype   || MAVERICK_DEFAULT.supportArchetype;
  const supportGroup = resultProp?.supportGroup       || savedSession?.supportGroup       || MAVERICK_DEFAULT.supportGroup;
  const extendedName = resultProp?.name               || savedSession?.extendedArchetype  || MAVERICK_DEFAULT.extendedArchetype;
  const harmonyActive     = resultProp?.harmonyActive     ?? savedSession?.harmonyActive     ?? MAVERICK_DEFAULT.harmonyActive;
  const shadowBonusActive = resultProp?.shadowBonusActive ?? savedSession?.shadowBonusActive ?? MAVERICK_DEFAULT.shadowBonusActive;

  const main         = ARCHETYPES[mainKey]    || {};
  const support      = ARCHETYPES[supportKey] || {};
  const levenslesQuote = resultProp?.levensles || getArchetypeQuote(mainKey, supportGroup);
  const imageUrl       = resultProp?.imageUrl  || getArchetypeImage(mainKey, supportGroup) || main.imageUrl;

  // Data for visualizations
  const radarData = resultProp?.radarData || savedSession?.radarData || null;
  const subgroups = resultProp?.subgroups || savedSession?.subgroups || null;
  const shadowArchetype = resultProp?.shadowArchetype || savedSession?.shadowArchetype || null;
  const blindspotArchetype = resultProp?.blindspotArchetype || savedSession?.blindspotArchetype || savedSession?.blindspotPartner || null;
  const overallArchetype = resultProp?.overallArchetype || savedSession?.overallArchetype || mainKey;
  const supportArchetypeProp = resultProp?.supportArchetype || savedSession?.supportArchetype || supportKey;

  // All sections from AI analysis
  const allSections = savedSections || [];

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
          {harmonyActive && <p style={{ fontSize: '0.72rem', color: green, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.25rem', textTransform: 'uppercase' }}>{'\u2726'} Harmony Bonus Active {'\u2726'}</p>}
          {shadowBonusActive && <p style={{ fontSize: '0.72rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.25rem', textTransform: 'uppercase' }}>{'\u2726'} Shadow Bonus Active {'\u2726'}</p>}
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

      {/* ── 12. AI Prompt Teaser ── */}
      <div style={{
        width: '100%',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(168, 85, 247, 0.2)',
        borderRadius: '0.75rem',
        padding: sectionPad,
        textAlign: 'center',
      }}>
        <h3 style={{
          color: '#a855f7',
          fontFamily: "'Lexend Mega', sans-serif",
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '0.5rem',
        }}>
          Volledige AI Prompt
        </h3>
        <p style={{
          color: 'rgba(209, 213, 219, 0.6)',
          fontFamily: "'Figtree', sans-serif",
          fontSize: '0.85rem',
          lineHeight: 1.6,
          margin: 0,
        }}>
          De volledige AI prompt is beschikbaar in je PDF rapport. Download je rapport via de assessment resultaten.
        </p>
      </div>

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
      setError(err.message || 'Versturen mislukt, probeer opnieuw.');
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
        Topper, hopelijk ben je wijzer geworden en wil je dit nu met ons delen {'\u2014'} We horen graag wat je ervan vondt.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Star Rating 1-9 */}
        <div>
          <label style={{ display: 'block', color: '#f59e0b', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Score *</label>
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
          <label style={{ display: 'block', color: '#a855f7', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>E-mailadres *</label>
          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jouw@email.nl" style={baseField} />
        </div>

        {/* Accuraatheid */}
        <div>
          <label style={{ display: 'block', color: '#22c55e', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
            Hoe accuraat is het resultaat volgens jouw kennis en gevoel?
          </label>
          <textarea value={formData.whatWorked} onChange={(e) => setFormData({ ...formData, whatWorked: e.target.value })}
            placeholder="Beschrijf in hoeverre het resultaat klopt met wie jij bent..."
            style={{ ...baseField, minHeight: '60px', maxHeight: '120px', border: '1px solid rgba(34,197,94,0.2)', resize: 'vertical' }} />
        </div>

        {/* Niet overeenkomend */}
        <div>
          <label style={{ display: 'block', color: '#ef4444', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
            Waar ben je zeker van dat niet overeenkomt met jouw persoonlijkheid?
          </label>
          <textarea value={formData.whatDidntWork} onChange={(e) => setFormData({ ...formData, whatDidntWork: e.target.value })}
            placeholder="Bijv: ik ben helemaal niet competitief, want..."
            style={{ ...baseField, minHeight: '60px', maxHeight: '120px', border: '1px solid rgba(239,68,68,0.2)', resize: 'vertical' }} />
        </div>

        {/* Suggesties */}
        <div>
          <label style={{ display: 'block', color: '#a855f7', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
            Wat zou jij anders doen of toevoegen aan dit systeem?
          </label>
          <textarea value={formData.suggestions} onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
            placeholder="Bijv: meer context bij de vragen, andere formulering..."
            style={{ ...baseField, minHeight: '60px', maxHeight: '120px', resize: 'vertical' }} />
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex' }}>
          <SciFiButton type="submit" disabled={isSubmitting} variant="purple" size="md">
            {isSubmitting ? 'VERSTUREN...' : 'VERSTUUR FEEDBACK'}
          </SciFiButton>
        </div>
      </form>
    </div>
  );
};

const NAV_ITEMS = [
  { id: 'profile', slug: 'profiel', title: 'PERSOONLIJK PROFIEL', icon: '\u{1F9EC}', version: 'v1.0' },
  { id: 'rapport', slug: 'rapport', title: 'VOLLEDIG RAPPORT', icon: '\u{1F4C4}', version: 'v1.0' },
  { id: 'terms', slug: 'algemene-voorwaarden', title: 'ALGEMENE VOORWAARDEN', icon: '\u{1F4CB}', version: 'Beta 1.0' },
  { id: 'privacy', slug: 'privacybeleid', title: 'PRIVACYBELEID', icon: '\u{1F512}', version: 'v1.0' },
  { id: 'cookies', slug: 'cookiebeleid', title: 'COOKIEBELEID', icon: '\u{1F36A}', version: 'v1.1' },
  { id: 'ai', slug: 'ai-transparantie', title: 'AI-TRANSPARANTIE', icon: '\u{1F916}', version: 'v1.0' },
  { id: 'ip', slug: 'intellectueel-eigendom', title: 'INTELLECTUEEL EIGENDOM', icon: '\u{00A9}', version: 'v2.0' },
  { id: 'usage', slug: 'gebruiksvoorwaarden-misbruik', title: 'GEBRUIKSVOORWAARDEN', icon: '\u{2696}', version: 'v2.1' },
  { id: 'retention', slug: 'gegevensbehoud-en-verwijdering', title: 'GEGEVENSBEHOUD & VERWIJDERING', icon: '\u{1F5C2}', version: 'v1.0' },
  { id: 'register', slug: 'verwerkingsregister', title: 'VERWERKINGSREGISTER', icon: '\u{1F4DC}', version: 'v2.0' },
  { id: 'feedback', slug: 'feedback', title: 'FEEDBACK', icon: '\u{2B50}', version: 'Beta' },
];

// ─── Report card: renders the AI-generated analysis sections ──────────────────────
const ReportCard = () => {
  const sections = (() => {
    try {
      const raw = localStorage.getItem('gfl_analysis_sections');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  if (!sections || sections.length === 0) {
    return (
      <div style={{ padding: '2rem', color: 'rgba(148,163,184,0.6)', fontFamily: "'Figtree', sans-serif", fontSize: '0.9rem', lineHeight: 1.7 }}>
        Geen rapport beschikbaar. Voltooi eerst een assessment om het volledige rapport te bekijken.
      </div>
    );
  }

  const SECTION_COLOR = '#a855f7';

  // Simple markdown-to-text renderer (bold stripping, bullet detection)
  const renderBody = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: '0.4rem' }} />;
      // Strip bold markers for display
      const clean = line.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
      const isBullet = /^\s*[-•]\s/.test(line);
      const isNumbered = /^\s*\d+\.\s/.test(line);
      const isSubheader = /^#{3,}/.test(line);
      if (isSubheader) {
        return <div key={i} style={{ fontFamily: "'Lexend Mega', sans-serif", fontSize: '0.7rem', color: SECTION_COLOR, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.75rem', marginBottom: '0.25rem' }}>{clean.replace(/^#+\s*/, '')}</div>;
      }
      if (isBullet || isNumbered) {
        return <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <span style={{ color: SECTION_COLOR, flexShrink: 0 }}>{isBullet ? '•' : clean.match(/^\s*(\d+\.)/)?.[1]}</span>
          <span style={{ color: 'rgba(209,213,219,0.88)', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', lineHeight: 1.65 }}>{isBullet ? clean.replace(/^\s*[-•]\s/, '') : clean.replace(/^\s*\d+\.\s/, '')}</span>
        </div>;
      }
      return <p key={i} style={{ color: 'rgba(209,213,219,0.88)', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', lineHeight: 1.7, margin: '0 0 0.35rem' }}>{clean}</p>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      {sections.map((section, idx) => (
        <div key={idx} style={{ borderLeft: `2px solid ${section.isProfileElement ? 'rgba(249,115,22,0.4)' : 'rgba(168,85,247,0.3)'}`, paddingLeft: '0.875rem' }}>
          <div style={{
            fontFamily: "'Lexend Mega', sans-serif",
            fontSize: '0.7rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: section.isProfileElement ? '#f97316' : SECTION_COLOR,
            marginBottom: '0.5rem',
          }}>
            {section.title}
          </div>
          <div>{renderBody(section.content || section.body || '')}</div>
        </div>
      ))}
    </div>
  );
};

const SLUG_TO_ID = Object.fromEntries(NAV_ITEMS.map(item => [item.slug, item.id]));

const EyedentityPage = memo(({ isVisible, onBack }) => {
  const getTabFromPath = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page && SLUG_TO_ID[page]) return SLUG_TO_ID[page];
    return 'profile';
  }, []);

  const [selectedId, setSelectedId] = useState(getTabFromPath);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [selectedId]);

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
      <div style={{ position: 'relative', width: '70vw', height: '70vh', flexShrink: 0 }}>
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
                      {item.title}
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
                  {selectedItem?.title}
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
                <ProfileResultCard />
              ) : selectedId === 'rapport' ? (
                <ReportCard />
              ) : selectedId === 'feedback' ? (
                <FeedbackStandaloneForm />
              ) : (
                POLICY_CONTENT[selectedId] || <p style={{ color: '#94a3b8' }}>Inhoud niet beschikbaar.</p>
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
