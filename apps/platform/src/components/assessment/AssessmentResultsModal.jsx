import React, { useMemo, useCallback, useRef, useEffect, useLayoutEffect, useState } from 'react';
// html2canvas + jsPDF are lazy-loaded inside handleDownloadPdf (export click) so the
// ~250 KB gz export-vendor chunk stays out of the results-modal mount.
import SciFiRadarChart from './SciFiRadarChart';
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
  EXTENDED_ARCHETYPES,
  EXTENDED_ARCHETYPES_NL,
  getExtendedArchetype,
  getExtendedArchetypeNl,
  isComplementaryPair,
  computeAdvancedScores,
  getArchetypeQuote,
} from '@gfl/assessment-core';
import { isNatureSlot } from '@gfl/assessment-core/assessmentData';
import { getArchetypeImage } from '@gfl/assessment-core/data/archetypeImages';
import { assembleV4, NARRATIVE_TAGS, matchNarrativeTag } from './v4Parser';
import { orbCodeFromResult } from '../../orb';
import MorphologyChart from './MorphologyChart';
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
import { getToken, saveAssessment, analyzeAssessment, submitAssessmentReview, sendAccessEmail, sendReportEmail, logActivity, getPublicSiteBanner } from '@gfl/api-client';
import { isIntegratedGPU } from '@gfl/utils';
import { useLanguage } from '@gfl/i18n';
// SciFiButton removed — unused in this component
const tnmWheelImg = '/images/Model imports/TNM wheel PNG.png';
const deltawerkenImg = '/images/Model imports/Deltawerken png.png';
const cellsImg = '/images/Model imports/Cells within Cells png.png';
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

