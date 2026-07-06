import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import TechContainer from './TechContainer';
import WheelGlyph from '../WheelGlyph';
import { Activity, Database, Lock, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@gfl/i18n';
import { SciFiButton } from '@gfl/ui';
import { getArchetypeImageByName } from '@gfl/assessment-core/data/archetypeImages';
import { getInbox, sendUserMessage, markMessageRead, getMe } from '@gfl/api-client';

const eyeLogo = '/images/Eyedentity.png';
const blackholeIcon = '/images/Blackhole.png';

// ── Contacten overlay chrome ─────────────────────────────────────────────────
// A glass panel that opens OVER the page. Portalled to <body> because the Contacten
// card lives inside a scaled/transformed container — a `position:fixed` child there
// would anchor to the transformed ancestor, not the viewport. Backdrop click / Esc closes.
// dim=false → the modal floats without darkening/blurring the whole screen behind it.
function ContactenOverlay({ title, onClose, width, height, closeLabel = 'Gereed', dim = true, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2147483000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4vh 4vw', background: dim ? 'rgba(10, 5, 16, 0.72)' : 'transparent', ...(dim ? { backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } : {}) }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', width, height, maxWidth: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: 'rgba(2, 0, 3, 0.3)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', border: '1px solid rgba(168, 85, 247, 0.45)', boxShadow: '0 0 40px rgba(168, 85, 247, 0.25)', borderRadius: '0.5rem', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, padding: '1.4vh 1.4vw', borderBottom: '1px solid rgba(168, 85, 247, 0.25)' }}>
          <span style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, color: 'rgb(216, 190, 254)', fontSize: 'max(11px, 0.7vw)' }}>{title}</span>
          <SciFiButton variant="purple" size="sm" onClick={onClose}>{closeLabel}</SciFiButton>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Small glass popover anchored under an input (name suggestions / enlarged title). Portalled to
// <body> so nested overflow:hidden ancestors can't clip it; no screen dimming — just the panel.
function AnchoredPopover({ anchorRef, open, minWidth = 0, children }) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    if (!open) { setRect(null); return; }
    const update = () => { if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect()); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [open, anchorRef]);
  if (!open || !rect) return null;
  return createPortal(
    <div style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, minWidth), maxHeight: '40vh', overflowY: 'auto', zIndex: 2147483200, background: 'rgba(2, 0, 3, 0.85)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1px solid rgba(168, 85, 247, 0.45)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.55)', borderRadius: '0.3rem', overflow: 'hidden' }}>
      {children}
    </div>,
    document.body
  );
}

