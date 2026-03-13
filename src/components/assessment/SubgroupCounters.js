import React from 'react';

/**
 * SubgroupCounters - Dual-Core Dynamics visualization
 * Shows all 12 archetypes individually with Nature (purple) and Culture (orange) bars.
 * Grouped by their 6 neural pillars.
 * @param {{ subgroups: Array<{ id: number, leftLabel: string, leftScore: number, rightLabel: string, rightScore: number, leftNature?: number, leftCulture?: number, rightNature?: number, rightCulture?: number, harmonyPoints?: number, shadowPoints?: number, axis?: string, group?: string }> }} props
 */
const SubgroupCounters = ({ subgroups }) => {
  // Fixed absolute scale: each archetype appears in exactly 15 nature-eligible
  // and 15 culture-eligible questions, so the max per component = 15
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

      {/* Legend */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '1.5rem',
        marginBottom: '1.25rem', fontSize: '0.7rem',
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
        <span style={{ color: 'rgba(165, 243, 252, 0.35)', fontSize: '0.6rem', alignSelf: 'center' }}>
          ( /15 max )
        </span>
      </div>
      
      {/* 12 Archetype bars grouped by neural pillar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {subgroups.map((group) => {
          const leftNature = group.leftNature || 0;
          const leftCulture = group.leftCulture || 0;
          const rightNature = group.rightNature || 0;
          const rightCulture = group.rightCulture || 0;
          const hasBonus = (group.harmonyPoints > 0) || (group.shadowPoints > 0);

          return (
            <div key={group.id} style={{ marginBottom: '0.5rem' }}>
              {/* Group label */}
              <div style={{
                fontSize: '0.6rem',
                fontFamily: "'Rajdhani', sans-serif",
                color: 'rgba(165, 243, 252, 0.5)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: '0.35rem',
                paddingLeft: '0.25rem',
              }}>
                {group.group} — {group.axis}
              </div>

              {/* Two archetype rows for this pillar */}
              {[
                { label: group.leftLabel, nature: leftNature, culture: leftCulture },
                { label: group.rightLabel, nature: rightNature, culture: rightCulture },
              ].map(arch => {
                const naturePct = Math.min((arch.nature / MAX_PER_COMPONENT) * 100, 100);
                const culturePct = Math.min((arch.culture / MAX_PER_COMPONENT) * 100, 100);

                return (
                  <div key={arch.label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.2rem 0',
                  }}>
                    {/* Archetype name */}
                    <div style={{
                      width: '5.5rem',
                      textAlign: 'right',
                      fontFamily: "'Lexend Mega', sans-serif",
                      fontSize: '0.65rem',
                      color: 'rgba(209, 213, 219, 0.9)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                    }}>
                      {arch.label}
                    </div>

                    {/* Dual bars: separate Nature and Culture on absolute scale */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {/* Nature bar */}
                      <div style={{
                        height: '0.45rem',
                        background: 'rgba(17, 24, 39, 0.5)',
                        borderRadius: '2px',
                        border: '1px solid rgba(75, 85, 99, 0.3)',
                        overflow: 'hidden',
                        position: 'relative',
                      }}>
                        <div style={{
                          width: `${naturePct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.7), rgba(168, 85, 247, 0.95))',
                          boxShadow: arch.nature > 0 ? '0 0 6px rgba(168, 85, 247, 0.3)' : 'none',
                          transition: 'width 0.8s ease-out',
                          borderRadius: '1px',
                        }} />
                      </div>
                      {/* Culture bar */}
                      <div style={{
                        height: '0.45rem',
                        background: 'rgba(17, 24, 39, 0.5)',
                        borderRadius: '2px',
                        border: '1px solid rgba(75, 85, 99, 0.3)',
                        overflow: 'hidden',
                        position: 'relative',
                      }}>
                        <div style={{
                          width: `${culturePct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.7), rgba(249, 115, 22, 0.95))',
                          boxShadow: arch.culture > 0 ? '0 0 6px rgba(249, 115, 22, 0.3)' : 'none',
                          transition: 'width 0.8s ease-out',
                          borderRadius: '1px',
                        }} />
                      </div>
                    </div>

                    {/* Counts: nature / culture as absolute values */}
                    <div style={{
                      width: '3.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '0px',
                      flexShrink: 0,
                    }}>
                      <span style={{
                        fontSize: '0.65rem',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 700,
                        color: '#a855f7',
                        lineHeight: 1.1,
                      }}>
                        {arch.nature}<span style={{ fontWeight: 400, color: 'rgba(168,85,247,0.4)', fontSize: '0.55rem' }}>/15</span>
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 700,
                        color: '#f97316',
                        lineHeight: 1.1,
                      }}>
                        {arch.culture}<span style={{ fontWeight: 400, color: 'rgba(249,115,22,0.4)', fontSize: '0.55rem' }}>/15</span>
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Bonus sector: Shadow / Harmony points */}
              {hasBonus && (
                <div style={{
                  marginTop: '0.2rem',
                  padding: '0.3rem 0.75rem',
                  background: group.shadowPoints > 0
                    ? 'rgba(249, 115, 22, 0.08)'
                    : 'rgba(0, 255, 157, 0.08)',
                  border: `1px solid ${group.shadowPoints > 0
                    ? 'rgba(249, 115, 22, 0.25)'
                    : 'rgba(0, 255, 157, 0.25)'}`,
                  borderRadius: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                }}>
                  {group.harmonyPoints > 0 && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      color: '#00ff9d',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}>
                      ✦ Harmony +{group.harmonyPoints} pts
                    </span>
                  )}
                  {group.shadowPoints > 0 && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      color: '#f97316',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}>
                      ✦ Shadow +{group.shadowPoints} pts
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default SubgroupCounters;
