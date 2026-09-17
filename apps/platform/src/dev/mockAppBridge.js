/**
 * Dev-only: an in-memory stand-in for the desktop app's display + settings bridge (window.gfl), for
 * ?appsettingspreview. Imported FIRST by the harness so appProfile.js sees an app when it evaluates.
 * Nothing here touches a real screen.
 */
const listeners = { pending: new Set(), settled: new Set() };
let state = { hz: 60, pending: null };
let settings = { graphics: 'high', startFullscreen: true };
const emit = (kind, payload) => listeners[kind].forEach((fn) => fn(payload));
const on = (kind) => (fn) => { listeners[kind].add(fn); return () => listeners[kind].delete(fn); };
const params = new URLSearchParams(window.location.search);

const settle = (keep) => {
  const p = state.pending;
  if (!p) return { ok: false };
  state = { hz: keep ? p.to : p.from, pending: null };
  emit('settled', { kept: keep, hz: state.hz });
  return { ok: true, kept: keep, hz: state.hz };
};

const start = (to, reason) => {
  state.pending = { from: state.hz, to, reason, deadline: Date.now() + 15000 };
  state.hz = to;
  emit('pending', state.pending);
  return { ok: true, pending: state.pending };
};

if (!window.gfl) {
  window.gfl = {
    graphicsFlags: {},
    settings: { initial: { ...settings }, get: async () => ({ ...settings }), set: async (patch) => (settings = { ...settings, ...patch }) },
    reload: async () => window.location.reload(),
    display: {
      describe: async () => ({ canChange: true, label: 'LHC9096', width: 2560, height: 1440, hz: state.hz, rates: [60, 120, 144, 165, 180] }),
      setRate: async (hz) => start(hz, 'settings'),
      keep: async () => settle(true),
      revert: async () => settle(false),
      pending: async () => state.pending,
      firstRunCheck: async () => (params.get('appsettingspreview') === 'firstrun' ? start(180, 'first-run') : { ok: true, skipped: 'done' }),
      onPending: on('pending'),
      onSettled: on('settled'),
    },
  };
}
