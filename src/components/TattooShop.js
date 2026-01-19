import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../images/logo.png';
import logo1111 from '../images/slideshow images/1111logo.png';
import '../styles/logo.css';

function TattooShop() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', color: '#FFFEF0', padding: '40px 20px', textAlign: 'center' }}>
      {/* Logo - Navigate back to main page */}
      <button
        onClick={() => navigate('/')}
        className="logo-btn"
        style={{ marginBottom: '40px' }}
        title="Go to landing page"
      >
        <img src={logo} alt="Garden For Life Logo" className="logo-img logo-md" />
      </button>

      <div style={{
        width: 'clamp(150px, 40vw, 300px)',
        height: 'clamp(150px, 40vw, 300px)',
        margin: '0 auto 40px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '3px solid rgba(168, 85, 247, 0.5)'
      }}>
        <img src={logo1111} alt="Tattoo Shop" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.375)' }} />
      </div>

      <h1 style={{
        fontSize: 'clamp(32px, 8vw, 64px)',
        marginBottom: '20px',
        color: 'rgb(167, 59, 198)'
      }}>
        TATTOO SHOP
      </h1>

      <p style={{
        fontSize: 'clamp(16px, 4vw, 24px)',
        maxWidth: '800px',
        margin: '0 auto 60px',
        lineHeight: '1.6',
        color: '#FFFEF0'
      }}>
        Our focus goes beyond body art; we channel personal stories into spiritual expressions, utilizing fine line tattoos and the ancient stick and poke technique to transform your skin into a canvas of meaning.
      </p>

      {/* Back Button */}
      <motion.button
        onClick={() => navigate('/')}
        animate={{ borderColor: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          marginTop: '60px',
          padding: '15px 40px'
        }}
      >
        Back
      </motion.button>
    </div>
  );
}

export default TattooShop;

