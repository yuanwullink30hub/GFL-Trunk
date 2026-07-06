// Shared per-frame renderer for the liquid-crystal orb pattern. Pure: the caller owns the
// canvas, the animation clock (`t`), and the rAF/throttle. Used by both the 2D <OrbCanvas>
// and — as a live CanvasTexture source — the 3D <OrbSphere>.

// ── colour helpers (verbatim from orb_encoder.html) ──
export function hexToRgb(hex) {
  const h = String(hex || '#000').replace('#', '');
  const n = parseInt(h, 16);
  if (h.length === 3) return { r: ((n >> 8) & 0xf) * 17, g: ((n >> 4) & 0xf) * 17, b: (n & 0xf) * 17 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const lerp = (a, b, t) => (1 - t) * a + t * b;
function interp5(cols, t) {
  const ct = Math.max(0, Math.min(1, t));
  const st = ct * (cols.length - 1);
  const i = Math.floor(st), f = st - i;
  if (i >= cols.length - 1) return cols[cols.length - 1];
  const a = cols[i], b = cols[i + 1];
  return { r: Math.round(lerp(a.r, b.r, f)), g: Math.round(lerp(a.g, b.g, f)), b: Math.round(lerp(a.b, b.b, f)) };
}

const BLOOM_CYCLE = 24.0, ROSE_K = 5, ROSE_LAYERS = 3;

/**
 * Draw ONE frame of the orb pattern into a 2D context at animation time `t`.
 * @param shading  bake the fake spherical shading (2D path). Pass false for the 3D sphere,
 *                 where real lights + fresnel do the shading.
 */
export function renderOrbFrame(ctx, config, W, H, t, shading = true) {
  const cx = W / 2, cy = H / 2, maxR = Math.min(W, H) * 0.5;
  const FILL = 1.35; // scale the inner pattern up so it bleeds off the clipped edge
  if (!config) { ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, W, H); return; }
  const parsed = config.colors.map(hexToRgb);

  // Soft-knee on the high end of the intensity levers (calm the top of the range).
  const tension = config.nematicTension <= 3 ? config.nematicTension : 3 + (config.nematicTension - 3) * 0.45;
  const pitch = config.chiralPitch <= 2.4 ? config.chiralPitch : 2.4 + (config.chiralPitch - 2.4) * 0.5;
  const glow = config.glowIntensity * 1.25;              // baseline glow boosted +25%
  const R = config.radialStructure ?? 0;
  const ringExp = Math.pow(2.4, -R);   // ring rf warp exponent (r<0 inward, r>0 outward)
  const fiberExp = Math.pow(2.0, -R);  // fiber sf warp exponent (gentler)
  const bEff = 2.75 + (config.birefringence - 2.75) * 1.6; // birefringence amplified around mid

  let bloomAmt = 0;
  if (config.bloom) {
    const ph = ((t / (config.flowSpeed || 0.45)) % BLOOM_CYCLE) / BLOOM_CYCLE;
    bloomAmt = Math.exp(-Math.pow(ph - 0.5, 2) / (2 * 0.045 * 0.045));
  }

  // Drift the focal centre in a slow elliptical orbit + a gentle global spin.
  const wob = maxR * 0.13;
  const wx = cx + Math.cos(t * 0.23) * wob, wy = cy + Math.sin(t * 0.31) * wob * 0.7;
  const gRot = t * 0.06;

  ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, maxR, 0, Math.PI * 2); ctx.clip();

  const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  gg.addColorStop(0, config.colors[1] + '11'); gg.addColorStop(0.3, config.colors[2] + '22');
  gg.addColorStop(0.6, config.colors[3] + '11'); gg.addColorStop(1, config.colors[4] + '00');
  ctx.fillStyle = gg; ctx.fillRect(cx - maxR, cy - maxR, maxR * 2, maxR * 2);

  const numRings = Math.floor(12 + (config.primaryFreq + config.secondaryFreq) * 1.5);
  const subMode = Math.max(1, Math.round(config.cymaticMode / 2));
  for (let k = 1; k <= numRings; k++) {
    const rf = Math.pow(k / numRings, ringExp), baseR = rf * maxR * FILL; if (baseR < 10) continue;
    const seg = Math.floor(30 + rf * 40); ctx.beginPath();
    for (let i = 0; i <= seg; i++) {
      const ang = (i / seg) * Math.PI * 2;
      const cym = Math.sin(config.primaryFreq * rf * Math.PI - t) * Math.cos(config.cymaticMode * ang + t * 0.4);
      const harm = Math.cos(config.secondaryFreq * (1 - rf) * Math.PI + t * 0.7) * Math.sin(subMode * ang - t * 0.2);
      let cr = baseR + (6 + baseR * 0.08) * (cym + harm * 0.5);
      if (bloomAmt > 0.01) {
        let rose = 0;
        for (let L = 0; L < ROSE_LAYERS; L++) {
          const off = L * (Math.PI / ROSE_LAYERS), layerScale = 1 - L * 0.18;
          rose += Math.abs(Math.cos(ROSE_K * (ang + off) + t * 0.15)) * layerScale;
        }
        rose /= ROSE_LAYERS;
        const roseR = maxR * FILL * (0.25 + 0.7 * rf) * (0.45 + 0.55 * rose);
        cr = cr * (1 - bloomAmt) + roseR * bloomAmt;
      }
      const warp = tension * Math.sin(pitch * Math.PI * rf - t * 0.5) * (1 - bloomAmt * 0.85);
      const fa = ang + warp + gRot, x = wx + Math.cos(fa) * cr, y = wy + Math.sin(fa) * cr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    const dir = config.anisotropyAngle + tension * Math.cos(pitch * Math.PI * rf - t * 0.2);
    const ext = Math.pow(Math.sin(2 * (dir - config.anisotropyAngle)), 2);
    const c = interp5(parsed, (rf * bEff + 0.1 * Math.sin(t)) % 1);
    const alpha = (0.05 + 0.55 * ext) * (1 - rf * 0.4) * glow;
    const mw = config.seamSharpness * (1.2 - rf * 0.5);
    if (glow > 0.05) { ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha * 0.35})`; ctx.lineWidth = mw * 3; ctx.stroke(); }
    ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`; ctx.lineWidth = mw; ctx.stroke();
  }

  const nf = config.weaveDensity;
  const fiberStep = Math.max(1, Math.ceil(nf / 320)); // cap rendered fibers (~320)
  for (let j = 0; j < nf; j += fiberStep) {
    const sa = (j / nf) * Math.PI * 2;
    const ld = sa + tension * Math.cos(pitch * Math.PI * 0.5 - t);
    const eb = Math.pow(Math.sin(2 * (ld - config.anisotropyAngle)), 2);
    const ba = (0.04 + 0.28 * eb) * glow; if (ba < 0.015) continue;
    ctx.beginPath(); ctx.moveTo(wx, wy);
    for (let s = 1; s <= 12; s++) {
      const sf = Math.pow(s / 12, fiberExp), r = sf * maxR * FILL;
      const sw = tension * Math.sin(pitch * Math.PI * sf - t);
      const rip = 0.15 * Math.sin(config.primaryFreq * sf * Math.PI - t * 1.5) * Math.cos(config.cymaticMode * sa);
      const ca = sa + sw + rip + gRot; ctx.lineTo(wx + Math.cos(ca) * r, wy + Math.sin(ca) * r);
    }
    const fc = interp5(parsed, ((j / nf) * 2 + bEff * 0.8 + 0.15 * Math.sin(t * 0.8)) % 1);
    const fw = config.seamSharpness * 0.75;
    if (glow > 0.05) { ctx.strokeStyle = `rgba(${fc.r},${fc.g},${fc.b},${ba * 0.3})`; ctx.lineWidth = fw * 2.5; ctx.stroke(); }
    ctx.strokeStyle = `rgba(${fc.r},${fc.g},${fc.b},${ba})`; ctx.lineWidth = fw; ctx.stroke();
  }
  ctx.restore();

  if (!shading) return; // 3D path: real lights + fresnel handle the sphere read

  // ── baked spherical shading: read the flat disc as a lit 3D sphere (2D path) ──
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, maxR, 0, Math.PI * 2); ctx.clip();
  const lx = cx - maxR * 0.34, ly = cy - maxR * 0.40;
  const diff = ctx.createRadialGradient(lx, ly, maxR * 0.12, lx, ly, maxR * 1.85);
  diff.addColorStop(0, 'rgba(0,0,0,0)'); diff.addColorStop(0.5, 'rgba(0,0,0,0)');
  diff.addColorStop(0.82, 'rgba(0,0,0,0.34)'); diff.addColorStop(1, 'rgba(2,1,6,0.7)');
  ctx.fillStyle = diff; ctx.fillRect(cx - maxR, cy - maxR, maxR * 2, maxR * 2);
  const term = ctx.createRadialGradient(cx + maxR * 0.5, cy + maxR * 0.55, maxR * 0.2, cx + maxR * 0.5, cy + maxR * 0.55, maxR * 1.25);
  term.addColorStop(0, 'rgba(0,0,0,0.32)'); term.addColorStop(0.6, 'rgba(0,0,0,0)');
  ctx.fillStyle = term; ctx.fillRect(cx - maxR, cy - maxR, maxR * 2, maxR * 2);
  const spec = ctx.createRadialGradient(lx, ly, 0, lx, ly, maxR * 0.72);
  spec.addColorStop(0, 'rgba(255,255,255,0.22)'); spec.addColorStop(0.32, 'rgba(255,255,255,0.05)'); spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = spec; ctx.fillRect(cx - maxR, cy - maxR, maxR * 2, maxR * 2);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}
