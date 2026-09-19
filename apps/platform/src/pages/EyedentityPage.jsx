import React, { memo, useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { useLanguage } from '@gfl/i18n';
import { getPolicyContent } from '../data/policyIndex';
import { submitAssessmentReview, getToken } from '@gfl/api-client';
import { getClientOrbConfig } from '../clientMode';
import { SciFiButton } from '@gfl/ui';
import PublicProfilesDirectory from '../components/assessment/PublicProfilesDirectory';

// The owner's own profile (Profiel tab). Lazy: it brings the chart library, which must not load at boot.
const OwnerProfile = lazy(() => import('./OwnerProfile'));

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
        <p style={{ color: '#22c55e', fontFamily: "'Figtree', sans-serif", fontSize: 'max(18px, 0.84vw)', marginBottom: '0.5rem', margin: '0 0 0.5rem' }}>
          {t('eyedentityReport.feedback.thanksTitle')}
        </p>
        <p style={{ color: 'rgba(209,213,219,0.6)', fontFamily: "'Figtree', sans-serif", fontSize: 'max(15px, 0.72vw)', margin: 0 }}>
          {t('eyedentityReport.feedback.thanksBody')}
        </p>
      </div>
    );
  }

  const baseField = {
    width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(0,0,0,0.8)',
    border: '1px solid rgba(168,85,247,0.2)', borderRadius: '0.5rem',
    color: '#fff', fontFamily: "'Figtree', sans-serif", fontSize: 'max(15px, 0.72vw)', boxSizing: 'border-box',
  };

  return (
    <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', paddingBottom: '2rem' }}>
      <p style={{ color: 'rgba(209,213,219,0.7)', fontFamily: "'Figtree', sans-serif", fontSize: 'max(15px, 0.72vw)', marginTop: 0, marginBottom: '1rem' }}>
        {t('eyedentity.feedback.intro')}
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Star Rating 1-9 */}
        <div>
          <label style={{ display: 'block', color: '#f59e0b', fontFamily: "'Figtree', sans-serif", fontSize: 'max(15px, 0.72vw)', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('eyedentity.feedback.score')} *</label>
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
              <span style={{ marginLeft: '0.5rem', color: '#f59e0b', fontFamily: "'Figtree', sans-serif", fontSize: 'max(15px, 0.72vw)', fontWeight: 'bold' }}>{formData.starRating}/9</span>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', color: '#a855f7', fontFamily: "'Figtree', sans-serif", fontSize: 'max(15px, 0.72vw)', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('eyedentity.feedback.email')} *</label>
          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder={t('eyedentity.feedback.emailPlaceholder')} style={baseField} />
        </div>

        {/* Accuraatheid */}
        <div>
          <label style={{ display: 'block', color: '#22c55e', fontFamily: "'Figtree', sans-serif", fontSize: 'max(15px, 0.72vw)', fontWeight: 'bold', marginBottom: '0.35rem' }}>
            {t('eyedentity.feedback.accuracyLabel')}
          </label>
          <textarea value={formData.whatWorked} onChange={(e) => setFormData({ ...formData, whatWorked: e.target.value })}
            placeholder={t('eyedentity.feedback.accuracyPlaceholder')}
            style={{ ...baseField, minHeight: '60px', maxHeight: '120px', border: '1px solid rgba(34,197,94,0.2)', resize: 'vertical' }} />
        </div>

        {/* Niet overeenkomend */}
        <div>
          <label style={{ display: 'block', color: '#ef4444', fontFamily: "'Figtree', sans-serif", fontSize: 'max(15px, 0.72vw)', fontWeight: 'bold', marginBottom: '0.35rem' }}>
            {t('eyedentity.feedback.mismatchLabel')}
          </label>
          <textarea value={formData.whatDidntWork} onChange={(e) => setFormData({ ...formData, whatDidntWork: e.target.value })}
            placeholder={t('eyedentity.feedback.mismatchPlaceholder')}
            style={{ ...baseField, minHeight: '60px', maxHeight: '120px', border: '1px solid rgba(239,68,68,0.2)', resize: 'vertical' }} />
        </div>

        {/* Suggesties */}
        <div>
          <label style={{ display: 'block', color: '#a855f7', fontFamily: "'Figtree', sans-serif", fontSize: 'max(15px, 0.72vw)', fontWeight: 'bold', marginBottom: '0.35rem' }}>
            {t('eyedentity.feedback.suggestionsLabel')}
          </label>
          <textarea value={formData.suggestions} onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
            placeholder={t('eyedentity.feedback.suggestionsPlaceholder')}
            style={{ ...baseField, minHeight: '60px', maxHeight: '120px', resize: 'vertical' }} />
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontFamily: "'Figtree', sans-serif", fontSize: 'max(15px, 0.72vw)', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)' }}>
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
                fontSize: 'max(11px, 0.52vw)',
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
                      fontSize: 'max(9px, 0.4vw)',
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
                      fontSize: 'max(11px, 0.52vw)',
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
                  fontSize: 'max(23px, 1vw)',
                  fontWeight: 'bold',
                  letterSpacing: '0.02em',
                  color: '#ffffff',
                  margin: 0,
                }}>
                  {selectedItem ? t(selectedItem.titleKey) : ''}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                  <span style={{
                    fontSize: 'max(11px, 0.52vw)',
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
                // The owner's own profile on the 132 roster — De Ronin, in the first person (2026-09-19).
                isVisible && <Suspense fallback={null}><OwnerProfile /></Suspense>
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