// Shared field chrome for the "Bericht versturen" form (design-tokens: Lexend Mega labels,
// Figtree inputs, 0.15rem radius, amber focus ring).
const OV_LABEL = { display: 'block', fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 'max(9px, 0.5vw)', color: 'rgba(192, 132, 252, 0.75)', marginBottom: '0.5vh' };
const OV_FIELD = { width: '100%', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '0.15rem', color: '#FFFEF0', fontFamily: "'Figtree', sans-serif", fontSize: 'max(11px, 0.62vw)', padding: '0.9vh 0.8vw', outline: 'none', boxShadow: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease' };
const ovFocus = (e) => { e.currentTarget.style.borderColor = 'rgba(255, 174, 0, 0.5)'; e.currentTarget.style.background = 'rgba(255, 174, 0, 0.04)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 174, 0, 0.25)'; };
const ovBlur = (e) => { e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)'; e.currentTarget.style.background = 'rgba(168, 85, 247, 0.06)'; e.currentTarget.style.boxShadow = 'none'; };

const DesktopLayout = ({ isExploding, mounted, currentSlide, setCurrentSlide, animationProgress = 0, gardenAnimationProgress, verbindingsAnimationProgress, setActiveSection, pauseAutoSlide, clientProfile = null, clientMode = false, messages: messagesProp = [], contacts = [], onOpenProfile = null }) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const { language, toggleLanguage, t } = useLanguage();

  // ── Real inbox (client mode): fetched from the messages backend, refreshed every minute.
  const [inbox, setInbox] = useState([]);
  const refreshInbox = useCallback(() => {
    getInbox().then((r) => setInbox(Array.isArray(r.messages) ? r.messages : [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (!clientMode) return undefined;
    refreshInbox();
    const timer = setInterval(refreshInbox, 60000);
    return () => clearInterval(timer);
  }, [clientMode, refreshInbox]);
  const messages = clientMode ? inbox : messagesProp;

  // Contacten overlays — Berichten + Contactlijst open a full glass panel over the page.
  const [contactenOverlay, setContactenOverlay] = useState(null); // 'berichten' | 'contactlijst'
  const [openMsgIdx, setOpenMsgIdx] = useState(null);             // selected thread in the Berichten catalog
  // Versturen (compose) lives INLINE in the card: name + title + text cards. Only the text card
  // opens a modal (the larger editor); the name suggests contacts, the title enlarges to read.
  const [compose, setCompose] = useState({ to: '', title: '', body: '' });
  const [composeBodyOpen, setComposeBodyOpen] = useState(false);  // larger text editor (non-dimming modal)
  const [nameOpen, setNameOpen] = useState(false);                // contact-name suggestions under the "Aan" field
  const [titleOpen, setTitleOpen] = useState(false);              // enlarged read-out of the "Onderwerp" field
  const toInputRef = useRef(null);
  const titleInputRef = useRef(null);
  // Suggest names from the contact list so the sender doesn't need the exact username.
  const nameSuggestions = (compose.to.trim()
    ? contacts.filter((c) => (c.name || c.company || c.label || '').toLowerCase().includes(compose.to.trim().toLowerCase()))
    : contacts).slice(0, 6);
  // Send through the messages backend; recipient = the shown profile name ("Aan" field).
  const [composeMsg, setComposeMsg] = useState('');
  const sendMessage = async () => {
    const to = compose.to.trim();
    if (!to || !compose.body.trim()) { setComposeMsg('Vul ontvanger en bericht in.'); return; }
    setComposeMsg('');
    try {
      await sendUserMessage({ to, title: compose.title, body: compose.body });
      setCompose({ to: '', title: '', body: '' }); setComposeBodyOpen(false); setNameOpen(false); setTitleOpen(false);
      setComposeMsg('Verstuurd ✓');
      refreshInbox();
      setTimeout(() => setComposeMsg(''), 4000);
    } catch (e) { setComposeMsg(e.message || 'Versturen mislukt'); }
  };
  // Opening a message marks it read (recipient-side) — the green flash stops.
  const openMessage = (i) => {
    setOpenMsgIdx(i);
    const m = messages[i];
    if (clientMode && m && m.id && !m.read) {
      markMessageRead(m.id).catch(() => {});
      setInbox((list) => list.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
    }
  };
  // Route a contact to the right destination (shared by the card preview + the full-list overlay).
  const openContact = (c) => {
    setContactenOverlay(null);
    if (c.type === 'company' || c.type === 'service' || c.type === 'product') setActiveSection('gardens');
    else if (c.handle && onOpenProfile) onOpenProfile(c.handle);
    else setActiveSection('login');
  };

  // Verbindingsmenu centre block. Logged-in client mode shows the user's identity in green
  // (name · archetype · country/age from the PDF+account); visitors see the default contact lines.
  const renderContactCentre = (fontSize) => {
    if (clientProfile && (clientProfile.displayName || clientProfile.archetypeName)) {
      const loc = [clientProfile.country, clientProfile.age].filter((v) => v !== '' && v != null).join(' · ');
      // TimeSync green, but the normal body font (not the Lexend Mega header font).
      const tag = { fontSize, color: 'rgba(21, 179, 21, 0.8)', fontWeight: 'bold' };
      return (
        <div className="flex flex-col items-center justify-center gap-0.5" style={{ textAlign: 'center' }}>
          {clientProfile.displayName && <span style={tag}>{clientProfile.displayName}</span>}
          {clientProfile.archetypeName && <span style={tag}>{clientProfile.archetypeName}</span>}
          {loc && <span style={tag}>{loc}</span>}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-0.5">
        <span style={{ fontSize, color: 'white', fontWeight: 'bold' }}>yuanwullink30@gfl.community</span>
        <span style={{ fontSize, color: 'white', fontWeight: 'bold' }}>Zutphen, NL</span>
      </div>
    );
  };

  // Right button icon. Client mode → the reading's full-colour radar WHEEL (5-mandje split,
  // owner-only via /me); falls back to the archetype portrait while no wheel data exists
  // (pre-extractor readings), then to the blackhole login icon for visitors.
  const archetypeImg = clientMode ? getArchetypeImageByName(clientProfile?.archetypeName) : null;
  const [wheelBaskets, setWheelBaskets] = useState(null);
  useEffect(() => {
    if (!clientMode) return;
    getMe().then((u) => {
      if (Array.isArray(u.readingBaskets) && u.readingBaskets.length === 12) setWheelBaskets(u.readingBaskets);
    }).catch(() => {});
  }, [clientMode]);
  const renderLoginIcon = (size) => {
    if (clientMode && wheelBaskets) {
      return (
        <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(168, 85, 247, 0.55)', boxShadow: '0 0 10px rgba(168, 85, 247, 0.25)', background: '#0a0510' }}>
          <WheelGlyph baskets={wheelBaskets} />
        </div>
      );
    }
    if (archetypeImg) {
      return (
        <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(168, 85, 247, 0.55)', boxShadow: '0 0 10px rgba(168, 85, 247, 0.25)', background: '#0a0510' }}>
          <img src={archetypeImg} alt="Profiel" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      );
    }
    return <img src={blackholeIcon} alt="Login" style={{ width: size, height: 'auto' }} />;
  };

  // Compact per-section action button (Contacten columns). Pinned to the bottom via marginTop:auto.
  const renderSectionBtn = (label, onClick) => (
    <button
      onClick={onClick}
      style={{ marginTop: 'auto', width: '100%', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.45)', borderRadius: '0.3rem', color: 'rgb(216, 190, 254)', fontFamily: "'Figtree', sans-serif", fontSize: 'max(9px, 0.5vw)', padding: '0.5vh 0.4vw', cursor: 'pointer', transition: 'background 0.2s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)'; }}
    >
      {label}
    </button>
  );

  // Touch swipe state for Gardens slideshow
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const gardensDataLength = 5; // Total number of garden slides
  const prevSlideRef = useRef(null);
  
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    
    if (diff > swipeThreshold) {
      // Swiped left — forward only
      if (pauseAutoSlide) pauseAutoSlide();
      setCurrentSlide(prev => (prev + 1) % gardensDataLength);
    }
    
    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [setCurrentSlide, pauseAutoSlide]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track previous slide so exit animation always goes left
  useEffect(() => {
    prevSlideRef.current = currentSlide;
  });

  // Calculate animation values based on progress (0 = visible, 1 = fully hidden/flown away)
  // animationProgress goes from 0 to 1 as containers fly away
  // All values in vw/vh for consistent viewport scaling
  const containerOpacity = Math.max(0, 1 - animationProgress * 3.5); // Fades out faster
  
  // Data Stream starts 4 frames later but catches up to same end state
  // 4 frames delay out of ~34 frame range = ~0.118 offset, rescaled to 0-1
  const dataStreamDelay = 0.118;
  const dataStreamProgress = Math.max(0, Math.min(1, (animationProgress - dataStreamDelay) / (1 - dataStreamDelay)));
  const dataStreamOpacity = Math.max(0, 1 - dataStreamProgress * 3.5);
  
  // Gardens (bottomRight) starts 2 frames later
  // 2 frames delay out of ~34 frame range = ~0.059 offset, rescaled to 0-1
  const gardensDelay = 0.059;
  const gardensProgress = Math.max(0, Math.min(1, (animationProgress - gardensDelay) / (1 - gardensDelay)));
  const gardensOpacity = Math.max(0, 1 - gardensProgress * 3.5);
  
  // Each container flies in different direction (converted to vw/vh from 2560x1440 reference)
  // 250px @ 2560w = 9.77vw, 200px @ 1440h = 13.89vh
  const topLeftX = -9.77 * animationProgress * 1.5;      // vw - faster exit
  const topLeftY = -13.89 * animationProgress * 1.5;     // vh
  const bottomRightX = 9.77 * gardensProgress * 1.5;     // vw - Gardens uses delayed progress
  const bottomRightY = 13.89 * gardensProgress * 1.5;    // vh - Gardens uses delayed progress
  
  // Verbindings (bottomCenter): uses progress that starts 1 frame earlier
  const verbProg = verbindingsAnimationProgress != null ? verbindingsAnimationProgress : animationProgress;
  const bottomCenterY = 17.36 * verbProg * 1.5; // vh - faster exit (250px @ 1440h)
  const verbindingsOpacity = Math.max(0, 1 - verbProg * 3.5);
  const verbindingsScale = 1 - (0.35 * verbProg);
  
  // Data Stream flies with its own delayed progress
  const dataStreamX = -9.77 * dataStreamProgress * 1.5;
  const dataStreamY = 13.89 * dataStreamProgress * 1.5;
  const dataStreamScale = 1 - (0.35 * dataStreamProgress);

  // Gardens flies with its own delayed progress
  const gardensScale = 1 - (0.35 * gardensProgress);
  
  const containerScale = 1 - (0.35 * animationProgress); // Shrink faster too
  
  // gardenforlife.nl container: uses delayed progress (2 frames later)
  const gardenProg = gardenAnimationProgress != null ? gardenAnimationProgress : animationProgress;
  const gardenOpacity = Math.max(0, 1 - gardenProg * 3.5);
  const gardenTopRightX = 9.77 * gardenProg * 1.5;
  const gardenTopRightY = -13.89 * gardenProg * 1.5;
  const gardenScale = 1 - (0.35 * gardenProg);

  // Language toggle element for TechContainer headerRight
  const langToggle = (
    <button
      onClick={toggleLanguage}
      style={{
        backgroundColor: 'transparent',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '4px',
        cursor: 'pointer',
        padding: '2px 6px',
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        transition: 'all 0.3s ease',
        filter: 'drop-shadow(0 0 0px rgba(139,90,43,0))'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(139,90,43,0.6))'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(139,90,43,0))'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
    >
      <span style={{ fontSize: 'max(9px, 0.5vw)', color: language === 'nl' ? '#f97316' : 'rgba(255,255,255,0.4)', fontWeight: language === 'nl' ? 'bold' : 'normal', transition: 'all 0.3s ease' }}>NL</span>
      <span style={{ fontSize: 'max(7px, 0.4vw)', color: 'rgba(255,255,255,0.3)' }}>|</span>
      <span style={{ fontSize: 'max(9px, 0.5vw)', color: language === 'en' ? '#f97316' : 'rgba(255,255,255,0.4)', fontWeight: language === 'en' ? 'bold' : 'normal', transition: 'all 0.3s ease' }}>EN</span>
    </button>
  );

  return (
    <>
      <style>{`
        @keyframes gflMsgPulse { 0%, 100% { opacity: 0.28; } 50% { opacity: 1; } }
        .gfl-eye-btn { position: relative; }
        .gfl-eye-btn::before {
          content: attr(data-label);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          color: rgba(255, 220, 160, 0);
          white-space: nowrap;
          pointer-events: none;
          font-weight: bold;
          letter-spacing: 0.05em;
          transition: color 0.3s ease;
          margin-bottom: 2px;
        }
        .gfl-eye-btn:hover::before { color: rgba(255, 220, 160, 0.9); }
        .gfl-blackhole-btn { position: relative; }
        .gfl-blackhole-btn::before {
          content: attr(data-label);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          color: rgba(255, 220, 160, 0);
          white-space: nowrap;
          pointer-events: none;
          font-weight: bold;
          letter-spacing: 0.05em;
          transition: color 0.3s ease;
          margin-bottom: 2px;
        }
        .gfl-blackhole-btn:hover::before { color: rgba(255, 220, 160, 0.9); }
      `}</style>
      {/* 1. Filosofie — client mode: a slim wide bar centered ABOVE the orb (replaces the top-left
          box). Visitor: the original top-left box. Header + one featured quote (content only). */}
      {clientMode ? (
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none"
        style={{
          top: 'calc(5vh + 3rem)',
          transform: `scale(${containerScale})`,
          opacity: mounted ? containerOpacity : 0,
        }}
      >
        {/* Only the visible bar captures clicks — the full-width flex wrapper stays pointer-events:none
            so its empty left/right areas don't sit over (and swallow clicks to) the header nav toggle. */}
        <div style={{ width: '37.8vw', maxWidth: '960px', pointerEvents: 'auto' }}>
          <TechContainer title={t('desktopLayout.filosofieTitle')} variant="purple" className="w-full" style={{ minHeight: '9.9vh', backgroundColor: 'rgba(1, 0, 2, 0.3)' }}>
            <div className="w-full h-full flex items-center justify-center" style={{ padding: '0.9vh 1.5vw', position: 'relative' }}>
              {/* Quote centered in the FULL container (ignores the absolutely-placed button). */}
              <p style={{
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontWeight: 600,
                color: 'rgb(196, 181, 253)',
                filter: 'brightness(0.9)',
                fontSize: 'max(9px, 0.85vw)',
                lineHeight: 1.2,
                letterSpacing: '0.05em',
                textAlign: 'center',
                margin: 0,
              }}>Voluntas amor, Elefthéros fati</p>
              {/* Button pinned bottom-right, out of the centering flow. */}
              <div style={{ position: 'absolute', right: '0.8vw', bottom: '0.6vh' }}>
                <SciFiButton variant="purple" size="sm" onClick={(e) => setActiveSection('filosofie', e)}>
                  {t('desktopLayout.learnMore')}
                </SciFiButton>
              </div>
            </div>
          </TechContainer>
        </div>
      </div>
      ) : (
      <div
        className="absolute pointer-events-auto"
        style={{
          top: windowWidth >= 768 && windowWidth < 1079 ? 'calc(15vh + 2.5rem - 2rem)' : windowWidth >= 1079 ? 'calc(15vh + 0.5rem + 0.5rem)' : 'calc(15vh + 2.5rem)',
          left: windowWidth >= 768 && windowWidth < 1079 ? 'calc(4.06vw - 1.5rem)' : 'calc(4.06vw - 2.5rem)',
          // Frame + content BOTH driven by vw → scale as one unit. minHeight (not height): the box
          // also GROWS to fit when the fonts hit their px floor on laptop-sized viewports, so the
          // container conforms to the size the text needs while keeping the vw dynamic sizing.
          minHeight: '20vw',
          width: '26vw',
          transform: `translate(${topLeftX}vw, ${topLeftY}vh) scale(${containerScale})`,
          opacity: mounted ? containerOpacity : 0
        }}
      >
        <TechContainer title={t('desktopLayout.filosofieTitle')} variant="purple" className="w-full h-full" style={{ backgroundColor: 'rgba(1, 0, 2, 0.3)' }}>
          <div className="w-full h-full flex flex-col items-center justify-between relative" style={{ padding: '0.8vw' }}>
            {/* Content wrapper */}
            <div style={{ display: 'contents' }}>
            {/* Header */}
            <div className="flex flex-col items-center w-full" style={{ gap: '0.4vw' }}>
              <h2 style={{
                fontSize: 'max(15px, 1.084vw)',
                color: 'rgb(196, 181, 253)',
                margin: 0,
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontWeight: 600,
                lineHeight: 0.9,
                filter: 'brightness(0.9)',
                textAlign: 'center',
                letterSpacing: '0.05em'
              }} dangerouslySetInnerHTML={{ __html: t('desktopLayout.filosofiePoem') }} />
              <div style={{ width: '2vw', height: '0.1vh', background: 'linear-gradient(to right, transparent, rgb(168, 85, 247), transparent)' }}></div>
            </div>

            {/* Content — laptop (<1800) drops the symbol + pulse bar; the header's division
                line stays as the only separator between quote and subtext. */}
            <div className="flex flex-col items-center justify-center flex-1" style={{ gap: '0.8vw' }}>
              {windowWidth >= 1800 && (
                <>
                  <Activity style={{ width: '3vw', height: '3vw', color: 'rgb(192, 132, 252)', flexShrink: 0 }} />
                  <div style={{ height: '0.1vh', width: '50%', backgroundColor: 'rgba(88, 28, 135, 0.5)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '33%', backgroundColor: 'rgb(192, 132, 252)' }} className="animate-pulse"></div>
                  </div>
                </>
              )}
              {/* Hide secondary text on tablet sizes (768px-1024px) */}
              <div style={{
                fontFamily: "'Figtree', sans-serif",
                fontWeight: 400,
                lineHeight: 1.5,
                color: '#FFFEF0',
                fontSize: 'max(13px, 0.7vw)',
                textAlign: 'center',
                display: windowWidth >= 768 && windowWidth < 1079 ? 'none' : 'block'
              }} dangerouslySetInnerHTML={{ __html: t('desktopLayout.filosofieSubtext') }} />
            </div>

            {/* Button */}
            {/* Filosofie is parked — its content moved into the hypercube. The path
                to that (now empty) map space is disabled until it's re-homed. */}
            <SciFiButton
              variant="purple"
              size="sm"
              disabled
              onClick={undefined}
              style={{ transform: 'scaleY(1.04)', marginTop: '0.4rem' }}
            >
              {t('desktopLayout.learnMore')}
            </SciFiButton>
            </div>{/* end content wrapper */}
          </div>
        </TechContainer>
      </div>
      )}

      {/* Visitor-only: a thin locked bar in the left column, between Filosofie and Data Stream.
          Two sections — Winkel + Contacten — both locked (unlock in the client interface). */}
      {!clientMode && (
      <div
        className="absolute pointer-events-auto"
        style={{
          top: '59.67vh',
          left: windowWidth >= 768 && windowWidth < 1079 ? '5vw' : '4.37vw',
          width: '26vw',
          // vh governs on normal/tall viewports (conformal with the others); on SHORT viewports the
          // vw floor keeps the thin bar proportional to its 26vw width. The floor also stays above
          // TechContainer's fixed vertical overhead (~2.8vw) + the lock (1.1vw) so content never spills.
          height: 'max(7.5vh, 4.2vw)',
          transform: `translate(${topLeftX}vw, ${topLeftY}vh) scale(${containerScale})`,
          opacity: mounted ? containerOpacity : 0,
          zIndex: 20,
        }}
      >
        <TechContainer title="Markt" variant="purple" className="w-full h-full" style={{ backgroundColor: 'rgba(1, 0, 2, 0.3)' }}>
          <div className="w-full h-full flex" style={{ padding: '0 0.3vw', overflow: 'hidden' }}>
            {[{ label: 'Winkel' }, { label: 'Contacten' }].map((s, idx) => (
              <React.Fragment key={s.label}>
                {idx === 1 && <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255, 255, 255, 0.1)' }} />}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5vw', padding: '0.1vh 0.4vw' }}>
                  <Lock style={{ width: '1.1vw', height: '1.1vw', color: '#f59e0b', flexShrink: 0 }} strokeWidth={1.5} />
                  <span style={{ fontFamily: "'Figtree', sans-serif", color: 'rgba(245, 158, 11, 0.85)', fontSize: 'max(10px, 0.62vw)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </TechContainer>
      </div>
      )}

      {/* Client-mode: Winkel on the OLD Filosofie spot (top-left). Kook-eiland used to stack
          below it here, but it's now a standalone container (further down) so it holds position
          + scales cleanly like the top-right box. Wrapper is pointer-transparent; only the
          Winkel slot captures clicks (its empty lower area must not swallow clicks). */}
      {clientMode && (
      <div
        className="absolute pointer-events-none"
        style={{
          // rem offsets converted to vh/vw @2560×1440 (1rem=16px → 1.11vh / 0.63vw) so the
          // cluster — and the Winkel↔Kook gap inside it — scales WITH the viewport instead
          // of carrying a fixed px component that freezes the spacing.
          top: windowWidth >= 768 && windowWidth < 1079 ? '15.56vh' : windowWidth >= 1079 ? '16.11vh' : '17.78vh',
          left: windowWidth >= 768 && windowWidth < 1079 ? '3.12vw' : '2.5vw',
          width: '26vw',
          height: '32.5vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5vh',
          transform: `translate(${topLeftX}vw, ${topLeftY}vh) scale(${containerScale})`,
          opacity: mounted ? containerOpacity : 0,
        }}
      >
        {/* Winkel — an empty product template (image + description + price). Height +50% (grows on
            the bottom, since it's top-anchored by the transform); the image flexes to fill it. */}
        <div style={{ width: '85%', height: '22.28vh', flexShrink: 0, pointerEvents: 'auto', transform: 'translate(1vw, 4.56vh)' /* was calc(9vh - 4rem) — 4rem=4.44vh @1440 */ }}>
          <TechContainer title="Winkel" variant="purple" className="w-full h-full" style={{ backgroundColor: 'rgba(1, 0, 2, 0.3)' }}>
            <div className="w-full h-full flex flex-col" style={{ gap: '0.5vw', padding: '0.6vw' }}>
              {/* Image (left) + text (right) — fills the space above the price/action row */}
              <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '0.6vw' }}>
                {/* Product image placeholder — left, forced square (height fills the row, width = height) */}
                <div style={{ flexShrink: 0, alignSelf: 'stretch', aspectRatio: '1 / 1', borderRadius: '0.4rem', border: '1px dashed rgba(192,132,252,0.4)', background: 'rgba(192,132,252,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag style={{ width: '2.2vw', height: '2.2vw', color: 'rgba(192,132,252,0.5)' }} strokeWidth={1.5} />
                </div>
                {/* Description — right */}
                <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                  <div style={{ fontFamily: "'Figtree', sans-serif", color: '#FFFEF0', fontSize: 'max(13px, 0.7vw)', lineHeight: 1.4 }}>Productnaam — korte beschrijving…</div>
                </div>
              </div>
              {/* Price + action (stays) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5vw' }}>
                <span style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", color: '#22c55e', fontSize: 'max(11px, 0.62vw)', fontWeight: 700 }}>€ 0,00</span>
                <SciFiButton variant="purple" size="sm" onClick={() => setActiveSection('winkel')}>Bekijk winkel</SciFiButton>
              </div>
            </div>
          </TechContainer>
        </div>
      </div>
      )}

      {/* Client-mode: Kook-eiland — standalone container (swapped in from the top-right box).
          Uses the SAME viewport-scaling technique as the top-right box: a clean vw/vh anchor +
          translate·scale (left cluster's fly-in vars), so it holds position and scales uniformly
          instead of drifting off the flex chain it used to sit on. Size kept (22.1vw × 19.22vh). */}
      {clientMode && (
      <div
        className="absolute pointer-events-auto"
        style={{
          // +1.67vh = 1.5rem @1440 (rem→vh convention, see the Winkel cluster note above)
          top: windowWidth >= 768 && windowWidth < 1079 ? '48.45vh' : '49vh',
          left: windowWidth >= 768 && windowWidth < 1079 ? '6.62vw' : '6vw',
          width: '22.1vw',
          height: '19.22vh',
          transform: `translate(${topLeftX}vw, ${topLeftY}vh) scale(${containerScale})`,
          opacity: mounted ? containerOpacity : 0,
        }}
      >
        <TechContainer title={t('desktopLayout.kitchen')} variant="purple" className="w-full h-full" style={{ backgroundColor: 'rgba(1, 0, 2, 0.3)' }}>
          <div className="w-full h-full flex flex-col items-center justify-center gap-0 relative overflow-visible">
            {/* Client: unlocked — opens the Kook-eiland map section (far top-right) */}
            <SciFiButton
              color="#a5f3fc"
              rgb="34, 211, 238"
              size="sm"
              onClick={(e) => setActiveSection('kook', e)}
            >
              Openen
            </SciFiButton>
          </div>
        </TechContainer>
      </div>
      )}


      {/* 3. Top Right - Garden For Life Website */}
      <div 
        className="absolute pointer-events-auto"
        style={{
          top: '12.09vh',
          right: windowWidth >= 768 && windowWidth < 1079 ? 'calc(3.7vw + 2rem)' : windowWidth >= 1079 ? 'calc(3.7vw + 1.5rem + 1rem + 3rem)' : '3.7vw',
          width: '19.01vw',
          height: '21.13vh',
          transform: `translate(${gardenTopRightX}vw, ${gardenTopRightY}vh) scale(${gardenScale})`,
          opacity: mounted ? gardenOpacity : 0
        }}
      >
        {clientMode ? (
        /* Swapped: in the client interface this top-right box now holds Contacten
           (title + content). Kook-eiland moved to the top-left stack. Non-client keeps
           the locked Kook-eiland below. Container size/position unchanged. */
        <TechContainer title="Contacten" variant="purple" className="w-full h-full" style={{ backgroundColor: 'rgba(1, 0, 2, 0.3)' }}>
          <div className="w-full h-full flex flex-col" style={{ padding: '0.5vw' }}>

            {/* Content row — the three sections get the full height (buttons sit below) */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>

              {/* Left — Berichten: message headers, each with a slow green-flashing icon */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '0 0.6vw', overflow: 'hidden' }}>
                <div style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontSize: 'max(8px, 0.42vw)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(192, 132, 252, 0.7)', marginBottom: '0.5vh' }}>Berichten</div>
                {messages.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4vh', overflowY: 'auto', minHeight: 0 }}>
                    {messages.map((m, i) => (
                      <div key={m.id || i} style={{ display: 'flex', alignItems: 'center', gap: '0.45vw' }}>
                        {/* Unread → slow green flash; read → static dim dot */}
                        <span style={{ width: 'max(6px, 0.5vw)', height: 'max(6px, 0.5vw)', flexShrink: 0, borderRadius: '50%', background: m.read ? 'rgba(21, 179, 21, 0.3)' : 'rgba(21, 179, 21, 0.9)', boxShadow: m.read ? 'none' : '0 0 6px rgba(21, 179, 21, 0.7)', animation: m.read ? 'none' : 'gflMsgPulse 2.4s ease-in-out infinite' }} />
                        <span style={{ fontFamily: "'Figtree', sans-serif", color: '#FFFEF0', fontSize: 'max(13px, 0.7vw)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.header || m.title || m.subject}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontFamily: "'Figtree', sans-serif", color: '#FFFEF0', fontSize: 'max(13px, 0.7vw)' }}>Geen berichten</span>
                )}
              </div>

              <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255, 255, 255, 0.1)' }} />

              {/* Middle — Contactlijst: scrollable preview; a name routes to that contact (full list in the overlay) */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '0 0.6vw', overflow: 'hidden' }}>
                <div style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontSize: 'max(8px, 0.42vw)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(192, 132, 252, 0.7)', marginBottom: '0.5vh' }}>Contactlijst</div>
                {contacts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15vh', overflowY: 'auto', minHeight: 0 }}>
                    {contacts.map((c, i) => (
                      <button
                        key={c.id || i}
                        onClick={() => openContact(c)}
                        style={{ textAlign: 'left', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2vh 0.35vw', borderRadius: '0.2rem', fontFamily: "'Figtree', sans-serif", color: '#FFFEF0', fontSize: 'max(13px, 0.7vw)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                      >
                        {c.name || c.company || c.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontFamily: "'Figtree', sans-serif", color: '#FFFEF0', fontSize: 'max(13px, 0.7vw)' }}>Geen contacten</span>
                )}
              </div>

              <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255, 255, 255, 0.1)' }} />

              {/* Right — Versturen: inline compose. Name card suggests contacts (no overlay),
                  title card enlarges to read the full onderwerp, text card opens the larger editor.
                  None of the three dims the screen. */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '0 0.6vw', overflow: 'hidden' }}>
                <div style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontSize: 'max(8px, 0.42vw)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(192, 132, 252, 0.7)', marginBottom: '0.5vh' }}>Versturen</div>
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.5vh' }}>
                  {/* Name card — free text with contact-name suggestions below */}
                  <input
                    ref={toInputRef}
                    value={compose.to}
                    onChange={(e) => { setCompose((c) => ({ ...c, to: e.target.value })); setNameOpen(true); }}
                    onFocus={(e) => { ovFocus(e); setNameOpen(true); }}
                    onBlur={(e) => { ovBlur(e); setTimeout(() => setNameOpen(false), 120); }}
                    placeholder="Aan"
                    style={{ width: '100%', flexShrink: 0, background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '0.15rem', color: '#FFFEF0', fontFamily: "'Figtree', sans-serif", fontSize: 'max(13px, 0.7vw)', padding: '0.5vh 0.4vw', outline: 'none', boxShadow: 'none' }}
                  />
                  {/* Title card — enlarges (popover below) to read the full onderwerp */}
                  <input
                    ref={titleInputRef}
                    value={compose.title}
                    onChange={(e) => setCompose((c) => ({ ...c, title: e.target.value }))}
                    onFocus={(e) => { ovFocus(e); setTitleOpen(true); }}
                    onBlur={(e) => { ovBlur(e); setTitleOpen(false); }}
                    placeholder="Onderwerp"
                    style={{ width: '100%', flexShrink: 0, background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '0.15rem', color: '#FFFEF0', fontFamily: "'Figtree', sans-serif", fontSize: 'max(13px, 0.7vw)', padding: '0.5vh 0.4vw', outline: 'none', boxShadow: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  />
                  {/* Text card — opens the larger editor overlay */}
                  <button
                    onClick={() => setComposeBodyOpen(true)}
                    style={{ flex: 1, minHeight: 0, textAlign: 'left', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '0.15rem', cursor: 'pointer', color: compose.body ? '#FFFEF0' : 'rgba(255, 254, 240, 0.4)', fontFamily: "'Figtree', sans-serif", fontSize: 'max(13px, 0.7vw)', padding: '0.5vh 0.4vw', overflow: 'hidden', whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.6)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)'; }}
                  >
                    {compose.body || 'Bericht…'}
                  </button>
                </div>
                {/* Contact-name suggestions — portalled, no screen dim */}
                <AnchoredPopover anchorRef={toInputRef} open={nameOpen && nameSuggestions.length > 0} minWidth={140}>
                  {nameSuggestions.map((c, i) => (
                    <button
                      key={c.id || i}
                      onMouseDown={(e) => { e.preventDefault(); setCompose((cc) => ({ ...cc, to: c.name || c.company || c.label })); setNameOpen(false); }}
                      style={{ display: 'block', textAlign: 'left', width: '100%', border: 'none', borderBottom: '1px solid rgba(168, 85, 247, 0.12)', background: 'transparent', cursor: 'pointer', padding: '0.9vh 0.9vw', fontFamily: "'Figtree', sans-serif", fontSize: 'max(10px, 0.58vw)', color: '#FFFEF0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.16)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {c.name || c.company || c.label}
                    </button>
                  ))}
                </AnchoredPopover>
                {/* Enlarged onderwerp read-out — portalled, no screen dim */}
                <AnchoredPopover anchorRef={titleInputRef} open={titleOpen && !!compose.title} minWidth={200}>
                  <div style={{ padding: '1vh 1vw', fontFamily: "'Figtree', sans-serif", fontSize: 'max(12px, 0.72vw)', color: '#FFFEF0', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{compose.title}</div>
                </AnchoredPopover>
              </div>
            </div>

            {/* Button row — Berichten/Openen open a full panel; Versturen sends the inline draft */}
            <div style={{ display: 'flex', marginTop: '0.6vh' }}>
              <div style={{ flex: 1, minWidth: 0, padding: '0 0.6vw' }}>{renderSectionBtn('Berichten', () => setContactenOverlay('berichten'))}</div>
              <div style={{ width: '1px' }} />
              <div style={{ flex: 1, minWidth: 0, padding: '0 0.6vw' }}>{renderSectionBtn('Openen', () => setContactenOverlay('contactlijst'))}</div>
              <div style={{ width: '1px' }} />
              <div style={{ flex: 1, minWidth: 0, padding: '0 0.6vw' }}>{renderSectionBtn('Versturen', () => sendMessage())}</div>
            </div>
            {composeMsg && (
              <div style={{ marginTop: '0.4vh', textAlign: 'center', fontFamily: "'Figtree', sans-serif", fontSize: 'max(9px, 0.5vw)', color: composeMsg.includes('✓') ? '#4ade80' : '#f87171' }}>{composeMsg}</div>
            )}
          </div>
        </TechContainer>
        ) : (
        <TechContainer title={t('desktopLayout.kitchen')} variant="purple" className="w-full h-full">
          <div className="w-full h-full flex flex-col items-center justify-center gap-0 relative overflow-visible">
            {/* Lock Icon Overlay — non-client interface (Kook-eiland locked) */}
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
              <div className="flex flex-col items-center" style={{ gap: '0.5vw' }}>
                <Lock style={{ width: '2.25vw', height: '2.25vw', color: '#f59e0b' }} strokeWidth={1.5} />
                <span style={{
                  fontFamily: "'Figtree', sans-serif",
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: 'rgba(245, 158, 11, 0.8)',
                  fontSize: 'max(9px, 0.5vw)',
                  letterSpacing: '0.05em'
                }}>{t('desktopLayout.locked')}</span>
              </div>
            </div>
          </div>
        </TechContainer>
        )}
      </div>

      {/* Contacten overlays — portalled glass panels over the page, one per card section (each sized differently). */}
      {clientMode && contactenOverlay === 'berichten' && (
        <ContactenOverlay title="Berichten" onClose={() => setContactenOverlay(null)} width="62vw" height="66vh" dim={false}>
          {/* DM / email catalog — thread list on the left, the open message on the right */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
            <div style={{ width: '34%', minWidth: 0, borderRight: '1px solid rgba(168, 85, 247, 0.2)', overflowY: 'auto' }}>
              {messages.length > 0 ? messages.map((m, i) => {
                const active = openMsgIdx === i;
                return (
                  <button key={m.id || i} onClick={() => openMessage(i)}
                    style={{ display: 'block', textAlign: 'left', width: '100%', border: 'none', borderBottom: '1px solid rgba(168, 85, 247, 0.12)', cursor: 'pointer', padding: '1.1vh 1vw', background: active ? 'rgba(168, 85, 247, 0.16)' : 'transparent', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontSize: 'max(9px, 0.5vw)', letterSpacing: '0.06em', color: 'rgb(216, 190, 254)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.from || m.sender || 'Onbekend'}</div>
                    <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'max(10px, 0.58vw)', color: '#FFFEF0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.3vh' }}>{m.header || m.title || m.subject || '(geen onderwerp)'}</div>
                  </button>
                );
              }) : (
                <div style={{ padding: '2vh 1vw', fontFamily: "'Figtree', sans-serif", color: 'rgba(255, 254, 240, 0.4)', fontSize: 'max(10px, 0.6vw)' }}>Geen berichten</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, padding: '2vh 1.6vw', overflowY: 'auto' }}>
              {openMsgIdx != null && messages[openMsgIdx] ? (
                <>
                  <div style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontSize: 'max(12px, 0.8vw)', letterSpacing: '0.08em', color: 'rgb(216, 190, 254)', marginBottom: '0.6vh' }}>{messages[openMsgIdx].header || messages[openMsgIdx].title || messages[openMsgIdx].subject || '(geen onderwerp)'}</div>
                  <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'max(9px, 0.52vw)', color: 'rgba(255, 254, 240, 0.5)', marginBottom: '1.6vh' }}>{messages[openMsgIdx].from || messages[openMsgIdx].sender || 'Onbekend'}</div>
                  <div style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'max(11px, 0.62vw)', color: '#FFFEF0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{messages[openMsgIdx].body || messages[openMsgIdx].text || messages[openMsgIdx].content || ''}</div>
                </>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Figtree', sans-serif", color: 'rgba(255, 254, 240, 0.35)', fontSize: 'max(11px, 0.62vw)' }}>Selecteer een bericht</div>
              )}
            </div>
          </div>
        </ContactenOverlay>
      )}
      {clientMode && contactenOverlay === 'contactlijst' && (
        <ContactenOverlay title="Contactlijst" onClose={() => setContactenOverlay(null)} width="44vw" height="62vh" dim={false}>
          {/* Full list in view — a row routes to that contact's profile, or their page if they deliver a product/service */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1vh 0' }}>
            {contacts.length > 0 ? contacts.map((c, i) => {
              const dest = (c.type === 'company' || c.type === 'service' || c.type === 'product') ? 'Pagina' : 'Profiel';
              return (
                <button key={c.id || i} onClick={() => openContact(c)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1vw', textAlign: 'left', width: '100%', border: 'none', borderBottom: '1px solid rgba(168, 85, 247, 0.12)', cursor: 'pointer', background: 'transparent', padding: '1.2vh 1.6vw', transition: 'background 0.15s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: 'max(11px, 0.64vw)', color: '#FFFEF0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name || c.company || c.label}</span>
                  <span style={{ flexShrink: 0, fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif", fontSize: 'max(8px, 0.45vw)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(192, 132, 252, 0.7)' }}>{dest} →</span>
                </button>
              );
            }) : (
              <div style={{ padding: '2vh 1.6vw', fontFamily: "'Figtree', sans-serif", color: 'rgba(255, 254, 240, 0.4)', fontSize: 'max(11px, 0.62vw)' }}>Geen contacten</div>
            )}
          </div>
        </ContactenOverlay>
      )}
      {clientMode && composeBodyOpen && (
        // The text card's editor — a larger modal, but NON-dimming (dim={false}), "Gereed" to close back.
        <ContactenOverlay title="Bericht" onClose={() => setComposeBodyOpen(false)} width="52vw" height="62vh" closeLabel="Gereed" dim={false}>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', padding: '2vh 1.6vw' }}>
            <textarea autoFocus value={compose.body} onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))} onFocus={ovFocus} onBlur={ovBlur} placeholder="Schrijf hier je bericht…"
              style={{ ...OV_FIELD, flex: 1, resize: 'none', lineHeight: 1.6 }} />
          </div>
        </ContactenOverlay>
      )}

      {/* 4. Center Right/Bottom - Gardens Slideshow */}
      <div 
        className="absolute pointer-events-auto"
        style={{
          bottom: '15vh',
          right: '3.56vw',
          width: '22.88vw',
          height: windowWidth >= 768 && windowWidth < 1079 ? 'calc(29.5vh * 1.3)' : 'calc(39vh * 1.2)',
          transform: `translate(${bottomRightX}vw, ${bottomRightY}vh) scale(${gardensScale})`,
          opacity: mounted ? gardensOpacity : 0
        }}
      >
        <TechContainer title={t('desktopLayout.gardensTitle')} variant="purple" className="w-full h-full">
          {(() => {
            const gardenPrompt = t('desktopLayout.gardenConnectPrompt');
            const gardensData = [
              { id: 'green',  name: t('desktopLayout.businessTypes.green'),  description: gardenPrompt, color: '#22c55e', rgb: '34, 197, 94' },
              { id: 'blue',   name: t('desktopLayout.businessTypes.blue'),   description: gardenPrompt, color: '#3b82f6', rgb: '59, 130, 246' },
              { id: 'purple', name: t('desktopLayout.businessTypes.purple'), description: gardenPrompt, color: '#a855f7', rgb: '168, 85, 247' },
              { id: 'red',    name: t('desktopLayout.businessTypes.red'),    description: gardenPrompt, color: '#ef4444', rgb: '239, 68, 68' },
              { id: 'orange', name: t('desktopLayout.businessTypes.orange'), description: gardenPrompt, color: '#f97316', rgb: '249, 115, 22' },
            ];
            return (
              <div className="w-full h-full flex flex-col items-center justify-between relative" style={{ padding: '1vw' }}>
                {/* Slideshow Area - Touch swipable */}
                <div 
                  className="w-full relative overflow-hidden rounded-sm border border-purple-500/20" 
                  style={{ 
                    height: 'calc(100% - 2.5vw)', 
                    marginBottom: '0.5vw',
                    touchAction: 'pan-y',
                    visibility: 'visible',
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {gardensData.map((garden, i) => {
                    // Always-right infinite: active=0, previous=−100 (exits left), rest=+100 (wait right)
                    let translateX = 100;
                    if (i === currentSlide) translateX = 0;
                    else if (i === prevSlideRef.current) translateX = -100;
                    return (
                      <div
                        key={garden.id}
                        className={`absolute inset-0 transition-all duration-500 ${i === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0'}`}
                        style={{ transform: `translateX(${translateX}%)` }}
                      >
                        {/* Circle placeholder (logo area) */}
                        <div className="w-full flex flex-col items-center justify-center" style={{
                          height: windowWidth >= 1079 ? '70%' : '70%'
                        }}>
                          <div style={{
                            width: 'max(52px, 5.5vw)',
                            height: 'max(52px, 5.5vw)',
                            borderRadius: '50%',
                            border: `1px solid rgba(${garden.rgb}, 0.5)`,
                            background: `rgba(${garden.rgb}, 0.12)`,
                            boxShadow: `0 0 16px rgba(${garden.rgb}, 0.25)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.5vw',
                          }}>
                            <span style={{
                              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                              fontSize: 'max(7px, 0.38vw)',
                              color: `rgba(${garden.rgb}, 0.6)`,
                              letterSpacing: '0.12em',
                              fontWeight: 700,
                            }}>LOGO</span>
                          </div>
                        </div>

                        {/* Header */}
                        <div className="text-center absolute" style={{
                          top: windowWidth >= 1280 ? '70%' : 'auto',
                          bottom: windowWidth >= 1079 && windowWidth < 1280 ? '6.5vw' : windowWidth >= 768 && windowWidth < 1079 ? '-0.5vw' : 'auto',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          paddingBottom: '0.4vw',
                          marginTop: windowWidth >= 1280 ? '-2rem' : '0',
                          zIndex: 10,
                          display: windowWidth < 768 ? 'none' : 'block'
                        }}>
                          <div style={{
                            fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                            fontWeight: 700,
                            fontSize: 'max(11px, 0.62vw)',
                            color: garden.color,
                            letterSpacing: '0.15em',
                            marginBottom: '0.2vw',
                            whiteSpace: windowWidth >= 1079 ? 'nowrap' : 'normal',
                            maxWidth: windowWidth < 1079 ? '90%' : 'none',
                            textAlign: 'center',
                            opacity: 0.85,
                          }}>
                            {garden.name}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col items-center justify-center relative w-full" style={{
                          height: '30%',
                          padding: '0.4vw 0.8vw',
                          display: windowWidth >= 1079 ? 'flex' : 'none',
                          backgroundColor: 'transparent',
                          borderRadius: '0.2vw'
                        }}>
                          <span style={{
                            fontFamily: "'Figtree', sans-serif",
                            fontWeight: 400,
                            lineHeight: 1.5,
                            color: '#FFFEF0',
                            fontSize: 'max(13px, 0.7vw)',
                            textAlign: 'center',
                            padding: 0,
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {garden.description}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Circle Indicators with Arrow Navigation */}
                <div className="flex justify-center items-center relative" style={{ gap: '0.8vw', zIndex: 100, position: 'relative', visibility: 'visible' }}>
                  {/* Left Arrow */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (pauseAutoSlide) pauseAutoSlide();
                      setCurrentSlide(prev => (prev - 1 + gardensData.length) % gardensData.length);
                    }}
                    className="rounded transition-colors border border-purple-500 bg-transparent hover:border-purple-400 cursor-pointer z-50"
                    style={{ padding: '0.2vw' }}
                    title="Previous slide"
                  >
                    <ChevronLeft style={{ width: '1vw', height: '1vw', color: 'rgb(192, 132, 252)' }} className="pointer-events-none" />
                  </button>
                  
                  {/* Left Indicators */}
                  <div className="flex items-center" style={{ gap: '0.4vw' }}>
                    {gardensData.slice(0, 2).map((garden, i) => (
                      <div
                        key={garden.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pauseAutoSlide) pauseAutoSlide();
                          setCurrentSlide(i);
                        }}
                        className="cursor-pointer transition-all duration-300 z-50"
                        style={{
                          height: '0.15vw',
                          width: '0.5vw',
                          backgroundColor: i === currentSlide ? 'rgb(192, 132, 252)' : 'rgba(168, 85, 247, 0.3)'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Learn More Button */}
                  <SciFiButton
                    type="button"
                    color="#fbbf24"
                    rgb="245, 158, 11"
                    size="sm"
                    onClick={(e) => setActiveSection('gardens', e)}
                    style={{ position: 'relative', zIndex: 100, transform: 'scaleY(1.04)' }}
                  >
                    {t('desktopLayout.seeMore')}
                  </SciFiButton>
                  
                  {/* Right Indicators (only 2 — total 4 shown, hint there's more) */}
                  <div className="flex items-center" style={{ gap: '0.4vw' }}>
                    {gardensData.slice(2, 4).map((garden, i) => (
                      <div
                        key={garden.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pauseAutoSlide) pauseAutoSlide();
                          setCurrentSlide(i + 2);
                        }}
                        className="cursor-pointer transition-all duration-300 z-50"
                        style={{
                          height: '0.15vw',
                          width: '0.5vw',
                          backgroundColor: i + 2 === currentSlide ? 'rgb(192, 132, 252)' : 'rgba(168, 85, 247, 0.3)'
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Right Arrow */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (pauseAutoSlide) pauseAutoSlide();
                      setCurrentSlide(prev => (prev + 1) % gardensData.length);
                    }}
                    className="rounded transition-colors border border-purple-500 bg-transparent hover:border-purple-400 cursor-pointer z-50"
                    style={{ padding: '0.2vw' }}
                    title="Next slide"
                  >
                    <ChevronRight style={{ width: '1vw', height: '1vw', color: 'rgb(192, 132, 252)' }} className="pointer-events-none" />
                  </button>
                </div>
              </div>
            );
          })()} 
        </TechContainer>
      </div>

      {/* 4. Bottom Left - Data Stream */}
      <div 
        className="absolute pointer-events-auto"
        style={{
          // Laptop (768–1079) uses the EXACT same config as desktop (≥1079); only mobile (<768) differs.
          bottom: windowWidth >= 768 ? '7.11vh' : '11.56vh',
          left: '10.31vw',
          width: '15.84vw',
          // Desktop: fixed vw box → constant aspect, scales as one continuous unit (20vh@16:9 ≈ 11.25vw).
          // Below 1800 the center symbol hides, so the box hugs the remaining content instead
          // (header + description + button) — no fixed height propping open empty space.
          height: windowWidth >= 1800 ? '11.25vw' : 'auto',
          // Client interface: shrink the WHOLE component 20% (frame + icon + spacing). The text is
          // counter-scaled ×1.25 below so it nets back to its normal size. Anchored bottom-left so
          // it shrinks in place.
          transform: `translate(${dataStreamX}vw, ${dataStreamY}vh) scale(${dataStreamScale * (clientMode ? 0.8 : 1)})`,
          transformOrigin: clientMode ? 'left bottom' : undefined,
          opacity: mounted ? dataStreamOpacity : 0,
          zIndex: 30
        }}
      >
        <TechContainer title="DATA_STREAM" variant="cyan" className="w-full h-full">
          <div className="w-full h-full flex flex-col items-center justify-between relative" style={{ padding: '0.6vw' }}>
            {/* Content wrapper */}
            <div style={{ display: 'contents' }}>
            {/* Header */}
            <div className="flex flex-col items-center w-full" style={{ gap: '0.3vw' }}>
              <h2 style={{
                fontSize: clientMode ? 'calc(max(13px, 0.7vw) * 1.25)' : 'max(13px, 0.7vw)',
                color: 'rgb(165, 243, 252)',
                margin: 0,
                fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                fontWeight: 600,
                lineHeight: 0.9,
                filter: 'brightness(0.9)',
                textAlign: 'center',
                letterSpacing: '0.05em'
              }}>
                Matrix-Data
              </h2>
              <div style={{ width: '1.4vw', height: '0.1vh', background: 'linear-gradient(to right, transparent, rgb(34, 211, 238), transparent)' }}></div>
            </div>

            {/* Content — the center symbol (icon + pulse bar) is desktop-only decor; the white
                description hides on tablet (768–1079) so only the Matrix-Data header shows there. */}
            <div className="flex flex-col items-center justify-center flex-1" style={{ gap: '0.5vw' }}>
              {windowWidth >= 1800 && (
                <>
                  <Database style={{ width: '1.4vw', height: '1.4vw', color: 'rgb(165, 243, 252)', flexShrink: 0 }} />
                  <div style={{ height: '0.1vh', width: '50%', backgroundColor: 'rgba(34, 211, 238, 0.3)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '60%', backgroundColor: 'rgb(165, 243, 252)' }} className="animate-pulse"></div>
                  </div>
                </>
              )}
              {!(windowWidth >= 768 && windowWidth < 1079) && (
              <div style={{
                fontFamily: "'Figtree', sans-serif",
                fontWeight: 400,
                lineHeight: 1.5,
                color: '#FFFEF0',
                fontSize: clientMode ? 'calc(max(13px, 0.7vw) * 1.25)' : 'max(13px, 0.7vw)',
                textAlign: 'center'
              }}>
                <span dangerouslySetInnerHTML={{ __html: t('desktopLayout.dataStreamDescription') }} />
              </div>
              )}
            </div>

            {/* Button */}
            <SciFiButton
              color="#a5f3fc"
              rgb="34, 211, 238"
              size="sm"
              style={{ position: 'relative', zIndex: 100, transform: 'scaleY(1.04)', marginTop: '0.4rem' }}
              onClick={(e) => setActiveSection('monitor', e)}
            >
              {t('desktopLayout.research')}
            </SciFiButton>
            </div>{/* end content wrapper */}
          </div>
        </TechContainer>
      </div>

      {/* 5. Center Bottom - Status Strip */}
      <div 
        className="absolute left-0 right-0 flex justify-center pointer-events-none"
        style={{
          // Client interface sits 1.5rem higher than the visitor build.
          bottom: clientMode ? 'calc(5vh + 1.5rem)' : '5vh',
          transform: `translateY(${bottomCenterY}vh) scale(${verbindingsScale})`,
          opacity: mounted ? verbindingsOpacity : 0
        }}
      >
        {/* Desktop Build - 1325px+ */}
        {windowWidth >= 1325 && (
          <div style={{ width: '30vw', position: 'relative', zIndex: 10, transform: 'translateY(2rem)' }} className="pointer-events-auto">
            <TechContainer title={t('desktopLayout.connectionsMenu')} variant="purple" className="w-full h-full" style={{ height: '14.95vh' }} headerRight={langToggle}>
              <div className="w-full h-full flex items-center justify-around opacity-90 relative" style={{ padding: '0 1vw' }}>
                {/* Left: Logo - Button */}
                <button
                  className="gfl-eye-btn"
                  data-label={t('desktopLayout.identity')}
                  onClick={(e) => setActiveSection('menu', e)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    padding: 0,
                    filter: 'drop-shadow(0 0 0px rgba(139,90,43,0))',
                    opacity: 1
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(139,90,43,0.8))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(139,90,43,0))'; }}
                >
                  <img src={eyeLogo} alt="Logo" style={{ width: clientMode ? 'max(70px, 4.1vw)' : 'max(55px, 3vw)', height: 'auto' }} />
                </button>
                <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                {/* Center: Contact Info */}
                {renderContactCentre('max(13px, 0.7vw)')}
                <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                {/* Right: Login Button */}
                <div className="flex flex-col items-center justify-center gap-1" style={{ overflow: 'visible' }}>
                  <button
                    className="gfl-blackhole-btn"
                    data-label={t('desktopLayout.login')}
                    onClick={(e) => setActiveSection('login', e)}
                    style={{
                    padding: '0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 0 0px rgba(255,200,100,0))'
                  }} onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(255,200,100,0.6))';
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(255,200,100,0))';
                  }}>
                    {renderLoginIcon('max(70px, 4.1vw)')}
                  </button>
                </div>
              </div>
            </TechContainer>
          </div>
        )}

        {/* Laptop Build - 1100px to 1324px */}
        {windowWidth >= 1100 && windowWidth < 1325 && (
          <div style={{ width: '30vw', position: 'relative', zIndex: 10, transform: 'translateY(0.9rem)' }} className="pointer-events-auto">
            <TechContainer title={t('desktopLayout.connectionsMenu')} variant="purple" className="w-full h-full" style={{ height: '17.94vh' }} headerRight={langToggle}>
              <div className="w-full h-full flex items-center justify-around opacity-90 relative" style={{ padding: '0 1vw' }}>
                {/* Left: Logo - Button */}
                <button
                  className="gfl-eye-btn"
                  data-label={t('desktopLayout.identity')}
                  onClick={(e) => setActiveSection('menu', e)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    padding: 0,
                    filter: 'drop-shadow(0 0 0px rgba(139,90,43,0))',
                    opacity: 1
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(139,90,43,0.8))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(139,90,43,0))'; }}
                >
                  <img src={eyeLogo} alt="Logo" style={{ width: clientMode ? 'max(70px, 4.1vw)' : 'max(55px, 3vw)', height: 'auto' }} />
                </button>
                <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                {/* Center: Contact Info */}
                {renderContactCentre('max(13px, 0.7vw)')}
                <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                {/* Right: Login Button */}
                <div className="flex flex-col items-center justify-center gap-1" style={{ overflow: 'visible' }}>
                  <button
                    className="gfl-blackhole-btn"
                    data-label={t('desktopLayout.login')}
                    onClick={(e) => setActiveSection('login', e)}
                    style={{
                    padding: '0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 0 0px rgba(255,200,100,0))'
                  }} onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(255,200,100,0.6))';
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(255,200,100,0))';
                  }}>
                    {renderLoginIcon('max(70px, 4.1vw)')}
                  </button>
                </div>
              </div>
            </TechContainer>
          </div>
        )}

        {/* Tablet Build - 768px to 1099px */}
        {windowWidth >= 768 && windowWidth < 1100 && (
          <div style={{ width: '30vw', position: 'relative', zIndex: 10, transform: 'translateY(1rem)' }} className="pointer-events-auto">
            <TechContainer title={t('desktopLayout.connectionsMenu')} variant="purple" className="w-full h-full" style={{ height: '17.94vh' }} headerRight={langToggle}>
              <div className="w-full h-full flex items-center justify-evenly opacity-90 relative" style={{ padding: '0 0.5vw' }}>
                {/* Left: Logo - Button */}
                <button
                  className="gfl-eye-btn"
                  data-label={t('desktopLayout.identity')}
                  onClick={(e) => setActiveSection('menu', e)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    padding: 0,
                    filter: 'drop-shadow(0 0 0px rgba(139,90,43,0))',
                    opacity: 1
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(139,90,43,0.8))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(139,90,43,0))'; }}
                >
                  <img src={eyeLogo} alt="Logo" style={{ width: clientMode ? 'max(55px, 3.2vw)' : 'max(45px, 2.5vw)', height: 'auto' }} />
                </button>
                <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                {/* Center: Contact Info */}
                {renderContactCentre('max(11px, 0.6vw)')}
                <div style={{ height: '2vw', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                {/* Right: Login Button */}
                <div className="flex flex-col items-center justify-center gap-1" style={{ overflow: 'visible' }}>
                  <button
                    className="gfl-blackhole-btn"
                    data-label={t('desktopLayout.login')}
                    onClick={(e) => setActiveSection('login', e)}
                    style={{
                    padding: '0',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 0 0px rgba(255,200,100,0))'
                  }} onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(255,200,100,0.6))';
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 0px rgba(255,200,100,0))';
                  }}>
                    {renderLoginIcon('max(55px, 3.2vw)')}
                  </button>
                </div>
              </div>
            </TechContainer>
          </div>
        )}
      </div>

    </>
  );
};

export default React.memo(DesktopLayout);
