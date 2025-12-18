import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import soul from '../../images/soulpng.png';
import body from '../../images/bodypng.png';
import mind from '../../images/mindpng.png';
import '../../styles/poetry.css';
import '../../styles/text.css';
import '../../styles/subtitles.css';
import '../../styles/buttons.css';
import '../../styles/mobile-header.css';
import '../../styles/logo.css';

// Preload functions - these will start loading the page components immediately
const preloadMap = {
  '/soul': () => import('../../pages/Soul'),
  '/mind': () => import('../../pages/Mind'),
  '/teachers': () => import('../../pages/Teachers'),
  '/gardeners': () => import('../../pages/Gardeners'),
  '/karman': () => import('../../pages/Karman'),
  '/code49': () => import('../../pages/Code49'),
  '/tattooshop': () => import('../../pages/TattooShop'),
  '/rengifoods': () => import('../../pages/RengiFoods'),
  '/slide4': () => import('../../pages/Slide4'),
  '/slide5': () => import('../../pages/Slide5'),
  '/slide6': () => import('../../pages/Slide6'),
  '/slide7': () => import('../../pages/Slide7'),
  '/slide8': () => import('../../pages/Slide8'),
};

const preloadPage = (path) => {
  const preloader = preloadMap[path];
  if (preloader) {
    preloader(); // Start loading the component
  }
};

