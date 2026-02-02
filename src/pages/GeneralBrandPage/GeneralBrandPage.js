import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Maximize2, 
  List, 
  X, 
  Mail, 
  Calendar, 
  User, 
  ShoppingBag, 
  Info, 
  ExternalLink, 
  ShieldCheck, 
  MapPin,
  Activity
} from 'lucide-react';
// Note: lucide-react provides icons - ensure it's installed or use alternatives

import { BRANDS } from './brandData';
import { 
  SectorFrame, 
  TabButton, 
  GlowButton, 
  TechBadge, 
  IconButton,
  Modal
} from './SciFiUI';
import BrandStats from './BrandStats';

// Instagram icon component (since lucide doesn't have Instagram)
const Instagram = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

// Linkedin icon component
const Linkedin = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

/**
 * NavWheel - Rotating navigation wheel for brand selection
 */
const NavWheel = ({ brands, virtualIndex, onUpdateIndex, onBack }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const wheelRef = useRef(null);
  
  // Wheel Configuration - Original aistudios values
  const wheelSize = 900; 
  const radius = wheelSize / 2; // 450px
  const placementRadius = radius * 0.85; // 382.5px - logos placed 15% inward
  const bottomOffset = -690; // Shows only ~210px of wheel = ~3 logos visible

  // Calculate continuous rotation
  const rotation = -virtualIndex * (360 / brands.length);
  
  // Handle direct click (shortest path logic)
  const handleItemClick = (targetIndex) => {
    const currentMod = ((virtualIndex % brands.length) + brands.length) % brands.length;
    let diff = targetIndex - currentMod;
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;
    onUpdateIndex(virtualIndex + diff);
  };

  // Scoped Wheel Event Listener
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      onUpdateIndex(virtualIndex + direction);
    };

    const el = wheelRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (el) el.removeEventListener('wheel', handleWheel);
    };
  }, [virtualIndex, onUpdateIndex]);

  return (
    <>
      {/* EXPANDED LIST VIEW OVERLAY */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-50 p-8 pt-12 flex items-center overflow-x-auto gap-4 transition-all duration-500 backdrop-blur-xl border-t ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
        style={{ 
          height: '300px',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderColor: 'rgba(255, 174, 0, 0.5)'
        }}
      >
        {brands.map((brand, i) => (
          <button 
            key={brand.id}
            onClick={() => { handleItemClick(i); setIsExpanded(false); }}
            className="flex-shrink-0 h-full border rounded relative group overflow-hidden text-left transition-all duration-300"
            style={{
              width: '160px',
              borderColor: i === ((virtualIndex % brands.length) + brands.length) % brands.length 
                ? '#ffae00' 
                : 'rgba(255, 255, 255, 0.1)',
              backgroundColor: i === ((virtualIndex % brands.length) + brands.length) % brands.length 
                ? 'rgba(255, 174, 0, 0.1)' 
                : 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <img src={brand.heroImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" alt="" />
            <div className="absolute inset-0 p-4 flex flex-col">
              <span className="text-xl font-mono font-bold text-white/20">{brand.id}</span>
              <div className="mt-auto">
                <div className="text-xs uppercase tracking-wider" style={{ color: '#ffae00', fontSize: '9px' }}>Unit {brand.id}</div>
                <div className="text-xs font-bold text-white truncate">{brand.name}</div>
              </div>
            </div>
          </button>
        ))}
        <button 
          onClick={() => setIsExpanded(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-amber-400"
        >
          <X />
        </button>
      </div>

      {/* ROTATING WHEEL CONTAINER - Perfectly centered */}
      <div 
        ref={wheelRef}
        className={`fixed z-40 pointer-events-auto transition-opacity duration-300 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          width: `${wheelSize}px`,
          height: `${wheelSize}px`,
          bottom: `${bottomOffset}px`,
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        {/* Main Background & Outer Static Orange Border - Semi-transparent */}
        <div 
          className="absolute inset-0 rounded-full backdrop-blur-sm pointer-events-none"
          style={{ 
            border: '2px solid rgba(255, 174, 0, 0.6)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)'
          }}
        ></div>

        {/* Intermittent Purple Border (Close Inside) - Semi-transparent */}
        <div 
          className="absolute inset-2 rounded-full border-2 border-dashed pointer-events-none"
          style={{ 
            borderColor: 'rgba(188, 19, 254, 0.25)',
            animation: 'spin 60s linear infinite'
          }}
        ></div>

        {/* Faint Inner Ring */}
        <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none"></div>

        {/* Rotating Ring Container */}
        <div 
          className="absolute inset-0 rounded-full transition-transform duration-500"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {brands.map((brand, i) => {
            const angle = i * (360 / brands.length);
            const currentIndex = ((virtualIndex % brands.length) + brands.length) % brands.length;
            const isActive = i === currentIndex;
            
            // Brand-specific styling for wrapper
            let logoScale = 1;
            let wrapperTranslate = 0;
            
            if (i === 0) logoScale = 0.8; // Karman
            if (i === 1) logoScale = 0.8; // Code49
            if (i === 2) wrapperTranslate = -16; // Eleven Eleven - move up 1rem (16px)
            if (i === 3) logoScale = 0.85; // Rengi
            
            return (
              <div 
                key={brand.id}
                className="absolute top-1/2 left-1/2 w-0 h-0"
                style={{ 
                  transform: `rotate(${angle}deg) translateY(-${placementRadius}px)`
                }}
              >
                <div className="absolute -top-12 -left-12 w-24 h-24">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleItemClick(i); }}
                    className={`w-full h-full flex items-center justify-center transition-all duration-300 relative border-0`}
                    style={{ 
                      border: 'none',
                      borderRadius: '50%',
                      backgroundColor: 'transparent',
                      boxShadow: isActive ? '0 0 20px rgba(255, 174, 0, 0.8)' : 'none',
                      opacity: isActive ? 1 : 0.5,
                      filter: isActive ? 'none' : 'grayscale(100%)',
                      transform: `rotate(${-angle - rotation}deg) scale(${isActive ? 1.2 : 1})`,
                      zIndex: isActive ? 10 : 1,
                      overflow: 'visible'
                    }}
                  >
                    <div 
                      className="w-full h-full flex items-center justify-center rounded-full"
                      style={{ 
                        transform: `scale(${logoScale}) translateY(${wrapperTranslate}px)`,
                        transformOrigin: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      <img src={brand.logoUrl} alt={brand.id} className="w-full h-full object-contain" style={{ backgroundColor: 'transparent' }} />
                    </div>
                    {isActive && (
                      <div 
                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs font-mono whitespace-nowrap rounded"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 174, 0, 0.5)',
                          color: '#ffae00',
                          fontSize: '8px'
                        }}
                      >
                        UNIT {brand.id}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RETURN BUTTON - Left side of hub button */}
      <button
        onClick={() => onBack()}
        className={`fixed z-50 flex items-center justify-center transition-all duration-300 border-0 outline-none gap-2 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          backgroundColor: 'transparent',
          bottom: 'calc(21px - 0.2rem)',
          left: 'calc(50% - 130px)',
          color: '#ffae00',
          fontSize: '12px',
          fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
          fontWeight: 'bold',
          letterSpacing: '0.1em'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ffc955';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#ffae00';
        }}
        title="Terug"
      >
        <ChevronLeft size={16} />
        <span>TERUG</span>
      </button>

      {/* SCROLL BUTTON - Right side of hub button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed z-50 flex items-center justify-center transition-all duration-300 border-0 outline-none gap-2 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          backgroundColor: 'transparent',
          bottom: 'calc(21px - 0.2rem)',
          right: 'calc(50% - 142px)',
          color: '#ffae00',
          fontSize: '12px',
          fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
          fontWeight: 'bold',
          letterSpacing: '0.1em'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ffc955';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#ffae00';
        }}
        title="Scroll to top"
      >
        <span>SCROLL</span>
        <ChevronUp size={16} />
      </button>

      {/* STATIC HUB BUTTON - Simple centered orange button, no rings, no border */}
      <button
        onClick={() => setIsExpanded(true)}
        className={`fixed z-50 rounded-full flex items-center justify-center transition-all duration-300 border-0 outline-none ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          width: '74px',
          height: '74px',
          backgroundColor: '#ffae00',
          boxShadow: '0 0 30px rgba(255, 174, 0, 0.5)',
          bottom: '-16px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 50px rgba(255, 174, 0, 0.7)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 174, 0, 0.5)';
        }}
      >
        <List className="text-black w-8 h-8" />
      </button>
    </>
  );
};

/**
 * Slideshow - Media gallery with image/video support
 */
const Slideshow = ({ items }) => {
  const [idx, setIdx] = useState(0);
  const next = () => setIdx(prev => (prev + 1) % items.length);
  const prev = () => setIdx(prev => (prev - 1 + items.length) % items.length);
  
  const currentItem = items[idx];

  return (
    <div className="relative w-full h-full group overflow-hidden bg-black rounded-sm">
      {currentItem.type === 'video' ? (
        <video 
          src={currentItem.url} 
          className="w-full h-full object-cover opacity-80 transition-opacity duration-500"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <img 
          src={currentItem.url} 
          alt={currentItem.title} 
          className="w-full h-full object-cover opacity-80 transition-opacity duration-500" 
        />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 pointer-events-none"></div>
      
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
        <div className="flex justify-between items-end mb-2">
          <div 
            className="text-xs font-mono uppercase mb-1"
            style={{ color: '#ffae00', fontSize: '10px' }}
          >
            Live Feed // {currentItem.type === 'video' ? 'VID' : 'IMG'}
          </div>
          <div className="flex gap-1">
            {items.map((_, i) => (
              <div 
                key={i} 
                className="h-1 w-4 rounded-full transition-colors"
                style={{ backgroundColor: i === idx ? '#ffae00' : 'rgba(255, 255, 255, 0.2)' }}
              ></div>
            ))}
          </div>
        </div>
        <div className="text-sm font-bold text-white uppercase tracking-wider">{currentItem.title}</div>
      </div>

      <button 
        onClick={prev} 
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-amber-400 transition-colors pointer-events-auto"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 174, 0, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <ChevronLeft/>
      </button>
      <button 
        onClick={next} 
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-amber-400 transition-colors pointer-events-auto"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 174, 0, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <ChevronRight/>
      </button>
    </div>
  );
};

/**
 * GeneralBrandPage - Main brand detail page component
 * This is the base component for all 12 brand pages
 * Uses same fade transition pattern as FilosofiePage and other pages
 */
const GeneralBrandPage = React.memo(({ 
  isVisible, 
  onBack, 
  initialBrandIndex = 0,
  brandSlug = null // Optional: can specify brand by slug instead
}) => {
  // Use a virtual index for infinite scrolling
  const [virtualIndex, setVirtualIndex] = useState(1008 + initialBrandIndex);
  const [activeTab, setActiveTab] = useState('profile');
  const [showContactModal, setShowContactModal] = useState(false);
  const prevVisibleRef = useRef(false);
  
  // Sync virtualIndex ONLY when page transitions from hidden to visible
  // This captures the brand when user clicks "LEARN MORE" and keeps it static
  useEffect(() => {
    const wasHidden = !prevVisibleRef.current;
    const isNowVisible = isVisible;
    
    // Only sync when transitioning from hidden to visible
    if (wasHidden && isNowVisible) {
      setVirtualIndex(1008 + initialBrandIndex);
    }
    
    prevVisibleRef.current = isVisible;
  }, [isVisible, initialBrandIndex]);
  
  // Calculate actual brand index (0-11)
  const activeBrandIndex = ((virtualIndex % BRANDS.length) + BRANDS.length) % BRANDS.length;
  const brand = BRANDS[activeBrandIndex];

  // Smart rendering: full content when visible, placeholder when hidden
  return (
    <div 
      className="absolute inset-0 font-sans text-white"
      style={{ 
        opacity: 1, // Always in DOM for pre-load
      }}
    >
      {isVisible ? (
      <>
      {/* Main Content Area - No back button, logo.png is used as return */}
      <main className="fixed top-[12%] left-[5%] w-[90%] h-[75%] z-10 pointer-events-none">
        <div className="w-full h-full flex gap-6 pointer-events-auto relative z-10">

          {/* LEFT COLUMN: Identity & Tabs */}
          <div className="w-1/3 flex flex-col gap-4" style={{ height: '125%', transform: 'translateY(-7.5rem) translateX(-2%)', paddingTop: '0.84rem', paddingBottom: '0.36rem' }}>
            <SectorFrame>
              {/* Header */}
              <div className="flex gap-6 mb-6 border-b border-white/10 pb-6">
                <div className="min-w-0 flex flex-col justify-center gap-1">
                  <h2 
                    className="text-3xl font-bold uppercase tracking-wider text-white leading-tight truncate"
                    style={{ fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif" }}
                  >
                    {brand.name}
                  </h2>
                  <div className="flex flex-col gap-1 text-base font-mono mt-1 uppercase tracking-widest" style={{ color: '#ffae00' }}>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{brand.origin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>EST. {brand.foundedYear}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 mb-4 bg-white/5 rounded-t-sm">
                <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Profile" icon={<Info size={10} />} />
                <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')} label="Events" icon={<Calendar size={10} />} />
                <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} label="Prods" icon={<ShoppingBag size={10} />} />
                <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} label="Rev" icon={<User size={10} />} />
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto pr-1">
                {activeTab === 'profile' && (
                  <div className="animate-fadeIn">
                    <p className="text-sm text-white/70 leading-relaxed font-light mb-4">
                      <span className="font-mono text-xs mr-2" style={{ color: '#bc13fe' }}>
                        {'/// BRIEFING:'}
                      </span>
                      {brand.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {brand.tags.map(tag => <TechBadge key={tag} label={tag} />)}
                    </div>
                  </div>
                )}

                {activeTab === 'events' && (
                  <div className="space-y-3 animate-fadeIn">
                    {brand.events.map(e => (
                      <div 
                        key={e.id} 
                        className="p-3 bg-white/5 border border-white/10 rounded-sm hover:border-amber-400/30 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs font-mono" style={{ color: '#ffae00', fontSize: '9px' }}>{e.date}</div>
                          <Activity size={10} style={{ color: '#bc13fe' }} />
                        </div>
                        <div className="font-bold text-sm uppercase text-white/90">{e.title}</div>
                        <div className="text-xs text-white/50" style={{ fontSize: '10px' }}>{e.location}</div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="space-y-3 animate-fadeIn">
                    {brand.featuredProducts.map(p => (
                      <div 
                        key={p.id} 
                        className="flex gap-3 p-2 bg-white/5 border border-white/10 rounded-sm items-center hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {p.image && <img src={p.image} className="w-10 h-10 object-cover opacity-80 rounded-sm" alt="" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs uppercase truncate text-white/90">{p.name}</div>
                          <div className="text-xs font-mono" style={{ color: '#bc13fe', fontSize: '9px' }}>{p.price}</div>
                        </div>
                        <ChevronRight size={12} className="text-white/20" />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-3 animate-fadeIn">
                    {brand.reviews.map(r => (
                      <div key={r.id} className="p-3 bg-white/5 border border-white/10 rounded-sm">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs font-bold flex items-center gap-1" style={{ color: '#ffae00', fontSize: '10px' }}>
                            <User size={10} /> {r.user}
                          </div>
                          <div className="text-xs flex gap-0.5" style={{ color: '#bc13fe', fontSize: '9px' }}>
                            {Array(r.rating).fill('★').join('')}
                          </div>
                        </div>
                        <div className="text-xs text-white/70 italic border-l-2 border-white/10 pl-2" style={{ fontSize: '11px' }}>
                          "{r.comment}"
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manifesto Button */}
              <div className="pt-4 mt-auto border-t border-white/5">
                <GlowButton variant="secondary" className="w-full !text-xs !py-2" style={{ fontSize: '10px' }}>
                  Read Manifesto
                </GlowButton>
              </div>
            </SectorFrame>
          </div>

          {/* CENTER COLUMN: Visuals & Contact */}
          <div className="w-1/3 flex flex-col gap-4" style={{ height: '105%', marginTop: '-2.5%' }}>
            <SectorFrame>
              <div 
                className="flex-1 relative group rounded-sm overflow-hidden border border-white/10 bg-black"
                style={{ boxShadow: '0 0 50px rgba(0, 0, 0, 0.8)' }}
              >
                <div className="absolute inset-0">
                  <Slideshow items={brand.gallery} />
                </div>
                <div className="absolute top-2 right-2 z-10">
                  <div 
                    className="text-xs font-mono border px-1 backdrop-blur-sm"
                    style={{ 
                      color: 'rgba(255, 174, 0, 0.5)',
                      borderColor: 'rgba(255, 174, 0, 0.3)',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      fontSize: '8px'
                    }}
                  >
                    SECTOR {brand.id}
                  </div>
                </div>
              </div>

              {/* Bottom Bar: Contact */}
              <div className="h-20 flex items-center justify-between gap-3 rounded-sm pt-4 border-t border-white/10">
                <div className="flex items-center gap-4 overflow-hidden flex-1">
                  <div 
                    className="w-10 h-10 flex items-center justify-center rounded-full shrink-0"
                    style={{
                      backgroundColor: 'rgba(255, 174, 0, 0.1)',
                      color: '#ffae00',
                      border: '1px solid rgba(255, 174, 0, 0.2)'
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-white/40 font-mono uppercase tracking-wider" style={{ fontSize: '9px' }}>Secure Comms</span>
                    <span 
                      className="text-sm font-bold text-white truncate w-full hover:text-amber-400 cursor-pointer transition-colors"
                    >
                      {brand.email}
                    </span>
                  </div>
                </div>
                
                {/* Social Buttons */}
                <div className="flex gap-2">
                  <IconButton 
                    icon={<Globe size={24} />} 
                    variant="green" 
                    onClick={() => setShowContactModal(true)}
                  />
                  <IconButton 
                    icon={<Instagram size={24} />} 
                    variant="green" 
                    onClick={() => setShowContactModal(true)}
                  />
                  <IconButton 
                    icon={<Linkedin size={24} />} 
                    variant="green" 
                    onClick={() => setShowContactModal(true)}
                  />
                </div>
              </div>
            </SectorFrame>
          </div>

          {/* RIGHT COLUMN: Stats & Product */}
          <div className="w-1/3 h-full flex flex-col gap-4" style={{ transform: 'translateY(2%) translateX(2%)' }}>
            <SectorFrame>
              {/* Radar */}
              <div className="flex-1 flex flex-col min-h-0 border-b border-white/10 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span 
                    className="text-xs font-mono uppercase tracking-widest"
                    style={{ color: '#ffae00', fontSize: '9px' }}
                  >
                    System_Analysis
                  </span>
                  <Maximize2 size={10} className="text-white/30" />
                </div>
                <div className="flex-1 min-h-0">
                  <BrandStats metrics={brand.metrics} />
                </div>
              </div>

              {/* Featured Product */}
              <div className="h-[40%] flex flex-col pt-2">
                <span 
                  className="text-xs font-mono uppercase mb-3 tracking-widest border-l-2 pl-2"
                  style={{ color: '#ffae00', fontSize: '9px', borderColor: '#ffae00' }}
                >
                  Featured Artifact
                </span>
                
                <div className="flex items-start gap-3 mb-2 flex-1">
                  <div className="w-20 h-20 border border-white/10 bg-black/40 shrink-0 relative group">
                    {brand.featuredProducts[0]?.image && (
                      <img src={brand.featuredProducts[0].image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="prod" />
                    )}
                    <div className="absolute bottom-0 right-0 p-0.5 bg-black/80">
                      <ExternalLink size={8} style={{ color: '#ffae00' }} />
                    </div>
                  </div>
                  <div className="overflow-hidden flex flex-col h-full">
                    <h4 className="text-white font-bold uppercase tracking-widest text-sm truncate">
                      {brand.featuredProducts[0]?.name}
                    </h4>
                    <div className="text-xs font-mono my-1 font-bold" style={{ color: '#bc13fe' }}>
                      {brand.featuredProducts[0]?.price}
                    </div>
                    <div className="flex gap-1 flex-wrap mt-auto">
                      {brand.featuredProducts[0]?.specs.map(s => (
                        <span 
                          key={s} 
                          className="text-xs bg-white/5 px-1.5 py-0.5 border border-white/10 text-white/50"
                          style={{ fontSize: '8px' }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <GlowButton variant="primary" className="w-full !py-2 !px-3 !text-xs mt-auto" style={{ fontSize: '9px' }}>
                  Inspect Unit
                </GlowButton>
              </div>
            </SectorFrame>
          </div>
        </div>
      </main>

      {/* EXPANDABLE NAV WHEEL */}
      <NavWheel brands={BRANDS} virtualIndex={virtualIndex} onUpdateIndex={setVirtualIndex} onBack={() => onBack()} />

      {/* MODAL - Contact */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)}>
        <SectorFrame>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldCheck 
              className="w-12 h-12 mb-4"
              style={{ color: '#00ff9d', animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
            />
            <h3 
              className="text-xl font-bold uppercase tracking-widest mb-2"
              style={{ color: '#00ff9d', letterSpacing: '0.2em' }}
            >
              Secure Link Established
            </h3>
            <p className="text-white/70 mb-8 font-mono text-xs px-8">
              Encrypted channel ready for transmission. Verify credentials to initiate contact protocol.
            </p>
            <button 
              onClick={() => setShowContactModal(false)}
              className="px-8 py-3 border font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300"
              style={{
                backgroundColor: 'rgba(0, 255, 157, 0.1)',
                borderColor: '#00ff9d',
                color: '#00ff9d',
                letterSpacing: '0.2em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00ff9d';
                e.currentTarget.style.color = '#000';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 157, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 255, 157, 0.1)';
                e.currentTarget.style.color = '#00ff9d';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Acknowledge
            </button>
          </div>
        </SectorFrame>
      </Modal>
      </>
      ) : (
        <div style={{ width: '100vw', height: '100vh' }} />
      )}
    </div>
  );
});

GeneralBrandPage.displayName = 'GeneralBrandPage';

export default GeneralBrandPage;
