import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, 
  Globe, 
  Calendar, 
  MapPin, 
  Hash,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react';
import { 
  HoloCard, 
  GlowButton, 
  TechBadge, 
  SectionHeader
} from './SciFiUI';
import { BrandStats } from './BrandStats';
import {
  CODE49_DATA,
  KARMAN_DATA,
  RENGIFOODS_DATA,
  TATTOOSHOP_DATA,
  SLIDE4_DATA,
  SLIDE5_DATA,
  SLIDE6_DATA,
  SLIDE7_DATA,
  SLIDE8_DATA
} from './types';

// External Link Modal Component with zoom animation from button origin
const ExternalLinkModal = ({ isOpen, url, onClose, onConfirm, buttonElement }) => {
  const [isClosing, setIsClosing] = React.useState(false);
  const [zoomOrigin, setZoomOrigin] = React.useState({ x: '50%', y: '50%' });

  React.useEffect(() => {
    if (isOpen && buttonElement) {
      // Calculate zoom origin from button position with proper centering
      const rect = buttonElement.getBoundingClientRect();
      
      // Center of button in viewport coordinates, moved 7rem higher
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2 - 112; // 7rem = 112px
      
      // Convert to percentage of viewport
      const centerXPercent = (buttonCenterX / window.innerWidth) * 100;
      const centerYPercent = (buttonCenterY / window.innerHeight) * 100;
      
      setZoomOrigin({ x: `${centerXPercent}%`, y: `${centerYPercent}%` });
    }
  }, [isOpen, buttonElement]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 600);
  };

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onConfirm();
    }, 600);
  };

  return (
    <>
      {isOpen && (
        <div 
          onClick={handleClose}
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            perspective: '1200px',
            perspectiveOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`,
            animation: isClosing 
              ? 'externalModalZoomBackdropOut 0.6s ease-in forwards'
              : 'externalModalZoomBackdrop 0.6s ease-out forwards'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg p-6 max-w-sm mx-4"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)',
              backdropFilter: 'blur(10px)',
              animation: isClosing 
                ? 'externalModalZoomOut 0.6s ease-in forwards'
                : 'externalModalZoomIn 0.6s ease-out forwards',
              transformStyle: 'preserve-3d',
              transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`
            }}
          >
            {/* Warning icon and text */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center mb-3">
                <Globe size={28.8} style={{ color: '#15B315' }} />
              </div>
              <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#FFFEF0', letterSpacing: '0.05em' }}>
                U staat op het punt door te stromen
              </p>
            </div>

            {/* URL display */}
            <div className="mb-4 p-2 rounded" style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(168, 85, 247, 0.4)'
            }}>
              <p className="text-xs truncate" style={{ color: '#94A3B8' }}>
                {url}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 py-2 rounded transition-all font-bold text-xs uppercase tracking-widest"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#FFFEF0'
                }}
              >
                Terug
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 rounded transition-all font-bold text-xs uppercase tracking-widest"
                style={{
                  backgroundColor: 'rgba(168, 85, 247, 0.3)',
                  border: '1px solid rgba(168, 85, 247, 0.6)',
                  color: '#f59e0b'
                }}
              >
                Doorstromen
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes externalModalZoomBackdrop {
          from { 
            background-color: rgba(0, 0, 0, 0);
            backdrop-filter: blur(0px);
          }
          to { 
            background-color: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
          }
        }
        @keyframes externalModalZoomBackdropOut {
          from { 
            background-color: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
          }
          to { 
            background-color: rgba(0, 0, 0, 0);
            backdrop-filter: blur(0px);
          }
        }
        @keyframes externalModalZoomIn {
          from { 
            opacity: 0;
            transform: scale(0.1) rotateX(25deg) translateZ(-1000px);
          }
          to { 
            opacity: 1;
            transform: scale(1) rotateX(0deg) translateZ(0px);
          }
        }
        @keyframes externalModalZoomOut {
          from { 
            opacity: 1;
            transform: scale(1) rotateX(0deg) translateZ(0px);
          }
          to { 
            opacity: 0;
            transform: scale(0.1) rotateX(25deg) translateZ(-1000px);
          }
        }
      `}</style>
    </>
  );
};

// Social Share Modal Component with zoom animation from button origin
const SocialShareModal = ({ isOpen, onClose, buttonElement, brandData }) => {
  const [isClosing, setIsClosing] = React.useState(false);
  const [zoomOrigin, setZoomOrigin] = React.useState({ x: '50%', y: '50%' });

  React.useEffect(() => {
    if (isOpen && buttonElement) {
      // Calculate zoom origin from button position with proper centering
      const rect = buttonElement.getBoundingClientRect();
      
      // Center of button in viewport coordinates, moved 7rem higher
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2 - 112; // 7rem = 112px
      
      // Convert to percentage of viewport
      const centerXPercent = (buttonCenterX / window.innerWidth) * 100;
      const centerYPercent = (buttonCenterY / window.innerHeight) * 100;
      
      setZoomOrigin({ x: `${centerXPercent}%`, y: `${centerYPercent}%` });
    }
  }, [isOpen, buttonElement]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 600);
  };

  const handleSocialClick = (platform) => {
    const socialLink = brandData?.socialLinks?.find(link => link.platform === platform);
    if (socialLink) {
      window.open(socialLink.url, '_blank', 'noopener,noreferrer');
    }
    handleClose();
  };

  return (
    <>
      {isOpen && (
        <div 
          onClick={handleClose}
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            perspective: '1200px',
            perspectiveOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`,
            animation: isClosing 
              ? 'socialModalZoomBackdropOut 0.6s ease-in forwards'
              : 'socialModalZoomBackdrop 0.6s ease-out forwards'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg p-6 max-w-sm mx-4"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)',
              backdropFilter: 'blur(10px)',
              animation: isClosing 
                ? 'socialModalZoomOut 0.6s ease-in forwards'
                : 'socialModalZoomIn 0.6s ease-out forwards',
              transformStyle: 'preserve-3d',
              transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`
            }}
          >
            {/* Share icon and text */}
            <div className="text-center mb-1">
              <div className="inline-flex items-center justify-center mb-1">
                <Share2 size={28.8} style={{ color: '#E0E30B' }} />
              </div>
              <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#FFFEF0', letterSpacing: '0.05em' }}>
                VIND VERBINDING VIA SOCIALS
              </p>
            </div>

            {/* Social buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSocialClick('Instagram')}
                className="py-2 rounded transition-all font-bold text-xs uppercase tracking-widest"
                style={{
                  backgroundColor: 'rgba(168, 85, 247, 0.3)',
                  border: '1px solid rgba(168, 85, 247, 0.6)',
                  color: '#f59e0b'
                }}
              >
                Instagram
              </button>
              <button
                onClick={() => handleSocialClick('LinkedIn')}
                className="py-2 rounded transition-all font-bold text-xs uppercase tracking-widest"
                style={{
                  backgroundColor: 'rgba(168, 85, 247, 0.3)',
                  border: '1px solid rgba(168, 85, 247, 0.6)',
                  color: '#f59e0b'
                }}
              >
                LinkedIn
              </button>
              <button
                onClick={() => handleSocialClick('Email')}
                className="py-2 rounded transition-all font-bold text-xs uppercase tracking-widest"
                style={{
                  backgroundColor: 'rgba(168, 85, 247, 0.3)',
                  border: '1px solid rgba(168, 85, 247, 0.6)',
                  color: '#f59e0b'
                }}
              >
                Email
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes socialModalZoomBackdrop {
          from { 
            background-color: rgba(0, 0, 0, 0);
            backdrop-filter: blur(0px);
          }
          to { 
            background-color: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
          }
        }
        @keyframes socialModalZoomBackdropOut {
          from { 
            background-color: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
          }
          to { 
            background-color: rgba(0, 0, 0, 0);
            backdrop-filter: blur(0px);
          }
        }
        @keyframes socialModalZoomIn {
          from { 
            opacity: 0;
            transform: scale(0.1) rotateX(25deg) translateZ(-1000px);
          }
          to { 
            opacity: 1;
            transform: scale(1) rotateX(0deg) translateZ(0px);
          }
        }
        @keyframes socialModalZoomOut {
          from { 
            opacity: 1;
            transform: scale(1) rotateX(0deg) translateZ(0px);
          }
          to { 
            opacity: 0;
            transform: scale(0.1) rotateX(25deg) translateZ(-1000px);
          }
        }
      `}</style>
    </>
  );
};

