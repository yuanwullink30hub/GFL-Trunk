import React, { useState } from 'react';
import { SciFiButton } from './dashboardStyles';

/* ─── Animation keyframes + slider styles ─── */
const modalStyles = `
  @keyframes oceanExpand {
    0%   { transform: scale(0.05); opacity: 0; }
    60%  { opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes oceanContract {
    0%   { transform: scale(1);    opacity: 1; }
    40%  { opacity: 0.5; }
    100% { transform: scale(0.05); opacity: 0; }
  }
  .ocean-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 14px;
    background: transparent;
    outline: none;
    cursor: pointer;
    padding: 0;
    margin: 0;
  }
  .ocean-slider::-webkit-slider-runnable-track {
    height: 3px;
    border-radius: 2px;
    background: var(--track-bg, rgba(255,255,255,0.07));
  }
  .ocean-slider::-moz-range-track {
    height: 3px;
    border-radius: 2px;
    background: var(--track-bg, rgba(255,255,255,0.07));
  }
  .ocean-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background-color: var(--thumb-color, #a78bfa);
    margin-top: -5px;
    cursor: pointer;
    transition: transform 0.12s;
    box-shadow: 0 0 6px var(--thumb-color, #a78bfa);
  }
  .ocean-slider::-webkit-slider-thumb:hover { transform: scale(1.25); }
  .ocean-slider::-moz-range-thumb {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background-color: var(--thumb-color, #a78bfa);
    border: none;
    cursor: pointer;
    box-shadow: 0 0 6px var(--thumb-color, #a78bfa);
  }
  .ocean-number-input::-webkit-outer-spin-button,
  .ocean-number-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .ocean-number-input { -moz-appearance: textfield; }
`;

/* ─── Trait definitions ─── */
const TRAITS = [
  {
    key: 'A', label: 'Meegaandheid', eng: 'Agreeableness',
    color: '#f472b6', rgb: '244,114,182', required: true,
    subTraits: [
      { key: 'A_compassie',   label: 'Compassie' },
      { key: 'A_beleefdheid', label: 'Beleefdheid' },
    ],
  },
  {
    key: 'C', label: 'Consciëntieusheid', eng: 'Conscientiousness',
    color: '#60a5fa', rgb: '96,165,250', required: true,
    subTraits: [
      { key: 'C_ijver',       label: 'IJver' },
      { key: 'C_ordelijkheid',label: 'Ordelijkheid' },
    ],
  },
  {
    key: 'E', label: 'Extraversie', eng: 'Extraversion',
    color: '#fbbf24', rgb: '251,191,36', required: true,
    subTraits: [
      { key: 'E_enthousiasme', label: 'Enthousiasme' },
      { key: 'E_assertiviteit',label: 'Assertiviteit' },
    ],
  },
  {
    key: 'N', label: 'Neuroticisme', eng: 'Neuroticism',
    color: '#f87171', rgb: '248,113,113', required: true,
    subTraits: [
      { key: 'N_terughoudendheid', label: 'Terughoudendheid' },
      { key: 'N_volatiliteit',     label: 'Volatiliteit' },
    ],
  },
  {
    key: 'O', label: 'Openheid voor Ervaringen', eng: 'Openness',
    color: '#00ff9d', rgb: '0,255,157', required: true,
    subTraits: [
      { key: 'O_intellect', label: 'Intellect' },
      { key: 'O_esthetiek', label: 'Esthetiek' },
    ],
  },
  {
    key: 'H', label: 'Eerlijkheid-Nederigheid', eng: 'Honesty-Humility',
    color: '#22d3ee', rgb: '34,211,238', required: false,
    subTraits: [],
  },
];

const buildInitial = (initialValues) => {
  const defaults = {
    A: 50, A_compassie: '', A_beleefdheid: '',
    C: 50, C_ijver: '', C_ordelijkheid: '',
    E: 50, E_enthousiasme: '', E_assertiviteit: '',
    N: 50, N_terughoudendheid: '', N_volatiliteit: '',
    O: 50, O_intellect: '', O_esthetiek: '',
    H: '',
  };
  if (!initialValues) return defaults;
  const out = { ...defaults };
  for (const k of Object.keys(defaults)) {
    if (initialValues[k] !== undefined && initialValues[k] !== null) {
      out[k] = String(initialValues[k]);
    }
  }
  return out;
};