// Master Prompt v4.1 §5.2 — De Essentie & De Vermenigvuldiging each have an intro followed
// by three aspects: cognitive disposition, orientation (intern/extern), gift & curse. The
// model writes them as prose; this promotes the FIRST paragraph that discusses each aspect to
// a bold subtitle so both sections read as labeled sub-blocks. Each aspect is detected
// INDEPENDENTLY (one subtitle each, max), so a paragraph that doesn't match still passes the
// later aspects through. Best-effort on free prose; paragraphs already starting with a bold
// heading (e.g. the model emitted its own) are left untouched.
function injectAspectSubtitles(content, language) {
  if (!content) return content;
  const en = String(language || 'nl').toLowerCase() === 'en';
  // Checked in this order per paragraph; first matching, not-yet-used aspect wins the line.
  const ASPECTS = [
    { key: 'gift', label: en ? 'Gift & Curse' : 'Gift & Vloek',
      re: /\b(de\s+)?(gift|vloek|curse)\b|kracht\s+en\s+schaduw/i },
    { key: 'orient', label: en ? 'Orientation (internal/external)' : 'Oriëntatie (intern/extern)',
      re: /\b(intern|extern|naar\s+binnen|naar\s+buiten|ori[eë]ntat|internal|external|inward|outward)\b/i },
    { key: 'cognit', label: en ? 'Cognitive disposition' : 'Cognitieve aanleg',
      re: /\b(cognitiev|denkstijl|aanleg|kernfunctie|interpretatie|integratie|differentiatie|cognitive|disposition)\b/i },
  ];
  // Split on blank lines; if the model used single newlines (one block), fall back to per-line.
  let paras = content.split(/\n{2,}/);
  if (paras.length < 3) paras = content.split(/\n+/);
  const used = {};
  const out = paras.map((p, idx) => {
    const t = p.trim();
    if (!t || idx === 0) return p;                 // keep the intro paragraph untouched
    if (/^(\*\*|#{1,6}\s)/.test(t)) return p;      // already a subtitle/heading
    for (const a of ASPECTS) {
      if (!used[a.key] && a.re.test(t)) { used[a.key] = true; return `**${a.label}**\n${t}`; }
    }
    return p;
  });
  return out.join('\n\n');
}

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
  if (t.includes('introductie')) return { color: '#d1d5db', rgb: '209, 213, 219' };
  if (t.includes('prompt') || t.includes('agent')) return { color: '#f97316', rgb: '249, 115, 22' };
  return null; // fallback to cycle
};

const AssessmentResultsModal = ({
  resultsLoadingProgress,
  resultsModalProgress,
  layerAnswers,
  liveSubjects = [],
  uploadedFiles,
  onClose,
  onDownload,
  onCreateAccount,
  onAiReady,
  t,
  // ── Dev PDF live-preview (see src/dev/PdfPreviewHarness.jsx) ──
  previewMode = false,   // when true: build the PDF and hand back a blob URL instead of downloading
  onPreviewReady,        // (blobUrl) => void
}) => {
  // Compute archetype result from layer answers
  const result = useMemo(() => {
    const keys = layerAnswers ? Object.keys(layerAnswers) : [];
    const totalAnswers = keys.reduce((sum, k) => sum + Object.keys(layerAnswers[k] || {}).length, 0);
    console.log('[GFL] computeResultFromAnswers — layers:', keys.length, 'totalAnswers:', totalAnswers, 'sample:', JSON.stringify(layerAnswers).slice(0, 300));
    return computeResultFromAnswers(layerAnswers, liveSubjects);
  }, [layerAnswers, liveSubjects]);
  
  // Ref for the scroll container
  const scrollRef = useRef(null);
  
  // Ref for the PDF content area (the inner content div)
  const contentRef = useRef(null);
  
  // PDF download state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [showPdfConsent, setShowPdfConsent] = useState(false);
  const [pdfConsentChecked, setPdfConsentChecked] = useState(false);
  // Which variant the consent modal / spinner refers to: 'short' (free) or 'full' (paid).
  const [pdfKind, setPdfKind] = useState('full');

  // ── AI Analysis state ──
  const { language } = useLanguage(); // 'nl' | 'en' — selects the corpus sent to the model
  const [aiSections, setAiSections] = useState(null);
  const [aiProfileData, setAiProfileData] = useState(null);
  // v4: structured parse of the model output (assembleV4) + the engine C-runtime.
  const [v4Data, setV4Data] = useState(null);
  const [cRuntime, setCRuntime] = useState(null);
  // Backend-authored orb login-code (LC_ORB2_…), radial-gated with the real polar_gap.
  // Held in a ref so the PDF generator reads it synchronously without a re-render race.
  const orbCodeRef = useRef('');
  const kaartFieldsRef = useRef({ gift: '', geometrie: '' }); // AI-authored card fields (## Kaart Microcopy)
  const [uploadedOceanScores, setUploadedOceanScores] = useState(null);
  const [aiReady, setAiReady] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);
  const [aiRetryCount, setAiRetryCount] = useState(0);
  const [, setAiStage] = useState(0); // 0=waiting, 1=data sent, 2=AI done, 3=integrated
  const aiCalledRef = useRef(false);
  const onAiReadyRef = useRef(onAiReady);
  onAiReadyRef.current = onAiReady;
  const onPreviewReadyRef = useRef(onPreviewReady);
  onPreviewReadyRef.current = onPreviewReady;

  // ── Site banner for PDF footer (admin-configured image) ──
  const [siteBanner, setSiteBanner] = useState(null);
  useEffect(() => {
    getPublicSiteBanner().then(setSiteBanner).catch(() => {});
  }, []);

  // ── Auto-save to backend when user is logged in ──
  const [savedToBackend, setSavedToBackend] = useState(false);
  const [savedAssessmentId, setSavedAssessmentId] = useState(null);
  // Build the backend save payload from the computed result — shared by the auto-save
  // below AND the "create account" hand-off, so the two can never drift out of sync.
  const buildSavePayload = useCallback(() => {
    if (!result) return null;
    return {
      archetypeKey: result.mainArchetype,
      supportGroup: result.supportGroup,
      extendedArchetypeName: result.extendedName,
      oceanScores: result.oceanScores || result.extendedOcean?.ocean || null,
      responses: result._answerLog || [],
      subjectResults: result.subjectResults || [],
      scores: result.scores || null,
      archetypeDetails: result.archetypeDetails || null,
      harmonyScore: result.harmonyScore ?? null,
      consciousnessLevel: result.consciousnessLevel || null,
      overallShadow: result.overallShadow || null,
    };
  }, [result]);
  useEffect(() => {
    if (!result || savedToBackend || !getToken()) return;
    const payload = buildSavePayload();
    if (!payload) return;
    saveAssessment(payload).then((saved) => {
      setSavedToBackend(true);
      if (saved?.id) {
        setSavedAssessmentId(String(saved.id));
        try { localStorage.setItem('gfl_assessment_id', String(saved.id)); } catch (_) {}
      }
      console.log('[GFL] Assessment saved to account, id:', saved?.id);
    }).catch((err) => {
      console.warn('[GFL] Could not save assessment:', err.message);
    });
  }, [result, savedToBackend, buildSavePayload]);

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
        extendedArchetypeName: result?.extendedNameNl || result?.extendedName || '',
        timestamp: new Date().toISOString(),
      });
      gateEmailRef.current = email.trim();
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

      // Warm the archetype image now — we know it before the ~5s AI call, so kicking off
      // the fetch here means it's decoded and cached by the time the result card renders
      // (otherwise the card appears first and the image pops in ~2s later).
      if (result.imageUrl) { const warmImg = new Image(); warmImg.src = result.imageUrl; warmImg.decode?.().catch(() => {}); }

      try {
        // Dev PDF preview: replay the last real generation instead of calling the API.
        const __replay = (typeof window !== 'undefined' && window.__GFL_PDF_REPLAY) || null;
        let aiResult;
        if (__replay) {
          aiResult = { analysis: __replay.analysis, cRuntime: __replay.cRuntime, uploadedOceanScores: __replay.uploadedOceanScores, orbCode: __replay.orbCode };
        } else {
        aiResult = await analyzeAssessment({
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
          // Per-archetype 5-mandje + totals — the geometry the backend feeds the
          // C-runtime precompute and the model payload (was previously omitted).
          archetypeDetails: result.archetypeDetails,
          responses: result._answerLog,
          subgroups: result.subgroups,
          // The relevant Levensles (Main×SupportGroup) — sent so the backend hands it
          // to the AI directly (it needn't search the corpus for it).
          levensles: getArchetypeQuote(result.mainArchetype, result.supportGroup),
          // UI language → backend picks the matching corpus (nl → Dutch, else English).
          language,
          level: 'advanced',
          // v4.3's bigger budgets pushed the report past the old 18k cap, truncating the tail
          // sections (Resonantie, Alchemie/Schakelbord/Ontologie). The backend now streams the
          // Claude call (SDK .finalMessage()), which sidesteps the non-streaming 10-min guard
          // (max_tokens > ~21,333), so we can give comfortable headroom. Overrides the admin maxTokens.
          maxTokens: 30000,
          uploadedFileContents: uploadedFileContents.length > 0 ? uploadedFileContents : undefined,
        }, (stage, message) => {
          setAiStage(stage);
          console.log(`[GFL] AI stage ${stage}: ${message}`);
        });
        }
        // Stage 3: frontend integration
        setAiStage(3);
        if (aiResult.uploadedOceanScores) setUploadedOceanScores(aiResult.uploadedOceanScores);
        // Card fields: extract, then STRIP from the analysis so no rendering path (sections,
        // v4, PDF pages) can ever show them — they exist only in kaartFieldsRef + machine block.
        kaartFieldsRef.current = extractKaartFields(aiResult.analysis || '');
        const cleanedAnalysis = stripKaartFields(aiResult.analysis || '');
        // v4 structured parse (title-lines-as-tags) + the engine's C-runtime.
        try { setV4Data(assembleV4(cleanedAnalysis)); } catch (e) { console.warn('[GFL] v4 parse failed:', e.message); }
        if (aiResult.cRuntime) setCRuntime(aiResult.cRuntime);
        orbCodeRef.current = aiResult.orbCode || '';   // backend-authored code (empty on replay/back-compat)
        const sections = parseAiSections(cleanedAnalysis);
        // ── DIAGNOSTIC: shows whether a section was "never sent" (not in this list) vs "not
        //    rendered" (in the list but missing from the PDF). Also flags truncation: if the
        //    tail (machine block / last sections) is missing, the analysis was cut short. ──
        try {
          const raw = aiResult.analysis || '';
          console.log('%c[GFL] AI OUTPUT DIAGNOSTIC', 'font-weight:bold;color:#22d3ee');
          console.log('[GFL] analysis length:', raw.length, 'chars; completionTokens:', aiResult.completionTokens ?? '(n/a)');
          console.log('[GFL] section titles emitted by the model:', (sections || []).map(s => s.title));
          console.log('[GFL] machine block present (— PROFIEL DATA —):', /PROFIEL\s*DATA\s*VOOR\s*AI/i.test(raw), '| last 300 chars:', JSON.stringify(raw.slice(-300)));
          // D-curve provenance: these come from the ENGINE (cRuntime.d_curve), not the model.
          // If main === support it's because the corpus stores the D-curve PER GROUP — same-group
          // Main+Support share it. Different-group pairs differ.
          const dc = aiResult.cRuntime?.d_curve;
          console.log('[GFL] D-curve (engine):', dc ? `main=${JSON.stringify(dc.main)} support=${JSON.stringify(dc.support)} composed=${JSON.stringify(dc.composed)}` : '(none)',
            '| Main:', result?.mainArchetype, '/ Support:', result?.secondaryArchetype || result?._secondaryKey,
            '| main===support:', dc ? JSON.stringify(dc.main) === JSON.stringify(dc.support) : '(n/a)');
        } catch (_) {}
        const profileElements = sections.filter(s => s.isProfileElement);
        if (profileElements.length > 0) {
          const pd = {};
          profileElements.forEach(s => { pd[s.profileKey] = s.content; });
          setAiProfileData(pd);
        }
        const mainSections = sections.filter(s => !s.isProfileElement);
        setAiSections(mainSections);
        // Persist all sections (profile elements + main) for EyedentityPage
        try {
          const allForEye = sections.filter(s => !s.isAgentPrompt);
          localStorage.setItem('gfl_analysis_sections', JSON.stringify(allForEye));
        } catch (_) {}
        setAiReady(true);
        // Dev: capture this real generation so the PDF live-preview can replay it.
        try {
          if (import.meta.env.DEV && !__replay) {
            localStorage.setItem('gfl_pdf_replay', JSON.stringify({
              layerAnswers, liveSubjects,
              analysis: aiResult.analysis, cRuntime: aiResult.cRuntime,
              uploadedOceanScores: aiResult.uploadedOceanScores, orbCode: aiResult.orbCode,
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
      if (/radar.?lezing/i.test(t)) return false;
      // Stray AI-emitted sections that aren't part of the page-map.
      if (/(samenvattende\s+)?kernlezing|centrale\s+spanning/i.test(t)) return false;
      // Machine block + OCEAN render-side titles (gereedschap / profiel intro) — drop.
      if (/profiel\s*data|ai[\s-]*verwerking|ocean.?gereedschap|ocean.?profiel/i.test(t)) return false;
      // v3 "5 geometrische elementen" leftover — not a v4.1 section.
      if (/geometrische\s+element|vijf\s+(geometrische\s+)?element/i.test(t)) return false;
      if (/persoonlijkheidsrapport.*vergelijk|ocean.*vergelijk|vergelijk.*profiel/i.test(t)) return false;
      if (/^(spanningsvelden|vergelijkingsrapport|vergelijkings\s*rapport|conclusie)$/i.test(t)) return false;
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
    const dm = {};
    (result.archetypeDetails || []).forEach((d) => { dm[(d.key || '').toUpperCase()] = d; });
    const mainTot = dm[(result.mainArchetype || '').toUpperCase()]?.total || 0;
    const shadTot = dm[(result.shadowPartner || '').toUpperCase()]?.total || 0;
    const polGap = mainTot > 0 ? Math.round((Math.abs(mainTot - shadTot) / mainTot) * 100) : null;
    const polBand = polGap == null ? null
      : polGap > 60 ? 'Schaduw onderdrukt'
      : polGap > 30 ? 'Gezonde spanning'
      : 'Actieve integratie';
    return {
      main: result.mainName, support: result.secondaryName,
      shadow: result.shadowName, blindspot: result.blindspotName,
      authPct, polGap, polBand,
    };
  }, [result]);

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
    (s.title || '').toLowerCase().includes('introductie')
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
  }, [rs.sectionPad, renderMarkdownContent]);

  // ── Cognitieve Driehoek lookup — structural data only (content is now AI-generated Section 8) ──
  const COG_TRIANGLES = {
    RULER:     { id: 1, mode: 'Idealisme Modus',  members: ['Ruler', 'Innocent', 'Sage'],     networks: 'CEN · Openness · DMN' },
    INNOCENT:  { id: 1, mode: 'Idealisme Modus',  members: ['Ruler', 'Innocent', 'Sage'],     networks: 'CEN · Openness · DMN' },
    SAGE:      { id: 1, mode: 'Idealisme Modus',  members: ['Ruler', 'Innocent', 'Sage'],     networks: 'CEN · Openness · DMN' },
    JUDGE:     { id: 2, mode: 'Exploratie Modus',  members: ['Judge', 'Explorer', 'Artist'],   networks: 'CEN · Openness · DMN' },
    EXPLORER:  { id: 2, mode: 'Exploratie Modus',  members: ['Judge', 'Explorer', 'Artist'],   networks: 'CEN · Openness · DMN' },
    ARTIST:    { id: 2, mode: 'Exploratie Modus',  members: ['Judge', 'Explorer', 'Artist'],   networks: 'CEN · Openness · DMN' },
    LOVER:     { id: 3, mode: 'Impact Modus',      members: ['Lover', 'Outlaw', 'Magician'],   networks: 'Limbisch · Salience · Agency' },
    OUTLAW:    { id: 3, mode: 'Impact Modus',      members: ['Lover', 'Outlaw', 'Magician'],   networks: 'Limbisch · Salience · Agency' },
    MAGICIAN:  { id: 3, mode: 'Impact Modus',      members: ['Lover', 'Outlaw', 'Magician'],   networks: 'Limbisch · Salience · Agency' },
    CAREGIVER: { id: 4, mode: 'Engagement Modus',  members: ['Caregiver', 'Trickster', 'Hero'], networks: 'Limbisch · Salience · Agency' },
    TRICKSTER: { id: 4, mode: 'Engagement Modus',  members: ['Caregiver', 'Trickster', 'Hero'], networks: 'Limbisch · Salience · Agency' },
    HERO:      { id: 4, mode: 'Engagement Modus',  members: ['Caregiver', 'Trickster', 'Hero'], networks: 'Limbisch · Salience · Agency' },
  };
  const ALL_COG_TRIANGLES = [
    { id: 1, mode: 'Idealisme Modus',  color: '#a855f7', members: 'Ruler · Innocent · Sage' },
    { id: 2, mode: 'Exploratie Modus', color: '#3b82f6', members: 'Judge · Explorer · Artist' },
    { id: 3, mode: 'Impact Modus',     color: '#f97316', members: 'Lover · Outlaw · Magician' },
    { id: 4, mode: 'Engagement Modus', color: '#1d9904', members: 'Caregiver · Trickster · Hero' },
  ];

  // Generate and download a clean, document-style PDF
  const handleDownloadPdf = useCallback(async ({ shortVersion = false, previewMode: pvw = false } = {}) => {
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

      // ── Helper: sanitize Unicode that jsPDF's WinAnsi helvetica can't encode ──
      // Unencodable chars (arrows, emoji, etc.) render as boxes AND corrupt the run's
      // character-width math, which is what garbled text into "v e r w e r k i n g".
      const sanitizePdf = (str) => String(str ?? '')
        .replace(/—/g, ' - ')   // em-dash
        .replace(/–/g, ' - ')   // en-dash
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
        const boldColor = accent || [251, 191, 36];
        // Unicode sanitization handled by the hoisted sanitizePdf() (defined above).
        const lines = mdText.split('\n');
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
          // ## / ### heading
          if (/^#{2,}\s/.test(trimmed)) {
            const headText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
            ensureSpace(10);
            y += 3;
            pdf.setFontSize(10);
            pdf.setTextColor(...headColor);
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
          // Standalone bold line = styled subheader in PDF (e.g. **Wat jouw lens doorlaat**)
          const pdfBoldMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
          if (pdfBoldMatch) {
            const subhead = sanitizePdf(pdfBoldMatch[1]);
            ensureSpace(7);
            y += 2;
            pdf.setFontSize(9);
            pdf.setTextColor(...boldColor);
            pdf.setFont('helvetica', 'bold');
            const shLines = pdf.splitTextToSize(subhead, maxW);
            for (const sl of shLines) { ensureSpace(4.5); pdf.text(sl, x, y); y += 4.5; }
            y += 1;
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
        ctx.fillStyle = '#060612'; ctx.fillRect(0, 0, imgSize, imgSize); // opaque bg so JPEG corners blend with the page
        // Circular mask
        ctx.beginPath();
        ctx.arc(imgSize / 2, imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 0, 0, imgSize, imgSize);
        const imgData = imgCanvas.toDataURL('image/jpeg', 0.85);
        const pdfImgSize = 90;
        const imgX = W / 2 - pdfImgSize / 2;
        pdf.addImage(imgData, 'JPEG', imgX, y, pdfImgSize, pdfImgSize);
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

      // Quote — levensles for this extended archetype
      if (result.levensles) {
        y += 2;
        const quoteText = `\u201C${result.levensles}\u201D`;
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
            const disclaimerText = 'Meta-Disclaimer: Dit rapport is gegenereerd door het Garden For Life Deltawerken Model — een zelfreflectie-instrument, geen klinische diagnose. De gebruikte neurobiologische termen zijn metaforen binnen dit specifieke model. Raadpleeg een professional voor medisch of psychologisch advies.';
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
              renderSection(section.title, section.content, green);
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
            const dm = {};
            (result.archetypeDetails || []).forEach((d) => { dm[(d.key || '').toUpperCase()] = d; });
            const mainTot = dm[(result.mainArchetype || '').toUpperCase()]?.total || 0;
            const shadTot = dm[(result.shadowPartner || '').toUpperCase()]?.total || 0;
            const polGap = mainTot > 0 ? Math.round((Math.abs(mainTot - shadTot) / mainTot) * 100) : null;
            const polBand = polGap == null ? null
              : polGap > 60 ? 'Schaduw onderdrukt'
              : polGap > 30 ? 'Gezonde spanning'
              : 'Actieve integratie';
            const rows = [
              ['Kern', result.mainName, green],
              ['Support', result.secondaryName, orange],
              ['Schaduw', result.shadowName, purple],
              ['Blindspot', result.blindspotName, red],
              ...(polBand ? [['Polarisatie', polGap + '% — ' + polBand, amber]] : []),
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
          if (cRuntime?.d_curve && morphologyRef.current) {
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
              renderSection('De Stille Stem — ' + cleanTitle(section.title), section.content, purple);
              if (i < stilleSecs.length - 1) { hr(); gap(); }
            });
            noPageBreak = savedNPB;
          });
        }

        // ── p5: Afsluiting (closure — copy not yet written, placeholder page) ──
        await justifiedPage(async () => {
          y += 40;
          pdf.setFontSize(16); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...green);
          pdf.text('Tot Slot', W / 2, y, { align: 'center' });
          y += 12;
          pdf.setFontSize(9); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...dimWhite);
          const placeholder = pdf.splitTextToSize('Deze afsluiting wordt binnenkort toegevoegd.', contentW - 40);
          for (const l of placeholder) { pdf.text(l, W / 2, y, { align: 'center' }); y += 5; }
        });

        // ── Prune empty pages + save ──
        const tp = pdf.internal.getNumberOfPages();
        for (let p = tp; p >= 1; p--) { if (!pagesWithContent.has(p)) pdf.deletePage(p); }
        const an = (result?.extendedName || 'Archetype').replace(/\s+/g, '_');
        if (pvw) { try { onPreviewReadyRef.current?.(pdf.output('bloburl')); } catch (_) {} return; }
        pdf.save(`GardenForLife_${an}_kort.pdf`);
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
      sectionHeading('Belangrijke Context', green);
      writeWrapped('Verouderde persoonlijkheidstesten classificeren: ze plaatsen je in een type en tot ziens. Dit model leeft in je voort. Het brengt in kaart hoe jouw zenuwstelsel navigeert tussen aangeboren aanleg en aangeleerde strategie — en, doorslaggevend, hoe die configuratie zich houdt onder toenemende druk.\nNiet een classificatie, maar een dynamisch profiel.', margin + 2, y, contentW - 4, 8.5, white); y += 3;
      writeWrapped('Het rust op drie gouden draden, gesynchroniseerd tot één instrument: de archetypische psychologie van Carl Jung, het neurobiologische Triple Network Model (Menon e.a.), en de Big Five (OCEAN). De synthese meet niet alleen wát je doet, maar vanuit welke neurale laag je het doet.', margin + 2, y, contentW - 4, 8.5, white); y += 5;

      subtitle('Methodologische noot');
      writeWrapped('Een noot vooraf, in lijn met de discipline van het model: de neurowetenschappelijke termen die volgen zijn zuiver mechanistisch — beschrijvingen van verwerkingspatronen, geen klinische claims. Het model leest tendensen, geen vaststaande feiten. Waar het naar neigt, richting weegt, en dus nooit per definitie is.', margin + 2, y, contentW - 4, 8.5, dimWhite, 'italic'); y += 5;

      subtitle('Deltawerken');
      writeWrapped("Het Deltawerken model legt de waarde-oriëntatie vast: waarheid, goedheid, schoonheid — Plato's transcendentalia, hier niet als citaat maar als operationele as. Elk archetype navigeert middels deze drie polen. De driehoek bepaalt de dieptelaag: niet het gedrag, maar de oriëntatie eronder — waar een configuratie zich naartoe wendt wanneer het moet.", margin + 2, y, contentW - 4, 8.5, white); y += 4;
      const yAfterDelta3 = y;

      // Bottom-anchored block: Het Triple-Network-Wiel + Cells within Cells + closing.
      const P3_wiel = "Het Triple-Network-Wiel plaatst de twaalf kern-archetypen op een geometrische map, verankerd in de drie hersennetwerken die Menon en collega's beschreven: het Central Executive Network (orde, executie), het Default Mode Network (reflectie, betekenis) en het Salience Network (responsiviteit, adaptatie).\nDe geometrie is een extensie van het oosterse zodiak-wiel — dezelfde interne bruggen, dezelfde logica van magnetisme — maar opnieuw verankerd: niet in sterrenbeelden, in netwerken. De ankers zijn verbonden via vijf lijntypes, elk een ander soort relatie.";
      const P3_cells = 'Cells within Cells Interlinked levert de schaal-as: de geneste ontologische lagen, van fysiologische basisbehoefte via zelf en gemeenschap naar intimiteit en transcendentie.';
      const P3_close = 'Daarom meet dit instrument niet alleen persoonlijkheid maar de ontwikkelingslaag — de spanning tussen aanleg en conditionering. Piaget noemde het cognitieve stadia; Jung individuatie. De vraag is alleen: hoe meet je waar iemand op die lagen staat?';
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
      subtitle('Het Triple-Network-Wiel');
      writeWrapped(P3_wiel, margin + 2, y, contentW - 4, 8.5, white); y += 5;
      subtitle('Cells within Cells');
      writeWrapped(P3_cells, margin + 2, y, contentW - 4, 8.5, white); y += 3;
      writeWrapped(P3_close, margin + 2, y, contentW - 4, 8.5, white);

      // ── PAGE 4: Van Vraag naar Score (Wat-leest centered, Dat-leest+legend bottom-anchored) ──
      pdf.addPage(); paintBg(); markPage(); y = margin;
      sectionHeading('Van vraag naar verband', purple);

      let vvNarrowW = contentW - 4, vvImgTop = y, vvImgBottom = y;
      try {
        const cImg = await loadImg(cellsImg);
        const ratioH = cImg.naturalHeight / cImg.naturalWidth;
        let cW = contentW * 0.42; let cH = cW * ratioH;
        const cX = margin + contentW - cW; const cY = y + 4 + H * 0.10; // moved down 10%
        pdf.addImage(cellsImg, 'PNG', cX, cY, cW, cH);
        pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...mutedGray);
        const lbl = 'Cells within Cells'; pdf.text(lbl, cX + cW - pdf.getTextWidth(lbl), cY + 4.5);
        vvImgTop = cY; vvImgBottom = cY + cH; vvNarrowW = (cX - 4) - (margin + 2);
      } catch { /* image load failed */ }

      flowAroundImage([
        'Het antwoord begint bij 36 vragen over vijf domeinen: Zelf, Ander, Macht, Wijsheid en Mysterie. Elke vraag biedt zes antwoorden — drie vanuit Nature (het ongedwongen instinct) en drie vanuit Culture (de aangeleerde strategie). Je kiest tussen geen en twee: de eerste is de kern, de tweede resoneert maar weegt minder zwaar. Samen: 72 datapunten.',
        "Het onderscheid Nature/Culture rust op Vervaeke's 4P-model van kennen. Nature = participatory en perspectival knowing: je weet het doordat je het bent. Culture = propositional en procedural knowing: je weet dat je het hebt en hoe je ermee navigeert. Beide antwoorden voelen even authentiek; het verschil zit in de korrel van de taal, niet in de oppervlakte.",
        'Elke keuze distribueert punten naar meerdere vectors, het vloeit door de geometrische verbindingen van het wiel.\nEen Nature-keuze activeert de gedeelde hardware en werpt tegelijk een schaduw naar de 180°-tegenpool.\nEen Culture-keuze activeert het aangeleerde netwerk, de gele driehoek.\nGeen enkel datapunt staat op zichzelf; gedrag resoneert door de netwerken heen, consistent met Menons werk over cross-network connectiviteit en Raichles Default Mode-hypothese.',
        'Het resultaat is geen positie maar een verdeling: een geometrie.\nEn omdat elke keuze door vijf kanalen tegelijk bloedt, convergeren verschillende antwoordpaden vrijwel nooit op dezelfde eindvorm —\nde antwoordruimte telt 30^36 configuraties, een getal van 54 cijfers. Geen twee profielen zijn gelijk, en toch verschuilt zich in die chaos een gedeeld patroon.',
      ], margin + 2, vvNarrowW, contentW - 4, vvImgTop, vvImgBottom, 8.5, white);
      const yAfterVanVraag4 = y;

      // Strings for the centered + bottom-anchored blocks.
      const P4_wat = 'Want het bovenstaande beschrijft de meting bij rust. De werkelijke diepte ligt in de transformatie-delta: voor elke configuratie modelleren we niet alleen hoe ze (animistische delen) zich uitdrukt bij basislast, maar hoe ze vervormt naarmate de druk oploopt — waar ze het langst standhoudt, op welk punt ze omslaat, en hoe het herstel verloopt.\nDit is de plastische laag: een traject van baseline, via belasting, naar bezwijken, met het mechanisme benoemd bij elke fase.';
      const P4_dat = 'Dat is wat het rapport hierna doet. Geen typebeschrijving, maar een dynamische analyse van jouw scoreprofiel — geschreven in de taal van je dominante netwerk, gericht op de vorm van je veerkracht: waar je rust, waar je rekt, en wat het je kost om overeind te blijven. Hiervoor moeten we eerst de structuur blootleggen.';
      const P4_lijnIntro = 'De vijf verbindingen volgen uit de positie op het wiel, en elk routeert punten anders:';
      const B = {
        groen: '— gedeelde hardware. Buur-archetypen in dezelfde biologische groep draaien op dezelfde neurale grond. De stevigste, meest moeiteloze koppeling. (Nature)',
        paars: '— de schaduw-as (180°). De tegenpool die de configuratie naar zich toe spiegelt. Grootste groeirichting.',
        blauw: '— de feedback-brug. Kruist de groepen en draagt reorganisatie: een runtime-kanaal dat tegengewicht overbrengt.',
        geel:  '— de aangeleerde driehoek. Archetypen zonder biologische verwantschap, door conditionering tot één getraind netwerk gesmeed. (Culture)',
        rood:  '— de frictie-as. De cross-group botsing waar de neurale schaduw zijn oorsprong heeft; de plek waar projectie ontstaat.',
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
        const ln = pdf.splitTextToSize(sanitizePdf(k.charAt(0).toUpperCase() + k.slice(1) + ' ' + B[k]), bulletWrap4).length;
        bulletsH4 += ln * lh4 + 2.5;
      }
      const bottomBlockH4 = subH4 + datLines * lh4 + 5 + subH4 + introLines4 * lh4 + 3 + bulletsH4;
      const bottomStartY4 = (H - margin) - bottomBlockH4 - 2;

      // Wat het instrument leest — perfectly centered on page height.
      const watLines = pdf.splitTextToSize(sanitizePdf(P4_wat), contentW - 4).length;
      const watBlockH = subH4 + watLines * lh4;
      y = Math.max(yAfterVanVraag4 + 4, (H - watBlockH) / 2);
      subtitle('Wat het instrument leest');
      writeWrapped(P4_wat, margin + 2, y, contentW - 4, 8.5, white);

      // Bottom-anchored: Dat is wat het rapport leest + De vijf lijntypes + TNM wiel.
      y = bottomStartY4;
      subtitle('Dat is wat het rapport leest');
      writeWrapped(P4_dat, margin + 2, y, contentW - 4, 8.5, white); y += 5;
      subtitle('De vijf lijntypes');
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
      coloredBullet('Groen', green, B.groen, lijnRightXr);
      coloredBullet('Paars', purple, B.paars, lijnRightXr);
      coloredBullet('Blauw', blue, B.blauw, lijnRightXr);
      coloredBullet('Geel', amber, B.geel, lijnRightXr);
      coloredBullet('Rood', red, B.rood, lijnRightXr);

      // ═══════════════════════════════════════════════════
      // PAGE 4: DE TAAL VAN DE TEST (was page 5)
      // ═══════════════════════════════════════════════════
      await justifiedPage(async (gap) => {

      sectionHeading('De taal van de test', purple);

      writeWrapped(
        'Want die structuur rust op universele geometrie: eeuwenoude wijsheid, vertaald in spiritualiteit. De numerologie is niet ontworpen maar ontdekt \u2014 het resoneert met oude mythologie\u00EBn \u00E9n met moderne wetenschap; kwantumfysica, neurobiologie, astronomie. Niet te verwarren met astrologie; dit raakt van nature aan persoonlijkheidspsychologie.',
        margin + 2, y, contentW - 4, 9, white
      );
      y += 4;
      writeWrapped(
        'Realiteit wordt pas kenbaar door differentiatie: de splitsing naar twee. Maar wat is determinatie waard wanneer alles vastligt? De derde as is de motor van transformatie \u2014 deze verschijning is het patroon van onze gemodelleerde psychologie, de plek waar beweging ontstaat.',
        margin + 2, y, contentW - 4, 9, white
      );
      y += 4;
      writeWrapped(
        'Westerse neurobiologie wijst op een tweedeling van het brein: een gebalanceerde deling tussen orde en chaos. Waar die twee elkaar raken, kristalliseren zes biologische cognitieve netwerken uit \u2014 gehardwired, de grond waarop alles wat volgt is gebouwd:',
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
          ['2', '12 = 3 \u00D7 2\u00B2','Start van complexiteit',              '12 archetypen op het wiel'],
          ['3', '36 = 3\u00B2 \u00D7 2\u00B2','3 in het kwadraat \u00D7 4',  '36 vragen (3 per archetype)'],
          ['4', '72 = 3\u00B2 \u00D7 2\u00B3','binaire verdubbeling',        '72 keuzes, 72 uitgebreide uitkomsten'],
        ],
        [16, 42, 52, 64],
        { fontSize: 7, vPad: 3 }
      );

      y += 5;
      gap();
      subtitle('Atoom \u2014 3');
      writeWrapped(
        'Drie is het ware atoom. Al het andere is drie \u2014 verdubbeld, gekwadrateerd, of als faculteit berekend: drie netwerken, verdubbeld door polariteit, verdubbeld door individuatie, gekwadrateerd tot vragen, verdubbeld tot keuzes, als faculteit tot punten.',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 3;
      subtitle('Atoom \u2014 6');
      writeWrapped(
        'Vijf doorbreekt als enige het patroon \u2014 maar vijf is zelf twee plus drie: 2\u00D79 vragen, 3\u00D76 domeinen. De triade, herenigd met haar dualiteitsoperator. Het systeem rust op een drie die onophoudelijk in een spiegel kijkt. Zelf-9 en Ander-9 sturen Macht-6, Magie-6 en de gespiegelde Wijsheid-6. Zes is het atoom van het hele systeem, en alles vloeit daaruit voort:',
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

      writeWrapped(
        'En de getallen blijven terugkeren \u2014 niet alleen in de meetkunde, maar in de oudheid en de mythologie, los van elkaar, eeuwen uiteen.',
        margin + 2, y, contentW - 4, 8.5, white
      );
      y += 3;
      writeWrapped(
        'E\u00E9n keer is toeval. Twee keer is opmerkelijk. Wanneer hetzelfde getal opduikt in de meetkunde, de oudheid en de mythologie \u2014 los van elkaar, eeuwen uit elkaar \u2014 wordt toeval de minst waarschijnlijke verklaring. Dit is de structuur waarop onze lezing rust.',
        margin + 2, y, contentW - 4, 8.5, dimWhite, 'italic'
      );
      y += 5;
      gap();

      drawTable(
        ['Traditie / Discipline', 'Het Concept', 'Betekenis & Belang', 'Thematische Kruisverwijzing'],
        [
          ['Hellenistische Oudheid', 'De 72 Vertalers (Septuagint)', 'Volgens de Brief van Aristeas koos de hogepriester zes vertalers uit elk van de twaalf stammen — 12 × 6 = 72 — die de Torah in het Grieks vertaalden.', 'Overdracht van Wijsheid'],
          ['Numerologie',          'Oneindige Voltooiing',     '8 (Oneindigheid) \u00D7 9 (Voltooiing) = 72. Reduceert tot 9 (7+2), het getal van dienstbaarheid.', 'Transformatie & Wedergeboorte'],
          ['Heilige Geometrie',   'De Vijfhoek',               '72 graden is de exacte middelpuntshoek van een regelmatige vijfhoek.', 'Goddelijke Architectuur'],
          ['Astronomie',          'Precessie van de equinoxen', 'De zon verplaatst zich elke 72 jaar 1 graad t.o.v. de sterrenbeelden (cyclus van 25.920 jaar).', 'Kosmisch Uurwerk'],
          ['Chinese Mythologie',  '72 Transformaties',         'Sun Wukong beheerst 72 Aardse-Demon transformaties voor ultiem aanpassingsvermogen.', 'Controle over Chaos'],
          ['Chinese Filosofie',   '72 Discipelen',             'Confucius had 72 kerndiscipelen die zijn werk volledig beheersten.', 'Verspreiding over de Wereld'],
          ['Chinese Mythologie',  '72 Grotten',                'De Bloemen-Fruitberg telt 72 grotten, elk met een demonenkoning die eer bewijst.', 'Kosmisch Bestuur'],
          ['Joodse Mystiek',      '72 Namen van God',          '72 drietallen van Hebreeuwse letters afgeleid uit Exodus, kanalen voor goddelijke transformatie.', 'Goddelijke Architectuur'],
          ['Joodse Mystiek',      '72 Engelen',                'De wereld krijgt supervisie van 72 beschermengelen, elk met een specifiek deel van de aarde.', 'Kosmisch Bestuur'],
          ['Westerse Esoterie',   'De 72 Geesten (Ars Goetia)', 'De Ars Goetia somt exact 72 geesten op — bewust gespiegeld aan de 72 engelen van de Shem HaMephorash: licht en schaduw op hetzelfde getal.', 'Kaart van de Schaduw'],
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
      });

      // ═══════════════════════════════════════════════════
      // PAGE 6: HOE HET RAPPORT ONTSTAAT (vier stappen)
      // ═══════════════════════════════════════════════════
      await justifiedPage(async (gap) => {
      const savedNPBhro = noPageBreak; noPageBreak = true; // no bottom padding — let content flow to the page edge, never spill to a new page

      // ── Hoe Het Rapport Ontstaat — vier stappen ──
      sectionHeading('Hoe Het Rapport Ontstaat', orange);

      const leadPara = (lead, leadColor, rest) => {
        // Subtitle on its own line — blue and larger, matching the report's other sub-headings.
        ensureSpace(10);
        pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...blue);
        pdf.text(sanitizePdf(lead), margin + 2, y);
        y += 5;
        writeWrapped(rest, margin + 2, y, contentW - 4, 8.5, white);
        y += 3;
      };

      writeWrapped('En zo ontstaat je rapport. Geen twee rapporten lezen hetzelfde \u2014 niet alleen in inhoud, maar in toon. Taal en structuur worden afgestemd op je dominante netwerk: analytisch en gestructureerd voor CEN, reflectief en associatief voor DMN, direct en responsief voor het Salience Network. Het rapport spreekt, met andere woorden, de taal van het systeem dat het beschrijft.\nWat volgt is geen typebeschrijving uit een printer, maar een hologram die in meerdere stappen uit jouw antwoordprofiel wordt opgebouwd.', margin + 2, y, contentW - 4, 8.5, white);
      y += 5;

      leadPara("De geometrische echo's", green, "Na de toetsing berekent het systeem geen rijtje scores maar een gelaagde geometrie. Elke keuze heeft door de vijf kanalen van het wiel gebloed, en dat laat sporen na: schaduwen geworpen naar de tegenpolen, gewicht verschoven naar ondersteunende archetypen, polarisatie tussen wat sterk en wat onderdrukt staat. Deze echo's \u2014 niet de kale totalen \u2014 vormen de werkelijke vorm die gelezen wordt. Twee mensen met dezelfde top-archetypen kunnen een volstrekt andere geometrie hebben.");
      leadPara("Main \u00D7 Support \u2014 de relationele lezing", purple, "Je resultaat is geen archetype maar een relatie. Het dominante archetype levert het anker; de resterende, via hen biologische groep, kleuren hoe dit anker zich uitdrukt. Dezelfde Minnaar leest anders met een ordenend support dan met een ontwrichtend support \u2014 de gave \u00E9n de valkuil ontstaan juist in die combinatie, niet in het archetype alleen.\nZo worden twaalf kernen twee\u00EBnzeventig configuraties: de relatie is de eenheid van de lezing, niet het etiket.");
      leadPara('De analyse', amber, "Het taalmodel Claude leest dit volledige profiel tegen het complete Deltawerken-framework: de drie bronmodellen, de archetype-profielen, en de twee\u00EBnzeventig Extended Archetypes. Is er eigen OCEAN-data aangeleverd, dan wordt die als verdieping ge\u00EFntegreerd \u2014 inclusief, juist op de plekken waar de gemeten persoonlijkheid en de geometrie uiteenlopen.\nDie divergentie wordt niet gladgestreken; ze is vaak het meest verhelderende deel van de lezing.");
      leadPara('De toestand-lezing', red, "Dus, het rapport leest niet alleen wie je bent bij rust, maar hoe je configuratie zich houdt onder druk. Voor elk profiel modelleert het de plastische laag: waar je het sterkst staat, waar je rekt, op welk punt je omslaat, en hoe het herstel verloopt. Dit is wat een statisch type nooit kan tonen \u2014 de vorm van je veerkracht, en wat het je kost om overeind te blijven.\n\nWat nu volgt, is precies dat \u2014 voor jou.");

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

      sectionHeading('Wetenschappelijke Context', orange);
      writeWrapped('Het Deltawerken Model is een zelfreflectie-instrument, geen klinisch diagnostisch systeem. De neurobiologische termen worden conceptueel ingezet \u2014 wetenschappelijk onderzoek als inspiratiebron en denkkader, niet als diagnostische claim.', margin + 2, y, contentW - 4, 8.5, white);
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
      pdf.text('Empirisch fundament', margin + 2, y); y += 5;

      refEntry('Archetypische psychologie', "C.G. Jung (1921), Psychological Types; Carol Pearson (1991), Awakening the Heroes Within");
      refEntry('Neurale netwerken', "V. Menon (2011), Large-scale brain networks, Trends Cogn. Sci.; M.E. Raichle (2001), A default mode of brain function, PNAS");
      refEntry('Default Mode & interne simulatie', "R.L. Buckner (2008), The brain's default network, Annals NYAS; K. Christoff (2016), Mind-wandering as spontaneous thought, Nat. Rev. Neurosci.");
      refEntry('Voorspellend brein', "K. Friston (2010), The free-energy principle, Nat. Rev. Neurosci.; G. Buzs\u00E1ki (2019), The Brain from Inside Out");
      refEntry('Netwerkdynamiek & binding', "D. Bassett (2011), Dynamic reconfiguration of brain networks, PNAS; G. Buzs\u00E1ki & X.-J. Wang (2012), Mechanisms of gamma oscillations, Annu. Rev. Neurosci.");
      refEntry('Entropie & herorganisatie', "R. Carhart-Harris (2014), The entropic brain, Front. Hum. Neurosci.; R. Carhart-Harris & K. Friston (2019), REBUS and the anarchic brain, Pharmacol. Rev.");
      refEntry('Persoonlijkheidstheorie', "P.T. Costa & R.R. McCrae (1992), NEO-PI-R; L.R. Goldberg (1993), Phenotypic personality traits, Am. Psychol.; C. DeYoung (2015), Cybernetic Big Five Theory, J. Res. Pers.");
      refEntry('Motivatie & drijfveer', "J. Panksepp (1998), Affective Neuroscience; J. Gray & N. McNaughton (2000), The Neuropsychology of Anxiety; E. Aston-Jones & J. Cohen (2005), LC-NE function, Annu. Rev. Neurosci.");
      refEntry('Emotie & belichaming', "L.F. Barrett (2017), How Emotions Are Made; A. Damasio (2003), Looking for Spinoza; M. Solms (2021), The Hidden Spring; A. Seth (2021), Being You");
      refEntry('Perceptie & hemisferische asymmetrie', "L. Robertson & R. Ivry (1998), The Two Sides of Perception");
      refEntry('Beperking & context', "A. Juarrero (2023), Context Changes Everything");
      refEntry('Cognitieve ontwikkeling', "J. Piaget (1954), The Construction of Reality in the Child; R. Kegan (1994), In Over Our Heads; J. Vervaeke (2019), Awakening from the Meaning Crisis; J. Peterson (1999), Maps of Meaning");
      refEntry('Psychodynamiek, empirisch getrieerd', "D. Westen (1999), The scientific status of unconscious processes, Psychol. Bull.");
      refEntry('Stress-neuroplasticiteit', "S. Russo & E. Nestler (2013), Brain reward circuitry in mood disorders, Nat. Rev. Neurosci.; R. Shansky et al. (2009), dendritische hermodellering; R. Duman & G. Aghajanian (2012), Synaptic dysfunction in depression, Science");
      refEntry('Multischaal-biologie', "M. Levin (2019), The computational boundary of a 'self', Front. Psychol.");
      refEntry('Relationele co-regulatie', "J. Coutinho et al. (2021), Cardiac synchrony in dyadic co-regulation, Psychophysiology; D. Palumbo et al. (2017), Interpersonal autonomic physiology");
      refEntry('Creativiteit & neurale integratie', "M. Benedek et al. (2014), Brain connectivity during creative cognition, Neuropsychologia; R.E. Beaty et al. (2018), Robust prediction of creativity from brain activity, PNAS");

      y += 1.5;
      ensureSpace(8);
      writeWrapped('Theoretische & frontier-ankers \u2014 richtinggevend, bewust lichter gewogen; nooit dragend voor een afzonderlijke waarde.', margin + 2, y, contentW - 4, 8, dimWhite, 'italic');
      y += 2;

      refEntry('Bewustzijnstheorie', "G. Tononi e.a. (2023), IIT 4.0, PLoS Comput. Biol.; Cogitate Consortium (2025), Adversarial testing of consciousness theories, Nature");
      refEntry('Oscillatoir bindingsveld', "J. McFadden (2020), Integrating information in the brain's EM field (CEMI), Neurosci. Conscious.");
      refEntry('Emergentie op schaaldrempels', "J. Wei e.a. (2022), Emergent abilities of LLMs; R. Schaeffer e.a. (2023), Are emergent abilities a mirage?; Templeton e.a. (2024), Scaling Monosemanticity");
      refEntry('Ontologische verankering', "D. Bohm (1980), Wholeness and the Implicate Order; E. Verlinde (2016), Emergent gravity and the dark universe; B. Kastrup (2019), Reasonable inferences from quantum mechanics");

      y += 3;
      writeWrapped('Niet elke bron weegt even zwaar. Menon, Friston en de stress-neuroplasticiteit-literatuur dragen het meeste gewicht; de theoretische ankers zijn richtinggevend maar opener, en worden navenant lichter gewogen \u2014 nooit als vaststaand fundament behandeld. Volledige bronverantwoording \u2014 inclusief waar wij afwijken en wat onze claims zou weerleggen \u2014 onder Bronnen & Verantwoording.', margin + 2, y, contentW - 4, 8, dimWhite);
      });
      endWetContext();

            // ═══════════════════════════════════════════════════
      // CONTENT PAGES (Waarom/Essentie/Vermenigvuldiging/Shadow/Blindspot removed — AI sections cover these deeper)
      // ═══════════════════════════════════════════════════
      /* eslint-disable no-constant-condition */
      if (false) { await justifiedPage(async (gap) => {

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
      } // end if(false) — removed content pages
      /* eslint-enable no-constant-condition */

      // ── Page 4: PERSOONLIJKHEIDSRAPPORT VERGELIJKING (OCEAN, IF-state) ──
      // Master Prompt v4.1 §5.4: NEVER model-derived OCEAN (D-10). Upload present →
      // uploaded-values table + 5 per-trait sections (O,C on p1; E,A,N on p2). No upload →
      // 1 page tendency reads, NO numbers + explicit instrument-disclaimer.
      const hasOceanUpload = !!uploadedOceanScores;
      const OCEAN_DIMS_P = ['O', 'C', 'E', 'A', 'N'];
      const OCEAN_FULL_P = { O: 'Openheid', C: 'Ordelijkheid', E: 'Extraversie', A: 'Meegaandheid', N: 'Neuroticisme' };
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
          ? (language === 'en'
              ? 'No external OCEAN report was uploaded. The reads below are hedged tendencies grounded in your geometry — NOT measured Big Five scores. For an accurate trait reading, take a validated OCEAN/Big Five test.'
              : 'Er is geen extern OCEAN-rapport geüpload. De lezingen hieronder zijn gehedgde tendensen, gegrond in je geometrie — GEEN gemeten Big Five-scores. Voor een accurate trait-lezing neem je een gevalideerde OCEAN/Big Five-test af.')
          : (language === 'en'
              ? 'This model translates how your configuration EXPRESSES each trait; it does not measure or certify the traits themselves. An accurate trait reading requires a real OCEAN instrument.'
              : 'Dit model VERTAALT hoe jouw configuratie elk trait uitdrukt; het meet of certificeert de traits niet. Een accurate trait-lezing vereist een echt OCEAN-instrument.');
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
        pdf.text(language === 'en' ? 'UPLOADED OCEAN VALUES' : 'GEÜPLOADE OCEAN-WAARDEN', margin + 2, y);
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

      // ── OCEAN page 1: title + subtitle + (upload: table + Trait O/C  |  no-upload: all reads) ──
      const endOceanCore = trackBlock('ocean_core');
      if (oceanTraitSections.length > 0 || hasOceanUpload) {
        await justifiedPage(async (gap) => {
          sectionHeading(sectionTitle('ocean_page', language), blue);
          oceanSubtitle();
          if (hasOceanUpload) {
            drawUploadedOceanTable();
            gap();
            oceanDisclaimer(false);   // between the values table and the first trait
            gap();
            const p1 = [oceanTraitOf('O'), oceanTraitOf('C')].filter(Boolean);
            p1.forEach((s, i) => {
              renderSection(s.title, s.content, cyan, { small: true }); // 50% trait subtitle
              if (i < p1.length - 1) { gap(); } // no hr — headings separate the traits, saves height
            });
          } else {
            oceanDisclaimer(true);    // up top, before the tendency reads (no table in this path)
            gap();
            oceanTraitSections.forEach((s, i) => {
              renderSection(s.title, s.content, cyan, { small: true }); // 50% trait subtitle
              if (i < oceanTraitSections.length - 1) { hr(); gap(); }
            });
          }
        });
      }
      endOceanCore();

      // ── OCEAN page 2 (upload only): Trait E + Trait A + Trait N (disclaimer now on page 1) ──
      const endOceanComp = trackBlock('ocean_comp');
      const oceanP2 = hasOceanUpload ? [oceanTraitOf('E'), oceanTraitOf('A'), oceanTraitOf('N')].filter(Boolean) : [];
      if (oceanP2.length > 0) {
        await justifiedPage(async (gap) => {
          // No bottom padding on this page: let the text flow all the way down to the page edge
          // (the extra ~18mm of room keeps the 3 traits from being pushed to a third page).
          const savedNPB = noPageBreak;
          noPageBreak = true;
          oceanP2.forEach((s, i) => {
            renderSection(s.title, s.content, cyan, { small: true }); // 50% trait subtitle
            if (i < oceanP2.length - 1) { gap(); } // no hr — headings separate the traits, saves height
          });
          noPageBreak = savedNPB;
        });
      }
      endOceanComp();

      // ── Page 5: PLASTISCHE MORFOLOGIE — engine D-curve chart + 3 reads ──
      // Master Prompt v4.1 §5.5: chart is render-side (engine cRuntime, ~30% page height),
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
      const hasMorphChart = !!(cRuntime?.d_curve && morphologyRef.current);
      if (hasMorphChart || morphPage.length > 0) {
        pdf.addPage(); paintBg(); markPage(); y = margin;
        sectionHeading(sectionTitle('morphology_page', language), cyan);

        // Chart FULL-WIDTH (so the in-chart labels are readable), caption BELOW it.
        if (hasMorphChart) {
          try {
            const morphCanvas = await html2canvas(morphologyRef.current, {
              backgroundColor: '#060612', scale: 2, useCORS: true, logging: false,
            });
            const morphImg = morphCanvas.toDataURL('image/jpeg', 0.85);
            const capTxt = language === 'en'
              ? 'Main and Support show each archetype’s absolute cost-curve (0–100). Samengesteld (composed) is the blended load normalised to its own peak (=100%) — it shows the SHAPE within your configuration, not an absolute comparison, so it can sit above the individual lines.'
              : 'Hoofd en Support tonen elk de absolute kostencurve van het archetype (0–100). Samengesteld is de gecombineerde belasting, genormaliseerd op zijn eigen piek (=100%) — het toont de VORM binnen jouw configuratie, geen absolute vergelijking, en kan daarom boven de losse lijnen liggen.';

            const innerPad = 3;
            const MORPH_SCALE = 0.75;                         // 25% smaller than full width
            const chartW = (contentW - innerPad * 2) * MORPH_SCALE;
            let chartH = (morphCanvas.height / morphCanvas.width) * chartW;
            if (chartH > 101) { chartH = 101; }              // cap chart height (135 × 0.75)
            const boxW = chartW + innerPad * 2;
            const boxH = chartH + innerPad * 2;
            const boxX = margin + (contentW - boxW) / 2;     // centered
            ensureSpace(boxH + 4);
            // Bordered box around the (centered) chart
            pdf.setDrawColor(...cyan);
            pdf.setLineWidth(0.4);
            pdf.rect(boxX, y, boxW, boxH);
            pdf.addImage(morphImg, 'JPEG', boxX + innerPad, y + innerPad, chartW, chartH);
            y += boxH + 4;
            // Caption below the chart, full width
            pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...mutedGray);
            const lineH = 3.6;
            for (const cl of pdf.splitTextToSize(sanitizePdf(capTxt), contentW)) { ensureSpace(lineH); pdf.text(cl, margin, y + 2); y += lineH; }
            y += 5;
          } catch { y += 4; }
        }

        // Master Prompt v4.3 §5.5 — TWO pages: Page A = chart + DE VORM; Page B = DE HARDWARE
        // ONDER DRUK + DE OVERGANG (no chart). Split the reads accordingly.
        const pageAReads = morphPage.filter(s => morphRank(s) === 0);   // DE VORM
        const pageBReads = morphPage.filter(s => morphRank(s) >= 1);    // Hardware + Overgang (+ fallback)
        // Page A: DE VORM directly under the chart — no bottom padding, let the text flow
        // down to the page edge instead of breaking early.
        const savedNPBmorph = noPageBreak; noPageBreak = true;
        pageAReads.forEach((section, i) => {
          renderSection(section.title, relabelProse(section.content, language), cyan);
          if (i < pageAReads.length - 1) hr();
        });
        noPageBreak = savedNPBmorph;
        // Page B: the deeper mechanism reads on a fresh page (no chart)
        if (pageBReads.length > 0) {
          pdf.addPage(); paintBg(); markPage(); y = margin;
          // (no page-level "— vervolg" heading; the section headings below carry the page)
          pageBReads.forEach((section, i) => {
            renderSection(section.title, relabelProse(section.content, language), cyan);
            if (i < pageBReads.length - 1) hr();
          });
        }
      }
      endMorphology();

      // ── DUAL-CORE DYNAMICS + RADAR CHART (page 5) ──
      const endDualCore = trackBlock('dual_core');
      await justifiedPage(async (gap) => {
      const savedNPBdc = noPageBreak; noPageBreak = true; // no bottom padding — let text flow to edge
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
          renderSection(section.title, section.content, amber);
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
        if (caption) sectionHeading('Visuele Analyse — Triple Network Wiel', green);
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
        sectionHeading('Groep Dynamiek — Neurobiologische Interpretatie', cyan);
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
          !/cognitieve\s*driehoek|aangeleerde\s*lens/i.test(s.title || '') &&
          !/persoonlijkheidsrapport.*vergelijk/i.test(s.title) &&
          !/^1[23]\s*[ab][\s.:]/i.test(s.title || '') &&
          !/professionele\s+resonantie|creatieve\s+resonantie/i.test(s.title || '') &&
          // OCEAN per-trait sections render on the OCEAN page — drop from prose catch-all.
          !/^\**\s*trait\s+[ocean]\b/i.test(cleanTitle(s.title || '')) &&
          // Het OCEAN-profiel narrative / OCEAN-gereedschap subtitle / OCEAN intro — these are
          // render-side titles, not narrative sections. When an upload is present the AI may also
          // emit an OCEAN profile introduction; never render it (the OCEAN page is render-driven).
          !/het\s+ocean.?profiel|ocean.?profiel|ocean.?gereedschap/i.test(cleanTitle(s.title || '')) &&
          // The machine block (PROFIEL DATA VOOR AI VERWERKING) is the model's, but the renderer
          // draws its own authoritative `data` page — drop the AI's copy to avoid a duplicate.
          !/profiel\s*data|ai[\s-]*verwerking/i.test(cleanTitle(s.title || '')) &&
          // "Radar-lezing": never render — the radar chart covers it.
          !/radar.?lezing/i.test(s.title || '') &&
          // Stray AI-emitted sections that aren't part of the page-map — never render.
          !/(samenvattende\s+)?kernlezing|centrale\s+spanning/i.test(s.title || '') &&
          // v3 leftover the model sometimes reverts to (Aarde/Water/Lucht/Vuur/Ether) — not a
          // v4.1 section; §5.8 is Alchemie/Schakelbord/Ontologie. Never render.
          !/geometrische\s+element|vijf\s+(geometrische\s+)?element|\bvijf\s+element/i.test(cleanTitle(s.title || '')) &&
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
            if (t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi')) return amber;
            if (t.includes('resonantie')) return green;
            return green; // fallback
          };

          // Separate intro/disclaimer and AI agent prompt — they always share one dedicated page
          const regularSections = mainSections.filter(s =>
            !s.isAgentPrompt &&
            !/ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt|reflectie.*prompt|ai.*reflectie/i.test(s.title) &&
            !s.title?.toLowerCase().includes('introductie')
          );
          const disclaimerSection = mainSections.find(s => s.title?.toLowerCase().includes('introductie'));
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
          const group1aSections = regularSections.filter(s => isGroup1a(s.title));
          const group1bSections = regularSections.filter(s => isGroup1b(s.title));
          const group2Sections  = regularSections.filter(s => isGroup2(s.title));
          const morphSections   = regularSections.filter(s => isMorph(s.title));
          const stilleSections  = regularSections.filter(s => isStille(s.title));
          // STRICT ALLOWLIST: every real v4.3 narrative section is claimed by a specific page
          // collector (identity/essence/shadow/OCEAN-traits/morph/stille/resonance/yellow/ai-prompt).
          // Anything left over is NOT part of the spec — a fabricated/echoed section — so we DROP it
          // entirely rather than render it on a stray "others" page.
          const otherSections = regularSections.filter(s =>
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

          const endGroup1a = trackBlock('group1a');
          // ── Page 7: Identiteit + Waarom (with the fixed Meta-Disclaimer on top) ──
          if (identityPage.length > 0) {
            await justifiedPage(async (gap) => {
            const savedNPB = noPageBreak;
            noPageBreak = true; // no bottom padding — let the text flow down to the page edge

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
            pdf.setFillColor(249, 115, 22);
            pdf.rect(disclaimerX, y, disclaimerW, 0.75, 'F');
            pdf.setTextColor(200, 200, 215);
            let dlY = y + 5;
            for (const line of disclaimerLines) {
              pdf.text(line, disclaimerX + 5, dlY);
              dlY += 3.5;
            }
            y += dlH + 8; // doubled padding between the meta-disclaimer and the first section
            gap();

            identityPage.forEach((section, i) => {
              renderSection(section.title, section.content, getPdfSectionColor(section.title));
              if (i < identityPage.length - 1) { hr(); gap(); }
            });
            noPageBreak = savedNPB;
            });
          }
          // ── Page 2: Essentie + Vermenigvuldiging (intro + 3 labeled aspects each) ──
          if (essencePage.length > 0) {
            await justifiedPage(async (gap) => {
            essencePage.forEach((section, i) => {
              renderSection(section.title, injectAspectSubtitles(section.content, language), getPdfSectionColor(section.title));
              if (i < essencePage.length - 1) { hr(); gap(); }
            });
            });
          }
          endGroup1a();

          // ── Page 3: Schaduw + Blindspot, then the TNM wheel in the leftover space ──
          // Master Prompt v4.1 §5.3: radar = visual only, no caption. The wheel is bottom-
          // anchored and drawn at an absolute position (no ensureSpace) so it sits in the
          // space below the text and may bleed into the bottom spacer — never page-breaks.
          const endGroup1b = trackBlock('group1b');
          // Order: Schaduw before Blindspot.
          const shadowBlindspotSections = group1bSections.sort((a, b) =>
            (cleanTitle(a.title || '').toLowerCase().includes('schaduw') ? 0 : 1) -
            (cleanTitle(b.title || '').toLowerCase().includes('schaduw') ? 0 : 1));
          const radarEl = pdfRadarRef.current || radarRef.current;
          if (group1bSections.length > 0 || radarEl) {
            await justifiedPage(async (gap) => {
            // Radar chart (Visuele Analyse) ABOVE the content — height-capped, no caption (§5.3).
            if (radarEl) {
              try {
                const canvas = await html2canvas(radarEl, {
                  backgroundColor: '#060612', scale: 2, useCORS: true, logging: false,
                });
                const img = canvas.toDataURL('image/jpeg', 0.85);
                const maxH = 76.5;                             // 15% smaller; leaves room for 2 sections + TNM wheel
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
            }
            // Schaduw + Blindspot below the radar
            for (let gi = 0; gi < shadowBlindspotSections.length; gi++) {
              const section = shadowBlindspotSections[gi];
              renderSection(section.title, section.content, getPdfSectionColor(section.title));
              if (gi < shadowBlindspotSections.length - 1) { hr(); gap(); }
            }
            // ── TNM WHEEL — the static model image (same asset/size as page 5) placed in the
            //    leftover space below the text. Static image → no capture/clip risk. ──
            try {
              const tnmEl = await new Promise((res, rej) => {
                const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = tnmWheelImg;
              });
              const availH = (H - 6) - (y + 1);                  // room down to ~6mm from page edge
              if (availH > 18) {
                const FIXED_TNM_H = 50;                           // fixed height (predictable size)
                const finalH = Math.min(FIXED_TNM_H, availH);    // fixed, only shrinks if the page is full (never clips)
                const finalW = (tnmEl.naturalWidth / tnmEl.naturalHeight) * finalH;
                const offsetX = margin + (contentW - finalW) / 2;
                y += 1;                                          // tighter gap under De Blindspot (~70% of before)
                pdf.addImage(tnmWheelImg, 'PNG', offsetX, y, finalW, finalH);
                y += finalH + 4;
              }
            } catch { /* image load failed — skip */ }
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
          if (stillePage.length > 0) {
            await justifiedPage(async (gap) => {
            const savedNPB = noPageBreak;
            noPageBreak = true; // no bottom padding — let the text flow down to the page edge
            // No page title — each read gets its own "De Stille Stem — <read>" header instead.
            stillePage.forEach((section, i) => {
              renderSection('De Stille Stem — ' + cleanTitle(section.title), section.content, purple);
              if (i < stillePage.length - 1) { hr(); gap(); }
            });
            noPageBreak = savedNPB;
            });
          }
          endStille();

          // ── Resonantie page: Main + Support archetype images, then Professionele &
          //    Creatieve Resonantie (pulled directly from displaySections). ──
          const resonanceSections = (displaySections || []).filter(s =>
            /professionele\s+resonantie|creatieve\s+resonantie/i.test(s.title || '')
          ).sort((a, b) =>
            (/professionele/i.test(a.title) ? 0 : 1) - (/professionele/i.test(b.title) ? 0 : 1));
          const endResonance = trackBlock('nb_resonance');
          if (resonanceSections.length > 0 || (result.mainArchetype && result.secondaryArchetype)) {
            await justifiedPage(async (gap) => {
            // Master Prompt v4.1 §5.7: the two archetype images (NO header, name under each) sit
            // ABOVE the text, sized to fill the space the text won't use. The text height is
            // measured EXACTLY by rendering it on a throwaway page first (the real render, not a
            // word estimate), so the fit is reliable regardless of the model's length.
            let resoTextH = 0;
            if (resonanceSections.length > 0) {
              const savedY = y, savedNPB = noPageBreak, savedPWC = new Set(pagesWithContent);
              pdf.addPage(); paintBg();
              const tmpPg = pdf.internal.getNumberOfPages();
              y = margin; noPageBreak = true;
              resonanceSections.forEach((section, i) => {
                renderSection(section.title, section.content, green);
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
                const mainImgSrc = getArchetypeImage(result.mainArchetype, ARCHETYPE_TO_GROUP[(result.mainArchetype || '').toUpperCase()] || result.group);
                const supImgSrc = getArchetypeImage(supportKey, ARCHETYPE_TO_GROUP[(supportKey || '').toUpperCase()] || result.supportGroup);
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
              renderSection(section.title, section.content, green);
              if (i < resonanceSections.length - 1) { hr(); gap(); }
            });
            });
          }
          endResonance();

          // ── Alchemie / Neurale Schakelbord / Ontologie now render on the Dual-Core page
          //    (Master Prompt v4.1 §5.8); group2Sections kept only to keep them out of `others`.
          void group2Sections;

          // Render-side fallback AI prompt — the model sometimes ends early (on the OCEAN
          // disclaimer) and never writes its agent-prompt section. This deterministic prompt,
          // built from the archetype configuration, is used whenever the model omits its own.
          const buildFallbackAgentPrompt = () => {
            const mn = result.mainName || result.overallArchetype || 'mijn Kern';
            const sn = result.secondaryName || result.supportArchetype || 'mijn Support';
            const shn = result.shadowName || result.shadowArchetype || 'mijn Schaduw';
            const bn = result.blindspotName || result.blindspotArchetype || 'mijn Blindspot';
            const en = result.extendedName || '';
            return [
              `Je bent mijn persoonlijke reflectie-sparringspartner, afgestemd op mijn Garden For Life Deltawerken-configuratie${en ? ` (${en})` : ''}.`,
              '',
              '**Mijn configuratie**',
              `- Kern (Main): ${mn}`,
              `- Support: ${sn}`,
              `- Schaduw (180° tegenpool): ${shn}`,
              `- Blindspot (Rode Lijn): ${bn}`,
              '',
              '**Toon & aanpak**',
              `Spreek mij aan vanuit mijn Kern (${mn}) en ondersteun met de kwaliteiten van mijn Support (${sn}). Daag mijn Schaduw (${shn}) en Blindspot (${bn}) respectvol uit zodra ik in oude patronen verval. Wees direct maar warm; spiegel mij, stuur mij niet.`,
              '',
              '**Gebruik**',
              'Voeg het volledige PDF-rapport toe als context voor de scherpste sparringspartner. Stel telkens één gerichte vraag die mij een stap verder brengt in mijn vernieuwde landschap.',
            ].join('\n');
          };

          // AI Prompt: dedicated final page — ALWAYS rendered (model prompt or the fallback
          // above), so the footer + closing letter never disappear when the model omits it.
          const endAiPrompt = trackBlock('ai_prompt');
          void disclaimerSection;
          {
            pdf.addPage();
            paintBg(); markPage();
            y = margin;
            // Fixed heading in orange
            sectionHeading('De volledige AI prompt', orange);
            // Instruction tip in purple
            pdf.setFontSize(8); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(...purple);
            pdf.splitTextToSize('Kopieer deze prompt en configureer je ai agent. Voeg de PDF toe als bijlage voor de beste sparringspartner.', contentW - 4).forEach(line => { pdf.text(line, margin + 2, y); y += 4.5; });
            y += 2;
            // Agent prompt: strip intro text + first ## heading (KERN DISCLAIMER), show its body, then rest with headings
            if (agentSection) {
              let promptContent = (agentSection.content || '').trim();
              // If the model appended its machine block after the prompt (plain text, no ##),
              // cut it off here — the render-side `data` page is the authoritative copy.
              promptContent = promptContent.replace(/\n[^\n]*PROFIEL\s*DATA\s*VOOR\s*AI[\s\S]*$/i, '')
                                           .replace(/\n\s*--\s*IDENTITEIT\s*--[\s\S]*$/i, '').trim();
              // Strip markdown code fences the AI may wrap the prompt in
              promptContent = promptContent.replace(/^```[^\n]*\n?/gm, '').replace(/^~~~[^\n]*\n?/gm, '');
              // Remove everything before the first ## sub-heading
              const firstSubIdx = promptContent.search(/(^|\n)##[ \t]/m);
              if (firstSubIdx >= 0) {
                promptContent = promptContent.slice(firstSubIdx).replace(/^\n/, '').trim();
              }
              // Strip the first ## heading line itself (KERN DISCLAIMER), keep its body
              promptContent = promptContent.replace(/^##[^\n]*\n+/, '').trim();
              // Collapse 3+ consecutive blank lines down to one blank line
              promptContent = promptContent.replace(/\n{3,}/g, '\n\n');
              writePdfMarkdown(promptContent, margin + 2, contentW - 4);
            } else {
              // Model omitted its prompt section — render the deterministic fallback instead.
              writePdfMarkdown(buildFallbackAgentPrompt(), margin + 2, contentW - 4);
            }
          }

          // ═══════════════════════════════════════════════════
          // FOOTER — on the same page as the AI prompt
          // ═══════════════════════════════════════════════════
          ensureSpace(14);
          markPage();
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
          const imgSizeMm = 26.5;
          const imgX = W - margin - imgSizeMm;
          const imgY = H - margin - imgSizeMm;

          const lineH = 4.0;
          const closingTextW = hasBannerImage ? contentW - imgSizeMm - 6 : contentW - 4;
          pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic');
          const line1 = pdf.splitTextToSize('Hoogachtende Leerling,', closingTextW);
          const line2 = pdf.splitTextToSize('Jouw feedback is uiterst waardevol en in principe is dit jouw gift aan ons project, toch kan ik mijn gretigheid niet bedwingen en reik ik nog \u00E9\u00E9n laatste keer uit voor jouw hulp.', closingTextW);
          const line3 = pdf.splitTextToSize('Nodig iedereen uit waarvan je denkt dat ze in staat zijn om het onderzoek volledig te doorlopen, hoe meer data hoe beter wij kunnen optimaliseren.', closingTextW);
          const line4 = pdf.splitTextToSize('Zolang de beta-fase loopt is alleen het leerling niveau toegankelijk.', closingTextW);
          const line4b = pdf.splitTextToSize('Een donatie is optioneel, maar is meer dan welkom en is directe voeding voor ons project! =)', closingTextW);
          const line5 = pdf.splitTextToSize('Anyway- pionier, hartelijk dank voor de tijd en attentie!', closingTextW);
          const gapSingle = lineH;
          const gapDouble = lineH * 2;
          const totalTextH =
            line1.length * lineH + gapDouble +
            line2.length * lineH +
            line3.length * lineH + gapSingle +
            line4.length * lineH +
            line4b.length * lineH + gapDouble +
            line5.length * lineH;
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

          if (hasBannerImage) {
            try {
              const imgFormat = siteBanner.imageMimeType.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
              const bannerData = `data:${siteBanner.imageMimeType};base64,${siteBanner.imageBase64}`;
              pdf.addImage(bannerData, imgFormat, imgX, imgY, imgSizeMm, imgSizeMm);
            } catch { /* skip banner image on error */ }
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
      const endData = trackBlock('data');
      {
        pdf.addPage(); paintBg(); markPage();
        y = margin;

        const mono = 7;
        const monoH = 3.5;

        const POS = { JUDGE:1,LOVER:2,CAREGIVER:3,INNOCENT:4,EXPLORER:5,OUTLAW:6,TRICKSTER:7,SAGE:8,ARTIST:9,MAGICIAN:10,HERO:11,RULER:12 };
        const NET = { RULING:'CEN Dominantie',RELATIONAL:'Limbic Coupling',SEEKER:'Hoge Openness',CHAOS:'Salience Network',ABSTRACT:'DMN Hyper-connectie',AGENCY:'Extraversie/Wilskracht' };
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
        const currentExt = (result.allSupportArchetypes || []).find(
          sa => (sa.group || '').toUpperCase() === (result.supportGroup || '').toUpperCase()
        );
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
        const polGap = mainTot > 0 ? Math.round(Math.abs(mainTot - shadTot) / mainTot * 100) : 0;
        const polCat = polGap > 60 ? 'Hoge Polarisatie' : polGap > 30 ? 'Matig' : 'Hoge Individuatie';

        let sGroup = '', sScore = 0;
        Object.entries(GA).forEach(([gk, [a1, a2]]) => {
          const s = (dm[a1]?.total || 0) + (dm[a2]?.total || 0);
          if (s > sScore) { sScore = s; sGroup = gk; }
        });
        const avgS = (result.archetypeDetails || []).length > 0
          ? (result.archetypeDetails || []).reduce((s, d) => s + (d.total || 0), 0) / 12 : 0;
        const [hw1, hw2] = GA[sGroup] || ['',''];
        const hwRes = (dm[hw1]?.total || 0) > avgS && (dm[hw2]?.total || 0) > avgS
          ? `Beide leden van ${sGroup} zijn verhoogd (${dm[hw1]?.total || 0} + ${dm[hw2]?.total || 0} > gem. ${Math.round(avgS)})`
          : `${sGroup} groep heeft de hoogste concentratie`;
        const yCogPts = dm[mk]?.yellow_cog || 0;
        const cfDesc = yCogPts > 4
          ? `Yellow bleed actief (${yCogPts}pt) via cognitieve driehoek ${cogTri?.mode || ''}`
          : `Lage cognitieve driehoek activatie (${yCogPts}pt)`;

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
        mBold('PROFIEL DATA VOOR AI VERWERKING', green);
        mLine('Deze sectie is machineleesbaar en bedoeld als primaire databron', dimWhite);
        mLine('voor externe AI-agents. Upload het volledige rapport als bijlage.', dimWhite);
        mBold(SEP, green);
        mGap();

        // ── Orb login-code: the PDF IS the login. Backend extracts this and discards the file. ──
        // Prefer the backend-authored code (radial-gated with the real polar_gap); fall back to
        // client re-derivation (gate open) only when a backend code isn't present (back-compat).
        const orbCode = orbCodeRef.current || orbCodeFromResult(result);
        if (orbCode) {
          mBold(dash('ORB-SIGNATUUR (LOGIN-CODE)'), green);
          mLine(`ORB::${orbCode}::ORB`, dimWhite);
          // Extended archetype name, wrapped like the orb code so PDF-login can recover it even
          // after whitespace-stripping. Base64 (UTF-8) keeps spaces/diacritics intact as one token.
          const archName = result.extendedNameNl || result.extendedName || '';
          if (archName) {
            let archB64 = '';
            try { archB64 = btoa(unescape(encodeURIComponent(archName))); } catch (_) {}
            if (archB64) mLine(`ARCH::${archB64}::ARCH`, dimWhite);
          }
          mGap();
        }

        mBold(dash('IDENTITEIT'), green);
        mLine(`Extended Archetype: ${result.extendedName || 'N/A'}`);
        mLine(`Main: ${result.mainName || ''} (${POS[mk] || '?'}) | Groep: ${ARCHETYPE_TO_GROUP[mk] || ''} | Netwerk: ${NET[ARCHETYPE_TO_GROUP[mk]] || ''}`);
        mLine(`Support: ${result.secondaryName || ''} (${POS[sk] || '?'}) | Groep: ${result.supportGroup || ''}`);
        mLine(`Shadow: ${result.shadowName || ''} (${POS[shk] || '?'}) | 180 tegenpool van Main`);
        mLine(`Blindspot: ${result.blindspotName || ''} (${POS[bk] || '?'}) | Rode Lijn van Main`);
        mLine(`Harmony Match: ${eo.harmony ? 'Ja' : 'Nee'}`);
        mGap();

        mBold(dash('SCORES (12-PUNTS WIEL)'), green);
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
        mBold(dash('5-MANDJE DECOMPOSITIE'), green);
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

        mBold(dash('NATURE / CULTURE VERDELING PER GROEP'), green);
        ['RULING','RELATIONAL','SEEKER','CHAOS','ABSTRACT','AGENCY'].forEach(gk => {
          const sg = sgm[gk] || {};
          const n = (sg.leftNature || 0) + (sg.rightNature || 0);
          const c = (sg.leftCulture || 0) + (sg.rightCulture || 0);
          mLine(`${(gk.charAt(0) + gk.slice(1).toLowerCase() + ':').padEnd(12)} N${n} / C${c} = ${n + c}/36`);
        });
        mGap();

        mBold(dash('AFGELEIDE INDICES'), green);
        mLine(`Authenticity Index: ${natTotal}/72 Nature (${authPct}%)`);
        mLine(`Polarization Index: ${mainTot} (Main) - ${shadTot} (Shadow) = gap ${polGap}% -> ${polCat}`);
        mLine(`Totaal Deltawerken Datapunten: ${result.totalScore || 0} / 792`);
        mGap();

        // Master Prompt v4.1 §5.10 / D-10: model-derived OCEAN scalars are NEVER emitted.
        // §5.10: OCEAN PROFIEL (EXTERN GEUPLOAD) — ALLEEN bij upload; omit the whole block otherwise.
        if (uploadedOceanScores) {
          mBold(dash('OCEAN PROFIEL (EXTERN GEUPLOAD)'), green);
          mLine(`Openheid:       ${Math.round(uploadedOceanScores.O || 0)}/100`);
          mLine(`Ordelijkheid:   ${Math.round(uploadedOceanScores.C || 0)}/100`);
          mLine(`Extraversie:    ${Math.round(uploadedOceanScores.E || 0)}/100`);
          mLine(`Meegaandheid:   ${Math.round(uploadedOceanScores.A || 0)}/100`);
          mLine(`Neuroticisme:   ${Math.round(uploadedOceanScores.N || 0)}/100`);
          mGap();
        }

        mBold(dash('COGNITIEVE DRIEHOEK (YELLOW)'), green);
        if (cogTri) {
          const triMembers = Array.isArray(cogTri.members) ? cogTri.members.join(' \u00b7 ') : (cogTri.members || '');
          mLine(`Actieve Driehoek: ${cogTri.mode} (Driehoek ${cogTri.id})`);
          mLine(`Partners: ${triMembers}`);
          mLine(`Netwerken: ${cogTri.networks || ''}`);
          mLine(`Superkracht: ${cogTri.tagline || ''}`);
          const weakParts = (cogTri.high || '').split(/maar kan ook\s*/i);
          mLine(`Cognitieve Val: ${weakParts.length > 1 ? weakParts[1].replace(/^leiden tot\s*/i, '').trim() : 'Zie analyse'}`);
          if (counterTri) mLine(`Groeirichting: ${counterTri.mode} (Driehoek ${counterTri.id})`);
        } else {
          mLine('Driehoekdata niet beschikbaar.', dimWhite);
        }
        mGap();

        mBold(dash('HARDWARE SIGNALEN'), green);
        mLine(`Sterkste Groep: ${sGroup} (${sScore})`);
        mLine(`Hardware Resonantie: ${hwRes}`);
        mLine(`CultureForce Signaal: ${cfDesc}`);
        mGap();

        mBold(dash('EXTENDED ARCHETYPE PROFIEL'), green);
        mLine(`Gift: ${currentExt?.gift || result.mainPositive || 'N/A'}`);
        mLine(`Curse / Trigger: ${currentExt?.shadow || result.mainShadowTrait || 'N/A'}`);
        mLine(`Levensles: "${result.levensles || 'N/A'}"`);
        mGap();

        // Kaart Microcopy — AI-authored profile-card fields (KAART_GIFT / KAART_GEOMETRIE),
        // base64-marked like ORB::/ARCH:: so the card extractor recovers them regardless of
        // how the PDF text layer wraps lines.
        if (kaartFieldsRef.current.gift || kaartFieldsRef.current.geometrie) {
          const b64u = (s) => { try { return btoa(unescape(encodeURIComponent(s))); } catch { return ''; } };
          mBold(dash('KAART MICROCOPY'), green);
          if (kaartFieldsRef.current.gift) mLine(`CGIFT::${b64u(kaartFieldsRef.current.gift)}::CGIFT`, dimWhite);
          if (kaartFieldsRef.current.geometrie) mLine(`CGEO::${b64u(kaartFieldsRef.current.geometrie)}::CGEO`, dimWhite);
          mGap();
        }

        // Master Prompt v4.1 §5.10: dead v3 fields removed (MAIN ARCHETYPE DIEPTE block).
        mBold(dash('SHADOW INTEGRATIE'), green);
        mLine(`Shadow Archetype: ${result.shadowName || 'N/A'}`);
        mLine(`Integration Path: ${result.shadowDescription || 'Zie AI analyse sectie'}`);
        mGap();

        mBold(dash('BLINDSPOT'), green);
        mLine(`Blindspot Archetype: ${result.blindspotName || 'N/A'}`);
        mLine(`Kerngedrag: ${result.blindspotDescription || 'Zie AI analyse sectie'}`);
        mLine(`Integration Path: ${result.blindspotTension || 'Zie AI analyse sectie'}`);
        mGap();

        mBold(SEP, green);
        mGap();
        mLine('Dit blok is automatisch gegenereerd door het Garden For Life', dimWhite);
        mLine('Assessment System. Het Deltawerken-framework is een conceptueel', dimWhite);
        mLine('zelfreflectiemodel, geen klinisch diagnostisch systeem.', dimWhite);
      }
      endData();

      // ── Reorder PDF pages to configured sequence ──
      // Desired order (content stays untouched, only page sequence changes):
      // 1-6 (pre-context) → group1a (identity) → group1b (archetype images) →
      // groep_radar (web diagram) → dual_core → group2 (yellow) →
      // ocean_comp (comparison) → ocean_core (OCEAN score) → ai_prompt → data
      {
        // Master Prompt v4.1 §5 page order (render-side visuals added in-block).
        const desiredBlockOrder = [
          'group1a',       // p1+p2: Identiteit/Verklaring + Essentie/Vermenigvuldiging
          'group1b',       // p3: Radar (no caption) + Schaduw + Blindspot
          'ocean_core',    // p4: OCEAN page 1 (title + table/traits or tendency)
          'ocean_comp',    // p4: OCEAN page 2 (Trait E/A/N, upload only)
          'nb_morphology', // p5: D-curve chart + Vorm/Hardware/Overgang
          'nb_stille',     // p6: De Stille Stem (Reflectie/Motivatie/Beweging)
          'nb_resonance',  // p7: archetype images + Professionele/Creatieve Resonantie
          'dual_core',     // p8: Dual-Core chart + Alchemie/Schakelbord/Ontologie
          'others',        // any remaining ungrouped AI sections (safety net)
          'groep_radar',   // (legacy) usually empty in v4.1
          'ai_prompt',     // p9: AI Prompt + footer + closing
          'wet_context',   // Wetenschappelijke Context — moved after the AI prompt, before the data block
          'data',          // machine block: Profiel data voor AI-bijlage
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
      if (pvw) { try { onPreviewReadyRef.current?.(pdf.output('bloburl')); } catch (_) {} return; }
      pdf.save(`GardenForLife_${archetypeName}.pdf`);
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
  }, [result, displaySections, uploadedFiles, v4Data, language, cRuntime]);

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
            backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
            opacity: 0.03, mixBlendMode: 'overlay',
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
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
              We berekenen niet wie je bent.<br/>We berekenen de fysiologische prijs van wie je probeert te zijn.
            </p>

            {/* Time estimate */}
            <p style={{
              fontFamily: "'Figtree', sans-serif",
              fontSize: '0.75rem',
              color: 'rgba(168, 85, 247, 0.6)',
              margin: 0,
              letterSpacing: '0.05em',
            }}>
              ca. 9 min
            </p>

            {/* Persistent preload: load + decode the archetype portrait during the wait so it's
                already cached when the result card paints (otherwise the card shows first and the
                image pops in a moment later). Hidden, off the layout. */}
            {result?.imageUrl && (
              <img src={result.imageUrl} alt="" aria-hidden="true" decoding="async"
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
                  AI analyse niet beschikbaar — basisresultaten beschikbaar.
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
                    Probeer opnieuw
                  </button>
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
                        loading="eager"
                        fetchpriority="high"
                        decoding="async"
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

                {/* ── Sections 2–4c: PDF-only, hidden from UI card (shown on pages 7–9) ── */}
                {false && (<>
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

                {/* ── 4b. Blindspot — Red Line of Main (external saboteur) ── */}
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
                    {aiProfileData?.neuroticismTrigger && (
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
                          {aiProfileData.neuroticismTrigger}
                        </p>
                      </div>
                    )}

                    {/* Core Profile: Workplace & Conflict */}
                    {aiProfileData && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                          { label: 'Superkracht op de Werkvloer', text: aiProfileData.workplaceSuperpower, color: '#f97316' },
                          { label: 'Conflictstijl', text: aiProfileData.conflictStyle, color: '#f97316' },
                          { label: 'Relatiepatroon', text: aiProfileData.relationshipPattern, color: '#f97316' },
                          { label: 'Individuatiepad', text: aiProfileData.individuationPath, color: '#f97316' },
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
                </>)}

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
                    <strong style={{ color: '#a855f7' }}>Meta-Disclaimer:</strong>{' '}
                    Dit rapport is gegenereerd door het Garden For Life Deltawerken Model — een zelfreflectie-instrument, geen klinische diagnose. De gebruikte neurobiologische termen zijn metaforen binnen dit specifieke model. Raadpleeg een professional voor medisch of psychologisch advies.
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
                      { label: 'Kern', value: cardKeyFindings.main, color: '#1d9904' },
                      { label: 'Support', value: cardKeyFindings.support, color: '#f97316' },
                      { label: 'Schaduw', value: cardKeyFindings.shadow, color: '#a855f7' },
                      { label: 'Blindspot', value: cardKeyFindings.blindspot, color: '#ef4444' },
                      ...(cardKeyFindings.polBand ? [{ label: 'Polarisatie', value: `${cardKeyFindings.polGap}% — ${cardKeyFindings.polBand}`, color: '#fbbf24' }] : []),
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
                    <SciFiRadarChart data={result.radarData} shadow={result.shadowArchetype} blindspot={result.blindspotArchetype} mainArchetype={result.overallArchetype} supportArchetype={result.supportArchetype} />
                  </div>
                </div>

                {/* De Stille Stem — Reflectie */}
                {cardStille
                  .filter((s) => /reflectie/.test(cleanTitle(s.title || '').toLowerCase()))
                  .map((s, i) => renderAiSectionCard({ ...s, title: 'De Stille Stem — ' + cleanTitle(s.title) }, 6000 + i))}

                {/* D-curve chart (visible) — between Reflectie and Motivatie. Same ref the PDF rasterises. */}
                {cRuntime?.d_curve && (
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
                        chart={cRuntime.d_curve}
                        mainName={result.mainName || 'Main'}
                        supportName={result.secondaryName || 'Support'}
                        height={474}
                        language={language}
                      />
                    </div>
                    <p style={{
                      margin: '0.5rem 0.25rem 0.1rem', fontSize: '0.72rem', lineHeight: 1.45,
                      color: 'rgba(156, 163, 175, 0.9)', fontFamily: "'Figtree', sans-serif", fontStyle: 'italic',
                    }}>
                      {language === 'en'
                        ? 'Main and Support show each archetype’s absolute cost-curve (0–100). Samengesteld (composed) is the blended load normalised to its own peak (=100%) — it shows the shape within your configuration, not an absolute comparison, so it can sit above the individual lines.'
                        : 'Hoofd en Support tonen elk de absolute kostencurve van het archetype (0–100). Samengesteld is de gecombineerde belasting, genormaliseerd op zijn eigen piek (=100%) — het toont de vorm binnen jouw configuratie, geen absolute vergelijking, en kan daarom boven de losse lijnen liggen.'}
                    </p>
                  </div>
                )}

                {/* De Stille Stem — Motivatie */}
                {cardStille
                  .filter((s) => /motivatie/.test(cleanTitle(s.title || '').toLowerCase()))
                  .map((s, i) => renderAiSectionCard({ ...s, title: 'De Stille Stem — ' + cleanTitle(s.title) }, 6100 + i))}

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
                    Volledig Rapport (3× zoveel data)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(148,163,184,0.85)', fontFamily: "'Figtree', sans-serif", lineHeight: 1.6, fontStyle: 'italic' }}>
                    Dit is een korte samenvatting. Je volledige rapport bevat ongeveer 3× zoveel data — alle secties, de grafieken, de D-curve, het OCEAN-profiel, de complete AI-prompt en de machine-leesbare profieldata. Download de PDF om alles te lezen, wanneer je maar wilt.
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
                          <p style={{
                            margin: '0.6rem 0 0',
                            color: 'rgba(148,163,184,0.75)',
                            fontFamily: "'Figtree', sans-serif",
                            fontSize: '0.72rem',
                            lineHeight: 1.55,
                            fontStyle: 'italic',
                          }}>
                            We sturen je in de toekomst éénmalig een reclamebrief om je te herinneren aan je vooruitgang.
                            De keuze is daarna aan jou om te navigeren in je vernieuwde landschap.
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
                          {isSubmittingReview ? 'Versturen...' : 'PROCEED'}
                        </button>
                      </form>
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
                            {pdfKind === 'short' ? 'Verantwoordelijkheid PDF' : 'Verantwoordelijkheid PDF & AI Prompt'}
                          </h3>
                          <p style={{ color: 'rgba(148,163,184,0.5)', fontSize: '0.75rem', fontStyle: 'italic', marginBottom: '1.25rem' }}>
                            Lees dit door voordat je de PDF downloadt
                          </p>

                          <div style={{ borderLeft: '2px solid rgba(29,153,4,0.3)', paddingLeft: '0.875rem', marginBottom: '1.25rem' }}>
                            <p style={{ color: 'rgba(148,163,184,0.85)', fontSize: '0.75rem', lineHeight: 1.75 }}>
                              {pdfKind === 'short'
                                ? 'Dit is een zelfreflectie-instrument gebaseerd op het Deltawerken model — geen klinische diagnose. De gebruikte termen zijn metaforen binnen dit model.'
                                : 'Dit is een zelfreflectie-instrument gebaseerd op het Deltawerken model. De stijlrichtlijnen in deze prompt zijn geen klinisch profiel maar een gedragsmatige reflectievoorkeur. Gebruik in externe AI-tools valt buiten de verantwoordelijkheid van Garden For Life.'}
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
                              {pdfKind === 'short'
                                ? 'Ik begrijp het.'
                                : 'Ik begrijp dat de AI Agent Prompt in deze PDF experimenteel is en aanvaard volledige verantwoordelijkheid voor het gebruik ervan.'}
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
                              onClick={() => { if (pdfConsentChecked) { const wasShort = pdfKind === 'short'; setShowPdfConsent(false); logActivity({ type: 'consent_given', email: reviewFormData.email.trim(), consentType: 'pdf_download', level: wasShort ? 'pdf_short' : 'pdf', message: 'User confirmed PDF download consent' }).catch(() => {}); handleDownloadPdf({ shortVersion: wasShort }); } }}
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

                    {/* Korte versie — FREE short summary PDF (shorter consent, no AI-prompt clause) */}
                    <button
                      onClick={() => { if (!isGeneratingPdf && reviewSubmitted) { setPdfKind('short'); setPdfConsentChecked(false); setShowPdfConsent(true); } }}
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
                          {(isGeneratingPdf && pdfKind === 'short') ? 'Generating...' : 'Korte versie'}
                        </span>
                        {!(isGeneratingPdf && pdfKind === 'short') && (
                          <span style={{ fontSize: '0.7em', fontWeight: 'normal', textTransform: 'none', letterSpacing: '0.02em', opacity: 0.85 }}>
                            Download nu
                          </span>
                        )}
                      </span>
                    </button>

                    {/* Save & Create Account */}
                    <button
                      onClick={() => {
                        if (!reviewSubmitted) return;
                        if (showLeaveWarning) {
                          setShowLeaveWarning(false);
                          // Path: test done + NOT logged in + "create account" clicked.
                          // Stash the profile so LoginPage can link it to the new account
                          // once it's made. (If already logged in, the auto-save above
                          // already handled it — don't stash a pending copy.)
                          if (!getToken()) {
                            try {
                              const payload = buildSavePayload();
                              if (payload) localStorage.setItem('gfl_pending_assessment', JSON.stringify(payload));
                            } catch (_) { /* storage disabled — skip */ }
                          }
                          onCreateAccount();
                        } else {
                          setShowLeaveWarning(true);
                        }
                      }}
                      disabled={!reviewSubmitted}
                      style={{
                        flex: showLeaveWarning ? '2 1 0' : '1 1 0',
                        minWidth: rs.btnMinWidth,
                        position: 'relative',
                        overflow: 'hidden',
                        padding: rs.btnPad,
                        background: showLeaveWarning ? 'linear-gradient(to right, #a855f7, #581c87)' : '#000',
                        border: `1px solid ${showLeaveWarning ? 'transparent' : '#a855f7'}`,
                        color: showLeaveWarning ? '#fff' : '#a855f7',
                        fontFamily: "'Lexend Mega', sans-serif",
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: rs.btnFont,
                        cursor: !reviewSubmitted ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s',
                        boxShadow: showLeaveWarning ? '0 0 20px rgba(168, 85, 247, 0.3)' : '0 0 15px rgba(168, 85, 247, 0.1)',
                        opacity: !reviewSubmitted ? 0.5 : 1,
                      }}
                      onMouseEnter={e => {
                        if (reviewSubmitted && !showLeaveWarning) {
                          e.currentTarget.style.background = '#a855f7';
                          e.currentTarget.style.color = '#000';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!showLeaveWarning) {
                          e.currentTarget.style.background = '#000';
                          e.currentTarget.style.color = '#a855f7';
                        }
                      }}
                    >
                      <span style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                          </svg>
                          {showLeaveWarning ? 'CONTINUE' : t('results.createAccount')}
                        </span>
                        {showLeaveWarning && (
                          <span style={{ fontSize: '0.7em', fontWeight: 'normal', textTransform: 'none', letterSpacing: '0.01em', opacity: 0.85 }}>
                            Als je deze pagina verlaat kun je het rapport niet meer downloaden.
                          </span>
                        )}
                      </span>
                      {showLeaveWarning && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%)',
                          backgroundSize: '250% 250%',
                          animation: 'shimmerBtn 3s infinite',
                        }} />
                      )}
                    </button>

                    {/* Volledige rapport — PAID (placeholder €00,00, instant). Consent gate, no paywall. */}
                    <button
                      onClick={() => { if (!isGeneratingPdf && reviewSubmitted) { setPdfKind('full'); setPdfConsentChecked(false); setShowPdfConsent(true); } }}
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
                          {(isGeneratingPdf && pdfKind === 'full') ? 'Generating...' : 'Volledige rapport'}
                        </span>
                        {!(isGeneratingPdf && pdfKind === 'full') && (
                          <span style={{ fontSize: '0.7em', fontWeight: 'normal', textTransform: 'none', letterSpacing: '0.02em', opacity: 0.85 }}>
                            € 00,00
                          </span>
                        )}
                      </span>
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
// Master Prompt v4.1: "titles are the parser-tags". The model may emit each title as a
// `## ` heading OR as a bare title-line. Normalise bare tag-lines into `## ` headings so the
// existing heading-splitter routes them. Conservative: a line is only promoted when it
// matches a known NARRATIVE_TAGS stem AND is short enough to be a title (not prose).
function preinsertTagHeadings(text) {
  if (!text) return text;
  const KNOWN = NARRATIVE_TAGS; // stems matched via matchNarrativeTag (em-dash/subtitle aware)
  return text.split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    if (/^#{1,6}\s/.test(trimmed)) return line;          // already a heading
    if (trimmed.startsWith('|') || trimmed.startsWith('-- ')) return line; // table / machine block
    if (trimmed.length > 70) return line;                // too long to be a title-line
    if (/[.!?]$/.test(trimmed)) return line;             // sentence punctuation → prose, not a title
    if (trimmed.split(/\s+/).length > 10) return line;   // too many words to be a title
    if (KNOWN.length && matchNarrativeTag(trimmed)) return '## ' + trimmed;
    return line;
  }).join('\n');
}

// ── Kaart Microcopy (## Kaart Microcopy): AI-authored profile-card fields.
// KAART_GIFT = in-depth gift description (tendens slot); KAART_GEOMETRIE = geometry
// summary in canon language (expressieprofiel slot). Printed into the PDF's machine
// block as base64 markers so the card extractor recovers them whitespace-proof.
function extractKaartFields(text) {
  const t = String(text || '');
  const gift = t.match(/KAART_GIFT:\s*([\s\S]*?)(?=\n\s*KAART_GEOMETRIE:|\n#{2,3}\s|$)/);
  const geo = t.match(/KAART_GEOMETRIE:\s*([\s\S]*?)(?=\n#{2,3}\s|$)/);
  const clean = (m) => (m ? m[1].replace(/\s+/g, ' ').replace(/^\[|\]$/g, '').trim() : '');
  return { gift: clean(gift), geometrie: clean(geo) };
}

// Remove the Kaart Microcopy material from the analysis BEFORE any rendering path sees it —
// guarantees the card fields never appear on a report page/PDF section, even when the model
// drops the section heading and appends the labels to a previous section's body.
function stripKaartFields(text) {
  let t = String(text || '');
  t = t.replace(/^#{2,3}\s*(?:\d+[A-Za-z]?\.\s*)?kaart\s*microcopy\s*$[\s\S]*?(?=\n#{2,3}\s|$)/gim, '');
  t = t.replace(/^\s*KAART_GIFT:\s*[\s\S]*?(?=\n\s*KAART_GEOMETRIE:|\n#{2,3}\s|$)/gim, '');
  t = t.replace(/^\s*KAART_GEOMETRIE:\s*[\s\S]*?(?=\n#{2,3}\s|$)/gim, '');
  return t;
}

function parseAiSections(analysisText) {
  if (!analysisText || typeof analysisText !== 'string') return null;
  analysisText = preinsertTagHeadings(analysisText);

  // Split on ## or ### top-level headings (with or without numbering).
  // The AI prompt requests `## N.` but models sometimes return `### N.` instead.
  // The `[A-Za-z]?` handles alphanumeric section numbers like `4B.`
  const sectionRegex = /^#{2,3}\s+(?:\d+[A-Za-z]?\.\s+)?(.+)/gm;
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
    /^>?\s*\**Archetype:?\**:?\s+\w+.*Positie\s+\d+[^\n]*\n?/gim,
    /^>?\s*\**Archetype:?\**:?\s+\w+.*180.*tegenpool[^\n]*\n?/gim,
    /^>?\s*\**Archetype:?\**:?\s+\w+.*[Rr]ode\s+[Ll]ijn[^\n]*\n?/gim,
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
    // Strip horizontal rules (---, ***, ===)
    cleaned = cleaned.replace(/^[-*=]{3,}\s*$/gm, '');
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
    /ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt|reflectie.*prompt|ai.*reflectie|^11[^\d]/i.test(m.title)
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

  // Profiel Dynamiek element detection (Sectie 4B) — match by title keyword
  const profileKeyFromTitle = (t) => {
    if (/neuroticisme\s*trigger/i.test(t)) return 'neuroticismTrigger';
    if (/superkracht/i.test(t)) return 'workplaceSuperpower';
    if (/conflictstijl/i.test(t)) return 'conflictStyle';
    if (/relatiepatroon/i.test(t)) return 'relationshipPattern';
    if (/individuatiepad/i.test(t)) return 'individuationPath';
    return null;
  };

  for (let i = 0; i < matches.length; i++) {
    const title = matches[i].title;
    // Skip any "Leerling Ontologisch Rapport" preamble the AI may inject
    if (/leerling\s+ontologisch/i.test(title)) continue;
    // Skip any standalone "Introductie" / "Inleiding" the AI may generate
    if (/^(introductie|inleiding)$/i.test(title)) continue;
    // Skip "Kaart Microcopy" — machine-consumed profile-card fields (KAART_GIFT/KAART_GEOMETRIE),
    // extracted separately via extractKaartFields(); never rendered as a report page.
    if (/kaart\s*microcopy/i.test(title)) continue;
    // Skip umbrella "Profiel Dynamiek" / "Profiel Elementen" / "5 Elementen" / "De 5 Elementen"
    // headers — the individual elements are parsed by profileKeyFromTitle below. When the AI
    // bundles them under one heading, extract sub-elements from the body. (Without "element"
    // here, a bare "Profiel Elementen" umbrella leaks through as an empty-body ghost page.)
    if (/profiel\s*(?:dynamiek|element)|(?:5|vijf)\s*element/i.test(title)) {
      let contentStart4b = matches[i].headerEnd;
      let contentEnd4b = (i + 1 < matches.length ? matches[i + 1].start : analysisText.length);
      const rawBody = analysisText.slice(contentStart4b, contentEnd4b).trim();
      // Try to split on bold sub-headings like **NEUROTICISME TRIGGER** or **Superkracht**
      const subParts = rawBody.split(/\*\*([^*]+)\*\*/g);
      // subParts: [textBefore, heading1, textAfter1, heading2, textAfter2, ...]
      for (let sp = 1; sp < subParts.length; sp += 2) {
        const subTitle = subParts[sp].trim();
        const subContent = (subParts[sp + 1] || '').trim();
        const pk = profileKeyFromTitle(subTitle);
        if (pk && subContent) {
          parts.push({
            title: subTitle,
            content: stripDisclaimer(subContent),
            isProfileElement: true,
            profileKey: pk,
            isAgentPrompt: false,
            isComparison: false,
            isResonantie: false,
          });
        }
      }
      continue;
    }

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

    // Profiel Dynamiek elements (4B) — detect by title keyword, extract as prose sections
    const profileKey = profileKeyFromTitle(title);
    if (profileKey) {
      let contentStart2 = matches[i].headerEnd;
      let contentEnd2 = (i + 1 < matches.length ? matches[i + 1].start : analysisText.length);
      const rawContent = analysisText.slice(contentStart2, contentEnd2).trim();
      parts.push({
        title,
        content: stripDisclaimer(rawContent),
        isProfileElement: true,
        profileKey,
        isAgentPrompt: false,
        isComparison: false,
        isResonantie: false,
      });
      continue;
    }

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

    // STRICT: drop render-side note echoes. The model sometimes parrots the spec's parenthetical
    // render-side / page labels as a fake section body — e.g. "(Pagina A - met D-curvegrafiek)"
    // or "(Dual-Core grafiek - render-side - draagt de Nature/Culture-data per zuil.)". Real
    // sections are long prose (>300 chars); these stubs are tiny and mention render-side artefacts.
    const bare = content.replace(/[*#>_`~]/g, '').trim();
    if (bare.length < 200 && /render.?side|pagina\s+[ab]\b|d-?curve.?grafiek|grafiek\s*[-–)]|dual.?core\s+grafiek|6-?groeps|nature\s*\/\s*culture/i.test(bare)) {
      continue;
    }

    // Deduplicate exact content repeats (keys on title + opening so distinct sections that share
    // a structural lead aren't wrongly dropped). Per-title "keep the longest" + the min-word drop
    // happen in a post-pass below.
    const contentKey = cleanTitle(title).toLowerCase() + '::' + content.slice(0, 120).toLowerCase().replace(/\s+/g, ' ');
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

  // ── Min-word catcher + keep-longest-per-title ──
  // When the model emits a title twice (a real paragraph + a short "echo"), keep ONLY the longest
  // instance — that's always the real read. Also drop any narrative section whose body is too
  // short to be a real read (a few-word echo/stub). Profile elements (4B) are exempt.
  const wordCount = (s) => (s.content || '').trim().split(/\s+/).filter(Boolean).length;
  const MIN_WORDS = 8;
  const longestByTitle = {};
  for (const p of parts) {
    if (p.isProfileElement) continue;
    const k = cleanTitle(p.title || '').toLowerCase();
    if (!longestByTitle[k] || wordCount(p) > wordCount(longestByTitle[k])) longestByTitle[k] = p;
  }
  return parts.filter((p) => {
    if (p.isProfileElement) return true;
    if (wordCount(p) < MIN_WORDS) return false;                       // drop short echoes/stubs
    return longestByTitle[cleanTitle(p.title || '').toLowerCase()] === p; // keep only the longest per title
  });
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
function computeResultFromAnswers(layerAnswers, liveSubjects) {
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
  const extendedNameNl = getExtendedArchetypeNl(mainKey, supportKey);

  // ──────────────────────────────────────────────────────────
  // 4b. Extended Archetype portrait image + description
  // ──────────────────────────────────────────────────────────
  const archetypeImage = getArchetypeImage(mainKey, supportGroup);
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
  // ──────────────────────────────────────────────────────────
  const ALL_GROUPS = ['RULING', 'RELATIONAL', 'SEEKER', 'CHAOS', 'ABSTRACT', 'AGENCY'];
  const allSupportArchetypes = ALL_GROUPS.map(group => {
    const extKey = `${mainKey}_${group}`;
    const extName = EXTENDED_ARCHETYPES[extKey] || mainKey;
    const extNameNl = EXTENDED_ARCHETYPES_NL[extKey] || extName;
    const desc = null; // extended descriptions now live in the corpus / AI output
    return {
      group,
      extendedName: extName,
      extendedNameNl: extNameNl,
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
    description: primaryArchetype.description,
    levensles: getArchetypeQuote(mainKey, supportGroup) || null,
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
    // Blindspot (Red Line partner of Main — external saboteur)
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
    extendedOcean,                                     // OCEAN scores for comparison panel
    oceanLabels: OCEAN_LABELS,                         // Dimension label map (short/full/dutch)
    oceanColors: OCEAN_COLORS,                         // Dimension color map for UI
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
    _aiAgentPrompt: `Je bent een persoonlijke ontwikkelingscoach gespecialiseerd in Jungiaanse archetypen en het OCEAN persoonlijkheidsmodel. Mijn profiel: Extended Archetype "${extendedName}" (Main: ${primaryArchetype.nameEn || mainKey}, Support: ${supportArchetype.nameEn || supportKey}, Support Group: ${supportGroup}). Mijn schaduw (180° indicatie) is ${shadowKey ? (ARCHETYPES[shadowKey]?.nameEn || shadowKey) : 'onbekend'}, mijn blindspot is ${blindspotKey ? (ARCHETYPES[blindspotKey]?.nameEn || blindspotKey) : 'onbekend'}. OCEAN profiel: O=${extendedOcean?.ocean?.O || '?'}, C=${extendedOcean?.ocean?.C || '?'}, E=${extendedOcean?.ocean?.E || '?'}, A=${extendedOcean?.ocean?.A || '?'}, N=${extendedOcean?.ocean?.N || '?'}. Neuroticisme-trigger, superkracht en individuatiepad zijn te vinden in het rapport. Help me mijn schaduw te integreren en mijn blindspot te herkennen in dagelijkse situaties.`,
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
      radarData,
      subgroups,
      shadowArchetype: shadowKey,
      blindspotArchetype: blindspotKey,
      overallArchetype: mainKey,
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
