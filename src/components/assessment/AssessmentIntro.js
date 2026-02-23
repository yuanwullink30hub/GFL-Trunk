import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import archetypeHeader from '../../images/Import ready/Archetype header.png';

/**
 * AssessmentIntro - Modal shown when entity appears
 * Explains the assessment and lets user choose difficulty level
 * 
 * Props:
 * - onStart(levelId) - called when user picks a level
 * - onClose() - called when user closes the modal
 * - onNavigateToData() - called when user clicks the research button
 */
const AssessmentIntro = ({ onStart, onClose, onNavigateToData }) => {
  const { t } = useLanguage();

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
        className="relative w-full max-h-[90vh] rounded-lg backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(8, 2, 12, 0.95)', maxWidth: '85.2rem' }}
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
        <div className="relative z-10 h-full w-full p-5 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <img 
              src={archetypeHeader} 
              alt="A+ Archetype Analyse" 
              style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}
            />

            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed mt-4">
              {t('assessmentIntro.description')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {features.map((feature) => (
              <div
                key={feature.titleKey}
                className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/30"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-200 mb-0.5">{t(feature.titleKey)}</h3>
                    <p className="text-xs text-slate-500">{t(feature.descKey)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pyramid Layers Visual */}
          <div className="mb-8">
            <h2 className="text-center text-sm text-slate-400 mb-4 font-mono uppercase tracking-wider" style={{ display: 'none' }}>
              {t('assessmentIntro.layersTitle')}
            </h2>
            <div className="flex flex-col items-center gap-1.5">
              {layers.map((layer, index) => (
                <div
                  key={layer.nameKey}
                  className="flex items-center gap-3 px-4 py-2 rounded border transition-all duration-300 hover:scale-105"
                  style={{
                    width: `${160 + index * 35}px`,
                    borderColor: `${layer.color}40`,
                    backgroundColor: `${layer.color}10`,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: layer.color, boxShadow: `0 0 8px ${layer.color}` }}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: layer.color }}>{t(`${layer.nameKey}.name`)}</span>
                    <span className="text-[10px] text-slate-500">{t(`${layer.descKey}.desc`)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Level Selection */}
          <div className="mb-6">
            <h2 className="text-center text-sm text-slate-400 mb-4 font-mono uppercase tracking-wider">
              {t('assessmentIntro.levelsTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {levels.map((level) => {
                const isLocked = level.id === 'quick' || level.id === 'standard';
                return (
                  <button
                    key={level.id}
                    onClick={() => !isLocked && onStart(level.id)}
                    className={`relative p-4 rounded-lg border transition-all duration-300 text-left group ${isLocked ? 'cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                    style={{
                      borderColor: isLocked ? 'rgba(100,116,139,0.25)' : `${level.color}40`,
                      backgroundColor: isLocked ? 'rgba(30,30,40,0.5)' : `${level.color}08`,
                      opacity: isLocked ? 0.55 : 1,
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
                    
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-medium" style={{ color: isLocked ? '#64748b' : level.color }}>
                        {t(level.nameKey)}
                      </h3>
                      {isLocked && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: isLocked ? '#475569' : '#64748b' }}>{t(level.descKey)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-slate-800">
            <p className="text-[10px] text-slate-600">
              {t('assessmentIntro.footerResearch')}
            </p>
            {onNavigateToData && (
              <button
                onClick={onNavigateToData}
                className="mt-2 px-4 py-1.5 text-xs text-cyan-400 border border-cyan-500/30 rounded-full 
                           hover:bg-cyan-500/10 hover:border-cyan-400/60 transition-all duration-300 
                           font-mono uppercase tracking-wider"
              >
                {t('assessmentIntro.footerButton')}
              </button>
            )}
            <p className="text-[10px] text-slate-700 mt-1">{t('assessmentIntro.footerUrl')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentIntro;
