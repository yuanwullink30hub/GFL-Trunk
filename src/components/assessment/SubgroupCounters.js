import React from 'react';

/**
 * SubgroupCounters - Dual-Core Dynamics visualization
 * Shows all 12 archetypes individually with Nature (purple) and Culture (orange) bars.
 * Grouped by their 6 neural pillars.
 * @param {{ subgroups: Array<{ id: number, leftLabel: string, leftScore: number, rightLabel: string, rightScore: number, leftNature?: number, leftCulture?: number, rightNature?: number, rightCulture?: number, harmonyPoints?: number, shadowPoints?: number, axis?: string, group?: string }> }} props
 */
const SubgroupCounters = ({ subgroups }) => {
  // Max selections per archetype = 5 (each appears in 5 questions)
  const MAX_SELECTIONS = 5;

  // Build flat list of all 12 archetypes from subgroup pairs
  const allArchetypes = [];
  subgroups.forEach(group => {
    allArchetypes.push({
      label: group.leftLabel,
      nature: group.leftNature || 0,
      culture: group.leftCulture || 0,
      total: (group.leftNature || 0) + (group.leftCulture || 0),
      groupName: group.group || '',
      axis: group.axis || '',
      pairId: group.id,
    });
    allArchetypes.push({
      label: group.rightLabel,
      nature: group.rightNature || 0,
      culture: group.rightCulture || 0,
      total: (group.rightNature || 0) + (group.rightCulture || 0),
      groupName: group.group || '',
      axis: group.axis || '',
      pairId: group.id,
    });
  });

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
                const naturePct = MAX_SELECTIONS > 0 ? (arch.nature / MAX_SELECTIONS) * 100 : 0;
                const culturePct = MAX_SELECTIONS > 0 ? (arch.culture / MAX_SELECTIONS) * 100 : 0;

                return (
                  <div key={arch.label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.25rem 0',
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

                    {/* Stacked bar: Nature (purple) + Culture (orange) */}
                    <div style={{
                      flex: 1,
                      height: '0.7rem',
                      background: 'rgba(17, 24, 39, 0.5)',
                      borderRadius: '2px',
                      border: '1px solid rgba(75, 85, 99, 0.4)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                    }}>
                      {/* Nature segment */}
                      <div style={{
                        width: `${naturePct}%`,
                        height: '100%',
                        background: 'rgba(168, 85, 247, 0.85)',
                        boxShadow: arch.nature > 0 ? '0 0 6px rgba(168, 85, 247, 0.3)' : 'none',
                        transition: 'width 0.8s ease-out',
                      }} />
                      {/* Culture segment */}
                      <div style={{
                        width: `${culturePct}%`,
                        height: '100%',
                        background: 'rgba(249, 115, 22, 0.85)',
                        boxShadow: arch.culture > 0 ? '0 0 6px rgba(249, 115, 22, 0.3)' : 'none',
                        transition: 'width 0.8s ease-out',
                      }} />
                    </div>

                    {/* Counts */}
                    <div style={{
                      width: '3.5rem',
                      display: 'flex',
                      gap: '0.15rem',
                      flexShrink: 0,
                      justifyContent: 'flex-end',
                    }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 700,
                        color: '#a855f7',
                      }}>
                        {arch.nature}
                      </span>
                      <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)' }}>/</span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 700,
                        color: '#f97316',
                      }}>
                        {arch.culture}
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
