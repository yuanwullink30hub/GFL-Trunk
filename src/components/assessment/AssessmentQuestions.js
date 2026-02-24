import React, { useState, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * AssessmentQuestions - Panel showing assessment questions
 * Displays one question at a time with answer options
 */
const AssessmentQuestions = ({ 
  questions,
  currentSubject,
  currentSubjectIndex,
  currentQuestionIndex,
  totalQuestions,
  answeredCount,
  onSelectAnswer,
  onGoBack,
  canGoBack,
  onComplete,
  isLastQuestion
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const { t } = useLanguage();

  const currentQuestion = questions[currentQuestionIndex];
  const questionNumber = currentQuestionIndex + 1 + (currentSubjectIndex * 6);
  
  // Updated layer colors: Foundation=green, Emotional=blue, Mental=purple, Spiritual=red, Unity=orange
  const layerColors = ['#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#f97316'];
  const subjectColor = currentSubject?.color || layerColors[currentSubjectIndex] || '#22c55e';

  const handleAnswerClick = useCallback((answerId) => {
    setSelectedAnswer(answerId);
    
    // Small delay for visual feedback then proceed
    setTimeout(() => {
      onSelectAnswer(currentQuestion.id, answerId);
      setSelectedAnswer(null);
    }, 200);
  }, [currentQuestion, onSelectAnswer]);

  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <p className="text-slate-400">{t('assessmentQuestions.loadingQuestions')}</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full mx-auto rounded-lg backdrop-blur-xl animate-fadeIn overflow-hidden"
      style={{ backgroundColor: 'rgba(2, 0, 3, 0.3)', maxWidth: '61rem', boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(255, 174, 0, 0.06), inset 0 0 30px rgba(255, 174, 0, 0.03)' }}
    >
      {/* Top-Left Corner Border */}
      <div className="absolute -top-0.5 -left-0.5 w-4 h-4" style={{
        border: '1.5px solid #ffae00',
        borderRadius: '10px 0 0 0',
        borderBottom: 'none',
        borderRight: 'none'
      }}></div>
      
      {/* Top-Right Corner Border */}
      <div className="absolute -top-0.5 -right-0.5 w-4 h-4" style={{
        border: '1.5px solid #ffae00',
        borderRadius: '0 10px 0 0',
        borderBottom: 'none',
        borderLeft: 'none'
      }}></div>
      
      {/* Bottom-Left Corner Border */}
      <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4" style={{
        border: '1.5px solid #ffae00',
        borderRadius: '0 0 0 10px',
        borderTop: 'none',
        borderRight: 'none'
      }}></div>
      
      {/* Bottom-Right Corner Border */}
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4" style={{
        border: '1.5px solid #ffae00',
        borderRadius: '0 0 10px 0',
        borderTop: 'none',
        borderLeft: 'none'
      }}></div>
      
      {/* Holographic sheen */}
      <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
        background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)',
        backgroundSize: '400% 400%',
        backgroundRepeat: 'no-repeat',
        animation: 'holoSheen 45s ease-in-out infinite',
        mixBlendMode: 'screen',
      }} />

      {/* Scanline sweep */}
      <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)',
        backgroundSize: '100% 300%',
        animation: 'holoScanline 14s linear infinite',
      }} />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 rounded-lg pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

      {/* Content - matches SectorFrame inner structure */}
      <div className="relative z-10 h-full w-full p-5 flex flex-col">
      {/* Progress Header */
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Subject Badge */}
            <div
              className="px-3 py-1 rounded text-xs font-mono uppercase tracking-wider"
              style={{
                backgroundColor: `${subjectColor}20`,
                color: subjectColor,
                border: `1px solid ${subjectColor}40`,
              }}
            >
              {currentSubject?.name || `Layer ${currentSubjectIndex + 1}`}
            </div>
            
            {/* Question Counter */}
            <span className="text-slate-500 text-xs font-mono">
              Q{questionNumber}/{totalQuestions}
            </span>
          </div>
          
          {/* Back Button */}
          {canGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              BACK
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${(answeredCount / totalQuestions) * 100}%`,
              background: `linear-gradient(90deg, #22c55e, ${subjectColor})`
            }}
          />
        </div>
      </div>

      {/* Question Text */}
      <h2 className="text-xl md:text-2xl font-light leading-relaxed text-white mb-6">
        {t(`questions.${currentQuestion.id}`) !== `questions.${currentQuestion.id}` 
          ? t(`questions.${currentQuestion.id}`) 
          : currentQuestion.text}
      </h2>

      {/* Answer Options */}
      <div className="space-y-3">
        {currentQuestion.answers.map((answer, index) => (
          <button
            key={answer.id}
            onClick={() => handleAnswerClick(answer.id)}
            disabled={selectedAnswer !== null}
            className={`
              w-full text-left p-4 md:p-5 rounded-lg border transition-all duration-300 
              group relative overflow-hidden
              ${selectedAnswer === answer.id ? 'scale-[0.98]' : 'hover:scale-[1.02]'}
              ${selectedAnswer !== null && selectedAnswer !== answer.id ? 'opacity-50' : ''}
            `}
            style={{
              backgroundColor: selectedAnswer === answer.id ? `${subjectColor}20` : "rgba(15, 7, 22, 0.8)",
              borderColor: selectedAnswer === answer.id ? subjectColor : `${subjectColor}30`,
              boxShadow: selectedAnswer === answer.id ? `0 0 20px ${subjectColor}30` : 'none'
            }}
          >
            {/* Corner Accents */}
            <div
              className="absolute top-0 left-0 w-2 h-2 border-t border-l opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ borderColor: subjectColor }}
            />
            <div
              className="absolute bottom-0 right-0 w-2 h-2 border-b border-r opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ borderColor: subjectColor }}
            />

            <div className="relative z-10 flex items-start gap-4">
              {/* Letter Badge */}
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono"
                style={{
                  backgroundColor: `${subjectColor}20`,
                  color: subjectColor,
                  border: `1px solid ${subjectColor}40`,
                }}
              >
                {String.fromCharCode(65 + index)}
              </span>
              
              {/* Answer Text */}
              <span className="text-sm md:text-base leading-relaxed text-slate-200 group-hover:text-white transition-colors">
                {t(`answers.${answer.id}`) !== `answers.${answer.id}` 
                  ? t(`answers.${answer.id}`) 
                  : answer.text}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Domain Tag */}
      <div className="mt-6 flex justify-center">
        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-600 font-mono">
          {t('assessmentQuestions.domain')}: {t(`domains.${currentQuestion.domain}`) !== `domains.${currentQuestion.domain}` 
            ? t(`domains.${currentQuestion.domain}`) 
            : currentQuestion.domain}
        </span>
      </div>

      {/* Subject Progress Indicator */}
      <div className="mt-8 flex justify-center gap-2">
        {[0, 1, 2, 3, 4].map((layerIdx) => (
          <div
            key={layerIdx}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              layerIdx < currentSubjectIndex 
                ? 'opacity-100' 
                : layerIdx === currentSubjectIndex 
                  ? 'opacity-100 animate-pulse' 
                  : 'opacity-30'
            }`}
            style={{
              backgroundColor: layerColors[layerIdx],
              boxShadow: layerIdx === currentSubjectIndex ? `0 0 10px ${layerColors[layerIdx]}` : 'none'
            }}
          />
        ))}
      </div>
      </div>
    </div>
  );
};

export default AssessmentQuestions;
