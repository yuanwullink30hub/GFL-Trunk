/**
 * The bridge this shell offers the management UI (preload.js + the IPC in main.js / updater.js), as one integer.
 *
 * A published UI build records the level it was built against (`requiresApi`, from this constant, written by
 * scripts/sync-ui.js); a shell runs a downloaded build only when its own level is at least that — a build that
 * needs more waits for the next installer and the installer's copy keeps running. Raise it whenever the UI
 * starts to rely on something new in preload.js. The UI should still feature-detect the bridge.
 *
 * Level 1 (0.1.13): setSession, update.status / check / install / onStatus, with `ui` in the status.
 */
module.exports = { SHELL_API_LEVEL: 1 };
