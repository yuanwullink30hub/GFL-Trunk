import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * AssessmentCard - Question card matching SectorFrame styling
 * 
 * Features:
 * - SectorFrame-style background (rgba(8,2,12,0.95)) with colored corner accents
 * - 6 answer options (A-F) with skewed connectors
 * - 12 question indicators at bottom with click-to-jump
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
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const { t } = useLanguage();

  const currentQuestion = questions[currentQuestionIndex];
  const questionNumber = currentQuestionIndex + 1;
  
  // Layer colors matching GFL main page
  const layerColors = ['#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#f97316'];
  const subjectColor = currentSubject?.color || layerColors[currentSubjectIndex] || '#22c55e';

  // Check if all questions in this card have been answered
  const isAllAnswered = answeredCount >= totalQuestions;
  const currentAnswer = allAnswers[currentQuestion?.id];

  // Trigger content animation when question changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 250);
    return () => clearTimeout(timer);
  }, [currentQuestion?.id]);

  const handleAnswerClick = useCallback((answerId) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerId);
    
    setTimeout(() => {
      onSelectAnswer(currentQuestion.id, answerId);
      setSelectedAnswer(null);
    }, 200);
  }, [currentQuestion, onSelectAnswer, selectedAnswer]);

  const handleSave = () => {
    setIsCollapsed(true);
    setTimeout(() => {
      setShowScrollMode(true);
    }, 700);
    if (onComplete) onComplete();
  };

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
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Main Card - SectorFrame style */}
      <div 
        className={`
          relative rounded-lg backdrop-blur-sm overflow-hidden flex flex-col
          transition-[max-height] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
          ${isCollapsed ? 'max-h-[80px]' : 'max-h-[85vh]'}
        `}
        style={{ backgroundColor: 'rgba(8, 2, 12, 0.95)' }}
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

        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" 
             style={{ 
               backgroundImage: `linear-gradient(${subjectColor}40 1px, transparent 1px), linear-gradient(90deg, ${subjectColor}40 1px, transparent 1px)`,
               backgroundSize: '40px 40px'
             }}
        />

        {/* --- Header Section --- */}
        <header 
          className="relative shrink-0 px-5 py-3 z-10 transition-all duration-700"
          style={{ borderBottom: isCollapsed ? 'none' : `1px solid ${subjectColor}30` }}
        >
          <div className="flex items-center justify-between">
            {/* Left: Question number badge */}
            <div className={`
              flex items-center gap-3 transition-all duration-500
              ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
            `}>
              <div 
                className="w-9 h-9 flex items-center justify-center rounded font-bold text-sm"
                style={{
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
            relative z-10 flex-1 px-5 py-4 flex flex-col gap-4 overflow-y-auto
            transition-opacity duration-500 ease-in-out
            ${isCollapsed ? 'opacity-0 h-0 py-0 overflow-hidden pointer-events-none' : 'opacity-100'}
            ${isAnimating && !isCollapsed ? 'opacity-0' : ''}
          `}
          style={{ minHeight: isCollapsed ? 0 : '32rem' }}
        >
          {/* Question Text */}
          <div className="relative pl-3" style={{ minHeight: '4.5rem' }}>
            <div className="absolute left-0 top-1 bottom-1 w-[2px]" style={{ background: `linear-gradient(to bottom, ${subjectColor}, transparent)` }} />
            <p className="text-base leading-relaxed" style={{ color: '#FFFEF0', fontFamily: "'Figtree', sans-serif" }}>
              {t(`questions.${currentQuestion.id}`) !== `questions.${currentQuestion.id}` 
                ? t(`questions.${currentQuestion.id}`) 
                : currentQuestion.text}
            </p>
          </div>

          {/* Answer Options (A-F) */}
          <div className="flex flex-col gap-2">
            {currentQuestion.answers.map((answer, idx) => {
              const isSelected = selectedAnswer === answer.id || currentAnswer === answer.id;
              return (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerClick(answer.id)}
                  disabled={selectedAnswer !== null}
                  className={`
                    relative group flex items-stretch text-left transition-all duration-200 w-full
                    ${isSelected ? 'translate-x-1' : 'hover:translate-x-0.5'}
                    ${selectedAnswer !== null && selectedAnswer !== answer.id ? 'opacity-40' : ''}
                  `}
                  style={{ minHeight: '3.5rem' }}
                >
                  {/* Letter Badge */}
                  <div 
                    className="w-10 flex items-center justify-center font-bold text-sm border-y border-l rounded-l-sm transition-colors duration-300"
                    style={{
                      fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                      backgroundColor: isSelected ? subjectColor : 'rgba(8, 2, 12, 0.95)',
                      color: isSelected ? '#0f172a' : '#FFFEF0',
                      borderColor: isSelected ? subjectColor : `${subjectColor}30`,
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>

                  {/* Connector */}
                  <div 
                    className="w-3 border-y relative overflow-hidden"
                    style={{
                      borderColor: isSelected ? subjectColor : `${subjectColor}30`,
                      backgroundColor: isSelected ? `${subjectColor}15` : 'transparent'
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-[1px]" style={{ backgroundColor: isSelected ? subjectColor : `${subjectColor}20` }} />
                    </div>
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
                    <span className="text-sm" style={{ fontFamily: "'Figtree', sans-serif" }}>
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
            relative shrink-0 px-5 z-10 transition-all duration-500
            ${isCollapsed ? 'h-0 py-0 overflow-hidden opacity-0' : 'py-3'}
          `}
          style={{ borderTop: isCollapsed ? 'none' : `1px solid ${subjectColor}20` }}
        >
          {/* 12 Question Indicators - click to jump */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {questions.map((q, idx) => {
              const isActive = idx === currentQuestionIndex;
              const isAnswered = allAnswers[q.id] !== undefined;
              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpToQuestion(idx)}
                  className="relative flex-shrink-0 flex items-center justify-center w-7 h-7 transition-all duration-200"
                  style={{
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
