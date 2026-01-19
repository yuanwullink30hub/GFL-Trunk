import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../images/logo.png';
import Mindholo from './Mindholo';
import '../styles/logo.css';

const Mind = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      color: '#FFFEF0',
      padding: '40px 20px',
      textAlign: 'center',
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Logo - Navigate back to main page */}
        <button
          onClick={() => navigate('/')}
          className="logo-btn"
          style={{ marginBottom: '20px' }}
          title="Go to landing page"
        >
          <img src={logo} alt="Garden For Life Logo" className="logo-img logo-md" />
        </button>

        <h1 style={{
          fontSize: 'clamp(32px, 8vw, 64px)',
          marginBottom: '20px',
          background: 'linear-gradient(to bottom, #772905ff, #360464ff 50%, #56056eff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Mind
        </h1>

        {/* Main Holographic Brain Visualization */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '20px auto 40px',
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          aspectRatio: '1 / 1'
        }}>
          <div style={{
            transform: 'scale(0.75)',
            transformOrigin: 'center center'
          }}>
            <Mindholo nodeCount={200} showScanline={true} />
          </div>
        </div>

        <p style={{
          fontSize: 'clamp(16px, 4vw, 24px)',
          maxWidth: '800px',
          margin: '0 auto 40px',
          lineHeight: '1.6',
          color: '#FFFEF0'
        }}>
          Explore the power of mental clarity, focus, and intellectual growth.
        </p>

        {/* Content Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
          marginTop: '40px'
        }}>
          {[
            { title: 'Meditation', icon: '🧘', desc: 'Cultivate inner peace and awareness' },
            { title: 'Focus', icon: '🎯', desc: 'Sharpen your concentration and clarity' },
            { title: 'Growth', icon: '🌱', desc: 'Expand your consciousness and wisdom' }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              style={{
                padding: '30px',
                border: '2px solid rgba(167, 59, 198, 0.3)',
                borderRadius: '12px',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px'
                }}
              >
                {item.icon}
              </div>
              <h3 style={{
                fontSize: '20px',
                marginBottom: '10px',
                color: 'rgb(167, 59, 198)'
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#FFFEF0',
                opacity: 0.8
              }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/')}
          animate={{ borderColor: ['#ef8616', 'rgb(167, 59, 198)', '#ef8616'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            marginTop: '50px',
            padding: '15px 40px',
            fontSize: '16px',
            backgroundColor: 'transparent',
            color: '#FFFEF0',
            border: '2px solid #ef8616',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          Back to Home
        </motion.button>
      </div>
    </div>
  );
};

export default React.memo(Mind);
