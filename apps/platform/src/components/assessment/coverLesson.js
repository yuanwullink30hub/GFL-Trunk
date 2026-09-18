// The levensles on the PDF cover, set into the portrait's own scene. Owner rulings (2026-09-18):
//   1. It is drawn over the portrait, so nothing ever covers a word.
//   2. It follows the portrait's depth map (Depth Anything V2, made offline next to each image):
//      taper       — every line takes the depth of the figure beside it, nearer → larger;
//      convergence — the lines run square to the direction the scene recedes (near → far), capped to a lean;
//      occlusion   — every line stops short of the figure and hugs its outline; the figure is never written over.
//   3. Its sizes stay between the smallest text in the PDF and 1.3× the largest subheading.
//   4. An option, not a requirement: along a long pole, staff or sword the lesson may FLOW with it, and so sit
//      on part of the image: its lines run beside the element, over whatever lies there (a word that sits on
//      the image gets a dark edge), and shrink and draw together toward the element's far end.
// Pure geometry: the cover hands in the scene as page-space grids plus a width measure; drawLesson draws it.

const PT = 25.4 / 72;        // mm per point
const LINE_GAP = 1.3;        // baseline to baseline, × the font size
const MAX_TILT = 10;         // degrees: a lean, never a slant that fights reading
const CLEAR = 1;             // cells of clear space kept around the figure
const MAX_STEP = 0.12;       // size change from one line to the next, at most ±12%
const MAX_LINE = 120;        // mm
const MIN_RUN = 15;          // mm: narrower than this and the line does not go there
const ANCHOR_STEP = 4;       // mm between the candidate starting points the search tries
const FLOW_MIN_LEN = 40;     // mm: an element at least this long, and 6× longer than wide, can carry the lesson
const FLOW_MAX_TILT = 40;    // degrees: steeper elements are left alone
const FLOW_GAP = 1.45;       // flow line pitch: its sizes vary and its edged words need the air

/**
 * Read the portrait's scene from its transparency and depth map, both sampled onto one grid over the page.
 * @param {{ cols: number, rows: number, cell: number, x0: number, y0: number,
 *           alpha: ArrayLike<number>, depth?: ArrayLike<number>|null }} g
 *   one value per cell (0–255), row-major; depth: brighter = nearer (the Depth Anything convention)
 */
