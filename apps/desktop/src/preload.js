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

// "Press Esc again to quit" — a small glass hint drawn by the preload (the DOM is shared with the page;
// nothing is exposed to it). Removed after 1.5 s, the window in which a second Esc quits.
ipcRenderer.on('app:esc-hint', () => {
  try {
    const nl = (localStorage.getItem('gfl_language_choice') || document.documentElement.lang || 'nl').startsWith('nl');
    document.getElementById('gfl-esc-hint')?.remove();
    const el = document.createElement('div');
    el.id = 'gfl-esc-hint';
    el.textContent = nl ? 'Druk nogmaals op Esc om af te sluiten' : 'Press Esc again to quit';
    el.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:6vh', 'transform:translateX(-50%)', 'z-index:2147483647',
      'padding:0.7rem 1.2rem', 'border-radius:0.5rem', 'pointer-events:none',
      'background:rgba(2,0,3,0.55)', 'backdrop-filter:blur(20px)', '-webkit-backdrop-filter:blur(20px)',
      'border:1px solid rgba(255,174,0,0.45)', 'box-shadow:0 0 20px rgba(255,174,0,0.15)',
      "font-family:'Lexend Mega',Arial,sans-serif", 'font-size:max(10px,0.5vw)', 'font-weight:700',
      'letter-spacing:0.12em', 'text-transform:uppercase', 'color:#ffae00',
    ].join(';');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  } catch { /* hint is cosmetic */ }
});

contextBridge.exposeInMainWorld('gfl', {
  /** { version, platform, apiOrigin } */
  info: () => ipcRenderer.invoke('app:info'),

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