const PAGE_DATA_MAP = {
  'code49': CODE49_DATA,
  'karman': KARMAN_DATA,
  'rengifoods': RENGIFOODS_DATA,
  'tattooshop': TATTOOSHOP_DATA,
  'slide4': SLIDE4_DATA,
  'slide5': SLIDE5_DATA,
  'slide6': SLIDE6_DATA,
  'slide7': SLIDE7_DATA,
  'slide8': SLIDE8_DATA,
};

// Slideshow Component
const Slideshow = ({ images }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-full group">
      <img 
        src={images[currentSlide]?.url || images[currentSlide]} 
        alt={`Slide ${currentSlide + 1}`} 
        className="w-full h-full object-cover transition-all duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      
      {/* Controls */}
      <button 
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur rounded-full text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 transition-all z-10"
      >
        <ChevronLeft size={20} />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur rounded-full text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 transition-all z-10"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-cyan-400 w-3' : 'bg-white/30 w-1.5'}`}
          />
        ))}
      </div>
    </div>
  );
};

const GeneralPage = ({ pageId, onBack }) => {

   const [activeTab, setActiveTab] = useState('overzicht');
   const [externalLinkModal, setExternalLinkModal] = useState({ isOpen: false, url: '', buttonElement: null });
   const [socialShareModal, setSocialShareModal] = useState({ isOpen: false, buttonElement: null });

   const brandData = PAGE_DATA_MAP[pageId?.toLowerCase()];

  if (!brandData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
          <GlowButton variant="primary" onClick={onBack}>
            Back to Home
          </GlowButton>
        </div>
      </div>
    );
  }



  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="fixed inset-0 font-sans text-slate-200"
      style={{ 
        background: 'transparent',
        zIndex: 2000
      }}
    >
      {/* Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

      {/* PLACEHOLDER CONTAINER - Fixed to viewport, never scrolls */}
      <div 
        className="absolute z-20 flex flex-col overflow-hidden h-full w-full"
        style={{
          top: 'clamp(0.5rem, 1.5vw, 1.5rem)',
          left: 'clamp(0.5rem, 1.5vw, 1.5rem)',
          right: 'clamp(0.5rem, 1.5vw, 1.5rem)',
          bottom: 'clamp(0.5rem, 1.5vw, 1.5rem)',
          touchAction: 'manipulation',
          height: 'auto',
          width: 'auto'
        }}
      >
        {/* Corner Brackets with connecting lines */}
        <div className="absolute top-0 left-0 pointer-events-none" style={{
          width: 'clamp(1rem, 3vw, 2rem)',
          height: 'clamp(1rem, 3vw, 2rem)',
          borderTop: '2px solid rgba(168, 85, 247, 0.4)',
          borderLeft: '2px solid rgba(168, 85, 247, 0.4)',
          zIndex: 50
        }} />
        <div className="absolute top-0 right-0 pointer-events-none" style={{
          width: 'clamp(1rem, 3vw, 2rem)',
          height: 'clamp(1rem, 3vw, 2rem)',
          borderTop: '2px solid rgba(168, 85, 247, 0.4)',
          borderRight: '2px solid rgba(168, 85, 247, 0.4)',
          zIndex: 50
        }} />
        
        <div className="absolute bottom-0 left-0 pointer-events-none" style={{
          width: 'clamp(1rem, 3vw, 2rem)',
          height: 'clamp(1rem, 3vw, 2rem)',
          borderBottom: '2px solid rgba(168, 85, 247, 0.4)',
          borderLeft: '2px solid rgba(168, 85, 247, 0.4)',
          zIndex: 50
        }} />
        <div className="absolute bottom-0 right-0 pointer-events-none" style={{
          width: 'clamp(1rem, 3vw, 2rem)',
          height: 'clamp(1rem, 3vw, 2rem)',
          borderBottom: '2px solid rgba(168, 85, 247, 0.4)',
          borderRight: '2px solid rgba(168, 85, 247, 0.4)',
          zIndex: 50
        }} />

        <div className="absolute pointer-events-none" style={{
          left: 'clamp(0.5rem, 1.5vw, 1rem)',
          inset: '0 auto 0 0',
          width: '1px',
          backgroundImage: 'linear-gradient(to bottom, rgba(168, 85, 247, 0.4), rgba(168, 85, 247, 0.4))'
        }} />
        <div className="absolute pointer-events-none" style={{
          right: 'clamp(0.5rem, 1.5vw, 1rem)',
          inset: '0 0 0 auto',
          width: '1px',
          backgroundImage: 'linear-gradient(to bottom, rgba(168, 85, 247, 0.4), rgba(168, 85, 247, 0.4))'
        }} />
      
        {/* Inner scrollable content */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{
            padding: 'clamp(0.5rem, 1.5vw, 1.5rem)',
            paddingTop: 'calc(clamp(0.5rem, 1.5vw, 1.5rem) + 3px)',
            paddingBottom: 'calc(clamp(0.5rem, 1.5vw, 1.5rem) + 3px)',
            paddingLeft: 'calc(clamp(0.5rem, 1.5vw, 1.5rem) + 3px)',
            paddingRight: 'calc(clamp(0.5rem, 1.5vw, 1.5rem) + 3px)',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(168, 85, 247, 0.6) transparent',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
            {/* Brand Identity */}
            <div className="flex flex-col mb-4">
              {/* Top row: Logo (left) and Brand Name (centered) */}
              <div className="flex items-center gap-4 mb-3 relative">
                {/* Logo on left */}
                <div className="rounded-xl p-1 shrink-0" style={{
                  width: 'calc(5rem * 1.3)',
                  height: 'calc(5rem * 1.3)',
                  border: '2px solid rgba(168, 85, 247, 0.4)',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.15)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img src={brandData.logoUrl} alt="Logo" className="w-full h-full object-contain rounded" style={{ transform: 'scale(1.2)' }} />
                </div>
                {/* Brand name centered in remaining space */}
                <h1 className="text-2xl font-bold tracking-tighter leading-none poetry text-center absolute left-1/2" style={{
                  color: '#f59e0b',
                  textShadow: '0 0 15px rgba(245, 158, 11, 0.4), 0 2px 4px rgba(0,0,0,0.8)',
                  fontSize: 'clamp(1.35rem, 2.7vw, 2.25rem)',
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}>
                  {brandData.name}
                </h1>
              </div>
              {/* Missie container right after logo and brand name */}
              <div className="bg-slate-900/40 p-3 rounded-lg backdrop-blur-sm mb-2" style={{
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.1)'
              }}>
                <p className="text-slate-400 leading-relaxed text-xs font-sans">
                  <span className="block mb-2 text-xs font-bold uppercase tracking-widest poetry" style={{
                    color: '#f59e0b'
                  }}>{'/// Missie'}</span>
                  <span style={{ color: '#FFFEF0' }}>{brandData.description}</span>
                </p>
              </div>
            </div>

            {/* Content Actions */}
            <div className="z-40 border-white/5 shadow-lg mb-4">
              <div className="flex gap-2 p-3">
                <button className="flex-1 !py-2.5 !text-xs !rounded-md font-bold uppercase tracking-widest transition-all" style={{
                  backgroundColor: 'transparent',
                  border: '2px solid rgba(168, 85, 247, 0.4)',
                  color: '#f59e0b',
                  boxShadow: '0 0 8px rgba(168, 85, 247, 0.2)',
                  cursor: 'pointer'
                }}>Activeer Meldingen</button>
                <button className="!px-3 !py-2 !rounded-md transition-all" onClick={(e) => {
                  setSocialShareModal({ isOpen: true, buttonElement: e.currentTarget });
                }} style={{
                  backgroundColor: 'transparent',
                  border: '2px solid rgba(168, 85, 247, 0.4)',
                  color: '#E0E30B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(168, 85, 247, 0.2)',
                  cursor: 'pointer'
                }}>
                  <Share2 size={16} />
                </button>
                <button className="!px-3 !py-2 !rounded-md transition-all" onClick={(e) => {
                  const webLink = brandData.socialLinks?.find(link => link.platform === 'Website');
                  if (webLink) {
                    setExternalLinkModal({ isOpen: true, url: webLink.url, buttonElement: e.currentTarget });
                  }
                }} style={{
                  backgroundColor: 'transparent',
                  border: '2px solid rgba(168, 85, 247, 0.4)',
                  color: '#15B315',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(168, 85, 247, 0.2)',
                  cursor: 'pointer'
                }}>
                  <Globe size={16} />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex overflow-x-auto" style={{ marginTop: '15px', border: '2px solid rgba(168, 85, 247, 0.4)', borderRadius: '0.5rem' }}>
                {['overzicht', 'events', 'netwerk'].map((tab, idx) => (
                  <React.Fragment key={tab}>
                    <button
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative poetry ${
                        activeTab === tab ? 'text-white bg-white/5' : 'text-slate-600 hover:text-slate-400'
                      }`}
                      style={activeTab === tab ? {
                        color: '#FFFEF0',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)'
                      } : {
                        color: '#FFFEF0'
                      }}
                    >
                      {tab}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{
                          backgroundColor: '#f59e0b',
                          boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)'
                        }}></div>
                      )}
                    </button>
                    {idx < 2 && <div style={{ width: '1px', backgroundColor: 'rgba(168, 85, 247, 0.3)' }} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overzicht' && (
                <motion.div
                  key="overzicht"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded border p-2 text-center" style={{
                      backgroundColor: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      boxShadow: '0 0 8px rgba(168, 85, 247, 0.15)'
                    }}>
                      <Calendar size={12} className="mx-auto mb-1" style={{ color: '#15B315' }} />
                      <div className="font-bold uppercase tracking-widest" style={{ fontSize: '0.75rem', color: '#FFFEF0', marginBottom: '0.25rem' }}>{brandData.infoLabels?.date?.label || 'Opgericht'}</div>
                      <div className="font-sans font-normal" style={{ fontSize: '0.86rem', color: '#FFFEF0' }}>{brandData.infoLabels?.date?.value || brandData.foundedYear}</div>
                    </div>
                    <div className="rounded border p-2 text-center" style={{
                      backgroundColor: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      boxShadow: '0 0 8px rgba(168, 85, 247, 0.15)'
                    }}>
                      <MapPin size={12} className="mx-auto mb-1" style={{ color: '#E0E30B' }} />
                      <div className="font-bold uppercase tracking-widest" style={{ fontSize: '0.75rem', color: '#FFFEF0', marginBottom: '0.25rem' }}>{brandData.infoLabels?.place?.label || 'LOCATIE'}</div>
                      <div className="font-sans font-normal" style={{ fontSize: '0.86rem', color: '#FFFEF0' }}>{brandData.infoLabels?.place?.value || brandData.origin}</div>
                    </div>
                    <div className="rounded border p-2 text-center" style={{
                      backgroundColor: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      boxShadow: '0 0 8px rgba(168, 85, 247, 0.15)'
                    }}>
                      <Hash size={12} className="mx-auto mb-1" style={{ color: '#f59e0b' }} />
                      <div className="font-bold uppercase tracking-widest" style={{ fontSize: '0.75rem', color: '#FFFEF0', marginBottom: '0.25rem' }}>{brandData.infoLabels?.contact?.label || 'Contact'}</div>
                      <div className="font-sans font-normal" style={{ fontSize: '0.86rem', color: '#FFFEF0' }}>{brandData.infoLabels?.contact?.value || brandData.id}</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2">
                    <SectionHeader title="Analyse" />
                    <BrandStats metrics={brandData.metrics} radarData={brandData.metrics?.radarData} />
                  </div>

                  {/* Tagline description on left side */}
                  <p className="text-[10px] md:text-xs max-w-md bg-black/60 backdrop-blur px-3 py-1.5 rounded-r-lg font-sans font-normal mb-2" style={{
                    color: '#FFFEF0',
                    borderLeft: '2px solid rgba(168, 85, 247, 0.8)'
                  }}>
                    {brandData.tagline}
                  </p>
                  {/* Tags centered below */}
                  <div className="flex gap-1 flex-wrap mb-4 justify-center">
                    {brandData.tags.map(tag => <TechBadge key={tag} label={tag} />)}
                  </div>

                  {/* Gallery with Slideshow */}
                  <div className="space-y-2">
                    <SectionHeader title="Beeldvorming" />
                    <div className="grid grid-cols-1 gap-2">
                      {brandData.gallery.map((item, idx) => (
                        <HoloCard 
                          key={item.id || idx} 
                          noPadding 
                          className={`overflow-hidden shadow-lg ${idx === 0 ? 'aspect-[4/3]' : 'aspect-video'}`}
                          style={{ border: '1px solid rgba(168, 85, 247, 0.4)', boxShadow: '0 0 15px rgba(168, 85, 247, 0.2)' }}
                        >
                          {idx === 0 ? (
                            <Slideshow images={brandData.gallery} />
                          ) : (
                            <div className="relative w-full h-full group cursor-pointer">
                              <img src={item.url || item.image} alt={item.title} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/50 group-hover:bg-orange-500 transition-all" style={{
                                  border: '2px solid rgba(168, 85, 247, 0.6)',
                                  color: 'rgba(168, 85, 247, 0.8)'
                                }}>
                                  <Play className="fill-current w-4 h-4 ml-0.5" />
                                </div>
                              </div>
                            </div>
                          )}
                        </HoloCard>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'products' && (
                <motion.div
                  key="products"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 gap-3"
                >
                  {brandData.featuredProducts?.map((product) => (
                    <HoloCard key={product.id} noPadding className="flex overflow-hidden h-28 border-white/5">
                      <div className="w-28 relative shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-cyan-400/5"></div>
                      </div>
                      <div className="flex-1 p-3 flex flex-col justify-between bg-gradient-to-r from-slate-900 to-transparent">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-white text-xs tracking-wide">{product.name}</h3>
                            <span className="font-mono text-[10px]" style={{ color: '#f59e0b' }}>{product.price}</span>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button className="text-[9px] font-mono hover:text-white flex items-center gap-1 transition-colors px-2 py-1 bg-white/5 rounded" style={{
                            color: '#f59e0b'
                          }}>
                            ACQUIRE <ChevronRight size={10} />
                          </button>
                        </div>
                      </div>
                    </HoloCard>
                  ))}
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center justify-center py-4 text-slate-600 border border-dashed border-white/10 rounded-lg bg-slate-900/20"
                >
                  <MessageSquare size={24} className="mb-2 opacity-30" />
                  <p className="font-mono text-[10px] uppercase tracking-widest">No reviews yet</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="py-2 text-center opacity-40 hover:opacity-100 transition-opacity mt-auto">
              <div className="w-full h-px mb-2" style={{
                backgroundImage: 'linear-gradient(to right, transparent, rgba(168, 85, 247, 0.4), transparent)'
              }}></div>
            </div>
        </div>
        {/* END INNER SCROLLABLE CONTENT */}
      </div>
      {/* END PLACEHOLDER CONTAINER */}

      {/* External Link Modal */}
      <ExternalLinkModal
        isOpen={externalLinkModal.isOpen}
        url={externalLinkModal.url}
        buttonElement={externalLinkModal.buttonElement}
        onClose={() => setExternalLinkModal({ isOpen: false, url: '', buttonElement: null })}
        onConfirm={() => {
          window.open(externalLinkModal.url, '_blank', 'noopener,noreferrer');
          setExternalLinkModal({ isOpen: false, url: '', buttonElement: null });
        }}
      />

      {/* Social Share Modal */}
      <SocialShareModal
        isOpen={socialShareModal.isOpen}
        buttonElement={socialShareModal.buttonElement}
        brandData={brandData}
        onClose={() => setSocialShareModal({ isOpen: false, buttonElement: null })}
      />
    </motion.div>
  );
};

export default GeneralPage;
