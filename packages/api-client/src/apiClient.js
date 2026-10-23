/**
 * Garden For Life — Backend API Client
 *
 * Calls the Express backend (multi-provider AI proxy + auth + assessment).
 * All archetype/OCEAN profile data is sent from the frontend with each request.
 */

const API_BASE = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8080/api'
    : 'https://api.gardenforlife.nl/api');

// ── Token Management ──

const TOKEN_KEY = 'gfl_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  // Marks a login made during this launch of the desktop app (sessionStorage dies with the app).
  if (inDesktopApp()) { try { sessionStorage.setItem(LOGIN_ALIVE_KEY, '1'); } catch { /* ignore */ } }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Saved login (desktop application only) ──
// Browsers leave remembering to password managers. In the desktop app (its preload exposes
// window.gfl) the login form offers "Onthoudt mijn wachtwoord": ticked, the backend issues a 30-day
// session; unticked, the login ends when the app closes (clientMode.js expires it on the next launch).
// Nothing here stores the password — only the choice and the session token.
const REMEMBER_KEY = 'gfl_remember_login';
const LOGIN_ALIVE_KEY = 'gfl_login_alive';
const inDesktopApp = () => typeof window !== 'undefined' && !!window.gfl;

/** The app's "Onthoudt mijn wachtwoord" choice: ticked unless the user unticked it. Always false in a browser. */
export function getRememberLogin() {
  if (!inDesktopApp()) return false;
  try { return localStorage.getItem(REMEMBER_KEY) !== '0'; } catch { return true; }
}

export function setRememberLogin(remember) {
  if (!inDesktopApp()) return;
  try { localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0'); } catch { /* ignore */ }
}

/** True when a desktop login was not remembered and was made in an earlier launch — it has to end now. */
export function unrememberedLoginExpired() {
  if (!inDesktopApp() || getRememberLogin() || !getToken()) return false;
  try { return sessionStorage.getItem(LOGIN_ALIVE_KEY) !== '1'; } catch { return false; }
}

// ── Private report window ──
//
// While a test is being taken or its report is open, NO request may carry the login token. The
// report request itself is anonymous; an account call from the same browser in the same minutes
// (an inbox poll, a profile fetch) would let the server pair "this account" with "that report" by
// time and network address. So every token-bearing call is refused while the window is open, and
// background polls stay quiet for a random while after it closes (see backgroundAccountCallsAllowed).

export class PrivateWindowError extends Error {
  constructor() {
    super('Account requests are paused while a test or report is open');
    this.name = 'PrivateWindowError';
    this.privateWindow = true;
  }
}

let privateWindowDepth = 0;
let backgroundResumeAt = 0;

/**
 * Open the private window. Returns the release function (idempotent). Nested opens are counted,
 * so the window only closes when every opener has released.
 */
export function openPrivateWindow() {
  privateWindowDepth += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    privateWindowDepth = Math.max(0, privateWindowDepth - 1);
    // Random 1.5–4 minutes before background polls resume, so the first account call after the
    // report closes does not mark its end time.
    if (privateWindowDepth === 0) backgroundResumeAt = Date.now() + 90000 + Math.floor(Math.random() * 150000);
  };
}

/** Background (timer-driven) account calls: only outside the window and after its cool-down. */
export const backgroundAccountCallsAllowed = () => privateWindowDepth === 0 && Date.now() >= backgroundResumeAt;

function authHeaders() {
  const token = getToken();
  if (token && privateWindowDepth > 0) throw new PrivateWindowError();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** For sibling modules (toolTickets.js): the API base and the account headers (private-window aware). */
export const apiBaseUrl = () => API_BASE;
export const accountAuthHeaders = () => authHeaders();

// ── Auth ──

/**
 * A refusal from the rate limiter (429) as something a person can read. The server answers
 * { error: 'rate_limited' } — fine for code, not for a login form. The error carries
 * `.rateLimited = true` for callers that want to branch on it.
 */
function limitedError(response, message) {
  if (response.status !== 429) return null;
  const e = new Error(message);
  e.rateLimited = true;
  return e;
}

/**
 * Register a new account.
 * With email verification on (production) there is no token: `{ needsVerification: true, email, pollId }`
 * — the same answer whether or not the address already had an account. Poll verificationStatus(pollId).
 * @returns {Promise<{ token?: string, user?: { id, email, displayName }, needsVerification?: boolean, pollId?: string }>}
 */
export async function register({ email, password, displayName, age, country, orbCode, orbKey, archetypeName, reading }) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, age, country, orbCode, orbKey, archetypeName, reading, remember: getRememberLogin() }),
  });

  if (!response.ok) {
    const limited = limitedError(response, 'Te veel registraties vanaf deze verbinding. Probeer het over een uur opnieuw.');
    if (limited) throw limited;
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Registration failed (${response.status})`);
  }

  const data = await response.json();
  if (data.token) setToken(data.token);   // no token when the account still needs email verification
  return data;
}

/**
 * Whether the account a registration's pollId was issued for has confirmed its email yet. False for an
 * id that belongs to no account (the address already had one) — indistinguishable by design.
 * @returns {Promise<boolean>}
 */
export async function verificationStatus(pollId) {
  const response = await fetch(`${API_BASE}/auth/verify-status?id=${encodeURIComponent(pollId || '')}`);
  if (!response.ok) throw new Error(`Status check failed (${response.status})`);
  return (await response.json()).verified === true;
}

/**
 * Login with email + password.
 * Throws on failure. Every credential problem (unknown address, wrong password, email not confirmed
 * yet) is one and the same answer, so the error cannot say which.
 * @returns {Promise<{ token: string, user: { id, email, displayName } }>}
 */
export async function login({ email, password }) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, remember: getRememberLogin() }),
  });

  if (!response.ok) {
    // After too many wrong passwords the account is held for 15 minutes, whichever connection tries.
    const limited = limitedError(response, 'Te veel inlogpogingen. Probeer het over een kwartier opnieuw.');
    if (limited) throw limited;
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Login failed (${response.status})`);
  }

  const data = await response.json();
  setToken(data.token);
  return data;
}

