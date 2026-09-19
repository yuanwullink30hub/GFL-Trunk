import React from 'react';
import { useLanguage } from '@gfl/i18n';
import { getArchetypeImage } from '@gfl/assessment-core/data/archetypeImages';
import SciFiRadarChart from '../components/assessment/SciFiRadarChart';
import { S } from '../data/policyShared';
import { OWNER_PROFILE, OWNER_RADAR, OWNER_OCEAN, OWNER_ARCHETYPES } from '../data/ownerProfile';

const LEXEND = "'Lexend Mega', Arial, Helvetica, sans-serif";
const FIGTREE = "'Figtree', sans-serif";
const PURPLE = '#a855f7';
const ORANGE = '#f97316';

// A tad smaller than the policy documents' reading sizes (owner, 2026-09-19); the page chrome keeps its own.
const SIZE = { body: 'max(14px, 0.66vw)', h2: 'max(17px, 0.78vw)', title: 'max(21px, 0.92vw)', label: 'max(10px, 0.48vw)' };
const T = { p: { ...S.p, fontSize: SIZE.body }, h2: { ...S.h2, fontSize: SIZE.h2 }, h3: { ...S.h3, fontSize: SIZE.body } };

/**
 * The owner's own profile — Eyedentity → Profiel (the policy pages' first tab). De Ronin, in the first
 * person: the card microcopy, the wheel + the Big Five cross-reading, the hardware under pressure, and the
 * quiet voice (reflection, motivation). Copy and numbers: data/ownerProfile.js. Loaded lazily by
 * EyedentityPage, so the chart library only arrives when the tab is opened.
 */
export default function OwnerProfile() {
  const { language } = useLanguage();
  const P = OWNER_PROFILE[language === 'en' ? 'en' : 'nl'];
  const portrait = getArchetypeImage(OWNER_ARCHETYPES.main, OWNER_ARCHETYPES.support);
  const para = (text, i) => <p key={i} style={T.p}>{text}</p>;

  return (
    <div>
      {/* Portrait, name, life lesson */}
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {portrait && (
          <img src={portrait} alt={P.name} loading="lazy" decoding="async"
            style={{ width: 'min(15rem, 40%)', height: 'auto', flexShrink: 0, borderRadius: '0.5rem' }} />
        )}
        <div style={{ flex: '1 1 16rem', minWidth: 0 }}>
          <div style={{ fontFamily: LEXEND, fontWeight: 700, fontSize: SIZE.title, letterSpacing: '0.12em', textTransform: 'uppercase', color: PURPLE }}>{P.name}</div>
          <div style={{ fontFamily: LEXEND, fontWeight: 700, fontSize: SIZE.label, letterSpacing: '0.15em', textTransform: 'uppercase', color: ORANGE, margin: '0.35rem 0 0.9rem' }}>{P.pairing}</div>
          <div style={{ fontFamily: LEXEND, fontSize: SIZE.label, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255, 254, 240, 0.5)', marginBottom: '0.35rem' }}>{P.lessonLabel}</div>
          <blockquote style={{ margin: 0, fontFamily: FIGTREE, fontStyle: 'italic', color: '#FFFEF0', fontSize: SIZE.h2, lineHeight: 1.6 }}>“{P.lesson}”</blockquote>
        </div>
      </div>

      <p style={T.p}>{P.intro}</p>

      {/* The card microcopy: gift and geometry */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '0.75rem', margin: '1rem 0' }}>
        {[[P.giftTitle, P.gift], [P.geometryTitle, P.geometry]].map(([title, text]) => (
          <div key={title} style={{ ...S.box, margin: 0 }}>
            <h3 style={{ ...T.h3, marginTop: 0 }}>{title}</h3>
            <p style={{ ...T.p, marginBottom: 0 }}>{text}</p>
          </div>
        ))}
      </div>

      {/* The wheel */}
      <h2 style={T.h2}>{P.wheelTitle}</h2>
      <SciFiRadarChart
        data={OWNER_RADAR}
        shadow={OWNER_ARCHETYPES.shadow}
        blindspot={OWNER_ARCHETYPES.blindspot}
        mainArchetype="Outlaw"
        supportArchetype="Hero"
      />
      <div style={{ height: '0.9rem' }} />
      {P.wheel.map(para)}

      {/* The Big Five, read through the configuration */}
      <h2 style={T.h2}>{P.oceanTitle}</h2>
      <p style={T.p}>{P.oceanIntro}</p>
      {OWNER_OCEAN.map((trait) => (
        <div key={trait.key} style={{ marginBottom: '1.1rem' }}>
          <h3 style={T.h3}>{P.oceanNames[trait.key]} — {trait.value}</h3>
          <div aria-hidden style={{ height: '0.45rem', borderRadius: '0.15rem', background: 'rgba(168, 85, 247, 0.1)', margin: '0.2rem 0 0.45rem', overflow: 'hidden' }}>
            <div style={{ width: `${trait.value}%`, height: '100%', background: `linear-gradient(135deg, ${PURPLE}, #c084fc)`, boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)' }} />
          </div>
          <div style={{ fontFamily: LEXEND, fontSize: SIZE.label, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255, 254, 240, 0.5)', marginBottom: '0.5rem' }}>
            {trait.aspects.map(([k, v]) => `${P.aspectNames[k]} ${v}`).join('  ·  ')}
          </div>
          <p style={T.p}>{P.ocean[trait.key]}</p>
        </div>
      ))}

      {/* Hardware under pressure */}
      <h2 style={T.h2}>{P.hardwareTitle}</h2>
      {P.hardware.map(para)}

      {/* The quiet voice */}
      <h2 style={T.h2}>{P.reflectionTitle}</h2>
      {P.reflection.map(para)}

      <h2 style={T.h2}>{P.motivationTitle}</h2>
      {P.motivation.map((block, i) => (typeof block === 'string'
        ? para(block, i)
        : <h3 key={i} style={T.h3}>{block.h}</h3>))}

      <p style={{ ...S.updated, marginTop: '1.5rem', marginBottom: 0 }}>{P.footnote}</p>
    </div>
  );
}
