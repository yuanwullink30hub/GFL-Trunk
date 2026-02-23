import React from 'react';

/**
 * SubgroupCounters - Dual-Core Dynamics visualization
 * Shows opposing trait pairs with skewed progress bars (points scored)
 * Includes Shadow/Harmony bonus sector when active
 * @param {{ subgroups: Array<{ id: number, leftLabel: string, leftScore: number, rightLabel: string, rightScore: number, harmonyPoints?: number, shadowPoints?: number, axis?: string }> }} props
 */
const SubgroupCounters = ({ subgroups }) => {
  // Max possible points per side = 5 selections * 5 pts = 25
  const MAX_PTS = 25;

  return (
    <div style={{ width: '100%' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
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
      
      {/* Subgroup rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {subgroups.map((group) => {
          const leftPercent = MAX_PTS > 0 ? (group.leftScore / MAX_PTS) * 100 : 0;
          const rightPercent = MAX_PTS > 0 ? (group.rightScore / MAX_PTS) * 100 : 0;
          const hasBonus = (group.harmonyPoints > 0) || (group.shadowPoints > 0);

          return (
            <div key={group.id} style={{ position: 'relative' }}>
              {/* Background decorative borders */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderLeft: '1px solid rgba(168, 85, 247, 0.1)',
                borderRight: '1px solid rgba(249, 115, 22, 0.1)',
                pointerEvents: 'none'
              }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '0.5rem 0'
              }}>
                
                {/* Left Side: Label & Bar */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      color: '#a855f7',
                      fontWeight: 'bold',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '1.1rem',
                      lineHeight: 1
                    }}>
                      {group.leftScore} pts
                    </div>
                    <div style={{
                      color: 'rgba(156, 163, 175, 1)',
                      fontSize: '0.7rem',
                      fontFamily: "'Lexend Mega', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {group.leftLabel}
                    </div>
                  </div>
                  
                  {/* Left Bar (fills right-to-left) */}
                  <div style={{
                    width: '8rem',
                    height: '0.75rem',
                    background: 'rgba(17, 24, 39, 0.5)',
                    borderRadius: '2px',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: 'skewX(-10deg)'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      right: 0,
                      width: `${leftPercent}%`,
                      background: 'rgba(168, 85, 247, 0.8)',
                      boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
                      transition: 'width 0.8s ease-out'
                    }} />
                  </div>
                </div>

                {/* Center Connector */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2rem'
                }}>
                  <div style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '50%',
                    background: '#f97316',
                    boxShadow: '0 0 8px #f97316'
                  }} />
                </div>

                {/* Right Side: Bar & Label */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.75rem' }}>
                  {/* Right Bar (fills left-to-right) */}
                  <div style={{
                    width: '8rem',
                    height: '0.75rem',
                    background: 'rgba(17, 24, 39, 0.5)',
                    borderRadius: '2px',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: 'skewX(-10deg)'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: `${rightPercent}%`,
                      background: 'rgba(249, 115, 22, 0.8)',
                      boxShadow: '0 0 10px rgba(249, 115, 22, 0.4)',
                      transition: 'width 0.8s ease-out'
                    }} />
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      color: '#f97316',
                      fontWeight: 'bold',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontSize: '1.1rem',
                      lineHeight: 1
                    }}>
                      {group.rightScore} pts
                    </div>
                    <div style={{
                      color: 'rgba(156, 163, 175, 1)',
                      fontSize: '0.7rem',
                      fontFamily: "'Lexend Mega', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {group.rightLabel}
                    </div>
                  </div>
                </div>

              </div>

              {/* Bonus sector: Shadow / Harmony points */}
              {hasBonus && (
                <div style={{
                  marginTop: '0.35rem',
                  padding: '0.4rem 0.75rem',
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
                      fontSize: '0.7rem',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      color: '#00ff9d',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}>
                      ✦ Harmony Bonus +{group.harmonyPoints} pts
                    </span>
                  )}
                  {group.shadowPoints > 0 && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      color: '#f97316',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}>
                      ✦ Shadow Bonus +{group.shadowPoints} pts
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