/**
 * Get current authenticated user.
 * @returns {Promise<{ id, email, displayName, createdAt }>}
 */
export async function getMe() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }
    throw new Error('Failed to get user');
  }

  return response.json();
}

/**
 * Update the VISUAL NAME (editable anytime, must be globally unique). Auth required.
 * @returns {Promise<{ displayName: string }>}
 */
export async function updateDisplayName(name) {
  const response = await fetch(`${API_BASE}/auth/name`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Naam bijwerken mislukt (${response.status})`);
  }
  return response.json();
}

/**
 * Update profile fields (age, country, story, link, roleLine, languages, intention).
 * Only provided keys are changed. Auth required.
 * @returns {Promise<{ age?: number|null, country?: string, story?: string, link?: string, roleLine?: string, languages?: string[], intention?: string }>}
 */
export async function updateProfile({ age, country, story, link, roleLine, languages, intention, socials, visibleName, descriptionSections, intentionSections, listed }) {
  const response = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ age, country, story, link, roleLine, languages, intention, socials, visibleName, descriptionSections, intentionSections, listed }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Profiel bijwerken mislukt (${response.status})`);
  }
  return response.json();
}

/**
 * Fetch a profile-card payload (cardPayload.v1). With a handle: PUBLIC, no auth.
 * Without a handle: the authed owner's own card — byte-identical to the public
 * response for the same user (SR-5 owner symmetry). Renderers consume ONLY this.
 * @returns {Promise<{ schemaVersion, derived, declared }>}
 */
/**
 * Start OAuth ownership verification for a social platform. Auth required.
 * Returns { url } to open in a popup; 501 while the platform's app isn't configured.
 */
export async function startSocialVerify(platform) {
  const response = await fetch(`${API_BASE}/social/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ platform }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const e = new Error(err.error || `Synchronisatie starten mislukt (${response.status})`);
    e.status = response.status;
    throw e;
  }
  return response.json();
}

// ── Internal messages ──

/**
 * Send an internal message. `to` = the recipient's shown profile name (the addressing
 * scheme is resolved server-side and may change — treat it as an opaque address).
 * @returns {Promise<{ ok: true, id: string }>}
 */
export async function sendUserMessage({ to, title, body }) {
  const response = await fetch(`${API_BASE}/messages/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ to, title, body }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Versturen mislukt (${response.status})`);
  }
  return response.json();
}

/**
 * Fetch the authed user's inbox (newest first).
 * @returns {Promise<{ messages: Array<{ id, from, title, body, at, read }> }>}
 */
export async function getInbox() {
  const response = await fetch(`${API_BASE}/messages/inbox`, { headers: authHeaders() });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Berichten ophalen mislukt (${response.status})`);
  }
  return response.json();
}

/** Mark one of the authed user's messages as read. */
export async function markMessageRead(id) {
  const response = await fetch(`${API_BASE}/messages/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Bijwerken mislukt (${response.status})`);
  }
  return response.json();
}

/**
 * Public profiles directory — all profiles with openbaar AAN (lean summaries;
 * the full card stays behind getCard(handle)). No auth required.
 * @returns {Promise<{ profiles: Array<{ name, archetypeName, roleLine, country, memberSince, readingCount, orb }> }>}
 */
export async function getPublicProfiles() {
  const response = await fetch(`${API_BASE}/auth/profiles`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Profielen ophalen mislukt (${response.status})`);
  }
  return response.json();
}

// ── Verbonden (connection requests between public profiles) ──

/** "+ Verbond" — request a connection with a profile (by shown profile name). */
export async function requestVerbond(to) {
  const response = await fetch(`${API_BASE}/verbond/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ to }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const e = new Error(data.error || `Verzoek mislukt (${response.status})`);
    e.status = data.status; // 'pending' | 'accepted' when a verbond already exists
    throw e;
  }
  return data;
}

/** Incoming pending verbond requests — shown at Berichten. */
export async function getVerbondPending() {
  const response = await fetch(`${API_BASE}/verbond/pending`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Verzoeken ophalen mislukt (${response.status})`);
  return response.json();
}

/** Accept or decline a request. Decline REQUIRES a message (server enforces too). */
export async function respondVerbond({ id, accept, message }) {
  const response = await fetch(`${API_BASE}/verbond/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ id, accept, message }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Beantwoorden mislukt (${response.status})`);
  return data;
}

/** Accepted verbonden (both directions) — shown at Contacten. */
export async function getVerbondContacts() {
  const response = await fetch(`${API_BASE}/verbond/contacts`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Contacten ophalen mislukt (${response.status})`);
  return response.json();
}

