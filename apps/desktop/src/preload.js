/**
 * The bridge — the complete list of things the page may ask the machine to do.
 *
 * Read this file as the security contract. Note what is NOT here: there is no read(path),
 * no write(path), no list(path), no delete(path). An earlier version had them and an
 * adversarial review found twenty-two ways to abuse the path argument. Nothing the product
 * needs requires one, so the surface below names things instead of locating them — the
 * page asks for "the profile" or "this tool's state", never for a place on disk.
 *
 * The only caller-supplied identifiers that reach the filesystem are a tool id and a
 * report or output name, each validated as a single plain segment (paths.js).
 */
const { contextBridge, ipcRenderer } = require('electron');

// F9 (diagnosis): log which elements are stacked under a few points of the screen, with the style
// properties that decide whether they cover what is behind them. Goes to the local renderer log.
ipcRenderer.on('app:diagnose-layers', () => {
  try {
    const describe = (el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 4).join('.') : '';
      const backdrop = cs.backdropFilter && cs.backdropFilter !== 'none' ? ` backdrop=${cs.backdropFilter}` : '';
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''} z=${cs.zIndex} pos=${cs.position} op=${cs.opacity} vis=${cs.visibility} bg=${cs.backgroundColor}${cs.backgroundImage !== 'none' ? ' bgimg' : ''}${backdrop} mix=${cs.mixBlendMode} ${Math.round(r.width)}x${Math.round(r.height)}`;
    };
    const w = window.innerWidth;
    const h = window.innerHeight;
    const points = [['center', w / 2, h / 2], ['left', w * 0.25, h * 0.5], ['top', w / 2, h * 0.15], ['bottom-right', w * 0.85, h * 0.85]];
    for (const [name, x, y] of points) {
      const stack = document.elementsFromPoint(x, y).slice(0, 14).map(describe);
      console.warn(`[layers] ${name}:\n  ${stack.join('\n  ')}`);
    }
    const canvases = [...document.querySelectorAll('canvas')].map((c) => {
      const layer = c.closest('[data-gfl-layer]');
      return `${describe(c)} buffer=${c.width}x${c.height}${layer ? ' layer=' + layer.getAttribute('data-gfl-layer') : ''}`;
    });
    console.warn(`[layers] canvases (${canvases.length}):\n  ${canvases.join('\n  ')}`);
    // Frame rate over 3 s: average fps, slowest frame, frames over 50 ms.
    const times = [];
    const t0 = performance.now();
    const tick = (t) => {
      times.push(t);
      if (t - t0 < 3000) { requestAnimationFrame(tick); return; }
      const gaps = times.slice(1).map((v, i) => v - times[i]);
      const fps = (gaps.length / ((times[times.length - 1] - times[0]) / 1000)).toFixed(1);
      console.warn(`[layers] fps ${fps} · slowest ${Math.round(Math.max(...gaps))} ms · frames >50 ms: ${gaps.filter((g) => g > 50).length} of ${gaps.length}`);
    };
    requestAnimationFrame(tick);
  } catch (e) {
    console.warn('[layers] failed', e && e.message);
  }
});

contextBridge.exposeInMainWorld('gfl', {
  /** { version, platform, apiOrigin } */
  info: () => ipcRenderer.invoke('app:info'),

  /** Diagnosis switches from graphics-flags.json (usually empty). Read once at start. */
  graphicsFlags: (() => { try { return ipcRenderer.sendSync('app:graphics-flags') || {}; } catch { return {}; } })(),

  update: {
    /** { state: dev|idle|checking|current|downloading|ready|error, version, current, percent? } */
    status: () => ipcRenderer.invoke('update:status'),
    /** Look for a new version now. */
    check: () => ipcRenderer.invoke('update:check'),
    /** Restart into the downloaded version. Only does something when state is 'ready'. */
    install: () => ipcRenderer.invoke('update:install'),
    /** Subscribe to status changes. Returns the unsubscribe function. */
    onStatus: (fn) => {
      const handler = (_e, s) => fn(s);
      ipcRenderer.on('update:status', handler);
      return () => ipcRenderer.removeListener('update:status', handler);
    },
  },

  workspace: {
    /** Is a folder connected, which layout version, and did startup refuse it? */
    status: () => ipcRenderer.invoke('workspace:status'),

    /** Native folder picker. This is the user's grant; it cannot be widened afterwards. */
    choose: () => ipcRenderer.invoke('workspace:choose'),

    /** Forgets the path only. The folder and its contents stay on disk. */
    forget: () => ipcRenderer.invoke('workspace:forget'),

    /** Copy the whole folder into .backups/. The app names it; there is no label. */
    backup: () => ipcRenderer.invoke('workspace:backup'),

    /** Open the folder in Explorer/Finder so the user can see what they own. */
    reveal: () => ipcRenderer.invoke('workspace:reveal'),

    /** Bind the folder to this account. Refused if it already belongs to another one. */
    linkAccount: (accountId) => ipcRenderer.invoke('workspace:link-account', accountId),
  },

  profile: {
    /** The partial profile — the same shape the account renders from. */
    read: () => ipcRenderer.invoke('profile:read-partial'),
    write: (data) => ipcRenderer.invoke('profile:write-partial', data),

    /** The full computed profile, which exists only here and never on our servers. */
    readFull: () => ipcRenderer.invoke('profile:read-full'),
    writeFull: (data) => ipcRenderer.invoke('profile:write-full', data),
  },

  reports: {
    /**
     * Save a report PDF as <date>-<slug>.pdf. The label (e.g. the archetype name) only feeds
     * the slug, which the app derives; the date comes from the clock. Returns { saved, name }.
     */
    save: (pdfBase64, label) => ipcRenderer.invoke('reports:save', pdfBase64, label),

    /** [{ name, path }], newest first. */
    list: () => ipcRenderer.invoke('reports:list'),

    /** Read one report by the exact name list() returned. Returns { encoding, data }. */
    read: (name) => ipcRenderer.invoke('reports:read', name),
  },

  tools: {
    /** A tool's own saved state. Null when it has never run. */
    readState: (toolId) => ipcRenderer.invoke('tools:read-state', toolId),
    writeState: (toolId, data) => ipcRenderer.invoke('tools:write-state', toolId, data),

    /** A tool's output files — json, md, txt or csv. */
    writeOutput: (toolId, name, data) => ipcRenderer.invoke('tools:write-output', toolId, name, data),
    listOutput: (toolId) => ipcRenderer.invoke('tools:list-output', toolId),
  },

  consent: {
    /** The append-only ledger: what was granted, to which tool, when, what it sends. */
    list: () => ipcRenderer.invoke('consent:list'),

    /** Record a grant. A tool with no entry must not run. */
    grant: (entry) => ipcRenderer.invoke('consent:grant', entry),

    /** Delete the tool's data, then stamp the revocation. Fails loudly if it cannot. */
    revoke: (toolId) => ipcRenderer.invoke('consent:revoke', toolId),
  },
});
