import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@gfl/i18n';
import { getToken } from '@gfl/api-client';
import { isIntegratedGPU } from '@gfl/utils';
const archetypeHeader = '/images/Import ready/Archetype header.png';
const analyseIcon = '/images/Import ready/analyseicon.PNG';
const shadowIcon = '/images/Import ready/Shadowicon.png';
const scienceIcon = '/images/Import ready/Scienceicon.png';
const aiIcon = '/images/Import ready/AIicon.PNG';
const wheelAnatomy = '/images/TNM wheel PNG.png';
const triangleHardware = '/images/Deltawerken png.png';
import { SciFiButton } from '@gfl/ui';
const cellsImage = '/images/Model imports/Cells within Cells png.png';
import OceanManualInputModal from './OceanManualInputModal';
import ReferencesPanel from './ReferencesPanel';

/** Render translated copy that carries inline markers.
 *    \n                -> <br/>
 *    {b|text}          -> <strong> in accent lilac (#c4b5fd)
 *    {a|text}          -> <strong> in amber (#fdba74)
 *    {g:#rrggbb|text}  -> coloured semibold span
 *    {link:slug|text}  -> clickable policy link (calls onLink(slug))
 */
const COPY_MARK = /\{(b|a)\|([^}]*)\}|\{g:(#[0-9a-fA-F]{6})\|([^}]*)\}|\{link:([a-z-]+)\|([^}]*)\}/g;
const LINK_STYLE = { color: '#c4b5fd', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer' };
const renderCopy = (text, onLink) => {
  const out = [];
  String(text).split('\n').forEach((line, li) => {
    if (li > 0) out.push(<br key={`cbr-${li}`} />);
    let last = 0;
    let m;
    COPY_MARK.lastIndex = 0;
    while ((m = COPY_MARK.exec(line)) !== null) {
      if (m.index > last) out.push(line.slice(last, m.index));
      const key = `cm-${li}-${m.index}`;
      if (m[1]) {
        out.push(<strong key={key} style={{ color: m[1] === 'a' ? '#fdba74' : '#c4b5fd' }}>{m[2]}</strong>);
      } else if (m[3]) {
        out.push(<span key={key} style={{ color: m[3], fontWeight: 600 }}>{m[4]}</span>);
      } else {
        const slug = m[5];
        out.push(
          <span
            key={key}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onLink) onLink(slug); }}
            style={LINK_STYLE}
          >
            {m[6]}
          </span>
        );
      }
      last = COPY_MARK.lastIndex;
    }
    if (last < line.length) out.push(line.slice(last));
  });
  return out;
};


/**
 * AssessmentIntro - Modal shown when entity appears
 * Explains the assessment and lets user choose difficulty level
 * 
 * Responsive tiers: Desktop (≥1280) / Laptop (≥1024) / Tablet (≥768) / Mobile (<768)
 * 
 * Props:
 * - onStart(levelId) - called when user picks a level
 * - onClose() - called when user closes the modal
 * - onNavigateToData() - called when user clicks the research button
 */
