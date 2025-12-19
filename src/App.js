import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaLinkedin,
  FaGithub,
  FaGlobe
} from 'react-icons/fa';
import { BsMoon, BsSun } from 'react-icons/bs';
import PasswordProtect from './components/PasswordProtect';
import generalData from './data.json';
import desktopData from './data/desktop/data.json';
import mobileData from './data/mobile/data.json';
import MobileAppContent from './data/mobile/App';
import logo from './images/logo.png';
import './styles/poetry.css';
import './styles/text.css';
import './styles/subtitles.css';
import './styles/logo.css';



const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  // Merge general data with device-specific data (general data takes priority for basics)
  const deviceData = isMobile ? mobileData : desktopData;
  const data = {
    basics: {
      ...generalData.basics,
      pages: deviceData.basics.pages
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
      
      // Track scroll direction for mobile (with 50px threshold to avoid sensitivity)
      const scrollDifference = Math.abs(currentScrollY - lastScrollY);
      if (scrollDifference >= 50) {
        if (currentScrollY > lastScrollY) {
          setScrollDirection('down');
        } else {
          setScrollDirection('up');
        }
        setLastScrollY(currentScrollY);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isMobile ? (
            <PasswordProtect>
              <div className={`min-h-screen transition-all duration-300 ${
                darkMode 
                  ? 'bg-gradient-to-br from-[#26163e] via-[#26163e] to-[#26163e] text-white'
                  : 'bg-gradient-to-br from-[#26163e] via-[#26163e] to-[#26163e] text-white'
              }`}>
                <MobileAppContent darkMode={darkMode} setDarkMode={setDarkMode} data={data} scrollDirection={scrollDirection} />
              </div>
            </PasswordProtect>
          ) : (
            <DesktopContent darkMode={darkMode} setDarkMode={setDarkMode} data={data} scrollToSection={scrollToSection} isScrolled={isScrolled} />
          )
        } 
      />

    </Routes>
  );
};

const DesktopContent = ({ darkMode, setDarkMode, data, scrollToSection, isScrolled }) => {
  const homeTab = data?.basics?.pages?.find(page => page.id === 'home');
  const contactTab = data?.basics?.pages?.find(page => page.id === 'contact');

  // Desktop version
  return (
    <PasswordProtect>
      <div className={`min-h-screen transition-all duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-[#26163e] via-[#26163e] to-[#26163e] text-white'
          : 'bg-gradient-to-br from-[#26163e] via-[#26163e] to-[#26163e] text-white'
      }`}>
      {/* Desktop Header - Side-by-side Layout */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
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
                <img src={logo} alt="Garden For Life Logo" className="w-36 h-36 object-contain" />
              </button>
            </div>
            
            <nav className="flex items-center space-x-8">
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

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300"
              >
                {darkMode ? <BsSun className="text-yellow-400" /> : <BsMoon className="text-blue-600" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Home Section */}
      <section id="home" className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="header" style={{color: '#f22b00'}}>
            {homeTab?.title}
          </h2>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <p className="text mb-8">
              {homeTab?.content}
            </p>
            <button
              onClick={() => scrollToSection('contact')}
              className="px-8 py-3 bg-gradient-to-r from-green-700 to-green-500 text-white rounded-lg hover:from-green-800 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Get In Touch
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="header subtitles text-center mb-12" style={{color: '#f22b00'}}>
            {contactTab?.title}
          </h2>
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <p className="text mb-12 text-center">
              {contactTab?.content}
            </p>

            <div className="space-y-6 max-w-md mx-auto">
              <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                <FaMapMarkerAlt className="text-green-600 text-2xl flex-shrink-0" />
                <div>
                  <p className="font-semibold">Location</p>
                  <p className="subtitles">
                    {data?.basics?.location?.city}, {data?.basics?.location?.country}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                <FaPhone className="text-green-600 text-2xl flex-shrink-0" />
                <div>
                  <p className="font-semibold">Phone</p>
                  <a href={`tel:${data?.basics?.phone}`} className="subtitles text-green-600 hover:text-green-500">
                    {data?.basics?.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                <FaEnvelope className="text-green-600 text-2xl flex-shrink-0" />
                <div>
                  <p className="font-semibold">Email</p>
                  <a href={`mailto:${data?.basics?.email}`} className="subtitles text-green-600 hover:text-green-500">
                    {data?.basics?.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-300 dark:border-gray-600">
              <h4 className="subtitles font-semibold mb-6 text-center">Follow Us</h4>
              <div className="flex justify-center space-x-6">
                {data?.basics?.profiles?.map((profile, idx) => {
                  const icons = {
                    LinkedIn: <FaLinkedin className="text-blue-600" />,
                    GitHub: <FaGithub className="text-gray-800 dark:text-white" />,
                    Website: <FaGlobe className="text-green-600" />
                  };
                  return (
                    <a
                      key={idx}
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-2xl hover:scale-110 transition-transform duration-300"
                    >
                      {icons[profile.network] || <FaGlobe />}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-6">
            <h4 className="header mb-2">{data?.basics?.name}</h4>
            <p className="subtitles text-gray-400">{data?.basics?.label}</p>
          </div>
          
          <div className="border-t border-gray-700 pt-8">
            <p className="subtitles text-gray-400">
              © 2025 {data?.basics?.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </PasswordProtect>
  );
};

export default App;