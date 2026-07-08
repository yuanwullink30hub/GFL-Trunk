import React, { useEffect, useMemo, useState } from 'react';
import { getPublicProfiles, getCard } from '@gfl/api-client';
import { EXTENDED_ARCHETYPES, EXTENDED_ARCHETYPES_NL } from '@gfl/assessment-core/data';
import ProfileCard from './ProfileCard';

/**
 * PublicProfilesDirectory — the client-side "Verbonden" section.
 *
 * The parent shell (EyedentityPage, client branch) is EXACTLY the profile-card
 * footprint (min(88vw,1500px) × 68vh) plus 15% extra width on the left, centered.
 * - Closed  → LOOKUP-ONLY (rule 2026-07-08: no browsing grid): profiles are found
 *             via search facets — naam, activiteit (laatst gezien), hardware-groep
 *             (uit de extracted reading) en aantal schaduw-profielen. Results render
 *             only once at least one facet is active.
 * - Open    → the left 15% becomes the QUICK-NAV bar (searchable, active highlighted);
 *             the remaining area is exactly card-sized and renders the public ProfileCard.
 */

const AMBER = '#ffae00';
const PURPLE = '#a855f7';
const CREAM = '#FFFEF0';
const GREEN = '#15b315';
const FONT = "'Lexend Mega', sans-serif";
const FIGTREE = "'Figtree', sans-serif";

// 15/115 of the container = the "15% of card width" quick-nav strip.
const QUICKNAV_W = `${(15 / 115) * 100}%`;

// Canonical-12 for the main+support combination facet. Regex tolerates the Dutch or
// English id as stored in the extracted reading ("De Heerser" / "Ruler").
const ARCHETYPES_12 = [
  { key: 'judge', label: 'De Rechter', re: /rechter|judge/i },
  { key: 'lover', label: 'De Minnaar', re: /minnaar|lover/i },
  { key: 'caregiver', label: 'De Verzorger', re: /verzorger|caregiver/i },
  { key: 'innocent', label: 'De Onschuldige', re: /onschuldige|innocent/i },
  { key: 'explorer', label: 'De Ontdekkingsreiziger', re: /ontdekk|explorer/i },
  { key: 'outlaw', label: 'De Rebel', re: /rebel|outlaw/i },
  { key: 'trickster', label: 'De Nar', re: /\bnar\b|trickster/i },
  { key: 'sage', label: 'De Wijze', re: /wijze|sage/i },
  { key: 'artist', label: 'De Kunstenaar', re: /kunstenaar|artist/i },
  { key: 'magician', label: 'De Magiër', re: /magi[eë]r|magician/i },
  { key: 'hero', label: 'De Held', re: /held|hero/i },
  { key: 'ruler', label: 'De Heerser', re: /heerser|ruler/i },
];
const archMatches = (key, id) => {
  const a = ARCHETYPES_12.find((x) => x.key === key);
  return !!(a && id && a.re.test(String(id)));
};
// Support facet = the EXTENSION (72-archetype) name for the selected main: picking a
// main lists its six main×supportgroup extended names (De Held → Legende, Ronin, …).
// A group key still filters cleanly: extension = main + support GROUP, so matching the
// profile's supportId against the group's two canonical members is exact.
const MAIN_TO_CONST = { judge: 'JUDGE', lover: 'LOVER', caregiver: 'CAREGIVER', innocent: 'INNOCENT', explorer: 'EXPLORER', outlaw: 'OUTLAW', trickster: 'TRICKSTER', sage: 'SAGE', artist: 'ARTIST', magician: 'MAGICIAN', hero: 'HERO', ruler: 'RULER' };
const SUPPORT_GROUPS = [
  { key: 'RULING', members: ['judge', 'ruler'] },
  { key: 'RELATIONAL', members: ['lover', 'caregiver'] },
  { key: 'SEEKER', members: ['innocent', 'explorer'] },
  { key: 'CHAOS', members: ['outlaw', 'trickster'] },
  { key: 'ABSTRACT', members: ['sage', 'artist'] },
  { key: 'AGENCY', members: ['magician', 'hero'] },
];
const extensionName = (mainKey, groupKey) => {
  const k = `${MAIN_TO_CONST[mainKey] || ''}_${groupKey}`;
  return EXTENDED_ARCHETYPES_NL[k] || EXTENDED_ARCHETYPES[k] || groupKey;
};
const ACTIVITY_OPTIONS = [
  { key: 'alle', label: 'Alle activiteit', ms: null },
  { key: 'vandaag', label: 'Actief vandaag', ms: 24 * 60 * 60 * 1000 },
  { key: 'week', label: 'Actief deze week', ms: 7 * 24 * 60 * 60 * 1000 },
  { key: 'maand', label: 'Actief deze maand', ms: 30 * 24 * 60 * 60 * 1000 },
];
const READING_OPTIONS = [
  { key: 'alle', label: 'Alle integraties', min: 0 },
  { key: '1', label: '1+ integraties', min: 1 },
  { key: '2', label: '2+ integraties', min: 2 },
  { key: '3', label: '3+ integraties', min: 3 },
];