/** My verbond status with one profile — drives the "+ Verbond" button state. */
export async function getVerbondWith(handle) {
  const response = await fetch(`${API_BASE}/verbond/with/${encodeURIComponent(handle)}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Status ophalen mislukt (${response.status})`);
  return response.json();
}

export async function getCard(handle) {
  const url = handle ? `${API_BASE}/auth/card/${encodeURIComponent(handle)}` : `${API_BASE}/auth/card`;
  const response = await fetch(url, handle ? undefined : { headers: authHeaders() });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Kaart ophalen mislukt (${response.status})`);
  }
  return response.json();
}

/**
 * Store a still image of the current orb (attached to the active orbHistory entry). Auth required.
 * The image is a data-URL (png/jpeg/webp). No-op server-side if that entry already has an image.
 * @returns {Promise<{ ok: true }>}
 */
export async function saveOrbSnapshot(image, readingIndex, force) {
  const response = await fetch(`${API_BASE}/auth/orb-snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ image, readingIndex, force }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Snapshot opslaan mislukt (${response.status})`);
  }
  return response.json();
}

/**
 * Change password (auth required). Requires the current password; the new one must pass the server's
 * policy (apps/backend/services/passwordPolicy.js: at least 10 characters and not easy to guess).
 * When SMTP is configured the change is gated behind an email confirmation link and is only
 * applied when that link is clicked — the response is { ok: true, pending: true } in that case,
 * or { ok: true, pending: false, token } when applied immediately (no SMTP / local dev). A change of
 * password ends every session; the fresh token keeps THIS device signed in, and is stored here.
 * @returns {Promise<{ ok: true, pending?: boolean }>}
 */
export async function updatePassword({ currentPassword, newPassword }) {
  const response = await fetch(`${API_BASE}/auth/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Wachtwoord bijwerken mislukt (${response.status})`);
  }
  const data = await response.json();
  if (data && data.token) setToken(data.token);
  return data;
}

/**
 * Confirm a pending password change via the one-time token from the email link
 * (frontend lands on /?pwverify=<token> and calls this). No auth. Applies the change.
 * @returns {Promise<{ ok: true }>}
 */
export async function verifyPasswordChange(token) {
  const response = await fetch(`${API_BASE}/auth/password/verify?token=${encodeURIComponent(token)}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Bevestiging mislukt (${response.status})`);
  }
  return response.json();
}

/**
 * "Forgot password": ask for a reset link. Resolves the same way whether or not the address has an
 * account — only the owner of the inbox learns which (the mail arrives or it does not).
 * @returns {Promise<{ ok: true }>}
 */
export async function requestPasswordReset(email) {
  const response = await fetch(`${API_BASE}/auth/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const limited = limitedError(response, 'Te veel aanvragen vanaf deze verbinding. Probeer het over een uur opnieuw.');
    if (limited) throw limited;
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Aanvraag mislukt (${response.status})`);
  }
  return response.json();
}

/**
 * Set a new password with the one-time token from the reset email (the site lands on /?pwreset=<token>).
 * No auth. Every session of the account ends; log in again with the new password.
 * @returns {Promise<{ ok: true }>}
 */
export async function resetPassword(token, password) {
  const response = await fetch(`${API_BASE}/auth/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  if (!response.ok) {
    const limited = limitedError(response, 'Te veel pogingen. Probeer het over een kwartier opnieuw.');
    if (limited) throw limited;
    const err = await response.json().catch(() => ({}));
    const e = new Error(err.error || `Wachtwoord instellen mislukt (${response.status})`);
    if (err.code) e.code = err.code;
    throw e;
  }
  return response.json();
}

/**
 * Request an email-address change. Requires the current password. When SMTP is on the server
 * emails a confirmation link to the NEW address and returns { ok, pending:true } — the account
 * email is NOT changed until that link is clicked. Without SMTP it applies immediately.
 * @returns {Promise<{ ok: true, pending: boolean, pendingEmail?: string, email?: string }>}
 */
export async function updateEmail({ newEmail, currentPassword }) {
  const response = await fetch(`${API_BASE}/auth/email`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ newEmail, currentPassword }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `E-mailadres bijwerken mislukt (${response.status})`);
  }
  return response.json();
}

/**
 * Confirm a pending email change via the one-time token from the email link
 * (frontend lands on /?emailverify=<token> and calls this). No auth. Applies the change.
 * @returns {Promise<{ ok: true }>}
 */
export async function verifyEmailChange(token) {
  const response = await fetch(`${API_BASE}/auth/email/verify?token=${encodeURIComponent(token)}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Bevestiging mislukt (${response.status})`);
  }
  return response.json();
}

/**
 * Logout — clear stored token.
 */
export function logout() {
  clearToken();
}

/**
 * Log out everywhere: every session of this account ends on the server — other browsers, the desktop
 * app, a lost phone — including this one, whose token is cleared as well.
 */
