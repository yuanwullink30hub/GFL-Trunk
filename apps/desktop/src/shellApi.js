/**
 * The bridge this shell offers the UI (preload.js + the IPC in main.js), as one integer.
 *
 * A published UI build records the level it was built against (`requiresApi`, taken from this constant by
 * scripts/publish-ui.js); a shell runs a downloaded build only when its own level is at least that — a
 * build that needs more waits for the app update and the installer's copy keeps running.
 * Raise it whenever the UI starts to rely on something new in preload.js / main.js. The UI should still
 * feature-detect the bridge (`window.gfl.x ? … : …`) — this is the safety net, not the only check.
 */
module.exports = { SHELL_API_LEVEL: 1 };