const MobileAppContent = ({ darkMode, setDarkMode, data, scrollDirection }) => {
  const navigate = useNavigate();
  
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [clickedSlide, setClickedSlide] = React.useState(null);
  const [clickedButton, setClickedButton] = React.useState(null);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [buttonCenter, setButtonCenter] = React.useState({ x: '50%', y: '50%' });
  const galleryRef = React.useRef(null);
  const slideshowContainerRef = React.useRef(null);
  const seeMoreButtonRef = React.useRef(null);
  const videoHeaderRef = React.useRef(null);
  const mediaContainerRef = React.useRef(null);
  const textContentWrapperRef = React.useRef(null);

  const handleScroll = () => {
    if (!galleryRef.current) return;
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

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // Calculate button center position for zoom origin relative to the full document
  // Accounts for button rotation and triangle centroid
  const calculateButtonCenter = (buttonName) => {
    // Get all SVG elements with the button class
    const svgClass = `triangleButton${buttonName === 'button1' ? '1' : buttonName === 'button2' ? '2' : '3'}`;
    const allSvgElements = document.querySelectorAll(`.${svgClass}`);
    
    if (allSvgElements.length === 0) return { x: '50%', y: '50%' };
    
    // Get the SVG element
    const svgElement = allSvgElements[allSvgElements.length - 1];
    const rect = svgElement.getBoundingClientRect();
    
    // The triangle path vertices in viewBox coordinates (0-300):
    // Apex: (150, 55), Bottom-left: (30, 275), Bottom-right: (270, 275)
    // Centroid = ((x1+x2+x3)/3, (y1+y2+y3)/3) = ((150+30+270)/3, (55+275+275)/3) = (150, 201.67)
    // In normalized coords (0-1): centroid is at (0.5, 0.672)
    
    // Get button rotation angle
    const rotationDeg = buttonName === 'button2' ? -16 : 45;
    const rotationRad = (rotationDeg * Math.PI) / 180;
    
    // SVG bounding box center
    const svgCenterX = (rect.left + rect.right) / 2;
    const svgCenterY = (rect.top + rect.bottom) / 2;
    
    // The centroid offset from SVG center (centroid is at 0.672 vertically, center is at 0.5)
    // So centroid is 0.172 * height below center in unrotated state
    const centroidOffsetY = 0.172 * rect.height;
    
    // Apply rotation to the centroid offset
    // When rotated, the offset shifts: 
    // newX = offsetX * cos(θ) - offsetY * sin(θ)
    // newY = offsetX * sin(θ) + offsetY * cos(θ)
    // Since offsetX = 0 (centroid is horizontally centered):
    const rotatedOffsetX = -centroidOffsetY * Math.sin(rotationRad);
    const rotatedOffsetY = centroidOffsetY * Math.cos(rotationRad);
    
    // Calculate the actual visual center of the triangle
    let triangleCenterX = svgCenterX + rotatedOffsetX;
    let triangleCenterY = svgCenterY + rotatedOffsetY;
    
    // Manual offset adjustments for specific buttons
    if (buttonName === 'button2') {
      // Move button 2's zoom eye up and left
      triangleCenterX -= 15; // left
      triangleCenterY -= 40; // up
    }
    if (buttonName === 'button3') {
      // ove button 3 (mind) zoom eye right and up
      triangleCenterX += 5; // right
      triangleCenterY -= 9; // up
    }
    
    // Convert to percentage of viewport for X
    const centerXPercent = (triangleCenterX / window.innerWidth) * 100;
    
    // For Y, account for scroll position
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight;
    const absoluteY = triangleCenterY + scrollTop;
    const yPercentOfDocument = (absoluteY / documentHeight) * 100;
    
    return { x: `${centerXPercent}%`, y: `${yPercentOfDocument}%` };
  };

  // Handle button navigation with animation
  const handleButtonNavigate = (buttonName, path) => {
    // Start preloading the destination page immediately
    preloadPage(path);
    
    // Calculate button center immediately
    const center = calculateButtonCenter(buttonName);
    setButtonCenter(center);
    
    setClickedButton(buttonName);
    
    // Start fade out at 0.3s (shortly after zoom starts)
    setTimeout(() => {
      setIsNavigating(true);
    }, 300);
    
    // Navigate at 2.4s with zoom state - new page will zoom out from same point
    setTimeout(() => {
      navigate(path, { 
        state: { 
          fromZoom: true,
          zoomOrigin: center
        }
      });
      setClickedButton(null);
      setIsNavigating(false);
      setButtonCenter({ x: '50%', y: '50%' });
    }, 2400);
  };

  // Calculate slideshow opacity based on scroll position (instant fade in within 9px above, instant fade out within 9px below)
  const calculateSlideshowOpacity = React.useMemo(() => {
    return () => {
      const visibilityMargin = 39;
      
      try {
        if (slideshowContainerRef?.current) {
          const rect = slideshowContainerRef.current.getBoundingClientRect();
          const containerTop = rect.top;
          const containerBottom = rect.bottom;
          const viewportHeight = window.innerHeight;
          
          // Instant fade in: from 9px above viewport top to top of viewport
          if (containerTop < 0 && containerTop > -visibilityMargin) {
            return 1;
          }
          
          // Instant fade out: from bottom of viewport to 9px below viewport bottom
          if (containerBottom > viewportHeight && containerBottom < viewportHeight + visibilityMargin) {
            return 0;
          }
          
          // Fully visible if within viewport
          if (containerTop >= 0 && containerBottom <= viewportHeight) {
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

  // Calculate opacity for KWEEK KRACHTIGE text and media container
  const calculateMediaOpacity = React.useMemo(() => {
    return () => {
      const topMargin = 120;
      const bottomMargin = 120;
      try {
        if (mediaContainerRef?.current) {
          const rect = mediaContainerRef.current.getBoundingClientRect();
          const containerTop = rect.top;
          const containerBottom = rect.bottom;
          const viewportHeight = window.innerHeight;
          
          if (containerTop < 0 && containerTop > -topMargin) return 1;
          if (containerBottom > viewportHeight && containerBottom < viewportHeight + bottomMargin) return 0;
          if (containerTop >= 0 && containerBottom <= viewportHeight) return 1;
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
    <>
      {/* Mobile Header - Logo Only (hidden when scrolling down) - Outside motion.div to prevent animation interference */}
      <header className={`fixed top-0 left-0 right-0 bg-transparent mobile-header ${
        scrollDirection === 'down' ? 'mobile-header-hidden' : 'mobile-header-visible'
      }`} style={{
        zIndex: 9999, 
        overflow: 'hidden'
      }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col items-center">
            <button
              onClick={() => scrollToSection('footer-menu')}
              className="logo-btn"
              title="Go to footer menu"
            >
              <img src={logo} alt="Garden For Life Logo" className="logo-img logo-lg" />
            </button>
          </div>
        </div>
      </header>

      <motion.div 
        style={{
          width: '100%',
          overflow: 'hidden',
          backgroundColor: '#150a24ff',
          transformOrigin: `${buttonCenter.x} ${buttonCenter.y}`,
          willChange: 'transform, opacity'
        }}
        animate={{ 
          opacity: isNavigating ? 0 : 1,
          scale: clickedButton ? 60 : 1
        }}
        transition={{ 
          scale: { duration: 3, ease: [0.4, 0, 0.2, 1] },
          opacity: { duration: 2, ease: [0.4, 0, 0.2, 1] }
        }}
      >

        {/* Full-screen Video Container (scrollable behind logo) */}
        <div 
          ref={videoHeaderRef}
          className="w-full overflow-hidden"
        style={{
          height: '100vh',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          maxWidth: '100%'
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src="/videos/LandingpageVID1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Text content container */}
      <div
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
                textAlign: 'right'
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
          <span className="subtitles" style={{fontSize: 'clamp(0.8059rem, 3.842vw, 2.370rem)', marginTop: '3rem', display: 'block', fontWeight: '500', lineHeight: '1.2', opacity: calculateMediaOpacity(), transition: 'opacity 0.5s ease'}}>KWEEK KRACHTIGE <br/>KWETSBAARHEID</span>
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
        <div ref={mediaContainerRef} style={{
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
              <motion.div
                animate={clickedButton === 'button2' ? { scale: 0.9 } : { scale: 1 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  left: 'calc(clamp(0%, 5vw, 15%) - 0.3rem)',
                  top: 'clamp(-22%, -17vw, -12%)',
                  transformOrigin: 'center',
                  zIndex: clickedButton === 'button2' ? 1001 : 5
                }}
              >
              <svg 
                className="triangleButton2"
                width="clamp(60px, 28vw, 220px)" 
                height="clamp(60px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                overflow="visible"
                pointerEvents="none"
                style={{
                  display: 'block',
                  transition: 'all 0.3s ease',
                  position: 'absolute',
                  left: 'calc(clamp(0%, 5vw, 15%) - 0.3rem)',
                  top: 'clamp(-22%, -17vw, -12%)',
                  transform: 'scale(1.5) rotate(-16deg)',
                  cursor: 'pointer'
                }}
              >
                <g style={{overflow: 'visible'}}>
                  <path 
                    d="M 140 80 Q 143 70 147 80 L 255 255 Q 255 270 250 270 L 50 255 Q 45 270 45 260 L 140 80 Z" 
                    fill="rgba(0,0,0,0.001)"
                    pointerEvents="all"
                    onClick={() => handleButtonNavigate('button2', '/teachers')}
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
                    stroke="#0c0418ff" 
                    strokeWidth="clamp(8px, 2vw, 15px)" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                    className="breathingStroke"
                    style={{transition: 'stroke 0.3s ease'}}
                  />
                  <defs>
                    <clipPath id="triangle2-clip">
                      <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" />
                    </clipPath>
                  </defs>
                  <image 
                    href={body} 
                    x="29.25" y="85.3" width="181.5" height="169.4" 
                    preserveAspectRatio="xMidYMid slice"
                    style={{pointerEvents: 'none'}}
                    transform="rotate(2 -300 1000)"
                  />
                </g>
              </svg>
              </motion.div>
             {/* Button 3 */}
              <motion.div
                animate={clickedButton === 'button3' ? { scale: 0.9 } : { scale: 1 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  left: 'calc(clamp(29%, 34vw, 44%) - 0.3rem)',
                  top: 'clamp(-40.5%, -35.5vw, -30.5%)',
                  transformOrigin: 'center',
                  zIndex: clickedButton === 'button3' ? 1001 : 5
                }}
              >
              <svg 
                className="triangleButton3"
                width="clamp(60px, 28vw, 220px)" 
                height="clamp(60px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                overflow="visible"
                pointerEvents="none"
                style={{
                  display: 'block',
                  transition: 'all 0.3s ease',
                  position: 'absolute',
                  left: 'calc(clamp(29%, 34vw, 44%) - 0.3rem)',
                  top: 'clamp(-40.5%, -35.5vw, -30.5%)',
                  transform: 'scale(1.5) rotate(45deg)',
                  cursor: 'pointer'
                }}
              >
                <g style={{overflow: 'visible'}}>
                  <path 
                    d="M 140 80 Q 143 70 147 80 L 255 255 Q 255 270 250 270 L 50 255 Q 45 270 45 260 L 140 80 Z"
                    fill="rgba(0,0,0,0.001)"
                    pointerEvents="all"
                    style={{cursor: 'pointer'}}
                    onClick={() => handleButtonNavigate('button3', '/mind')}
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
                    stroke="#22c55e" 
                    strokeWidth="clamp(8px, 2vw, 15px)" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                    className="breathingStroke"
                    style={{transition: 'stroke 0.3s ease'}}
                  />
                  <defs>
                    <clipPath id="triangle3-clip">
                      <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" />
                    </clipPath>
                  </defs>
                  <image 
                    href={mind} 
                    x="37" y="84" width="180" height="168" 
                    preserveAspectRatio="xMidYMid slice"
                    style={{pointerEvents: 'none'}}
                    transform="rotate(-55 175 165)"
                  />
                </g>
              </svg>
              </motion.div>
              {/* Button 1 */}
              <motion.div
                animate={clickedButton === 'button1' ? { scale: 0.9 } : { scale: 1 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  left: 'calc(clamp(18%, 21.5vw, 28%) - 0.3rem)',
                  top: 'clamp(6%, 11vw, 46%)',
                  transformOrigin: 'center',
                  zIndex: clickedButton === 'button1' ? 1001 : 5
                }}
              >
              <svg 
                className="triangleButton1"
                width="clamp(60px, 28vw, 220px)" 
                height="clamp(60px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                overflow="visible"
                pointerEvents="none"
                style={{
                  display: 'block',
                  transition: 'all 0.3s ease',
                  position: 'absolute',
                  left: 'calc(clamp(18%, 21.5vw, 28%) - 0.3rem)',
                  top: 'clamp(6%, 11vw, 46%)',
                  transform: 'scale(1.5) rotate(45deg)',
                  cursor: 'pointer'
                }}
              >
                <g style={{overflow: 'visible'}}>
                  <path 
                    d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                    fill="none" 
                    stroke="#22c55e" 
                    strokeWidth="clamp(8px, 2vw, 15px)" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    pointerEvents="none"
                    className="breathingStroke"
                    style={{transition: 'stroke 0.3s ease'}}
                  />
                  <path 
                    d="M 140 80 Q 143 70 147 80 L 255 255 Q 255 270 250 270 L 50 255 Q 45 270 45 260 L 140 80 Z"
                    fill="rgba(0,0,0,0.001)"
                    pointerEvents="all"
                    onClick={() => handleButtonNavigate('button1', '/soul')}
                    onMouseEnter={(e) => {
                      const visiblePath = e.target.previousElementSibling;
                      if(visiblePath) visiblePath.style.stroke = '#0c0418ff';
                    }}
                    onMouseLeave={(e) => {
                      const visiblePath = e.target.previousElementSibling;
                      if(visiblePath) visiblePath.style.stroke = '#0c0418ff';
                    }}
                  />
                  <defs>
                    <clipPath id="triangle1-clip">
                      <path d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" />
                    </clipPath>
                  </defs>
                  <image 
                    href={soul} 
                    x="23" y="67.2" width="198" height="184.8" 
                    preserveAspectRatio="xMidYMid slice"
                    style={{pointerEvents: 'none'}}
                    transform="rotate(-40 200 145)"
                  />
                </g>
              </svg>
              </motion.div>
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
              transform: 'scale(0.7776) translate(calc(clamp(1.875rem, 7vw, 5rem) + 8% + 1.3rem - 0.85rem), -10%)',
              transformOrigin: 'top left',
              marginLeft: 'calc(clamp(1.875rem, 7vw, 5rem) + 8% + 1.3rem - 0.85rem + 0.8rem)',
              position: 'absolute',
              top: 'clamp(-10.875rem, -20vw, -4.625rem)',
              left: 0,
              right: 0,
              zIndex: 6,
              pointerEvents: 'none'
            }}
          >
            <source src="/videos/KnightHD_2.mp4" type="video/mp4; codecs=hvc1" />
            <source src="/videos/KnightHD_1.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>{/* End media container */}

     {/* Header Container */}
          <div className="subtitles" style={{
            position: 'relative',
            width: '100%',
            maxWidth: 'clamp(25rem, 90vw, 75rem)',
            margin: '0 auto 0 auto',
            marginTop: 'clamp(0.25rem + 6px, 1vw + 6px, 0.75rem + 6px)',
            marginBottom: 'clamp(1.25rem, 5vw, 3.75rem)',
            fontSize: 'clamp(0.8059rem, 3.842vw, 2.370rem)',
            color: 'rgb(167, 59, 198)',
            lineHeight: '1.2',
            textAlign: 'center',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            backgroundColor: 'transparent',
            zIndex: 10,
            opacity: calculateSlideshowOpacity(),
            transition: 'opacity 0.6s ease'
          }}>
            GARDENS
          </div>

          {/* Slideshow Grid Container */}
          <div 
            className="hideScrollbar"
            ref={(el) => {
              galleryRef.current = el;
              slideshowContainerRef.current = el;
            }}
            onScroll={handleScroll}
            style={{
              position: 'relative',
              width: '100vw',
              maxWidth: '100vw',
              margin: 'clamp(1.5rem, 3.5vw, 2.5rem) 0 0 0',
              display: 'flex',
              overflowX: 'auto',
              overflowY: 'visible',
              gap: 'clamp(0.75rem, 5vw, 3.75rem)',
              backgroundColor: 'transparent',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              alignItems: 'flex-start',
              zIndex: 9,
              opacity: calculateSlideshowOpacity(),
              transition: 'opacity 0.5s ease'
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
                  className="breathingBorder" 
                  onClick={() => {
                    // Start preloading destination page immediately
                    preloadPage(slides[index % 9].route);
                    setClickedSlide(index);
                    // Navigate after animation completes
                    setTimeout(() => {
                      window.location.href = slides[index % 9].route;
                    }, 600);
                  }}
                  animate={clickedSlide === index ? {
                    scale: 5,
                    x: '100vw',
                    y: '100vh',
                    borderRadius: '0%'
                  } : {
                    scale: 1,
                    x: 0,
                    y: 0,
                    borderRadius: '50%'
                  }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
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
                    zIndex: clickedSlide === index ? 1000 : 2,
                    flexShrink: 0,
                    cursor: 'pointer',
                    transformOrigin: 'center'
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
                <div style={{
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
                }}>
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
        </div>
        
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
          opacity: calculateSlideshowOpacity(),
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
          opacity: calculateSlideshowOpacity(),
          transition: 'opacity 0.6s ease'
        }}>
          <button
            className="breathingBorder"
            onClick={() => window.location.href = '/gardeners'}
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
              letterSpacing: '1px'
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
          </button>
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
    </>
  );
}

export default MobileAppContent;
