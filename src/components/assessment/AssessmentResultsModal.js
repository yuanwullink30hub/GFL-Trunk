import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
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
  ARCHETYPE_RADAR_LABELS,
  ALL_ARCHETYPE_KEYS,
  SHADOW_PAIRS,
  ARCHETYPE_TO_GROUP,
  EXTENDED_ARCHETYPES,
  getExtendedArchetype,
  isComplementaryPair,
  getExtendedDescription,
  getStateToggle,
  getNatureCultureBucket,
} from '../../data/assessment';
import { getArchetypeImage } from '../../data/assessment/archetypeImages';
import { getCoreProfile, getExtendedOcean, OCEAN_LABELS, OCEAN_COLORS } from '../../data/assessment/oceanProfiles';
import { getToken, saveAssessment, analyzeAssessment, submitAssessmentReview } from '../../utils/apiClient';

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
const AssessmentResultsModal = ({
  resultsLoadingProgress,
  resultsModalProgress,
  layerAnswers,
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
  const [aiReady, setAiReady] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);
  const [, setAiStage] = useState(0); // 0=waiting, 1=data sent, 2=AI done, 3=integrated
  const aiCalledRef = useRef(false);
  const onAiReadyRef = useRef(onAiReady);
  onAiReadyRef.current = onAiReady;

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

  // ── Review/Feedback form state ──
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    email: '',
    whatWorked: '',
    whatDidntWork: '',
    suggestions: '',
  });
  const [reviewError, setReviewError] = useState('');

  // ── Review form submission handler ──
  const handleReviewSubmit = useCallback(async (e) => {
    e?.preventDefault();
    const { email, whatWorked, whatDidntWork, suggestions } = reviewFormData;
    
    // Validate email is provided
    if (!email.trim()) {
      setReviewError('Vul je e-mailadres in');
      return;
    }

    // Validate at least one field is filled
    if (!whatWorked.trim() && !whatDidntWork.trim() && !suggestions.trim()) {
      setReviewError('Vul minimaal één veld in');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');

    try {
      await submitAssessmentReview({
        assessmentId: savedAssessmentId || 'anonymous',
        email: email.trim(),
        whatWorked: whatWorked.trim(),
        whatDidntWork: whatDidntWork.trim(),
        suggestions: suggestions.trim(),
        archetypeKey: result?.mainArchetype || '',
        timestamp: new Date().toISOString(),
      });
      setReviewSubmitted(true);
      console.log('[GFL] Review submitted successfully');
    } catch (err) {
      console.error('[GFL] Review submission failed:', err);
      setReviewError(err.message || 'Failed to submit review. Please try again.');
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

    const oceanScores = result.extendedOcean?.ocean || null;

    analyzeAssessment({
      archetypeKey: result.mainArchetype,
      supportArchetype: result.secondaryArchetype || result._secondaryKey,
      supportGroup: result.supportGroup,
      extendedArchetypeName: result.extendedName || result.name,
      shadowArchetype: result.shadowPartner,
      blindspotArchetype: result.blindspotPartner,
      isIndividuated: result.shadowBonusActive,
      hasHarmonyBonus: result.harmonyActive,
      harmonyBonusApplied: result.harmonyActive ? 69 : 0,
      oceanScores,
      scores: result._archetypeScores,
      responses: result._answerLog,
      level: 'advanced',
    }, (stage, message) => {
      setAiStage(stage);
      console.log(`[GFL] AI stage ${stage}: ${message}`);
    })
      .then((aiResult) => {
        // Stage 3: frontend integration
        setAiStage(3);
        const sections = parseAiSections(aiResult.analysis || '');
        setAiSections(sections);
        setAiReady(true);
        if (onAiReadyRef.current) onAiReadyRef.current();
      })
      .catch((err) => {
        console.warn('[GFL] AI analysis failed, using template:', err.message);
        setAiFailed(true);
        aiCalledRef.current = false; // allow retry on failure
      });
  }, [result, aiReady]);

  // Removed: stageLabels (using simpler single-message loading state now)

  // Displayed sections: AI-generated when available, template fallback otherwise
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const displaySections = useMemo(() => aiSections || result?.analysisSections || [], [aiSections, result]);
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

      // Dark theme palette
      const bg = [10, 10, 14];
      const orange = [249, 115, 22];
      const purple = [168, 85, 247];
      const green = [0, 180, 110];
      const red = [220, 60, 60];
      const white = [240, 240, 245];
      const dimWhite = [180, 180, 190];
      const mutedGray = [120, 120, 130];
      const cardBg = [22, 22, 28];

      // ── Helper: paint page background ──
      const paintBg = () => {
        pdf.setFillColor(...bg);
        pdf.rect(0, 0, W, H, 'F');
      };
      paintBg(); // first page

      // ── Helper: add page if needed ──
      const ensureSpace = (needed) => {
        if (y + needed > H - margin) {
          pdf.addPage();
          paintBg();
          y = margin;
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

      // ── Helper: key-value line ──
      const keyValue = (key, value) => {
        if (!value) return;
        ensureSpace(6);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...mutedGray);
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

      // ── Helper: page footer ──
      const pageFooter = () => {
        pdf.setFontSize(6.5);
        pdf.setTextColor(...mutedGray);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Garden for Life  \u2022  Advanced Consciousness Assessment', W / 2, H - 10, { align: 'center' });
      };

      // ═══════════════════════════════════════════════════
      // PAGE 1: COVER — Large profile + archetype combo
      // ═══════════════════════════════════════════════════

      // Top brand line
      pdf.setFontSize(8);
      pdf.setTextColor(...mutedGray);
      pdf.setFont('helvetica', 'normal');
      pdf.text('GARDEN FOR LIFE', margin, y);
      y += 3;
      pdf.setDrawColor(...green);
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
        y += pdfImgSize + 12;
      } catch {
        y += 8;
      }

      // Extended Archetype Name — large, centered
      pdf.setFontSize(26);
      pdf.setTextColor(...purple);
      pdf.setFont('helvetica', 'bold');
      pdf.text(result.name || '', W / 2, y, { align: 'center' });
      y += 10;

      if (result.extendedSubtitle) {
        pdf.setFontSize(12);
        pdf.setTextColor(...orange);
        pdf.setFont('helvetica', 'normal');
        pdf.text(result.extendedSubtitle, W / 2, y, { align: 'center' });
        y += 8;
      }

      // Main + Support combination — prominent display
      if (result.secondaryName) {
        y += 4;
        // Decorative line
        pdf.setDrawColor(...green);
        pdf.setLineWidth(0.3);
        const lineW = 40;
        pdf.line(W / 2 - lineW, y, W / 2 + lineW, y);
        y += 10;

        pdf.setFontSize(10);
        pdf.setTextColor(...dimWhite);
        pdf.setFont('helvetica', 'normal');
        pdf.text('MAIN ARCHETYPE', W / 2, y, { align: 'center' });
        y += 6;
        pdf.setFontSize(16);
        pdf.setTextColor(...orange);
        pdf.setFont('helvetica', 'bold');
        pdf.text(result.mainName || '', W / 2, y, { align: 'center' });
        y += 10;

        // Connector symbol
        pdf.setFontSize(14);
        pdf.setTextColor(...green);
        pdf.text(result.harmonyActive ? '\u27F7' : '+', W / 2, y, { align: 'center' });
        y += 8;

        pdf.setFontSize(10);
        pdf.setTextColor(...dimWhite);
        pdf.setFont('helvetica', 'normal');
        pdf.text('SUPPORT ARCHETYPE', W / 2, y, { align: 'center' });
        y += 6;
        pdf.setFontSize(16);
        pdf.setTextColor(...purple);
        pdf.setFont('helvetica', 'bold');
        pdf.text(result.secondaryName || '', W / 2, y, { align: 'center' });
        y += 10;
      }

      // Bonus badges
      if (result.harmonyActive) {
        pdf.setFontSize(8);
        pdf.setTextColor(...green);
        pdf.setFont('helvetica', 'bold');
        pdf.text('HARMONY BONUS ACTIVE (+33)', W / 2, y, { align: 'center' });
        y += 5;
      }
      if (result.shadowBonusActive) {
        pdf.setFontSize(8);
        pdf.setTextColor(...orange);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SHADOW BONUS ACTIVE (+69)', W / 2, y, { align: 'center' });
        y += 5;
      }

      // Score at bottom of cover
      pdf.setFontSize(9);
      pdf.setTextColor(...mutedGray);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Score: ${result.totalScore} / ${result.maxScore}`, W / 2, H - 22, { align: 'center' });
      pdf.setFontSize(7);
      pdf.text(`Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}`, W / 2, H - 17, { align: 'center' });

      pageFooter();

      // ═══════════════════════════════════════════════════
      // PAGE 2: LEGAL / COMPLIANCE
      // ═══════════════════════════════════════════════════
      pdf.addPage();
      paintBg();
      y = margin;

      // Header
      pdf.setFontSize(16);
      pdf.setTextColor(...white);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Juridische Informatie & Disclaimer', margin, y);
      y += 4;
      pdf.setDrawColor(...green);
      pdf.setLineWidth(0.4);
      pdf.line(margin, y, W - margin, y);
      y += 10;

      // ── Legal section helper (card-style) ──
      const legalSection = (title, body, accentColor) => {
        const bodyLines = pdf.splitTextToSize(body, contentW - 16);
        const blockH = 12 + bodyLines.length * 4;
        ensureSpace(blockH + 4);
        // Card background
        pdf.setFillColor(...cardBg);
        pdf.roundedRect(margin, y - 2, contentW, blockH, 2, 2, 'F');
        // Left accent bar
        pdf.setFillColor(...accentColor);
        pdf.rect(margin, y - 2, 2, blockH, 'F');
        // Title
        pdf.setFontSize(10);
        pdf.setTextColor(...accentColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin + 8, y + 4);
        // Body
        pdf.setFontSize(8);
        pdf.setTextColor(...dimWhite);
        pdf.setFont('helvetica', 'normal');
        const bodyY = y + 10;
        bodyLines.forEach((line, i) => {
          pdf.text(line, margin + 8, bodyY + i * 4);
        });
        y += blockH + 6;
      };

      legalSection(
        '1. Productomschrijving',
        'Dit document is gegenereerd door het Garden for Life Assessment System, een zelfreflectie-instrument gebaseerd op het Deltawerken model. ' +
        'De resultaten in dit rapport zijn gebaseerd op een AI-gestuurd archetyperingsmodel en vormen geen klinische diagnose, psychologisch advies of medische beoordeling. ' +
        'Het systeem kent op basis van uw antwoorden een archetypecombinatie toe die bedoeld is als spiegel voor persoonlijke reflectie.',
        green
      );

      legalSection(
        '2. Metaforisch Kader & Wetenschappelijke Context',
        'Dit systeem maakt gebruik van termen en concepten uit de neurowetenschappen, kwantumbiologie en Zero Point Energy (ZPE). ' +
        'Deze worden uitsluitend metaforisch ingezet als denkkader en worden niet gepresenteerd als gevestigde wetenschap. ' +
        'Verwijzingen naar neurotransmitters, kwantumvelden of energetische patronen dienen als beeldspraak om gedragspatronen te duiden, niet als wetenschappelijke claims.',
        purple
      );

      legalSection(
        '3. AI Agent Prompt — Verantwoordelijkheid',
        'De AI Agent Prompt die in dit document is opgenomen, is een experimenteel gegenereerd stijlprofiel. ' +
        'De stijlrichtlijnen in deze prompt zijn geen klinisch profiel maar een gedragsmatige reflectievoorkeur. ' +
        'Gebruik in externe AI-tools (zoals ChatGPT, Claude of andere) valt volledig buiten de verantwoordelijkheid van Garden For Life. ' +
        'De gebruiker aanvaardt volledige verantwoordelijkheid voor het gebruik van deze prompt buiten het Garden for Life platform.',
        orange
      );

      legalSection(
        '4. Gegevensbescherming (AVG/GDPR)',
        'Garden for Life verwerkt persoonsgegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG/GDPR). ' +
        'Assessment-resultaten worden maximaal 90 dagen bewaard op beveiligde servers binnen de EU (Frankfurt, Duitsland). ' +
        'E-mailadressen en weergavenamen worden versleuteld opgeslagen (AES-256-GCM). ' +
        'Na de bewaartermijn worden gegevens automatisch en onherroepelijk verwijderd. ' +
        'U heeft te allen tijde het recht om uw account en alle bijbehorende gegevens direct te verwijderen via uw profielinstellingen.',
        green
      );

      legalSection(
        '5. Intellectueel Eigendom',
        'Het Deltawerken model, de archetypenstructuur, het scoringssysteem en alle bijbehorende teksten en visualisaties zijn intellectueel eigendom van Garden For Life. ' +
        'Dit document is uitsluitend bedoeld voor persoonlijk gebruik door de ontvanger. ' +
        'Reproductie, publicatie of commercieel gebruik van (delen van) dit rapport zonder schriftelijke toestemming is niet toegestaan.',
        purple
      );

      legalSection(
        '6. Aansprakelijkheid',
        'Garden for Life aanvaardt geen aansprakelijkheid voor beslissingen genomen op basis van de resultaten in dit rapport. ' +
        'Dit instrument is geen vervanging voor professioneel psychologisch, medisch of therapeutisch advies. ' +
        'Bij psychische klachten of zorgen wordt geadviseerd contact op te nemen met een gekwalificeerde zorgverlener. ' +
        'Het gebruik van dit rapport en de daarin opgenomen AI Agent Prompt geschiedt geheel op eigen risico van de gebruiker.',
        red
      );

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
      pdf.setTextColor(...dimWhite);
      pdf.setFont('helvetica', 'normal');
      pdf.text('De gebruiker heeft bij het downloaden van dit document bevestigd kennis te hebben', margin + 8, y + 9);
      pdf.text('genomen van bovenstaande voorwaarden en de verantwoordelijkheid voor gebruik te aanvaarden.', margin + 8, y + 13);
      y += 22;

      // Contact
      pdf.setFontSize(7);
      pdf.setTextColor(...mutedGray);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Vragen of verzoeken? Neem contact op via het Garden for Life platform.', W / 2, y, { align: 'center' });

      pageFooter();

      // ═══════════════════════════════════════════════════
      // PAGE 3+: CONTENT PAGES
      // ═══════════════════════════════════════════════════
      pdf.addPage();
      paintBg();
      y = margin;

      // ── WHY THIS COMBINATION ──
      if (result.combinationText) {
        sectionHeading(`Waarom jij ${result.name} bent`, green);
        writeWrapped(result.combinationText, margin + 2, y, contentW - 4, 9.5, white);
        y += 4;
        hr();
      }

      // ── MAIN ARCHETYPE ──
      sectionHeading(`De Essentie — ${result.mainName} (${result.mainNameEn})`, orange);
      if (result.group) {
        pdf.setFontSize(8);
        pdf.setTextColor(...mutedGray);
        pdf.text(`Groep: ${result.group}`, margin + 5, y);
        y += 5;
      }
      keyValue('Motivatie', result.mainMotivation);
      keyValue('Kracht', result.mainPositive);
      keyValue('Schaduwkant', result.mainShadowTrait);
      y += 2;
      hr();

      // ── SUPPORT ARCHETYPE ──
      sectionHeading(`De Vermenigvuldiging — ${result.secondaryName} (${result.secondaryNameEn})`, purple);
      if (result.supportGroup) {
        pdf.setFontSize(8);
        pdf.setTextColor(...mutedGray);
        pdf.text(`Support Groep: ${result.supportGroup}`, margin + 5, y);
        y += 5;
      }
      keyValue('Motivatie', result.secondaryMotivation);
      keyValue('Kracht', result.secondaryPositive);
      if (result.secondaryDescription) {
        keyValue('Profiel', result.secondaryDescription);
      }
      if (result.harmonyActive) {
        ensureSpace(6);
        pdf.setFontSize(8);
        pdf.setTextColor(...green);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`\u2666 Harmony: ${result.mainNameEn} + ${result.secondaryNameEn} — complementaire as`, margin + 2, y);
        y += 5;
      }
      y += 2;
      hr();

      // ── ALL 6 OUTCOMES TABLE ──
      if (result.allSupportArchetypes) {
        sectionHeading(`Alle Uitkomsten voor ${result.mainName}`, green);
        ensureSpace(28);
        const colW = contentW / 3;
        result.allSupportArchetypes.forEach((sa, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          if (col === 0 && row > 0) y += 12;
          const cx = margin + col * colW;
          const cy = y;
          // Highlight active
          if (sa.isActive) {
            pdf.setFillColor(40, 30, 60);
            pdf.roundedRect(cx, cy - 3.5, colW - 2, 11, 1.5, 1.5, 'F');
          }
          pdf.setFontSize(7);
          pdf.setTextColor(...(sa.isActive ? purple : mutedGray));
          pdf.setFont('helvetica', 'bold');
          pdf.text(sa.group, cx + 2, cy);
          pdf.setFontSize(9);
          pdf.setTextColor(...(sa.isActive ? purple : dimWhite));
          pdf.setFont('helvetica', sa.isActive ? 'bold' : 'normal');
          pdf.text(sa.extendedName, cx + 2, cy + 4.2);
          if (sa.isActive) {
            pdf.setFontSize(6);
            pdf.setTextColor(...green);
            pdf.text('\u25B8 JOUW RESULTAAT', cx + 2, cy + 7.5);
          }
        });
        y += 24;
        hr();
      }

      // ── SHADOW ──
      if (result.shadowPartner) {
        sectionHeading(`De Schaduw — ${result.shadowName} (${result.shadowNameEn})`, orange);
        if (result.mainShadowTension) {
          writeWrapped(result.mainShadowTension, margin + 2, y, contentW - 4, 9, orange, 'italic');
          y += 2;
        }
        if (result.shadowInsight) {
          writeWrapped(result.shadowInsight, margin + 2, y, contentW - 4, 9.5, white);
        } else if (result.shadowDescription) {
          writeWrapped(result.shadowDescription, margin + 2, y, contentW - 4, 9.5, white);
        }
        y += 4;
        hr();
      }

      // ── BLINDSPOT ──
      if (result.blindspotPartner) {
        sectionHeading(`De Blindspot — ${result.blindspotName} (${result.blindspotNameEn})`, red);
        ensureSpace(6);
        pdf.setFontSize(8);
        pdf.setTextColor(...red);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`De tegenhanger van je Support (${result.secondaryNameEn}) — jouw externe blinde vlek`, margin + 5, y);
        y += 5;
        if (result.blindspotDescription) {
          writeWrapped(result.blindspotDescription, margin + 2, y, contentW - 4, 9.5, white);
          y += 2;
        }
        if (result.blindspotShadowTrait) {
          keyValue('Sabotage patroon', result.blindspotShadowTrait);
        }
        y += 4;
        hr();
      }

      // ── RADAR CHART ──
      if (radarRef.current) {
        sectionHeading('Visuele Analyse — Archetype Matrix', green);
        try {
          const radarCanvas = await html2canvas(radarRef.current, {
            backgroundColor: '#0a0a0e',
            scale: 2,
            useCORS: true,
            logging: false,
          });
          const radarImg = radarCanvas.toDataURL('image/png');
          const radarW = Math.min(contentW, 120);
          const radarH = (radarCanvas.height / radarCanvas.width) * radarW;
          ensureSpace(radarH + 4);
          pdf.addImage(radarImg, 'PNG', W / 2 - radarW / 2, y, radarW, radarH);
          y += radarH + 6;
        } catch {
          y += 4;
        }
        hr();
      }

      // ── DUAL-CORE DYNAMICS ──
      if (result.subgroups && result.subgroups.length > 0) {
        sectionHeading('Dual-Core Dynamics', purple);
        const MAX_PTS = 25;
        const barMaxW = 50;
        const rowH = 10;

        result.subgroups.forEach(sg => {
          ensureSpace(rowH + 2);
          const leftPct = MAX_PTS > 0 ? sg.leftScore / MAX_PTS : 0;
          const rightPct = MAX_PTS > 0 ? sg.rightScore / MAX_PTS : 0;
          const centerX = W / 2;
          const barY = y - 1;

          // Left bar (purple)
          pdf.setFillColor(...purple);
          const leftBarW = leftPct * barMaxW;
          pdf.rect(centerX - leftBarW - 1, barY, leftBarW, 4, 'F');

          // Right bar (orange)
          pdf.setFillColor(...orange);
          const rightBarW = rightPct * barMaxW;
          pdf.rect(centerX + 1, barY, rightBarW, 4, 'F');

          // Center divider
          pdf.setFillColor(60, 60, 70);
          pdf.rect(centerX - 0.3, barY - 0.5, 0.6, 5, 'F');

          // Labels & scores
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...purple);
          pdf.text(`${sg.leftLabel}  ${sg.leftScore}`, centerX - barMaxW - 2, y + 1.5, { align: 'right' });
          pdf.setTextColor(...orange);
          pdf.text(`${sg.rightScore}  ${sg.rightLabel}`, centerX + barMaxW + 2, y + 1.5);

          if (sg.harmonyPoints > 0) {
            pdf.setFontSize(5.5);
            pdf.setTextColor(...green);
            pdf.text(`+${sg.harmonyPoints} harmony`, centerX, y + 5, { align: 'center' });
          }
          if (sg.shadowPoints > 0) {
            pdf.setFontSize(5.5);
            pdf.setTextColor(...orange);
            pdf.text(`+${sg.shadowPoints} shadow`, centerX, y + (sg.harmonyPoints > 0 ? 7.5 : 5), { align: 'center' });
          }

          y += rowH + (sg.harmonyPoints > 0 || sg.shadowPoints > 0 ? 4 : 0);
        });
        y += 4;
        hr();
      }

      // ── ANALYSIS SECTIONS ──
      if (displaySections && displaySections.length > 0) {
        const sectionColors = [green, purple, orange];
        displaySections.forEach((section, i) => {
          sectionHeading(section.title, sectionColors[i % 3]);
          writeWrapped(section.content, margin + 2, y, contentW - 4, 9.5, white);
          y += 4;
          if (i < displaySections.length - 1) hr();
        });
      }

      // ═══════════════════════════════════════════════════
      // FINAL FOOTER (last page)
      // ═══════════════════════════════════════════════════
      ensureSpace(14);
      y += 4;
      pdf.setDrawColor(...green);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, W - margin, y);
      y += 5;
      pdf.setFontSize(7);
      pdf.setTextColor(...mutedGray);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Garden for Life  \u2022  Advanced Consciousness Assessment', W / 2, y, { align: 'center' });
      y += 3.5;
      pdf.text(`Score: ${result.totalScore} / ${result.maxScore}`, W / 2, y, { align: 'center' });
      y += 3.5;
      pdf.text(`Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}`, W / 2, y, { align: 'center' });

      // ── Download ──
      const archetypeName = (result?.extendedName || 'Archetype').replace(/\s+/g, '_');
      pdf.save(`GardenForLife_${archetypeName}.pdf`);
    } catch (err) {
      console.error('[PDF] Generation failed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, displaySections]);
  
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
              Wij berekenen niet wie je bent. We berekenen de fysiologische prijs van wie je probeert te zijn.
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
            border: '1px solid rgba(0, 255, 157, 0.3)',
            borderRadius: '0.75rem',
            boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(0, 255, 157, 0.06), inset 0 0 30px rgba(0, 255, 157, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            color: '#fff',
            overflow: 'hidden',
          }}>

            {/* SectorFrame-style corner borders */}
            {renderCorners('#00ff9d')}

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
              background: 'linear-gradient(to right, transparent, #00ff9d, transparent)',
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
                  borderBottom: '1px solid rgba(0, 255, 157, 0.2)',
                }}>
                  {/* Profile Image with Holographic Rings — responsive size */}
                  <div style={{ position: 'relative', width: rs.profileImgSize, height: rs.profileImgSize, flexShrink: 0 }}>
                    {/* Dashed spinning ring */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: '1px dashed rgba(0, 255, 157, 0.4)',
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
                      border: '2px solid #00ff9d',
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
                          filter: 'contrast(1.25) sepia(0.2)'
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
                        color: 'rgba(0, 255, 157, 0.7)',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        marginTop: '0.75rem',
                      }}>
                        {result.mainName} {result.harmonyActive ? '⟷' : '+'} {result.secondaryName}
                      </p>
                    )}
                    {result.harmonyActive && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#00ff9d',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        marginTop: '0.5rem',
                        textTransform: 'uppercase',
                      }}>
                        ✦ Harmony Bonus Active (+33) ✦
                      </p>
                    )}
                    {result.shadowBonusActive && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#f97316',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        marginTop: '0.5rem',
                        textTransform: 'uppercase',
                      }}>
                        ✦ Shadow Bonus Active (+69) ✦
                      </p>
                    )}
                  </div>
                </div>

                {/* ── 2. Combination Profile — Why Main + Support = Extended Archetype ── */}
                {result.combinationText && (
                  <div style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.08), rgba(0, 255, 157, 0.03))',
                    border: '1px solid rgba(0, 255, 157, 0.25)',
                    borderRadius: '0.75rem',
                    padding: rs.sectionPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, transparent, #00ff9d, transparent)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#00ff9d',
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
                    background: 'rgba(249, 115, 22, 0.05)',
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
                      fontSize: '0.65rem', color: 'rgba(249, 115, 22, 0.5)',
                      fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.2em',
                      textTransform: 'uppercase', marginBottom: '0.75rem',
                    }}>
                      {/* MAIN ARCHETYPE */}
                    </div>
                    <h4 style={{
                      color: '#f97316',
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
                        <span style={{ fontSize: '0.7rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Motivatie: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.mainMotivation}</span>
                      </div>
                    )}
                    {result.mainPositive && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kracht: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.mainPositive}</span>
                      </div>
                    )}
                    {result.mainShadowTrait && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Schaduw: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.7)', fontFamily: "'Figtree', sans-serif" }}>{result.mainShadowTrait}</span>
                      </div>
                    )}
                  </div>

                  {/* Support Archetype Card */}
                  <div style={{
                    background: 'rgba(168, 85, 247, 0.05)',
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
                      fontSize: '0.65rem', color: 'rgba(168, 85, 247, 0.5)',
                      fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.2em',
                      textTransform: 'uppercase', marginBottom: '0.75rem',
                    }}>
                      {/* SUPPORT ARCHETYPE */}
                    </div>
                    <h4 style={{
                      color: '#a855f7',
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
                        <span style={{ fontSize: '0.7rem', color: '#a855f7', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Motivatie: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.secondaryMotivation}</span>
                      </div>
                    )}
                    {result.secondaryPositive && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#00ff9d', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kracht: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.secondaryPositive}</span>
                      </div>
                    )}
                    {result.secondaryDescription && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(156, 163, 175, 0.5)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Profiel: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.7)', fontFamily: "'Figtree', sans-serif" }}>{result.secondaryDescription}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 3b. All Support Archetype Outcomes ── */}
                {result.allSupportArchetypes && (
                  <div style={{
                    width: '100%',
                    background: 'rgba(0, 255, 157, 0.05)',
                    border: '1px solid rgba(0, 255, 157, 0.15)',
                    borderRadius: '0.75rem',
                    padding: rs.cardPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, transparent, #00ff9d, transparent)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#00ff9d',
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
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.75rem',
                    }}>
                      {result.allSupportArchetypes.map((sa) => (
                        <div key={sa.group} style={{
                          background: sa.isActive ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0, 255, 157, 0.05)',
                          border: sa.isActive ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(0, 255, 157, 0.15)',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          textAlign: 'center',
                          transition: 'all 0.3s',
                        }}>
                          <div style={{
                            fontSize: '0.65rem',
                            color: sa.isActive ? '#a855f7' : 'rgba(0, 255, 157, 0.5)',
                            fontFamily: "'Rajdhani', sans-serif",
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '0.25rem',
                          }}>
                            {sa.group}
                          </div>
                          <div style={{
                            fontSize: '0.85rem',
                            color: sa.isActive ? '#fff' : 'rgba(0, 255, 157, 0.7)',
                            fontFamily: "'Figtree', sans-serif",
                            fontWeight: sa.isActive ? 'bold' : 'normal',
                          }}>
                            {sa.extendedName}
                          </div>
                          <div style={{
                            fontSize: '0.65rem',
                            color: sa.isActive ? 'rgba(168, 85, 247, 0.7)' : 'rgba(0, 255, 157, 0.4)',
                            fontFamily: "'Rajdhani', sans-serif",
                            fontStyle: 'italic',
                            marginTop: '0.15rem',
                          }}>
                            {sa.subtitle}
                          </div>
                          {sa.isActive && (
                            <div style={{
                              marginTop: '0.4rem',
                              fontSize: '0.55rem',
                              color: '#00ff9d',
                              fontFamily: "'Rajdhani', sans-serif",
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.15em',
                            }}>
                              ▸ JOUW RESULTAAT
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 4. Shadow Integration ── */}
                {result.shadowPartner && (
                  <div style={{
                    width: '100%',
                    background: 'rgba(249, 115, 22, 0.05)',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    borderRadius: '0.75rem',
                    padding: rs.cardPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, transparent, #f97316, transparent)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#f97316',
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
                        color: 'rgba(249, 115, 22, 0.8)',
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
                    background: 'rgba(239, 68, 68, 0.05)',
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
                      marginBottom: '0.75rem',
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
                    background: 'rgba(168, 85, 247, 0.04)',
                    border: '1px solid rgba(168, 85, 247, 0.15)',
                    borderRadius: '0.75rem',
                    padding: rs.cardPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, #a855f7, #22d3ee, #fbbf24, #f472b6, #ef4444)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#a855f7',
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
                                fontSize: '0.6rem', fontFamily: "'Rajdhani', sans-serif",
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
                      borderBottom: '1px solid rgba(168, 85, 247, 0.1)',
                    }}>
                      {['O', 'C', 'E', 'A', 'N'].map(dim => (
                        <span key={dim} style={{
                          fontSize: '0.65rem', fontFamily: "'Rajdhani', sans-serif",
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
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid rgba(168, 85, 247, 0.12)',
                          borderRadius: '0.5rem',
                          padding: '0.75rem 1rem',
                          marginBottom: '1rem',
                        }}>
                          <div style={{
                            fontSize: '0.65rem', color: '#22d3ee',
                            fontFamily: "'Rajdhani', sans-serif",
                            fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.1em', marginBottom: '0.6rem',
                          }}>
                            OCEAN Resonantie & Dissonantie Analyse (0–100 schaal)
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {analyses.filter(a => a.status !== 'neutral').map(({ dim, pct, status }) => {
                              const isRes = status === 'resonance';
                              const color = isRes ? '#00ff9d' : '#fbbf24';
                              const icon = isRes ? '✦' : '⚠';
                              const label = isRes ? 'Resonantie' : 'Dissonantie';
                              const expVal = expect[dim];
                              return (
                                <div key={dim} style={{
                                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                                  padding: '0.5rem 0.6rem',
                                  background: isRes ? 'rgba(0, 255, 157, 0.06)' : 'rgba(251, 191, 36, 0.06)',
                                  border: `1px solid ${isRes ? 'rgba(0, 255, 157, 0.15)' : 'rgba(251, 191, 36, 0.15)'}`,
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
                                        fontSize: '0.65rem', fontWeight: 700,
                                        color, textTransform: 'uppercase', letterSpacing: '0.05em',
                                      }}>
                                        {label}
                                      </span>
                                      <span style={{
                                        fontFamily: "'Rajdhani', sans-serif",
                                        fontSize: '0.65rem', color: 'rgba(209, 213, 219, 0.5)',
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
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1rem',
                        marginBottom: '1rem',
                      }}>
                        <div style={{
                          fontSize: '0.65rem', color: '#ef4444',
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
                          { label: 'Superkracht op de Werkvloer', text: result.coreProfile.workplaceSuperpower, color: '#00ff9d' },
                          { label: 'Conflictstijl', text: result.coreProfile.conflictStyle, color: '#fbbf24' },
                          { label: 'Relatiepatroon', text: result.coreProfile.relationshipPattern, color: '#f472b6' },
                          { label: 'Individuatiepad', text: result.coreProfile.individuationPath, color: '#a855f7' },
                        ].map(({ label, text, color: c }) => (
                          <div key={label}>
                            <div style={{
                              fontSize: '0.65rem', color: c,
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
                  background: 'rgba(168, 85, 247, 0.05)',
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

                {/* ── 6. Radar Chart (full width) ── */}
                <div style={{
                  position: 'relative',
                  background: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(0, 255, 157, 0.2)',
                  padding: '0.5rem',
                  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 255, 157, 0.05)',
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
                    color: 'rgba(0, 255, 157, 0.6)',
                    letterSpacing: '0.2em',
                  }}>
                    {'/// ARCHETYPE_MATRIX'}
                  </div>
                  <div ref={radarRef} style={{ width: '100%', height: rs.radarHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SciFiRadarChart data={result.radarData} shadow={result.shadowArchetype} blindspot={result.blindspotArchetype} mainArchetype={result.overallArchetype} supportArchetype={result.supportArchetype} />
                  </div>
                </div>

                {/* ── 7+. AI Analysis Sections (dynamic, all sections) ── */}
                {displaySections.map((section, idx) => {
                  // Cycle through accent colors for visual variety
                  const accents = [
                    { color: '#00ff9d', rgb: '0, 255, 157' },   // green
                    { color: '#a855f7', rgb: '168, 85, 247' },   // purple
                    { color: '#f97316', rgb: '249, 115, 22' },   // orange
                    { color: '#3b82f6', rgb: '59, 130, 246' },   // blue
                    { color: '#ec4899', rgb: '236, 72, 153' },   // pink
                    { color: '#14b8a6', rgb: '20, 184, 166' },   // teal
                  ];
                  const accent = accents[idx % accents.length];
                  const isEven = idx % 2 === 0;

                  return (
                    <div key={idx} style={{
                      width: '100%',
                      position: 'relative',
                      ...(isEven ? {} : {
                        background: `rgba(${accent.rgb}, 0.05)`,
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
                          fontSize: '0.65rem', fontFamily: "'Rajdhani', sans-serif",
                          color: accent.color, flexShrink: 0,
                        }}>
                          {idx + 1}
                        </span>
                        {section.title}
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
                        {renderMarkdownContent(section.content)}
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

                  {/* ── Review/Feedback Form (gates download) ── */}
                  {!reviewSubmitted && (
                    <div style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      boxShadow: 'inset 0 0 20px rgba(168, 85, 247, 0.05)',
                    }}>
                      <h3 style={{
                        color: '#a855f7',
                        fontFamily: "'Lexend Mega', sans-serif",
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '1rem',
                        marginTop: 0,
                      }}>
                        Feedback
                      </h3>
                      <p style={{
                        color: 'rgba(209, 213, 219, 0.8)',
                        fontFamily: "'Figtree', sans-serif",
                        fontSize: '0.85rem',
                        marginBottom: '1rem',
                        marginTop: 0,
                      }}>
                        Jouw feedback helpt ons het systeem verbeteren
                      </p>

                      <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* E-mailadres */}
                        <div>
                          <label style={{
                            display: 'block',
                            color: '#c4b5fd',
                            fontFamily: "'Figtree', sans-serif",
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                          }}>
                            E-mailadres *
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
                              border: '1px solid rgba(196, 181, 253, 0.3)',
                              borderRadius: '0.5rem',
                              color: '#fff',
                              fontFamily: "'Figtree', sans-serif",
                              fontSize: '0.85rem',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {/* Vraag 1: Accuraatheid */}
                        <div>
                          <label style={{
                            display: 'block',
                            color: '#00ff9d',
                            fontFamily: "'Figtree', sans-serif",
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                          }}>
                            Hoe accuraat is het resultaat volgens jouw kennis en gevoel?
                          </label>
                          <textarea
                            value={reviewFormData.whatWorked}
                            onChange={(e) => setReviewFormData({ ...reviewFormData, whatWorked: e.target.value })}
                            placeholder="Beschrijf in hoeverre het resultaat klopt met wie jij bent..."
                            style={{
                              width: '100%',
                              minHeight: '80px',
                              padding: '0.75rem',
                              background: 'rgba(0, 0, 0, 0.8)',
                              border: '1px solid rgba(0, 255, 157, 0.2)',
                              borderRadius: '0.5rem',
                              color: '#fff',
                              fontFamily: "'Figtree', sans-serif",
                              fontSize: '0.85rem',
                              resize: 'vertical',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {/* Vraag 2: Niet overeenkomend */}
                        <div>
                          <label style={{
                            display: 'block',
                            color: '#ff6b6b',
                            fontFamily: "'Figtree', sans-serif",
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                          }}>
                            Waar ben je zeker van dat niet overeenkomt met jouw persoonlijkheid? Wees specifiek — en hoe weet je dit?
                          </label>
                          <textarea
                            value={reviewFormData.whatDidntWork}
                            onChange={(e) => setReviewFormData({ ...reviewFormData, whatDidntWork: e.target.value })}
                            placeholder="Bijv: ik ben helemaal niet competitief, want in groepswerk neem ik altijd een ondersteunende rol..."
                            style={{
                              width: '100%',
                              minHeight: '80px',
                              padding: '0.75rem',
                              background: 'rgba(0, 0, 0, 0.8)',
                              border: '1px solid rgba(255, 107, 107, 0.2)',
                              borderRadius: '0.5rem',
                              color: '#fff',
                              fontFamily: "'Figtree', sans-serif",
                              fontSize: '0.85rem',
                              resize: 'vertical',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {/* Vraag 3: Suggesties */}
                        <div>
                          <label style={{
                            display: 'block',
                            color: '#3b82f6',
                            fontFamily: "'Figtree', sans-serif",
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            marginBottom: '0.5rem',
                          }}>
                            Wat zou jij anders doen of toevoegen aan dit systeem?
                          </label>
                          <textarea
                            value={reviewFormData.suggestions}
                            onChange={(e) => setReviewFormData({ ...reviewFormData, suggestions: e.target.value })}
                            placeholder="Bijv: meer context bij de vragen, andere formulering, kortere assessment..."
                            style={{
                              width: '100%',
                              minHeight: '80px',
                              padding: '0.75rem',
                              background: 'rgba(0, 0, 0, 0.8)',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              borderRadius: '0.5rem',
                              color: '#fff',
                              fontFamily: "'Figtree', sans-serif",
                              fontSize: '0.85rem',
                              resize: 'vertical',
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

                        {/* Submit button */}
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
                          {isSubmittingReview ? 'Versturen...' : 'Verstuur Feedback'}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* ── Success message after review submission ── */}
                  {reviewSubmitted && (
                    <div style={{
                      width: '100%',
                      padding: '1rem',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.5)',
                      borderRadius: '0.75rem',
                      textAlign: 'center',
                    }}>
                      <p style={{
                        color: '#22c55e',
                        fontFamily: "'Figtree', sans-serif",
                        fontSize: '0.9rem',
                        margin: 0,
                      }}>
                        ✓ Feedback submitted successfully
                      </p>
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
                          border: '1px solid rgba(0,255,157,0.2)',
                          borderRadius: '0.5rem',
                          padding: '1.75rem',
                          boxShadow: '0 0 40px rgba(0,255,157,0.08)',
                          fontFamily: "'Lexend Mega', sans-serif",
                        }}>
                          <h3 style={{ color: '#00ff9d', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.25rem' }}>
                            Verantwoordelijkheid PDF & AI Prompt
                          </h3>
                          <p style={{ color: 'rgba(148,163,184,0.5)', fontSize: '0.6rem', fontStyle: 'italic', marginBottom: '1.25rem' }}>
                            Lees dit door voordat je de PDF downloadt
                          </p>

                          <div style={{ borderLeft: '2px solid rgba(0,255,157,0.3)', paddingLeft: '0.875rem', marginBottom: '1.25rem' }}>
                            <p style={{ color: 'rgba(148,163,184,0.85)', fontSize: '0.65rem', lineHeight: 1.75 }}>
                              Dit is een zelfreflectie-instrument gebaseerd op het Deltawerken model. De stijlrichtlijnen in deze prompt zijn geen klinisch profiel maar een gedragsmatige reflectievoorkeur. Gebruik in externe AI-tools valt buiten de verantwoordelijkheid van Garden For Life.
                            </p>
                          </div>

                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.25rem' }}>
                            <input
                              type="checkbox"
                              checked={pdfConsentChecked}
                              onChange={(e) => setPdfConsentChecked(e.target.checked)}
                              style={{ marginTop: '0.1rem', accentColor: '#00ff9d', width: '0.9rem', height: '0.9rem', flexShrink: 0, cursor: 'pointer' }}
                            />
                            <span style={{ color: 'rgba(148,163,184,0.9)', fontSize: '0.65rem', lineHeight: 1.65 }}>
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
                              onClick={() => { if (pdfConsentChecked) { setShowPdfConsent(false); handleDownloadPdf(); } }}
                              disabled={!pdfConsentChecked}
                              style={{ background: pdfConsentChecked ? 'transparent' : 'none', border: `1px solid ${pdfConsentChecked ? '#00ff9d' : 'rgba(0,255,157,0.2)'}`, color: pdfConsentChecked ? '#00ff9d' : 'rgba(0,255,157,0.3)', borderRadius: '9999px', padding: '0.35rem 1rem', fontSize: '0.55rem', fontFamily: "'Lexend Mega', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', cursor: pdfConsentChecked ? 'pointer' : 'not-allowed', backgroundColor: pdfConsentChecked ? 'rgba(0,255,157,0.07)' : 'none' }}
                              onMouseEnter={(e) => { if (pdfConsentChecked) e.currentTarget.style.boxShadow = '0 0 16px rgba(0,255,157,0.25)'; }}
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
                      title={!reviewSubmitted ? 'Please submit feedback first' : undefined}
                      style={{
                        flex: '1 1 0',
                        minWidth: rs.btnMinWidth,
                        position: 'relative',
                        overflow: 'hidden',
                        padding: rs.btnPad,
                        background: '#000',
                        border: '1px solid #00ff9d',
                        color: '#00ff9d',
                        fontFamily: "'Lexend Mega', sans-serif",
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: rs.btnFont,
                        cursor: (isGeneratingPdf || !reviewSubmitted) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s',
                        boxShadow: '0 0 15px rgba(0, 255, 157, 0.1)',
                        opacity: (isGeneratingPdf || !reviewSubmitted) ? 0.5 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!isGeneratingPdf && reviewSubmitted) {
                          e.currentTarget.style.background = '#00ff9d';
                          e.currentTarget.style.color = '#000';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#000';
                        e.currentTarget.style.color = '#00ff9d';
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
                            {t('results.downloadPdf')}
                          </>
                        )}
                      </span>
                    </button>
                    
                    {/* Save & Create Account */}
                    <button
                      onClick={onCreateAccount}
                      disabled={!reviewSubmitted}
                      title={!reviewSubmitted ? 'Please submit feedback first' : undefined}
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
                        cursor: !reviewSubmitted ? 'not-allowed' : 'pointer',
                        opacity: !reviewSubmitted ? 0.5 : 1,
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={e => {
                        if (reviewSubmitted) {
                          e.currentTarget.style.boxShadow = '0 0 25px rgba(168, 85, 247, 0.6)';
                        }
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
          background: rgba(0, 255, 157, 0.3);
          border-radius: 3px;
        }
        .results-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 157, 0.5);
        }
        .results-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 255, 157, 0.3) transparent;
        }
      `}</style>
    </div>
  );
};

