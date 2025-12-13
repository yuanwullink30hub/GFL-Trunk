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
import '../../styles/header.css';
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

  const homeTab = data?.basics?.pages?.find(page => page.id === 'home');

  return (
    <div style={{
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100vw',
        backgroundColor: 'rgb(38, 22, 62)',
    }}>
      {/* Mobile Header - Logo Only (hidden when scrolling down) */}
      <header className="fixed top-0 w-full bg-transparent" style={{zIndex: 9999, overflow: 'hidden', width: '100vw', maxWidth: '100%'}}>
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
          background: 'linear-gradient(to bottom, #000000, #26163e, #26163eff)',
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
              }}>De ontembare chaos uit haar wil door één lied (uni-verse). Allen zijn dus een noot in deze symfonie. <br />
               <br />
               Het is de eer aan het masculiene om op een harmonieuze wijze mee te stromen met de natuurlijke kracht, loslaten van gebroken fundering en in vertrouwde chaos een nieuwe vorm op te laten stijgen. <br />
               Zo ontstaat er ruimte voor het feminiene om te bloeien en te groeien. <br />
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
                style={{
                  display: 'block',
                  transition: 'all 0.3s ease',
                  pointerEvents: 'none',
                    transform: 'scale(1.2) rotate(-21deg) translateY(18px) translateX(-21px)'
                }}
              >
                <path 
                  d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                  fill="rgba(0,0,0,0.001)"
                  pointerEvents="all"
                  onClick={() => scrollToSection('contact')}
                  onMouseEnter={(e) => {
                    const visiblePath = e.target.nextElementSibling;
                    if(visiblePath) visiblePath.style.stroke = '#16a34a';
                  }}
                  onMouseLeave={(e) => {
                    const visiblePath = e.target.nextElementSibling;
                    if(visiblePath) visiblePath.style.stroke = '#22c55e';
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
                <text x="150" y="170" textAnchor="middle" fontSize="clamp(48px, 15vw, 80px)" fontWeight="900" fill="#22c55e" pointerEvents="none" className="breathingNumber" style={{transition: 'fill 0.3s ease', fontFamily: 'inherit'}}>2</text>
              </svg>
              {/* Button 3 */}
              <svg 
                className="triangleButton3"
                width="clamp(60px, 28vw, 220px)" 
                height="clamp(60px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                  style={{
                    display: 'block',
                    transition: 'all 0.3s ease',
                    pointerEvents: 'none',
                    transform: 'scale(1.2) rotate(40deg) translateX(-50px) translateY(15px)'
                  }}
              >
                <path 
                  d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                  fill="rgba(0,0,0,0.001)"
                  pointerEvents="all"
                  style={{cursor: 'pointer'}}
                  onClick={() => scrollToSection('contact')}
                  onMouseEnter={(e) => {
                    const visiblePath = e.target.nextElementSibling;
                    if(visiblePath) visiblePath.style.stroke = '#16a34a';
                  }}
                  onMouseLeave={(e) => {
                    const visiblePath = e.target.nextElementSibling;
                    if(visiblePath) visiblePath.style.stroke = '#22c55e';
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
                <text x="150" y="170" textAnchor="middle" fontSize="clamp(48px, 15vw, 80px)" fontWeight="900" fill="#22c55e" pointerEvents="none" className="breathingNumber" style={{transition: 'fill 0.3s ease', fontFamily: 'inherit'}}>3</text>
              </svg>
              {/* Button 1 */}
              <svg 
                className="triangleButton1"
                width="clamp(60px, 28vw, 220px)" 
                height="clamp(60px, 28vw, 220px)" 
                viewBox="0 0 300 300" 
                preserveAspectRatio="xMidYMid meet"
                  style={{display: 'block', transition: 'all 0.3s ease', pointerEvents: 'none', transform: 'scale(1.2) rotate(40deg) translateX(-77px) translateY(185px)'}}
              >
                <path 
                  d="M 140 70 Q 150 55 160 70 L 270 260 Q 270 275 255 275 L 45 275 Q 30 275 30 260 L 140 70 Z" 
                  fill="rgba(0,0,0,0.001)"
                  pointerEvents="all"
                  style={{cursor: 'pointer'}}
                  onClick={() => scrollToSection('contact')}
                  onMouseEnter={(e) => {
                    const visiblePath = e.target.nextElementSibling;
                    if(visiblePath) visiblePath.style.stroke = '#16a34a';
                  }}
                  onMouseLeave={(e) => {
                    const visiblePath = e.target.nextElementSibling;
                    if(visiblePath) visiblePath.style.stroke = '#22c55e';
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
                <text x="150" y="170" textAnchor="middle" fontSize="clamp(48px, 15vw, 80px)" fontWeight="900" fill="#22c55e" pointerEvents="none" className="breathingNumber" style={{transition: 'fill 0.3s ease', fontFamily: 'inherit'}}>1</text>
              </svg>
            </div>{/* End button container */}
          </div>{/* End text content wrapper */}
        </div>{/* End text container over image */}

        {/* Media Container - Image and WebM side by side */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'clamp(10px, 2vw, 20px)',
          position: 'relative',
          zIndex: 8,
          overflow: 'visible',
          width: '100%',
          maxWidth: 'clamp(400px, 90vw, 1200px)',
          margin: '0 auto'
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
              top: '-130px',
              left: 0,
              right: 0,
              zIndex: 4
            }}
          >
            <source src="/knightwebm.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
        </div>{/* End media container */}
      </div>{/* End text content container */}

      {/* Matching fade container */}
      <div
        className="w-full"
        style={{
          height: '150px',
          background: 'linear-gradient(to bottom, #26163eff, rgb(38, 22, 62))',
          zIndex: 1
        }}
      />

      {/* Home Section */}
      <section id="home" className="pt-52 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          {homeTab?.story ? (
            // Storytelling layout
            <div className="space-y-6">
              {homeTab.story.map((block, idx) => (
                <div key={idx}>
                  {block.type === 'text' && (
                    <p className="text leading-relaxed">
                      {block.content}
                    </p>
                  )}
                  
                  {block.type === 'image' && (
                    <div className="overflow-hidden rounded-2xl">
                      <img 
                        src={block.src} 
                        alt={block.alt} 
                        className="w-full h-auto"
                      />
                      {block.caption && (
                        <p className="subtitles text-center text-gray-600 dark:text-gray-400 mt-3">
                          {block.caption}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {block.type === 'video' && (
                    <div className="overflow-hidden rounded-2xl">
                      <div className="aspect-video">
                        <iframe
                          src={block.src}
                          title={block.title}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    </div>
                  )}
                  
                  {block.type === 'link' && (
                    <div className="text-center">
                      <a
                        href={block.href}
                        onClick={(e) => {
                          if (block.internal) {
                            e.preventDefault();
                            scrollToSection(block.href.replace('/', ''));
                          }
                        }}
                        className="inline-block header font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors duration-300 underline"
                      >
                        {block.text}
                      </a>
                    </div>
                  )}
                  
                  {block.type === 'cta' && (
                    <div className="text-center">
                      <button
                        onClick={() => {
                          if (block.internal) {
                            scrollToSection(block.href.replace('/', ''));
                          } else {
                            window.location.href = block.href;
                          }
                        }}
                        className="px-8 py-4 bg-gradient-to-r from-green-700 to-green-500 text-white text-lg font-semibold rounded-lg hover:from-green-800 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        {block.text}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Fallback to original layout if no story
            <div className="text-center">
              <p className="text leading-relaxed mb-8">
                {homeTab?.content}
              </p>
              <button
                onClick={() => scrollToSection('contact')}
                className="px-8 py-3 bg-gradient-to-r from-green-700 to-green-500 text-white rounded-lg hover:from-green-800 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Get In Touch
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center space-x-3 p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                <FaMapMarkerAlt className="text-xl flex-shrink-0" style={{color: '#f22b00'}} />
                <div>
                  <p className="font-semibold text-sm" style={{color: '#f22b00'}}>Location</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs" style={{ fontSize: 'clamp(10px, 1.5vw, 14px)' }}>
                    {data?.basics?.location?.city}, {data?.basics?.location?.country}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                <FaPhone className="text-xl flex-shrink-0" style={{color: '#f22b00'}} />
                <div>
                  <p className="font-semibold text-sm" style={{color: '#f22b00'}}>Phone</p>
                  <a href={`tel:${data?.basics?.phone}`} className="subtitles" style={{color: '#f22b00'}}>
                    {data?.basics?.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                <FaEnvelope className="text-xl flex-shrink-0" style={{color: '#f22b00'}} />
                <div>
                  <p className="font-semibold text-sm" style={{color: '#f22b00'}}>Email</p>
                  <a href={`mailto:${data?.basics?.email}`} className="subtitles" style={{color: '#f22b00'}}>
                    {data?.basics?.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-300 dark:border-gray-600">
              <h4 className="subtitles font-semibold mb-4 text-center" style={{color: '#f22b00'}}>Follow me</h4>
              <div className="flex justify-center space-x-4">
                {data?.basics?.profiles?.map((profile, idx) => {
                  const icons = {
                    LinkedIn: <FaLinkedin style={{color: '#f22b00'}} />,
                    GitHub: <FaGithub style={{color: '#f22b00'}} />,
                    Website: <FaGlobe style={{color: '#f22b00'}} />
                  };
                  return (
                    <a
                      key={idx}
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-2xl hover:scale-110 transition-transform duration-300"
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
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 -mt-5">
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
              {darkMode ? <BsSun className="text-5xl" style={{color: '#b8860b'}} /> : <BsMoon className="text-blue-600 text-5xl" />}
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
