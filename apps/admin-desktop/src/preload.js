/**
 * The management app's bridge: only the session hand-over for the private update feed, and the update
 * status. No file system, no shell.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gflAdmin', {
  /** Give the updater the session token after login (null on logout). */
  setSession: (token) => ipcRenderer.invoke('session:set', token || null),
  update: {
    status: () => ipcRenderer.invoke('update:status'),
    install: () => ipcRenderer.invoke('update:install'),
    onStatus: (fn) => {
      const handler = (_e, s) => fn(s);
      ipcRenderer.on('update:status', handler);
      return () => ipcRenderer.removeListener('update:status', handler);
    },
  },
});
