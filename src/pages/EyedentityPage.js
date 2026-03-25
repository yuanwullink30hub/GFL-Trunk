import React, { memo, useEffect, useState, useCallback } from 'react';
import { ARCHETYPES, SHADOW_PAIRS, ARCHETYPE_TO_GROUP, getExtendedDescription, getArchetypeQuote } from '../data/assessment';
import { getArchetypeImage } from '../data/assessment/archetypeImages';
import { getCoreProfile } from '../data/assessment/oceanProfiles';
import { POLICY_CONTENT } from '../data/policyContent';
import { submitAssessmentReview } from '../utils/apiClient';
import { SciFiButton } from '../components/assessment/dashboardStyles';

/**
 * ProfileResultCard â€” loads the admin's own assessment from localStorage
 * and renders a result card matching the AssessmentResultsModal visual.
 */
const MAVERICK_DEFAULT = {
  mainArchetype: 'RULER',
  supportArchetype: 'OUTLAW',
  supportGroup: 'CHAOS',
  extendedArchetype: 'The Maverick',
  harmonyActive: false,
  shadowBonusActive: false,
  totalScore: 94,
  maxScore: 100,
  timestamp: null,
  archetypeScores: {},
  answerLog: [],
};

/**
 * ProfileResultCard â€” renders the user's assessment result.
 * Accepts a `result` prop matching the resultObj shape from AssessmentResultsModal.
 * Falls back to derived MAVERICK_DEFAULT demo data when no prop is provided.
 */
