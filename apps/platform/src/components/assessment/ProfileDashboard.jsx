import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { updateDisplayName, updateProfile, updatePassword, updateEmail, deleteOwnAccount, saveOrbSnapshot, getCard, orbLinkCode, orbLoginFromPdf, startSocialVerify } from '@gfl/api-client';
import { C, FONT, SciFiButton } from '@gfl/ui';
import { OrbSphere3D } from '../../orb';
import ProfileCard from './ProfileCard';
import { getClientOrbConfig, getClientProfile, setClientOrbCode, setClientOrbConfig, setClientProfile, clearClientOrbCode } from '../../clientMode';
import { getArchetypeImageByName } from '@gfl/assessment-core/data/archetypeImages';
import { PRESET_KERNELS } from './presetKernels';

// Fallback card payload assembled from /me data — used only if GET /card fails, so the
// Openbaar tab still renders. Mirrors the backend's buildCardPayload allowlist shape.
function payloadFromMe(user) {
  const hist = Array.isArray(user.orbHistory) ? user.orbHistory : [];
  const readings = hist.map((h, i) => ({ readingId: `me-r${i}`, readingDate: h.at || null, archetypePrimaryId: h.archetypeName || '', orbRenderRef: { orb: h.orb || null, image: h.image || null } }));
  const last = readings.length ? readings[readings.length - 1] : null;
  let nextAt = null;
  if (last?.readingDate) { const d = new Date(last.readingDate); d.setMonth(d.getMonth() + 1); nextAt = d; }
  return {
    schemaVersion: 'cardPayload.v1',
    derived: {
      latest: last ? { ...last, archetypePrimaryId: user.archetypeName || '', archetypeSupportId: null, shapeVector12: null, orbRenderRef: { orb: user.orb || last.orbRenderRef.orb, image: last.orbRenderRef.image } } : null,
      readings, readingCount: readings.length, nextReadingAvailableAt: nextAt,
      instrumentVersion: '0.9', provisionalFlag: true,
    },
    declared: {
      displayName: user.visibleName || user.displayName || '', roleLine: user.roleLine || '', age: user.age != null ? user.age : null,
      country: user.country || '', languages: Array.isArray(user.languages) ? user.languages : [],
      memberSince: user.createdAt || null, lastSeen: user.lastSeen || null, links: user.link ? [user.link] : [],
      socials: user.socials || {},
      description: { text: user.story || '', sections: Array.isArray(user.descriptionSections) ? user.descriptionSections : [] },
      intention: { text: user.intention || '', sections: Array.isArray(user.intentionSections) ? user.intentionSections : [] },
    },
  };
}

// Push a Blob to the browser as a file download.
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* Record `srcCanvas` (the square orb) as a real H.264 MP4 via WebCodecs, composited black onto a
   1920×1080 frame, for `durationMs` at `fps`. Real-time paced so the orb's rotation is captured 1:1.
   Muxed with mp4-muxer (lazy-loaded). Throws if WebCodecs/H.264 isn't available (caller falls back). */
