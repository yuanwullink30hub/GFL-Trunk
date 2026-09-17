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

export const isPrivateWindowOpen = () => privateWindowDepth > 0;

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
 * Register a new account.
 * @returns {Promise<{ token: string, user: { id, email, displayName } }>}
 */
export async function register({ email, password, displayName, age, country, orbCode, archetypeName, reading }) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, age, country, orbCode, archetypeName, reading, remember: getRememberLogin() }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Registration failed (${response.status})`);
  }

  const data = await response.json();
  if (data.token) setToken(data.token);   // no token when the account still needs email verification
  return data;
}

/**
 * Login with email + password.
 * Throws on failure; the error carries `.needsVerification = true` when the account exists but its
 * email isn't confirmed yet (so callers can poll instead of treating it as a hard error).
 * @returns {Promise<{ token: string, user: { id, email, displayName } }>}
 */
export async function login({ email, password }) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, remember: getRememberLogin() }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    const e = new Error(err.error || `Login failed (${response.status})`);
    if (err.needsVerification) e.needsVerification = true;
    throw e;
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
 * Fetch a PUBLIC, read-only profile by its unique visual name (handle).
 * No auth. Returns only public-safe fields (name, archetype, render-only orb, country).
 * @returns {Promise<{ displayName, archetypeName, orb, country }>}
 */
export async function getPublicProfile(handle) {
  const response = await fetch(`${API_BASE}/auth/public/${encodeURIComponent(handle)}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Profiel ophalen mislukt (${response.status})`);
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
 * Change password (auth required). Requires current password; new min 6 chars.
 * When SMTP is configured the change is gated behind an email confirmation link and is only
 * applied when that link is clicked — the response is { ok: true, pending: true } in that case,
 * or { ok: true, pending: false } when applied immediately (no SMTP / local dev).
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
  return response.json();
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
 * Save an assessment result to the database.
 */
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

/** @deprecated The server no longer stores assessments (single-instance profile); always rejected. */
export async function saveAssessment(data) {
  const response = await fetch(`${API_BASE}/assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Save failed (${response.status})`);
  }

  return response.json();
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
export async function analyzeAssessment(params, onProgress) {
  const response = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
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
  const response = await fetch(`${API_BASE}/orb/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfBase64, remember: getRememberLogin() }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Kon de code niet uit de PDF lezen (${response.status})`);
  }
  return response.json();
}

/**
 * Link an LC_ORB code to the authenticated account (once). After linking, the code's
 * PDF-upload login is denied — the account becomes the credential. Auth required.
 * @returns {Promise<{ linked: boolean, alreadyOwned?: boolean }>}
 */
export async function orbLinkCode(code, archetypeName, reading) {
  const response = await fetch(`${API_BASE}/orb/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ code, archetypeName, reading }),
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
 * Get single review detail with full assessment context (admin only).
 * @param {string} id - Review ObjectId
 */
export async function getAdminReview(id) {
  const response = await fetch(`${API_BASE}/admin/reviews/${id}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Review detail failed (${response.status})`);
  }
  return response.json();
}

/**
 * Get AI prompt configuration (admin only).
 */
export async function getPromptConfig() {
  const response = await fetch(`${API_BASE}/admin/prompts`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Prompt config failed (${response.status})`);
  return response.json();
}

/**
 * Update AI prompt configuration (admin only).
 */
export async function updatePromptConfig(config) {

  const response = await fetch(`${API_BASE}/admin/prompts`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(config),
  });
  if (!response.ok) throw new Error(`Prompt update failed (${response.status})`);
  return response.json();
}

// ── Context Documents (uploaded by admin, included in AI calls) ──

/**
 * Upload a context document (Word/PDF/TXT) for AI system prompt inclusion.
 * @param {File} file - The file to upload
 * @returns {Promise<{ success: boolean, document: Object }>}
 */
export async function uploadPromptDocument(file) {
  const formData = new FormData();
  formData.append('document', file);

  const response = await fetch(`${API_BASE}/admin/prompts/documents`, {
    method: 'POST',
    headers: authHeaders(), // No Content-Type — browser sets multipart boundary
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Upload failed (${response.status})`);
  }
  return response.json();
}

/**
 * List all uploaded context documents (metadata only, no text).
 * @returns {Promise<{ documents: Array }>}
 */