/* ─── TraitRow sub-component ─── */
const TraitRow = ({ trait, vals, expanded, onToggle, onChange }) => {
  const mainVal = vals[trait.key];
  const pct = mainVal !== '' && !isNaN(Number(mainVal)) ? Number(mainVal) : 50;
  const hasValue = mainVal !== '' && !isNaN(Number(mainVal));

  const trackBg = hasValue
    ? `linear-gradient(to right, ${trait.color} 0%, ${trait.color} ${pct}%, rgba(255,255,255,0.07) ${pct}%, rgba(255,255,255,0.07) 100%)`
    : 'rgba(255,255,255,0.07)';

  const isOpen = expanded[trait.key];

  const handleMainSlider = (e) => {
    onChange(trait.key, e.target.value);
  };

  const handleMainNumber = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      if (!trait.required) onChange(trait.key, '');
      return;
    }
    const v = Math.max(0, Math.min(100, parseInt(raw, 10)));
    if (!isNaN(v)) onChange(trait.key, String(v));
  };

  return (
    <div style={{
      borderRadius: '0.5rem',
      border: `1px solid ${isOpen ? `rgba(${trait.rgb},0.35)` : 'rgba(255,255,255,0.06)'}`,
      backgroundColor: isOpen ? `rgba(${trait.rgb},0.04)` : 'rgba(255,255,255,0.015)',
      transition: 'border-color 0.2s, background-color 0.2s',
      overflow: 'hidden',
    }}>
      {/* ── Main row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.55rem 0.8rem' }}>

        {/* Label */}
        <div style={{ flexShrink: 0, width: '9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1px' }}>
            <span style={{ color: trait.color, fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700 }}>
              {trait.key}
            </span>
            {trait.required
              ? <span style={{ color: 'rgba(248,113,113,0.75)', fontSize: '0.52rem', fontFamily: 'monospace', letterSpacing: '0.04em' }}>VEREIST</span>
              : <span style={{ color: 'rgba(148,163,184,0.4)', fontSize: '0.52rem', fontFamily: 'monospace', letterSpacing: '0.04em' }}>optioneel</span>
            }
          </div>
          <div style={{ color: 'rgba(226,232,240,0.85)', fontSize: '0.68rem', fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {trait.label}
          </div>
        </div>

        {/* Slider */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            type="range"
            min="0" max="100"
            className="ocean-slider"
            value={pct}
            onChange={handleMainSlider}
            style={{ '--track-bg': trackBg, '--thumb-color': hasValue ? trait.color : `rgba(${trait.rgb},0.35)` }}
          />
        </div>

        {/* Number + expand toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          <input
            type="number"
            min="0" max="100"
            value={mainVal}
            placeholder="—"
            className="ocean-number-input"
            onChange={handleMainNumber}
            style={{
              width: '3rem', textAlign: 'center', fontSize: '0.72rem', fontFamily: 'monospace',
              color: hasValue ? trait.color : 'rgba(148,163,184,0.35)',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: `1px solid ${hasValue ? `rgba(${trait.rgb},0.3)` : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '0.25rem',
              padding: '0.2rem 0.3rem',
              outline: 'none',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          />
          {trait.subTraits.length > 0 && (
            <button
              onClick={() => onToggle(trait.key)}
              title="Sub-scores tonen/verbergen"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem 0.2rem',
                color: isOpen ? trait.color : 'rgba(148,163,184,0.35)',
                fontSize: '0.7rem',
                lineHeight: 1,
                transition: 'color 0.15s, transform 0.2s',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                display: 'inline-flex', alignItems: 'center',
              }}
            >
              ▾
            </button>
          )}
          {/* Spacer to align rows without subTraits toggle */}
          {trait.subTraits.length === 0 && (
            <div style={{ width: '1.35rem', flexShrink: 0 }} />
          )}
        </div>
      </div>

      {/* ── Sub-traits (collapsed) ── */}
      {isOpen && trait.subTraits.length > 0 && (
        <div style={{
          borderTop: `1px solid rgba(${trait.rgb},0.12)`,
          padding: '0.45rem 0.8rem 0.6rem',
          display: 'flex', flexDirection: 'column', gap: '0.35rem',
          backgroundColor: `rgba(${trait.rgb},0.02)`,
        }}>
          {trait.subTraits.map((sub) => {
            const sv = vals[sub.key];
            const spct = sv !== '' && !isNaN(Number(sv)) ? Number(sv) : 50;
            const hasSubVal = sv !== '' && !isNaN(Number(sv));
            const subTrack = hasSubVal
              ? `linear-gradient(to right, rgba(${trait.rgb},0.55) 0%, rgba(${trait.rgb},0.55) ${spct}%, rgba(255,255,255,0.05) ${spct}%, rgba(255,255,255,0.05) 100%)`
              : 'rgba(255,255,255,0.05)';

            return (
              <div key={sub.key} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {/* Label */}
                <div style={{ width: '9rem', flexShrink: 0 }}>
                  <span style={{ color: 'rgba(148,163,184,0.5)', fontSize: '0.63rem', fontStyle: 'italic' }}>
                    ↳ {sub.label}
                  </span>
                </div>

                {/* Slider */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <input
                    type="range" min="0" max="100"
                    className="ocean-slider"
                    value={spct}
                    onChange={(e) => onChange(sub.key, e.target.value)}
                    style={{
                      '--track-bg': subTrack,
                      '--thumb-color': hasSubVal ? `rgba(${trait.rgb},0.75)` : `rgba(${trait.rgb},0.25)`,
                    }}
                  />
                </div>

                {/* Number */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                  <input
                    type="number" min="0" max="100"
                    value={sv}
                    placeholder="—"
                    className="ocean-number-input"
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') { onChange(sub.key, ''); return; }
                      const v = Math.max(0, Math.min(100, parseInt(raw, 10)));
                      if (!isNaN(v)) onChange(sub.key, String(v));
                    }}
                    style={{
                      width: '3rem', textAlign: 'center', fontSize: '0.68rem', fontFamily: 'monospace',
                      color: hasSubVal ? `rgba(${trait.rgb},0.75)` : 'rgba(148,163,184,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '0.25rem',
                      padding: '0.15rem 0.3rem',
                      outline: 'none',
                    }}
                  />
                  {/* Spacer to match main row alignment */}
                  <div style={{ width: '1.35rem', flexShrink: 0 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Main modal component ─── */
const OceanManualInputModal = ({ onClose, onConfirm, initialValues }) => {
  const [vals, setVals] = useState(() => buildInitial(initialValues));
  const [expanded, setExpanded] = useState({});
  const [errors, setErrors] = useState({});
  const [closing, setClosing] = useState(false);

  const set = (key, v) => setVals(prev => ({ ...prev, [key]: v }));
  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 360);
  };

  const confirm = () => {
    const newErrors = {};
    for (const trait of TRAITS) {
      if (trait.required) {
        const v = vals[trait.key];
        if (v === '' || isNaN(Number(v))) newErrors[trait.key] = true;
      }
    }
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    const out = {};
    for (const [k, v] of Object.entries(vals)) {
      out[k] = v === '' ? null : Number(v);
    }
    setClosing(true);
    setTimeout(() => {
      onConfirm(out);
      onClose();
    }, 360);
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <div style={{
          width: 'min(54vw, 590px)',
          minWidth: '360px',
          maxHeight: '88vh',
          overflowY: 'auto',
          backgroundColor: 'rgba(5, 7, 22, 0.98)',
          border: '1px solid rgba(120,90,220,0.4)',
          borderRadius: '0.875rem',
          padding: '1.5rem 1.75rem',
          boxShadow: '0 16px 70px rgba(0,0,0,0.8), 0 0 0 1px rgba(120,90,220,0.1)',
          animation: `${closing ? 'oceanContract' : 'oceanExpand'} 0.36s cubic-bezier(0.4,0,0.2,1) forwards`,
          transformOrigin: 'center center',
        }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span style={{
                  color: '#a78bfa', fontSize: '0.58rem', fontFamily: 'monospace', letterSpacing: '0.1em',
                  border: '1px solid rgba(167,139,250,0.3)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem',
                }}>
                  OCEAN
                </span>
                <h2 style={{
                  color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 700,
                  fontFamily: 'monospace', letterSpacing: '0.05em', margin: 0,
                }}>
                  Persoonlijkheidsscores Invoeren
                </h2>
              </div>
              <p style={{
                color: 'rgba(148,163,184,0.6)', fontSize: '0.67rem', lineHeight: 1.55, margin: 0,
              }}>
                Verplichte hoofd-scores (0–100). Klik op ▾ om optionele sub-scores te tonen.
              </p>
            </div>
            <button
              onClick={close}
              style={{
                background: 'none', border: 'none', color: '#475569', fontSize: '0.95rem',
                cursor: 'pointer', flexShrink: 0, marginLeft: '0.75rem', padding: '0.1rem 0.3rem',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* ── Trait rows ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {TRAITS.map((trait) => (
              <div key={trait.key} style={{ border: errors[trait.key] ? '1px solid rgba(248,113,113,0.45)' : 'none', borderRadius: '0.5rem' }}>
                <TraitRow
                  trait={trait}
                  vals={vals}
                  expanded={expanded}
                  onToggle={(k) => { toggle(k); if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; }); }}
                  onChange={(k, v) => { set(k, v); if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; }); }}
                />
              </div>
            ))}
          </div>

          {/* ── Validation message ── */}
          {Object.keys(errors).length > 0 && (
            <p style={{
              color: '#f87171', fontSize: '0.67rem', marginTop: '0.7rem',
              fontFamily: 'monospace', lineHeight: 1.5,
            }}>
              ✕ Vul alle scores met VEREIST in voordat u opslaat.
            </p>
          )}

          {/* ── Footer ── */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '0.6rem',
            marginTop: '1rem', paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <SciFiButton onClick={close} color="#475569" rgb="71, 85, 105" size="sm">
              Annuleren
            </SciFiButton>
            <SciFiButton onClick={confirm} color="#a78bfa" rgb="167, 139, 250" size="sm">
              Scores opslaan
            </SciFiButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default OceanManualInputModal;
