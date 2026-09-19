/**
 * The local workstation, seen from the platform (docs/LOCAL_WORKSTATION_CONTRACT.md).
 *
 * Personal data — the report PDFs, the full profile, tool output — lives in one folder on the
 * user's own machine. The folder is reached ONLY through the desktop app's bridge (window.gfl,
 * apps/desktop/src/preload.js). A plain browser has no folder access at all, so there every
 * tool that works with personal data stays locked and the page offers the app instead.
 *
 * A folder belongs to exactly one account (manifest.accountId, bound at the moment the user
 * chooses it). "Ready" therefore means: we are in the app, a folder is connected, AND it is
 * bound to the account that is logged in. Anything else keeps the tools locked.
 */

/**
 * Installer artefacts on Cloudflare R2 (Pages caps single files at 25 MB; the installers are
 * ~80–100 MB). Filenames must match apps/desktop/electron-builder.yml artifactName.
 * `available` stays false until the installers are actually uploaded — a download button that
 * 404s is worse than one that says "not yet".
 */
export const DESKTOP_RELEASE = {
  // Per platform: flip each one only once its installer is actually on R2.
  available: { win: true, macArm: false, macIntel: false, linux: false },
  version: '0.1.6',
  base: 'https://downloads.gardenforlife.nl',
  file: {
    win: (v) => `GardenForLife-Setup-${v}.exe`,
    macArm: (v) => `GardenForLife-${v}-arm64.dmg`,
    macIntel: (v) => `GardenForLife-${v}-x64.dmg`,
    linux: (v) => `GardenForLife-${v}.AppImage`,
  },
};

export const isDesktopApp = () => typeof window !== 'undefined' && !!window.gfl;

/** Best guess at which build this visitor wants. Wrong guesses cost only a second click. */
export function detectPlatform() {
  if (typeof navigator === 'undefined') return 'win';
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  if (/Mac/i.test(platform) || /Mac OS X/i.test(ua)) {
    // Apple Silicon reports as Intel in the UA string; the core count is the usual tell.
    return (navigator.hardwareConcurrency || 0) >= 8 ? 'macArm' : 'macIntel';
  }
  if (/Linux/i.test(platform) && !/Android/i.test(ua)) return 'linux';
  return 'win';
}

export const DESKTOP_PLATFORMS = ['win', 'macArm', 'macIntel', 'linux'];

/** { platform, fileName, href, available } for this visitor's build (or the one they picked). */
export function desktopDownload(chosen) {
  const platform = DESKTOP_PLATFORMS.includes(chosen) ? chosen : detectPlatform();
  const make = DESKTOP_RELEASE.file[platform];
  const fileName = make ? make(DESKTOP_RELEASE.version) : null;
  return {
    platform,
    fileName,
    href: fileName ? `${DESKTOP_RELEASE.base}/${fileName}` : null,
    available: !!(DESKTOP_RELEASE.available && DESKTOP_RELEASE.available[platform]) && !!fileName,
    version: DESKTOP_RELEASE.version,
  };
}

// ── Status ─────────────────────────────────────────────────────────────────────

const CHANGED = 'gfl:workspace-changed';

/** Tell every mounted listener (locks, reminder, Werkruimte tab) that the folder state moved. */
export const announceWorkspaceChange = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGED));
};

/** Subscribe to folder-state changes. Returns the unsubscribe function. */
export function onWorkspaceChange(fn) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGED, fn);
  return () => window.removeEventListener(CHANGED, fn);
}

/**
 * Where this account stands with its folder:
 *   { inApp:false }                                  — a browser; tools locked, offer the app
 *   { inApp:true, connected:false, error }           — the app, no folder chosen yet
 *   { inApp:true, connected:true, unlinked:true }    — a folder, not yet bound to an account
 *   { inApp:true, connected:true, foreign:true }     — a folder bound to someone else
 *   { inApp:true, connected:true, ready:true }       — this account's folder
 */
export async function getWorkspaceStatus(accountId) {
  if (!isDesktopApp()) return { inApp: false, connected: false, ready: false };
  const s = await window.gfl.workspace.status();
  if (!s || !s.connected) return { inApp: true, connected: false, ready: false, error: (s && s.error) || null };
  const id = accountId != null ? String(accountId) : '';
  const bound = s.accountId ? String(s.accountId) : '';
  return {
    inApp: true,
    connected: true,
    root: s.root,
    schemaVersion: s.schemaVersion,
    folderId: s.folderId,
    accountId: bound || null,
    unlinked: !bound,
    foreign: !!bound && !!id && bound !== id,
    ready: !!bound && !!id && bound === id,
  };
}

// ── Actions ────────────────────────────────────────────────────────────────────

/** File/Blob → base64 (no data: prefix), for the bridge. */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error || new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

/**
 * The render-only mirror of the account (contract §2 profile/partial.json): what the server
 * keeps for the network layer, nothing more — no email, no credentials.
 */
