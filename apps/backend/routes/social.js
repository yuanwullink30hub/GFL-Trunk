/**
 * Garden For Life — Social handle verification (OAuth ownership proof)
 *
 * POST /api/social/start                (auth) { platform } → { url }  — provider consent URL
 * GET  /api/social/callback/:platform          OAuth redirect target → verifies & closes popup
 *
 * GENERIC PLUMBING: a platform switches ON by setting its env keys (see PROVIDERS).
 * Until configured, /start answers 501 so the UI can say "nog niet beschikbaar".
 *
 * Ownership proof is ONE-TIME: we exchange the code, read the authenticated account's
 * handle, stamp users.socials.<platform> = { handle, verified: true, verifiedAt } and
 * DISCARD the tokens — no ongoing access, no scopes beyond identity, nothing else stored.
 * The platform is the source of truth: the verified handle OVERWRITES any typed one.
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const config = require('../config');
const { collections } = require('../db');
const { authRequired } = require('../middleware/auth');

const SOCIAL_KEYS = ['instagram', 'youtube', 'tiktok', 'x', 'linkedin'];
const STATE_TTL_MS = 10 * 60 * 1000; // a started flow must come back within 10 minutes

// Where providers redirect back to. Must match the redirect URI registered in each
// platform's developer app (production: the deployed API host via API_PUBLIC_URL).
function callbackUrl(req, platform) {
  // config.apiPublicUrl, never the request's Host header (see config/index.js).
  return `${config.apiPublicUrl}/api/social/callback/${platform}`;
}

// ── Provider registry — a platform is LIVE when its env keys are set AND it has a
// profile() implementation. Everything else stays 501 without code changes here.
const PROVIDERS = {
  x: {
    clientId: process.env.SOCIAL_X_CLIENT_ID || '',
    clientSecret: process.env.SOCIAL_X_CLIENT_SECRET || '',
    authorizeUrl: 'https://x.com/i/oauth2/authorize',
    tokenUrl: 'https://api.x.com/2/oauth2/token',
    scope: 'users.read tweet.read',
    pkce: true, // X's OAuth2 requires PKCE
    // → the authenticated account's @username
    async profile(accessToken) {
      const r = await fetch('https://api.x.com/2/users/me', { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!r.ok) throw new Error(`X profile fetch failed (${r.status})`);
      const j = await r.json();
      return j && j.data && j.data.username ? String(j.data.username) : null;
    },
  },
  youtube: {
    clientId: process.env.SOCIAL_GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.SOCIAL_GOOGLE_CLIENT_SECRET || '',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    pkce: false,
    // → the authenticated account's channel handle (@name), falling back to channel title
    async profile(accessToken) {
      const r = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!r.ok) throw new Error(`YouTube profile fetch failed (${r.status})`);
      const j = await r.json();
      const ch = j && Array.isArray(j.items) && j.items[0];
      if (!ch) return null;
      return (ch.snippet && (ch.snippet.customUrl || ch.snippet.title)) || null;
    },
  },
  // TODO: switch on once their developer-app reviews are through. Each needs env keys
  // + a profile() implementation; the generic start/callback flow is already in place.
  tiktok: null,
  linkedin: null,
  instagram: null, // Meta stack; OAuth only exists for business/creator accounts
};

function liveProvider(platform) {
  const p = PROVIDERS[platform];
  return p && p.clientId && p.clientSecret && typeof p.profile === 'function' ? p : null;
}

// ─────────────────────────────────────────────────────────────
// POST /api/social/start  (auth) { platform } → { url }
// ─────────────────────────────────────────────────────────────
router.post('/start', authRequired, async (req, res) => {
  try {
    const platform = String(req.body && req.body.platform || '');
    if (!SOCIAL_KEYS.includes(platform)) return res.status(400).json({ error: 'Onbekend platform.' });
    const p = liveProvider(platform);
    if (!p) return res.status(501).json({ error: 'Synchronisatie voor dit platform is nog niet beschikbaar.' });

    // The callback is an unauthenticated redirect, so what it needs — whose flow this is and, for PKCE,
    // the code verifier — stays HERE, in a row keyed by a random `state`. The state is all that travels
    // (through the browser, the provider and back, in URLs that land in history and logs); it used to be
    // a signed but readable token that carried the verifier right alongside the code, which is exactly
    // what PKCE exists to keep apart. The row is single-use (taken by the callback) and lives 10 minutes.
    const codeVerifier = p.pkce ? crypto.randomBytes(32).toString('base64url') : null;
    const state = crypto.randomBytes(32).toString('base64url');
    const now = new Date();
    await collections.oauthStates().insertOne({
      state, uid: String(req.user.userId), platform, codeVerifier,
      createdAt: now, expiresAt: new Date(now.getTime() + STATE_TTL_MS),
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: p.clientId,
      redirect_uri: callbackUrl(req, platform),
      scope: p.scope,
      state,
    });
    if (p.pkce) {
      const challenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
      params.set('code_challenge', challenge);
      params.set('code_challenge_method', 'S256');
    }
    return res.json({ url: `${p.authorizeUrl}?${params.toString()}` });
  } catch (e) {
    console.error('[social/start] error:', e.message);
    return res.status(500).json({ error: 'Synchronisatie starten mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/social/callback/:platform  — provider redirect target (popup)
// Responds with a tiny page that notifies the opener and closes itself.
// ─────────────────────────────────────────────────────────────
function popupHtml(ok, message) {
  const safe = String(message || '').replace(/[<>&"]/g, '');
  return `<!doctype html><html><body style="background:#0a0510;color:${ok ? '#15b315' : '#f87171'};font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <div style="text-align:center"><p>${safe}</p><p style="color:#888">Je kunt dit venster sluiten.</p></div>
  <script>
    try { if (window.opener) window.opener.postMessage({ type: 'gfl-social-verified', ok: ${ok ? 'true' : 'false'} }, '*'); } catch (e) {}
    setTimeout(function () { window.close(); }, ${ok ? 1200 : 4000});
  </script></body></html>`;
}

router.get('/callback/:platform', async (req, res) => {
  try {
    const platform = String(req.params.platform || '');
    const p = liveProvider(platform);
    const { code, state, error } = req.query;
    if (!p || error || !code || !state) {
      return res.status(400).send(popupHtml(false, 'Synchronisatie geannuleerd of mislukt.'));
    }

    // Take the flow in one step: a state works once, and only for the platform it was started for.
    // The TTL index only sweeps eventually, so the expiry is checked here as well.
    const flow = await collections.oauthStates().findOneAndDelete({ state: String(state), platform });
    if (!flow || new Date(flow.expiresAt).getTime() < Date.now()) {
      return res.status(400).send(popupHtml(false, 'Sessie verlopen — probeer opnieuw.'));
    }
    const claims = { uid: flow.uid, cv: flow.codeVerifier };

    // Exchange the code — tokens live only inside this request.
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: callbackUrl(req, platform),
      client_id: p.clientId,
    });
    if (claims.cv) body.set('code_verifier', claims.cv);
    const basic = Buffer.from(`${p.clientId}:${p.clientSecret}`).toString('base64');
    const tokenRes = await fetch(p.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basic}` },
      body: body.toString(),
    });
    if (!tokenRes.ok) {
      console.error('[social/callback] token exchange failed:', tokenRes.status);
      return res.status(502).send(popupHtml(false, 'Platform-verificatie mislukt.'));
    }
    const tokens = await tokenRes.json();
    const handle = await p.profile(tokens.access_token);
    if (!handle) return res.status(502).send(popupHtml(false, 'Kon je gebruikersnaam niet lezen.'));

    // One-time proof recorded; tokens discarded (go out of scope here, never stored).
    await collections.users().updateOne(
      { _id: new ObjectId(String(claims.uid)) },
      { $set: { [`socials.${platform}`]: { handle: String(handle).slice(0, 200), verified: true, verifiedAt: new Date() }, updatedAt: new Date() } }
    );
    return res.send(popupHtml(true, `Gesynchroniseerd ✓ (${String(handle).slice(0, 60)})`));
  } catch (e) {
    console.error('[social/callback] error:', e.message);
    return res.status(500).send(popupHtml(false, 'Serverfout bij verificatie.'));
  }
});

module.exports = router;