const AssessmentIntro = ({ onStart, onClose, onNavigateToData, onNavigateToPolicy, uploadedFiles = [], onAddFile, onRemoveFile, onBack = null, backLabel = '' }) => {
  const { t, tArray, tFunc } = useLanguage();
  const fileInputRef = useRef(null);
  const infoIconRef = useRef(null);
  const referentiesRef = useRef(null);
  const oceanScoresRef = useRef(null);
  const modalRef = useRef(null);
  const infoOverlayRef = useRef(null);
  const refsOverlayRef = useRef(null);
  const [showReferences, setShowReferences] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveConfirmClosing, setLeaveConfirmClosing] = useState(false);
  const [leaveConfirmPos, setLeaveConfirmPos] = useState({ top: 0, left: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const [infoReady, setInfoReady] = useState(false); // true after 1 rAF — lets backdropFilter compositor layer initialise before animation
  const [infoClosing, setInfoClosing] = useState(false);
  const [infoOrigin, setInfoOrigin] = useState('50% 50%');
  // Referenties overlay — mirrors the "Lees mij!" info overlay (same open/close animation, different content)
  const [showRefs, setShowRefs] = useState(false);
  const [refsReady, setRefsReady] = useState(false);
  const [refsClosing, setRefsClosing] = useState(false);
  const [refsOrigin, setRefsOrigin] = useState('50% 50%');
  const [introClosing, setIntroClosing] = useState(false);
  const [introExpanding, setIntroExpanding] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  // Consent gate: set when user clicks a level card
  const [consentLevelId, setConsentLevelId] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentAiPromptChecked, setConsentAiPromptChecked] = useState(false);
  const [consentClosing, setConsentClosing] = useState(false);
  const [consentOrigin, setConsentOrigin] = useState('center center');
  const consentOverlayRef = useRef(null);
  const [pendingPolicySlug, setPendingPolicySlug] = useState(null);
  const [showUploadWarning, setShowUploadWarning] = useState(false);
  const [showOceanInfo, setShowOceanInfo] = useState(false);
  const [infoLevel, setInfoLevel] = useState(null); // which level's info pop-up is open (per card)
  const [showOceanInput, setShowOceanInput] = useState(false);
  const [oceanOrigin, setOceanOrigin] = useState('center center');
  const [oceanManualScores, setOceanManualScores] = useState(null);

  const openInfo = () => {
    if (modalRef.current) {
      // Animate to/from the floating entity center (50vw, 23vh — same anchor used by pyramid layer cards)
      const modalRect = modalRef.current.getBoundingClientRect();
      const x = window.innerWidth * 0.5 - modalRect.left;
      const y = window.innerHeight * 0.23 - modalRect.top;
      setInfoOrigin(`${x}px ${y}px`);
    }
    // Shrink intro card first, then expand info overlay from the same point
    setIntroClosing(true);
    setTimeout(() => {
      setIntroClosing(false);
      setShowInfo(true);
      // Wait one frame so the browser sets up the backdropFilter GPU layer before animating
      requestAnimationFrame(() => setInfoReady(true));
    }, 375);
  };

  const openOceanInput = () => {
    if (oceanScoresRef.current && modalRef.current) {
      const btnRect = oceanScoresRef.current.getBoundingClientRect();
      const modalRect = modalRef.current.getBoundingClientRect();
      const x = btnRect.left + btnRect.width / 2 - modalRect.left;
      const y = btnRect.top + btnRect.height / 2 - modalRect.top;
      setOceanOrigin(`${x}px ${y}px`);
    }
    setShowOceanInput(true);
  };

  const openLeaveConfirm = () => {
    if (referentiesRef.current && modalRef.current) {
      const btnRect = referentiesRef.current.getBoundingClientRect();
      const modalRect = modalRef.current.getBoundingClientRect();
      setLeaveConfirmPos({ top: btnRect.top - 8 - modalRect.top, left: btnRect.left - modalRect.left });
    }
    setShowLeaveConfirm(true);
  };

  const closeLeaveConfirm = () => {
    setLeaveConfirmClosing(true);
    setTimeout(() => {
      setShowLeaveConfirm(false);
      setLeaveConfirmClosing(false);
    }, 350);
  };

  // Native wheel capture on info overlay to block PyramidView's handler
  useEffect(() => {
    const el = infoOverlayRef.current;
    if (!el) return;
    const stop = (e) => { e.stopPropagation(); };
    // Bubble phase (NOT capture): let the wheel reach the inner scroll container first so
    // the overlay content scrolls natively, THEN stop it here so it never reaches
    // PyramidView's container handler (which preventDefault()s and locks the frame).
    el.addEventListener('wheel', stop, { passive: false });
    el.addEventListener('touchmove', stop, { passive: false });
    return () => {
      el.removeEventListener('wheel', stop);
      el.removeEventListener('touchmove', stop);
    };
  }, [showInfo]);

  const closeInfo = () => {
    // Shrink info overlay first, then expand intro card back from the same point
    setInfoClosing(true);
    setTimeout(() => {
      setShowInfo(false);
      setInfoClosing(false);
      setInfoReady(false); // reset so next open gets a fresh two-phase mount
      setIntroExpanding(true);
      setTimeout(() => setIntroExpanding(false), 375);
    }, 350);
  };

  // Referenties overlay — same two-phase open/close as openInfo/closeInfo, different card content
  const openRefs = () => {
    if (modalRef.current) {
      const modalRect = modalRef.current.getBoundingClientRect();
      const x = window.innerWidth * 0.5 - modalRect.left;
      const y = window.innerHeight * 0.23 - modalRect.top;
      setRefsOrigin(`${x}px ${y}px`);
    }
    setIntroClosing(true);
    setTimeout(() => {
      setIntroClosing(false);
      setShowRefs(true);
      requestAnimationFrame(() => setRefsReady(true));
    }, 375);
  };

  const closeRefs = () => {
    setRefsClosing(true);
    setTimeout(() => {
      setShowRefs(false);
      setRefsClosing(false);
      setRefsReady(false);
      setIntroExpanding(true);
      setTimeout(() => setIntroExpanding(false), 375);
    }, 350);
  };

  // Native wheel capture on refs overlay to block PyramidView's handler
  useEffect(() => {
    const el = refsOverlayRef.current;
    if (!el) return;
    const stop = (e) => { e.stopPropagation(); };
    // Bubble phase (NOT capture): let the wheel reach the inner scroll container first so
    // the overlay content scrolls natively, THEN stop it here so it never reaches
    // PyramidView's container handler (which preventDefault()s and locks the frame).
    el.addEventListener('wheel', stop, { passive: false });
    el.addEventListener('touchmove', stop, { passive: false });
    return () => {
      el.removeEventListener('wheel', stop);
      el.removeEventListener('touchmove', stop);
    };
  }, [showRefs]);

  // Open consent overlay with zoom-from-card animation
  const openConsent = (levelId, e) => {
    if (e && e.currentTarget) {
      const btnRect = e.currentTarget.getBoundingClientRect();
      // Origin relative to the card, which is centered in the viewport
      const cardCenterX = window.innerWidth / 2;
      const cardCenterY = window.innerHeight / 2;
      const x = btnRect.left + btnRect.width / 2 - cardCenterX;
      const y = btnRect.top + btnRect.height / 2 - cardCenterY;
      // Express as offset from card center (50% 50%)
      setConsentOrigin(`calc(50% + ${x}px) calc(50% + ${y}px)`);
    }
    setConsentChecked(false);
    setConsentAiPromptChecked(false);
    setConsentLevelId(levelId);
  };

  const closeConsent = () => {
    setConsentClosing(true);
    setTimeout(() => {
      setConsentLevelId(null);
      setConsentClosing(false);
    }, 350);
  };

  // Log consent to audit trail (fire-and-forget)
  const logConsent = (levelId) => {
    try {
      const token = getToken();
      let userId = null;
      if (token) {
        try { userId = JSON.parse(atob(token.split('.')[1])).sub; } catch {}
      }
      const API_BASE = import.meta.env.VITE_API_URL ||
        (window.location.hostname === 'localhost' ? 'http://localhost:8080/api' : 'https://api.gardenforlife.nl/api');
      fetch(`${API_BASE}/admin/sessions/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'consent_given',
          userId,
          consentType: 'art9_assessment',
          level: levelId,
          message: 'User accepted both consent checkboxes (terms + Art.9 psychological data)',
        }),
      }).catch(() => {});
    } catch {}
  };

  // Intro card entrance handled by parent (introShrinkProgress 0→1);
  // just mark ready immediately so inner content is visible.
  useEffect(() => {
    requestAnimationFrame(() => setIntroReady(true));
  }, []);

  // Native wheel capture on consent overlay
  useEffect(() => {
    const el = consentOverlayRef.current;
    if (!el) return;
    const stop = (e) => { e.stopPropagation(); };
    // Bubble phase (NOT capture): let the wheel reach the inner scroll container first so
    // the overlay content scrolls natively, THEN stop it here so it never reaches
    // PyramidView's container handler (which preventDefault()s and locks the frame).
    el.addEventListener('wheel', stop, { passive: false });
    el.addEventListener('touchmove', stop, { passive: false });
    return () => {
      el.removeEventListener('wheel', stop);
      el.removeEventListener('touchmove', stop);
    };
  }, [consentLevelId]);

  // ── Responsive breakpoints (matches DesktopLayout pattern) ──
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Breakpoint-based sizing:  Desktop(≥1800) / Laptop(≥1079) / Tablet(≥768) / Mobile(<768)
  const s = windowWidth >= 1800 ? {
    // ── Desktop ── all vertical spacings in vh so they track viewport height
    modalMaxWidth: '64.4vw',
    modalMinHeight: 'calc(73.8vh - 0.5rem)', // 82vh − 10%
    modalMaxHeight: '99vh',
    padding: '1.8vh 2rem',
    headerMaxWidth: '22rem',
    headerMb: '2vh',
    descFontSize: '0.875rem',
    descMt: '0.5vh',
    featureGap: '0.5vh',
    featureMb: '1.1vh',
    contentShiftUp: '-1.5vh',
    referentiesMt: '-1vh',
    featurePadding: '0.875vh 0.75rem',
    featureIconSize: '5.85vh',
    featureIconFont: '1.14rem',
    featureTitleFont: '0.875rem',
    featureDescFont: '0.75rem',
    featureItemGap: '0.6rem',
    pyramidMb: '1.8vh',
    pyramidGap: '0.56vh',
    pyramidBaseWidth: 336, pyramidStepWidth: 67,
    pyramidPadY: '0.7vh', pyramidPadX: '1.25rem',
    pyramidDotSize: '0.56rem',
    pyramidLabelFont: '1.05rem',
    pyramidDescFont: '0.84rem',
    pyramidLabelGap: '0.5rem',
    pyramidItemGap: '0.75rem',
    levelsMb: '1.2vh',
    levelsTitleFont: '0.875rem',
    levelsTitleMb: '1vh',
    levelsGap: '1rem',
    levelPadding: '0.8vh 1rem',
    levelTitleFont: '0.875rem',
    levelDescFont: '0.7rem',
    footerPt: '0.8vh',
    footerFont: '0.625rem',
    footerBtnPad: '0.5vh 1.25rem',
    footerBtnFont: '0.75rem',
  } : windowWidth >= 1079 ? {
    // ── Laptop ── 77vw wide (48.1 × 1.6), fonts/spacing at original pre-30% scale
    modalMaxWidth: '77vw',
    modalMinHeight: 'calc(73.8vh - 0.5rem)', // 82vh − 10%
    modalMaxHeight: '99vh',
    padding: '1.4vh 1.05vw',
    headerMaxWidth: '17.0vw',
    headerMb: '1.6vh',
    descFontSize: '1.0vw',
    descMt: '0.3vh',
    featureGap: '0.4vh',
    featureMb: '0.8vh',
    contentShiftUp: '-1.2vh',
    referentiesMt: '-0.8vh',
    featurePadding: '0.75vh 0.52vw',
    featureIconSize: '4.94vh',
    featureIconFont: '0.92vw',
    featureTitleFont: '0.93vw',
    featureDescFont: '0.86vw',
    featureItemGap: '0.4vw',
    pyramidMb: '1.4vh',
    pyramidGap: '0.49vh',
    pyramidBaseWidth: Math.round(windowWidth * 0.1302), pyramidStepWidth: Math.round(windowWidth * 0.026),
    pyramidPadY: '0.56vh', pyramidPadX: '0.84vw',
    pyramidDotSize: '0.41vw',
    pyramidLabelFont: '0.8vw',
    pyramidDescFont: '0.8vw',
    pyramidLabelGap: '0.42vw',
    pyramidItemGap: '0.65vw',
    levelsMb: '1.0vh',
    levelsTitleFont: '0.78vw',
    levelsTitleMb: '0.8vh',
    levelsGap: '0.65vw',
    levelPadding: '0.7vh 0.84vw',
    levelTitleFont: '0.99vw',
    levelDescFont: '0.78vw',
    footerPt: '0.6vh',
    footerFont: '0.57vw',
    footerBtnPad: '0.4vh 0.84vw',
    footerBtnFont: '0.71vw',
  } : windowWidth >= 768 ? {
    // ── Tablet ── vh for vertical, rem for horizontal
    modalMaxWidth: '39.6rem',
    modalMinHeight: 'calc(73.8vh - 0.5rem)', // 82vh − 10%
    modalMaxHeight: '99vh',
    padding: '1.4vh 1.2rem',
    headerMaxWidth: '17rem',
    headerMb: '1.6vh',
    descFontSize: '0.75rem',
    descMt: '0.3vh',
    featureGap: '0.4vh',
    featureMb: '0.8vh',
    contentShiftUp: '-1vh',
    referentiesMt: '-0.8vh',
    featurePadding: '0.75vh 0.49rem',
    featureIconSize: '4.55vh',
    featureIconFont: '0.85rem',
    featureTitleFont: '0.65rem',
    featureDescFont: '0.55rem',
    featureItemGap: '0.36rem',
    pyramidMb: '1.4vh',
    pyramidGap: '0.49vh',
    pyramidBaseWidth: 136.5, pyramidStepWidth: 27.3,
    pyramidPadY: '0.56vh', pyramidPadX: '0.975rem',
    pyramidDotSize: '0.46rem',
    pyramidLabelFont: '0.91rem',
    pyramidDescFont: '0.77rem',
    pyramidLabelGap: '0.5rem',
    pyramidItemGap: '0.6rem',
    levelsMb: '1.0vh',
    levelsTitleFont: '0.65rem',
    levelsTitleMb: '0.8vh',
    levelsGap: '0.6rem',
    levelPadding: '0.7vh 0.975rem',
    levelTitleFont: '0.75rem',
    levelDescFont: '0.6rem',
    footerPt: '0.6vh',
    footerFont: '0.5rem',
    footerBtnPad: '0.4vh 0.975rem',
    footerBtnFont: '0.6rem',
  } : {
    // ── Mobile ── vh for vertical, rem for horizontal
    modalMaxWidth: '97vw',
    modalMinHeight: 'calc(72vh - 0.5rem)', // 80vh − 10%
    modalMaxHeight: '99vh',
    padding: '1.2vh 0.85rem',
    headerMaxWidth: '11rem',
    headerMb: '1.2vh',
    descFontSize: '0.72rem',
    descMt: '0.2vh',
    featureGap: '0.35vh',
    featureMb: '0.2vh',
    contentShiftUp: '-0.5vh',
    referentiesMt: '-0.5rem',
    featurePadding: '0.625vh 0.5rem',
    featureIconSize: '4.16vh',
    featureIconFont: '0.85rem',
    featureTitleFont: '0.65rem',
    featureDescFont: '0.55rem',
    featureItemGap: '0.35rem',
    pyramidMb: '0.9vh',
    pyramidGap: '0.35vh',
    pyramidBaseWidth: 140, pyramidStepWidth: 28,
    pyramidPadY: '0.49vh', pyramidPadX: '0.75rem',
    pyramidDotSize: '0.42rem',
    pyramidLabelFont: '0.84rem',
    pyramidDescFont: '0.7rem',
    pyramidLabelGap: '0.4rem',
    pyramidItemGap: '0.5rem',
    levelsMb: '0.8vh',
    levelsTitleFont: '0.7rem',
    levelsTitleMb: '0.5vh',
    levelsGap: '0.5rem',
    levelPadding: '0.5vh 0.75rem',
    levelTitleFont: '0.8rem',
    levelDescFont: '0.65rem',
    footerPt: '0.4vh',
    footerFont: '0.5rem',
    footerBtnPad: '0.35vh 0.85rem',
    footerBtnFont: '0.6rem',
  };

  const features = [
    { 
      icon: analyseIcon,
      isImage: true,
      titleKey: 'assessmentIntro.features.layerAnalysis.title',
      descKey: 'assessmentIntro.features.layerAnalysis.description',
      color: "#22d3ee" 
    },
    { 
      icon: shadowIcon,
      isImage: true,
      titleKey: 'assessmentIntro.features.shadowIntegration.title',
      descKey: 'assessmentIntro.features.shadowIntegration.description',
      color: "#a855f7" 
    },
    { 
      icon: scienceIcon,
      isImage: true,
      titleKey: 'assessmentIntro.features.researchBacked.title',
      descKey: 'assessmentIntro.features.researchBacked.description',
      color: "#f472b6" 
    },
    { 
      icon: aiIcon,
      isImage: true,
      titleKey: 'assessmentIntro.features.aiTraining.title',
      descKey: 'assessmentIntro.features.aiTraining.description',
      color: "#fbbf24" 
    },
  ];

  const levels = [
    {
      id: 'quick',
      nameKey: 'assessmentIntro.levels.quick.name',
      descKey: 'assessmentIntro.levels.quick.description',
      questionsPerLayer: 3,
      color: '#22c55e'
    },
    {
      id: 'standard',
      nameKey: 'assessmentIntro.levels.standard.name',
      descKey: 'assessmentIntro.levels.standard.description',
      questionsPerLayer: 6,
      color: '#a855f7'
    },
    {
      id: 'deep',
      nameKey: 'assessmentIntro.levels.deep.name',
      descKey: 'assessmentIntro.levels.deep.description',
      questionsPerLayer: 6,
      includeUpload: true,
      color: '#f97316'
    },
  ];

  // Updated layer colors: Zelf=green, Ander=blue, Massa=purple, Wereld=red, Mysterie=orange
  const layers = [
    { nameKey: "assessmentIntro.layers.mysterie", color: "#f97316", descKey: "assessmentIntro.layers.mysterie" },
    { nameKey: "assessmentIntro.layers.wereld", color: "#ef4444", descKey: "assessmentIntro.layers.wereld" },
    { nameKey: "assessmentIntro.layers.massa", color: "#a855f7", descKey: "assessmentIntro.layers.massa" },
    { nameKey: "assessmentIntro.layers.ander", color: "#3b82f6", descKey: "assessmentIntro.layers.ander" },
    { nameKey: "assessmentIntro.layers.zelf", color: "#22c55e", descKey: "assessmentIntro.layers.zelf" },
  ];

  const isMobile = windowWidth < 768;
  const isLowGpu = isIntegratedGPU();
  const laptopBlur = isLowGpu ? 'none' : 'blur(32px)';

  // CSS keyframes for info overlay expand/contract
  const infoAnimStyles = `
    @keyframes infoExpand {
      0% { transform: scale(0); opacity: 0; }
      60% { opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes infoContract {
      0% { transform: scale(1); opacity: 1; }
      40% { opacity: 0.6; }
      100% { transform: scale(0); opacity: 0; }
    }
    @keyframes infoBlurIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes infoBlurOut {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes introBlurOut {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes introBlurIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
  `;

  return (
    <>
    <style>{infoAnimStyles}</style>
    {/* Pre-load the "Lees mij!" info-card images on intro mount (they live in a panel that
        mounts lazily, so without this they pop in only after the card opens). */}
    <div aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
      <img src={wheelAnatomy} alt="" decoding="async" fetchpriority="low" />
      <img src={triangleHardware} alt="" decoding="async" fetchpriority="low" />
      <img src={cellsImage} alt="" decoding="async" fetchpriority="low" />
    </div>
    <div className="fixed inset-0 flex items-center justify-center p-3 pointer-events-auto" style={{ backgroundColor: isMobile ? 'rgba(0,0,0,0.65)' : 'transparent', backdropFilter: isMobile ? 'blur(4px)' : 'none' }}>
      {/* Outer wrapper: holds corner brackets; no overflow clip so they're visible */}
      {!showInfo && !showRefs && (
      <>
      {/* Intro blur layer — fixed, never transformed, opacity-only animation */}
      <div style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, calc(-50% + 1rem))', // card sits 1rem below center
        width: `min(${s.modalMaxWidth}, calc(100vw - 1.5rem))`,
        minHeight: s.modalMinHeight,
        maxHeight: s.modalMaxHeight,
        borderRadius: '0.5rem',
        backdropFilter: laptopBlur,
        WebkitBackdropFilter: laptopBlur,
        pointerEvents: 'none',
        zIndex: 49,
        opacity: introReady ? undefined : 0,
        animation: introReady ? (introClosing ? 'introBlurOut 0.375s ease-in-out forwards'
                 : introExpanding ? 'introBlurIn 0.375s ease-in-out forwards'
                 : 'none') : 'none',
      }} />
      <div className="relative w-full" style={{ maxWidth: s.modalMaxWidth, transformOrigin: infoOrigin, transform: introReady ? undefined : 'scale(0)', opacity: introReady ? undefined : 0, animation: introReady ? (introClosing ? 'infoContract 0.375s cubic-bezier(0.4, 0, 0.2, 1) forwards' : introExpanding ? 'infoExpand 0.375s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'none') : 'none', position: 'relative', top: '1rem', zIndex: 50 }}>
        {/* Top-Left Corner Border */}
        <div className="absolute -top-0.5 -left-0.5 w-4 h-4 z-10" style={{
          border: '1.5px solid #a855f7',
          borderRadius: '10px 0 0 0',
          borderBottom: 'none',
          borderRight: 'none'
        }}></div>
        
        {/* Top-Right Corner Border */}
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 z-10" style={{
          border: '1.5px solid #a855f7',
          borderRadius: '0 10px 0 0',
          borderBottom: 'none',
          borderLeft: 'none'
        }}></div>
        
        {/* Bottom-Left Corner Border */}
        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 z-10" style={{
          border: '1.5px solid #a855f7',
          borderRadius: '0 0 0 10px',
          borderTop: 'none',
          borderRight: 'none'
        }}></div>
        
        {/* Bottom-Right Corner Border */}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 z-10" style={{
          border: '1.5px solid #a855f7',
          borderRadius: '0 0 10px 0',
          borderTop: 'none',
          borderLeft: 'none'
        }}></div>

        {/* Inner glass panel: overflow hidden properly clips content */}
        <div 
          ref={modalRef}
          className="relative w-full rounded-lg"
          style={{ backgroundColor: isLowGpu ? 'rgba(10, 3, 18, 0.9)' : 'rgba(2, 0, 3, 0.55)', backdropFilter: laptopBlur, WebkitBackdropFilter: laptopBlur, minHeight: s.modalMinHeight, maxHeight: s.modalMaxHeight, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: isLowGpu ? '0 6px 30px rgba(0,0,0,0.7)' : '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03)' }}
        >
        {/* Back to map (KOOKEILAND / DELTAWERKEN) — top-left INSIDE the card, so it lives and
            dies with the intro card (hidden while the Lees-mij/referenties overlays replace it).
            The references view has its own back button, so skip it there. */}
        {onBack && !showReferences && (
          <div style={{ position: 'absolute', top: '0.9rem', left: '0.9rem', zIndex: 20 }}>
            <SciFiButton onClick={onBack} variant="purple" size="sm" brackets={false}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                {backLabel}
              </span>
            </SciFiButton>
          </div>
        )}

        {/* Content - matches SectorFrame inner structure */}
        <div className="relative z-10 w-full flex flex-col" style={{ padding: s.padding, flex: '1 1 auto' }}>

          {/* ═══ REFERENCES VIEW ═══ */}
          {showReferences ? (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Back button */}
              <SciFiButton
                onClick={() => setShowReferences(false)}
                variant="purple"
                size="sm"
                style={{ marginBottom: '1.5rem' }}
              >
                ← {t('assessmentIntro.referencesBack')}
              </SciFiButton>

              {/* ──────────────────────────────────────────────────────────────
                  REFERENCE CARD — emptied, ready for the incoming UI.
                  When importing the new UI: copy its LAYOUT STRUCTURE only.
                  Restyle everything to match THIS intro card for consistency:
                    • corner brackets / borders → purple (#a855f7) like the card frame
                    • headings → font-mono uppercase tracking-wider, green (#22c55e) /
                      purple accents with subtle textShadow
                    • body text → text-slate-400, sizes from the `s` scale
                      (s.levelsTitleFont, s.featureTitleFont, s.featureDescFont, s.descFontSize)
                    • cards/boxes → rounded-lg bg-slate-900/30 with faint borders
                  Drop the new structure below; do not keep the incoming UI's own styling.
                  ────────────────────────────────────────────────────────────── */}
            </div>
          ) : (
          /* ═══ MAIN INTRO VIEW ═══ */
          <>
          {/* Header */}
          <div className="text-center" style={{ marginBottom: s.headerMb }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img 
                src={archetypeHeader} 
                alt={t('assessmentIntro.title')} 
                style={{ maxWidth: s.headerMaxWidth, width: '100%', display: 'block' }}
              />

            </div>

            <p className="mx-auto leading-relaxed" style={{ fontSize: s.pyramidLabelFont, marginTop: s.descMt, whiteSpace: isMobile ? 'normal' : 'nowrap', textAlign: 'center', color: '#FFFEF0' }}>
              {t('assessmentIntroExtra.headline')}
            </p>
          </div>

          {/* Features Grid — shifted up */}
          <div className={`grid grid-cols-1 ${windowWidth >= 768 ? 'md:grid-cols-2' : ''}`} style={{ gap: s.featureGap, marginBottom: s.featureMb, marginTop: s.contentShiftUp }}>
            {features.map((feature) => (
              <div
                key={feature.titleKey}
                className="rounded-lg border border-slate-700/50 bg-slate-900/30"
                style={{ padding: s.featurePadding }}
              >
                <div className="flex items-center" style={{ gap: s.featureItemGap }}>
                  {feature.isImage ? (
                    <img
                      src={feature.icon}
                      alt={t(feature.titleKey)}
                      className="flex-shrink-0 rounded-lg"
                      style={{ width: `calc(${s.featureIconSize} * 1.2)`, height: `calc(${s.featureIconSize} * 1.2)`, objectFit: 'contain' }}
                    />
                  ) : (
                    <div
                      className="rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${feature.color}20`, width: s.featureIconSize, height: s.featureIconSize, fontSize: s.featureIconFont }}
                    >
                      {feature.icon}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 className="font-medium text-slate-200" style={{ fontSize: s.pyramidLabelFont, marginBottom: '1px' }}>{t(feature.titleKey)}</h3>
                    <p className="text-slate-500" style={{ fontSize: s.featureTitleFont }}>{t(feature.descKey)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Referenties button + research text + upload button row */}
          <div className={isMobile ? 'flex flex-col items-center gap-3' : 'flex items-center justify-between'} style={{ marginTop: s.referentiesMt, marginBottom: s.featureMb, position: 'relative', zIndex: 1 }}>
            {/* Left: Lees mij! + Referenties buttons */}
            <div style={{ width: isMobile ? 'auto' : '10rem', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', marginLeft: isMobile ? 0 : '4rem', position: 'relative', top: isMobile ? 0 : '5rem' }}>
              <div ref={infoIconRef}>
              <SciFiButton
                onClick={() => showInfo ? closeInfo() : openInfo()}
                color="#a78bfa"
                rgb="167, 139, 250"
                textColor="#a78bfa"
                size="sm"
                active={showInfo}
                fullWidth
              >
                {t('assessmentIntroExtra.readMe')}
              </SciFiButton>
              </div>

              {/* Divider — matches right panel spacing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '10rem' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
              </div>

              <div ref={referentiesRef}>
                <SciFiButton
                  onClick={() => showRefs ? closeRefs() : openRefs()}
                  color="#94a3b8"
                  rgb="148, 163, 184"
                  textColor="#FFFEF0"
                  size="sm"
                  active={showRefs}
                  fullWidth
                >
                  {t('assessmentIntro.footerButton')}
                </SciFiButton>
              </div>
            </div>

            {/* Center: research text */}

            {/* Right: Upload OCEAN button + Manual scores button */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-end', gap: '0.35rem', marginRight: isMobile ? 0 : '4rem', position: 'relative', top: isMobile ? 0 : '5rem' }}>
              {onAddFile && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (uploadedFiles.length > 0 && onRemoveFile) onRemoveFile(0);
                        // Clear any manual scores if a PDF is uploaded
                        setOceanManualScores(null);
                        onAddFile(file);
                        e.target.value = '';
                      }
                    }}
                  />
                  <div
                    style={{ position: 'relative', width: '10rem' }}
                    onMouseEnter={() => setShowOceanInfo(true)}
                    onMouseLeave={() => setShowOceanInfo(false)}
                  >
                  {/* Info icon — top-right corner of the Upload button; the whole button triggers the pop-up */}
                  <span
                    style={{
                      position: 'absolute', top: '-0.45rem', right: '-0.45rem', zIndex: 30,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '1.05rem', height: '1.05rem', borderRadius: '50%',
                      backgroundColor: 'rgba(2,0,3,0.9)', border: '1px solid rgba(167,139,250,0.6)',
                      color: '#a78bfa', fontSize: '0.62rem', fontWeight: 700, fontStyle: 'italic',
                      cursor: 'pointer', lineHeight: 1,
                    }}
                    title={t('assessmentIntroExtra.infoTitle')}
                  >
                    i
                    {showOceanInfo && (
                      <div
                        style={{
                          position: 'absolute', bottom: 'calc(100% + 0.4rem)', right: 0,
                          width: '19.5rem', padding: '0.84rem 1.08rem', borderRadius: '0.5rem',
                          backgroundColor: isLowGpu ? 'rgba(10, 3, 18, 0.9)' : 'rgba(2, 0, 3, 0.55)',
                          backdropFilter: laptopBlur, WebkitBackdropFilter: laptopBlur,
                          border: '1px solid rgba(167,139,250,0.35)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.45)', zIndex: 50,
                          color: 'rgba(255,254,240,0.85)', fontSize: s.descFontSize, lineHeight: 1.6,
                          fontStyle: 'normal', fontWeight: 400, textAlign: 'left', whiteSpace: 'normal',
                          cursor: 'default',
                        }}
                      >
                        <span style={{ color: '#a78bfa', fontWeight: 600 }}>{t('assessmentIntro.oceanInfoLabel')}</span>
                        {t('assessmentIntro.oceanInfoText')}
                      </div>
                    )}
                  </span>
                  {uploadedFiles.length > 0 && (
                    <div style={{ position: 'absolute', right: 'calc(100% + 0.85rem)', top: '50%', transform: 'translateY(-50%)' }}>
                      <span
                        onMouseEnter={() => setShowUploadWarning(true)}
                        onMouseLeave={() => setShowUploadWarning(false)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '1.25rem', height: '1.25rem', borderRadius: '50%',
                          border: '1px solid rgba(251,146,60,0.5)', color: '#fb923c',
                          fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                          flexShrink: 0, lineHeight: 1,
                        }}
                        title={t('assessmentIntroExtra.uploadInfoTitle')}
                      >
                        i
                      </span>
                      {showUploadWarning && (
                        <div
                          onMouseEnter={() => setShowUploadWarning(true)}
                          onMouseLeave={() => setShowUploadWarning(false)}
                          style={{
                          position: 'absolute', bottom: 'calc(100% + 0.5rem)', left: '50%', transform: 'translateX(-50%)',
                          width: '18rem', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                          backgroundColor: 'rgba(15,23,42,0.97)', border: '1px solid rgba(251,146,60,0.3)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', zIndex: 50,
                          color: 'rgba(148,163,184,0.9)', fontSize: '0.7rem', lineHeight: 1.6,
                        }}>
                          <span style={{ color: '#fb923c', fontWeight: 600 }}>{t('assessmentIntroExtra.uploadWarningLabel')}</span>
                          {t('assessmentIntroExtra.uploadWarningText')}
                        </div>
                      )}
                    </div>
                  )}
                  <SciFiButton
                    onClick={() => fileInputRef.current?.click()}
                    color="#a78bfa"
                    rgb="167, 139, 250"
                    textColor="#a78bfa"
                    size="sm"
                    fullWidth
                    style={{ width: '10rem' }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                      {uploadedFiles.length > 0 && onRemoveFile && (
                        <span
                          onClick={(e) => { e.stopPropagation(); onRemoveFile(0); }}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          style={{ fontSize: '0.65rem', lineHeight: 1, marginRight: '0.25rem', flexShrink: 0, cursor: 'pointer' }}
                          title={t('assessmentIntroExtra.removeFileTitle')}
                        >
                          ✕
                        </span>
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {uploadedFiles.length > 0
                          ? uploadedFiles[0].name
                          : t('assessmentIntro.footerUpload')}
                      </span>
                    </span>
                  </SciFiButton>
                  </div>

                  {/* Divider label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '10rem' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
                    <span style={{ color: 'rgba(148,163,184,0.35)', fontSize: '0.58rem', fontFamily: 'monospace' }}>{t('assessmentIntroExtra.orDivider')}</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  </div>

                  {/* Manual OCEAN input button */}
                  <div ref={oceanScoresRef}>
                  <SciFiButton
                    onClick={openOceanInput}
                    color={oceanManualScores ? '#22c55e' : '#94a3b8'}
                    rgb={oceanManualScores ? '34, 197, 94' : '148, 163, 184'}
                    textColor={oceanManualScores ? undefined : '#FFFEF0'}
                    size="sm"
                    fullWidth
                    style={{ width: '10rem', fontSize: '0.65rem' }}
                  >
                    {oceanManualScores ? t('assessmentIntroExtra.scoresSaved') : t('assessmentIntroExtra.manualScores')}
                  </SciFiButton>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Pyramid Layers Visual */}
          <div style={{ marginBottom: s.pyramidMb, marginTop: 'auto', position: 'relative', top: '-2rem' }}>
            <h2 className="text-center text-slate-400 font-mono uppercase tracking-wider" style={{ display: 'none', fontSize: s.levelsTitleFont, marginBottom: s.levelsTitleMb }}>
              {t('assessmentIntro.layersTitle')}
            </h2>
            <div className="flex flex-col items-center relative" style={{ gap: s.pyramidGap }}>
              {/* Holographic glow backdrop */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.06) 0%, transparent 70%)',
                filter: isLowGpu ? 'none' : 'blur(20px)',
              }} />
              {layers.map((layer, index) => {
                const glowIntensity = 1 - index * 0.12;
                return (
                  <div
                    key={layer.nameKey}
                    className="flex items-center rounded border transition-all duration-500 hover:scale-105 relative group"
                    style={{
                      width: `${s.pyramidBaseWidth + index * s.pyramidStepWidth}px`,
                      justifyContent: 'center',
                      borderColor: `${layer.color}50`,
                      background: `linear-gradient(135deg, ${layer.color}12 0%, ${layer.color}06 50%, ${layer.color}10 100%)`,
                      padding: `${s.pyramidPadY} ${s.pyramidPadX}`,
                      gap: s.pyramidItemGap,
                      boxShadow: isLowGpu ? 'none' : `0 0 ${12 * glowIntensity}px ${layer.color}18, inset 0 0 ${8 * glowIntensity}px ${layer.color}08`,
                      backdropFilter: isLowGpu ? 'none' : 'blur(4px)',
                    }}
                  >
                    {/* Scan line overlay */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded" style={{ opacity: 0.04 }}>
                      <div style={{
                        width: '100%', height: '100%',
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 3px)',
                      }} />
                    </div>
                    {/* Edge highlight */}
                    <div className="absolute inset-0 pointer-events-none rounded" style={{
                      background: `linear-gradient(90deg, ${layer.color}15, transparent 20%, transparent 80%, ${layer.color}15)`,
                    }} />
                    {/* Glowing dot */}
                    <div
                      className="rounded-full flex-shrink-0 relative"
                      style={{
                        backgroundColor: layer.color,
                        boxShadow: `0 0 8px ${layer.color}, 0 0 16px ${layer.color}60, 0 0 24px ${layer.color}30`,
                        width: s.pyramidDotSize,
                        height: s.pyramidDotSize,
                      }}
                    >
                      <div className="absolute inset-0 rounded-full" style={{
                        background: `radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)`,
                        transform: 'scale(0.5) translate(-20%, -20%)',
                      }} />
                    </div>
                    <div className="flex items-center relative" style={{ gap: s.pyramidLabelGap }}>
                      <span className="font-medium" style={{
                        color: 'rgba(255,254,240,0.72)',
                        fontSize: s.pyramidLabelFont,
                        textShadow: `0 0 10px ${layer.color}50`,
                      }}>{t(`${layer.nameKey}.name`)}</span>
                      <span style={{
                        fontSize: s.pyramidDescFont,
                        color: 'rgba(148,163,184,0.8)',
                      }}>{t(`${layer.descKey}.desc`)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Free / paid transparency — between the pyramid and the level choices, where the
              green frame merges with the layout. Shown up front so nobody finishes the test
              expecting the full report for free. */}
          <div
            className="rounded-lg bg-slate-900/30"
            style={{
              marginBottom: s.featureMb,
              padding: s.featurePadding,
              border: '1px solid rgba(29,153,4,0.18)',
            }}
          >
            <div className="flex items-center" style={{ gap: '0.5rem', marginBottom: '0.25rem', lineHeight: 1.5 }}>
              <span style={{ color: '#1d9904', fontSize: s.featureTitleFont }}>✓</span>
              {(() => {
                const full = t('assessmentIntro.pricing.title');
                const idx = full.indexOf('—');
                const head = idx >= 0 ? full.slice(0, idx) : full; // "Gratis Analyse "
                const tail = idx >= 0 ? full.slice(idx) : ''; // "— prompt waarde…" (white, incl. dash)
                return (
                  <h3 className="font-semibold" style={{ fontSize: s.featureTitleFont }}>
                    <span style={{ color: '#1d9904' }}>{head}</span>
                    <span style={{ color: '#FFFEF0' }}>{tail}</span>
                  </h3>
                );
              })()}
            </div>
            <p style={{ color: '#FFFEF0', fontSize: s.featureTitleFont, lineHeight: 1.5, marginBottom: '0.3rem' }}>
              {t('assessmentIntro.pricing.free')}
            </p>
            {(() => {
              const full = t('assessmentIntro.pricing.paid');
              const idx = full.indexOf('—');
              const head = idx >= 0 ? full.slice(0, idx) : full; // "Optioneel voor €00,00 "
              const tail = idx >= 0 ? full.slice(idx) : ''; // "— De volledige…" (white, incl. dash)
              return (
                <p style={{ fontSize: s.featureTitleFont, lineHeight: 1.5 }}>
                  <span style={{ color: '#1d9904' }}>{head}</span>
                  <span style={{ color: '#FFFEF0' }}>{tail}</span>
                </p>
              );
            })()}
          </div>

          {/* Level Selection — each card carries the same info pop-up (beginner, gevorderd, diep). */}
          <div style={{ marginBottom: s.levelsMb, marginTop: '1rem' }}>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`} style={{ gap: s.levelsGap }}>
              {levels.map((level) => {
                const isLocked = level.id === 'quick' || level.id === 'standard';
                return (
                  <div key={level.id} style={{ position: 'relative', width: '90%', margin: '0 auto' }}>
                    {/* Info pop-up — platform glass, intro-card text size; same message on every card */}
                    <span
                      onMouseEnter={() => setInfoLevel(level.id)}
                      onMouseLeave={() => setInfoLevel(null)}
                      style={{
                        position: 'absolute', top: '-0.55rem', right: '-0.55rem', zIndex: 30,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '1.15rem', height: '1.15rem', borderRadius: '50%',
                        backgroundColor: 'rgba(2,0,3,0.9)', border: '1px solid rgba(249,115,22,0.6)',
                        color: '#f97316', fontSize: '0.68rem', fontWeight: 700, fontStyle: 'italic',
                        cursor: 'pointer', lineHeight: 1,
                      }}
                      title={t('assessmentIntroExtra.infoTitle')}
                    >
                      i
                      {infoLevel === level.id && (
                        <div
                          style={{
                            position: 'absolute', bottom: 'calc(100% + 0.4rem)', right: 0,
                            width: '21.6rem', maxWidth: '80vw', padding: '0.84rem 1.08rem', borderRadius: '0.5rem',
                            backgroundColor: isLowGpu ? 'rgba(10, 3, 18, 0.9)' : 'rgba(2, 0, 3, 0.55)',
                            backdropFilter: laptopBlur, WebkitBackdropFilter: laptopBlur,
                            border: '1px solid rgba(249,115,22,0.35)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.45)', zIndex: 50,
                            color: 'rgba(255,254,240,0.85)', fontSize: s.descFontSize, lineHeight: 1.6,
                            fontStyle: 'normal', fontWeight: 400, textAlign: 'left', whiteSpace: 'normal',
                            cursor: 'default',
                          }}
                        >
                          {renderCopy(t('assessmentIntroExtra.levelInfo'))}
                        </div>
                      )}
                    </span>
                    <SciFiButton
                      onClick={(e) => !isLocked && openConsent(level.id, e)}
                      color="#f97316"
                      rgb="249, 115, 22"
                      size="lg"
                      rounded="0.4rem"
                      fullWidth
                      disabled={isLocked}
                      padding={s.levelPadding}
                      style={{ width: '100%' }}
                    >
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', width: '100%' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: s.levelTitleFont }}>
                          {t(level.nameKey)}
                          {isLocked && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                          )}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: s.levelDescFont, textTransform: 'none', letterSpacing: 'normal', fontWeight: 400, textAlign: 'center' }}>
                          {t(level.descKey)}
                        </span>
                      </span>
                    </SciFiButton>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-800" style={{ paddingTop: s.footerPt }}>
          </div>
          </>
          )}
        </div>

        {/* ═══ LEAVE CONFIRMATION ═══ */}
        {showLeaveConfirm && (
          <div
            className="absolute z-50"
            style={{
              top: `calc(${leaveConfirmPos.top}px + 1.5rem)`,
              left: `calc(${leaveConfirmPos.left}px + 4rem)`,
              transform: 'translateY(-100%)',
              transformOrigin: 'left top',
              animation: `${leaveConfirmClosing ? 'infoContract' : 'infoExpand'} 0.375s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            }}
          >
            {/* Card */}
            <div style={{
              position: 'relative',
              backgroundColor: isLowGpu ? 'rgba(10, 3, 18, 0.9)' : 'rgba(2, 0, 3, 0.55)',
              backdropFilter: laptopBlur,
              WebkitBackdropFilter: laptopBlur,
              borderRadius: '0.5rem',
              padding: '1.25rem 1.5rem',
              boxShadow: isLowGpu ? '0 6px 30px rgba(0,0,0,0.7)' : '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(34,197,94,0.06), inset 0 0 30px rgba(34,197,94,0.03)',
              whiteSpace: 'nowrap',
            }}>
              {/* Corner accents */}
              {[['tl',{top:-2,left:-3,borderTop:'1px solid rgba(34,197,94,0.6)',borderLeft:'1px solid rgba(34,197,94,0.6)',borderTopLeftRadius:'2px'}],
                ['tr',{top:-2,right:-3,borderTop:'1px solid rgba(34,197,94,0.6)',borderRight:'1px solid rgba(34,197,94,0.6)',borderTopRightRadius:'2px'}],
                ['bl',{bottom:-2,left:-3,borderBottom:'1px solid rgba(34,197,94,0.6)',borderLeft:'1px solid rgba(34,197,94,0.6)',borderBottomLeftRadius:'2px'}],
                ['br',{bottom:-2,right:-3,borderBottom:'1px solid rgba(34,197,94,0.6)',borderRight:'1px solid rgba(34,197,94,0.6)',borderBottomRightRadius:'2px'}],
              ].map(([k,s]) => (
                <div key={k} style={{ position:'absolute', width:'0.55rem', height:'0.55rem', pointerEvents:'none', ...s }} />
              ))}
              <p style={{
                color: 'rgba(209,213,219,0.9)',
                fontSize: '0.65rem',
                lineHeight: 1.8,
                marginBottom: '1rem',
                fontFamily: "'Lexend Mega', sans-serif",
                letterSpacing: '0.05em',
                textAlign: 'center',
              }}>
                {t('assessmentIntroExtra.leaveConfirm.question')}
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                <SciFiButton
                  onClick={closeLeaveConfirm}
                  color="#64748b"
                  rgb="100, 116, 139"
                  size="sm"
                >
                  {t('assessmentIntroExtra.leaveConfirm.back')}
                </SciFiButton>
                <SciFiButton
                  onClick={() => { closeLeaveConfirm(); setTimeout(() => { onNavigateToData && onNavigateToData(); }, 360); }}
                  color="#22c55e"
                  rgb="34, 197, 94"
                  size="sm"
                >
                  {t('assessmentIntroExtra.leaveConfirm.proceed')}
                </SciFiButton>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CONSENT OVERLAY ═══ */}
        {consentLevelId && (
          <div
            ref={consentOverlayRef}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(2, 0, 3, 0.82)',
              backdropFilter: laptopBlur,
              WebkitBackdropFilter: laptopBlur,
              boxShadow: isLowGpu ? '0 6px 30px rgba(0,0,0,0.7)' : '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03)',
              animation: `${consentClosing ? 'infoContract' : 'infoExpand'} 0.375s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
              transformOrigin: consentOrigin,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) closeConsent(); }}
          >
            <div
              className="rounded-xl"
              style={{
                backgroundColor: isLowGpu ? 'rgba(10, 3, 18, 0.9)' : 'rgba(2, 0, 3, 0.55)',
                backdropFilter: laptopBlur,
                WebkitBackdropFilter: laptopBlur,
                border: '1px solid rgba(168,85,247,0.2)',
                padding: s.padding,
                overflowY: 'auto',
                width: `calc(0.8 * ${s.modalMaxWidth})`,
                maxWidth: '90vw',
                minHeight: `calc(0.7 * ${s.modalMinHeight})`,
                maxHeight: `calc(0.7 * ${s.modalMaxHeight})`,
                boxShadow: isLowGpu ? '0 6px 30px rgba(0,0,0,0.7)' : '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03)',
              }}
            >
              {/* Title */}
              <h2 className="text-center font-mono uppercase tracking-wider" style={{
                fontSize: s.levelTitleFont, color: '#a855f7', marginBottom: '0.2rem',
                textShadow: '0 0 10px rgba(168,85,247,0.35)',
              }}>
                {t('assessmentIntroExtra.consent.title')}
              </h2>
              <p className="text-center" style={{ color: 'rgba(148,163,184,0.5)', fontSize: s.featureDescFont, marginBottom: '1.5rem', fontStyle: 'italic' }}>
                {t('assessmentIntroExtra.consent.subtitle')}
              </p>

              {/* Pre-text: Wat we doen */}
              <div style={{ borderLeft: '2px solid rgba(168,85,247,0.4)', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ color: '#c4b5fd', fontSize: s.featureTitleFont, fontWeight: 600, marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('assessmentIntroExtra.consent.whatWeDoLabel')}</p>
                <p style={{ color: 'rgba(148,163,184,0.85)', fontSize: s.featureDescFont, lineHeight: 1.7, marginBottom: '0.6rem' }}>
                  {renderCopy(t('assessmentIntroExtra.consent.whatWeDoP1'))}
                </p>
                <p style={{ color: 'rgba(148,163,184,0.85)', fontSize: s.featureDescFont, lineHeight: 1.7 }}>
                  {renderCopy(t('assessmentIntroExtra.consent.whatWeDoP2'))}
                </p>
              </div>

              {/* Checkbox 1: Algemene voorwaarden & privacybeleid */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.8rem' }}>
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  style={{ marginTop: '0.15rem', accentColor: '#a855f7', width: '1rem', height: '1rem', flexShrink: 0, cursor: 'pointer' }}
                />
                <span style={{ color: 'rgba(148,163,184,0.9)', fontSize: s.featureDescFont, lineHeight: 1.6 }}>
                  {renderCopy(t('assessmentIntroExtra.consent.checkboxTerms'), setPendingPolicySlug)}
                </span>
              </label>

              {/* Checkbox 2: Uitdrukkelijke toestemming Art. 9 AVG */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={consentAiPromptChecked}
                  onChange={(e) => setConsentAiPromptChecked(e.target.checked)}
                  style={{ marginTop: '0.15rem', accentColor: '#a855f7', width: '1rem', height: '1rem', flexShrink: 0, cursor: 'pointer' }}
                />
                <span style={{ color: 'rgba(148,163,184,0.9)', fontSize: s.featureDescFont, lineHeight: 1.6 }}>
                  {renderCopy(t('assessmentIntroExtra.consent.checkboxArt9'))}
                </span>
              </label>
              <ul style={{ color: 'rgba(148,163,184,0.85)', fontSize: s.featureDescFont, lineHeight: 1.7, paddingLeft: '2.75rem', listStyle: 'none', marginBottom: '1.5rem' }}>
                {tArray('assessmentIntroExtra.consent.bullets').map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                    <span style={{ color: '#a855f7', flexShrink: 0 }}>·</span><span>{renderCopy(item)}</span>
                  </li>
                ))}
              </ul>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <SciFiButton
                  onClick={() => closeConsent()}
                  variant="white"
                  size="sm"
                >
                  {t('assessmentIntroExtra.consent.cancel')}
                </SciFiButton>
                <SciFiButton
                  onClick={() => { if (consentChecked && consentAiPromptChecked) { const lvl = consentLevelId; closeConsent(); logConsent(lvl); onStart(lvl); } }}
                  disabled={!consentChecked || !consentAiPromptChecked}
                  variant="purple"
                  size="sm"
                  active={consentChecked && consentAiPromptChecked}
                >
                  {t('assessmentIntroExtra.consent.agree')}
                </SciFiButton>
              </div>
            </div>

            {/* ── Policy redirect warning modal ── */}
            {pendingPolicySlug && (
              <div
                style={{
                  position: 'absolute', inset: 0, zIndex: 60,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }}
                onClick={(e) => { if (e.target === e.currentTarget) setPendingPolicySlug(null); }}
              >
                <div style={{
                  backgroundColor: 'rgba(10, 5, 15, 0.95)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem 1.4rem',
                  maxWidth: '240px',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 0 8px rgba(168,85,247,0.05)',
                  animation: 'infoExpand 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                  transformOrigin: 'center center',
                }}>
                  <p style={{ color: 'rgba(148,163,184,0.9)', fontSize: 'max(10px, 0.5vw)', marginBottom: '0.8rem', lineHeight: 1.5 }}>
                    {t('assessmentIntroExtra.policyRedirect.text')}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <SciFiButton
                      onClick={() => setPendingPolicySlug(null)}
                      variant="white"
                      size="xs"
                      padding="0.25rem 0.7rem"
                      fontSize="max(8px, 0.4vw)"
                    >
                      {t('assessmentIntroExtra.policyRedirect.back')}
                    </SciFiButton>
                    <SciFiButton
                      onClick={() => {
                        const slug = pendingPolicySlug;
                        setPendingPolicySlug(null);
                        // Skip consent close animation — parent will shrink entire card as a whole
                        setConsentLevelId(null);
                        setConsentClosing(false);
                        if (onNavigateToPolicy) onNavigateToPolicy(slug);
                      }}
                      variant="purple"
                      size="xs"
                      padding="0.25rem 0.7rem"
                      fontSize="max(8px, 0.4vw)"
                    >
                      {t('assessmentIntroExtra.policyRedirect.proceed')}
                    </SciFiButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {/* ══ OCEAN Manual Input Modal ══ */}
        {showOceanInput && (
          <OceanManualInputModal
            origin={oceanOrigin}
            initialValues={oceanManualScores}
            onClose={() => setShowOceanInput(false)}
            onConfirm={(scores) => {
              setOceanManualScores(scores);
              // Clear any uploaded PDF file and inject scores as a synthetic text file
              if (uploadedFiles.length > 0 && onRemoveFile) onRemoveFile(0);
              if (onAddFile) {
                const tf = (k) => tFunc(`assessmentIntroExtra.oceanFile.${k}`);
                const lines = [
                  t('assessmentIntroExtra.oceanFile.header'),
                  '',
                  tf('agreeableness')(scores.A),
                  scores.A_compassie !== null   ? tf('compassion')(scores.A_compassie)   : null,
                  scores.A_beleefdheid !== null ? tf('politeness')(scores.A_beleefdheid) : null,
                  tf('conscientiousness')(scores.C),
                  scores.C_ijver !== null        ? tf('industriousness')(scores.C_ijver)      : null,
                  scores.C_ordelijkheid !== null ? tf('orderliness')(scores.C_ordelijkheid)   : null,
                  tf('extraversion')(scores.E),
                  scores.E_enthousiasme !== null  ? tf('enthusiasm')(scores.E_enthousiasme)   : null,
                  scores.E_assertiviteit !== null ? tf('assertiveness')(scores.E_assertiviteit) : null,
                  tf('neuroticism')(scores.N),
                  scores.N_terughoudendheid !== null ? tf('withdrawal')(scores.N_terughoudendheid) : null,
                  scores.N_volatiliteit !== null    ? tf('volatility')(scores.N_volatiliteit)      : null,
                  tf('openness')(scores.O),
                  scores.O_intellect !== null ? tf('intellect')(scores.O_intellect) : null,
                  scores.O_esthetiek !== null ? tf('aesthetics')(scores.O_esthetiek) : null,
                  scores.H !== null ? tf('honestyHumility')(scores.H) : null,
                  '',
                  t('assessmentIntroExtra.oceanFile.scaleNote'),
                ].filter(Boolean).join('\n');
                const file = new File([lines], t('assessmentIntroExtra.oceanFile.fileName'), { type: 'text/plain' });
                onAddFile(file);
              }
            }}
          />
        )}
        </div>
      </div>
      </>
    )}

    {/* ═══ INFO OVERLAY — sibling element, blurs HoloEarth directly ═══ */}
    {showInfo && (
      <>
      {/* Blur layer — fixed position, opacity-only animation, never transformed.
          Decoupled from the scale animation so blur is full-size from the first frame. */}
      <div style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, calc(-50% + 1rem))', // card sits 1rem below center
        width: `min(${s.modalMaxWidth}, calc(100vw - 1.5rem))`,
        minHeight: s.modalMinHeight,
        maxHeight: s.modalMaxHeight,
        borderRadius: '0.5rem',
        backdropFilter: laptopBlur,
        WebkitBackdropFilter: laptopBlur,
        pointerEvents: 'none',
        zIndex: 49,
        opacity: infoReady ? undefined : 0,
        animation: infoReady ? `${infoClosing ? 'infoBlurOut' : 'infoBlurIn'} 0.375s ease-in-out forwards` : 'none',
      }} />
      {/* Scale wrapper — no backdropFilter, handles scale + transform origin */}
      <div className="relative w-full" style={{
        maxWidth: s.modalMaxWidth,
        transformOrigin: infoOrigin,
        // Only animate once infoReady=true (1 rAF after mount)
        animation: infoReady ? `${infoClosing ? 'infoContract' : 'infoExpand'} 0.375s cubic-bezier(0.4, 0, 0.2, 1) forwards` : 'none',
        transform: infoReady ? undefined : 'scale(0)',
        opacity: infoReady ? undefined : 0,
        position: 'relative',
        top: '1rem',
        zIndex: 50,
      }}>
        {/* Top-Left Corner */}
        <div className="absolute -top-0.5 -left-0.5 w-4 h-4 z-10" style={{ border: '1.5px solid #a855f7', borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' }}></div>
        {/* Top-Right Corner */}
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 z-10" style={{ border: '1.5px solid #a855f7', borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' }}></div>
        {/* Bottom-Left Corner */}
        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 z-10" style={{ border: '1.5px solid #a855f7', borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' }}></div>
        {/* Bottom-Right Corner */}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 z-10" style={{ border: '1.5px solid #a855f7', borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' }}></div>

        {/* Inner glass panel */}
        <div
          ref={infoOverlayRef}
          className="relative w-full rounded-lg"
          style={{
            backgroundColor: isLowGpu ? 'rgba(10, 3, 18, 0.9)' : 'rgba(2, 0, 3, 0.55)',
            backdropFilter: laptopBlur,
            WebkitBackdropFilter: laptopBlur,
            boxShadow: isLowGpu ? '0 6px 30px rgba(0,0,0,0.7)' : '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03)',
            overflow: 'hidden',
            minHeight: s.modalMinHeight,
            maxHeight: s.modalMaxHeight,
            display: 'flex',
            flexDirection: 'column',
            paddingTop: `calc(${s.padding.split(' ')[0]} * 2 + 1.5rem)`,
            paddingBottom: `calc(${s.padding.split(' ')[0]} * 2)`,
            paddingRight: 0,
            paddingLeft: s.padding.split(' ')[1],
            boxSizing: 'border-box',
          }}
        >
            {/* Title — sits in top padding zone, above the rule */}
            <h2 className="text-center font-mono uppercase tracking-wider" style={{
              flexShrink: 0,
              fontSize: `calc(${s.levelTitleFont} + 0.25rem)`,
              color: '#a855f7',
              textShadow: '0 0 10px rgba(168,85,247,0.3)',
              paddingRight: s.padding.split(' ')[1],
              paddingBottom: '0.85rem',
              margin: 0,
            }}>
              {t('assessmentIntroExtra.leesmij.title')}
            </h2>
            {/* Top rule */}
            <div style={{ flexShrink: 0, height: '0.75px', backgroundColor: 'rgba(168,85,247,0.45)', borderRadius: '1px', marginRight: s.padding.split(' ')[1] }} />
            {/* Scrollable content area — scroll track sits at card's right border */}
            <div className="purple-scrollbar" style={{ flex: '1 1 0', overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingRight: s.padding.split(' ')[1], borderRadius: 'inherit' }}>

            {/* Info content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="rounded-lg" style={{ padding: '1rem' }}>
                <h3 className="font-medium" style={{ color: '#22c55e', fontSize: s.descFontSize, marginBottom: '0.5rem', textShadow: '0 0 8px rgba(34,197,94,0.3)' }}>{t('assessmentIntroExtra.leesmij.notATest.heading')}</h3>
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{t('assessmentIntroExtra.leesmij.notATest.p1')}</p>
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{renderCopy(t('assessmentIntroExtra.leesmij.notATest.p2'))}</p>
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{t('assessmentIntroExtra.leesmij.notATest.p3')}</p>
              </div>

              <div className="rounded-lg" style={{ padding: '1rem', display: 'flex', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'stretch', width: '100%' }}>
                  <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'flex-start' }}>
                    <h3 className="font-medium" style={{ color: '#22c55e', fontSize: s.descFontSize, marginBottom: '0.5rem', textShadow: '0 0 8px rgba(34,197,94,0.3)' }}>{t('assessmentIntroExtra.leesmij.wheel.heading')}</h3>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{t('assessmentIntroExtra.leesmij.wheel.p1')}</p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{t('assessmentIntroExtra.leesmij.wheel.p2')}</p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{renderCopy(t('assessmentIntroExtra.leesmij.wheel.p3'))}</p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{t('assessmentIntroExtra.leesmij.wheel.p4')}</p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{renderCopy(t('assessmentIntroExtra.leesmij.wheel.hardware'))}</p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{renderCopy(t('assessmentIntroExtra.leesmij.wheel.shadow'))}</p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{renderCopy(t('assessmentIntroExtra.leesmij.wheel.bridge'))}</p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{renderCopy(t('assessmentIntroExtra.leesmij.wheel.friction'))}</p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{renderCopy(t('assessmentIntroExtra.leesmij.wheel.learned'))}</p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{t('assessmentIntroExtra.leesmij.wheel.closing')}</p>
                  </div>
                  <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <div style={{ width: 'min(375px, 34.65vw)', height: 'min(375px, 34.65vw)', borderRadius: '50%', filter: 'drop-shadow(0 0 14px rgba(34,197,94,0.4)) drop-shadow(0 0 30px rgba(34,197,94,0.15))' }}>
                      <img src={wheelAnatomy} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg" style={{ padding: '1rem', display: 'flex', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'stretch', width: '100%' }}>
                  <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'flex-start' }}>
                    <h3 className="font-medium" style={{ color: '#f97316', fontSize: s.descFontSize, marginBottom: '0.5rem', textShadow: '0 0 8px rgba(249,115,22,0.3)' }}>{t('assessmentIntroExtra.leesmij.triangle.heading')}</h3>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{t('assessmentIntroExtra.leesmij.triangle.p1')}</p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{renderCopy(t('assessmentIntroExtra.leesmij.triangle.p2'))}</p>
                  </div>
                  <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <div style={{ width: 'min(375px, 34.65vw)', height: 'min(375px, 34.65vw)', marginTop: '-6rem', filter: 'drop-shadow(0 0 14px rgba(249,115,22,0.4)) drop-shadow(0 0 30px rgba(249,115,22,0.15))' }}>
                      <img src={triangleHardware} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg" style={{ padding: '1rem', display: 'flex', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'stretch', width: '100%' }}>
                  <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'flex-start' }}>
                    <h3 className="font-medium" style={{ color: '#22d3ee', fontSize: s.descFontSize, marginBottom: '0.5rem', textShadow: '0 0 8px rgba(34,211,238,0.3)' }}>{t('assessmentIntroExtra.leesmij.cells.heading')}</h3>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{renderCopy(t('assessmentIntroExtra.leesmij.cells.p1'))}</p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{renderCopy(t('assessmentIntroExtra.leesmij.cells.p2'))}</p>
                  </div>
                  <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 'min(375px, 34.65vw)', height: 'min(375px, 34.65vw)', marginTop: '-2rem', filter: 'drop-shadow(0 0 14px rgba(34,211,238,0.4)) drop-shadow(0 0 30px rgba(34,211,238,0.15))' }}>
                      <img src={cellsImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg" style={{ padding: '1rem' }}>
                <h3 className="font-medium" style={{ color: '#a855f7', fontSize: s.descFontSize, marginBottom: '0.5rem', textShadow: '0 0 8px rgba(168,85,247,0.3)' }}>{t('assessmentIntroExtra.leesmij.carries.heading')}</h3>
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{t('assessmentIntroExtra.leesmij.carries.p1')}</p>
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{t('assessmentIntroExtra.leesmij.carries.p2')}</p>
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{renderCopy(t('assessmentIntroExtra.leesmij.carries.p3'))}</p>
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{renderCopy(t('assessmentIntroExtra.leesmij.carries.p4'))}</p>
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>{t('assessmentIntroExtra.leesmij.carries.p5')}</p>
              </div>

            </div>

            </div>{/* /scrollable content area */}
            {/* Bottom rule */}
            <div style={{ flexShrink: 0, height: '0.75px', backgroundColor: 'rgba(168,85,247,0.45)', borderRadius: '1px', marginRight: s.padding.split(' ')[1] }} />

            {/* Back button — in bottom padded frame, outside scroll */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem', flexShrink: 0 }}>
              <SciFiButton
                onClick={closeInfo}
                variant="purple"
                size="sm"
              >
                ← {t('assessmentIntro.referencesBack')}
              </SciFiButton>
            </div>
        </div>
      </div>
      </>
    )}

    {/* ══ Referenties overlay — same animation as "Lees mij!", different content ══ */}
    {showRefs && (
      <>
      {/* Blur layer — fixed position, opacity-only animation, never transformed */}
      <div style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, calc(-50% + 1rem))', // card sits 1rem below center
        width: `min(${s.modalMaxWidth}, calc(100vw - 1.5rem))`,
        minHeight: s.modalMinHeight,
        maxHeight: s.modalMaxHeight,
        borderRadius: '0.5rem',
        backdropFilter: laptopBlur,
        WebkitBackdropFilter: laptopBlur,
        pointerEvents: 'none',
        zIndex: 49,
        opacity: refsReady ? undefined : 0,
        animation: refsReady ? `${refsClosing ? 'infoBlurOut' : 'infoBlurIn'} 0.375s ease-in-out forwards` : 'none',
      }} />
      {/* Scale wrapper */}
      <div className="relative w-full" style={{
        maxWidth: s.modalMaxWidth,
        transformOrigin: refsOrigin,
        animation: refsReady ? `${refsClosing ? 'infoContract' : 'infoExpand'} 0.375s cubic-bezier(0.4, 0, 0.2, 1) forwards` : 'none',
        transform: refsReady ? undefined : 'scale(0)',
        opacity: refsReady ? undefined : 0,
        position: 'relative',
        top: '1rem',
        zIndex: 50,
      }}>
        {/* Corner brackets */}
        <div className="absolute -top-0.5 -left-0.5 w-4 h-4 z-10" style={{ border: '1.5px solid #a855f7', borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' }}></div>
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 z-10" style={{ border: '1.5px solid #a855f7', borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' }}></div>
        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 z-10" style={{ border: '1.5px solid #a855f7', borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' }}></div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 z-10" style={{ border: '1.5px solid #a855f7', borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' }}></div>

        {/* Inner glass panel */}
        <div
          ref={refsOverlayRef}
          className="relative w-full rounded-lg"
          style={{
            backgroundColor: isLowGpu ? 'rgba(10, 3, 18, 0.9)' : 'rgba(2, 0, 3, 0.55)',
            backdropFilter: laptopBlur,
            WebkitBackdropFilter: laptopBlur,
            boxShadow: isLowGpu ? '0 6px 30px rgba(0,0,0,0.7)' : '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03)',
            overflow: 'hidden',
            minHeight: s.modalMinHeight,
            maxHeight: s.modalMaxHeight,
            display: 'flex',
            flexDirection: 'column',
            paddingTop: `calc(${s.padding.split(' ')[0]} * 2 + 1.5rem)`,
            paddingBottom: `calc(${s.padding.split(' ')[0]} * 2)`,
            paddingRight: 0,
            paddingLeft: s.padding.split(' ')[1],
            boxSizing: 'border-box',
          }}
        >
          {/* Title */}
          <h2 className="text-center font-mono uppercase tracking-wider" style={{
            flexShrink: 0,
            fontSize: `calc(${s.levelTitleFont} + 0.25rem)`,
            color: '#a855f7',
            textShadow: '0 0 10px rgba(168,85,247,0.3)',
            paddingRight: s.padding.split(' ')[1],
            paddingBottom: '0.85rem',
            margin: 0,
          }}>
            {t('assessmentIntro.referencesCardTitle')}
          </h2>
          {/* Top rule */}
          <div style={{ flexShrink: 0, height: '0.75px', backgroundColor: 'rgba(168,85,247,0.45)', borderRadius: '1px', marginRight: s.padding.split(' ')[1] }} />
          {/* Scrollable content area */}
          <div className="purple-scrollbar" style={{ flex: '1 1 0', overflowY: 'auto', overflowX: 'hidden', minHeight: 0, paddingRight: s.padding.split(' ')[1], borderRadius: 'inherit' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '0.25rem' }}>
              {/* Full Bronnen & Verantwoording panel (clusters A–K, search, filters, forms) */}
              <ReferencesPanel bodyFont={s.descFontSize} />
            </div>
          </div>
          {/* Bottom rule */}
          <div style={{ flexShrink: 0, height: '0.75px', backgroundColor: 'rgba(168,85,247,0.45)', borderRadius: '1px', marginRight: s.padding.split(' ')[1] }} />
          {/* Back button */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem', flexShrink: 0 }}>
            <SciFiButton
              onClick={closeRefs}
              variant="purple"
              size="sm"
            >
              ← {t('assessmentIntro.referencesBack')}
            </SciFiButton>
          </div>
        </div>
      </div>
      </>
    )}
    </div>
  </>
  );
};

// Memoized: App re-renders ~42×/700ms while scaling the intro card out of the entity
// (introShrinkProgress rAF loop). All props from App are stable (useCallback / state),
// so memo skips those frames and the float-out stays smooth instead of re-rendering
// this heavy component each frame.
export default React.memo(AssessmentIntro);
