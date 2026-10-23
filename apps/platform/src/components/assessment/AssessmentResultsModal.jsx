import React, { useMemo, useCallback, useRef, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
// html2canvas + jsPDF are lazy-loaded inside handleDownloadPdf (export click) so the
// ~250 KB gz export-vendor chunk stays out of the results-modal mount.
import SciFiRadarChart from './SciFiRadarChart';
import FitTitle from './FitTitle';
import SubgroupCounters from './SubgroupCounters';
import { getResultsSizes } from './assessmentSizes';
import {
  ARCHETYPES,
  SUBGROUP_POLARITIES,
  // Archetype-based scoring
  ALL_ARCHETYPE_KEYS,
  SHADOW_PAIRS,
  RED_LINE,
  ARCHETYPE_TO_GROUP,
  GROUP_TO_ARCHETYPES,
  EXTENDED_ARCHETYPES,
  EXTENDED_ARCHETYPES_NL,
  resolveExtendedKey,
  displayExtendedName,
  getExtendedArchetype,
  getExtendedArchetypeNl,
  isComplementaryPair,
  computeAdvancedScores,
  getArchetypeQuote,
  getExtensionGift,
  getExtensionCurse,
  archetypeField,
  ARCHETYPE_RADAR_LABELS,
} from '@gfl/assessment-core';
import { toResponseRecords } from '@gfl/assessment-core/data/scoring/twoLayer.js';
import { isNatureSlot } from '@gfl/assessment-core/assessmentData';
import { getArchetypeImage, resolvePortrait, DEFAULT_PORTRAIT_VARIANT } from '@gfl/assessment-core/data/archetypeImages';
import PaywallModal from './PaywallModal';
import PdfConsentStep from './PdfConsentStep';
import { PopupShell, PopupTitle, POP_MS, PURPLE } from './PopupShell';
import { SciFiButton } from '@gfl/ui';
import { registerLeaveHandler } from '../../reportDownloadGuard';
import { formatCents, formatPrice, levelPrice } from '../../config/pricing';
import { getPaymentConfig, markPaymentDelivered } from '../../services/paymentService';
import {
  bareHeading, isContractSubheading, isOceanMemberHeading, splitGluedHeading,
} from './v4Parser';
import {
  readReport, logReaderLedger, cleanTitle, shownTitle, isExtensionTitle,
  COMPARISON_TITLE, RADAR_READING_TITLE, STRAY_TITLE, RENDER_SIDE_TITLE, V3_ELEMENTS_TITLE,
} from './reportReader';
import MorphologyChart from './MorphologyChart';
import RefusalCards from './RefusalCards';
import { drawCoverPage } from './coverPage';
import { sectionTitle, relabelProse } from './v4Labels';

// ── Restructure part 2.3 ──────────────────────────────────────────────────────
// OCEAN is now an ORTHOGONAL instrument (v4 §3.4): no model-derived scalars. The
// label/colour maps stay (for rendering uploaded OCEAN); derivation is gone. The
// extended description + analysis templates moved to the corpus/AI (no static
// frontend copies), so those getters are retired here.
const OCEAN_LABELS = {
  O: { short: 'O', full: 'Openness', dutch: 'Openheid voor Ervaring' },
  C: { short: 'C', full: 'Conscientiousness', dutch: 'Consciëntieusheid' },
  E: { short: 'E', full: 'Extraversion', dutch: 'Extraversie' },
  A: { short: 'A', full: 'Agreeableness', dutch: 'Inschikkelijkheid' },
  N: { short: 'N', full: 'Neuroticism', dutch: 'Neuroticisme' },
};
const OCEAN_COLORS = { O: '#a78bfa', C: '#22d3ee', E: '#67e8f9', A: '#818cf8', N: '#c4b5fd' };
// UI level key → the report request's `level` (Starter / Gevorderd / Leerling).
const REPORT_LEVEL = { quick: 'beginner', standard: 'intermediate', deep: 'advanced' };
// Profile copies earlier builds left in localStorage; cleared whenever a result is computed.
const LEGACY_PROFILE_KEYS = ['gfl_assessment_session', 'gfl_assessment_history', 'gfl_analysis_sections', 'gfl_pending_assessment', 'gfl_assessment_id'];
import { analyzeAssessment, discardUnpaidReport, submitAssessmentReview, sendAccessEmail, sendReportEmail, logActivity } from '@gfl/api-client';
import { isIntegratedGPU } from '@gfl/utils';
import { useLanguage } from '@gfl/i18n';
import HoloOverlays from '../HoloOverlays';
const tnmWheelImg = '/images/Model imports/TNM wheel PNG.png';
const deltawerkenImg = '/images/Model imports/Deltawerken png.png';
const cellsImg = '/images/Model imports/Cells within Cells png.png';
// The two-triangle perspective diagram (Perspectief / As above, so below), white on transparent — Beginner page 10.
const perspectiefImg = '/images/Model imports/Perspectief model PNG.png';
const c12Img = '/images/Model imports/C12.png';

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
 *   onAiReady: () => void,
 *   t: (key: string) => string
 * }} props
 */
// Upper bound of the loading screen's time estimate (resultsModal.ui.timeEstimate). Measured
// 2026-09-18 on Master Prompt v6.2.7, Fable 5.1 effort high: two reports at 14.6 min; a report that
// uses the whole 75k output ceiling lands near 18 min. After this the overtime line shows.
const REPORT_ESTIMATE_MAX_MS = 18 * 60 * 1000;

// The title helpers (cleanTitle, shownTitle, isExtensionTitle and the title patterns the renderer
// filters on) live in reportReader.js, with the report reader, so both read a title the same way.

// De Essentie / De Vermenigvuldiging subheadings are written by the model (Master Prompt v6.2.9;
// Brief v2 Addendum A §1) and recognised by v4Parser's isContractSubheading. The v4.1 renderer
// used to GUESS them from keywords in the prose — which is why a report carried anywhere from zero
// to three, and could insert a "Gift & Vloek" that no longer belongs in these sections.

