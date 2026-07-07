/**
 * Client mode — the persisted "crossed the line" flag.
 * =====================================================
 * ONE app, no second HTML. Presence of the user's LC_ORB code in localStorage IS client mode:
 * after account creation (or recognising a linked code) we store the code and hard-refresh
 * (location.reload) — App.jsx then boots in client mode: HoloEarth → the user's orb, sections
 * unlocked, the login slot becomes the account view. Clearing it (logout) returns to visitor mode.
 */
import { decodeOrb3 } from './orb';

const ORB_CODE_KEY = 'gfl_orb_code';
// The decoded (render-only) orb config, used when we DON'T have the raw code — e.g. email/password
// login, where the backend returns only the visual config (the code is the secret credential).
// Either key present ⇒ client mode.
const ORB_CONFIG_KEY = 'gfl_orb_config';
// Lightweight identity for the client-mode UI (verbindingsmenu shows it). Written at
// login/onboarding when we know the values (name + PDF archetype + country + age); read
// synchronously after the hard-refresh so the menu renders without an extra fetch.
const PROFILE_KEY = 'gfl_client_profile';

export function getClientOrbCode() {
  try { return localStorage.getItem(ORB_CODE_KEY) || ''; } catch { return ''; }
}

export function setClientOrbCode(code) {
  try { if (code) localStorage.setItem(ORB_CODE_KEY, String(code)); } catch { /* ignore */ }
}

/** Store a pre-decoded orb config (from email/password login, which never sees the raw code). */
export function setClientOrbConfig(config) {
  try { if (config) localStorage.setItem(ORB_CONFIG_KEY, JSON.stringify(config)); } catch { /* ignore */ }
}

/** Drop ONLY the raw code (keeps client mode via the stored config). Needed when the server
 *  has a newer active orb than the locally stored code decodes to — the code takes precedence
 *  in getClientOrbConfig, so a stale one must go for the adopted config to win. */
export function clearClientOrbCode() {
  try { localStorage.removeItem(ORB_CODE_KEY); } catch { /* ignore */ }
}

/** { displayName, archetypeName, country, age } — or null if none stored. */
export function getClientProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch { return null; }
}

export function setClientProfile(profile) {
  try { if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* ignore */ }
}

export function clearClientMode() {
  try {
    localStorage.removeItem(ORB_CODE_KEY);
    localStorage.removeItem(ORB_CONFIG_KEY);
    localStorage.removeItem(PROFILE_KEY);
  } catch { /* ignore */ }
}

export function isClientMode() {
  return !!getClientOrbConfig();
}

/** Decoded 3D orb render config — from the raw code (PDF login) or a stored config (email login). */
export function getClientOrbConfig() {
  const code = getClientOrbCode();
  if (code) {
    try { return decodeOrb3(code); } catch { /* fall through to stored config */ }
  }
  try {
    const raw = localStorage.getItem(ORB_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
