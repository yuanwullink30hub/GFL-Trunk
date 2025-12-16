import React from 'react';
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
import '../../styles/poetry.css';
import '../../styles/text.css';
import '../../styles/subtitles.css';
import '../../styles/buttons.css';
import '../../styles/mobile-header.css';
import '../../styles/logo.css';

const MobileAppContent = ({ darkMode, setDarkMode, data, scrollDirection }) => {

  const [currentSlide, setCurrentSlide] = React.useState(0);
  const galleryRef = React.useRef(null);

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
    { header: 'KARMAN', subtitle: 'Amsterdam-based techno organization, born from a desire to restore the raw, intimate spirit of underground gatherings. Nights defined by music, energy, and togetherness.', image: karmanevents, bgColor: 'rgba(34, 197, 94, 0.15)' },
    { header: 'CODE 49', subtitle: 'De nr.1 Businessclub voor MKB-ondernemers die willen doorschalen in een AI-first economie', image: club49logo, bgColor: 'rgba(59, 130, 246, 0.15)' },
    { header: 'TATTOO SHOP ', subtitle: 'Our focus goes beyond body art; we channel personal stories into spiritual expressions, utilizing fine line tattoos and the ancient stick and poke technique to transform your skin into a canvas of meaning.', image: logo1111, bgColor: 'rgba(168, 85, 247, 0.15)' },
    { header: 'Slide 4', subtitle: 'Description', image: placeholder4, bgColor: 'rgba(249, 115, 22, 0.15)' },
    { header: 'Slide 5', subtitle: 'Description', image: placeholder5, bgColor: 'rgba(236, 72, 153, 0.15)' },
    { header: 'Slide 6', subtitle: 'Description', image: placeholder6, bgColor: 'rgba(139, 92, 246, 0.15)' },
    { header: 'Slide 7', subtitle: 'Description', image: placeholder7, bgColor: 'rgba(14, 165, 233, 0.15)' },
    { header: 'Slide 8', subtitle: 'Description', image: placeholder8, bgColor: 'rgba(34, 197, 94, 0.15)' },
    { header: 'RENGI FOODS', subtitle: 'Rengi Foods captures the vibrant spirit of Korean street food, offering authentic and affordable flavors from Seoul\'s streets to your local market. The focus on affordability ensures everyone can enjoy bold Korean tastes without compromise.', image: rengiLogo, bgColor: 'rgba(251, 146, 60, 0.15)' }
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

  return (
    <div style={{
      width: '100%',
      overflow: 'hidden',
      backgroundColor: '#150a24ff',
    }}>
      {/* Mobile Header - Logo Only (hidden when scrolling down) */}
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

      {/* Full-screen Video Container (scrollable behind logo) */}
      <div 
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
          <source src="/videos/HDheader_1.mp4" type="video/mp4" />
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
            <div style={{
              marginTop: 'calc(-9px - 200px + 75px - 100px + 25px)',
              width: '100%'
            }}>
              <h1 className="poetry" style={{
                marginTop: '0',
             
                marginBottom: 'clamp(26px, 6.5vw, 45.5px)',
                fontSize: 'clamp(0.85rem, 4.05vw, 2.5rem)',
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
                marginTop: '-15px',
                marginBottom: '0',
                paddingBottom: '35px',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                lineHeight: '1.4',
                backgroundColor: 'transparent'
              }}>De ontembare chaos uit haar wil in het uni-versum. <br />
 
               Masculiniteit stroomt op harmonieuze wijze mee met de natuurlijke stroming, een stroming met veel gezichten en wonderschone vormen.
                <br/>
                 <br/>
<br/> <br/> <span className="subtitles" style={{fontSize: 'clamp(0.79rem, 3.15vw, 1.58rem)'}}>DUIK DIEP EN ONTDEK HOE <br/>BEHEERSTE CHAOS GROEIT.</span>

              </p>
            {/* Button container moved directly after <p> text */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'clamp(20px, 5vw, 60px)',
              width: '100%',
              maxWidth: 'clamp(400px, 90vw, 1200px)',
              margin: '0 auto',
              marginTop: '25px',
              pointerEvents: 'none'
            }}>
            {/* Button 2 */}
              <svg 
                className="triangleButton2"
                width="clamp(60px, 28vw, 220px)" 
                height="clamp(60px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                pointerEvents="none"
                style={{
                  display: 'block',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1.2) rotate(-21deg) translateY(clamp(0.5rem, 1.5vw, 1.125rem)) translateX(clamp(-1.3rem, -1.8vw, -0.8rem))',
                  cursor: 'pointer'
                }}
              >
                <g>
                  <path 
                    d="M 140 80 Q 143 70 147 80 L 255 255 Q 255 270 250 270 L 50 255 Q 45 270 45 260 L 140 80 Z" 
                    fill="rgba(0,0,0,0.001)"
                    pointerEvents="all"
                    onClick={() => window.location.href = '/gardeners'}
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
                    href={require('../../images/logo.png')} 
                    x="55" y="100" width="150" height="140" 
                    clipPath="url(#triangle2-clip)" 
                    preserveAspectRatio="xMidYMid slice"
                    style={{pointerEvents: 'none'}}
                    transform="rotate(21 80 230)"
                  />
                </g>
              </svg>
             {/* Button 3 */}
              <svg 
                className="triangleButton3"
                width="clamp(60px, 28vw, 220px)" 
                height="clamp(60px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                pointerEvents="none"
                style={{
                  display: 'block',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1.2) rotate(40deg) translateX(clamp(-6rem, -10vw, -4.5rem)) translateY(clamp(-0.5rem, 0.2vw, 0.5rem))',
                  cursor: 'pointer'
                }}
              >
                <g>
                  <path 
                    d="M 140 80 Q 143 70 147 80 L 255 255 Q 255 270 250 270 L 50 255 Q 45 270 45 260 L 140 80 Z"
                    fill="rgba(0,0,0,0.001)"
                    pointerEvents="all"
                    style={{cursor: 'pointer'}}
                    onClick={() => window.location.href = '/gardeners'}
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
                    href={require('../../images/logo.png')} 
                    x="55" y="100" width="150" height="140" 
                    clipPath="url(#triangle3-clip)" 
                    preserveAspectRatio="xMidYMid slice"
                    style={{pointerEvents: 'none'}}
                    transform="rotate(-40 180 160)"
                  />
                </g>
              </svg>
              {/* Button 1 */}
              <svg 
                className="triangleButton1"
                width="clamp(40px, 28vw, 220px)" 
                height="clamp(40px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                pointerEvents="none"
                style={{
                  display: 'block',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1.2) rotate(40deg) translateX(clamp(-9rem, -21vw, -3rem)) translateY(clamp(7rem, 45vw, 37rem))',
                  cursor: 'pointer'
                }}
              >
                <g>
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
                    onClick={() => window.location.href = '/gardeners'}
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
                    href={require('../../images/logo.png')} 
                    x="55" y="100" width="150" height="140" 
                    clipPath="url(#triangle1-clip)" 
                    preserveAspectRatio="xMidYMid slice"
                    style={{pointerEvents: 'none'}}
                    transform="rotate(-40 185 165)"
                  />
                </g>
              </svg>
            </div>{/* End button container */}
          </div>{/* End text content wrapper */}
        </div>{/* End text container over image */}

        {/* Media Container - Image and WebM side by side */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '0',
          zIndex: 8,
          overflow: 'visible',
          maxWidth: 'clamp(25rem, 90vw, 75rem)',
          margin: 'clamp(3.75rem, 15vw, 7.5rem) auto 0 auto',
          pointerEvents: 'none',
          paddingBottom: '9.375rem'
        }}>
          {/* WebM Video - Right of triangles */}
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
              transform: 'scale(0.81) translate(calc(clamp(30px, 7vw, 80px) + 8%), -10%)',
              transformOrigin: 'top left',
              marginLeft: 'calc(clamp(30px, 7vw, 80px) + 8%)',
              position: 'absolute',
              top: '-220px',
              left: 0,
              right: 0,
              zIndex: 4,
              pointerEvents: 'none'
            }}
          >
            <source src="/videos/kightHD-IOS.mp4" type="video/mp4; codecs=hvc1" />
            <source src="/videos/KnightHD.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>{/* End media container */}

     {/* Header Container */}
        <div className="subtitles" style={{
          position: 'relative',
          width: '100%',
          maxWidth: 'clamp(25rem, 90vw, 75rem)',
          margin: '0 auto clamp(1.25rem, 5vw, 3.75rem) auto',
          fontSize: 'clamp(0.72rem, 4.5vw, 2rem)',
          color: 'rgb(167, 59, 198)',
          lineHeight: '1.2',
          textAlign: 'center',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          backgroundColor: 'transparent'
        }}>
          GARDENS
        </div>

        {/* Slideshow Grid Container */}
        <div 
          className="hideScrollbar"
          ref={galleryRef}
          onScroll={handleScroll}
          style={{
            position: 'relative',
            width: '100vw',
            maxWidth: '100vw',
            margin: `clamp(0.9375rem, 3vw, 2.5rem) 0 0 0`,
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'visible',
            gap: 'clamp(0.75rem, 5vw, 3.75rem)',
            backgroundColor: 'transparent',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            alignItems: 'flex-start'
          }}>
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
                <div 
                  className="breathingBorder" 
                  onClick={() => window.location.href = '/gardeners'}
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
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
                </div>

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
          marginBottom: 'clamp(20px, 3vw, 30px)'
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
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 'clamp(40px, 10vw, 80px)'
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
              e.currentTarget.style.backgroundColor = '#f08827';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef8616';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Zie Meer
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
    </div>
  );
}

export default MobileAppContent;