// ── Utility: map cleaned section title to accent color for JSX card (returns {color, rgb} or null) ──
const getSectionAccent = (title) => {
  const t = cleanTitle(title || '').toLowerCase();
  if (t.includes('identiteit') || t.includes('verklaring') || t.includes('waarom')) return { color: '#1d9904', rgb: '29, 153, 4' };
  if (t.includes('essentie') || t.includes('schaduw')) return { color: '#a855f7', rgb: '168, 85, 247' };
  if (t.includes('vermenigvuldiging')) return { color: '#f97316', rgb: '249, 115, 22' };
  if (t.includes('blindspot')) return { color: '#ef4444', rgb: '239, 68, 68' };
  if (/\bvorm\b/.test(t) || /hardware|onder\s+druk/.test(t) || /\bovergang\b/.test(t) || /morfologie/.test(t)) return { color: '#22d3ee', rgb: '34, 211, 238' };
  if (/\b(reflectie|motivatie|beweging)\b/.test(t)) return { color: '#a855f7', rgb: '168, 85, 247' };
  if (t.includes('resonantie')) return { color: '#1d9904', rgb: '29, 153, 4' };
  if (t.includes('visuele')) return { color: '#a855f7', rgb: '168, 85, 247' };
  if (t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi')) return { color: '#fbbf24', rgb: '251, 191, 36' };
  if (t.includes('groep dynamiek') || t.includes('neurobiologisch')) return { color: '#22d3ee', rgb: '34, 211, 238' };
  if (t.includes('cognitieve driehoek') || t.includes('aangeleerde lens')) return { color: '#fbbf24', rgb: '251, 191, 36' };
  if (t.includes('introductie') || t.includes('introduction')) return { color: '#d1d5db', rgb: '209, 213, 219' };
  if (t.includes('prompt') || t.includes('agent')) return { color: '#f97316', rgb: '249, 115, 22' };
  return null; // fallback to cycle
};

/** Band label for the server's polarisation (> 60 % / 30–60 % / < 30 %); null until it arrives. */
const polBandOf = (polarization, t) => {
  const key = { HIGH_POLARIZATION: 'suppressed', MODERATE: 'healthy', HIGH_INDIVIDUATION: 'integrating' }[polarization?.polarizationLevel];
  return key ? t(`resultsModal.bands.${key}`) : null;
};

/**
 * PortraitVariantToggle — Masculine/Feminine switch directly under the results-card portrait.
 * Styled to the `components.tab` spec in gfl-design-tokens.json: amber tab gradients at
 * 135deg, 0.15rem radius, Lexend Mega uppercase tracked chrome, solid-accent flip on
 * hover (text -> #000, 20px glow) and the amber focus treatment for keyboard users.
 */
const TOGGLE_AMBER = '255, 174, 0';
const PortraitVariantToggle = ({ value, onChange, labels }) => {
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const options = [['male', labels.male], ['female', labels.female]];
  return (
    <div role="radiogroup" aria-label={labels.label} style={{ display: 'flex', gap: '0.35rem' }}>
      {options.map(([v, text]) => {
        const active = value === v;
        const hover = hovered === v && !active;
        const focus = focused === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            onMouseEnter={() => setHovered(v)}
            onMouseLeave={() => setHovered(null)}
            onFocus={(e) => { if (e.target.matches(':focus-visible')) setFocused(v); }}
            onBlur={() => setFocused(null)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '0.15rem',
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              fontSize: 'max(10px, 0.5vw)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: active ? 'default' : 'pointer',
              transition: 'all 0.3s',
              outline: 'none',
              color: hover ? '#000000' : '#ffae00',
              background: hover
                ? `linear-gradient(135deg, rgba(${TOGGLE_AMBER}, 0.8), rgba(${TOGGLE_AMBER}, 0.9))`
                : active
                  ? `linear-gradient(135deg, rgba(${TOGGLE_AMBER}, 0.2), rgba(${TOGGLE_AMBER}, 0.3))`
                  : focus
                    ? `rgba(${TOGGLE_AMBER}, 0.04)`
                    : `linear-gradient(135deg, rgba(${TOGGLE_AMBER}, 0.03), rgba(${TOGGLE_AMBER}, 0.06))`,
              border: `1px solid rgba(${TOGGLE_AMBER}, ${focus ? 0.5 : active ? 0.7 : 0.2})`,
              boxShadow: hover
                ? `0 0 20px rgba(${TOGGLE_AMBER}, 0.6)`
                : focus ? `0 0 15px rgba(${TOGGLE_AMBER}, 0.15)` : 'none',
            }}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
};

const AssessmentResultsModal = ({
  resultsLoadingProgress,
  resultsModalProgress,
  layerAnswers,
  liveSubjects = [],
  // The two-layer Leerling test's locked plan (App.jsx); null = the old test. With it, `layerAnswers` holds
  // the two-layer records, the server scores the response records and the report reads only that scoring.
  twoLayerPlan = null,
  uploadedFiles,
  onClose,
  onDownload,
  onAiReady,
  // The UI level key ('quick' | 'standard' | 'deep'): picks the report's Master Prompt on the server.
  assessmentLevel = 'deep',
  // The parent still passes `t`; this component now takes its translator from
  // useLanguage() (below) so the whole file — UI *and* PDF — can translate.
  // The prop is accepted and ignored to keep the existing call-site contract.
  // eslint-disable-next-line no-unused-vars
  t: tProp,
  // ── Dev PDF live-preview (see src/dev/PdfPreviewHarness.jsx) ──
  previewMode = false,   // when true: build the PDF and hand back a blob URL instead of downloading
  onPreviewReady,        // (blobUrl) => void
  // ── Dev report preview (see src/dev/ReportPreviewHarness.jsx) ──
  portraitOverride,      // { url, fullUrl } shown as the portrait (card + PDF cover) whatever the archetype
}) => {
  // Declared before the result memo below: that memo reads `language` to pick the
  // Dutch or English archetype copy, so the hook must run first.
  const { language, t, tArray, tFunc } = useLanguage(); // 'nl' | 'en' — selects the corpus sent to the model + all copy

  // The two-layer test's response records (Rotation Sequence v0.1.1 §2) — what the server scores.
  const twoLayerResponses = useMemo(
    () => (twoLayerPlan ? toResponseRecords(twoLayerPlan, layerAnswers) : null),
    [twoLayerPlan, layerAnswers],
  );

  // The two-layer test is scored once, by the server; its result (Main, Support, totals, mandjes) arrives
  // before the report is written (the analyze stream's `profile` event) and with it. Until then: no result.
  // (The dev PDF preview starts with the replay's profile: in the app it arrives before the report text too.)
  const [serverProfile, setServerProfile] = useState(() => (previewMode && typeof window !== 'undefined' && window.__GFL_PDF_REPLAY?.profile) || null);
  // Every level takes the two-layer test (owner, 15 Oct), and every level has a report since 23 Oct 2026: Leerling,
  // Beginner (its own prompt and PDF layout) and Gevorderd (its own prompt, Leerling's PDF layout). A level without a
  // report would end on the notice below, its answers never leaving the browser.
  const reportAvailable = !twoLayerPlan || ['deep', 'quick', 'standard'].includes(assessmentLevel);
  // Dev PDF preview of a two-layer report: the replay carries the server's scoring, so the result is built from it
  // exactly as the app builds it (never from the replay's — empty — local answers).
  const replayProfile = previewMode && typeof window !== 'undefined' && window.__GFL_PDF_REPLAY?.profile ? true : false;
  const fromServerProfile = Boolean(twoLayerResponses) || replayProfile;

  // Compute archetype result from layer answers
  const result = useMemo(() => {
    if (fromServerProfile) return serverProfile ? computeResultFromProfile(serverProfile, language) : null;
    const keys = layerAnswers ? Object.keys(layerAnswers) : [];
    const totalAnswers = keys.reduce((sum, k) => sum + Object.keys(layerAnswers[k] || {}).length, 0);
    console.log('[GFL] computeResultFromAnswers — layers:', keys.length, 'totalAnswers:', totalAnswers, 'sample:', JSON.stringify(layerAnswers).slice(0, 300));
    return computeResultFromAnswers(layerAnswers, liveSubjects, language);
  }, [layerAnswers, liveSubjects, language, fromServerProfile, serverProfile]);
  
  // Ref for the scroll container
  const scrollRef = useRef(null);
  
  // Ref for the PDF content area (the inner content div)
  const contentRef = useRef(null);
  
  // PDF download state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPdfConsent, setShowPdfConsent] = useState(false);
  const [pdfConsentChecked, setPdfConsentChecked] = useState(false);
  const [pdfConsentClosing, setPdfConsentClosing] = useState(false);
  const closePdfConsent = useCallback(() => {
    setPdfConsentClosing(true);
    setTimeout(() => { setShowPdfConsent(false); setPdfConsentChecked(false); setPdfConsentClosing(false); }, POP_MS);
  }, []);
  // The consent card covers the report card (nothing outside it to click): focus it, Escape closes.
  const pdfConsentRef = useRef(null);
  useEffect(() => {
    if (!showPdfConsent || pdfConsentClosing) return undefined;
    requestAnimationFrame(() => pdfConsentRef.current?.focus());
    const onKey = (e) => { if (e.key === 'Escape') closePdfConsent(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPdfConsent, pdfConsentClosing, closePdfConsent]);
  // Which variant the generating spinner refers to: 'short' (free) or 'full' (paid).
  const [pdfKind, setPdfKind] = useState('full');
  // Paywall: the full report is paid, the short report free. `paidPaymentId` is the
  // server-confirmed payment for this report; once set, the button skips the pay step.
  const [showPaywall, setShowPaywall] = useState(false);
  const [paidPaymentId, setPaidPaymentId] = useState('');
  // Mirrors paidPaymentId synchronously, so the auto-download fired from onPaid passes the
  // paywall check before the state update has rendered.
  const paidRef = useRef(false);
  // The Stripe payment ref (pay_…) behind the unlock, read synchronously by the PDF build's download log.
  const paymentRefRef = useRef('');
  // Server payment config (price per the flip schedule) for the Essentie button label.
  const [payConfig, setPayConfig] = useState(null);
  useEffect(() => { let live = true; getPaymentConfig(REPORT_LEVEL[assessmentLevel] || 'advanced').then((c) => { if (live) setPayConfig(c); }); return () => { live = false; }; }, [assessmentLevel]);
  // The paid PDF is the user's only copy; until it is saved a "download now" banner stays up.
  const [fullDownloaded, setFullDownloaded] = useState(false);
  const paidNotSaved = !!paidPaymentId && !fullDownloaded;
  // Final warning before leaving the report — unpaid: the result and the option to unlock it are
  // lost; paid: confirm the PDF is saved. In-app exits (reportDownloadGuard) get the Doorgaan /
  // Teruggaan dialog below; closing / reloading the tab gets the browser's own generic prompt
  // (browsers do not allow custom text there).
  const [leaveProceed, setLeaveProceed] = useState(null);
  const [leaveSavedChecked, setLeaveSavedChecked] = useState(false);
  const [leaveClosing, setLeaveClosing] = useState(false);
  useEffect(() => registerLeaveHandler((proceed) => { setLeaveSavedChecked(false); setLeaveClosing(false); setLeaveProceed(() => proceed); }), []);
  // Pop-ups contract before they unmount (PopupShell `closing`).
  const closeLeave = useCallback(() => {
    setLeaveClosing(true);
    setTimeout(() => { setLeaveProceed(null); setLeaveClosing(false); }, POP_MS);
  }, []);
  useEffect(() => {
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // ── AI Analysis state ──
  // The extension name in the report language: the Dutch canon under the NL toggle,
  // the English roster under EN. Every visible surface, the PDF cover and the name
  // handed to the model use this, so the name never disagrees with the corpus.
  const extName = useMemo(() => (
    language === 'en'
      ? (result?.extendedName || result?.extendedNameNl || '')
      : (result?.extendedNameNl || result?.extendedName || '')
  ), [language, result]);
  // Portrait variant picked on the results card (Masculine/Feminine toggle, always shown). The card
  // and BOTH PDF portrait placements resolve the EXACT chosen variant, so the download always matches
  // what was shown and a portrait never sits under the other label (missing art → no portrait).
  const [portraitVariant, setPortraitVariant] = useState(DEFAULT_PORTRAIT_VARIANT);
  const portraitMain = result?.mainArchetype;
  const portraitSupport = result?.secondaryArchetype || result?._secondaryKey;
  // Four extensions carry a gendered NAME (Sorcerer/Sorceress, Wingman/Wingwoman, Seducer/Seductress,
  // Patriarch/Matriarch), and their art was delivered as a named pair — so the same toggle picks the
  // name, on the card and in the PDF (owner, 2026-09-27). For the other 128 this is extName unchanged.
  // Display only: `extName` stays the canonical roster name for the model (it has to agree with the
  // corpus) and for anything persisted.
  const extNameShown = useMemo(() => {
    const key = resolveExtendedKey(portraitMain, portraitSupport);
    return (key && displayExtendedName(key, language, portraitVariant)) || extName;
  }, [portraitMain, portraitSupport, language, portraitVariant, extName]);
  const portrait = useMemo(
    () => (portraitOverride
      ? { ...portraitOverride, variant: portraitVariant, available: { male: false, female: false } }
      : resolvePortrait(portraitMain, portraitSupport, portraitVariant, { fallback: false })),
    [portraitMain, portraitSupport, portraitVariant, portraitOverride]
  );
  // Starting choice for a new result: the default, unless only the other variant's art exists yet.
  // Nothing is inferred about the user; the toggle swaps freely.
  useEffect(() => {
    // Dev PDF preview only: ?variant=male|female rides in with the replay (PdfPreviewHarness).
    const asked = typeof window !== 'undefined' ? window.__GFL_PDF_REPLAY?.portraitVariant : null;
    if (asked === 'male' || asked === 'female') { setPortraitVariant(asked); return; }
    const { available } = resolvePortrait(portraitMain, portraitSupport);
    const other = DEFAULT_PORTRAIT_VARIANT === 'male' ? 'female' : 'male';
    setPortraitVariant(!available[DEFAULT_PORTRAIT_VARIANT] && available[other] ? other : DEFAULT_PORTRAIT_VARIANT);
  }, [portraitMain, portraitSupport]);
  const [aiSections, setAiSections] = useState(null);
  const [aiProfileData, setAiProfileData] = useState(null);
  // The runtime engine's role-tagged payload. The morphology chart follows Spec A1 — two curves,
  // both the Main's, register layer (main.register); without it there is no chart.
  const [enginePayload, setEnginePayload] = useState(null);
  // The polarisation (index, %, band), computed once on the server by the one polar_norm and
  // returned with the report — shown here, never derived here.
  const [polarization, setPolarization] = useState(null);
  // v2 sessions: the data block for the last page, built by our backend (engine/dataBlock.js) — printed as is.
  const [dataBlock, setDataBlock] = useState(null);
  // v2: the cognitive-triangle figure's facts (Main triangle + band, other carrying triangles) — server-built.
  const [triangleFigure, setTriangleFigure] = useState(null);
  const morphChart = enginePayload?.main?.register
    ? { baseline: enginePayload.main.register.register_baseline_pct, transform: enginePayload.main.register.register_transform_pct }
    : null;
  // The crystal code (the account key) is NOT known here until the full report is unlocked:
  // the analysis only carries a SEALED copy the browser cannot read. The pay component sends
  // the seal back and receives the real code on payment / activation. Refs, so the PDF
  // generator reads them synchronously without a re-render race.
  const sealedOrbCodeRef = useRef('');
  const orbCodeRef = useRef('');
  // The code's key (apps/backend/services/orbKey.js), handed over with the code on unlock and printed
  // beside it. Once a code has been redeemed, its render data is public — only the key proves the PDF.
  const orbKeyRef = useRef('');
  // The profile card's copy, signed by the server for this report's code ({ giftMicro, geomSummary, sig }):
  // the unlocked PDF prints it in its data block, and the claim reads it back from the upload.
  const kaartRef = useRef(null);
  const [uploadedOceanScores, setUploadedOceanScores] = useState(null);
  const [aiReady, setAiReady] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);
  const [aiRetryCount, setAiRetryCount] = useState(0);
  // Past the upper bound of the time estimate the loading screen says so, instead of leaving an
  // expired promise on screen. Restarts with every attempt (retry bumps aiRetryCount).
  const [aiOverdue, setAiOverdue] = useState(false);
  useEffect(() => {
    setAiOverdue(false);
    if (aiReady || aiFailed) return undefined;
    const id = setTimeout(() => setAiOverdue(true), REPORT_ESTIMATE_MAX_MS);
    return () => clearTimeout(id);
  }, [aiReady, aiFailed, aiRetryCount]);

  // Warm the PDF's print copy (~2.4 MB) while the report is being written (owner, 2026-09-27). It is
  // fetched nowhere until the cover draws it, so without this the first thing "Download PDF" does is
  // stall on it. Here the reader is already waiting minutes and the network is idle.
  //
  // rel=prefetch, not a hidden <img>: it warms the HTTP cache without decoding a 1854x2764 bitmap into
  // memory, and the browser gives it the lowest priority, so it cannot compete with the card's own
  // portrait. If the reader never downloads a PDF the fetch is wasted, which is why it is tied to the
  // generation wait — only someone getting a report reaches it.
  useEffect(() => {
    if (aiReady || aiFailed || !portrait.printUrl) return undefined;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = portrait.printUrl;
    document.head.appendChild(link);
    return () => link.remove();
  }, [aiReady, aiFailed, portrait.printUrl]);
  const [, setAiStage] = useState(0); // 0=waiting, 1=data sent, 2=AI done, 3=integrated
  const aiCalledRef = useRef(false);
  const onAiReadyRef = useRef(onAiReady);
  onAiReadyRef.current = onAiReady;
  const onPreviewReadyRef = useRef(onPreviewReady);
  onPreviewReadyRef.current = onPreviewReady;


  // ── Single-instance profile ──
  // The full profile (answers, scores, analysis) lives ONLY in this tab's memory — never on the
  // server, never in storage, logged in or not. It is either unlocked (paid / activation code)
  // and carried out in the PDF, or discarded in full. Leaving the report page without an unlock
  // also discards the server-side card draft keyed by the (sealed) crystal code, so nothing of
  // an unpaid report survives. Unmount = leaving; pagehide covers closing / reloading the tab.
  useEffect(() => {
    const discard = () => {
      const sealed = sealedOrbCodeRef.current;
      if (!sealed || orbCodeRef.current) return; // nothing sealed, or unlocked → keep
      sealedOrbCodeRef.current = '';
      discardUnpaidReport(sealed);
    };
    const onPageHide = (e) => { if (!e.persisted) discard(); }; // bfcache keeps the tab alive
    window.addEventListener('pagehide', onPageHide);
    return () => { window.removeEventListener('pagehide', onPageHide); discard(); };
  }, []);

  // ── Email gate state (unlocks PDF download) ──
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({ email: '' });
  const [reviewError, setReviewError] = useState('');
  // Gate email, readable inside handleDownloadPdf without recreating that (huge)
  // callback on every keystroke — set once when the gate is passed.
  const gateEmailRef = useRef('');

  // ── Email submission handler ──
  const handleReviewSubmit = useCallback(async (e) => {
    e?.preventDefault();
    const { email } = reviewFormData;

    if (!email.trim()) {
      setReviewError(t('resultsModal.ui.emailRequired'));
      return;
    }
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setReviewError(t('resultsModal.ui.emailInvalid'));
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');

    try {
      await submitAssessmentReview({
        assessmentId: 'anonymous', // no assessment is ever stored server-side
        email: email.trim(),
        archetypeKey: result?.mainArchetype || '',
        extendedArchetypeName: result?.extendedNameNl || result?.extendedName || '',
        timestamp: new Date().toISOString(),
      });
      gateEmailRef.current = email.trim();
      setReviewSubmitted(true);
      console.log('[GFL] Email submitted — PDF unlocked');
    } catch (err) {
      console.error('[GFL] Email submission failed:', err);
      setReviewError(err.message || t('resultsModal.ui.submitFailed'));
    } finally {
      setIsSubmittingReview(false);
    }
  }, [reviewFormData, result, t]);

  // ── Responsive breakpoints (matches DesktopLayout pattern) ──
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);

  // ── Fire AI analysis during loading phase (with SSE progress) ──
  useEffect(() => {
    // The two-layer test starts without a result: the server's scoring is what this call brings back.
    if ((!result && !fromServerProfile) || aiReady || aiCalledRef.current) return;
    if (!reportAvailable) return; // a level without a report: nothing is sent (owner, 15 Oct)
    aiCalledRef.current = true;

    const runAnalysis = async () => {
      // Convert any uploaded OCEAN profile files to the format the AI API expects
      const uploadedFileContents = [];
      for (const file of uploadedFiles || []) {
        // The user's own file name ("Jan_Jansen_BigFive.pdf") never leaves the browser; the server
        // also scrubs names from the content before anything reads it.
        const ext = (file.name.match(/.([a-z0-9]{1,5})$/i) || [])[1];
        const name = `upload-${uploadedFileContents.length + 1}${ext ? `.${ext.toLowerCase()}` : ''}`;
        try {
          const kind = (ext || '').toLowerCase();
          if (kind === 'pdf') {
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result.split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            uploadedFileContents.push({ name, pdfBase64: base64 });
          } else if (kind === 'docx') {
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result.split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            uploadedFileContents.push({ name, docxBase64: base64 });
          } else if (kind === 'txt') {
            const text = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = reject;
              reader.readAsText(file);
            });
            uploadedFileContents.push({ name, text });
          } else if (file.type.startsWith('image/')) {
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result.split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            uploadedFileContents.push({ name, imageBase64: base64, mimeType: file.type });
          }
        } catch { /* skip unreadable files */ }
      }

      // Warm the archetype image now — we know it before the ~5s AI call, so kicking off
      // the fetch here means it's decoded and cached by the time the result card renders
      // (otherwise the card appears first and the image pops in ~2s later).
      // (Two-layer test: no result yet — the loading screen preloads the portrait once the profile arrives.)
      if (result) for (const v of ['female', 'male']) {
        const u = resolvePortrait(result.mainArchetype, result.secondaryArchetype || result._secondaryKey, v).url;
        if (u) { const warmImg = new Image(); warmImg.src = u; warmImg.decode?.().catch(() => {}); }
      }

      try {
        // Dev PDF preview: replay the last real generation instead of calling the API.
        const __replay = (typeof window !== 'undefined' && window.__GFL_PDF_REPLAY) || null;
        let aiResult;
        if (__replay) {
          aiResult = { analysis: __replay.analysis, enginePayload: __replay.enginePayload, polarization: __replay.polarization, dataBlock: __replay.dataBlock, uploadedOceanScores: __replay.uploadedOceanScores, sealedOrbCode: __replay.sealedOrbCode, kaart: __replay.kaart, profile: __replay.profile, triangle: __replay.triangle, promptVersion: __replay.promptVersion };
        } else {
        aiResult = await analyzeAssessment(twoLayerResponses ? {
          // The two-layer test: only the response records go up; the server scores them and the report
          // reads that scoring alone (payload v7 P2: the model never sees the answers).
          scoring_version: 'v2_two_layer',
          responses: twoLayerResponses,
          rotation_sequence_id: twoLayerPlan.rotation_sequence_id,
          language,
          // The level picks the Master Prompt and the price (apps/backend/services/promptRouting.js, the seal).
          level: REPORT_LEVEL[assessmentLevel] || 'advanced',
          uploadedFileContents: uploadedFileContents.length > 0 ? uploadedFileContents : undefined,
        } : {
          archetypeKey: result.mainArchetype,
          supportArchetype: result.secondaryArchetype || result._secondaryKey,
          supportGroup: result.supportGroup,
          mainGroup: result.group,
          extendedArchetypeName: extName || result.extendedName || result.name,
          shadowArchetype: result.shadowPartner,
          blindspotArchetype: result.blindspotPartner,
          isIndividuated: result.shadowBonusActive,
          // Derived indices + nature/culture totals (Master Prompt L4): the model reads the
          // nature/culture balance from these, banded per R-c. The Main–Shadow polarisation is
          // computed on the server (engine/polarNorm.js), never sent from here.
          authenticityIndex: result.authenticityIndex,
          authenticityLevel: result.authenticityLevel,
          totalNaturePoints: result.totalNaturePoints,
          totalCulturePoints: result.totalCulturePoints,
          // Per-archetype 5-mandje + totals — the geometry the backend feeds the
          // C-runtime precompute and the model payload (was previously omitted).
          archetypeDetails: result.archetypeDetails,
          responses: result._answerLog,
          subgroups: result.subgroups,
          // UI language → backend picks the matching corpus (nl → Dutch, else English).
          language,
          // The level picks the Master Prompt (apps/backend/services/promptRouting.js).
          level: REPORT_LEVEL[assessmentLevel] || 'advanced',
          // The token budget (30000) is fixed server-side; the endpoint ignores model settings sent here.
          uploadedFileContents: uploadedFileContents.length > 0 ? uploadedFileContents : undefined,
        }, (stage, message) => {
          setAiStage(stage);
          console.log(`[GFL] AI stage ${stage}: ${message}`);
        }, (profile) => setServerProfile(profile));
        }
        // Stage 3: frontend integration
        setAiStage(3);
        // Two-layer test: the server's one scoring result, again with the report (the early event carried it too).
        if (aiResult.profile) setServerProfile(aiResult.profile);
        if (aiResult.uploadedOceanScores) setUploadedOceanScores(aiResult.uploadedOceanScores);
        setEnginePayload(aiResult.enginePayload || null);
        setPolarization(aiResult.polarization || null);
        setDataBlock(Array.isArray(aiResult.dataBlock) ? aiResult.dataBlock : null);
        // v2 (Master Prompt v7.2 page 5.7b): the triangle figure's facts, from the server — never derived here.
        setTriangleFigure(aiResult.triangle || null);
        sealedOrbCodeRef.current = aiResult.sealedOrbCode || ''; // opaque until unlock
        kaartRef.current = aiResult.kaart || null;
        orbCodeRef.current = '';
        // The report reader: sections for the card and the PDF, plus a ledger that accounts for every
        // line of the model's text (placed, or discarded by a named rule) — logged, so nothing is
        // lost or moved without a trace. It strips the Kaart microcopy itself, onto that ledger.
        const { sections, ledger: readerLedger } = readReport(aiResult.analysis || '', { promptVersion: aiResult.promptVersion, level: REPORT_LEVEL[assessmentLevel] || 'advanced' });
        logReaderLedger(readerLedger);
        // A v2 report (it carries the server's data block) is checked for completeness: the closing
        // line [EINDE RAPPORT] and all its sections — 19, 21 from v7.2 (payload instruction v7 §7). An incomplete report
        // still renders what came, as before; the gap is logged.
        if (Array.isArray(aiResult.dataBlock)) {
          const c = readerLedger.completeness;
          if (!c.closingLine || c.missing.length) console.warn('[GFL] v7 report incomplete:', { closingLine: c.closingLine, missing: c.missing });
        }
        // ── DIAGNOSTIC: shows whether a section was "never sent" (not in this list) vs "not
        //    rendered" (in the list but missing from the PDF). Also flags truncation: if the
        //    tail (machine block / last sections) is missing, the analysis was cut short. ──
        try {
          const raw = aiResult.analysis || '';
          console.log('%c[GFL] AI OUTPUT DIAGNOSTIC', 'font-weight:bold;color:#22d3ee');
          console.log('[GFL] analysis length:', raw.length, 'chars; completionTokens:', aiResult.completionTokens ?? '(n/a)');
          console.log('[GFL] section titles emitted by the model:', (sections || []).map(shownTitle));
          console.log('[GFL] machine block present (— PROFIEL DATA —):', /PROFIEL\s*DATA\s*VOOR\s*AI|PROFILE\s*DATA\s*FOR\s*AI/i.test(raw), '| last 300 chars:', JSON.stringify(raw.slice(-300)));
          const reg = aiResult.enginePayload?.main?.register;
          console.log('[GFL] Spec A1 register (engine):', reg
            ? `baseline=${JSON.stringify(reg.register_baseline_pct)} transform=${JSON.stringify(reg.register_transform_pct)} stamps=${JSON.stringify(aiResult.enginePayload.stamps)}`
            : '(none)');
        } catch (_) {}
        const profileElements = sections.filter(s => s.isProfileElement);
        if (profileElements.length > 0) {
          const pd = {};
          profileElements.forEach(s => { pd[s.profileKey] = s.content; });
          setAiProfileData(pd);
        }
        const mainSections = sections.filter(s => !s.isProfileElement);
        setAiSections(mainSections);
        setAiReady(true);
        // Dev: capture this real generation so the PDF live-preview can replay it.
        try {
          if (import.meta.env.DEV && !__replay) {
            localStorage.setItem('gfl_pdf_replay', JSON.stringify({
              layerAnswers, liveSubjects,
              analysis: aiResult.analysis, enginePayload: aiResult.enginePayload,
              polarization: aiResult.polarization, dataBlock: aiResult.dataBlock,
              uploadedOceanScores: aiResult.uploadedOceanScores, sealedOrbCode: aiResult.sealedOrbCode, kaart: aiResult.kaart,
              profile: aiResult.profile, triangle: aiResult.triangle, promptVersion: aiResult.promptVersion,
              savedAt: Date.now(),
            }));
          }
        } catch (_) { /* quota / serialization — ignore */ }
        if (onAiReadyRef.current) onAiReadyRef.current();
      } catch (err) {
        console.warn('[GFL] AI analysis failed, using template:', err.message);
        setAiFailed(true);
        // Deliberately do NOT reset aiCalledRef here. `result` recomputes a fresh
        // reference whenever its parent-prop deps (layerAnswers/liveSubjects) change,
        // which re-runs this effect; resetting the guard on failure made it AUTO-FIRE
        // a brand-new full-corpus AI call each time — a runaway retry loop that billed
        // the (succeeding) call several times over. Re-firing now happens ONLY via the
        // explicit retry button, which resets the ref + bumps aiRetryCount.
      }
    };

    runAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, aiReady, aiRetryCount]);

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
      // "Radar-lezing": never render anywhere — the radar chart covers it.
      if (RADAR_READING_TITLE.test(t)) return false;
      // Stray AI-emitted sections that aren't part of the page-map.
      if (STRAY_TITLE.test(t)) return false;
      // Machine block + OCEAN render-side titles (gereedschap / profiel intro) — drop.
      if (RENDER_SIDE_TITLE.test(t)) return false;
      // v3 "5 geometrische elementen" leftover — not a v4.1 section.
      if (V3_ELEMENTS_TITLE.test(t)) return false;
      if (COMPARISON_TITLE.test(t)) return false;
      if (/^(spanningsvelden|vergelijkingsrapport|vergelijkings\s*rapport|conclusie|tension\s*fields|comparison\s*report|conclusion)$/i.test(t)) return false;
      return true;
    }),
  [displaySections]);

  // Split visible AI sections into ordered groups matching the v4.1 page order
  const aiGroup1a = useMemo(() => visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('identiteit') || t.includes('verklaring') || t.includes('waarom') ||
           t.includes('essentie') || t.includes('vermenigvuldiging');
  }), [visibleSections]);

  // ── Card groups: mirror the PDF page order (Identiteit → … → Ontologische Evolutie).
  //    OCEAN traits and the dual-core widget are intentionally NOT shown on the card. ──
  const cardIdentity = useMemo(() => visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('identiteit') || t.includes('verklaring') || t.includes('waarom');
  }), [visibleSections]);
  const cardEssence = useMemo(() => visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('essentie') || t.includes('vermenigvuldiging');
  }), [visibleSections]);
  const cardShadow = useMemo(() => visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('schaduw') || t.includes('blindspot');
  }).sort((a, b) => (cleanTitle(a.title || '').toLowerCase().includes('schaduw') ? 0 : 1) -
                    (cleanTitle(b.title || '').toLowerCase().includes('schaduw') ? 0 : 1)), [visibleSections]);
  const cardMorph = useMemo(() => visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    // The 3 morphology reads only — no "morfologie" fallback (that only matched the page-label echo).
    return /\bvorm\b/.test(t) || /hardware|onder\s+druk/.test(t) || /\bovergang\b/.test(t);
  }), [visibleSections]);
  const cardStille = useMemo(() => visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return /\b(reflectie|motivatie|beweging)\b/.test(t);
  }).sort((a, b) => {
    const order = ['reflectie', 'motivatie', 'beweging'];
    const ix = (s) => order.findIndex(k => cleanTitle(s.title || '').toLowerCase().includes(k));
    return ix(a) - ix(b);
  }), [visibleSections]);
  // Resonantie is flagged isResonantie (excluded from visibleSections) → pull from displaySections.
  const cardResonance = useMemo(() => (displaySections || []).filter(s =>
    /professionele\s+resonantie|creatieve\s+resonantie/i.test(s.title || '')
  ).sort((a, b) => (/professionele/i.test(a.title) ? 0 : 1) - (/professionele/i.test(b.title) ? 0 : 1)),
  [displaySections]);
  const cardYellow = useMemo(() => visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi');
  }), [visibleSections]);

  // Teaser key-findings: Main/Support/Shadow/Blindspot + Authenticity % + Polarization band.
  // Computed the same way as the PDF's PROFIEL DATA block (subgroups + archetype totals).
  const cardKeyFindings = useMemo(() => {
    if (!result) return null;
    let nat = 0, cul = 0;
    (result.subgroups || []).forEach((sg) => {
      nat += (sg.leftNature || 0) + (sg.rightNature || 0);
      cul += (sg.leftCulture || 0) + (sg.rightCulture || 0);
    });
    const authPct = nat + cul > 0 ? Math.round((nat / (nat + cul)) * 100) : null;
    const polGap = polarization?.polarizationPct ?? null;
    const polBand = polBandOf(polarization, t);
    return {
      main: result.mainName, support: result.secondaryName,
      shadow: result.shadowName, blindspot: result.blindspotName,
      authPct, polGap, polBand,
    };
  }, [result, polarization, t]);

  const aiGroup1b = useMemo(() => visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('schaduw') || t.includes('blindspot');
  }), [visibleSections]);

  const aiGroup2 = useMemo(() => visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi');
  }), [visibleSections]);

  const aiGroepDyn = useMemo(() => visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('groep dynamiek') || t.includes('neurobiologisch');
  }), [visibleSections]);

  const aiCogDriehoek = useMemo(() => visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('cognitieve driehoek') || t.includes('aangeleerde lens');
  }), [visibleSections]);

  const aiPromptSection = useMemo(() => visibleSections.filter(s =>
    s.isAgentPrompt || /ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt|reflectie.*prompt|ai.*reflectie/i.test(s.title)
  ), [visibleSections]);

  // Also catch any section 11 that slipped past the regex — exclude it from "other" rendering
  const isPromptLike = (s) =>
    s.isAgentPrompt ||
    /ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt|reflectie.*prompt|ai.*reflectie/i.test(s.title);

  const aiIntroSection = useMemo(() => visibleSections.filter(s =>
    /introductie|introduction/i.test(s.title || '')
  ), [visibleSections]);

  // Remaining AI sections not in any named group
  const aiGroupedIds = useMemo(() => {
    const all = new Set();
    [aiGroup1a, aiGroup1b, aiGroup2, aiGroepDyn, aiCogDriehoek, aiPromptSection, aiIntroSection].forEach(g => g.forEach(s => all.add(s)));
    return all;
  }, [aiGroup1a, aiGroup1b, aiGroup2, aiGroepDyn, aiCogDriehoek, aiPromptSection, aiIntroSection]);

  const aiOtherSections = useMemo(() =>
    visibleSections.filter(s => !aiGroupedIds.has(s) && !isPromptLike(s)),
  [visibleSections, aiGroupedIds]);

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

  // Breakpoint-based sizing from assessmentSizes.js config
  const rs = getResultsSizes(windowWidth);
  const isLowGpu = isIntegratedGPU();
  
  // ── Ref for the radar chart element (captured as image for PDF) ──
  const radarRef = useRef(null);
  // ── Ref for the subgroup dynamics element ──
  const subgroupRef = useRef(null);
  // ── Ref for the Plastische Morfologie D-curve chart (rasterised into the PDF) ──
  const morphologyRef = useRef(null);
  // ── Dedicated off-screen radar for clean PDF capture (the on-card radar's container height
  //    varies by breakpoint and can clip the wheel; this one is a fixed, full-size source). ──
  const pdfRadarRef = useRef(null);

  // Helper: render a single AI section card (used by all section groups in the UI)
  const renderAiSectionCard = useCallback((section, idx) => {
    const accents = [
      { color: '#1d9904', rgb: '29, 153, 4' },
      { color: '#a855f7', rgb: '168, 85, 247' },
      { color: '#f97316', rgb: '249, 115, 22' },
      { color: '#3b82f6', rgb: '59, 130, 246' },
      { color: '#ec4899', rgb: '236, 72, 153' },
      { color: '#14b8a6', rgb: '20, 184, 166' },
    ];
    const accent = getSectionAccent(section.title) || accents[idx % accents.length];
    const isEven = idx % 2 === 0;
    return (
      <div key={`ai-${cleanTitle(section.title)}-${idx}`} style={{
        width: '100%',
        position: 'relative',
        ...(isEven ? {} : {
          background: 'transparent',
          border: `1px solid rgba(${accent.rgb}, 0.2)`,
          padding: rs.sectionPad,
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
          {cleanTitle(shownTitle(section))}
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
  }, [rs.sectionPad, renderMarkdownContent]);

  // ── Cognitieve Driehoek lookup — structural data only (content is now AI-generated Section 8) ──
  const COG_MODE = {
    idealisme:  t('resultsModal.cog.modes.idealisme'),
    exploratie: t('resultsModal.cog.modes.exploratie'),
    impact:     t('resultsModal.cog.modes.impact'),
    engagement: t('resultsModal.cog.modes.engagement'),
  };
  const COG_NET_A = t('resultsModal.cog.networks.cenOpennessDmn');
  const COG_NET_B = t('resultsModal.cog.networks.limbicSalienceAgency');
  const COG_TRIANGLES = {
    RULER:     { id: 1, mode: COG_MODE.idealisme,  members: ['Ruler', 'Innocent', 'Sage'],      networks: COG_NET_A },
    INNOCENT:  { id: 1, mode: COG_MODE.idealisme,  members: ['Ruler', 'Innocent', 'Sage'],      networks: COG_NET_A },
    SAGE:      { id: 1, mode: COG_MODE.idealisme,  members: ['Ruler', 'Innocent', 'Sage'],      networks: COG_NET_A },
    JUDGE:     { id: 2, mode: COG_MODE.exploratie, members: ['Judge', 'Explorer', 'Artist'],    networks: COG_NET_A },
    EXPLORER:  { id: 2, mode: COG_MODE.exploratie, members: ['Judge', 'Explorer', 'Artist'],    networks: COG_NET_A },
    ARTIST:    { id: 2, mode: COG_MODE.exploratie, members: ['Judge', 'Explorer', 'Artist'],    networks: COG_NET_A },
    LOVER:     { id: 3, mode: COG_MODE.impact,     members: ['Lover', 'Outlaw', 'Magician'],    networks: COG_NET_B },
    OUTLAW:    { id: 3, mode: COG_MODE.impact,     members: ['Lover', 'Outlaw', 'Magician'],    networks: COG_NET_B },
    MAGICIAN:  { id: 3, mode: COG_MODE.impact,     members: ['Lover', 'Outlaw', 'Magician'],    networks: COG_NET_B },
    CAREGIVER: { id: 4, mode: COG_MODE.engagement, members: ['Caregiver', 'Trickster', 'Hero'], networks: COG_NET_B },
    TRICKSTER: { id: 4, mode: COG_MODE.engagement, members: ['Caregiver', 'Trickster', 'Hero'], networks: COG_NET_B },
    HERO:      { id: 4, mode: COG_MODE.engagement, members: ['Caregiver', 'Trickster', 'Hero'], networks: COG_NET_B },
  };
  const ALL_COG_TRIANGLES = [
    { id: 1, mode: COG_MODE.idealisme,  color: '#a855f7', members: 'Ruler · Innocent · Sage' },
    { id: 2, mode: COG_MODE.exploratie, color: '#3b82f6', members: 'Judge · Explorer · Artist' },
    { id: 3, mode: COG_MODE.impact,     color: '#f97316', members: 'Lover · Outlaw · Magician' },
    { id: 4, mode: COG_MODE.engagement, color: '#1d9904', members: 'Caregiver · Trickster · Hero' },
  ];

  // Generate and download a clean, document-style PDF
  const handleDownloadPdf = useCallback(async ({ shortVersion = false, previewMode: pvw = false } = {}) => {
    if (!shortVersion && !pvw && !paidPaymentId && !paidRef.current) { setShowPaywall(true); return; }
    if (!result) return;
    setPdfKind(shortVersion ? 'short' : 'full');
    setIsGeneratingPdf(true);

    try {
      // Lazy-load the heavy export libs only on the actual export click (not at modal
      // mount). The existing isGeneratingPdf state covers the brief fetch as part of
      // the normal "generating" spinner.
      const [{ jsPDF }, html2canvasMod] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const html2canvas = html2canvasMod.default;
      // ── PDF Setup ──
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const W = 210, H = 297;
      const margin = 18;
      // Beginner's report (Level Routing v0.1 §5.3; owner, 22 Oct 2026): the same introduction, AI prompt and data
      // pages; its shorter sections run as one flow instead of one fixed page per group (see 'beginner_body').
      const isBeginnerPdf = REPORT_LEVEL[assessmentLevel] === 'beginner';
      const contentW = W - margin * 2;
      let y = margin;

      // ── Enforce minimum font size of 8pt across all PDF text ──
      const PDF_MIN_FONT = 8;
      const _origSetFontSize = pdf.setFontSize.bind(pdf);
      pdf.setFontSize = (size) => _origSetFontSize(Math.max(size, PDF_MIN_FONT));

      // ── Color palette — exact match to website CSS values ──
      // bg     = #030012  page background (also the halo behind a levensles word that sits on the art)
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
      const bg        = [3, 0, 18];   // #030012 — the PDF's page colour (owner, 2026-09-27)
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
      // The triangle page's yellow (Master Prompt v7.2 page 5.7b): the canon's --yellow #EAB308, so the figure
      // and the section titles read as one page (Backend Task "Triangle Page" v0.1 §2).
      const triYellow = [234, 179, 8];
      const cream     = [255, 254, 240];

      // ── Track which pages have real content (to prune empty pages at the end) ──
      const pagesWithContent = new Set([1]); // page 1 (cover) always has content
      const markPage = () => pagesWithContent.add(pdf.internal.getNumberOfPages());

      // ── Block tracking for post-render page reorder ──
      const blockRanges = [];
      const trackBlock = (name) => {
        const before = pdf.internal.getNumberOfPages();
        return () => {
          const after = pdf.internal.getNumberOfPages();
          if (after > before) {
            blockRanges.push({ name, start: before + 1, end: after });
          }
        };
      };
      // A block records only the pages it CREATES, so a block may continue on the previous
      // block's last page without that page being claimed twice.

      // ── Helper: paint page background ──
      const paintBg = () => {
        pdf.setFillColor(...bg);
        pdf.rect(0, 0, W, H, 'F');
      };
      paintBg(); // first page

      // ── Helper: add page if needed ──
      let noPageBreak = false; // when true, suppress page breaks (e.g. resonantie sections on radar page)
      let bottomPad = margin;  // where a page breaks; a flow may run further down (the AI prompt, owner 22 Oct 2026)
      const ensureSpace = (needed) => {
        if (noPageBreak) return false;
        if (y + needed > H - bottomPad) {
          pdf.addPage();
          paintBg();
          y = margin;
          markPage();
          return true;
        }
        return false;
      };

      // ── Helper: sanitize Unicode that jsPDF's WinAnsi helvetica can't encode ──
      // Unencodable chars (arrows, emoji, etc.) render as boxes AND corrupt the run's
      // character-width math, which is what garbled text into "v e r w e r k i n g".
      const sanitizePdf = (str) => String(str ?? '')
        .replace(/—/g, ' - ')   // em-dash
        .replace(/–/g, ' - ')   // en-dash
        .replace(/\s-{2,3}\s/g, ' - ') // a raw prompt dash (" -- " / " --- ") the model copied
        .replace(/‘|’/g, "'") // curly single quotes
        .replace(/“|”/g, '"') // curly double quotes
        .replace(/…/g, '...')   // ellipsis
        .replace(/·/g, '-')     // middle dot
        .replace(/[→⇒➡➔➙➜]/g, ' -> ') // right arrows
        .replace(/[←⇐]/g, ' <- ')   // left arrows
        .replace(/[↔⇔]/g, ' <-> ')  // bidirectional arrows
        .replace(/[​-‍﻿]/g, '') // zero-width chars
        .replace(/[^\x00-\xFF]/g, ''); // strip any remaining non-Latin-1

      // ── Helper: wrapped text ──
      const writeWrapped = (text, x, startY, maxW, fontSize, color, style = 'normal') => {
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', style);
        const lines = pdf.splitTextToSize(sanitizePdf(text), maxW);
        const lineH = fontSize * 0.45;
        for (let i = 0; i < lines.length; i++) {
          ensureSpace(lineH);
          pdf.text(lines[i], x, y);
          y += lineH;
        }
        return lines.length;
      };

      // ── Helper: section heading with colored left bar ──
      const sectionHeading = (title, color, opts = {}) => {
        const small = opts.small; // reduced heading (OCEAN traits) — 9pt vs the 12pt default
        ensureSpace(small ? 10 : 14);
        y += small ? 3 : 4;
        pdf.setFillColor(...color);
        pdf.rect(margin, y - (small ? 3.5 : 4), 1.5, small ? 5 : 7, 'F');
        pdf.setFontSize(small ? 9 : 12);
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title.toUpperCase(), margin + 5, y);
        y += small ? 5 : 8;
      };

      // ── Helper: estimate rendered height of a markdown section (heading + content) ──
      // Used to decide whether to start a new page before rendering.
      const estimateSectionHeight = (title, content, maxW) => {
        // sectionHeading moves y down 4 + 8 mm; its ensureSpace(14) only checks for room and adds nothing.
        // Counting the 14 as height moved sections that fit to a fresh page (owner, 2026-09-18).
        let h = 4 + 8;
        if (!content) return h;
        const lines = content.split('\n');
        for (const raw of lines) {
          const trimmed = raw.trim();
          if (!trimmed) { h += 2; continue; }
          // every subheading form writePdfMarkdown renders at the subheading level
          if (/^#{2,}\s/.test(trimmed) || /^\*\*[^*]+\*\*$/.test(trimmed) ||
              isContractSubheading(trimmed) || isOceanMemberHeading(trimmed)) { h += 3 + 5 + 0.5; continue; }
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
      const renderSection = (title, content, color, opts = {}) => {
        const needed = estimateSectionHeight(title, content, contentW - 4);
        if (!noPageBreak && y + needed > H - margin) {
          pdf.addPage();
          paintBg();
          y = margin;
          markPage();
        }
        sectionHeading(cleanTitle(title), color, opts);
        // Theme in-body sub-headers to the section's accent (Schaduw=purple, Blindspot=red, …).
        writePdfMarkdown(content, margin + 2, contentW - 4, color);
      };

      // ── Helper: a section that FLOWS — no whole-section jump to a fresh page. Its heading keeps
      //    three body lines with it (never alone at the foot of a page); the body breaks wherever
      //    the page runs out. renderSection moves a section that won't fit entirely, which left
      //    DE HARDWARE ONDER DRUK alone on a half-empty page (Brief v2 Addendum A §4). ──
      const renderSectionFlow = (title, content, color, opts = {}) => {
        ensureSpace(12 + 3 * 4.3 + 2);
        sectionHeading(cleanTitle(title), color, opts);
        writePdfMarkdown(content, margin + 2, contentW - 4, color);
      };

      // ── Helper: render page content TOP-ALIGNED (anchored at the top margin) ──
      // renderFn receives a `gap` callback (kept for call-site compatibility) which is
      // now a no-op: content flows from the top margin downward with its own spacing,
      // rather than being spread to fill the full page height. Content that overflows
      // a page breaks naturally to the next page.
      const justifiedPage = async (renderFn) => {
        pdf.addPage(); paintBg(); markPage();
        y = margin;
        await renderFn(() => {});
      };

      // ── The triangle figure (Master Prompt v7.2 page 5.7b; Backend Task "Triangle Page" v0.1 §3) ──
      // The 12-point wheel as the model's own wheel draws it: Heerser (12) at the top and Rebel (6) at the bottom of
      // the vertical line, Rechter (1) one step clockwise (owner, 17 Oct); the four yellow triangles faint; the
      // Main's triangle highlighted, its fill set by its band (draagt 15 % · neutraal 8 % · stil outline only),
      // solid outline in all three; every other carrying triangle dashed, no fill. The band never shows as a
      // word or number. The page colour is solid, so each "opacity" is the exact mix with it, drawn opaque in
      // an order that covers nothing. Caption: the Main triangle's name, its members, and a dimmed line for a
      // dashed triangle. Takes ≈ 38 % of the content height plus the caption; moves `y` below it.
      const TRI_POSITIONS = { D1: [1, 5, 9], D2: [2, 6, 10], D3: [3, 7, 11], D4: [4, 8, 12] };
      const WHEEL_KEYS = ['judge', 'lover', 'caregiver', 'innocent', 'explorer', 'outlaw', 'trickster', 'sage', 'artist', 'magician', 'hero', 'ruler'];
      const mixBg = (c, a) => c.map((v, i) => Math.round(bg[i] + (v - bg[i]) * a));
      // The figure's full height (owner, 19 Oct: 10 % smaller than the first 38 %); the page may shrink it further so
      // its text never moves to a next page.
      const TRI_FIG_H = (H - 2 * margin) * 0.38 * 0.9;
      const drawTriangleFigure = (fig, boxH = TRI_FIG_H) => {
        const labels = tArray('resultsModal.pdf.triangle.wheel');
        const local = (name) => labels[WHEEL_KEYS.indexOf(String(name).toLowerCase())] || name;
        const r = boxH * 0.36;                                  // room around the wheel for the labels
        const cx = W / 2, cy = y + boxH / 2;
        const angle = (p) => (p * Math.PI) / 6;                // 12 → 0 (top), 6 → π (bottom), clockwise
        const at = (p, rad) => { const a = angle(p); return [cx + rad * Math.sin(a), cy - rad * Math.cos(a)]; };
        const triangle = (ps, style) => { const [a, b, c] = ps.map((p) => at(p, r)); pdf.triangle(a[0], a[1], b[0], b[1], c[0], c[1], style); };
        const mainPs = TRI_POSITIONS[fig.main.id];
        const otherIds = (fig.others || []).map((o) => o.id).filter((id) => TRI_POSITIONS[id]);
        markPage();

        pdf.setLineDashPattern([], 0);
        pdf.setDrawColor(...mixBg(white, 0.16)); pdf.setLineWidth(0.2);
        pdf.circle(cx, cy, r, 'S');
        const fill = { draagt: 0.15, neutraal: 0.08 }[fig.main.band];
        if (fill) { pdf.setFillColor(...mixBg(triYellow, fill)); triangle(mainPs, 'F'); }
        pdf.setDrawColor(...mixBg(triYellow, 0.35)); pdf.setLineWidth(0.3);
        for (const [id, ps] of Object.entries(TRI_POSITIONS)) if (id !== fig.main.id && !otherIds.includes(id)) triangle(ps, 'S');
        pdf.setDrawColor(...triYellow); pdf.setLineWidth(0.4);
        pdf.setLineDashPattern([1.6, 1.2], 0);
        for (const id of otherIds) triangle(TRI_POSITIONS[id], 'S');
        pdf.setLineDashPattern([], 0);
        pdf.setLineWidth(0.6);
        triangle(mainPs, 'S');

        // The profile's three highest totals (owner, 17 Oct): a purple ring at each, a purple point where it is not a
        // member of the Main's triangle — so a yellow point in a purple ring is where score and triangle meet.
        const topPs = (fig.top || []).map((n) => WHEEL_KEYS.indexOf(String(n).toLowerCase()) + 1).filter((p) => p > 0);
        for (let p = 1; p <= 12; p++) {
          const member = mainPs.includes(p);
          const top = topPs.includes(p);
          const dashedMember = !member && otherIds.some((id) => TRI_POSITIONS[id].includes(p));
          const [x, yy] = at(p, r);
          if (top) { pdf.setDrawColor(...purple); pdf.setLineWidth(0.55); pdf.circle(x, yy, 2.15, 'S'); }
          pdf.setFillColor(...(member ? triYellow : top ? purple : mixBg(white, 0.4)));
          pdf.circle(x, yy, member || top ? 1.25 : 0.85, 'F');
          // "N Name": the number yellow on a member, purple on a top score, grey elsewhere; the name bold cream
          // (member), cream (top score or dashed member), grey
          const sin = Math.sin(angle(p));
          const [lx, ly] = at(p, r + 4.2);
          const num = String(p), name = ` ${local(WHEEL_KEYS[p - 1])}`;
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold'); const wNum = pdf.getTextWidth(num);
          pdf.setFont('helvetica', member ? 'bold' : 'normal'); const wName = pdf.getTextWidth(name);
          const x0 = sin > 0.2 ? lx : sin < -0.2 ? lx - wNum - wName : lx - (wNum + wName) / 2;
          const baseline = ly + (p === 12 ? -0.6 : p === 6 ? 2.6 : 1.1);   // the top label sits above, the bottom one below
          pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...(member ? triYellow : top ? purple : mutedGray));
          pdf.text(num, x0, baseline);
          pdf.setFont('helvetica', member ? 'bold' : 'normal'); pdf.setTextColor(...(member || top || dashedMember ? cream : mutedGray));
          pdf.text(name, x0 + wNum, baseline);
        }
        // The synergy's name inside the wheel (owner, 19 Oct), on three lines — "De" / the adjective / the noun —
        // in the largest size whose lines all stay inside the inner dodecagon the four triangles leave open (its
        // inradius is r / 2: an equilateral triangle's inradius is half its circumradius). Each line's corners
        // must lie within that circle, with a little air; capped at 11 pt.
        const words = sanitizePdf(fig.main.name || '').split(/\s+/).filter(Boolean);
        const nameLines = words.length >= 3 ? [words[0], words.slice(1, -1).join(' '), words[words.length - 1]] : words;
        if (nameLines.length) {
          const inner = (r / 2) * 0.92;
          pdf.setFont('helvetica', 'bold');
          let size = 11;
          const fits = (s) => {
            pdf.setFontSize(s);
            const lh = s * 0.3528 * 1.18, half = s * 0.3528 * 0.36;   // line pitch and half the cap height, mm
            return nameLines.every((ln, i) => {
              const yc = (i - (nameLines.length - 1) / 2) * lh;
              const hw = pdf.getTextWidth(ln) / 2, vy = Math.abs(yc) + half;
              return hw * hw + vy * vy <= inner * inner;
            });
          };
          while (size > PDF_MIN_FONT && !fits(size)) size -= 0.25;
          pdf.setFontSize(size); pdf.setTextColor(...cream);
          const lh = size * 0.3528 * 1.18;
          nameLines.forEach((ln, i) => {
            const yc = cy + (i - (nameLines.length - 1) / 2) * lh;
            pdf.text(ln, cx, yc + size * 0.3528 * 0.36, { align: 'center' });
          });
        }
        y += boxH + 1;

        // Caption: the triangle's three members in wheel order, the purple-points key, and a dimmed line per
        // dashed triangle (the name itself stands inside the wheel).
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...dimWhite);
        // " · " is in WinAnsi (0xB7), so it prints as itself — the names come from our own label list
        pdf.text(mainPs.map((p) => local(WHEEL_KEYS[p - 1])).join(' · '), W / 2, y, { align: 'center' }); y += 4.2;
        if (topPs.length) {
          // the key to the purple points: a small ringed point, then the line, centred together
          const key = sanitizePdf(t('resultsModal.pdf.triangle.top'));
          pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
          const kw = 4 + pdf.getTextWidth(key);
          const kx = W / 2 - kw / 2;
          pdf.setDrawColor(...purple); pdf.setLineWidth(0.35); pdf.circle(kx + 1.3, y - 0.95, 1.25, 'S');
          pdf.setFillColor(...purple); pdf.circle(kx + 1.3, y - 0.95, 0.7, 'F');
          pdf.setTextColor(...dimWhite); pdf.text(key, kx + 4, y); y += 3.8;
        }
        const dashedNames = (fig.others || []).map((o) => o.name).filter(Boolean);
        if (dashedNames.length) {
          pdf.setFontSize(7.5); pdf.setTextColor(...mutedGray);
          pdf.text(sanitizePdf(tFunc('resultsModal.pdf.triangle.dashed')(dashedNames.join(', '))), W / 2, y, { align: 'center' }); y += 3.8;
        }
        y += 3;
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
      // Section dividers removed (they ate too much vertical space). Kept as a tiny no-line
      // gap so sections still have a hair of breathing room; section headings do the rest.
      // No-op'd centrally so every existing call site drops its divider at once.
      // eslint-disable-next-line no-unused-vars
      const hr = (color = mutedGray) => {
        y += 1.5;
      };

      // ── Helper: markdown-aware AI content renderer ──
      // `accent` (optional) themes the in-body headings/sub-headers to the section color;
      // when omitted, the legacy orange (## / ALL-CAPS) + amber (**bold**) defaults apply.
      const writePdfMarkdown = (mdText, x, maxW, accent) => {
        if (!mdText) return;
        const headColor = accent || orange;
        // One subheading level (Brief v2 Addendum A §1): smaller than the section bar, clearly
        // heavier than the body, no bar, and never the last thing on a page — it only renders
        // where its own height plus three body lines still fit, else it moves to the next page.
        const SUB_LINE = 5, BODY_LINE = 4.3;
        const subHeading = (text) => {
          const hLines = pdf.splitTextToSize(sanitizePdf(text), maxW);
          ensureSpace(3 + hLines.length * SUB_LINE + 3 * BODY_LINE);
          y += 3;
          pdf.setFontSize(10);
          pdf.setTextColor(...headColor);
          pdf.setFont('helvetica', 'bold');
          for (const hl of hLines) { pdf.text(hl, x, y); y += SUB_LINE; }
          y += 0.5;
        };
        // Unicode sanitization handled by the hoisted sanitizePdf() (defined above).
        // A heading the model ran into its body ("**Meegaandheid**Dit blok…") is split onto its own
        // line first; a run-in bold LABEL ("**De Focus-hendel:**Probeer…") only gets its space back.
        const lines = [];
        for (const raw of mdText.split('\n')) {
          const glued = splitGluedHeading(raw);
          if (glued) { lines.push(`**${glued.heading}**`, glued.rest); continue; }
          lines.push(raw.replace(/\*\*([^*\n]+?:)\*\*(?=\S)/g, '**$1** '));
        }
        for (const raw of lines) {
          let trimmed = sanitizePdf(raw.trim());
          // Collapse spaced-out characters (same as formatInline)
          trimmed = trimmed.replace(/(\d) (\d)/g, '$1$2');
          trimmed = trimmed.replace(/(^|[^A-Za-zÀ-ÿ0-9])([A-Za-zÀ-ÿ0-9](?:\s{1,2}[A-Za-zÀ-ÿ0-9]){3,})(?=[^A-Za-zÀ-ÿ0-9]|$)/g,
            (m, pre, seq) => pre + seq.replace(/\s+/g, sp => sp.length > 1 ? ' ' : ''));
          trimmed = trimmed.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
          trimmed = trimmed.replace(/\s+([.:!,;?])/g, '$1');
          trimmed = trimmed.replace(/\s{2,}/g, ' ');
          // Blank line → small gap
          if (!trimmed) { y += 2; continue; }
          // Horizontal divider (---, ***, ===) — skip entirely
          if (/^[-*=]{3,}$/.test(trimmed)) continue;
          // Strip "Archetype: XXX (180° tegenpool ...)" and "Archetype: XXX (Rode Lijn ...)" lines
          if (/^\**Archetype:?\**:?\s+\w+.*(180.*tegenpool|[Rr]ode\s+[Ll]ijn)/i.test(trimmed)) continue;
          // Render-side image placeholders the model sometimes emits on the resonance page —
          // a bare "ARCHETYPE-AFBEELDINGEN" header and "[afbeelding: X] - Naam [afbeelding: Y]"
          // lines. The renderer draws the real archetype circles itself, so drop these.
          if (/\[\s*afbeelding\b/i.test(trimmed)) continue;
          if (/^#{0,3}\s*\**\s*archetype[-\s]?afbeeldingen\s*\**\s*:?\s*$/i.test(trimmed)) continue;
          // ## / ### heading → the subheading level
          if (/^#{2,}\s/.test(trimmed)) {
            subHeading(trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim());
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
          // Standalone bold line (e.g. **Wat jouw lens doorlaat**) → the same subheading level
          const pdfBoldMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
          if (pdfBoldMatch) {
            subHeading(pdfBoldMatch[1]);
            continue;
          }
          // A contract subheading or OCEAN trait heading written as a bare line
          // ("Cognitieve aanleg", "Oriëntatie (intern/extern)", "Meegaandheid")
          if (isContractSubheading(trimmed) || isOceanMemberHeading(trimmed)) {
            subHeading(bareHeading(trimmed));
            continue;
          }
          // ALL-CAPS section header (e.g. "KERNPROFIEL:", "COMMUNICATIESTIJL:")
          if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && trimmed.length >= 3 && trimmed.length <= 70) {
            ensureSpace(7);
            pdf.setFontSize(8.5);
            pdf.setTextColor(...headColor);
            pdf.setFont('helvetica', 'bold');
            const hLines = pdf.splitTextToSize(trimmed, maxW);
            for (const hl of hLines) { ensureSpace(4.5); pdf.text(hl, x, y); y += 4.5; }
            y += 0.5;
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
        const hCells = headers.map((h, i) => pdf.splitTextToSize(sanitizePdf(h), colWidths[i] - hPad * 2));
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
          const cells = row.map((cell, i) => pdf.splitTextToSize(sanitizePdf(String(cell || '')), colWidths[i] - hPad * 2));
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
      // PAGE 1: COVER — drawn by coverPage.js. The dev cover preview (?coverpreview=1) calls it with
      // the same arguments, so the levensles placement judged there is the one that ships.
      // ═══════════════════════════════════════════════════
      y = await drawCoverPage(pdf, {
        y, W, H, margin, contentW,
        colors: { orange, purple, white, bg },
        t, language, extName: extNameShown, result, portrait,
      });

      // ═══════════════════════════════════════════════════
      // SHORT (free) VERSION — follows the result-card flow, 1 page per component:
      //   p1 cover (identical to full, above) · p2 Identiteit + Verklaring (identical
      //   to full, meta-disclaimer on top) · p3 radar + key-findings + D-curve ·
      //   p4 De Stille Stem · p5 closure (placeholder). Full report runs below the guard.
      // ═══════════════════════════════════════════════════
      if (shortVersion) {
        const g1 = (s) => cleanTitle(s.title || '').toLowerCase();
        const idSecs = (displaySections || [])
          .filter((s) => g1(s).includes('identiteit') || g1(s).includes('verklaring'))
          .sort((a, b) => (g1(a).includes('identiteit') ? 0 : 1) - (g1(b).includes('identiteit') ? 0 : 1));
        const stilleSecs = (displaySections || [])
          .filter((s) => /reflectie|motivatie/.test(g1(s)))
          .sort((a, b) => {
            const o = ['reflectie', 'motivatie'];
            return o.findIndex((k) => g1(a).includes(k)) - o.findIndex((k) => g1(b).includes(k));
          });

        // ── p2: Identiteit + Verklaring — identical to the full report (meta-disclaimer
        //    on top, then the two reads in green). No key-findings here. ──
        if (idSecs.length > 0) {
          await justifiedPage(async (gap) => {
            const savedNPB = noPageBreak; noPageBreak = true;

            // Fixed Meta-Disclaimer (same block + top bar as the full report's identity page).
            ensureSpace(20);
            pdf.setFillColor(20, 16, 36);
            const disclaimerText = t('resultsModal.pdf.metaDisclaimer');
            pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic');
            const disclaimerLines = pdf.splitTextToSize(disclaimerText, contentW - 8);
            const dlH = disclaimerLines.length * 3.5 + 4;
            pdf.rect(margin, y, contentW, dlH, 'F');
            pdf.setFillColor(249, 115, 22);
            pdf.rect(margin, y, contentW, 0.75, 'F');
            pdf.setTextColor(200, 200, 215);
            let dlY = y + 5;
            for (const line of disclaimerLines) { pdf.text(line, margin + 5, dlY); dlY += 3.5; }
            y += dlH + 8;
            gap();

            idSecs.forEach((section, i) => {
              renderSection(shownTitle(section),section.content, green);
              if (i < idSecs.length - 1) { hr(); gap(); }
            });
            noPageBreak = savedNPB;
          });
        }

        // ── p3: Radar (top) + key-findings (middle) + D-curve (below) — one page ──
        await justifiedPage(async (gap) => {
          const savedNPB = noPageBreak; noPageBreak = true;

          // Radar (TNM wheel) on top.
          const radarEl = pdfRadarRef.current || radarRef.current;
          if (radarEl) {
            try {
              const canvas = await html2canvas(radarEl, { backgroundColor: '#060612', scale: 2, useCORS: true, logging: false });
              const img = canvas.toDataURL('image/jpeg', 0.85);
              const maxH = 80;
              let drawH = (canvas.height / canvas.width) * contentW; let drawW = contentW;
              if (drawH > maxH) { drawH = maxH; drawW = (canvas.width / canvas.height) * drawH; }
              const ox = margin + (contentW - drawW) / 2;
              pdf.setDrawColor(...green); pdf.setLineWidth(0.5);
              pdf.rect(ox, y, drawW, drawH);
              pdf.addImage(img, 'JPEG', ox, y, drawW, drawH);
              y += drawH + 7;
            } catch { y += 4; }
          }

          // Key-findings strip in the middle — Kern/Support/Schaduw/Blindspot + Polarisatie.
          {
            const polGap = polarization?.polarizationPct ?? null;
            const polBand = polBandOf(polarization, t);
            const rows = [
              [t('resultsModal.labels.kern'), result.mainName, green],
              [t('resultsModal.labels.support'), result.secondaryName, orange],
              [t('resultsModal.labels.schaduw'), result.shadowName, purple],
              [t('resultsModal.labels.blindspot'), result.blindspotName, red],
              ...(polBand ? [[t('resultsModal.labels.polarisatie'), polGap + '% — ' + polBand, amber]] : []),
            ].filter((r) => r[1]);
            if (rows.length) {
              const boxH = rows.length * 7 + 6;
              pdf.setDrawColor(...mutedGray); pdf.setLineWidth(0.3);
              pdf.rect(margin, y, contentW, boxH);
              let ry = y + 6;
              rows.forEach(([label, value, col]) => {
                pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...mutedGray);
                pdf.text(String(label).toUpperCase(), margin + 4, ry);
                pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...col);
                pdf.text(sanitizePdf(String(value)), margin + 42, ry);
                ry += 7;
              });
              y += boxH + 7;
            }
          }

          // D-curve below.
          if (morphChart && morphologyRef.current) {
            try {
              const mc = await html2canvas(morphologyRef.current, { backgroundColor: '#060612', scale: 2, useCORS: true, logging: false });
              const mImg = mc.toDataURL('image/jpeg', 0.85);
              const innerPad = 3;
              const chartW = contentW - innerPad * 2;
              let chartH = (mc.height / mc.width) * chartW;
              if (chartH > 105) chartH = 105;
              const boxH = chartH + innerPad * 2;
              pdf.setDrawColor(...cyan); pdf.setLineWidth(0.4);
              pdf.rect(margin, y, contentW, boxH);
              pdf.addImage(mImg, 'JPEG', margin + innerPad, y + innerPad, chartW, chartH);
              y += boxH + 4;
            } catch { y += 4; }
          }
          noPageBreak = savedNPB;
        });

        // ── p4: De Stille Stem — Reflectie + Motivatie ──
        if (stilleSecs.length > 0) {
          await justifiedPage(async (gap) => {
            const savedNPB = noPageBreak; noPageBreak = true;
            stilleSecs.forEach((section, i) => {
              renderSection(t('resultsModal.labels.stilleStemPrefix') + cleanTitle(shownTitle(section)),section.content, purple);
              if (i < stilleSecs.length - 1) { hr(); gap(); }
            });
            noPageBreak = savedNPB;
          });
        }

        // ── p5: Afsluiting (closure — copy not yet written, placeholder page) ──
        await justifiedPage(async () => {
          y += 40;
          pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...green);
          pdf.text(t('resultsModal.pdf.short.closingTitle'), W / 2, y, { align: 'center' });
          y += 12;
          pdf.setFontSize(9); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...dimWhite);
          const placeholder = pdf.splitTextToSize(t('resultsModal.pdf.short.closingPlaceholder'), contentW - 40);
          for (const l of placeholder) { pdf.text(l, W / 2, y, { align: 'center' }); y += 5; }
        });

        // ── Prune empty pages + save ──
        const tp = pdf.internal.getNumberOfPages();
        for (let p = tp; p >= 1; p--) { if (!pagesWithContent.has(p)) pdf.deletePage(p); }
        const an = (result?.extendedName || 'Archetype').replace(/\s+/g, '_');
        if (pvw) { try { onPreviewReadyRef.current?.(pdf.output('bloburl')); } catch (_) {} return; }
        pdf.save(`GardenForLife_${an}${t('resultsModal.pdf.short.fileSuffix')}.pdf`);
        // Short report downloaded → send the SHORT report email to the gate email
        // (fire-and-forget). The gate itself no longer emails on entry — the chosen
        // download decides which mail goes out (full sends the access email below).
        if (gateEmailRef.current) {
          sendReportEmail({
            email: gateEmailRef.current,
            kind: 'short',
            archetypeKey: result?.mainArchetype || '',
            extendedArchetypeName: result?.extendedNameNl || result?.extendedName || '',
          }).then(() => console.log('[GFL] Short report email sent')).catch((e) => console.warn('[GFL] Short report email failed:', e?.message));
        }
        return; // finally{} resets isGeneratingPdf
      }

      // ═══════════════════════════════════════════════════
      // PAGE 2: LEGAL / COMPLIANCE
      // ═══════════════════════════════════════════════════
      await justifiedPage(async (gap) => {

      // Header
      pdf.setFontSize(16);
      pdf.setTextColor(...green);
      pdf.setFont('helvetica', 'bold');
      pdf.text(t('resultsModal.pdf.legal.pageTitle'), margin, y);
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

      legalSection(t('resultsModal.pdf.legal.c1Title'), t('resultsModal.pdf.legal.c1Body'));
      gap();

      legalSection(t('resultsModal.pdf.legal.c2Title'), t('resultsModal.pdf.legal.c2Body'));
      gap();

      legalSection(t('resultsModal.pdf.legal.c3Title'), t('resultsModal.pdf.legal.c3Body'));
      gap();

      legalSection(t('resultsModal.pdf.legal.c4Title'), t('resultsModal.pdf.legal.c4Body'));
      gap();

      legalSection(t('resultsModal.pdf.legal.c5Title'), t('resultsModal.pdf.legal.c5Body'));
      gap();

      legalSection(t('resultsModal.pdf.legal.c6Title'), t('resultsModal.pdf.legal.c6Body'));
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
      pdf.text(t('resultsModal.pdf.legal.consentTitle'), margin + 8, y + 4);
      pdf.setFontSize(7.5);
      pdf.setTextColor(...white);
      pdf.setFont('helvetica', 'normal');
      pdf.text(t('resultsModal.pdf.legal.consentLine1'), margin + 8, y + 9);
      pdf.text(t('resultsModal.pdf.legal.consentLine2'), margin + 8, y + 13);
      y += 22;
      gap();

      // Contact
      pdf.setFontSize(7);
      pdf.setTextColor(...white);
      pdf.setFont('helvetica', 'normal');
      pdf.text(t('resultsModal.pdf.legal.contact'), W / 2, y, { align: 'center' });
      });

      // ═══════════════════════════════════════════════════
// PAGE 3: BELANGRIJKE CONTEXT (sub-headed text + model images)
      // ═══════════════════════════════════════════════════
      const loadImg = (src) => new Promise((resolve, reject) => {
        const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = src;
      });
      const subtitle = (txt) => {
        ensureSpace(12); y += 1;
        pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...purple);
        pdf.text(txt, margin + 2, y); y += 6;
      };
      const flowAroundImage = (paras, x, narrowW, fullW, imgTopY, imgBottomY, fsz, color) => {
        pdf.setFontSize(fsz); pdf.setTextColor(...color); pdf.setFont('helvetica', 'normal');
        const lineH = fsz * 0.45; let broke = false;
        for (let pi = 0; pi < paras.length; pi++) {
          const segs = sanitizePdf(paras[pi]).split('\n');
          for (let sgi = 0; sgi < segs.length; sgi++) {
            const words = segs[sgi].split(/\s+/).filter(Boolean); let i = 0;
            if (!words.length) { y += lineH; continue; }
            while (i < words.length) {
              if (ensureSpace(lineH)) broke = true;
              const w = (!broke && y >= imgTopY && y < imgBottomY) ? narrowW : fullW;
              let line = '';
              while (i < words.length) { const t = line ? line + ' ' + words[i] : words[i]; if (pdf.getTextWidth(t) <= w) { line = t; i++; } else break; }
              if (!line) { line = words[i]; i++; }
              pdf.text(line, x, y); y += lineH;
            }
          }
          y += 2;
        }
      };
      const coloredBullet = (label, labelColor, rest, rightX) => {
        pdf.setFontSize(8.5); ensureSpace(6);
        const dotX = margin + 2, labelX = margin + 6, lineH = 8.5 * 0.45;
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...labelColor);
        pdf.text('•', dotX, y);
        const labelS = sanitizePdf(label); pdf.text(labelS, labelX, y);
        const labelW = pdf.getTextWidth(labelS + ' ');
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...white);
        const words = sanitizePdf(rest).split(/\s+/).filter(Boolean);
        const rightEdge = rightX || (margin + contentW - 2);
        let curX = labelX + labelW, i = 0, line = '';
        while (i < words.length) { const t = line ? line + ' ' + words[i] : words[i]; if (curX + pdf.getTextWidth(t) <= rightEdge) { line = t; i++; } else break; }
        if (line) pdf.text(line, curX, y); y += lineH;
        while (i < words.length) { ensureSpace(lineH); let l2 = ''; while (i < words.length) { const t = l2 ? l2 + ' ' + words[i] : words[i]; if (pdf.getTextWidth(t) <= rightEdge - labelX) { l2 = t; i++; } else break; } if (!l2) { l2 = words[i]; i++; } pdf.text(l2, labelX, y); y += lineH; }
        y += 2.5;
      };

      // ── PAGE 3: Belangrijke Context (Triple-Network/Cells bottom-anchored, Deltawerken fills gap) ──
      pdf.addPage(); paintBg(); markPage(); y = margin;
      sectionHeading(t('resultsModal.pdf.context.title'), green);
      writeWrapped(t('resultsModal.pdf.context.intro1'), margin + 2, y, contentW - 4, 8.5, white); y += 3;
      writeWrapped(t('resultsModal.pdf.context.intro2'), margin + 2, y, contentW - 4, 8.5, white); y += 5;

      subtitle(t('resultsModal.pdf.context.methodTitle'));
      writeWrapped(t('resultsModal.pdf.context.methodBody'), margin + 2, y, contentW - 4, 8.5, dimWhite, 'italic'); y += 5;

      subtitle(t('resultsModal.pdf.context.deltaTitle'));
      writeWrapped(t('resultsModal.pdf.context.deltaBody'), margin + 2, y, contentW - 4, 8.5, white); y += 4;
      const yAfterDelta3 = y;

      // Bottom-anchored block: Het Triple-Network-Wiel + Cells within Cells + closing.
      const P3_wiel = t('resultsModal.pdf.context.wielBody');
      const P3_cells = t('resultsModal.pdf.context.cellsBody');
      const P3_close = t('resultsModal.pdf.context.close');
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
      const lh3 = 8.5 * 0.45, subH3 = 7;
      const wielH3 = pdf.splitTextToSize(sanitizePdf(P3_wiel), contentW - 4).length * lh3;
      const cellsH3 = pdf.splitTextToSize(sanitizePdf(P3_cells), contentW - 4).length * lh3;
      const closeH3 = pdf.splitTextToSize(sanitizePdf(P3_close), contentW - 4).length * lh3;
      const bottomH3 = subH3 + wielH3 + 5 + subH3 + cellsH3 + 3 + closeH3;
      const bottomStartY3 = (H - margin) - bottomH3 - 2;

      // Deltawerken image centered in the leftover gap.
      try {
        const dwImgEl = await loadImg(deltawerkenImg);
        const dwNaturalH = (dwImgEl.naturalHeight / dwImgEl.naturalWidth) * contentW;
        let dwH = Math.min(dwNaturalH, 93); // 62 × 1.5 — fills the gap above the bottom block
        let dwW = (dwImgEl.naturalWidth / dwImgEl.naturalHeight) * dwH;
        if (dwW > contentW) { dwW = contentW; dwH = (dwImgEl.naturalHeight / dwImgEl.naturalWidth) * dwW; }
        const gap3 = bottomStartY3 - yAfterDelta3;
        if (dwH > gap3 - 4) { dwH = gap3 - 4; dwW = (dwImgEl.naturalWidth / dwImgEl.naturalHeight) * dwH; }
        pdf.addImage(deltawerkenImg, 'PNG', margin + (contentW - dwW) / 2, yAfterDelta3 + (gap3 - dwH) / 2 - H * 0.01, dwW, dwH);
      } catch { /* image load failed */ }

      y = bottomStartY3;
      subtitle(t('resultsModal.pdf.context.wielTitle'));
      writeWrapped(P3_wiel, margin + 2, y, contentW - 4, 8.5, white); y += 5;
      subtitle(t('resultsModal.pdf.context.cellsTitle'));
      writeWrapped(P3_cells, margin + 2, y, contentW - 4, 8.5, white); y += 3;
      writeWrapped(P3_close, margin + 2, y, contentW - 4, 8.5, white);

      // ── PAGE 4: Van Vraag naar Score (Wat-leest centered, Dat-leest+legend bottom-anchored) ──
      pdf.addPage(); paintBg(); markPage(); y = margin;
      sectionHeading(t('resultsModal.pdf.vanVraag.title'), purple);

      let vvNarrowW = contentW - 4, vvImgTop = y, vvImgBottom = y;
      try {
        const cImg = await loadImg(cellsImg);
        const ratioH = cImg.naturalHeight / cImg.naturalWidth;
        let cW = contentW * 0.42; let cH = cW * ratioH;
        const cX = margin + contentW - cW; const cY = y + 4 + H * 0.10; // moved down 10%
        pdf.addImage(cellsImg, 'PNG', cX, cY, cW, cH);
        pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...mutedGray);
        const lbl = t('resultsModal.pdf.vanVraag.imgLabel'); pdf.text(lbl, cX + cW - pdf.getTextWidth(lbl), cY + 4.5);
        vvImgTop = cY; vvImgBottom = cY + cH; vvNarrowW = (cX - 4) - (margin + 2);
      } catch { /* image load failed */ }

      flowAroundImage(tArray('resultsModal.pdf.vanVraag.paras'), margin + 2, vvNarrowW, contentW - 4, vvImgTop, vvImgBottom, 8.5, white);
      const yAfterVanVraag4 = y;

      // Strings for the centered + bottom-anchored blocks.
      const P4_wat = t('resultsModal.pdf.vanVraag.watBody');
      const P4_dat = t('resultsModal.pdf.vanVraag.datBody');
      const P4_lijnIntro = t('resultsModal.pdf.vanVraag.lijnIntro');
      const B = {
        groen: t('resultsModal.pdf.vanVraag.lines.groen'),
        paars: t('resultsModal.pdf.vanVraag.lines.paars'),
        blauw: t('resultsModal.pdf.vanVraag.lines.blauw'),
        geel:  t('resultsModal.pdf.vanVraag.lines.geel'),
        rood:  t('resultsModal.pdf.vanVraag.lines.rood'),
      };
      // Colour names as bullet labels — translated alongside their bodies.
      const BL = {
        groen: t('resultsModal.pdf.vanVraag.lines.groenLabel'),
        paars: t('resultsModal.pdf.vanVraag.lines.paarsLabel'),
        blauw: t('resultsModal.pdf.vanVraag.lines.blauwLabel'),
        geel:  t('resultsModal.pdf.vanVraag.lines.geelLabel'),
        rood:  t('resultsModal.pdf.vanVraag.lines.roodLabel'),
      };

      // Pre-measure the bottom-anchored block: Dat-leest (subtitle+para) + De-vijf-lijntypes (subtitle+intro+5 bullets).
      const lh4 = 8.5 * 0.45, subH4 = 7;
      const wheelW4 = contentW * 0.40;
      const lijnRightX4 = (margin + contentW - wheelW4) - 4;
      const labelX4 = margin + 6;
      const bulletWrap4 = lijnRightX4 - labelX4;
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
      const datLines = pdf.splitTextToSize(sanitizePdf(P4_dat), contentW - 4).length;
      const introLines4 = pdf.splitTextToSize(sanitizePdf(P4_lijnIntro), lijnRightX4 - (margin + 2)).length;
      let bulletsH4 = 0;
      for (const k of ['groen', 'paars', 'blauw', 'geel', 'rood']) {
        const ln = pdf.splitTextToSize(sanitizePdf(BL[k] + ' ' + B[k]), bulletWrap4).length;
        bulletsH4 += ln * lh4 + 2.5;
      }
      const bottomBlockH4 = subH4 + datLines * lh4 + 5 + subH4 + introLines4 * lh4 + 3 + bulletsH4;
      const bottomStartY4 = (H - margin) - bottomBlockH4 - 2;

      // Wat het instrument leest — perfectly centered on page height.
      const watLines = pdf.splitTextToSize(sanitizePdf(P4_wat), contentW - 4).length;
      const watBlockH = subH4 + watLines * lh4;
      y = Math.max(yAfterVanVraag4 + 4, (H - watBlockH) / 2);
      subtitle(t('resultsModal.pdf.vanVraag.watTitle'));
      writeWrapped(P4_wat, margin + 2, y, contentW - 4, 8.5, white);

      // Bottom-anchored: Dat is wat het rapport leest + De vijf lijntypes + TNM wiel.
      y = bottomStartY4;
      subtitle(t('resultsModal.pdf.vanVraag.datTitle'));
      writeWrapped(P4_dat, margin + 2, y, contentW - 4, 8.5, white); y += 5;
      subtitle(t('resultsModal.pdf.vanVraag.lijnTitle'));
      const lijnTop4 = y;
      let lijnRightXr = margin + contentW - 2;
      try {
        const wImgEl = await loadImg(tnmWheelImg);
        const ratioWH = wImgEl.naturalHeight / wImgEl.naturalWidth;
        let wWi = wheelW4; let wHi = wWi * ratioWH;
        const wAvail = (H - margin) - lijnTop4;
        if (wHi > wAvail) { wHi = wAvail; wWi = wHi / ratioWH; }
        pdf.addImage(tnmWheelImg, 'PNG', margin + contentW - wWi, lijnTop4, wWi, wHi);
        lijnRightXr = (margin + contentW - wWi) - 4;
      } catch { /* image load failed */ }
      writeWrapped(P4_lijnIntro, margin + 2, y, lijnRightXr - (margin + 2), 8.5, white); y += 3;
      coloredBullet(BL.groen, green, B.groen, lijnRightXr);
      coloredBullet(BL.paars, purple, B.paars, lijnRightXr);
      coloredBullet(BL.blauw, blue, B.blauw, lijnRightXr);
      coloredBullet(BL.geel, amber, B.geel, lijnRightXr);
      coloredBullet(BL.rood, red, B.rood, lijnRightXr);

      // ═══════════════════════════════════════════════════
      // PAGE 4: DE TAAL VAN DE TEST (was page 5)
      // ═══════════════════════════════════════════════════
      await justifiedPage(async (gap) => {

      sectionHeading(t('resultsModal.pdf.taal.title'), purple);

      writeWrapped(t('resultsModal.pdf.taal.p1'), margin + 2, y, contentW - 4, 9, white);
      y += 4;
      writeWrapped(t('resultsModal.pdf.taal.p2'), margin + 2, y, contentW - 4, 9, white);
      y += 4;
      writeWrapped(t('resultsModal.pdf.taal.p3'), margin + 2, y, contentW - 4, 9, white);
      y += 5;
      gap();

      drawTable(
        tArray('resultsModal.pdf.taal.groupHeaders'),
        [
          ['Ruling',     t('resultsModal.groups.ruling.network'),     'Ruler (12), Judge (1)',      t('resultsModal.groups.ruling.drive')],
          ['Relational', t('resultsModal.groups.relational.network'), 'Lover (2), Caregiver (3)',   t('resultsModal.groups.relational.drive')],
          ['Seeker',     t('resultsModal.groups.seeker.network'),     'Innocent (4), Explorer (5)', t('resultsModal.groups.seeker.drive')],
          ['Chaos',      t('resultsModal.groups.chaos.network'),      'Outlaw (6), Trickster (7)',  t('resultsModal.groups.chaos.drive')],
          ['Abstract',   t('resultsModal.groups.abstract.network'),   'Sage (8), Artist (9)',       t('resultsModal.groups.abstract.drive')],
          ['Agency',     t('resultsModal.groups.agency.network'),     'Magician (10), Hero (11)',   t('resultsModal.groups.agency.drive')],
        ],
        [30, 42, 50, 52],
        { fontSize: 7, vPad: 3 }
      );

      y += 5;
      gap();
      drawTable(
        tArray('resultsModal.pdf.taal.depthHeaders'),
        tArray('resultsModal.pdf.taal.depthRows'),
        [14, 20, 58, 82], // sized so every row stays on one line
        { fontSize: 7, vPad: 3 }
      );

      y += 5;
      gap();
      subtitle(t('resultsModal.pdf.taal.atom3Title'));
      writeWrapped(t('resultsModal.pdf.taal.atom3Body'), margin + 2, y, contentW - 4, 8.5, white);
      y += 3;
      subtitle(t('resultsModal.pdf.taal.atom6Title'));
      writeWrapped(t('resultsModal.pdf.taal.atom6Body'), margin + 2, y, contentW - 4, 8.5, white);
      y += 5;
      gap();

      drawTable(
        tArray('resultsModal.pdf.taal.angleHeaders'),
        tArray('resultsModal.pdf.taal.angleRows'),
        [42, 50, 82],
        { fontSize: 7, vPad: 3 }
      );

      ensureSpace(8);
      y += 5;
      pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...white);
      pdf.text(t('resultsModal.pdf.taal.sacredTitle'), margin + 2, y);
      y += 5;
      tArray('resultsModal.pdf.taal.sacredBullets').forEach(b => {
        ensureSpace(6);
        pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...white);
        pdf.text('\u2022', margin + 2, y);
        const bLines = pdf.splitTextToSize(b, contentW - 8);
        bLines.forEach(bl => { ensureSpace(4.5); pdf.text(bl, margin + 7, y); y += 4.5; });
      });
      y += 5;
      ensureSpace(8);
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...dimWhite);
      pdf.text(t('resultsModal.pdf.taal.kicker'), margin + 2, y);
      y += 10;
      });

      // ═══════════════════════════════════════════════════
      // PAGE 5: 72 ARCHETYPES CROSS-REFERENCE (was page 6)
      // ═══════════════════════════════════════════════════
      await justifiedPage(async () => {
      // Fixed one-page layout (no flex gaps): intro on top, the closer bottom-anchored,
      // and the TABLE stretched (via vPad) to fill exactly the space between them.
      const savedNPBmyth = noPageBreak; noPageBreak = true;

      sectionHeading(t('resultsModal.pdf.myth.title'), orange);

      writeWrapped(t('resultsModal.pdf.myth.intro'), margin + 2, y, contentW - 4, 8.5, white);
      y += 5;

      // Bottom-anchored closer \u2014 measured first so the table knows its budget.
      const MYTH_CLOSER_1 = t('resultsModal.pdf.myth.closer1');
      const MYTH_CLOSER_2 = t('resultsModal.pdf.myth.closer2');
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
      const mythCloserLines = pdf.splitTextToSize(MYTH_CLOSER_1, contentW - 4).length
        + pdf.splitTextToSize(MYTH_CLOSER_2, contentW - 4).length;
      const mythCloserH = mythCloserLines * 4.5 + 6; // + paragraph gap
      const mythBottomY = (H - margin) - mythCloserH; // top of the closer block

      const MYTH_HEADERS = tArray('resultsModal.pdf.myth.headers');
      const MYTH_COLS = [36, 32, 68, 38];
      const MYTH_ROWS = tArray('resultsModal.pdf.myth.rows');

      // Stretch: natural text height at 7.5pt \u2192 the surplus up to the closer becomes
      // per-row padding (capped 3..12 so extremes can't wreck the rhythm).
      const lhT = 7.5 * 0.45;
      pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
      const mythHeadLines = Math.max(...MYTH_HEADERS.map((h, i) => pdf.splitTextToSize(sanitizePdf(h), MYTH_COLS[i] - 4).length));
      pdf.setFont('helvetica', 'normal');
      const mythRowLines = MYTH_ROWS.map((r) => Math.max(...r.map((c, i) => pdf.splitTextToSize(sanitizePdf(String(c)), MYTH_COLS[i] - 4).length)));
      const mythNaturalText = (mythHeadLines + mythRowLines.reduce((a, b) => a + b, 0)) * lhT;
      const mythAvail = (mythBottomY - 6) - y; // breathing room above the closer
      const mythVPad = Math.max(3, Math.min(12, (mythAvail - mythNaturalText) / (MYTH_ROWS.length + 1)));
      drawTable(MYTH_HEADERS, MYTH_ROWS, MYTH_COLS, { fontSize: 7.5, vPad: mythVPad });

      // Closer \u2014 bottom-aligned on the SAME page.
      y = mythBottomY;
      writeWrapped(MYTH_CLOSER_1, margin + 2, y, contentW - 4, 8.5, white);
      y += 3;
      writeWrapped(MYTH_CLOSER_2, margin + 2, y, contentW - 4, 8.5, white, 'italic');
      noPageBreak = savedNPBmyth;
      });

      // ═══════════════════════════════════════════════════
      // PAGE 6: HOE HET RAPPORT ONTSTAAT (vier stappen)
      // ═══════════════════════════════════════════════════
      await justifiedPage(async (gap) => {
      const savedNPBhro = noPageBreak; noPageBreak = true; // no bottom padding — let content flow to the page edge, never spill to a new page

      // ── Hoe Het Rapport Ontstaat — vier stappen ──
      sectionHeading(t('resultsModal.pdf.ontstaat.title'), orange);

      const leadPara = (lead, leadColor, rest) => {
        // Subtitle on its own line — blue and larger, matching the report's other sub-headings.
        ensureSpace(10);
        pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...blue);
        pdf.text(sanitizePdf(lead), margin + 2, y);
        y += 5;
        writeWrapped(rest, margin + 2, y, contentW - 4, 8.5, white);
        y += 3;
      };

      writeWrapped(t('resultsModal.pdf.ontstaat.intro'), margin + 2, y, contentW - 4, 8.5, white);
      y += 5;

      leadPara(t('resultsModal.pdf.ontstaat.s1Lead'), green, t('resultsModal.pdf.ontstaat.s1Body'));
      leadPara(t('resultsModal.pdf.ontstaat.s2Lead'), purple, t('resultsModal.pdf.ontstaat.s2Body'));
      leadPara(t('resultsModal.pdf.ontstaat.s3Lead'), amber, t('resultsModal.pdf.ontstaat.s3Body'));
      leadPara(t('resultsModal.pdf.ontstaat.s4Lead'), red, t('resultsModal.pdf.ontstaat.s4Body'));

      // C12 model image \u2014 bottom-anchored, centered; 1.5x the previous size (TNM wheel * 1.1 * 1.5).
      try {
        const c12El = await loadImg(c12Img);
        const ratio = c12El.naturalHeight / c12El.naturalWidth;
        const cW = contentW * 0.42 * 1.1 * 1.5;
        const cH = cW * ratio;
        const cX = margin + (contentW - cW) / 2;
        const cY = (H - margin) - cH;
        pdf.addImage(c12Img, 'PNG', cX, cY, cW, cH);
      } catch { /* image load failed */ }
      noPageBreak = savedNPBhro;
      gap();


      });

// ═══════════════════════════════════════════════════
      // LAST INTRO PAGE: WETENSCHAPPELIJKE CONTEXT (full page, before the rapport)
      // ═══════════════════════════════════════════════════
      const endWetContext = trackBlock('wet_context');
      await justifiedPage(async (gap) => {

      sectionHeading(t('resultsModal.pdf.wetenschap.title'), orange);
      writeWrapped(t('resultsModal.pdf.wetenschap.intro'), margin + 2, y, contentW - 4, 8.5, white);
      y += 5;

      const refEntry = (label, sources) => {
        const fsz = 7.5, lineH = fsz * 0.45, x0 = margin + 2;
        ensureSpace(lineH);
        pdf.setFontSize(fsz);
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...white);
        const labelS = sanitizePdf(label + ' \u2014 ');
        pdf.text(labelS, x0, y);
        const labelW = pdf.getTextWidth(labelS);
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...white);
        const words = sanitizePdf(sources).split(/\s+/).filter(Boolean);
        const rightEdge = margin + contentW - 2;
        let curX = x0 + labelW, i = 0, line = '';
        while (i < words.length) {
          const t = line ? line + ' ' + words[i] : words[i];
          if (curX + pdf.getTextWidth(t) <= rightEdge) { line = t; i++; } else break;
        }
        if (line) pdf.text(line, curX, y);
        y += lineH;
        while (i < words.length) {
          ensureSpace(lineH);
          let l2 = '';
          while (i < words.length) {
            const t = l2 ? l2 + ' ' + words[i] : words[i];
            if (pdf.getTextWidth(t) <= contentW - 9) { l2 = t; i++; } else break;
          }
          if (!l2) { l2 = words[i]; i++; }
          pdf.text(l2, x0 + 3, y); y += lineH;
        }
        y += 2.8;
      };

      ensureSpace(10);
      pdf.setFontSize(9.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...green);
      pdf.text(t('resultsModal.pdf.wetenschap.empiricalTitle'), margin + 2, y); y += 5;

      refEntry(t('resultsModal.pdf.wetenschap.refs.archetypal'), "C.G. Jung (1921), Psychological Types; Carol Pearson (1991), Awakening the Heroes Within");
      refEntry(t('resultsModal.pdf.wetenschap.refs.networks'), "V. Menon (2011), Large-scale brain networks, Trends Cogn. Sci.; M.E. Raichle (2001), A default mode of brain function, PNAS");
      refEntry(t('resultsModal.pdf.wetenschap.refs.dmn'), "R.L. Buckner (2008), The brain's default network, Annals NYAS; K. Christoff (2016), Mind-wandering as spontaneous thought, Nat. Rev. Neurosci.");
      refEntry(t('resultsModal.pdf.wetenschap.refs.predictive'), "K. Friston (2010), The free-energy principle, Nat. Rev. Neurosci.; G. Buzs\u00E1ki (2019), The Brain from Inside Out");
      refEntry(t('resultsModal.pdf.wetenschap.refs.dynamics'), "D. Bassett (2011), Dynamic reconfiguration of brain networks, PNAS; G. Buzs\u00E1ki & X.-J. Wang (2012), Mechanisms of gamma oscillations, Annu. Rev. Neurosci.");
      refEntry(t('resultsModal.pdf.wetenschap.refs.entropy'), "R. Carhart-Harris (2014), The entropic brain, Front. Hum. Neurosci.; R. Carhart-Harris & K. Friston (2019), REBUS and the anarchic brain, Pharmacol. Rev.");
      refEntry(t('resultsModal.pdf.wetenschap.refs.personality'), "P.T. Costa & R.R. McCrae (1992), NEO-PI-R; L.R. Goldberg (1993), Phenotypic personality traits, Am. Psychol.; C. DeYoung (2015), Cybernetic Big Five Theory, J. Res. Pers.");
      refEntry(t('resultsModal.pdf.wetenschap.refs.motivation'), "J. Panksepp (1998), Affective Neuroscience; J. Gray & N. McNaughton (2000), The Neuropsychology of Anxiety; E. Aston-Jones & J. Cohen (2005), LC-NE function, Annu. Rev. Neurosci.");
      refEntry(t('resultsModal.pdf.wetenschap.refs.emotion'), "L.F. Barrett (2017), How Emotions Are Made; A. Damasio (2003), Looking for Spinoza; M. Solms (2021), The Hidden Spring; A. Seth (2021), Being You");
      refEntry(t('resultsModal.pdf.wetenschap.refs.perception'), "L. Robertson & R. Ivry (1998), The Two Sides of Perception");
      refEntry(t('resultsModal.pdf.wetenschap.refs.constraint'), "A. Juarrero (2023), Context Changes Everything");
      refEntry(t('resultsModal.pdf.wetenschap.refs.development'), "J. Piaget (1954), The Construction of Reality in the Child; R. Kegan (1994), In Over Our Heads; J. Vervaeke (2019), Awakening from the Meaning Crisis; J. Peterson (1999), Maps of Meaning");
      refEntry(t('resultsModal.pdf.wetenschap.refs.psychodynamics'), "D. Westen (1999), The scientific status of unconscious processes, Psychol. Bull.");
      refEntry(t('resultsModal.pdf.wetenschap.refs.stress'), t('resultsModal.pdf.wetenschap.stressSources'));
      refEntry(t('resultsModal.pdf.wetenschap.refs.multiscale'), "M. Levin (2019), The computational boundary of a 'self', Front. Psychol.");
      refEntry(t('resultsModal.pdf.wetenschap.refs.coregulation'), "J. Coutinho et al. (2021), Cardiac synchrony in dyadic co-regulation, Psychophysiology; D. Palumbo et al. (2017), Interpersonal autonomic physiology");
      refEntry(t('resultsModal.pdf.wetenschap.refs.creativity'), "M. Benedek et al. (2014), Brain connectivity during creative cognition, Neuropsychologia; R.E. Beaty et al. (2018), Robust prediction of creativity from brain activity, PNAS");

      y += 1.5;
      ensureSpace(8);
      writeWrapped(t('resultsModal.pdf.wetenschap.frontierNote'), margin + 2, y, contentW - 4, 8, dimWhite, 'italic');
      y += 2;

      refEntry(t('resultsModal.pdf.wetenschap.refs.consciousness'), "G. Tononi e.a. (2023), IIT 4.0, PLoS Comput. Biol.; Cogitate Consortium (2025), Adversarial testing of consciousness theories, Nature");
      refEntry(t('resultsModal.pdf.wetenschap.refs.oscillatory'), "J. McFadden (2020), Integrating information in the brain's EM field (CEMI), Neurosci. Conscious.");
      refEntry(t('resultsModal.pdf.wetenschap.refs.emergence'), "J. Wei e.a. (2022), Emergent abilities of LLMs; R. Schaeffer e.a. (2023), Are emergent abilities a mirage?; Templeton e.a. (2024), Scaling Monosemanticity");
      refEntry(t('resultsModal.pdf.wetenschap.refs.ontological'), "D. Bohm (1980), Wholeness and the Implicate Order; E. Verlinde (2016), Emergent gravity and the dark universe; B. Kastrup (2019), Reasonable inferences from quantum mechanics");

      y += 3;
      writeWrapped(t('resultsModal.pdf.wetenschap.closing'), margin + 2, y, contentW - 4, 8, dimWhite);
      });
      endWetContext();

            // ═══════════════════════════════════════════════════
      // CONTENT PAGES (Waarom/Essentie/Vermenigvuldiging/Shadow/Blindspot removed — AI sections cover these deeper)
      // ═══════════════════════════════════════════════════
      /* eslint-disable no-constant-condition */
      if (false) { await justifiedPage(async (gap) => {

      // ── WHY THIS COMBINATION ──
      if (result.combinationText) {
        sectionHeading(`Waarom jij ${extNameShown || result.name} bent`, green);
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
          pdf.text(sa.supportName || sa.group, col0x + 1, y + 2.5);
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
      } // end if(false) — removed content pages
      /* eslint-enable no-constant-condition */

      // ── Page 4: PERSOONLIJKHEIDSRAPPORT VERGELIJKING (OCEAN, IF-state) ──
      // Master Prompt v4.1 §5.4: NEVER model-derived OCEAN (D-10). Upload present →
      // uploaded-values table + 5 per-trait sections (O,C on p1; E,A,N on p2). No upload →
      // 1 page, all five together, NO numbers + explicit instrument-disclaimer.
      const hasOceanUpload = !!uploadedOceanScores;
      const OCEAN_DIMS_P = ['O', 'C', 'E', 'A', 'N'];
      const OCEAN_FULL_P = {
        O: t('resultsModal.ocean.O'), C: t('resultsModal.ocean.C'), E: t('resultsModal.ocean.E'),
        A: t('resultsModal.ocean.A'), N: t('resultsModal.ocean.N'),
      };
      const OCEAN_COLORS_P = { O: [167, 139, 250], C: [34, 211, 238], E: [103, 232, 249], A: [129, 140, 248], N: [196, 181, 253] };
      const oceanTraitOf = (letter) =>
        (displaySections || []).find(s => new RegExp('^\\**\\s*trait\\s+' + letter + '\\b', 'i').test(cleanTitle(s.title || '')));
      const oceanTraitSections = OCEAN_DIMS_P.map(oceanTraitOf).filter(Boolean);

      // OCEAN page subtitle (render-side).
      const oceanSubtitle = () => {
        pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...cyan);
        pdf.text(sectionTitle('ocean_subtitle', language).toUpperCase(), margin + 2, y);
        y += 7;
      };

      // Instrument disclaimer (heavy when no upload, lighter when upload present).
      const oceanDisclaimer = (heavy) => {
        const txt = heavy
          ? t('resultsModal.pdf.oceanPage.disclaimerHeavy')
          : t('resultsModal.pdf.oceanPage.disclaimerLight');
        pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic');
        const lines = pdf.splitTextToSize(txt, contentW - 10);
        const dH = lines.length * 3.6 + 5;
        ensureSpace(dH + 3);
        pdf.setFillColor(28, 22, 0);
        pdf.roundedRect(margin, y, contentW, dH, 1.5, 1.5, 'F');
        pdf.setFillColor(...amber);
        pdf.rect(margin, y, 2, dH, 'F');
        pdf.setTextColor(...amber);
        let dy = y + 4.5;
        for (const l of lines) { pdf.text(l, margin + 6, dy); dy += 3.6; }
        y += dH + 4;
      };

      // Uploaded-values table (render-side; ONLY when an external report was uploaded).
      const drawUploadedOceanTable = () => {
        if (!uploadedOceanScores) return;
        pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...blue);
        pdf.text(t('resultsModal.pdf.oceanPage.uploadedTableTitle'), margin + 2, y);
        y += 6;
        const labelW = 30, scoreColW = 16, barW = contentW - labelW - scoreColW - 4, barH = 4;
        OCEAN_DIMS_P.forEach(dim => {
          ensureSpace(8);
          const col = OCEAN_COLORS_P[dim];
          const score = Math.round(uploadedOceanScores[dim] || 0);
          pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...col);
          pdf.text(dim, margin + 2, y + 1.5);
          pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...white);
          pdf.text(OCEAN_FULL_P[dim], margin + 9, y + 1.5);
          const bx = margin + labelW;
          pdf.setFillColor(22, 22, 30);
          pdf.roundedRect(bx, y - 1.5, barW, barH, 1, 1, 'F');
          pdf.setFillColor(...col);
          pdf.roundedRect(bx, y - 1.5, Math.max((score / 100) * barW, 2), barH, 1, 1, 'F');
          pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...col);
          pdf.text(`${score}/100`, bx + barW + 3, y + 1.5);
          y += 8;
        });
        y += 2;
      };

      // ── PERSOONLIJKHEIDSRAPPORT VERGELIJKING — ONE section on ONE flow (Brief v2 Addendum A §2):
      //    title → subtitle → the render-side value table (upload only) → instrument disclaimer →
      //    the model's section, its trait blocks under their subheadings. This used to be two
      //    hard-coded blocks — O+C, then a forced new page for E+A+N — that only found the model's
      //    text when each trait came as its own "TRAIT X" section. Dutch reports never did that,
      //    so the traits glued onto CREATIEVE RESONANTIE and the value table stood here alone.
      //    Now the section breaks wherever its text runs out, like every other section, with one fixed
      //    break the owner asked for (2026-09-18): with an upload, E, A and N start on a fresh page. ──
      const oceanSection = (displaySections || []).find(s =>
        s.isComparison || COMPARISON_TITLE.test(cleanTitle(s.title || '')));
      // The model's own copy of the uploaded values duplicates the render-side table: drop those
      // value lines and its value-block heading; the trait prose stays.
      const OCEAN_NAME = '(?:openheid|ordelijkheid|consci[eë]ntieusheid|extraversie|meegaandheid|neuroticisme|openness|conscientiousness|extraversion|agreeableness|neuroticism)';
      const OCEAN_PAIR = new RegExp(`\\W*(?:[OCEAN]\\W+)?${OCEAN_NAME}\\W*\\s*[:=]\\s*\\d{1,3}\\s*(?:\\/\\s*100)?`, 'gi');
      const isOceanValueLine = (t) => { const s = t.replace(OCEAN_PAIR, ''); return s !== t && s.replace(/[\s|,;·*()-]/g, '') === ''; };
      const oceanBody = oceanSection
        ? oceanSection.content.split('\n').filter((l) => {
            const t = l.trim();
            if (hasOceanUpload && isOceanValueLine(t)) return false;
            return !/^ocean[\s-]*(?:gereedschap|tool|instrument)\b/i.test(bareHeading(t));
          }).join('\n').trim()
        : '';
      const endOceanCore = trackBlock('ocean_core');
      if (!isBeginnerPdf && (oceanBody || oceanTraitSections.length > 0 || hasOceanUpload)) {
        await justifiedPage(async (gap) => {
          sectionHeading(sectionTitle('ocean_page', language), blue);
          oceanSubtitle();
          if (hasOceanUpload) {
            drawUploadedOceanTable();
            gap();
            oceanDisclaimer(false);   // between the values table and the first trait
          } else {
            oceanDisclaimer(true);    // up top, before the tendency read (no table in this path)
          }
          gap();
          if (oceanBody) {
            // With an upload: O and C on the page with the values, E, A and N from a fresh page (owner,
            // 2026-09-18) — the one fixed break in this flow, at the Extraversie heading. Without an upload
            // there is no values table and the reads are short, so all five stay on one page (owner,
            // 2026-09-30); like any section, it only runs on if the text does not fit.
            const oceanLines = oceanBody.split('\n');
            const headOf = (l) => splitGluedHeading(l)?.heading ?? l;
            const eAt = oceanLines.findIndex((l) => isOceanMemberHeading(headOf(l)) && /extravers/i.test(bareHeading(headOf(l))));
            if (hasOceanUpload && eAt > 0) {
              writePdfMarkdown(oceanLines.slice(0, eAt).join('\n'), margin + 2, contentW - 4, cyan);
              if (y > margin) { pdf.addPage(); paintBg(); markPage(); y = margin; }
              writePdfMarkdown(oceanLines.slice(eAt).join('\n'), margin + 2, contentW - 4, cyan);
            } else {
              writePdfMarkdown(oceanBody, margin + 2, contentW - 4, cyan);
            }
          } else {
            // Legacy form: the traits as five separate "TRAIT X" sections.
            oceanTraitSections.forEach((s, i) => {
              renderSection(shownTitle(s), s.content, cyan, { small: true });
              if (i < oceanTraitSections.length - 1) gap();
            });
          }
        });
      }
      endOceanCore();

      // ── Page 5: PLASTISCHE MORFOLOGIE — engine D-curve chart + 3 reads ──
      // Master Prompt v4.1 §5.5: chart is render-side (engine register curves, ~30% page height),
      // then DE VORM + DE HARDWARE ONDER DRUK + DE OVERGANG NAAR DE STILLE STEM.
      const endMorphology = trackBlock('nb_morphology');
      // Tolerant matcher for the 3 morphology reads (vorm / hardware|druk / overgang). NO
      // "morfologie" fallback — that only matched the page-label echo "DE MORFOLOGIE", which is
      // a render-side note the model parrots, not a real section.
      const morphRank = (s) => {
        const t = cleanTitle(s.title || '').toLowerCase();
        if (/\bvorm\b/.test(t)) return 0;
        if (/hardware|onder\s+druk/.test(t)) return 1;
        if (/\bovergang\b/.test(t)) return 2;
        return -1;
      };
      const morphPage = (displaySections || [])
        .filter(s => morphRank(s) >= 0)
        .sort((a, b) => morphRank(a) - morphRank(b));
      const hasMorphChart = !!(morphChart && morphologyRef.current);
      // The D-curve chart, centred in its box, the caption under it. Beginner measures it first (`measure`: its
      // height, nothing drawn) so the chart and DE VORM land on one page; the capture is made once.
      let morphCapture = null;
      // `maxChartH` (Beginner only) shrinks the chart to that height, keeping its proportions; without it the chart is
      // drawn as it always was.
      const drawMorphChart = async ({ measure = false, maxChartH = 0 } = {}) => {
        try {
          if (!morphCapture) {
            const morphCanvas = await html2canvas(morphologyRef.current, {
              backgroundColor: '#060612', scale: 2, useCORS: true, logging: false,
            });
            morphCapture = { img: morphCanvas.toDataURL('image/jpeg', 0.85), ratio: morphCanvas.height / morphCanvas.width };
          }
          const capTxt = t('resultsModal.pdf.morph.captionRegister');

          const innerPad = 3;
          const MORPH_SCALE = 0.75;                         // 25% smaller than full width
          let chartW = (contentW - innerPad * 2) * MORPH_SCALE;
          let chartH = morphCapture.ratio * chartW;
          if (chartH > 101) { chartH = 101; }              // cap chart height (135 × 0.75)
          if (maxChartH > 0 && chartH > maxChartH) { chartW *= maxChartH / chartH; chartH = maxChartH; }
          const boxW = chartW + innerPad * 2;
          const boxH = chartH + innerPad * 2;
          const boxX = margin + (contentW - boxW) / 2;     // centered
          pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic');
          const capLines = pdf.splitTextToSize(sanitizePdf(capTxt), contentW);
          const lineH = 3.6;
          if (measure) return boxH + 4 + capLines.length * lineH + 5;
          ensureSpace(boxH + 4);
          // Bordered box around the (centered) chart
          pdf.setDrawColor(...cyan);
          pdf.setLineWidth(0.4);
          pdf.rect(boxX, y, boxW, boxH);
          pdf.addImage(morphCapture.img, 'JPEG', boxX + innerPad, y + innerPad, chartW, chartH);
          y += boxH + 4;
          // Caption below the chart, full width
          pdf.setTextColor(...mutedGray);
          for (const cl of capLines) { ensureSpace(lineH); pdf.text(cl, margin, y + 2); y += lineH; }
          y += 5;
        } catch { if (measure) return 4; y += 4; }
        return 0;
      };
      if (!isBeginnerPdf && (hasMorphChart || morphPage.length > 0)) {
        pdf.addPage(); paintBg(); markPage(); y = margin;
        sectionHeading(sectionTitle('morphology_page', language), cyan);

        // Chart FULL-WIDTH (so the in-chart labels are readable), caption BELOW it.
        if (hasMorphChart) await drawMorphChart();

        // Master Prompt v4.3 §5.5 — TWO pages: Page A = chart + DE VORM; Page B = DE HARDWARE
        // ONDER DRUK + DE OVERGANG (no chart). Split the reads accordingly.
        const pageAReads = morphPage.filter(s => morphRank(s) === 0);   // DE VORM
        const pageBReads = morphPage.filter(s => morphRank(s) >= 1);    // Hardware + Overgang (+ fallback)
        // Page A: DE VORM directly under the chart — no bottom padding, let the text flow
        // down to the page edge instead of breaking early.
        const savedNPBmorph = noPageBreak; noPageBreak = true;
        pageAReads.forEach((section, i) => {
          renderSection(shownTitle(section),relabelProse(section.content, language), cyan);
          if (i < pageAReads.length - 1) hr();
        });
        noPageBreak = savedNPBmorph;
        // Page B: the deeper mechanism reads on a fresh page (no chart). DE HARDWARE ONDER DRUK and
        // DE OVERGANG flow together — the Overgang is the hinge of the pressure read and follows
        // straight on; an exceptionally long one may run over, never jump (Addendum A §4).
        if (pageBReads.length > 0) {
          pdf.addPage(); paintBg(); markPage(); y = margin;
          // (no page-level "— vervolg" heading; the section headings below carry the page)
          pageBReads.forEach((section, i) => {
            renderSectionFlow(shownTitle(section), relabelProse(section.content, language), cyan);
            if (i < pageBReads.length - 1) hr();
          });
        }
      }
      endMorphology();

      // ── Keuze/Echo graph (payload instruction v7 §1.4) — replaces Dual-Core in the same footprint ──
      // Per hardware group two bars: Gekozen (one segment, keuze + passief — a Layer-1 recognition is a
      // direct choice too, owner 2026-10-13) and Ontvangen (eigen echo · wiel-echo, stacked), one
      // shared y-scale whose top is the tallest bar on the page. Neutral hues on
      // purpose: the segments mix channels, so the line colours would mislead. No numbers in the
      // segments, no percentages, no caption beyond the legend.
      const KE_FOOTPRINT_H = 86.6; // the Dual-Core chart's height under its heading (legend 7 + 6 rows × 12.6 + 4)
      const drawKeuzeEcho = (groups) => {
        const order = ['Ruling', 'Relational', 'Seeker', 'Chaos', 'Abstract', 'Agency'];
        const top = y;
        const blendBg = (c, a) => c.map((v, i) => Math.round(v * a + bg[i] * (1 - a)));
        const chosen = [255, 254, 240];   // cream — text.primary
        const received = [148, 163, 184]; // slate — text.slate.400
        const fill = { gekozen: chosen, eigen_echo: received, wiel_echo: blendBg(received, 0.45) };
        const segs = ['gekozen', 'eigen_echo', 'wiel_echo'];

        // Legend: one row if it fits, else Gekozen over Ontvangen.
        const legend = tArray('resultsModal.pdf.keuzeEcho.legend');
        pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
        const sw = 3, swGap = 1.5, itemGap = 6;
        const itemW = legend.map((l) => sw + swGap + pdf.getTextWidth(sanitizePdf(l)));
        const rows = itemW.reduce((a, b) => a + b, 0) + itemGap * 2 <= contentW ? [[0, 1, 2]] : [[0], [1, 2]];
        let ly = top + 1;
        rows.forEach((row) => {
          let lx = margin;
          row.forEach((i) => {
            pdf.setFillColor(...fill[segs[i]]);
            pdf.rect(lx, ly - 2.4, sw, sw, 'F');
            pdf.setTextColor(...white);
            pdf.text(sanitizePdf(legend[i]), lx + sw + swGap, ly);
            lx += itemW[i] + itemGap;
          });
          ly += 5;
        });

        // Plot area, ending where the Dual-Core chart ended.
        const axisW = 10, labelH = 7;
        const plotL = margin + axisW, plotR = margin + contentW;
        const plotT = ly + 3, plotB = top + KE_FOOTPRINT_H - 4 - labelH, plotH = plotB - plotT;
        const num = (d, k) => Math.max(0, Number(d?.[k]) || 0);
        const val = (d, k) => (k === 'gekozen' ? num(d, 'keuze') + num(d, 'passief') : num(d, k));
        const maxBar = Math.max(0, ...order.flatMap((g) => {
          const d = groups[g];
          return [val(d, 'gekozen'), val(d, 'eigen_echo') + val(d, 'wiel_echo')];
        }));
        const yOf = (v) => plotB - (v / maxBar) * plotH;

        if (maxBar > 0) {
          const raw = maxBar / 4, pow = 10 ** Math.floor(Math.log10(raw));
          const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw);
          pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
          for (let v = step; v <= maxBar + 1e-9; v += step) {
            pdf.setDrawColor(40, 40, 62); pdf.setLineWidth(0.1);
            pdf.line(plotL, yOf(v), plotR, yOf(v));
            pdf.setTextColor(...dimWhite);
            pdf.text(String(Math.round(v * 10) / 10), plotL - 1.5, yOf(v) + 1, { align: 'right' });
          }
        }
        pdf.setDrawColor(...mutedGray); pdf.setLineWidth(0.2);
        pdf.line(plotL, plotB, plotR, plotB);

        const slotW = (plotR - plotL) / order.length;
        const barW = Math.min(8, slotW * 0.3), pairGap = 1.2;
        order.forEach((g, i) => {
          const d = groups[g] || {};
          const cx = plotL + slotW * (i + 0.5);
          const stack = (x, keys) => {
            let yb = plotB;
            keys.forEach((k) => {
              const h = maxBar > 0 ? (val(d, k) / maxBar) * plotH : 0;
              if (h > 0) { pdf.setFillColor(...fill[k]); pdf.rect(x, yb - h, barW, h, 'F'); }
              yb -= h;
            });
          };
          stack(cx - pairGap / 2 - barW, ['gekozen']);
          stack(cx + pairGap / 2, ['eigen_echo', 'wiel_echo']);
          // A group with totaal 0 keeps its label and shows empty bars.
          pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...white);
          pdf.text(g, cx, plotB + 5, { align: 'center' });
        });
        y = top + KE_FOOTPRINT_H;
      };

      // ── DUAL-CORE DYNAMICS + RADAR CHART (page 5) ──
      const endDualCore = trackBlock('dual_core');
      if (!isBeginnerPdf) await justifiedPage(async (gap) => {
      const savedNPBdc = noPageBreak; noPageBreak = true; // no bottom padding — let text flow to edge
      // Orange titles on this page (owner, 17 Oct 2026): yellow belongs to De Cognitieve Driehoek's page now.
      const keuzeEcho = enginePayload?.keuze_echo;
      if (keuzeEcho) {
        sectionHeading(t('resultsModal.pdf.keuzeEcho.title'), orange);
        drawKeuzeEcho(keuzeEcho);
        hr();
      } else if (result.subgroups && result.subgroups.length > 0) {
        sectionHeading(t('resultsModal.pdf.dualCore.title'), orange);

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
          Ruling:     { network: t('resultsModal.groups.ruling.network'),     drive: t('resultsModal.groups.ruling.drive') },
          Relational: { network: t('resultsModal.groups.relational.network'), drive: t('resultsModal.groups.relational.drive') },
          Seeker:     { network: t('resultsModal.groups.seeker.network'),     drive: t('resultsModal.groups.seeker.drive') },
          Chaos:      { network: t('resultsModal.groups.chaos.network'),      drive: t('resultsModal.groups.chaos.drive') },
          Abstract:   { network: t('resultsModal.groups.abstract.network'),   drive: t('resultsModal.groups.abstract.drive') },
          Agency:     { network: t('resultsModal.groups.agency.network'),     drive: t('resultsModal.groups.agency.drive') },
        };

        // Visual scale — the bar chart is drawn 10% smaller overall (shorter/thinner bars,
        // tighter rows). Font sizes are NOT scaled, so the text stays the same size.
        const VIS = 0.9;
        const MAX_TOTAL = 36;
        const labelW    = 38;
        const scoreW    = 22;
        const colGap    = 3;
        const barAreaW  = (contentW - labelW - scoreW - colGap * 2) * VIS;
        const barX      = margin + labelW + colGap;
        const scoreX    = barX + barAreaW + colGap;
        const barH      = 2.5 * VIS;

        result.subgroups.forEach(sg => {
          const hasBonus = sg.harmonyPoints > 0 || sg.shadowPoints > 0;
          const rowH = (14 + (hasBonus ? 5 : 0)) * VIS;
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

      // ── Master Prompt v4.1 §5.8: under the dual-core chart, the 3 compressed reads —
      //    Alchemie van Individuatie + Neurale Schakelbord + Ontologische Evolutie.
      //    (Dual-Core narrative + Cognitieve Driehoek are dropped per spec.)
      {
        const yellowOrder = ['alchemie', 'schakelbord', 'ontologi'];
        const yellowOnPage = (displaySections || [])
          .filter(s => {
            const t = cleanTitle(s.title || '').toLowerCase();
            if (/cognitieve\s*driehoek/.test(t)) return false; // its own page, even with "alchemie" in a subtitle
            return t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi');
          })
          .sort((a, b) => {
            const ta = cleanTitle(a.title || '').toLowerCase();
            const tb = cleanTitle(b.title || '').toLowerCase();
            const ix = (t) => yellowOrder.findIndex(k => t.includes(k));
            return ix(ta) - ix(tb);
          });
        yellowOnPage.forEach((section, i) => {
          gap();
          renderSection(shownTitle(section),section.content, orange);
          if (i < yellowOnPage.length - 1) hr();
        });
      }
      noPageBreak = savedNPBdc;
      });
      endDualCore();

      // ── Reusable radar-chart renderer (rasterise radarRef into the current page) ──
      // Used on the Schaduw/Blindspot page (p9) per the page-map. Returns true if drawn.
      const renderRadarChart = async (maxH = 0, { caption = true } = {}) => {
        if (!radarRef.current) return false;
        if (caption) sectionHeading(t('resultsModal.pdf.radar.heading'), green);
        try {
          const radarCanvas = await html2canvas(radarRef.current, {
            backgroundColor: null, scale: 3, useCORS: true, logging: false,
          });
          const radarImg = radarCanvas.toDataURL('image/jpeg', 0.85);
          const radarW = contentW;
          const radarH = (radarCanvas.height / radarCanvas.width) * radarW;
          const availH = maxH > 0 ? maxH : H - y - margin;
          const finalH = Math.min(radarH, availH);
          const finalW = finalH === radarH ? radarW : (radarCanvas.width / radarCanvas.height) * finalH;
          const offsetX = margin + (contentW - finalW) / 2;
          const borderPad = 2;
          pdf.setDrawColor(...green);
          pdf.setLineWidth(0.5);
          pdf.rect(margin, y - borderPad, contentW, finalH + borderPad * 2);
          pdf.addImage(radarImg, 'JPEG', offsetX, y, finalW, finalH);
          y += finalH + 6;
          return true;
        } catch {
          y += 4;
          return false;
        }
      };

      // ── GROEP DYNAMIEK (legacy) — own page if it exists; v4 emits no such section so
      //    this block is normally empty and pruned. Radar + resonantie moved off it. ──
      const endGroepRadar = trackBlock('groep_radar');
      const groepDynSection = displaySections?.find(s =>
        s.title?.toLowerCase().includes('groep dynamiek') ||
        s.title?.toLowerCase().includes('neurobiologische interpretatie')
      );
      if (groepDynSection) {
        pdf.addPage();
        paintBg();
        y = margin;
        markPage();
        sectionHeading(t('resultsModal.pdf.groepDyn.heading'), cyan);
        writePdfMarkdown(groepDynSection.content, margin + 2, contentW - 4);
        y += 3;
        hr();
      }
      endGroepRadar();

      // ── ANALYSIS SECTIONS (dedicated page) ──
      if (displaySections && displaySections.length > 0) {
        // Filter out Groep Dynamiek (rendered on page 5), report comparison (own page 9), and resonantie (below radar)
        const mainSections = displaySections.filter(s =>
          !s.isComparison &&
          !s.isResonantie &&
          !s.title?.toLowerCase().includes('groep dynamiek') &&
          !s.title?.toLowerCase().includes('neurobiologische interpretatie') &&
          !COMPARISON_TITLE.test(s.title || '') &&
          !/^1[23]\s*[ab][\s.:]/i.test(s.title || '') &&
          !/professionele\s+resonantie|creatieve\s+resonantie/i.test(s.title || '') &&
          // De Extensie renders on the resonance page (v5.2 §5.7).
          !isExtensionTitle(s.title) &&
          // OCEAN per-trait sections render on the OCEAN page — drop from prose catch-all.
          !/^\**\s*trait\s+[ocean]\b/i.test(cleanTitle(s.title || '')) &&
          // Het OCEAN-profiel narrative / OCEAN-gereedschap subtitle / OCEAN intro — these are
          // render-side titles, not narrative sections. When an upload is present the AI may also
          // emit an OCEAN profile introduction; never render it (the OCEAN page is render-driven).
          // Likewise the machine block (PROFIEL DATA VOOR AI VERWERKING): the renderer draws its
          // own authoritative `data` page — drop the AI's copy to avoid a duplicate.
          !RENDER_SIDE_TITLE.test(cleanTitle(s.title || '')) &&
          // "Radar-lezing": never render — the radar chart covers it.
          !RADAR_READING_TITLE.test(s.title || '') &&
          // Stray AI-emitted sections that aren't part of the page-map — never render.
          !STRAY_TITLE.test(s.title || '') &&
          // v3 leftover the model sometimes reverts to (Aarde/Water/Lucht/Vuur/Ether) — not a
          // v4.1 section; §5.8 is Alchemie/Schakelbord/Ontologie. Never render.
          !V3_ELEMENTS_TITLE.test(cleanTitle(s.title || '')) &&
          // Drop empty/ghost sections (a header the AI emitted with no real body) so they
          // never render a content-less page — e.g. a stray "Profiel Elementen" umbrella.
          (s.content || '').replace(/[\s*#>_~`+.-]/g, '').length > 0
        );
        if (mainSections.length > 0) {
          const getPdfSectionColor = (title) => {
            const t = cleanTitle(title || '').toLowerCase();
            if (t.includes('identiteit') || t.includes('verklaring') || t.includes('waarom')) return green;
            if (t.includes('essentie') || t.includes('schaduw')) return purple;
            if (t.includes('vermenigvuldiging') || t.includes('prompt') || t.includes('agent')) return orange;
            if (t.includes('blindspot')) return red;
            if (t.startsWith('trait ') || /\bvorm\b/.test(t) || /hardware|onder\s+druk/.test(t) || /\bovergang\b/.test(t) || /morfologie/.test(t)) return cyan;
            if (/\b(reflectie|motivatie|beweging)\b/.test(t)) return purple;
            if (/cognitieve\s*driehoek|drogredenen\s+van\s+de\s+driehoek/.test(t)) return triYellow;
            if (t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi')) return orange;
            if (t.includes('resonantie')) return green;
            return green; // fallback
          };

          // Separate intro/disclaimer and AI agent prompt — they always share one dedicated page
          const regularSections = mainSections.filter(s =>
            !s.isAgentPrompt &&
            !/ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt|reflectie.*prompt|ai.*reflectie/i.test(s.title) &&
            !/introductie|introduction/i.test(s.title || '')
          );
          const disclaimerSection = mainSections.find(s => /introductie|introduction/i.test(s.title || ''));
          const agentSection = mainSections.find(s =>
            s.isAgentPrompt || /ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt|reflectie.*prompt|ai.*reflectie/i.test(s.title)
          );

          // ── Group sections by page (Master Prompt v4.1 §5, titles = parser-tags) ──
          // p1 identity+verklaring, p2 essence+vermenigvuldiging, p3 schaduw+blindspot,
          // p5 morfologie (vorm/hardware/overgang), p6 stille (reflectie/motivatie/beweging),
          // p7 resonantie, p8 alchemie/schakelbord/ontologie.
          const isGroup1a = (title) => {
            const t = cleanTitle(title || '').toLowerCase();
            return t.includes('identiteit') || t.includes('verklaring') || t.includes('waarom') ||
                   t.includes('essentie') || t.includes('vermenigvuldiging');
          };
          const isGroup1b = (title) => {
            const t = cleanTitle(title || '').toLowerCase();
            return t.includes('schaduw') || t.includes('blindspot');
          };
          const isGroup2 = (title) => {
            const t = cleanTitle(title || '').toLowerCase();
            return t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi');
          };
          // Tolerant morphology matcher — the model doesn't always emit the verbatim tags.
          // Matches De Vorm / De Hardware onder Druk / De Overgang…, plus a single
          // "Plastische Morfologie" fallback. None of the other section titles contain these.
          const isMorph = (title) => {
            const t = cleanTitle(title || '').toLowerCase();
            return /\bvorm\b/.test(t) || /hardware|onder\s+druk/.test(t) ||
                   /\bovergang\b/.test(t) || /morfologie/.test(t);
          };
          const isStille = (title) => {
            const t = cleanTitle(title || '').toLowerCase();
            // Reflectie / Motivatie / Beweging — match the word anywhere so "De Reflectie",
            // "Reflectie:" etc. all hit (NOT anchored to the start). No other v4.1 title
            // contains these words; "De Overgang naar de Stille Stem" is a morphology read.
            return /\b(reflectie|motivatie|beweging)\b/.test(t);
          };
          // De Cognitieve Driehoek (owner, 17 Oct 2026): its own page, after De Stille Stem.
          const isTriangle = (title) => /cognitieve\s*driehoek|drogredenen\s+van\s+de\s+driehoek/.test(cleanTitle(title || '').toLowerCase());
          // The triangle claims its section first: a subtitle may name a superpower ("Emotionele alchemie")
          // that the keyword collectors below would otherwise also claim.
          const triangleSections = regularSections.filter(s => isTriangle(s.title));
          const pageSections    = regularSections.filter(s => !isTriangle(s.title));
          const group1aSections = pageSections.filter(s => isGroup1a(s.title));
          const group1bSections = pageSections.filter(s => isGroup1b(s.title));
          const group2Sections  = pageSections.filter(s => isGroup2(s.title));
          const morphSections   = pageSections.filter(s => isMorph(s.title));
          const stilleSections  = pageSections.filter(s => isStille(s.title));
          // STRICT ALLOWLIST: every real v4.3 narrative section is claimed by a specific page
          // collector (identity/essence/shadow/OCEAN-traits/morph/stille/triangle/resonance/yellow/ai-prompt).
          // Anything left over is NOT part of the spec — a fabricated/echoed section — so we DROP it
          // entirely rather than render it on a stray "others" page.
          const otherSections = pageSections.filter(s =>
            !isGroup1a(s.title) && !isGroup1b(s.title) && !isGroup2(s.title) &&
            !isMorph(s.title) && !isStille(s.title));
          if (otherSections.length > 0) {
            console.warn('[GFL] dropped non-spec sections (strict allowlist):', otherSections.map(s => s.title));
          }

          // ── Page 1: Identiteit + Verklaring   Page 2: Essentie + Vermenigvuldiging ──
          // Ordered so the reader sees Identiteit before Verklaring, Essentie before Vermenigvuldiging.
          const g1aTitle = (s) => cleanTitle(s.title || '').toLowerCase();
          const identityPage = group1aSections
            .filter(s => g1aTitle(s).includes('identiteit') || g1aTitle(s).includes('verklaring') || g1aTitle(s).includes('waarom'))
            .sort((a, b) => (g1aTitle(a).includes('identiteit') ? 0 : 1) - (g1aTitle(b).includes('identiteit') ? 0 : 1));
          const essencePage = group1aSections
            .filter(s => g1aTitle(s).includes('essentie') || g1aTitle(s).includes('vermenigvuldiging'))
            .sort((a, b) => (g1aTitle(a).includes('essentie') ? 0 : 1) - (g1aTitle(b).includes('essentie') ? 0 : 1));

          // ── Fixed Meta-Disclaimer (purple blockquote) before section 1; `measure` returns its height ──
          const drawMetaDisclaimer = ({ measure = false } = {}) => {
            pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic');
            if (measure) return pdf.splitTextToSize(t('resultsModal.pdf.metaDisclaimer'), contentW - 8).length * 3.5 + 4 + 8;
            ensureSpace(20);
            pdf.setFillColor(20, 16, 36);
            const disclaimerX = margin;
            const disclaimerW = contentW;
            const disclaimerText = t('resultsModal.pdf.metaDisclaimer');
            pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic');
            const disclaimerLines = pdf.splitTextToSize(disclaimerText, disclaimerW - 8);
            const dlH = disclaimerLines.length * 3.5 + 4;
            pdf.rect(disclaimerX, y, disclaimerW, dlH, 'F');
            // Top bar instead of left bar
            pdf.setFillColor(249, 115, 22);
            pdf.rect(disclaimerX, y, disclaimerW, 0.75, 'F');
            pdf.setTextColor(200, 200, 215);
            let dlY = y + 5;
            for (const line of disclaimerLines) {
              pdf.text(line, disclaimerX + 5, dlY);
              dlY += 3.5;
            }
            y += dlH + 8; // doubled padding between the meta-disclaimer and the first section
            return 0;
          };

          const endGroup1a = trackBlock('group1a');
          // ── Page 7: Identiteit + Waarom (with the fixed Meta-Disclaimer on top) ──
          if (!isBeginnerPdf && identityPage.length > 0) {
            await justifiedPage(async (gap) => {
            const savedNPB = noPageBreak;
            noPageBreak = true; // no bottom padding — let the text flow down to the page edge

            drawMetaDisclaimer();
            gap();

            identityPage.forEach((section, i) => {
              renderSection(shownTitle(section),section.content, getPdfSectionColor(section.title));
              if (i < identityPage.length - 1) { hr(); gap(); }
            });
            noPageBreak = savedNPB;
            });
          }
          // ── Page 2: Essentie + Vermenigvuldiging (intro + 3 labeled aspects each) ──
          // Vermenigvuldiging always stays on Essentie's page, however far it runs past the bottom
          // margin — the model sometimes writes a line or two more than the page holds, and the
          // margin takes them (owner, 2026-09-19).
          if (!isBeginnerPdf && essencePage.length > 0) {
            await justifiedPage(async (gap) => {
            const savedNPB = noPageBreak;
            noPageBreak = true; // no bottom padding — let the text flow down to the page edge
            essencePage.forEach((section, i) => {
              renderSection(shownTitle(section), section.content, getPdfSectionColor(section.title));
              if (i < essencePage.length - 1) { hr(); gap(); }
            });
            noPageBreak = savedNPB;
            });
          }
          endGroup1a();

          // ── Page 3: Schaduw + Blindspot, then the TNM wheel in the leftover space ──
          // Master Prompt v6.1 §5.3: no radar on this page (the wheel lives on the resonance page,
          // §5.7) — a full text page. The TNM wheel is bottom-anchored and drawn at an absolute
          // position (no ensureSpace) so it sits in the space below the text and may bleed into the
          // bottom spacer — never page-breaks.
          const endGroup1b = trackBlock('group1b');
          // Order: Schaduw before Blindspot.
          const shadowBlindspotSections = group1bSections.sort((a, b) =>
            (cleanTitle(a.title || '').toLowerCase().includes('schaduw') ? 0 : 1) -
            (cleanTitle(b.title || '').toLowerCase().includes('schaduw') ? 0 : 1));
          // The radar element, rasterised on the resonance page (§5.7) at the size it had here.
          const radarEl = pdfRadarRef.current || radarRef.current;
          const drawRadar = async () => {
            if (!radarEl) return;
            try {
              const canvas = await html2canvas(radarEl, {
                backgroundColor: '#060612', scale: 2, useCORS: true, logging: false,
              });
              const img = canvas.toDataURL('image/jpeg', 0.85);
              const maxH = 76.5;                             // the size it had on the Schaduw/Blindspot page (kept)
              let drawH = (canvas.height / canvas.width) * contentW;
              let drawW = contentW;
              if (drawH > maxH) { drawH = maxH; drawW = (canvas.width / canvas.height) * drawH; }
              const offsetX = margin + (contentW - drawW) / 2;
              pdf.setDrawColor(...green);
              pdf.setLineWidth(0.5);
              pdf.rect(offsetX, y, drawW, drawH);
              pdf.addImage(img, 'JPEG', offsetX, y, drawW, drawH);
              y += drawH + 8;
            } catch { y += 4; }
          };
          // The TNM wheel, the static model image, in the room below the text down to `bottom`: at most FIXED_TNM_H,
          // shrunk when the page is fuller, skipped below `minH`. Returns whether it was drawn.
          const drawTnmWheel = async ({ bottom = H - 6, minH = 18 } = {}) => {
            try {
              const tnmEl = await new Promise((res, rej) => {
                const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = tnmWheelImg;
              });
              const availH = bottom - (y + 1);                   // room down to ~6mm from page edge
              if (availH > minH) {
                const FIXED_TNM_H = 65;                           // fixed height: 50 × 1.3 — the radar left this page, the wheel takes the room
                const finalH = Math.min(FIXED_TNM_H, availH);    // fixed, only shrinks if the page is full (never clips)
                const finalW = (tnmEl.naturalWidth / tnmEl.naturalHeight) * finalH;
                const offsetX = margin + (contentW - finalW) / 2;
                y += 1;                                          // tighter gap under De Blindspot (~70% of before)
                pdf.addImage(tnmWheelImg, 'PNG', offsetX, y, finalW, finalH);
                y += finalH + 4;
                return true;
              }
            } catch { /* image load failed — skip */ }
            return false;
          };
          if (!isBeginnerPdf && group1bSections.length > 0) {
            await justifiedPage(async (gap) => {
            // Schaduw + Blindspot — full text page, no radar (§5.3)
            for (let gi = 0; gi < shadowBlindspotSections.length; gi++) {
              const section = shadowBlindspotSections[gi];
              renderSection(shownTitle(section),section.content, getPdfSectionColor(section.title));
              if (gi < shadowBlindspotSections.length - 1) { hr(); gap(); }
            }
            // ── TNM WHEEL — the static model image (same asset/size as page 5) placed in the
            //    leftover space below the text. Static image → no capture/clip risk. ──
            await drawTnmWheel();
            });
          }
          endGroup1b();

          // ── Page 6: De Stille Stem — Reflectie + Motivatie + Beweging ──
          const endStille = trackBlock('nb_stille');
          const stilleOrder = ['reflectie', 'motivatie', 'beweging'];
          const stillePage = stilleSections.sort((a, b) => {
            const ix = (s) => stilleOrder.findIndex(k => cleanTitle(s.title || '').toLowerCase().includes(k));
            return ix(a) - ix(b);
          });
          // A page break before REFLECTIE, then REFLECTIE, MOTIVATIE and BEWEGING together on that one
          // page — the three voices are never split over two pages (Brief v2 Addendum A §4; at budget
          // they are 790 words, the densest measured page carried 852).
          if (!isBeginnerPdf && stillePage.length > 0) {
            await justifiedPage(async (gap) => {
            const savedNPB = noPageBreak;
            noPageBreak = true; // no bottom padding — let the text flow down to the page edge
            // No page title — each read gets its own "De Stille Stem — <read>" header instead.
            stillePage.forEach((section, i) => {
              renderSection(t('resultsModal.labels.stilleStemPrefix') + cleanTitle(shownTitle(section)),section.content, purple);
              if (i < stillePage.length - 1) { hr(); gap(); }
            });
            noPageBreak = savedNPB;
            });
          }
          endStille();

          // ── Page 6b (Master Prompt v7.2 page 5.7b; Backend Task "Triangle Page" v0.1 §2–3): between De Stille
          //    Stem and the Hardware Data page — the triangle figure on top (≈ 38 % of the content height, as the
          //    radar on the resonance page), its caption, then DE COGNITIEVE DRIEHOEK and DE DROGREDENEN VAN DE
          //    DRIEHOEK with yellow titles. Overflow as on the resonance page: the figure keeps its size and the
          //    text spills onto the next page, flowing (never leaving this page half empty). No section from the
          //    model, no page; no triangle facts from the server (an older replay), no figure. ──
          const endTriangle = trackBlock('nb_triangle');
          if (!isBeginnerPdf && triangleSections.length > 0) {
            const triOrder = (s) => (/drogredenen/i.test(cleanTitle(s.title || '')) ? 1 : 0);
            const ordered = triangleSections.slice().sort((a, b) => triOrder(a) - triOrder(b));
            const writeText = () => ordered.forEach((section, i) => {
              if (i > 0) hr();
              renderSectionFlow(shownTitle(section), section.content, triYellow);
            });
            // One page, always (owner, 19 Oct): the text is measured first on a throwaway page; the figure takes
            // what is left (at most its own size, at least 55 % of it), and the text then runs to the page's edge
            // with no page break — never onto a next page.
            let figH = TRI_FIG_H;
            if (triangleFigure?.main) {
              const savedY = y, savedNPB = noPageBreak, savedPWC = new Set(pagesWithContent);
              pdf.addPage(); paintBg();
              const tmpPg = pdf.internal.getNumberOfPages();
              y = margin; noPageBreak = true;
              writeText();
              const textH = y - margin;
              pdf.deletePage(tmpPg);
              pagesWithContent.clear(); savedPWC.forEach((p) => pagesWithContent.add(p));
              y = savedY; noPageBreak = savedNPB;
              const captionH = 4.2 + (triangleFigure.top?.length ? 3.8 : 0) + (triangleFigure.others?.length ? 3.8 : 0) + 3 + 1;
              const room = (H - 2 * margin) - captionH - textH;
              figH = Math.max(TRI_FIG_H * 0.55, Math.min(TRI_FIG_H, room));
            }
            await justifiedPage(async () => {
              const savedNPB = noPageBreak;
              noPageBreak = true;
              if (triangleFigure?.main) drawTriangleFigure(triangleFigure, figH);
              writeText();
              noPageBreak = savedNPB;
            });
          }
          endTriangle();

          // ── Resonantie page (§5.7): the radar wheel at the top (moved here from the
          //    Schaduw/Blindspot page, same size), then De Extensie + Creatieve Resonantie. The
          //    Main/Support portrait circles below only draw when room is left above the text —
          //    with the radar there, at budget, there is none. ──
          const resonanceRank = (s) => (isExtensionTitle(s.title) ? 0 : /professionele/i.test(s.title || '') ? 1 : 2);
          const resonanceSections = (displaySections || []).filter(s =>
            /professionele\s+resonantie|creatieve\s+resonantie/i.test(s.title || '') || isExtensionTitle(s.title)
          ).sort((a, b) => resonanceRank(a) - resonanceRank(b));
          const endResonance = trackBlock('nb_resonance');
          if (!isBeginnerPdf && (resonanceSections.length > 0 || (result.mainArchetype && result.secondaryArchetype) || radarEl)) {
            await justifiedPage(async (gap) => {
            // Radar wheel first — render-side, no caption, no "radar-lezing" section (§5.7).
            await drawRadar();
            // The two archetype images (NO header, name under each) sit ABOVE the text, sized to
            // fill the space the text won't use. The text height is measured EXACTLY by rendering
            // it on a throwaway page first (the real render, not a word estimate), so the fit is
            // reliable regardless of the model's length.
            let resoTextH = 0;
            if (resonanceSections.length > 0) {
              const savedY = y, savedNPB = noPageBreak, savedPWC = new Set(pagesWithContent);
              pdf.addPage(); paintBg();
              const tmpPg = pdf.internal.getNumberOfPages();
              y = margin; noPageBreak = true;
              resonanceSections.forEach((section, i) => {
                renderSection(shownTitle(section),section.content, green);
                if (i < resonanceSections.length - 1) hr();
              });
              resoTextH = y - margin;
              noPageBreak = savedNPB;
              pdf.deletePage(tmpPg);
              pagesWithContent.clear(); savedPWC.forEach(p => pagesWithContent.add(p));
              y = savedY;
            }

            // Images at the top, filling the space above the text.
            if (result.mainArchetype && (result.secondaryArchetype || result._secondaryKey)) {
              try {
                const supportKey = result.secondaryArchetype || result._secondaryKey;
                // Each circle shows its archetype paired with its green-line partner (e.g.
                // Ruler × Judge) — the 132-matrix combination inside its own hardware group.
                const greenPartner = (k) => {
                  const key = String(k || '').toUpperCase();
                  return (GROUP_TO_ARCHETYPES[ARCHETYPE_TO_GROUP[key]] || []).find((m) => m !== key);
                };
                // Same exact-variant rule as the cover: the toggle's choice, never the other variant.
                const mainImgSrc = resolvePortrait(result.mainArchetype, greenPartner(result.mainArchetype), portraitVariant, { fallback: false }).url;
                const supImgSrc = resolvePortrait(supportKey, greenPartner(supportKey), portraitVariant, { fallback: false }).url;
                if (mainImgSrc && supImgSrc) {
                  const [mainEl, supEl] = await Promise.all([
                    new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = mainImgSrc; }),
                    new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = supImgSrc; }),
                  ]);
                  const circleClip = (imgEl, size) => {
                    const c = document.createElement('canvas');
                    c.width = size; c.height = size;
                    const cx = c.getContext('2d');
                    cx.fillStyle = '#060612'; cx.fillRect(0, 0, size, size);
                    cx.beginPath(); cx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); cx.closePath(); cx.clip();
                    cx.drawImage(imgEl, 0, 0, size, size);
                    return c.toDataURL('image/jpeg', 0.85);
                  };
                  const imgGap = 6;
                  const halfW = (contentW - imgGap) / 2;
                  const areaTop = y;
                  // Space above the text (text height reserved below); cap to half-width so the two
                  // circles stay side-by-side; leave ~6mm under for the name labels.
                  const availableAbove = (H - margin) - areaTop - resoTextH - 8;
                  const dim = Math.min(halfW, availableAbove - 6);
                  if (dim >= 28) {
                    // Main (left, purple border)
                    const mX = margin + (halfW - dim) / 2;
                    pdf.addImage(circleClip(mainEl, 600), 'JPEG', mX, areaTop, dim, dim);
                    pdf.setDrawColor(...purple); pdf.setLineWidth(1);
                    pdf.circle(mX + dim / 2, areaTop + dim / 2, dim / 2, 'S');
                    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...purple);
                    pdf.text(result.mainName || '', margin + halfW / 2, areaTop + dim + 4, { align: 'center' });
                    // Support (right, orange border)
                    const rX = margin + halfW + imgGap;
                    const sX = rX + (halfW - dim) / 2;
                    pdf.addImage(circleClip(supEl, 600), 'JPEG', sX, areaTop, dim, dim);
                    pdf.setDrawColor(...orange); pdf.setLineWidth(1);
                    pdf.circle(sX + dim / 2, areaTop + dim / 2, dim / 2, 'S');
                    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...orange);
                    pdf.text(result.secondaryName || '', rX + halfW / 2, areaTop + dim + 4, { align: 'center' });
                    y = areaTop + dim + 9; // text starts below the images + names
                  }
                }
              } catch { /* image load failed — skip */ }
            }

            // Text below the images.
            resonanceSections.forEach((section, i) => {
              renderSection(shownTitle(section),section.content, green);
              if (i < resonanceSections.length - 1) { hr(); gap(); }
            });
            });
          }
          endResonance();

          // ── Beginner (Level Routing v0.1 §5.3; owner, 22 Oct 2026): the report's sections in v7.3 order — without
          //    De Overgang and De Stille Stem — as ONE flow instead of a fixed page per group. The text is shorter and
          //    keeps Leerling's type size, so pages are filled: a section stays on the page it starts on when it fits
          //    there whole, else it opens the next page; a figure always stays with the section under it (radar →
          //    De Extensie, D-curve → De Vorm, triangle → De Cognitieve Driehoek, Hardware Data → De Alchemie), the TNM
          //    wheel with De Blindspot. Titles keep their Leerling colours. ──
          const endBeginner = trackBlock('beginner_body');
          if (isBeginnerPdf) {
            const BODY_PT = 8.5; // writePdfMarkdown's body size: estimates measure in it
            const sectionH = (title, content) => {
              pdf.setFont('helvetica', 'normal'); pdf.setFontSize(BODY_PT);
              return estimateSectionHeight(title, content, contentW - 4);
            };
            const bottom = H - margin;
            let opened = false;
            // Room for a unit of height h: the page it would start on, else a fresh one. Nothing is ever split here;
            // a unit taller than a page (over budget) starts a fresh page and flows on as Leerling's sections do.
            const room = (h) => {
              if (opened && y + 1.5 + h <= bottom) { hr(); return; }
              pdf.addPage(); paintBg(); markPage(); y = margin; opened = true;
            };
            const section = (s, color, content = s.content) => {
              room(sectionH(shownTitle(s), content));
              renderSection(shownTitle(s), content, color);
            };
            const byTitle = (list, order) => list.slice().sort((a, b) => {
              const ix = (s) => order.findIndex((k) => cleanTitle(s.title || '').toLowerCase().includes(k));
              return ix(a) - ix(b);
            });
            const firstOf = (list) => list[0];

            // The first three report pages are fixed (owner, 22 Oct 2026); each is one page, its text running to the
            // page edge rather than onto a next page. From OCEAN on, the flow takes over.
            const fixedPage = async (draw) => {
              pdf.addPage(); paintBg(); markPage(); y = margin; opened = true;
              const savedNPB = noPageBreak; noPageBreak = true;
              await draw();
              noPageBreak = savedNPB;
            };
            const sep = (i) => { if (i > 0) hr(); };
            // p8: the meta-disclaimer, De Identiteit, De Verklaring, the radar wheel
            const ident = byTitle(identityPage, ['identiteit', 'verklaring', 'waarom']);
            await fixedPage(async () => {
              drawMetaDisclaimer();
              ident.forEach((s, i) => { sep(i); renderSection(shownTitle(s), s.content, getPdfSectionColor(s.title)); });
              if (radarEl) { y += 4; await drawRadar(); }
            });
            // p9: De Essentie, De Vermenigvuldiging, De Schaduw, De Blindspot
            const essence = byTitle(essencePage, ['essentie', 'vermenigvuldiging']);
            const p9 = [...essence, ...shadowBlindspotSections];
            if (p9.length) await fixedPage(async () => {
              p9.forEach((s, i) => { sep(i); renderSection(shownTitle(s), s.content, getPdfSectionColor(s.title)); });
            });
            // p10: the TNM wheel, De Extensie, Creatieve Resonantie, and the perspective diagram as large as the rest of
            // the page allows (full content width at most, its own proportions, centred in the room left).
            await fixedPage(async () => {
              await drawTnmWheel({ bottom });
              resonanceSections.forEach((s, i) => { sep(i); renderSection(shownTitle(s), s.content, green); });
              try {
                const el = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = perspectiefImg; });
                const top = y + 6, roomH = bottom - top;
                const ratio = el.naturalHeight / el.naturalWidth;
                const w = Math.min(contentW, roomH / ratio), h = w * ratio;
                if (h >= 30) {
                  pdf.addImage(perspectiefImg, 'PNG', margin + (contentW - w) / 2, top + (roomH - h) / 2, w, h);
                  y = top + roomH;
                }
              } catch { /* image load failed — skip */ }
            });

            // OCEAN: its title, subtitle, the uploaded values and the disclaimer, with the first block of the read; then
            // each trait block where it fits (one section — the model's trait headings split it).
            if (oceanBody || hasOceanUpload) {
              pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic');
              const discH = pdf.splitTextToSize(t(hasOceanUpload ? 'resultsModal.pdf.oceanPage.disclaimerLight' : 'resultsModal.pdf.oceanPage.disclaimerHeavy'), contentW - 10).length * 3.6 + 5 + 4;
              const headH = 12 + 7 + (hasOceanUpload ? 6 + 5 * 8 + 2 : 0) + discH;
              const lines = oceanBody ? oceanBody.split('\n') : [];
              const headOf = (l) => splitGluedHeading(l)?.heading ?? l;
              const blocks = [];
              lines.forEach((l) => {
                if (!blocks.length || (isOceanMemberHeading(headOf(l)) && blocks[blocks.length - 1].some((x) => x.trim()))) blocks.push([]);
                blocks[blocks.length - 1].push(l);
              });
              const texts = blocks.map((b) => b.join('\n').trim()).filter(Boolean);
              const blockH = (txt) => sectionH('', txt) - 12; // no heading of its own
              room(headH + (texts.length ? blockH(texts[0]) : 0));
              sectionHeading(sectionTitle('ocean_page', language), blue);
              oceanSubtitle();
              if (hasOceanUpload) { drawUploadedOceanTable(); oceanDisclaimer(false); } else oceanDisclaimer(true);
              // With an upload: the values with O, C and E on one page, A and N from a fresh page with the D-curve under them
              // (owner, 22 Oct 2026). Otherwise each block where it fits.
              const isAgreeableness = (txt) => /meegaand|agreeabl/i.test(bareHeading(headOf(txt.split('\n')[0])));
              texts.forEach((txt, i) => {
                const breakHere = hasOceanUpload && isAgreeableness(txt) ? y > margin : (i > 0 && y + blockH(txt) > bottom);
                if (breakHere) { pdf.addPage(); paintBg(); markPage(); y = margin; }
                writePdfMarkdown(txt, margin + 2, contentW - 4, cyan);
              });
            }

            // The D-curve (page title, chart, caption) with De Vorm · De Hardware onder Druk
            const vorm = firstOf(morphPage.filter((s) => morphRank(s) === 0));
            const hardware = morphPage.filter((s) => morphRank(s) === 1);
            // The D-curve (page title, chart, caption) in the room left under OCEAN, shrunk to fit (owner, 22 Oct 2026);
            // under MIN_CHART_H it opens a page of its own at full size. Then De Vorm and De Hardware onder Druk together
            // on one fresh page, running to its edge rather than onto a next one.
            if (hasMorphChart) {
              const MIN_CHART_H = 35;
              const full = await drawMorphChart({ measure: true });     // box + caption at full size
              const chrome = full - (await drawMorphChart({ measure: true, maxChartH: 1 })) + 1; // what the chart itself takes
              const fixedH = full - chrome;                              // caption, gaps and box padding
              const avail = bottom - (y + 1.5) - 12 - fixedH;            // chart height the page still holds
              if (opened && avail >= MIN_CHART_H) {
                // Anchored to the bottom of the page (owner, 22 Oct 2026): the free room goes between the text and the chart.
                const chartH = Math.min(full - fixedH, avail);
                y = Math.max(y + 1.5, bottom - (12 + fixedH + chartH));
                sectionHeading(sectionTitle('morphology_page', language), cyan);
                await drawMorphChart({ maxChartH: avail });
              } else {
                room(12 + full);
                sectionHeading(sectionTitle('morphology_page', language), cyan);
                await drawMorphChart();
              }
            }
            const morphReads = [vorm, ...hardware].filter(Boolean);
            if (morphReads.length) await fixedPage(async () => {
              morphReads.forEach((s, i) => { sep(i); renderSection(shownTitle(s), relabelProse(s.content, language), cyan); });
            });

            // The triangle with De Cognitieve Driehoek · De Drogredenen
            const tri = byTitle(triangleSections, ['cognitieve', 'drogredenen']);
            // One page: the figure as large as the page allows next to Beginner's short texts (owner, 22 Oct 2026) — at
            // least Leerling's full size, at most TRI_FIG_MAX (where the wheel labels still fit the width).
            if (tri.length) {
              const fig = triangleFigure?.main ? triangleFigure : null;
              const TRI_FIG_MAX = 140;
              const captionH = fig ? 4.2 + (fig.top?.length ? 3.8 : 0) + (fig.others?.length ? 3.8 : 0) + 3 + 1 : 0;
              const textH = tri.reduce((h, s, i) => h + sectionH(shownTitle(s), s.content) + (i > 0 ? 1.5 : 0), 0);
              await fixedPage(async () => {
                const boxH = Math.min(TRI_FIG_MAX, Math.max(TRI_FIG_H, bottom - y - captionH - textH));
                if (fig) drawTriangleFigure(fig, boxH);
                tri.forEach((s, i) => { sep(i); renderSection(shownTitle(s), s.content, triYellow); });
              });
            }

            // Hardware Data (the Keuze/Echo graph) with De Alchemie · Het Neurale Schakelbord · Ontologische Evolutie
            const hwd = byTitle(group2Sections, ['alchemie', 'schakelbord', 'ontologi']);
            const keuzeEcho = enginePayload?.keuze_echo;
            if (keuzeEcho) {
              room(12 + KE_FOOTPRINT_H + 1.5 + (hwd[0] ? sectionH(shownTitle(hwd[0]), hwd[0].content) : 0));
              sectionHeading(t('resultsModal.pdf.keuzeEcho.title'), orange);
              drawKeuzeEcho(keuzeEcho);
              hr();
              if (hwd[0]) renderSection(shownTitle(hwd[0]), hwd[0].content, orange);
              hwd.slice(1).forEach((s) => section(s, orange));
            } else hwd.forEach((s) => section(s, orange));
          }
          endBeginner();

          // ── Alchemie / Neurale Schakelbord / Ontologie now render on the Dual-Core page
          //    (Master Prompt v4.1 §5.8); group2Sections kept only to keep them out of `others`.
          void group2Sections;

          // Render-side fallback AI prompt — the model sometimes ends early (on the OCEAN
          // disclaimer) and never writes its agent-prompt section. This deterministic prompt,
          // built from the archetype configuration, is used whenever the model omits its own.
          const buildFallbackAgentPrompt = () => {
            const mn = result.mainName || result.overallArchetype || t('resultsModal.pdf.prompt.fallbackCoreName');
            const sn = result.secondaryName || result.supportArchetype || t('resultsModal.pdf.prompt.fallbackSupportName');
            const shn = result.shadowName || result.shadowArchetype || t('resultsModal.pdf.prompt.fallbackShadowName');
            const bn = result.blindspotName || result.blindspotArchetype || t('resultsModal.pdf.prompt.fallbackBlindspotName');
            const en = result.extendedName || '';
            return [
              tFunc('resultsModal.pdf.prompt.fallbackIntro')(en),
              '',
              t('resultsModal.pdf.prompt.fallbackConfigHeading'),
              tFunc('resultsModal.pdf.prompt.fallbackCoreLine')(mn),
              tFunc('resultsModal.pdf.prompt.fallbackSupportLine')(sn),
              tFunc('resultsModal.pdf.prompt.fallbackShadowLine')(shn),
              tFunc('resultsModal.pdf.prompt.fallbackBlindspotLine')(bn),
              '',
              t('resultsModal.pdf.prompt.fallbackToneHeading'),
              tFunc('resultsModal.pdf.prompt.fallbackToneBody')(mn, sn, shn, bn),
              '',
              t('resultsModal.pdf.prompt.fallbackUseHeading'),
              t('resultsModal.pdf.prompt.fallbackUseBody'),
            ].join('\n');
          };

          // AI Prompt: a page of its own — ALWAYS rendered (the model's prompt or the fallback above).
          // It carries the heading, the short usage intro and the prompt, nothing else: the reader
          // copies it to an external AI in one go. The machine block opens the next page; the old
          // footer and closing letter are gone from the PDF (owner, 2026-09-18).
          const endAiPrompt = trackBlock('ai_prompt');
          void disclaimerSection;
          {
            pdf.addPage();
            paintBg(); markPage();
            y = margin;
            // Fixed heading in the body-text white (owner, 17 Oct 2026: orange went to the Hardware Data page)
            sectionHeading(t('resultsModal.pdf.prompt.heading'), white);
            // Instruction tip in purple
            pdf.setFontSize(8); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...purple);
            pdf.splitTextToSize(t('resultsModal.pdf.prompt.tip'), contentW - 4).forEach(line => { pdf.text(line, margin + 2, y); y += 4.5; });
            y += 2;
            // Agent prompt: strip intro text + first ## heading (KERN DISCLAIMER), show its body, then rest with headings
            if (agentSection) {
              let promptContent = (agentSection.content || '').trim();
              // If the model appended its machine block after the prompt, cut it off — the render-side
              // `data` block is the authoritative copy. Cut only at a line that IS the block's header
              // (or its first `-- IDENTITEIT --` tag). This used to cut at the first line that merely
              // MENTIONED "PROFIEL DATA VOOR AI" — and v6.2.x's own usage intro tells the reader to
              // give that block to their AI, so the eight prompt blocks after it were all cut away.
              promptContent = promptContent
                .replace(/\n[ \t]*[#*>\-─═ \t]*(?:PROFIEL\s*DATA\s*VOOR\s*AI(?:[ \t-]*VERWERKING)?|PROFILE\s*DATA\s*FOR\s*AI(?:[ \t-]*PROCESSING)?)[ \t*:.—–\-─═]*(?:\n[\s\S]*)?$/i, '')
                .replace(/\n\s*--\s*(?:IDENTITEIT|IDENTITY)\s*--[\s\S]*$/i, '').trim();
              // Strip markdown code fences the AI may wrap the prompt in
              promptContent = promptContent.replace(/^```[^\n]*\n?/gm, '').replace(/^~~~[^\n]*\n?/gm, '');
              // (The v4 "drop everything before the first ##, then that ## line" slicing is gone: it
              // existed to remove a KERN DISCLAIMER preamble, and under v6.2.x it removed the usage
              // intro instead. The prompt's block titles arrive as subheadings — groupSubsections.)
              // Collapse 3+ consecutive blank lines down to one blank line
              promptContent = promptContent.replace(/\n{3,}/g, '\n\n');
              // The copy block runs down to near the page edge, like the other pages, so its last lines never
              // open a page of their own (owner, 22 Oct 2026).
              bottomPad = 8;
              writePdfMarkdown(promptContent, margin + 2, contentW - 4, white); // block titles white too
              bottomPad = margin;
            } else {
              // Model omitted its prompt section — render the deterministic fallback instead.
              writePdfMarkdown(buildFallbackAgentPrompt(), margin + 2, contentW - 4, white);
            }
          }

          endAiPrompt();
        }

        // Persoonlijkheidsrapport Vergelijking rendered earlier (after OCEAN page) — skip here
      }

      // ══════════════════════════════════════════════════════════════
      // PROFIEL DATA PAGE(S) — Machine-readable data for AI agents
      // Placed AFTER footer as absolute last content before pruning.
      // The user doesn't read this; external AI models do when the
      // PDF is uploaded as attachment.
      // ══════════════════════════════════════════════════════════════
      // Always on a page of its own, straight after the AI prompt's page.
      const endData = trackBlock('data');
      {
        pdf.addPage(); paintBg(); markPage();
        y = margin;

        const mono = 7;
        const monoH = 3.5;

        const POS = { JUDGE:1,LOVER:2,CAREGIVER:3,INNOCENT:4,EXPLORER:5,OUTLAW:6,TRICKSTER:7,SAGE:8,ARTIST:9,MAGICIAN:10,HERO:11,RULER:12 };
        const NET = {
          RULING: t('resultsModal.groups.ruling.network'),
          RELATIONAL: t('resultsModal.groups.relational.network'),
          SEEKER: t('resultsModal.groups.seeker.network'),
          CHAOS: t('resultsModal.groups.chaos.network'),
          ABSTRACT: t('resultsModal.groups.abstract.network'),
          AGENCY: t('resultsModal.groups.agency.networkCompact'),
        };
        const GA = { RULING:['JUDGE','RULER'],RELATIONAL:['LOVER','CAREGIVER'],SEEKER:['INNOCENT','EXPLORER'],CHAOS:['OUTLAW','TRICKSTER'],ABSTRACT:['SAGE','ARTIST'],AGENCY:['MAGICIAN','HERO'] };

        const dm = {}; (result.archetypeDetails || []).forEach(d => { dm[(d.key || '').toUpperCase()] = d; });
        const sgm = {}; (result.subgroups || []).forEach(sg => { sgm[(sg.group || '').toUpperCase()] = sg; });

        const mk = (result.mainArchetype || '').toUpperCase();
        const sk = (result.secondaryArchetype || result._secondaryKey || '').toUpperCase();
        const shk = (result.shadowPartner || '').toUpperCase();
        const bk = (result.blindspotPartner || '').toUpperCase();
        const oc = result.oceanScores || {};
        const cogTri = COG_TRIANGLES[mk];
        const counterTriId = cogTri ? ({ 1:3, 2:4, 3:1, 4:2 })[cogTri.id] : null;
        const counterTri = counterTriId ? ALL_COG_TRIANGLES.find(t => t.id === counterTriId) : null;
        const cp = aiProfileData || {};
        const eo = result.extendedOcean || {};

        let natTotal = 0, culTotal = 0;
        (result.subgroups || []).forEach(sg => {
          natTotal += (sg.leftNature || 0) + (sg.rightNature || 0);
          culTotal += (sg.leftCulture || 0) + (sg.rightCulture || 0);
        });
        const authPct = natTotal + culTotal > 0 ? Math.round(natTotal / (natTotal + culTotal) * 100) : 50;
        const mainTot = dm[mk]?.total || 0;
        const shadTot = dm[shk]?.total || 0;
        // Polarisation % and band: the server's (engine/polarNorm.js), not derived here.
        const polGap = polarization?.polarizationPct ?? null;
        const polCat = { HIGH_POLARIZATION: 'polHigh', MODERATE: 'polMid', HIGH_INDIVIDUATION: 'polLow' }[polarization?.polarizationLevel];

        let sGroup = '', sScore = 0;
        Object.entries(GA).forEach(([gk, [a1, a2]]) => {
          const s = (dm[a1]?.total || 0) + (dm[a2]?.total || 0);
          if (s > sScore) { sScore = s; sGroup = gk; }
        });
        const avgS = (result.archetypeDetails || []).length > 0
          ? (result.archetypeDetails || []).reduce((s, d) => s + (d.total || 0), 0) / 12 : 0;
        const [hw1, hw2] = GA[sGroup] || ['',''];
        const hwRes = (dm[hw1]?.total || 0) > avgS && (dm[hw2]?.total || 0) > avgS
          ? tFunc('resultsModal.pdf.data.hwBoth')(sGroup, dm[hw1]?.total || 0, dm[hw2]?.total || 0, Math.round(avgS))
          : tFunc('resultsModal.pdf.data.hwSingle')(sGroup);
        const yCogPts = dm[mk]?.yellow_cog || 0;
        const cfDesc = yCogPts > 4
          ? tFunc('resultsModal.pdf.data.cfActive')(yCogPts, cogTri?.mode || '')
          : tFunc('resultsModal.pdf.data.cfLow')(yCogPts);

        const mLine = (text, color = white) => {
          ensureSpace(monoH);
          pdf.setFontSize(mono); pdf.setFont('courier', 'normal'); pdf.setTextColor(...color);
          const lines = pdf.splitTextToSize(String(text), contentW);
          lines.forEach(l => { pdf.text(l, margin, y); y += monoH; });
        };
        const mBold = (text, color = green) => {
          ensureSpace(monoH + 1);
          pdf.setFontSize(mono); pdf.setFont('courier', 'bold'); pdf.setTextColor(...color);
          const lines = pdf.splitTextToSize(String(text), contentW);
          lines.forEach(l => { pdf.text(l, margin, y); y += monoH; });
        };
        const mGap = () => { y += monoH * 0.6; };
        const SEP = '='.repeat(63);
        const dash = (label) => `-- ${label} --`;

        mBold(SEP, green);
        mBold(t('resultsModal.pdf.data.title'), green);
        mLine(t('resultsModal.pdf.data.introLine1'), dimWhite);
        mLine(t('resultsModal.pdf.data.introLine2'), dimWhite);
        mBold(SEP, green);
        mGap();

        // ── Orb login-code: the PDF IS the login. Backend extracts this and discards the file. ──
        // Only the code the server handed over on unlock. No client-side fallback: a code the
        // browser derives itself is not an activated code and would not open an account.
        const orbCode = orbCodeRef.current;
        if (orbCode) {
          mBold(dash(t('resultsModal.pdf.data.orbSection')), green);
          mLine(`ORB::${orbCode}::ORB`, dimWhite);
          if (orbKeyRef.current) mLine(`KEY::${orbKeyRef.current}::KEY`, dimWhite);
          // Extended archetype name, wrapped like the orb code so PDF-login can recover it even
          // after whitespace-stripping. Base64 (UTF-8) keeps spaces/diacritics intact as one token.
          const archName = result.extendedName || result.extendedNameNl || '';
          if (archName) {
            let archB64 = '';
            try { archB64 = btoa(unescape(encodeURIComponent(archName))); } catch (_) {}
            if (archB64) mLine(`ARCH::${archB64}::ARCH`, dimWhite);
          }
          mGap();
        }

        // The profile card's copy — it travels to the account in this PDF (owner, 2026-09-19). Readable,
        // then base64-marked like ORB::/ARCH:: so the upload recovers it through line wraps, with the
        // server's signature: a claim keeps the copy only when that holds (backend cardSignature.js).
        // Printed AFTER the extended block on both pages: the upload takes the first "Gift:" / "Levensles:"
        // in the text, so card copy that happens to contain those words can never take over the reading's.
        const printCard = () => {
          const kaart = kaartRef.current;
          if (!(orbCodeRef.current && kaart && kaart.sig && (kaart.giftMicro || kaart.geomSummary))) return;
          const cardLines = (text, color) => {
            pdf.setFontSize(mono); pdf.setFont('courier', 'normal'); pdf.setTextColor(...color);
            pdf.splitTextToSize(String(text), contentW).forEach((l) => { ensureSpace(monoH); pdf.text(l, margin, y); y += monoH; });
          };
          const b64 = (s) => { try { return btoa(unescape(encodeURIComponent(s))); } catch (_) { return ''; } };
          mBold(dash(t('resultsModal.pdf.data.cardSection')), green);
          if (kaart.giftMicro) cardLines(`${t('resultsModal.pdf.data.cardGift')}: ${kaart.giftMicro}`, white);
          if (kaart.geomSummary) cardLines(`${t('resultsModal.pdf.data.cardGeometry')}: ${kaart.geomSummary}`, white);
          if (kaart.giftMicro) cardLines(`CGIFT::${b64(kaart.giftMicro)}::CGIFT`, dimWhite);
          if (kaart.geomSummary) cardLines(`CGEO::${b64(kaart.geomSummary)}::CGEO`, dimWhite);
          cardLines(`CSIG::${kaart.sig}::CSIG`, dimWhite);
          mGap();
        };

        if (dataBlock) {
          // v2 sessions (Master Prompt v7 W2 / 5.10, D17): the blocks are built by OUR backend from the engine's
          // values (apps/backend/engine/dataBlock.js) — never by the model, never re-derived here.
          dataBlock.forEach((b) => {
            mBold(dash(b.title), green);
            b.lines.forEach((l) => mLine(l));
            mGap();
            if ((b.key || b.title) === 'EXTENDED ARCHETYPE PROFIEL') printCard(); // key = the Dutch title, stable across report languages
          });
        } else {
        mBold(dash(t('resultsModal.pdf.data.identitySection')), green);
        mLine(`${t('resultsModal.pdf.data.extendedArchetype')}: ${result.extendedName || t('resultsModal.pdf.data.notAvailable')}`);
        mLine(`${t('resultsModal.pdf.data.main')}: ${result.mainName || ''} (${POS[mk] || '?'}) | ${t('resultsModal.pdf.data.group')}: ${ARCHETYPE_TO_GROUP[mk] || ''} | ${t('resultsModal.pdf.data.network')}: ${NET[ARCHETYPE_TO_GROUP[mk]] || ''}`);
        mLine(`${t('resultsModal.pdf.data.support')}: ${result.secondaryName || ''} (${POS[sk] || '?'}) | ${t('resultsModal.pdf.data.group')}: ${result.supportGroup || ''}`);
        mLine(`${t('resultsModal.pdf.data.shadow')}: ${result.shadowName || ''} (${POS[shk] || '?'}) | ${t('resultsModal.pdf.data.shadowNote')}`);
        mLine(`${t('resultsModal.pdf.data.blindspot')}: ${result.blindspotName || ''} (${POS[bk] || '?'}) | ${t('resultsModal.pdf.data.blindspotNote')}`);
        mLine(`${t('resultsModal.pdf.data.harmonyMatch')}: ${eo.harmony ? t('resultsModal.pdf.data.yes') : t('resultsModal.pdf.data.no')}`);
        mGap();

        mBold(dash(t('resultsModal.pdf.data.scoresSection')), green);
        [
          ['Judge','JUDGE',1],['Lover','LOVER',2],['Caregiver','CAREGIVER',3],
          ['Innocent','INNOCENT',4],['Explorer','EXPLORER',5],['Outlaw','OUTLAW',6],
          ['Trickster','TRICKSTER',7],['Sage','SAGE',8],['Artist','ARTIST',9],
          ['Magician','MAGICIAN',10],['Hero','HERO',11],['Ruler','RULER',12],
        ].forEach(([name, key, pos]) => {
          const d = dm[key] || {};
          const core = (d.nature_core || 0) + (d.culture_core || 0);
          const bleed = (d.total || 0) - core;
          mLine(`${(name + '(' + pos + '):').padEnd(16)} ${d.total || 0} (Core: ${core} | Bleed: ${bleed})`);
        });
        mGap();

        // Master Prompt v4.1 §5.10: 5-mandje decompositie per archetype.
        mBold(dash(t('resultsModal.pdf.data.basketSection')), green);
        [
          ['Judge','JUDGE'],['Lover','LOVER'],['Caregiver','CAREGIVER'],
          ['Innocent','INNOCENT'],['Explorer','EXPLORER'],['Outlaw','OUTLAW'],
          ['Trickster','TRICKSTER'],['Sage','SAGE'],['Artist','ARTIST'],
          ['Magician','MAGICIAN'],['Hero','HERO'],['Ruler','RULER'],
        ].forEach(([name, key]) => {
          const d = dm[key] || {};
          mLine(`${(name + ':').padEnd(12)} nat_core ${d.nature_core || 0} | green ${d.green_hw || 0} | cult_core ${d.culture_core || 0} | blue ${d.blue_fb || 0} | yellow ${d.yellow_cog || 0} | purple ${d.purple_shadow || 0}`);
        });
        mGap();

        mBold(dash(t('resultsModal.pdf.data.natCultSection')), green);
        ['RULING','RELATIONAL','SEEKER','CHAOS','ABSTRACT','AGENCY'].forEach(gk => {
          const sg = sgm[gk] || {};
          const n = (sg.leftNature || 0) + (sg.rightNature || 0);
          const c = (sg.leftCulture || 0) + (sg.rightCulture || 0);
          mLine(`${(gk.charAt(0) + gk.slice(1).toLowerCase() + ':').padEnd(12)} N${n} / C${c} = ${n + c}/36`);
        });
        mGap();

        mBold(dash(t('resultsModal.pdf.data.indicesSection')), green);
        mLine(tFunc('resultsModal.pdf.data.authenticityIndex')(natTotal, authPct));
        if (polGap != null && polCat) mLine(tFunc('resultsModal.pdf.data.polarizationIndex')(mainTot, shadTot, polGap, t(`resultsModal.pdf.data.${polCat}`)));
        mGap();

        // Master Prompt v4.1 §5.10 / D-10: model-derived OCEAN scalars are NEVER emitted.
        // §5.10: OCEAN PROFIEL (EXTERN GEUPLOAD) — ALLEEN bij upload; omit the whole block otherwise.
        if (uploadedOceanScores) {
          mBold(dash(t('resultsModal.pdf.data.oceanSection')), green);
          const oceanLbl = (k) => t('resultsModal.pdf.data.ocean' + k).padEnd(19);
          mLine(`${oceanLbl('O')}${Math.round(uploadedOceanScores.O || 0)}/100`);
          mLine(`${oceanLbl('C')}${Math.round(uploadedOceanScores.C || 0)}/100`);
          mLine(`${oceanLbl('E')}${Math.round(uploadedOceanScores.E || 0)}/100`);
          mLine(`${oceanLbl('A')}${Math.round(uploadedOceanScores.A || 0)}/100`);
          mLine(`${oceanLbl('N')}${Math.round(uploadedOceanScores.N || 0)}/100`);
          mGap();
        }

        mBold(dash(t('resultsModal.pdf.data.cogSection')), green);
        if (cogTri) {
          const triMembers = Array.isArray(cogTri.members) ? cogTri.members.join(' \u00b7 ') : (cogTri.members || '');
          mLine(tFunc('resultsModal.pdf.data.activeTriangle')(cogTri.mode, cogTri.id));
          mLine(`${t('resultsModal.pdf.data.partners')}: ${triMembers}`);
          mLine(`${t('resultsModal.pdf.data.networks')}: ${cogTri.networks || ''}`);
          // Both lines only when the triangle actually carries the text: an empty value or a
          // "see the analysis" placeholder is not a fact and does not belong in the machine block.
          if (cogTri.tagline) mLine(`${t('resultsModal.pdf.data.superpower')}: ${cogTri.tagline}`);
          const weakParts = (cogTri.high || '').split(/maar kan ook\s*/i);
          const trap = weakParts.length > 1 ? weakParts[1].replace(/^leiden tot\s*/i, '').trim() : '';
          if (trap) mLine(`${t('resultsModal.pdf.data.cognitiveTrap')}: ${trap}`);
          if (counterTri) mLine(tFunc('resultsModal.pdf.data.growthDirection')(counterTri.mode, counterTri.id));
        } else {
          mLine(t('resultsModal.pdf.data.triangleUnavailable'), dimWhite);
        }
        mGap();

        mBold(dash(t('resultsModal.pdf.data.hardwareSection')), green);
        mLine(tFunc('resultsModal.pdf.data.strongestGroup')(sGroup, sScore));
        mLine(`${t('resultsModal.pdf.data.hardwareResonance')}: ${hwRes}`);
        mLine(`${t('resultsModal.pdf.data.cultureForceSignal')}: ${cfDesc}`);
        mGap();

        mBold(dash(t('resultsModal.pdf.data.extendedSection')), green);
        mLine(`${t('resultsModal.pdf.data.gift')}: ${result.extensionGift || t('resultsModal.pdf.data.notAvailable')}`);
        mLine(`${t('resultsModal.pdf.data.curse')}: ${result.extensionCurse || t('resultsModal.pdf.data.notAvailable')}`);
        mLine(`${t('resultsModal.pdf.data.levensles')}: "${result.levensles || t('resultsModal.pdf.data.notAvailable')}"`);
        mGap();

        printCard();

        // Master Prompt v4.1 §5.10: dead v3 fields removed (MAIN ARCHETYPE DIEPTE block).
        // Facts only, per the machine-block template: the archetype and where it sits on the wheel.
        // The prose that used to stand here was the 12-archetype description of the shadow (and of the
        // blindspot) — generic to that archetype, written in the first person, and about this profile
        // only by accident. What these two mean for this configuration is written in DE SCHADUW and
        // DE BLINDSPOT, from the corpus.
        const wheelPos = (key) => {
          const p = key ? ARCHETYPES[key]?.position : null;
          return p ? ` (${t('resultsModal.pdf.data.position')} ${p})` : '';
        };

        mBold(dash(t('resultsModal.pdf.data.shadowSection')), green);
        mLine(`${t('resultsModal.pdf.data.shadowArchetype')}: ${result.shadowName ? result.shadowName + wheelPos(shk) : t('resultsModal.pdf.data.notAvailable')}`);
        mGap();

        mBold(dash(t('resultsModal.pdf.data.blindspotSection')), green);
        mLine(`${t('resultsModal.pdf.data.blindspotArchetype')}: ${result.blindspotName ? result.blindspotName + wheelPos(bk) : t('resultsModal.pdf.data.notAvailable')}`);
        mGap();
        }

        mBold(SEP, green);
        mGap();
        mLine(t('resultsModal.pdf.data.outroLine1'), dimWhite);
        mLine(t('resultsModal.pdf.data.outroLine2'), dimWhite);
        mLine(t('resultsModal.pdf.data.outroLine3'), dimWhite);
      }
      endData();

      // ── Reorder PDF pages to configured sequence ──
      // Desired order (content stays untouched, only page sequence changes):
      // 1-6 (pre-context) → group1a (identity) → group1b (archetype images) →
      // groep_radar (web diagram) → dual_core → group2 (yellow) →
      // ocean_comp (comparison) → ocean_core (OCEAN score) → ai_prompt → data
      {
        // Master Prompt v4.1 §5 page order (render-side visuals added in-block).
        // The Master Prompt's emit order (v6.2.x DEEL 5, the numbered checklist) is the page order:
        // 1-4 Identiteit/Verklaring/Essentie/Vermenigvuldiging · 5-6 Schaduw/Blindspot · 7-8 Extensie +
        // Creatieve Resonantie (the radar page, §5.4) · 9 OCEAN · 10-12 Vorm/Hardware/Overgang ·
        // 13-15 De Stille Stem · De Cognitieve Driehoek · 16-18 Alchemie/Schakelbord/Evolutie · 19 AI-prompt + machineblok.
        const desiredBlockOrder = [
          'beginner_body', // Beginner only: all its sections as one flow (none of the blocks below render then)
          'group1a',       // 1-4: Identiteit/Verklaring + Essentie/Vermenigvuldiging
          'group1b',       // 5-6: Schaduw + Blindspot
          'nb_resonance',  // 7-8: radar + DE EXTENSIE + Creatieve Resonantie (§5.4, before OCEAN)
          'ocean_core',    // 9:   PERSOONLIJKHEIDSRAPPORT VERGELIJKING — one section, one flow
          'nb_morphology', // 10-12: D-curve chart + Vorm / Hardware / Overgang
          'nb_stille',     // 13-15: De Stille Stem (Reflectie/Motivatie/Beweging)
          'nb_triangle',   // De Cognitieve Driehoek, yellow titles (owner, 17 Oct 2026)
          'dual_core',     // 16-18: Hardware Data chart + Alchemie/Schakelbord/Ontologie, orange titles
          'others',        // any remaining ungrouped AI sections (safety net)
          'groep_radar',   // (legacy) usually empty in v4.1
          'ai_prompt',     // 19: the AI prompt, a page of its own
          'wet_context',   // Wetenschappelijke Context, a page of its own: after the AI prompt, before the data (owner, 2026-09-18)
          'data',          // the machine block, from its own page on
        ];
        const blockMap = {};
        blockRanges.forEach(b => { blockMap[b.name] = b; });

        // Determine fixed page range (pages before first tracked block)
        const firstMoveable = blockRanges.length > 0
          ? Math.min(...blockRanges.map(b => b.start))
          : Infinity;
        const fixedCount = firstMoveable - 1;
        const finalPageCount = pdf.internal.getNumberOfPages();

        // Build new page number sequence
        const newPageOrder = [];
        for (let i = 1; i <= fixedCount; i++) newPageOrder.push(i);
        for (const name of desiredBlockOrder) {
          const block = blockMap[name];
          if (!block) continue;
          for (let i = block.start; i <= block.end; i++) newPageOrder.push(i);
        }
        // Safety: append any untracked pages (e.g. footer that didn't create new pages)
        for (let i = 1; i <= finalPageCount; i++) {
          if (!newPageOrder.includes(i)) newPageOrder.push(i);
        }

        // Apply reorder to jsPDF internal pages array (1-indexed)
        if (newPageOrder.length === finalPageCount) {
          const oldPages = pdf.internal.pages.slice();
          for (let i = 0; i < newPageOrder.length; i++) {
            pdf.internal.pages[i + 1] = oldPages[newPageOrder[i]];
          }
          // Update pagesWithContent to match new positions
          const oldPWC = new Set(pagesWithContent);
          pagesWithContent.clear();
          for (let i = 0; i < newPageOrder.length; i++) {
            if (oldPWC.has(newPageOrder[i])) pagesWithContent.add(i + 1);
          }
        }
      }

      // ── Prune any empty pages (pages that never received content) ──
      const totalPages = pdf.internal.getNumberOfPages();
      for (let p = totalPages; p >= 1; p--) {
        if (!pagesWithContent.has(p)) {
          pdf.deletePage(p);
        }
      }

      // ── Download (or hand back a blob URL in preview mode) ──
      const archetypeName = (result?.extendedName || 'Archetype').replace(/\s+/g, '_');
      if (pvw) {
        // Dev preview only (?pdfpreview=1&pages=N, dev/PdfPreviewHarness.jsx): keep just the first N pages.
        const keep = Number(window.__GFL_PDF_REPLAY?.pages) || 0;
        if (keep > 0) for (let p = pdf.internal.getNumberOfPages(); p > keep; p--) pdf.deletePage(p);
        try { onPreviewReadyRef.current?.(pdf.output('bloburl')); } catch (_) {}
        return;
      }
      pdf.save(`GardenForLife_${archetypeName}.pdf`);
      setFullDownloaded(true);
      // Download log for a Stripe payment (a timestamp on the ledger — nothing of the report).
      markPaymentDelivered(paymentRefRef.current, sealedOrbCodeRef.current);
      // Full (paid) report downloaded → send the access/welcome email to the gate
      // email (fire-and-forget; never blocks the download). Language + archetype
      // name follow the language of the taken test.
      if (gateEmailRef.current) {
        sendAccessEmail({
          recipientEmail: gateEmailRef.current,
          archetypeName: language === 'en'
            ? (result?.extendedName || result?.extendedNameNl || '')
            : (result?.extendedNameNl || result?.extendedName || ''),
          lang: language === 'en' ? 'en' : 'nl',
        }).then(() => console.log('[GFL] Access email sent')).catch((e) => console.warn('[GFL] Access email failed:', e?.message));
      }
    } catch (err) {
      console.error('[PDF] Generation failed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, displaySections, uploadedFiles, language, enginePayload, polarization, dataBlock, triangleFigure, t, tArray, tFunc, portrait, portraitVariant, paidPaymentId, assessmentLevel]);

  // Dev PDF live-preview: once the (replayed) analysis is ready, auto-build the PDF
  // and hand the blob URL back to the harness instead of downloading.
  useEffect(() => {
    if (previewMode && aiReady && !isGeneratingPdf) {
      handleDownloadPdf({ previewMode: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewMode, aiReady]);

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
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: 'transparent',
        zIndex: 9999,
        pointerEvents: resultsModalProgress > 0.05 ? 'auto' : 'none',
        // visibility:hidden completely removes backdrop-filter from the GPU compositing
        // pipeline — prevents the frosted-glass layer bleeding through at opacity~0
        visibility: resultsModalProgress < 0.02 ? 'hidden' : 'visible',
        paddingBottom: (windowWidth >= 1079 && windowWidth <= 1920) ? '6rem' : undefined,
      }}
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
            backgroundColor: isLowGpu ? 'rgba(10, 3, 18, 0.9)' : 'rgba(1, 0, 2, 0.3)',
            boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168, 85, 247, 0.06), inset 0 0 30px rgba(168, 85, 247, 0.03)',
            transform: `translate(0, ${(1 - resultsModalProgress) * -15}vh) scale(${0.3 + resultsModalProgress * 0.7})`,
            opacity: resultsModalProgress,
            marginTop: (windowWidth >= 1079 && windowWidth <= 1920) ? '11rem' : undefined,
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
            backgroundImage: "url('/images/noise.svg')",
            opacity: 0.03, mixBlendMode: 'overlay',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            {!reportAvailable ? (
              /* A level without a report: a notice and a way out (owner, 15 Oct) */
              <>
                <p style={{
                  fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                  fontSize: 'max(0.875rem, 0.73vw)',
                  fontWeight: 700,
                  color: '#ffae00',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  margin: 0,
                }}>
                  {t('resultsModal.ui.levelNoReportTitle')}
                </p>
                <p style={{
                  fontFamily: "'Figtree', sans-serif",
                  fontSize: '0.95rem',
                  color: 'rgba(255, 254, 240, 0.8)',
                  margin: 0,
                  lineHeight: '1.6',
                  maxWidth: '320px',
                }}>
                  {t('resultsModal.ui.levelNoReportBody')}
                </p>
                <button
                  type="button"
                  onClick={() => onClose && onClose()}
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '0.15rem',
                    background: 'rgba(255, 174, 0, 0.1)',
                    border: '1px solid rgba(255, 174, 0, 0.5)',
                    color: '#ffae00',
                    fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                    fontSize: 'max(0.8rem, 0.67vw)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#ffae00'; e.currentTarget.style.color = '#000'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 174, 0, 0.5)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 174, 0, 0.1)'; e.currentTarget.style.color = '#ffae00'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {t('resultsModal.ui.close')}
                </button>
              </>
            ) : (<>
            {/* Spinner */}
            <div className="keep-spinning" style={{
              width: '3rem',
              height: '3rem',
              border: '2px solid #a855f7',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              willChange: 'transform',
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
              {t('resultsModal.ui.loadingLine1')}<br/>{t('resultsModal.ui.loadingLine2')}
            </p>

            {/* Time estimate */}
            <p style={{
              fontFamily: "'Figtree', sans-serif",
              fontSize: '0.75rem',
              color: 'rgba(168, 85, 247, 0.6)',
              margin: 0,
              letterSpacing: '0.05em',
            }}>
              {t(aiOverdue ? 'resultsModal.ui.timeOverdue' : 'resultsModal.ui.timeEstimate')}
            </p>
            </>)}

            {/* N1 refusal cards: opt-in, only for the two-layer test, never in the report's way */}
            {twoLayerPlan && reportAvailable && !aiFailed && <RefusalCards plan={twoLayerPlan} layerAnswers={layerAnswers} />}

            {/* Persistent preload: load + decode the archetype portrait during the wait so it's
                already cached when the result card paints (otherwise the card shows first and the
                image pops in a moment later). Hidden, off the layout. */}
            {portrait.url && (
              <img src={portrait.url} alt="" aria-hidden="true" decoding="async"
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
            )}

            {/* Error state: AI failed — show continue button */}
            {aiFailed && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'rgba(251, 191, 36, 0.8)',
                  fontFamily: "'Figtree', sans-serif",
                  margin: 0,
                }}>
                  {t('resultsModal.ui.aiUnavailable')}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      setAiFailed(false);
                      aiCalledRef.current = false;
                      setAiStage(0);
                      setAiRetryCount(c => c + 1);
                    }}
                    style={{
                      padding: '0.6rem 1.5rem',
                      borderRadius: '0.35rem',
                      background: 'linear-gradient(135deg, #1d9904, #16a34a)',
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
                    {t('resultsModal.ui.retry')}
                  </button>
                  {/* Only with a result to show: the two-layer test has one once the server scored it. */}
                  {result && <button
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
                    {t('resultsModal.ui.continueWithoutAi')}
                  </button>}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─── Full Results Modal ─── */
        <div style={{
          position: 'relative',
          opacity: resultsModalProgress,
          transform: `translate(0, ${(1 - resultsModalProgress) * -14}vh) scale(${0.05 + resultsModalProgress * 0.95})`,
          transformOrigin: 'center center',
          width: '100%',
          maxWidth: rs.modalMaxWidth,
          marginTop: rs.modalMarginTop || undefined,
        }}>

          {/* Modal Container - holographic glass */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: rs.modalMaxWidth,
            maxHeight: rs.modalMaxHeight,
            background: isLowGpu ? 'rgba(10, 3, 18, 0.9)' : 'rgba(2, 0, 3, 0.3)',
            backdropFilter: isLowGpu ? 'none' : 'blur(24px)',
            border: '1px solid rgba(29, 153, 4, 0.3)',
            borderRadius: '0.75rem',
            boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(29, 153, 4, 0.06), inset 0 0 30px rgba(29, 153, 4, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            color: '#fff',
            overflow: 'hidden',
          }}>

            {/* Holographic sheen + scanline sweep (compositor-only) */}
            <HoloOverlays radius="0.75rem" />
            
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
                  {/* Portrait column: the archetype image with the Masculine/Feminine toggle right under it */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                  {/* Archetype portrait — responsive square box. The art is transparent PNG, shown whole:
                      no frame, no crop (contain, not cover). */}
                  <div style={{ position: 'relative', width: rs.profileImgSize, height: rs.profileImgSize, flexShrink: 0 }}>
                    {portrait.url && (
                    <img
                      src={portrait.url}
                      alt={extNameShown || result.name}
                      loading="eager"
                      fetchpriority="high"
                      decoding="async"
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'contrast(1.25) sepia(0.2)',
                      }}
                    />
                    )}
                  </div>
                  {/* Always shown; shows the CHOICE (not whichever art exists) — the card image and the PDF follow it. */}
                  <PortraitVariantToggle
                    value={portraitVariant}
                    onChange={setPortraitVariant}
                    labels={{
                      label: t('resultsModal.ui.portraitToggle.label'),
                      female: t('resultsModal.ui.portraitToggle.female'),
                      male: t('resultsModal.ui.portraitToggle.male'),
                    }}
                  />
                  </div>

                  <div style={{ maxWidth: rs.profileTextMaxW }}>
                    {/* The configuration's name, shrunk only as far as its longest word needs (FitTitle) */}
                    <FitTitle text={extNameShown || result.name} fontSize={rs.titleFont} style={{
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontWeight: 'bold',
                      background: 'linear-gradient(to right, #a855f7, #d8b4fe, #a855f7)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))',
                      marginBottom: '0.5rem',
                    }} />
                    {result.mainName && result.secondaryName && (
                      <p style={{
                        fontSize: '0.9rem',
                        color: 'rgba(249, 115, 22, 0.9)',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        marginBottom: '0.5rem',
                      }}>
                        {result.mainName} + {result.secondaryName}
                      </p>
                    )}
                    <p style={{
                      fontSize: '1.1rem',
                      color: 'rgba(156, 163, 175, 1)',
                      fontFamily: "'Figtree', sans-serif",
                      fontStyle: 'italic',
                    }}>
                      "{result.levensles}"
                    </p>
                  </div>
                </div>


                {/* ── Fixed Disclaimer — always shown before AI sections ── */}
                <div style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: rs.sectionPad,
                  borderRadius: '0.75rem',
                  borderLeft: '3px solid rgba(168, 85, 247, 0.5)',
                  borderRight: '3px solid rgba(168, 85, 247, 0.5)',
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
                    <strong style={{ color: '#a855f7' }}>{t('resultsModal.ui.metaDisclaimerLabel')}</strong>{' '}
                    {t('resultsModal.ui.metaDisclaimerBody')}
                  </p>
                </div>

                {/* ── TEASER CARD: short summary + best findings + a nudge to download the full
                       PDF. Everything else lives in the PDF only. ── */}

                {/* De Identiteit + De Verklaring — the intro reads (Verklaring gives the graphs/
                    charts their context, so it stays on the teaser). Identiteit first. */}
                {cardIdentity
                  .filter((s) => {
                    const t = cleanTitle(s.title || '').toLowerCase();
                    return t.includes('identiteit') || t.includes('verklaring');
                  })
                  .sort((a, b) => (cleanTitle(a.title || '').toLowerCase().includes('identiteit') ? 0 : 1) -
                                  (cleanTitle(b.title || '').toLowerCase().includes('identiteit') ? 0 : 1))
                  .map((s, i) => renderAiSectionCard(s, 1000 + i))}

                {/* Key-findings strip */}
                {cardKeyFindings && (
                  <div style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.45)',
                    border: '1px solid rgba(168,85,247,0.25)',
                    borderRadius: '0.75rem',
                    padding: '0.9rem 1rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '0.6rem 1.5rem',
                    fontFamily: "'Figtree', sans-serif",
                  }}>
                    {[
                      { label: t('resultsModal.labels.kern'), value: cardKeyFindings.main, color: '#1d9904' },
                      { label: t('resultsModal.labels.support'), value: cardKeyFindings.support, color: '#f97316' },
                      { label: t('resultsModal.labels.schaduw'), value: cardKeyFindings.shadow, color: '#a855f7' },
                      { label: t('resultsModal.labels.blindspot'), value: cardKeyFindings.blindspot, color: '#ef4444' },
                      ...(cardKeyFindings.polBand ? [{ label: t('resultsModal.labels.polarisatie'), value: `${cardKeyFindings.polGap}% — ${cardKeyFindings.polBand}`, color: '#fbbf24' }] : []),
                    ].filter((f) => f.value).map((f) => (
                      <div key={f.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '8rem' }}>
                        <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(156,163,175,0.8)' }}>{f.label}</span>
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: f.color }}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Radar Chart (TNM wheel) ── */}
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

                {/* Off-screen full-size radar — the clean source rasterised into the PDF (the
                    on-card radar above can clip at narrow breakpoints). Real layout, off-canvas. */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 0, width: '620px', height: '360px', background: '#060612' }}>
                  <div ref={pdfRadarRef} style={{ width: '100%', height: '100%' }}>
                    {/* fillHeight: the legend drops to the box's bottom edge, off the lowest wheel label (Outlaw) */}
                    <SciFiRadarChart fillHeight data={result.radarData} shadow={result.shadowArchetype} blindspot={result.blindspotArchetype} mainArchetype={result.overallArchetype} supportArchetype={result.supportArchetype} />
                  </div>
                </div>

                {/* D-curve chart (visible). Same ref the PDF rasterises. */}
                {morphChart && (
                  <div style={{
                    position: 'relative',
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    padding: '0.5rem 0.5rem 0.25rem',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(34, 211, 238, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <div style={{
                      position: 'absolute', top: '0.75rem', left: '1rem',
                      fontSize: '0.7rem', fontFamily: "'Rajdhani', sans-serif",
                      letterSpacing: '0.2em', color: '#22d3ee', zIndex: 1,
                    }}>
                      {'/// PLASTISCHE_MORFOLOGIE'}
                    </div>
                    <div ref={morphologyRef} style={{ width: '100%', height: '512px', background: '#060612', borderRadius: '0.5rem', paddingTop: '1.5rem' }}>
                      <MorphologyChart
                        chart={morphChart}
                        mainName={result.mainName || 'Main'}
                        configName={extNameShown || undefined}
                        height={474}
                        language={language}
                      />
                    </div>
                    <p style={{
                      margin: '0.5rem 0.25rem 0.1rem', fontSize: '0.72rem', lineHeight: 1.45,
                      color: 'rgba(156, 163, 175, 0.9)', fontFamily: "'Figtree', sans-serif", fontStyle: 'italic',
                    }}>
                      {t('resultsModal.ui.morphCaptionRegister')}
                    </p>
                  </div>
                )}

                {/* De Stille Stem — Reflectie, then Motivatie: both under the D-curve, as the short PDF
                    follows its D-curve page with them (owner, 2026-09-18). */}
                {cardStille
                  .filter((s) => /reflectie/.test(cleanTitle(s.title || '').toLowerCase()))
                  .map((s, i) => renderAiSectionCard({ ...s, title: t('resultsModal.labels.stilleStemPrefix') + cleanTitle(s.title), displayTitle: t('resultsModal.labels.stilleStemPrefix') + cleanTitle(shownTitle(s)) },6000 + i))}

                {/* De Stille Stem — Motivatie */}
                {cardStille
                  .filter((s) => /motivatie/.test(cleanTitle(s.title || '').toLowerCase()))
                  .map((s, i) => renderAiSectionCard({ ...s, title: t('resultsModal.labels.stilleStemPrefix') + cleanTitle(s.title), displayTitle: t('resultsModal.labels.stilleStemPrefix') + cleanTitle(shownTitle(s)) },6100 + i))}

                {/* Essentie/Vermenigvuldiging/Schaduw/Blindspot/Morfologie-reads/Beweging/Resonantie/
                    Alchemie etc. are PDF-only now — pulled off the teaser card. */}

                {/* ── Download teaser: this card is a summary; the PDF holds the full report ── */}
                <div style={{
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
                    {t('resultsModal.ui.teaserTitle')}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(148,163,184,0.85)', fontFamily: "'Figtree', sans-serif", lineHeight: 1.6, fontStyle: 'italic' }}>
                    {t('resultsModal.ui.teaserBody')}
                  </p>
                </div>

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
                            {t('resultsModal.ui.emailLabel')}
                          </label>
                          <input
                            type="email"
                            required
                            value={reviewFormData.email}
                            onChange={(e) => setReviewFormData({ ...reviewFormData, email: e.target.value })}
                            placeholder={t('resultsModal.ui.emailPlaceholder')}
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
                          <p style={{
                            margin: '0.6rem 0 0',
                            color: 'rgba(148,163,184,0.75)',
                            fontFamily: "'Figtree', sans-serif",
                            fontSize: '0.72rem',
                            lineHeight: 1.55,
                            fontStyle: 'italic',
                          }}>
                            {t('resultsModal.ui.emailNote')}
                          </p>
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

                        {/* PROCEED button (unlocks the download options) */}
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
                          {isSubmittingReview ? t('resultsModal.ui.sending') : t('resultsModal.ui.proceed')}
                        </button>
                      </form>
                    </div>
                  )}

                  

                  {/* Paid but the PDF is not on the device yet: auto-download running, or it failed. */}
                  {paidNotSaved && (
                    <div data-pdf-hide role="status" aria-live="polite" style={{
                      width: '100%', boxSizing: 'border-box', marginBottom: '1rem', padding: '0.9rem 1.1rem',
                      display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                      background: 'rgba(255, 174, 0, 0.06)', border: '1px solid rgba(255, 174, 0, 0.5)', borderRadius: '0.5rem',
                      boxShadow: '0 0 20px rgba(255, 174, 0, 0.12)',
                    }}>
                      <div style={{ flex: '1 1 16rem', minWidth: 0 }}>
                        <div style={{ color: '#ffae00', fontFamily: "'Lexend Mega', sans-serif", fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 'max(10px, 0.55vw)', marginBottom: '0.3rem' }}>
                          {isGeneratingPdf ? t('resultsModal.paywall.autoDownloading') : t('resultsModal.paywall.notDownloadedTitle')}
                        </div>
                        {!isGeneratingPdf && (
                          <div style={{ color: '#FFFEF0', fontFamily: "'Figtree', sans-serif", fontSize: 'max(11px, 0.62vw)', lineHeight: 1.5 }}>
                            {t('resultsModal.paywall.notDownloadedBody')}
                          </div>
                        )}
                      </div>
                      {!isGeneratingPdf && (
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf()}
                          style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid #ffae00', borderRadius: '0.15rem', color: '#ffae00', fontFamily: "'Lexend Mega', sans-serif", fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 'max(10px, 0.55vw)', cursor: 'pointer', transition: 'all 0.25s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#ffae00'; e.currentTarget.style.color = '#000'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 174, 0, 0.5)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ffae00'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          {t('resultsModal.paywall.downloadNow')}
                        </button>
                      )}
                    </div>
                  )}

                  <div data-pdf-hide style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    gap: '1rem',
                    width: '100%',
                    flexWrap: 'wrap',
                  }}>
                    {/* Fundament (short report) — FREE short summary PDF (shorter consent, no AI-prompt clause) */}
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
                      <span style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={(isGeneratingPdf && pdfKind === 'short') ? { animation: 'spin 1s linear infinite' } : undefined}>
                            {(isGeneratingPdf && pdfKind === 'short')
                              ? <path d="M21 12a9 9 0 11-6.219-8.56" />
                              : <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>}
                          </svg>
                          {(isGeneratingPdf && pdfKind === 'short') ? t('resultsModal.ui.generating') : t('resultsModal.ui.shortVersion')}
                        </span>
                        {!(isGeneratingPdf && pdfKind === 'short') && (
                          <span style={{ fontSize: '0.7em', fontWeight: 'normal', textTransform: 'none', letterSpacing: '0.02em', opacity: 0.85 }}>
                            {t('resultsModal.ui.downloadNow')}
                          </span>
                        )}
                      </span>
                    </button>

                    {/* Essentie (full report) — PAID. The pay component (PDF consent is its first step); a
                        confirmed payment / activation code downloads the PDF automatically. Once saved,
                        the button re-downloads directly (consent already given). */}
                    <button
                      onClick={() => {
                        if (isGeneratingPdf || !reviewSubmitted) return;
                        if (paidPaymentId) { handleDownloadPdf(); return; }
                        setShowPaywall(true);
                      }}
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
                      <span style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={(isGeneratingPdf && pdfKind === 'full') ? { animation: 'spin 1s linear infinite' } : undefined}>
                            {(isGeneratingPdf && pdfKind === 'full')
                              ? <path d="M21 12a9 9 0 11-6.219-8.56" />
                              : <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>}
                          </svg>
                          {(isGeneratingPdf && pdfKind === 'full') ? t('resultsModal.ui.generating') : t('resultsModal.ui.fullReport')}
                        </span>
                        {!(isGeneratingPdf && pdfKind === 'full') && (
                          <span style={{ fontSize: '0.85em', fontWeight: 'normal', textTransform: 'none', letterSpacing: '0.02em', opacity: 0.85 }}>
                            {paidPaymentId
                              ? t('resultsModal.paywall.unlocked')
                              : (payConfig?.enabled ? formatCents(language, payConfig.grossCents, payConfig.currency) : formatPrice(language, levelPrice(assessmentLevel)))}
                          </span>
                        )}
                      </span>
                    </button>
                  </div>


                </div>

              </div>
            </div>
          </div>

          {/* Fundament PDF consent — the same consent card as the Essentie pay component's first step,
              laid over the report card the same way */}
          {showPdfConsent && (
            <PopupShell fill closing={pdfConsentClosing} labelledBy="gfl-pdf-consent-title" panelRef={pdfConsentRef}>
              <PdfConsentStep
                titleId="gfl-pdf-consent-title"
                t={t}
                lead={t('resultsModal.ui.consentLeadDownload')}
                checked={pdfConsentChecked}
                onCheck={setPdfConsentChecked}
                onCancel={closePdfConsent}
                onConfirm={() => {
                  closePdfConsent();
                  logActivity({ type: 'consent_given', email: reviewFormData.email.trim(), consentType: 'pdf_download', level: 'pdf_short', message: 'User confirmed PDF download consent' }).catch(() => {});
                  handleDownloadPdf({ shortVersion: true });
                }}
              />
            </PopupShell>
          )}

          {/* Paywall — black card laid exactly over the report card (sibling of the card, so it
              covers the border box and stays put while the report scrolls underneath) */}
          <PaywallModal
            fill
            open={showPaywall}
            sealedOrbCode={sealedOrbCodeRef.current}
            level={REPORT_LEVEL[assessmentLevel] || 'advanced'}
            email={reviewFormData.email.trim()}
            language={language}
            t={t}
            onClose={() => setShowPaywall(false)}
            onConsent={() => {
              logActivity({ type: 'consent_given', email: reviewFormData.email.trim(), consentType: 'pdf_download', level: 'pdf', message: 'User confirmed PDF download consent' }).catch(() => {});
            }}
            onPaid={(paymentId, orbCode, orbKey) => {
              orbCodeRef.current = orbCode || '';
              orbKeyRef.current = orbKey || '';
              paidRef.current = true;
              paymentRefRef.current = paymentId;
              setPaidPaymentId(paymentId);
              setShowPaywall(false);
              // PDF consent was the paywall's first step → download right away.
              handleDownloadPdf();
            }}
          />
        </div>
      )}

      {/* Final leave warning (in-app exits) — shared pop-up frame (PopupShell) */}
      {leaveProceed && (
        <PopupShell
          closing={leaveClosing}
          onDismiss={closeLeave}
          role="alertdialog"
          labelledBy="gfl-leave-title"
          width="30rem"
          zIndex={2147483600}
        >
          <PopupTitle id="gfl-leave-title">{t('resultsModal.paywall.leaveTitle')}</PopupTitle>
          {paidPaymentId ? (
            <>
              {paidNotSaved && (
                <p style={{ margin: 0, color: '#FFFEF0', fontFamily: "'Figtree', sans-serif", fontSize: 'max(12px, 0.65vw)', lineHeight: 1.65 }}>
                  {t('resultsModal.paywall.notDownloadedBody')}
                </p>
              )}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={leaveSavedChecked}
                  onChange={(e) => setLeaveSavedChecked(e.target.checked)}
                  style={{ marginTop: '0.2rem', width: '0.95rem', height: '0.95rem', accentColor: PURPLE, flexShrink: 0, cursor: 'pointer' }}
                />
                <span style={{ color: '#FFFEF0', fontFamily: "'Figtree', sans-serif", fontSize: 'max(12px, 0.65vw)', lineHeight: 1.65 }}>
                  {t('resultsModal.paywall.leavePaidCheck')}
                </span>
              </label>
            </>
          ) : (
            <p style={{ margin: 0, color: '#FFFEF0', fontFamily: "'Figtree', sans-serif", fontSize: 'max(12px, 0.65vw)', lineHeight: 1.65 }}>
              {t('resultsModal.paywall.leaveUnpaid')}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            {paidNotSaved && !isGeneratingPdf && (
              <span style={{ marginRight: 'auto' }}>
                <SciFiButton variant="purple" size="md" onClick={() => { closeLeave(); handleDownloadPdf(); }}>
                  {t('resultsModal.paywall.downloadNow')}
                </SciFiButton>
              </span>
            )}
            <SciFiButton variant="purple" size="md" onClick={closeLeave}>{t('resultsModal.paywall.leaveBack')}</SciFiButton>
            <SciFiButton
              variant="white"
              size="md"
              disabled={!!paidPaymentId && !leaveSavedChecked}
              onClick={() => {
                if (paidPaymentId && !leaveSavedChecked) return;
                const go = leaveProceed;
                closeLeave();
                // With the paid PDF downloaded, leaving goes on to the account page (App's doReset).
                go({ toAccount: fullDownloaded });
              }}
            >
              {t('resultsModal.paywall.leaveContinue')}
            </SciFiButton>
          </div>
        </PopupShell>
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

// The report reader — heading detection, subsections, Kaart stripping, sections and the ledger that
// accounts for every line of the model's text — lives in reportReader.js.

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

    // Standalone bold line = styled subheader (e.g. **Wat jouw lens doorlaat**)
    const boldLineMatch = line.trim().match(/^\*\*(.+?)\*\*$/);
    if (boldLineMatch) {
      flushList();
      const isFirst = elements.length === 0;
      elements.push(
        <p key={`bh-${elements.length}`} style={{
          margin: isFirst ? '0 0 0.25rem' : '0.75rem 0 0.25rem', fontWeight: 700, color: '#ffffff',
          fontSize: 'inherit', letterSpacing: 'normal',
        }}>{boldLineMatch[1]}</p>
      );
      continue;
    }

    elements.push(<p key={`p-${elements.length}`} style={{ margin: '0.4rem 0', letterSpacing: 'normal' }}>{formatInline(line)}</p>);
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
  // Collapse spaced-out characters (e.g. "E x p l o r e r" → "Explorer")
  // Step 1: merge spaced digits  "1 0" → "10"
  text = text.replace(/(\d) (\d)/g, '$1$2');
  // Step 2: collapse single-char sequences (letters + digits, 4+ chars)
  text = text.replace(/(^|[^A-Za-zÀ-ÿ0-9])([A-Za-zÀ-ÿ0-9](?:\s{1,2}[A-Za-zÀ-ÿ0-9]){3,})(?=[^A-Za-zÀ-ÿ0-9]|$)/g,
    (m, pre, seq) => pre + seq.replace(/\s+/g, sp => sp.length > 1 ? ' ' : ''));
  // Step 3: clean orphaned spaces around parentheses and punctuation
  text = text.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
  text = text.replace(/\s+([.:!,;?])/g, '$1');
  text = text.replace(/\s{2,}/g, ' ');
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
function computeResultFromAnswers(layerAnswers, liveSubjects, lang = 'nl') {
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

      const layer = liveSubjects.find(q => q.layerIndex === layerIdx);
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
            archetypeMotivation: archetypeField(archetypeData, 'motivation', lang) || null,
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


  return identityResult({ mainKey, supportKey, advanced, subgroups, archetypeScores, answerLog }, lang);
}

/**
 * Everything the results screen derives from a Main × Support (names, extension cell, Shadow, Blindspot,
 * the 132 matrix), plus what the scoring hands over: `advanced` (radar data, totals, derived indices),
 * the group dynamics, the raw scores and the answer log. Shared by the old test and the two-layer test.
 */
function identityResult({ mainKey, supportKey, advanced, subgroups, archetypeScores, answerLog }, lang) {
  // ──────────────────────────────────────────────────────────
  // 4. Extended Archetype Name (132-outcome matrix: main × support archetype)
  // ──────────────────────────────────────────────────────────
  const supportGroup = ARCHETYPE_TO_GROUP[supportKey] || 'RULING';
  const extendedName = getExtendedArchetype(mainKey, supportKey);
  const extendedNameNl = getExtendedArchetypeNl(mainKey, supportKey);

  // ──────────────────────────────────────────────────────────
  // 4b. Extended Archetype portrait image + description
  // ──────────────────────────────────────────────────────────
  const archetypeImage = getArchetypeImage(mainKey, supportKey);
  const extendedDesc = null; // description now comes from the AI (corpus-grounded), not a static file

  // ──────────────────────────────────────────────────────────
  // 5. Shadow Archetype (psychological tension point)
  //    Shadow = 180° opposite of MAIN archetype (internal fuel)
  // ──────────────────────────────────────────────────────────
  const shadowKey = SHADOW_PAIRS[mainKey] || null;

  // ──────────────────────────────────────────────────────────
  // 5b. Blindspot Archetype (external saboteur)
  //     Blindspot = Red Line partner of MAIN archetype
  // ──────────────────────────────────────────────────────────
  const blindspotKey = RED_LINE[mainKey] || null;

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
  //     (132-matrix: one entry per support ARCHETYPE, 11 per main)
  // ──────────────────────────────────────────────────────────
  const allSupportArchetypes = ALL_ARCHETYPE_KEYS
    .filter(sk => sk !== mainKey)
    .map(sk => {
      const extKey = `${mainKey}_${sk}`;
      const extName = EXTENDED_ARCHETYPES[extKey] || mainKey;
      const extNameNl = EXTENDED_ARCHETYPES_NL[extKey] || extName;
      const group = ARCHETYPE_TO_GROUP[sk];
      const desc = null; // extended descriptions now live in the corpus / AI output
      return {
        support: sk,
        supportName: ARCHETYPES[sk]?.nameEn || sk,
        group,
        extendedName: extName,
        extendedNameNl: extNameNl,
        subtitle: desc?.subtitle || group,
        combination: desc?.combination || '',
        shadow: desc?.shadow || '',
        isActive: sk === supportKey,
      };
    });

  // ──────────────────────────────────────────────────────────
  // 6c. Full 132 Matrix: 12 Main × 11 Support Archetypes
  //     For the "Matrix van 132 Mogelijkheden" display
  // ──────────────────────────────────────────────────────────
  const ALL_MAIN_KEYS = ALL_ARCHETYPE_KEYS;
  const fullMatrix132 = ALL_MAIN_KEYS.map(mk => {
    const mainArch = ARCHETYPES[mk] || {};
    const row = {
      mainKey: mk,
      mainName: mainArch.name || mk,
      mainNameEn: mainArch.nameEn || mk,
      isActiveMain: mk === mainKey,
      outcomes: ALL_ARCHETYPE_KEYS.filter(sk => sk !== mk).map(sk => {
        const extKey = `${mk}_${sk}`;
        const extName = EXTENDED_ARCHETYPES[extKey] || mk;
        return {
          support: sk,
          group: ARCHETYPE_TO_GROUP[sk],
          extendedName: extName,
          isActive: mk === mainKey && sk === supportKey,
        };
      }),
    };
    return row;
  });

  // ──────────────────────────────────────────────────────────
  // 8. Analysis text templates
  // ──────────────────────────────────────────────────────────
  const analysisTemplate = null; // AI generates the analysis; no static fallback template
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
  const extendedOcean = null; // OCEAN is orthogonal (v4 §3.4): no model-derived profile

  const resultObj = {
    // Extended identity
    name: extendedNameNl,                            // e.g. "De Alchemist" (Dutch)
    extendedName,                                    // e.g. "The Alchemist" (English)
    extendedNameNl,                                  // e.g. "De Alchemist" (Dutch)
    extendedSubtitle: extendedDesc?.subtitle || null,  // e.g. "Sage + Creative"
    combinationText: extendedDesc?.combination || null, // Why Main+Support create this archetype
    shadowInsight: extendedDesc?.shadow || null,         // Shadow tension for this combination
    // Main archetype
    mainArchetype: mainKey,
    mainName: primaryArchetype.name,                  // e.g. "De Wijze"
    mainNameEn: primaryArchetype.nameEn || mainKey,
    description: archetypeField(primaryArchetype, 'description', lang),
    // The three fields of this extension's cell, all from the ratified 132 table — never from the
    // 12-archetype singles, which describe the Main alone and are not this configuration.
    levensles: getArchetypeQuote(mainKey, supportKey, lang) || null,
    extensionGift: getExtensionGift(mainKey, supportKey, lang) || null,
    extensionCurse: getExtensionCurse(mainKey, supportKey, lang) || null,
    mainMotivation: archetypeField(primaryArchetype, 'motivation', lang) || null,
    mainPositive: archetypeField(primaryArchetype, 'positive', lang) || null,
    mainShadowTrait: archetypeField(primaryArchetype, 'shadow', lang) || null,
    mainComplementaryAxis: archetypeField(primaryArchetype, 'complementaryAxis', lang) || null,
    mainShadowTension: archetypeField(primaryArchetype, 'shadowTension', lang) || null,
    // Support archetype
    secondaryArchetype: supportKey,
    secondaryName: supportArchetype.name,              // e.g. "De Rebel"
    secondaryNameEn: supportArchetype.nameEn || supportKey,
    secondaryDescription: supportArchetype.description || null,
    secondaryMotivation: archetypeField(supportArchetype, 'motivation', lang) || null,
    secondaryPositive: archetypeField(supportArchetype, 'positive', lang) || null,
    // Shadow (180° opposite of Main — internal fuel)
    shadowPartner: shadowKey,
    shadowName: shadowKey ? (ARCHETYPES[shadowKey]?.name || shadowKey) : null,
    shadowNameEn: shadowKey ? (ARCHETYPES[shadowKey]?.nameEn || shadowKey) : null,
    shadowDescription: shadowKey ? (ARCHETYPES[shadowKey]?.description || null) : null,
    // Blindspot (Red Line partner of Main — external saboteur)
    blindspotPartner: blindspotKey,
    blindspotName: blindspotKey ? (ARCHETYPES[blindspotKey]?.name || blindspotKey) : null,
    blindspotNameEn: blindspotKey ? (ARCHETYPES[blindspotKey]?.nameEn || blindspotKey) : null,
    blindspotDescription: blindspotKey ? (ARCHETYPES[blindspotKey]?.description || null) : null,
    blindspotShadowTrait: blindspotKey ? (ARCHETYPES[blindspotKey]?.shadow || null) : null,
    blindspotTension: blindspotKey ? (archetypeField(blindspotKey, 'shadowTension', lang) || null) : null,
    // Harmony & Bonuses (Geometric Bleed — no separate counters, kept for backward compat)
    harmonyActive: false,
    shadowBonusActive: false,
    harmonyBonus: 0,
    beheersingsBonus: 0,
    harmonyPairName: null,
    // Metadata
    group: primaryArchetype.group || null,
    supportGroup: supportGroup,
    // null while the 132 artwork is in production - every consumer skips the image.
    imageUrl: archetypeImage,
    // Scores & visualization
    radarData,
    subgroups,
    allSupportArchetypes,
    fullMatrix132,
    fullMatrix72: fullMatrix132, // legacy alias
    analysisSections,
    totalScore,
    maxScore: advanced.totalMaxScore || 369,
    // OCEAN Personality Profile
    oceanScores: advanced.oceanScores || null,           // 0-100 scale from archetype weight computation
    extendedOcean,                                     // OCEAN scores for comparison panel
    oceanLabels: OCEAN_LABELS,                         // Dimension label map (short/full/dutch)
    oceanColors: OCEAN_COLORS,                         // Dimension color map for UI
    oceanImported: false,                              // Flag: only true if user explicitly imported OCEAN report
    // Derived indices (Master Prompt L4 / R-c): the model reads these for the nature/culture
    // balance — it never computes them itself. (The polarisation comes from the server.)
    authenticityIndex: advanced.authenticityIndex ?? null,
    authenticityLevel: advanced.authenticityLevel ?? null,
    totalNaturePoints: advanced.totalNaturePoints ?? null,
    totalCulturePoints: advanced.totalCulturePoints ?? null,
    // Raw data for future API agent
    _archetypeScores: archetypeScores,
    archetypeDetails: advanced.archetypeDetails || null,
    _primaryKey: mainKey,
    _secondaryKey: supportKey,
    _extendedName: extendedName,
    _harmonyActive: harmonyActive,
    // Full answer log — in-memory only (single-instance profile, never stored)
    _answerLog: answerLog,
    // AI Agent prompt (for Ontologische Evolutie section)
    _aiAgentPrompt: `Je bent een persoonlijke ontwikkelingscoach gespecialiseerd in Jungiaanse archetypen en het OCEAN persoonlijkheidsmodel. Mijn profiel: Extended Archetype "${extendedName}" (Main: ${primaryArchetype.nameEn || mainKey}, Support: ${supportArchetype.nameEn || supportKey}, Support Group: ${supportGroup}). Mijn schaduw (180° indicatie) is ${shadowKey ? (ARCHETYPES[shadowKey]?.nameEn || shadowKey) : 'onbekend'}, mijn blindspot is ${blindspotKey ? (ARCHETYPES[blindspotKey]?.nameEn || blindspotKey) : 'onbekend'}. OCEAN profiel: O=${extendedOcean?.ocean?.O || '?'}, C=${extendedOcean?.ocean?.C || '?'}, E=${extendedOcean?.ocean?.E || '?'}, A=${extendedOcean?.ocean?.A || '?'}, N=${extendedOcean?.ocean?.N || '?'}. Neuroticisme-trigger, superkracht en individuatiepad zijn te vinden in het rapport. Help me mijn schaduw te integreren en mijn blindspot te herkennen in dagelijkse situaties.`,
  };

  // The single-instance profile is never written to storage. Earlier builds kept the answer log,
  // a 10-session history, the AI sections and a pending copy in localStorage — clear leftovers.
  try {
    for (const k of LEGACY_PROFILE_KEYS) localStorage.removeItem(k);
  } catch (e) {
    // localStorage may be unavailable — fail silently
  }

  return resultObj;
}

/**
 * The two-layer test's result for the screen, read from the server's one scoring result (the analyze
 * stream's `profile`: Main, Support, totals and mandjes in points; apps/backend/engine/reportV7.js). Nothing
 * is scored here. The radar draws the seven mandjes as six bands (eigen echo = groen + blauw intern); the
 * old test's nature/culture indices and its answer sheet do not exist here.
 */
function computeResultFromProfile(s, lang = 'nl') {
  const KEY = (name) => name.toUpperCase();
  const round1 = (x) => Math.round(x * 10) / 10;
  const radarData = ARCHETYPE_RADAR_LABELS.map((label) => {
    const m = s.mandjes[label];
    const bands = [m.keuze, m.passief, m.groen + m.blauw_intern, m.blauw, m.geel, m.paars];
    const edges = bands.reduce((acc, b) => [...acc, (acc[acc.length - 1] || 0) + b], []).map(round1);
    return {
      subject: label,
      v2: true,
      green: edges[0], lime: edges[1], orange: edges[2], blue: edges[3], gold: edges[4], purple: edges[5],
      keuze: round1(m.keuze), passief: round1(m.passief), eigen_echo: round1(m.groen + m.blauw_intern),
      blauw: round1(m.blauw), geel: round1(m.geel), paars: round1(m.paars),
      A: edges[5],
      fullMark: 500,
    };
  });
  const subgroups = SUBGROUP_POLARITIES.map((p) => ({
    ...p,
    leftScore: round1(s.totals[p.leftLabel]),
    rightScore: round1(s.totals[p.rightLabel]),
    leftNature: 0, leftCulture: 0, rightNature: 0, rightCulture: 0,
    harmonyPoints: 0,
    shadowPoints: 0,
  }));
  const advanced = {
    radarData,
    totalPointsAwarded: round1(Object.values(s.totals).reduce((a, b) => a + b, 0)),
    hasHarmonyBonus: false,
    hasShadowHarmony: false,
    oceanScores: null,
    archetypeDetails: null,
  };
  const archetypeScores = Object.fromEntries(Object.entries(s.totals).map(([n, v]) => [KEY(n), v]));
  return identityResult({ mainKey: KEY(s.main), supportKey: KEY(s.support), advanced, subgroups, archetypeScores, answerLog: [] }, lang);
}

export default AssessmentResultsModal;
