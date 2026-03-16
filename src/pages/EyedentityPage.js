import React, { memo, useEffect, useState, useCallback } from 'react';
import { ARCHETYPES, SHADOW_PAIRS, ARCHETYPE_TO_GROUP, getExtendedDescription } from '../data/assessment';
import { getArchetypeImage } from '../data/assessment/archetypeImages';
import { getCoreProfile } from '../data/assessment/oceanProfiles';
import { POLICY_CONTENT } from '../data/policyContent';

/**
 * ProfileResultCard — loads the admin's own assessment from localStorage
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

const ProfileResultCard = () => {
  const session = MAVERICK_DEFAULT;

  const mainKey = session.mainArchetype;
  const supportKey = session.supportArchetype;
  const main = ARCHETYPES[mainKey] || {};
  const support = ARCHETYPES[supportKey] || {};
  const supportGroup = session.supportGroup || ARCHETYPE_TO_GROUP[supportKey] || 'RULING';
  const extendedName = session.extendedArchetype;
  const extendedDesc = getExtendedDescription(mainKey, supportGroup);
  const imageUrl = getArchetypeImage(mainKey, supportGroup) || main.imageUrl;
  const shadowKey = SHADOW_PAIRS[mainKey];
  const shadow = shadowKey ? ARCHETYPES[shadowKey] : null;
  const blindspotKey = SHADOW_PAIRS[supportKey];
  const harmonyActive = session.harmonyActive;
  const shadowBonusActive = session.shadowBonusActive;
  const coreProfile = getCoreProfile(mainKey);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── 1. Header & Profile ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid rgba(0, 255, 157, 0.2)',
      }}>
        {/* Profile Image with Holographic Rings */}
        <div style={{ position: 'relative', width: '14rem', height: '14rem', flexShrink: 0 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1px dashed rgba(0, 255, 157, 0.4)',
            animation: 'spin 20s linear infinite',
          }} />
          <div style={{
            position: 'absolute', inset: '-0.75rem', borderRadius: '50%',
            border: '1px dotted rgba(168, 85, 247, 0.4)',
            animation: 'spin 15s linear infinite reverse',
          }} />
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            overflow: 'hidden', border: '2px solid #00ff9d',
            background: '#000', position: 'relative',
          }}>
            {imageUrl && <img src={imageUrl} alt={extendedName} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.25) sepia(0.2)' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
          </div>
        </div>

        <div style={{ maxWidth: '40rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.4rem, 2.5vw, 2.5rem)',
            fontFamily: "'Lexend Mega', sans-serif",
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #a855f7, #d8b4fe, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))',
            marginBottom: '0.5rem',
          }}>
            {extendedName}
          </h1>
          {extendedDesc?.subtitle && (
            <p style={{
              fontSize: '0.9rem', color: 'rgba(249, 115, 22, 0.9)',
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}>
              {extendedDesc.subtitle}
            </p>
          )}
          <p style={{
            fontSize: '1rem', color: 'rgba(156, 163, 175, 1)',
            fontFamily: "'Figtree', sans-serif", fontStyle: 'italic',
          }}>
            "{main.description}"
          </p>
          <p style={{
            fontSize: '0.85rem', color: 'rgba(0, 255, 157, 0.7)',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.15em',
            marginTop: '0.75rem',
          }}>
            {main.name} {harmonyActive ? '⟷' : '+'} {support.name}
          </p>
          {harmonyActive && (
            <p style={{ fontSize: '0.75rem', color: '#00ff9d', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.5rem', textTransform: 'uppercase' }}>
              ✦ Harmony Bonus Active (+33) ✦
            </p>
          )}
          {shadowBonusActive && (
            <p style={{ fontSize: '0.75rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.5rem', textTransform: 'uppercase' }}>
              ✦ Shadow Bonus Active (+69) ✦
            </p>
          )}
        </div>
      </div>

      {/* ── 1b. OCEAN Traits ── */}
      {(() => {
        const OCEAN_TRAITS = [
          {
            key: 'A', label: 'Meegaandheid', color: '#00d4ff', value: 39,
            facets: [{ label: 'Compassie', value: 76 }, { label: 'Beleefdheid', value: 9 }],
          },
          {
            key: 'C', label: 'Consciëntieusheid', color: '#00d4ff', value: 96,
            facets: [{ label: 'IJver', value: 99 }, { label: 'Ordelijkheid', value: 81 }],
          },
          {
            key: 'E', label: 'Extraversie', color: '#00d4ff', value: 88,
            facets: [{ label: 'Enthousiasme', value: 69 }, { label: 'Assertiviteit', value: 92 }],
          },
          {
            key: 'N', label: 'Neuroticisme', color: '#00d4ff', value: 2,
            facets: [{ label: 'Terughoudendheid', value: 2 }, { label: 'Volatiliteit', value: 7 }],
          },
          {
            key: 'O', label: 'Openheid voor Ervaringen', color: '#00d4ff', value: 72,
            facets: [{ label: 'Intellect', value: 75 }, { label: 'Esthetiek', value: 64 }],
          },
        ];
        const TraitBar = ({ label, value, color, isMain }) => (
          <div style={{ marginBottom: isMain ? '0.35rem' : '0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                width: isMain ? '11rem' : '9rem',
                flexShrink: 0,
                fontSize: isMain ? '0.72rem' : '0.65rem',
                fontFamily: isMain ? "'Lexend Mega', sans-serif" : "'Rajdhani', sans-serif",
                fontWeight: isMain ? 700 : 500,
                color: isMain ? 'rgba(209,213,219,0.95)' : 'rgba(139,92,246,0.85)',
                textTransform: isMain ? 'uppercase' : 'none',
                letterSpacing: isMain ? '0.06em' : '0',
                textAlign: 'right',
              }}>
                {label}
              </span>
              <div style={{
                flex: 1, height: isMain ? '10px' : '7px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: '3px', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${value}%`,
                  height: '100%',
                  backgroundColor: isMain ? color : 'rgba(249,115,22,0.6)',
                  borderRadius: '3px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{
                width: '2rem', flexShrink: 0, textAlign: 'left',
                fontSize: isMain ? '0.95rem' : '0.8rem',
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                color: isMain ? color : 'rgba(249,115,22,0.85)',
              }}>
                {value}
              </span>
            </div>
          </div>
        );
        return (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '0.75rem',
            padding: '1.25rem 1.5rem',
          }}>
            <h3 style={{
              color: '#00d4ff', fontFamily: "'Lexend Mega', sans-serif",
              fontSize: '0.8rem', textTransform: 'uppercase',
              letterSpacing: '0.15em', marginBottom: '1rem',
            }}>
              OCEAN Persoonlijkheidsprofiel
            </h3>
            {OCEAN_TRAITS.map((trait, i) => (
              <div key={trait.key} style={{ marginBottom: i < OCEAN_TRAITS.length - 1 ? '1rem' : 0 }}>
                <TraitBar label={trait.label} value={trait.value} color={trait.color} isMain={true} />
                {trait.facets.map(f => (
                  <TraitBar key={f.label} label={f.label} value={f.value} color={trait.color} isMain={false} />
                ))}
              </div>
            ))}
            <div style={{
              marginTop: '1.25rem',
              padding: '0.75rem 1rem',
              background: 'rgba(0, 212, 255, 0.04)',
              border: '1px solid rgba(0, 212, 255, 0.15)',
              borderRadius: '0.5rem',
            }}>
              <p style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.72rem',
                color: '#ffffff',
                lineHeight: 1.6,
                margin: 0,
              }}>
                <span style={{ fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>LET OP!</span>{' '}
                Deze waarden zitten niet inbegrepen en zijn het resultaat van een externe persoonlijkheidstest.
                Wij raden aan een pure OCEAN persoonlijkheidstest te maken en deze als basis te gebruiken voor je archetype analyse.
                {' '}Je kan bijvoorbeeld kijken op <a href="https://www.persoonlijkheid.nl" target="_blank" rel="noopener noreferrer" style={{ color: '#ffffff', textDecoration: 'underline' }}>www.persoonlijkheid.nl</a>
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── 2. Combination Profile ── */}
      {extendedDesc?.combination && (
        <div style={{
          width: '100%',
          background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.08), rgba(0, 255, 157, 0.03))',
          border: '1px solid rgba(0, 255, 157, 0.25)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(to right, transparent, #00ff9d, transparent)' }} />
          <h3 style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: '#00ff9d',
            fontFamily: "'Lexend Mega', sans-serif",
            fontSize: '0.85rem', textTransform: 'uppercase',
            letterSpacing: '0.15em', marginBottom: '0.75rem',
          }}>
            WAAROM IK THE MAVERICK BEN
          </h3>
          <p style={{
            color: 'rgba(209, 213, 219, 1)',
            fontFamily: "'Figtree', sans-serif",
            fontSize: '0.95rem', lineHeight: 1.7, textAlign: 'justify',
          }}>
            {extendedDesc.combination}
          </p>
        </div>
      )}

      {/* ── 3. Main & Support Archetype Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Main Archetype */}
        <div style={{
          background: 'rgba(168, 85, 247, 0.05)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          borderRadius: '0.75rem', padding: '1.25rem', position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(to right, #a855f7, transparent)' }} />
          <p style={{ fontSize: '0.65rem', color: 'rgba(168,85,247,0.6)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>
            3. DE ESSENTIE
          </p>
          <h4 style={{ color: '#a855f7', fontFamily: "'Lexend Mega', sans-serif", fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>
            {main.name}
          </h4>
          <p style={{ fontSize: '0.72rem', color: 'rgba(156,163,175,0.6)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            Archetype: {main.nameEn || mainKey} | Groep: Ruling
          </p>
          {[
            { label: 'TNM-Associatie (modelterm)', text: 'Central Executive Network (CEN) — binnen dit model geassocieerd met orde, logica en executie.' },
            { label: 'Drijfveer', text: 'Binnen dit model suggereert deze score een overwegend Nature (ongedwongen modus) oriëntatie. Met een uiterste piek op IJver (99), gecombineerd met torenhoge Assertiviteit (92) en nagenoeg afwezige Neuroticisme (2), is de kans groot dat pure orde en doelgerichte executie mij geen energie kosten (Free Lunch). Het is je meest energiegevende gedragsbron.' },
            { label: 'Advanced Inzicht', text: 'Vanuit dit scoreprofiel is het aannemelijk dat deze modus mijn primaire gedragslens vormt. Dit systeem is ontworpen om onder zware druk onverstoorbaar te blijven opereren en systemen te bouwen, wat de absolute handtekening is van de Heerser.' },
          ].map(({ label, text }) => (
            <div key={label} style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#a855f7', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{label}</div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(209,213,219,0.85)', fontFamily: "'Figtree', sans-serif", lineHeight: 1.65, margin: 0, textAlign: 'justify' }}>{text}</p>
            </div>
          ))}
        </div>

        {/* Support Archetype */}
        <div style={{
          background: 'rgba(249, 115, 22, 0.05)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          borderRadius: '0.75rem', padding: '1.25rem', position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(to right, #f97316, transparent)' }} />
          <p style={{ fontSize: '0.65rem', color: 'rgba(249,115,22,0.6)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>
            4. DE VERMENIGVULDIGING
          </p>
          <h4 style={{ color: '#f97316', fontFamily: "'Lexend Mega', sans-serif", fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>
            {support.name}
          </h4>
          <p style={{ fontSize: '0.72rem', color: 'rgba(156,163,175,0.6)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            Archetype: {support.nameEn || supportKey} | Groep: Chaos
          </p>
          {[
            { label: 'TNM-Associatie (modelterm)', text: 'Salience Network — binnen dit model geassocieerd met disruptie en het doorbreken van patronen.' },
            { label: 'Rol', text: 'De Rebel ondersteunt de Heerser door stagnerende regels ter discussie te stellen. De extreme frictie binnen de Meegaandheid-scores — uitzonderlijk lage Beleefdheid (9) naast hoge Compassie (76) en Intellect (75) — suggereert dat ik mij absoluut niet laat remmen door etiquette of hiërarchische verwachtingen. Ik ben bereid om de bestaande orde meedogenloos te slopen om de waarheid op tafel te krijgen.' },
            { label: 'Harmony Check', text: 'Er is sprake van de +69 Harmony Bonus. De Main en Support staan exact 180° tegenover elkaar (Paarse Lijn). Binnen het model heb ik een zeldzame, paradoxale synergie (Constructieve Interferentie) bereikt door je uiterste schaduw-tegenpool te integreren in plaats van te onderdrukken.' },
          ].map(({ label, text }) => (
            <div key={label} style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#f97316', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{label}</div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(209,213,219,0.85)', fontFamily: "'Figtree', sans-serif", lineHeight: 1.65, margin: 0, textAlign: 'justify' }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Shadow Integration ── */}
      {shadowKey && shadow && (
        <div style={{
          width: '100%',
          background: 'rgba(168, 85, 247, 0.05)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          borderRadius: '0.75rem', padding: '1.25rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(to right, transparent, #a855f7, transparent)' }} />
          <h3 style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: '#a855f7', fontFamily: "'Lexend Mega', sans-serif",
            fontSize: '0.85rem', textTransform: 'uppercase',
            letterSpacing: '0.15em', marginBottom: '0.75rem',
          }}>
            Schaduw Archetype — {shadow.name} ({shadow.nameEn || shadowKey})
          </h3>
          {main.shadowTension && (
            <p style={{
              color: 'rgba(168, 85, 247, 0.8)', fontFamily: "'Rajdhani', sans-serif",
              fontSize: '0.8rem', fontWeight: 600, fontStyle: 'italic',
              marginBottom: '0.75rem', letterSpacing: '0.05em',
            }}>
              {main.shadowTension}
            </p>
          )}
          {(extendedDesc?.shadow || shadow.description) && (
            <p style={{
              color: 'rgba(209, 213, 219, 0.9)', fontFamily: "'Figtree', sans-serif",
              fontSize: '0.9rem', lineHeight: 1.7, textAlign: 'justify',
            }}>
              {extendedDesc?.shadow || shadow.description}
            </p>
          )}
        </div>
      )}

      {/* ── 5. Blindspot ── */}
      <div style={{
        width: '100%',
        background: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '0.75rem', padding: '1.25rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(to right, transparent, #ef4444, transparent)' }} />
        <p style={{ fontSize: '0.65rem', color: 'rgba(239,68,68,0.6)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>
          7. DE BLINDSPOT (DE SABOTEUR)
        </p>
        <h4 style={{ color: '#ef4444', fontFamily: "'Lexend Mega', sans-serif", fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>
          The Ruler (Rigide/Gecorrumpeerd)
        </h4>
        <p style={{ fontSize: '0.72rem', color: 'rgba(156,163,175,0.6)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
          Archetype: Ruler | Positie 12
        </p>
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', color: '#ef4444', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Definitie</div>
          <p style={{ fontSize: '0.85rem', color: 'rgba(209,213,219,0.85)', fontFamily: "'Figtree', sans-serif", lineHeight: 1.65, margin: 0, textAlign: 'justify' }}>
            Dit is mijn externe blinde vlek. Omdat ik zelf uiterst fluïde schakel tussen controle en disruptie, is de kans groot dat ik zeer... ZEER allergisch ben voor leiders of systemen die vasthouden aan regels zonder visie. Dit triggert me omdat het een weerspiegeling is van de valkuil van mijn eigen Main-archetype. Ik moet ervoor waken dat deze ergernis mijn plannen niet onbewust dwarsboomt.
          </p>
        </div>
      </div>

      {/* ── 6. Core Profile Texts ── */}
      {coreProfile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { label: 'Superkracht op de Werkvloer', text: 'Binnen dit model is mijn superkracht de synthese van absolute sturing en radicale vernieuwing. mijn executiedoel is het bouwen van integere, duurzame systemen en het creëren van stabiliteit. Echter, ik bereik dit niet via blinde handhaving, maar via de methode van de Rebel: doelgerichte disruptie. Het is aannemelijk dat ik uitzonderlijk ben in het optrekken van een structuur, om vervolgens als eerste mijn eigen processen meedogenloos af te breken zodra ze stagneren in bureaucratie. Ik creëer systemen die overleven omdat ze continu door mij worden getest.' },
            { label: 'Conflictstijl', text: 'Mijn conflictstijl is een krachtige botsing tussen controle en waarheidsvinding. Mijn defensieve reflex in een conflict is om autoritair kaders te stellen en regels te dicteren om de chaos snel in te dammen. Dit wordt echter direct ontregeld door het wapen van mijn support-archetype: de Rebel weigert symptoombestrijding toe te passen zolang de olifant in de kamer genegeerd wordt. Dit betekent dat ik in een conflict eerst genadeloos hypocrisie en verborgen agenda\'s blootleg (van iedereen inclusief mezelf), pas als alle verwarde energie uit is gespeeld stel ik nieuwe principes voor. Dit resulteert in een onorthodoxe, maar uiterst heldere vorm van leiderschap.' },
            { label: 'Relatiepatroon', text: 'Binnen de relationele dynamiek suggereert dit profiel dus een intens intern gevecht van vrije energie. Mijn natuurlijke hechtingsstijl is gericht op veiligheid; je toont genegenheid door te voorzien, logistiek te regelen en je dierbaren te beschermen als een fort (Heerser). Dit staat echter in direct conflict met de paradoxale behoefte van je innerlijke Rebel: een fundamentele allergie voor beklemming en verstikkende sociale verplichtingen. Dit creëert de dynamiek van de \'Autonome Beschermer\'. Je bent in staat tot gigantische loyaliteit en zorg, maar zodra emotionele kwetsbaarheid tegen me worden gebruikt en regels mijn soevereiniteit inperken, is de kans groot dat ik \'\'plotseling\'\' afstand neem om mijn autonomie te herstellen.' },
            { label: 'Individuatiepad', text: 'Mijn pad van persoonlijke groei markeert de transitie van de grootste schaduw van de Heerser — de neiging tot starre tirannie en micromanagement uit angst voor controleverlies — naar de functionele integratie van de Rebel. ik heb binnen dit model ontdekt dat een systeem dat nooit dood gaat, uiteindelijk sterft. Mijn individuatie is geen eindstation, maar een levenslang proces van alchemie: de voortdurende praktijk waarbij ik weiger te stagneren in het simpelweg managen van regels, en mezelf steeds opnieuw uitvind als een soevereine leider die zilveren orde gebruikt als fundament, maar disruptieve chaos doelbewust en gecontroleerd blijft inzetten als instrument voor evolutie.' },
          ].map(({ label, text }) => text ? (
            <div key={label}>
              <div style={{
                fontSize: '0.65rem', color: '#00d4ff',
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', marginBottom: '0.25rem',
              }}>
                {label}
              </div>
              <p style={{
                fontSize: '0.85rem', color: 'rgba(209, 213, 219, 0.8)',
                fontFamily: "'Figtree', sans-serif",
                lineHeight: 1.6, margin: 0, textAlign: 'justify',
              }}>
                {text}
              </p>
            </div>
          ) : null)}
        </div>
      )}

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

const NAV_ITEMS = [
  { id: 'profile', slug: 'profiel', title: 'PERSOONLIJK PROFIEL', icon: '🧬', version: 'v1.0' },
  { id: 'terms', slug: 'algemene-voorwaarden', title: 'ALGEMENE VOORWAARDEN', icon: '📋', version: 'v1.0' },
  { id: 'privacy', slug: 'privacybeleid', title: 'PRIVACYBELEID', icon: '🔒', version: 'v1.0' },
  { id: 'consent', slug: 'toestemming-art9', title: 'TOESTEMMING ART. 9', icon: '✓', version: 'v1.0' },
  { id: 'cookies', slug: 'cookiebeleid', title: 'COOKIEBELEID', icon: '🍪', version: 'v1.1' },
  { id: 'ai', slug: 'ai-transparantie', title: 'AI-TRANSPARANTIE', icon: '🤖', version: 'v1.0' },
  { id: 'ip', slug: 'intellectueel-eigendom', title: 'INTELLECTUEEL EIGENDOM', icon: '©', version: 'v1.0' },
  { id: 'usage', slug: 'gebruiksvoorwaarden-misbruik', title: 'GEBRUIKSVOORWAARDEN', icon: '⚖', version: 'v1.0' },
  { id: 'retention', slug: 'gegevensbehoud-en-verwijdering', title: 'GEGEVENSBEHOUD & VERWIJDERING', icon: '🗂', version: 'v1.0' },
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
      {/* ── Outer shell — positioning context only, corners live here so overflow:hidden can't clip them ── */}
      <div style={{ position: 'relative', width: '70vw', height: '70vh', flexShrink: 0 }}>
        {/* Purple L-bracket corners — exact SectorFrame pattern */}
        <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '1rem', height: '1rem', border: '1.5px solid #a855f7', borderRadius: '10px 0 0 0', borderBottom: 'none', borderRight: 'none', pointerEvents: 'none', zIndex: 10 }} />
        <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '1rem', height: '1rem', border: '1.5px solid #a855f7', borderRadius: '0 10px 0 0', borderBottom: 'none', borderLeft: 'none', pointerEvents: 'none', zIndex: 10 }} />
        <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '1rem', height: '1rem', border: '1.5px solid #a855f7', borderRadius: '0 0 0 10px', borderTop: 'none', borderRight: 'none', pointerEvents: 'none', zIndex: 10 }} />
        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '1rem', height: '1rem', border: '1.5px solid #a855f7', borderRadius: '0 0 10px 0', borderTop: 'none', borderLeft: 'none', pointerEvents: 'none', zIndex: 10 }} />
        {/* ── Inner panel — glass effects + overflow:hidden ── */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '0.5rem',
          backgroundColor: 'rgba(1, 0, 2, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
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

          {/* ── Header ── */}
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
            <button
              onClick={onBack}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: 'rgba(168,85,247,0.1)',
                border: '1px solid rgba(168,85,247,0.4)',
                color: accentColor,
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontFamily: "'Lexend Mega', sans-serif",
                fontSize: '10px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                transition: 'all 0.2s',
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
        </div>

        {/* ── Main: Sidebar + Content ── */}
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
