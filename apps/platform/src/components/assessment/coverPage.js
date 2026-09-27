import { readScene, layoutLesson, drawLesson } from './coverLesson.js';

/**
 * Page 1 of the report PDF: the cover.
 *
 * Lifted out of AssessmentResultsModal's PDF builder (2026-09-27) so the dev cover preview
 * (?coverpreview=1) draws the SAME page the report ships — a preview that diverges is worse than no
 * preview, because the thing being judged here is where the levensles lands on the art.
 *
 * Draws into an existing jsPDF at the caller's cursor and returns the cursor after the cover.
 *
 * @param {object} pdf   jsPDF instance, unit 'mm', A4 portrait
 * @param {object} ctx
 * @param {number} ctx.y                 cursor, mm from the top
 * @param {number} ctx.W                 page width (210)
 * @param {number} ctx.H                 page height (297)
 * @param {number} ctx.margin            page margin (18)
 * @param {number} ctx.contentW          W - 2 * margin
 * @param {object} ctx.colors            { orange, purple, white, bg } as [r,g,b]
 * @param {Function} ctx.t               translator
 * @param {string} ctx.language          'nl' | 'en'
 * @param {string} ctx.extName           the extended archetype's name
 * @param {object} ctx.result            needs .name, .extendedSubtitle, .levensles
 * @param {object} ctx.portrait          resolvePortrait() result (url, printUrl, depthUrl)
 * @returns {Promise<number>}            the cursor after the cover
 */
