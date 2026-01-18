import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gpuAccel, ANIMATION_TIMINGS, ANIMATION_EASING } from '../../config/animationStyles';
import HoloEarth from '../../components/earthholo';
import Mindholo from '../../components/Mindholo';
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

const MobileAppContent = React.forwardRef(({ darkMode, setDarkMode, data, scrollDirection, onDeltawerken }, ref) => {

  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [activeView, setActiveView] = React.useState(null); // null = landing, or route string
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [showFooterPopup, setShowFooterPopup] = React.useState(false);
  const [clickedButton, setClickedButton] = React.useState(null);
  const [buttonCenter, setButtonCenter] = React.useState({ x: '50%', y: '50%' });
  const [isScrolledPastH1, setIsScrolledPastH1] = React.useState(false); // Track when to hide large logo
  const [slideshowOpacity, setSlideshowOpacity] = React.useState(0);
  const [isDetailPageExiting, setIsDetailPageExiting] = React.useState(false);
  const [isLandingFadingOut, setIsLandingFadingOut] = React.useState(false); // Track landing fade out for slide clicks
  // eslint-disable-next-line no-unused-vars
  const [isSlideView, setIsSlideView] = React.useState(false); // Track if came from slide click
  const [lastActiveView, setLastActiveView] = React.useState(null); // Track last clicked button/detail for Garden button return
  
  // Helper function to navigate to external page (Garden button) using handleBackToButton logic
  const navigateToGardeners = () => {
    // Start the exit animation
    setIsDetailPageExiting(true);
    
    // Keep detail page visible while overlay fades, then hide it
    setTimeout(() => {
      if (activeView) {
        setActiveView(null);
        setIsScrolledPastH1(false); // Reset H1 visibility when returning to landing
        window.scrollTo(0, 0); // Scroll to top so H1 is in view
      }
    }, 300); // When overlay is fully black (0.3s)
    
    // After detail page fades out (0.3s) + landing page fades in (1.2s), save scroll and navigate
    setTimeout(() => {
      sessionStorage.setItem('lastDetailPage', lastActiveView || '');
      sessionStorage.setItem('externalNavigation', 'true');
      
      // Reset animation state before navigating
      startTransition(() => {
        setIsDetailPageExiting(false);
        setIsSlideView(false); // Reset slide view flag
      });
      
      // Navigate to gardeners
      window.location.href = '/gardeners';
    }, 1800); // 0.3s hide detail + 1.2s landing fade in + buffer
  };
  
  // useTransition for deferring non-critical state updates during animations
  const [, startTransition] = React.useTransition();
  
  const galleryRef = React.useRef(null);
  const slideshowContainerRef = React.useRef(null);
  const seeMoreButtonRef = React.useRef(null);
  const videoHeaderRef = React.useRef(null);
  const mediaContainerRef = React.useRef(null);
  const textContentContainerRef = React.useRef(null);
  const textContentWrapperRef = React.useRef(null);
  const miniLogoRef = React.useRef(null);
  const knightVideoRef = React.useRef(null);
  const slideRefs = React.useRef([]); // Refs for slide circles

  // Calculate button center position for zoom origin relative to the full document
  // Accounts for button rotation and triangle centroid
  // Also calculates the zoom scale based on button size and viewport position
  const calculateButtonCenter = (buttonName) => {
    const svgClass = `triangleButton${buttonName === 'button1' ? '1' : buttonName === 'button2' ? '2' : '3'}`;
    const allSvgElements = document.querySelectorAll(`.${svgClass}`);
    
    if (allSvgElements.length === 0) return { x: '50%', y: '50%', zoom: 15 };
    
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
    
    // Uniform adjustment to move up by 3 rem (48px)
    const uniformUpwardAdjustment = 48;
    triangleCenterY -= uniformUpwardAdjustment;
    
    // Manual adjustments per button
    if (buttonName === 'button2') {
      triangleCenterX -= 15;
      triangleCenterY -= 40;
    }
    if (buttonName === 'button3') {
      triangleCenterX += 5;
      triangleCenterY -= 9;
    }
    if (buttonName === 'button1') {
      // button1 also needs adjustment
      triangleCenterY += 0; // Will be adjusted if needed
    }
    
    const centerXPercent = (triangleCenterX / window.innerWidth) * 100;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight;
    const absoluteY = triangleCenterY + scrollTop;
    const yPercentOfDocument = (absoluteY / documentHeight) * 100;
    
    // Calculate zoom scale based on button size and viewport
    // Zoom should fill the viewport with the button at its current position
    const buttonWidth = rect.width;
    const buttonHeight = rect.height;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate scale needed to fit button to viewport with some padding
    const scaleX = viewportWidth / buttonWidth;
    const scaleY = viewportHeight / buttonHeight;
    
    // Use the smaller scale to ensure button fits in viewport, with 0.9 factor for padding
    const calculatedZoom = Math.min(scaleX, scaleY) * 0.9;
    
    return { x: `${centerXPercent}%`, y: `${yPercentOfDocument}%`, zoom: Math.max(calculatedZoom, 10) };
  };

  // Handle button click with zoom and fade - landing page
  const handleButtonClick = (buttonName, path) => {
    if (isAnimating) return;
    
    // Track which button was clicked
    setLastActiveView(path);
    
    // Set view immediately so content can start rendering right away
    setActiveView(path);
    
    // Use startTransition for non-critical UI updates (animation states)
    startTransition(() => {
      setIsAnimating(true);
      setClickedButton(buttonName);
    });
    
    // Reset animation state after fade out completes (0.5s fade out + 0.5s delay + 0.9s fade in = 1.4s)
    setTimeout(() => {
      startTransition(() => {
        setIsAnimating(false);
        setClickedButton(null);
      });
      window.scrollTo(0, 0);  // Scroll to top of detail page
    }, 1400);
  };

  // Detail page triangle button - fade transition back to media container
  const handleBackToButton = React.useCallback(() => {
    // Start the exit animation
    setIsDetailPageExiting(true);
    
    // Immediately reset view and scroll
    setActiveView(null);
    setIsScrolledPastH1(false);
    window.scrollTo(0, 0);
    
    // Reset exit animation state after fade completes
    setTimeout(() => {
      setIsDetailPageExiting(false);
    }, 600); // Match the 0.6s fade duration
  }, []);

  // Expose handleBackToButton to parent via ref for QuickMenu Garden button
  React.useImperativeHandle(ref, () => ({
    handleBackToButton: () => {
      if (activeView) {
        // If on a detail page, use the same logic as handleBackToButton
        handleBackToButton();
      }
    },
    getActiveView: () => activeView
  }), [activeView, handleBackToButton]);

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
    
    // Track which slide was clicked
    setLastActiveView(route);
    
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
    
    // Use startTransition for non-critical UI updates (animation states)
    startTransition(() => {
      setIsAnimating(true);
    });
    
    setIsSlideView(true);
    setIsLandingFadingOut(true); // Start landing fade out immediately
    
    // Wait for landing page to fade out (0.6s), then set activeView to trigger detail page fade-in with 0.5s delay
    setTimeout(() => {
      setActiveView(route);
      window.scrollTo(0, 0);  // Scroll to top of detail page
    }, 600); // 0.6s landing fade out
    
    // Reset animation state after full transition (0.6s fade out + 0.5s delay + 0.6s fade in = 1.7s)
    setTimeout(() => {
      startTransition(() => {
        setIsAnimating(false);
        setIsLandingFadingOut(false);
      });
    }, 1700);
  };

  // Handle back - direct navigation to landing
  const handleBack = () => {
    // Start the exit animation
    setIsDetailPageExiting(true);
    
    // Immediately reset view and scroll
    setActiveView(null);
    setIsScrolledPastH1(false);
    window.scrollTo(0, 0);
    
    // Reset exit animation state after fade completes
    setTimeout(() => {
      startTransition(() => {
        setIsDetailPageExiting(false);
        setIsSlideView(false);
      });
    }, 600); // Match the 0.6s fade duration
  };

  // Handle close slide - same as handleBack for slide content pages
  const handleCloseSlide = () => {
    handleBack();
  };

  // Get content component for active view
  const ActiveContent = activeView ? slideContentMap[activeView] : null;

  // Memoize animation configurations to prevent recreation on every render
  // Landing fades out when activeView is set OR when isLandingFadingOut is true (for slide clicks)
  const shouldLandingFadeOut = activeView || isLandingFadingOut;
  const contentFadeConfig = React.useMemo(() => ({
    animate: { opacity: shouldLandingFadeOut ? 0 : 1 },
    transition: {
      opacity: {
        type: 'tween',
        duration: 0.6,
        delay: shouldLandingFadeOut ? 0 : 0.5, // Fade out instant, fade in with 0.5s delay (matches IntroPage)
        ease: 'easeInOut'
      }
    }
  }), [shouldLandingFadeOut]);

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
    let scrollTimeout;
    let lastScrollTime = 0;
    const SCROLL_DEBOUNCE_MS = 16; // ~60fps throttle
    
    const handleScroll = () => {
      const now = Date.now();
      
      // Only update if enough time has passed (debounce)
      if (now - lastScrollTime < SCROLL_DEBOUNCE_MS) {
        return;
      }
      lastScrollTime = now;
      
      // Clear pending timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Track when scrolled past video header to hide large logo
      if (videoHeaderRef?.current) {
        const videoRect = videoHeaderRef.current.getBoundingClientRect();
        setIsScrolledPastH1(videoRect.bottom - 720 < 0);
      }
      
      // Update slideshow opacity based on scroll position (non-critical, can defer)
      scrollTimeout = setTimeout(() => {
        if (slideshowContainerRef?.current) {
          const rect = slideshowContainerRef.current.getBoundingClientRect();
          const containerTop = rect.top;
          
          // Fully hidden if top of container is 120px above viewport top
          if (containerTop <= -120) {
            startTransition(() => {
              setSlideshowOpacity(0);
            });
            return;
          }
          
          // Fully visible if top is within 750px
          if (containerTop < 750) {
            startTransition(() => {
              setSlideshowOpacity(1);
            });
            return;
          }
          
          // Fully hidden otherwise
          startTransition(() => {
            setSlideshowOpacity(0);
          });
        }
      }, 50); // Defer non-critical opacity update
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  // Calculate opacity for KWEEK KRACHTIGE text and media container (based on content visibility, not extended hitbox)
  const calculateMediaOpacity = React.useMemo(() => {
    return () => {
      // Hide all landing page content when viewing a content page
      if (activeView) return 0;
      
      const visibilityMargin = 30;
      
      try {
        if (mediaContainerRef?.current) {
          const rect = mediaContainerRef.current.getBoundingClientRect();
          const containerTop = rect.top;
          const containerBottom = rect.bottom;
          const viewportHeight = window.innerHeight;
          
          // Content starts at 175px within container, so adjust positions
          // The buttons/video are placed higher than container bounds
          // Increased offset to make content visible earlier when scrolling down
          const contentTop = containerTop - 15;
          const contentBottom = containerBottom - 275; // Subtract empty space at bottom
          
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
  }, [activeView]);

  // Calculate opacity for text content (h1 and paragraph)
  const calculateTextContentOpacity = React.useMemo(() => {
    return () => {
      // Hide all landing page content when viewing a content page
      if (activeView) return 0;
      
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
  }, [activeView]);

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

  // Reset knight video when it goes out of view
  React.useEffect(() => {
    const videoElement = knightVideoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            // Video is out of view - reset it
            videoElement.currentTime = 0;
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(videoElement);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      style={{
        width: '100%',
        overflowX: 'hidden',
        overflowY: 'visible',
        background: 'transparent',
        display: activeView ? 'block' : 'block' // Content pages hidden via AnimatePresence
      }}
    >
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
                duration: 0.6,
                delay: isDetailPageExiting ? 0 : 0.5, // Exit instant, enter with 0.5s delay (matches IntroPage)
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
              backgroundColor: 'transparent',
              pointerEvents: 'none',
              ...gpuAccel.light
            }}
          />
        )}
      </AnimatePresence>

      {/* Page content wrapper - fades when button or slide is clicked */}
      <motion.div
        animate={contentFadeConfig.animate}
        transition={contentFadeConfig.transition}
        key={`content-${isDetailPageExiting}`}
        style={{
          visibility: isDetailPageExiting ? 'hidden' : 'visible',
          pointerEvents: isDetailPageExiting || activeView ? 'none' : 'auto',
          imageRendering: 'auto',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased',
          WebkitTextSizeAdjust: '100%',
          ...(isAnimating ? gpuAccel.heavy : { willChange: 'auto' })
        }}
      >
      {/* Mobile Header - Logo (normal size centered, hides when scrolled past threshold) */}
      <header className={`fixed bg-transparent mobile-header ${scrollDirection === 'down' ? 'logo-fade-out' : 'logo-fade-in'}`} style={{
        zIndex: activeView ? 1 : 9999, 
        overflow: 'hidden',
        top: '0',
        left: '0',
        width: '100vw',
        display: activeView || isDetailPageExiting || isAnimating || isScrolledPastH1 ? 'none' : 'block'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem 1.5rem',
          backgroundColor: 'transparent'
        }}>
          <button
            onClick={() => {
              const footerMenu = document.getElementById('footer-menu');
              if (footerMenu) footerMenu.scrollIntoView({ behavior: 'smooth' });
            }}
            className="logo-btn"
            title="Go to menu"
          >
            <motion.img 
              src={logo} 
              alt="Garden For Life Logo" 
              className="logo-img" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeInOut' }}
              style={{ width: '176px', height: '176px', imageRendering: 'auto' }} 
            />
          </button>
        </div>
      </header>

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
          height: 'calc(70vh + 100px)',
          marginTop: 'calc(150px + 1rem - 50px)',
          zIndex: 1,
          marginLeft: 'calc(-50vw + 50%)',
          pointerEvents: 'none',
          overflow: 'visible',
          opacity: 0,
          animation: 'fadeIn 1.2s ease-in-out 0.5s forwards',
          ...gpuAccel.heavy
        }}
      >
        <HoloEarth 
          className="absolute inset-0 w-full h-full"
          style={{ 
            pointerEvents: 'none',
            overflow: 'visible',
            ...gpuAccel.heavy
          }}
        />
      </div>

      {/* Text content container */}
      <div
        ref={textContentContainerRef}
        className="w-full relative"
        style={{
          zIndex: 1,
          position: 'relative',
          paddingTop: 'calc(100px - 1.5rem)'
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
                marginTop: '60px',
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
          zIndex: 9
        }}>
          <span className="subtitles" style={{fontSize: 'clamp(0.8059rem, 3.842vw, 2.370rem)', marginTop: '3rem', display: 'block', fontWeight: '500', lineHeight: '1.2', opacity: calculateMediaOpacity(), transition: 'opacity 0.5s ease', filter: 'brightness(0.9)'}}>KWEEK KRACHTIGE <br/>KWETSBAARHEID</span>
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
            margin: 'calc(clamp(4rem + 2rem + 30px, 5vw + 2rem + 30px, 6rem + 2rem + 30px) + 100px) auto 0 auto',
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
            zIndex: 1
          }}>
            {/* Static VR Placeholder for Button 2 */}
            <svg
              width="clamp(60px, 28vw, 220px)"
              height="clamp(60px, 28vw, 220px)"
              viewBox="0 0 300 300"
              preserveAspectRatio="xMidYMid meet"
              style={{
                position: 'absolute',
                left: 'calc(clamp(0%, 5vw, 15%) - 0.3rem + 2.3rem - 0.03rem)',
                top: 'calc(clamp(-22%, -17vw, -12%) - 4.5rem - 0.3rem)',
                transform: 'scale(2.1065) rotate(-6deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none'
              }}
            >
              <defs>
                <clipPath id="triangle2-placeholder-clip">
                  <path d="M 140 55 Q 150 35 160 55 L 280 265 Q 285 280 265 285 L 35 285 Q 15 280 20 265 L 140 55 Z" />
                </clipPath>
                <pattern id="vrGrid2" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(6 150 150)">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.5" />
                </pattern>
              </defs>
              {/* Background fill */}
              <path d="M 140 55 Q 150 35 160 55 L 280 265 Q 285 280 265 285 L 35 285 Q 15 280 20 265 L 140 55 Z" fill="rgba(0,0,0,0.15)" />
              {/* Grid pattern */}
              <rect width="300" height="300" fill="url(#vrGrid2)" clipPath="url(#triangle2-placeholder-clip)" />
              {/* Thin connecting line */}
              <path d="M 140 55 Q 150 35 160 55 L 280 265 Q 285 280 265 285 L 35 285 Q 15 280 20 265 L 140 55 Z" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
              {/* Thick corner segments - top vertex (along left edge to curve to right edge) */}
              <path d="M 116 97 L 140 55 Q 150 35 160 55 L 184 97" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" strokeLinecap="round" />
              {/* Thick corner segments - bottom left (along left edge to curve to bottom edge) */}
              <path d="M 44 223 L 20 265 Q 15 280 35 285 L 81 285" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" strokeLinecap="round" />
              {/* Thick corner segments - bottom right (along right edge to curve to bottom edge) */}
              <path d="M 256 223 L 280 265 Q 285 280 265 285 L 219 285" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" strokeLinecap="round" />
            </svg>

            {/* Static VR Placeholder for Button 1 */}
            <svg
              width="clamp(60px, 28vw, 220px)"
              height="clamp(60px, 28vw, 220px)"
              viewBox="0 0 300 300"
              preserveAspectRatio="xMidYMid meet"
              style={{
                position: 'absolute',
                left: 'calc(clamp(29%, 34vw, 44%) - 0.3rem + 2.8rem + 0.15rem)',
                top: 'calc(clamp(-40.5%, -35.5vw, -30.5%) - 5.7rem - 0.08rem)',
                transform: 'scale(2.1065) rotate(54deg)',
                transformOrigin: '50% 60%',
                pointerEvents: 'none'
              }}
            >
              <defs>
                <clipPath id="triangle1-placeholder-clip">
                  <path d="M 140 55 Q 150 35 160 55 L 280 265 Q 285 280 265 285 L 35 285 Q 15 280 20 265 L 140 55 Z" />
                </clipPath>
                <pattern id="vrGrid1" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-54 150 150)">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.5" />
                </pattern>
              </defs>
              {/* Background fill */}
              <path d="M 140 55 Q 150 35 160 55 L 280 265 Q 285 280 265 285 L 35 285 Q 15 280 20 265 L 140 55 Z" fill="rgba(0,0,0,0.15)" />
              {/* Grid pattern */}
              <rect width="300" height="300" fill="url(#vrGrid1)" clipPath="url(#triangle1-placeholder-clip)" />
              {/* Thin connecting line */}
              <path d="M 140 55 Q 150 35 160 55 L 280 265 Q 285 280 265 285 L 35 285 Q 15 280 20 265 L 140 55 Z" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
              {/* Thick corner segments - top vertex (along left edge to curve to right edge) */}
              <path d="M 116 97 L 140 55 Q 150 35 160 55 L 184 97" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" strokeLinecap="round" />
              {/* Thick corner segments - bottom left (along left edge to curve to bottom edge) */}
              <path d="M 44 223 L 20 265 Q 15 280 35 285 L 81 285" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" strokeLinecap="round" />
              {/* Thick corner segments - bottom right (along right edge to curve to bottom edge) */}
              <path d="M 256 223 L 280 265 Q 285 280 265 285 L 219 285" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" strokeLinecap="round" />
            </svg>

            {/* Static VR Placeholder for Button 3 */}
            <svg
              width="clamp(60px, 28vw, 220px)"
              height="clamp(60px, 28vw, 220px)"
              viewBox="0 0 300 300"
              preserveAspectRatio="xMidYMid meet"
              style={{
                position: 'absolute',
                left: 'calc(clamp(18%, 21.5vw, 28%) - 0.3rem + 0.5rem + 0.25rem)',
                top: 'calc(clamp(6%, 11vw, 46%) - 1.6rem - 0.1rem)',
                transform: 'scale(2.1065) rotate(54deg)',
                transformOrigin: 'center center',
                pointerEvents: 'none'
              }}
            >
              <defs>
                <clipPath id="triangle3-placeholder-clip">
                  <path d="M 140 55 Q 150 35 160 55 L 280 265 Q 285 280 265 285 L 35 285 Q 15 280 20 265 L 140 55 Z" />
                </clipPath>
                <pattern id="vrGrid3" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-54 150 150)">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.5" />
                </pattern>
              </defs>
              {/* Background fill */}
              <path d="M 140 55 Q 150 35 160 55 L 280 265 Q 285 280 265 285 L 35 285 Q 15 280 20 265 L 140 55 Z" fill="rgba(0,0,0,0.15)" />
              {/* Grid pattern */}
              <rect width="300" height="300" fill="url(#vrGrid3)" clipPath="url(#triangle3-placeholder-clip)" />
              {/* Thin connecting line */}
              <path d="M 140 55 Q 150 35 160 55 L 280 265 Q 285 280 265 285 L 35 285 Q 15 280 20 265 L 140 55 Z" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
              {/* Thick corner segments - top vertex (along left edge to curve to right edge) */}
              <path d="M 116 97 L 140 55 Q 150 35 160 55 L 184 97" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" strokeLinecap="round" />
              {/* Thick corner segments - bottom left (along left edge to curve to bottom edge) */}
              <path d="M 44 223 L 20 265 Q 15 280 35 285 L 81 285" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" strokeLinecap="round" />
              {/* Thick corner segments - bottom right (along right edge to curve to bottom edge) */}
              <path d="M 256 223 L 280 265 Q 285 280 265 285 L 219 285" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="2" strokeLinecap="round" />
            </svg>

            {/* Button 2 */}
              <motion.svg 
                className="triangleButton2"
                width="clamp(60px, 28vw, 220px)" 
                height="clamp(60px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                overflow="visible"
                pointerEvents="none"
                animate={{ scale: [1.841, 1.99, 1.841] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  display: 'block',
                  position: 'absolute',
                  left: 'calc(clamp(0%, 5vw, 15%) - 0.3rem + 2.3rem)',
                  top: 'calc(clamp(-22%, -17vw, -12%) - 4.5rem)',
                  scale: 1.841,
                  rotate: '-6deg',
                  cursor: 'pointer',
                  transformOrigin: 'center center',
                  ...gpuAccel.triangleButton
                }}
              >
                <defs>
                </defs>
                <g style={{overflow: 'hidden'}}>
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
                  <defs>
                    <clipPath id="triangle2-clip">
                      <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" />
                    </clipPath>
                  </defs>
                  <image 
                    href={body} 
                    x="45" y="91.32" width="187.99" height="175.34" 
                    preserveAspectRatio="xMidYMid slice"
                    style={{pointerEvents: 'none', imageRendering: 'auto'}}
                    transform="rotate(1 -300 1000)"
                  />
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                    fill="none" 
                    stroke="#ef8616" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                    className="breathingStroke"
                    style={{ opacity: 0.9 }}
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
                animate={{ scale: [1.841, 1.99, 1.841] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  display: 'block',
                  position: 'absolute',
                  left: 'calc(clamp(29%, 34vw, 44%) - 0.3rem + 2.8rem)',
                  top: 'calc(clamp(-40.5%, -35.5vw, -30.5%) - 5.7rem)',
                  scale: 1.841,
                  rotate: '54deg',
                  cursor: 'pointer',
                  transformOrigin: '50% 60%',
                  zIndex: 10,
                  ...gpuAccel.triangleButton
                }}
              >
                <g style={{overflow: 'visible'}}>
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z"
                    fill="rgba(0,0,0,0.001)"
                    pointerEvents="all"
                    style={{cursor: 'pointer'}}
                    onClick={() => handleButtonClick('button1', '/mind')}
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
                    stroke="#ef8616" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                    className="breathingStroke"
                    style={{ opacity: 0.9 }}
                  />
                  <defs>
                    <clipPath id="triangle1-clip">
                      <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" />
                    </clipPath>
                  </defs>
                  <image
                    href={mind}
                    x="55.67" y="110.90" width="154.08" height="143.81"
                    preserveAspectRatio="xMidYMid slice"
                    style={{pointerEvents: 'none', imageRendering: 'auto'}}
                    transform="rotate(-55 175 165)"
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
                animate={{ scale: [1.841, 1.99, 1.841] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  display: 'block',
                  position: 'absolute',
                  left: 'calc(clamp(18%, 21.5vw, 28%) - 0.3rem + 0.5rem)',
                  top: 'calc(clamp(6%, 11vw, 46%) - 1.6rem)',
                  scale: 1.841,
                  rotate: '54deg',
                  cursor: 'pointer',
                  transformOrigin: 'center center',
                  ...gpuAccel.triangleButton
                }}
              >
                <defs>
                </defs>
                <g style={{overflow: 'hidden'}}>
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z"
                    fill="rgba(0,0,0,0.001)"
                    pointerEvents="all"
                    style={{cursor: 'pointer'}}
                    onClick={() => {
                      if (onDeltawerken) {
                        // Route to Deltawerken using standard animation
                        handleButtonClick('button3', '/deltawerken');
                      } else {
                        handleButtonClick('button3', '/soul');
                      }
                    }}
                    onMouseEnter={(e) => {
                      const visiblePath = e.target.nextElementSibling;
                      if(visiblePath) visiblePath.style.stroke = '#0c0418ff';
                    }}
                    onMouseLeave={(e) => {
                      const visiblePath = e.target.nextElementSibling;
                      if(visiblePath) visiblePath.style.stroke = 'rgba(167, 59, 198, 0.3)';
                    }}
                  />
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                    fill="none" 
                    stroke="#ef8616" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                    className="breathingStroke"
                    style={{ opacity: 0.9 }}
                  />
                  <defs>
                    <clipPath id="triangle3-clip">
                      <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" />
                    </clipPath>
                  </defs>
                  <image 
                    href={soul} 
                    x="45.69" y="90.52" width="169.49" height="158.19" 
                    preserveAspectRatio="xMidYMid slice"
                    style={{pointerEvents: 'none', imageRendering: 'auto'}}
                    transform="rotate(-40 200 145)"
                  />
                </g>
              </motion.svg>
            </div>{/* End button container */}

          {/* WebM Video - alongside buttons */}
          <video
            ref={knightVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            decoding="async"
            style={{
              display: 'block',
              width: 'auto',
              height: 'auto',
              mixBlendMode: 'screen',
              backgroundColor: 'transparent',
              opacity: 0.95,
              transform: 'scaleX(0.6252502) scaleY(0.6434250) translate(calc(clamp(1.875rem, 7vw, 5rem) + 8% + 1.3rem - 0.85rem), -10%)',
              transformOrigin: 'top left',
              marginLeft: 'calc(clamp(1.875rem, 7vw, 5rem) + 8% + 1.3rem - 0.85rem + 0.8rem + 1rem + 1rem)',
              position: 'absolute',
              top: 'calc(-12rem - 15vw + 9rem)',
              left: 'calc(clamp(1rem, 5vw, 3rem) - 1rem)',
              right: 0,
              zIndex: 4,
              pointerEvents: 'none',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              perspective: '1000px',
              WebkitAcceleratedCompositing: 'true'
            }}
          >
            <source src="/videos/hologramknightIOS.mp4" type="video/mp4; codecs=hvc1" />
            <source src="/videos/hologramknight.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>{/* End media container */}

        {/* News Container */}
        <div 
          style={{
            position: 'relative',
            width: 'calc(100% - clamp(2rem, 6vw, 4rem))',
            maxWidth: 'clamp(25rem, 90vw, 75rem)',
            margin: 'calc(clamp(3rem, 5vw, 6rem) - 50px) auto clamp(3rem, 5vw, 6rem) auto',
            aspectRatio: '2 / 1',
            backgroundColor: 'rgba(15, 2, 29, 1)',
            borderRadius: 'clamp(12px, 2vw, 20px)',
            display: 'flex',
            alignItems: 'center',
            padding: 'clamp(1rem, 3vw, 2rem)',
            paddingBottom: '100px',
            gap: 'clamp(1rem, 3vw, 2rem)',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 9
          }}
        >
          {/* Image placeholder */}
          <div style={{
            width: 'clamp(60px, 15vw, 120px)',
            height: 'clamp(60px, 15vw, 120px)',
            borderRadius: '50%',
            backgroundColor: 'rgba(167, 59, 198, 0.3)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(167, 59, 198, 0.5)'
          }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 'clamp(10px, 2vw, 14px)' }}>IMG</span>
          </div>
          
          {/* Text content */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(0.5rem, 1.5vw, 1rem)'
          }}>
            <span style={{
              color: 'rgb(167, 59, 198)',
              fontSize: 'clamp(14px, 3.5vw, 24px)',
              fontWeight: '600',
              fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif"
            }}>
              NEWS
            </span>
            <span style={{
              color: '#FFFEF0',
              fontSize: 'clamp(12px, 2.5vw, 18px)',
              lineHeight: '1.4'
            }}>
              Your latest news and updates go here.
            </span>
          </div>

          {/* Zie meer button */}
          <button
            style={{
              position: 'absolute',
              bottom: 'clamp(0.75rem, 2vw, 1.5rem)',
              right: 'clamp(0.75rem, 2vw, 1.5rem)',
              padding: 'clamp(6px, 1.2vw, 10px) clamp(14px, 3vw, 24px)',
              fontSize: 'clamp(10px, 2vw, 12px)',
              backgroundColor: 'transparent',
              color: '#FFFEF0',
              border: '2px solid rgba(167, 59, 198, 0.5)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgb(167, 59, 198)';
              e.target.style.borderColor = 'rgb(167, 59, 198)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = 'rgba(167, 59, 198, 0.5)';
            }}
          >
            Zie meer
          </button>
        </div>

     {/* Header Container */}
          <div className="subtitles" style={{
            position: 'relative',
            width: '100%',
            maxWidth: 'clamp(25rem, 90vw, 75rem)',
            margin: '0 auto 0 auto',
            marginTop: 'calc(clamp(3rem, 8vw, 6rem) + 6rem)',
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
              paddingTop: 'clamp(20px, 3vw, 30px)',
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
                    scale: [1, 1.08, 1]
                  }}
                  transition={{
                    scale: {
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
                    border: '3px solid #ef8616',
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
                <div
                  style={{
                    marginTop: 'clamp(12px, 2vw, 18px)',
                    fontSize: 'clamp(15.4px, 3.85vw, 30.8px)',
                    fontWeight: '500',
                    fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
                    lineHeight: '1.4',
                    color: 'rgb(167, 59, 198)',
                    backgroundColor: 'transparent',
                    textAlign: 'center',
                    maxWidth: 'clamp(120px, 43.095vw, 301.665px)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {slide.header}
                </div>

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
                navigateToGardeners();
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
                onClick={navigateToGardeners}
                className="transition-colors duration-300 hover:text-green-600"
              >
                Home
              </button>
              <button
                onClick={navigateToGardeners}
                className="transition-colors duration-300 hover:text-green-600"
              >
                Contact
              </button>
            </nav>

            {/* Settings Button with Popup */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFooterPopup(!showFooterPopup)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-300"
              >
                {darkMode ? <BsSun className="text-5xl" style={{color: '#eb7e09ff'}} /> : <BsMoon className="text-blue-600 text-5xl" />}
              </button>
              <AnimatePresence>
                {showFooterPopup && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: 0,
                      marginBottom: '8px',
                      background: 'rgba(31, 41, 55, 0.95)',
                      border: '1px solid rgba(239, 134, 22, 0.5)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      minWidth: '180px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                      zIndex: 100
                    }}
                  >
                    <p style={{ fontSize: '14px', color: '#FAF9F6', margin: 0, lineHeight: 1.5 }}>
                      SIKE, jij bent het licht dus alleen donker thema op deze site! 🌞
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
    </motion.div>
  );
});

export default React.memo(MobileAppContent);
