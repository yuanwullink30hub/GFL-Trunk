/**
 * The bridge — the complete list of things the page is allowed to ask the machine to do.
 *
 * Nothing here takes a callback or exposes an ipcRenderer handle: each function is a
 * named operation with plain arguments, so the renderer can never reach a channel we
 * did not intend. Read this file as the security contract; if an operation isn't in it,
 * the UI cannot perform it.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gfl', {
  /** { version, platform, apiOrigin } */
  info: () => ipcRenderer.invoke('app:info'),

  workspace: {
    /** Is a folder connected, and which layout version does it carry? */
    status: () => ipcRenderer.invoke('workspace:status'),

    /** Opens the native folder picker. This is the user's grant — it cannot be widened later. */
    choose: () => ipcRenderer.invoke('workspace:choose'),

    /** Forgets the folder path. Does NOT delete the folder or anything in it. */
    forget: () => ipcRenderer.invoke('workspace:forget'),

    /** Read one file inside the folder. Returns { encoding, data } — base64 for PDFs. */
    read: (relPath) => ipcRenderer.invoke('workspace:read', relPath),

    /** Write one file inside the folder. Readable formats only; writes are atomic. */
    write: (relPath, data, encoding) => ipcRenderer.invoke('workspace:write', relPath, data, encoding),

    /** List a directory inside the folder. Dotfiles are omitted. */
    list: (relPath) => ipcRenderer.invoke('workspace:list', relPath),

    /** Delete a file or directory inside the folder. The root itself is refused. */
    remove: (relPath) => ipcRenderer.invoke('workspace:remove', relPath),

    /** Copy the whole folder into .backups/<timestamp>. Call before anything structural. */
    backup: (label) => ipcRenderer.invoke('workspace:backup', label),

    /** Open the folder in Explorer/Finder so the user can see what they own. */
    reveal: () => ipcRenderer.invoke('workspace:reveal'),
  },

  consent: {
    /** The append-only ledger: what was granted, to which tool, when, and what it sends. */
    list: () => ipcRenderer.invoke('consent:list'),

    /** Record a grant. A tool with no entry must not run. */
    grant: (entry) => ipcRenderer.invoke('consent:grant', entry),

    /** Stamp a revocation and delete that tool's directory. */
    revoke: (toolId) => ipcRenderer.invoke('consent:revoke', toolId),
  },
});
