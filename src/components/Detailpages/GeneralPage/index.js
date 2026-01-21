import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, 
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
  SectionHeader,
  LoadingScreen
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

      <div className="absolute top-2 right-2">
        <TechBadge label="GALLERY_MODE" />
      </div>
    </div>
  );
};

const GeneralPage = ({ pageId, onBack }) => {

   const [activeTab, setActiveTab] = useState('overview');

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
      className="w-full h-screen font-sans text-slate-200 overflow-hidden relative"
      style={{ background: 'transparent' }}
    >
      {/* Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

      {/* Main Content Container */}
      <main className="relative z-10 w-full h-full overflow-hidden" style={{
        margin: 'clamp(0.5rem, 1.5vw, 1.5rem)'
      }}>
        
        {/* PLACEHOLDER CONTAINER - Deltawerken corner brackets style */}
        <div 
          className="relative h-full overflow-hidden"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(96, 28, 151, 0.6)'
          }}
        >
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 pointer-events-none z-50" style={{
            width: 'clamp(1rem, 3vw, 2rem)',
            height: 'clamp(1rem, 3vw, 2rem)',
            borderTop: '2px solid #531a6d',
            borderLeft: '2px solid #531a6d'
          }} />
          <div className="absolute top-0 right-0 pointer-events-none z-50" style={{
            width: 'clamp(1rem, 3vw, 2rem)',
            height: 'clamp(1rem, 3vw, 2rem)',
            borderTop: '2px solid #531a6d',
            borderRight: '2px solid #531a6d'
          }} />
          <div className="absolute bottom-0 left-0 pointer-events-none z-50" style={{
            width: 'clamp(1rem, 3vw, 2rem)',
            height: 'clamp(1rem, 3vw, 2rem)',
            borderBottom: '2px solid #531a6d',
            borderLeft: '2px solid #531a6d'
          }} />
          <div className="absolute bottom-0 right-0 pointer-events-none z-50" style={{
            width: 'clamp(1rem, 3vw, 2rem)',
            height: 'clamp(1rem, 3vw, 2rem)',
            borderBottom: '2px solid #531a6d',
            borderRight: '2px solid #531a6d'
          }} />
        
          {/* Inner scrollable content - ALL content inside */}
          <div 
            className="h-full overflow-y-auto p-4"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0, 255, 255, 0.3) transparent'
            }}
          >
            {/* Brand Identity - NOW INSIDE PLACEHOLDER */}
            <div className="flex flex-col items-start mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 rounded-xl border border-cyan-400/50 bg-black/80 p-1 shadow-[0_0_20px_rgba(0,243,255,0.2)] shrink-0 backdrop-blur">
                  <img src={brandData.logoUrl} alt="Logo" className="w-full h-full object-cover rounded" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tighter leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {brandData.name}
                </h1>
              </div>
              <div className="flex gap-1 flex-wrap mb-2">
                {brandData.tags.map(tag => <TechBadge key={tag} label={tag} />)}
              </div>
              <p className="text-cyan-400 font-mono text-[10px] md:text-xs max-w-md bg-black/60 backdrop-blur px-3 py-1.5 rounded-r-lg border-l-2 border-cyan-400 inline-block">
                {brandData.tagline}
              </p>
            </div>

            {/* CONTENT ACTIONS */}
            <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-white/5 shadow-lg mb-4 -mx-4 px-4">
              <div className="flex gap-2 p-3">
                <GlowButton variant="primary" className="flex-1 !py-2.5 !text-xs !rounded-md">Follow System</GlowButton>
                <GlowButton variant="secondary" className="!px-3 !py-2 !rounded-md" icon={<Share2 size={16} />} />
                <GlowButton variant="secondary" className="!px-3 !py-2 !rounded-md" icon={<Globe size={16} />} />
              </div>
              
              {/* TABS */}
              <div className="flex overflow-x-auto px-1 pb-1">
                {['overview', 'products', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-[10px] font-mono font-bold uppercase tracking-widest transition-all relative rounded-t-md mx-1 ${
                      activeTab === tab ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_8px_#00f3ff]"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                         {/* Description */}
                         <div className="bg-slate-900/40 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
                            <p className="text-slate-400 leading-relaxed text-xs font-mono">
                               <span className="text-cyan-400/70 block mb-2 text-[10px] uppercase tracking-widest">{'/// MISSION_DATA'}</span>
                               {brandData.description}
                            </p>
                         </div>

                         {/* Quick Info Grid */}
                         <div className="grid grid-cols-3 gap-2">
                             <div className="bg-slate-900/30 rounded border border-white/5 p-2 text-center">
                                <Calendar size={12} className="mx-auto text-cyan-400 mb-1" />
                                <div className="text-[9px] text-slate-500 font-mono">ESTABLISHED</div>
                                <div className="text-xs text-white">{brandData.foundedYear}</div>
                             </div>
                             <div className="bg-slate-900/30 rounded border border-white/5 p-2 text-center">
                                <MapPin size={12} className="mx-auto text-pink-500 mb-1" />
                                <div className="text-[9px] text-slate-500 font-mono">ORIGIN</div>
                                <div className="text-xs text-white">{brandData.origin}</div>
                             </div>
                             <div className="bg-slate-900/30 rounded border border-white/5 p-2 text-center">
                                <Hash size={12} className="mx-auto text-white mb-1" />
                                <div className="text-[9px] text-slate-500 font-mono">REF_ID</div>
                                <div className="text-xs text-white">{brandData.id}</div>
                             </div>
                         </div>

                         {/* Stats */}
                         <div className="space-y-3">
                            <SectionHeader title="Analytics" />
                            <BrandStats metrics={brandData.metrics} />
                         </div>

                         {/* Gallery with Slideshow */}
                         <div className="space-y-3">
                            <SectionHeader title="Visual DB" />
                            <div className="grid grid-cols-1 gap-4">
                               {brandData.gallery.map((item, idx) => (
                                  <HoloCard 
                                    key={item.id || idx} 
                                    noPadding 
                                    className={`overflow-hidden border-white/10 shadow-lg ${idx === 0 ? 'aspect-[4/3] ring-1 ring-cyan-400/30' : 'aspect-video'}`}
                                  >
                                     {idx === 0 ? (
                                        <Slideshow images={brandData.gallery} />
                                     ) : (
                                        <div className="relative w-full h-full group cursor-pointer">
                                           <img src={item.url || item.image} alt={item.title} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                           <div className="absolute inset-0 flex items-center justify-center">
                                              <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center bg-black/50 group-hover:bg-cyan-400 group-hover:border-cyan-400 transition-all">
                                                 <Play className="fill-white w-4 h-4 ml-0.5" />
                                              </div>
                                           </div>
                                           <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[9px] font-mono text-cyan-400 border border-cyan-400/20">
                                              VID_0{idx}
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
                         {brandData.featuredProducts.map((product) => (
                            <HoloCard key={product.id} noPadding className="flex overflow-hidden h-28 border-white/5">
                               <div className="w-28 relative shrink-0">
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-cyan-400/5"></div>
                               </div>
                               <div className="flex-1 p-3 flex flex-col justify-between bg-gradient-to-r from-slate-900 to-transparent">
                                  <div>
                                     <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-white text-xs tracking-wide">{product.name}</h3>
                                        <span className="font-mono text-pink-500 text-[10px]">{product.price}</span>
                                     </div>
                                     <div className="flex gap-1 mt-2 flex-wrap">
                                        {product.specs?.slice(0,2).map(spec => (
                                           <span key={spec} className="text-[8px] uppercase border border-slate-700 px-1 rounded text-slate-400 bg-slate-900/50">{spec}</span>
                                        ))}
                                     </div>
                                  </div>
                                  <div className="flex justify-end">
                                     <button className="text-[9px] font-mono text-cyan-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 bg-white/5 rounded">
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
                        className="flex flex-col items-center justify-center py-16 text-slate-600 border border-dashed border-white/10 rounded-lg bg-slate-900/20"
                      >
                         <MessageSquare size={24} className="mb-2 opacity-30" />
                         <p className="font-mono text-[10px] uppercase tracking-widest">Signal Lost</p>
                         <p className="text-[10px] mt-1">No user logs found in local cache.</p>
                      </motion.div>
                   )}
                 </AnimatePresence>

                 {/* Footer */}
                 <div className="py-4 text-center opacity-40 hover:opacity-100 transition-opacity">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
                    <p className="text-[9px] font-mono text-cyan-400">
                       SECURE_CONNECTION // {brandData.id}
                    </p>
                 </div>
          </div>
          {/* END INNER SCROLLABLE */}
        </div>
        {/* END PLACEHOLDER CONTAINER */}
      </main>
    </motion.div>
  );
};

export default GeneralPage;