export async function logoutAll() {
  const response = await fetch(`${API_BASE}/auth/logout-all`, { method: 'POST', headers: authHeaders() });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Uitloggen op alle apparaten mislukt (${response.status})`);
  }
  clearToken();
  return response.json();
}

/**
 * Permanently delete the authenticated user's own account, all their
 * assessments, and all their assessment reviews (GDPR right-to-erasure).
 * Clears the stored token on success.
 * @returns {Promise<{ success: boolean, deletedAssessments: number, deletedReviews: number }>}
 */
export async function deleteOwnAccount() {
  const response = await fetch(`${API_BASE}/auth/account`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Account deletion failed (${response.status})`);
  }

  const data = await response.json();
  clearToken(); // account is gone — token is no longer valid
  return data;
}

// ── Assessment Persistence ──

/**
 * Discard an unpaid report: the server deletes the card draft keyed by the sealed crystal code
 * (only when that report was never unlocked). Fired while the page may be unloading, so it is a
 * keepalive request with a text/plain body — a CORS "simple" request that needs no preflight.
 * Fire-and-forget; the nightly sweep remains the fallback.
 */
export function discardUnpaidReport(sealedOrbCode) {
  if (!sealedOrbCode) return;
  try {
    fetch(`${API_BASE}/ai/discard`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain' },
      body: String(sealedOrbCode),
    }).catch(() => {});
  } catch (_) { /* ignore */ }
}

/**
 * Get assessment history for the current user.
 * @param {{ limit?: number, skip?: number }} [opts]
 */
export async function getHistory(opts = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', opts.limit);
  if (opts.skip) params.set('skip', opts.skip);

  const response = await fetch(`${API_BASE}/assessment/history?${params}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load history (${response.status})`);
  }

  return response.json();
}

/**
 * Get a single assessment by ID.
 */
export async function getAssessment(id) {
  const response = await fetch(`${API_BASE}/assessment/${id}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load assessment (${response.status})`);
  }

  return response.json();
}

/**
 * Call the AI analysis endpoint with streaming SSE progress.
 *
 * @param {Object} params - Assessment data (archetypeKey, supportArchetype, etc.)
 * @param {(stage: number, message: string) => void} [onProgress] - Progress callback (stage 1-3)
 * @returns {Promise<{ analysis, provider, model, promptTokens, completionTokens, ... }>}
 */
/**
 * @param {object} params
 * @param {(stage:number, message:string) => void} [onProgress]
 * @param {(profile:object) => void} [onProfile]  two-layer test: the server's one scoring result (Main, Support,
 *   totals, mandjes), sent before the model call — the results screen reads it; the browser never scores.
 */
export async function analyzeAssessment(params, onProgress, onProfile) {
  const response = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const limited = limitedError(response, 'Er zijn het afgelopen uur al meerdere rapporten vanaf deze verbinding gemaakt. Probeer het over een uur opnieuw.');
    if (limited) throw limited;
    // 413: the upload caps (apps/backend/services/uploadParser.js) — the picker checks them too.
    if (response.status === 413) throw new Error('Het geüploade bestand is te groot: maximaal 3 bestanden van 10 MB, samen 15 MB. Verwijder het of kies een kleiner bestand.');
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `API error ${response.status}`);
  }

  // Parse SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result = null;
  let pdfWarnings = [];
  let currentEventType = null;

  const handleEvent = (eventType, data) => {
    if (eventType === 'progress' && onProgress) {
      onProgress(data.stage, data.message);
    } else if (eventType === 'profile') {
      if (onProfile) onProfile(data);
    } else if (eventType === 'result') {
      result = data;
    } else if (eventType === 'error') {
      throw new Error(data.error || 'AI analysis failed');
    } else if (eventType === 'pdf_warning') {
      pdfWarnings = [...pdfWarnings, ...(data.files || [])];
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse complete SSE events from buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEventType = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        handleEvent(currentEventType, data);
        currentEventType = null;
      }
    }
  }

  // Parse any remaining data left in buffer after stream ends
  if (buffer.trim()) {
    const remaining = buffer.split('\n');
    for (const line of remaining) {
      if (line.startsWith('event: ')) {
        currentEventType = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        handleEvent(currentEventType, data);
        currentEventType = null;
      }
    }
  }

  if (!result) {
    throw new Error('No result received from AI analysis');
  }

  if (pdfWarnings.length > 0) {
    result.pdfWarnings = pdfWarnings;
  }

  return result;
}

/**
 * Fire-and-forget keepalive ping — keeps Render backend awake during assessment.
 */
export function pingBackend() {
  fetch(`${API_BASE}/ping`).catch(() => {});
}

/**
 * Can the server take a test right now (backend up and its database answering)? Resolves true or false, never
 * throws. The wait is long on purpose: a host waking from sleep (Render, ~1 min) answers late but answers.
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>}
 */
