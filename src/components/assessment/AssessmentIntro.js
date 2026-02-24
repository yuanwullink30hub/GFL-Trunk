import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import archetypeHeader from '../../images/Import ready/Archetype header.png';
import analyseIcon from '../../images/Import ready/analyseicon.PNG';
import shadowIcon from '../../images/Import ready/Shadowicon.png';
import scienceIcon from '../../images/Import ready/Scienceicon.png';
import aiIcon from '../../images/Import ready/AIicon.PNG';

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
const AssessmentIntro = ({ onStart, onClose, onNavigateToData }) => {
  const { t } = useLanguage();

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
    // ── Mobile ── full-width, comfortable touch sizes
    modalMaxWidth: '95vw',
    modalMaxHeight: '85vh',
    padding: '1.125rem',
    headerMaxWidth: '14rem',
    headerMb: '1.5rem',
    descFontSize: '0.8rem',
    descMt: '0.75rem',
    featureGap: '0.36rem',
    featureMb: '1.5rem',
    contentShiftUp: '-1.5rem',
    featurePadding: '0.675rem',
    featureIconSize: '2.25rem',
    featureIconFont: '0.75rem',
    featureTitleFont: '0.7rem',
    featureDescFont: '0.6rem',
    featureItemGap: '0.36rem',
    pyramidMb: '1.5rem',
    pyramidGap: '0.375rem',
    pyramidBaseWidth: 120, pyramidStepWidth: 24,
    pyramidPadY: '0.525rem', pyramidPadX: '1.125rem',
    pyramidDotSize: '0.35rem',
    pyramidLabelFont: '0.65rem',
    pyramidDescFont: '0.5rem',
    pyramidLabelGap: '0.525rem',
    pyramidItemGap: '0.6rem',
    levelsMb: '1.5rem',
    levelsTitleFont: '0.75rem',
    levelsTitleMb: '0.975rem',
    levelsGap: '0.6rem',
    levelPadding: '1.125rem',
    levelTitleFont: '0.85rem',
    levelDescFont: '0.7rem',
    footerPt: '0.975rem',
    footerFont: '0.55rem',
    footerBtnPad: '0.45rem 1.125rem',
    footerBtnFont: '0.65rem',
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

  // Updated layer colors: Foundation=green, Emotional=blue, Mental=purple, Spiritual=red, Unity=orange
  const layers = [
    { nameKey: "assessmentIntro.layers.unity", color: "#f97316", descKey: "assessmentIntro.layers.unity" },
    { nameKey: "assessmentIntro.layers.spiritual", color: "#ef4444", descKey: "assessmentIntro.layers.spiritual" },
    { nameKey: "assessmentIntro.layers.mental", color: "#a855f7", descKey: "assessmentIntro.layers.mental" },
    { nameKey: "assessmentIntro.layers.emotional", color: "#3b82f6", descKey: "assessmentIntro.layers.emotional" },
    { nameKey: "assessmentIntro.layers.foundation", color: "#22c55e", descKey: "assessmentIntro.layers.foundation" },
  ];

  return (
    <div className="flex items-center justify-center p-4 pointer-events-auto">
      {/* Modal Content - Exact SectorFrame style from GeneralBrandPage */}
      <div 
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
          {/* Header */}
          <div className="text-center" style={{ marginBottom: s.headerMb }}>
            <img 
              src={archetypeHeader} 
              alt="A+ Archetype Analyse" 
              style={{ maxWidth: s.headerMaxWidth, width: '100%', margin: '0 auto' }}
            />

            <p className="mx-auto leading-relaxed" style={{ fontSize: s.descFontSize, marginTop: `calc(${s.descMt} - 1.5rem)`, whiteSpace: 'nowrap', color: '#FFFEF0' }}>
              {t('assessmentIntro.description')}
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

          {/* Referenties button + research text row */}
          <div className="relative" style={{ marginTop: '-3.5rem', marginBottom: s.featureMb }}>
            {onNavigateToData && (
              <button
                onClick={onNavigateToData}
                className="absolute left-0 top-1/2 -translate-y-1/2 border border-green-500/40 rounded-full flex-shrink-0
                           hover:scale-[1.02] transition-all duration-300 
                           font-mono uppercase tracking-wider"
                style={{ padding: s.footerBtnPad, fontSize: s.footerBtnFont, color: '#22c55e', backgroundColor: 'transparent' }}
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
            )}
            <p className="text-center leading-relaxed text-slate-500" style={{ fontSize: s.descFontSize, paddingTop: '1.85rem' }}>
              {t('assessmentIntro.footerResearch')}
            </p>
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
            <div className={`grid grid-cols-1 ${windowWidth >= 768 ? 'md:grid-cols-3' : ''}`} style={{ gap: s.levelsGap }}>
              {levels.map((level) => {
                const isLocked = level.id === 'quick' || level.id === 'standard';
                return (
                  <button
                    key={level.id}
                    onClick={() => !isLocked && onStart(level.id)}
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
                    
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-medium" style={{ color: isLocked ? '#64748b' : level.color, fontSize: s.levelTitleFont }}>
                        {t(level.nameKey)}
                      </h3>
                      {isLocked && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      )}
                    </div>
                    <p style={{ color: isLocked ? '#475569' : '#64748b', fontSize: s.levelDescFont }}>{t(level.descKey)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-800" style={{ paddingTop: s.footerPt }}>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentIntro;
