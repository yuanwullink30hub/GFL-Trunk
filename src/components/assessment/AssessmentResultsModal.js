import React, { useMemo, useCallback, useRef, useEffect, useLayoutEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import SciFiRadarChart from './SciFiRadarChart';
import SubgroupCounters from './SubgroupCounters';
import {
  questions,
  ARCHETYPES,
  SUBGROUP_POLARITIES,
  getAnalysisTemplate,
  // Archetype-based scoring
  ALL_ARCHETYPE_KEYS,
  SHADOW_PAIRS,
  ARCHETYPE_TO_GROUP,
  EXTENDED_ARCHETYPES,
  getExtendedArchetype,
  isComplementaryPair,
  getExtendedDescription,
  computeAdvancedScores,
} from '../../data/assessment';
import { isNatureSlot } from '../../pages/assessment/assessmentData';
import { getArchetypeImage } from '../../data/assessment/archetypeImages';
import { getCoreProfile, getExtendedOcean, OCEAN_LABELS, OCEAN_COLORS } from '../../data/assessment/oceanProfiles';
import { getToken, saveAssessment, analyzeAssessment, submitAssessmentReview, logActivity, getPublicSiteBanner } from '../../utils/apiClient';
import tnmWheelImg from '../../images/Model imports/TNM wheel PNG.png';
import deltawerkenImg from '../../images/Model imports/Deltawerken png.png';
import cellsImg from '../../images/Model imports/Cells within Cells png.png';

/**
 * AssessmentResultsModal - Full-screen sci-fi results modal
 * Replaces the old small download card with a comprehensive results view.
 * 
 * During loading (resultsLoadingProgress < 1): shows poetry slideshow + loading bar
 * After loading: shows full archetype results modal with radar chart, subgroup dynamics, analysis
 * 
 * @param {{
 *   resultsLoadingProgress: number,
 *   resultsModalProgress: number,
 *   layerAnswers: object,
 *   onClose: () => void,
 *   onDownload: () => void,
 *   onCreateAccount: () => void,
 *   onAiReady: () => void,
 *   t: (key: string) => string
 * }} props
 */
// ── Utility: strip "SECTIE N:" / "**SECTIE N**" prefix + surrounding ** bold markers ──
const cleanTitle = (title) => {
  if (!title) return title;
  let t = title.trim();
  // Strip outer ** bold markers wrapping the whole string (e.g. "**De Identiteit**")
  t = t.replace(/^\*\*(.+)\*\*$/, '$1').trim();
  // Strip "SECTIE N" prefix in all forms: "SECTIE 1:", "SECTIE 1.", "**SECTIE 1**:", "**SECTIE 1**"
  t = t.replace(/^\*?\*?SECTIE\s+\d+\*?\*?[\s:.—-]*\s*/i, '').trim();
  // Strip bare numeric prefixes like "12. " or "12: " or "13A. " that the AI may include
  t = t.replace(/^\d+[a-zA-Z]?[\s.:—-]+\s*/i, '').trim();
  // Strip any remaining stray ** at start or end
  t = t.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
  return t;
};

// ── Utility: map cleaned section title to accent color for JSX card (returns {color, rgb} or null) ──
const getSectionAccent = (title) => {
  const t = cleanTitle(title || '').toLowerCase();
  if (t.includes('identiteit') || t.includes('waarom')) return { color: '#1d9904', rgb: '29, 153, 4' };
  if (t.includes('essentie') || t.includes('schaduw')) return { color: '#a855f7', rgb: '168, 85, 247' };
  if (t.includes('vermenigvuldiging')) return { color: '#f97316', rgb: '249, 115, 22' };
  if (t.includes('blindspot')) return { color: '#ef4444', rgb: '239, 68, 68' };
  if (t.includes('visuele')) return { color: '#a855f7', rgb: '168, 85, 247' };
  if (t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi')) return { color: '#fbbf24', rgb: '251, 191, 36' };
  if (t.includes('groep dynamiek') || t.includes('neurobiologisch')) return { color: '#22d3ee', rgb: '34, 211, 238' };
  if (t.includes('introductie')) return { color: '#d1d5db', rgb: '209, 213, 219' };
  if (t.includes('prompt') || t.includes('agent')) return { color: '#f97316', rgb: '249, 115, 22' };
  return null; // fallback to cycle
};

const AssessmentResultsModal = ({
  resultsLoadingProgress,
  resultsModalProgress,
  layerAnswers,
  uploadedFiles,
  onClose,
  onDownload,
  onCreateAccount,
  onAiReady,
  t
}) => {
  // Compute archetype result from layer answers
  const result = useMemo(() => {
    const keys = layerAnswers ? Object.keys(layerAnswers) : [];
    const totalAnswers = keys.reduce((sum, k) => sum + Object.keys(layerAnswers[k] || {}).length, 0);
    console.log('[GFL] computeResultFromAnswers — layers:', keys.length, 'totalAnswers:', totalAnswers, 'sample:', JSON.stringify(layerAnswers).slice(0, 300));
    return computeResultFromAnswers(layerAnswers);
  }, [layerAnswers]);
  
  // Ref for the scroll container
  const scrollRef = useRef(null);
  
  // Ref for the PDF content area (the inner content div)
  const contentRef = useRef(null);
  
  // PDF download state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPdfConsent, setShowPdfConsent] = useState(false);
  const [pdfConsentChecked, setPdfConsentChecked] = useState(false);

  // ── AI Analysis state ──
  const [aiSections, setAiSections] = useState(null);
  const [uploadedOceanScores, setUploadedOceanScores] = useState(null);
  const [aiReady, setAiReady] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);
  const [, setAiStage] = useState(0); // 0=waiting, 1=data sent, 2=AI done, 3=integrated
  const aiCalledRef = useRef(false);
  const onAiReadyRef = useRef(onAiReady);
  onAiReadyRef.current = onAiReady;

  // ── Site banner for PDF footer (admin-configured image) ──
  const [siteBanner, setSiteBanner] = useState(null);
  useEffect(() => {
    getPublicSiteBanner().then(setSiteBanner).catch(() => {});
  }, []);

  // ── Auto-save to backend when user is logged in ──
  const [savedToBackend, setSavedToBackend] = useState(false);
  const [savedAssessmentId, setSavedAssessmentId] = useState(null);
  useEffect(() => {
    if (!result || savedToBackend || !getToken()) return;
    const oceanScores = result.oceanScores || result.extendedOcean?.ocean || null;
    saveAssessment({
      archetypeKey: result.mainArchetype,
      supportGroup: result.supportGroup,
      extendedArchetypeName: result.extendedName,
      oceanScores,
      responses: result._answerLog || [],
      subjectResults: result.subjectResults || [],
      scores: result.scores || null,
      archetypeDetails: result.archetypeDetails || null,
      harmonyScore: result.harmonyScore ?? null,
      consciousnessLevel: result.consciousnessLevel || null,
      overallShadow: result.overallShadow || null,
    }).then((saved) => {
      setSavedToBackend(true);
      if (saved?.id) setSavedAssessmentId(String(saved.id));
      console.log('[GFL] Assessment saved to account, id:', saved?.id);
    }).catch((err) => {
      console.warn('[GFL] Could not save assessment:', err.message);
    });
  }, [result, savedToBackend]);

  // ── Email gate state (unlocks PDF download) ──
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({ email: '' });
  const [reviewError, setReviewError] = useState('');

  // ── Email submission handler ──
  const handleReviewSubmit = useCallback(async (e) => {
    e?.preventDefault();
    const { email } = reviewFormData;

    if (!email.trim()) {
      setReviewError('Vul je e-mailadres in');
      return;
    }
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setReviewError('Vul een geldig e-mailadres in');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');

    try {
      await submitAssessmentReview({
        assessmentId: savedAssessmentId || 'anonymous',
        email: email.trim(),
        archetypeKey: result?.mainArchetype || '',
        timestamp: new Date().toISOString(),
      });
      setReviewSubmitted(true);
      console.log('[GFL] Email submitted — PDF unlocked');
    } catch (err) {
      console.error('[GFL] Email submission failed:', err);
      setReviewError(err.message || 'Verzenden mislukt. Probeer opnieuw.');
    } finally {
      setIsSubmittingReview(false);
    }
  }, [reviewFormData, result, savedAssessmentId]);

  // ── Responsive breakpoints (matches DesktopLayout pattern) ──
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);

  // ── Fire AI analysis during loading phase (with SSE progress) ──
  useEffect(() => {
    if (!result || aiReady || aiCalledRef.current) return;
    aiCalledRef.current = true;

    const runAnalysis = async () => {
      const oceanScores = result.extendedOcean?.ocean || null;

      // Convert any uploaded OCEAN profile files to the format the AI API expects
      const uploadedFileContents = [];
      for (const file of uploadedFiles || []) {
        try {
          if (file.type === 'application/pdf') {
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result.split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            uploadedFileContents.push({ name: file.name, pdfBase64: base64 });
          } else if (file.type === 'text/plain' || file.type === 'application/json') {
            const text = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = reject;
              reader.readAsText(file);
            });
            uploadedFileContents.push({ name: file.name, text });
          } else if (file.type.startsWith('image/')) {
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result.split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            uploadedFileContents.push({ name: file.name, imageBase64: base64, mimeType: file.type });
          }
        } catch { /* skip unreadable files */ }
      }

      try {
        const aiResult = await analyzeAssessment({
          archetypeKey: result.mainArchetype,
          supportArchetype: result.secondaryArchetype || result._secondaryKey,
          supportGroup: result.supportGroup,
          extendedArchetypeName: result.extendedName || result.name,
          shadowArchetype: result.shadowPartner,
          blindspotArchetype: result.blindspotPartner,
          isIndividuated: result.shadowBonusActive,
          hasHarmonyBonus: false,
          harmonyBonusApplied: 0,
          oceanScores,
          scores: result._archetypeScores,
          responses: result._answerLog,
          subgroups: result.subgroups,
          level: 'advanced',
          uploadedFileContents: uploadedFileContents.length > 0 ? uploadedFileContents : undefined,
        }, (stage, message) => {
          setAiStage(stage);
          console.log(`[GFL] AI stage ${stage}: ${message}`);
        });
        // Stage 3: frontend integration
        setAiStage(3);
        if (aiResult.uploadedOceanScores) setUploadedOceanScores(aiResult.uploadedOceanScores);
        const sections = parseAiSections(aiResult.analysis || '');
        setAiSections(sections);
        setAiReady(true);
        if (onAiReadyRef.current) onAiReadyRef.current();
      } catch (err) {
        console.warn('[GFL] AI analysis failed, using template:', err.message);
        setAiFailed(true);
        aiCalledRef.current = false; // allow retry on failure
      }
    };

    runAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, aiReady]);

  // Removed: stageLabels (using simpler single-message loading state now)

  // Displayed sections: AI-generated when available, template fallback otherwise.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const displaySections = useMemo(() => {
    return aiSections || result?.analysisSections || [];
  }, [aiSections, result]);

  // Visible sections for card: exclude comparison (PDF-only) and resonantie (PDF radar page)
  const visibleSections = useMemo(() =>
    displaySections.filter(s => {
      if (s.isComparison) return false;
      if (s.isResonantie) return false;
      const t = (s.title || '').trim();
      if (/persoonlijkheidsrapport.*vergelijk|ocean.*vergelijk|vergelijk.*profiel/i.test(t)) return false;
      if (/^(spanningsvelden|vergelijkingsrapport|vergelijkings\s*rapport|conclusie)$/i.test(t)) return false;
      return true;
    }),
  [displaySections]);

  // Scroll modal to top when results become visible (after AI loading completes).
  // useLayoutEffect fires before the browser paints, preventing the flash at sections 9-12.
  useLayoutEffect(() => {
    if (aiReady && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [aiReady]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Breakpoint-based sizing:  Desktop(≥1441) / Laptop(≥1024) / Tablet(≥768) / Mobile(<768)
  const rs = windowWidth >= 1441 ? {
    // ── Desktop ── original full-size
    poetryWidth: '24rem',
    poetryPad: '1.5rem',
    modalMaxWidth: '56rem',
    modalMaxHeight: '85vh',
    scrollPad: '1.5rem 2rem',
    profileImgSize: '25rem',
    profileTextMaxW: '40rem',
    titleFont: 'clamp(1.8rem, 4vw, 3rem)',
    radarHeight: '380px',
    sectionPad: '1.5rem',
    cardPad: '1.25rem',
    btnMinWidth: '200px',
    btnPad: '1rem 1.5rem',
    btnFont: '0.85rem',
  } : windowWidth >= 1024 ? {
    // ── Laptop ── 0.56x
    poetryWidth: '13.4rem',
    poetryPad: '0.84rem',
    modalMaxWidth: '31.4rem',
    modalMaxHeight: '85vh',
    scrollPad: '0.84rem 1.12rem',
    profileImgSize: '14rem',
    profileTextMaxW: '22.4rem',
    titleFont: '1.4rem',
    radarHeight: '213px',
    sectionPad: '0.84rem',
    cardPad: '0.7rem',
    btnMinWidth: '112px',
    btnPad: '0.56rem 0.84rem',
    btnFont: '0.6rem',
  } : windowWidth >= 768 ? {
    // ── Tablet ── 0.65x
    poetryWidth: '15.6rem',
    poetryPad: '0.975rem',
    modalMaxWidth: '36.4rem',
    modalMaxHeight: '85vh',
    scrollPad: '0.975rem 1.3rem',
    profileImgSize: '16.25rem',
    profileTextMaxW: '26rem',
    titleFont: '1.6rem',
    radarHeight: '247px',
    sectionPad: '0.975rem',
    cardPad: '0.8rem',
    btnMinWidth: '130px',
    btnPad: '0.65rem 0.975rem',
    btnFont: '0.7rem',
  } : {
    // ── Mobile ── near-full-width
    poetryWidth: '90vw',
    poetryPad: '1rem',
    modalMaxWidth: '95vw',
    modalMaxHeight: '85vh',
    scrollPad: '0.75rem 1rem',
    profileImgSize: '80vw',
    profileTextMaxW: '90vw',
    titleFont: '1.5rem',
    radarHeight: '260px',
    sectionPad: '0.75rem',
    cardPad: '0.65rem',
    btnMinWidth: '100%',
    btnPad: '0.75rem 1rem',
    btnFont: '0.8rem',
  };
  
  // ── Ref for the radar chart element (captured as image for PDF) ──
  const radarRef = useRef(null);
  // ── Ref for the subgroup dynamics element ──
  const subgroupRef = useRef(null);
  // ── Ref for the CulturaForce / Cognitieve Driehoek card (captured as image for PDF) ──
  const culturaForceRef = useRef(null);

  // ── Cognitieve Driehoek data — shared between UI rendering and PDF generation ──
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
  ];

  // Generate and download a clean, document-style PDF
  const handleDownloadPdf = useCallback(async () => {
    if (!result) return;
    setIsGeneratingPdf(true);

    try {
      // ── PDF Setup ──
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, H = 297;
      const margin = 18;
      const contentW = W - margin * 2;
      let y = margin;

      // ── Enforce minimum font size of 8pt across all PDF text ──
      const PDF_MIN_FONT = 8;
      const _origSetFontSize = pdf.setFontSize.bind(pdf);
      pdf.setFontSize = (size) => _origSetFontSize(Math.max(size, PDF_MIN_FONT));

      // ── Color palette — exact match to website CSS values ──
      // bg     = #060612  modal/page background
      // green  = #00ff9d  primary accent (borders, headings, combinationText)
      // purple = #a855f7  archetype name, support, OCEAN header
      // orange = #f97316  main archetype, shadow headers, brand labels
      // red    = #ef4444  blindspot, error, neuroticism
      // cyan   = #22d3ee  OCEAN resonance label, stats
      // amber  = #fbbf24  conflict style accent, dissonance indicator
      // pink   = #f472b6  relationship pattern accent
      // white  = rgba(209,213,219)  primary body text
      // dimWhite = rgba(156,163,175) secondary body text
      // mutedGray = #64748b  metadata, labels, footers
      // cardBg = #0c0c1d  card backgrounds
      const bg        = [6, 6, 18];
      const orange    = [249, 115, 22];
      const purple    = [168, 85, 247];
      const green     = [29, 153, 4];
      const red       = [239, 68, 68];
      const cyan      = [34, 211, 238];
      const amber     = [251, 191, 36];
      const white     = [209, 213, 219];
      const dimWhite  = [156, 163, 175];
      const blue      = [59, 130, 246];
      const mutedGray = [100, 116, 139];
      const cardBg    = [12, 12, 29];

      // ── Track which pages have real content (to prune empty pages at the end) ──
      const pagesWithContent = new Set([1]); // page 1 (cover) always has content
      const markPage = () => pagesWithContent.add(pdf.internal.getNumberOfPages());

      // ── Helper: paint page background ──
      const paintBg = () => {
        pdf.setFillColor(...bg);
        pdf.rect(0, 0, W, H, 'F');
      };
      paintBg(); // first page

      // ── Helper: add page if needed ──
      let noPageBreak = false; // when true, suppress page breaks (e.g. resonantie sections on radar page)
      const ensureSpace = (needed) => {
        if (noPageBreak) return false;
        if (y + needed > H - margin) {
          pdf.addPage();
          paintBg();
          y = margin;
          markPage();
          return true;
        }
        return false;
      };

      // ── Helper: wrapped text ──
      const writeWrapped = (text, x, startY, maxW, fontSize, color, style = 'normal') => {
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', style);
        const lines = pdf.splitTextToSize(text, maxW);
        const lineH = fontSize * 0.45;
        for (let i = 0; i < lines.length; i++) {
          ensureSpace(lineH);
          pdf.text(lines[i], x, y);
          y += lineH;
        }
        return lines.length;
      };

      // ── Helper: section heading with colored left bar ──
      const sectionHeading = (title, color) => {
        ensureSpace(14);
        y += 4;
        pdf.setFillColor(...color);
        pdf.rect(margin, y - 4, 1.5, 7, 'F');
        pdf.setFontSize(12);
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title.toUpperCase(), margin + 5, y);
        y += 8;
      };

      // ── Helper: estimate rendered height of a markdown section (heading + content) ──
      // Used to decide whether to start a new page before rendering.
      const estimateSectionHeight = (title, content, maxW) => {
        let h = 14 + 4 + 8; // sectionHeading: ensureSpace(14) + y+=4 + y+=8
        if (!content) return h;
        const lines = content.split('\n');
        for (const raw of lines) {
          const trimmed = raw.trim();
          if (!trimmed) { h += 2; continue; }
          if (/^#{2,}\s/.test(trimmed)) { h += 3 + 5; continue; }
          if (/^\|[\s-:]+\|/.test(trimmed)) continue;
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            const cells = trimmed.slice(1, -1).split('|').map(c => c.trim()).filter(Boolean);
            const rowTxt = cells.join('  |  ');
            const rLines = pdf.splitTextToSize(rowTxt, maxW);
            h += rLines.length * 3.8;
            continue;
          }
          if (/^[*-]\s/.test(trimmed)) {
            const bLines = pdf.splitTextToSize(trimmed.replace(/^[*-]\s+/, '').replace(/\*\*/g, ''), maxW - 5);
            h += Math.max(1, bLines.length) * 4.2;
            continue;
          }
          const pLines = pdf.splitTextToSize(trimmed.replace(/\*\*/g, '').replace(/\*/g, ''), maxW);
          h += Math.max(1, pLines.length) * 4.3;
        }
        return h + 3; // trailing y+=3 in writePdfMarkdown
      };

      // ── Helper: start new page if section won't fit, then render it ──
      const renderSection = (title, content, color) => {
        const needed = estimateSectionHeight(title, content, contentW - 4);
        if (!noPageBreak && y + needed > H - margin) {
          pdf.addPage();
          paintBg();
          y = margin;
          markPage();
        }
        sectionHeading(cleanTitle(title), color);
        writePdfMarkdown(content, margin + 2, contentW - 4);
      };

      // ── Helper: render page content vertically justified (fill full page height) ──
      // renderFn receives a `gap` callback. Call gap() BETWEEN content blocks.
      // Extra vertical space is distributed equally among gap() calls so content
      // spans from top-margin to bottom-margin.
      // If content overflows one page, falls back to normal rendering with page breaks.
      const justifiedPage = async (renderFn) => {
        // Pass 1: measure total content height on temporary page
        pdf.addPage(); paintBg();
        const tmpPg = pdf.internal.getNumberOfPages();
        y = margin;
        const savedNPB = noPageBreak;
        noPageBreak = true;
        let gapCount = 0;
        await renderFn(() => { gapCount++; });
        const contentH = y - margin;
        noPageBreak = savedNPB;
        pdf.deletePage(tmpPg);

        const availableH = H - 2 * margin;

        if (contentH <= availableH && gapCount > 0) {
          // Content fits — render justified (spread to fill page)
          pdf.addPage(); paintBg(); markPage();
          y = margin;
          const extra = availableH - contentH;
          const gapSize = extra / gapCount;
          noPageBreak = true;
          await renderFn(() => { y += gapSize; });
          noPageBreak = savedNPB;
        } else {
          // Content overflows — render normally with page breaks
          pdf.addPage(); paintBg(); markPage();
          y = margin;
          await renderFn(() => {});
        }
      };

      // ── Helper: key-value line ──
      const keyValue = (key, value) => {
        if (!value) return;
        ensureSpace(6);
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...white);
        pdf.text(key + ':', margin + 2, y);
        const keyW = pdf.getTextWidth(key + ':  ');
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...white);
        const valLines = pdf.splitTextToSize(value, contentW - keyW - 4);
        pdf.text(valLines, margin + 2 + keyW, y);
        y += valLines.length * 4.2;
      };

      // ── Thin horizontal rule ──
      const hr = (color = mutedGray) => {
        ensureSpace(4);
        y += 2;
        pdf.setDrawColor(...color);
        pdf.setLineWidth(0.15);
        pdf.line(margin, y, W - margin, y);
        y += 4;
      };

      // ── Helper: markdown-aware AI content renderer ──
      const writePdfMarkdown = (mdText, x, maxW) => {
        if (!mdText) return;
        // Sanitize Unicode chars that break jsPDF helvetica encoding
        const sanitizePdf = (str) => str
          .replace(/\u2014/g, ' - ')   // em-dash
          .replace(/\u2013/g, ' - ')   // en-dash
          .replace(/\u2018|\u2019/g, "'") // curly single quotes
          .replace(/\u201C|\u201D/g, '"') // curly double quotes
          .replace(/\u2026/g, '...')   // ellipsis
          .replace(/\u00B7/g, '-')     // middle dot
          .replace(/[\u200B-\u200D\uFEFF]/g, ''); // zero-width chars
        const lines = mdText.split('\n');
        for (const raw of lines) {
          const trimmed = sanitizePdf(raw.trim());
          // Blank line → small gap
          if (!trimmed) { y += 2; continue; }
          // Horizontal divider (---, ***, ===) — skip entirely
          if (/^[-*=]{3,}$/.test(trimmed)) continue;
          // ## / ### heading
          if (/^#{2,}\s/.test(trimmed)) {
            const headText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
            ensureSpace(10);
            y += 3;
            pdf.setFontSize(10);
            pdf.setTextColor(...orange);
            pdf.setFont('helvetica', 'bold');
            const hLines = pdf.splitTextToSize(headText, maxW);
            for (const hl of hLines) { ensureSpace(5); pdf.text(hl, x, y); y += 5; }
            continue;
          }
          // Table separator — skip
          if (/^\|[\s-:]+\|/.test(trimmed)) continue;
          // Table row
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            const cells = trimmed.slice(1, -1).split('|').map(c => c.replace(/\*\*/g, '').trim()).filter(Boolean);
            if (!cells.length) continue;
            ensureSpace(4);
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...white);
            const rowTxt = cells.join('  |  ');
            const rLines = pdf.splitTextToSize(rowTxt, maxW);
            for (const rl of rLines) { ensureSpace(3.8); pdf.text(rl, x, y); y += 3.8; }
            continue;
          }
          // Bullet: * or -
          if (/^[*-]\s/.test(trimmed)) {
            const content = trimmed.replace(/^[*-]\s+/, '').replace(/\*\*/g, '');
            const colonIdx = content.indexOf(':');
            ensureSpace(5);
            pdf.setFontSize(8.5);
            if (colonIdx > 0 && colonIdx < 35) {
              const label = content.slice(0, colonIdx + 1);
              const value = content.slice(colonIdx + 1).trim();
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(...white);
              pdf.text('\u2022', x, y);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(...white);
              const lw = pdf.getTextWidth(label + ' ');
              pdf.text(label, x + 4, y);
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(...white);
              const vLines = pdf.splitTextToSize(value, maxW - 4 - lw);
              pdf.text(vLines[0] || '', x + 4 + lw, y);
              y += 4.2;
              for (let vi = 1; vi < vLines.length; vi++) { ensureSpace(4.2); pdf.text(vLines[vi], x + 4, y); y += 4.2; }
            } else {
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(...white);
              pdf.text('\u2022', x, y);
              pdf.setTextColor(...white);
              const bLines = pdf.splitTextToSize(content, maxW - 5);
              for (const bl of bLines) { ensureSpace(4.2); pdf.text(bl, x + 5, y); y += 4.2; }
            }
            continue;
          }
          // Regular paragraph — strip bold markers, render in white
          const text = trimmed.replace(/\*\*/g, '').replace(/\*/g, '');
          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...white);
          const pLines = pdf.splitTextToSize(text, maxW);
          for (const pl of pLines) { ensureSpace(4.3); pdf.text(pl, x, y); y += 4.3; }
        }
        y += 3;
      };

      // ── Helper: draw a basic data table ──
      const drawTable = (headers, rows, colWidths, options = {}) => {
        const { fontSize = 8, headerColor = green, rowColor = white, vPad = 5 } = options;
        const totalW = colWidths.reduce((a, b) => a + b, 0);
        const lh = fontSize * 0.45;
        const hPad = vPad <= 3 ? 1.5 : 2;
        const baseline = lh * 0.75; // jsPDF text y is baseline

        // Header
        pdf.setFontSize(fontSize); pdf.setFont('helvetica', 'bold');
        const hCells = headers.map((h, i) => pdf.splitTextToSize(h, colWidths[i] - hPad * 2));
        const hRowH = Math.max(...hCells.map(c => c.length)) * lh + vPad;
        ensureSpace(hRowH + 2);
        pdf.setFillColor(...cardBg);
        pdf.rect(margin, y, totalW, hRowH, 'F');
        pdf.setDrawColor(...mutedGray);
        pdf.setLineWidth(0.15);
        pdf.rect(margin, y, totalW, hRowH, 'S');
        let cxh = margin;
        colWidths.forEach((cw, i) => { if (i < colWidths.length - 1) { cxh += cw; pdf.line(cxh, y, cxh, y + hRowH); } });
        pdf.setTextColor(...headerColor);
        let colX = margin;
        hCells.forEach((lines, i) => {
          const blockH = lines.length * lh;
          const startY = y + (hRowH - blockH) / 2 + baseline;
          lines.forEach((line, li) => pdf.text(line, colX + hPad, startY + li * lh));
          colX += colWidths[i];
        });
        y += hRowH;

        // Rows
        rows.forEach((row, ri) => {
          pdf.setFontSize(fontSize); pdf.setFont('helvetica', 'normal');
          const cells = row.map((cell, i) => pdf.splitTextToSize(String(cell || ''), colWidths[i] - hPad * 2));
          const lineCount = Math.max(...cells.map(c => c.length));
          const cellH = lineCount * lh + vPad;
          ensureSpace(cellH + 0.5);
          pdf.setFillColor(...(ri % 2 === 0 ? bg : cardBg));
          pdf.rect(margin, y, totalW, cellH, 'F');
          pdf.setDrawColor(...mutedGray); pdf.setLineWidth(0.1);
          pdf.rect(margin, y, totalW, cellH, 'S');
          let cx = margin;
          colWidths.forEach((cw, i) => { if (i < colWidths.length - 1) { cx += cw; pdf.line(cx, y, cx, y + cellH); } });
          pdf.setTextColor(...rowColor);
          colX = margin;
          cells.forEach((lines, i) => {
            const blockH = lines.length * lh;
            const startY = y + (cellH - blockH) / 2 + baseline;
            lines.forEach((line, li) => pdf.text(line, colX + hPad, startY + li * lh));
            colX += colWidths[i];
          });
          y += cellH;
        });
        y += vPad <= 3 ? 2 : 4;
      };

      // ═══════════════════════════════════════════════════
      // PAGE 1: COVER — Large profile + extended archetype
      // ═══════════════════════════════════════════════════

      // Top brand line — "GARDEN FOR LIFE: Archetype Analyse" left, date right
      const coverDate = new Date().toLocaleDateString('nl-NL');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...white);
      pdf.setFont('helvetica', 'normal');
      pdf.text('GARDEN FOR LIFE: Archetype Analyse', margin, y);
      pdf.text(coverDate, W - margin, y, { align: 'right' });
      y += 3;
      pdf.setDrawColor(...purple);
      pdf.setLineWidth(0.4);
      pdf.line(margin, y, W - margin, y);
      y += 16;

      // Large profile image (centered, ~90mm)
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = result.imageUrl;
        });
        const imgCanvas = document.createElement('canvas');
        const imgSize = 600;
        imgCanvas.width = imgSize;
        imgCanvas.height = imgSize;
        const ctx = imgCanvas.getContext('2d');
        // Circular mask
        ctx.beginPath();
        ctx.arc(imgSize / 2, imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 0, 0, imgSize, imgSize);
        const imgData = imgCanvas.toDataURL('image/png');
        const pdfImgSize = 90;
        const imgX = W / 2 - pdfImgSize / 2;
        pdf.addImage(imgData, 'PNG', imgX, y, pdfImgSize, pdfImgSize);
        // Clickable hyperlink over the image — opens full-res in browser
        if (result.imageUrl) pdf.link(imgX, y, pdfImgSize, pdfImgSize, { url: result.imageUrl });
        // Purple border ring around circular image
        pdf.setDrawColor(...purple);
        pdf.setLineWidth(1.5);
        pdf.circle(W / 2, y + pdfImgSize / 2, pdfImgSize / 2, 'S');
        y += pdfImgSize + 12;
      } catch {
        y += 8;
      }

      // Extended Archetype Name — large, centered (1 of 72)
      pdf.setFontSize(26);
      pdf.setTextColor(...purple);
      pdf.setFont('helvetica', 'bold');
      pdf.text(result.name || '', W / 2, y, { align: 'center' });
      y += 10;

      // Subtitle (extendedSubtitle)
      if (result.extendedSubtitle) {
        pdf.setFontSize(12);
        pdf.setTextColor(...orange);
        pdf.setFont('helvetica', 'normal');
        pdf.text(result.extendedSubtitle, W / 2, y, { align: 'center' });
        y += 8;
      }

      // Quote — italic description under the archetype name
      if (result.description) {
        y += 2;
        const quoteText = `\u201C${result.description}\u201D`;
        const quoteLines = pdf.splitTextToSize(quoteText, contentW - 30);
        pdf.setFontSize(10);
        pdf.setTextColor(...white);
        pdf.setFont('helvetica', 'italic');
        quoteLines.forEach(line => {
          pdf.text(line, W / 2, y, { align: 'center' });
          y += 5.5;
        });
        y += 6;
      }

      // Score — large, placed directly below the archetype quote
      y += 4;
      pdf.setFontSize(22);
      pdf.setTextColor(...green);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${result.totalScore} / ${result.maxScore}`, W / 2, y, { align: 'center' });
      y += 9;
      pdf.setFontSize(8.5);
      pdf.setTextColor(...white);
      pdf.setFont('helvetica', 'normal');
      pdf.text('DELTAWERKEN DATAPUNTEN', W / 2, y, { align: 'center' });
      y += 10;

      // ═══════════════════════════════════════════════════
      // PAGE 2: LEGAL / COMPLIANCE
      // ═══════════════════════════════════════════════════
      await justifiedPage(async (gap) => {

      // Header
      pdf.setFontSize(16);
      pdf.setTextColor(...green);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Juridische Informatie & Disclaimer', margin, y);
      y += 4;
      pdf.setDrawColor(...green);
      pdf.setLineWidth(0.4);
      pdf.line(margin, y, W - margin, y);
      y += 10;

      // ── Legal section helper (card-style) ──
      const legalSection = (title, body) => {
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        const bodyLines = pdf.splitTextToSize(body, contentW - 16);
        const blockH = 12 + bodyLines.length * 4;
        ensureSpace(blockH + 4);
        // Card background
        pdf.setFillColor(...cardBg);
        pdf.roundedRect(margin, y - 2, contentW, blockH, 2, 2, 'F');
        // Left accent bar — neutral grey
        pdf.setFillColor(...mutedGray);
        pdf.rect(margin, y - 2, 2, blockH, 'F');
        // Title — white
        pdf.setFontSize(10);
        pdf.setTextColor(...white);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin + 8, y + 4);
        // Body
        pdf.setFontSize(8.5);
        pdf.setTextColor(...white);
        pdf.setFont('helvetica', 'normal');
        const bodyY = y + 10;
        bodyLines.forEach((line, i) => {
          pdf.text(line, margin + 8, bodyY + i * 4);
        });
        y += blockH + 6;
      };
      gap();

      legalSection(
        '1. Productomschrijving',
        'Dit document is gegenereerd door het Garden for Life Assessment System, een zelfreflectie-instrument gebaseerd op het Deltawerken model. ' +
        'De resultaten in dit rapport zijn gebaseerd op een AI-gestuurd archetyperingsmodel en vormen geen klinische diagnose, psychologisch advies of medische beoordeling. ' +
        'Het systeem kent op basis van uw antwoorden een archetypecombinatie toe die bedoeld is als spiegel voor persoonlijke reflectie.'
      );
      gap();

      legalSection(
        '2. Metaforisch Kader & Wetenschappelijke Context',
        'Dit systeem maakt gebruik van termen en concepten uit de neurowetenschappen, kwantumbiologie en Zero Point Energy (ZPE). ' +
        'Deze worden uitsluitend metaforisch ingezet als denkkader en worden niet gepresenteerd als gevestigde wetenschap. ' +
        'Verwijzingen naar neurotransmitters, kwantumvelden of energetische patronen dienen als beeldspraak om gedragspatronen te duiden, niet als wetenschappelijke claims.'
      );
      gap();

      legalSection(
        '3. AI Agent Prompt — Verantwoordelijkheid',
        'De AI Agent Prompt die in dit document is opgenomen, is een experimenteel gegenereerd stijlprofiel. ' +
        'De stijlrichtlijnen in deze prompt zijn geen klinisch profiel maar een gedragsmatige reflectievoorkeur. ' +
        'Gebruik in externe AI-tools (zoals ChatGPT, Claude of andere) valt volledig buiten de verantwoordelijkheid van Garden For Life. ' +
        'De gebruiker aanvaardt volledige verantwoordelijkheid voor het gebruik van deze prompt buiten het Garden for Life platform.'
      );
      gap();

      legalSection(
        '4. Gegevensbescherming (AVG/GDPR)',
        'Garden for Life verwerkt persoonsgegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG/GDPR). ' +
        'Assessment-resultaten worden maximaal 90 dagen bewaard op beveiligde servers binnen de EU (Frankfurt, Duitsland). ' +
        'E-mailadressen en weergavenamen worden versleuteld opgeslagen (AES-256-GCM). ' +
        'Na de bewaartermijn worden gegevens automatisch en onherroepelijk verwijderd. ' +
        'U heeft te allen tijde het recht om uw account en alle bijbehorende gegevens direct te verwijderen via uw profielinstellingen.'
      );
      gap();

      legalSection(
        '5. Intellectueel Eigendom',
        'Het Deltawerken model, de archetypenstructuur, het scoringssysteem en alle bijbehorende teksten en visualisaties zijn intellectueel eigendom van Garden For Life. ' +
        'Dit document is uitsluitend bedoeld voor persoonlijk gebruik door de ontvanger. ' +
        'Reproductie, publicatie of commercieel gebruik van (delen van) dit rapport zonder schriftelijke toestemming is niet toegestaan.'
      );
      gap();

      legalSection(
        '6. Aansprakelijkheid',
        'Garden for Life aanvaardt geen aansprakelijkheid voor beslissingen genomen op basis van de resultaten in dit rapport. ' +
        'Dit instrument is geen vervanging voor professioneel psychologisch, medisch of therapeutisch advies. ' +
        'Bij psychische klachten of zorgen wordt geadviseerd contact op te nemen met een gekwalificeerde zorgverlener. ' +
        'Het gebruik van dit rapport en de daarin opgenomen AI Agent Prompt geschiedt geheel op eigen risico van de gebruiker.'
      );
      gap();

      // Consent acknowledgment
      y += 2;
      pdf.setFillColor(...cardBg);
      pdf.roundedRect(margin, y - 2, contentW, 18, 2, 2, 'F');
      pdf.setDrawColor(...green);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, y - 2, contentW, 18, 2, 2, 'S');
      pdf.setFontSize(8);
      pdf.setTextColor(...green);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Toestemming bevestigd', margin + 8, y + 4);
      pdf.setFontSize(7.5);
      pdf.setTextColor(...white);
      pdf.setFont('helvetica', 'normal');
      pdf.text('De gebruiker heeft bij het downloaden van dit document bevestigd kennis te hebben', margin + 8, y + 9);
      pdf.text('genomen van bovenstaande voorwaarden en de verantwoordelijkheid voor gebruik te aanvaarden.', margin + 8, y + 13);
      y += 22;
      gap();

      // Contact
      pdf.setFontSize(7);
      pdf.setTextColor(...white);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Vragen of verzoeken? Neem contact op via het Garden for Life platform.', W / 2, y, { align: 'center' });
      });

      // ═══════════════════════════════════════════════════
      // PAGE 3: BELANGRIJKE CONTEXT
      // ═══════════════════════════════════════════════════
      pdf.addPage(); paintBg(); markPage(); y = margin;

      sectionHeading('Belangrijke Context', green);

      writeWrapped(
        'Waar traditionele persoonlijkheidstesten je in \u00E9\u00E9n hokje plaatsen, brengt het Deltawerken Model in kaart hoe jouw zenuwstelsel navigeert tussen instinct en aanpassing \u2014 en wat dat je kost.',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 3;
      writeWrapped(
        'Het theoretische fundament combineert drie onderzoekstradities: de archetypische psychologie van Carl Jung, het neurobiologische Triple Network Model, en de Big Five persoonlijkheidstheorie (OCEAN). Deze worden samengebracht in HET oosterse persoonlijkheids framework dat niet alleen meet w\u00E1t je doet, maar vanuit welke laag je opereert.',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 6;

      // ── Garden For Life Bronmodellen ──
      ensureSpace(14);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...purple);
      pdf.text('Garden For Life Bronmodellen', margin + 2, y);
      y += 6;

      writeWrapped(
        'De Deltawerken Driehoek structureert de verhouding tussen drie fundamentele waarden\u00F6ri\u00EBntaties: waarheid, goedheid en schoonheid. Deze driehoek \u2014 verwant aan Plato\u2019s transcendentalia \u2014 bepaalt de dieptelaag van de assessment. In dit model navigeert elke archetype op deze driehoek: niet alleen als gedragskenmerken, maar als ori\u00EBntatie op wat er werkelijk toe doet.',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 3;
      writeWrapped(
        'Het Triple Network Wiel positioneert de 12 kern-archetypen op een geometrisch wiel op basis van de drie grote hersennetwerken die Vinod Menon en collega\u2019s beschreven: het Central Executive Network (orde, executie), het Default Mode Network (reflectie, betekenisgeving) en het Salience Network (responsiviteit, adaptatie). De 12 posities zijn verbonden via vijf lijntypes \u2014 gedeelde hardware, feedback-bruggen, schaduwassen, cognitieve synergiedriehoeken en frictie-assen \u2014 die samen het volledige netwerk van het archetype-systeem vormen.',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 3;
      writeWrapped(
        '\u2018Cells within Cells Interlinked\u2019 is het hi\u00EBrarchische model dat de ontologische lagen relationeert naar de maatschappij: van fysiologische basisbehoeften (verwant aan Maslows behoeftehi\u00EBrarchie) via zelfactualisatie en collectief geheugen naar intimiteit en transcendentie. Dit model verklaart waarom onze test niet alleen persoonlijkheid meet, maar de ontwikkelingslaag als dynamiek tussen natuurlijke aanleg en culturele conditionering blootlegt. \u2014 een principe dat Jean Piaget beschreef als cognitieve stadia en dat Carl Jung benaderde als individuatie.',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 6;

      // ── Deltawerken image + Van Vraag Naar Score (bottom-aligned layout) ──
      const vvnsTexts = [
        'Het onderzoek bestaat uit 36 vragen verdeeld over vijf onderwerpen: Zelf, Ander, Macht, Wijsheid en Mysterie. Elke vraag biedt zes antwoorden \u2014 drie vanuit Nature (het ongedwongen instinct) en drie vanuit Culture (de aangeleerde strategie). Je kiest er twee: de eerste is je kern, de tweede resoneert maar minder sterk. Dit levert 72 datapunten.',
        'Het onderscheid tussen Nature en Culture is gebaseerd op John Vervaeke\u2019s 4P-framework: participatory en perspectival knowing (je weet het doordat je het BENT \u2014 Nature) versus propositional en procedural knowing (je weet DAT je het hebt en HOE je ermee navigeert \u2014 Culture). De antwoorden zijn zo geschreven dat beide even authentiek aanvoelen \u2014 het verschil zit in de korrel van de taal, niet in de oppervlakte.',
        'Elke keuze distribueert punten niet alleen naar het gekozen archetype, maar vloeit via de geometrische verbindingen van het wiel. Een Nature-keuze activeert de biologische hardware (de groene en blauwe verbindingen) en werpt een schaduw naar de 180\u00B0 tegenpool (de paarse verbinding). Een Culture-keuze activeert het aangeleerde cognitieve netwerk (de gele driehoeken). Dit principe \u2014 dat gedrag niet ge\u00EFsoleerd opereert maar door neurale netwerken resoneert \u2014 is consistent met het werk van Menon over cross-network connectivity en de Default Mode-hypothese van Marcus Raichle.',
      ];

      // Pre-measure Van Vraag Naar Score section height
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
      const vvnsLineH = 8.5 * 0.45;
      const vvnsMW = contentW - 4;
      const vvnsCounts = vvnsTexts.map(t => pdf.splitTextToSize(t, vvnsMW).length);
      const vvnsTotalH = 6 + vvnsCounts[0] * vvnsLineH + 3 + vvnsCounts[1] * vvnsLineH + 3 + vvnsCounts[2] * vvnsLineH;

      // Position Van Vraag so last line sits at page bottom
      const pageBottom = H - margin;
      const vvnsStartY = pageBottom - vvnsTotalH;

      const yAfterBronText = y;

      try {
        const dwImgEl = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = deltawerkenImg;
        });
        const dwNaturalH = (dwImgEl.naturalHeight / dwImgEl.naturalWidth) * contentW;
        let dwH = Math.min(dwNaturalH, 55) * 1.45;
        let dwW = (dwImgEl.naturalWidth / dwImgEl.naturalHeight) * dwH;
        if (dwW > contentW) { dwW = contentW; dwH = (dwImgEl.naturalHeight / dwImgEl.naturalWidth) * dwW; }
        const dwX = margin + (contentW - dwW) / 2;
        const dwY = yAfterBronText + (vvnsStartY - yAfterBronText - dwH) / 2 - 10;
        pdf.addImage(deltawerkenImg, 'PNG', dwX, dwY, dwW, dwH);
      } catch {
        // image load failed
      }

      // ── Van Vraag Naar Score (bottom-aligned) ──
      y = vvnsStartY;
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...purple);
      pdf.text('Van Vraag Naar Score', margin + 2, y);
      y += 6;

      writeWrapped(vvnsTexts[0], margin + 2, y, contentW - 4, 8.5, white);
      y += 3;
      writeWrapped(vvnsTexts[1], margin + 2, y, contentW - 4, 8.5, white);
      y += 3;
      writeWrapped(vvnsTexts[2], margin + 2, y, contentW - 4, 8.5, white);

      // ═══════════════════════════════════════════════════
      // PAGE 4: FUNDERING VAN DE TEST (was page 5)
      // ═══════════════════════════════════════════════════
      await justifiedPage(async (gap) => {

      sectionHeading('De Fundering van de Test', purple);

      writeWrapped(
        'De fundering voor de test is gebouwd op universele geometrie, eeuwenoude wijsheid vertaald met moderne jargon. ' +
        'De numerologie die is ontstaan tijdens het ontwerpen resoneert met verschillende mythologie\u00EBn maar dus ook met moderne wetenschappen zoals ' +
        'quantumfysica, neurobiologie en astronomie \u2014 niet te verwarren met astrologie, dit heeft van nature een relatie met persoonlijkheids-psychologie.',
        margin + 2, y, contentW - 4, 9, white
      );
      y += 4;
      writeWrapped(
        'Een complexe uiteenzetting van 1 realiteit, alleen mogelijk door differentiatie, de scheiding en tevens actualisering naar 2. ' +
        'Maar wat is determinatie nou waard wanneer alles vast staat? ' +
        'De 3de axis is de kern van transformatie en de gratis lunch in het patroon van onze gemodelleerde psychologie.',
        margin + 2, y, contentW - 4, 9, white
      );
      y += 4;
      writeWrapped(
        'Gebouwd op verschillende westerse vondingen in de neurobiologie zijn we tot de conclusie gekomen dat het brein 2 hersendelen heeft, onderverdeelbaar in Orde en Chaos.',
        margin + 2, y, contentW - 4, 9, white
      );
      y += 3;
      writeWrapped(
        'Sage tot aan Judge domineren in het orde domein; Lover tot Trickster domineren in het chaos domein.',
        margin + 2, y, contentW - 4, 9, dimWhite, 'italic'
      );
      y += 5;
      writeWrapped(
        'Deze twee delen komen samen tot een geheel van 6 biologische cognitieve netwerken die gehardwired zijn:',
        margin + 2, y, contentW - 4, 9, white
      );
      y += 5;
      gap();

      drawTable(
        ['GROEP', 'NETWERK', 'ARCHETYPEN', 'DRIJFVEER'],
        [
          ['Ruling',     'CEN Dominantie',        'Ruler (12), Judge (1)',      'Externe structuur en orde'],
          ['Relational', 'Limbic Coupling',        'Lover (2), Caregiver (3)',   'Emotionele fusie en empathie'],
          ['Seeker',     'Hoge Openness',          'Innocent (4), Explorer (5)', 'Zuiverheid en ontdekking'],
          ['Chaos',      'Salience Network',       'Outlaw (6), Trickster (7)',  'Disruptie en lage consci\u00EBntieusheid'],
          ['Abstract',   'DMN Hyper-connectie',    'Sage (8), Artist (9)',       'Interne reflectie en subjectiviteit'],
          ['Agency',     'Extraversie / Wilskracht','Magician (10), Hero (11)',   'Actie en transformatie'],
        ],
        [30, 42, 50, 52],
        { fontSize: 7, vPad: 3 }
      );

      y += 5;
      gap();
      drawTable(
        ['Diepte', 'Getal', 'Afleiding', 'Manifestatie'],
        [
          ['0', '3',                  'kiem',                                'Drievoudig Netwerkmodel (DMN, SN, CEN)'],
          ['1', '6 = 3 \u00D7 2',      'polariteitssplitsing',                '6 biogroepen, 6 antwoorden, 6 rotatiesleutels'],
          ['2', '12 = 3 \u00D7 2\u00B2','opnieuw verdubbeld',                  '12 archetypen op het wiel'],
          ['3', '36 = 3\u00B2 \u00D7 2\u00B2','3 in het kwadraat \u00D7 4',  '36 vragen (3 per archetype)'],
          ['4', '72 = 3\u00B2 \u00D7 2\u00B3','binaire verdubbeling',        '72 keuzes, 72 uitgebreide uitkomsten'],
        ],
        [16, 42, 52, 64],
        { fontSize: 7, vPad: 3 }
      );

      y += 5;
      gap();
      writeWrapped(
        '3 is het ware atoom. Al het andere is 3, maar dan verdubbeld, gekwadrateerd of als faculteit berekend:',
        margin + 2, y, contentW - 4, 9, white, 'bold'
      );
      y += 2;
      writeWrapped(
        '3 verdrievoudigde netwerken -> verdubbeld door polariteit -> verdubbeld door archetype-individuatie -> gekwadrateerd voor vragen -> verdubbeld voor keuzes -> als faculteit berekend voor punten.',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 3;
      writeWrapped(
        'De 5 lagen vormen het enige structurele element dat het patroon doorbreekt \u2014 maar 5 is zelf 3 + 2, 2\u00D79 vragen en 3\u00D76 \u2014 de triade herenigd met haar dualiteitsoperator. ' +
        'Het systeem rust op een 3 die voortdurend in een spiegel kijkt. Zelf-9 en Ander-9 geven je de navigatie voor Macht-6, Magie-6 en de gespiegelde Wijsheid-6. ' +
        'Het getal 6 is het atoom van dit hele beoordelingssysteem, en alles vloeit daaruit voort:',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 5;
      gap();

      drawTable(
        ['Hoeken', 'Toepassing', 'Weergave'],
        [['30\u00B0 = 360/12', 'Boog per archetype', 'Hoekafstand in het radardiagram']],
        [42, 50, 82],
        { fontSize: 7, vPad: 3 }
      );

      ensureSpace(8);
      y += 5;
      pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...white);
      pdf.text('Geometrische / heilige verbindingen:', margin + 2, y);
      y += 5;
      [
        '72\u00B0 = 360\u00B0/5 = de hoek van een regelmatige vijfhoek \u2014 en we hebben exact 5 lagen',
        '36\u00B0 = 360\u00B0/10 = de helft van een vijfhoekige hoek \u2014 tevens 6\u00B2',
        '6 is zowel het kleinste perfecte getal (1+2+3 = 6 = 1\u00D72\u00D73) als het enige getal dat zowel een driehoeksgetal als een faculteit is',
      ].forEach(b => {
        ensureSpace(6);
        pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...white);
        pdf.text('\u2022', margin + 2, y);
        const bLines = pdf.splitTextToSize(b, contentW - 8);
        bLines.forEach(bl => { ensureSpace(4.5); pdf.text(bl, margin + 7, y); y += 4.5; });
      });
      y += 5;
      ensureSpace(8);
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...dimWhite);
      pdf.text('Niet slecht voor een psychologische test.', margin + 2, y);
      y += 10;
      });

      // ═══════════════════════════════════════════════════
      // PAGE 5: 72 ARCHETYPES CROSS-REFERENCE (was page 6)
      // ═══════════════════════════════════════════════════
      await justifiedPage(async (gap) => {

      sectionHeading('72 Archetypes \u2014 Culturele & Mythologische Kruisverwijzing', orange);

      ensureSpace(8);
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...white);
      pdf.text('\u2022', margin + 2, y);
      const fBullet1 = pdf.splitTextToSize(
        '12 Kern archetypes. In de realiteit van relationaliteit betekent dit dat er 72 archetypes zijn (12\u00D76 relaties).',
        contentW - 8
      );
      fBullet1.forEach(bl => { ensureSpace(4.5); pdf.text(bl, margin + 7, y); y += 4.5; });
      y += 5;
      gap();

      drawTable(
        ['Traditie / Discipline', 'Het Concept', 'Betekenis & Belang', 'Thematische Kruisverwijzing'],
        [
          ['Numerologie',          'Oneindige Voltooiing',     '8 (Oneindigheid) \u00D7 9 (Voltooiing) = 72. Reduceert tot 9 (7+2), het getal van dienstbaarheid.', 'Transformatie & Wedergeboorte'],
          ['Heilige Geometrie',   'De Vijfhoek',               '72 graden is de exacte middelpuntshoek van een regelmatige vijfhoek.', 'Goddelijke Architectuur'],
          ['Astronomie',          'Precessie van de equinoxen', 'De zon verplaatst zich elke 72 jaar 1 graad t.o.v. de sterrenbeelden (cyclus van 25.920 jaar).', 'Kosmisch Uurwerk'],
          ['Chinese Mythologie',  '72 Transformaties',         'Sun Wukong beheerst 72 Aardse-Demon transformaties voor ultiem aanpassingsvermogen.', 'Controle over Chaos'],
          ['Chinese Filosofie',   '72 Discipelen',             'Confucius had 72 kerndiscipelen die zijn werk volledig beheersten.', 'Verspreiding over de Wereld'],
          ['Chinese Mythologie',  '72 Grotten',                'De Bloemen-Fruitberg telt 72 grotten, elk met een demonenkoning die eer bewijst.', 'Kosmisch Bestuur'],
          ['Joodse Mystiek',      '72 Namen van God',          '72 drietallen van Hebreeuwse letters afgeleid uit Exodus, kanalen voor goddelijke transformatie.', 'Goddelijke Architectuur'],
          ['Joodse Mystiek',      '72 Engelen',                'De wereld krijgt supervisie van 72 beschermengelen, elk met een specifiek deel van de aarde.', 'Kosmisch Bestuur'],
          ['Joodse Mystiek',      'Jakobs ladder',             'De ladder die hemel en aarde verbindt, wordt ge\u00EFnterpreteerd als hebbende 72 sporten.', 'Verbinding van Werelden'],
          ['Christendom',         'De 72 Discipelen',          'Jezus zendt 72 discipelen uit om zijn leer onder alle naties te verspreiden.', 'Verspreiding over de Wereld'],
          ['Christelijke Mystiek', 'De Wederopstanding',       '72 uur vertegenwoordigt de exacte tijd verstreken tussen de kruisiging en de wederopstanding.', 'Transformatie & Wedergeboorte'],
          ['Islamitische Traditie','72 Metgezellen',           'Imam Hoessein werd vergezeld door 72 volgelingen tijdens de Slag bij Karbala \u2014 ultieme toewijding.', 'Opoffering & Toewijding'],
          ['Egyptische Mythologie','Het Osiris-complot',       '72 samenzweerders spanden samen met Seth om de god Osiris te doden.', 'Transformatie & Wedergeboorte'],
        ],
        [36, 32, 68, 38],
        { fontSize: 7.5 }
      );
      gap();

      // ── TNM WHEEL — static model image below the table ──
      try {
        const tnmImgEl = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = tnmWheelImg;
        });
        // Hard cap at 60mm (75mm × 0.8) — fixed size
        const maxH = 60;
        const naturalH = (tnmImgEl.naturalHeight / tnmImgEl.naturalWidth) * contentW;
        const finalH = Math.min(naturalH, maxH);
        const finalW = finalH === naturalH ? contentW : (tnmImgEl.naturalWidth / tnmImgEl.naturalHeight) * finalH;
        const offsetX = margin + (contentW - finalW) / 2;
        pdf.addImage(tnmWheelImg, 'PNG', offsetX, y, finalW, finalH);
        y += finalH + 4;
      } catch {
        y += 4;
      }
      });

      // ═══════════════════════════════════════════════════
      // PAGE 6: DE ARCHETYPISCHE LAAG + HOE HET RAPPORT ONTSTAAT + WETENSCHAPPELIJKE CONTEXT (was page 4)
      // ═══════════════════════════════════════════════════
      await justifiedPage(async (gap) => {

      sectionHeading('De Archetypische Laag', orange);

      writeWrapped(
        'De 12 archetypen zijn geen hokjes maar navigatiestijlen, geworteld in Jungs oorspronkelijke archetypische theorie en geactualiseerd via de OCEAN-dimensies van Paul Costa en Robert McCrae. Elk archetype heeft een specifiek Big Five-profiel: de Judge scoort hoog op Conscientiousness en laag op Agreeableness; de Lover hoog op Agreeableness en Openness; de Trickster hoog op Openness en laag op Conscientiousness. Deze mapping maakt de archetypische taal meetbaar zonder de diepte te verliezen.',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 3;
      writeWrapped(
        'De zes biologische groepen (Ruling, Relational, Seeker, Chaos, Abstract, Agency) delen neurale hardware \u2014 een principe ge\u00EFnspireerd op Jaak Panksepp\u2019s affectieve neurowetenschappen en de biochemische stressrespons-profielen per archetype (HPA-as activatie, oxytocine/dopamine/serotonine-dynamiek). De 180\u00B0 schaduwparen (Judge\u2013Trickster, Lover\u2013Sage, Caregiver\u2013Artist, Innocent\u2013Magician, Explorer\u2013Hero, Outlaw\u2013Ruler) volgen Jungs schaduwtheorie: je grootste groeirichting zit in de integratie van je absolute tegenpool.',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 6;
      gap();

      // ── Hoe Het Rapport Ontstaat ──
      ensureSpace(14);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...amber);
      pdf.text('Hoe Het Rapport Ontstaat', margin + 2, y);
      y += 6;

      writeWrapped(
        'Na het assessment berekent het systeem je volledige scoreprofiel inclusief de geometrische echo\u2019s. Een AI-model (Claude, Anthropic) analyseert dit profiel aan de hand van het volledige Deltawerken-framework: de drie bronmodellen, de biochemische archetypeprofielen, de 72 Extended Archetypes (Main \u00D7 Support-groep), en \u2014 indien aangeleverd \u2014 je OCEAN-data als externe validatie.',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 3;
      writeWrapped(
        'Het rapport dat je leest is geen generieke beschrijving van een type. Het is een dynamische analyse van jouw specifieke scoreprofiel: waar je hardware het sterkst resoneert, welke aangeleerde strategie\u00EBn je inzet, waar je blinde vlekken zitten, en welke schaduw-integratie je groeirichting vormt. De taal en structuur worden aangepast aan je dominante netwerkprofiel \u2014 analytisch voor CEN-dominante profielen, reflectief voor DMN-dominant, dynamisch voor Salience-dominant.',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 3;
      writeWrapped(
        'En mocht je nog twijfelen over de gegenereerde content,\nalles wat je zojuist hebt gelezen (behalve de modellen)\nis geschreven door hetzelfde model\ndie jouw score heeft geanalyseerd.',
        margin + 2, y, contentW - 4, 8.5, dimWhite, 'italic'
      );
      y += 2;

      // ── Cells within Cells image — between Hoe Het Rapport Ontstaat and Wetenschappelijke Context ──
      try {
        const cellsImgEl = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = cellsImg;
        });
        const cellsNaturalH = (cellsImgEl.naturalHeight / cellsImgEl.naturalWidth) * contentW;
        const cellsAvail = H - margin - y - 80; // reserve ~80mm for Wetenschappelijke Context + refs below
        const cellsH = Math.min(cellsNaturalH, cellsAvail, 55);
        const cellsW = (cellsImgEl.naturalWidth / cellsImgEl.naturalHeight) * cellsH;
        // draw 1.406x larger (1.48 * 0.95), anchored at bottom edge (grows upward + sideways), shifted right
        const cellsScale = 1.406;
        const drawH = cellsH * cellsScale;
        const drawW = cellsW * cellsScale;
        const cellsX = margin + (contentW - drawW) / 2 + 35; // +35mm to the right
        const cellsY = y - (drawH - cellsH); // shift up so bottom stays at y + cellsH
        pdf.addImage(cellsImg, 'PNG', cellsX, cellsY, drawW, drawH);
        y += cellsH;
      } catch {
        y += 0;
      }
      gap();

      // ── Wetenschappelijke Context ──
      ensureSpace(14);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...orange);
      pdf.text('Wetenschappelijke Context', margin + 2, y);
      y += 6;

      writeWrapped(
        'Het Deltawerken Model is een zelfreflectie-instrument, geen klinisch diagnostisch systeem. De neurobiologische termen zijn conceptuele metaforen die wetenschappelijk onderzoek als inspiratiebron gebruiken \u2014 geen diagnostische claims. Het model integreert inzichten uit:',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 4;

      const sciRefs = [
        { color: white, text: 'Archetypische psychologie: C.G. Jung (1921), Collected Works Vol. 6 \u2014 Psychological Types; Carol Pearson (1991), Awakening the Heroes Within.' },
        { color: white, text: 'Neurale netwerken: V. Menon (2011), Large-scale brain networks in cognition, Trends in Cognitive Sciences; M.E. Raichle (2001), A default mode of brain function, PNAS.' },
        { color: white, text: 'Persoonlijkheidstheorie: P.T. Costa & R.R. McCrae (1992), Revised NEO Personality Inventory (NEO-PI-R); L.R. Goldberg (1993), The structure of phenotypic personality traits, American Psychologist.' },
        { color: white, text: 'Cognitieve ontwikkeling: J. Piaget (1954), The Construction of Reality in the Child; J. Vervaeke (2019), Awakening from the Meaning Crisis (lecture series); J. Peterson (1999), Maps of Meaning.' },
        { color: white, text: 'Affectieve neurowetenschappen: J. Panksepp (1998), Affective Neuroscience; S. Porges (2011), The Polyvagal Theory. Biochemische stressrespons en HPA-as dynamiek per archetype.' },
        { color: white, text: 'Creativiteit & neurale integratie: M. Benedek et al. (2014), Brain connectivity during creative cognition, Neuropsychologia; R.E. Beaty et al. (2018), Robust prediction of creativity from brain activity, PNAS.' },
      ];

      sciRefs.forEach(({ color: refColor, text }) => {
        ensureSpace(12);
        pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...refColor);
        pdf.text('\u2022', margin + 2, y);
        const refLines = pdf.splitTextToSize(text, contentW - 10);
        refLines.forEach(rl => {
          ensureSpace(4.3);
          pdf.text(rl, margin + 7, y);
          y += 4.3;
        });
        y += 1.5;
      });
      });

      // ═══════════════════════════════════════════════════
      // CONTENT PAGES
      // ═══════════════════════════════════════════════════
      await justifiedPage(async (gap) => {

      // ── WHY THIS COMBINATION ──
      if (result.combinationText) {
        sectionHeading(`Waarom jij ${result.name} bent`, green);
        writeWrapped(result.combinationText, margin + 2, y, contentW - 4, 8.5, white);
        y += 4;
        hr();
      }
      gap();

      // ── MAIN ARCHETYPE ──
      sectionHeading(`De Essentie — ${result.mainName} (${result.mainNameEn})`, purple);
      if (result.group) {
        pdf.setFontSize(11);
        pdf.setTextColor(...white);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Groep: ${result.group}`, margin + 2, y);
        y += 6;
        pdf.setFont('helvetica', 'normal');
      }
      keyValue('Motivatie', result.mainMotivation);
      keyValue('Kracht', result.mainPositive);
      keyValue('Schaduwkant', result.mainShadowTrait);
      y += 2;
      hr();
      gap();

      // ── SUPPORT ARCHETYPE ──
      sectionHeading(`De Vermenigvuldiging — ${result.secondaryName} (${result.secondaryNameEn})`, orange);
      if (result.supportGroup) {
        pdf.setFontSize(11);
        pdf.setTextColor(...white);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Support Groep: ${result.supportGroup}`, margin + 2, y);
        y += 6;
        pdf.setFont('helvetica', 'normal');
      }
      keyValue('Motivatie', result.secondaryMotivation);
      keyValue('Kracht', result.secondaryPositive);
      if (result.secondaryDescription) {
        keyValue('Profiel', result.secondaryDescription);
      }
      if (result.harmonyActive) {
        ensureSpace(6);
        pdf.setFontSize(8.5);
        pdf.setTextColor(...green);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`\u2666 Harmony: ${result.mainNameEn} + ${result.secondaryNameEn} — complementaire as`, margin + 2, y);
        y += 5;
      }
      y += 2;
      gap();

      // ── ALL 6 OUTCOMES TABLE (part of Vermenigvuldiging section) ──
      if (result.allSupportArchetypes) {
        const cols = result.allSupportArchetypes;
        // Helper: split combination text into meaning (1st sentence) and gift (rest)
        const splitMeaningGift = (text) => {
          if (!text) return { meaning: '', gift: '' };
          const match = text.match(/^([^.!?]+[.!?])\s*(.*)$/);
          if (match) return { meaning: match[1].trim(), gift: match[2].trim() };
          return { meaning: text, gift: '' };
        };

        // Helper: draw wrapped text in a cell, returns height consumed
        const MAX_CELL_LINES = 5;
        const cellText = (txt, cx, cy, cw, fontSize, color, fontStyle = 'normal') => {
          if (!txt) return 0;
          pdf.setFontSize(fontSize);
          pdf.setFont('helvetica', fontStyle);
          pdf.setTextColor(...color);
          const allLines = pdf.splitTextToSize(txt, cw - 2);
          const lines = allLines.length > MAX_CELL_LINES
            ? [...allLines.slice(0, MAX_CELL_LINES - 1), allLines[MAX_CELL_LINES - 1] + '\u2026']
            : allLines;
          const lh = fontSize * 0.42;
          lines.forEach((line, li) => {
            pdf.text(line, cx + 1, cy + li * lh);
          });
          return lines.length * lh;
        };

        const measureCellH = (txt, cw, fontSize) => {
          if (!txt) return 0;
          pdf.setFontSize(fontSize);
          const lines = pdf.splitTextToSize(txt, cw - 2);
          return Math.min(lines.length, MAX_CELL_LINES) * (fontSize * 0.42);
        };

        // ── NEW LAYOUT: archetypes as rows, Betekenis / Gift / Valkuil as columns ──
        const colGap = 1.5;
        const nameColW = contentW * 0.20;
        const dataColW = (contentW - nameColW - colGap * 3) / 3;
        const nameFontSize = 8;
        const dataFontSize = 7.5;

        const nameRowData = cols.map(sa => {
          const { meaning, gift } = splitMeaningGift(sa.combination);
          return { ...sa, meaning, gift };
        });

        // Column x positions
        const col0x = margin;
        const col1x = margin + nameColW + colGap;
        const col2x = col1x + dataColW + colGap;
        const col3x = col2x + dataColW + colGap;

        // Measure row heights
        const rowHeights = nameRowData.map(sa => {
          const hName = 6 + measureCellH(sa.extendedName, nameColW, nameFontSize);
          const hMeaning = 2 + measureCellH(sa.meaning, dataColW, dataFontSize);
          const hGift = 2 + measureCellH(sa.gift, dataColW, dataFontSize);
          const hShadow = 2 + measureCellH(sa.shadow, dataColW, dataFontSize);
          return Math.max(hName, hMeaning, hGift, hShadow) + 4;
        });

        // Draw rows
        nameRowData.forEach((sa, i) => {
          const rowH = rowHeights[i];
          ensureSpace(rowH + colGap);

          if (sa.isActive) { pdf.setFillColor(40, 30, 60); }
          else { pdf.setFillColor(18, 18, 28); }
          pdf.roundedRect(col0x, y - 1, contentW, rowH, 1, 1, 'F');

          // Name column: group label + extended name
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...(sa.isActive ? [168, 85, 247] : [100, 160, 140]));
          pdf.text(sa.group, col0x + 1, y + 2.5);
          cellText(sa.extendedName, col0x, y + 5, nameColW, nameFontSize, sa.isActive ? white : [160, 185, 175], 'bold');
          if (sa.isActive) {
            // active row highlighted — no extra label needed
          }

          // Data columns
          cellText(sa.meaning, col1x, y + 2, dataColW, dataFontSize, [215, 215, 220]);
          cellText(sa.gift,    col2x, y + 2, dataColW, dataFontSize, [215, 215, 220]);
          cellText(sa.shadow,  col3x, y + 2, dataColW, dataFontSize, [195, 195, 205]);

          y += rowH + colGap;
        });
      }
      });

      // ── SHADOW (new page) ──
      await justifiedPage(async (gap) => {
      if (result.shadowPartner) {
        sectionHeading(`De Schaduw — Archetype: ${result.shadowNameEn} (180\u00B0 tegenpool van ${result.mainNameEn})`, purple);
        if (result.mainShadowTension) {
          writeWrapped(result.mainShadowTension, margin + 2, y, contentW - 4, 8.5, white);
          y += 2;
        }
        if (result.shadowInsight) {
          writeWrapped(result.shadowInsight, margin + 2, y, contentW - 4, 8.5, white);
        } else if (result.shadowDescription) {
          writeWrapped(result.shadowDescription, margin + 2, y, contentW - 4, 8.5, white);
        }
        y += 4;
        hr();
      }
      gap();

      // ── BLINDSPOT ──
      if (result.blindspotPartner) {
        sectionHeading(`De Blindspot — Archetype: ${result.blindspotNameEn} (180\u00B0 tegenpool van ${result.secondaryNameEn || result.supportArchetype})`, red);
        if (result.blindspotDescription) {
          writeWrapped(result.blindspotDescription, margin + 2, y, contentW - 4, 8.5, white);
          y += 2;
        }
        if (result.blindspotShadowTrait) {
          keyValue('Sabotage patroon', result.blindspotShadowTrait);
        }
        y += 4;
        hr();
      }
      gap();

      // ── OCEAN PERSONALITY PROFILE ──
      if (result.extendedOcean) {
        const ocean = result.extendedOcean.ocean;
        const OCEAN_DIMS = ['O', 'C', 'E', 'A', 'N'];
        const OCEAN_FULL_NL = { O: 'Openheid', C: 'Ordelijkheid', E: 'Extraversie', A: 'Meegaandheid', N: 'Neuroticisme' };
        const OCEAN_COLORS_PDF = {
          O: [167, 139, 250], C: [34, 211, 238], E: [103, 232, 249], A: [129, 140, 248], N: [196, 181, 253],
        };

        sectionHeading('OCEAN Persoonlijkheidsprofiel', blue);

        // Legend row
        ensureSpace(6);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        let legX = margin + 2;
        OCEAN_DIMS.forEach(dim => {
          pdf.setTextColor(...OCEAN_COLORS_PDF[dim]);
          const legTxt = `${dim}=${OCEAN_FULL_NL[dim]}   `;
          pdf.text(legTxt, legX, y);
          legX += pdf.getTextWidth(legTxt);
        });
        y += 6;

        // ── Single-panel OCEAN: archetype profile (X/10) ──
        const oceanBarH = 4;
        const labelW = 26;
        const scoreColW = 14;
        const oceanBarW = contentW - labelW - scoreColW - 4;

        OCEAN_DIMS.forEach(dim => {
          ensureSpace(9);
          const col = OCEAN_COLORS_PDF[dim];
          const score10 = (ocean && ocean[dim]) != null ? ocean[dim] : 0;
          const pct10 = score10 / 10;
          // Dim letter
          pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...col);
          pdf.text(dim, margin + 2, y + 1.5);
          // Label
          pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...white);
          pdf.text(OCEAN_FULL_NL[dim], margin + 9, y + 1.5);
          // Track background
          const bx = margin + labelW;
          pdf.setFillColor(22, 22, 30);
          pdf.roundedRect(bx, y - 1.5, oceanBarW, oceanBarH, 1, 1, 'F');
          // Fill
          pdf.setFillColor(...col);
          pdf.roundedRect(bx, y - 1.5, Math.max(pct10 * oceanBarW, 2), oceanBarH, 1, 1, 'F');
          // Score
          pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...col);
          pdf.text(`${score10}/10`, bx + oceanBarW + 3, y + 1.5);

          y += 9;
        });
        y += 2;

        // Resonantie / Dissonantie analysis (only when ocean data was imported)
        if (result.oceanImported) {
          const GROUP_OCEAN_EXPECT = {
            RULING:     { O: 'low',  C: 'high', E: 'mid',  A: 'low',  N: 'low'  },
            RELATIONAL: { O: 'mid',  C: 'mid',  E: 'high', A: 'high', N: 'mid'  },
            SEEKER:     { O: 'high', C: 'low',  E: 'mid',  A: 'mid',  N: 'mid'  },
            CHAOS:      { O: 'mid',  C: 'low',  E: 'mid',  A: 'low',  N: 'high' },
            ABSTRACT:   { O: 'high', C: 'mid',  E: 'low',  A: 'mid',  N: 'mid'  },
            AGENCY:     { O: 'mid',  C: 'high', E: 'high', A: 'mid',  N: 'low'  },
          };
          const OCEAN_FULL_EN = {
            O: 'Openness', C: 'Conscientiousness', E: 'Extraversion', A: 'Agreeableness', N: 'Neuroticism',
          };
          const expect = GROUP_OCEAN_EXPECT[result.group] || GROUP_OCEAN_EXPECT.RULING;
          const analyses = OCEAN_DIMS.map(dim => {
            const pct100 = (ocean[dim] || 0) * 10;
            const exp = expect[dim];
            let status = 'neutral', explanation = '';
            if (exp === 'high') {
              if (pct100 >= 60) { status = 'resonance'; explanation = `Je ${OCEAN_FULL_EN[dim]} (${pct100}) is in resonantie met je ${result.group}-netwerk.`; }
              else { status = 'dissonance'; explanation = `Je ${result.group}-profiel verwacht hoge ${OCEAN_FULL_EN[dim]}, maar je scoort ${pct100}. Dit gedrag is mogelijk aangeleerd.`; }
            } else if (exp === 'low') {
              if (pct100 <= 40) { status = 'resonance'; explanation = `Je lage ${OCEAN_FULL_EN[dim]} (${pct100}) past bij je ${result.group}-architectuur.`; }
              else { status = 'dissonance'; explanation = `Je ${result.group}-netwerk verwacht lage ${OCEAN_FULL_EN[dim]}, maar je scoort ${pct100}. Mogelijk aangeleerde compensatie.`; }
            }
            return { dim, pct100, status, explanation };
          }).filter(a => a.status !== 'neutral');

          if (analyses.length > 0) {
            ensureSpace(10);
            pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...blue);
            pdf.text('OCEAN RESONANTIE & DISSONANTIE', margin + 2, y);
            y += 7;

            analyses.forEach(({ dim, pct100, status, explanation }) => {
              const isRes = status === 'resonance';
              const ac = isRes ? green : amber;
              const expLines = pdf.splitTextToSize(explanation, contentW - 18);
              const bh = 10 + expLines.length * 3.8;
              ensureSpace(bh + 3);
              pdf.setFillColor(...(isRes ? [0, 25, 12] : [28, 22, 0]));
              pdf.roundedRect(margin + 2, y - 2, contentW - 4, bh, 1.5, 1.5, 'F');
              pdf.setFillColor(...OCEAN_COLORS_PDF[dim]);
              pdf.rect(margin + 2, y - 2, 2, bh, 'F');
              pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...OCEAN_COLORS_PDF[dim]);
              pdf.text(`${dim}`, margin + 7, y + 3.5);
              pdf.setTextColor(...ac);
              pdf.text(` — ${isRes ? 'Resonantie' : 'Dissonantie'} (${pct100}/100)`, margin + 12, y + 3.5);
              pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...white);
              expLines.forEach((line, li) => pdf.text(line, margin + 7, y + 9 + li * 3.8));
              y += bh + 4;
            });
            y += 2;
          }
        }

        hr();

        // Neuroticism Trigger
        if (result.neuroticismTrigger) {
          const tLines = pdf.splitTextToSize(result.neuroticismTrigger, contentW - 8);
          const bh = 10 + tLines.length * 4.2;
          ensureSpace(bh + 3);
          pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...red);
          pdf.text('NEUROTICISME TRIGGER', margin + 2, y + 3.5);
          pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...white);
          tLines.forEach((line, li) => pdf.text(line, margin + 2, y + 9 + li * 4.2));
          y += bh + 5;
        }

        // Core Profile (Workplace, Conflict, Relationship, Individuation)
        if (result.coreProfile) {
          const coreItems = [
            { label: 'Superkracht op de Werkvloer', text: result.coreProfile.workplaceSuperpower, color: orange },
            { label: 'Conflictstijl',               text: result.coreProfile.conflictStyle,        color: orange },
            { label: 'Relatiepatroon',              text: result.coreProfile.relationshipPattern,  color: orange },
            { label: 'Individuatiepad',             text: result.coreProfile.individuationPath,    color: orange },
          ];
          coreItems.forEach(({ label, text, color: c }) => {
            if (!text) return;
            ensureSpace(14);
            pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...c);
            pdf.text(label.toUpperCase(), margin + 2, y);
            y += 5;
            writeWrapped(text, margin + 2, y, contentW - 4, 8.5, white);
            y += 3;
          });
        }

      }
      });

      // ── PERSOONLIJKHEIDSRAPPORT VERGELIJKING — comparison with uploaded OCEAN profile ──
      const reportCompSection = displaySections
        ? displaySections.find(s => s.isComparison || /persoonlijkheidsrapport.*vergelijk/i.test(s.title))
        : null;
      const hasUploadedFiles = (uploadedFiles || []).length > 0;

      if (reportCompSection || hasUploadedFiles) {
        await justifiedPage(async (gap) => {

        // ── Page heading ──
        sectionHeading('Persoonlijkheidsrapport Vergelijking', blue);
        gap();

        // ── Uploaded file label ──
        const fileNames = (uploadedFiles || []).map(f => f.name).join(', ');
        if (fileNames) {
          ensureSpace(10);
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...mutedGray);
          pdf.text(`Geüpload rapport: ${fileNames}`, margin + 2, y);
          y += 7;
        }

        // ── GFL OCEAN reference bars + user OCEAN bars — SIDE BY SIDE ──
        if (result.extendedOcean?.ocean) {
          const OCEAN_DIMS_REF = ['O', 'C', 'E', 'A', 'N'];
          const OCEAN_FULL_REF = { O: 'Openheid', C: 'Ordelijkheid', E: 'Extraversie', A: 'Meegaandheid', N: 'Neuroticisme' };
          const OCEAN_COLORS_REF = {
            O: [167, 139, 250], C: [34, 211, 238], E: [103, 232, 249], A: [129, 140, 248], N: [196, 181, 253],
          };

          // ── Uploaded OCEAN scores: provided directly by the backend parser ──
          // (parsed from the raw file text before the AI runs — no AI-text regex needed)
          const userOcean = uploadedOceanScores || null;

          // ── Layout constants ──
          const halfW = (contentW - 6) / 2; // 6mm gap between the two panels
          const leftX = margin;
          const rightX = margin + halfW + 6;
          const barH = 3;
          const labelW = 28;
          const scoreW = 16;

          // ── Helper: draw one OCEAN panel ──
          const drawOceanPanel = (panelX, panelW, title, getScore, formatScore, maxVal) => {
            const panelBarW = panelW - labelW - scoreW - 4;
            pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...blue);
            pdf.text(title, panelX + 2, y);
            const headerY = y;

            let rowY = headerY + 6;
            OCEAN_DIMS_REF.forEach(dim => {
              const score = getScore(dim);
              if (score == null) return;
              const pct = Math.min(score / maxVal, 1);
              const col = OCEAN_COLORS_REF[dim];
              // Dim letter
              pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...col);
              pdf.text(dim, panelX + 2, rowY + 1.5);
              // Label
              pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...mutedGray);
              pdf.text(OCEAN_FULL_REF[dim], panelX + 9, rowY + 1.5);
              // Bar track
              const bx = panelX + labelW;
              pdf.setFillColor(22, 22, 30);
              pdf.roundedRect(bx, rowY - 1.5, panelBarW, barH, 1, 1, 'F');
              // Bar fill
              pdf.setFillColor(...col);
              pdf.roundedRect(bx, rowY - 1.5, Math.max(pct * panelBarW, 1.5), barH, 1, 1, 'F');
              // Score label
              pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...col);
              pdf.text(formatScore(dim, score), bx + panelBarW + 3, rowY + 1.5);

              rowY += 6.5;
            });
            return rowY;
          };

          // ── Draw both panels ──
          ensureSpace(50);
          const savedY = y;

          // LEFT: GFL Assessment result (0-100, derived from archetype weights)
          drawOceanPanel(
            leftX, halfW,
            'DELTAWERKEN SCORE',
            (dim) => result.oceanScores?.[dim] ?? 0,
            (_dim, score) => `${score}/100`,
            100
          );

          // RIGHT: Uploaded OCEAN profile (0-100) — only shown when parsed from uploaded file
          if (userOcean) {
            y = savedY; // reset y to draw at same vertical position
            drawOceanPanel(
              rightX, halfW,
              'GEÜPLOAD PROFIEL',
              (dim) => userOcean[dim] ?? null,
              (_dim, score) => `${score}/100`,
              100
            );
          }

          // Advance y past both panels
          y = savedY + 6 + OCEAN_DIMS_REF.length * 6.5 + 4;

          pdf.setDrawColor(...mutedGray);
          pdf.setLineWidth(0.15);
          pdf.line(margin, y, W - margin, y);
          y += 6;
        }
        gap();

        // ── AI comparison text — structured with headers ──
        if (reportCompSection) {
          const rawText = reportCompSection.content
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .trim();

          // Split into lines and classify into sections
          const lines = rawText.split('\n');
          const sections = []; // { type: 'header'|'subheader'|'text', text }

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Detect markdown headers (## or ###)
            const h1Match = trimmed.match(/^#{1,2}\s+(.*)/);
            const h3Match = trimmed.match(/^#{3,4}\s+(.*)/);

            if (h1Match) {
              sections.push({ type: 'header', text: h1Match[1].trim() });
              continue;
            } else if (h3Match) {
              sections.push({ type: 'subheader', text: h3Match[1].trim() });
              continue;
            }

            // Detect section boundaries by content keywords
            const lower = trimmed.toLowerCase();
            if (/vergelijkingsrapport|convergente\s+punten|overeenkomst/i.test(lower) && trimmed.length < 80) {
              sections.push({ type: 'header', text: trimmed.replace(/[:.]$/, '') });
              continue;
            }
            if (/spanningsveld|divergente\s+punten|verschil/i.test(lower) && trimmed.length < 80) {
              sections.push({ type: 'header', text: trimmed.replace(/[:.]$/, '') });
              continue;
            }
            if (/^conclusie/i.test(lower) && trimmed.length < 80) {
              sections.push({ type: 'header', text: 'Conclusie en Reflectie' });
              const afterColon = trimmed.replace(/^conclusie\s*[:.]?\s*/i, '');
              if (afterColon.length > 0) sections.push({ type: 'text', text: afterColon });
              continue;
            }
            // Detect "Stap X:" style headers the AI sometimes generates
            if (/^stap\s+\d/i.test(lower) && trimmed.length < 120) {
              sections.push({ type: 'header', text: trimmed.replace(/[:.]$/, '') });
              continue;
            }

            // Detect trait subheaders: "Openheid voor Ervaringen (Hoog - 72):" or numbered items like "1. Trait (Score):"
            if (/^(?:\d+\.\s*)?[A-Z][a-zéëïöü].*\([^)]*\d+\)/.test(trimmed) && trimmed.length < 120) {
              sections.push({ type: 'subheader', text: trimmed.replace(/:$/, '') });
              continue;
            }

            sections.push({ type: 'text', text: trimmed });
          }

          // If no header was detected at all, add default header at top
          if (!sections.find(s => s.type === 'header')) {
            sections.unshift({ type: 'header', text: 'Vergelijkingsrapport' });
          }

          // Render sections — use ensureSpace for page breaks (no manual reportMaxY)
          for (const section of sections) {
            if (section.type === 'header') {
              gap();
              ensureSpace(12);
              y += 2;
              pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(...blue);
              pdf.text(section.text.toUpperCase(), margin + 2, y);
              y += 2;
              pdf.setDrawColor(...blue);
              pdf.setLineWidth(0.3);
              pdf.line(margin + 2, y, margin + 2 + pdf.getTextWidth(section.text.toUpperCase()), y);
              y += 4;
            } else if (section.type === 'subheader') {
              ensureSpace(10);
              y += 1.5;
              pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(...purple);
              const subLines = pdf.splitTextToSize(section.text, contentW - 6);
              for (const sl of subLines) {
                ensureSpace(5);
                pdf.text(sl, margin + 4, y);
                y += 4.0;
              }
              y += 1;
            } else {
              // Normal text paragraph
              pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(...white);
              const paraLines = pdf.splitTextToSize(section.text, contentW - 4);
              for (const pl of paraLines) {
                ensureSpace(5);
                pdf.text(pl, margin + 2, y);
                y += 4.0;
              }
              y += 1;
            }
          }
        } else if (hasUploadedFiles) {
          // AI didn't generate the section (e.g. AI failed) — show placeholder
          ensureSpace(30);
          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(...mutedGray);
          pdf.text(
            'De vergelijkingsanalyse kon niet worden gegenereerd. Start het assessment opnieuw met het geüploade bestand om een volledige vergelijking te ontvangen.',
            margin + 2, y, { maxWidth: contentW - 4 }
          );
        }
        });
      }

      // ── DUAL-CORE DYNAMICS + RADAR CHART (page 5) ──
      await justifiedPage(async (gap) => {
      if (result.subgroups && result.subgroups.length > 0) {
        sectionHeading('Dual-Core Dynamics', amber);

        // Legend
        const legY = y;
        pdf.setFillColor(...purple);
        pdf.rect(margin, legY - 1, 3, 3, 'F');
        pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...purple);
        pdf.text('NATURE', margin + 4.5, legY + 1.2);
        pdf.setFillColor(...orange);
        pdf.rect(margin + 26, legY - 1, 3, 3, 'F');
        pdf.setTextColor(...orange);
        pdf.text('CULTURE', margin + 30.5, legY + 1.2);
        pdf.setFontSize(6); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 110, 130);
        pdf.text('( /36 max )', margin + 55, legY + 1.2);
        y += 7;

        const GROUP_META_PDF = {
          Ruling:     { network: 'CEN Dominantie',          drive: 'Externe structuur en orde' },
          Relational: { network: 'Limbic Coupling',          drive: 'Emotionele fusie en empathie' },
          Seekr: 1, Judge: 2, Lover: 3, Caregiver: 4,
          Innocent: 5, Explorer: 6, Outlaw: 7, Trickster: 8,
          Sage: 9, Artist: 10, Magician: 11, Hero: 12,
        };

        const MAX_TOTAL = 36;
        const labelW    = 38;
        const scoreW    = 22;
        const colGap    = 3;
        const barAreaW  = contentW - labelW - scoreW - colGap * 2;
        const barX      = margin + labelW + colGap;
        const scoreX    = barX + barAreaW + colGap;
        const barH      = 2.5;

        result.subgroups.forEach(sg => {
          const hasBonus = sg.harmonyPoints > 0 || sg.shadowPoints > 0;
          const rowH = 14 + (hasBonus ? 5 : 0);
          ensureSpace(rowH);

          const meta      = GROUP_META_PDF[sg.group] || { network: sg.group, drive: sg.axis || '' };
          const natTotal  = (sg.leftNature  || 0) + (sg.rightNature  || 0);
          const cultTotal = (sg.leftCulture || 0) + (sg.rightCulture || 0);
          const natPct    = Math.min(natTotal  / MAX_TOTAL, 1);
          const cultPct   = Math.min(cultTotal / MAX_TOTAL, 1);

          // Network name (right-aligned in label area)
          pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(150, 220, 240);
          pdf.text(meta.network.toUpperCase(), margin + labelW, y + 1.5, { align: 'right' });

          // Drive subtitle
          pdf.setFontSize(5.5); pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 120, 140);
          const driveText = pdf.splitTextToSize(meta.drive, labelW - 1)[0] || meta.drive;
          pdf.text(driveText, margin + labelW, y + 5, { align: 'right' });

          const barY = y + 1;

          // Single stacked bar track (dark background)
          pdf.setFillColor(28, 33, 48);
          pdf.rect(barX, barY, barAreaW, barH, 'F');

          // Nature segment (purple) from left
          if (natPct > 0) {
            pdf.setFillColor(...purple);
            pdf.rect(barX, barY, natPct * barAreaW, barH, 'F');
          }
          // Culture segment (orange) immediately after nature
          if (cultPct > 0) {
            pdf.setFillColor(...orange);
            pdf.rect(barX + natPct * barAreaW, barY, cultPct * barAreaW, barH, 'F');
          }

          // Scores — N{n} C{c} on line 1, total/33 on line 2
          pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...purple);
          const natLabel = `N${natTotal}`;
          pdf.text(natLabel, scoreX, barY + 1.5);
          pdf.setTextColor(...orange);
          pdf.text(` C${cultTotal}`, scoreX + pdf.getTextWidth(natLabel), barY + 1.5);

          const sgTotal = natTotal + cultTotal;
          pdf.setFontSize(6); pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(150, 220, 240);
          const totalStr = `${sgTotal}`;
          pdf.text(totalStr, scoreX, barY + barH + 2.8);
          pdf.setFontSize(5); pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 130, 150);
          pdf.text('/36', scoreX + pdf.getTextWidth(totalStr) + 0.5, barY + barH + 2.8);

          // Archetype badges — uniform cyan (matches UI)
          const badgeY = barY + barH + 6;
          pdf.setFontSize(6); pdf.setFont('helvetica', 'bold');
          let bx = barX;
          [sg.leftLabel, sg.rightLabel].forEach(label => {
            const txt = label.toUpperCase();
            const tw  = pdf.getTextWidth(txt) + 4;
            pdf.setFillColor(12, 28, 38);
            pdf.setDrawColor(55, 110, 135);
            pdf.rect(bx, badgeY - 1.8, tw, 4, 'FD');
            pdf.setTextColor(150, 220, 240);
            pdf.text(txt, bx + 2, badgeY + 1.3);
            bx += tw + 2;
          });

          // Bonus points (harmony / shadow)
          if (hasBonus) {
            const bonusY = badgeY + 4.5;
            pdf.setFontSize(6); pdf.setFont('helvetica', 'normal');
            let bxB = barX;
            if (sg.harmonyPoints > 0) {
              pdf.setTextColor(...green);
              pdf.text(`✦ Harmony +${sg.harmonyPoints} pts`, bxB, bonusY);
              bxB += 36;
            }
            if (sg.shadowPoints > 0) {
              pdf.setTextColor(...orange);
              pdf.text(`✦ Shadow +${sg.shadowPoints} pts`, bxB, bonusY);
            }
          }

          y += rowH;
        });
        y += 4;
        hr();
      }

      // ── CULTURAFORCE — COGNITIEVE DRIEHOEK (same page as Dual-Core) ──
      {
        const archKey = (result.mainArchetype || '').toUpperCase();
        const tri = COG_TRIANGLES[archKey];
        if (tri) {
          // Section heading with amber left bar
          sectionHeading('Cognitieve Driehoek', amber);
          gap();

          // Intro paragraph
          writeWrapped(
            'Gele driehoeken vuren uitsluitend op Culture picks \u2014 ze representeren aangeleerd cognitief gedrag, niet biologische hardware. Groene en blauwe signalen tonen wie je bent; gele signalen tonen hoe je hebt leren navigeren.',
            margin + 2, y, contentW - 4, 8.5, dimWhite
          );
          y += 3;
          gap();

          // Active triangle mode name
          ensureSpace(12);
          pdf.setFontSize(10);
          pdf.setTextColor(...green);
          pdf.setFont('helvetica', 'bold');
          pdf.text(tri.mode.toUpperCase(), margin + 2, y);
          y += 5;

          // Members + networks
          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...dimWhite);
          pdf.text(tri.members.join(' \u00B7 ') + ' \u2014 ' + tri.networks, margin + 2, y);
          y += 6;

          // Tagline (italic, amber)
          writeWrapped(tri.tagline, margin + 2, y, contentW - 4, 8.5, amber, 'italic');
          y += 2;

          // What
          writeWrapped(tri.what, margin + 2, y, contentW - 4, 8.5, white);
          y += 2;
          gap();

          // Aangeleerde navigatie
          ensureSpace(6);
          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...amber);
          const navLabel = 'Aangeleerde navigatie: ';
          pdf.text(navLabel, margin + 2, y);
          const navLabelW = pdf.getTextWidth(navLabel);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...white);
          const navLines = pdf.splitTextToSize(tri.drive, contentW - 4 - navLabelW);
          pdf.text(navLines[0] || '', margin + 2 + navLabelW, y);
          y += 4.3;
          for (let i = 1; i < navLines.length; i++) { ensureSpace(4.3); pdf.text(navLines[i], margin + 2, y); y += 4.3; }
          y += 2;
          gap();

          // Hoog geel profiel
          ensureSpace(6);
          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...amber);
          const highLabel = 'Hoog geel profiel: ';
          pdf.text(highLabel, margin + 2, y);
          const highLabelW = pdf.getTextWidth(highLabel);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...white);
          const highLines = pdf.splitTextToSize(tri.high, contentW - 4 - highLabelW);
          pdf.text(highLines[0] || '', margin + 2 + highLabelW, y);
          y += 4.3;
          for (let i = 1; i < highLines.length; i++) { ensureSpace(4.3); pdf.text(highLines[i], margin + 2, y); y += 4.3; }
          y += 2;
          gap();

          // Groeirichting
          ensureSpace(6);
          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...amber);
          const growLabel = 'Groeirichting: ';
          pdf.text(growLabel, margin + 2, y);
          const growLabelW = pdf.getTextWidth(growLabel);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...white);
          const growLines = pdf.splitTextToSize(tri.growth, contentW - 4 - growLabelW);
          pdf.text(growLines[0] || '', margin + 2 + growLabelW, y);
          y += 4.3;
          for (let i = 1; i < growLines.length; i++) { ensureSpace(4.3); pdf.text(growLines[i], margin + 2, y); y += 4.3; }
          y += 4;
          gap();

          // Reference triangles (compact list)
          const others = ALL_COG_TRIANGLES.filter(t => t.id !== tri.id);
          if (others.length) {
            ensureSpace(others.length * 5 + 2);
            for (const ot of others) {
              pdf.setFontSize(8.5);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(...green);
              const modeText = ot.mode.toUpperCase();
              pdf.text(modeText, margin + 2, y);
              const modeW = pdf.getTextWidth(modeText + '  ');
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(...dimWhite);
              pdf.text(ot.members, margin + 2 + modeW, y);
              y += 4.5;
            }
          }
        }
      }
      });

      // ── GROEP DYNAMIEK + RADAR CHART — together on one page (only if content exists) ──
      const groepDynSection = displaySections?.find(s =>
        s.title?.toLowerCase().includes('groep dynamiek') ||
        s.title?.toLowerCase().includes('neurobiologische interpretatie')
      );
      const hasGroepOrRadar = groepDynSection || radarRef.current;
      if (hasGroepOrRadar) {
        pdf.addPage();
        paintBg();
        y = margin;
        markPage();
      }
      if (groepDynSection) {
        sectionHeading('Groep Dynamiek — Neurobiologische Interpretatie', cyan);
        writePdfMarkdown(groepDynSection.content, margin + 2, contentW - 4);
        y += 3;
        hr();
      }

      // ── RADAR CHART — same page as Groep Dynamiek ──
      if (radarRef.current) {
        y += 4;
        sectionHeading('Visuele Analyse — Triple Network Wiel', green);
        try {
          const radarCanvas = await html2canvas(radarRef.current, {
            backgroundColor: null,
            scale: 3,
            useCORS: true,
            logging: false,
          });
          const radarImg = radarCanvas.toDataURL('image/png');
          const radarW = contentW;
          const radarH = (radarCanvas.height / radarCanvas.width) * radarW;
          // If it fits on this page, center vertically in remaining space
          const availH = H - y - margin;
          const finalH = Math.min(radarH, availH);
          const finalW = finalH === radarH ? radarW : (radarCanvas.width / radarCanvas.height) * finalH;
          const offsetX = margin + (contentW - finalW) / 2;
          // Border container around the radar chart (respects page margins)
          const borderPad = 2;
          pdf.setDrawColor(...green);
          pdf.setLineWidth(0.5);
          pdf.rect(margin, y - borderPad, contentW, finalH + borderPad * 2);
          pdf.addImage(radarImg, 'PNG', offsetX, y, finalW, finalH);
          y += finalH + 6;
        } catch {
          y += 4;
        }
      }

      // ── 12A / 12B RESONANTIE SECTIONS — below radar chart on same page (forced) ──
      const resonantieSections = displaySections?.filter(s =>
        s.isResonantie ||
        /^1[23]\s*[ab][\s.:]/i.test(s.title || '') ||
        /professionele\s+resonantie|creatieve\s+resonantie/i.test(s.title || '')
      ) || [];
      if (resonantieSections.length > 0) {
        noPageBreak = true; // lock to current page — no overflow
        const resoColor = [29, 153, 4]; // green
        for (let ri = 0; ri < resonantieSections.length; ri++) {
          const rs = resonantieSections[ri];
          renderSection(rs.title, rs.content, resoColor);
          if (ri < resonantieSections.length - 1) hr();
        }
        noPageBreak = false;
      }

      // ── ANALYSIS SECTIONS (dedicated page) ──
      if (displaySections && displaySections.length > 0) {
        // Filter out Groep Dynamiek (rendered on page 5), report comparison (own page 9), and resonantie (below radar)
        const mainSections = displaySections.filter(s =>
          !s.isComparison &&
          !s.isResonantie &&
          !s.title?.toLowerCase().includes('groep dynamiek') &&
          !s.title?.toLowerCase().includes('neurobiologische interpretatie') &&
          !/persoonlijkheidsrapport.*vergelijk/i.test(s.title) &&
          !/^1[23]\s*[ab][\s.:]/i.test(s.title || '') &&
          !/professionele\s+resonantie|creatieve\s+resonantie/i.test(s.title || '')
        );
        if (mainSections.length > 0) {
          const getPdfSectionColor = (title) => {
            const t = cleanTitle(title || '').toLowerCase();
            if (t.includes('identiteit') || t.includes('waarom')) return green;
            if (t.includes('essentie') || t.includes('schaduw')) return purple;
            if (t.includes('vermenigvuldiging') || t.includes('prompt') || t.includes('agent')) return orange;
            if (t.includes('blindspot')) return red;
            if (t.includes('visuele')) return purple;
            if (t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi')) return amber;
            if (t.includes('groep dynamiek') || t.includes('neurobiologisch')) return cyan;
            if (t.includes('resonantie')) return green;
            if (t.includes('introductie')) return white;
            return green; // fallback
          };

          // Separate intro/disclaimer and AI agent prompt — they always share one dedicated page
          const regularSections = mainSections.filter(s =>
            !s.isAgentPrompt &&
            !/ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt/i.test(s.title) &&
            !s.title?.toLowerCase().includes('introductie')
          );
          const disclaimerSection = mainSections.find(s => s.title?.toLowerCase().includes('introductie'));
          const agentSection = mainSections.find(s =>
            s.isAgentPrompt || /ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt/i.test(s.title)
          );

          // ── Group sections by page ──
          // group1a = Identiteit / Waarom / Essentie / Vermenigvuldiging (one page)
          // group1b = Schaduw + images + Blindspot + Visuele Analyse (dedicated page, always together)
          // group2  = Alchemie / Schaakbord / Evolutie / Ontologie (one page)
          const isGroup1a = (title) => {
            const t = cleanTitle(title || '').toLowerCase();
            return t.includes('identiteit') || t.includes('waarom') || t.includes('essentie') || t.includes('vermenigvuldiging');
          };
          const isGroup1b = (title) => {
            const t = cleanTitle(title || '').toLowerCase();
            return t.includes('schaduw') || t.includes('blindspot') || t.includes('visuele');
          };
          const isGroup2 = (title) => {
            const t = cleanTitle(title || '').toLowerCase();
            return t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi');
          };
          const group1aSections = regularSections.filter(s => isGroup1a(s.title));
          const group1bSections = regularSections.filter(s => isGroup1b(s.title));
          const group2Sections  = regularSections.filter(s => isGroup2(s.title));
          const otherSections   = regularSections.filter(s => !isGroup1a(s.title) && !isGroup1b(s.title) && !isGroup2(s.title));

          // Render ungrouped sections on a dedicated page (only if there are any)
          if (otherSections.length > 0) {
            await justifiedPage(async (gap) => {
            otherSections.forEach((section, i) => {
              renderSection(section.title, section.content, getPdfSectionColor(section.title));
              if (i < otherSections.length - 1) { hr(); gap(); }
            });
            });
          }

          // ── Page 13a: Identiteit / Waarom / Essentie / Vermenigvuldiging ──
          if (group1aSections.length > 0) {
            await justifiedPage(async (gap) => {

            // ── Fixed Meta-Disclaimer (purple blockquote) before section 1 ──
            ensureSpace(20);
            pdf.setFillColor(20, 16, 36);
            const disclaimerX = margin;
            const disclaimerW = contentW;
            const disclaimerText = 'Meta-Disclaimer: Dit rapport is gegenereerd door het Garden For Life Deltawerken Model \u2014 een zelfreflectie-instrument, geen klinische diagnose. De gebruikte neurobiologische termen zijn metaforen binnen dit specifieke model. Raadpleeg een professional voor medisch of psychologisch advies.';
            pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic');
            const disclaimerLines = pdf.splitTextToSize(disclaimerText, disclaimerW - 8);
            const dlH = disclaimerLines.length * 3.5 + 4;
            pdf.rect(disclaimerX, y, disclaimerW, dlH, 'F');
            // Top bar instead of left bar
            pdf.setFillColor(168, 85, 247);
            pdf.rect(disclaimerX, y, disclaimerW, 0.75, 'F');
            pdf.setTextColor(200, 200, 215);
            let dlY = y + 5;
            for (const line of disclaimerLines) {
              pdf.text(line, disclaimerX + 5, dlY);
              dlY += 3.5;
            }
            y += dlH + 4;
            gap();

            group1aSections.forEach((section, i) => {
              renderSection(section.title, section.content, getPdfSectionColor(section.title));
              if (i < group1aSections.length - 1) { hr(); gap(); }
            });
            });
          }

          // ── Page 13b: Schaduw + images + Blindspot + Visuele Analyse (always together) ──
          if (group1bSections.length > 0) {
            await justifiedPage(async (gap) => {
            for (let gi = 0; gi < group1bSections.length; gi++) {
              const section = group1bSections[gi];
              const sTitle = cleanTitle(section.title || '').toLowerCase();
              renderSection(section.title, section.content, getPdfSectionColor(section.title));

              // After De Schaduw content: insert shadow + blindspot archetype images side-by-side
              if (sTitle.includes('schaduw') && result.shadowPartner && result.blindspotPartner) {
                gap();
                try {
                  const shadowImgSrc = getArchetypeImage(
                    result.shadowPartner,
                    ARCHETYPE_TO_GROUP[result.shadowPartner]
                  );
                  const blindImgSrc = getArchetypeImage(
                    result.blindspotPartner,
                    ARCHETYPE_TO_GROUP[result.blindspotPartner]
                  );
                  if (shadowImgSrc && blindImgSrc) {
                    const [shadowEl, blindEl] = await Promise.all([
                      new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = shadowImgSrc; }),
                      new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = blindImgSrc; }),
                    ]);
                    const imgGap = 6;
                    const halfW = (contentW - imgGap) / 2;
                    const availH = H - margin - y - 6;
                    const maxImgH = Math.min(availH, 65) * 0.9775;

                    // Helper: circular-clip an image onto a canvas and return data URL
                    const circleClip = (imgEl, size) => {
                      const c = document.createElement('canvas');
                      c.width = size; c.height = size;
                      const cx = c.getContext('2d');
                      cx.beginPath();
                      cx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                      cx.closePath();
                      cx.clip();
                      cx.drawImage(imgEl, 0, 0, size, size);
                      return c.toDataURL('image/png');
                    };

                    // Shadow archetype image (left) — circular with red border
                    const shadowAR = shadowEl.naturalHeight / shadowEl.naturalWidth;
                    const shadowH = Math.min(maxImgH, halfW * shadowAR);
                    const shadowW = shadowH / shadowAR;
                    const sDim = Math.min(shadowW, shadowH);
                    const sData = circleClip(shadowEl, 600);
                    const sX = margin + (halfW - sDim) / 2;
                    pdf.addImage(sData, 'PNG', sX, y, sDim, sDim);
                    pdf.setDrawColor(...red);
                    pdf.setLineWidth(1);
                    pdf.circle(sX + sDim / 2, y + sDim / 2, sDim / 2, 'S');
                    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...red);
                    pdf.text(result.shadowName || '', margin + halfW / 2, y + sDim + 3.5, { align: 'center' });

                    // Blindspot archetype image (right) — circular with red border
                    const blindAR = blindEl.naturalHeight / blindEl.naturalWidth;
                    const blindH = Math.min(maxImgH, halfW * blindAR);
                    const blindW = blindH / blindAR;
                    const bDim = Math.min(blindW, blindH);
                    const bData = circleClip(blindEl, 600);
                    const rightX = margin + halfW + imgGap;
                    const bX = rightX + (halfW - bDim) / 2;
                    pdf.addImage(bData, 'PNG', bX, y, bDim, bDim);
                    pdf.setDrawColor(...red);
                    pdf.setLineWidth(1);
                    pdf.circle(bX + bDim / 2, y + bDim / 2, bDim / 2, 'S');
                    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...red);
                    pdf.text(result.blindspotName || '', rightX + halfW / 2, y + bDim + 3.5, { align: 'center' });

                    y += Math.max(sDim, bDim) + 8;
                  }
                } catch {
                  y += 4;
                }
                gap();
              }

              // Skip the divider after the schaduw section (images already provide visual separation)
              if (gi < group1bSections.length - 1 && !sTitle.includes('schaduw')) { hr(); gap(); }
            }
            });
          }

          // ── Page 14: Alchemie / Neurale Schaakbord / Ontologie ──
          if (group2Sections.length > 0) {
            pdf.addPage(); paintBg(); markPage();
            y = margin;
            group2Sections.forEach((section, i) => {
              renderSection(section.title, section.content, getPdfSectionColor(section.title));
              if (i < group2Sections.length - 1) { hr(); }
            });
          }

          // AI Prompt: dedicated final page — fixed heading, KERN DISCLAIMER body first (no heading), then rest
          if (disclaimerSection || agentSection) {
            pdf.addPage();
            paintBg(); markPage();
            y = margin;
            // Fixed heading in orange
            sectionHeading('De volledige AI prompt', orange);
            // Agent prompt: strip intro text + first ## heading (KERN DISCLAIMER), show its body, then rest with headings
            if (agentSection) {
              let promptContent = (agentSection.content || '').trim();
              // Remove everything before the first ## sub-heading
              const firstSubIdx = promptContent.search(/(^|\n)##[ \t]/m);
              if (firstSubIdx >= 0) {
                promptContent = promptContent.slice(firstSubIdx).replace(/^\n/, '').trim();
              }
              // Strip the first ## heading line itself (KERN DISCLAIMER), keep its body
              promptContent = promptContent.replace(/^##[^\n]*\n+/, '').trim();
              writePdfMarkdown(promptContent, margin + 2, contentW - 4);
            }
          }
        }

        // Persoonlijkheidsrapport Vergelijking rendered earlier (after OCEAN page) — skip here
      }

      // ═══════════════════════════════════════════════════
      // FINAL FOOTER (last page)
      // ═══════════════════════════════════════════════════
      ensureSpace(14);
      markPage(); // footer always has content
      y += 4;
      pdf.setDrawColor(...purple);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, W - margin, y);
      y += 5;
      pdf.setFontSize(7);
      pdf.setTextColor(...white);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Garden for Life  \u2022  Archetype Analyse', W / 2, y, { align: 'center' });
      y += 3.5;
      pdf.text(`Score: ${result.totalScore} / ${result.maxScore}`, W / 2, y, { align: 'center' });
      y += 3.5;
      pdf.text(`Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}`, W / 2, y, { align: 'center' });
      y += 6;

      // ── Closing message + image: pinned to the bottom of the last page ──
      const hasBannerImage = siteBanner?.imageBase64 && siteBanner?.imageMimeType;
      const imgSizeMm = 26.5; // 75px display size (~26.5mm)
      // Image anchored at absolute bottom-right corner
      const imgX = W - margin - imgSizeMm;
      const imgY = H - margin - imgSizeMm; // outmost bottom edge

      // Text block bottom-aligns with the image bottom — 5 lines × ~4mm spacing plus line heights
      const lineH = 4.0;
      const closingTextW = hasBannerImage ? contentW - imgSizeMm - 6 : contentW - 4;
      // Pre-calculate wrapped line counts to size the block from the bottom up
      pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic');
      const line1 = pdf.splitTextToSize('Hoogachtende Meester,', closingTextW);
      const line2 = pdf.splitTextToSize('Jouw feedback is uiterst waardevol en in principe is dit jouw gift aan ons project, toch kan ik mijn gretigheid niet bedwingen en reik ik nog \u00E9\u00E9n laatste keer uit voor jouw hulp.', closingTextW);
      const line3 = pdf.splitTextToSize('Nodig iedereen uit waarvan je denkt dat ze in staat zijn om het onderzoek volledig te doorlopen, hoe meer data hoe beter wij kunnen optimaliseren.', closingTextW);
      const line4 = pdf.splitTextToSize('Zolang de beta-fase loopt is alleen het meester niveau toegankelijk.', closingTextW);
      const line4b = pdf.splitTextToSize('Een donatie is optioneel, maar is meer dan welkom en is directe voeding voor ons project! =)', closingTextW);
      const line5 = pdf.splitTextToSize('Anyway- pionier, hartelijk dank voor de tijd en attentie!', closingTextW);
      const gapSingle = lineH;       // 1× blank line gap
      const gapDouble = lineH * 2;   // 2× blank line gap
      const totalTextH =
        line1.length * lineH + gapDouble +
        line2.length * lineH +
        line3.length * lineH + gapSingle +
        line4.length * lineH +
        line4b.length * lineH + gapDouble +
        line5.length * lineH;
      // Align text block so its bottom matches image bottom
      let yMsg = imgY + imgSizeMm - totalTextH;

      pdf.setFontSize(7.5);
      pdf.setTextColor(...white);
      pdf.setFont('helvetica', 'italic');
      for (const l of line1) { pdf.text(l, margin + 2, yMsg); yMsg += lineH; }
      yMsg += gapDouble;
      for (const l of line2) { pdf.text(l, margin + 2, yMsg); yMsg += lineH; }
      for (const l of line3) { pdf.text(l, margin + 2, yMsg); yMsg += lineH; }
      yMsg += gapSingle;
      for (const l of line4) { pdf.text(l, margin + 2, yMsg); yMsg += lineH; }
      for (const l of line4b) { pdf.text(l, margin + 2, yMsg); yMsg += lineH; }
      yMsg += gapDouble;
      for (const l of line5) { pdf.text(l, margin + 2, yMsg); yMsg += lineH; }

      // Image: right-aligned, anchored at absolute bottom corner
      if (hasBannerImage) {
        try {
          const imgFormat = siteBanner.imageMimeType.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
          const bannerData = `data:${siteBanner.imageMimeType};base64,${siteBanner.imageBase64}`;
          pdf.addImage(bannerData, imgFormat, imgX, imgY, imgSizeMm, imgSizeMm);
        } catch { /* skip banner image on error */ }
      }

      // ── Prune any empty pages (pages that never received content) ──
      const totalPages = pdf.internal.getNumberOfPages();
      for (let p = totalPages; p >= 1; p--) {
        if (!pagesWithContent.has(p)) {
          pdf.deletePage(p);
        }
      }

      // ── Download ──
      const archetypeName = (result?.extendedName || 'Archetype').replace(/\s+/g, '_');
      pdf.save(`GardenForLife_${archetypeName}.pdf`);
    } catch (err) {
      console.error('[PDF] Generation failed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, displaySections, uploadedFiles]);
  
  // Stop wheel events from propagating to the pyramid scroll handler
  const handleWheelCapture = useCallback((e) => {
    e.stopPropagation();
  }, []);
  
  // Also attach a native wheel listener to block propagation at capture phase
  const outerRef = useRef(null);
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const stop = (e) => { e.stopPropagation(); };
    el.addEventListener('wheel', stop, { passive: false, capture: true });
    return () => el.removeEventListener('wheel', stop, { capture: true });
  }, []);

  return (
    <div 
      ref={outerRef}
      className="fixed inset-0 flex items-center justify-center pointer-events-auto"
      style={{ background: 'transparent', zIndex: 9999 }}
      onWheelCapture={handleWheelCapture}
    >
      {resultsLoadingProgress < 1 ? (
        /* ─── Loading Phase: transparent glass container (matches SectorFrame on landing pages) ─── */
        <div 
          style={{
            position: 'relative',
            width: 'min(90vw, 420px)',
            padding: '2.5rem 2rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            overflow: 'hidden',
            backgroundColor: 'rgba(1, 0, 2, 0.3)',
            boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168, 85, 247, 0.06), inset 0 0 30px rgba(168, 85, 247, 0.03)',
            transform: `translate(0, ${(1 - resultsModalProgress) * -15}vh) scale(${0.3 + resultsModalProgress * 0.7})`,
            opacity: resultsModalProgress,
          }}
        >
          {/* Corner borders (purple, matching SectorFrame pattern) */}
          {[
            { top: '-1px', left: '-1px', borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' },
            { top: '-1px', right: '-1px', borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' },
            { bottom: '-1px', left: '-1px', borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' },
            { bottom: '-1px', right: '-1px', borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' },
          ].map((corner, i) => (
            <div key={i} style={{
              position: 'absolute', width: '1rem', height: '1rem',
              border: '1.5px solid #a855f7',
              ...corner,
            }} />
          ))}

          {/* Holographic sheen */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)',
            backgroundSize: '400% 400%',
            mixBlendMode: 'screen',
          }} />

          {/* Noise texture overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '0.5rem',
            backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
            opacity: 0.03, mixBlendMode: 'overlay',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            {/* Spinner */}
            <div style={{
              width: '3rem',
              height: '3rem',
              border: '2px solid #a855f7',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />

            {/* Simple text message */}
            <p style={{
              fontFamily: "'Figtree', sans-serif",
              fontSize: '0.95rem',
              color: 'rgba(255, 254, 240, 0.8)',
              margin: 0,
              letterSpacing: '0.02em',
              lineHeight: '1.6',
              maxWidth: '320px',
            }}>
              We berekenen niet wie je bent.<br/>We berekenen de fysiologische prijs van wie je probeert te zijn.
            </p>

            {/* Error state: AI failed — show continue button */}
            {aiFailed && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'rgba(251, 191, 36, 0.8)',
                  fontFamily: "'Figtree', sans-serif",
                  margin: 0,
                }}>
                  AI analyse niet beschikbaar — basisresultaten beschikbaar.
                </p>
                <button
                  onClick={() => {
                    setAiReady(true);
                    if (onAiReady) onAiReady();
                  }}
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '0.35rem',
                    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    fontFamily: "'Figtree', sans-serif",
                    cursor: 'pointer',
                    letterSpacing: '0.05em',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.opacity = '0.85'}
                  onMouseLeave={e => e.target.style.opacity = '1'}
                >
                  Doorgaan zonder AI
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── Full Results Modal ─── */
        <div style={{
          position: 'relative',
          opacity: resultsModalProgress,
          animation: 'resultsModalFadeIn 0.6s ease-out',
          width: '100%',
          maxWidth: rs.modalMaxWidth,
        }}>

          {/* Modal Container - holographic glass */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: rs.modalMaxWidth,
            maxHeight: rs.modalMaxHeight,
            background: 'rgba(2, 0, 3, 0.3)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(29, 153, 4, 0.3)',
            borderRadius: '0.75rem',
            boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(29, 153, 4, 0.06), inset 0 0 30px rgba(29, 153, 4, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            color: '#fff',
            overflow: 'hidden',
          }}>

            {/* Holographic sheen */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '0.75rem', pointerEvents: 'none', background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)', backgroundSize: '400% 400%', backgroundRepeat: 'no-repeat', animation: 'holoSheen 45s ease-in-out infinite', mixBlendMode: 'screen' }} />

            {/* Scanline sweep */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '0.75rem', pointerEvents: 'none', background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)', backgroundSize: '100% 300%', animation: 'holoScanline 14s linear infinite' }} />
            
            {/* Noise overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: 0.03,
              mixBlendMode: 'overlay',
              zIndex: 0,
              background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 2px)',
            }} />

            {/* Top accent line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '1px',
              background: 'linear-gradient(to right, transparent, #1d9904, transparent)',
              zIndex: 50
            }} />
            
            {/* Scrollable Content */}
            <div 
              ref={scrollRef}
              className="results-modal-scroll"
              style={{
                flex: 1,
                overflowY: 'scroll',
                padding: rs.scrollPad,
                position: 'relative',
                zIndex: 10,
                WebkitOverflowScrolling: 'touch',
              }}>
              <div ref={contentRef} data-pdf-content style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                {/* ── 1. Header & Profile ── */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '2rem',
                  paddingBottom: '1.5rem',
                  borderBottom: '1px solid rgba(29, 153, 4, 0.2)',
                }}>
                  {/* Profile Image with Holographic Rings — responsive size */}
                  <div style={{ position: 'relative', width: rs.profileImgSize, height: rs.profileImgSize, flexShrink: 0 }}>
                    {/* Dashed spinning ring */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: '1px dashed rgba(29, 153, 4, 0.4)',
                      animation: 'spin 20s linear infinite',
                    }} />
                    {/* Dotted reverse-spinning ring */}
                    <div style={{
                      position: 'absolute',
                      inset: '-0.75rem',
                      borderRadius: '50%',
                      border: '1px dotted rgba(168, 85, 247, 0.4)',
                      animation: 'spin 15s linear infinite reverse',
                    }} />
                    {/* Actual image */}
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid #1d9904',
                      background: '#000',
                      position: 'relative',
                    }}>
                      <img 
                        src={result.imageUrl} 
                        alt={result.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'contrast(1.25) sepia(0.2)',
                          transform: 'scale(1.05)',
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                      }} />
                    </div>
                  </div>

                  <div style={{ maxWidth: rs.profileTextMaxW }}>
                    <h1 style={{
                      fontSize: rs.titleFont,
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontWeight: 'bold',
                      background: 'linear-gradient(to right, #a855f7, #d8b4fe, #a855f7)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))',
                      marginBottom: '0.5rem',
                    }}>
                      {result.name}
                    </h1>
                    {result.extendedSubtitle && (
                      <p style={{
                        fontSize: '0.9rem',
                        color: 'rgba(249, 115, 22, 0.9)',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        marginBottom: '0.5rem',
                      }}>
                        {result.extendedSubtitle}
                      </p>
                    )}
                    <p style={{
                      fontSize: '1.1rem',
                      color: 'rgba(156, 163, 175, 1)',
                      fontFamily: "'Figtree', sans-serif",
                      fontStyle: 'italic',
                    }}>
                      "{result.description}"
                    </p>
                    {result.secondaryName && (
                      <p style={{
                        fontSize: '0.85rem',
                        color: 'rgba(29, 153, 4, 0.7)',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        marginTop: '0.75rem',
                      }}>
                        {result.mainName} + {result.secondaryName}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── 2. Combination Profile — Why Main + Support = Extended Archetype ── */}
                {result.combinationText && (
                  <div style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid rgba(29, 153, 4, 0.25)',
                    borderRadius: '0.75rem',
                    padding: rs.sectionPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, transparent, #1d9904, transparent)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#1d9904',
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      marginBottom: '0.75rem',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                      </svg>
                      Waarom jij {result.name} bent
                    </h3>
                    <p style={{
                      color: 'rgba(209, 213, 219, 1)',
                      fontFamily: "'Figtree', sans-serif",
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                      textAlign: 'justify',
                    }}>
                      {result.combinationText}
                    </p>
                  </div>
                )}

                {/* ── 3. Main & Support Archetype Cards ── */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem',
                }}>
                  {/* Main Archetype Card */}
                  <div style={{
                    background: 'transparent',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '0.75rem',
                    padding: rs.cardPad,
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, #a855f7, transparent)',
                    }} />
                    <div style={{
                      fontSize: '0.75rem', color: 'rgba(168, 85, 247, 0.5)',
                      fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.2em',
                      textTransform: 'uppercase', marginBottom: '0.75rem',
                    }}>
                      {/* MAIN ARCHETYPE */}
                    </div>
                    <h4 style={{
                      color: '#a855f7',
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      marginBottom: '0.25rem',
                    }}>
                      {result.mainName}
                    </h4>
                    <p style={{
                      fontSize: '0.75rem', color: 'rgba(156, 163, 175, 0.7)',
                      fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      marginBottom: '0.75rem',
                    }}>
                      {result.mainNameEn} — {result.group}
                    </p>
                    {result.mainMotivation && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#a855f7', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Motivatie: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.mainMotivation}</span>
                      </div>
                    )}
                    {result.mainPositive && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#a855f7', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kracht: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.mainPositive}</span>
                      </div>
                    )}
                    {result.mainShadowTrait && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#a855f7', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Schaduw: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.7)', fontFamily: "'Figtree', sans-serif" }}>{result.mainShadowTrait}</span>
                      </div>
                    )}
                  </div>

                  {/* Support Archetype Card */}
                  <div style={{
                    background: 'transparent',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    borderRadius: '0.75rem',
                    padding: rs.cardPad,
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, #f97316, transparent)',
                    }} />
                    <div style={{
                      fontSize: '0.75rem', color: 'rgba(249, 115, 22, 0.5)',
                      fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.2em',
                      textTransform: 'uppercase', marginBottom: '0.75rem',
                    }}>
                      {/* SUPPORT ARCHETYPE */}
                    </div>
                    <h4 style={{
                      color: '#f97316',
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      marginBottom: '0.25rem',
                    }}>
                      {result.secondaryName}
                    </h4>
                    <p style={{
                      fontSize: '0.75rem', color: 'rgba(156, 163, 175, 0.7)',
                      fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      marginBottom: '0.75rem',
                    }}>
                      {result.secondaryNameEn} — {result.supportGroup}
                    </p>
                    {result.secondaryMotivation && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Motivatie: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.secondaryMotivation}</span>
                      </div>
                    )}
                    {result.secondaryPositive && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kracht: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.secondaryPositive}</span>
                      </div>
                    )}
                    {result.secondaryDescription && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#a855f7', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Profiel: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.secondaryDescription}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 3b. All Support Archetype Outcomes ── */}
                {result.allSupportArchetypes && (
                  <div style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid rgba(29, 153, 4, 0.15)',
                    borderRadius: '0.75rem',
                    padding: rs.cardPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, transparent, #1d9904, transparent)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#1d9904',
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      marginBottom: '1rem',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                        <line x1="12" y1="22" x2="12" y2="15.5" /><line x1="22" y1="8.5" x2="12" y2="15.5" /><line x1="2" y1="8.5" x2="12" y2="15.5" />
                      </svg>
                      Alle Uitkomsten voor {result.mainName}
                    </h3>
                    {/* Archetypes as rows, Betekenis / Gift / Valkuil as columns */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      {/* Column header row */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr 1fr',
                        gap: '0',
                        padding: '0.15rem 0',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        marginBottom: '0',
                      }}>
                        {[['ARCHETYPE','rgba(168,85,247,0.85)'],['BETEKENIS','rgba(249,115,22,0.85)'],['GIFT','rgba(29,153,4,0.85)'],['VALKUIL','rgba(239,68,68,0.85)']].map(([label, color]) => (
                          <div key={label} style={{ fontSize: '0.75rem', color, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '0.4rem' }}>
                            {label}
                          </div>
                        ))}
                      </div>
                      {result.allSupportArchetypes.map((sa) => {
                        const splitCombo = (text) => {
                          if (!text) return { meaning: '', gift: '' };
                          const m = text.match(/^([^.!?]+[.!?])\s*(.*)$/s);
                          return m ? { meaning: m[1].trim(), gift: m[2].trim() } : { meaning: text, gift: '' };
                        };
                        const { meaning, gift } = splitCombo(sa.combination);
                        const cellText = { fontSize: '0.65rem', fontFamily: "'Figtree', sans-serif", lineHeight: 1.3 };
                        return (
                          <div key={sa.group} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr 1fr',
                            alignItems: 'start',
                            gap: '0',
                            background: sa.isActive ? 'rgba(168,85,247,0.05)' : 'transparent',
                            borderBottom: sa.isActive ? '1px solid rgba(168,85,247,0.25)' : '1px solid rgba(255,255,255,0.06)',
                            borderLeft: sa.isActive ? '2px solid rgba(168,85,247,0.5)' : '2px solid transparent',
                            maxHeight: '4.5rem',
                            overflow: 'hidden',
                          }}>
                            {/* Archetype name */}
                            <div style={{ padding: '0.2rem 0.4rem 0', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ fontSize: '0.65rem', color: sa.isActive ? '#a855f7' : 'rgba(29,153,4,0.55)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.2 }}>
                                {(sa.group || '').trim()}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: sa.isActive ? '#fff' : 'rgba(29,153,4,0.75)', fontFamily: "'Figtree', sans-serif", fontWeight: sa.isActive ? 700 : 400, lineHeight: 1.2, marginTop: '0.05rem' }}>
                                {(sa.extendedName || '').trim()}
                              </div>
                            </div>
                            {/* Betekenis */}
                            <div style={{ padding: '0.2rem 0.4rem 0', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ ...cellText, color: 'rgba(209,213,219,0.85)' }}>{meaning.trim()}</div>
                            </div>
                            {/* Gift */}
                            <div style={{ padding: '0.2rem 0.4rem 0', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ ...cellText, color: 'rgba(209,213,219,0.85)' }}>{gift.trim()}</div>
                            </div>
                            {/* Valkuil */}
                            <div style={{ padding: '0.2rem 0.4rem 0' }}>
                              <div style={{ ...cellText, color: 'rgba(209,213,219,0.75)' }}>{(sa.shadow || '').trim()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── 4. Shadow Integration ── */}
                {result.shadowPartner && (
                  <div style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '0.75rem',
                    padding: rs.cardPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, transparent, #a855f7, transparent)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#a855f7',
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      marginBottom: '0.75rem',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0 0 20"/>
                      </svg>
                      Schaduw Archetype — {result.shadowName} ({result.shadowNameEn})
                    </h3>
                    {result.mainShadowTension && (
                      <p style={{
                        color: 'rgba(168, 85, 247, 0.8)',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        fontStyle: 'italic',
                        marginBottom: '0.75rem',
                        letterSpacing: '0.05em',
                      }}>
                        {result.mainShadowTension}
                      </p>
                    )}
                    {result.shadowInsight && (
                      <p style={{
                        color: 'rgba(209, 213, 219, 0.9)',
                        fontFamily: "'Figtree', sans-serif",
                        fontSize: '0.9rem',
                        lineHeight: 1.7,
                        textAlign: 'justify',
                      }}>
                        {result.shadowInsight}
                      </p>
                    )}
                    {result.shadowDescription && !result.shadowInsight && (
                      <p style={{
                        color: 'rgba(209, 213, 219, 0.7)',
                        fontFamily: "'Figtree', sans-serif",
                        fontSize: '0.9rem',
                        lineHeight: 1.7,
                      }}>
                        {result.shadowDescription}
                      </p>
                    )}
                  </div>
                )}

                {/* ── 4b. Blindspot — opposite of Support (external saboteur) ── */}
                {result.blindspotPartner && (
                  <div style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '0.75rem',
                    padding: rs.cardPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, transparent, #ef4444, transparent)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#ef4444',
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      marginBottom: '0.25rem',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                      Blindspot — {result.blindspotName} ({result.blindspotNameEn})
                    </h3>
                    <p style={{
                      fontSize: '0.75rem',
                      color: 'rgba(239, 68, 68, 0.6)',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 600,
                      fontStyle: 'italic',
                      marginBottom: '0.75rem',
                      letterSpacing: '0.05em',
                    }}>
                      De tegenhanger van je Support ({result.secondaryNameEn}) — jouw externe blinde vlek
                    </p>
                    {result.blindspotDescription && (
                      <p style={{
                        color: 'rgba(209, 213, 219, 0.9)',
                        fontFamily: "'Figtree', sans-serif",
                        fontSize: '0.9rem',
                        lineHeight: 1.7,
                        textAlign: 'justify',
                        marginBottom: '0.5rem',
                      }}>
                        {result.blindspotDescription}
                      </p>
                    )}
                    {result.blindspotShadowTrait && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#ef4444', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sabotage patroon: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.7)', fontFamily: "'Figtree', sans-serif" }}>{result.blindspotShadowTrait}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 4c. OCEAN Personality Profile ── */}
                {result.extendedOcean && (
                  <div style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    borderRadius: '0.75rem',
                    padding: rs.cardPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, transparent, #3b82f6, transparent)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#3b82f6',
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      marginBottom: '1rem',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
                      </svg>
                      OCEAN Persoonlijkheidsprofiel
                    </h3>

                    {/* OCEAN Bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
                      {['O', 'C', 'E', 'A', 'N'].map(dim => {
                        const score = result.extendedOcean.ocean[dim];
                        const textRating = result.extendedOcean.oceanText[dim];
                        const color = result.oceanColors[dim];
                        const pct = (score / 10) * 100;
                        return (
                          <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '2rem', textAlign: 'right',
                              fontFamily: "'Lexend Mega', sans-serif",
                              fontSize: '0.7rem', fontWeight: 700,
                              color: color, letterSpacing: '0.05em',
                            }}>
                              {dim}
                            </div>
                            <div style={{
                              flex: 1, height: '1.2rem', borderRadius: '0.6rem',
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: `1px solid ${color}22`,
                              overflow: 'hidden', position: 'relative',
                            }}>
                              <div style={{
                                height: '100%', width: `${pct}%`,
                                background: `linear-gradient(to right, ${color}33, ${color}aa)`,
                                borderRadius: '0.6rem',
                                transition: 'width 1s ease-out',
                              }} />
                              <span style={{
                                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                                fontSize: '0.75rem', fontFamily: "'Rajdhani', sans-serif",
                                color: 'rgba(209, 213, 219, 0.6)', fontWeight: 600,
                              }}>
                                {textRating}
                              </span>
                            </div>
                            <div style={{
                              width: '1.5rem', textAlign: 'center',
                              fontFamily: "'Rajdhani', sans-serif",
                              fontSize: '0.75rem', fontWeight: 700,
                              color: color,
                            }}>
                              {score}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* OCEAN Dimension Legend */}
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.75rem',
                      marginBottom: '1rem', paddingBottom: '0.75rem',
                      borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
                    }}>
                      {['O', 'C', 'E', 'A', 'N'].map(dim => (
                        <span key={dim} style={{
                          fontSize: '0.75rem', fontFamily: "'Rajdhani', sans-serif",
                          color: 'rgba(209, 213, 219, 0.5)',
                        }}>
                          <span style={{ color: result.oceanColors[dim], fontWeight: 700 }}>{dim}</span>
                          {' = '}{result.oceanLabels[dim].dutch}
                        </span>
                      ))}
                    </div>

                    {/* OCEAN Resonance / Dissonance Analysis */}
                    {result.oceanImported && (() => {
                      const ocean = result.extendedOcean.ocean;
                      const group = result.group; // e.g. 'RULING', 'RELATIONAL', etc.
                      // What each pillar biologically expects (high/low per OCEAN trait)
                      const GROUP_OCEAN_EXPECT = {
                        RULING:     { O: 'low',  C: 'high', E: 'mid',  A: 'low',  N: 'low'  },
                        RELATIONAL: { O: 'mid',  C: 'mid',  E: 'high', A: 'high', N: 'mid'  },
                        SEEKER:     { O: 'high', C: 'low',  E: 'mid',  A: 'mid',  N: 'mid'  },
                        CHAOS:      { O: 'mid',  C: 'low',  E: 'mid',  A: 'low',  N: 'high' },
                        ABSTRACT:   { O: 'high', C: 'mid',  E: 'low',  A: 'mid',  N: 'mid'  },
                        AGENCY:     { O: 'mid',  C: 'high', E: 'high', A: 'mid',  N: 'low'  },
                      };
                      const OCEAN_FULL = {
                        O: 'Openness', C: 'Conscientiousness', E: 'Extraversion',
                        A: 'Agreeableness', N: 'Neuroticism',
                      };
                      const expect = GROUP_OCEAN_EXPECT[group] || GROUP_OCEAN_EXPECT.RULING;
                      const analyses = ['O', 'C', 'E', 'A', 'N'].map(dim => {
                        const raw = ocean[dim]; // 0-10
                        const pct = raw * 10;   // 0-100
                        const exp = expect[dim];
                        let status, explanation;
                        if (exp === 'high') {
                          if (pct >= 60) {
                            status = 'resonance';
                            explanation = `Je ${OCEAN_FULL[dim]} (${pct}) is in resonantie met je ${group}-netwerk. De kans is groot dat dit je geen energie kost, maar functioneert als je Platonische motor.`;
                          } else {
                            status = 'dissonance';
                            explanation = `Je ${group}-profiel verwacht hoge ${OCEAN_FULL[dim]}, maar je scoort ${pct}. Het is aannemelijk dat dit gedrag een gecloakt pantser is — aangeleerd, niet biologisch verankerd.`;
                          }
                        } else if (exp === 'low') {
                          if (pct <= 40) {
                            status = 'resonance';
                            explanation = `Je lage ${OCEAN_FULL[dim]} (${pct}) past bij je ${group}-architectuur. Dit is je biologische blauwdruk — geen weerstand, pure flow.`;
                          } else {
                            status = 'dissonance';
                            explanation = `Je ${group}-netwerk verwacht lage ${OCEAN_FULL[dim]}, maar je scoort ${pct}. Houd er rekening mee dat dit aangeleerde compensatie kan zijn die energie kost.`;
                          }
                        } else {
                          status = 'neutral';
                          explanation = `Je ${OCEAN_FULL[dim]} (${pct}) beweegt in het neutrale spectrum voor je ${group}-netwerk.`;
                        }
                        return { dim, pct, status, explanation };
                      });

                      const hasSignal = analyses.some(a => a.status !== 'neutral');
                      if (!hasSignal) return null;

                      return (
                        <div style={{
                          background: 'transparent',
                          border: '1px solid rgba(59, 130, 246, 0.12)',
                          borderRadius: '0.5rem',
                          padding: '0.75rem 1rem',
                          marginBottom: '1rem'
                        }}>
                          <div style={{
                            fontSize: '0.75rem', color: '#3b82f6',
                            fontFamily: "'Rajdhani', sans-serif",
                            fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.1em', marginBottom: '0.6rem',
                          }}>
                            OCEAN Resonantie & Dissonantie Analyse (0–100 schaal)
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {analyses.filter(a => a.status !== 'neutral').map(({ dim, pct, status }) => {
                              const isRes = status === 'resonance';
                              const color = isRes ? '#22d3ee' : '#fbbf24';
                              const icon = isRes ? '✦' : '⚠';
                              const label = isRes ? 'Resonantie' : 'Dissonantie';
                              const expVal = expect[dim];
                              return (
                                <div key={dim} style={{
                                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                                  padding: '0.5rem 0.6rem',
                                  background: 'transparent',
                                  border: `1px solid ${isRes ? 'rgba(34, 211, 238, 0.15)' : 'rgba(251, 191, 36, 0.15)'}`,
                                  borderRadius: '0.4rem',
                                }}>
                                  <span style={{ fontSize: '0.85rem', color, flexShrink: 0, marginTop: '0.05rem' }}>{icon}</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{
                                      display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem',
                                    }}>
                                      <span style={{
                                        fontFamily: "'Lexend Mega', sans-serif",
                                        fontSize: '0.7rem', fontWeight: 700,
                                        color: result.oceanColors[dim],
                                      }}>
                                        {dim}
                                      </span>
                                      <span style={{
                                        fontFamily: "'Rajdhani', sans-serif",
                                        fontSize: '0.75rem', fontWeight: 700,
                                        color, textTransform: 'uppercase', letterSpacing: '0.05em',
                                      }}>
                                        {label}
                                      </span>
                                      <span style={{
                                        fontFamily: "'Rajdhani', sans-serif",
                                        fontSize: '0.75rem', color: 'rgba(209, 213, 219, 0.5)',
                                      }}>
                                        Score: {pct}/100 | Verwacht: {expVal}
                                      </span>
                                    </div>
                                    <p style={{
                                      fontSize: '0.78rem', color: 'rgba(209, 213, 219, 0.75)',
                                      fontFamily: "'Figtree', sans-serif",
                                      lineHeight: 1.5, margin: 0,
                                    }}>
                                      {analyses.find(a => a.dim === dim).explanation}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Neuroticism Trigger */}
                    {result.neuroticismTrigger && (
                      <div style={{
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          fontSize: '0.75rem', color: '#ef4444',
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.1em', marginBottom: '0.35rem',
                        }}>
                          Neuroticisme Trigger
                        </div>
                        <p style={{
                          fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.85)',
                          fontFamily: "'Figtree', sans-serif",
                          lineHeight: 1.6, margin: 0,
                        }}>
                          {result.neuroticismTrigger}
                        </p>
                      </div>
                    )}

                    {/* Core Profile: Workplace & Conflict */}
                    {result.coreProfile && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                          { label: 'Superkracht op de Werkvloer', text: result.coreProfile.workplaceSuperpower, color: '#f97316' },
                          { label: 'Conflictstijl', text: result.coreProfile.conflictStyle, color: '#f97316' },
                          { label: 'Relatiepatroon', text: result.coreProfile.relationshipPattern, color: '#f97316' },
                          { label: 'Individuatiepad', text: result.coreProfile.individuationPath, color: '#f97316' },
                        ].map(({ label, text, color: c }) => (
                          <div key={label}>
                            <div style={{
                              fontSize: '0.75rem', color: c,
                              fontFamily: "'Rajdhani', sans-serif",
                              fontWeight: 700, textTransform: 'uppercase',
                              letterSpacing: '0.1em', marginBottom: '0.25rem',
                            }}>
                              {label}
                            </div>
                            <p style={{
                              fontSize: '0.85rem',
                              color: 'rgba(209, 213, 219, 0.8)',
                              fontFamily: "'Figtree', sans-serif",
                              lineHeight: 1.6, margin: 0,
                              textAlign: 'justify',
                            }}>
                              {text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── 5. Subgroup Dynamics ── */}
                <div style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid rgba(168, 85, 247, 0.1)',
                  borderRadius: '0.75rem',
                  padding: rs.sectionPad,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Background icon decoration */}
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
                  <div ref={subgroupRef}>
                    <SubgroupCounters subgroups={result.subgroups} />
                  </div>
                </div>

                {/* ── 5b. Gele Driehoek — Cognitieve Deepdive ── */}
                {(() => {
                  const archKey = (result.mainArchetype || '').toUpperCase();
                  const tri = COG_TRIANGLES[archKey];
                  if (!tri) return null;

                  return (
                    <div ref={culturaForceRef} style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid rgba(251,191,36,0.3)',
                      borderRadius: '0.75rem',
                      padding: rs.cardPad,
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

                      {/* Other triangles — compact reference row */}
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {ALL_COG_TRIANGLES.filter(t => t.id !== tri.id).map(t => (
                          <div key={t.id} style={{ flex: 1, border: '1px solid rgba(251,191,36,0.15)', borderRadius: '0.4rem', padding: '0.4rem 0.5rem' }}>
                            <div style={{ fontSize: '0.8rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#1d9904', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>{t.mode}</div>
                            <div style={{ fontSize: '0.78rem', color: 'rgba(148,163,184,0.8)', fontFamily: "'Figtree', sans-serif" }}>{t.members}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ── 6. Radar Chart (full width) ── */}
                <div style={{
                  position: 'relative',
                  background: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(29, 153, 4, 0.3)',
                  padding: '0.5rem',
                  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(29, 153, 4, 0.08)',
                  minHeight: '350px',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    left: '1rem',
                    fontSize: '0.7rem',
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.2em',
                    color: '#1d9904',
                  }}>
                    {'/// TRIPLE_NETWORK_WIEL'}
                  </div>
                  <div ref={radarRef} style={{ width: '100%', height: rs.radarHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SciFiRadarChart data={result.radarData} shadow={result.shadowArchetype} blindspot={result.blindspotArchetype} mainArchetype={result.overallArchetype} supportArchetype={result.supportArchetype} />
                  </div>
                </div>

                {/* ── Fixed Disclaimer — always shown before AI sections ── */}
                <div style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: rs.sectionPad,
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

                {/* ── 7+. AI Analysis Sections (dynamic, all sections) ── */}
                {visibleSections.map((section, idx) => {
                  // AI Agent Prompt section: always render as a single unified monospace block
                  if (section.isAgentPrompt || /ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt/i.test(section.title)) {
                    return (
                      <div key={idx} style={{
                        width: '100%',
                        background: 'transparent',
                        border: '1px solid rgba(249,115,22,0.2)',
                        padding: rs.sectionPad,
                        borderRadius: '0.75rem',
                      }}>
                        <h3 style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          color: '#f97316',
                          fontFamily: "'Lexend Mega', sans-serif",
                          fontSize: '0.85rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          marginBottom: '0.75rem',
                        }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '1.5rem', height: '1.5rem', borderRadius: '50%',
                            border: '1px solid rgba(249,115,22,0.4)',
                            fontSize: '0.7rem', fontFamily: "'Rajdhani', sans-serif",
                            color: '#f97316', flexShrink: 0,
                          }}>
                            {idx + 1}
                          </span>
                          {cleanTitle(section.title)}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(148,163,184,0.85)', fontFamily: "'Figtree', sans-serif", lineHeight: 1.6, fontStyle: 'italic' }}>
                          Download het volledige rapport voor deze prompt, wat je zojuist hebt gelezen is nog maar een deel van alle gegenereerde content!
                        </p>
                      </div>
                    );
                  }
                  // Cycle through accent colors for visual variety
                  const accents = [
                    { color: '#1d9904', rgb: '29, 153, 4' },    // green
                    { color: '#a855f7', rgb: '168, 85, 247' },   // purple
                    { color: '#f97316', rgb: '249, 115, 22' },   // orange
                    { color: '#3b82f6', rgb: '59, 130, 246' },   // blue
                    { color: '#ec4899', rgb: '236, 72, 153' },   // pink
                    { color: '#14b8a6', rgb: '20, 184, 166' },   // teal
                  ];
                  const accent = getSectionAccent(section.title) || accents[idx % accents.length];
                  const isEven = idx % 2 === 0;

                  return (
                    <div key={idx} style={{
                      width: '100%',
                      position: 'relative',
                      ...(isEven ? {} : {
                        background: 'transparent',
                        border: `1px solid rgba(${accent.rgb}, 0.2)`,
                        padding: rs.sectionPad,
                        borderRadius: '0.75rem',
                      }),
                    }}>
                      {/* Left accent bar for even sections */}
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
                        ...(isEven ? {} : {}),
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
                          padding: rs.sectionPad,
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
                })}

                {/* ── 6. Footer Actions ── */}
                <div style={{
                  paddingTop: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.5rem',
                }}>

                  {/* ── Email gate (unlocks PDF download) ── */}
                  {!reviewSubmitted && (
                    <div style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      boxShadow: 'inset 0 0 20px rgba(168, 85, 247, 0.05)',
                    }}>

                      <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* E-mailadres */}
                        <div>
                          <label style={{
                            display: 'block',
                            color: '#e2e8f0',
                            fontFamily: "'Figtree', sans-serif",
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                          }}>
                            E-mailadres
                          </label>
                          <input
                            type="email"
                            required
                            value={reviewFormData.email}
                            onChange={(e) => setReviewFormData({ ...reviewFormData, email: e.target.value })}
                            placeholder="jouw@email.nl"
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              background: 'rgba(0, 0, 0, 0.8)',
                              border: '1px solid rgba(168, 85, 247, 0.2)',
                              borderRadius: '0.5rem',
                              color: '#fff',
                              fontFamily: "'Figtree', sans-serif",
                              fontSize: '0.85rem',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {/* Error message */}
                        {reviewError && (
                          <div style={{
                            color: '#ff6b6b',
                            fontFamily: "'Figtree', sans-serif",
                            fontSize: '0.85rem',
                            padding: '0.75rem',
                            background: 'rgba(255, 107, 107, 0.1)',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                          }}>
                            {reviewError}
                          </div>
                        )}

                        {/* VOLLEDIGE RAPPORT button */}
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          style={{
                            padding: '0.75rem 1.5rem',
                            background: '#a855f7',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: '#fff',
                            fontFamily: "'Lexend Mega', sans-serif",
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: isSubmittingReview ? 'wait' : 'pointer',
                            opacity: isSubmittingReview ? 0.6 : 1,
                            transition: 'all 0.3s',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSubmittingReview) {
                              e.currentTarget.style.background = '#9333ea';
                              e.currentTarget.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.6)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#a855f7';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {isSubmittingReview ? 'Versturen...' : 'VOLLEDIGE RAPPORT'}
                        </button>
                      </form>
                    </div>
                  )}

                  <div data-pdf-hide style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '1rem',
                    width: '100%',
                    flexWrap: 'wrap',
                  }}>
                    {/* PDF consent micro-modal */}
                    {showPdfConsent && (
                      <div style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
                        padding: '1rem',
                      }}>
                        <div style={{
                          maxWidth: '34rem', width: '100%',
                          backgroundColor: 'rgba(6, 2, 10, 0.98)',
                          border: '1px solid rgba(29,153,4,0.2)',
                          borderRadius: '0.5rem',
                          padding: '1.75rem',
                          boxShadow: '0 0 40px rgba(29,153,4,0.08)',
                          fontFamily: "'Lexend Mega', sans-serif",
                        }}>
                          <h3 style={{ color: '#1d9904', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.25rem' }}>
                            Verantwoordelijkheid PDF & AI Prompt
                          </h3>
                          <p style={{ color: 'rgba(148,163,184,0.5)', fontSize: '0.75rem', fontStyle: 'italic', marginBottom: '1.25rem' }}>
                            Lees dit door voordat je de PDF downloadt
                          </p>

                          <div style={{ borderLeft: '2px solid rgba(29,153,4,0.3)', paddingLeft: '0.875rem', marginBottom: '1.25rem' }}>
                            <p style={{ color: 'rgba(148,163,184,0.85)', fontSize: '0.75rem', lineHeight: 1.75 }}>
                              Dit is een zelfreflectie-instrument gebaseerd op het Deltawerken model. De stijlrichtlijnen in deze prompt zijn geen klinisch profiel maar een gedragsmatige reflectievoorkeur. Gebruik in externe AI-tools valt buiten de verantwoordelijkheid van Garden For Life.
                            </p>
                          </div>

                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.25rem' }}>
                            <input
                              type="checkbox"
                              checked={pdfConsentChecked}
                              onChange={(e) => setPdfConsentChecked(e.target.checked)}
                              style={{ marginTop: '0.1rem', accentColor: '#1d9904', width: '0.9rem', height: '0.9rem', flexShrink: 0, cursor: 'pointer' }}
                            />
                            <span style={{ color: 'rgba(148,163,184,0.9)', fontSize: '0.75rem', lineHeight: 1.65 }}>
                              Ik begrijp dat de AI Agent Prompt in deze PDF experimenteel is en aanvaard volledige verantwoordelijkheid voor het gebruik ervan.
                            </span>
                          </label>

                          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => { setShowPdfConsent(false); setPdfConsentChecked(false); }}
                              style={{ background: 'none', border: '1px solid rgba(100,116,139,0.4)', color: '#64748b', borderRadius: '9999px', padding: '0.35rem 1rem', fontSize: '0.55rem', fontFamily: "'Lexend Mega', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#94a3b8'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(100,116,139,0.4)'; e.currentTarget.style.color = '#64748b'; }}
                            >
                              Annuleren
                            </button>
                            <button
                              onClick={() => { if (pdfConsentChecked) { setShowPdfConsent(false); logActivity({ type: 'consent_given', email: reviewFormData.email.trim(), consentType: 'pdf_download', level: 'pdf', message: 'User confirmed PDF download consent' }).catch(() => {}); handleDownloadPdf(); } }}
                              disabled={!pdfConsentChecked}
                              style={{ background: pdfConsentChecked ? 'transparent' : 'none', border: `1px solid ${pdfConsentChecked ? '#1d9904' : 'rgba(29,153,4,0.2)'}`, color: pdfConsentChecked ? '#1d9904' : 'rgba(29,153,4,0.3)', borderRadius: '9999px', padding: '0.35rem 1rem', fontSize: '0.55rem', fontFamily: "'Lexend Mega', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', cursor: pdfConsentChecked ? 'pointer' : 'not-allowed', backgroundColor: pdfConsentChecked ? 'rgba(29,153,4,0.07)' : 'none' }}
                              onMouseEnter={(e) => { if (pdfConsentChecked) e.currentTarget.style.boxShadow = '0 0 16px rgba(29,153,4,0.25)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                            >
                              Begrepen en akkoord — Download PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Download PDF */}
                    <button
                      onClick={() => { if (!isGeneratingPdf && reviewSubmitted) { setPdfConsentChecked(false); setShowPdfConsent(true); } }}
                      disabled={isGeneratingPdf || !reviewSubmitted}
                      style={{
                        flex: '1 1 0',
                        minWidth: rs.btnMinWidth,
                        position: 'relative',
                        overflow: 'hidden',
                        padding: rs.btnPad,
                        background: '#000',
                        border: '1px solid #1d9904',
                        color: '#1d9904',
                        fontFamily: "'Lexend Mega', sans-serif",
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: rs.btnFont,
                        cursor: (isGeneratingPdf || !reviewSubmitted) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s',
                        boxShadow: '0 0 15px rgba(29, 153, 4, 0.1)',
                        opacity: (isGeneratingPdf || !reviewSubmitted) ? 0.5 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!isGeneratingPdf && reviewSubmitted) {
                          e.currentTarget.style.background = '#1d9904';
                          e.currentTarget.style.color = '#000';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#000';
                        e.currentTarget.style.color = '#1d9904';
                      }}
                    >
                      <span style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        {isGeneratingPdf ? (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                              <path d="M21 12a9 9 0 11-6.219-8.56" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            VOLLEDIGE RAPPORT
                          </>
                        )}
                      </span>
                    </button>
                    
                    {/* Save & Create Account */}
                    <button
                      onClick={onCreateAccount}
                      style={{
                        flex: '1 1 0',
                        minWidth: rs.btnMinWidth,
                        position: 'relative',
                        overflow: 'hidden',
                        padding: rs.btnPad,
                        background: 'linear-gradient(to right, #a855f7, #581c87)',
                        border: '1px solid transparent',
                        color: '#fff',
                        fontFamily: "'Lexend Mega', sans-serif",
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: rs.btnFont,
                        cursor: 'pointer',
                        opacity: 1,
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(168, 85, 247, 0.6)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <span style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        {t('results.createAccount')}
                      </span>
                      {/* Sheen effect */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%)',
                        backgroundSize: '250% 250%',
                        animation: 'shimmerBtn 3s infinite',
                      }} />
                    </button>
                  </div>


                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animations + scrollbar styling */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes resultsModalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmerBtn {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .results-modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .results-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .results-modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(29, 153, 4, 0.3);
          border-radius: 3px;
        }
        .results-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(29, 153, 4, 0.5);
        }
        .results-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(29, 153, 4, 0.3) transparent;
        }
      `}</style>
    </div>
  );
}