export async function checkServerHealth(timeoutMs = 75000) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
  try {
    const response = await fetch(`${API_BASE}/health`, { cache: 'no-store', credentials: 'omit', signal: ctl?.signal });
    // A backend from before this route answers 404: it is up, so a deploy that lands the platform first blocks nobody.
    if (response.status === 404) return true;
    if (!response.ok) return false;
    return (await response.json()).ok === true;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Get available AI providers and backend status.
 */
export async function getApiStatus() {
  const response = await fetch(`${API_BASE}/status`);
  if (!response.ok) throw new Error(`Status check failed: ${response.status}`);
  return response.json();
}

/**
 * Get list of configured AI providers.
 */
export async function getProviders() {
  const response = await fetch(`${API_BASE}/ai/providers`);
  if (!response.ok) throw new Error(`Providers check failed: ${response.status}`);
  return response.json();
}

// ── PDF ──

/**
 * Download a PDF for a saved assessment (triggers browser download).
 * @param {string} assessmentId
 */
export async function downloadPdf(assessmentId) {
  const response = await fetch(`${API_BASE}/pdf/${assessmentId}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`PDF download failed (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GFL-Assessment-${assessmentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Orb login (PDF code is the credential) ──

/**
 * Upload a report PDF; the backend extracts only the LC_ORB_ code and discards
 * the file. Returns { code }. No auth — the code itself is the login.
 */
export async function orbLoginFromPdf(file) {
  const pdfBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(String(e.target.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  // Signed in, the account goes along: re-uploading a report you already own then reads it back
  // (to add or refresh it) instead of being refused as "already linked".
  let auth = {};
  try { auth = authHeaders(); } catch { auth = {}; }
  const response = await fetch(`${API_BASE}/orb/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ pdfBase64, remember: getRememberLogin() }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const e = new Error(err.error || `Kon de code niet uit de PDF lezen (${response.status})`);
    if (err.useLogin) e.useLogin = true; // the code belongs to an account: sign in with email + password
    if (err.code) e.code = err.code;
    throw e;
  }
  return response.json();
}

/**
 * Link an LC_ORB code to the authenticated account (once). After linking, the code's
 * PDF-upload login is denied — the account becomes the credential. Auth required.
 * @returns {Promise<{ linked: boolean, alreadyOwned?: boolean }>}
 */
export async function orbLinkCode(code, archetypeName, reading, orbKey) {
  const response = await fetch(`${API_BASE}/orb/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ code, archetypeName, reading, ...(orbKey ? { orbKey } : {}) }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Koppelen mislukt (${response.status})`);
  }
  return response.json();
}

// ── Admin ──

/**
 * Get admin dashboard stats.
 * @returns {Promise<{ userCount, assessmentCount, recentAssessments }>}
 */
export async function getAdminStats() {
  const response = await fetch(`${API_BASE}/admin/stats`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Admin stats failed (${response.status})`);
  return response.json();
}

/**
 * List all users (admin only).
 */
export async function getAdminUsers(opts = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', opts.limit);
  if (opts.skip) params.set('skip', opts.skip);

  const response = await fetch(`${API_BASE}/admin/users?${params}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Admin users failed (${response.status})`);
  return response.json();
}

/**
 * Change a user's role (admin only).
 */
export async function setUserRole(userId, role) {
  const response = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Role change failed (${response.status})`);
  }
  return response.json();
}

/**
 * Delete a user and their assessments (admin only).
 * @param {string} userId
 */
export async function deleteUser(userId) {
  const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Delete user failed (${response.status})`);
  }
  return response.json();
}

/**
 * Get all assessments (admin only).
 */
export async function getAdminAssessments(opts = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', opts.limit);
  if (opts.skip) params.set('skip', opts.skip);

  const response = await fetch(`${API_BASE}/admin/assessments?${params}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Admin assessments failed (${response.status})`);
  return response.json();
}

/**
 * Get full assessment detail (admin — any user's assessment).
 * @param {string} id — assessment ObjectId
 */
export async function getAdminAssessment(id) {
  const response = await fetch(`${API_BASE}/admin/assessments/${id}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Assessment detail failed (${response.status})`);
  }
  return response.json();
}

/**
 * Delete an assessment (admin only).
 * @param {string} id — assessment ObjectId
 */
export async function deleteAssessment(id) {
  const response = await fetch(`${API_BASE}/admin/assessments/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Delete failed (${response.status})`);
  }
  return response.json();
}

// ── Assessment Reviews ──

/**
 * Submit a user review/feedback for an assessment.
 */
export async function submitAssessmentReview(data) {
  // Never sends the login token: a review is written right after a test, and a token here would
  // tie the account to that test's outcome and moment — the report must stay unlinkable.
  const response = await fetch(`${API_BASE}/assessment/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  return response.json();
}

/**
 * Report email for the chosen PDF kind ('short' | 'full') — fired when the user
 * clicks the download button, NOT when the gate email is entered.
 */
export async function sendReportEmail({ email, kind, archetypeKey, extendedArchetypeName }) {
  const response = await fetch(`${API_BASE}/assessment/report-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, kind, archetypeKey, extendedArchetypeName }),
  });
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  return response.json();
}

/**
 * Access/welcome email after the FULL (paid) report PDF download.
 * lang = language of the taken test ('nl' | 'en').
 */