const ProfileResultCard = ({ result: resultProp }) => {
  const green = '#1d9904';

  // â”€â”€ Derive base keys (prop takes precedence over default) â”€â”€
  const mainKey       = resultProp?.mainArchetype      || MAVERICK_DEFAULT.mainArchetype;
  const supportKey    = resultProp?.secondaryArchetype || MAVERICK_DEFAULT.supportArchetype;
  const supportGroup  = resultProp?.supportGroup       || MAVERICK_DEFAULT.supportGroup;

  const main      = ARCHETYPES[mainKey]    || {};
  const support   = ARCHETYPES[supportKey] || {};
  const shadowKey = SHADOW_PAIRS[mainKey];
  const blindspotKey = SHADOW_PAIRS[supportKey];
  const extendedDesc = getExtendedDescription(mainKey, supportGroup);
  const coreProfile  = resultProp?.coreProfile || getCoreProfile(mainKey);
  const levenslesQuote = resultProp?.levensles  || getArchetypeQuote(mainKey, supportGroup);
  const imageUrl = resultProp?.imageUrl || getArchetypeImage(mainKey, supportGroup) || main.imageUrl;

  // â”€â”€ Build unified `r` object â€” real data OR derived demo â”€â”€
  const r = resultProp || {
    name:             MAVERICK_DEFAULT.extendedArchetype,
    extendedSubtitle: extendedDesc?.subtitle    || null,
    combinationText:  extendedDesc?.combination || null,
    shadowInsight:    extendedDesc?.shadow      || null,
    mainName:         main.name,
    mainNameEn:       main.nameEn    || mainKey,
    group:            main.group     || null,
    mainMotivation:   main.motivation   || null,
    mainPositive:     main.positive     || null,
    mainShadowTrait:  main.shadow       || null,
    secondaryName:        support.name,
    secondaryNameEn:      support.nameEn || supportKey,
    secondaryDescription: support.description || null,
    secondaryMotivation:  support.motivation  || null,
    secondaryPositive:    support.positive    || null,
    supportGroup,
    shadowName:         shadowKey    ? (ARCHETYPES[shadowKey]?.name    || null) : null,
    shadowNameEn:       shadowKey    ? (ARCHETYPES[shadowKey]?.nameEn  || shadowKey) : null,
    shadowDescription:  shadowKey    ? (ARCHETYPES[shadowKey]?.description || null) : null,
    blindspotName:        blindspotKey ? (ARCHETYPES[blindspotKey]?.name    || null) : null,
    blindspotNameEn:      blindspotKey ? (ARCHETYPES[blindspotKey]?.nameEn  || blindspotKey) : null,
    blindspotDescription: blindspotKey ? (ARCHETYPES[blindspotKey]?.description || null) : null,
    blindspotShadowTrait: blindspotKey ? (ARCHETYPES[blindspotKey]?.shadow || null) : null,
    harmonyActive:     MAVERICK_DEFAULT.harmonyActive,
    shadowBonusActive: MAVERICK_DEFAULT.shadowBonusActive,
    oceanScores:    null,
    extendedOcean:  null,
  };

  // â”€â”€ OCEAN trait bar helper â”€â”€
  const TraitBar = ({ label, value, color, isMain }) => (
    <div style={{ marginBottom: isMain ? '0.35rem' : '0.2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          width: isMain ? '11rem' : '9rem', flexShrink: 0,
          fontSize: isMain ? '0.72rem' : '0.65rem',
          fontFamily: isMain ? "'Lexend Mega', sans-serif" : "'Rajdhani', sans-serif",
          fontWeight: isMain ? 700 : 500,
          color: isMain ? 'rgba(209,213,219,0.95)' : 'rgba(139,92,246,0.85)',
          textTransform: isMain ? 'uppercase' : 'none',
          letterSpacing: isMain ? '0.06em' : '0',
          textAlign: 'right',
        }}>{label}</span>
        <div style={{ flex: 1, height: isMain ? '10px' : '7px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${value}%`, height: '100%', backgroundColor: isMain ? color : 'rgba(249,115,22,0.6)', borderRadius: '3px', transition: 'width 0.6s ease' }} />
        </div>
        <span style={{ width: '2rem', flexShrink: 0, textAlign: 'left', fontSize: isMain ? '0.95rem' : '0.8rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: isMain ? color : 'rgba(249,115,22,0.85)' }}>{value}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* â”€â”€ 1. Header & Profile â”€â”€ */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem', paddingBottom: '1.5rem', borderBottom: `1px solid rgba(29, 153, 4, 0.2)` }}>
        {/* Profile Image â€” circular with spinning rings */}
        <div style={{ position: 'relative', width: '9rem', height: '9rem', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px dashed rgba(29, 153, 4, 0.4)', animation: 'spin 20s linear infinite' }} />
          <div style={{ position: 'absolute', inset: '-0.75rem', borderRadius: '50%', border: '1px dotted rgba(168, 85, 247, 0.4)', animation: 'spin 15s linear infinite reverse' }} />
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${green}`, background: '#000', position: 'relative' }}>
            {imageUrl && <img src={imageUrl} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.25) sepia(0.2)', transform: 'scale(1.05)' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 'clamp(1.2rem, 2vw, 2rem)', fontFamily: "'Lexend Mega', sans-serif", fontWeight: 'bold', background: 'linear-gradient(to right, #a855f7, #d8b4fe, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))', marginBottom: '0.5rem' }}>
            {r.name}
          </h1>
          {r.extendedSubtitle && (
            <p style={{ fontSize: '0.85rem', color: 'rgba(249, 115, 22, 0.9)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {r.extendedSubtitle}
            </p>
          )}
          {levenslesQuote && (
            <p style={{ fontSize: '0.9rem', color: 'rgba(156, 163, 175, 1)', fontFamily: "'Figtree', sans-serif", fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
              "{levenslesQuote}"
            </p>
          )}
          <p style={{ fontSize: '0.8rem', color: `rgba(29, 153, 4, 0.7)`, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
            {r.mainName} {r.harmonyActive ? 'âŸ·' : '+'} {r.secondaryName}
          </p>
          {r.harmonyActive && <p style={{ fontSize: '0.72rem', color: green, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.25rem', textTransform: 'uppercase' }}>âœ¦ Harmony Bonus Active âœ¦</p>}
          {r.shadowBonusActive && <p style={{ fontSize: '0.72rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.25rem', textTransform: 'uppercase' }}>âœ¦ Shadow Bonus Active âœ¦</p>}
        </div>
      </div>

      {/* â”€â”€ 2. Combination Profile â”€â”€ */}
      {r.combinationText && (
        <div style={{ background: 'transparent', border: `1px solid rgba(29, 153, 4, 0.25)`, borderRadius: '0.75rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: `linear-gradient(to right, transparent, ${green}, transparent)` }} />
          <h3 style={{ color: green, fontFamily: "'Lexend Mega', sans-serif", fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
            Waarom jij {r.name} bent
          </h3>
          <p style={{ color: 'rgba(209, 213, 219, 1)', fontFamily: "'Figtree', sans-serif", fontSize: '0.9rem', lineHeight: 1.7, textAlign: 'justify', margin: 0 }}>
            {r.combinationText}
          </p>
        </div>
      )}

      {/* â”€â”€ 3. Main & Support Archetype Cards â”€â”€ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'transparent', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '0.75rem', padding: '1.25rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(to right, #a855f7, transparent)' }} />
          <div style={{ fontSize: '0.62rem', color: 'rgba(168,85,247,0.5)', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Main Archetype</div>
          <h4 style={{ color: '#a855f7', fontFamily: "'Lexend Mega', sans-serif", fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>{r.mainName}</h4>
          <p style={{ fontSize: '0.68rem', color: 'rgba(156,163,175,0.7)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            {r.mainNameEn} â€” {r.group}
          </p>
          {[
            { label: 'Motivatie', text: r.mainMotivation },
            { label: 'Kracht',    text: r.mainPositive },
            { label: 'Schaduw',   text: r.mainShadowTrait },
          ].filter(f => f.text).map(({ label, text }) => (
            <div key={label} style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.62rem', color: '#a855f7', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}: </span>
              <span style={{ fontSize: '0.82rem', color: 'rgba(209,213,219,0.9)', fontFamily: "'Figtree', sans-serif" }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'transparent', border: '1px solid rgba(249, 115, 22, 0.2)', borderRadius: '0.75rem', padding: '1.25rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(to right, #f97316, transparent)' }} />
          <div style={{ fontSize: '0.62rem', color: 'rgba(249,115,22,0.5)', fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Support Archetype</div>
          <h4 style={{ color: '#f97316', fontFamily: "'Lexend Mega', sans-serif", fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>{r.secondaryName}</h4>
          <p style={{ fontSize: '0.68rem', color: 'rgba(156,163,175,0.7)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
            {r.secondaryNameEn} â€” {r.supportGroup}
          </p>
          {[
            { label: 'Motivatie', text: r.secondaryMotivation },
            { label: 'Kracht',    text: r.secondaryPositive },
            { label: 'Profiel',   text: r.secondaryDescription },
          ].filter(f => f.text).map(({ label, text }) => (
            <div key={label} style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.62rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}: </span>
              <span style={{ fontSize: '0.82rem', color: 'rgba(209,213,219,0.9)', fontFamily: "'Figtree', sans-serif" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ 4. OCEAN Profile (when scores available) â”€â”€ */}
      {(r.extendedOcean?.ocean || r.oceanScores) && (() => {
        const OCEAN_LABEL_MAP = { O: 'Openheid', C: 'ConsciÃ«ntieusheid', E: 'Extraversie', A: 'Meegaandheid', N: 'Neuroticisme' };
        const OCEAN_COLOR_MAP = { O: '#a855f7', C: '#00d4ff', E: '#1d9904', A: '#f59e0b', N: '#ef4444' };
        const scores = r.oceanScores || r.extendedOcean?.ocean || {};
        return (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', padding: '1.25rem 1.5rem' }}>
            <h3 style={{ color: '#00d4ff', fontFamily: "'Lexend Mega', sans-serif", fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
              OCEAN Persoonlijkheidsprofiel
            </h3>
            {Object.entries(scores).map(([key, val], i, arr) => (
              <div key={key} style={{ marginBottom: i < arr.length - 1 ? '0.75rem' : 0 }}>
                <TraitBar label={OCEAN_LABEL_MAP[key] || key} value={Math.round(val)} color={OCEAN_COLOR_MAP[key] || '#00d4ff'} isMain={true} />
              </div>
            ))}
          </div>
        );
      })()}

      {/* â”€â”€ 5. Shadow Integration â”€â”€ */}
      {(r.shadowName || r.shadowInsight) && (
        <div style={{ background: 'transparent', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '0.75rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(to right, transparent, #a855f7, transparent)' }} />
          <h3 style={{ color: '#a855f7', fontFamily: "'Lexend Mega', sans-serif", fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
            Schaduw Archetype{r.shadowName ? ` â€” ${r.shadowName}` : ''}
          </h3>
          {r.shadowInsight && (
            <p style={{ color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif", fontSize: '0.88rem', lineHeight: 1.7, textAlign: 'justify', margin: 0 }}>
              {r.shadowInsight}
            </p>
          )}
        </div>
      )}

      {/* â”€â”€ 6. Blindspot â”€â”€ */}
      {(r.blindspotName || r.blindspotDescription) && (
        <div style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.75rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(to right, transparent, #ef4444, transparent)' }} />
          <h3 style={{ color: '#ef4444', fontFamily: "'Lexend Mega', sans-serif", fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
            Blindspot{r.blindspotName ? ` â€” ${r.blindspotName}` : ''}
          </h3>
          {(r.blindspotDescription || r.blindspotShadowTrait) && (
            <p style={{ color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif", fontSize: '0.88rem', lineHeight: 1.7, textAlign: 'justify', margin: 0 }}>
              {r.blindspotDescription || r.blindspotShadowTrait}
            </p>
          )}
        </div>
      )}

      {/* â”€â”€ 7. Core Profile Insights â”€â”€ */}
      {coreProfile && (() => {
        const fields = [
          { label: 'Superkracht op de Werkvloer', text: coreProfile.workplaceSuperpower },
          { label: 'Conflictstijl',               text: coreProfile.conflictStyle },
          { label: 'Relatiepatroon',              text: coreProfile.relationshipPattern },
          { label: 'Individuatiepad',             text: coreProfile.individuationPath },
        ].filter(f => f.text);
        if (!fields.length) return null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {fields.map(({ label, text }) => (
              <div key={label}>
                <div style={{ fontSize: '0.65rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
                  {label}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.85)', fontFamily: "'Figtree', sans-serif", lineHeight: 1.65, margin: 0, textAlign: 'justify' }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        );
      })()}

    </div>
  );
};

const CornerStone = ({ variant = 'purple' }) => {
  const accentColor = variant === 'orange' ? '#f59e0b' : '#a855f7';
  return {
    topLeft: (
      <div style={{
        position: 'absolute',
        top: '-2px',
        left: '-2px',
        width: '16px',
        height: '16px',
        border: `1.5px solid ${accentColor}`,
        borderRadius: '10px 0 0 0',
        borderBottom: 'none',
        borderRight: 'none'
      }} />
    ),
    topRight: (
      <div style={{
        position: 'absolute',
        top: '-2px',
        right: '-2px',
        width: '16px',
        height: '16px',
        border: `1.5px solid ${accentColor}`,
        borderRadius: '0 10px 0 0',
        borderBottom: 'none',
        borderLeft: 'none'
      }} />
    ),
    bottomLeft: (
      <div style={{
        position: 'absolute',
        bottom: '-2px',
        left: '-2px',
        width: '16px',
        height: '16px',
        border: `1.5px solid ${accentColor}`,
        borderRadius: '0 0 0 10px',
        borderTop: 'none',
        borderRight: 'none'
      }} />
    ),
    bottomRight: (
      <div style={{
        position: 'absolute',
        bottom: '-2px',
        right: '-2px',
        width: '16px',
        height: '16px',
        border: `1.5px solid ${accentColor}`,
        borderRadius: '0 0 10px 0',
        borderTop: 'none',
        borderLeft: 'none'
      }} />
    )
  };
};

// â”€â”€â”€ Standalone feedback form â€” linked from confirmation email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FeedbackStandaloneForm = () => {
  const params = new URLSearchParams(window.location.search);
  const [formData, setFormData] = useState({
    email: params.get('email') || '', starRating: 0, whatWorked: '', whatDidntWork: '', suggestions: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const assessmentId = params.get('id') || 'anonymous';

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const { email, whatWorked, whatDidntWork, suggestions } = formData;
    if (!email.trim()) { setError('Vul je e-mailadres in'); return; }
    if (!formData.starRating) { setError('Selecteer een score (1-9)'); return; }
    if (!whatWorked.trim() && !whatDidntWork.trim() && !suggestions.trim()) {
      setError('Vul minimaal Ã©Ã©n tekstveld in'); return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await submitAssessmentReview({
        assessmentId,
        email: email.trim(),
        starRating: formData.starRating,
        whatWorked: whatWorked.trim(),
        whatDidntWork: whatDidntWork.trim(),
        suggestions: suggestions.trim(),
        archetypeKey: '',
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Versturen mislukt, probeer opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, assessmentId]);

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>âœ…</div>
        <p style={{ color: '#22c55e', fontFamily: "'Figtree', sans-serif", fontSize: '1rem', marginBottom: '0.5rem', margin: '0 0 0.5rem' }}>
          Dank je wel voor je feedback!
        </p>
        <p style={{ color: 'rgba(209,213,219,0.6)', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', margin: 0 }}>
          Jouw reactie is ontvangen en draagt bij aan de verbetering van dit systeem.
        </p>
      </div>
    );
  }

  const baseField = {
    width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.8)',
    border: '1px solid rgba(168,85,247,0.2)', borderRadius: '0.5rem',
    color: '#fff', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', boxSizing: 'border-box',
  };

  return (
    <div>
      <p style={{ color: 'rgba(209,213,219,0.7)', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', marginTop: 0, marginBottom: '1.5rem' }}>
        Topper, hopelijk ben je wijzer geworden en wil je dit nu met ons delen â€” We horen graag wat je ervan vondt.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Star Rating 1-9 */}
        <div>
          <label style={{ display: 'block', color: '#f59e0b', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Score *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {[...Array(9)].map((_, i) => (
              <button key={i} type="button" onClick={() => setFormData({ ...formData, starRating: i + 1 })} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem',
                color: i < formData.starRating ? '#f59e0b' : 'rgba(245,158,11,0.2)',
                padding: '0.15rem', transition: 'color 0.15s, transform 0.15s',
                transform: i < formData.starRating ? 'scale(1.1)' : 'scale(1)',
              }}>â˜…</button>
            ))}
            {formData.starRating > 0 && (
              <span style={{ marginLeft: '0.5rem', color: '#f59e0b', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold' }}>{formData.starRating}/9</span>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', color: '#a855f7', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>E-mailadres *</label>
          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="jouw@email.nl" style={baseField} />
        </div>

        {/* Accuraatheid */}
        <div>
          <label style={{ display: 'block', color: '#22c55e', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Hoe accuraat is het resultaat volgens jouw kennis en gevoel?
          </label>
          <textarea value={formData.whatWorked} onChange={(e) => setFormData({ ...formData, whatWorked: e.target.value })}
            placeholder="Beschrijf in hoeverre het resultaat klopt met wie jij bent..."
            style={{ ...baseField, minHeight: '80px', border: '1px solid rgba(34,197,94,0.2)', resize: 'vertical' }} />
        </div>

        {/* Niet overeenkomend */}
        <div>
          <label style={{ display: 'block', color: '#ef4444', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Waar ben je zeker van dat niet overeenkomt met jouw persoonlijkheid?
          </label>
          <textarea value={formData.whatDidntWork} onChange={(e) => setFormData({ ...formData, whatDidntWork: e.target.value })}
            placeholder="Bijv: ik ben helemaal niet competitief, want..."
            style={{ ...baseField, minHeight: '80px', border: '1px solid rgba(239,68,68,0.2)', resize: 'vertical' }} />
        </div>

        {/* Suggesties */}
        <div>
          <label style={{ display: 'block', color: '#a855f7', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Wat zou jij anders doen of toevoegen aan dit systeem?
          </label>
          <textarea value={formData.suggestions} onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
            placeholder="Bijv: meer context bij de vragen, andere formulering..."
            style={{ ...baseField, minHeight: '80px', resize: 'vertical' }} />
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        <SciFiButton type="submit" disabled={isSubmitting} variant="purple" size="md">
          {isSubmitting ? 'VERSTUREN...' : 'VERSTUUR FEEDBACK'}
        </SciFiButton>
      </form>
    </div>
  );
};

const NAV_ITEMS = [
  { id: 'profile', slug: 'profiel', title: 'PERSOONLIJK PROFIEL', icon: 'ðŸ§¬', version: 'v1.0' },
  { id: 'terms', slug: 'algemene-voorwaarden', title: 'ALGEMENE VOORWAARDEN', icon: 'ðŸ“‹', version: 'Beta 1.0' },
  { id: 'privacy', slug: 'privacybeleid', title: 'PRIVACYBELEID', icon: 'ðŸ”’', version: 'v1.0' },
  { id: 'cookies', slug: 'cookiebeleid', title: 'COOKIEBELEID', icon: 'ðŸª', version: 'v1.1' },
  { id: 'ai', slug: 'ai-transparantie', title: 'AI-TRANSPARANTIE', icon: 'ðŸ¤–', version: 'v1.0' },
  { id: 'ip', slug: 'intellectueel-eigendom', title: 'INTELLECTUEEL EIGENDOM', icon: 'Â©', version: 'v2.0' },
  { id: 'usage', slug: 'gebruiksvoorwaarden-misbruik', title: 'GEBRUIKSVOORWAARDEN', icon: 'âš–', version: 'v2.1' },
  { id: 'retention', slug: 'gegevensbehoud-en-verwijdering', title: 'GEGEVENSBEHOUD & VERWIJDERING', icon: 'ðŸ—‚', version: 'v1.0' },
  { id: 'register', slug: 'verwerkingsregister', title: 'VERWERKINGSREGISTER', icon: 'ðŸ“œ', version: 'v2.0' },
  { id: 'feedback', slug: 'feedback', title: 'FEEDBACK', icon: 'â­', version: 'Beta' },
];

const SLUG_TO_ID = Object.fromEntries(NAV_ITEMS.map(item => [item.slug, item.id]));

const EyedentityPage = memo(({ isVisible, onBack }) => {
  const getTabFromPath = useCallback(() => {
    const slug = window.location.pathname.replace(/^\//, '');
    if (slug && SLUG_TO_ID[slug]) return SLUG_TO_ID[slug];
    return 'profile';
  }, []);

  const [selectedId, setSelectedId] = useState(getTabFromPath);

  useEffect(() => {
    const onPopState = () => setSelectedId(getTabFromPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [getTabFromPath]);

  const handleTabClick = useCallback((id) => {
    const item = NAV_ITEMS.find(i => i.id === id);
    setSelectedId(id);
    window.history.pushState(null, '', `/${item?.slug || 'profiel'}`);
  }, []);

  const selectedItem = NAV_ITEMS.find(item => item.id === selectedId);
  const accentColor = '#a855f7';
  const corners = CornerStone({ variant: 'purple' });

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
      pointerEvents: isVisible ? 'auto' : 'none',
    }}>
      <style>{`
        @keyframes eyeHoloSheen {
          0%   { background-position: 200% 200%; }
          50%  { background-position: 0% 0%; }
          100% { background-position: 200% 200%; }
        }
        @keyframes eyeHoloScanline {
          0%   { background-position: 0 -200%; }
          100% { background-position: 0 200%; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      {/* â”€â”€ Outer shell â€” positioning context only, corners live here so overflow:hidden can't clip them â”€â”€ */}
      <div style={{ position: 'relative', width: '70vw', height: '70vh', flexShrink: 0 }}>
        {/* Purple L-bracket corners â€” exact SectorFrame pattern */}
        <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '1rem', height: '1rem', border: '1.5px solid #a855f7', borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none', pointerEvents: 'none', zIndex: 10 }} />
        <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '1rem', height: '1rem', border: '1.5px solid #a855f7', borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none', pointerEvents: 'none', zIndex: 10 }} />
        <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '1rem', height: '1rem', border: '1.5px solid #a855f7', borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none', pointerEvents: 'none', zIndex: 10 }} />
        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '1rem', height: '1rem', border: '1.5px solid #a855f7', borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none', pointerEvents: 'none', zIndex: 10 }} />
        {/* â”€â”€ Inner panel â€” glass effects + overflow:hidden â”€â”€ */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '0.5rem',
          backgroundColor: 'rgba(2, 0, 3, 0.3)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03)',
        }}>
        {/* Holographic sheen */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '0.5rem', pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)',
          backgroundSize: '400% 400%',
          animation: 'eyeHoloSheen 45s ease-in-out infinite',
          mixBlendMode: 'screen',
        }} />
        {/* Scanline sweep */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '0.5rem', pointerEvents: 'none', zIndex: 1,
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)',
          backgroundSize: '100% 300%',
          animation: 'eyeHoloScanline 14s linear infinite',
        }} />
        {/* Content layer */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '1.5rem 2rem' }}>

          {/* â”€â”€ Header â”€â”€ */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderBottom: '1px solid rgba(168,85,247,0.2)',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <div style={{ width: '6px', height: '6px', backgroundColor: accentColor, borderRadius: '1px' }} />
              <span style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '10px',
                letterSpacing: '0.3em',
                color: 'rgba(168,85,247,0.7)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}>
                Persoonlijk Protocol Interface
              </span>
            </div>
            <h1 style={{
              fontFamily: "'Lexend Mega', sans-serif",
              fontSize: 'clamp(1.5rem, 3vw, 2.8rem)',
              fontWeight: 'bold',
              letterSpacing: '-0.02em',
              color: '#ffffff',
              margin: 0,
            }}>
              EYEDENTITY
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <SciFiButton onClick={onBack} variant="purple" size="md">
              â† TERUG
            </SciFiButton>
          </div>
        </div>

        {/* â”€â”€ Main: Sidebar + Content â”€â”€ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, auto) 1fr',
          gap: '1.5rem',
          flex: 1,
          minHeight: 0,
        }}>

          {/* Left Navigation */}
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            overflowY: 'auto',
            width: 'max-content',
            minWidth: 0,
          }}>
            {NAV_ITEMS.map(item => {
              const isActive = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.6rem 0.75rem',
                    background: isActive ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.03)',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    borderLeft: isActive ? `3px solid ${accentColor}` : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.03)'; }}
                >
                  <div style={{
                    fontSize: '1rem',
                    opacity: isActive ? 1 : 0.4,
                    transition: 'opacity 0.3s',
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '9px',
                      fontWeight: 600,
                      color: isActive ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.2)',
                      letterSpacing: '0.1em',
                      marginBottom: '1px',
                      transition: 'color 0.3s',
                    }}>
                      {item.version}
                    </div>
                    <div style={{
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '10px',
                      letterSpacing: '0.04em',
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
                      transition: 'color 0.3s',
                    }}>
                      {item.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Right Content Panel */}
          <div style={{
            position: 'relative',
            backgroundColor: 'rgba(2, 0, 3, 0.3)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '0.5rem',
            padding: '1.5rem 2rem',
            boxShadow: 'inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03), 0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {corners.topLeft}
            {corners.topRight}
            {corners.bottomLeft}
            {corners.bottomRight}

            {/* Bottom gradient line */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(168,85,247,0.2), transparent)',
            }} />

            {/* Content Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
              flexShrink: 0,
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(168,85,247,0.2)',
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
                flexShrink: 0,
              }}>
                {selectedItem?.icon}
              </div>
              <div>
                <h2 style={{
                  fontFamily: "'Lexend Mega', sans-serif",
                  fontSize: 'clamp(0.75rem, 1.1vw, 1.2rem)',
                  fontWeight: 'bold',
                  letterSpacing: '0.02em',
                  color: '#ffffff',
                  margin: 0,
                }}>
                  {selectedItem?.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: "'Rajdhani', sans-serif",
                    color: 'rgba(168,85,247,0.6)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                  }}>
                    {new Date().toLocaleDateString('nl-NL')}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
            }}>
              {selectedId === 'profile' ? (
                <ProfileResultCard />
              ) : selectedId === 'feedback' ? (
                <FeedbackStandaloneForm />
              ) : (
                POLICY_CONTENT[selectedId] || <p style={{ color: '#94a3b8' }}>Inhoud niet beschikbaar.</p>
              )}
            </div>

            {/* Background glow accent */}
            <div style={{
              position: 'absolute',
              bottom: '-6rem',
              right: '-6rem',
              width: '16rem',
              height: '16rem',
              background: 'rgba(168,85,247,0.05)',
              borderRadius: '50%',
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>
        </div>{/* /content layer */}
        </div>{/* /inner panel */}
      </div>{/* /outer shell */}
    </div>
  );
});

EyedentityPage.displayName = 'EyedentityPage';

export default EyedentityPage;
