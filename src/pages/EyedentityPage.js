import React, { memo } from 'react';

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

const EyedentitySection = ({ title, children, variant = 'purple', height = 'auto' }) => {
  const accentColor = variant === 'orange' ? '#f59e0b' : '#a855f7';
  const textColor = variant === 'orange' ? '#f59e0b' : '#a855f7';
  const corners = CornerStone({ variant });

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: 'rgba(2, 0, 3, 0.3)',
        border: `1px solid ${accentColor}40`,
        borderRadius: '0.5rem',
        backdropFilter: 'blur(12px)',
        padding: '2rem',
        height: height,
        boxShadow: `
          0 6px 30px rgba(0,0,0,0.7),
          0 12px 60px rgba(0,0,0,0.5),
          inset 0 0 12px ${accentColor}10,
          inset 0 0 30px ${accentColor}05
        `,
        overflow: 'auto'
      }}
    >
      {corners.topLeft}
      {corners.topRight}
      {corners.bottomLeft}
      {corners.bottomRight}

      {/* Title */}
      <h2 style={{
        fontSize: 'max(16px, 1.1vw)',
        fontWeight: 'bold',
        color: textColor,
        marginBottom: '1.5rem',
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
        letterSpacing: '0.08em',
        textTransform: 'uppercase'
      }}>
        {title}
      </h2>

      {/* Content */}
      <div style={{
        color: '#cbd5e1',
        fontSize: 'max(12px, 0.85vw)',
        lineHeight: 1.8,
        fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif"
      }}>
        {children}
      </div>
    </div>
  );
};