export async function sendAccessEmail({ recipientEmail, archetypeName, lang }) {
  const response = await fetch(`${API_BASE}/ai/send-access-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientEmail, archetypeName, lang }),
  });
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  return response.json();
}

/**
 * Get all assessment reviews (admin only).
 * @param {Object} opts - Options (limit, skip, includeAssessment)
 */
export async function getAdminReviews(opts = {}) {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', opts.limit);
  if (opts.skip) params.set('skip', opts.skip);
  if (opts.includeAssessment) params.set('includeAssessment', 'true');

  const response = await fetch(`${API_BASE}/admin/reviews?${params}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Admin reviews failed (${response.status})`);
  return response.json();
}

/**
 * Get a Master Prompt record (admin only).
 * @param {'beginner'|'intermediate'|'advanced'} [slot='advanced']
 */
export async function getPromptConfig(slot = 'advanced') {
  const response = await fetch(`${API_BASE}/admin/prompts?slot=${encodeURIComponent(slot)}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Prompt config failed (${response.status})`);
  return response.json();
}

/**
 * Update a Master Prompt record (admin only).
 * @param {{ systemPromptTemplate?: string, temperature?: number }} config
 * @param {'beginner'|'intermediate'|'advanced'} [slot='advanced']
 */
export async function updatePromptConfig(config, slot = 'advanced') {
  const response = await fetch(`${API_BASE}/admin/prompts?slot=${encodeURIComponent(slot)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error(`Prompt update failed (${response.status})`);
  return response.json();
}

// ── Questions (stored in MongoDB, editable by admin) ──

/**
 * Fetch all assessment questions/layers from the backend.
 * Public endpoint — no auth required.
 * @returns {Promise<{ layers: Array, seeded: boolean }>}
 */
export async function getQuestions() {
  const response = await fetch(`${API_BASE}/questions`);
  if (!response.ok) throw new Error(`Questions fetch failed (${response.status})`);
  return response.json();
}

// ── The published questions file (owner, 14 Oct) ─────────────────────────────────────────────────────────────
// The backend writes it to R2 on every admin save (apps/backend/services/questionsPublisher.js), so the question
// cards load for every visitor whether or not the backend is up.
const QUESTIONS_FILE_URL = import.meta.env.VITE_QUESTIONS_URL || 'https://downloads.gardenforlife.nl/questions/questions.json';
const ON_LOCALHOST = typeof window !== 'undefined' && window.location.hostname === 'localhost';

/** The quarter label for now in Europe/Amsterdam, e.g. '2026-Q4' (as the backend's rotation sequence). */
function quarterNow() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: 'numeric' }).formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year').value;
  const month = Number(parts.find((p) => p.type === 'month').value);
  return `${year}-Q${Math.ceil(month / 3)}`;
}

let publishedFile = null; // one fetch per page load, shared by the two loaders below
function fetchPublishedQuestions() {
  if (!publishedFile) {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 10000) : null;
    publishedFile = fetch(QUESTIONS_FILE_URL, { cache: 'no-cache', signal: ctl?.signal })
      .then((r) => { if (!r.ok) throw new Error(`Questions file ${r.status}`); return r.json(); })
      .finally(() => { if (timer) clearTimeout(timer); })
      .catch((e) => { publishedFile = null; throw e; }); // a later call may try again
  }
  return publishedFile;
}

/**
 * The question layers ({ layers, seeded }), as GET /api/questions returns them. On the live site from the
 * published file first, the backend only as fallback (before the first publish); on localhost the local backend
 * first, so local edits show while developing.
 */
export async function loadQuestionLayers() {
  const fromFile = async () => { const f = await fetchPublishedQuestions(); return { layers: f.layers || [], seeded: Boolean(f.seeded) }; };
  const order = ON_LOCALHOST ? [getQuestions, fromFile] : [fromFile, getQuestions];
  try { return await order[0](); } catch { return order[1](); }
}

/**
 * The two-layer Leerling plan for this quarter, as GET /api/questions/two-layer returns it ({ enabled: false } when
 * that test is off). Same source order as loadQuestionLayers; from the file, the plan for this quarter's label.
 */
export async function loadTwoLayerPlan(level = 'leerling') {
  const fromFile = async () => {
    const f = await fetchPublishedQuestions();
    if (!f.twoLayer?.enabled) return { enabled: false };
    // Leerling is `plans` in every file; other levels sit in `plansByLevel` (Gevorderd since 21 Oct).
    const plans = level === 'leerling' ? f.twoLayer.plans : f.twoLayer.plansByLevel?.[level];
    const plan = plans?.[quarterNow()];
    if (!plan) throw new Error('No published plan for this quarter'); // file older than its quarters: ask the backend
    return plan;
  };
  const fromServer = () => getTwoLayerQuestions(level);
  const order = ON_LOCALHOST ? [fromServer, fromFile] : [fromFile, fromServer];
  try { return await order[0](); } catch { return order[1](); }
}

/**
 * The two-layer Leerling test: its bank in this quarter's rotation order. Public endpoint.
 * @returns {Promise<{ enabled: boolean, rotation_sequence_id?: string, placeholder?: boolean,
 *   subjects?: { subject: string, questions: object[] }[] }>}  `enabled: false` while the server has it off
 */
export async function getTwoLayerQuestions(level = 'leerling') {
  const response = await fetch(`${API_BASE}/questions/two-layer${level === 'leerling' ? '' : `?level=${encodeURIComponent(level)}`}`);
  if (!response.ok) throw new Error(`Two-layer questions fetch failed (${response.status})`);
  return response.json();
}

/**
 * N1 refusal free text (Privacy & Consent instruction §4.2): the opt-in consent text for the language.
 * Anonymous: no Authorization header, no cookies. Resolves null when the step is not offered (503: no
 * store configured; 404: no approved text for this language) — the caller then skips it silently.
 * @param {'nl'|'en'} lang
 * @returns {Promise<{version:string, title:string, body:string[], checkbox:string, skip:string, maxCards:number, retentionMonths:number}|null>}
 */
