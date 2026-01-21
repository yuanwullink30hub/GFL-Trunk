import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../images/logo.png';
import '../styles/logo.css';

function Slide6() {
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

      {/* Content removed for debugging */}
    </div>
  );
}

            export default Slide6;



