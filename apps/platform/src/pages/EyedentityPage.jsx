import React, { memo, useEffect, useState, useCallback, useRef } from 'react';
import { useLanguage } from '@gfl/i18n';
import { ARCHETYPES, getArchetypeQuote } from '@gfl/assessment-core';
import { getArchetypeImage } from '@gfl/assessment-core/data/archetypeImages';
import { getPolicyContent } from '../data/policyIndex';
import { submitAssessmentReview, getToken, updateDisplayName, deleteOwnAccount } from '@gfl/api-client';
import { getClientOrbConfig, getClientOrbCode, getClientProfile } from '../clientMode';
import { OrbSphere3D } from '../orb';
import { SciFiButton } from '@gfl/ui';
import { cleanTitle, getSectionAccent, renderMarkdownContent } from '@gfl/utils';
import SciFiRadarChart from '../components/assessment/SciFiRadarChart';
import SubgroupCounters from '../components/assessment/SubgroupCounters';
import PublicProfilesDirectory from '../components/assessment/PublicProfilesDirectory';

/**
 * ProfileResultCard â€” loads the admin's own assessment from localStorage
 * and renders a result card matching the AssessmentResultsModal visual.
 */
// 132-roster: Ruler × Outlaw is now "The Reformer" ("The Maverick" moved to Outlaw × Ruler)
const MAVERICK_DEFAULT = {
  mainArchetype: 'RULER',
  supportArchetype: 'OUTLAW',
  supportGroup: 'CHAOS',
  extendedArchetype: 'The Reformer',
  harmonyActive: true,
  shadowBonusActive: true,
  shadowArchetype: 'OUTLAW',
  blindspotArchetype: 'TRICKSTER',
};

/**
 * ProfileResultCard â€” renders the user's assessment result.
 * Accepts a `result` prop matching the resultObj shape from AssessmentResultsModal.
 * Falls back to derived MAVERICK_DEFAULT demo data when no prop is provided.
 */
// The four cognitive triangles. Every archetype in a triangle shares the SAME
// profile, so the copy lives once per mode (was: the identical block repeated 3x).
// Prose lives in eyedentityReport.cog.modes.<key> (nl + en).
const COG_MODE_BY_ARCHETYPE = {
  RULER: 'idealisme',  INNOCENT: 'idealisme',  SAGE: 'idealisme',
  JUDGE: 'exploratie', EXPLORER: 'exploratie', ARTIST: 'exploratie',
  LOVER: 'impact',     OUTLAW: 'impact',       MAGICIAN: 'impact',
  CAREGIVER: 'engagement', TRICKSTER: 'engagement', HERO: 'engagement',
};
const COG_TRIANGLES = {
  idealisme:  { id: 1, color: '#a855f7', members: ['Ruler', 'Innocent', 'Sage'] },
  exploratie: { id: 2, color: '#3b82f6', members: ['Judge', 'Explorer', 'Artist'] },
  impact:     { id: 3, color: '#ec4899', members: ['Lover', 'Outlaw', 'Magician'] },
  engagement: { id: 4, color: '#1d9904', members: ['Caregiver', 'Trickster', 'Hero'] },
};
const ALL_COG_TRIANGLES = [
  { id: 1, key: 'idealisme',  color: '#a855f7', members: 'Ruler · Innocent · Sage' },
  { id: 2, key: 'exploratie', color: '#3b82f6', members: 'Judge · Explorer · Artist' },
  { id: 3, key: 'impact',     color: '#f97316', members: 'Lover · Outlaw · Magician' },
  { id: 4, key: 'engagement', color: '#1d9904', members: 'Caregiver · Trickster · Hero' },
];

/* ═══ Hardcoded AI analysis sections for the Maverick profile ═══ */
// `title` stays Dutch on purpose: it is the language-independent routing key used
// by the section grouping filters and by getSectionAccent(). The copy that is
// actually rendered comes from eyedentityReport.sections.<id> (title + content).
const HARDCODED_SECTIONS = [
  { id: 'identiteit',        title: 'De Identiteit' },
  { id: 'waarom',            title: 'Waarom Jij Dit Perspectief Gebruikt' },
  { id: 'essentie',          title: 'De Essentie (Main Archetype)' },
  { id: 'vermenigvuldiging', title: 'De Vermenigvuldiging (Support Archetype)' },
  { id: 'schaduw',           title: 'De Schaduw' },
  { id: 'blindspot',         title: 'De Blindspot' },
  { id: 'visuele',           title: 'Visuele Analyse' },
  { id: 'alchemie',          title: 'De Alchemie van Individuatie' },
  { id: 'schakelbord',       title: 'Het Neurale Schakelbord' },
  { id: 'ontologie',         title: 'Ontologische Evolutie' },
  { id: 'neuroticisme',      title: 'Neuroticisme Trigger' },
  { id: 'superkracht',       title: 'Superkracht op de Werkvloer' },
  { id: 'conflictstijl',     title: 'Conflictstijl' },
  { id: 'relatiepatroon',    title: 'Relatiepatroon' },
  { id: 'individuatiepad',   title: 'Individuatiepad' },
];

