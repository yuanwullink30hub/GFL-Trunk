import React, { memo, useState, useEffect, useCallback } from 'react';
import { getHistory, getAssessment, downloadPdf, deleteOwnAccount, updateDisplayName } from '@gfl/api-client';
import { C, FONT, SciFiButton } from '@gfl/ui';
import { OrbSphere, OrbSphere3D, configFromResult, orbCodeFromResult, deriveOrb3, encodeOrb3, decodeOrb3, GROUP } from '../../orb';

/* ════════════════════════════════════════════════════════════════════════
   ClientOrbExperience — the client landing.
   Not a dashboard: the liquid-crystal orb (rendered from the user's assessment
   geometry / profile-code) sits large at the centre, with a spread-out set of
   interaction nodes around it. The old tabbed ClientProfileModal is retired;
   its essential functions (report download, GDPR delete, history) live on as
   nodes here.
   ════════════════════════════════════════════════════════════════════════ */

const useViewport = () => {
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return vp;
};

// ── a floating interaction node (spread-out "path", not a tab) ──
const Node = ({ label, sub, accent = C.gold, onClick, style }) => (
  <button
    onClick={onClick}
    style={{
      position: 'absolute', zIndex: 6,
      display: 'flex', flexDirection: 'column', gap: '0.15rem',
      background: 'rgba(2,0,3,0.32)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      border: `1px solid ${accent}55`, borderRadius: '0.45rem',
      padding: '0.5rem 0.85rem', cursor: 'pointer', fontFamily: FONT,
      boxShadow: `0 0 16px -6px ${accent}`, transition: 'transform .18s, box-shadow .18s, border-color .18s',
      ...style,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 0 26px -4px ${accent}`; e.currentTarget.style.borderColor = accent; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 0 16px -6px ${accent}`; e.currentTarget.style.borderColor = `${accent}55`; }}
  >
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}`, flexShrink: 0 }} />
      <span style={{ fontSize: 'max(11px, 0.62vw)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent }}>{label}</span>
    </span>
    {sub && <span style={{ fontSize: 'max(8px, 0.42vw)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', marginLeft: '1.05rem' }}>{sub}</span>}
  </button>
);

// ── centred glass panel overlay (for code / history / account) ──
const Panel = ({ title, accent = C.purple, onClose, children }) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{
      width: 'min(560px, 92vw)', maxHeight: '80vh', overflowY: 'auto',
      background: 'rgba(2,0,3,0.55)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
      border: `1px solid ${accent}`, borderRadius: '0.6rem', boxShadow: `0 0 40px -10px ${accent}, 0 10px 50px rgba(0,0,0,0.6)`,
      fontFamily: FONT, color: C.text,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: `1px solid ${accent}44`, background: 'rgba(42,10,56,0.35)' }}>
        <span style={{ fontSize: 'max(11px, 0.6vw)', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent }}>{title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
      </div>
      <div style={{ padding: '1.1rem' }}>{children}</div>
    </div>
  </div>
);

const ClientOrbExperience = memo(({ user, active = true, onLogout, onClose, onNavigate }) => {
  const vp = useViewport();
  const orbSize = Math.round(Math.max(280, Math.min(vp.h * 0.64, vp.w * 0.46, 720)));

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);      // latest full assessment
  const [history, setHistory] = useState([]);
  const [config, setConfig] = useState(null);      // 2D metadata (_dominant / group)
  const [config3, setConfig3] = useState(null);    // 3D render config (from LC_ORB3)
  const [code, setCode] = useState('');
  const [panel, setPanel] = useState(null);        // 'code' | 'history' | 'account'
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  // editable visual name (unique, changeable anytime)
  const [name, setName] = useState(user.displayName || '');
  const [nameInput, setNameInput] = useState(user.displayName || '');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  // account-delete flow
  const [delInput, setDelInput] = useState('');
  const [delErr, setDelErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const h = await getHistory({ limit: 20 });
        const list = h.assessments || [];
        if (!alive) return;
        setHistory(list);
        if (list.length) {
          const d = await getAssessment(list[0]._id);
          if (!alive) return;
          setDetail(d);
          setConfig(configFromResult(d));   // 2D metadata (_dominant / group)
          // 3D orb: derive the LC_ORB3 lever-vector from the assessment geometry.
          const details = d.archetypeDetails || [];
          const vec = deriveOrb3(details);
          const orb3Code = vec ? encodeOrb3(vec) : '';
          setConfig3(orb3Code ? decodeOrb3(orb3Code) : null);
          setCode(orb3Code || orbCodeFromResult(d));
        }
      } catch (_) { /* logged-out edge / no data */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const archetype = detail ? (detail.extendedArchetypeName || detail.archetypeKey || '—') : '—';
  const group = config?._dominant ? GROUP[config._dominant] : (detail?.supportGroup || '');

  const handleDownload = useCallback(async () => {
    if (!detail?._id) return;
    setBusy('report'); setMsg('');
    try { await downloadPdf(detail._id); }
    catch (e) { setMsg(e.message || 'Download mislukt'); }
    finally { setBusy(''); }
  }, [detail]);

  const handleDelete = useCallback(async () => {
    if (delInput !== 'VERWIJDER') { setDelErr('Typ precies "VERWIJDER" om te bevestigen'); return; }
    setBusy('delete'); setDelErr('');
    try { await deleteOwnAccount(); onLogout(); }
    catch (e) { setDelErr(e.message || 'Verwijderen mislukt'); setBusy(''); }
  }, [delInput, onLogout]);

  const copyCode = useCallback(() => { if (code) navigator.clipboard?.writeText(code); }, [code]);

  const handleSaveName = useCallback(async () => {
    const v = nameInput.trim();
    if (!v || v === name) return;
    setNameBusy(true); setNameMsg('');
    try {
      const { displayName } = await updateDisplayName(v);
      setName(displayName); setNameInput(displayName); setNameMsg('Opgeslagen ✓');
    } catch (e) {
      setNameMsg(e.message || 'Bijwerken mislukt');
    } finally { setNameBusy(false); }
  }, [nameInput, name]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: FONT, color: C.text }}>

      {/* ── top-left identity ── */}
      <div style={{ position: 'absolute', top: 'clamp(14px, 3vh, 34px)', left: 'clamp(16px, 3vw, 44px)', zIndex: 6 }}>
        <div style={{ fontSize: 'max(9px, 0.5vw)', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
          {name || 'Reiziger'}
        </div>
        <div style={{ fontSize: 'max(20px, 1.5vw)', fontWeight: 700, letterSpacing: '0.06em', color: C.gold, textShadow: `0 0 14px ${C.gold}55` }}>
          {loading ? '…' : archetype}
        </div>
        {group && <div style={{ fontSize: 'max(9px, 0.5vw)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>{group}</div>}
      </div>

      {/* ── top-right session controls ── */}
      <div style={{ position: 'absolute', top: 'clamp(14px, 3vh, 34px)', right: 'clamp(16px, 3vw, 44px)', zIndex: 6, display: 'flex', gap: '0.5rem' }}>
        <SciFiButton onClick={onClose} size="sm" padding="0.35rem 0.9rem" fontSize="max(9px, 0.46vw)">← Terug</SciFiButton>
        <SciFiButton onClick={onLogout} variant="danger" size="sm" padding="0.35rem 0.9rem" fontSize="max(9px, 0.46vw)">Uitloggen</SciFiButton>
      </div>

      {/* ── product destinations (top-centre) — the platform hub ── */}
      {onNavigate && (
        <div style={{ position: 'absolute', top: 'clamp(14px, 3vh, 34px)', left: '50%', transform: 'translateX(-50%)', zIndex: 6, display: 'flex', gap: '0.55rem' }}>
          <Node label="Data" sub="tests & cursussen" accent={C.gold} onClick={() => onNavigate('data')} style={{ position: 'relative' }} />
          <Node label="Kook-eiland" sub="kook je maaltijden" accent="#22d3ee" onClick={() => onNavigate('kook')} style={{ position: 'relative' }} />
          <Node label="Gardens" sub="verbind" accent="#22c55e" onClick={() => onNavigate('gardens')} style={{ position: 'relative' }} />
        </div>
      )}

      {/* ── the orb (centre) ── */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        {config3
          ? <OrbSphere3D config={config3} active={active} size={orbSize} style={{ filter: 'drop-shadow(0 0 90px rgba(120,80,200,0.18))' }} />
          : (
            <div style={{ width: orbSize, height: orbSize, borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
              <div>
                <div style={{ fontSize: 'max(13px, 0.8vw)', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', lineHeight: 1.7 }}>
                  {loading ? 'Profiel laden…' : 'Nog geen kristal.'}
                </div>
                {!loading && <div style={{ marginTop: '1rem' }}><SciFiButton onClick={onClose} size="md">Doe de test</SciFiButton></div>}
              </div>
            </div>
          )}
      </div>

      {/* ── spread-out interaction nodes (only with a profile) ── */}
      {config && (
        <>
          <Node label="Rapport" sub={busy === 'report' ? 'bezig…' : 'download PDF'} accent={C.gold}
            onClick={handleDownload}
            style={{ left: 'clamp(16px, 5vw, 90px)', top: '38%' }} />
          <Node label="Profielcode" sub="je unieke kristal-code" accent={C.purple}
            onClick={() => setPanel('code')}
            style={{ right: 'clamp(16px, 5vw, 90px)', top: '38%', textAlign: 'right', alignItems: 'flex-end' }} />
          <Node label="Geschiedenis" sub={`${history.length} assessment${history.length === 1 ? '' : 's'}`} accent={C.gold}
            onClick={() => setPanel('history')}
            style={{ left: 'clamp(16px, 7vw, 130px)', bottom: 'clamp(20px, 7vh, 80px)' }} />
          <Node label="Account" sub="beheer & verwijderen" accent="#ef4444"
            onClick={() => setPanel('account')}
            style={{ right: 'clamp(16px, 7vw, 130px)', bottom: 'clamp(20px, 7vh, 80px)', textAlign: 'right', alignItems: 'flex-end' }} />
        </>
      )}

      {msg && (
        <div style={{ position: 'absolute', bottom: 'clamp(10px, 2vh, 24px)', left: '50%', transform: 'translateX(-50%)', zIndex: 7, color: '#f87171', fontSize: 'max(9px, 0.48vw)' }}>{msg}</div>
      )}

      {/* ── panels ── */}
      {panel === 'code' && (
        <Panel title="Profielcode" accent={C.purple} onClose={() => setPanel(null)}>
          <p style={{ fontSize: 'max(10px, 0.52vw)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginTop: 0 }}>
            Dit is de unieke code van jouw vloeibare kristal — dezelfde die op je PDF staat. Bewaar hem; hij genereert je orb overal opnieuw, zonder dat wij iets opslaan.
          </p>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 'max(9px, 0.46vw)', color: '#c4b5fd', background: '#050505', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '0.4rem', padding: '0.7rem', wordBreak: 'break-all', lineHeight: 1.5 }}>{code}</div>
          <div style={{ marginTop: '0.8rem' }}><SciFiButton onClick={copyCode} variant="purple" size="sm">Kopieer code</SciFiButton></div>
        </Panel>
      )}

      {panel === 'history' && (
        <Panel title="Geschiedenis" accent={C.gold} onClose={() => setPanel(null)}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '1.5rem 0', textTransform: 'uppercase', fontSize: 'max(9px, 0.45vw)' }}>Geen assessments</div>
          ) : history.map((a) => (
            <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.7rem', borderBottom: '1px solid rgba(249,115,22,0.12)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'max(10px, 0.52vw)' }}>{a.extendedArchetypeName || a.archetypeKey}</div>
                <div style={{ fontSize: 'max(8px, 0.42vw)', color: 'rgba(255,255,255,0.35)' }}>
                  {new Date(a.createdAt).toLocaleDateString('nl-NL')}{a.harmonyScore != null ? ` · ${a.harmonyScore}%` : ''}
                </div>
              </div>
              <SciFiButton onClick={() => downloadPdf(a._id).catch(() => {})} size="sm" padding="0.3rem 0.6rem" fontSize="max(9px, 0.4vw)">PDF</SciFiButton>
            </div>
          ))}
        </Panel>
      )}

      {panel === 'account' && (
        <Panel title="Account" accent="#ef4444" onClose={() => { setPanel(null); setDelInput(''); setDelErr(''); }}>
          <div style={{ fontSize: 'max(10px, 0.52vw)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            <div style={{ marginBottom: '0.7rem' }}>
              <div style={{ fontSize: 'max(9px,0.46vw)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>Zichtbare naam</div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input value={nameInput} onChange={(e) => { setNameInput(e.target.value); setNameMsg(''); }} maxLength={40}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                  style={{ flex: 1, minWidth: 0, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(168,85,247,0.35)', color: C.text, fontFamily: FONT, fontSize: 'max(10px,0.5vw)', padding: '0.35rem 0.6rem', borderRadius: '0.3rem', outline: 'none' }} />
                <SciFiButton onClick={handleSaveName} disabled={nameBusy || !nameInput.trim() || nameInput.trim() === name} variant="purple" size="sm" padding="0.32rem 0.7rem" fontSize="max(9px,0.44vw)">
                  {nameBusy ? '…' : 'Opslaan'}
                </SciFiButton>
              </div>
              {nameMsg && <div style={{ fontSize: 'max(8px,0.42vw)', color: nameMsg.includes('✓') ? '#4ade80' : '#f87171', marginTop: '0.3rem' }}>{nameMsg}</div>}
              <div style={{ fontSize: 'max(8px,0.42vw)', color: 'rgba(255,255,255,0.3)', marginTop: '0.25rem' }}>Uniek — geen twee gebruikers delen dezelfde naam.</div>
            </div>
            <div style={{ marginBottom: '1rem' }}>E-mail: <b>{user.email}</b></div>
          </div>
          <div style={{ borderTop: '1px solid rgba(239,68,68,0.25)', paddingTop: '0.9rem' }}>
            <div style={{ color: '#fca5a5', fontSize: 'max(9px, 0.48vw)', lineHeight: 1.5, marginBottom: '0.6rem' }}>
              ⚠ Dit verwijdert je account én alle assessments permanent (AVG/GDPR). Typ <b>VERWIJDER</b> om te bevestigen:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={delInput} onChange={(e) => setDelInput(e.target.value)} placeholder="VERWIJDER"
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontFamily: FONT, fontSize: 'max(9px, 0.48vw)', padding: '0.3rem 0.6rem', borderRadius: '0.25rem', outline: 'none', width: '10rem' }} />
              <SciFiButton onClick={handleDelete} disabled={busy === 'delete'} variant="danger" size="sm" padding="0.3rem 0.8rem" fontSize="max(9px, 0.46vw)">
                {busy === 'delete' ? 'Bezig…' : 'Verwijderen'}
              </SciFiButton>
              {delErr && <span style={{ color: '#f87171', fontSize: 'max(8px, 0.44vw)' }}>{delErr}</span>}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
});

ClientOrbExperience.displayName = 'ClientOrbExperience';
export default ClientOrbExperience;