/**
 * Parse the AI analysis response (markdown with ## headings) into display sections.
 * Returns ALL sections found in the AI response for full dynamic rendering.
 */
function parseAiSections(analysisText) {
  if (!analysisText || typeof analysisText !== 'string') return null;

  // Split on ## or ### top-level headings (with or without numbering).
  // The AI prompt requests `## N.` but models sometimes return `### N.` instead.
  const sectionRegex = /^#{2,3}\s+(?:\d+\.\s+)?(.+)/gm;
  const matches = [];
  let match;

  while ((match = sectionRegex.exec(analysisText)) !== null) {
    matches.push({ title: match[1].trim(), start: match.index, headerEnd: match.index + match[0].length });
  }

  if (matches.length === 0) {
    // No section headers found — return full text as single section
    return [{ title: 'AI Analyse', content: analysisText.trim() }];
  }

  // Patterns to strip disclaimer-like text the AI may inject into any section
  const disclaimerPatterns = [
    /^>?\s*\**Meta[- ]?Disclaimer\**:?[^\n]*\n?/gim,
    /^>?\s*\**Schaduw[- ]?archetype\**:?[^\n]*\n?/gim,
    /^>?\s*\**Blindspot[- ]?archetype\**:?[^\n]*\n?/gim,
    /^>?\s*Dit rapport is gegenereerd door het Garden [Ff]or Life[^\n]*\n?/gm,
    /^>?\s*De gebruikte neurobiologische termen zijn metaforen[^\n]*\n?/gm,
    /^>?\s*Raadpleeg een professional voor medisch[^\n]*\n?/gm,
    /^>?\s*Dit is een zelfreflectie-instrument[^\n]*\n?/gm,
    /^>?\s*Dit rapport is geen in beton gegoten diagnose[^\n]*\n?/gm,
    /^>?\s*\**Disclaimer\**:?\s*Dit rapport[^\n]*\n?/gim,
  ];

  const stripDisclaimer = (text) => {
    let cleaned = text;
    for (const pat of disclaimerPatterns) {
      cleaned = cleaned.replace(pat, '');
    }
    // Remove orphaned blockquote-only lines (> followed by empty or near-empty content)
    cleaned = cleaned.replace(/^>\s*$/gm, '');
    // Collapse excessive blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
  };

  const parts = [];
  const seenContent = new Set();

  // Identify the comparison section and the AI-Agent-Prompt section so we can
  // (a) absorb all comparison sub-sections into one block, and (b) tag it as PDF-only.
  const reportMatchIdx = matches.findIndex(m => /persoonlijkheidsrapport.*vergelijk|ocean.*vergelijk|vergelijk.*profiel/i.test(m.title));
  const agentPromptIdx = matches.findIndex(m =>
    /ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt|^11[^\d]/i.test(m.title)
  );
  // 12A/12B resonantie sections (placed below radar chart in PDF) — also match legacy 13A/13B
  const resonantieTest = (t) => /^1[23]\s*[ab][\s.:]/i.test(t) || /professionele\s+resonantie/i.test(t) || /creatieve\s+resonantie/i.test(t);

  // Find the first section after comparison that is NOT a comparison sub-section
  // (comparison sub-sections get absorbed into the parent comparison block)
  const firstAfterComp = reportMatchIdx >= 0
    ? matches.findIndex((m, idx) =>
        idx > reportMatchIdx &&
        !(/^(spanningsvelden|vergelijkingsrapport|vergelijkings\s*rapport|conclusie|convergente|divergente|stap\s+\d)/i.test(m.title.trim()))
      )
    : -1;

  for (let i = 0; i < matches.length; i++) {
    const title = matches[i].title;
    // Skip any "Meester Ontologisch Rapport" preamble the AI may inject
    if (/meester\s+ontologisch/i.test(title)) continue;
    // Skip any standalone "Introductie" / "Inleiding" the AI may generate
    if (/^(introductie|inleiding)$/i.test(title)) continue;

    // Comparison sub-sections (Spanningsvelden, Vergelijkingsrapport, Conclusie, etc.)
    // that the AI hallucinated as separate ## headers after the main comparison header:
    // skip them — their content is absorbed into the parent comparison section below.
    if (
      reportMatchIdx >= 0 && i > reportMatchIdx &&
      i !== reportMatchIdx &&
      (firstAfterComp < 0 || i < firstAfterComp) &&
      /^(spanningsvelden|vergelijkingsrapport|vergelijkings\s*rapport|conclusie|convergente|divergente|stap\s+\d)/i.test(title.trim())
    ) continue;

    const isAgentPrompt = (agentPromptIdx >= 0 && i === agentPromptIdx);
    const isComparison  = (reportMatchIdx >= 0 && i === reportMatchIdx);
    const isResonantie  = resonantieTest(title);

    // Content range: comparison section absorbs everything up to the next real section,
    // other sections take content until the next header.
    let contentStart = matches[i].headerEnd;
    let contentEnd;
    if (isComparison) {
      // Absorb all sub-sections until the first non-comparison section after it
      contentEnd = firstAfterComp >= 0 ? matches[firstAfterComp].start : analysisText.length;
    } else {
      contentEnd = (i + 1 < matches.length ? matches[i + 1].start : analysisText.length);
    }
    let content = stripDisclaimer(analysisText.slice(contentStart, contentEnd).trim());

    // Deduplicate: skip sections whose content is identical to an already-seen section
    const contentKey = content.slice(0, 200).toLowerCase().replace(/\s+/g, ' ');
    if (seenContent.has(contentKey)) continue;
    seenContent.add(contentKey);

    parts.push({
      title,
      content,
      isAgentPrompt,
      isComparison,
      isResonantie,
    });
  }

  return parts;
}

