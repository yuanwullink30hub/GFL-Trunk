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
import { getCoreProfile, getExtendedOcean, OCEAN_LABELS, OCEAN_COLORS } from '../../data/assessment/oceanProfiles';
import { getToken, saveAssessment } from '../../utils/apiClient';

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

  // ── Auto-save to backend when user is logged in ──
  const [savedToBackend, setSavedToBackend] = useState(false);
  useEffect(() => {
    if (!result || savedToBackend || !getToken()) return;
    const oceanScores = result.extendedOcean?.ocean || null;
    saveAssessment({
      archetypeKey: result.mainArchetype,
      supportGroup: result.supportGroup,
      extendedArchetypeName: result.extendedName,
      oceanScores,
      responses: result._answerLog || [],
      subjectResults: result.subjectResults || [],
      harmonyScore: result.harmonyScore ?? null,
      consciousnessLevel: result.consciousnessLevel || null,
      overallShadow: result.overallShadow || null,
    }).then(() => {
      setSavedToBackend(true);
      console.log('[GFL] Assessment saved to account');
    }).catch((err) => {
      console.warn('[GFL] Could not save assessment:', err.message);
    });
  }, [result, savedToBackend]);

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
  
  // ── Ref for the radar chart element (captured as image for PDF) ──
  const radarRef = useRef(null);
  // ── Ref for the subgroup dynamics element ──
  const subgroupRef = useRef(null);

  // Generate and download a clean, document-style PDF
  const handleDownloadPdf = useCallback(async () => {
    if (!result) return;
    setIsGeneratingPdf(true);

    try {
      // ── PDF Setup ──
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, H = 297;
      const margin = 18;
      const contentW = W - margin * 2;
      let y = margin;

      // Colors (only used for accents, not background)
      const orange = [249, 115, 22];
      const purple = [168, 85, 247];
      const green = [0, 180, 110];
      const red = [220, 60, 60];
      const black = [30, 30, 30];
      const gray = [100, 100, 100];
      const lightGray = [180, 180, 180];

      // ── Helper: add page if needed ──
      const ensureSpace = (needed) => {
        if (y + needed > H - margin) {
          pdf.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // ── Helper: wrapped text that returns lines used ──
      const writeWrapped = (text, x, startY, maxW, fontSize, color, style = 'normal') => {
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', style);
        const lines = pdf.splitTextToSize(text, maxW);
        const lineH = fontSize * 0.45;
        for (let i = 0; i < lines.length; i++) {
          ensureSpace(lineH);
          pdf.text(lines[i], x, y);
          y += lineH;
        }
        return lines.length;
      };

      // ── Helper: section heading with colored left bar ──
      const sectionHeading = (title, color) => {
        ensureSpace(14);
        y += 4;
        pdf.setFillColor(...color);
        pdf.rect(margin, y - 4, 1.5, 7, 'F');
        pdf.setFontSize(12);
        pdf.setTextColor(...color);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title.toUpperCase(), margin + 5, y);
        y += 8;
      };

      // ── Helper: key-value line ──
      const keyValue = (key, value) => {
        if (!value) return;
        ensureSpace(6);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...gray);
        pdf.text(key + ':', margin + 2, y);
        const keyW = pdf.getTextWidth(key + ':  ');
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...black);
        const valLines = pdf.splitTextToSize(value, contentW - keyW - 4);
        pdf.text(valLines, margin + 2 + keyW, y);
        y += valLines.length * 4.2;
      };

      // ── Thin horizontal rule ──
      const hr = (color = lightGray) => {
        ensureSpace(4);
        y += 2;
        pdf.setDrawColor(...color);
        pdf.setLineWidth(0.15);
        pdf.line(margin, y, W - margin, y);
        y += 4;
      };

      // ═══════════════════════════════════════════════════
      // PAGE 1: COVER / IDENTITY
      // ═══════════════════════════════════════════════════

      // Top brand line
      pdf.setFontSize(8);
      pdf.setTextColor(...lightGray);
      pdf.setFont('helvetica', 'normal');
      pdf.text('GARDEN FOR LIFE  —  Advanced Consciousness Assessment', margin, y);
      y += 3;
      pdf.setDrawColor(...green);
      pdf.setLineWidth(0.4);
      pdf.line(margin, y, W - margin, y);
      y += 10;

      // Profile image (try to load)
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = result.imageUrl;
        });
        const imgCanvas = document.createElement('canvas');
        const imgSize = 300;
        imgCanvas.width = imgSize;
        imgCanvas.height = imgSize;
        const ctx = imgCanvas.getContext('2d');
        // Draw circular mask
        ctx.beginPath();
        ctx.arc(imgSize / 2, imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 0, 0, imgSize, imgSize);
        const imgData = imgCanvas.toDataURL('image/png');
        const pdfImgSize = 42;
        const imgX = W / 2 - pdfImgSize / 2;
        pdf.addImage(imgData, 'PNG', imgX, y, pdfImgSize, pdfImgSize);
        y += pdfImgSize + 6;
      } catch {
        // Skip image if it can't be loaded
        y += 4;
      }

      // Extended Archetype Name (colored, centered)
      pdf.setFontSize(22);
      pdf.setTextColor(...purple);
      pdf.setFont('helvetica', 'bold');
      pdf.text(result.name || '', W / 2, y, { align: 'center' });
      y += 8;

      if (result.extendedSubtitle) {
        pdf.setFontSize(11);
        pdf.setTextColor(...orange);
        pdf.setFont('helvetica', 'normal');
        pdf.text(result.extendedSubtitle, W / 2, y, { align: 'center' });
        y += 6;
      }

      // Description
      if (result.description) {
        pdf.setFontSize(10);
        pdf.setTextColor(...gray);
        pdf.setFont('helvetica', 'italic');
        const descLines = pdf.splitTextToSize(`"${result.description}"`, contentW - 20);
        descLines.forEach(line => {
          pdf.text(line, W / 2, y, { align: 'center' });
          y += 4.5;
        });
        y += 2;
      }

      // Main + Support indicator
      if (result.secondaryName) {
        pdf.setFontSize(9);
        pdf.setTextColor(...green);
        pdf.setFont('helvetica', 'bold');
        pdf.text(
          `${result.mainName} ${result.harmonyActive ? '\u27F7' : '+'} ${result.secondaryName}`,
          W / 2, y, { align: 'center' }
        );
        y += 5;
      }

      if (result.harmonyActive) {
        pdf.setFontSize(8);
        pdf.setTextColor(...green);
        pdf.text('Harmony Bonus Active (+33)', W / 2, y, { align: 'center' });
        y += 4;
      }
      if (result.shadowBonusActive) {
        pdf.setFontSize(8);
        pdf.setTextColor(...orange);
        pdf.text('Shadow Bonus Active (+69)', W / 2, y, { align: 'center' });
        y += 4;
      }

      hr(green);

      // ═══════════════════════════════════════════════════
      // SECTION 2: WHY THIS COMBINATION
      // ═══════════════════════════════════════════════════
      if (result.combinationText) {
        sectionHeading(`Waarom jij ${result.name} bent`, green);
        writeWrapped(result.combinationText, margin + 2, y, contentW - 4, 9.5, black);
        y += 4;
        hr();
      }

      // ═══════════════════════════════════════════════════
      // SECTION 3: MAIN ARCHETYPE
      // ═══════════════════════════════════════════════════
      sectionHeading(`De Essentie — ${result.mainName} (${result.mainNameEn})`, orange);
      if (result.group) {
        pdf.setFontSize(8);
        pdf.setTextColor(...gray);
        pdf.text(`Groep: ${result.group}`, margin + 5, y);
        y += 5;
      }
      keyValue('Motivatie', result.mainMotivation);
      keyValue('Kracht', result.mainPositive);
      keyValue('Schaduwkant', result.mainShadowTrait);
      y += 2;
      hr();

      // ═══════════════════════════════════════════════════
      // SECTION 4: SUPPORT ARCHETYPE
      // ═══════════════════════════════════════════════════
      sectionHeading(`De Vermenigvuldiging — ${result.secondaryName} (${result.secondaryNameEn})`, purple);
      if (result.supportGroup) {
        pdf.setFontSize(8);
        pdf.setTextColor(...gray);
        pdf.text(`Support Groep: ${result.supportGroup}`, margin + 5, y);
        y += 5;
      }
      keyValue('Motivatie', result.secondaryMotivation);
      keyValue('Kracht', result.secondaryPositive);
      if (result.secondaryDescription) {
        keyValue('Profiel', result.secondaryDescription);
      }
      if (result.harmonyActive) {
        ensureSpace(6);
        pdf.setFontSize(8);
        pdf.setTextColor(...green);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`\u2666 Harmony: ${result.mainNameEn} + ${result.secondaryNameEn} — complementaire as`, margin + 2, y);
        y += 5;
      }
      y += 2;
      hr();

      // ═══════════════════════════════════════════════════
      // SECTION 5: ALL 6 OUTCOMES TABLE
      // ═══════════════════════════════════════════════════
      if (result.allSupportArchetypes) {
        sectionHeading(`Alle Uitkomsten voor ${result.mainName}`, green);
        ensureSpace(28);
        const colW = contentW / 3;
        result.allSupportArchetypes.forEach((sa, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          if (col === 0 && row > 0) y += 12;
          const cx = margin + col * colW;
          const cy = y;
          // Highlight active
          if (sa.isActive) {
            pdf.setFillColor(240, 230, 255);
            pdf.roundedRect(cx, cy - 3.5, colW - 2, 11, 1.5, 1.5, 'F');
          }
          pdf.setFontSize(7);
          pdf.setTextColor(...(sa.isActive ? purple : gray));
          pdf.setFont('helvetica', 'bold');
          pdf.text(sa.group, cx + 2, cy);
          pdf.setFontSize(9);
          pdf.setTextColor(...(sa.isActive ? purple : black));
          pdf.setFont('helvetica', sa.isActive ? 'bold' : 'normal');
          pdf.text(sa.extendedName, cx + 2, cy + 4.2);
          if (sa.isActive) {
            pdf.setFontSize(6);
            pdf.setTextColor(...green);
            pdf.text('\u25B8 JOUW RESULTAAT', cx + 2, cy + 7.5);
          }
        });
        y += 24;
        hr();
      }

      // ═══════════════════════════════════════════════════
      // SECTION 6: SHADOW
      // ═══════════════════════════════════════════════════
      if (result.shadowPartner) {
        sectionHeading(`De Schaduw — ${result.shadowName} (${result.shadowNameEn})`, orange);
        if (result.mainShadowTension) {
          writeWrapped(result.mainShadowTension, margin + 2, y, contentW - 4, 9, orange, 'italic');
          y += 2;
        }
        if (result.shadowInsight) {
          writeWrapped(result.shadowInsight, margin + 2, y, contentW - 4, 9.5, black);
        } else if (result.shadowDescription) {
          writeWrapped(result.shadowDescription, margin + 2, y, contentW - 4, 9.5, black);
        }
        y += 4;
        hr();
      }

      // ═══════════════════════════════════════════════════
      // SECTION 7: BLINDSPOT
      // ═══════════════════════════════════════════════════
      if (result.blindspotPartner) {
        sectionHeading(`De Blindspot — ${result.blindspotName} (${result.blindspotNameEn})`, red);
        ensureSpace(6);
        pdf.setFontSize(8);
        pdf.setTextColor(...red);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`De tegenhanger van je Support (${result.secondaryNameEn}) — jouw externe blinde vlek`, margin + 5, y);
        y += 5;
        if (result.blindspotDescription) {
          writeWrapped(result.blindspotDescription, margin + 2, y, contentW - 4, 9.5, black);
          y += 2;
        }
        if (result.blindspotShadowTrait) {
          keyValue('Sabotage patroon', result.blindspotShadowTrait);
        }
        y += 4;
        hr();
      }

      // ═══════════════════════════════════════════════════
      // SECTION 8a: RADAR CHART (captured from DOM)
      // ═══════════════════════════════════════════════════
      if (radarRef.current) {
        sectionHeading('Visuele Analyse — Archetype Matrix', green);
        try {
          const radarCanvas = await html2canvas(radarRef.current, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            logging: false,
          });
          const radarImg = radarCanvas.toDataURL('image/png');
          const radarW = Math.min(contentW, 120);
          const radarH = (radarCanvas.height / radarCanvas.width) * radarW;
          ensureSpace(radarH + 4);
          pdf.addImage(radarImg, 'PNG', W / 2 - radarW / 2, y, radarW, radarH);
          y += radarH + 6;
        } catch {
          y += 4;
        }
        hr();
      }

      // ═══════════════════════════════════════════════════
      // SECTION 8b: DUAL-CORE DYNAMICS (drawn natively)
      // ═══════════════════════════════════════════════════
      if (result.subgroups && result.subgroups.length > 0) {
        sectionHeading('Dual-Core Dynamics', purple);
        const MAX_PTS = 25;
        const barMaxW = 50;
        const rowH = 10;

        result.subgroups.forEach(sg => {
          ensureSpace(rowH + 2);
          const leftPct = MAX_PTS > 0 ? sg.leftScore / MAX_PTS : 0;
          const rightPct = MAX_PTS > 0 ? sg.rightScore / MAX_PTS : 0;
          const centerX = W / 2;
          const barY = y - 1;

          // Left bar (purple, grows from center to left)
          pdf.setFillColor(...purple);
          const leftBarW = leftPct * barMaxW;
          pdf.rect(centerX - leftBarW - 1, barY, leftBarW, 4, 'F');

          // Right bar (orange, grows from center to right)
          pdf.setFillColor(...orange);
          const rightBarW = rightPct * barMaxW;
          pdf.rect(centerX + 1, barY, rightBarW, 4, 'F');

          // Center divider
          pdf.setFillColor(200, 200, 200);
          pdf.rect(centerX - 0.3, barY - 0.5, 0.6, 5, 'F');

          // Labels & scores
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'bold');
          // Left label
          pdf.setTextColor(...purple);
          pdf.text(`${sg.leftLabel}  ${sg.leftScore}`, centerX - barMaxW - 2, y + 1.5, { align: 'right' });
          // Right label
          pdf.setTextColor(...orange);
          pdf.text(`${sg.rightScore}  ${sg.rightLabel}`, centerX + barMaxW + 2, y + 1.5);

          // Bonus indicators
          if (sg.harmonyPoints > 0) {
            pdf.setFontSize(5.5);
            pdf.setTextColor(...green);
            pdf.text(`+${sg.harmonyPoints} harmony`, centerX, y + 5, { align: 'center' });
          }
          if (sg.shadowPoints > 0) {
            pdf.setFontSize(5.5);
            pdf.setTextColor(...orange);
            pdf.text(`+${sg.shadowPoints} shadow`, centerX, y + (sg.harmonyPoints > 0 ? 7.5 : 5), { align: 'center' });
          }

          y += rowH + (sg.harmonyPoints > 0 || sg.shadowPoints > 0 ? 4 : 0);
        });
        y += 4;
        hr();
      }

      // ═══════════════════════════════════════════════════
      // SECTION 9-11: ANALYSIS SECTIONS
      // ═══════════════════════════════════════════════════
      if (result.analysisSections) {
        const sectionColors = [green, purple, orange];
        result.analysisSections.forEach((section, i) => {
          sectionHeading(section.title, sectionColors[i % 3]);
          writeWrapped(section.content, margin + 2, y, contentW - 4, 9.5, black);
          y += 4;
          if (i < result.analysisSections.length - 1) hr();
        });
      }

      // ═══════════════════════════════════════════════════
      // FOOTER
      // ═══════════════════════════════════════════════════
      ensureSpace(14);
      y += 4;
      pdf.setDrawColor(...green);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, W - margin, y);
      y += 5;
      pdf.setFontSize(7);
      pdf.setTextColor(...lightGray);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Garden for Life  \u2022  Advanced Consciousness Assessment', W / 2, y, { align: 'center' });
      y += 3.5;
      pdf.text(`Score: ${result.totalScore} / ${result.maxScore}`, W / 2, y, { align: 'center' });
      y += 3.5;
      pdf.text(`Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}`, W / 2, y, { align: 'center' });

      // ── Download ──
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

                {/* ── 4b. Blindspot — opposite of Support (external saboteur) ── */}
                {result.blindspotPartner && (
                  <div style={{
                    width: '100%',
                    background: 'rgba(239, 68, 68, 0.05)',
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
                      marginBottom: '0.75rem',
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
                    background: 'rgba(168, 85, 247, 0.04)',
                    border: '1px solid rgba(168, 85, 247, 0.15)',
                    borderRadius: '0.75rem',
                    padding: rs.cardPad,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                      background: 'linear-gradient(to right, #a855f7, #22d3ee, #fbbf24, #f472b6, #ef4444)',
                    }} />
                    <h3 style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      color: '#a855f7',
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
                                fontSize: '0.6rem', fontFamily: "'Rajdhani', sans-serif",
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
                      borderBottom: '1px solid rgba(168, 85, 247, 0.1)',
                    }}>
                      {['O', 'C', 'E', 'A', 'N'].map(dim => (
                        <span key={dim} style={{
                          fontSize: '0.65rem', fontFamily: "'Rajdhani', sans-serif",
                          color: 'rgba(209, 213, 219, 0.5)',
                        }}>
                          <span style={{ color: result.oceanColors[dim], fontWeight: 700 }}>{dim}</span>
                          {' = '}{result.oceanLabels[dim].dutch}
                        </span>
                      ))}
                    </div>

                    {/* Neuroticism Trigger */}
                    {result.neuroticismTrigger && (
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1rem',
                        marginBottom: '1rem',
                      }}>
                        <div style={{
                          fontSize: '0.65rem', color: '#ef4444',
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
                          {result.neuroticismTrigger}
                        </p>
                      </div>
                    )}

                    {/* Core Profile: Workplace & Conflict */}
                    {result.coreProfile && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                          { label: 'Superkracht op de Werkvloer', text: result.coreProfile.workplaceSuperpower, color: '#00ff9d' },
                          { label: 'Conflictstijl', text: result.coreProfile.conflictStyle, color: '#fbbf24' },
                          { label: 'Relatiepatroon', text: result.coreProfile.relationshipPattern, color: '#f472b6' },
                          { label: 'Individuatiepad', text: result.coreProfile.individuationPath, color: '#a855f7' },
                        ].map(({ label, text, color: c }) => (
                          <div key={label}>
                            <div style={{
                              fontSize: '0.65rem', color: c,
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
                  <div ref={subgroupRef}>
                    <SubgroupCounters subgroups={result.subgroups} />
                  </div>
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
                  <div ref={radarRef} style={{ width: '100%', height: rs.radarHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
  // 3. Harmony Bonus (+69): unlocked when Main and Support are
  //    direct neighbors within their Neurale Zuil (biological pillar)
  //    Shadow Integration: measured on 180°-axis (no scoring bonus)
  // ──────────────────────────────────────────────────────────
  const harmonyActive = isComplementaryPair(mainKey, supportKey);
  const shadowBonusActive = SHADOW_PAIRS[mainKey] === supportKey; // flag only, no bonus
  if (harmonyActive) {
    archetypeScores[mainKey] += 69;
    archetypeScores[supportKey] += 69;
  }

  // ──────────────────────────────────────────────────────────
  // 4. Extended Archetype Name (72-outcome matrix)
  // ──────────────────────────────────────────────────────────
  const supportGroup = ARCHETYPE_TO_GROUP[supportKey] || 'RULING';
  const extendedName = getExtendedArchetype(mainKey, supportKey);

  // ──────────────────────────────────────────────────────────
  // 4b. Extended Archetype portrait image + description
  // ──────────────────────────────────────────────────────────
  const archetypeImage = getArchetypeImage(mainKey, supportGroup);
  const extendedDesc = getExtendedDescription(mainKey, supportGroup);

  // ──────────────────────────────────────────────────────────
  // 5. Shadow Archetype (psychological tension point)
  //    Shadow = 180° opposite of MAIN archetype (internal fuel)
  // ──────────────────────────────────────────────────────────
  const shadowKey = SHADOW_PAIRS[mainKey] || null;

  // ──────────────────────────────────────────────────────────
  // 5b. Blindspot Archetype (external saboteur)
  //     Blindspot = shadow partner of SUPPORT archetype
  // ──────────────────────────────────────────────────────────
  const blindspotKey = SHADOW_PAIRS[supportKey] || null;

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
  const ALL_GROUPS = ['RULING', 'RELATIONAL', 'SEEKER', 'CHAOS', 'ABSTRACT', 'AGENCY'];
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
        { title: 'De Alchemie van Individuatie', content: 'Analyse wordt berekend...' },
        { title: 'Het Neurale Schakelbord', content: 'Implementatie wordt berekend...' },
        { title: 'Ontologische Evolutie', content: 'Traject wordt berekend...' },
      ];

  // ──────────────────────────────────────────────────────────
  // 9. Compute total score
  // ──────────────────────────────────────────────────────────
  const totalScore = Object.values(archetypeScores).reduce((s, v) => s + v, 0);

  // ──────────────────────────────────────────────────────────
  // 8b. OCEAN Personality Profiles
  // ──────────────────────────────────────────────────────────
  const coreProfile = getCoreProfile(mainKey);
  const extendedOcean = getExtendedOcean(mainKey, supportGroup);

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
    // Shadow (180° opposite of Main — internal fuel)
    shadowPartner: shadowKey,
    shadowName: shadowKey ? (ARCHETYPES[shadowKey]?.name || shadowKey) : null,
    shadowNameEn: shadowKey ? (ARCHETYPES[shadowKey]?.nameEn || shadowKey) : null,
    shadowDescription: shadowKey ? (ARCHETYPES[shadowKey]?.description || null) : null,
    // Blindspot (shadow partner of Support — external saboteur)
    blindspotPartner: blindspotKey,
    blindspotName: blindspotKey ? (ARCHETYPES[blindspotKey]?.name || blindspotKey) : null,
    blindspotNameEn: blindspotKey ? (ARCHETYPES[blindspotKey]?.nameEn || blindspotKey) : null,
    blindspotDescription: blindspotKey ? (ARCHETYPES[blindspotKey]?.description || null) : null,
    blindspotShadowTrait: blindspotKey ? (ARCHETYPES[blindspotKey]?.shadow || null) : null,
    blindspotTension: blindspotKey ? (ARCHETYPES[blindspotKey]?.shadowTension || null) : null,
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
    fullMatrix72,
    analysisSections,
    totalScore,
    maxScore: harmonyActive ? 369 : 300,
    // OCEAN Personality Profile
    coreProfile,                                       // Full core archetype psychological portrait
    extendedOcean,                                     // OCEAN scores + trigger for this extended archetype
    oceanLabels: OCEAN_LABELS,                         // Dimension label map (short/full/dutch)
    oceanColors: OCEAN_COLORS,                         // Dimension color map for UI
    neuroticismTrigger: extendedOcean?.neuroticismTrigger || null,
    // Raw data for future API agent
    _archetypeScores: archetypeScores,
    _primaryKey: mainKey,
    _secondaryKey: supportKey,
    _extendedName: extendedName,
    _harmonyActive: harmonyActive,
    // Full answer log (backend-only, for account-linked retrieval)
    _answerLog: answerLog,
    // AI Agent prompt (for Ontologische Evolutie section)
    _aiAgentPrompt: `Je bent een persoonlijke ontwikkelingscoach gespecialiseerd in Jungiaanse archetypen en het OCEAN persoonlijkheidsmodel. Mijn profiel: Extended Archetype "${extendedName}" (Main: ${primaryArchetype.nameEn || mainKey}, Support: ${supportArchetype.nameEn || supportKey}, Support Group: ${supportGroup}). Mijn schaduw (180° individuatie) is ${shadowKey ? (ARCHETYPES[shadowKey]?.nameEn || shadowKey) : 'onbekend'}, mijn blindspot is ${blindspotKey ? (ARCHETYPES[blindspotKey]?.nameEn || blindspotKey) : 'onbekend'}. Harmony bonus: ${harmonyActive ? 'actief' : 'niet actief'}. OCEAN profiel: O=${extendedOcean?.ocean?.O || '?'}, C=${extendedOcean?.ocean?.C || '?'}, E=${extendedOcean?.ocean?.E || '?'}, A=${extendedOcean?.ocean?.A || '?'}, N=${extendedOcean?.ocean?.N || '?'}. Neuroticisme-trigger: ${extendedOcean?.neuroticismTrigger || 'onbekend'}. ${coreProfile ? `Werkplek superkracht: ${coreProfile.workplaceSuperpower} Conflictstijl: ${coreProfile.conflictStyle} Individuatiepad: ${coreProfile.individuationPath}` : ''} Help me mijn schaduw te integreren en mijn blindspot te herkennen in dagelijkse situaties.`,
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
