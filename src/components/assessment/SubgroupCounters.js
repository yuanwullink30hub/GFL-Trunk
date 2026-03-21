import React from 'react';

/**
 * SubgroupCounters - Dual-Core Dynamics visualization
 * Groups by neural pillar. Left side = network hardware name.
 * Bars show per-archetype Nature/Culture. Below each pair: archetype name badges.
 */

const GROUP_META = {
  Ruling:     { network: 'CEN Dominantie',         drive: 'Externe structuur en orde' },
  Relational: { network: 'Limbic Coupling',         drive: 'Emotionele fusie en empathie' },
  Seeker:     { network: 'Hoge Openness',           drive: 'Zuiverheid en ontdekking' },
  Chaos:      { network: 'Salience Network',        drive: 'Disruptie en lage consciÃ«ntieusheid' },
  Abstract:   { network: 'DMN Hyper-connectie',     drive: 'Interne reflectie en subjectiviteit' },
  Agency:     { network: 'Extraversie / Wilskracht', drive: 'Actie en transformatie' },
};

const ARCHETYPE_POSITIONS = {
  Ruler: 1, Judge: 2,
  Lover: 3, Caregiver: 4,
  Innocent: 5, Explorer: 6,
  Outlaw: 7, Trickster: 8,
  Sage: 9, Artist: 10,
  Magician: 11, Hero: 12,
};

const SubgroupCounters = ({ subgroups }) => {
  const MAX_PER_COMPONENT = 15;

  return (
    <div style={{ width: '100%' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
        <div style={{ height: 1, flex: 1, background: 'rgba(168, 85, 247, 0.3)' }} />
        <h3 style={{
          fontSize: '1.15rem',
          fontFamily: "'Lexend Mega', sans-serif",
          color: '#a855f7',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          padding: '0 1rem'
        }}>
          Dual-Core Dynamics
        </h3>
        <div style={{ height: 1, flex: 1, background: 'rgba(168, 85, 247, 0.3)' }} />
      </div>

      {/* Subtitle */}
      <p style={{
        textAlign: 'center',
        fontFamily: "'Figtree', sans-serif",
        fontSize: '0.8rem',
        color: 'rgba(148,163,184,0.5)',
        letterSpacing: '0.04em',
        fontStyle: 'italic',
        margin: '0 0 0.9rem',
      }}>
        Niet goed of slecht, maar meer of minder in gebruik.
      </p>

      {/* Legend */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '1.5rem',
        marginBottom: '1.25rem', fontSize: '0.85rem',
        fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.1em',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#a855f7', display: 'inline-block' }} />
          <span style={{ color: '#a855f7', fontWeight: 700 }}>NATURE</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f97316', display: 'inline-block' }} />
          <span style={{ color: '#f97316', fontWeight: 700 }}>CULTURE</span>
        </span>
        <span style={{ color: 'rgba(165, 243, 252, 0.35)', fontSize: '0.8rem', alignSelf: 'center' }}>
          ( /33 max )
        </span>
      </div>

      {/* Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {subgroups.map((group) => {
          const leftNature  = group.leftNature  || 0;
          const leftCulture = group.leftCulture || 0;
          const rightNature  = group.rightNature  || 0;
          const rightCulture = group.rightCulture || 0;
          const meta = GROUP_META[group.group] || { network: group.group, drive: group.axis };

          const archs = [
            { label: group.leftLabel,  nature: leftNature,  culture: leftCulture  },
            { label: group.rightLabel, nature: rightNature, culture: rightCulture },
          ];

          return (
            <div key={group.id}>
              {/* Row: [network label] [bars] [counts] */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>

                {/* Left: network hardware name */}
                <div style={{
                  width: '7.5rem',
                  flexShrink: 0,
                  textAlign: 'right',
                }}>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'rgba(165, 243, 252, 0.8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    lineHeight: 1.2,
                  }}>
                    {meta.network}
                  </div>
                  <div style={{
                    fontFamily: "'Figtree', sans-serif",
                    fontSize: '0.8rem',
                    color: 'rgba(148,163,184,0.45)',
                    lineHeight: 1.3,
                    marginTop: '0.1rem',
                  }}>
                    {meta.drive}
                  </div>
                </div>

                {/* Single stacked bar: Nature segment + Culture segment */}
                {(() => {
                  const totalNature  = leftNature  + rightNature;
                  const totalCulture = leftCulture + rightCulture;
                  const MAX_TOTAL = 36;
                  const naturePct  = Math.min((totalNature  / MAX_TOTAL) * 100, 100);
                  const culturePct = Math.min((totalCulture / MAX_TOTAL) * 100, 100);
                  return (
                    <>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '0.15rem' }}>
                        {/* Stacked bar track */}
                        <div style={{
                          height: '0.55rem',
                          background: 'rgba(17,24,39,0.5)',
                          borderRadius: '3px',
                          border: '1px solid rgba(75,85,99,0.3)',
                          overflow: 'hidden',
                          display: 'flex',
                        }}>
                          <div style={{
                            width: `${naturePct}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, rgba(168,85,247,0.7), rgba(168,85,247,0.95))',
                            boxShadow: totalNature > 0 ? '0 0 6px rgba(168,85,247,0.3)' : 'none',
                            transition: 'width 0.8s ease-out',
                            borderRadius: '1px 0 0 1px',
                            flexShrink: 0,
                          }} />
                          {totalNature > 0 && totalCulture > 0 && (
                            <div style={{ width: '1px', height: '100%', background: 'rgba(0,0,0,0.4)', flexShrink: 0 }} />
                          )}
                          <div style={{
                            width: `${culturePct}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, rgba(249,115,22,0.7), rgba(249,115,22,0.95))',
                            boxShadow: totalCulture > 0 ? '0 0 6px rgba(249,115,22,0.3)' : 'none',
                            transition: 'width 0.8s ease-out',
                            borderRadius: '0 1px 1px 0',
                            flexShrink: 0,
                          }} />
                        </div>
                        {/* Archetype badges — inline under the bar, aligns with drive label */}
                        <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.1rem' }}>
                          {archs.map((arch) => (
                            <span key={arch.label} style={{
                              fontSize: '0.7rem',
                              fontFamily: "'Rajdhani', sans-serif",
                              fontWeight: 700,
                              letterSpacing: '0.07em',
                              textTransform: 'uppercase',
                              color: 'rgba(165,243,252,0.8)',
                              background: 'rgba(165,243,252,0.05)',
                              border: '1px solid rgba(165,243,252,0.2)',
                              borderRadius: '3px',
                              padding: '0.05rem 0.3rem',
                            }}>
                              {arch.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: individual values + total */}
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px', width: '4rem', paddingTop: '0.15rem' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.8rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#a855f7' }}>
                            N{totalNature}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#f97316' }}>
                            C{totalCulture}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: 'rgba(165,243,252,0.75)', lineHeight: 1 }}>
                          {totalNature + totalCulture}<span style={{ fontWeight: 400, color: 'rgba(165,243,252,0.3)', fontSize: '0.8rem' }}>/33</span>
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>


            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubgroupCounters;