/**
 * Render SectorFrame-style corner decorations
 */
function renderCorners(color) {
  const baseStyle = {
    position: 'absolute',
    width: '1rem',
    height: '1rem',
  };
  return (
    <>
      <div style={{ ...baseStyle, top: '-1px', left: '-1px', border: `1.5px solid ${color}`, borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' }} />
      <div style={{ ...baseStyle, top: '-1px', right: '-1px', border: `1.5px solid ${color}`, borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' }} />
      <div style={{ ...baseStyle, bottom: '-1px', left: '-1px', border: `1.5px solid ${color}`, borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' }} />
      <div style={{ ...baseStyle, bottom: '-1px', right: '-1px', border: `1.5px solid ${color}`, borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' }} />
    </>
  );
}

/**
 * Parse the AI analysis response (markdown with ## headings) into display sections.
 * Returns ALL sections found in the AI response for full dynamic rendering.
 */
function parseAiSections(analysisText) {
  if (!analysisText || typeof analysisText !== 'string') return null;

  // Split on ## headings (with or without numbering)
  const sectionRegex = /^##\s+(?:\d+\.\s+)?(.+)/gm;
  const matches = [];
  let match;

  while ((match = sectionRegex.exec(analysisText)) !== null) {
    matches.push({ title: match[1].trim(), start: match.index, headerEnd: match.index + match[0].length });
  }

  if (matches.length === 0) {
    // No section headers found — return full text as single section
    return [{ title: 'AI Analyse', content: analysisText.trim() }];
  }

  const parts = [];
  for (let i = 0; i < matches.length; i++) {
    const contentStart = matches[i].headerEnd;
    const contentEnd = i + 1 < matches.length ? matches[i + 1].start : analysisText.length;
    parts.push({
      title: matches[i].title,
      content: analysisText.slice(contentStart, contentEnd).trim(),
    });
  }

  return parts;
}

/**
 * Render markdown-ish content as React elements.
 * Handles: **bold**, *italic*, - bullet lists, numbered lists, ``` code blocks.
 */
function renderMarkdownContent(content) {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let listItems = [];
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) { flushCode(); inCodeBlock = false; }
      else { flushList(); inCodeBlock = true; }
      continue;
    }
    if (inCodeBlock) { codeLines.push(line); continue; }

    // Bullet list
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (bulletMatch) { listItems.push(bulletMatch[1]); continue; }

    // Numbered list
    const numMatch = line.match(/^\s*\d+\.\s+(.+)/);
    if (numMatch) { listItems.push(numMatch[1]); continue; }

    // Regular paragraph line
    flushList();
    if (line.trim() === '') {
      // Skip blank lines between paragraphs
      continue;
    }
    elements.push(<p key={`p-${elements.length}`} style={{ margin: '0.4rem 0' }}>{formatInline(line)}</p>);
  }
  flushList();
  flushCode();

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
 *   - Harmony Bonus: +69 pts to BOTH if Main & Support are complementary
 *   - Max per archetype: 150 base + 69 harmony = 219
 *   - Total max score: 369
 *
 * Accepts: { layerIndex: { questionId: answerId } }
 * e.g. { 0: { 1: "1a", 2: "2c" }, 1: { 7: "7b" }, ... }
 */
function computeResultFromAnswers(layerAnswers) {
  // ──────────────────────────────────────────────────────────
  // 1. Score each archetype: +5 points per selected answer
  //    Also track raw selection counts for radar chart
  // ──────────────────────────────────────────────────────────
  const archetypeScores = {};
  const archetypeCounts = {};
  const archetypeNature = {};   // Nature-bucket counts per archetype
  const archetypeCulture = {};  // Culture-bucket counts per archetype
  ALL_ARCHETYPE_KEYS.forEach(key => { archetypeScores[key] = 0; archetypeCounts[key] = 0; archetypeNature[key] = 0; archetypeCulture[key] = 0; });

  const layerScores = {}; // for subgroup bias computation
  const answerLog = [];   // full answer key (backend-only, for account-linked retrieval)

  if (layerAnswers && typeof layerAnswers === 'object') {
    Object.entries(layerAnswers).forEach(([layerIdxStr, layerData]) => {
      const layerIdx = parseInt(layerIdxStr, 10);
      if (!layerData || typeof layerData !== 'object') return;

      const layer = questions.find(q => q.layerIndex === layerIdx);
      if (!layer) return;

      if (!layerScores[layerIdx]) layerScores[layerIdx] = [];

      Object.entries(layerData).forEach(([questionIdStr, rawAnswerId]) => {
        const questionId = parseInt(questionIdStr, 10) || questionIdStr;
        // Safety: unwrap array if stored as [answerId] instead of string
        const answerId = Array.isArray(rawAnswerId) ? rawAnswerId[0] : rawAnswerId;
        const question = layer.questions.find(q => q.id === questionId);
        if (!question) return;

        const selectedAnswer = question.answers.find(a => a.id === answerId);
        if (!selectedAnswer) return;

        layerScores[layerIdx].push(selectedAnswer.value || 3);

        const archetype = selectedAnswer.archetype;
        if (archetype) {
          archetypeScores[archetype] = (archetypeScores[archetype] || 0) + 5;
          archetypeCounts[archetype] = (archetypeCounts[archetype] || 0) + 1;
          // Nature/Culture dual-tracking via state toggle
          const stateToggle = getStateToggle(question.id);
          const bucket = getNatureCultureBucket(archetype, stateToggle);
          if (bucket === 'NATURE') {
            archetypeNature[archetype] = (archetypeNature[archetype] || 0) + 1;
          } else {
            archetypeCulture[archetype] = (archetypeCulture[archetype] || 0) + 1;
          }
        }

        // Build detailed answer log entry
        const archetypeData = ARCHETYPES[archetype] || {};
        answerLog.push({
          questionNumber: question.id,
          layerIndex: layerIdx,
          layerName: layer.name || `Layer ${layerIdx}`,
          questionText: question.text,
          answerId: selectedAnswer.id,
          answerText: selectedAnswer.text,
          answerPosition: selectedAnswer.value,       // position 1-6 within the question
          pointsAwarded: 5,
          archetype: archetype,
          archetypeName: archetypeData.nameEn || archetype,     // e.g. "The Sage"
          archetypeNameNl: archetypeData.name || archetype,     // e.g. "De Wijze"
          archetypeGroup: archetypeData.group || null,          // e.g. "Wisdom"
          archetypeSet: archetypeData.set || null,              // "A" or "B"
          archetypeDescription: archetypeData.description || null,
          archetypeMotivation: archetypeData.motivation || null,
        });
      });
    });
  }

  // Sort answer log by question number
  answerLog.sort((a, b) => a.questionNumber - b.questionNumber);

  // ──────────────────────────────────────────────────────────
  // 2. Determine Main (highest) & Support (2nd highest) archetypes
  // ──────────────────────────────────────────────────────────
  const sorted = Object.entries(archetypeScores)
    .sort((a, b) => b[1] - a[1]);
  const mainKey = sorted[0]?.[0] || 'SAGE';
  const supportKey = sorted[1]?.[0] || 'EXPLORER';

  // ──────────────────────────────────────────────────────────
  // 3. Harmony Bonus (+69): unlocked when Main and Support are
  //    direct neighbors within their Neurale Zuil (biological pillar)
  //    Shadow Integration: measured on 180°-axis (no scoring bonus)
  // ──────────────────────────────────────────────────────────
  const harmonyActive = isComplementaryPair(mainKey, supportKey);
  const shadowBonusActive = SHADOW_PAIRS[mainKey] === supportKey; // flag only, no bonus
  if (harmonyActive) {
    archetypeScores[mainKey] += 69;
    archetypeScores[supportKey] += 69;
  }

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
  // 6. Generate radar data: 12 anchors = 12 archetypes (raw counts)
  //    Each archetype appears 5 times across 60 questions, so max possible = 5
  //    But we scale the domain dynamically so the highest always reaches the edge
  // ──────────────────────────────────────────────────────────
  // Fixed scale: each archetype has exactly 15 nature-eligible and 15 culture-eligible questions
  const radarData = ARCHETYPE_RADAR_LABELS.map(label => {
    const key = label.toUpperCase();
    return {
      subject: label,
      A: archetypeCounts[key] || 0,
      nature: archetypeNature[key] || 0,
      culture: archetypeCulture[key] || 0,
      fullMark: 15,
    };
  });

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
  //    Also compute shadow & harmony bonus points per group
  // ──────────────────────────────────────────────────────────
  const subgroups = SUBGROUP_POLARITIES.map(p => {
    const leftKey = p.leftLabel.toUpperCase();   // Set A archetype
    const rightKey = p.rightLabel.toUpperCase();  // Set B archetype
    const leftRaw = archetypeCounts[leftKey] || 0;   // raw selections (0-5)
    const rightRaw = archetypeCounts[rightKey] || 0;
    const leftPts = leftRaw * 5;   // points scored
    const rightPts = rightRaw * 5;
    
    // Check if this group's pair earns shadow or harmony bonus
    const pairIsComplementary = isComplementaryPair(leftKey, rightKey);
    const pairIsShadow = SHADOW_PAIRS[leftKey] === rightKey;
    // Bonus only if BOTH archetypes in the pair are Main+Support
    const pairKeys = [leftKey, rightKey];
    const isActivePair = pairKeys.includes(mainKey) && pairKeys.includes(supportKey);
    const harmonyPts = (pairIsComplementary && isActivePair) ? 33 : 0;
    const shadowPts = (pairIsShadow && isActivePair) ? 69 : 0;
    
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
  // 9. Compute total score
  // ──────────────────────────────────────────────────────────
  const totalScore = Object.values(archetypeScores).reduce((s, v) => s + v, 0);

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
    // Harmony
    harmonyActive,
    shadowBonusActive,
    harmonyPairName: harmonyActive
      ? `${primaryArchetype.nameEn || mainKey} + ${supportArchetype.nameEn || supportKey}`
      : null,
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
    maxScore: harmonyActive ? 369 : 300,
    // OCEAN Personality Profile
    coreProfile,                                       // Full core archetype psychological portrait
    extendedOcean,                                     // OCEAN scores + trigger for this extended archetype
    oceanLabels: OCEAN_LABELS,                         // Dimension label map (short/full/dutch)
    oceanColors: OCEAN_COLORS,                         // Dimension color map for UI
    neuroticismTrigger: extendedOcean?.neuroticismTrigger || null,
    oceanImported: false,                              // Flag: only true if user explicitly imported OCEAN report
    // Raw data for future API agent
    _archetypeScores: archetypeScores,
    _primaryKey: mainKey,
    _secondaryKey: supportKey,
    _extendedName: extendedName,
    _harmonyActive: harmonyActive,
    // Full answer log (backend-only, for account-linked retrieval)
    _answerLog: answerLog,
    // AI Agent prompt (for Ontologische Evolutie section)
    _aiAgentPrompt: `Je bent een persoonlijke ontwikkelingscoach gespecialiseerd in Jungiaanse archetypen en het OCEAN persoonlijkheidsmodel. Mijn profiel: Extended Archetype "${extendedName}" (Main: ${primaryArchetype.nameEn || mainKey}, Support: ${supportArchetype.nameEn || supportKey}, Support Group: ${supportGroup}). Mijn schaduw (180° individuatie) is ${shadowKey ? (ARCHETYPES[shadowKey]?.nameEn || shadowKey) : 'onbekend'}, mijn blindspot is ${blindspotKey ? (ARCHETYPES[blindspotKey]?.nameEn || blindspotKey) : 'onbekend'}. Harmony bonus: ${harmonyActive ? 'actief' : 'niet actief'}. OCEAN profiel: O=${extendedOcean?.ocean?.O || '?'}, C=${extendedOcean?.ocean?.C || '?'}, E=${extendedOcean?.ocean?.E || '?'}, A=${extendedOcean?.ocean?.A || '?'}, N=${extendedOcean?.ocean?.N || '?'}. Neuroticisme-trigger: ${extendedOcean?.neuroticismTrigger || 'onbekend'}. ${coreProfile ? `Werkplek superkracht: ${coreProfile.workplaceSuperpower} Conflictstijl: ${coreProfile.conflictStyle} Individuatiepad: ${coreProfile.individuationPath}` : ''} Help me mijn schaduw te integreren en mijn blindspot te herkennen in dagelijkse situaties.`,
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
      archetypeScores: { ...archetypeScores },
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
