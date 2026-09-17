/**
 * Anonymous tool calls — the app side of docs/LOCAL_WORKSTATION_CONTRACT.md §7a (binding).
 *
 * Every tool that needs server compute (a model, the engine) goes through callTool(). Nothing else
 * may send tool data to the server. callTool():
 *   - sends NO account token and NO cookies (credentials: 'omit'), only one blind-signed ticket;
 *   - refuses input that carries identifiers (account/folder ids, e-mail, tokens, names of the
 *     account) — tools send what they compute on, nothing that says whose it is;
 *   - opens the private window for the duration of the call, so no account request goes out while
 *     it runs, and background account calls resume only after a random delay (timing decoupling).
 *
 * Tickets are fetched in batches by refillToolTickets() — the one account-bound step — at quiet
 * moments (after login, never right before a call), blinded so the server cannot recognise them.
 */
import { RSABSSA } from '@cloudflare/blindrsa-ts';
import { apiBaseUrl, accountAuthHeaders, openPrivateWindow, backgroundAccountCallsAllowed, getToken } from './apiClient.js';

const STORE_KEY = 'gfl_tool_tickets';
const RSA_PARAMS = { name: 'RSA-PSS', hash: 'SHA-384' };
const suite = RSABSSA.SHA384.PSS.Randomized();

export class ToolTicketError extends Error {
  constructor(code, message) { super(message); this.name = 'ToolTicketError'; this.code = code; }
}
export class ToolInputError extends Error {
  constructor(key) { super(`Tool input must not identify anyone (field "${key}")`); this.name = 'ToolInputError'; this.key = key; }
}

// ── encoding ──
const toB64u = (u8) => {
  let s = ''; for (let i = 0; i < u8.length; i += 1) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const fromB64u = (s) => fromB64(String(s).replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (String(s).length % 4)) % 4));

// ── local store: { [epoch]: [{ t, s }] } ──
function readStore() {
  try { const v = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
function writeStore(store) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* storage unavailable: tickets live for this session only */ }
}
const epochOf = (d = new Date()) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
const previousEpoch = (e) => { const [y, m] = e.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; };
function prune(store, now = new Date()) {
  const keep = new Set([epochOf(now), previousEpoch(epochOf(now))]);
  for (const k of Object.keys(store)) if (!keep.has(k) || !Array.isArray(store[k]) || store[k].length === 0) delete store[k];
  return store;
}

/** How many unspent tickets this device holds (current + previous month). */
export function toolTicketCount() {
  const store = prune(readStore());
  return Object.values(store).reduce((n, list) => n + list.length, 0);
}

/**
 * Top up the local ticket store. Account-bound (sends the token), so it:
 *   - does nothing while a report or tool call is open, or shortly after (private window);
 *   - does nothing when the store already holds `min` tickets.
 * Call it at quiet moments (after login, on an idle timer) — never immediately before callTool.
 * @returns {Promise<number>} tickets added
 */
export async function refillToolTickets({ min = 20, batch = 50 } = {}) {
  if (!getToken() || !backgroundAccountCallsAllowed()) return 0;
  if (toolTicketCount() >= min) return 0;
  const base = apiBaseUrl();

  const keyRes = await fetch(`${base}/tools/key`, { credentials: 'omit' });
  if (!keyRes.ok) throw new ToolTicketError('key_unavailable', 'Ticket key unavailable');
  const { epoch, publicKey: spki } = await keyRes.json();
  const publicKey = await crypto.subtle.importKey('spki', fromB64(spki), RSA_PARAMS, true, ['verify']);

  const prepared = [];
  const blinds = [];
  for (let i = 0; i < batch; i += 1) {
    const msg = suite.prepare(crypto.getRandomValues(new Uint8Array(32)));
    const { blindedMsg, inv } = await suite.blind(publicKey, msg);
    prepared.push({ msg, inv });
    blinds.push(toB64u(blindedMsg));
  }

  const res = await fetch(`${base}/tools/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...accountAuthHeaders() },
    body: JSON.stringify({ epoch, blinded: blinds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ToolTicketError(err.code || 'issue_failed', err.error || `Tickets could not be issued (${res.status})`);
  }
  const { signatures } = await res.json();

  const fresh = [];
  for (let i = 0; i < signatures.length; i += 1) {
    const sig = await suite.finalize(publicKey, prepared[i].msg, fromB64u(signatures[i]), prepared[i].inv);
    fresh.push({ t: toB64u(prepared[i].msg), s: toB64u(sig) });
  }
  const store = prune(readStore());
  store[epoch] = [...(store[epoch] || []), ...fresh];
  writeStore(store);
  return fresh.length;
}

/** Take one ticket out of the store (previous month's first, so they get used before they expire). */
function takeTicket() {
  const store = prune(readStore());
  const now = epochOf();
  for (const epoch of [previousEpoch(now), now]) {
    const list = store[epoch];
    if (list && list.length) {
      const pick = list.splice(Math.floor(Math.random() * list.length), 1)[0];
      writeStore(prune(store));
      return `v1.${epoch}.${pick.t}.${pick.s}`;
    }
  }
  return null;
}

// Field names that say WHO, not WHAT. Tools compute on content; identity never travels with it.
const IDENTIFYING_KEY = /^(user|account|owner|folder|device|client|session)[-_]?id$|^(e-?mail|token|authorization|cookie|code-?hash|orb-?code|display-?name|full-?name|first-?name|last-?name|phone|address)$/i;

function assertAnonymousInput(value, depth = 0) {
  if (depth > 12 || value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) { value.forEach((v) => assertAnonymousInput(v, depth + 1)); return; }
  for (const [k, v] of Object.entries(value)) {
    if (IDENTIFYING_KEY.test(k)) throw new ToolInputError(k);
    assertAnonymousInput(v, depth + 1);
  }
}

/**
 * Run a server-side tool anonymously. THE only way a tool may reach the server.
 * @param {string} toolId  registered tool id (apps/backend/services/toolRegistry.js)
 * @param {any} input      JSON-serialisable content to compute on — no identifiers
 * @returns {Promise<any>} the tool's result
 */
export async function callTool(toolId, input) {
  assertAnonymousInput(input);
  const ticket = takeTicket();
  if (!ticket) throw new ToolTicketError('no_tickets', 'No tool tickets left on this device');

  const release = openPrivateWindow();
  try {
    const res = await fetch(`${apiBaseUrl()}/tools/run/${encodeURIComponent(toolId)}`, {
      method: 'POST',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json', 'X-GFL-Ticket': ticket },
      body: JSON.stringify({ input: input === undefined ? null : input }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ToolTicketError(data.code || 'tool_failed', data.error || `Tool failed (${res.status})`);
    return data.result;
  } finally {
    release();
  }
}
