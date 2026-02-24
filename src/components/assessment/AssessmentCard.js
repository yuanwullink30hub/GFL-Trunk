import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * AssessmentCard - Question card matching SectorFrame styling
 * 
 * Responsive tiers: Desktop (≥1441) / Laptop (≥1024) / Tablet (≥768) / Mobile (<768)
 * 
 * Features:
 * - SectorFrame-style background (rgba(8,2,12,0.95)) with colored corner accents
 * - 6 answer options (A-F) with skewed connectors
 * - Dual-choice system: pick up to 2 answers per question
 *   Choice 1 = 3 pts, Choice 2 = 2 pts to their linked archetype
 * - Click to select (1st click → "1", 2nd click on another → "2")
 * - Click selected answer to remove; if #1 removed, #2 becomes #1
 * - "1"/"2" indicator shown on the connector line between letter and text
 * - Manual "Next" button below 12 question indicators
 * - Save button when all answered → collapses to header-only with "Scroll"
 */
const AssessmentCard = ({ 
  questions,
  currentSubject,
  currentSubjectIndex,
  currentQuestionIndex,
  totalQuestions,
  answeredCount,
  onSelectAnswer,
  onGoBack,
  canGoBack,
  onNext,
  onComplete,
  onJumpTo,
  allAnswers = {}
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showScrollMode, setShowScrollMode] = useState(false);
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
    cardMaxWidth: '42rem',
    maxH: '82vh',
    headerPad: '0.75rem 1.25rem',
    badgeSize: '2.25rem',
    badgeFont: '0.875rem',
    contentMinH: '32rem',
    contentPad: '1rem 1.25rem',
    questionFont: '1rem',
    questionMinH: '4.5rem',
    answerMinH: '3.5rem',
    answerFont: '0.875rem',
    letterBadgeW: '2.5rem',
    footerPad: '0.75rem 1.25rem',
    indicatorSize: '1.75rem',
  } : windowWidth >= 1024 ? {
    // ── Laptop ── vw-based ×1.3
    cardMaxWidth: '33.9vw',
    maxH: '80vh',
    headerPad: '0.57vw 0.95vw',
    badgeSize: '1.89vw',
    badgeFont: '0.85vw',
    contentMinH: '26.4vw',
    contentPad: '0.75vw 0.95vw',
    questionFont: '1.13vw',
    questionMinH: '3.77vw',
    answerMinH: '3.02vw',
    answerFont: '0.95vw',
    letterBadgeW: '2.08vw',
    footerPad: '0.57vw 0.95vw',
    indicatorSize: '1.51vw',
  } : windowWidth >= 768 ? {
    // ── Tablet ── 0.65x
    cardMaxWidth: '27rem',
    maxH: '80vh',
    headerPad: '0.5rem 0.8rem',
    badgeSize: '1.5rem',
    badgeFont: '0.65rem',
    contentMinH: '21rem',
    contentPad: '0.65rem 0.8rem',
    questionFont: '0.8rem',
    questionMinH: '3rem',
    answerMinH: '2.3rem',
    answerFont: '0.7rem',
    letterBadgeW: '1.6rem',
    footerPad: '0.5rem 0.8rem',
    indicatorSize: '1.15rem',
  } : {
    // ── Mobile ── comfortable touch sizes
    cardMaxWidth: '95vw',
    maxH: '80vh',
    headerPad: '0.5rem 0.75rem',
    badgeSize: '1.75rem',
    badgeFont: '0.75rem',
    contentMinH: '20rem',
    contentPad: '0.6rem 0.75rem',
    questionFont: '0.9rem',
    questionMinH: '3rem',
    answerMinH: '2.5rem',
    answerFont: '0.8rem',
    letterBadgeW: '2rem',
    footerPad: '0.5rem 0.75rem',
    indicatorSize: '1.4rem',
  };

  const currentQuestion = questions[currentQuestionIndex];
  const questionNumber = currentQuestionIndex + 1;
  
  // Layer colors matching GFL main page
  const layerColors = ['#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#f97316'];
  const subjectColor = currentSubject?.color || layerColors[currentSubjectIndex] || '#22c55e';

  // Check if all questions in this card have been answered (at least 1 choice each)
  const isAllAnswered = answeredCount >= totalQuestions;
  
  // Current question's selections: always an array of 0-2 answer IDs
  const currentSelections = (() => {
    const val = allAnswers[currentQuestion?.id];
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return [val]; // legacy single-value compat
  })();

  // Trigger content animation when question changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 250);
    return () => clearTimeout(timer);
  }, [currentQuestion?.id]);

  // Dual-choice click handler
  const handleAnswerClick = useCallback((answerId) => {
    const idx = currentSelections.indexOf(answerId);
    let newSelections;
    
    if (idx !== -1) {
      // Already selected → remove it. If it was #1, #2 becomes #1 automatically.
      newSelections = currentSelections.filter(id => id !== answerId);
    } else if (currentSelections.length < 2) {
      // Not selected and room for more → add as next choice
      newSelections = [...currentSelections, answerId];
    } else {
      // Already have 2 selections — ignore
      return;
    }
    
    onSelectAnswer(currentQuestion.id, newSelections);
  }, [currentQuestion, onSelectAnswer, currentSelections]);

  const handleSave = () => {
    setIsCollapsed(true);
    setTimeout(() => {
      setShowScrollMode(true);
    }, 700);
    if (onComplete) onComplete();
  };

  // AUTO-fill all questions (DEV only) — picks 2 random answers per question
  const handleAutoFill = useCallback(() => {
    if (!questions) return;
    questions.forEach((q) => {
      const shuffled = [...q.answers].sort(() => Math.random() - 0.5);
      onSelectAnswer(q.id, [shuffled[0].id, shuffled[1].id]);
    });
  }, [questions, onSelectAnswer]);

  const handleJumpToQuestion = useCallback((idx) => {
    if (onJumpTo) onJumpTo(idx);
  }, [onJumpTo]);

  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <p style={{ color: 'rgba(255, 254, 240, 0.5)', fontFamily: "'Figtree', sans-serif" }}>{t('assessmentQuestions.loadingQuestions')}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: s.cardMaxWidth }}>
      {/* Main Card - SectorFrame style */}
      <div 
        className={`
          relative rounded-lg backdrop-blur-xl overflow-hidden flex flex-col
          transition-[max-height] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${isCollapsed ? 'max-h-[80px]' : ''}
        `}
        style={{ backgroundColor: 'rgba(2, 0, 3, 0.3)', maxHeight: isCollapsed ? '80px' : s.maxH, boxShadow: `0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px ${subjectColor}10, inset 0 0 30px ${subjectColor}08` }}
      >
        {/* Corner Accents - SectorFrame style */}
        <div className="absolute -top-0.5 -left-0.5 w-4 h-4 pointer-events-none z-20" style={{
          border: `1.5px solid ${subjectColor}`,
          borderRadius: '10px 0 0 0',
          borderBottom: 'none',
          borderRight: 'none'
        }} />
        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 pointer-events-none z-20" style={{
          border: `1.5px solid ${subjectColor}`,
          borderRadius: '0 10px 0 0',
          borderBottom: 'none',
          borderLeft: 'none'
        }} />
        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 pointer-events-none z-20" style={{
          border: `1.5px solid ${subjectColor}`,
          borderRadius: '0 0 0 10px',
          borderTop: 'none',
          borderRight: 'none'
        }} />
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 pointer-events-none z-20" style={{
          border: `1.5px solid ${subjectColor}`,
          borderRadius: '0 0 10px 0',
          borderTop: 'none',
          borderLeft: 'none'
        }} />

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

        {/* --- Header Section --- */}
        <header 
          className="relative shrink-0 z-10 transition-all duration-700"
          style={{ borderBottom: isCollapsed ? 'none' : `1px solid ${subjectColor}30`, padding: s.headerPad }}
        >
          <div className="flex items-center justify-between">
            {/* Left: Question number badge */}
            <div className={`
              flex items-center gap-3 transition-all duration-500
              ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
            `}>
              <div 
                className="flex items-center justify-center rounded font-bold"
                style={{
                  width: s.badgeSize,
                  height: s.badgeSize,
                  fontSize: s.badgeFont,
                  backgroundColor: `${subjectColor}20`,
                  color: subjectColor,
                  border: `1px solid ${subjectColor}40`,
                  fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                }}
              >
                {String(questionNumber).padStart(2, '0')}
              </div>
              <span className="text-xs" style={{ color: '#FFFEF0', opacity: 0.5, fontFamily: "'Figtree', sans-serif" }}>
                Q{questionNumber}/{totalQuestions}
              </span>
            </div>

            {/* Center/Right: Subject Group */}
            <div className={`
              flex flex-col transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
              ${isCollapsed ? 'items-center flex-1' : 'items-end'}
            `}>
              <span className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: `${subjectColor}80`, fontFamily: "'Figtree', sans-serif" }}>
                SECTION //
              </span>
              <h2 className="text-base font-bold tracking-wider" style={{ color: subjectColor, fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>
                {currentSubject?.name?.toUpperCase() || `LAYER ${currentSubjectIndex + 1}`}
              </h2>
            </div>

            {/* Scroll indicator in collapsed mode */}
            {isCollapsed && showScrollMode && (
              <div className="flex items-center gap-1" style={{ color: subjectColor }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>
                  Scroll
                </span>
                <ChevronDown className="w-4 h-4" />
              </div>
            )}
          </div>
        </header>

        {/* --- Main Content Section --- */}
        <div 
          className={`
            relative z-10 flex-1 flex flex-col gap-3 overflow-y-auto
            transition-opacity duration-500 ease-in-out
            ${isCollapsed ? 'opacity-0 h-0 py-0 overflow-hidden pointer-events-none' : 'opacity-100'}
            ${isAnimating && !isCollapsed ? 'opacity-0' : ''}
          `}
          style={{ minHeight: isCollapsed ? 0 : s.contentMinH, padding: isCollapsed ? 0 : s.contentPad }}
        >
          {/* Question Text */}
            <div className="relative pl-3" style={{ minHeight: s.questionMinH }}>
            <div className="absolute left-0 top-1 bottom-1 w-[2px]" style={{ background: `linear-gradient(to bottom, ${subjectColor}, transparent)` }} />
            <p style={{ fontSize: s.questionFont, lineHeight: 1.5, color: '#FFFEF0', fontFamily: "'Figtree', sans-serif" }}>
              {t(`questions.${currentQuestion.id}`) !== `questions.${currentQuestion.id}` 
                ? t(`questions.${currentQuestion.id}`) 
                : currentQuestion.text}
            </p>
          </div>

          {/* Answer Options (A-F) — dual-choice: up to 2 selections */}
          <div className="flex flex-col gap-2">
            {currentQuestion.answers.map((answer, idx) => {
              const selectionIdx = currentSelections.indexOf(answer.id);
              const isSelected = selectionIdx !== -1;
              const choiceNumber = selectionIdx !== -1 ? selectionIdx + 1 : null; // 1 or 2
              return (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerClick(answer.id)}
                  className={`
                    relative group flex items-stretch text-left transition-all duration-200 w-full
                    ${isSelected ? 'translate-x-1' : 'hover:translate-x-0.5'}
                    ${currentSelections.length >= 2 && !isSelected ? 'opacity-40' : ''}
                  `}
                  style={{ minHeight: s.answerMinH }}
                >
                  {/* Letter Badge */}
                  <div 
                    className="flex items-center justify-center font-bold border-y border-l rounded-l-sm transition-colors duration-300"
                    style={{
                      width: s.letterBadgeW,
                      fontSize: s.answerFont,
                      fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                      backgroundColor: isSelected ? subjectColor : 'rgba(8, 2, 12, 0.95)',
                      color: isSelected ? '#0f172a' : '#FFFEF0',
                      borderColor: isSelected ? subjectColor : `${subjectColor}30`,
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>

                  {/* Connector with choice indicator (1 or 2) */}
                  <div 
                    className="w-5 border-y relative overflow-visible"
                    style={{
                      borderColor: isSelected ? subjectColor : `${subjectColor}30`,
                      backgroundColor: isSelected ? `${subjectColor}15` : 'transparent'
                    }}
                  >
                    {/* Horizontal line */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-[1px]" style={{ backgroundColor: isSelected ? subjectColor : `${subjectColor}20` }} />
                    </div>
                    {/* Choice number indicator — on top of the line */}
                    {choiceNumber && (
                      <div 
                        className="absolute flex items-center justify-center"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: s.indicatorSize,
                          height: s.indicatorSize,
                          borderRadius: '50%',
                          backgroundColor: subjectColor,
                          color: '#0f172a',
                          fontSize: `calc(${s.answerFont} * 0.75)`,
                          fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                          fontWeight: 'bold',
                          zIndex: 5,
                          boxShadow: `0 0 6px ${subjectColor}60`,
                        }}
                      >
                        {choiceNumber}
                      </div>
                    )}
                  </div>

                  {/* Answer Text */}
                  <div 
                    className="flex-1 px-3 py-2 border-y border-r rounded-r-sm flex items-center transition-all duration-300"
                    style={{
                      backgroundColor: isSelected ? `${subjectColor}20` : 'rgba(8, 2, 12, 0.95)',
                      borderColor: isSelected ? subjectColor : `${subjectColor}30`,
                      color: isSelected ? '#FFFEF0' : 'rgba(255, 254, 240, 0.7)',
                      boxShadow: isSelected ? `0 0 12px ${subjectColor}30` : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = `${subjectColor}60`;
                        e.currentTarget.style.color = '#FFFEF0';
                        e.currentTarget.style.backgroundColor = `${subjectColor}10`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = `${subjectColor}30`;
                        e.currentTarget.style.color = 'rgba(255, 254, 240, 0.7)';
                        e.currentTarget.style.backgroundColor = 'rgba(8, 2, 12, 0.95)';
                      }
                    }}
                  >
                    <span style={{ fontSize: s.answerFont, fontFamily: "'Figtree', sans-serif" }}>
                      {t(`answers.${answer.id}`) !== `answers.${answer.id}` 
                        ? t(`answers.${answer.id}`) 
                        : answer.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- Footer --- */}
        <footer 
          className={`
            relative shrink-0 z-10 transition-all duration-500
            ${isCollapsed ? 'h-0 py-0 overflow-hidden opacity-0' : ''}
          `}
          style={{ borderTop: isCollapsed ? 'none' : `1px solid ${subjectColor}20`, padding: isCollapsed ? 0 : s.footerPad }}
        >
          {/* 12 Question Indicators - click to jump */}
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {questions.map((q, idx) => {
              const isActive = idx === currentQuestionIndex;
              const qAnswers = allAnswers[q.id];
              const isAnswered = Array.isArray(qAnswers) ? qAnswers.length > 0 : qAnswers !== undefined;
              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpToQuestion(idx)}
                  className="relative flex-shrink-0 flex items-center justify-center transition-all duration-200"
                  style={{
                    width: s.indicatorSize,
                    height: s.indicatorSize,
                    border: `1.5px solid ${isActive ? subjectColor : isAnswered ? `${subjectColor}50` : `${subjectColor}20`}`,
                    backgroundColor: isActive ? `${subjectColor}25` : isAnswered ? `${subjectColor}10` : 'rgba(8, 2, 12, 0.6)',
                    color: isActive ? '#FFFEF0' : isAnswered ? `${subjectColor}` : 'rgba(255, 254, 240, 0.35)',
                    borderRadius: '3px',
                    boxShadow: isActive ? `0 0 8px ${subjectColor}40` : 'none',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  <span className="text-[10px] font-bold" style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}>{idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Next + AUTO Buttons — manual advance (centered below indicators) */}
          {!isAllAnswered && (
            <div className="flex items-center justify-center gap-2">
              {currentQuestionIndex < totalQuestions - 1 && (
                <button
                  onClick={() => onNext && onNext()}
                  className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded transition-all duration-200"
                  style={{
                    fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                    fontSize: s.answerFont,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: `${subjectColor}15`,
                    border: `1px solid ${subjectColor}40`,
                    color: subjectColor,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${subjectColor}30`;
                    e.currentTarget.style.borderColor = subjectColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${subjectColor}15`;
                    e.currentTarget.style.borderColor = `${subjectColor}40`;
                  }}
                >
                  Next
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              {process.env.NODE_ENV !== 'production' && (
                <button
                  onClick={handleAutoFill}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 rounded transition-all duration-200"
                  style={{
                    fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                    fontSize: s.answerFont,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(250, 204, 21, 0.12)',
                    border: '1px solid rgba(250, 204, 21, 0.4)',
                    color: '#facc15',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(250, 204, 21, 0.25)';
                    e.currentTarget.style.borderColor = '#facc15';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(250, 204, 21, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(250, 204, 21, 0.4)';
                  }}
                  title="DEV: Auto-fill all questions with random answers"
                >
                  AUTO
                </button>
              )}
            </div>
          )}

          {/* Save Button - appears when all 12 answered */}
          {isAllAnswered && (
            <button
              onClick={handleSave}
              className="w-full py-2.5 rounded font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden text-sm mb-1"
              style={{
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                backgroundColor: subjectColor,
                color: '#0f172a',
                border: `2px solid ${subjectColor}`,
                boxShadow: `0 0 20px ${subjectColor}40`,
              }}
            >
              {/* Corner accents on save button */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 opacity-50" style={{ borderColor: '#0f172a' }} />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 opacity-50" style={{ borderColor: '#0f172a' }} />
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save
              </span>
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default AssessmentCard;