export function readScene({ cols, rows, cell, x0, y0, alpha, depth }) {
  const n = cols * rows;
  const solid = new Uint8Array(n);
  for (let i = 0; i < n; i++) solid[i] = alpha[i] >= 50 ? 1 : 0;
  // Occlusion: the figure, and CLEAR cells around it, are closed to text.
  const blocked = new Uint8Array(n);
  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) {
      if (!solid[r * cols + q]) continue;
      for (let dr = -CLEAR; dr <= CLEAR; dr++) {
        for (let dq = -CLEAR; dq <= CLEAR; dq++) {
          const rr = r + dr, qq = q + dq;
          if (rr >= 0 && rr < rows && qq >= 0 && qq < cols) blocked[rr * cols + qq] = 1;
        }
      }
    }
  }
  // Nearness 0–1 on the figure: the depth map normalised over the figure's own 5th–95th percentile.
  const near = new Float32Array(n).fill(NaN);
  const vals = [];
  if (depth) for (let i = 0; i < n; i++) if (solid[i]) vals.push(depth[i]);
  if (vals.length > 20) {
    const sorted = [...vals].sort((a, b) => a - b);
    const lo = sorted[Math.floor(sorted.length * 0.05)], hi = sorted[Math.floor(sorted.length * 0.95)];
    const span = Math.max(1, hi - lo);
    for (let i = 0; i < n; i++) if (solid[i]) near[i] = Math.min(1, Math.max(0, (depth[i] - lo) / span));
  }

  // The direction the scene recedes: the figure's long axis (the silhouette's principal axis — steady from
  // one variant of an image to the other), pointed from its nearer end to its farther end by the depth map.
  let axis = { ux: 1, uy: 0, wx: 0, wy: 1, angle: 0 };
  let plane = () => 0.5;
  const pts = [];
  for (let i = 0; i < n; i++) {
    if (solid[i]) pts.push([x0 + ((i % cols) + 0.5) * cell, y0 + (Math.floor(i / cols) + 0.5) * cell, near[i]]);
  }
  if (pts.length > 20) {
    let mx = 0, my = 0;
    for (const [x, y] of pts) { mx += x; my += y; }
    mx /= pts.length; my /= pts.length;
    let sxx = 0, syy = 0, sxy = 0;
    for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
    const tr = (sxx + syy) / 2, det = Math.sqrt(((sxx - syy) / 2) ** 2 + sxy ** 2);
    const l1 = tr + det, l2 = Math.max(1e-9, tr - det);
    let ax = sxy, ay = l1 - sxx;
    if (Math.hypot(ax, ay) < 1e-9) { ax = sxx >= syy ? 1 : 0; ay = sxx >= syy ? 0 : 1; }
    const alen = Math.hypot(ax, ay);
    ax /= alen; ay /= alen;
    const ts = pts.map(([x, y]) => (x - mx) * ax + (y - my) * ay);
    const tsSorted = [...ts].sort((a, b) => a - b);
    let tA = tsSorted[Math.floor(ts.length * 0.15)], tB = tsSorted[Math.floor(ts.length * 0.85)];
    let nA = 0, cA = 0, nB = 0, cB = 0;
    ts.forEach((t, i) => {
      const v = pts[i][2];
      if (Number.isNaN(v)) return;
      if (t <= tA) { nA += v; cA++; } else if (t >= tB) { nB += v; cB++; }
    });
    nA = cA ? nA / cA : 0.5; nB = cB ? nB / cB : 0.5;
    if (nA < nB) { ax = -ax; ay = -ay; [tA, tB] = [-tB, -tA]; [nA, nB] = [nB, nA]; }
    // How sure the reading is: a long figure whose two ends clearly differ in depth. A round figure, or one
    // at a single depth, leaves the lines level and the sizes even.
    const sure = Math.min(1, Math.max(0, (l1 / l2 - 1.5) / 2)) * Math.min(1, Math.max(0, (nA - nB) / 0.1));
    // Lines run square to the recession, leaning at most MAX_TILT.
    let ux = ay, uy = -ax;
    if (ux < 0) { ux = -ux; uy = -uy; }
    const angle = Math.max(-MAX_TILT, Math.min(MAX_TILT, ((Math.atan2(uy, ux) * 180) / Math.PI) * sure));
    const rad = (angle * Math.PI) / 180;
    axis = { ux: Math.cos(rad), uy: Math.sin(rad), wx: -Math.sin(rad), wy: Math.cos(rad), angle };
    // The recession as a plane through the page: 1 at the figure's near end, 0 at its far end.
    plane = (x, y) => {
      const s = Math.min(1, Math.max(0, ((x - mx) * ax + (y - my) * ay - tA) / Math.max(1, tB - tA)));
      return 0.5 + sure * (0.5 - s);
    };
  }
  const { thin, elements } = findElements({ cols, rows, cell, x0, y0, solid, near });
  return { cols, rows, cell, x0, y0, solid, thin, blocked, near, axis, plane, elements, hasDepth: vals.length > 20 };
}