const fmtLong = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return '—'; } };
const fmtShort = (d) => { if (!d) return null; try { const x = new Date(d); return `${String(x.getDate()).padStart(2, '0')}·${String(x.getMonth() + 1).padStart(2, '0')}·${x.getFullYear()}`; } catch { return null; } };

const FIELD = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(168, 85, 247, 0.3)',
  borderRadius: '0.15rem',
  color: CREAM,
  fontFamily: FIGTREE,
  fontSize: 'max(11px, 0.58vw)',
  padding: '0.45rem 0.6rem',
  outline: 'none',
};

export default function PublicProfilesDirectory() {
  const [profiles, setProfiles] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);  // shown profile name (handle) or null
  const [cardPayload, setCardPayload] = useState(null);
  const [cardError, setCardError] = useState('');
  const [navQuery, setNavQuery] = useState(''); // quick-nav search (open state)

  // Lookup facets (closed state)
  const [qName, setQName] = useState('');
  const [qActivity, setQActivity] = useState('alle');
  const [qReadings, setQReadings] = useState('alle');
  // Main + support combination — support optional: empty shows ALL within the main.
  const [qMain, setQMain] = useState('alle');
  const [qSupport, setQSupport] = useState('alle');

  useEffect(() => {
    let alive = true;
    getPublicProfiles()
      .then((r) => { if (alive) setProfiles(Array.isArray(r.profiles) ? r.profiles : []); })
      .catch((e) => { if (alive) { setError(e.message || 'Profielen ophalen mislukt'); setProfiles([]); } });
    return () => { alive = false; };
  }, []);

  // Fetch the full public card when a profile is opened (same payload the ?u= overlay uses).
  useEffect(() => {
    if (!selected) { setCardPayload(null); setCardError(''); return undefined; }
    let alive = true;
    setCardPayload(null);
    setCardError('');
    getCard(selected)
      .then((p) => { if (alive) setCardPayload(p); })
      .catch((e) => { if (alive) setCardError(e.message || 'Kaart ophalen mislukt'); });
    return () => { alive = false; };
  }, [selected]);

  const hasActiveFacet = qName.trim() !== '' || qActivity !== 'alle' || qReadings !== 'alle' || qMain !== 'alle';

  const results = useMemo(() => {
    if (!Array.isArray(profiles) || !hasActiveFacet) return [];
    const q = qName.trim().toLowerCase();
    const act = ACTIVITY_OPTIONS.find((a) => a.key === qActivity);
    const minReadings = (READING_OPTIONS.find((r) => r.key === qReadings) || {}).min || 0;
    const now = Date.now();
    return profiles
      .filter((p) => {
        // Naam searches the USERNAME only (archetype has its own facet).
        if (q && !p.name.toLowerCase().includes(q)) return false;
        if (act && act.ms != null) {
          if (!p.lastSeen || (now - new Date(p.lastSeen).getTime()) > act.ms) return false;
        }
        if ((p.readingCount || 0) < minReadings) return false;
        // Main + extension: main set → must match; extension ('alle' = every support
        // within that main) filters on the support GROUP behind the extended name.
        if (qMain !== 'alle') {
          if (!archMatches(qMain, p.mainId)) return false;
          if (qSupport !== 'alle') {
            const grp = SUPPORT_GROUPS.find((g) => g.key === qSupport);
            if (!grp || !grp.members.some((m) => archMatches(m, p.supportId))) return false;
          }
        }
        return true;
      })
      .sort((a, b) => new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0));
  }, [profiles, hasActiveFacet, qName, qActivity, qReadings, qMain, qSupport]);

  const dimText = (msg, red = false) => (
    <div style={{ fontFamily: FIGTREE, color: red ? 'rgba(248,113,113,0.9)' : 'rgba(255,254,240,0.5)', fontSize: 'max(12px, 0.65vw)', padding: '1.25rem' }}>{msg}</div>
  );

  /* ── OPEN STATE: quick-nav (15%) | exact card area ── */
  if (selected) {
    return (
      <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
        {/* Quick-nav bar — the extra 15% on the left */}
        <div className="purple-scrollbar" style={{ flex: `0 0 ${QUICKNAV_W}`, minWidth: 0, minHeight: 0, overflowY: 'auto', borderRight: '1px solid rgba(168, 85, 247, 0.15)', padding: '0.9rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', boxSizing: 'border-box' }}>
          <button
            type="button"
            onClick={() => setSelected(null)}
            style={{ textAlign: 'left', background: 'none', border: 'none', color: AMBER, fontFamily: FONT, fontSize: 'max(8px, 0.45vw)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', padding: '0.4rem 0.5rem', marginBottom: '0.4rem' }}
          >
            ← Zoeken
          </button>
          {/* Search — filters the quick-nav on name or archetype */}
          <input
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            placeholder="Zoeken…"
            style={{ ...FIELD, marginBottom: '0.45rem' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,174,0,0.5)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255,174,0,0.12)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {(profiles || []).filter((p) => {
            const q = navQuery.trim().toLowerCase();
            if (!q) return true;
            return p.name.toLowerCase().includes(q); // naam = username only
          }).map((p) => {
            const active = p.name === selected;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => setSelected(p.name)}
                style={{
                  textAlign: 'left',
                  background: active ? 'rgba(168,85,247,0.12)' : 'none',
                  border: 'none',
                  borderLeft: active ? `2px solid ${PURPLE}` : '2px solid transparent',
                  color: active ? PURPLE : 'rgba(255,254,240,0.75)',
                  fontFamily: FIGTREE,
                  fontSize: 'max(11px, 0.58vw)',
                  cursor: 'pointer',
                  padding: '0.4rem 0.5rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'color 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = CREAM; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'rgba(255,254,240,0.75)'; }}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Card area — exactly the profile-card footprint (shell = card × 1.15).
            The "+ Verbond" invite renders inside the card's sync line (verbondHandle). */}
        <div style={{ position: 'relative', flex: '1 1 auto', minWidth: 0, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {cardError
            ? dimText(cardError, true)
            : cardPayload
              ? <ProfileCard payload={cardPayload} active verbondHandle={selected} />
              : dimText('Kaart laden…')}
        </div>
      </div>
    );
  }

  /* ── CLOSED STATE: LOOKUP ONLY — no profiles shown until a facet is active ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', minHeight: 0, padding: '1.5rem', boxSizing: 'border-box' }}>
      <div style={{ fontFamily: FONT, fontSize: 'max(9px, 0.5vw)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,174,0,0.7)' }}>
        Zoek een profiel
      </div>

      {/* ── Facets, in order: naam · archetype (main + extensie) · activiteit · integratie ── */}
      <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 240px', minWidth: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 'max(8px, 0.42vw)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,254,240,0.55)', marginBottom: '0.35rem' }}>Naam</div>
          <input
            value={qName}
            onChange={(e) => setQName(e.target.value)}
            placeholder="Typ een naam…"
            style={FIELD}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,174,0,0.5)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255,174,0,0.12)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        {/* Main + extensie — the support dropdown shows the EXTENSION names of the selected
            main (De Held → Legende, Ronin, …), never the support archetype's own name. */}
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 'max(8px, 0.42vw)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,254,240,0.55)', marginBottom: '0.35rem' }}>Main archetype</div>
          <select value={qMain} onChange={(e) => { setQMain(e.target.value); setQSupport('alle'); }} style={{ ...FIELD, cursor: 'pointer' }}>
            <option value="alle" style={{ background: '#0a0510' }}>Alle mains</option>
            {ARCHETYPES_12.map((a) => <option key={a.key} value={a.key} style={{ background: '#0a0510' }}>{a.label}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 180px', minWidth: 0, opacity: qMain === 'alle' ? 0.45 : 1, transition: 'opacity 0.2s ease' }}>
          <div style={{ fontFamily: FONT, fontSize: 'max(8px, 0.42vw)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,254,240,0.55)', marginBottom: '0.35rem' }}>Extensie — optioneel</div>
          <select value={qSupport} onChange={(e) => setQSupport(e.target.value)} disabled={qMain === 'alle'} style={{ ...FIELD, cursor: qMain === 'alle' ? 'not-allowed' : 'pointer' }}>
            <option value="alle" style={{ background: '#0a0510' }}>Alle extensies</option>
            {/* Extension name + the hardware-group tag in brackets (De Ronin (Chaos)) —
                one tag, not the pair of core archetype names. */}
            {qMain !== 'alle' && SUPPORT_GROUPS.map((g) => (
              <option key={g.key} value={g.key} style={{ background: '#0a0510' }}>
                {extensionName(qMain, g.key)} ({g.key.charAt(0) + g.key.slice(1).toLowerCase()})
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 'max(8px, 0.42vw)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,254,240,0.55)', marginBottom: '0.35rem' }}>Activiteit</div>
          <select value={qActivity} onChange={(e) => setQActivity(e.target.value)} style={{ ...FIELD, cursor: 'pointer' }}>
            {ACTIVITY_OPTIONS.map((o) => <option key={o.key} value={o.key} style={{ background: '#0a0510' }}>{o.label}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 'max(8px, 0.42vw)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,254,240,0.55)', marginBottom: '0.35rem' }}>Integratie</div>
          <select value={qReadings} onChange={(e) => setQReadings(e.target.value)} style={{ ...FIELD, cursor: 'pointer' }}>
            {READING_OPTIONS.map((o) => <option key={o.key} value={o.key} style={{ background: '#0a0510' }}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Results — only when a facet is active ── */}
      <div className="purple-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', borderTop: '1px solid rgba(168, 85, 247, 0.15)', paddingTop: '0.9rem' }}>
        {profiles === null && dimText('Profielen laden…')}
        {error && dimText(error, true)}
        {profiles !== null && !error && !hasActiveFacet && dimText('Gebruik de zoekopties hierboven om profielen te vinden.')}
        {hasActiveFacet && profiles !== null && !error && !results.length && dimText('Geen profielen gevonden met deze filters.')}

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {results.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setSelected(p.name)}
                style={{
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.9rem',
                  background: 'rgba(2, 0, 3, 0.3)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: '0.3rem',
                  padding: '0.6rem 0.9rem',
                  cursor: 'pointer',
                  color: CREAM,
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,174,0,0.5)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255,174,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.25)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* schaduw-profielen marker (individuatiepad chip grammar) */}
                <div style={{ width: '1.6rem', height: '1.6rem', borderRadius: '50%', border: '1px dashed rgba(21, 179, 21, 0.5)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: '0.6rem', color: GREEN }}>
                  {p.readingCount || 0}
                </div>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 'max(12px, 0.65vw)', color: PURPLE }}>{p.name}</span>
                  {p.archetypeName && (
                    <span style={{ fontFamily: FONT, fontSize: 'max(8px, 0.45vw)', letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER, opacity: 0.8, marginLeft: '0.7rem' }}>{p.archetypeName}</span>
                  )}
                  {p.hardwareGroup && (
                    <span style={{ fontFamily: FONT, fontSize: 'max(8px, 0.42vw)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(165,243,252,0.7)', marginLeft: '0.7rem' }}>{p.hardwareGroup}</span>
                  )}
                </div>
                <div style={{ fontFamily: FIGTREE, fontSize: 'max(9px, 0.5vw)', color: 'rgba(255,254,240,0.4)', flexShrink: 0, textAlign: 'right' }}>
                  {p.lastSeen && <div>Laatst actief {fmtShort(p.lastSeen)}</div>}
                  <div>{[p.country, `Lid sinds ${fmtLong(p.memberSince)}`].filter(Boolean).join(' · ')}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
