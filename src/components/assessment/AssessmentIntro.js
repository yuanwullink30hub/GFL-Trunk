import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getToken } from '../../utils/apiClient';
import archetypeHeader from '../../images/Import ready/Archetype header.png';
import analyseIcon from '../../images/Import ready/analyseicon.PNG';
import shadowIcon from '../../images/Import ready/Shadowicon.png';
import scienceIcon from '../../images/Import ready/Scienceicon.png';
import aiIcon from '../../images/Import ready/AIicon.PNG';
import wheelAnatomy from '../../images/TNM wheel PNG.png';
import triangleHardware from '../../images/Deltawerken png.png';
import vulnerabilityOrder from '../../images/Nature Nurture png.png';

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
const AssessmentIntro = ({ onStart, onClose, onNavigateToData, uploadedFiles = [], onAddFile, onRemoveFile }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const infoIconRef = useRef(null);
  const modalRef = useRef(null);
  const infoOverlayRef = useRef(null);
  const [showReferences, setShowReferences] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [infoClosing, setInfoClosing] = useState(false);
  const [infoOrigin, setInfoOrigin] = useState('top right');
  // Consent gate: set when user clicks a level card
  const [consentLevelId, setConsentLevelId] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentAiPromptChecked, setConsentAiPromptChecked] = useState(false);
  const [consentClosing, setConsentClosing] = useState(false);
  const [consentOrigin, setConsentOrigin] = useState('center center');
  const consentOverlayRef = useRef(null);
  const [showUploadWarning, setShowUploadWarning] = useState(false);

  const openInfo = () => {
    if (infoIconRef.current && modalRef.current) {
      const iconRect = infoIconRef.current.getBoundingClientRect();
      const modalRect = modalRef.current.getBoundingClientRect();
      const x = iconRect.left + iconRect.width / 2 - modalRect.left;
      const y = iconRect.top + iconRect.height / 2 - modalRect.top;
      setInfoOrigin(`${x}px ${y}px`);
    }
    setShowInfo(true);
  };

  // Native wheel capture on info overlay to block PyramidView's handler
  useEffect(() => {
    const el = infoOverlayRef.current;
    if (!el) return;
    const stop = (e) => { e.stopPropagation(); };
    el.addEventListener('wheel', stop, { passive: false, capture: true });
    el.addEventListener('touchmove', stop, { passive: false, capture: true });
    return () => {
      el.removeEventListener('wheel', stop, { capture: true });
      el.removeEventListener('touchmove', stop, { capture: true });
    };
  }, [showInfo]);

  const closeInfo = () => {
    setInfoClosing(true);
    setTimeout(() => {
      setShowInfo(false);
      setInfoClosing(false);
    }, 350);
  };

  // Open consent overlay with zoom-from-card animation
  const openConsent = (levelId, e) => {
    if (e && e.currentTarget && modalRef.current) {
      const btnRect = e.currentTarget.getBoundingClientRect();
      const modalRect = modalRef.current.getBoundingClientRect();
      const x = btnRect.left + btnRect.width / 2 - modalRect.left;
      const y = btnRect.top + btnRect.height / 2 - modalRect.top;
      setConsentOrigin(`${x}px ${y}px`);
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
      const API_BASE = process.env.REACT_APP_API_URL ||
        (window.location.hostname === 'localhost' ? 'http://localhost:8080/api' : 'https://gfl-api.onrender.com/api');
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

  // Native wheel capture on consent overlay
  useEffect(() => {
    const el = consentOverlayRef.current;
    if (!el) return;
    const stop = (e) => { e.stopPropagation(); };
    el.addEventListener('wheel', stop, { passive: false, capture: true });
    el.addEventListener('touchmove', stop, { passive: false, capture: true });
    return () => {
      el.removeEventListener('wheel', stop, { capture: true });
      el.removeEventListener('touchmove', stop, { capture: true });
    };
  }, [consentLevelId]);

  // ── Responsive breakpoints (matches DesktopLayout pattern) ──
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Breakpoint-based sizing:  Desktop(≥1441) / Laptop(≥1024) / Tablet(≥768) / Mobile(<768)
  const s = windowWidth >= 1441 ? {
    // ── Desktop ── increased spacing, same fonts
    modalMaxWidth: '106.5rem',
    modalMaxHeight: '90vh',
    padding: '1.875rem',
    headerMaxWidth: '26.25rem',
    headerMb: '3rem',
    descFontSize: '0.875rem',
    descMt: '1.5rem',
    featureGap: '0.6rem',
    featureMb: '3rem',
    contentShiftUp: '-3rem',
    featurePadding: '0.75rem',
    featureIconSize: '2.75rem',
    featureIconFont: '1rem',
    featureTitleFont: '0.875rem',
    featureDescFont: '0.75rem',
    featureItemGap: '0.6rem',
    pyramidMb: '3rem',
    pyramidGap: '0.5rem',
    pyramidBaseWidth: 280, pyramidStepWidth: 56, // increased for spacing
    pyramidPadY: '0.75rem', pyramidPadX: '1.5rem',
    pyramidDotSize: '0.5rem',
    pyramidLabelFont: '0.75rem',
    pyramidDescFont: '0.625rem',
    pyramidLabelGap: '0.75rem',
    pyramidItemGap: '1rem',
    levelsMb: '2.25rem',
    levelsTitleFont: '0.875rem',
    levelsTitleMb: '1.5rem',
    levelsGap: '1rem',
    levelPadding: '1.5rem',
    levelTitleFont: '1rem',
    levelDescFont: '0.75rem',
    footerPt: '1.5rem',
    footerFont: '0.625rem',
    footerBtnPad: '0.5rem 1.5rem',
    footerBtnFont: '0.75rem',
  } : windowWidth >= 1024 ? {
    // ── Laptop ── vw-based ×1.35 × 0.75 height reduction
    modalMaxWidth: '67.2vw',
    modalMaxHeight: '70vh',
    padding: '1.05vw',
    headerMaxWidth: '17.03vw',
    headerMb: '1.05vw',
    descFontSize: '0.85vw',
    descMt: '0.63vw',
    featureGap: '0.4vw',
    featureMb: '1.05vw',
    contentShiftUp: '-2.4vw',
    featurePadding: '0.52vw',
    featureIconSize: '1.89vw',
    featureIconFont: '0.71vw',
    featureTitleFont: '0.78vw',
    featureDescFont: '0.71vw',
    featureItemGap: '0.4vw',
    pyramidMb: '1.05vw',
    pyramidGap: '0.45vw',
    pyramidBaseWidth: Math.round(windowWidth * 0.085), pyramidStepWidth: Math.round(windowWidth * 0.017),
    pyramidPadY: '0.42vw', pyramidPadX: '0.84vw',
    pyramidDotSize: '0.29vw',
    pyramidLabelFont: '0.57vw',
    pyramidDescFont: '0.57vw',
    pyramidLabelGap: '0.42vw',
    pyramidItemGap: '0.65vw',
    levelsMb: '1.05vw',
    levelsTitleFont: '0.78vw',
    levelsTitleMb: '0.84vw',
    levelsGap: '0.65vw',
    levelPadding: '0.84vw',
    levelTitleFont: '0.99vw',
    levelDescFont: '0.78vw',
    footerPt: '0.84vw',
    footerFont: '0.57vw',
    footerBtnPad: '0.42vw 0.84vw',
    footerBtnFont: '0.71vw',
  } : windowWidth >= 768 ? {
    // ── Tablet ── increased spacing, same fonts
    modalMaxWidth: '55rem',
    modalMaxHeight: '85vh',
    padding: '1.2rem',
    headerMaxWidth: '17rem',
    headerMb: '1.875rem',
    descFontSize: '0.75rem',
    descMt: '0.9rem',
    featureGap: '0.36rem',
    featureMb: '1.875rem',
    contentShiftUp: '-2rem',
    featurePadding: '0.49rem',
    featureIconSize: '1.95rem',
    featureIconFont: '0.65rem',
    featureTitleFont: '0.65rem',
    featureDescFont: '0.55rem',
    featureItemGap: '0.36rem',
    pyramidMb: '1.875rem',
    pyramidGap: '0.375rem',
    pyramidBaseWidth: 97.5, pyramidStepWidth: 19.5,
    pyramidPadY: '0.5rem', pyramidPadX: '0.975rem',
    pyramidDotSize: '0.33rem',
    pyramidLabelFont: '0.65rem',
    pyramidDescFont: '0.55rem',
    pyramidLabelGap: '0.5rem',
    pyramidItemGap: '0.6rem',
    levelsMb: '1.5rem',
    levelsTitleFont: '0.65rem',
    levelsTitleMb: '0.975rem',
    levelsGap: '0.6rem',
    levelPadding: '0.975rem',
    levelTitleFont: '0.75rem',
    levelDescFont: '0.6rem',
    footerPt: '0.975rem',
    footerFont: '0.5rem',
    footerBtnPad: '0.375rem 0.975rem',
    footerBtnFont: '0.6rem',
  } : {
    // ── Mobile ── full-width, comfortable touch sizes, proper viewport fit
    modalMaxWidth: '94vw',
    modalMaxHeight: '88vh',
    padding: '1rem 0.85rem',
    headerMaxWidth: '11rem',
    headerMb: '0.75rem',
    descFontSize: '0.72rem',
    descMt: '0.5rem',
    featureGap: '0.35rem',
    featureMb: '0.75rem',
    contentShiftUp: '-0.5rem',
    featurePadding: '0.5rem',
    featureIconSize: '1.75rem',
    featureIconFont: '0.65rem',
    featureTitleFont: '0.65rem',
    featureDescFont: '0.55rem',
    featureItemGap: '0.35rem',
    pyramidMb: '0.75rem',
    pyramidGap: '0.25rem',
    pyramidBaseWidth: 100, pyramidStepWidth: 20,
    pyramidPadY: '0.35rem', pyramidPadX: '0.75rem',
    pyramidDotSize: '0.3rem',
    pyramidLabelFont: '0.6rem',
    pyramidDescFont: '0.5rem',
    pyramidLabelGap: '0.4rem',
    pyramidItemGap: '0.5rem',
    levelsMb: '0.75rem',
    levelsTitleFont: '0.7rem',
    levelsTitleMb: '0.5rem',
    levelsGap: '0.5rem',
    levelPadding: '0.75rem',
    levelTitleFont: '0.8rem',
    levelDescFont: '0.65rem',
    footerPt: '0.5rem',
    footerFont: '0.5rem',
    footerBtnPad: '0.4rem 0.85rem',
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
      name: 'Beginner',
      descKey: 'assessmentIntro.levels.quick.description',
      description: '60 vragen - 45 min - Rapidfire: Zelf/Zonde 49s per vraag',
      questionsPerLayer: 3,
      color: '#22c55e'
    },
    {
      id: 'standard',
      nameKey: 'assessmentIntro.levels.standard.name',
      name: 'Gevorderd',
      descKey: 'assessmentIntro.levels.standard.description',
      description: '60 vragen - 50 min - Quickfire: Mysterie/Magie 30s per vraag',
      questionsPerLayer: 6,
      color: '#a855f7'
    },
    {
      id: 'deep',
      nameKey: 'assessmentIntro.levels.deep.name',
      name: 'Meester',
      descKey: 'assessmentIntro.levels.deep.description',
      description: '60 vragen - 50 min - Vuurproef: Piramide tijdsdruk in volgorde 90s/75s/60s/45/30s p.v.',
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
  `;

  return (
    <>
    <style>{infoAnimStyles}</style>
    <div className="fixed inset-0 flex items-center justify-center p-3 pointer-events-auto" style={{ backgroundColor: isMobile ? 'rgba(0,0,0,0.65)' : 'transparent', backdropFilter: isMobile ? 'blur(4px)' : 'none' }}>
      {/* Modal Content - Exact SectorFrame style from GeneralBrandPage */}
      <div 
        ref={modalRef}
        className="relative w-full rounded-lg backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(8, 2, 12, 0.95)', maxWidth: s.modalMaxWidth, maxHeight: s.modalMaxHeight, overflow: 'hidden' }}
      >
        {/* Top-Left Corner Border */}
        <div className="absolute -top-0.5 -left-0.5 w-4 h-4" style={{
          border: '1.5px solid #a855f7',
          borderRadius: '10px 0 0 0',
          borderBottom: 'none',
          borderRight: 'none'
        }}></div>
        
        {/* Top-Right Corner Border */}
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4" style={{
          border: '1.5px solid #a855f7',
          borderRadius: '0 10px 0 0',
          borderBottom: 'none',
          borderLeft: 'none'
        }}></div>
        
        {/* Bottom-Left Corner Border */}
        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4" style={{
          border: '1.5px solid #a855f7',
          borderRadius: '0 0 0 10px',
          borderTop: 'none',
          borderRight: 'none'
        }}></div>
        
        {/* Bottom-Right Corner Border */}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4" style={{
          border: '1.5px solid #a855f7',
          borderRadius: '0 0 10px 0',
          borderTop: 'none',
          borderLeft: 'none'
        }}></div>
        
        {/* Content - matches SectorFrame inner structure */}
        <div className="relative z-10 h-full w-full flex flex-col overflow-y-auto" style={{ padding: s.padding }}>

          {/* ═══ REFERENCES VIEW ═══ */}
          {showReferences ? (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Back button */}
              <button
                onClick={() => setShowReferences(false)}
                className="font-mono uppercase tracking-wider hover:scale-[1.02] transition-all duration-300"
                style={{
                  color: '#a855f7',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(168,85,247,0.4)',
                  borderRadius: '9999px',
                  padding: s.footerBtnPad,
                  fontSize: s.footerBtnFont,
                  marginBottom: '1.5rem',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#a855f7';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(168,85,247,0.19)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                ← {t('assessmentIntro.referencesBack')}
              </button>

              {/* References title */}
              <h2 className="text-center font-mono uppercase tracking-wider" style={{
                fontSize: s.levelsTitleFont,
                color: '#22c55e',
                marginBottom: '1.5rem',
                textShadow: '0 0 10px rgba(34,197,94,0.3)',
              }}>
                {t('assessmentIntro.referencesTitle')}
              </h2>

              {/* References subtitle */}
              <p className="text-center text-slate-400 leading-relaxed" style={{
                fontSize: s.descFontSize,
                marginBottom: '2rem',
              }}>
                {t('assessmentIntro.referencesSubtitle')}
              </p>

              {/* Reference categories */}
              {[
                { key: 'psychology', color: '#3b82f6', icon: '🧠' },
                { key: 'alchemy', color: '#f97316', icon: '⚗️' },
                { key: 'astrology', color: '#a855f7', icon: '✦' },
                { key: 'consciousness', color: '#ef4444', icon: '◉' },
                { key: 'biochemistry', color: '#22c55e', icon: '🧬' },
              ].map((cat) => (
                <div
                  key={cat.key}
                  className="rounded-lg border border-slate-700/50 bg-slate-900/30"
                  style={{ padding: '1rem', marginBottom: '0.75rem' }}
                >
                  <div className="flex items-start gap-3">
                    <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{cat.icon}</span>
                    <div>
                      <h3 className="font-medium" style={{
                        color: cat.color,
                        fontSize: s.featureTitleFont,
                        marginBottom: '0.35rem',
                        textShadow: `0 0 8px ${cat.color}40`,
                      }}>
                        {t(`assessmentIntro.references.${cat.key}.title`)}
                      </h3>
                      <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.featureDescFont }}>
                        {t(`assessmentIntro.references.${cat.key}.sources`)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Footer note */}
              <p className="text-center text-slate-600 italic" style={{
                fontSize: s.featureDescFont,
                marginTop: '1.5rem',
                paddingBottom: '1rem',
              }}>
                {t('assessmentIntro.referencesFooter')}
              </p>
            </div>
          ) : (
          /* ═══ MAIN INTRO VIEW ═══ */
          <>
          {/* Header */}
          <div className="text-center" style={{ marginBottom: s.headerMb }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img 
                src={archetypeHeader} 
                alt="A+ Archetype Analyse" 
                style={{ maxWidth: s.headerMaxWidth, width: '100%', display: 'block' }}
              />
              {/* Info icon — right of header image */}
              <button
                ref={infoIconRef}
                onClick={() => showInfo ? closeInfo() : openInfo()}
                className="hover:scale-110 transition-all duration-300"
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-1.5rem',
                  transform: 'translateY(-50%)',
                  width: '2.1rem',
                  height: '2.1rem',
                  borderRadius: '50%',
                  border: `1px solid ${showInfo ? '#a855f7' : 'rgba(168,85,247,0.45)'}`,
                  backgroundColor: showInfo ? 'rgba(168,85,247,0.18)' : 'rgba(168,85,247,0.06)',
                  boxShadow: showInfo ? '0 0 12px rgba(168,85,247,0.25)' : 'none',
                  color: '#a855f7',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontFamily: 'Georgia, serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#a855f7';
                  e.currentTarget.style.boxShadow = '0 0 16px rgba(168,85,247,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = showInfo ? '#a855f7' : 'rgba(168,85,247,0.45)';
                  e.currentTarget.style.boxShadow = showInfo ? '0 0 12px rgba(168,85,247,0.25)' : 'none';
                }}
                title="Info"
              >
                i
              </button>
            </div>

            <p className="mx-auto leading-relaxed" style={{ fontSize: s.descFontSize, marginTop: `calc(${s.descMt} - 1.5rem)`, whiteSpace: isMobile ? 'normal' : 'nowrap', textAlign: 'center', color: '#FFFEF0' }}>
              De meest complete en complexe onderzoekstest voor de synchronisatie van jouw essentie en intelligentie.
            </p>
          </div>

          {/* Features Grid — shifted up */}
          <div className={`grid grid-cols-1 ${windowWidth >= 768 ? 'md:grid-cols-2' : ''}`} style={{ gap: s.featureGap, marginBottom: s.featureMb, marginTop: `calc(${s.contentShiftUp} + 2rem)` }}>
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
                  <div>
                    <h3 className="font-medium text-slate-200" style={{ fontSize: s.featureTitleFont, marginBottom: '1px' }}>{t(feature.titleKey)}</h3>
                    <p className="text-slate-500" style={{ fontSize: s.featureDescFont }}>{t(feature.descKey)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Referenties button + research text + upload button row */}
          <div className={isMobile ? 'flex flex-col items-center gap-3' : 'flex items-center justify-between'} style={{ marginTop: isMobile ? '-0.5rem' : '-2.5rem', marginBottom: s.featureMb }}>
            {/* Left: Referenties button */}
            <div style={{ width: isMobile ? 'auto' : '10rem', flexShrink: 0 }}>
              {
                <button
                  onClick={() => setShowReferences(true)}
                  className="border border-green-500/40 rounded-full
                             hover:scale-[1.02] transition-all duration-300 
                             font-mono uppercase tracking-wider"
                  style={{
                    padding: s.footerBtnPad,
                    fontSize: s.footerBtnFont,
                    color: '#22c55e',
                    backgroundColor: 'transparent',
                    width: '10rem',
                    display: 'block',
                    textAlign: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#22c55e';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(34,197,94,0.19)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {t('assessmentIntro.footerButton')}
                </button>
              }
            </div>

            {/* Center: research text */}
            <p className="text-center leading-relaxed text-slate-500" style={{ fontSize: s.descFontSize, flex: isMobile ? 'none' : 1, padding: isMobile ? '0' : '0 1rem', paddingTop: isMobile ? '0' : '1.85rem', order: isMobile ? 3 : 0 }}>
              {t('assessmentIntro.footerResearch')}
            </p>

            {/* Right: Upload OCEAN button */}
            <div style={{ width: isMobile ? 'auto' : '10rem', flexShrink: 0, display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
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
                        onAddFile(file);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="border rounded-full
                               hover:scale-[1.02] transition-all duration-300 
                               font-mono uppercase tracking-wider"
                    style={{
                      padding: s.footerBtnPad,
                      fontSize: s.footerBtnFont,
                      color: '#a78bfa',
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(167,139,250,0.4)',
                      width: '10rem',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#a78bfa';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(167,139,250,0.19)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {uploadedFiles.length > 0 && onRemoveFile && (
                      <span
                        onClick={(e) => { e.stopPropagation(); onRemoveFile(0); }}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        style={{ fontSize: '0.65rem', lineHeight: 1, marginRight: '0.25rem', flexShrink: 0, cursor: 'pointer' }}
                        title="Remove file"
                      >
                        ✕
                      </span>
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {uploadedFiles.length > 0
                        ? uploadedFiles[0].name
                        : t('assessmentIntro.footerUpload')}
                    </span>
                  </button>
                  {uploadedFiles.length > 0 && (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <span
                        onClick={() => setShowUploadWarning(v => !v)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '1.25rem', height: '1.25rem', borderRadius: '50%',
                          border: '1px solid rgba(251,146,60,0.5)', color: '#fb923c',
                          fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                          flexShrink: 0, lineHeight: 1,
                        }}
                        title="Upload informatie"
                      >
                        i
                      </span>
                      {showUploadWarning && (
                        <div style={{
                          position: 'absolute', bottom: 'calc(100% + 0.5rem)', right: 0,
                          width: '18rem', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                          backgroundColor: 'rgba(15,23,42,0.97)', border: '1px solid rgba(251,146,60,0.3)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', zIndex: 50,
                          color: 'rgba(148,163,184,0.9)', fontSize: '0.7rem', lineHeight: 1.6,
                        }}>
                          <span style={{ color: '#fb923c', fontWeight: 600 }}>Let op: </span>
                          De volledige tekst van dit bestand wordt meegestuurd naar het Claude AI-model (Anthropic, VS). Als dit bestand persoonlijke informatie bevat — zoals uw naam — bereikt die informatie de servers van Anthropic. Garden For Life is niet verantwoordelijk voor persoonsgegevens die u in geüploade bestanden opneemt.
                          <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                            <span
                              onClick={() => setShowUploadWarning(false)}
                              style={{ color: '#a78bfa', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600 }}
                            >
                              Sluiten
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Pyramid Layers Visual */}
          <div style={{ marginBottom: s.pyramidMb }}>
            <h2 className="text-center text-slate-400 font-mono uppercase tracking-wider" style={{ display: 'none', fontSize: s.levelsTitleFont, marginBottom: s.levelsTitleMb }}>
              {t('assessmentIntro.layersTitle')}
            </h2>
            <div className="flex flex-col items-center relative" style={{ gap: s.pyramidGap }}>
              {/* Holographic glow backdrop */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.06) 0%, transparent 70%)',
                filter: 'blur(20px)',
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
                      boxShadow: `0 0 ${12 * glowIntensity}px ${layer.color}18, inset 0 0 ${8 * glowIntensity}px ${layer.color}08`,
                      backdropFilter: 'blur(4px)',
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
                        color: layer.color,
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

          {/* Transition text between pyramid & levels */}
          <p className="text-center text-slate-500 italic" style={{ fontSize: s.descFontSize, marginBottom: s.levelsMb }}>
            {t('assessmentIntro.pyramidToLevelsText')}<br />
            {t('assessmentIntro.pyramidToLevelsText2')}<br />
            {t('assessmentIntro.pyramidToLevelsText3')}
          </p>

          {/* Level Selection */}
          <div style={{ marginBottom: s.levelsMb }}>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`} style={{ gap: s.levelsGap }}>
              {levels.map((level) => {
                const isLocked = level.id === 'quick' || level.id === 'standard';
                return (
                  <button
                    key={level.id}
                    onClick={(e) => !isLocked && openConsent(level.id, e)}
                    className={`relative rounded-lg border transition-all duration-300 text-left group ${isLocked ? 'cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                    style={{
                      borderColor: isLocked ? 'rgba(100,116,139,0.25)' : `${level.color}40`,
                      backgroundColor: isLocked ? 'rgba(30,30,40,0.5)' : `${level.color}08`,
                      opacity: isLocked ? 0.55 : 1,
                      padding: s.levelPadding,
                    }}
                    onMouseEnter={(e) => {
                      if (!isLocked) {
                        e.currentTarget.style.borderColor = level.color;
                        e.currentTarget.style.boxShadow = `0 0 20px ${level.color}30`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLocked) {
                        e.currentTarget.style.borderColor = `${level.color}40`;
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: level.color }} />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: level.color }} />
                    
                    <div className="flex flex-col items-center gap-1.5 mb-0.5">
                      <h3 className="font-medium" style={{ color: isLocked ? '#64748b' : level.color, fontSize: s.levelTitleFont, textAlign: 'center' }}>
                        {level.name || t(level.nameKey)}
                      </h3>
                      {isLocked && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      )}
                    </div>
                    <p style={{ color: isLocked ? '#475569' : '#64748b', fontSize: s.levelDescFont, textAlign: 'center' }}>{level.description || t(level.descKey)}</p>
                  </button>
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

        {/* ═══ CONSENT OVERLAY ═══ */}
        {consentLevelId && (
          <div
            ref={consentOverlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) closeConsent(); }}
          >
            <div
              className="rounded-xl"
              style={{
                backgroundColor: 'rgba(8, 2, 12, 0.98)',
                border: '1px solid rgba(168,85,247,0.2)',
                padding: s.padding,
                transformOrigin: consentOrigin,
                animation: `${consentClosing ? 'infoContract' : 'infoExpand'} 0.375s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                overflowY: 'auto',
                overflowX: 'hidden',
                maxWidth: '42rem',
                maxHeight: '85vh',
                width: '90vw',
                boxShadow: '0 0 40px rgba(168,85,247,0.15), 0 0 80px rgba(0,0,0,0.5)',
              }}
            >
              {/* Title */}
              <h2 className="text-center font-mono uppercase tracking-wider" style={{
                fontSize: s.levelTitleFont, color: '#a855f7', marginBottom: '0.2rem',
                textShadow: '0 0 10px rgba(168,85,247,0.35)',
              }}>
                Toestemming & Transparantie
              </h2>
              <p className="text-center" style={{ color: 'rgba(148,163,184,0.5)', fontSize: s.featureDescFont, marginBottom: '1.5rem', fontStyle: 'italic' }}>
                Lees dit door voordat je begint — je hebt het recht dit te weten
              </p>

              {/* Pre-text: Wat we doen */}
              <div style={{ borderLeft: '2px solid rgba(168,85,247,0.4)', paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ color: '#c4b5fd', fontSize: s.featureTitleFont, fontWeight: 600, marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wat we doen</p>
                <p style={{ color: 'rgba(148,163,184,0.85)', fontSize: s.featureDescFont, lineHeight: 1.7, marginBottom: '0.6rem' }}>
                  Je antwoorden worden verwerkt door het AI-model <strong style={{ color: '#c4b5fd' }}>Claude van Anthropic</strong> om een persoonlijk zelfreflectierapport te genereren op basis van het Garden For Life Deltawerken Model. Dit rapport is uitsluitend bedoeld als persoonlijk zelfinzichtinstrument — <strong style={{ color: '#c4b5fd' }}>geen klinische diagnose, geen medisch oordeel</strong>.
                </p>
                <p style={{ color: 'rgba(148,163,184,0.85)', fontSize: s.featureDescFont, lineHeight: 1.7 }}>
                  Wij bewaren het volledig rapport tijdelijk op beveiligde servers in <strong style={{ color: '#c4b5fd' }}>Frankfurt</strong>, uitsluitend ten behoeve van betaevaluatie. De beheerder van Garden For Life heeft toegang via een beveiligd beheerderspaneel. Dit wordt geregistreerd in een auditlog.
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
                  Ik heb de <a href="#/algemene-voorwaarden" style={{ color: '#c4b5fd', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Algemene Voorwaarden</a> en het <a href="#/privacybeleid" style={{ color: '#c4b5fd', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Privacybeleid</a> gelezen en ga hiermee akkoord. Ik begrijp dat Garden For Life mijn e-mailadres en accountgegevens verwerkt om de dienst te leveren.
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
                  Ik geef uitdrukkelijke toestemming voor de verwerking van mijn <strong style={{ color: '#c4b5fd' }}>persoonlijkheidsprofieldata</strong> zoals bedoeld in artikel 9 van de AVG. Ik begrijp dat:
                </span>
              </label>
              <ul style={{ color: 'rgba(148,163,184,0.85)', fontSize: s.featureDescFont, lineHeight: 1.7, paddingLeft: '2.75rem', listStyle: 'none', marginBottom: '1.5rem' }}>
                {[
                  'Mijn antwoorden en het berekende scoreprofiel worden opgeslagen op beveiligde servers in Frankfurt en verwerkt door het Claude AI-model (Anthropic) voor rapportgeneratie',
                  'Het AI-model ontvangt mijn antwoorden, scores en profieldata — maar geen naam, e-mailadres of andere directe identificatoren vanuit het platform',
                  'Als ik een bestand upload (bijv. een OCEAN-rapport als PDF), wordt de volledige tekst van dat bestand meegestuurd naar Claude. Ik ben zelf verantwoordelijk voor welke informatie ik in geüploade bestanden opneem. Garden For Life is niet verantwoordelijk voor persoonsgegevens die ik daarin opneem.',
                  <>Dit profiel psychologische kenmerken bevat zoals <strong style={{ color: '#c4b5fd' }}>archetypepatronen</strong>, <strong style={{ color: '#c4b5fd' }}>gedragstendensen</strong> en <strong style={{ color: '#c4b5fd' }}>persoonlijkheidsoriëntaties</strong></>,
                  'Het volledige rapport wordt tijdelijk opgeslagen uitsluitend ten behoeve van de betaevaluatie — niet voor commerciële doeleinden',
                  'De beheerder van Garden For Life toegang heeft tot opgeslagen rapporten en assessmentdata uitsluitend ten behoeve van betaevaluatie en systeemverbetering — dit wordt bijgehouden in een beveiligd auditlog',
                  <>Alle rapportdata wordt uiterlijk op <strong style={{ color: '#fdba74' }}>27-09-2026</strong> permanent en onherroepelijk verwijderd</>,
                  'Mijn laatste assessmentsessies worden lokaal opgeslagen op mijn eigen apparaat uitsluitend voor mijn eigen raadpleging — Garden For Life heeft geen toegang tot deze lokale opslag',
                  'Ik het recht heb mijn toestemming op elk moment in te trekken via yuanwullink30@gfl.community',
                  'Intrekking betekent dat mijn volledige profieldata binnen 30 dagen wordt verwijderd',
                  'Dit rapport geen klinische diagnose is en professionele psychologische of medische begeleiding niet vervangt',
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                    <span style={{ color: '#a855f7', flexShrink: 0 }}>·</span><span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => closeConsent()}
                  className="font-mono uppercase tracking-wider transition-all duration-300"
                  style={{ background: 'none', border: '1px solid rgba(100,116,139,0.4)', color: '#64748b', borderRadius: '9999px', padding: s.footerBtnPad, fontSize: s.footerBtnFont, cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#94a3b8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(100,116,139,0.4)'; e.currentTarget.style.color = '#64748b'; }}
                >
                  Annuleren
                </button>
                <button
                  onClick={() => { if (consentChecked && consentAiPromptChecked) { const lvl = consentLevelId; closeConsent(); logConsent(lvl); onStart(lvl); } }}
                  disabled={!consentChecked || !consentAiPromptChecked}
                  className="font-mono uppercase tracking-wider transition-all duration-300"
                  style={{
                    border: `1px solid ${(consentChecked && consentAiPromptChecked) ? '#a855f7' : 'rgba(168,85,247,0.2)'}`,
                    color: (consentChecked && consentAiPromptChecked) ? '#a855f7' : 'rgba(168,85,247,0.3)',
                    backgroundColor: (consentChecked && consentAiPromptChecked) ? 'rgba(168,85,247,0.1)' : 'transparent',
                    borderRadius: '9999px', padding: s.footerBtnPad, fontSize: s.footerBtnFont,
                    cursor: (consentChecked && consentAiPromptChecked) ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={(e) => { if (consentChecked && consentAiPromptChecked) { e.currentTarget.style.boxShadow = '0 0 20px rgba(168,85,247,0.3)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Ik ga akkoord — Start
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ INFO OVERLAY ═══ */}
        {showInfo && (
          <div
            ref={infoOverlayRef}
            className="fixed z-50 rounded-lg"
            style={{
              backgroundColor: 'rgba(8, 2, 12, 0.97)',
              backdropFilter: 'blur(8px)',
              padding: s.padding,
              transformOrigin: infoOrigin,
              animation: `${infoClosing ? 'infoContract' : 'infoExpand'} 0.375s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
              overflowY: 'auto',
              overflowX: 'hidden',
              top: modalRef.current ? modalRef.current.getBoundingClientRect().top + 'px' : 0,
              left: modalRef.current ? modalRef.current.getBoundingClientRect().left + 'px' : 0,
              width: modalRef.current ? modalRef.current.getBoundingClientRect().width + 'px' : '100%',
              height: modalRef.current ? modalRef.current.getBoundingClientRect().height + 'px' : '100%',
            }}
          >
            {/* Info title */}
            <h2 className="text-center font-mono uppercase tracking-wider" style={{
              fontSize: s.levelTitleFont,
              color: '#a855f7',
              textShadow: '0 0 10px rgba(168,85,247,0.3)',
              marginBottom: '1.5rem',
            }}>
              ℹ️ Achter de Analyse: De Symetrische Synergie
            </h2>

            {/* Info content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Waarom deze test anders is */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/30" style={{ padding: '1.25rem' }}>
                <h3 className="font-medium" style={{ color: '#3b82f6', fontSize: s.descFontSize, marginBottom: '0.5rem', textShadow: '0 0 8px rgba(59,130,246,0.3)' }}>
                  Waarom deze test anders is
                </h3>
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize }}>
                  Traditionele persoonlijkheidstesten (zoals MBTI of DISC) stoppen mensen in statische hokjes. Ze meten je aangeleerde gedrag en vertellen je vervolgens: &quot;Dit is wie je bent.&quot; Wij geloven dat dit een gevaarlijke illusie is die je fixeert in verouderde overlevingspatronen. Deze assessment is gebouwd op een radicaal andere fundering: de kruising tussen neurowetenschap, kwantumbiologie en analytisch idealisme.
                </p>
              </div>

              {/* Nature vs. Culture — 50/50 layout with image */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/30" style={{ padding: '1.25rem', minHeight: '378px', display: 'flex', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1.25rem', alignItems: 'stretch', width: '100%' }}>
                  {/* Left — Text */}
                  <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', justifyContent: 'flex-start' }}>
                    <h3 className="font-medium" style={{ color: '#eab308', fontSize: s.descFontSize, marginBottom: '0.25rem', textShadow: '0 0 8px rgba(234,179,8,0.3)' }}>
                      Onze Perspectieven: Nature vs. Culture
                    </h3>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.25rem' }}>
                      We maken een meedogenloos onderscheid tussen jouw Nature (de ongedwongen, universele oerkracht van je zenuwstelsel) en jouw Culture (het &apos;kantoorpantser&apos;).
                    </p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.featureDescFont }}>
                      <span style={{ color: '#eab308', fontWeight: 600 }}>De Dashboard-Theorie:</span> We benaderen jouw aangeleerde gedrag en stress-symptomen als de metertjes op een instrumentenpaneel. Het is een interface om te overleven, niet je fundamentele realiteit.
                    </p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.featureDescFont }}>
                      <span style={{ color: '#eab308', fontWeight: 600 }}>Neuroplasticiteit:</span> Jouw overlevingsmechanismen zijn door neuroplasticiteit zó diep ingesleten dat ze als een &apos;tweede natuur&apos; voelen. Wij leggen bloot waar dit pantser jouw eigenlijke biologie uitput en waar het je versterkt.
                    </p>
                  </div>
                  {/* Right — Vulnerability Image (triangle container, gold glow) */}
                  <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      width: 'min(328px, 30.2vw)',
                      height: 'min(328px, 30.2vw)',
                      filter: 'drop-shadow(0 0 14px rgba(240,224,0,0.4)) drop-shadow(0 0 30px rgba(240,224,0,0.15))',
                    }}>
                      <img
                        src={vulnerabilityOrder}
                        alt="The Magical Order of Vulnerability — Nature vs Culture"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Het Geometrische Wiel + Anatomie — 50/50 layout */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/30" style={{ padding: '1.25rem', minHeight: '378px', display: 'flex', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1.25rem', alignItems: 'stretch', width: '100%' }}>
                  {/* Left — Text (fills remaining space) */}
                  <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', justifyContent: 'flex-start' }}>
                    <h3 className="font-medium" style={{ color: '#22c55e', fontSize: s.descFontSize, marginBottom: '0.25rem', textShadow: '0 0 8px rgba(34,197,94,0.3)' }}>
                      Het Geometrische Wiel &amp; De Anatomie
                    </h3>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.25rem' }}>
                      We hebben het wiel niet opnieuw uitgevonden, we hebben het simpelweg geüpdatet naar de tijdgeest van nu.
                      <br />
                      De geometrie van onze test is een innovatieve herstructurering van het oude oosterse zodiak-wiel, volledig verankerd in de harde, moderne biologie.
                    </p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.featureDescFont }}>
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>1. De Groene Bogen (Het Moederbord):</span> Jouw absolute fundament. Eigenschappen die fysiek op exact dezelfde biologische hardware draaien.
                    </p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.featureDescFont }}>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>2. De Blauwe Lijnen (Symbiotische Brug):</span> Fysiologische snelwegen in je brein. Gedeelde neurale hubs die extreem efficiënt werken.
                    </p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.featureDescFont }}>
                      <span style={{ color: '#a855f7', fontWeight: 600 }}>3. De Paarse Lijnen (De Paradox / 180°):</span> De ultieme integratie van absolute tegenpolen. Wie deze spanning kan dragen, ontsluit exponentiële energie.
                    </p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.featureDescFont }}>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>4. De Rode Lijnen (A-typische projectie):</span> De archetype die van nature botst met jouw neurale netwerk. Hier ontstaan mogelijk sterke projecties wanneer patronen nog niet in kaart zijn gebracht.
                    </p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.featureDescFont }}>
                      <span style={{ color: '#eab308', fontWeight: 600 }}>5. De Gele Driehoeken (CultureForce):</span> Jouw aangeleerde cognitieve synergie. De software die je hebt geschreven om te overleven; efficiënt, maar niet je ware oernatuur.
                    </p>
                  </div>
                  {/* Right — Wheel Image (circular container) */}
                  <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      width: 'min(328px, 30.2vw)',
                      height: 'min(328px, 30.2vw)',
                      borderRadius: '50%',
                      filter: 'drop-shadow(0 0 14px rgba(34,197,94,0.4)) drop-shadow(0 0 30px rgba(34,197,94,0.15))',
                    }}>
                      <img
                        src={wheelAnatomy}
                        alt="Het Geometrische Wiel — 12 Archetypen met neurale connecties"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Biologische Hardware (TNM & OCEAN) — 50/50 layout */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/30" style={{ padding: '1.25rem', minHeight: '378px', display: 'flex', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '1.25rem', alignItems: 'stretch', width: '100%' }}>
                  {/* Left — Text */}
                  <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', justifyContent: 'flex-start' }}>
                    <h3 className="font-medium" style={{ color: '#f97316', fontSize: s.descFontSize, marginBottom: '0.25rem', textShadow: '0 0 8px rgba(249,115,22,0.3)' }}>
                      Biologische Hardware (TNM &amp; OCEAN)
                    </h3>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.featureDescFont }}>
                      <span style={{ color: '#f97316', fontWeight: 600 }}>Triple Network Model (TNM):</span> De drie kernnetwerken van je brein (CEN - Centrale Executief Netwerk, DMN - Default Mode Network, Salience Network) bepalen je informatieverwerking.
                    </p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.featureDescFont }}>
                      <span style={{ color: '#f97316', fontWeight: 600 }}>CEN (Centrale Executief):</span> Actief denken, planning, focus. De piloot aan het stuur.
                    </p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.featureDescFont }}>
                      <span style={{ color: '#f97316', fontWeight: 600 }}>DMN (Standaard Modus):</span> Zelfbezorgdheid, meditatie, creatieve vaagheid. De kameel die stil staat.
                    </p>
                    <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.featureDescFont }}>
                      <span style={{ color: '#f97316', fontWeight: 600 }}>Salience Network:</span> Bedreiging-detectie, intuïtie, emotionele relevantie. De wachter.
                    </p>
                  </div>
                  {/* Right — Hardware Image (square container, orange glow) */}
                  <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      width: 'min(328px, 30.2vw)',
                      height: 'min(328px, 30.2vw)',
                      borderRadius: '0.5rem',
                      filter: 'drop-shadow(0 0 14px rgba(249,115,22,0.4)) drop-shadow(0 0 30px rgba(249,115,22,0.15))',
                    }}>
                      <img
                        src={triangleHardware}
                        alt="Biologische Hardware — Triple Network Model &amp; OCEAN"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Waarom dit je perceptie zal breken */}
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/30" style={{ padding: '1.25rem' }}>
                <h3 className="font-medium" style={{ color: '#ef4444', fontSize: s.descFontSize, marginBottom: '0.5rem', textShadow: '0 0 8px rgba(239,68,68,0.3)' }}>
                  Waarom dit je perceptie zal breken
                </h3>
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>
                  Het doel van dit rapport is niet om je een comfortabel label te geven. Het is een oefening in Mnemonic Improvisation. We herinterpreteren je data in real-time om de illusie van &apos;trouw blijven aan jezelf&apos; te doorbreken.
                </p>
                <p className="text-slate-400 leading-relaxed" style={{ fontSize: s.descFontSize, marginBottom: '0.5rem' }}>
                  Zolang je je vastklampt aan verouderde overlevingsscripts, verspil je bandbreedte. Dit assessment is ontworpen als een breekijzer om die vastgeroeste cognitieve scripts te vernietigen, zodat je ruimte kunt maken voor pure, functionele aanpassing in het hier en nu.
                </p>
                <p className="text-slate-500 italic leading-relaxed" style={{ fontSize: s.descFontSize }}>
                  Lees dit rapport niet als een oordeel, maar als de technische handleiding van je eigen zenuwstelsel.
                </p>
              </div>

            </div>

            {/* Back button — bottom center */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', paddingBottom: '0.5rem' }}>
              <button
                onClick={closeInfo}
                className="font-mono uppercase tracking-wider hover:scale-[1.02] transition-all duration-300"
                style={{
                  color: '#a855f7',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(168,85,247,0.4)',
                  borderRadius: '9999px',
                  padding: s.footerBtnPad,
                  fontSize: s.footerBtnFont,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#a855f7';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(168,85,247,0.19)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                ← {t('assessmentIntro.referencesBack')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default AssessmentIntro;