// Long thin elements (a pole, a staff, a sword): the parts of the figure an opening of ~6 mm removes, kept
// where they are long and straight. Each gets its axis (read left to right), its extent along it, its half
// width, and how its depth runs along it (nearness = a + b·t, t in mm along the axis from its centre).
function findElements({ cols, rows, cell, x0, y0, solid, near }) {
  const n = cols * rows, W1 = cols + 1;
  const rad = Math.max(1, Math.round(3 / cell));
  const full = (2 * rad + 1) ** 2;
  const sat = (m) => {
    const S = new Int32Array((rows + 1) * W1);
    for (let r = 0; r < rows; r++) {
      for (let q = 0; q < cols; q++) S[(r + 1) * W1 + q + 1] = m[r * cols + q] + S[r * W1 + q + 1] + S[(r + 1) * W1 + q] - S[r * W1 + q];
    }
    return S;
  };
  const windowSum = (S, r, q) => {
    const r0 = Math.max(0, r - rad), q0 = Math.max(0, q - rad), r1 = Math.min(rows, r + rad + 1), q1 = Math.min(cols, q + rad + 1);
    return [S[r1 * W1 + q1] - S[r0 * W1 + q1] - S[r1 * W1 + q0] + S[r0 * W1 + q0], (r1 - r0) * (q1 - q0)];
  };
  const S1 = sat(solid);
  const eroded = new Uint8Array(n);
  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) { const [s, area] = windowSum(S1, r, q); eroded[r * cols + q] = area === full && s === full ? 1 : 0; }
  }
  const S2 = sat(eroded);
  const thin = new Uint8Array(n);
  for (let r = 0; r < rows; r++) {
    for (let q = 0; q < cols; q++) { const i = r * cols + q; thin[i] = solid[i] && windowSum(S2, r, q)[0] === 0 ? 1 : 0; }
  }

  const seen = new Uint8Array(n);
  const elements = [];
  for (let i = 0; i < n; i++) {
    if (!thin[i] || seen[i]) continue;
    const cells = [], stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const c = stack.pop();
      cells.push(c);
      const r = Math.floor(c / cols), q = c % cols;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dq = -1; dq <= 1; dq++) {
          const rr = r + dr, qq = q + dq;
          if (rr < 0 || rr >= rows || qq < 0 || qq >= cols) continue;
          const j = rr * cols + qq;
          if (thin[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
        }
      }
    }
    if (cells.length < 8) continue;
    const xy = cells.map((c) => [x0 + ((c % cols) + 0.5) * cell, y0 + (Math.floor(c / cols) + 0.5) * cell]);
    let cx = 0, cy = 0;
    for (const [x, y] of xy) { cx += x; cy += y; }
    cx /= xy.length; cy /= xy.length;
    let sxx = 0, syy = 0, sxy = 0;
    for (const [x, y] of xy) { sxx += (x - cx) ** 2; syy += (y - cy) ** 2; sxy += (x - cx) * (y - cy); }
    const l1 = (sxx + syy) / 2 + Math.sqrt(((sxx - syy) / 2) ** 2 + sxy ** 2);
    let ux = sxy, uy = l1 - sxx;
    if (Math.hypot(ux, uy) < 1e-9) { ux = sxx >= syy ? 1 : 0; uy = sxx >= syy ? 0 : 1; }
    const ul = Math.hypot(ux, uy);
    ux /= ul; uy /= ul;
    if (ux < 0) { ux = -ux; uy = -uy; }
    if (Math.abs((Math.atan2(uy, ux) * 180) / Math.PI) > FLOW_MAX_TILT) continue;
    const ts = xy.map(([x, y]) => (x - cx) * ux + (y - cy) * uy);
    const t0 = Math.min(...ts), t1 = Math.max(...ts);
    const len = t1 - t0 + cell, width = (cells.length * cell * cell) / len;
    if (len < FLOW_MIN_LEN || len < 6 * width) continue;
    // Its depth along its length (least squares); no depth map → level.
    let a = 0.5, b = 0, m = 0, st = 0, sn = 0, stt = 0, stn = 0;
    cells.forEach((c, k) => {
      const v = near[c];
      if (Number.isNaN(v)) return;
      m++; st += ts[k]; sn += v; stt += ts[k] * ts[k]; stn += ts[k] * v;
    });
    if (m > 4 && stt * m - st * st > 1e-6) { b = (m * stn - st * sn) / (m * stt - st * st); a = (sn - b * st) / m; }
    elements.push({ cx, cy, ux, uy, t0, t1, len, half: width / 2, a, b });
  }
  return { thin, elements };
}

// The depth of the figure within `radius` mm of a point, the closest counting most; NaN where there is none.
function figureNear(scene, x, y, radius) {
  const { cols, rows, cell, x0, y0, near } = scene;
  const R = Math.round(radius / cell);
  const q0 = Math.floor((x - x0) / cell), r0 = Math.floor((y - y0) / cell);
  let s = 0, w = 0;
  for (let dr = -R; dr <= R; dr++) {
    const r = r0 + dr;
    if (r < 0 || r >= rows) continue;
    for (let dq = -R; dq <= R; dq++) {
      const q = q0 + dq;
      if (q < 0 || q >= cols) continue;
      const v = near[r * cols + q];
      const d2 = dr * dr + dq * dq;
      if (Number.isNaN(v) || d2 > R * R) continue;
      const k = 1 / (1 + d2 / 4);
      s += k * v; w += k;
    }
  }
  return w > 0.5 ? s / w : NaN;
}

// How near the scene is at a point: mostly its place on the near→far plane (the taper), a quarter the depth
// of the figure within 16 mm; open space far from the figure takes the plane alone.
function nearAt(scene, x, y) {
  const f = figureNear(scene, x, y, 16);
  const p = scene.plane(x, y);
  return Number.isNaN(f) ? p : 0.25 * f + 0.75 * p;
}

