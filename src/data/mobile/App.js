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
import headerBgVid from '../../videos/120header.mp4';
import '../../styles/poetry.css';
import '../../styles/text.css';
import '../../styles/subtitles.css';
import '../../styles/buttons.css';

const MobileAppContent = ({ darkMode, setDarkMode, data, scrollDirection }) => {

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };


  
  const slides = [
    { header: 'Slide 1', image: '/images/placeholder1.jpg', bgColor: 'rgba(34, 197, 94, 0.15)' },
    { header: 'Slide 2', image: '/images/placeholder2.jpg', bgColor: 'rgba(59, 130, 246, 0.15)' },
    { header: 'Slide 3', image: '/images/placeholder3.jpg', bgColor: 'rgba(168, 85, 247, 0.15)' }
  ];

  return (
    <div style={{
      width: '100%',
      overflow: 'hidden',
      backgroundColor: '#10071dff',
    }}>
      {/* Mobile Header - Logo Only (hidden when scrolling down) */}
      <header className="fixed top-0 left-0 right-0 bg-transparent" style={{zIndex: 9999, overflow: 'hidden'}}>
        <div className="container mx-auto px-6 py-4">
          <div className={`flex flex-col items-center transition-all duration-300 ${
            scrollDirection === 'down' ? 'opacity-0 h-0' : 'opacity-100'
          }`}>
            <button
              onClick={() => {
                const footer = document.querySelector('footer');
                if (footer) {
                  footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="hover:scale-110 transition-transform duration-300 cursor-pointer"
              title="Go to footer menu"
            >
              <img src={logo} alt="Garden For Life Logo" className="w-44 h-44 object-contain" />
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
          <source src={headerBgVid} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Text content container */}
      <div
        className="w-full relative"
        style={{
          background: 'linear-gradient(to bottom, #000000ff, #0a0513ff, #10071dff)',
          zIndex: 1,
          position: 'relative',
          paddingTop: '100px'
        }}
      >
        {/* Text container over image */}
        <div
          className="flex flex-col items-start justify-start w-full"
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
                marginLeft: '-10px',
                marginBottom: 'clamp(26px, 6.5vw, 45.5px)',
                fontSize: 'clamp(23.4px, 5.2vw, 46.8px)',
                lineHeight: '1.2',
                width: '100%',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                textAlign: 'right'
              }}>De luide stilte <br/>
                 En de intense kalmte <br/> 
                 Wijzen mij de weg <br/>
                 Van het hart naar het hooofd           </h1>

              {/* Paragraph inside container */}
              <p className="text" style={{
                width: '100%',
                fontSize: 'clamp(14px, 3.5vw, 28px)',
                marginTop: '0',
                marginBottom: '0',
                paddingBottom: '35px',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                lineHeight: '1.4',
                backgroundColor: 'transparent'
              }}>De ontembare chaos uit haar wil in het uni-versum. <br />
  
               Masculiniteit stroomt op harmonieuze wijze mee met de natuurlijke stroming, een stroming met veel gezichten en wonderschone vormen.
<br/> <br/> <span className="subtitles">DUIK DIEP EN ONTDEK HOE BEHEERSTE CHAOS GROEIT.</span>

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
              marginTop: '0'
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
                  transform: 'scale(1.2) rotate(-21deg) translateY(18px) translateX(-21px)',
                  cursor: 'pointer'
                }}
              >
                <g>
                  <path 
                    d="M 140 80 Q 143 70 147 80 L 255 255 Q 255 270 250 270 L 50 255 Q 45 270 45 260 L 140 80 Z" 
                    fill="rgba(0,0,0,0.001)"
                    pointerEvents="all"
                    onClick={() => scrollToSection('contact')}
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
                    transform: 'scale(1.2) rotate(40deg) translateX(-50px) translateY(15px)',
                    cursor: 'pointer'
                  }}
              >
                <g>
                  <path 
                    d="M 140 80 Q 143 70 147 80 L 255 255 Q 255 270 250 270 L 50 255 Q 45 270 45 260 L 140 80 Z"
                    fill="rgba(0,0,0,0.001)"
                    pointerEvents="all"
                    style={{cursor: 'pointer'}}
                    onClick={() => scrollToSection('contact')}
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
                width="clamp(60px, 28vw, 220px)" 
                height="clamp(60px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                pointerEvents="none"
                style={{
                  display: 'block',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1.2) rotate(40deg) translateX(-77px) translateY(185px)',
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
                    onClick={() => scrollToSection('contact')}
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
          maxWidth: 'clamp(400px, 90vw, 1200px)',
           margin: '0 auto',
          pointerEvents: 'none',
          paddingBottom: '180px'
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
              top: '-150px',
              left: 0,
              right: 0,
              zIndex: 4,
              pointerEvents: 'none'
            }}
          >
            <source src="/knightapple.mp4" type="video/mp4; codecs=hvc1" />
            <source src="/knightwebm.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>{/* End media container */}

     {/* Header Container */}
        <div className="subtitles" style={{
          position: 'relative',
          width: '100%',
          maxWidth: 'clamp(400px, 90vw, 1200px)',
          margin: '0 auto clamp(20px, 5vw, 60px) auto',
          fontSize: 'clamp(14px, 3.5vw, 28px)',
          lineHeight: '1.2',
          textAlign: 'center',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}>
          GARDENERS
        </div>

        {/* Text Container */}
        <div style={{
          position: 'absolute',
          width: '100%',
          maxWidth: 'clamp(400px, 90vw, 1200px)',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'clamp(14px, 3.5vw, 28px)',
          lineHeight: '1.4',
          marginTop: 'clamp(30px, 7vw, 80px)',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}>
          Text content goes here
        </div>

        {/* Scrollable Slideshow Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: 'clamp(100px, 90vw, 1200px)',
          margin: `clamp(80px, 15vw, 160px) auto 0 auto`
        }}>
          {/* Horizontal Scroll Gallery */}
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            gap: 'clamp(6px, 2vw, 20px)',
            paddingLeft: 'clamp(6px, 2vw, 20px)',
            paddingRight: 'clamp(6px, 2vw, 20px)',
            paddingBottom: 'clamp(8px, 1.5vw, 12px)',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory'
          }}>
            {slides.map((slide, index) => (
              <div
                key={index}
                style={{
                  flex: '0 0 clamp(160px, 50.4vw, 403px)',
                  height: 'clamp(220px, 70vw, 550px)',
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#000000',
                  border: '1px solid #ef8616',
                  scrollSnapAlign: 'start',
                  transition: 'transform 0.2s ease',
                  cursor: 'grab',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Header */}
                {slide.header && (
                  <div style={{
                    position: 'relative',
                    fontSize: 'clamp(12px, 2.5vw, 16px)',
                    fontWeight: 'bold',
                    padding: 'clamp(6px, 1vw, 12px)',
                    backgroundColor: '#ef8616',
                    color: '#22c55e',
                    zIndex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {slide.header}
                  </div>
                )}

                {/* Image Spacing Wrapper */}
                <div style={{
                  paddingTop: 'clamp(8px, 2vw, 20px)',
                  paddingBottom: 'clamp(8px, 2vw, 25px)',
                  paddingLeft: 'clamp(3px, 1vw, 10px)',
                  paddingRight: 'clamp(3px, 1vw, 10px)'
                }}>
                  {/* Image Circle */}
                  <div style={{
                    position: 'relative',
                    width: 'clamp(156px, 39vw, 273px)',
                    height: 'clamp(156px, 39vw, 273px)',
                    margin: '0 auto',
                    overflow: 'hidden',
                    backgroundColor: '#ebe7e1',
                    borderRadius: '50%',
                    zIndex: 2
                  }}>
                    <img
                      src={slide.image}
                      alt={slide.header}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  </div>
                </div>

                {/* Text Subtitle */}
                <div style={{
                  backgroundColor: '#333',
                  padding: 'clamp(6px, 1vw, 12px)',
                  fontSize: 'clamp(10px, 2vw, 14px)',
                  color: '#fff',
                  flex: 1
                }}>
                  Subtitle text here
                </div>
              </div>
            ))}
          </div>
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
      <footer style={{
        position: 'relative',
        width: '100%',
        background: 'linear-gradient(to right, rgb(31, 41, 55), rgb(17, 24, 39))',
        color: 'white',
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
              className="flex-shrink-0 hover:scale-110 transition-transform duration-300"
              title="Back to top"
            >
              <img src={logo} alt="Garden For Life Logo" className="w-20 h-20 object-contain" />
            </button>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-3">
              <button
                onClick={() => scrollToSection('home')}
                className="transition-colors duration-300 hover:text-green-600"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('contact')}
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
