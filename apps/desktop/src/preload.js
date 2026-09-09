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

contextBridge.exposeInMainWorld('gfl', {
  /** { version, platform, apiOrigin } */
  info: () => ipcRenderer.invoke('app:info'),

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
    /** Save a report PDF. The filename comes from the clock, not the caller. */
    save: (pdfBase64) => ipcRenderer.invoke('reports:save', pdfBase64),

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