const EyedentityPage = memo(({ isVisible, onBack }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
        pointerEvents: isVisible ? 'auto' : 'none',
        padding: '2rem',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: '90vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        overflowY: 'auto'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h1 style={{
            fontSize: 'max(28px, 2vw)',
            fontWeight: 'bold',
            color: '#a855f7',
            fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            EYEDENTITY
          </h1>
          <button
            onClick={onBack}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.4)',
              color: '#a855f7',
              borderRadius: '0.35rem',
              cursor: 'pointer',
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
              fontSize: 'max(11px, 0.6vw)',
              transition: 'all 0.2s',
              letterSpacing: '0.05em'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(168,85,247,0.2)';
              e.target.style.boxShadow = '0 0 20px rgba(168,85,247,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(168,85,247,0.1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            ← TERUG
          </button>
        </div>

        {/* Section 1: Personal Brand Information */}
        <EyedentitySection
          title="Persoonlijk Profiel & Admin Rapport"
          variant="purple"
          height="400px"
        >
          <p style={{ marginBottom: '1rem', color: '#e2e8f0' }}>
            Dit gedeelte bevat uw persoonlijke merkgegevens en een volwaardig rapport opgesteld door Garden for Life administratoren.
          </p>
          <div style={{
            backgroundColor: 'rgba(168,85,247,0.08)',
            border: '1px dashed rgba(168,85,247,0.3)',
            borderRadius: '0.35rem',
            padding: '1.5rem',
            marginTop: '1.5rem',
            color: '#94a3b8',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '0.8rem' }}>📋 PERSOONLIJK MERGPROFIEL</p>
            <p style={{ fontSize: 'max(11px, 0.75vw)', fontStyle: 'italic', lineHeight: 1.6 }}>
              Admin-gegenereerde profielgegevens, persoonlijke merkidentiteit, assessment resultaten, gedetailleerde analyse en aanbevelingen zouden hier worden weergegeven
            </p>
          </div>
        </EyedentitySection>

        {/* Section 2: Legal Documents */}
        <EyedentitySection
          title="Juridische Documenten & Beleid"
          variant="purple"
          height="auto"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Terms of Service */}
            <div style={{
              backgroundColor: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '0.35rem',
              padding: '1.25rem',
            }}>
              <h4 style={{ color: '#a855f7', marginBottom: '0.5rem', fontSize: 'max(12px, 0.85vw)', fontWeight: 'bold' }}>
                📋 ALGEMENE VOORWAARDEN
              </h4>
              <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: 'max(11px, 0.75vw)' }}>
                Lees onze volledige algemene voorwaarden voor het gebruik van Garden for Life.
              </p>
              <a href="/algemene-voorwaarden.html" target="_blank" rel="noopener noreferrer" style={{
                color: '#a855f7',
                textDecoration: 'none',
                fontSize: 'max(10px, 0.7vw)',
                borderBottom: '1px solid rgba(168,85,247,0.5)',
                transition: 'color 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = '#c4b5fd'}
              onMouseLeave={(e) => e.target.style.color = '#a855f7'}
              >
                VOLLEDIGE TEKST →
              </a>
            </div>

            {/* Privacy Policy */}
            <div style={{
              backgroundColor: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '0.35rem',
              padding: '1.25rem',
            }}>
              <h4 style={{ color: '#a855f7', marginBottom: '0.5rem', fontSize: 'max(12px, 0.85vw)', fontWeight: 'bold' }}>
                🔒 PRIVACYBELEID
              </h4>
              <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: 'max(11px, 0.75vw)' }}>
                Begrijp hoe we uw gegevens verwerken, opslaan en beschermen in overeenstemming met de AVG.
              </p>
              <a href="/privacybeleid.html" target="_blank" rel="noopener noreferrer" style={{
                color: '#a855f7',
                textDecoration: 'none',
                fontSize: 'max(10px, 0.7vw)',
                borderBottom: '1px solid rgba(168,85,247,0.5)',
                transition: 'color 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = '#c4b5fd'}
              onMouseLeave={(e) => e.target.style.color = '#a855f7'}
              >
                VOLLEDIGE TEKST →
              </a>
            </div>

            {/* Art. 9 Consent */}
            <div style={{
              backgroundColor: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '0.35rem',
              padding: '1.25rem',
            }}>
              <h4 style={{ color: '#a855f7', marginBottom: '0.5rem', fontSize: 'max(12px, 0.85vw)', fontWeight: 'bold' }}>
                ✓ TOESTEMMING & GEGEVENSVERWERKING (ART. 9 AVG)
              </h4>
              <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: 'max(11px, 0.75vw)' }}>
                Overzicht van uw gegeven toestemmingen voor verwerking van persoonlijkheidsprofieldata en psychologische informatie.
              </p>
              <a href="/toestemming-art9.html" target="_blank" rel="noopener noreferrer" style={{
                color: '#a855f7',
                textDecoration: 'none',
                fontSize: 'max(10px, 0.7vw)',
                borderBottom: '1px solid rgba(168,85,247,0.5)',
                transition: 'color 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = '#c4b5fd'}
              onMouseLeave={(e) => e.target.style.color = '#a855f7'}
              >
                VOLLEDIGE TEKST →
              </a>
            </div>

            {/* Cookie Policy */}
            <div style={{
              backgroundColor: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '0.35rem',
              padding: '1.25rem',
            }}>
              <h4 style={{ color: '#a855f7', marginBottom: '0.5rem', fontSize: 'max(12px, 0.85vw)', fontWeight: 'bold' }}>
                🍪 COOKIEBELEID
              </h4>
              <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: 'max(11px, 0.75vw)' }}>
                Informatie over hoe we cookies en tracking-technologieën gebruiken.
              </p>
              <a href="/cookiebeleid.html" target="_blank" rel="noopener noreferrer" style={{
                color: '#a855f7',
                textDecoration: 'none',
                fontSize: 'max(10px, 0.7vw)',
                borderBottom: '1px solid rgba(168,85,247,0.5)',
                transition: 'color 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = '#c4b5fd'}
              onMouseLeave={(e) => e.target.style.color = '#a855f7'}
              >
                VOLLEDIGE TEKST →
              </a>
            </div>

            {/* AI-Transparantie */}
            <div style={{
              backgroundColor: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '0.35rem',
              padding: '1.25rem',
            }}>
              <h4 style={{ color: '#a855f7', marginBottom: '0.5rem', fontSize: 'max(12px, 0.85vw)', fontWeight: 'bold' }}>
                🤖 AI-TRANSPARANTIE & DISCLOSURE
              </h4>
              <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: 'max(11px, 0.75vw)' }}>
                Hoe wij AI gebruiken, welke gegevens verwerkt worden, en EU AI Act compliance. Dit is GEEN klinische diagnose.
              </p>
              <a href="/ai-transparantie.html" target="_blank" rel="noopener noreferrer" style={{
                color: '#a855f7',
                textDecoration: 'none',
                fontSize: 'max(10px, 0.7vw)',
                borderBottom: '1px solid rgba(168,85,247,0.5)',
                transition: 'color 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = '#c4b5fd'}
              onMouseLeave={(e) => e.target.style.color = '#a855f7'}
              >
                VOLLEDIGE TEKST →
              </a>
            </div>

            {/* Intellectueel Eigendom */}
            <div style={{
              backgroundColor: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '0.35rem',
              padding: '1.25rem',
            }}>
              <h4 style={{ color: '#a855f7', marginBottom: '0.5rem', fontSize: 'max(12px, 0.85vw)', fontWeight: 'bold' }}>
                ©️ INTELLECTUEEL EIGENDOM
              </h4>
              <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: 'max(11px, 0.75vw)' }}>
                Bescherming van het Deltawerken Model, visuele archetypes, en misbruikprevention.
              </p>
              <a href="/intellectueel-eigendom.html" target="_blank" rel="noopener noreferrer" style={{
                color: '#a855f7',
                textDecoration: 'none',
                fontSize: 'max(10px, 0.7vw)',
                borderBottom: '1px solid rgba(168,85,247,0.5)',
                transition: 'color 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = '#c4b5fd'}
              onMouseLeave={(e) => e.target.style.color = '#a855f7'}
              >
                VOLLEDIGE TEKST →
              </a>
            </div>

            {/* Gebruiksvoorwaarden & Misbruik */}
            <div style={{
              backgroundColor: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.3)',
              borderRadius: '0.35rem',
              padding: '1.25rem',
            }}>
              <h4 style={{ color: '#a855f7', marginBottom: '0.5rem', fontSize: 'max(12px, 0.85vw)', fontWeight: 'bold' }}>
                ⚖️ GEBRUIKSVOORWAARDEN & MISBRUIKPREVENTION
              </h4>
              <p style={{ color: '#cbd5e1', marginBottom: '0.75rem', fontSize: 'max(11px, 0.75vw)' }}>
                Verboden activiteiten, handhaving, en bescherming tegen commercieel misbruik & AI-training.
              </p>
              <a href="/gebruiksvoorwaarden-misbruik.html" target="_blank" rel="noopener noreferrer" style={{
                color: '#a855f7',
                textDecoration: 'none',
                fontSize: 'max(10px, 0.7vw)',
                borderBottom: '1px solid rgba(168,85,247,0.5)',
                transition: 'color 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = '#c4b5fd'}
              onMouseLeave={(e) => e.target.style.color = '#a855f7'}
              >
                VOLLEDIGE TEKST →
              </a>
            </div>
          </div>
        </EyedentitySection>
      </div>
    </div>
  );
});

EyedentityPage.displayName = 'EyedentityPage';

export default EyedentityPage;
