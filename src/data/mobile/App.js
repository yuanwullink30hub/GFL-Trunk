import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gpuAccel, ANIMATION_TIMINGS, ANIMATION_EASING } from '../../config/animationStyles';
import { 
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaLinkedin,
  FaGithub,
  FaGlobe
} from 'react-icons/fa';
import { BsMoon, BsSun } from 'react-icons/bs';
import logo from '../../images/logo.png';
import sun2 from '../../images/illustrativesun.png';
import karmanevents from '../../images/slideshow images/karmaneventsPNG.png';
import club49logo from '../../images/slideshow images/club49-logo.png';
import logo1111 from '../../images/slideshow images/1111logo.png';
import placeholder4 from '../../images/slideshow images/placeholder4.svg';
import placeholder5 from '../../images/slideshow images/placeholder5.svg';
import placeholder6 from '../../images/slideshow images/placeholder6.svg';
import placeholder7 from '../../images/slideshow images/placeholder7.svg';
import placeholder8 from '../../images/slideshow images/placeholder8.svg';
import rengiLogo from '../../images/slideshow images/Rengi-logo.png';
import soul from '../../images/Holographichearth.png';
import body from '../../images/holographicbody.png';
import mind from '../../images/Holographicmind.PNG';
import '../../styles/poetry.css';
import '../../styles/text.css';
import '../../styles/subtitles.css';
import '../../styles/buttons.css';
import '../../styles/mobile-header.css';
import '../../styles/logo.css';
import { slideContentMap } from './slides';

