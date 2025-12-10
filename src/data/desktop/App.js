import React, { useState, useEffect } from 'react';
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
import '../../styles/header.css';
import '../../styles/poetry.css';
import '../../styles/text.css';
import '../../styles/subtitles.css';

const DesktopApp = ({ darkMode, setDarkMode, data }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const homeTab = data?.basics?.pages?.find(page => page.id === 'home');
  const contactTab = data?.basics?.pages?.find(page => page.id === 'contact');

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-[#58057D] via-[#9d17db] to-[#B312AB] text-white'
        : 'bg-gradient-to-br from-[#58057D] via-[#9d17db] to-[#B312AB] text-white'
    }`}>
      {/* Desktop Header */}
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
                <img src={log} alt="Garden For Life Logo" className="w-36 h-36 object-contain" />
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">
                {data?.basics?.name}
              </h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
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
                {darkMode ? <BsSun style={{color: '#b8860b'}} /> : <BsMoon className="text-blue-600" />}
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

      {/* Desktop Footer with Navigation */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-6 text-center">
          {/* Footer Navigation */}
          <div className="flex justify-center items-center space-x-8 mb-8">
            {/* Clickable Logo */}
            <button
              onClick={() => scrollToSection('home')}
              className="flex-shrink-0 hover:scale-110 transition-transform duration-300"
              title="Back to top"
            >
              <img src={logo} alt="Garden For Life Logo" className="w-12 h-12 object-contain" />
            </button>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-6">
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
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors duration-300"
            >
              {darkMode ? <BsSun style={{color: '#b8860b'}} /> : <BsMoon className="text-blue-600" />}
            </button>
          </div>

          {/* Company Info */}
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
  );
};

export default DesktopApp;