const ProfileResultCard = ({ result: resultProp }) => {
  const { t } = useLanguage();
  const green = '#1d9904';
  const sectionPad = '1.25rem';

  const mainKey      = resultProp?.mainArchetype      || MAVERICK_DEFAULT.mainArchetype;
  const supportKey   = resultProp?.secondaryArchetype || MAVERICK_DEFAULT.supportArchetype;
  const supportGroup = resultProp?.supportGroup       || MAVERICK_DEFAULT.supportGroup;
  const extendedName = resultProp?.name               || MAVERICK_DEFAULT.extendedArchetype;
  const harmonyActive     = resultProp?.harmonyActive     ?? MAVERICK_DEFAULT.harmonyActive;
  const shadowBonusActive = resultProp?.shadowBonusActive ?? MAVERICK_DEFAULT.shadowBonusActive;

  const main         = ARCHETYPES[mainKey]    || {};
  const support      = ARCHETYPES[supportKey] || {};
  const levenslesQuote = resultProp?.levensles || getArchetypeQuote(mainKey, supportKey || supportGroup);
  // null while the 132 artwork is in production - the portrait block is skipped.
  const imageUrl       = resultProp?.imageUrl  || getArchetypeImage(mainKey, supportKey || supportGroup);

  // ── Client-profile front + owner-only manage ──
  // Front (public, visitable by anyone): the user's real orb + archetype name.
  // Manage: an owner-only button (shown only when you're logged in = your own profile).
  const orbConfig = getClientOrbConfig();                 // decoded from the user's orb code, or null
  const storedProfile = getClientProfile();
  const displayArchetype = storedProfile?.archetypeName || extendedName;
  const isOwner = !!getToken();
  const orbCode = getClientOrbCode();

  const [manageOpen, setManageOpen] = useState(false);
  const [nameInput, setNameInput] = useState(storedProfile?.displayName || '');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState('');
  const [delInput, setDelInput] = useState('');
  const [delErr, setDelErr] = useState('');
  const [delBusy, setDelBusy] = useState(false);

  const handleSaveName = useCallback(async () => {
    const v = nameInput.trim();
    if (!v) return;
    setNameBusy(true); setNameMsg('');
    try { const { displayName } = await updateDisplayName(v); setNameInput(displayName); setNameMsg(t('eyedentityReport.manage.saved')); }
    catch (e) { setNameMsg(e.message || t('eyedentityReport.manage.saveFailed')); }
    finally { setNameBusy(false); }
  }, [nameInput, t]);

  const handleDeleteAccount = useCallback(async () => {
    if (delInput !== t('eyedentityReport.manage.deleteWord')) { setDelErr(t('eyedentityReport.manage.deleteMismatch')); return; }
    setDelBusy(true); setDelErr('');
    try { await deleteOwnAccount(); window.location.reload(); }
    catch (e) { setDelErr(e.message || t('eyedentityReport.manage.deleteFailed')); setDelBusy(false); }
  }, [delInput, t]);
  const copyCode = useCallback(() => { if (orbCode) navigator.clipboard?.writeText(orbCode); }, [orbCode]);

  // Data for visualizations — fall back to hardcoded session data when localStorage lacks these fields
  const FALLBACK_RADAR = [
    { subject: 'Ruler',     green: 45, lime: 62, orange: 74, blue: 85, gold: 90, purple: 96, nature_core: 45, green_hw: 17, culture_core: 12, blue_fb: 11, yellow_cog: 5,  purple_shadow: 6, A: 96, fullMark: 500 },
    { subject: 'Judge',     green: 57, lime: 69, orange: 81, blue: 88, gold: 91, purple: 92, nature_core: 57, green_hw: 12, culture_core: 12, blue_fb: 7,  yellow_cog: 3,  purple_shadow: 1, A: 92, fullMark: 500 },
    { subject: 'Lover',     green: 27, lime: 29, orange: 33, blue: 33, gold: 40, purple: 40, nature_core: 27, green_hw: 2,  culture_core: 4,  blue_fb: 0,  yellow_cog: 7,  purple_shadow: 0, A: 40, fullMark: 500 },
    { subject: 'Caregiver', green: 12, lime: 18, orange: 18, blue: 20, gold: 24, purple: 28, nature_core: 12, green_hw: 6,  culture_core: 0,  blue_fb: 2,  yellow_cog: 4,  purple_shadow: 4, A: 28, fullMark: 500 },
    { subject: 'Innocent',  green: 33, lime: 33, orange: 41, blue: 41, gold: 47, purple: 50, nature_core: 33, green_hw: 0,  culture_core: 8,  blue_fb: 0,  yellow_cog: 6,  purple_shadow: 3, A: 50, fullMark: 500 },
    { subject: 'Explorer',  green: 0,  lime: 7,  orange: 7,  blue: 9,  gold: 15, purple: 19, nature_core: 0,  green_hw: 7,  culture_core: 0,  blue_fb: 2,  yellow_cog: 6,  purple_shadow: 4, A: 19, fullMark: 500 },
    { subject: 'Outlaw',    green: 54, lime: 59, orange: 87, blue: 90, gold: 91, purple: 94, nature_core: 54, green_hw: 5,  culture_core: 28, blue_fb: 3,  yellow_cog: 1,  purple_shadow: 3, A: 94, fullMark: 500 },
    { subject: 'Trickster', green: 21, lime: 39, orange: 47, blue: 61, gold: 63, purple: 68, nature_core: 21, green_hw: 18, culture_core: 8,  blue_fb: 14, yellow_cog: 2,  purple_shadow: 5, A: 68, fullMark: 500 },
    { subject: 'Sage',      green: 6,  lime: 19, orange: 31, blue: 40, gold: 45, purple: 46, nature_core: 6,  green_hw: 13, culture_core: 12, blue_fb: 9,  yellow_cog: 5,  purple_shadow: 1, A: 46, fullMark: 500 },
    { subject: 'Artist',    green: 42, lime: 43, orange: 55, blue: 56, gold: 59, purple: 59, nature_core: 42, green_hw: 1,  culture_core: 12, blue_fb: 1,  yellow_cog: 3,  purple_shadow: 0, A: 59, fullMark: 500 },
    { subject: 'Magician',  green: 27, lime: 41, orange: 41, blue: 50, gold: 58, purple: 59, nature_core: 27, green_hw: 14, culture_core: 0,  blue_fb: 9,  yellow_cog: 8,  purple_shadow: 1, A: 59, fullMark: 500 },
    { subject: 'Hero',      green: 48, lime: 57, orange: 65, blue: 71, gold: 73, purple: 73, nature_core: 48, green_hw: 9,  culture_core: 8,  blue_fb: 6,  yellow_cog: 2,  purple_shadow: 0, A: 73, fullMark: 500 },
  ];
  const FALLBACK_SUBGROUPS = [
    { id: 1, leftLabel: 'Judge', rightLabel: 'Ruler', group: 'Ruling', axis: t('eyedentityReport.axes.ruling'), leftScore: 45, rightScore: 40, leftNature: 7, leftCulture: 2, rightNature: 6, rightCulture: 2, harmonyPoints: 0, shadowPoints: 0 },
    { id: 2, leftLabel: 'Lover', rightLabel: 'Caregiver', group: 'Relational', axis: t('eyedentityReport.axes.relational'), leftScore: 25, rightScore: 10, leftNature: 4, leftCulture: 1, rightNature: 2, rightCulture: 0, harmonyPoints: 0, shadowPoints: 0 },
    { id: 3, leftLabel: 'Innocent', rightLabel: 'Explorer', group: 'Seeker', axis: t('eyedentityReport.axes.seeker'), leftScore: 35, rightScore: 0, leftNature: 5, leftCulture: 2, rightNature: 0, rightCulture: 0, harmonyPoints: 0, shadowPoints: 0 },
    { id: 4, leftLabel: 'Outlaw', rightLabel: 'Trickster', group: 'Chaos', axis: t('eyedentityReport.axes.chaos'), leftScore: 55, rightScore: 20, leftNature: 6, leftCulture: 5, rightNature: 3, rightCulture: 1, harmonyPoints: 0, shadowPoints: 0 },
    { id: 5, leftLabel: 'Sage', rightLabel: 'Artist', group: 'Abstract', axis: t('eyedentityReport.axes.abstract'), leftScore: 15, rightScore: 35, leftNature: 1, leftCulture: 2, rightNature: 5, rightCulture: 2, harmonyPoints: 0, shadowPoints: 0 },
    { id: 6, leftLabel: 'Magician', rightLabel: 'Hero', group: 'Agency', axis: t('eyedentityReport.axes.agency'), leftScore: 15, rightScore: 35, leftNature: 3, leftCulture: 0, rightNature: 6, rightCulture: 1, harmonyPoints: 0, shadowPoints: 0 },
  ];
  const radarData = resultProp?.radarData || FALLBACK_RADAR;
  const subgroups = resultProp?.subgroups || FALLBACK_SUBGROUPS;
  const shadowArchetype = resultProp?.shadowArchetype || MAVERICK_DEFAULT.shadowArchetype;
  const blindspotArchetype = resultProp?.blindspotArchetype || MAVERICK_DEFAULT.blindspotArchetype;
  const overallArchetype = resultProp?.overallArchetype || mainKey;
  const supportArchetypeProp = resultProp?.supportArchetype || supportKey;

  const allSections = HARDCODED_SECTIONS;

  // ── Section grouping (matching AssessmentResultsModal) ──
  const visibleSections = allSections.filter(s => {
    if (s.isComparison) return false;
    if (s.isResonantie) return false;
    const t = (s.title || '').trim();
    if (/persoonlijkheidsrapport.*vergelijk|ocean.*vergelijk|vergelijk.*profiel/i.test(t)) return false;
    if (/^(spanningsvelden|vergelijkingsrapport|vergelijkings\s*rapport|conclusie)$/i.test(t)) return false;
    return true;
  });

  const aiGroup1a = visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('identiteit') || t.includes('waarom') || t.includes('essentie') || t.includes('vermenigvuldiging');
  });

  const aiGroup1b = visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('schaduw') || t.includes('blindspot') || t.includes('visuele');
  });

  const aiGroup2 = visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('alchemie') || t.includes('schakelbord') || t.includes('evolutie') || t.includes('ontologi');
  });

  const aiGroepDyn = visibleSections.filter(s => {
    const t = cleanTitle(s.title || '').toLowerCase();
    return t.includes('groep dynamiek') || t.includes('neurobiologisch');
  });

  const isPromptLike = (s) =>
    s.isAgentPrompt ||
    /ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt|reflectie.*prompt|ai.*reflectie/i.test(s.title);

  const aiPromptSection = visibleSections.filter(s => isPromptLike(s));

  const aiIntroSection = visibleSections.filter(s =>
    (s.title || '').toLowerCase().includes('introductie')
  );

  const aiGroupedIds = new Set();
  [aiGroup1a, aiGroup1b, aiGroup2, aiGroepDyn, aiPromptSection, aiIntroSection].forEach(g => g.forEach(s => aiGroupedIds.add(s)));

  const aiOtherSections = visibleSections.filter(s => !aiGroupedIds.has(s) && !isPromptLike(s));

  // Cognitive triangle data
  const archKey = (mainKey || '').toUpperCase();
  const triKey = COG_MODE_BY_ARCHETYPE[archKey];
  const tri = triKey ? COG_TRIANGLES[triKey] : undefined;

  // Accent color cycling fallback
  const accentCycle = [
    { color: '#1d9904', rgb: '29, 153, 4' },
    { color: '#a855f7', rgb: '168, 85, 247' },
    { color: '#f97316', rgb: '249, 115, 22' },
    { color: '#3b82f6', rgb: '59, 130, 246' },
    { color: '#ec4899', rgb: '236, 72, 153' },
    { color: '#14b8a6', rgb: '20, 184, 166' },
  ];

  // ── renderAiSectionCard (matching AssessmentResultsModal) ──
  const renderAiSectionCard = (section, idx) => {
    const accent = getSectionAccent(section.title) || accentCycle[idx % accentCycle.length];
    const isEven = idx % 2 === 0;
    return (
      <div key={`ai-${cleanTitle(section.title)}-${idx}`} style={{
        width: '100%',
        position: 'relative',
        ...(isEven ? {} : {
          background: 'transparent',
          border: `1px solid rgba(${accent.rgb}, 0.2)`,
          padding: sectionPad,
          borderRadius: '0.75rem',
        }),
      }}>
        {isEven && (
          <div style={{
            position: 'absolute', left: '-1rem', top: 0, bottom: 0, width: '3px',
            background: `linear-gradient(to bottom, transparent, rgba(${accent.rgb}, 0.5), transparent)`,
          }} />
        )}
        <h3 style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: accent.color,
          fontFamily: "'Lexend Mega', sans-serif",
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '0.75rem',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '1.5rem', height: '1.5rem', borderRadius: '50%',
            border: `1px solid rgba(${accent.rgb}, 0.4)`,
            fontSize: '0.75rem', fontFamily: "'Rajdhani', sans-serif",
            color: accent.color, flexShrink: 0,
          }}>
            {idx + 1}
          </span>
          {cleanTitle(t(`eyedentityReport.sections.${section.id}.title`))}
        </h3>
        <div style={{
          color: 'rgba(209, 213, 219, 1)',
          fontFamily: "'Figtree', sans-serif",
          fontSize: '0.95rem',
          lineHeight: 1.7,
          textAlign: 'justify',
          ...(isEven ? {
            background: 'rgba(0, 0, 0, 0.4)',
            padding: sectionPad,
            borderRadius: '0 0.75rem 0.75rem 0',
            borderRight: `1px solid rgba(${accent.rgb}, 0.2)`,
            borderTop: `1px solid rgba(${accent.rgb}, 0.2)`,
            borderBottom: `1px solid rgba(${accent.rgb}, 0.2)`,
            boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
          } : {}),
        }}>
          {renderMarkdownContent(t(`eyedentityReport.sections.${section.id}.content`), accent.color)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── 1. Header & Profile ── */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem', paddingBottom: '1.5rem', borderBottom: `1px solid rgba(29, 153, 4, 0.2)` }}>
        {/* Portrait: ALWAYS the archetype image (the orb lives on the profile card /
            verbindingsmenu; here the persoonlijk-profiel page shows the portrait). */}
        <div style={{ position: 'relative', width: '18.9rem', height: '18.9rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px dashed rgba(29, 153, 4, 0.4)', animation: 'spin 20s linear infinite' }} />
          <div style={{ position: 'absolute', inset: '-0.75rem', borderRadius: '50%', border: '1px dotted rgba(168, 85, 247, 0.4)', animation: 'spin 15s linear infinite reverse' }} />
          <div style={{ width: '9rem', height: '9rem', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${green}`, background: '#000', position: 'relative' }}>
            {imageUrl && <img src={imageUrl} alt={displayArchetype} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.25) sepia(0.2)', transform: 'scale(1.05)' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 'clamp(1.2rem, 2vw, 2rem)', fontFamily: "'Lexend Mega', sans-serif", fontWeight: 'bold', background: 'linear-gradient(to right, #a855f7, #d8b4fe, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))', marginBottom: '0.5rem' }}>
            {displayArchetype}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(249, 115, 22, 0.9)', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {main.name} {harmonyActive ? '\u27F7' : '+'} {support.name}
          </p>
          {levenslesQuote && (
            <p style={{ fontSize: '0.9rem', color: 'rgba(156, 163, 175, 1)', fontFamily: "'Figtree', sans-serif", fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
              "{levenslesQuote}"
            </p>
          )}
          {/* Manage — only on your OWN profile (logged in). Hidden for other viewers. */}
          {isOwner && (
            <button
              type="button"
              onClick={() => setManageOpen((o) => !o)}
              style={{ marginTop: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.5)', borderRadius: '0.4rem', color: '#c4b5fd', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.72rem', padding: '0.4rem 0.85rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168,85,247,0.22)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(168,85,247,0.12)'; }}
            >
              {manageOpen ? t('eyedentityReport.manage.close') : t('eyedentityReport.manage.open')}
            </button>
          )}
        </div>
      </div>

      {/* ── Manage panel — owner-only (naam / profielcode / account verwijderen). ── */}
      {isOwner && manageOpen && (
        <div style={{ border: '1px solid rgba(168,85,247,0.35)', borderRadius: '0.6rem', background: 'rgba(20,10,30,0.5)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Zichtbare naam */}
          <div>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(196,181,253,0.7)', marginBottom: '0.4rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>{t('eyedentityReport.manage.displayNameLabel')}</div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={nameInput} onChange={(e) => { setNameInput(e.target.value); setNameMsg(''); }} maxLength={40}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                style={{ flex: 1, minWidth: '10rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(168,85,247,0.35)', color: '#fff', fontFamily: "'Figtree', sans-serif", fontSize: '0.9rem', padding: '0.45rem 0.7rem', borderRadius: '0.35rem', outline: 'none' }} />
              <SciFiButton onClick={handleSaveName} disabled={nameBusy || !nameInput.trim()} variant="purple" size="sm">{nameBusy ? '...' : t('eyedentityReport.manage.save')}</SciFiButton>
            </div>
            {nameMsg && <div style={{ fontSize: '0.75rem', color: nameMsg.includes('✓') ? '#4ade80' : '#f87171', marginTop: '0.35rem' }}>{nameMsg}</div>}
          </div>

          {/* Profielcode */}
          {orbCode && (
            <div>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(196,181,253,0.7)', marginBottom: '0.4rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>{t('eyedentityReport.manage.profileCodeLabel')}</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem', color: '#c4b5fd', background: '#050505', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '0.35rem', padding: '0.55rem', wordBreak: 'break-all', lineHeight: 1.5 }}>{orbCode}</div>
              <div style={{ marginTop: '0.5rem' }}><SciFiButton onClick={copyCode} variant="purple" size="sm">{t('eyedentityReport.manage.copyCode')}</SciFiButton></div>
            </div>
          )}

          {/* Account verwijderen */}
          <div style={{ borderTop: '1px solid rgba(239,68,68,0.25)', paddingTop: '0.9rem' }}>
            <div style={{ color: '#fca5a5', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: '0.55rem' }}>
              {t('eyedentityReport.manage.deleteIntroBefore')}<b>{t('eyedentityReport.manage.deleteWord')}</b>{t('eyedentityReport.manage.deleteIntroAfter')}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={delInput} onChange={(e) => setDelInput(e.target.value)} placeholder={t('eyedentityReport.manage.deleteWord')}
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', padding: '0.4rem 0.7rem', borderRadius: '0.35rem', outline: 'none', width: '10rem' }} />
              <SciFiButton onClick={handleDeleteAccount} disabled={delBusy} variant="danger" size="sm">{delBusy ? t('eyedentityReport.manage.deleting') : t('eyedentityReport.manage.delete')}</SciFiButton>
              {delErr && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{delErr}</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Meta-Disclaimer ── */}
      <div style={{
        width: '100%',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: sectionPad,
        borderRadius: '0.75rem',
        borderLeft: '3px solid rgba(168, 85, 247, 0.5)',
        marginBottom: '0.5rem',
      }}>
        <p style={{
          margin: 0,
          color: 'rgba(209, 213, 219, 0.85)',
          fontFamily: "'Figtree', sans-serif",
          fontSize: '0.88rem',
          lineHeight: 1.7,
          fontStyle: 'italic',
        }}>
          <strong style={{ color: '#a855f7' }}>{t('eyedentityReport.metaDisclaimer.label')}</strong>{' '}
          {t('eyedentityReport.metaDisclaimer.body')}
        </p>
      </div>

      {/* ── 3. AI Introductie ── */}
      {aiIntroSection.map((s, i) => renderAiSectionCard(s, i))}

      {/* ── 4. Group 1a: Identiteit / Waarom / Essentie / Vermenigvuldiging ── */}
      {aiGroup1a.map((s, i) => renderAiSectionCard(s, i + aiIntroSection.length))}

      {/* ── 5. Group 1b: Schaduw / Blindspot / Visuele ── */}
      {aiGroup1b.map((s, i) => renderAiSectionCard(s, i + aiIntroSection.length + aiGroup1a.length))}

      {/* ── 6. Groep Dynamiek ── */}
      {aiGroepDyn.map((s, i) => renderAiSectionCard(s, i + aiIntroSection.length + aiGroup1a.length + aiGroup1b.length))}

      {/* ── 7. Radar Chart ── */}
      {radarData && (
        <div style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid rgba(29, 153, 4, 0.15)',
          borderRadius: '0.75rem',
          padding: sectionPad,
          overflow: 'hidden',
        }}>
          <SciFiRadarChart
            data={radarData}
            shadow={shadowArchetype}
            blindspot={blindspotArchetype}
            mainArchetype={overallArchetype}
            supportArchetype={supportArchetypeProp}
          />
        </div>
      )}

      {/* ── 8. Subgroup Dynamics (Dual-Core) ── */}
      {subgroups && (
        <div style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid rgba(168, 85, 247, 0.1)',
          borderRadius: '0.75rem',
          padding: sectionPad,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            padding: '0.5rem',
            opacity: 0.15,
          }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <SubgroupCounters subgroups={subgroups} />
        </div>
      )}

      {/* ── 9. Cognitieve Driehoek ── */}
      {tri && (
        <div style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: '0.75rem',
          padding: sectionPad,
        }}>
          <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.05rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {t('eyedentityReport.cog.heading')}
          </h3>
          <p style={{ margin: '0.3rem 0 0.85rem', fontSize: '0.85rem', color: 'rgba(148,163,184,0.75)', fontFamily: "'Figtree', sans-serif", lineHeight: 1.6, textAlign: 'justify', overflowWrap: 'break-word' }}>
            {t('eyedentityReport.cog.introA')}<strong style={{ color: 'rgba(251,191,36,0.85)' }}>{t('eyedentityReport.cog.introCulturePicks')}</strong>{t('eyedentityReport.cog.introB')}<em>{t('eyedentityReport.cog.introAre')}</em>{t('eyedentityReport.cog.introC')}<em>{t('eyedentityReport.cog.introLearned')}</em>{t('eyedentityReport.cog.introD')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ width: '1.4rem', height: '1.4rem', borderRadius: '50%', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#fbbf24', flexShrink: 0 }}>
              {tri.id}
            </span>
            <div>
              <div style={{ fontSize: '0.9rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#1d9904', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t(`eyedentityReport.cog.modes.${triKey}.mode`)}</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(209,213,219,0.6)', fontFamily: "'Figtree', sans-serif" }}>{tri.members.join(' · ')} — {t(`eyedentityReport.cog.modes.${triKey}.networks`)}</div>
            </div>
          </div>
          <p style={{ margin: '0 0 0.1rem', fontSize: '0.85rem', fontFamily: "'Figtree', sans-serif", color: 'rgba(251,191,36,0.9)', fontWeight: 600, fontStyle: 'italic' }}>
            {t(`eyedentityReport.cog.modes.${triKey}.tagline`)}
          </p>
          <p style={{ margin: '0.45rem 0 0', fontSize: '0.85rem', fontFamily: "'Figtree', sans-serif", color: 'rgba(209,213,219,0.85)', lineHeight: 1.65, textAlign: 'justify', overflowWrap: 'break-word' }}>
            {t(`eyedentityReport.cog.modes.${triKey}.what`)}
          </p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', fontFamily: "'Figtree', sans-serif", color: 'rgba(209,213,219,0.9)', lineHeight: 1.6, textAlign: 'justify', overflowWrap: 'break-word' }}>
            <span style={{ color: 'rgba(251,191,36,0.9)', fontWeight: 600 }}>{t('eyedentityReport.cog.driveLabel')}</span>{t(`eyedentityReport.cog.modes.${triKey}.drive`)}
          </p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', fontFamily: "'Figtree', sans-serif", color: 'rgba(209,213,219,0.9)', lineHeight: 1.6, textAlign: 'justify', overflowWrap: 'break-word' }}>
            <span style={{ color: 'rgba(251,191,36,0.9)', fontWeight: 600 }}>{t('eyedentityReport.cog.highLabel')}</span>{t(`eyedentityReport.cog.modes.${triKey}.high`)}
          </p>
          <p style={{ margin: '0.4rem 0 0.75rem', fontSize: '0.85rem', fontFamily: "'Figtree', sans-serif", color: 'rgba(209,213,219,0.9)', lineHeight: 1.6, textAlign: 'justify', overflowWrap: 'break-word' }}>
            <span style={{ color: 'rgba(251,191,36,0.9)', fontWeight: 600 }}>{t('eyedentityReport.cog.growthLabel')}</span>{t(`eyedentityReport.cog.modes.${triKey}.growth`)}
          </p>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {ALL_COG_TRIANGLES.filter(x => x.id !== tri.id).map(tItem => (
              <div key={tItem.id} style={{ flex: 1, border: '1px solid rgba(251,191,36,0.15)', borderRadius: '0.4rem', padding: '0.4rem 0.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#1d9904', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>{t(`eyedentityReport.cog.modes.${tItem.key}.mode`)}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(148,163,184,0.8)', fontFamily: "'Figtree', sans-serif" }}>{tItem.members}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 10. Group 2: Alchemie / Schakelbord / Evolutie / Ontologie ── */}
      {aiGroup2.map((s, i) => renderAiSectionCard(s, i + aiIntroSection.length + aiGroup1a.length + aiGroup1b.length + aiGroepDyn.length))}

      {/* ── 11. Other ungrouped sections ── */}
      {aiOtherSections.map((s, i) => renderAiSectionCard(s, i + aiIntroSection.length + aiGroup1a.length + aiGroup1b.length + aiGroepDyn.length + aiGroup2.length))}

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
  const { t } = useLanguage();
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
    if (!email.trim()) { setError(t('eyedentityReport.feedback.emailRequired')); return; }
    if (!formData.starRating) { setError(t('eyedentityReport.feedback.scoreRequired')); return; }
    if (!whatWorked.trim() && !whatDidntWork.trim() && !suggestions.trim()) {
      setError(t('eyedentityReport.feedback.textRequired')); return;
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
      setError(err.message || t('eyedentity.feedback.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, assessmentId, t]);

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{'\u2705'}</div>
        <p style={{ color: '#22c55e', fontFamily: "'Figtree', sans-serif", fontSize: '1rem', marginBottom: '0.5rem', margin: '0 0 0.5rem' }}>
          {t('eyedentityReport.feedback.thanksTitle')}
        </p>
        <p style={{ color: 'rgba(209,213,219,0.6)', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', margin: 0 }}>
          {t('eyedentityReport.feedback.thanksBody')}
        </p>
      </div>
    );
  }

  const baseField = {
    width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(0,0,0,0.8)',
    border: '1px solid rgba(168,85,247,0.2)', borderRadius: '0.5rem',
    color: '#fff', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', boxSizing: 'border-box',
  };

  return (
    <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', paddingBottom: '2rem' }}>
      <p style={{ color: 'rgba(209,213,219,0.7)', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', marginTop: 0, marginBottom: '1rem' }}>
        {t('eyedentity.feedback.intro')}
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Star Rating 1-9 */}
        <div>
          <label style={{ display: 'block', color: '#f59e0b', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('eyedentity.feedback.score')} *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
            {[...Array(9)].map((_, i) => (
              <button key={i} type="button" onClick={() => setFormData({ ...formData, starRating: i + 1 })} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem',
                color: i < formData.starRating ? '#f59e0b' : 'rgba(245,158,11,0.2)',
                padding: '0.15rem', transition: 'color 0.15s, transform 0.15s',
                transform: i < formData.starRating ? 'scale(1.1)' : 'scale(1)',
              }}>{'\u2605'}</button>
            ))}
            {formData.starRating > 0 && (
              <span style={{ marginLeft: '0.5rem', color: '#f59e0b', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold' }}>{formData.starRating}/9</span>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', color: '#a855f7', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('eyedentity.feedback.email')} *</label>
          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder={t('eyedentity.feedback.emailPlaceholder')} style={baseField} />
        </div>

        {/* Accuraatheid */}
        <div>
          <label style={{ display: 'block', color: '#22c55e', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
            {t('eyedentity.feedback.accuracyLabel')}
          </label>
          <textarea value={formData.whatWorked} onChange={(e) => setFormData({ ...formData, whatWorked: e.target.value })}
            placeholder={t('eyedentity.feedback.accuracyPlaceholder')}
            style={{ ...baseField, minHeight: '60px', maxHeight: '120px', border: '1px solid rgba(34,197,94,0.2)', resize: 'vertical' }} />
        </div>

        {/* Niet overeenkomend */}
        <div>
          <label style={{ display: 'block', color: '#ef4444', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
            {t('eyedentity.feedback.mismatchLabel')}
          </label>
          <textarea value={formData.whatDidntWork} onChange={(e) => setFormData({ ...formData, whatDidntWork: e.target.value })}
            placeholder={t('eyedentity.feedback.mismatchPlaceholder')}
            style={{ ...baseField, minHeight: '60px', maxHeight: '120px', border: '1px solid rgba(239,68,68,0.2)', resize: 'vertical' }} />
        </div>

        {/* Suggesties */}
        <div>
          <label style={{ display: 'block', color: '#a855f7', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
            {t('eyedentity.feedback.suggestionsLabel')}
          </label>
          <textarea value={formData.suggestions} onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
            placeholder={t('eyedentity.feedback.suggestionsPlaceholder')}
            style={{ ...baseField, minHeight: '60px', maxHeight: '120px', resize: 'vertical' }} />
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontFamily: "'Figtree', sans-serif", fontSize: '0.85rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex' }}>
          <SciFiButton type="submit" disabled={isSubmitting} variant="purple" size="md">
            {isSubmitting ? t('eyedentity.feedback.submitting') : t('eyedentity.feedback.submit')}
          </SciFiButton>
        </div>
      </form>
    </div>
  );
};

const NAV_ITEMS = [
  { id: 'profile', slug: 'profiel', titleKey: 'eyedentity.nav.profile', icon: '\u{1F9EC}', version: 'v1.0' },
  { id: 'terms', slug: 'algemene-voorwaarden', titleKey: 'eyedentity.nav.terms', icon: '\u{1F4CB}', version: 'v1.0' },
  { id: 'privacy', slug: 'privacybeleid', titleKey: 'eyedentity.nav.privacy', icon: '\u{1F512}', version: 'v1.0' },
  { id: 'cookies', slug: 'cookiebeleid', titleKey: 'eyedentity.nav.cookies', icon: '\u{1F36A}', version: 'v1.1' },
  { id: 'ai', slug: 'ai-transparantie', titleKey: 'eyedentity.nav.ai', icon: '\u{1F916}', version: 'v1.0' },
  { id: 'ip', slug: 'intellectueel-eigendom', titleKey: 'eyedentity.nav.ip', icon: '\u{00A9}', version: 'v2.0' },
  { id: 'usage', slug: 'gebruiksvoorwaarden-misbruik', titleKey: 'eyedentity.nav.usage', icon: '\u{2696}', version: 'v2.1' },
  { id: 'retention', slug: 'gegevensbehoud-en-verwijdering', titleKey: 'eyedentity.nav.retention', icon: '\u{1F5C2}', version: 'v1.0' },
  { id: 'register', slug: 'verwerkingsregister', titleKey: 'eyedentity.nav.register', icon: '\u{1F4DC}', version: 'v2.1' },
  { id: 'feedback', slug: 'feedback', titleKey: 'eyedentity.nav.feedback', icon: '\u{2B50}', version: 'v1.0' },
];

const SLUG_TO_ID = Object.fromEntries(NAV_ITEMS.map(item => [item.slug, item.id]));

const EyedentityPage = memo(({ isVisible, onBack }) => {
  const { t, language } = useLanguage();
  // CLIENT MODE: the left verbindingsmenu becomes the public-profiles directory.
  // The policy/terms pages the visitor sees here live under Instellingen on the
  // client's profile card instead. Derived locally (this page never gets clientMode).
  //
  // EXCEPTION — ?page= deep links: policy links across the platform (consent
  // checkboxes, footers, emails) open a FRESH tab on /?page=<slug>. That tab shares
  // localStorage, so it boots as a client session too — but the link's intent is the
  // policy page, so an explicit ?page= always shows the policy hub, never the
  // directory. (Read once at mount: fresh-tab boot is the scenario that matters.)
  const [hasPageDeepLink] = useState(() => {
    try { return !!new URLSearchParams(window.location.search).get('page'); } catch { return false; }
  });
  const isClient = !!(getToken() && getClientOrbConfig()) && !hasPageDeepLink;
  const getTabFromPath = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page && SLUG_TO_ID[page]) return SLUG_TO_ID[page];
    return 'profile';
  }, []);

  const [selectedId, setSelectedId] = useState(getTabFromPath);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const contentRef = useRef(null);

  // Preload the profile portrait on mount (not gated by isVisible/selectedId). The card lives
  // inside a content-visibility:auto section, so its <img> would otherwise only start fetching
  // once the user navigates in — arriving late. Fetching it here caches it ahead of time.
  useEffect(() => {
    const url = getArchetypeImage(MAVERICK_DEFAULT.mainArchetype, MAVERICK_DEFAULT.supportArchetype);
    if (url) { const img = new Image(); img.src = url; }
  }, []);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [selectedId]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const onPopState = () => setSelectedId(getTabFromPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [getTabFromPath]);

  const handleTabClick = useCallback((id) => {
    const item = NAV_ITEMS.find(i => i.id === id);
    setSelectedId(id);
    window.history.pushState(null, '', `/?page=${item?.slug || 'profiel'}`);
  }, []);

  const selectedItem = NAV_ITEMS.find(item => item.id === selectedId);
  const accentColor = '#a855f7';
  const corners = CornerStone({ variant: 'purple' });
  // CLIENT (Verbonden/profielen-directory): the shell takes the EXACT profile-card
  // footprint (min(88vw,1500px) × 68vh) plus 15% extra width on the LEFT — still
  // centered on screen. Closed: the full directory fills it; open: the extra 15%
  // becomes the quick-nav bar and the card fills the rest exactly.
  const shellW = isClient ? 'calc(min(88vw, 1500px) * 1.15)' : (windowWidth >= 1800 ? '70vw' : windowWidth >= 1079 ? '77vw' : '96vw');
  const shellH = isClient ? '68vh' : (windowWidth >= 1800 ? '70vh' : windowWidth >= 1079 ? '77vh' : '96vh');

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
      <div style={{ position: 'relative', width: shellW, height: shellH, flexShrink: 0 }}>
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
        {/* Content layer — client: zero padding (the directory/card fill the shell exactly) */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: isClient ? 0 : '1.5rem 2rem' }}>

          {/* ── Header (visitor only — the client shell is exactly card-sized, no chrome) ── */}
        {!isClient && (
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
                {t('eyedentityReport.shell.protocolLabel')}
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
          {/* (← TERUG removed — the global nav "← Terug" handles going back.) */}
        </div>
        )}

        {/* ── CLIENT: the whole pane is the public-profiles directory ── */}
        {isClient ? (
          <div style={{ flex: 1, minHeight: 0 }}>
            {isVisible && <PublicProfilesDirectory />}
          </div>
        ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, auto) 1fr',
          gridTemplateRows: '1fr',
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
            minHeight: 0,
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
                      {t(item.titleKey)}
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
            padding: '1.5rem 2rem 0 2rem',
            boxShadow: 'inset 0 0 12px rgba(168,85,247,0.06), inset 0 0 30px rgba(168,85,247,0.03), inset -3rem -3rem 6rem rgba(168,85,247,0.04), 0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
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
              marginBottom: '0.5rem',
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
                  {selectedItem ? t(selectedItem.titleKey) : ''}
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
                    {new Date().toLocaleDateString(language === 'en' ? 'en-GB' : 'nl-NL')}
                  </span>
                </div>
              </div>
            </div>

            {/* Header / Body divider */}
            <div style={{
              height: '1px',
              background: 'rgba(168,85,247,0.4)',
              marginBottom: '0',
              flexShrink: 0,
            }} />

            {/* Content Body */}
            <div ref={contentRef} style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              minHeight: 0,
              paddingTop: '1.25rem',
            }}>
              {selectedId === 'profile' ? (
                isVisible && <ProfileResultCard />
              ) : selectedId === 'feedback' ? (
                <FeedbackStandaloneForm />
              ) : (
                getPolicyContent(language)[selectedId] || <p style={{ color: '#94a3b8' }}>{t('eyedentity.contentUnavailable')}</p>
              )}
            </div>

          </div>
        </div>
        )}{/* /visitor sidebar+content */}
        </div>{/* /content layer */}
        </div>{/* /inner panel */}
      </div>{/* /outer shell */}
    </div>
  );
});

EyedentityPage.displayName = 'EyedentityPage';

export default EyedentityPage;