async function recordOrbMp4({ srcCanvas, durationMs = 12000, fps = 60, bitrate = 12_000_000, isCancelled = () => false, onProgress }) {
  const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
  const W = 1920, H = 1080;
  let cfg = null;
  for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42002a']) {
    const c = { codec, width: W, height: H, bitrate, framerate: fps };
    const s = await VideoEncoder.isConfigSupported(c).catch(() => null); // eslint-disable-line no-await-in-loop
    if (s && s.supported) { cfg = c; break; }
  }
  if (!cfg) throw new Error('No supported H.264 encoder config');

  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const ctx = out.getContext('2d', { alpha: false });
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H }, fastStart: 'in-memory' });
  let encErr = null;
  const encoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { encErr = e; } });
  encoder.configure(cfg);

  await new Promise((resolve, reject) => {
    const start = performance.now();
    let idx = 0;
    const tick = () => {
      if (isCancelled()) { resolve(); return; }
      if (encErr) { reject(encErr); return; }
      const elapsed = performance.now() - start;
      if (elapsed >= durationMs) { resolve(); return; }
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(srcCanvas, (W - H) / 2, 0, H, H);
      let frame;
      try { frame = new VideoFrame(out, { timestamp: Math.round(elapsed * 1000), duration: Math.round(1e6 / fps) }); }
      catch (e) { reject(e); return; }
      encoder.encode(frame, { keyFrame: idx % (fps * 2) === 0 });
      frame.close();
      idx++;
      if (onProgress) onProgress(Math.min(1, elapsed / durationMs));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  await encoder.flush();
  if (encErr) throw encErr;
  muxer.finalize();
  encoder.close();
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}

/* ════════════════════════════════════════════════════════════════════════
   ProfileDashboard — the client's own space (the "Profiel" slot).
   Uses CLIENT-MODE data (the orb-code + stored profile + account), NOT a saved
   assessment — a code-onboarded client has no server-side assessment. Their crystal
   comes from gfl_orb_code; identity from getMe + gfl_client_profile.
   Card sizing is ~1.5× the base scale for readability.
   ════════════════════════════════════════════════════════════════════════ */

const FIELD = { background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(168,85,247,0.35)', color: C.text, fontFamily: FONT, fontSize: 'max(11px,0.58vw)', padding: '0.42rem 0.7rem', borderRadius: '0.4rem', outline: 'none', width: '100%', boxSizing: 'border-box' };

/* ── §6b preset questions — chips to FILL IN. Each answered kernel becomes a section in a
   SEPARATE readable block on the card (inspiration next to the self-written story). The
   main text is never pre-filled; these are the user's own answers, skippable, any order. ── */
const PresetQuestions = ({ block, values, onChange }) => {
  const [openKey, setOpenKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const kernels = PRESET_KERNELS[block];
  const open = openKey && openKey !== '__prompt' ? kernels.find((k) => k.key === openKey) : null;
  // PROMPT chip: all answered questions bundled, blank line between answers — raw
  // material the user can copy and shape into their own storyline.
  const bundled = kernels
    .map((k) => (values[k.key] || '').trim())
    .filter(Boolean)
    .join('\n\n');
  // Prompt lights up only when EVERY question carries a real answer (≥5 words each);
  // until then it sits dimmed — a quiet nudge that the bundle isn't complete yet.
  const wordCount = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  const promptReady = kernels.every((k) => wordCount(values[k.key]) >= 5);
  const copyBundle = () => {
    if (!bundled) return;
    navigator.clipboard?.writeText(bundled);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ marginTop: '0.55rem' }}>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {kernels.map((k) => {
          const answered = !!(values[k.key] || '').trim();
          const isOpen = openKey === k.key;
          return (
            <button key={k.key} type="button" onClick={() => setOpenKey(isOpen ? null : k.key)}
              style={{ cursor: 'pointer', background: isOpen ? 'rgba(168,85,247,0.22)' : answered ? 'rgba(168,85,247,0.12)' : 'transparent', border: `1px solid ${isOpen || answered ? 'rgba(168,85,247,0.6)' : 'rgba(168,85,247,0.25)'}`, color: answered ? '#c4b5fd' : 'rgba(255,254,240,0.8)', borderRadius: '0.3rem', padding: '0.28rem 0.55rem', fontFamily: FONT, fontSize: 'max(8px,0.45vw)', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.15s' }}>
              {k.lead}{answered ? ' ✓' : ''}
            </button>
          );
        })}
        <button type="button" onClick={() => setOpenKey(openKey === '__prompt' ? null : '__prompt')}
          style={{
            cursor: 'pointer',
            background: openKey === '__prompt' ? 'rgba(21,179,21,0.18)' : 'transparent',
            border: `1px solid ${promptReady ? 'rgba(21,179,21,0.8)' : 'rgba(21,179,21,0.22)'}`,
            color: promptReady ? '#15b315' : 'rgba(21,179,21,0.35)',
            boxShadow: promptReady ? '0 0 8px rgba(21,179,21,0.35)' : 'none',
            borderRadius: '0.3rem', padding: '0.28rem 0.55rem', fontFamily: FONT, fontSize: 'max(8px,0.45vw)', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.15s',
          }}>
          Prompt
        </button>
      </div>
      {openKey === '__prompt' && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'max(9px,0.5vw)', color: 'rgba(255,254,240,0.8)', fontStyle: 'italic', marginBottom: '0.3rem' }}>
            Al je antwoorden gebundeld — gebruik dit als grondstof voor je eigen verhaal.
          </div>
          <textarea
            value={bundled || 'Nog geen antwoorden — vul eerst een of meer vragen in.'}
            readOnly
            rows={Math.min(12, Math.max(4, bundled.split('\n').length + 1))}
            style={{ ...FIELD, minHeight: '5rem', resize: 'vertical', lineHeight: 1.6, fontFamily: "'Figtree', sans-serif", opacity: bundled ? 1 : 0.55, cursor: 'text' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
            <SciFiButton onClick={copyBundle} disabled={!bundled} variant="purple" size="sm" padding="0.3rem 0.9rem" fontSize="max(8px,0.45vw)">{copied ? 'Gekopieerd ✓' : 'Kopieer'}</SciFiButton>
          </div>
        </div>
      )}
      {open && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'max(11px,0.6vw)', color: '#FFFEF0', marginBottom: '0.25rem' }}>{open.kernel}</div>
          {open.sub && <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'max(9px,0.5vw)', color: 'rgba(255,254,240,0.8)', fontStyle: 'italic', marginBottom: '0.3rem' }}>{open.sub}</div>}
          <textarea
            value={values[open.key] || ''}
            onChange={(e) => onChange(open.key, e.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Schrijf je eigen antwoord — 2–3 zinnen is genoeg."
            style={{ ...FIELD, minHeight: '3.6rem', resize: 'vertical', lineHeight: 1.5, fontFamily: "'Figtree', sans-serif" }}
          />
          <div style={{ textAlign: 'right', fontSize: 'max(8px,0.42vw)', color: 'rgba(255,254,240,0.7)', marginTop: '0.15rem' }}>{(values[open.key] || '').length}/600</div>
        </div>
      )}
    </div>
  );
};
// Headers in the softer platform amber (#f59e0b — TechContainer accent), NOT the
// header orange (#f97316 / C.gold).
const LABEL = { fontSize: 'max(9px,0.48vw)', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '0.28rem' };
const SECTION_TITLE = { fontSize: 'max(13px,0.75vw)', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#f59e0b' };

const ProfileDashboard = memo(({ user, active = true, onLogout }) => {
  // Active orb config — LOCAL cache first, but the server is the truth: when /me carries a
  // newer publicOrb (e.g. a code linked out-of-band or on another device), adopt it. The stale
  // raw code must be dropped, since it takes precedence in getClientOrbConfig and would keep
  // decoding to the OLD orb forever.
  const [orbConfig, setOrbConfig] = useState(() => getClientOrbConfig());
  useEffect(() => {
    const serverOrb = user.orb;
    if (!serverOrb) return;
    const local = getClientOrbConfig();
    if (local && JSON.stringify(local) === JSON.stringify(serverOrb)) return;
    clearClientOrbCode();
    setClientOrbConfig(serverOrb);
    setOrbConfig(serverOrb);
  }, [user.orb]);
  const profile = getClientProfile() || {};

  const [name, setName] = useState(user.displayName || '');
  const [nameInput, setNameInput] = useState(user.displayName || '');
  const [age, setAge] = useState(user.age != null ? String(user.age) : '');
  const [country, setCountry] = useState(user.country || '');
  const [story, setStory] = useState(user.story || profile.story || '');
  const [link, setLink] = useState(user.link || profile.link || '');
  const [roleLine, setRoleLine] = useState(user.roleLine || '');
  const [languages, setLanguages] = useState(Array.isArray(user.languages) ? user.languages.join(', ') : '');
  const [intention, setIntention] = useState(user.intention || '');
  // §6b preset-question ANSWERS (v1.1 sections) — maps key→text, kept separate from the
  // self-written story/intention text (which is never pre-filled).
  const sectionsToMap = (arr) => { const m = {}; (Array.isArray(arr) ? arr : []).forEach((s) => { if (s && s.key) m[s.key] = s.text || ''; }); return m; };
  const mapToSections = (m) => Object.entries(m).filter(([, t]) => String(t || '').trim()).map(([key, text]) => ({ key, text: String(text).trim() }));
  const [descAnswers, setDescAnswers] = useState(() => sectionsToMap(user.descriptionSections));
  const [intentAnswers, setIntentAnswers] = useState(() => sectionsToMap(user.intentionSections));
  // Zichtbare naam — the public card name. Entirely separate from the login name (displayName):
  // editing one never touches the other. Part of the declared (Openbaar) channel.
  const [visibleName, setVisibleName] = useState(user.visibleName || '');
  // Socials: inputs edit the HANDLE; the verified flag lives server-side ({handle, verified})
  // and is read from the card payload. Editing a handle resets its verification.
  const socialHandles = (src) => {
    const base = { instagram: '', youtube: '', tiktok: '', x: '', linkedin: '' };
    for (const k of Object.keys(base)) {
      const v = src && src[k];
      if (v) base[k] = typeof v === 'object' ? (v.handle || '') : String(v);
    }
    return base;
  };
  const [socials, setSocials] = useState(() => socialHandles(user.socials));
  const [storyMsg, setStoryMsg] = useState('');

  // cardPayload.v1 — the ONLY thing the Openbaar tab renders (SR-5: identical to the
  // public ?u= response). Falls back to a locally assembled payload if the fetch fails.
  const [card, setCard] = useState(null);
  const refreshCard = useCallback(() => {
    getCard().then(setCard).catch(() => setCard(payloadFromMe(user)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { refreshCard(); }, [refreshCard]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Which tab is open: 'openbaar' (read-only public preview) | 'prive' | 'instellingen'.
  const [tab, setTab] = useState('openbaar');
  const [linkCopied, setLinkCopied] = useState(false);
  // Shareable public-profile URL (PublicProfile resolves ?u=<visible name handle>).
  const publicUrl = (typeof window !== 'undefined' && name) ? `${window.location.origin}/?u=${encodeURIComponent(name)}` : '';
  const copyLink = useCallback(() => {
    if (!publicUrl) return;
    navigator.clipboard?.writeText(publicUrl);
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1500);
  }, [publicUrl]);

  // password change
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  // email change — editable, but gated behind a confirmation click on the NEW address. The account
  // email (user.email) does NOT change until that link is clicked; a pending change shows below.
  const [emailInput, setEmailInput] = useState(user.email || '');
  const [emailPw, setEmailPw] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [pendingEmail, setPendingEmail] = useState(user.pendingEmail || '');

  const [delInput, setDelInput] = useState('');
  const [delErr, setDelErr] = useState('');

  const flash = (m) => { setMsg(m); };

  const saveName = useCallback(async () => {
    const v = nameInput.trim();
    if (!v || v === name) return;
    setBusy(true); setMsg('');
    try {
      const r = await updateDisplayName(v);
      setName(r.displayName); setNameInput(r.displayName); flash('Naam opgeslagen ✓');
      refreshCard(); // the Openbaar card renders the fetched payload — refetch so the new name shows
    }
    catch (e) { flash(e.message || 'Naam bijwerken mislukt'); } finally { setBusy(false); }
  }, [nameInput, name, refreshCard]);

  // ONE save for the whole Privé tab — inlognaam (when changed), age/country, and the
  // openbaar card content (declared channel) together. The single "Profiel opslaan"
  // button at the bottom of the tab is its only trigger.
  const saveAll = useCallback(async () => {
    setBusy(true); setStoryMsg('');
    try {
      const v = nameInput.trim();
      if (v && v !== name) {
        const r = await updateDisplayName(v);
        setName(r.displayName); setNameInput(r.displayName);
      }
      await updateProfile({ age, country, story, link, roleLine, languages, intention, socials, visibleName, descriptionSections: mapToSections(descAnswers), intentionSections: mapToSections(intentAnswers) });
      setStoryMsg('Profiel opgeslagen ✓');
      refreshCard();
    }
    catch (e) { setStoryMsg(e.message || 'Opslaan mislukt'); } finally { setBusy(false); }
  }, [nameInput, name, age, country, story, link, roleLine, languages, intention, socials, visibleName, descAnswers, intentAnswers, refreshCard]);

  // Ensure a placed link is a valid absolute URL (prepend https:// when the user omits the scheme).
  const hrefFor = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

  const savePassword = useCallback(async () => {
    if (!newPw || newPw.length < 6) { setPwMsg('Nieuw wachtwoord: minstens 6 tekens.'); return; }
    setBusy(true); setPwMsg('');
    try {
      const r = await updatePassword({ currentPassword: curPw, newPassword: newPw });
      setCurPw(''); setNewPw('');
      // Gated by email: the change only takes effect after the confirmation link is clicked.
      setPwMsg(r && r.pending === false
        ? 'Wachtwoord gewijzigd ✓'
        : 'Bevestigingsmail verzonden — activeer je nieuwe wachtwoord via je inbox ✓');
    }
    catch (e) { setPwMsg(e.message || 'Wachtwoord bijwerken mislukt'); } finally { setBusy(false); }
  }, [curPw, newPw]);

  // Change the account email. Requires the current password. When SMTP is on, the change is gated:
  // a confirmation link goes to the NEW address and the account email stays put until it's clicked.
  const saveEmail = useCallback(async () => {
    const next = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) { setEmailMsg('Voer een geldig e-mailadres in.'); return; }
    if (next === (user.email || '').toLowerCase()) { setEmailMsg('Dit is al je huidige e-mailadres.'); return; }
    if (!emailPw) { setEmailMsg('Vul je huidige wachtwoord in ter bevestiging.'); return; }
    setBusy(true); setEmailMsg('');
    try {
      const r = await updateEmail({ newEmail: next, currentPassword: emailPw });
      setEmailPw('');
      if (r && r.pending === false) {
        setPendingEmail('');
        setEmailMsg('E-mailadres gewijzigd ✓');
      } else {
        setPendingEmail(next);
        setEmailMsg(`Bevestigingsmail verzonden naar ${next} — je e-mailadres verandert pas na bevestiging.`);
      }
    }
    catch (e) { setEmailMsg(e.message || 'E-mailadres bijwerken mislukt'); } finally { setBusy(false); }
  }, [emailInput, emailPw, user.email]);

  const handleDelete = useCallback(async () => {
    if (delInput !== 'VERWIJDER') { setDelErr('Typ precies "VERWIJDER".'); return; }
    setBusy(true); setDelErr('');
    try { await deleteOwnAccount(); onLogout(); }
    catch (e) { setDelErr(e.message || 'Verwijderen mislukt'); setBusy(false); }
  }, [delInput, onLogout]);

  // ── Social OAuth verification: opens the platform's own consent popup; the callback
  // page posts 'gfl-social-verified' back, after which we re-pull the card (the platform's
  // handle overwrites the typed one and the icon turns fully synchronised).
  const socialVerified = (k) => !!(card && card.declared && card.declared.socials && card.declared.socials[k] && card.declared.socials[k].verified);
  const syncSocial = useCallback(async (platform) => {
    setStoryMsg('');
    try {
      const { url } = await startSocialVerify(platform);
      window.open(url, 'gfl-social-verify', 'width=520,height=680');
    } catch (e) { setStoryMsg(e.message || 'Synchronisatie mislukt'); }
  }, []);
  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || e.data.type !== 'gfl-social-verified') return;
      getCard().then((fresh) => {
        setCard(fresh);
        setSocials(socialHandles(fresh && fresh.declared && fresh.declared.socials));
        if (e.data.ok) setStoryMsg('Social gesynchroniseerd ✓');
      }).catch(() => {});
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Synchroniseer nieuw kristal: link a NEW reading's report-PDF to this account. The orb
  // code + archetype are extracted from the PDF (the rest is discarded); the new orb becomes the
  // active profile orb and the previous one shifts into the individuatiepad. Local client-mode
  // stores are promoted so the big orb updates instantly.
  const [syncMsg, setSyncMsg] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);
  const syncFileRef = useRef(null);

  const finishSync = useCallback(async (newCode, archetypeName, reading) => {
    // reading = extracted §2.1 fields (main/support + shape vector) from the PDF parse;
    // /orb/link stores them on the new orbHistory entry (or backfills an already-owned code).
    await orbLinkCode(newCode, archetypeName, reading);
    setClientOrbCode(newCode);
    try {
      const fresh = await getCard();
      setCard(fresh);
      const orb = fresh?.derived?.latest?.orbRenderRef?.orb;
      if (orb) { setClientOrbConfig(orb); setOrbConfig(orb); } // swap the on-screen orb too
    } catch { refreshCard(); }
    if (archetypeName) { try { setClientProfile({ ...(getClientProfile() || {}), archetypeName }); } catch { /* ignore */ } }
    setSyncMsg('Nieuw kristal gesynchroniseerd ✓');
  }, [refreshCard]);

  // ── Upload gate (access model): a new kristal-code may be attached 2 months after the
  // last one. /me delivers nextUploadAvailableAt; fall back to computing it from orbHistory.
  const nextUploadAt = (() => {
    if (user.nextUploadAvailableAt) return new Date(user.nextUploadAvailableAt);
    const hist = Array.isArray(user.orbHistory) ? user.orbHistory : [];
    const lastAt = hist.length ? hist[hist.length - 1].at : null;
    if (!lastAt) return null;
    const d = new Date(lastAt); d.setMonth(d.getMonth() + 2); return d;
  })();
  const uploadGateClosed = !!(nextUploadAt && nextUploadAt > new Date());
  const fmtDateNL = (d) => (d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
  // Access expired: still logged in, but the profile card hides behind an overlay and Privé
  // reduces to the PDF-upload block; only Instellingen stays fully usable.
  const accessExpired = !!(user.accessUntil && new Date(user.accessUntil) < new Date());

  const syncFromPdf = useCallback(async (file) => {
    if (!file) return;
    setSyncBusy(true); setSyncMsg('');
    try {
      const r = await orbLoginFromPdf(file);
      if (!r || !r.code) throw new Error('Geen kristal-code gevonden in deze PDF.');
      await finishSync(r.code, r.archetypeName || '', r.reading || null);
    } catch (e) { setSyncMsg(e.message || 'Synchroniseren mislukt'); }
    finally { setSyncBusy(false); if (syncFileRef.current) syncFileRef.current.value = ''; }
  }, [finishSync]);

  // ── Download the orb in FHD: a still PNG + a 12-second 60fps loop (WebM). ──
  // Captured from a HIDDEN 1080px capture orb (not the small on-screen one), composited into a
  // 1920×1080 frame. For the still we freeze the orb first, then grab the settled frame.
  const captureBoxRef = useRef(null);
  const onScreenOrbRef = useRef(null); // wraps the visible orb — read for the crystal-history still
  const [capturePhase, setCapturePhase] = useState(null); // null | 'image' | 'video'
  const [frozen, setFrozen] = useState(false);            // stop rotation before the still
  const [recording, setRecording] = useState(false);
  const [dlMsg, setDlMsg] = useState('');
  const fileBase = `${(name || 'kristal').trim().replace(/\s+/g, '-')}-orb`;
  const captureSupported = typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';

  // ── Crystal snapshots: EVERY reading gets a COLOUR still for the individuatiepad chips —
  // including the first/active orb. The orb scene can stay suspended (black) for seconds while
  // assets load, so the capture POLLS until the frame actually contains colour instead of
  // shooting on a timer — and stored stills that are black (earlier too-early captures) are
  // detected and recaptured with force-overwrite.
  const [snapIdx, setSnapIdx] = useState(null);              // orbHistory index being captured
  const snapDoneRef = useRef(new Set());                     // handled this session (user prop is stale)
  const snapBoxRef = useRef(null);

  // A frame "has colour" when >1% of sampled pixels rise above the #0a0510 background.
  const canvasIsBlack = (cnv) => {
    try {
      const cx = cnv.getContext('2d');
      const { data } = cx.getImageData(0, 0, cnv.width, cnv.height);
      let lit = 0;
      const step = 16 * 4; // sample every 16th pixel
      for (let i = 0; i < data.length; i += step) {
        if (Math.max(data[i], data[i + 1], data[i + 2]) > 28) lit++;
      }
      return lit < (data.length / step) * 0.01;
    } catch { return false; }
  };
  const dataUrlIsBlack = (url) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const cnv = document.createElement('canvas');
      cnv.width = img.width || 256; cnv.height = img.height || 256;
      cnv.getContext('2d').drawImage(img, 0, 0);
      resolve(canvasIsBlack(cnv));
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });

  // Build/advance the queue: entries without a still, plus entries whose stored still is black.
  useEffect(() => {
    let alive = true;
    (async () => {
      const hist = Array.isArray(user.orbHistory) ? user.orbHistory : [];
      for (let i = 0; i < hist.length; i++) {
        const h = hist[i];
        if (!h || !h.orb || snapDoneRef.current.has(i)) continue;
        if (!h.image || await dataUrlIsBlack(h.image)) { // eslint-disable-line no-await-in-loop
          if (alive) setSnapIdx(i);
          return;
        }
        snapDoneRef.current.add(i); // stored still is fine
      }
      if (alive) setSnapIdx(null);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.orbHistory]);

  useEffect(() => {
    if (snapIdx == null) return undefined;
    let cancelled = false;
    let tries = 0;
    const advance = () => {
      snapDoneRef.current.add(snapIdx);
      const hist = Array.isArray(user.orbHistory) ? user.orbHistory : [];
      const next = hist.findIndex((h, i) => h && h.orb && !snapDoneRef.current.has(i) && !h.image);
      setSnapIdx(next === -1 ? null : next);
      if (next === -1) refreshCard(); // chips pick up the fresh colour stills
    };
    const timer = setInterval(() => {
      if (cancelled) return;
      tries++;
      const src = snapBoxRef.current?.querySelector('canvas');
      if (src && src.width) {
        const S = 256;
        const out = document.createElement('canvas'); out.width = S; out.height = S;
        const cx = out.getContext('2d');
        cx.fillStyle = '#0a0510'; cx.fillRect(0, 0, S, S);
        try {
          cx.drawImage(src, 0, 0, S, S);
          if (!canvasIsBlack(out)) { // the orb has actually rendered — capture is valid
            clearInterval(timer);
            let data = null;
            try { data = out.toDataURL('image/webp', 0.8); } catch { try { data = out.toDataURL('image/jpeg', 0.82); } catch { data = null; } }
            if (!data) { advance(); return; }
            saveOrbSnapshot(data, snapIdx, true).catch(() => {}).finally(() => { if (!cancelled) advance(); });
            return;
          }
        } catch { /* keep polling */ }
      }
      if (tries > 40) { clearInterval(timer); advance(); } // ~16s give-up for this entry
    }, 400);
    return () => { cancelled = true; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapIdx]);

  // Archetype portrait — MUST match the PDF cover circle exactly (some portraits are
  // hand-photoshopped to fit that circle): 600×600, circular clip, source drawn to fill
  // the full square — content outside the circle is cut off, never the raw asset file.
  // Exported as JPEG on full black — matching the orb downloads' black-frame look.
  const archetypeName = user.archetypeName || profile.archetypeName || '';
  const archetypeImg = getArchetypeImageByName(archetypeName);
  const downloadArchetypePhoto = useCallback(async () => {
    if (!archetypeImg) { setDlMsg('Geen archetype-afbeelding gevonden.'); return; }
    setDlMsg('');
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = archetypeImg; });
      // Same framing as the PDF cover circle (600 source-square → 567 visible circle, the
      // ring-covered rim cropped away).
      const SRC = 600, S = 567;
      const cnv = document.createElement('canvas'); cnv.width = S; cnv.height = S;
      const cx = cnv.getContext('2d');
      cx.fillStyle = '#000'; cx.fillRect(0, 0, S, S); // full black corners (JPEG has no alpha)
      cx.beginPath(); cx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); cx.closePath(); cx.clip();
      cx.drawImage(img, (S - SRC) / 2, (S - SRC) / 2, SRC, SRC);
      const blob = await new Promise((res) => cnv.toBlob(res, 'image/jpeg', 0.95));
      if (!blob) throw new Error('toBlob failed');
      triggerDownload(blob, `${(archetypeName || 'archetype').trim().replace(/\s+/g, '-')}-profielfoto.jpg`);
      setDlMsg('Profielfoto opgeslagen ✓');
    } catch { setDlMsg('Download mislukt.'); }
  }, [archetypeImg, archetypeName]);

  const startImage = useCallback(() => { if (capturePhase || !orbConfig) return; setDlMsg(''); setFrozen(false); setCapturePhase('image'); }, [capturePhase, orbConfig]);
  const startVideo = useCallback(() => {
    if (capturePhase || !orbConfig) return;
    if (!captureSupported) { setDlMsg('Video wordt niet ondersteund in deze browser.'); return; }
    setDlMsg(''); setFrozen(false); setCapturePhase('video');
  }, [capturePhase, orbConfig, captureSupported]);

  // Runs the capture once the hidden orb has mounted + rendered a few frames.
  useEffect(() => {
    if (!capturePhase) return;
    let cancelled = false;
    const timers = [];
    const srcCanvas = () => captureBoxRef.current?.querySelector('canvas') || null;
    // Composite the square 1080px capture canvas centered into a 1920×1080 frame on FULL BLACK.
    const drawFHD = (ctx, src) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1920, 1080); ctx.drawImage(src, (1920 - 1080) / 2, 0, 1080, 1080); };

    if (capturePhase === 'image') {
      timers.push(setTimeout(() => {
        if (cancelled) return;
        setFrozen(true); // stop the orb…
        timers.push(setTimeout(() => { // …then screenshot the settled frame
          if (cancelled) return;
          const src = srcCanvas();
          if (!src) { setDlMsg('Orb nog niet gereed.'); setCapturePhase(null); setFrozen(false); return; }
          const out = document.createElement('canvas'); out.width = 1920; out.height = 1080;
          const octx = out.getContext('2d');
          octx.fillStyle = '#000'; octx.fillRect(0, 0, 1920, 1080); // full black background (JPEG has no alpha)
          octx.drawImage(src, (1920 - 1080) / 2, 0, 1080, 1080);
          out.toBlob((blob) => {
            if (blob) { triggerDownload(blob, `${fileBase}.jpg`); setDlMsg('Afbeelding opgeslagen ✓ (FHD)'); }
            else setDlMsg('Afbeelding mislukt.');
            setCapturePhase(null); setFrozen(false);
          }, 'image/jpeg', 0.95);
        }, 280));
      }, 600));
      return () => { cancelled = true; timers.forEach(clearTimeout); };
    }

    // video — 12s @ 60fps FHD, real MP4 via WebCodecs (fallback: MediaRecorder).
    timers.push(setTimeout(() => {
      if (cancelled) return;
      const src = srcCanvas();
      if (!src) { setDlMsg('Orb nog niet gereed.'); setCapturePhase(null); return; }
      setRecording(true);
      setDlMsg('Opnemen… (12s · 60fps · FHD)');

      const finish = (blob, ext) => {
        if (cancelled) return;
        triggerDownload(blob, `${fileBase}-12s.${ext}`);
        setDlMsg(`12s-loop opgeslagen ✓ (60fps FHD · ${ext.toUpperCase()})`);
        setRecording(false); setCapturePhase(null);
      };
      const fail = () => { if (cancelled) return; setDlMsg('Opname mislukt.'); setRecording(false); setCapturePhase(null); };

      // Fallback path — MediaRecorder (older browsers without WebCodecs).
      const viaMediaRecorder = () => {
        const out = document.createElement('canvas'); out.width = 1920; out.height = 1080;
        const ctx = out.getContext('2d');
        let raf = 0;
        const loop = () => { drawFHD(ctx, src); raf = requestAnimationFrame(loop); };
        loop();
        let stream;
        try { stream = out.captureStream(60); } catch { cancelAnimationFrame(raf); fail(); return; }
        const mime = ['video/mp4;codecs=avc1.640028', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
        const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
        let rec;
        try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 16_000_000 }); }
        catch { cancelAnimationFrame(raf); fail(); return; }
        const chunks = [];
        rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = () => { cancelAnimationFrame(raf); stream.getTracks().forEach((t) => t.stop()); finish(new Blob(chunks, { type: mime }), ext); };
        rec.start();
        timers.push(setTimeout(() => { if (rec.state !== 'inactive') rec.stop(); }, 12000));
      };

      if (typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined') {
        recordOrbMp4({
          srcCanvas: src, durationMs: 12000, fps: 60, bitrate: 12_000_000,
          isCancelled: () => cancelled,
          onProgress: (p) => { if (!cancelled) setDlMsg(`Opnemen… ${Math.round(p * 100)}% (60fps FHD · MP4)`); },
        }).then((blob) => finish(blob, 'mp4'))
          .catch((e) => { console.error('[orb mp4] WebCodecs failed, falling back:', e); if (!cancelled) viaMediaRecorder(); });
      } else {
        viaMediaRecorder();
      }
    }, 600));
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [capturePhase, fileBase]);

  // Auto-dismiss the download status after 5s — but keep the in-progress "…" message on screen.
  useEffect(() => {
    if (!dlMsg || dlMsg.includes('…')) return;
    const t = setTimeout(() => setDlMsg(''), 5000);
    return () => clearTimeout(t);
  }, [dlMsg]);

  // Tab switcher — rendered above the orb (two-column tabs) OR as row 1 of the Openbaar card.
  const tabsRow = (
    <div style={{ display: 'flex', gap: '0.35rem', width: '100%', alignSelf: 'stretch', position: 'relative', zIndex: 2, maxWidth: '26rem' }}>
      {[{ key: 'openbaar', label: 'Openbaar' }, { key: 'prive', label: 'Privé' }, { key: 'instellingen', label: 'Instellingen' }].map((tb) => {
        const on = tab === tb.key;
        return (
          <button key={tb.key} type="button" onClick={() => { setTab(tb.key); setMsg(''); setPwMsg(''); setDelErr(''); setStoryMsg(''); }}
            style={{ flex: 1, minWidth: 0, cursor: 'pointer', background: on ? 'rgba(168,85,247,0.22)' : 'transparent', border: `1px solid ${on ? C.purple : 'rgba(168,85,247,0.28)'}`, color: on ? C.gold : 'rgba(255,255,255,0.55)', borderRadius: '0.4rem', padding: '0.42rem 0.3rem', fontFamily: FONT, fontSize: 'max(8px,0.46vw)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.15s' }}>
            {tb.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: FONT, color: C.text }}>
      {/* Hidden high-res (1080px) capture orb — mounted only during a download. Off-screen but still
          rendered (frameloop keeps running); the handlers read its canvas. Frozen for the still. */}
      {capturePhase && orbConfig && (
        <div ref={captureBoxRef} aria-hidden="true" style={{ position: 'fixed', left: -99999, top: 0, width: 800, height: 800, opacity: 0, pointerEvents: 'none' }}>
          <OrbSphere3D config={orbConfig} active={!frozen} size={800} dprOverride={1} capturable />
        </div>
      )}
      {/* Hidden snapshot orb — renders the imageless history entry currently in the queue so its
          COLOUR still can be captured for the individuatiepad chip. */}
      {snapIdx != null && user.orbHistory?.[snapIdx]?.orb && (
        <div ref={snapBoxRef} aria-hidden="true" style={{ position: 'fixed', left: -99999, top: 0, width: 256, height: 256, opacity: 0, pointerEvents: 'none' }}>
          <OrbSphere3D key={snapIdx} config={user.orbHistory[snapIdx].orb} active size={256} dprOverride={1} capturable />
        </div>
      )}
      {/* Reserve header space at the TOP (rem floor — the header is rem-sized, so on a shorter
          screen it eats a bigger share of the viewport; centering into full 100vh would slide the
          card up behind it). The card then centers within the header-cleared area. */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(6.5rem, 14vh, 10rem) clamp(1rem, 3vw, 3rem) clamp(1rem, 4vh, 3rem)' }}>

        {/* ── OPENBAAR — the profile card (cardPayload.v1 render; identical to the public ?u= view).
            Access expired → the card stays hidden behind the same shell with an expiry notice;
            the tabs keep working so Privé (upload) and Instellingen stay reachable. ── */}
        {tab === 'openbaar' && (
          accessExpired
            ? (
              <ProfileCard payload={card || {}} tabsRow={tabsRow}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.9rem', padding: '3rem 2rem' }}>
                  <div style={{ fontFamily: FONT, fontSize: 'max(14px,0.8vw)', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f59e0b' }}>Toegang verlopen</div>
                  <div style={{ fontSize: 'max(11px,0.6vw)', color: '#FFFEF0', lineHeight: 1.6, maxWidth: '34rem' }}>
                    Je toegang was geldig tot <b>{fmtDateNL(user.accessUntil)}</b>. Upload een nieuw rapport-PDF onder <b>Privé</b> om je profiel opnieuw te ontgrendelen — elke nieuwe kristal-code opent 3 maanden toegang.
                  </div>
                  <SciFiButton onClick={() => setTab('prive')} variant="purple" size="sm" padding="0.4rem 1.35rem" fontSize="max(9px,0.5vw)">Naar Privé — upload rapport</SciFiButton>
                </div>
              </ProfileCard>
            )
            : card
              ? <ProfileCard payload={card} tabsRow={tabsRow} orbConfigOverride={orbConfig} active={active} orbBoxRef={onScreenOrbRef} wheelBaskets={user.readingBaskets}
                  wheelBasketsHistory={(Array.isArray(user.orbHistory) ? user.orbHistory : []).map((h) => (Array.isArray(h?.baskets12) && h.baskets12.length === 12 ? h.baskets12 : null))} />
              : <div style={{ fontFamily: FONT, fontSize: 'max(12px,0.7vw)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,181,253,0.7)' }}>Kaart laden…</div>
        )}

        {/* Privé/Instellingen render inside the SAME ProfileCard shell as Openbaar (glass, brackets,
            holo, footprint) — it's ONE card; only the inner body content swaps with the tab.
            Tabs are Row 1 of the card; this is just the body. */}
        {tab !== 'openbaar' && (
        <ProfileCard payload={card || {}} tabsRow={tabsRow}>

          {/* content — full width, left-aligned; account/data only (no orb: the crystal identity
              lives on the Openbaar card). */}
          <div style={{ width: '100%', minWidth: 0 }}>

            {/* ── PRIVÉ — personal data (not shown to others) ── */}
            {tab === 'prive' && (
              <div>
                <div style={{ ...SECTION_TITLE, marginBottom: '1.1rem' }}>Privégegevens</div>
                {/* Inlognaam (the unique account name / ?u= handle) is ACCOUNT data — it lives
                    under Instellingen. Privé only carries the Zichtbare naam (card name) below. */}

                {/* synchroniseer nieuw kristal — at the top, above age/country: upload a new
                    reading's PDF; it becomes the active orb */}
                <div style={{ marginBottom: '1.05rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ ...LABEL, marginBottom: '0.6rem' }}>Synchroniseer nieuw kristal</div>
                  <div style={{ fontSize: 'max(11px,0.58vw)', color: '#FFFEF0', lineHeight: 1.5, marginBottom: '0.7rem' }}>
                    Nieuwe lezing gedaan? Upload de rapport-PDF — we halen alleen je kristal en archetype eruit om je profiel bij te werken, de rest wordt genegeerd. De nieuwe orb wordt je actieve profiel-orb, de vorige schuift door naar je individuatiepad.
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input ref={syncFileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => syncFromPdf(e.target.files && e.target.files[0])} />
                    {/* Gate: disabled + no pointer events until 2 months after the last code. */}
                    <SciFiButton onClick={() => syncFileRef.current && syncFileRef.current.click()} disabled={syncBusy || uploadGateClosed} variant="purple" size="sm" padding="0.4rem 1.2rem" fontSize="max(9px,0.5vw)" style={{ pointerEvents: uploadGateClosed ? 'none' : 'auto' }}>{syncBusy ? 'Bezig…' : 'Upload rapport-PDF'}</SciFiButton>
                    {uploadGateClosed && (
                      <span style={{ fontSize: 'max(9px,0.5vw)', color: 'rgba(251,191,36,0.9)' }}>
                        Nieuw rapport uploaden kan vanaf {fmtDateNL(nextUploadAt)}
                      </span>
                    )}
                    {syncMsg && <span style={{ fontSize: 'max(9px,0.5vw)', color: syncMsg.includes('✓') ? '#4ade80' : '#f87171' }}>{syncMsg}</span>}
                  </div>
                </div>

                {/* Access expired → Privé reduces to the upload block above; everything below
                    (declared card content, socials, save) hides until a new code re-opens access. */}
                {accessExpired && (
                  <div style={{ fontSize: 'max(10px,0.55vw)', color: 'rgba(251,191,36,0.9)', lineHeight: 1.5 }}>
                    Je toegang is verlopen. Upload hierboven een nieuw rapport-PDF om je profiel opnieuw te ontgrendelen.
                  </div>
                )}
                {!accessExpired && (<>
                <div style={{ display: 'flex', gap: '0.9rem', marginBottom: '1.05rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={LABEL}>Leeftijd</div>
                    <input type="number" min="0" value={age} onChange={(e) => { setAge(e.target.value); setMsg(''); }} style={FIELD} />
                  </div>
                  <div style={{ flex: 2 }}>
                    <div style={LABEL}>Land</div>
                    <input value={country} onChange={(e) => { setCountry(e.target.value); setMsg(''); }} style={FIELD} />
                  </div>
                </div>
                {/* Openbaar-card content — the DECLARED channel, edited here, rendered read-only
                    on the Openbaar card (register separation: this path never touches derived fields). */}
                <div style={{ marginTop: '1.15rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ ...LABEL, marginBottom: '0.6rem' }}>Openbaar profiel — kaartinhoud</div>
                  {/* Zichtbare naam — the name shown on the card. Separate from the Inlognaam above;
                      leave empty to fall back to your Inlognaam. */}
                  <div style={{ marginBottom: '0.8rem' }}>
                    <div style={{ ...LABEL, color: '#FFFEF0' }}>Zichtbare naam — op je kaart</div>
                    <input value={visibleName} onChange={(e) => { setVisibleName(e.target.value); setStoryMsg(''); }} maxLength={40} placeholder={name || 'Zoals getoond op je profielkaart'} style={FIELD} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.9rem', marginBottom: '0.8rem' }}>
                    <div style={{ flex: 2 }}>
                      <div style={LABEL}>Rolregel — optioneel</div>
                      <input value={roleLine} onChange={(e) => { setRoleLine(e.target.value); setStoryMsg(''); }} maxLength={80} placeholder="Platformbouwer · Ontwerper" style={FIELD} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={LABEL}>Talen</div>
                      <input value={languages} onChange={(e) => { setLanguages(e.target.value); setStoryMsg(''); }} maxLength={60} placeholder="NL, EN" style={FIELD} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.8rem' }}>
                    <div style={LABEL}>Beschrijving</div>
                    {/* §6b vragen ABOVE the self-write block — answers form an APART leesbaar blok
                        op de kaart (inspiratie naast het eigen verhaal); nooit ingevuld in de tekst. */}
                    <div style={{ ...LABEL, marginTop: '0.15rem', color: '#FFFEF0' }}>Vragen — vul in wat je wil; antwoorden verschijnen als apart blok op je kaart</div>
                    <PresetQuestions block="description" values={descAnswers} onChange={(k, v) => { setDescAnswers((m) => ({ ...m, [k]: v })); setStoryMsg(''); }} />
                    <textarea
                      value={story}
                      onChange={(e) => { setStory(e.target.value); setStoryMsg(''); }}
                      maxLength={2000}
                      rows={5}
                      placeholder="Schrijf een diep verhaal over jezelf — je kan de bovenstaande vragen gebruiken als kompas."
                      style={{ ...FIELD, minHeight: '6.5rem', resize: 'vertical', lineHeight: 1.5, fontFamily: FONT, marginTop: '0.55rem' }}
                    />
                    <div style={{ textAlign: 'right', fontSize: 'max(8px,0.42vw)', color: 'rgba(255,254,240,0.7)', marginTop: '0.2rem' }}>{story.length}/2000</div>
                  </div>
                  <div style={{ marginBottom: '0.8rem' }}>
                    <div style={LABEL}>Intentie</div>
                    <div style={{ ...LABEL, marginTop: '0.15rem', color: '#FFFEF0' }}>Vragen — vul in wat je wil; antwoorden verschijnen als apart blok op je kaart</div>
                    <PresetQuestions block="intention" values={intentAnswers} onChange={(k, v) => { setIntentAnswers((m) => ({ ...m, [k]: v })); setStoryMsg(''); }} />
                    <textarea
                      value={intention}
                      onChange={(e) => { setIntention(e.target.value); setStoryMsg(''); }}
                      maxLength={2000}
                      rows={4}
                      placeholder="Schrijf wat je hier komt zoeken én brengen — de vragen hierboven wijzen de richting."
                      style={{ ...FIELD, minHeight: '5rem', resize: 'vertical', lineHeight: 1.5, fontFamily: FONT, marginTop: '0.55rem' }}
                    />
                    <div style={{ textAlign: 'right', fontSize: 'max(8px,0.42vw)', color: 'rgba(255,254,240,0.7)', marginTop: '0.2rem' }}>{intention.length}/2000</div>
                  </div>
                  <div style={{ marginBottom: '0.8rem' }}>
                    <div style={LABEL}>Link</div>
                    <input value={link} onChange={(e) => { setLink(e.target.value); setStoryMsg(''); }} maxLength={200} placeholder="https://…" style={FIELD} />
                  </div>
                  {/* Socials — all optional; handle of volledige URL. Shown as icons bottom-right on the
                      card. "Sync" proves ownership via het platform zelf (OAuth) → ✓ gesynchroniseerd. */}
                  <div style={{ marginBottom: '0.8rem' }}>
                    <div style={LABEL}>Socials — optioneel (handle of URL)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: '0.6rem' }}>
                      {[['instagram', 'Instagram'], ['youtube', 'YouTube'], ['tiktok', 'TikTok'], ['x', 'X'], ['linkedin', 'LinkedIn']].map(([k, lbl]) => (
                        <div key={k} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <input value={socials[k]} maxLength={200} placeholder={lbl}
                            onChange={(e) => { const v = e.target.value; setSocials((s) => ({ ...s, [k]: v })); setStoryMsg(''); }}
                            style={{ ...FIELD, flex: 1, minWidth: 0 }} />
                          {socialVerified(k)
                            ? <span title="Gesynchroniseerd via het platform" style={{ color: '#15b315', fontSize: 'max(10px,0.55vw)', whiteSpace: 'nowrap' }}>✓</span>
                            : (
                              <button type="button" onClick={() => syncSocial(k)} title={`Bewijs eigenaarschap via ${lbl} zelf`}
                                style={{ background: 'none', border: '1px solid rgba(21,179,21,0.4)', borderRadius: '0.3rem', color: 'rgba(21,179,21,0.8)', cursor: 'pointer', fontSize: 'max(8px,0.45vw)', padding: '0.3rem 0.5rem', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                                Sync
                              </button>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <SciFiButton onClick={saveAll} disabled={busy} variant="purple" size="sm" padding="0.4rem 1.35rem" fontSize="max(9px,0.5vw)">Profiel opslaan</SciFiButton>
                  {storyMsg && <div style={{ marginTop: '0.6rem', fontSize: 'max(9px,0.5vw)', color: storyMsg.includes('✓') ? '#4ade80' : '#f87171' }}>{storyMsg}</div>}
                </div>
                </>)}
              </div>
            )}

            {/* ── INSTELLINGEN — account name, password, delete, logout ── */}
            {tab === 'instellingen' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.2rem', marginBottom: '1.1rem' }}>
                  <div style={SECTION_TITLE}>Instellingen</div>
                  <SciFiButton onClick={onLogout} variant="purple" size="sm" padding="0.4rem 1.4rem" fontSize="max(9px,0.5vw)">Uitloggen</SciFiButton>
                </div>

                {/* name (unique) */}
                <div style={{ marginBottom: '0.9rem' }}>
                  <div style={LABEL}>Inlognaam — uniek</div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <input value={nameInput} onChange={(e) => { setNameInput(e.target.value); setMsg(''); }} maxLength={40}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveName(); }} style={FIELD} />
                    <SciFiButton onClick={saveName} disabled={busy || !nameInput.trim() || nameInput.trim() === name} variant="purple" size="sm" padding="0.4rem 1.05rem" fontSize="max(9px,0.5vw)">Opslaan</SciFiButton>
                  </div>
                  {msg && <div style={{ marginTop: '0.6rem', fontSize: 'max(9px,0.5vw)', color: msg.includes('✓') ? '#4ade80' : '#f87171' }}>{msg}</div>}
                </div>

                {/* email — editable, but a change is gated behind a confirmation click on the NEW
                    address; the current email stays active until then. Requires the current password. */}
                <div style={{ marginTop: '1.15rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={LABEL}>E-mailadres</div>
                  <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <input type="email" value={emailInput} onChange={(e) => { setEmailInput(e.target.value); setEmailMsg(''); }} autoComplete="email" placeholder="jij@voorbeeld.nl" style={{ ...FIELD, flex: 2 }} />
                    <input type={showPw ? 'text' : 'password'} value={emailPw} onChange={(e) => { setEmailPw(e.target.value); setEmailMsg(''); }} placeholder="Huidig wachtwoord" autoComplete="current-password" style={{ ...FIELD, flex: 1 }} />
                  </div>
                  <SciFiButton onClick={saveEmail} disabled={busy || !emailInput.trim() || emailInput.trim().toLowerCase() === (user.email || '').toLowerCase() || !emailPw} variant="purple" size="sm" padding="0.4rem 1.35rem" fontSize="max(9px,0.5vw)">E-mailadres wijzigen</SciFiButton>
                  {pendingEmail && pendingEmail.toLowerCase() !== (user.email || '').toLowerCase() && (
                    <div style={{ marginTop: '0.6rem', fontSize: 'max(9px,0.5vw)', color: 'rgba(251,191,36,0.9)', lineHeight: 1.5 }}>
                      In afwachting van bevestiging: <b>{pendingEmail}</b>. Je huidige e-mailadres ({user.email}) blijft actief tot je de link in die inbox opent.
                    </div>
                  )}
                  {emailMsg && <div style={{ marginTop: '0.6rem', fontSize: 'max(9px,0.5vw)', lineHeight: 1.5, color: emailMsg.includes('✓') ? '#4ade80' : emailMsg.includes('verzonden') ? 'rgba(196,181,253,0.9)' : '#f87171' }}>{emailMsg}</div>}
                </div>

                {/* password */}
                <div style={{ marginTop: '1.15rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <div style={{ ...LABEL, marginBottom: 0 }}>Wachtwoord</div>
                    <button type="button" onClick={() => setShowPw((v) => !v)} style={{ background: 'none', border: 'none', color: 'rgba(196,181,253,0.75)', cursor: 'pointer', fontSize: 'max(9px,0.48vw)', textDecoration: 'underline', padding: 0 }}>{showPw ? 'verberg' : 'toon'}</button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.9rem', marginBottom: '0.6rem' }}>
                    <input type={showPw ? 'text' : 'password'} value={curPw} onChange={(e) => { setCurPw(e.target.value); setPwMsg(''); }} placeholder="Huidig wachtwoord" autoComplete="current-password" style={{ ...FIELD, flex: 1 }} />
                    <input type={showPw ? 'text' : 'password'} value={newPw} onChange={(e) => { setNewPw(e.target.value); setPwMsg(''); }} placeholder="Nieuw wachtwoord" autoComplete="new-password" style={{ ...FIELD, flex: 1 }} />
                  </div>
                  <SciFiButton onClick={savePassword} disabled={busy || !curPw || !newPw} variant="purple" size="sm" padding="0.4rem 1.35rem" fontSize="max(9px,0.5vw)">Wachtwoord wijzigen</SciFiButton>
                  {pwMsg && <div style={{ marginTop: '0.6rem', fontSize: 'max(9px,0.5vw)', color: pwMsg.includes('✓') ? '#4ade80' : '#f87171' }}>{pwMsg}</div>}
                </div>

                {/* downloads — archetype portrait + orb still + 12s rotation loop */}
                <div style={{ marginTop: '1.15rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ ...LABEL, marginBottom: '0.6rem' }}>Downloaden</div>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <SciFiButton onClick={downloadArchetypePhoto} disabled={!!capturePhase || !archetypeImg} variant="purple" size="sm" padding="0.4rem 1.2rem" fontSize="max(9px,0.5vw)">Archetype profielfoto</SciFiButton>
                    <SciFiButton onClick={startImage} disabled={!!capturePhase || !orbConfig} variant="purple" size="sm" padding="0.4rem 1.2rem" fontSize="max(9px,0.5vw)">{capturePhase === 'image' ? 'Bezig…' : 'Kristal screenshot'}</SciFiButton>
                    <SciFiButton onClick={startVideo} disabled={!!capturePhase || !orbConfig} variant="purple" size="sm" padding="0.4rem 1.2rem" fontSize="max(9px,0.5vw)">{recording ? 'Opnemen…' : 'Kristal 60fps 12s-Loop'}</SciFiButton>
                    {dlMsg && <span style={{ fontSize: 'max(9px,0.48vw)', color: dlMsg.includes('✓') ? '#4ade80' : dlMsg.includes('…') ? 'rgba(196,181,253,0.85)' : '#f87171' }}>{dlMsg}</span>}
                  </div>
                </div>

                {/* Toegang — unlocks after 3 linked kristal-codes (access model): the user has
                    proven commitment; offer subscription (cheaper than a new test), a year, or
                    lifetime. No payment rails yet → options render disabled with a coming-soon note. */}
                {(Array.isArray(user.orbHistory) ? user.orbHistory : []).length >= 3 && (
                  <div style={{ marginTop: '1.15rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ ...LABEL, marginBottom: '0.6rem' }}>Toegang</div>
                    <div style={{ fontSize: 'max(11px,0.58vw)', color: '#FFFEF0', lineHeight: 1.5, marginBottom: '0.7rem' }}>
                      Je hebt drie kristal-codes gekoppeld — vanaf nu kun je je toegang ook zonder nieuwe test voortzetten.
                      {user.accessUntil && <> Je huidige toegang is geldig tot <b>{fmtDateNL(user.accessUntil)}</b>.</>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <SciFiButton disabled variant="purple" size="sm" padding="0.4rem 1.2rem" fontSize="max(9px,0.5vw)">Abonnement — per 3 maanden</SciFiButton>
                      <SciFiButton disabled variant="purple" size="sm" padding="0.4rem 1.2rem" fontSize="max(9px,0.5vw)">Jaartoegang</SciFiButton>
                      <SciFiButton disabled variant="purple" size="sm" padding="0.4rem 1.2rem" fontSize="max(9px,0.5vw)">Levenslange toegang</SciFiButton>
                      <span style={{ fontSize: 'max(9px,0.5vw)', color: 'rgba(196,181,253,0.75)' }}>Binnenkort beschikbaar</span>
                    </div>
                  </div>
                )}

                {/* danger: delete account */}
                <div style={{ marginTop: '1.15rem', paddingTop: '1rem', borderTop: '1px solid rgba(239,68,68,0.25)' }}>
                  <div style={{ color: '#fca5a5', fontSize: 'max(9px,0.52vw)', lineHeight: 1.5, marginBottom: '0.8rem' }}>
                    ⚠ Verwijdert je account permanent (AVG/GDPR). Typ <b>VERWIJDER</b>:
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input value={delInput} onChange={(e) => setDelInput(e.target.value)} placeholder="VERWIJDER"
                      style={{ ...FIELD, width: '15rem', borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' }} />
                    <SciFiButton onClick={handleDelete} disabled={busy} variant="danger" size="sm" padding="0.4rem 1.2rem" fontSize="max(9px,0.5vw)">Verwijderen</SciFiButton>
                    {delErr && <span style={{ color: '#f87171', fontSize: 'max(9px,0.48vw)' }}>{delErr}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ProfileCard>
        )}
      </div>
    </div>
  );
});

ProfileDashboard.displayName = 'ProfileDashboard';
export default ProfileDashboard;