/**
 * Lay the lesson out in the scene: the best layout over every starting point the search tries.
 * @param {{ text: string, scene: object, sizes: { min: number, max: number },
 *           measure1: (s: string) => number, mode?: 'auto'|'open'|'flow' }} o
 *   measure1 = width in mm at 1 pt, in the font the cover draws; mode: 'open' = beside the figure only,
 *   'flow' = along an element only, 'auto' (default) = whichever lays out better
 * @returns {{ mode: 'open'|'flow', runs: { text: string, pt: number, x: number, y: number, angle: number,
 *   halo: boolean }[] } | null}  a run = a line (open) or a word (flow); x/y = where its baseline starts,
 *   angle = jsPDF's (degrees, counter-clockwise), halo = it sits on the image
 */
export function layoutLesson({ text, scene, sizes, measure1, mode = 'auto' }) {
  // A dash stays with the word before it, so no line opens on one.
  const words = text.split(/\s+/).filter(Boolean).reduce((acc, w) => {
    if (/^[—–-]$/.test(w) && acc.length) acc[acc.length - 1] += ` ${w}`; else acc.push(w);
    return acc;
  }, []);
  if (!words.length) return null;
  const wordW = words.map(measure1);
  const spaceW = measure1(' ');
  const { cols, rows, cell, x0, y0, blocked, axis } = scene;
  const x1 = x0 + cols * cell, y1 = y0 + rows * cell;
  const cellAt = (x, y) => {
    if (x < x0 || x >= x1 || y < y0 || y >= y1) return -1;              // off the scene: the page's edge
    return blocked[Math.floor((y - y0) / cell) * cols + Math.floor((x - x0) / cell)];
  };
  const ptFor = (nearness) => sizes.min + (sizes.max - sizes.min) * nearness;
  const { ux, uy, wx, wy } = axis;

  // The open stretch along a baseline through (cx, cy) for glyphs of size pt, and what ends it on each side.
  const runAt = (cx, cy, pt) => {
    const band = [-0.75 * pt * PT, -0.37 * pt * PT, 0, 0.25 * pt * PT];
    const state = (s) => {
      let edge = false;
      for (const o of band) {
        const c = cellAt(cx + ux * s + wx * o, cy + uy * s + wy * o);
        if (c === 1) return 'figure';
        if (c === -1) edge = true;
      }
      return edge ? 'edge' : 'open';
    };
    if (state(0) !== 'open') return null;
    let L = 0, R = 0, left = 'edge', right = 'edge';
    for (let s = -1; s >= -MAX_LINE; s--) { const st = state(s); if (st !== 'open') { left = st; break; } L = s; }
    for (let s = 1; s <= MAX_LINE; s++) { const st = state(s); if (st !== 'open') { right = st; break; } R = s; }
    return { L, R, left, right };
  };

  const layoutFrom = (ax, ay) => {
    const lines = [];
    let k = 0, cx = ax, cy = ay, prev = null;
    while (k < words.length) {
      // Size from the depth of what the line touches: the figure where it meets it, else its middle.
      const probe = runAt(cx, cy, prev ?? ptFor(nearAt(scene, cx, cy)));
      if (!probe) return null;
      const touchS = probe.right === 'figure' ? probe.R : probe.left === 'figure' ? probe.L : (probe.L + probe.R) / 2;
      let pt = ptFor(nearAt(scene, cx + ux * touchS, cy + uy * touchS));
      if (prev) pt = Math.min(prev * (1 + MAX_STEP), Math.max(prev * (1 - MAX_STEP), pt));
      const run = runAt(cx, cy, pt);
      if (!run) return null;
      let { L, R } = run;
      if (R - L > MAX_LINE) {                                             // too long: keep the figure's side
        if (run.right === 'figure' && run.left !== 'figure') L = R - MAX_LINE;
        else if (run.left === 'figure' && run.right !== 'figure') R = L + MAX_LINE;
        else { const c = Math.min(R - MAX_LINE / 2, Math.max(L + MAX_LINE / 2, 0)); L = c - MAX_LINE / 2; R = c + MAX_LINE / 2; }
      }
      if (R - L < MIN_RUN) return null;
      const start = k;
      let w = 0;
      while (k < words.length) {
        const add = (k > start ? spaceW : 0) + wordW[k];
        if ((w + add) * pt > R - L) break;
        w += add; k++;
      }
      if (k === start) return null;
      lines.push({ text: words.slice(start, k).join(' '), pt, cx, cy, L, R, w: w * pt, left: run.left, right: run.right });
      prev = pt;
      cx += wx * pt * PT * LINE_GAP; cy += wy * pt * PT * LINE_GAP;
    }
    return lines;
  };

  // One alignment for the whole block: against the figure where it holds the lines, else centred.
  const place = (lines) => {
    const holdR = lines.filter((l) => l.right === 'figure').length;
    const holdL = lines.filter((l) => l.left === 'figure').length;
    const side = holdR > lines.length / 2 && holdR > holdL ? 'right' : holdL > lines.length / 2 ? 'left' : 'centre';
    return lines.map((l) => {
      const s0 = side === 'right' ? l.R - l.w : side === 'left' ? l.L : (l.L + l.R) / 2 - l.w / 2;
      return { ...l, x: l.cx + ux * s0, y: l.cy + uy * s0 };
    });
  };

  const score = (lines) => {
    let chars = 0, ptSum = 0, bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity, loose = 0;
    const longest = Math.max(...lines.map((l) => l.w));
    lines.forEach((l, i) => {
      chars += l.text.length; ptSum += l.pt * l.text.length;
      const asc = 0.75 * l.pt * PT, desc = 0.25 * l.pt * PT;
      for (const [s, o] of [[0, -asc], [0, desc], [l.w, -asc], [l.w, desc]]) {
        const px = l.x + ux * s + wx * o, py = l.y + uy * s + wy * o;
        bx0 = Math.min(bx0, px); bx1 = Math.max(bx1, px); by0 = Math.min(by0, py); by1 = Math.max(by1, py);
      }
      // A line that leaves its stretch half empty, or is cut far shorter than the block, breaks the shape.
      if (i < lines.length - 1 && (l.w < 0.55 * (l.R - l.L) || l.w < 0.6 * longest)) loose++;
    });
    const aspect = (bx1 - bx0) / Math.max(1, by1 - by0);
    return ptSum / chars                                   // nearer, larger lettering first
      - 8 * Math.max(0, 1 - aspect)                        // wider than tall
      - 0.6 * loose                                        // lines that fill their stretch
      - 0.2 * lines.length
      - 1.5 * ((by0 - y0) / (y1 - y0));                    // among equals, higher up
  };

  let open = null, openScore = -Infinity;
  if (mode !== 'flow') {
    for (let ay = y0 + 4; ay < y1; ay += ANCHOR_STEP) {
      for (let ax = x0 + 2; ax < x1; ax += ANCHOR_STEP) {
        if (cellAt(ax, ay) !== 0) continue;
        const raw = layoutFrom(ax, ay);
        if (!raw) continue;
        const lines = place(raw);
        const sc = score(lines);
        if (sc > openScore) { openScore = sc; open = lines; }
      }
    }
  }

  // Flow: the lines run beside an element, each word at the size of the element's depth where it stands, so
  // the words shrink and the lines draw together toward the far end. Line j keeps its distance from the
  // element in proportion to the size there. Words may sit on the image; the more of it they cover (the
  // element itself aside), the worse the layout.
  // Depth along an element's axis, read from the image around it (a banner on the ground reads near, the
  // pole running away from it farther), smoothed over ±20 mm so the lines bend gently, never jitter.
  const profileOf = (el) => {
    const tLo = el.t0 - 1.6 * el.len, tHi = el.t1 + 0.3 * el.len, step = 2;
    const raw = [];
    for (let t = tLo; t <= tHi; t += step) {
      const f = figureNear(scene, el.cx + el.ux * t, el.cy + el.uy * t, 12);
      raw.push(Number.isNaN(f) ? el.a + el.b * t : f);
    }
    const smooth = raw.map((_, i) => {
      let s = 0, c = 0;
      for (let d = -10; d <= 10; d++) if (raw[i + d] !== undefined) { s += raw[i + d]; c++; }
      return s / c;
    });
    return (t) => {
      const f = Math.min(smooth.length - 1, Math.max(0, (t - tLo) / step));
      const i = Math.floor(f), g = f - i;
      return Math.min(1, Math.max(0, smooth[i] * (1 - g) + (smooth[Math.min(smooth.length - 1, i + 1)] ?? smooth[i]) * g));
    };
  };

  // side 1 = the lines hang under the element, the first against it; side -1 = they stand on it, the last
  // against it (so the lesson still reads top to bottom): `lines` = how many there will be, for side -1.
  const flowFrom = (el, profile, side, tStart, lines) => {
    const nx = -el.uy, ny = el.ux;                                      // the normal, below the text
    const ptAt = (t) => ptFor(profile(t));
    const lead = side > 0 ? 0.8 : 0.3;
    const off = (j, t) => {
      const rank = side > 0 ? j : lines - 1 - j;                        // lines out from the element
      return side * (el.half + (lead + rank * FLOW_GAP) * ptAt(t) * PT);
    };
    const base = (j, t) => [el.cx + el.ux * t + nx * off(j, t), el.cy + el.uy * t + ny * off(j, t)];
    const tEnd = el.t1 + 0.25 * el.len;
    const runs = [];
    let k = 0, j = 0, samples = 0, over = 0, chars = 0, ptSum = 0;
    while (k < words.length) {
      if (side < 0 && j >= lines) return null;
      const first = k;
      let t = tStart;
      while (k < words.length) {
        const pt = ptAt(t);
        const [bx, by] = base(j, t), [bx2, by2] = base(j, t + 1);
        const dl = Math.hypot(bx2 - bx, by2 - by), dx = (bx2 - bx) / dl, dy = (by2 - by) / dl;
        const w = wordW[k] * pt;
        if (t + w / dl > tEnd || t + w / dl - tStart > MAX_LINE) break;
        let inside = true, onImage = false;
        for (const s of [0, w / 2, w]) {
          for (const o of [-0.75 * pt * PT, -0.35 * pt * PT, 0, 0.2 * pt * PT]) {
            const x = bx + dx * s - dy * o, y = by + dy * s + dx * o;
            if (x < x0 || x >= x1 || y < y0 || y >= y1) { inside = false; break; }
            const i = Math.floor((y - y0) / cell) * cols + Math.floor((x - x0) / cell);
            samples++;
            if (scene.solid[i]) { onImage = true; if (!scene.thin[i]) over++; }
          }
          if (!inside) break;
        }
        if (!inside) break;
        runs.push({ text: words[k], pt, x: bx, y: by, angle: -(Math.atan2(dy, dx) * 180) / Math.PI, halo: onImage });
        chars += words[k].length; ptSum += pt * words[k].length;
        k++;
        t += (w + spaceW * pt) / dl;
      }
      if (k === first) return null;                                     // not one word fits on this line
      j++;
    }
    if (side < 0 && j !== lines) return null;
    return { runs, score: ptSum / chars - 3 * (over / Math.max(1, samples)) - 0.2 * j };
  };

  let flow = null, flowScore = -Infinity;
  if (mode !== 'open') {
    for (const el of scene.elements || []) {
      const profile = profileOf(el);
      for (let tStart = el.t0 - 1.5 * el.len; tStart <= el.t0 + 0.2 * el.len; tStart += ANCHOR_STEP) {
        const tries = [flowFrom(el, profile, 1, tStart, 0)];
        for (let n = 1; n <= 12; n++) tries.push(flowFrom(el, profile, -1, tStart, n));
        for (const f of tries) if (f && f.score > flowScore) { flowScore = f.score; flow = f.runs; }
      }
    }
  }

  if (flow && (mode === 'flow' || flowScore > openScore)) return { mode: 'flow', runs: flow };
  if (!open) return null;
  return { mode: 'open', runs: open.map((l) => ({ text: l.text, pt: l.pt, x: l.x, y: l.y, angle: -axis.angle, halo: false })) };
}

/**
 * Draw a laid-out lesson: in `ink`, each word that sits on the image with a dark edge in `halo` first.
 * @param {import('jspdf').jsPDF} pdf
 * @param {{ runs: object[] }} lesson  from layoutLesson
 * @param {{ ink: number[], halo: number[] }} colors  RGB
 */
export function drawLesson(pdf, lesson, { ink, halo }) {
  pdf.setFont('helvetica', 'italic');
  pdf.setLineJoin('round');
  for (const r of lesson.runs) {
    pdf.setFontSize(r.pt);
    if (r.halo) {
      pdf.setDrawColor(...halo);
      pdf.setLineWidth(r.pt * 0.08);
      pdf.text(r.text, r.x, r.y, { angle: r.angle, renderingMode: 'stroke' });
    }
    pdf.setTextColor(...ink);
    pdf.text(r.text, r.x, r.y, { angle: r.angle, renderingMode: 'fill' });
  }
  pdf.setLineJoin('miter');                                             // the PDF default, for what follows
}
