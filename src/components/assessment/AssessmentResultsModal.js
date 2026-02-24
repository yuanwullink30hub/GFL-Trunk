import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import SciFiRadarChart from './SciFiRadarChart';
import SubgroupCounters from './SubgroupCounters';
import {
  questions,
  ARCHETYPES,
  SUBGROUP_POLARITIES,
  getAnalysisTemplate,
  // Archetype-based scoring
  ARCHETYPE_RADAR_LABELS,
  ALL_ARCHETYPE_KEYS,
  SHADOW_PAIRS,
  ARCHETYPE_TO_GROUP,
  EXTENDED_ARCHETYPES,
  getExtendedArchetype,
  isComplementaryPair,
  getExtendedDescription,
} from '../../data/assessment';
import { getArchetypeImage } from '../../data/assessment/archetypeImages';

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
 *   resultsPoetryIndex: number,
 *   poetrySlides: Array<{ title: string, lines: string[] }>,
 *   layerAnswers: object,
 *   onClose: () => void,
 *   onDownload: () => void,
 *   onCreateAccount: () => void,
 *   t: (key: string) => string
 * }} props
 */
const AssessmentResultsModal = ({
  resultsLoadingProgress,
  resultsModalProgress,
  resultsPoetryIndex,
  poetrySlides,
  layerAnswers,
  onClose,
  onDownload,
  onCreateAccount,
  t
}) => {
  // Compute archetype result from layer answers
  const result = useMemo(() => computeResultFromAnswers(layerAnswers), [layerAnswers]);
  
  // Ref for the scroll container
  const scrollRef = useRef(null);
  
  // Ref for the PDF content area (the inner content div)
  const contentRef = useRef(null);
  
  // PDF download state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ── Responsive breakpoints (matches DesktopLayout pattern) ──
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Breakpoint-based sizing:  Desktop(≥1441) / Laptop(≥1024) / Tablet(≥768) / Mobile(<768)
  const rs = windowWidth >= 1441 ? {
    // ── Desktop ── original full-size
    poetryWidth: '24rem',
    poetryPad: '1.5rem',
    modalMaxWidth: '56rem',
    modalMaxHeight: '85vh',
    scrollPad: '1.5rem 2rem',
    profileImgSize: '25rem',
    profileTextMaxW: '40rem',
    titleFont: 'clamp(1.8rem, 4vw, 3rem)',
    radarHeight: '380px',
    sectionPad: '1.5rem',
    cardPad: '1.25rem',
    btnMinWidth: '200px',
    btnPad: '1rem 1.5rem',
    btnFont: '0.85rem',
  } : windowWidth >= 1024 ? {
    // ── Laptop ── 0.56x
    poetryWidth: '13.4rem',
    poetryPad: '0.84rem',
    modalMaxWidth: '31.4rem',
    modalMaxHeight: '85vh',
    scrollPad: '0.84rem 1.12rem',
    profileImgSize: '14rem',
    profileTextMaxW: '22.4rem',
    titleFont: '1.4rem',
    radarHeight: '213px',
    sectionPad: '0.84rem',
    cardPad: '0.7rem',
    btnMinWidth: '112px',
    btnPad: '0.56rem 0.84rem',
    btnFont: '0.6rem',
  } : windowWidth >= 768 ? {
    // ── Tablet ── 0.65x
    poetryWidth: '15.6rem',
    poetryPad: '0.975rem',
    modalMaxWidth: '36.4rem',
    modalMaxHeight: '85vh',
    scrollPad: '0.975rem 1.3rem',
    profileImgSize: '16.25rem',
    profileTextMaxW: '26rem',
    titleFont: '1.6rem',
    radarHeight: '247px',
    sectionPad: '0.975rem',
    cardPad: '0.8rem',
    btnMinWidth: '130px',
    btnPad: '0.65rem 0.975rem',
    btnFont: '0.7rem',
  } : {
    // ── Mobile ── near-full-width
    poetryWidth: '90vw',
    poetryPad: '1rem',
    modalMaxWidth: '95vw',
    modalMaxHeight: '85vh',
    scrollPad: '0.75rem 1rem',
    profileImgSize: '80vw',
    profileTextMaxW: '90vw',
    titleFont: '1.5rem',
    radarHeight: '260px',
    sectionPad: '0.75rem',
    cardPad: '0.65rem',
    btnMinWidth: '100%',
    btnPad: '0.75rem 1rem',
    btnFont: '0.8rem',
  };
  
  // Generate and download PDF from the modal content
  const handleDownloadPdf = useCallback(async () => {
    const contentEl = contentRef.current;
    const scrollEl = scrollRef.current;
    if (!contentEl || !scrollEl) return;
    
    setIsGeneratingPdf(true);
    
    try {
      // Save original scroll state
      const originalScrollTop = scrollEl.scrollTop;
      const originalMaxHeight = scrollEl.style.maxHeight;
      const originalOverflow = scrollEl.style.overflowY;
      const originalHeight = scrollEl.style.height;
      
      // Temporarily expand the scroll container to show ALL content
      scrollEl.scrollTop = 0;
      scrollEl.style.maxHeight = 'none';
      scrollEl.style.overflowY = 'visible';
      scrollEl.style.height = 'auto';
      
      // Wait for layout to settle
      await new Promise(r => setTimeout(r, 100));
      
      // Capture the content with html2canvas
      const canvas = await html2canvas(contentEl, {
        backgroundColor: '#08020c',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        // Remove border styling for PDF
        onclone: (clonedDoc) => {
          const clonedContent = clonedDoc.querySelector('[data-pdf-content]');
          if (clonedContent) {
            // Remove buttons from the clone
            const buttons = clonedContent.querySelectorAll('[data-pdf-hide]');
            buttons.forEach(btn => btn.remove());
          }
        }
      });
      
      // Restore original scroll state
      scrollEl.style.maxHeight = originalMaxHeight;
      scrollEl.style.overflowY = originalOverflow;
      scrollEl.style.height = originalHeight;
      scrollEl.scrollTop = originalScrollTop;
      
      // Calculate PDF dimensions (A4 width, variable height)
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
      
      // Create PDF - use portrait, fit content width to page
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth * 1.5 ? 'portrait' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, Math.max(pdfHeight, 297)], // At least A4 height
      });
      
      // If content is taller than one page, we need to paginate
      const pageHeight = 297; // A4 page height in mm
      const imgData = canvas.toDataURL('image/png');
      
      if (pdfHeight <= pageHeight) {
        // Single page
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        // Multi-page: slice the canvas into page-sized chunks
        const totalPages = Math.ceil(pdfHeight / pageHeight);
        const sliceHeightPx = (pageHeight / pdfHeight) * imgHeight;
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage([pdfWidth, pageHeight]);
          
          // Create a slice canvas for this page
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = imgWidth;
          sliceCanvas.height = Math.min(sliceHeightPx, imgHeight - page * sliceHeightPx);
          const sliceCtx = sliceCanvas.getContext('2d');
          
          // Fill with background color
          sliceCtx.fillStyle = '#08020c';
          sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          
          // Draw the slice
          sliceCtx.drawImage(
            canvas,
            0, page * sliceHeightPx,                        // source x, y
            imgWidth, sliceCanvas.height,                     // source w, h
            0, 0,                                             // dest x, y
            imgWidth, sliceCanvas.height                      // dest w, h
          );
          
          const sliceData = sliceCanvas.toDataURL('image/png');
          const sliceHeight = (sliceCanvas.height * pdfWidth) / imgWidth;
          pdf.addImage(sliceData, 'PNG', 0, 0, pdfWidth, sliceHeight);
        }
      }
      
      // Download
      const archetypeName = (result?.extendedName || 'Archetype').replace(/\s+/g, '_');
      pdf.save(`GardenForLife_${archetypeName}.pdf`);
    } catch (err) {
      console.error('[PDF] Generation failed:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [result]);
  
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
      className="fixed inset-0 flex items-center justify-center pointer-events-auto"
      style={{ background: 'transparent', zIndex: 9999 }}
      onWheelCapture={handleWheelCapture}
    >
      {resultsLoadingProgress < 1 ? (
        /* ─── Loading Phase: Poetry Slideshow ─── */
        <div 
          style={{
            position: 'relative',
          width: rs.poetryWidth,
            padding: rs.poetryPad,
            borderRadius: '0.5rem',
            textAlign: 'center',
            backdropFilter: 'blur(24px)',
            overflow: 'hidden',
            background: 'rgba(2, 0, 3, 0.3)',
            boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(255, 174, 0, 0.06), inset 0 0 30px rgba(255, 174, 0, 0.03)',
            transform: `translate(0, ${(1 - resultsModalProgress) * -15}vh) scale(${0.3 + resultsModalProgress * 0.7})`,
            opacity: resultsModalProgress,
            transition: resultsModalProgress >= 1 ? 'opacity 0.3s ease' : 'none',
          }}
        >
          {/* Corner decorations */}
          {renderCorners('#ffae00')}

          {/* Holographic sheen */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '0.5rem', pointerEvents: 'none', background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)', backgroundSize: '400% 400%', backgroundRepeat: 'no-repeat', animation: 'holoSheen 45s ease-in-out infinite', mixBlendMode: 'screen' }} />

          {/* Scanline sweep */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '0.5rem', pointerEvents: 'none', background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)', backgroundSize: '100% 300%', animation: 'holoScanline 14s linear infinite' }} />

          {/* Noise texture */}
          <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" style={{ borderRadius: '0.5rem' }} />

          {/* Poetry Content */}}
          <div style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '1rem' }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              marginBottom: '0.75rem',
              letterSpacing: '0.05em',
              color: '#f97316',
              fontFamily: "'Lexend Mega', sans-serif",
              opacity: 0.9
            }}>
              {poetrySlides[resultsPoetryIndex]?.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {poetrySlides[resultsPoetryIndex]?.lines.map((line, idx) => (
                <p key={idx} style={{
                  fontSize: '0.875rem',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                  color: 'rgba(255, 254, 240, 0.8)',
                  animationDelay: `${idx * 0.1}s`
                }}>
                  {line}
                </p>
              ))}
            </div>
          </div>
          
          {/* Loading Bar */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{
              height: '4px',
              borderRadius: '9999px',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                height: '100%',
                borderRadius: '9999px',
                transition: 'width 100ms',
                width: `${resultsLoadingProgress * 100}%`,
                background: 'linear-gradient(90deg, #00ff9d, #a855f7, #f97316, #00ff9d)',
                boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)'
              }} />
            </div>
          </div>
          
          {/* Loading Status */}
          <p style={{
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'rgba(255, 254, 240, 0.5)'
          }}>
            {resultsLoadingProgress < 0.3 
              ? t('results.analyzing')
              : resultsLoadingProgress < 0.6 
                ? t('results.mapping')
                : resultsLoadingProgress < 0.9
                  ? t('results.generating')
                  : t('results.finalizing')
            }
          </p>
        </div>
      ) : (
        /* ─── Full Results Modal ─── */
        <div style={{
          position: 'relative',
          opacity: resultsModalProgress,
          animation: 'resultsModalFadeIn 0.6s ease-out',
          width: '100%',
          maxWidth: rs.modalMaxWidth,
        }}>

          {/* Modal Container - holographic glass */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: rs.modalMaxWidth,
            maxHeight: rs.modalMaxHeight,
            background: 'rgba(2, 0, 3, 0.3)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(0, 255, 157, 0.3)',
            borderRadius: '0.75rem',
            boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(0, 255, 157, 0.06), inset 0 0 30px rgba(0, 255, 157, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            color: '#fff',
            overflow: 'hidden',
          }}>

            {/* SectorFrame-style corner borders */}
            {renderCorners('#00ff9d')}

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
              background: 'linear-gradient(to right, transparent, #00ff9d, transparent)',
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
                  borderBottom: '1px solid rgba(0, 255, 157, 0.2)',
                }}>
                  {/* Profile Image with Holographic Rings — responsive size */}
                  <div style={{ position: 'relative', width: rs.profileImgSize, height: rs.profileImgSize, flexShrink: 0 }}>
                    {/* Dashed spinning ring */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: '1px dashed rgba(0, 255, 157, 0.4)',
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
                      border: '2px solid #00ff9d',
                      background: '#000',
                      position: 'relative',
                    }}>
                      <img 
                        src={result.imageUrl} 
                        alt={result.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'contrast(1.25) sepia(0.2)'
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
                    {result.extendedSubtitle && (
                      <p style={{
                        fontSize: '0.9rem',
                        color: 'rgba(249, 115, 22, 0.9)',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        marginBottom: '0.5rem',
                      }}>
                        {result.extendedSubtitle}
                      </p>
                    )}
                    <p style={{
                      fontSize: '1.1rem',
                      color: 'rgba(156, 163, 175, 1)',
                      fontFamily: "'Figtree', sans-serif",
                      fontStyle: 'italic',
                    }}>
                      "{result.description}"
                    </p>
                    {result.secondaryName && (
                      <p style={{
                        fontSize: '0.85rem',
                        color: 'rgba(0, 255, 157, 0.7)',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        marginTop: '0.75rem',
                      }}>
                        {result.mainName} {result.harmonyActive ? '⟷' : '+'} {result.secondaryName}
                      </p>
                    )}
                    {result.harmonyActive && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#00ff9d',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        marginTop: '0.5rem',
                        textTransform: 'uppercase',
                      }}>
                        ✦ Harmony Bonus Active (+33) ✦
                      </p>
                    )}
                    {result.shadowBonusActive && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#f97316',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        marginTop: '0.5rem',
                        textTransform: 'uppercase',
                      }}>
                        ✦ Shadow Bonus Active (+69) ✦
                      </p>
                    )}
                  </div>
                </div>

                {/* ── 2. Combination Profile — Why Main + Support = Extended Archetype ── */}
                {result.combinationText && (
                  <div style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.08), rgba(0, 255, 157, 0.03))',
                    border: '1px solid rgba(0, 255, 157, 0.25)',
                    borderRadius: '0.75rem',
                    padding: rs.sectionPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, transparent, #00ff9d, transparent)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#00ff9d',
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
                    background: 'rgba(249, 115, 22, 0.05)',
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
                      fontSize: '0.65rem', color: 'rgba(249, 115, 22, 0.5)',
                      fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.2em',
                      textTransform: 'uppercase', marginBottom: '0.75rem',
                    }}>
                      {/* MAIN ARCHETYPE */}
                    </div>
                    <h4 style={{
                      color: '#f97316',
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
                        <span style={{ fontSize: '0.7rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Motivatie: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.mainMotivation}</span>
                      </div>
                    )}
                    {result.mainPositive && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kracht: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.mainPositive}</span>
                      </div>
                    )}
                    {result.mainShadowTrait && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Schaduw: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.7)', fontFamily: "'Figtree', sans-serif" }}>{result.mainShadowTrait}</span>
                      </div>
                    )}
                  </div>

                  {/* Support Archetype Card */}
                  <div style={{
                    background: 'rgba(168, 85, 247, 0.05)',
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
                      fontSize: '0.65rem', color: 'rgba(168, 85, 247, 0.5)',
                      fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.2em',
                      textTransform: 'uppercase', marginBottom: '0.75rem',
                    }}>
                      {/* SUPPORT ARCHETYPE */}
                    </div>
                    <h4 style={{
                      color: '#a855f7',
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
                        <span style={{ fontSize: '0.7rem', color: '#a855f7', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Motivatie: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.secondaryMotivation}</span>
                      </div>
                    )}
                    {result.secondaryPositive && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#00ff9d', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kracht: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif" }}>{result.secondaryPositive}</span>
                      </div>
                    )}
                    {result.secondaryDescription && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(156, 163, 175, 0.5)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Profiel: </span>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.7)', fontFamily: "'Figtree', sans-serif" }}>{result.secondaryDescription}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 3b. All Support Archetype Outcomes ── */}
                {result.allSupportArchetypes && (
                  <div style={{
                    width: '100%',
                    background: 'rgba(0, 255, 157, 0.05)',
                    border: '1px solid rgba(0, 255, 157, 0.15)',
                    borderRadius: '0.75rem',
                    padding: rs.cardPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, transparent, #00ff9d, transparent)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#00ff9d',
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
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.75rem',
                    }}>
                      {result.allSupportArchetypes.map((sa) => (
                        <div key={sa.group} style={{
                          background: sa.isActive ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0, 255, 157, 0.05)',
                          border: sa.isActive ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(0, 255, 157, 0.15)',
                          borderRadius: '0.5rem',
                          padding: '0.75rem',
                          textAlign: 'center',
                          transition: 'all 0.3s',
                        }}>
                          <div style={{
                            fontSize: '0.65rem',
                            color: sa.isActive ? '#a855f7' : 'rgba(0, 255, 157, 0.5)',
                            fontFamily: "'Rajdhani', sans-serif",
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '0.25rem',
                          }}>
                            {sa.group}
                          </div>
                          <div style={{
                            fontSize: '0.85rem',
                            color: sa.isActive ? '#fff' : 'rgba(0, 255, 157, 0.7)',
                            fontFamily: "'Figtree', sans-serif",
                            fontWeight: sa.isActive ? 'bold' : 'normal',
                          }}>
                            {sa.extendedName}
                          </div>
                          <div style={{
                            fontSize: '0.65rem',
                            color: sa.isActive ? 'rgba(168, 85, 247, 0.7)' : 'rgba(0, 255, 157, 0.4)',
                            fontFamily: "'Rajdhani', sans-serif",
                            fontStyle: 'italic',
                            marginTop: '0.15rem',
                          }}>
                            {sa.subtitle}
                          </div>
                          {sa.isActive && (
                            <div style={{
                              marginTop: '0.4rem',
                              fontSize: '0.55rem',
                              color: '#00ff9d',
                              fontFamily: "'Rajdhani', sans-serif",
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.15em',
                            }}>
                              ▸ JOUW RESULTAAT
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 4. Shadow Integration ── */}
                {result.shadowPartner && (
                  <div style={{
                    width: '100%',
                    background: 'rgba(249, 115, 22, 0.05)',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    borderRadius: '0.75rem',
                    padding: rs.cardPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, transparent, #f97316, transparent)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#f97316',
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
                        color: 'rgba(249, 115, 22, 0.8)',
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

                {/* ── 5. Subgroup Dynamics ── */}
                <div style={{
                  width: '100%',
                  background: 'rgba(168, 85, 247, 0.05)',
                  border: '1px solid rgba(168, 85, 247, 0.1)',
                  borderRadius: '0.75rem',
                  padding: rs.sectionPad,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Background icon decoration */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    padding: '0.5rem',
                    opacity: 0.15,
                  }}>
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <SubgroupCounters subgroups={result.subgroups} />
                </div>

                {/* ── 6. Radar Chart (full width) ── */}
                <div style={{
                  position: 'relative',
                  background: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(0, 255, 157, 0.2)',
                  padding: '0.5rem',
                  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 255, 157, 0.05)',
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
                    color: 'rgba(0, 255, 157, 0.6)',
                    letterSpacing: '0.2em',
                  }}>
                    {'/// ARCHETYPE_MATRIX'}
                  </div>
                  <div style={{ width: '100%', height: rs.radarHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SciFiRadarChart data={result.radarData} />
                  </div>
                </div>

                {/* ── 7. Analysis Section 1 (Green accent) ── */}
                {result.analysisSections[0] && (
                  <div style={{ width: '100%', position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-1rem',
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 157, 0.5), transparent)',
                    }} />
                    <h3 style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#00ff9d',
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      marginBottom: '0.75rem',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                      </svg>
                      {result.analysisSections[0].title}
                    </h3>
                    <div style={{
                      color: 'rgba(209, 213, 219, 1)',
                      fontFamily: "'Figtree', sans-serif",
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                      textAlign: 'justify',
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: rs.sectionPad,
                      borderRadius: '0 0.75rem 0.75rem 0',
                      borderRight: '1px solid rgba(0, 255, 157, 0.2)',
                      borderTop: '1px solid rgba(0, 255, 157, 0.2)',
                      borderBottom: '1px solid rgba(0, 255, 157, 0.2)',
                      boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
                    }}>
                      {result.analysisSections[0].content}
                    </div>
                  </div>
                )}

                {/* ── 8. Analysis Section 2 (Purple accent) ── */}
                {result.analysisSections[1] && (
                  <div style={{
                    background: 'rgba(168, 85, 247, 0.05)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    padding: rs.sectionPad,
                    borderRadius: '0.75rem',
                    position: 'relative',
                  }}>
                    <h3 style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#a855f7',
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      marginBottom: '1rem',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
                      </svg>
                      {result.analysisSections[1].title}
                    </h3>
                    <p style={{
                      color: 'rgba(209, 213, 219, 1)',
                      fontFamily: "'Figtree', sans-serif",
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                      textAlign: 'justify',
                    }}>
                      {result.analysisSections[1].content}
                    </p>
                    {/* Decorative dots */}
                    <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '4px' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(168, 85, 247, 0.5)', animation: 'pulse 2s infinite' }} />
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(168, 85, 247, 0.3)' }} />
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)' }} />
                    </div>
                  </div>
                )}

                {/* ── 9. Analysis Section 3 (Cyan accent) ── */}
                {result.analysisSections[2] && (
                  <div style={{ width: '100%', position: 'relative' }}>
                    <h3 style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#f97316',
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      marginBottom: '0.75rem',
                      paddingLeft: '0.5rem',
                      borderLeft: '4px solid #f97316',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z" />
                      </svg>
                      {result.analysisSections[2].title}
                    </h3>
                    <div style={{
                      color: 'rgba(209, 213, 219, 1)',
                      fontFamily: "'Figtree', sans-serif",
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                      textAlign: 'justify',
                      padding: '1rem',
                      borderTop: '1px solid rgba(249, 115, 22, 0.1)',
                      borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
                      background: 'linear-gradient(to right, transparent, rgba(249, 115, 22, 0.05), transparent)',
                    }}>
                      {result.analysisSections[2].content}
                    </div>
                  </div>
                )}

                {/* ── 6. Footer Actions ── */}
                <div style={{
                  paddingTop: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.5rem',
                }}>
                  <div data-pdf-hide style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '1rem',
                    width: '100%',
                    flexWrap: 'wrap',
                  }}>
                    {/* Download PDF */}
                    <button
                      onClick={handleDownloadPdf}
                      disabled={isGeneratingPdf}
                      style={{
                        flex: '1 1 0',
                        minWidth: rs.btnMinWidth,
                        position: 'relative',
                        overflow: 'hidden',
                        padding: rs.btnPad,
                        background: '#000',
                        border: '1px solid #00ff9d',
                        color: '#00ff9d',
                        fontFamily: "'Lexend Mega', sans-serif",
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: rs.btnFont,
                        cursor: isGeneratingPdf ? 'wait' : 'pointer',
                        transition: 'all 0.3s',
                        boxShadow: '0 0 15px rgba(0, 255, 157, 0.1)',
                        opacity: isGeneratingPdf ? 0.6 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!isGeneratingPdf) {
                          e.currentTarget.style.background = '#00ff9d';
                          e.currentTarget.style.color = '#000';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#000';
                        e.currentTarget.style.color = '#00ff9d';
                      }}
                    >
                      <span style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        {isGeneratingPdf ? (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                              <path d="M21 12a9 9 0 11-6.219-8.56" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {t('results.downloadPdf')}
                          </>
                        )}
                      </span>
                    </button>
                    
                    {/* Save & Create Account */}
                    <button
                      onClick={onCreateAccount}
                      style={{
                        flex: '1 1 0',
                        minWidth: rs.btnMinWidth,
                        position: 'relative',
                        overflow: 'hidden',
                        padding: rs.btnPad,
                        background: 'linear-gradient(to right, #a855f7, #581c87)',
                        border: '1px solid transparent',
                        color: '#fff',
                        fontFamily: "'Lexend Mega', sans-serif",
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: rs.btnFont,
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(168, 85, 247, 0.6)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <span style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                        {t('results.createAccount')}
                      </span>
                      {/* Sheen effect */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%)',
                        backgroundSize: '250% 250%',
                        animation: 'shimmerBtn 3s infinite',
                      }} />
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
          background: rgba(0, 255, 157, 0.3);
          border-radius: 3px;
        }
        .results-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 157, 0.5);
        }
        .results-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 255, 157, 0.3) transparent;
        }
      `}</style>
    </div>
  );
};

/**
 * Render SectorFrame-style corner decorations
 */
function renderCorners(color) {
  const baseStyle = {
    position: 'absolute',
    width: '1rem',
    height: '1rem',
  };
  return (
    <>
      <div style={{ ...baseStyle, top: '-1px', left: '-1px', border: `1.5px solid ${color}`, borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none' }} />
      <div style={{ ...baseStyle, top: '-1px', right: '-1px', border: `1.5px solid ${color}`, borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none' }} />
      <div style={{ ...baseStyle, bottom: '-1px', left: '-1px', border: `1.5px solid ${color}`, borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none' }} />
      <div style={{ ...baseStyle, bottom: '-1px', right: '-1px', border: `1.5px solid ${color}`, borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none' }} />
    </>
  );
}

/**
 * Compute archetype results from layer answers.
 * Uses the 12-archetype scoring engine:
 *   - Single choice: +5 pts to the selected archetype
 *   - Dual choice: Primary +3 pts, Secondary +2 pts (future)
 *   - Harmony Bonus: +69 pts to BOTH if Main & Support are complementary
 *   - Max per archetype: 150 base + 69 harmony = 219
 *   - Total max score: 369
 *
 * Accepts: { layerIndex: { questionId: answerId } }
 * e.g. { 0: { 1: "1a", 2: "2c" }, 1: { 7: "7b" }, ... }
 */
function computeResultFromAnswers(layerAnswers) {
  // ──────────────────────────────────────────────────────────
  // 1. Score each archetype: +5 points per selected answer
  //    Also track raw selection counts for radar chart
  // ──────────────────────────────────────────────────────────
  const archetypeScores = {};
  const archetypeCounts = {};
  ALL_ARCHETYPE_KEYS.forEach(key => { archetypeScores[key] = 0; archetypeCounts[key] = 0; });

  const layerScores = {}; // for subgroup bias computation
  const answerLog = [];   // full answer key (backend-only, for account-linked retrieval)

  if (layerAnswers && typeof layerAnswers === 'object') {
    Object.entries(layerAnswers).forEach(([layerIdxStr, layerData]) => {
      const layerIdx = parseInt(layerIdxStr, 10);
      if (!layerData || typeof layerData !== 'object') return;

      const layer = questions.find(q => q.layerIndex === layerIdx);
      if (!layer) return;

      if (!layerScores[layerIdx]) layerScores[layerIdx] = [];

      Object.entries(layerData).forEach(([questionIdStr, answerId]) => {
        const questionId = parseInt(questionIdStr, 10) || questionIdStr;
        const question = layer.questions.find(q => q.id === questionId);
        if (!question) return;

        const selectedAnswer = question.answers.find(a => a.id === answerId);
        if (!selectedAnswer) return;

        layerScores[layerIdx].push(selectedAnswer.value || 3);

        const archetype = selectedAnswer.archetype;
        if (archetype) {
          archetypeScores[archetype] = (archetypeScores[archetype] || 0) + 5;
          archetypeCounts[archetype] = (archetypeCounts[archetype] || 0) + 1;
        }

        // Build detailed answer log entry
        const archetypeData = ARCHETYPES[archetype] || {};
        answerLog.push({
          questionNumber: question.id,
          layerIndex: layerIdx,
          layerName: layer.name || `Layer ${layerIdx}`,
          questionText: question.text,
          answerId: selectedAnswer.id,
          answerText: selectedAnswer.text,
          answerPosition: selectedAnswer.value,       // position 1-6 within the question
          pointsAwarded: 5,
          archetype: archetype,
          archetypeName: archetypeData.nameEn || archetype,     // e.g. "The Sage"
          archetypeNameNl: archetypeData.name || archetype,     // e.g. "De Wijze"
          archetypeGroup: archetypeData.group || null,          // e.g. "Wisdom"
          archetypeSet: archetypeData.set || null,              // "A" or "B"
          archetypeDescription: archetypeData.description || null,
          archetypeMotivation: archetypeData.motivation || null,
        });
      });
    });
  }

  // Sort answer log by question number
  answerLog.sort((a, b) => a.questionNumber - b.questionNumber);

  // ──────────────────────────────────────────────────────────
  // 2. Determine Main (highest) & Support (2nd highest) archetypes
  // ──────────────────────────────────────────────────────────
  const sorted = Object.entries(archetypeScores)
    .sort((a, b) => b[1] - a[1]);
  const mainKey = sorted[0]?.[0] || 'SAGE';
  const supportKey = sorted[1]?.[0] || 'EXPLORER';

  // ──────────────────────────────────────────────────────────
  // 3. Harmony Bonus: +33 to BOTH if complementary pair (max 333)
  //    Shadow Bonus: +69 to BOTH if shadow pair (max 369)
  // ──────────────────────────────────────────────────────────
  const harmonyActive = isComplementaryPair(mainKey, supportKey);
  const shadowBonusActive = SHADOW_PAIRS[mainKey] === supportKey;
  if (harmonyActive) {
    archetypeScores[mainKey] += 33;
    archetypeScores[supportKey] += 33;
  }
  if (shadowBonusActive) {
    archetypeScores[mainKey] += 69;
    archetypeScores[supportKey] += 69;
  }

  // ──────────────────────────────────────────────────────────
  // 4. Extended Archetype Name (72-outcome matrix)
  // ──────────────────────────────────────────────────────────
  const supportGroup = ARCHETYPE_TO_GROUP[supportKey] || 'WISDOM';
  const extendedName = getExtendedArchetype(mainKey, supportKey);

  // ──────────────────────────────────────────────────────────
  // 4b. Extended Archetype portrait image + description
  // ──────────────────────────────────────────────────────────
  const archetypeImage = getArchetypeImage(mainKey, supportGroup);
  const extendedDesc = getExtendedDescription(mainKey, supportGroup);

  // ──────────────────────────────────────────────────────────
  // 5. Shadow Archetype (psychological tension point)
  // ──────────────────────────────────────────────────────────
  const shadowKey = SHADOW_PAIRS[mainKey] || null;

  const primaryArchetype = ARCHETYPES[mainKey] || ARCHETYPES.SAGE;
  const supportArchetype = ARCHETYPES[supportKey] || ARCHETYPES.EXPLORER;

  // ──────────────────────────────────────────────────────────
  // 6. Generate radar data: 12 anchors = 12 archetypes (raw counts)
  //    Each archetype appears 5 times across 60 questions, so max possible = 5
  //    But we scale the domain dynamically so the highest always reaches the edge
  // ──────────────────────────────────────────────────────────
  const maxCount = Math.max(1, ...Object.values(archetypeCounts));
  const radarData = ARCHETYPE_RADAR_LABELS.map(label => {
    const key = label.toUpperCase();
    return {
      subject: label,
      A: archetypeCounts[key] || 0,
      fullMark: maxCount,
    };
  });

  // ──────────────────────────────────────────────────────────
  // 6b. All possible support archetypes for this main archetype
  // ──────────────────────────────────────────────────────────
  const ALL_GROUPS = ['WISDOM', 'ACTION', 'RELATIONAL', 'CREATIVE', 'RULING', 'SPIRIT'];
  const allSupportArchetypes = ALL_GROUPS.map(group => {
    const extKey = `${mainKey}_${group}`;
    const extName = EXTENDED_ARCHETYPES[extKey] || mainKey;
    const desc = getExtendedDescription(mainKey, group);
    return {
      group,
      extendedName: extName,
      subtitle: desc?.subtitle || group,
      isActive: group === supportGroup,
    };
  });

  // ──────────────────────────────────────────────────────────
  // 7. Subgroup dynamics: Set A vs Set B raw point scores per group
  //    Also compute shadow & harmony bonus points per group
  // ──────────────────────────────────────────────────────────
  const subgroups = SUBGROUP_POLARITIES.map(p => {
    const leftKey = p.leftLabel.toUpperCase();   // Set A archetype
    const rightKey = p.rightLabel.toUpperCase();  // Set B archetype
    const leftRaw = archetypeCounts[leftKey] || 0;   // raw selections (0-5)
    const rightRaw = archetypeCounts[rightKey] || 0;
    const leftPts = leftRaw * 5;   // points scored
    const rightPts = rightRaw * 5;
    
    // Check if this group's pair earns shadow or harmony bonus
    const pairIsComplementary = isComplementaryPair(leftKey, rightKey);
    const pairIsShadow = SHADOW_PAIRS[leftKey] === rightKey;
    // Bonus only if BOTH archetypes in the pair are Main+Support
    const pairKeys = [leftKey, rightKey];
    const isActivePair = pairKeys.includes(mainKey) && pairKeys.includes(supportKey);
    const harmonyPts = (pairIsComplementary && isActivePair) ? 33 : 0;
    const shadowPts = (pairIsShadow && isActivePair) ? 69 : 0;
    
    return {
      ...p,
      leftScore: leftPts,
      rightScore: rightPts,
      harmonyPoints: harmonyPts,
      shadowPoints: shadowPts,
    };
  });

  // ──────────────────────────────────────────────────────────
  // 8. Analysis text templates
  // ──────────────────────────────────────────────────────────
  const analysisTemplate = getAnalysisTemplate(mainKey);
  const analysisSections = analysisTemplate
    ? analysisTemplate.sections.map(s => ({ title: s.title, content: s.content }))
    : [
        { title: 'Systeemkern Analyse', content: 'Analyse wordt berekend...' },
        { title: 'Tactische Implementatie', content: 'Implementatie wordt berekend...' },
        { title: 'Toekomsttraject & Integratie', content: 'Traject wordt berekend...' },
      ];

  // ──────────────────────────────────────────────────────────
  // 9. Compute total score
  // ──────────────────────────────────────────────────────────
  const totalScore = Object.values(archetypeScores).reduce((s, v) => s + v, 0);

  const resultObj = {
    // Extended identity
    name: extendedName,                              // e.g. "The Alchemist"
    extendedName,
    extendedSubtitle: extendedDesc?.subtitle || null,  // e.g. "Sage + Creative"
    combinationText: extendedDesc?.combination || null, // Why Main+Support create this archetype
    shadowInsight: extendedDesc?.shadow || null,         // Shadow tension for this combination
    // Main archetype
    mainArchetype: mainKey,
    mainName: primaryArchetype.name,                  // e.g. "De Wijze"
    mainNameEn: primaryArchetype.nameEn || mainKey,
    description: primaryArchetype.description,
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
    // Shadow
    shadowPartner: shadowKey,
    shadowName: shadowKey ? (ARCHETYPES[shadowKey]?.name || shadowKey) : null,
    shadowNameEn: shadowKey ? (ARCHETYPES[shadowKey]?.nameEn || shadowKey) : null,
    shadowDescription: shadowKey ? (ARCHETYPES[shadowKey]?.description || null) : null,
    // Harmony
    harmonyActive,
    shadowBonusActive,
    harmonyPairName: harmonyActive
      ? `${primaryArchetype.nameEn || mainKey} + ${supportArchetype.nameEn || supportKey}`
      : null,
    // Metadata
    group: primaryArchetype.group || null,
    supportGroup: supportGroup,
    imageUrl: archetypeImage || primaryArchetype.imageUrl || 'https://picsum.photos/seed/gfl-archetype/400/400',
    // Scores & visualization
    radarData,
    subgroups,
    allSupportArchetypes,
    analysisSections,
    totalScore,
    maxScore: shadowBonusActive ? 369 : harmonyActive ? 333 : 300,
    // Raw data for future API agent
    _archetypeScores: archetypeScores,
    _primaryKey: mainKey,
    _secondaryKey: supportKey,
    _extendedName: extendedName,
    _harmonyActive: harmonyActive,
    // Full answer log (backend-only, for account-linked retrieval)
    _answerLog: answerLog,
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
      archetypeScores: { ...archetypeScores },
      answerLog,
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