export async function getRefusalConsent(lang) {
  try {
    const response = await fetch(`${API_BASE}/refusal-text/consent?lang=${encodeURIComponent(lang)}`, { credentials: 'omit', cache: 'no-store' });
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

/**
 * N1: send the typed texts, with the consent version that was shown. Anonymous like the consent fetch: no
 * token, no cookies, no session id. Each text links only to its question's bank id (owner, 13 Oct) — no
 * position, slot or groups. Never throws; declining or a failure changes nothing for the test or the report.
 * @param {string} consentVersion
 * @param {{question_id:string, text:string}[]} cards  1–5, one per question, each text at most 2000 characters
 * @returns {Promise<boolean>} true when the server took them (204)
 */
export async function submitRefusalTexts(consentVersion, cards) {
  try {
    const response = await fetch(`${API_BASE}/refusal-text`, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent: true, consentVersion, cards: cards.map(({ question_id, text }) => ({ question_id, text })) }),
    });
    return response.status === 204;
  } catch {
    return false;
  }
}

// ── The two-layer question bank editor (admin) ──

async function bankRequest(path, init = {}) {
  const response = await fetch(`${API_BASE}/questions/bank/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(body.error || `Question bank request failed (${response.status})`);
    err.status = response.status;
    if (body.current) err.current = body.current;   // 409: the draft as it is stored now
    if (body.problems) err.problems = body.problems; // 400 on publish: what is still empty
    throw err;
  }
  return body;
}

/**
 * A level's question bank drafts (admin): { level, groups, archetypes, questions, published, serving }.
 * Each question: { question_id, subject, position, text, l1 {group: text}, l2 {archetype: text}, version, live }.
 */
export function getQuestionBank(level) {
  return bankRequest(encodeURIComponent(level));
}

/**
 * Save part of one question, pinned to the version the editor last saw:
 * patch = { text } | { l1: { <group>: text } } | { l2: { <archetype>: text } }. Resolves { question }.
 * A stale version throws with status 409 and `current` (the stored draft).
 */
export function saveQuestionBankEntry(level, questionId, version, patch) {
  return bankRequest(`${encodeURIComponent(level)}/${encodeURIComponent(questionId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...patch, version }),
  });
}

/** Make the drafts the live bank. Throws with status 400 and `problems` while an answer is empty. */
export function publishQuestionBank(level) {
  return bankRequest(`${encodeURIComponent(level)}/publish`, { method: 'POST' });
}

// ── Form Email (Formulieren) — instant send only, no server storage ──

/** Send a form directly via email (no DB storage) */
export async function sendFormDirect(data) {
  const response = await fetch(`${API_BASE}/admin/forms/send-direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Direct send failed (${response.status})`);
  }
  return response.json();
}

/** Send a public contact / source-suggestion form (no auth, no DB storage). */
export async function sendContactForm(data) {
  const response = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const limited = limitedError(response, 'Je hebt het formulier net een paar keer verstuurd. Probeer het over een uur opnieuw.');
    if (limited) throw limited;
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Verzenden mislukt (${response.status})`);
  }
  return response.json();
}

// ── Dev Activity Audit Log ──

/** Log a consent (or dev) event to the public activity log (no auth — consent comes before any account) */
export async function logActivity(data) {
  const response = await fetch(`${API_BASE}/activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) return null;
  return response.json();
}

/**
 * Management accounts: a single-use link (5 minutes) to the newest management-app installer, which the
 * server keeps out of the web code. Returns { url (absolute), name, version }; throws 'no_release' when
 * nothing has been published yet.
 */
export async function requestDownloadLink() {
  const response = await fetch(`${API_BASE}/files/link`, { method: 'POST', headers: authHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `error_${response.status}`);
  return { ...data, url: new URL(data.url, API_BASE).toString() };
}

/** Admin only: record that a stored report was opened (access log) */
export async function logReportView({ reportId, reportType }) {
  const response = await fetch(`${API_BASE}/admin/sessions/report-view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ reportId, reportType }),
  });
  if (!response.ok) return null;
  return response.json();
}

/** Get access log events (report views + admin logins) directly (admin only) */
export async function getAccessLog(limit = 500) {
  const response = await fetch(`${API_BASE}/admin/sessions/access?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Access log failed (${response.status})`);
  }
  return response.json();
}

/** Get computed dev sessions (admin only) */
export async function getSessions(limit = 200) {
  const response = await fetch(`${API_BASE}/admin/sessions?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Session list failed (${response.status})`);
  }
  return response.json();
}

/** Clear all dev activity data (admin only) */
export async function clearSessions() {
  const response = await fetch(`${API_BASE}/admin/sessions`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Session clear failed (${response.status})`);
  }
  return response.json();
}

/**
 * Get feedback confirmation email settings (admin only).
 */
export async function getFeedbackEmailSettings() {
  const response = await fetch(`${API_BASE}/admin/settings/feedback-email`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to load feedback email settings (${response.status})`);
  return response.json();
}

/**
 * Update feedback confirmation email settings (admin only).
 * @param {{ text: string }} settings
 */
export async function updateFeedbackEmailSettings(settings) {
  const response = await fetch(`${API_BASE}/admin/settings/feedback-email`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Failed to save feedback email settings (${response.status})`);
  }
  return response.json();
}

// ── Activation codes (admin) ──