export async function drawCoverPage(pdf, ctx) {
  const { W, H, margin, contentW, t, language, extName, result, portrait } = ctx;
  const { orange, purple, white, bg } = ctx.colors;
  let y = ctx.y;

  // The cover paints its own page. The report paints every page this colour anyway, but owning it here
  // is what keeps the dev preview honest: drawn straight into a fresh jsPDF, the page would otherwise
  // come out on white and the levensles would be judged against a background no reader ever sees.
  pdf.setFillColor(...bg);
  pdf.rect(0, 0, W, H, 'F');
  // ═══════════════════════════════════════════════════
  // PAGE 1: COVER — Large profile + extended archetype
  // ═══════════════════════════════════════════════════

  // Top brand line — "GARDEN FOR LIFE: Archetype Analyse" left, date right
  const coverDate = new Date().toLocaleDateString(language === 'en' ? 'en-GB' : 'nl-NL');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...orange);   // brand line + date above the purple divider (owner, 2026-09-18)
  pdf.setFont('helvetica', 'normal');
  pdf.text(t('resultsModal.pdf.cover.brandLine'), margin, y);
  pdf.text(coverDate, W - margin, y, { align: 'right' });
  y += 3;
  pdf.setDrawColor(...purple);
  pdf.setLineWidth(0.4);
  pdf.line(margin, y, W - margin, y);
  y += 19;

  // Cover, top to bottom: the extended archetype's name, then the portrait in full view with the
  // levensles set into its scene. The portrait takes every millimetre the name leaves.

  // Extended Archetype Name — large, centered (1 of 132): 26 pt × 1.4 (owner, 2026-09-18), smaller only
  // when a long name would not fit between the margins.
  const coverName = extName || result.name || '';
  pdf.setFont('helvetica', 'bold');
  const coverNameUnits = pdf.getStringUnitWidth(coverName);
  pdf.setFontSize(Math.min(36.4, coverNameUnits ? (contentW * pdf.internal.scaleFactor) / coverNameUnits : 36.4));
  pdf.setTextColor(...purple);
  pdf.text(coverName, W / 2, y, { align: 'center' });
  y += 14;

  // Subtitle (extendedSubtitle)
  if (result.extendedSubtitle) {
    pdf.setFontSize(12);
    pdf.setTextColor(...orange);
    pdf.setFont('helvetica', 'normal');
    pdf.text(result.extendedSubtitle, W / 2, y, { align: 'center' });
    y += 8;
  }

  // The levensles is set into the portrait's scene (coverLesson.js; owner rulings 2026-09-18): drawn over
  // the portrait so nothing ever covers a word, shaped by the portrait's depth map (taper, convergence,
  // occlusion), its sizes between the smallest text in this PDF (the radar's 5 pt unit captions) and 1.3×
  // the largest subheading (sectionHeading, 12 pt). No portrait, or no room in its scene → the levensles
  // goes under the portrait, wide and short.
  const lessonText = result.levensles ? `“${result.levensles}”` : '';
  const LESSON_SIZES = { min: 5, max: 12 * 1.3 };
  const LESSON_PT = 10.5, LESSON_LH = 5.5;                  // under the portrait
  const lessonLines = (w) => { pdf.setFontSize(LESSON_PT); pdf.setFont('helvetica', 'italic'); return pdf.splitTextToSize(lessonText, w); };
  const loadImage = (src) => new Promise((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });

  // The portrait's transparency and depth map, sampled onto one 2 mm grid over the page: between the
  // margins, the height of the portrait (the cells beside it are open page).
  const sampleScene = (img, depthImg, { imgX, imgY, drawW, drawH }) => {
    const cell = 2;
    const cols = Math.floor(contentW / cell), rows = Math.floor(drawH / cell);
    const gw = Math.max(1, Math.round(drawW / cell));
    const off = Math.round((imgX - margin) / cell);
    const channel = (source, rgba) => {
      const c = document.createElement('canvas');
      c.width = gw; c.height = rows;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(source, 0, 0, gw, rows);
      const px = g.getImageData(0, 0, gw, rows).data;
      const out = new Uint8ClampedArray(cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let ic = 0; ic < gw; ic++) {
          const q = ic + off;
          if (q >= 0 && q < cols) out[r * cols + q] = px[(r * gw + ic) * 4 + rgba];
        }
      }
      return out;
    };
    return readScene({ cols, rows, cell, x0: margin, y0: imgY, alpha: channel(img, 3), depth: depthImg ? channel(depthImg, 0) : null });
  };

  let lessonInScene = false;
  if (portrait.url) try {
    // The cover draws the print copy (2764 px — 300 dpi over its 234 mm), not the card copy: it is
    // rasterised to its printed size below, so the card's 1100 px would print at ~119 dpi. It is
    // served from R2 and loaded crossOrigin='anonymous' (its pixels are read), so without the
    // bucket's CORS header the load fails outright — hence the fall back to the same-origin card
    // copy: a soft cover beats no cover.
    const img = await loadImage(portrait.printUrl || portrait.url).catch(() => loadImage(portrait.url));
    // Without its depth map the lesson still finds room in the scene, only level and at one size.
    const depthImg = portrait.depthUrl ? await loadImage(portrait.depthUrl).catch(() => null) : null;
    const gap = 6;
    const aspect = img.naturalWidth / img.naturalHeight;
    // The portrait in full view: the whole image, uncropped, in its own proportions, no frame, placed as
    // a true PNG so its transparency (the figure's glow) sits straight on the page.
    // 10% larger than the room between the name and the bottom margin, and lifted 10 mm toward the name
    // (owner, 2026-09-18): a figure can run to the image's lower edge, so the air belongs under it.
    const lift = 10;
    const fit = (reserve) => {
      const room = H - margin - y - reserve - 2 * gap;
      let h = Math.max(60, Math.min(room * 1.1, H - 3 - y - gap - reserve));
      let w = h * aspect;
      if (w > contentW) { w = contentW; h = w / aspect; }
      return { imgX: (W - w) / 2, imgY: y + gap - lift, drawW: w, drawH: h };
    };
    let place = fit(0);
    let lesson = null;
    if (lessonText) {
      pdf.setFont('helvetica', 'italic');
      const measure1 = (s) => pdf.getStringUnitWidth(s) / pdf.internal.scaleFactor;   // mm at 1 pt
      // Beside the figure or flowing along a pole, whichever lays out better (dev preview: &lesson=open|flow).
      const mode = (typeof window !== 'undefined' && window.__GFL_PDF_REPLAY?.lessonMode) || 'auto';
      lesson = layoutLesson({ text: lessonText, scene: sampleScene(img, depthImg, place), sizes: LESSON_SIZES, measure1, mode });
      if (!lesson) place = fit(2 + lessonLines(contentW - 10).length * LESSON_LH + 6);
    }
    // Rasterised at ~300 dpi for its printed size.
    const pxH = Math.min(img.naturalHeight, Math.round((place.drawH / 25.4) * 300));
    const imgCanvas = document.createElement('canvas');
    imgCanvas.height = pxH;
    imgCanvas.width = Math.round(pxH * aspect);
    imgCanvas.getContext('2d').drawImage(img, 0, 0, imgCanvas.width, imgCanvas.height);
    pdf.addImage(imgCanvas.toDataURL('image/png'), 'PNG', place.imgX, place.imgY, place.drawW, place.drawH, undefined, 'FAST');
    // No link to the original here: the full-resolution portrait download lives in the account dashboard.
    // The lesson goes over the portrait, never under it: nothing may cover a word.
    if (lesson) {
      drawLesson(pdf, lesson, { ink: white, halo: bg });
      lessonInScene = true;
    }
    y = place.imgY + place.drawH + gap;
  } catch {
    y += 8;
  }

  // No portrait, or no room in its scene: the levensles under it, wide and short.
  if (lessonText && !lessonInScene) {
    y += 2;
    const lines = lessonLines(contentW - 10);
    pdf.setTextColor(...white);
    lines.forEach(line => {
      pdf.text(line, W / 2, y, { align: 'center' });
      y += LESSON_LH;
    });
    y += 6;
  }


  return y;
}