const MobileAppContent = ({ darkMode, setDarkMode, data, scrollDirection }) => {

  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [activeView, setActiveView] = React.useState(null); // null = landing, or route string
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [clickedButton, setClickedButton] = React.useState(null);
  const [clickedSlideIndex, setClickedSlideIndex] = React.useState(null); // Track which slide was clicked
  const [buttonCenter, setButtonCenter] = React.useState({ x: '50%', y: '50%' });
  const [isScrolledPastH1, setIsScrolledPastH1] = React.useState(false);
  const [slideshowOpacity, setSlideshowOpacity] = React.useState(0);
  const [isDetailPageExiting, setIsDetailPageExiting] = React.useState(false);
  const [isSlideView, setIsSlideView] = React.useState(false); // Track if came from slide click
  const galleryRef = React.useRef(null);
  const slideshowContainerRef = React.useRef(null);
  const seeMoreButtonRef = React.useRef(null);
  const videoHeaderRef = React.useRef(null);
  const mediaContainerRef = React.useRef(null);
  const textContentContainerRef = React.useRef(null);
  const textContentWrapperRef = React.useRef(null);
  const miniLogoRef = React.useRef(null);
  const slideRefs = React.useRef([]); // Refs for slide circles

  // Calculate button center position for zoom origin relative to the full document
  // Accounts for button rotation and triangle centroid
  const calculateButtonCenter = (buttonName) => {
    const svgClass = `triangleButton${buttonName === 'button1' ? '1' : buttonName === 'button2' ? '2' : '3'}`;
    const allSvgElements = document.querySelectorAll(`.${svgClass}`);
    
    if (allSvgElements.length === 0) return { x: '50%', y: '50%' };
    
    const svgElement = allSvgElements[allSvgElements.length - 1];
    const rect = svgElement.getBoundingClientRect();
    
    // Centroid = (150, 201.67) in viewBox (0-300), normalized to (0.5, 0.672)
    const rotationDeg = buttonName === 'button2' ? -16 : 45;
    const rotationRad = (rotationDeg * Math.PI) / 180;
    
    const svgCenterX = (rect.left + rect.right) / 2;
    const svgCenterY = (rect.top + rect.bottom) / 2;
    
    // Centroid offset from SVG center (0.172 * height)
    const centroidOffsetY = 0.172 * rect.height;
    
    // Apply rotation to centroid offset
    const rotatedOffsetX = -centroidOffsetY * Math.sin(rotationRad);
    const rotatedOffsetY = centroidOffsetY * Math.cos(rotationRad);
    
    let triangleCenterX = svgCenterX + rotatedOffsetX;
    let triangleCenterY = svgCenterY + rotatedOffsetY;
    
    // Manual adjustments per button
    if (buttonName === 'button2') {
      triangleCenterX -= 15;
      triangleCenterY -= 40;
    }
    if (buttonName === 'button3') {
      triangleCenterX += 5;
      triangleCenterY -= 9;
    }
    
    const centerXPercent = (triangleCenterX / window.innerWidth) * 100;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight;
    const absoluteY = triangleCenterY + scrollTop;
    const yPercentOfDocument = (absoluteY / documentHeight) * 100;
    
    return { x: `${centerXPercent}%`, y: `${yPercentOfDocument}%` };
  };

  // Handle button click with zoom and fade - landing page
  const handleButtonClick = (buttonName, path) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setClickedButton(buttonName);
    
    // Calculate the center of the clicked button
    const center = calculateButtonCenter(buttonName);
    setButtonCenter(center);
    
    // Use same timing as slide effect: 1.5s total
    setTimeout(() => {
      setActiveView(path);
      setIsAnimating(false);
      setClickedButton(null);
      window.scrollTo(0, 0);  // Scroll to top of detail page
    }, 1500);
  };

  // Detail page triangle button - fade transition back to media container
  const handleBackToButton = () => {
    // Start the exit animation
    setIsDetailPageExiting(true);
    setIsScrolledPastH1(false);
    
    // Keep detail page visible while overlay fades, then hide it
    setTimeout(() => {
      setActiveView(null);
    }, 300); // When overlay is fully black (0.3s)
    
    // After detail page fades out (0.3s) + landing page fades in (1.2s), scroll to media container
    setTimeout(() => {
      if (mediaContainerRef?.current) {
        const rect = mediaContainerRef.current.getBoundingClientRect();
        const elementTop = rect.top + window.scrollY;
        const elementHeight = rect.height;
        const viewportHeight = window.innerHeight;
        const scrollTarget = Math.max(0, elementTop - (viewportHeight - elementHeight) / 2);
        window.scrollTo(0, scrollTarget);
      }
      setIsScrolledPastH1(false); // Ensure header state stays reset
    }, 1800); // 0.3s hide detail + 1.2s landing fade in + buffer
    
    // Reset exit animation state after full animation completes
    setTimeout(() => {
      setIsDetailPageExiting(false);
      setIsScrolledPastH1(false);
    }, 2000); // Extra buffer to ensure header stays hidden through landing fade-in
  };

  const handleScroll = () => {
    const gallery = galleryRef.current;
    const scrollLeft = gallery.scrollLeft;
    const slideWidth = gallery.children[0]?.offsetWidth || 0;
    const gap = parseInt(window.getComputedStyle(gallery).gap) || 6;
    const scrollOffset = slideWidth + gap;
    const totalSlides = slides.length;
    
    // Calculate current index within one cycle
    let newIndex = Math.round(scrollLeft / scrollOffset) % totalSlides;
    if (newIndex < 0) newIndex += totalSlides;
    
    setCurrentSlide(newIndex);
    
    // Seamless loop: jump to second copy when you reach end of third copy
    const thirdCopyEnd = totalSlides * 3 * scrollOffset;
    
    if (scrollLeft > thirdCopyEnd - scrollOffset) {
      gallery.scrollLeft = totalSlides * scrollOffset;
    }
    // Jump to third copy when you scroll back before second copy
    if (scrollLeft < scrollOffset) {
      gallery.scrollLeft = totalSlides * 2 * scrollOffset;
    }
  };

  const slides = [
    { header: 'KARMAN', subtitle: 'Amsterdam-based techno organization, born from a desire to restore the raw, intimate spirit of underground gatherings. Nights defined by music, energy, and togetherness.', image: karmanevents, bgColor: 'rgba(34, 197, 94, 0.15)', route: '/karman' },
    { header: 'CODE 49', subtitle: 'De nr.1 Businessclub voor MKB-ondernemers die willen doorschalen in een AI-first economie', image: club49logo, bgColor: 'rgba(59, 130, 246, 0.15)', route: '/code49' },
    { header: 'TATTOO SHOP ', subtitle: 'Our focus goes beyond body art; we channel personal stories into spiritual expressions, utilizing fine line tattoos and the ancient stick and poke technique to transform your skin into a canvas of meaning.', image: logo1111, bgColor: 'rgba(168, 85, 247, 0.15)', route: '/tattooshop' },
    { header: 'Slide 4', subtitle: 'Description', image: placeholder4, bgColor: 'rgba(249, 115, 22, 0.15)', route: '/slide4' },
    { header: 'Slide 5', subtitle: 'Description', image: placeholder5, bgColor: 'rgba(236, 72, 153, 0.15)', route: '/slide5' },
    { header: 'Slide 6', subtitle: 'Description', image: placeholder6, bgColor: 'rgba(139, 92, 246, 0.15)', route: '/slide6' },
    { header: 'Slide 7', subtitle: 'Description', image: placeholder7, bgColor: 'rgba(14, 165, 233, 0.15)', route: '/slide7' },
    { header: 'Slide 8', subtitle: 'Description', image: placeholder8, bgColor: 'rgba(34, 197, 94, 0.15)', route: '/slide8' },
    { header: 'RENGI FOODS', subtitle: 'Rengi Foods captures the vibrant spirit of Korean street food, offering authentic and affordable flavors from Seoul\'s streets to your local market. The focus on affordability ensures everyone can enjoy bold Korean tastes without compromise.', image: rengiLogo, bgColor: 'rgba(251, 146, 60, 0.15)', route: '/rengifoods' }
  ];

  // Handle slide click - direct navigation to detail page
  const handleSlideClick = (index, route) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setClickedSlideIndex(index);
    setIsSlideView(true);
    
    // Calculate center of clicked slide circle
    const slideElement = slideRefs.current[index];
    if (slideElement) {
      const rect = slideElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const centerXPercent = (centerX / window.innerWidth) * 100;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight;
      const absoluteY = centerY + scrollTop;
      const yPercentOfDocument = (absoluteY / documentHeight) * 100;
      setButtonCenter({ x: `${centerXPercent}%`, y: `${yPercentOfDocument}%` });
    }
    
    // Same timing as triangle buttons: 1.5s zoom then show detail
    setTimeout(() => {
      setActiveView(route);
      setIsAnimating(false);
      setClickedSlideIndex(null);
      window.scrollTo(0, 0);
    }, 1500);
  };

  // Handle back - direct navigation to landing
  const handleBack = () => {
    setIsDetailPageExiting(true);
    setIsScrolledPastH1(false);
    const wasSlideView = isSlideView; // Capture before reset
    
    // Keep detail page visible while overlay fades, then hide it
    setTimeout(() => {
      setActiveView(null);
    }, 300); // When overlay is fully black (0.3s)
    
    // After detail page fades out (0.3s) + landing page fades in (1.2s), scroll to slideshow container
    setTimeout(() => {
      if (wasSlideView && slideshowContainerRef?.current) {
        // Scroll to center slideshow container
        const rect = slideshowContainerRef.current.getBoundingClientRect();
        const elementTop = rect.top + window.scrollY;
        const elementHeight = rect.height;
        const viewportHeight = window.innerHeight;
        const scrollTarget = Math.max(0, elementTop - (viewportHeight - elementHeight) / 2);
        window.scrollTo(0, scrollTarget);
      } else {
        window.scrollTo(0, 0);
      }
      setIsScrolledPastH1(false);
    }, 1800); // 0.3s hide detail + 1.2s landing fade in + buffer
    
    // Reset exit animation state after full animation completes
    setTimeout(() => {
      setIsDetailPageExiting(false);
      setIsScrolledPastH1(false);
      setIsSlideView(false); // Reset slide view flag
    }, 2000); // Extra buffer to ensure header stays hidden through landing fade-in
  };

  // Handle close slide - same as handleBack for slide content pages
  const handleCloseSlide = () => {
    handleBack();
  };

  // Get content component for active view
  const ActiveContent = activeView ? slideContentMap[activeView] : null;

  React.useEffect(() => {
    // Prevent browser scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    if (!galleryRef.current) return;
    const gallery = galleryRef.current;
    const totalSlides = 9; // Fixed number of slides
    
    // Force center on mount and on every refresh
    const centerSlides = () => {
      // Get the first slide element from the second copy
      const firstSlideInSecondCopy = gallery.children[totalSlides];
      
      if (firstSlideInSecondCopy) {
        // Scroll to center this element
        const slideLeft = firstSlideInSecondCopy.offsetLeft;
        const slideWidth = firstSlideInSecondCopy.offsetWidth;
        const galleryWidth = gallery.offsetWidth;
        const centerScroll = slideLeft - (galleryWidth - slideWidth) / 2;
        
        gallery.scrollLeft = centerScroll;
      }
      setCurrentSlide(0);
    };
    
    // Try multiple times to ensure it sticks
    centerSlides();
    setTimeout(centerSlides, 100);
    setTimeout(centerSlides, 300);
  }, []);

  // Track scroll position relative to video header bottom minus 150px
  React.useEffect(() => {
    const handleScroll = () => {
      // Check if scrolled to middle of video header
      if (videoHeaderRef?.current) {
        const videoRect = videoHeaderRef.current.getBoundingClientRect();
        // Show small logo when at middle of video container
        setIsScrolledPastH1(videoRect.bottom - 480 < 0);
      }
      
      // Update slideshow opacity based on scroll position
      if (slideshowContainerRef?.current) {
        const rect = slideshowContainerRef.current.getBoundingClientRect();
        const containerTop = rect.top;
        
        // Fully hidden if top of container is 120px above viewport top
        if (containerTop <= -120) {
          setSlideshowOpacity(0);
          return;
        }
        
        // Fully visible if top is within 750px
        if (containerTop < 750) {
          setSlideshowOpacity(1);
          return;
        }
        
        // Fully hidden otherwise
        setSlideshowOpacity(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate opacity for KWEEK KRACHTIGE text and media container (based on content visibility, not extended hitbox)
  const calculateMediaOpacity = React.useMemo(() => {
    return () => {
      const visibilityMargin = 30;
      
      try {
        if (mediaContainerRef?.current) {
          const rect = mediaContainerRef.current.getBoundingClientRect();
          const containerTop = rect.top;
          const containerBottom = rect.bottom;
          const viewportHeight = window.innerHeight;
          
          // Content starts at 175px within container, so adjust positions
          // The buttons/video are placed higher than container bounds
          const contentTop = containerTop - 15;
          const contentBottom = containerBottom - 175; // Subtract empty space at bottom
          
          // Instant fade in: start fading in well before content enters viewport
          if (contentTop < 0 && contentTop > -visibilityMargin) {
            return 1;
          }
          
          // Instant fade out: from bottom of viewport onwards
          if (contentBottom > viewportHeight && contentBottom < viewportHeight + visibilityMargin) {
            return 0;
          }
          
          // Fully visible if content is within viewport
          if (contentTop >= 0 && contentBottom <= viewportHeight) {
            return 1;
          }
          
          // Fully hidden if beyond margins
          return 0;
        }
        return 1;
      } catch (e) {
        return 1;
      }
    };
  }, []);

  // Calculate opacity for text content (h1 and paragraph)
  const calculateTextContentOpacity = React.useMemo(() => {
    return () => {
      const visibilityMargin = 120;
      try {
        if (textContentWrapperRef?.current) {
          const rect = textContentWrapperRef.current.getBoundingClientRect();
          const containerTop = rect.top;
          const containerBottom = rect.bottom;
          const viewportHeight = window.innerHeight;
          
          if (containerTop < 0 && containerTop > -visibilityMargin) return 1;
          if (containerBottom > viewportHeight && containerBottom < viewportHeight + visibilityMargin) return 0;
          if (containerTop >= 0 && containerBottom <= viewportHeight) return 1;
          return 0;
        }
        return 1;
      } catch (e) {
        return 1;
      }
    };
  }, []);

  React.useEffect(() => {
    // Prevent browser scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    
    if (!galleryRef.current) return;
    const gallery = galleryRef.current;
    const totalSlides = 9; // Fixed number of slides
    
    // Force center on mount and on every refresh
    const centerSlides = () => {
      // Get the first slide element from the second copy
      const firstSlideInSecondCopy = gallery.children[totalSlides];
      
      if (firstSlideInSecondCopy) {
        // Scroll to center this element
        const slideLeft = firstSlideInSecondCopy.offsetLeft;
        const slideWidth = firstSlideInSecondCopy.offsetWidth;
        const galleryWidth = gallery.offsetWidth;
        const centerScroll = slideLeft - (galleryWidth - slideWidth) / 2;
        
        gallery.scrollLeft = centerScroll;
      }
      setCurrentSlide(0);
    };
    
    // Try multiple times to ensure it sticks
    centerSlides();
    setTimeout(centerSlides, 100);
    setTimeout(centerSlides, 300);
  }, []);

  return (
    <div style={{
      width: '100%',
      overflow: 'hidden',
      backgroundColor: '#150a24ff',
      display: activeView ? 'block' : 'block' // Content pages hidden via AnimatePresence
    }}>
      {/* Content Overlay - Shows when a slide is active */}
      <AnimatePresence mode="wait">
        {activeView && ActiveContent && (
          <motion.div
            key="content-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: {
                type: 'tween',
                duration: isDetailPageExiting ? 0.6 : 0.9,
                ease: 'easeInOut'
              }
            }}
            onExitComplete={() => {
              setIsDetailPageExiting(false);
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2000,
              overflow: 'auto',
              transformOrigin: clickedButton ? (buttonCenter.x + ' ' + buttonCenter.y) : '50% 50%',
              display: activeView ? 'block' : 'none',
              ...gpuAccel.opacityOnly
            }}
          >
            <ActiveContent onBack={handleBack} onBackToButton={handleBackToButton} onCloseSlide={handleCloseSlide} activeView={activeView} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit overlay - Black screen during transition */}
      <AnimatePresence>
        {isDetailPageExiting && (
          <motion.div
            key="exit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: {
                type: 'tween',
                duration: 0.6,
                ease: 'easeInOut'
              }
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1999,
              backgroundColor: '#150a24ff',
              pointerEvents: 'none',
              ...gpuAccel.light
            }}
          />
        )}
      </AnimatePresence>

      {/* Page content wrapper - fades when button or slide is clicked */}
      <motion.div
        animate={{
          opacity: !isAnimating ? 1 : ((clickedButton || clickedSlideIndex !== null) ? 0 : 1),
          scale: (clickedButton || clickedSlideIndex !== null) && isAnimating ? 15 : 1
        }}
        transition={{ 
          scale: {
            type: 'tween',
            duration: 1.5,
            delay: 0,
            ease: 'easeInOut'
          },
          opacity: {
            type: 'tween',
            duration: isDetailPageExiting ? 1 : 0.3,
            delay: !isAnimating ? 0.6 : (activeView ? 0 : 0.6),
            ease: 'easeInOut'
          }
        }}
        key={`content-${isDetailPageExiting}`}
        style={{
          transformOrigin: (clickedButton || clickedSlideIndex !== null) ? (buttonCenter.x + ' ' + buttonCenter.y) : '50% 50%',
          visibility: isDetailPageExiting ? 'hidden' : 'visible',
          pointerEvents: isDetailPageExiting ? 'none' : 'auto',
          ...(isAnimating ? gpuAccel.heavy : { willChange: 'auto' })
        }}
      >
      {/* Mobile Header - Logo (normal size centered, small size top-right) */}
      <header className={`fixed bg-transparent mobile-header ${scrollDirection === 'down' ? 'logo-fade-out' : 'logo-fade-in'}`} style={{
        zIndex: activeView ? 1 : 9999, 
        overflow: 'hidden',
        top: isScrolledPastH1 ? '1rem' : '0',
        right: isScrolledPastH1 ? '1rem' : 'auto',
        bottom: isScrolledPastH1 ? 'auto' : 'auto',
        left: isScrolledPastH1 ? 'auto' : '0',
        width: isScrolledPastH1 ? 'auto' : '100vw',
        display: activeView || isDetailPageExiting || isAnimating ? 'none' : 'block'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isScrolledPastH1 ? 'center' : 'center',
          padding: isScrolledPastH1 ? '0.5rem' : '1rem 1.5rem',
          gap: isScrolledPastH1 ? '0.75rem' : '0',
          backgroundColor: isScrolledPastH1 ? 'rgba(0, 0, 0, 0.9)' : 'transparent',
          borderRadius: isScrolledPastH1 ? '50px' : '0'
        }}>
          <button
            onClick={() => {
              const footerMenu = document.getElementById('footer-menu');
              if (footerMenu) footerMenu.scrollIntoView({ behavior: 'smooth' });
            }}
            className="logo-btn"
            title="Go to menu"
            style={{ marginRight: isScrolledPastH1 ? '-10px' : '0' }}
          >
            <img src={logo} alt="Garden For Life Logo" className="logo-img" style={{ width: isScrolledPastH1 ? '48px' : '176px', height: isScrolledPastH1 ? '48px' : '176px' }} />
          </button>
          
          <button
            onClick={() => window.location.href = '/login'}
            className="p-2 hover:bg-gray-700 transition-colors duration-300"
            title="Go to login"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...(isScrolledPastH1 ? { position: 'relative' } : { position: 'fixed', right: '1.52rem', top: '1.9rem', transform: 'scale(0.97)' })
            }}
          >
            <img src={sun2} alt="Sun" style={{ width: '55px', height: '55px', transformOrigin: 'center', rotate: '-30deg', pointerEvents: 'none', display: 'block' }} />
          </button>
        </div>
      </header>

      {/* Black wallpaper container */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          width: '100vw',
          height: 'calc(150px - 3rem)',
          backgroundColor: '#000000',
          zIndex: 0,
          marginLeft: 'calc(-50vw + 50%)'
        }}
      />

      {/* Full-screen Video Container (scrollable behind logo) */}
      <div 
        ref={videoHeaderRef}
        className="overflow-visible"
        style={{
          position: 'relative',
          top: 0,
          left: 0,
          right: 0,
          width: '100vw',
          height: '85vh',
          marginTop: 'calc(150px - 3rem)',
          zIndex: 1,
          marginLeft: 'calc(-50vw + 50%)'
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src="/videos/Holographicheader.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Text content container */}
      <div
        ref={textContentContainerRef}
        className="w-full relative"
        style={{
          background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #150a24ff',
          zIndex: 1,
          position: 'relative',
          paddingTop: '100px'
        }}
      >
        {/* Text container over image */}
        <div
          className="flex flex-col items-center justify-start w-full"
          style={{
            zIndex: 2,
            pointerEvents: 'auto',
            paddingLeft: '20px',
            paddingRight: '20px',
            position: 'relative'
          }}
        >
            {/* Text content wrapper - move as a unit */}
            <div ref={textContentWrapperRef} style={{
              marginTop: 'calc(-9px - 200px + 75px - 100px + 25px)',
              width: '100%',
              opacity: calculateTextContentOpacity(),
              transition: 'opacity 0.5s ease',
              position: 'relative',
              zIndex: 2
            }}>
              <h1 className="poetry" style={{
                marginTop: '45px',
                marginBottom: 'clamp(24.65px, 6.163vw, 43.12px)',
                fontSize: 'clamp(0.8059rem, 3.842vw, 2.370rem)',
                lineHeight: '1.2',
                width: '100%',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                textAlign: 'right',
                color: '#FFFEF0',
                filter: 'brightness(0.9)'
              }}>DE LUIDE STILTE <br/>
                 EN DE INTENSE KALMTE <br/> 
                 WIJZEN MIJ DE WEG <br/>
                 VAN HET HART NAAR HET HOOFD           </h1>

              {/* Paragraph inside container */}
              <p className="text" style={{
                width: '100%',
                fontSize: 'clamp(14px, 3.5vw, 28px)',
                marginTop: '45px',
                marginBottom: '0',
                paddingBottom: '25px',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                lineHeight: '1.4',
                backgroundColor: 'transparent'
              }}>De ontembare chaos uit haar wil in het uni-versum. <br />
 
               Masculiniteit stroomt op harmonieuze wijze mee met de natuurlijke stroming, een stroming met veel gezichten en wonderschone vormen.

              </p>
          </div>{/* End text content wrapper */}
        </div>{/* End text container over image */}

        {/* KWEEK KRACHTIGE text - fades with media container */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'left',
          paddingLeft: '20px',
          paddingRight: '20px',
          position: 'relative',
          zIndex: 2
        }}>
          <span className="subtitles" style={{fontSize: 'clamp(0.8059rem, 3.842vw, 2.370rem)', marginTop: '3rem', display: 'block', fontWeight: '500', lineHeight: '1.2', opacity: calculateMediaOpacity(), transition: 'opacity 0.5s ease', filter: 'brightness(0.9)'}}>KWEEK KRACHTIGE <br/>KWETSBAARHEID</span>
        </div>

    {/* Full Screen Gradient Container */}
      <div style={{
        position: 'absolute',
        top: 'clamp(-55px, 10vw, -15px)',
        width: '100vw',
        height: '900px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.8) 12%, rgba(14, 7, 19, 0.6) 22%, rgba(45, 10, 68, 0.5) 33%, rgba(71, 3, 110, 0.6) 50%, rgba(39, 7, 61, 0.5) 67%, rgba(21, 10, 36, 0) 100%)',
        overflow: 'visible',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
      </div>
        {/* Media Container - Buttons and Video together */}
        <div 
          ref={mediaContainerRef} 
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(300px, 80vw, 600px)',
            zIndex: 8,
            overflow: 'visible',
            maxWidth: 'clamp(25rem, 90vw, 75rem)',
            margin: 'clamp(4rem + 2rem + 30px, 5vw + 2rem + 30px, 6rem + 2rem + 30px) auto 0 auto',
            pointerEvents: 'none',
            opacity: calculateMediaOpacity(),
            transition: 'opacity 0.6s ease'
          }}>
          {/* Button container - absolute inside media container */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 5
          }}>
            {/* Button 2 */}
              <motion.svg 
                className="triangleButton2"
                width="clamp(60px, 28vw, 220px)" 
                height="clamp(60px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                overflow="visible"
                pointerEvents="none"
                animate={{ scale: [1.5, 1.62, 1.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                style={{
                  display: 'block',
                  position: 'absolute',
                  left: 'calc(clamp(0%, 5vw, 15%) - 0.3rem)',
                  top: 'clamp(-22%, -17vw, -12%)',
                  scale: 1.5,
                  rotate: '-16deg',
                  cursor: 'pointer'
                }}
              >
                <g style={{overflow: 'visible'}}>
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                    fill="rgba(0,0,0,0.001)"
                    pointerEvents="all"
                    onClick={() => handleButtonClick('button2', '/teachers')}
                    onMouseEnter={(e) => {
                      const visiblePath = e.target.nextElementSibling;
                      if(visiblePath) visiblePath.style.stroke = '#0c0418ff';
                    }}
                    onMouseLeave={(e) => {
                      const visiblePath = e.target.nextElementSibling;
                      if(visiblePath) visiblePath.style.stroke = '#0c0418ff';
                    }}
                  />
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                    fill="none" 
                    stroke="rgba(167, 59, 198, 0.4)" 
                    strokeWidth="clamp(14px, 3.5vw, 24px)" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                    style={{transition: 'stroke 0.3s ease', filter: 'drop-shadow(0 0 8px rgba(167, 59, 198, 0.8)) drop-shadow(0 0 16px rgba(167, 59, 198, 0.4))'}}
                  />
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                    fill="none" 
                    stroke="rgba(167, 59, 198, 0.5)" 
                    strokeWidth="clamp(8px, 2vw, 15px)" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                    className="breathingStroke"
                    style={{transition: 'stroke 0.3s ease', filter: 'drop-shadow(0 0 8px rgba(167, 59, 198, 0.8)) drop-shadow(0 0 16px rgba(167, 59, 198, 0.4))'}}
                  />
                  <defs>
                    <clipPath id="triangle2-clip">
                      <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" />
                    </clipPath>
                  </defs>
                  <image 
                    href={body} 
                    x="45" y="86.32" width="187.99" height="175.34" 
                    preserveAspectRatio="xMidYMid slice"
                    style={{pointerEvents: 'none', filter: 'brightness(0.97)'}}
                    transform="rotate(1 -300 1000)"
                  />
                </g>
              </motion.svg>
             {/* Button 3 */}
              <motion.svg 
                className="triangleButton3"
                width="clamp(60px, 28vw, 220px)" 
                height="clamp(60px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                overflow="visible"
                pointerEvents="none"
                animate={{ scale: [1.5, 1.62, 1.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                style={{
                  display: 'block',
                  position: 'absolute',
                  left: 'calc(clamp(29%, 34vw, 44%) - 0.3rem)',
                  top: 'clamp(-40.5%, -35.5vw, -30.5%)',
                  scale: 1.5,
                  rotate: '44deg',
                  cursor: 'pointer'
                }}
              >
                <g style={{overflow: 'visible'}}>
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z"
                    fill="rgba(0,0,0,0.001)"
                    pointerEvents="all"
                    style={{cursor: 'pointer'}}
                    onClick={() => handleButtonClick('button3', '/mind')}
                    onMouseEnter={(e) => {
                      const visiblePath = e.target.nextElementSibling;
                      if(visiblePath) visiblePath.style.stroke = '#0c0418ff';
                    }}
                    onMouseLeave={(e) => {
                      const visiblePath = e.target.nextElementSibling;
                      if(visiblePath) visiblePath.style.stroke = '#0c0418ff';
                    }}
                  />
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                    fill="none" 
                    stroke="rgba(167, 59, 198, 0.33)" 
                    strokeWidth="clamp(14px, 3.5vw, 24px)" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                    style={{transition: 'stroke 0.3s ease', filter: 'drop-shadow(0 0 8px rgba(167, 59, 198, 0.88)) drop-shadow(0 0 16px rgba(167, 59, 198, 0.44))'}}
                  />
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                    fill="none" 
                    stroke="#22c55e" 
                    strokeWidth="clamp(8px, 2vw, 15px)" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                    className="breathingStroke"
                    style={{transition: 'stroke 0.3s ease', filter: 'drop-shadow(0 0 8px rgba(167, 59, 198, 0.88)) drop-shadow(0 0 16px rgba(167, 59, 198, 0.44))'}}
                  />
                  <defs>
                    <clipPath id="triangle3-clip">
                      <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" />
                    </clipPath>
                  </defs>
                  <image 
                    href={mind} 
                    x="55.67" y="110.90" width="154.08" height="143.81" 
                    preserveAspectRatio="xMidYMid slice"
                    style={{pointerEvents: 'none'}}
                    transform="rotate(-55 175 165)"
                  />
                </g>
              </motion.svg>
              {/* Button 1 */}
              <motion.svg 
                className="triangleButton1"
                width="clamp(60px, 28vw, 220px)" 
                height="clamp(60px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                overflow="visible"
                pointerEvents="none"
                animate={{ scale: [1.5, 1.62, 1.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                style={{
                  display: 'block',
                  position: 'absolute',
                  left: 'calc(clamp(18%, 21.5vw, 28%) - 0.3rem)',
                  top: 'clamp(6%, 11vw, 46%)',
                  scale: 1.5,
                  rotate: '44deg',
                  cursor: 'pointer'
                }}
              >
                <g style={{overflow: 'visible'}}>
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                    fill="none" 
                    stroke="rgba(167, 59, 198, 0.3)" 
                    strokeWidth="clamp(14px, 3.5vw, 24px)" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                    style={{transition: 'stroke 0.3s ease', filter: 'drop-shadow(0 0 8px rgba(167, 59, 198, 0.8)) drop-shadow(0 0 16px rgba(167, 59, 198, 0.4))'}}
                  />
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                    fill="none" 
                    stroke="#22c55e" 
                    strokeWidth="clamp(8px, 2vw, 15px)" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                    className="breathingStroke"
                    style={{transition: 'stroke 0.3s ease', filter: 'drop-shadow(0 0 8px rgba(167, 59, 198, 0.8)) drop-shadow(0 0 16px rgba(167, 59, 198, 0.4))'}}
                  />
                  <defs>
                    <clipPath id="triangle1-clip">
                      <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" />
                    </clipPath>
                  </defs>
                  <image 
                    href={soul} 
                    x="45.69" y="90.52" width="169.49" height="158.19" 
                    preserveAspectRatio="xMidYMid slice"
                    style={{pointerEvents: 'none', filter: 'brightness(0.97)'}}
                    transform="rotate(-40 200 145)"
                  />
                </g>
              </motion.svg>
            </div>{/* End button container */}

          {/* WebM Video - alongside buttons */}
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              display: 'block',
              width: 'auto',
              height: 'auto',
              mixBlendMode: 'screen',
              backgroundColor: 'transparent',
              opacity: 1,
              transform: 'scale(0.69984) translate(calc(clamp(1.875rem, 7vw, 5rem) + 8% + 1.3rem - 0.85rem), -10%)',
              transformOrigin: 'top left',
              marginLeft: 'calc(clamp(1.875rem, 7vw, 5rem) + 8% + 1.3rem - 0.85rem + 0.8rem + 1.8rem)',
              position: 'absolute',
              top: 'clamp(-15.875rem, calc(-20vw - 5rem), -9.625rem)',
              left: 0,
              right: 0,
              zIndex: 6,
              pointerEvents: 'none'
            }}
          >
            <source src="/videos/KnightHD_2.mp4" type="video/mp4; codecs=hvc1" />
            <source src="/videos/holographicknightwebkit .webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>{/* End media container */}

     {/* Header Container */}
          <div className="subtitles" style={{
            position: 'relative',
            width: '100%',
            maxWidth: 'clamp(25rem, 90vw, 75rem)',
            margin: '0 auto 0 auto',
            marginTop: 'calc(clamp(-1.75rem + 2px, -1.5vw + 2px, -1.5rem + 2px) + 1.5rem)',
            marginBottom: 'calc(clamp(0.75rem, 3vw, 2rem) + 1rem)',
            fontSize: 'clamp(0.8059rem, 3.842vw, 2.370rem)',
            color: '#FFFEF0',
            lineHeight: '1.2',
            textAlign: 'center',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            backgroundColor: 'transparent',
            zIndex: 10,
            opacity: slideshowOpacity,
            transition: 'opacity 0.6s ease',
            filter: 'brightness(0.9)'
          }}>
            GARDENS
          </div>

          {/* Slideshow Grid Container */}
          <motion.div 
            className="hideScrollbar"
            ref={(el) => {
              galleryRef.current = el;
              slideshowContainerRef.current = el;
            }}
            onScroll={handleScroll}
            animate={{
              scale: activeView ? 15 : 1,
              ...(activeView ? gpuAccel.heavy : { willChange: 'auto' })
            }}
            transition={{
              scale: {
                duration: ANIMATION_TIMINGS.PAGE_ZOOM,
                ease: ANIMATION_EASING.SMOOTH
              }
            }}
            style={{
              position: 'relative',
              width: '100vw',
              maxWidth: '100vw',
              margin: 'clamp(-1.25rem, -0.5vw, -0.75rem) 0 0 0',
              paddingTop: 'clamp(5px, 1.5vw, 15px)',
              display: 'flex',
              overflowX: 'auto',
              overflowY: 'visible',
              gap: 'clamp(0.75rem, 5vw, 3.75rem)',
              backgroundColor: 'transparent',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              alignItems: 'flex-start',
              zIndex: 9,
              opacity: slideshowOpacity,
              transition: 'opacity 0.5s ease',
              transformOrigin: 'center center'
            }}
          >
          {[...slides, ...slides, ...slides].map((slide, index) => (
            <div
              key={index}
              style={{
                flex: '0 0 clamp(120px, 43.095vw, 301.665px)',
                backgroundColor: 'transparent',
                overflow: 'visible'
              }}
            >
              {/* Slide Container - Wraps Image, Header, and Subtitle */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  backgroundColor: 'transparent',
                  height: '100%',
                  overflow: 'visible'
                }}
              >
                {/* Image Circle */}
                <motion.div 
                  ref={(el) => slideRefs.current[index] = el}
                  className="breathingBorder" 
                  onClick={() => handleSlideClick(index, slides[index % 9].route)}
                  animate={{
                    scale: [1, 1.08, 1],
                    borderColor: ['rgba(239, 134, 22, 0.5)', 'rgba(167, 59, 198, 0.5)', 'rgba(239, 134, 22, 0.5)']
                  }}
                  transition={{
                    scale: {
                      duration: ANIMATION_TIMINGS.WELCOME_TRIANGLE_PULSE,
                      repeat: Infinity,
                      ease: ANIMATION_EASING.SMOOTH,
                      delay: (index % 9) * (ANIMATION_TIMINGS.WELCOME_TRIANGLE_PULSE / 9)
                    },
                    borderColor: {
                      duration: ANIMATION_TIMINGS.WELCOME_TRIANGLE_PULSE,
                      repeat: Infinity,
                      ease: ANIMATION_EASING.SMOOTH,
                      delay: (index % 9) * (ANIMATION_TIMINGS.WELCOME_TRIANGLE_PULSE / 9)
                    },
                    duration: 0.6,
                    ease: 'easeInOut'
                  }}
                  style={{
                    position: 'relative',
                    width: 'clamp(100px, 38.7855vw, 271.4985px)',
                    height: 'clamp(100px, 38.7855vw, 271.4985px)',
                    margin: '0 auto',
                    padding: 'clamp(8px, 3.06vw, 22.95px)',
                    overflow: 'hidden',
                    borderRadius: '50%',
                    border: '3px solid rgba(239, 134, 22, 0.5)',
                    boxSizing: 'border-box',
                    zIndex: 2,
                    flexShrink: 0,
                    cursor: 'pointer',
                    transformOrigin: '50% 50%',
                    pointerEvents: isAnimating ? 'none' : 'auto',
                    animationDelay: `${(index % 9) * (4 / 9)}s`
                  }}
                >
                  <img
                    src={slide.image}
                    alt={slide.header}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transform: index % 9 === 0 ? 'scale(1.3)' : index % 9 === 1 ? 'scale(0.85)' : index % 9 === 2 ? 'scale(1.375)' : index % 9 === 8 ? 'scale(1.32)' : 'scale(1)'
                    }}
                  />
                </motion.div>

                {/* Header */}
                <motion.div 
                  animate={{
                    color: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616']
                  }}
                  transition={{
                    duration: ANIMATION_TIMINGS.WELCOME_TRIANGLE_PULSE,
                    repeat: Infinity,
                    ease: ANIMATION_EASING.SMOOTH,
                    delay: (index % 9) * (ANIMATION_TIMINGS.WELCOME_TRIANGLE_PULSE / 9)
                  }}
                  style={{
                    marginTop: 'clamp(12px, 2vw, 18px)',
                    fontSize: 'clamp(15.4px, 3.85vw, 30.8px)',
                    fontWeight: '500',
                    fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                    lineHeight: '1.4',
                    color: '#ef8616',
                    backgroundColor: 'transparent',
                    textAlign: 'center',
                    maxWidth: 'clamp(120px, 43.095vw, 301.665px)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {slide.header}
                </motion.div>

                {/* Text Subtitle */}
                <div style={{
                  marginTop: 'clamp(4px, 0.5vw, 6px)',
                  fontSize: 'clamp(14px, 3.5vw, 28px)',
                  color: '#FFFEF0',
                  backgroundColor: 'transparent',
                  textAlign: 'center',
                  maxHeight: 'clamp(60px, 15vw, 120px)',
                  maxWidth: 'clamp(120px, 43.095vw, 301.665px)',
                  overflow: 'hidden',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  textOverflow: 'ellipsis'
                }}>
                  {slide.subtitle}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
        
        {/* Slide Indicators */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(8px, 2vw, 16px)',
          marginTop: 'clamp(20px, 3vw, 30px)',
          marginBottom: 'clamp(20px, 3vw, 30px)',
          paddingTop: 'clamp(4px, 1vw, 8px)',
          paddingBottom: 'clamp(4px, 1vw, 8px)',
          position: 'relative',
          width: '100%',
          overflow: 'visible',
          opacity: slideshowOpacity,
          transition: 'opacity 0.375s ease'
        }}>
          {slides.map((_, index) => (
            <div
              key={index}
              onClick={() => {
                const slideWidth = galleryRef.current.children[0]?.offsetWidth || 0;
                const gap = parseInt(window.getComputedStyle(galleryRef.current).gap) || 6;
                const scrollPosition = (slides.length + index) * (slideWidth + gap);
                galleryRef.current.scrollLeft = scrollPosition;
              }}
              style={{
                width: 'clamp(8px, 2vw, 14px)',
                height: 'clamp(8px, 2vw, 14px)',
                borderRadius: '50%',
                backgroundColor: currentSlide === index ? '#ef8616' : '#FFFEF0',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: 1
              }}
            />
          ))}
        </div>
        
        {/* See More Button */}
        <div ref={seeMoreButtonRef} style={{
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
          width: '100%',
          marginTop: 'clamp(20px, 3vw, 30px)',
          marginBottom: 'clamp(40px, 10vw, 80px)',
          opacity: slideshowOpacity,
          transition: 'opacity 0.6s ease'
        }}>
          <motion.button
            className="breathingBorder"
            onClick={() => {
              if (isAnimating) return;
              setIsAnimating(true);
              setClickedButton('seeMore');
              const center = calculateButtonCenter('button1');
              setButtonCenter(center);
              setTimeout(() => {
                window.location.href = '/gardeners';
              }, 1500);
            }}
            animate={clickedButton === 'seeMore' ? {
              scale: [1, 1.2, 1.5],
              opacity: [1, 0.5, 0]
            } : {
              scale: [1, 1.08, 1]
            }}
            transition={clickedButton === 'seeMore' ? {
              duration: 1.5,
              ease: 'easeInOut',
              times: [0, 0.4, 1]
            } : {
              scale: {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 3
              },
              duration: 0.3
            }}
            style={{
              padding: 'clamp(7.5px, 1.5vw, 12px) clamp(18px, 3.75vw, 30px)',
              fontSize: 'clamp(10.5px, 2.25vw, 13.5px)',
              backgroundColor: 'transparent',
              color: '#FAF9F6',
              border: '2px solid #FFFEF0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transformOrigin: buttonCenter,
              pointerEvents: isAnimating ? 'none' : 'auto',
              animationDelay: '3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#ef8616';
              e.target.style.borderColor = '#ef8616';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = '#FFFEF0';
            }}
          >
            ZIE MEER
          </motion.button>
        </div>

      </div>{/* End text content container */}

  

      {/* Contact Section */}
      <section id="contact" style={{
        position: 'relative',
        width: '100%',
        maxWidth: 'clamp(400px, 90vw, 1200px)',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: 'clamp(35px, 7vw, 70px)',
        marginTop: 'clamp(400px, 80vw, 800px)',
        marginBottom: 'clamp(35px, 7vw, 70px)'
      }}>
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center space-x-3 p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                <FaMapMarkerAlt style={{color: '#f22b00', fontSize: 'clamp(16px, 6vw, 32px)'}} />
                <div>
                  <p className="font-semibold" style={{color: '#f22b00', fontSize: 'clamp(12px, 4vw, 20px)'}}>Location</p>
                  <p className="text-gray-600 dark:text-gray-400" style={{ fontSize: 'clamp(10px, 3vw, 18px)' }}>
                    {data?.basics?.location?.city}, {data?.basics?.location?.country}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                <FaPhone style={{color: '#f22b00', fontSize: 'clamp(16px, 6vw, 32px)'}} />
                <div>
                  <p className="font-semibold" style={{color: '#f22b00', fontSize: 'clamp(12px, 4vw, 20px)'}}>Phone</p>
                  <a href={`tel:${data?.basics?.phone}`} style={{color: '#f22b00', fontSize: 'clamp(10px, 3vw, 18px)'}}>
                    {data?.basics?.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                <FaEnvelope style={{color: '#f22b00', fontSize: 'clamp(16px, 6vw, 32px)'}} />
                <div>
                  <p className="font-semibold" style={{color: '#f22b00', fontSize: 'clamp(12px, 4vw, 20px)'}}>Email</p>
                  <a href={`mailto:${data?.basics?.email}`} style={{color: '#f22b00', fontSize: 'clamp(10px, 3vw, 18px)'}}>
                    {data?.basics?.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-300 dark:border-gray-600">
              <h4 className="subtitles font-semibold mb-4 text-center" style={{color: '#f22b00', fontSize: 'clamp(14px, 4.5vw, 26px)'}}>Follow me</h4>
              <div className="flex justify-center space-x-4">
                {data?.basics?.profiles?.map((profile, idx) => {
                  const icons = {
                    LinkedIn: <FaLinkedin style={{color: '#f22b00', fontSize: 'clamp(20px, 7vw, 42px)'}} />,
                    GitHub: <FaGithub style={{color: '#f22b00', fontSize: 'clamp(20px, 7vw, 42px)'}} />,
                    Website: <FaGlobe style={{color: '#f22b00', fontSize: 'clamp(20px, 7vw, 42px)'}} />
                  };
                  return (
                    <a
                      key={idx}
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:scale-110 transition-transform duration-300"
                      style={{fontSize: 'clamp(20px, 7vw, 42px)', display: 'flex'}}
                    >
                      {icons[profile.network] || <FaGlobe style={{color: '#f22b00'}} />}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Footer with Navigation */}
      <footer id="footer-menu" style={{
        position: 'relative',
        width: '100%',
        background: 'linear-gradient(to right, rgb(31, 41, 55), rgb(17, 24, 39))',
        color: '#FAF9F6',
        padding: 'clamp(24px, 6vw, 48px)',
        marginTop: 'clamp(35px, 7vw, 70px)'
      }}>
        <div className="container mx-auto px-6 text-center">
          {/* Footer Navigation */}
          <div className="flex justify-center items-center space-x-4 mb-4">
           {/* Clickable Logo */}
            <button
              ref={miniLogoRef}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth', duration: 1000 });
              }}
              className="logo-btn flex-shrink-0"
              title="Back to top"
            >
              <img src={logo} alt="Garden For Life Logo" className="logo-img logo-sm" />
            </button>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-3">
              <button
                onClick={() => window.location.href = '/gardeners'}
                className="transition-colors duration-300 hover:text-green-600"
              >
                Home
              </button>
              <button
                onClick={() => window.location.href = '/gardeners'}
                className="transition-colors duration-300 hover:text-green-600"
              >
                Contact
              </button>
            </nav>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-300"
            >
              {darkMode ? <BsSun className="text-5xl" style={{color: '#eb7e09ff'}} /> : <BsMoon className="text-blue-600 text-5xl" />}
            </button>
          </div>

          {/* Company Info */}
          <div className="mb-3">
            <h4 className="header mb-1">{data?.basics?.name}</h4>
            <p className="subtitles text-gray-400">{data?.basics?.label}</p>
          </div>
          
          <div className="border-t border-gray-700 pt-4">
            <p className="subtitles text-gray-400">
              © 2025 {data?.basics?.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </motion.div>
    </div>
  );
}

export default MobileAppContent;