/**
 * Render markdown-ish content as React elements.
 * Handles: **bold**, *italic*, - bullet lists, numbered lists, ``` code blocks.
 */
function renderMarkdownContent(content, accentColor) {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let listItems = [];
  let blockquoteLines = [];
  let tableRows = [];
  let inCodeBlock = false;
  let codeLines = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ margin: '0.5rem 0', paddingLeft: '1.25rem', listStyleType: 'disc' }}>
          {listItems.map((li, j) => <li key={j} style={{ marginBottom: '0.25rem' }}>{formatInline(li)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  const flushCode = () => {
    if (codeLines.length > 0) {
      elements.push(
        <pre key={`code-${elements.length}`} style={{
          background: 'rgba(0,0,0,0.6)', padding: '0.75rem', borderRadius: '0.5rem',
          fontSize: '0.8rem', overflowX: 'auto', margin: '0.5rem 0',
          border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {codeLines.join('\n')}
        </pre>
      );
      codeLines = [];
    }
  };

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <blockquote key={`bq-${elements.length}`} style={{
          margin: '0.75rem 0', padding: '0.75rem 1rem',
          borderLeft: '3px solid rgba(168, 85, 247, 0.5)',
          background: 'rgba(168, 85, 247, 0.06)', borderRadius: '0 0.5rem 0.5rem 0',
          color: 'rgba(209, 213, 219, 0.85)', fontStyle: 'italic', fontSize: '0.88rem', lineHeight: 1.7,
        }}>
          {blockquoteLines.map((bq, j) => <p key={j} style={{ margin: '0.2rem 0' }}>{formatInline(bq)}</p>)}
        </blockquote>
      );
      blockquoteLines = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length === 0) return;
    // Filter out separator rows (e.g. | :--- | :--- |)
    const dataRows = tableRows.filter(r => !r.match(/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/));
    if (dataRows.length === 0) { tableRows = []; return; }
    const parseCells = (row) => row.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
    const headerCells = parseCells(dataRows[0]);
    const bodyRows = dataRows.slice(1).map(parseCells);
    elements.push(
      <div key={`tbl-${elements.length}`} style={{ margin: '0.75rem 0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              {headerCells.map((cell, ci) => (
                <th key={ci} style={{
                  padding: '0.4rem 0.6rem', textAlign: 'left', borderBottom: '1px solid rgba(168,85,247,0.3)',
                  color: '#a855f7', fontFamily: "'Lexend Mega', sans-serif", fontSize: '0.7rem',
                  letterSpacing: '0.05em', whiteSpace: 'nowrap',
                }}>{formatInline(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((cells, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>
                {cells.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: '0.35rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    color: ci === 0 ? 'rgba(209,213,219,1)' : 'rgba(209,213,219,0.8)',
                    fontWeight: ci === 0 ? 600 : 400,
                  }}>{formatInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) { flushCode(); inCodeBlock = false; }
      else { flushList(); flushBlockquote(); flushTable(); inCodeBlock = true; }
      continue;
    }
    if (inCodeBlock) { codeLines.push(line); continue; }

    // Blockquote
    const bqMatch = line.match(/^>\s?(.*)/);
    if (bqMatch) { flushList(); flushTable(); blockquoteLines.push(bqMatch[1]); continue; }
    if (blockquoteLines.length > 0 && line.trim() !== '') {
      // continuation of blockquote without > prefix? flush it
      flushBlockquote();
    } else if (blockquoteLines.length > 0) {
      flushBlockquote();
    }

    // Table row — only match lines that start with | (bullet lines containing | must not be confused with tables)
    if (line.trim().startsWith('|')) {
      flushList();
      tableRows.push(line);
      continue;
    }
    if (tableRows.length > 0) flushTable();

    // Horizontal rule
    if (line.trim().match(/^(\*{3,}|-{3,}|_{3,})$/)) {
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} style={{ border: 'none', borderTop: '1px solid rgba(168,85,247,0.2)', margin: '1rem 0' }} />);
      continue;
    }

    // Sub-heading (### or ####) within a section
    const subHeadingMatch = line.match(/^#{3,4}\s+(.+)/);
    if (subHeadingMatch) {
      flushList();
      elements.push(
        <h4 key={`h-${elements.length}`} style={{
          color: accentColor || '#c084fc', fontFamily: "'Lexend Mega', sans-serif",
          fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase',
          marginTop: '1rem', marginBottom: '0.4rem',
        }}>{formatInline(subHeadingMatch[1])}</h4>
      );
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (bulletMatch) { listItems.push(bulletMatch[1]); continue; }

    // Numbered list
    const numMatch = line.match(/^\s*\d+\.\s+(.+)/);
    if (numMatch) { listItems.push(numMatch[1]); continue; }

    // Indented key-value lines (e.g. "    Archetype: ARTIST | Groep: ABSTRACT")
    const indentedMatch = line.match(/^\s{4,}(.+)/);
    if (indentedMatch) {
      flushList();
      elements.push(
        <p key={`ind-${elements.length}`} style={{
          margin: '0.25rem 0', paddingLeft: '1rem',
          borderLeft: '2px solid rgba(255,255,255,0.1)',
          color: 'rgba(209, 213, 219, 0.9)', fontSize: '0.9rem',
        }}>{formatInline(indentedMatch[1])}</p>
      );
      continue;
    }

    // Regular paragraph line
    flushList();
    if (line.trim() === '') continue;
    elements.push(<p key={`p-${elements.length}`} style={{ margin: '0.4rem 0' }}>{formatInline(line)}</p>);
  }
  flushList();
  flushCode();
  flushBlockquote();
  flushTable();

  return elements;
}

/** Format inline markdown: **bold**, *italic* */
function formatInline(text) {
  if (!text) return text;
  // Split on **bold** and *italic* markers
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIdx = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    if (m[2]) parts.push(<strong key={m.index}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index}>{m[3]}</em>);
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length > 0 ? parts : text;
}

/**
 * Compute archetype results from layer answers.
 * Uses the 12-archetype scoring engine:
 *   - Single choice: +5 pts to the selected archetype
 *   - Dual choice: Primary +3 pts, Secondary +2 pts (future)
 *   - Geometric Bleed: Core + Green + Blue + Purple + Yellow per pick
 *   - Max per archetype depends on pick routing and bleed geometry
 *   - Total score: sum of all Core + Bleed across 12 archetypes
 *
 * Accepts: { layerIndex: { questionId: answerId } }
 * e.g. { 0: { 1: "1a", 2: "2c" }, 1: { 7: "7b" }, ... }
 */
function computeResultFromAnswers(layerAnswers) {
  // ──────────────────────────────────────────────────────────
  // 1. Convert layerAnswers → flat response array for scoring engine
  //    Handles dual-pick arrays [pick1, pick2] per question
  // ──────────────────────────────────────────────────────────
  const archetypeScores = {};
  const archetypeCounts = {};
  const archetypeNature = {};
  const archetypeCulture = {};
  ALL_ARCHETYPE_KEYS.forEach(key => { archetypeScores[key] = 0; archetypeCounts[key] = 0; archetypeNature[key] = 0; archetypeCulture[key] = 0; });

  const layerScores = {};
  const answerLog = [];
  const flatResponses = []; // for computeAdvancedScores

  if (layerAnswers && typeof layerAnswers === 'object') {
    Object.entries(layerAnswers).forEach(([layerIdxStr, layerData]) => {
      const layerIdx = parseInt(layerIdxStr, 10);
      if (!layerData || typeof layerData !== 'object') return;

      const layer = questions.find(q => q.layerIndex === layerIdx);
      if (!layer) return;

      if (!layerScores[layerIdx]) layerScores[layerIdx] = [];

      Object.entries(layerData).forEach(([questionIdStr, rawAnswerId]) => {
        const questionId = parseInt(questionIdStr, 10) || questionIdStr;
        // Handle dual-pick arrays: [pick1, pick2] or single value
        const picks = Array.isArray(rawAnswerId) ? rawAnswerId : (rawAnswerId ? [rawAnswerId] : []);
        const question = layer.questions.find(q => q.id === questionId);
        if (!question) return;

        picks.forEach((answerId, pickIdx) => {
          const selectedAnswer = question.answers.find(a => a.id === answerId);
          if (!selectedAnswer) return;

          layerScores[layerIdx].push(selectedAnswer.value || 3);

          const archetype = selectedAnswer.archetype;
          if (archetype) {
            archetypeScores[archetype] = (archetypeScores[archetype] || 0) + (pickIdx === 0 ? 5 : 3);
            archetypeCounts[archetype] = (archetypeCounts[archetype] || 0) + 1;
            const slotPos = selectedAnswer.value - 1; // 0-based answer position (A=0..F=5)
            const isNature = isNatureSlot(question.id, slotPos);
            if (isNature) {
              archetypeNature[archetype] = (archetypeNature[archetype] || 0) + 1;
            } else {
              archetypeCulture[archetype] = (archetypeCulture[archetype] || 0) + 1;
            }
          }

          // Build flat response for scoring engine
          flatResponses.push({
            questionId: question.id,
            answerId: selectedAnswer.id,
            archetype: selectedAnswer.archetype,
            pickOrder: pickIdx,
          });

          // Build detailed answer log entry
          const archetypeData = ARCHETYPES[archetype] || {};
          answerLog.push({
            questionNumber: question.id,
            layerIndex: layerIdx,
            layerName: layer.name || `Layer ${layerIdx}`,
            questionText: question.text,
            answerId: selectedAnswer.id,
            answerText: selectedAnswer.text,
            answerPosition: selectedAnswer.value,
            pickOrder: pickIdx + 1, // 1=first pick, 2=second pick
            archetype: archetype,
            archetypeName: archetypeData.nameEn || archetype,
            archetypeNameNl: archetypeData.name || archetype,
            archetypeGroup: archetypeData.group || null,
            archetypeSet: archetypeData.set || null,
            archetypeDescription: archetypeData.description || null,
            archetypeMotivation: archetypeData.motivation || null,
          });
        });
      });
    });
  }

  // Sort answer log by question number then pick order
  answerLog.sort((a, b) => a.questionNumber - b.questionNumber || a.pickOrder - b.pickOrder);

  // ──────────────────────────────────────────────────────────
  // 2. Run advanced scoring engine (3-layer dual-pick)
  // ──────────────────────────────────────────────────────────
  const advanced = computeAdvancedScores(flatResponses, 'ADVANCED');
  const mainKey = advanced.mainArchetype;
  const supportKey = advanced.supportArchetype;

  // ──────────────────────────────────────────────────────────
  // 4. Extended Archetype Name (72-outcome matrix)
  // ──────────────────────────────────────────────────────────
  const supportGroup = ARCHETYPE_TO_GROUP[supportKey] || 'RULING';
  const extendedName = getExtendedArchetype(mainKey, supportKey);

  // ──────────────────────────────────────────────────────────
  // 4b. Extended Archetype portrait image + description
  // ──────────────────────────────────────────────────────────
  const archetypeImage = getArchetypeImage(mainKey, supportGroup);
  const extendedDesc = getExtendedDescription(mainKey, supportGroup);

  // ──────────────────────────────────────────────────────────
  // 5. Shadow Archetype (psychological tension point)
  //    Shadow = 180° opposite of MAIN archetype (internal fuel)
  // ──────────────────────────────────────────────────────────
  const shadowKey = SHADOW_PAIRS[mainKey] || null;

  // ──────────────────────────────────────────────────────────
  // 5b. Blindspot Archetype (external saboteur)
  //     Blindspot = shadow partner of SUPPORT archetype
  // ──────────────────────────────────────────────────────────
  const blindspotKey = SHADOW_PAIRS[supportKey] || null;

  const primaryArchetype = ARCHETYPES[mainKey] || ARCHETYPES.SAGE;
  const supportArchetype = ARCHETYPES[supportKey] || ARCHETYPES.EXPLORER;

  // ──────────────────────────────────────────────────────────
  // 6. Radar data: use 5-basket stacked bands from advanced scoring engine
  //    Each data point has cumulative band boundaries (green→orange→blue→gold→purple)
  //    plus raw basket values for tooltip display.
  // ──────────────────────────────────────────────────────────
  const radarData = advanced.radarData;

  // ──────────────────────────────────────────────────────────
  // 6b. All possible support archetypes for this main archetype
  // ──────────────────────────────────────────────────────────
  const ALL_GROUPS = ['RULING', 'RELATIONAL', 'SEEKER', 'CHAOS', 'ABSTRACT', 'AGENCY'];
  const allSupportArchetypes = ALL_GROUPS.map(group => {
    const extKey = `${mainKey}_${group}`;
    const extName = EXTENDED_ARCHETYPES[extKey] || mainKey;
    const desc = getExtendedDescription(mainKey, group);
    return {
      group,
      extendedName: extName,
      subtitle: desc?.subtitle || group,
      combination: desc?.combination || '',
      shadow: desc?.shadow || '',
      isActive: group === supportGroup,
    };
  });

  // ──────────────────────────────────────────────────────────
  // 6c. Full 72 Matrix: 12 Main × 6 Support Groups
  //     For the "Matrix van 72 Mogelijkheden" display
  // ──────────────────────────────────────────────────────────
  const ALL_MAIN_KEYS = ALL_ARCHETYPE_KEYS;
  const fullMatrix72 = ALL_MAIN_KEYS.map(mk => {
    const mainArch = ARCHETYPES[mk] || {};
    const row = {
      mainKey: mk,
      mainName: mainArch.name || mk,
      mainNameEn: mainArch.nameEn || mk,
      isActiveMain: mk === mainKey,
      outcomes: ALL_GROUPS.map(group => {
        const extKey = `${mk}_${group}`;
        const extName = EXTENDED_ARCHETYPES[extKey] || mk;
        return {
          group,
          extendedName: extName,
          isActive: mk === mainKey && group === supportGroup,
        };
      }),
    };
    return row;
  });

  // ──────────────────────────────────────────────────────────
  // 7. Subgroup dynamics: Set A vs Set B raw point scores per group
  // ──────────────────────────────────────────────────────────
  const subgroups = SUBGROUP_POLARITIES.map(p => {
    const leftKey = p.leftLabel.toUpperCase();   // Set A archetype
    const rightKey = p.rightLabel.toUpperCase();  // Set B archetype
    const leftRaw = archetypeCounts[leftKey] || 0;   // raw selections (0-5)
    const rightRaw = archetypeCounts[rightKey] || 0;
    const leftPts = leftRaw * 5;   // points scored
    const rightPts = rightRaw * 5;
    
    // Check if this group's pair is complementary or shadow
    // eslint-disable-next-line no-unused-vars
    const pairIsComplementary = isComplementaryPair(leftKey, rightKey);
    // eslint-disable-next-line no-unused-vars
    const pairIsShadow = SHADOW_PAIRS[leftKey] === rightKey;
    // Bonus fields kept for backward compatibility but set to 0 (Geometric Bleed has no counters)
    const pairKeys = [leftKey, rightKey];
    // eslint-disable-next-line no-unused-vars
    const isActivePair = pairKeys.includes(mainKey) && pairKeys.includes(supportKey);
    const harmonyPts = 0;
    const shadowPts = 0;
    
    return {
      ...p,
      leftScore: leftPts,
      rightScore: rightPts,
      leftNature: archetypeNature[leftKey] || 0,
      leftCulture: archetypeCulture[leftKey] || 0,
      rightNature: archetypeNature[rightKey] || 0,
      rightCulture: archetypeCulture[rightKey] || 0,
      harmonyPoints: harmonyPts,
      shadowPoints: shadowPts,
    };
  });

  // ──────────────────────────────────────────────────────────
  // 8. Analysis text templates
  // ──────────────────────────────────────────────────────────
  const analysisTemplate = getAnalysisTemplate(mainKey);
  const analysisSections = analysisTemplate
    ? analysisTemplate.sections.map(s => ({ title: s.title, content: s.content }))
    : [
        { title: 'De Alchemie van Individuatie', content: 'Analyse wordt berekend...' },
        { title: 'Het Neurale Schakelbord', content: 'Implementatie wordt berekend...' },
        { title: 'Ontologische Evolutie', content: 'Traject wordt berekend...' },
      ];

  // ──────────────────────────────────────────────────────────
  // 9. Compute total score from advanced engine
  // ──────────────────────────────────────────────────────────
  const totalScore = advanced.totalPointsAwarded || 0;
  const harmonyActive = advanced.hasHarmonyBonus;
  const shadowBonusActive = advanced.hasShadowHarmony;

  // ──────────────────────────────────────────────────────────
  // 8b. OCEAN Personality Profiles
  // ──────────────────────────────────────────────────────────
  const coreProfile = getCoreProfile(mainKey);
  const extendedOcean = getExtendedOcean(mainKey, supportGroup);

  const resultObj = {
    // Extended identity
    name: extendedName,                              // e.g. "The Alchemist"
    extendedName,
    extendedSubtitle: extendedDesc?.subtitle || null,  // e.g. "Sage + Creative"
    combinationText: extendedDesc?.combination || null, // Why Main+Support create this archetype
    shadowInsight: extendedDesc?.shadow || null,         // Shadow tension for this combination
    // Main archetype
    mainArchetype: mainKey,
    mainName: primaryArchetype.name,                  // e.g. "De Wijze"
    mainNameEn: primaryArchetype.nameEn || mainKey,
    description: primaryArchetype.description,
    mainMotivation: primaryArchetype.motivation || null,
    mainPositive: primaryArchetype.positive || null,
    mainShadowTrait: primaryArchetype.shadow || null,
    mainComplementaryAxis: primaryArchetype.complementaryAxis || null,
    mainShadowTension: primaryArchetype.shadowTension || null,
    // Support archetype
    secondaryArchetype: supportKey,
    secondaryName: supportArchetype.name,              // e.g. "De Rebel"
    secondaryNameEn: supportArchetype.nameEn || supportKey,
    secondaryDescription: supportArchetype.description || null,
    secondaryMotivation: supportArchetype.motivation || null,
    secondaryPositive: supportArchetype.positive || null,
    // Shadow (180° opposite of Main — internal fuel)
    shadowPartner: shadowKey,
    shadowName: shadowKey ? (ARCHETYPES[shadowKey]?.name || shadowKey) : null,
    shadowNameEn: shadowKey ? (ARCHETYPES[shadowKey]?.nameEn || shadowKey) : null,
    shadowDescription: shadowKey ? (ARCHETYPES[shadowKey]?.description || null) : null,
    // Blindspot (shadow partner of Support — external saboteur)
    blindspotPartner: blindspotKey,
    blindspotName: blindspotKey ? (ARCHETYPES[blindspotKey]?.name || blindspotKey) : null,
    blindspotNameEn: blindspotKey ? (ARCHETYPES[blindspotKey]?.nameEn || blindspotKey) : null,
    blindspotDescription: blindspotKey ? (ARCHETYPES[blindspotKey]?.description || null) : null,
    blindspotShadowTrait: blindspotKey ? (ARCHETYPES[blindspotKey]?.shadow || null) : null,
    blindspotTension: blindspotKey ? (ARCHETYPES[blindspotKey]?.shadowTension || null) : null,
    // Harmony & Bonuses (Geometric Bleed — no separate counters, kept for backward compat)
    harmonyActive: false,
    shadowBonusActive: false,
    harmonyBonus: 0,
    beheersingsBonus: 0,
    harmonyPairName: null,
    // Metadata
    group: primaryArchetype.group || null,
    supportGroup: supportGroup,
    imageUrl: archetypeImage || primaryArchetype.imageUrl || 'https://picsum.photos/seed/gfl-archetype/400/400',
    // Scores & visualization
    radarData,
    subgroups,
    allSupportArchetypes,
    fullMatrix72,
    analysisSections,
    totalScore,
    maxScore: advanced.totalMaxScore || 369,
    // OCEAN Personality Profile
    oceanScores: advanced.oceanScores || null,           // 0-100 scale from archetype weight computation
    coreProfile,                                       // Full core archetype psychological portrait
    extendedOcean,                                     // OCEAN scores + trigger for this extended archetype
    oceanLabels: OCEAN_LABELS,                         // Dimension label map (short/full/dutch)
    oceanColors: OCEAN_COLORS,                         // Dimension color map for UI
    neuroticismTrigger: extendedOcean?.neuroticismTrigger || null,
    oceanImported: false,                              // Flag: only true if user explicitly imported OCEAN report
    // Raw data for future API agent
    _archetypeScores: archetypeScores,
    archetypeDetails: advanced.archetypeDetails || null,
    _primaryKey: mainKey,
    _secondaryKey: supportKey,
    _extendedName: extendedName,
    _harmonyActive: harmonyActive,
    // Full answer log (backend-only, for account-linked retrieval)
    _answerLog: answerLog,
    // AI Agent prompt (for Ontologische Evolutie section)
    _aiAgentPrompt: `Je bent een persoonlijke ontwikkelingscoach gespecialiseerd in Jungiaanse archetypen en het OCEAN persoonlijkheidsmodel. Mijn profiel: Extended Archetype "${extendedName}" (Main: ${primaryArchetype.nameEn || mainKey}, Support: ${supportArchetype.nameEn || supportKey}, Support Group: ${supportGroup}). Mijn schaduw (180° individuatie) is ${shadowKey ? (ARCHETYPES[shadowKey]?.nameEn || shadowKey) : 'onbekend'}, mijn blindspot is ${blindspotKey ? (ARCHETYPES[blindspotKey]?.nameEn || blindspotKey) : 'onbekend'}. OCEAN profiel: O=${extendedOcean?.ocean?.O || '?'}, C=${extendedOcean?.ocean?.C || '?'}, E=${extendedOcean?.ocean?.E || '?'}, A=${extendedOcean?.ocean?.A || '?'}, N=${extendedOcean?.ocean?.N || '?'}. Neuroticisme-trigger: ${extendedOcean?.neuroticismTrigger || 'onbekend'}. ${coreProfile ? `Werkplek superkracht: ${coreProfile.workplaceSuperpower} Conflictstijl: ${coreProfile.conflictStyle} Individuatiepad: ${coreProfile.individuationPath}` : ''} Help me mijn schaduw te integreren en mijn blindspot te herkennen in dagelijkse situaties.`,
  };

  // ──────────────────────────────────────────────────────────
  // Persist full session to localStorage for account retrieval
  // ──────────────────────────────────────────────────────────
  try {
    const sessionData = {
      timestamp: new Date().toISOString(),
      extendedArchetype: extendedName,
      mainArchetype: mainKey,
      supportArchetype: supportKey,
      supportGroup: supportGroup,
      harmonyActive,
      shadowBonusActive,
      totalScore,
      maxScore: resultObj.maxScore,
      archetypeScores: advanced.scores || archetypeScores,
      answerLog,
    };
    // Store current session
    localStorage.setItem('gfl_assessment_session', JSON.stringify(sessionData));
    // Append to history (keep last 10 sessions)
    const history = JSON.parse(localStorage.getItem('gfl_assessment_history') || '[]');
    history.unshift(sessionData);
    if (history.length > 10) history.length = 10;
    localStorage.setItem('gfl_assessment_history', JSON.stringify(history));
  } catch (e) {
    // localStorage may be unavailable — fail silently
  }

  return resultObj;
}

export default AssessmentResultsModal;