export function partialFromAccount(me) {
  const hist = Array.isArray(me && me.orbHistory) ? me.orbHistory : [];
  return {
    schema: 'partialProfile.v1',
    accountId: me && me.id != null ? String(me.id) : null,
    displayName: (me && (me.visibleName || me.displayName)) || '',
    archetypeName: (me && me.archetypeName) || '',
    age: me && me.age != null ? me.age : null,
    country: (me && me.country) || '',
    orb: (me && me.orb) || null,
    readings: hist.map((h) => ({ at: h.at || null, archetypeName: h.archetypeName || '', orb: h.orb || null, baskets12: h.baskets12 || null })),
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Bind the connected folder to this account. Throws the app's own message when the folder
 * already belongs to someone else.
 */
export async function linkWorkspace(accountId) {
  if (!isDesktopApp()) throw new Error('The folder is only reachable from the desktop app');
  const result = await window.gfl.workspace.linkAccount(String(accountId));
  announceWorkspaceChange();
  return result;
}

/**
 * Make sure a logged-in account in the app has ITS folder, without asking anything. The app creates
 * <home>/Garden For Life on first start (apps/desktop/src/main.js); here it gets bound to the account:
 *   unlinked → bind it to this account
 *   foreign  → the folder belongs to someone else on this computer: switch to (or create) this
 *              account's own folder, "Garden For Life 2" and so on
 * A folder that is missing (moved outside the app, a drive not plugged in) is left alone — the
 * Werkruimte tab offers to reconnect it or make a new one, so nothing silently starts over.
 * Returns the status after the fix-up.
 */
export async function ensureWorkspace(accountId) {
  const status = await getWorkspaceStatus(accountId);
  if (!status.inApp || !accountId || !status.connected) return status;
  if (status.unlinked) {
    await window.gfl.workspace.linkAccount(String(accountId));
  } else if (status.foreign) {
    await window.gfl.workspace.create(String(accountId));
  } else {
    return status;
  }
  announceWorkspaceChange();
  return getWorkspaceStatus(accountId);
}

/** A new folder of this account's own, in the home folder (connected and bound). */
export async function createWorkspace(accountId) {
  if (!isDesktopApp()) throw new Error('The folder is only reachable from the desktop app');
  const result = await window.gfl.workspace.create(String(accountId));
  announceWorkspaceChange();
  return result;
}

/** Move the folder to a location the user picks (the app verifies the copy before removing the original). */
export async function moveWorkspace() {
  if (!isDesktopApp()) throw new Error('The folder is only reachable from the desktop app');
  const result = await window.gfl.workspace.move();
  announceWorkspaceChange();
  return result;
}

/**
 * Right after the account exists, in the app: its folder (created by the app, bound here), the report
 * the user just uploaded into profile/reports, and the partial profile mirror — no questions asked.
 */
export async function connectWorkspace({ accountId, reportFile = null, reportLabel = '', account = null }) {
  if (!isDesktopApp()) throw new Error('The folder is only reachable from the desktop app');
  let status = await ensureWorkspace(accountId);
  if (!status.connected) {
    await window.gfl.workspace.create(String(accountId));
    status = await getWorkspaceStatus(accountId);
  }
  if (!status.ready) throw new Error('The folder could not be prepared');
  let report = null;
  if (reportFile) report = await window.gfl.reports.save(await fileToBase64(reportFile), reportLabel);
  if (account) await window.gfl.profile.write(partialFromAccount(account));
  announceWorkspaceChange();
  return { connected: true, root: status.root, report };
}

/** Save a report PDF into this account's folder, if it is ready. Resolves null when it is not. */
export async function saveReportIfReady({ accountId, file, label }) {
  const status = await getWorkspaceStatus(accountId);
  if (!status.ready || !file) return null;
  const saved = await window.gfl.reports.save(await fileToBase64(file), label || '');
  announceWorkspaceChange();
  return saved;
}

// ── Navigation to a profile-dashboard tab ──────────────────────────────────────

const OPEN_TAB = 'gfl:open-dashboard-tab';
let pendingTab = null;

/**
 * Ask the profile dashboard to show one of its tabs ('werkruimte', 'instellingen', …). A mounted
 * dashboard switches at once; one that mounts later picks the request up via takePendingDashboardTab().
 */
export function requestDashboardTab(tab) {
  pendingTab = tab;
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(OPEN_TAB, { detail: tab }));
}

export function takePendingDashboardTab() {
  const was = pendingTab;
  pendingTab = null;
  return was;
}

export function onDashboardTabRequest(fn) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e) => { pendingTab = null; fn(e.detail); };
  window.addEventListener(OPEN_TAB, handler);
  return () => window.removeEventListener(OPEN_TAB, handler);
}

/** The Werkruimte tab (locks, login reminder, welcome message). */
export const requestWorkspaceTab = () => requestDashboardTab('werkruimte');
