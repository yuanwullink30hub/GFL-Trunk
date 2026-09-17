/**
 * Graphics profile: website vs desktop app.
 *
 * The website is tuned for an unknown browser in a tab: free GPU memory whenever a surface leaves the
 * screen, cap the nebula's frame rate, keep heavy work off the main thread. Inside the app (window.gfl)
 * we are one known Chromium on the user's own machine, so memory is traded for smoothness, the way a
 * game keeps its scene loaded between rooms: 3D surfaces stay alive between pages (no WebGL context
 * rebuilt mid-pan) and the nebula draws every display frame.
 *
 * The user picks a quality preset in the dashboard (Instellingen → App → Grafische kwaliteit), stored per
 * machine by the app (settings.json) and read once at page start. Single values can still be overridden
 * for diagnosis, without a rebuild, in <userData>/graphics-flags.json → { "profile": { "nebulaFps": 49 } }.
 */

const gfl = typeof window !== 'undefined' ? window.gfl : undefined;

export const IN_APP = !!gfl;

const WEB = {
  /** Nebula frame cap. 0 = every display frame. */
  nebulaFps: 49,
  /** Nebula backing-store resolution relative to the screen (the soft clouds upscale invisibly). */
  nebulaRenderScale: 1,
  /** Globe frame cap while it animates. 0 = every display frame. */
  globeFps: 0,
  /** Keep WebGL canvases mounted (paused) when they leave the screen instead of destroying them. */
  keep3dAlive: false,
  /** Globe canvas size relative to its page cell. >1 leaves room for the globe to overhang during a pan. */
  globeCanvasScale: 2,
  /** Log per-pan frame timings and long main-thread tasks to the renderer log. */
  perfLog: false,
  /** Landing globe / orb keeps rendering through a pan (false: holds its last frame while it slides). */
  landingRendersDuringPan: true,
  /** Every map 3D scene renders during any pan (false: only the pan's source and destination). */
  panRendersAll3d: true,
};

const APP = {
  nebulaFps: 0,
  // 90%: the nebula is a full-screen shader, and at native resolution on a fast screen it was the whole
  // frame budget — on a 2560×1440 180 Hz machine the app idled at 82 fps and pans ran at 83, against
  // ~140 at 0.75. Lower measured better still and looked identical in a brightened side-by-side, but the
  // owner could see 0.6 on the real screen and picked 0.9 (2026-09-17): quality wins, since the freezes
  // were cured by the swap-chain fix, not by this, and 120 fps is all they asked for. Motion every frame.
  nebulaRenderScale: 0.9,
  globeFps: 0,
  keep3dAlive: true,
  // 125%: the globe and pyramid fit well inside their cell; 39% of the pixels of the website's 200%.
  globeCanvasScale: 1.25,
  perfLog: true,
  // The landing orb/globe keeps moving through a pan (owner, 2026-09-17: "let it keep moving at all times").
  landingRendersDuringPan: true,
  panRendersAll3d: false,
};

/**
 * Dashboard presets. Caps only bite on screens faster than the cap (a 60 fps cap changes nothing at 60 Hz).
 * All motion is time-based, so a capped scene moves at the same speed, just in fewer steps.
 */
export const GRAPHICS_PRESETS = {
  high: {},
  balanced: { nebulaFps: 60, globeFps: 60 },
  saver: { nebulaFps: 30, globeFps: 30, nebulaRenderScale: 0.5 },
};

/** The preset this page started with ('high' outside the app). */
export const GRAPHICS_PRESET = (() => {
  const chosen = gfl && gfl.settings && gfl.settings.initial && gfl.settings.initial.graphics;
  return Object.prototype.hasOwnProperty.call(GRAPHICS_PRESETS, chosen) ? chosen : 'high';
})();

function clampNumber(v, min, max, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function build() {
  if (!IN_APP) return WEB;
  const base = { ...APP, ...GRAPHICS_PRESETS[GRAPHICS_PRESET] };
  const o = (gfl.graphicsFlags && gfl.graphicsFlags.profile) || {};
  const bool = (key) => (typeof o[key] === 'boolean' ? o[key] : base[key]);
  return {
    nebulaFps: clampNumber(o.nebulaFps, 0, 240, base.nebulaFps),
    nebulaRenderScale: clampNumber(o.nebulaRenderScale, 0.5, 1, base.nebulaRenderScale),
    globeFps: clampNumber(o.globeFps, 0, 240, base.globeFps),
    keep3dAlive: bool('keep3dAlive'),
    globeCanvasScale: clampNumber(o.globeCanvasScale, 1, 2, base.globeCanvasScale),
    perfLog: bool('perfLog'),
    landingRendersDuringPan: bool('landingRendersDuringPan'),
    panRendersAll3d: bool('panRendersAll3d'),
  };
}

export const graphicsProfile = Object.freeze(build());

/**
 * App-only: long main-thread tasks (>50 ms) go to the renderer log with their time, so a hitch can be
 * told apart from a GPU/compositor stall (which shows as a slow frame without a long task).
 */
export function startPerfLog() {
  if (!graphicsProfile.perfLog || typeof PerformanceObserver === 'undefined') return;
  try {
    const obs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        console.warn(`[perf] long task ${Math.round(e.duration)} ms at ${Math.round(e.startTime)} ms`);
      }
    });
    obs.observe({ type: 'longtask', buffered: false });
  } catch { /* longtask not supported */ }
}

/**
 * App-only frame recorder for one animation (a map pan). Call frame(t) from its rAF callback and
 * end() when it finishes; the summary goes to the renderer log. The animation is also marked as a
 * User Timing measure, so it can be found in an F10 performance trace.
 */
export function frameRecorder(label) {
  if (!graphicsProfile.perfLog) return { frame() {}, end() {} };
  const times = [];
  const startMark = `${label} · start`;
  try { performance.mark(startMark); } catch { /* ignore */ }
  return {
    frame(t) { times.push(t); },
    end() {
      try { performance.measure(label, startMark); performance.clearMarks(startMark); } catch { /* ignore */ }
      if (times.length < 3) return;
      const gaps = times.slice(1).map((v, i) => v - times[i]);
      const span = (times[times.length - 1] - times[0]) / 1000;
      const slowest = Math.max(...gaps);
      console.warn(`[perf] ${label}: ${(gaps.length / span).toFixed(1)} fps · slowest ${Math.round(slowest)} ms at frame ${gaps.indexOf(slowest) + 1}/${gaps.length} · frames >25 ms: ${gaps.filter((g) => g > 25).length}`);
    },
  };
}