export async function getPromptDocuments() {
  const response = await fetch(`${API_BASE}/admin/prompts/documents`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Document list failed (${response.status})`);
  return response.json();
}

/**
 * Delete an uploaded context document.
 * @param {string} docId - MongoDB ObjectId
 * @returns {Promise<{ success: boolean }>}
 */
export async function deletePromptDocument(docId) {
  const response = await fetch(`${API_BASE}/admin/prompts/documents/${docId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Delete failed (${response.status})`);
  }
  return response.json();
}

/**
 * Verify all uploaded context documents are valid and readable by the AI.
 * @returns {Promise<{ success: boolean, verified: boolean, totalDocuments: number, totalChars: number, documents: Array }>}
 */
export async function verifyPromptDocuments() {
  const response = await fetch(`${API_BASE}/admin/prompts/documents/verify`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Verification failed (${response.status})`);
  }
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

/**
 * Seed the default questions into MongoDB (admin only).
 * @param {{ force?: boolean }} opts — pass force:true to wipe & re-seed
 */
export async function seedQuestions({ force = false } = {}) {
  const url = force
    ? `${API_BASE}/questions/seed?force=1`
    : `${API_BASE}/questions/seed`;
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Seed failed (${response.status})`);
  }
  return response.json();
}

/**
 * Export all questions as clean JSON (admin only).
 * @returns {Promise<Array>} — array of layer objects without _id fields
 */
export async function exportQuestions() {
  const response = await fetch(`${API_BASE}/questions/export`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Export failed (${response.status})`);
  }
  return response.json();
}

/**
 * Bulk import questions (admin only). Replaces ALL existing questions.
 * @param {Array} layers — array of layer objects
 */
export async function importQuestions(layers) {
  const response = await fetch(`${API_BASE}/questions/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ layers }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Import failed (${response.status})`);
  }
  return response.json();
}

/**
 * Update a single question (admin only).
 * @param {number} questionId — 1-60
 * @param {{ text?: string, domain?: string, answers?: Array<{ text: string }> }} data
 */
export async function updateQuestion(questionId, data) {
  const response = await fetch(`${API_BASE}/questions/${questionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Question update failed (${response.status})`);
  }
  return response.json();
}

/**
 * Export questions as Word document (.docx) — admin only.
 * Returns a Blob for download.
 */
export async function exportQuestionsDocx() {
  const response = await fetch(`${API_BASE}/questions/export/docx`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `DOCX export failed (${response.status})`);
  }
  return response.blob();
}

/**
 * Import questions from a Word document (.docx) — admin only.
 * @param {File} file — .docx file
 */
export async function importQuestionsDocx(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE}/questions/import/docx`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `DOCX import failed (${response.status})`);
  }
  return response.json();
}

/**
 * Update an entire layer (admin only).
 * @param {number} layerIndex — 0-4
 * @param {Object} data — layer fields to update
 */
export async function updateLayer(layerIndex, data) {
  const response = await fetch(`${API_BASE}/questions/layer/${layerIndex}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Layer update failed (${response.status})`);
  }
  return response.json();
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
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Verzenden mislukt (${response.status})`);
  }
  return response.json();
}

/** Check email SMTP configuration status */
export async function getEmailStatus() {
  const response = await fetch(`${API_BASE}/admin/email/status`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Email status check failed (${response.status})`);
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

/** Get consent audit log events (admin only) */
export async function getConsentLog(limit = 500) {
  const response = await fetch(`${API_BASE}/admin/sessions/consent?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Consent log failed (${response.status})`);
  }
  return response.json();
}

/** Get dev activity log events — edits, commits, pushes (admin only) */
export async function getDevLog(limit = 500) {
  const response = await fetch(`${API_BASE}/admin/sessions/dev?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Dev log failed (${response.status})`);
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

// ── Passkey Management (Admin) ──

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

export async function getPasskeys() {
  const response = await fetch(`${API_BASE}/admin/passkeys`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to load passkeys (${response.status})`);
  return response.json();
}

export async function deletePasskey(id) {
  const response = await fetch(`${API_BASE}/admin/passkeys/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Failed to delete passkey (${response.status})`);
  }
  return response.json();
}

export async function togglePasskey(id) {
  const response = await fetch(`${API_BASE}/admin/passkeys/${id}/toggle`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Failed to toggle passkey (${response.status})`);
  }
  return response.json();
}

export async function toggleAdminPasskey(id) {
  const response = await fetch(`${API_BASE}/admin/passkeys/${id}/toggle-admin`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Failed to toggle admin passkey (${response.status})`);
  }
  return response.json();
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