/** @returns {Promise<{ active: object[], logbook: object[] }>} */
export async function getActivationCodes() {
  const response = await fetch(`${API_BASE}/admin/activation-codes`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to load activation codes (${response.status})`);
  return response.json();
}

/**
 * Generate one-time activation codes. The plaintext `code` is in this response ONLY —
 * the backend keeps a hash, so it can never be shown again.
 * @returns {Promise<{ codes: { _id, code, hint, label, createdAt }[] }>}
 */
export async function createActivationCodes({ count = 1, label = '' } = {}) {
  const response = await fetch(`${API_BASE}/admin/activation-codes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ count, label }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Failed to create activation codes (${response.status})`);
  }
  return response.json();
}

export async function revokeActivationCode(id) {
  const response = await fetch(`${API_BASE}/admin/activation-codes/${id}/revoke`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Failed to revoke activation code (${response.status})`);
  }
  return response.json();
}

// ── Report unlocks + refunds (admin) ──

/** @returns {Promise<{ refundWindowDays: number, unlocks: object[] }>} */
export async function getReportUnlocks() {
  const response = await fetch(`${API_BASE}/admin/report-unlocks`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to load report unlocks (${response.status})`);
  return response.json();
}

/**
 * Refund a paid report under the 14-day guarantee. Irreversible: blocks the report's crystal
 * code and removes the access it gave from the account that claimed it.
 */
export async function refundReportUnlock(id, review) {
  const response = await fetch(`${API_BASE}/admin/report-unlocks/${id}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(review ? { review } : {}),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    const e = new Error(err.error || `Refund failed (${response.status})`);
    e.code = err.code;
    throw e;
  }
  return response.json();
}

/** Moderator declines a refund request after the review. */
/** Keep (hold=true) or release (hold=false) a payment's link to its report past the day-15 unlink. */
export async function holdReportPaymentLink(id, hold = true) {
  const response = await fetch(`${API_BASE}/admin/report-unlocks/${id}/hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ hold }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Hold failed (${response.status})`);
  }
  return response.json();
}

export async function declineReportRefund(id, review) {
  const response = await fetch(`${API_BASE}/admin/report-unlocks/${id}/decline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ review }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Decline failed (${response.status})`);
  }
  return response.json();
}

// ── Payment config (admin): flip schedule + country gate, applied without a deploy ──

/** @returns {Promise<{ stored: { flipAt, gate: { launchCountries, openCountries, openAtFlip } }, effective: object }>} */
export async function getPaymentConfigAdmin() {
  const response = await fetch(`${API_BASE}/admin/payment-config`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to load payment config (${response.status})`);
  return response.json();
}

/** @param {{ flipAt?: string, gate?: { launchCountries?: string[], openCountries?: string[], openAtFlip?: boolean } }} patch */
export async function updatePaymentConfigAdmin(patch) {
  const response = await fetch(`${API_BASE}/admin/payment-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Update failed (${response.status})`);
  }
  return response.json();
}

// ── Payment records (admin) ──

/** @returns {Promise<{ records: object[] }>} metadata only; PDFs are fetched per record */
export async function getPaymentRecords() {
  const response = await fetch(`${API_BASE}/admin/payment-records`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to load payment records (${response.status})`);
  return response.json();
}

/** Fetch an authenticated file and hand it to the browser as a download. */
async function downloadAuthed(url, fallbackName) {
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Download failed (${response.status})`);
  }
  const disposition = response.headers.get('Content-Disposition') || '';
  const name = (disposition.match(/filename="([^"]+)"/) || [])[1] || fallbackName;
  const href = URL.createObjectURL(await response.blob());
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10000);
}

/** Download one payment record PDF. */
export function downloadPaymentRecord(id) {
  return downloadAuthed(`${API_BASE}/admin/payment-records/${id}/pdf`, 'betaalbewijs.pdf');
}

/** Download the payment records folder as a ZIP — one year, or everything when year is omitted. */
export function downloadPaymentRecordsArchive(year) {
  return downloadAuthed(`${API_BASE}/admin/payment-records/archive.zip${year ? `?year=${year}` : ''}`, 'Betaalbewijzen.zip');
}

export async function saveInvoice(invoiceData) {
  const response = await fetch(`${API_BASE}/admin/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(invoiceData),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Failed to save invoice (${response.status})`);
  }
  return response.json();
}

export async function getInvoices() {
  const response = await fetch(`${API_BASE}/admin/invoices`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to load invoices (${response.status})`);
  return response.json();
}

export async function deleteInvoice(id) {
  const response = await fetch(`${API_BASE}/admin/invoices/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Failed to delete invoice (${response.status})`);
  }
  return response.json();
}

// ── Install links for the management phone app (admin) ──

/** @returns {Promise<{ links: { _id, hint, createdAt, usedAt, revokedAt, status }[] }>} */
export async function getAppLinks() {
  const response = await fetch(`${API_BASE}/admin/app-links`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to load install links (${response.status})`);
  return response.json();
}

/** A new one-time install link. Its `url` is in this response ONLY — the backend keeps a hash. */
export async function createAppLink({ label = '' } = {}) {
  const response = await fetch(`${API_BASE}/admin/app-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ label }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Failed to create an install link (${response.status})`);
  }
  return response.json();
}

export async function revokeAppLink(id) {
  const response = await fetch(`${API_BASE}/admin/app-links/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to revoke the install link (${response.status})`);
  return response.json();
}
