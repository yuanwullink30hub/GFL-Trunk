import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import archetypeHeader from '../../images/Import ready/Archetype header.png';

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
    // ── Desktop ── original full-size
    modalMaxWidth: '85.2rem',
    modalMaxHeight: '90vh',
    padding: '1.25rem',
    headerMaxWidth: '26.25rem',
    headerMb: '2rem',
    descFontSize: '0.875rem',
    descMt: '1rem',
    featureGap: '0.75rem',
    featureMb: '2rem',
    featurePadding: '1rem',
    featureIconSize: '2rem',
    featureIconFont: '1rem',
    featureTitleFont: '0.875rem',
    featureDescFont: '0.75rem',
    featureItemGap: '0.75rem',
    pyramidMb: '2rem',
    pyramidGap: '0.375rem',
    pyramidBaseWidth: 100, pyramidStepWidth: 20, // px
    pyramidPadY: '0.5rem', pyramidPadX: '1rem',
    pyramidDotSize: '0.5rem',
    pyramidLabelFont: '0.75rem',
    pyramidDescFont: '0.625rem',
    pyramidLabelGap: '0.5rem',
    pyramidItemGap: '0.75rem',
    levelsMb: '1.5rem',
    levelsTitleFont: '0.875rem',
    levelsTitleMb: '1rem',
    levelsGap: '0.75rem',
    levelPadding: '1rem',
    levelTitleFont: '1rem',
    levelDescFont: '0.75rem',
    footerPt: '1rem',
    footerFont: '0.625rem',
    footerBtnPad: '0.375rem 1rem',
    footerBtnFont: '0.75rem',
  } : windowWidth >= 1024 ? {
    // ── Laptop ── vw-based ×1.35 × 0.75 height reduction
    modalMaxWidth: '53.85vw',
    modalMaxHeight: '60vh',
    padding: '0.78vw',
    headerMaxWidth: '17.03vw',
    headerMb: '0.71vw',
    descFontSize: '1.07vw',
    descMt: '0.43vw',
    featureGap: '0.43vw',
    featureMb: '0.71vw',
    featurePadding: '0.57vw',
    featureIconSize: '1.42vw',
    featureIconFont: '0.71vw',
    featureTitleFont: '0.92vw',
    featureDescFont: '0.78vw',
    featureItemGap: '0.43vw',
    pyramidMb: '0.71vw',
    pyramidGap: '0.21vw',
    pyramidBaseWidth: Math.round(windowWidth * 0.0567), pyramidStepWidth: Math.round(windowWidth * 0.0113),
    pyramidPadY: '0.29vw', pyramidPadX: '0.57vw',
    pyramidDotSize: '0.29vw',
    pyramidLabelFont: '0.71vw',
    pyramidDescFont: '0.57vw',
    pyramidLabelGap: '0.29vw',
    pyramidItemGap: '0.43vw',
    levelsMb: '0.71vw',
    levelsTitleFont: '0.92vw',
    levelsTitleMb: '0.57vw',
    levelsGap: '0.43vw',
    levelPadding: '0.57vw',
    levelTitleFont: '0.99vw',
    levelDescFont: '0.78vw',
    footerPt: '0.57vw',
    footerFont: '0.57vw',
    footerBtnPad: '0.29vw 0.57vw',
    footerBtnFont: '0.71vw',
  } : windowWidth >= 768 ? {
    // ── Tablet ── 0.65x of desktop
    modalMaxWidth: '55rem',
    modalMaxHeight: '85vh',
    padding: '0.8rem',
    headerMaxWidth: '17rem',
    headerMb: '1.25rem',
    descFontSize: '0.75rem',
    descMt: '0.6rem',
    featureGap: '0.5rem',
    featureMb: '1.25rem',
    featurePadding: '0.65rem',
    featureIconSize: '1.3rem',
    featureIconFont: '0.65rem',
    featureTitleFont: '0.7rem',
    featureDescFont: '0.6rem',
    featureItemGap: '0.5rem',
    pyramidMb: '1.25rem',
    pyramidGap: '0.25rem',
    pyramidBaseWidth: 65, pyramidStepWidth: 13,
    pyramidPadY: '0.33rem', pyramidPadX: '0.65rem',
    pyramidDotSize: '0.33rem',
    pyramidLabelFont: '0.55rem',
    pyramidDescFont: '0.45rem',
    pyramidLabelGap: '0.33rem',
    pyramidItemGap: '0.5rem',
    levelsMb: '1rem',
    levelsTitleFont: '0.7rem',
    levelsTitleMb: '0.65rem',
    levelsGap: '0.5rem',
    levelPadding: '0.65rem',
    levelTitleFont: '0.75rem',
    levelDescFont: '0.6rem',
    footerPt: '0.65rem',
    footerFont: '0.5rem',
    footerBtnPad: '0.25rem 0.65rem',
    footerBtnFont: '0.6rem',
  } : {
    // ── Mobile ── full-width, comfortable touch sizes
    modalMaxWidth: '95vw',
    modalMaxHeight: '85vh',
    padding: '0.75rem',
    headerMaxWidth: '14rem',
    headerMb: '1rem',
    descFontSize: '0.8rem',
    descMt: '0.5rem',
    featureGap: '0.5rem',
    featureMb: '1rem',
    featurePadding: '0.75rem',
    featureIconSize: '1.5rem',
    featureIconFont: '0.75rem',
    featureTitleFont: '0.75rem',
    featureDescFont: '0.65rem',
    featureItemGap: '0.5rem',
    pyramidMb: '1rem',
    pyramidGap: '0.25rem',
    pyramidBaseWidth: 80, pyramidStepWidth: 16,
    pyramidPadY: '0.35rem', pyramidPadX: '0.75rem',
    pyramidDotSize: '0.35rem',
    pyramidLabelFont: '0.65rem',
    pyramidDescFont: '0.5rem',
    pyramidLabelGap: '0.35rem',
    pyramidItemGap: '0.5rem',
    levelsMb: '1rem',
    levelsTitleFont: '0.75rem',
    levelsTitleMb: '0.65rem',
    levelsGap: '0.5rem',
    levelPadding: '0.75rem',
    levelTitleFont: '0.85rem',
    levelDescFont: '0.7rem',
    footerPt: '0.65rem',
    footerFont: '0.55rem',
    footerBtnPad: '0.3rem 0.75rem',
    footerBtnFont: '0.65rem',
  };

  const features = [
    { 
      icon: '🧠', 
      titleKey: 'assessmentIntro.features.layerAnalysis.title',
      descKey: 'assessmentIntro.features.layerAnalysis.description',
      color: "#22d3ee" 
    },
    { 
      icon: '👁️', 
      titleKey: 'assessmentIntro.features.shadowIntegration.title',
      descKey: 'assessmentIntro.features.shadowIntegration.description',
      color: "#a855f7" 
    },
    { 
      icon: '💜', 
      titleKey: 'assessmentIntro.features.researchBacked.title',
      descKey: 'assessmentIntro.features.researchBacked.description',
      color: "#f472b6" 
    },
    { 
      icon: '✨', 
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

            <p className="text-slate-400 max-w-xl mx-auto leading-relaxed" style={{ fontSize: s.descFontSize, marginTop: s.descMt }}>
              {t('assessmentIntro.description')}
            </p>
          </div>

          {/* Features Grid */}
          <div className={`grid grid-cols-1 ${windowWidth >= 768 ? 'md:grid-cols-2' : ''}`} style={{ gap: s.featureGap, marginBottom: s.featureMb }}>
            {features.map((feature) => (
              <div
                key={feature.titleKey}
                className="rounded-lg border border-slate-700/50 bg-slate-900/30"
                style={{ padding: s.featurePadding }}
              >
                <div className="flex items-start" style={{ gap: s.featureItemGap }}>
                  <div
                    className="rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${feature.color}20`, width: s.featureIconSize, height: s.featureIconSize, fontSize: s.featureIconFont }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-200" style={{ fontSize: s.featureTitleFont, marginBottom: '1px' }}>{t(feature.titleKey)}</h3>
                    <p className="text-slate-500" style={{ fontSize: s.featureDescFont }}>{t(feature.descKey)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pyramid Layers Visual */}
          <div style={{ marginBottom: s.pyramidMb }}>
            <h2 className="text-center text-slate-400 font-mono uppercase tracking-wider" style={{ display: 'none', fontSize: s.levelsTitleFont, marginBottom: s.levelsTitleMb }}>
              {t('assessmentIntro.layersTitle')}
            </h2>
            <div className="flex flex-col items-center" style={{ gap: s.pyramidGap }}>
              {layers.map((layer, index) => (
                <div
                  key={layer.nameKey}
                  className="flex items-center rounded border transition-all duration-300 hover:scale-105"
                  style={{
                    width: `${s.pyramidBaseWidth + index * s.pyramidStepWidth}px`,
                    borderColor: `${layer.color}40`,
                    backgroundColor: `${layer.color}10`,
                    padding: `${s.pyramidPadY} ${s.pyramidPadX}`,
                    gap: s.pyramidItemGap,
                  }}
                >
                  <div
                    className="rounded-full flex-shrink-0"
                    style={{ backgroundColor: layer.color, boxShadow: `0 0 8px ${layer.color}`, width: s.pyramidDotSize, height: s.pyramidDotSize }}
                  />
                  <div className="flex items-center" style={{ gap: s.pyramidLabelGap }}>
                    <span className="font-medium" style={{ color: layer.color, fontSize: s.pyramidLabelFont }}>{t(`${layer.nameKey}.name`)}</span>
                    <span className="text-slate-500" style={{ fontSize: s.pyramidDescFont }}>{t(`${layer.descKey}.desc`)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Level Selection */}
          <div style={{ marginBottom: s.levelsMb }}>
            <h2 className="text-center text-slate-400 font-mono uppercase tracking-wider" style={{ fontSize: s.levelsTitleFont, marginBottom: s.levelsTitleMb }}>
              {t('assessmentIntro.levelsTitle')}
            </h2>
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
          <div className="text-center border-t border-slate-800" style={{ paddingTop: s.footerPt }}>
            <p className="text-slate-600" style={{ fontSize: s.footerFont }}>
              {t('assessmentIntro.footerResearch')}
            </p>
            {onNavigateToData && (
              <button
                onClick={onNavigateToData}
                className="mt-1 text-cyan-400 border border-cyan-500/30 rounded-full 
                           hover:bg-cyan-500/10 hover:border-cyan-400/60 transition-all duration-300 
                           font-mono uppercase tracking-wider"
                style={{ padding: s.footerBtnPad, fontSize: s.footerBtnFont }}
              >
                {t('assessmentIntro.footerButton')}
              </button>
            )}
            <p className="text-slate-700 mt-0.5" style={{ fontSize: s.footerFont }}>{t('assessmentIntro.footerUrl')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentIntro;
