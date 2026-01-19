import React, { useState } from 'react';

// Auth modes enum
const AuthMode = {
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD'
};

// Icon Components
const IconLock = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconUser = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMail = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconShield = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </svg>
);

const IconCpu = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect width="16" height="16" x="4" y="4" rx="2" />
    <rect width="6" height="6" x="9" y="9" rx="1" />
    <path d="M15 2v2" />
    <path d="M15 20v2" />
    <path d="M2 15h2" />
    <path d="M2 9h2" />
    <path d="M20 15h2" />
    <path d="M20 9h2" />
    <path d="M9 2v2" />
    <path d="M9 20v2" />
  </svg>
);

const IconArrowRight = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const IconEye = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = ({ className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

// HoloInput Component
const HoloInput = ({ label, icon, type = 'text', value, onChange, name, placeholder, required }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const hasValue = value !== undefined && String(value).length > 0;
  const isFloating = isFocused || hasValue;

  const containerStyle = {
    position: 'relative',
    marginBottom: '24px'
  };

  const labelStyle = {
    position: 'absolute',
    transition: 'all 0.3s ease',
    pointerEvents: 'none',
    zIndex: 10,
    fontFamily: 'inherit',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    ...(isFloating ? {
      top: '-20px',
      left: 0,
      fontSize: '12px',
      color: '#fb923c',
      fontWeight: 'bold',
      textShadow: '0 0 10px rgba(249, 115, 22, 0.5)'
    } : {
      top: '12px',
      left: icon ? '40px' : '0',
      fontSize: '14px',
      color: '#9a3412'
    })
  };

  const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  };

  const iconContainerStyle = {
    position: 'absolute',
    left: 0,
    pointerEvents: 'none',
    color: isFocused ? '#fdba74' : '#9a3412',
    transition: 'color 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '100%'
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: 'transparent',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: '1px solid #9a3412',
    padding: '12px 48px 12px ' + (icon ? '40px' : '0'),
    color: '#fed7aa',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    fontFamily: 'monospace',
    fontSize: '18px',
    ...(isFocused && {
      borderBottomColor: '#fb923c'
    })
  };

  const passwordToggleStyle = {
    position: 'absolute',
    right: 0,
    padding: '8px',
    color: '#9a3412',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.3s ease',
    zIndex: 10
  };

  const glowLineStyle = {
    height: '1px',
    backgroundColor: '#fb923c',
    boxShadow: '0 0 10px rgba(249, 115, 22, 0.8)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    transition: 'width 0.5s ease-out',
    width: isFocused ? '100%' : '0%'
  };

  return (
    <div style={containerStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={inputContainerStyle}>
        {icon && (
          <div style={iconContainerStyle}>
            {React.cloneElement(icon, { style: { width: '20px', height: '20px' } })}
          </div>
        )}
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          style={inputStyle}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={passwordToggleStyle}
            tabIndex={-1}
            onMouseEnter={(e) => e.target.style.color = '#fb923c'}
            onMouseLeave={(e) => e.target.style.color = '#9a3412'}
          >
            {showPassword ? <IconEyeOff style={{ width: '20px', height: '20px' }} /> : <IconEye style={{ width: '20px', height: '20px' }} />}
          </button>
        )}
      </div>
      <div style={glowLineStyle} />
    </div>
  );
};

// HoloButton Component
const HoloButton = ({ children, type = 'button', onClick, variant = 'primary' }) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle = {
    position: 'relative',
    width: '100%',
    padding: '12px 24px',
    overflow: 'hidden',
    fontWeight: 'bold',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
  };

  const variants = {
    primary: {
      color: '#431407',
      backgroundColor: 'transparent',
      border: '1px solid #fb923c',
      boxShadow: isHovered ? '0 0 20px rgba(249, 115, 22, 0.6)' : 'none'
    },
    secondary: {
      color: isHovered ? '#fed7aa' : '#fb923c',
      backgroundColor: 'transparent',
      border: '1px solid ' + (isHovered ? '#fb923c' : '#9a3412'),
      boxShadow: isHovered ? '0 0 15px rgba(249, 115, 22, 0.3)' : 'none'
    }
  };

  const buttonStyle = {
    ...baseStyle,
    ...variants[variant]
  };

  const contentStyle = {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const glitchOverlayStyle = {
    position: 'absolute',
    inset: 0,
    transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
    background: 'rgba(255, 255, 255, 0.2)',
    transition: 'transform 0.7s ease-in-out',
    skewX: '12deg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={contentStyle}>{children}</span>
      <div style={glitchOverlayStyle} />
    </button>
  );
};

// Main Login Component
const Login = ({ onLogin, onClose }) => {
  const [mode, setMode] = useState(AuthMode.LOGIN);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => {
      if (mode === AuthMode.FORGOT_PASSWORD) {
        setMode(AuthMode.LOGIN);
      } else {
        if (onLogin) onLogin();
      }
    }, 800);
  };

  const toggleMode = (newMode) => {
    setMode(newMode);
    setFormData({ ...formData, password: '', confirmPassword: '' });
  };

  const getButtonText = () => {
    switch (mode) {
      case AuthMode.LOGIN: return 'Verbinding Initialiseren';
      case AuthMode.REGISTER: return 'ID Registreren';
      case AuthMode.FORGOT_PASSWORD: return 'Herstelmail';
      default: return '';
    }
  };

  // Styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    padding: '16px',
    position: 'relative',
    zIndex: 10
  };

  const floatingOrb1Style = {
    display: 'none'
  };

  const floatingOrb2Style = {
    display: 'none'
  };

  const cardStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: '448px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(249, 115, 22, 0.3)',
    padding: '32px 40px',
    overflow: 'hidden'
  };

  const cornerAccentStyle = (position) => {
    const base = {
      position: 'absolute',
      width: '32px',
      height: '32px',
      borderColor: '#fb923c',
      borderStyle: 'solid',
      borderWidth: 0
    };
    
    switch (position) {
      case 'topLeft':
        return { ...base, top: 0, left: 0, borderTopWidth: '2px', borderLeftWidth: '2px' };
      case 'topRight':
        return { ...base, top: 0, right: 0, borderTopWidth: '2px', borderRightWidth: '2px' };
      case 'bottomLeft':
        return { ...base, bottom: 0, left: 0, borderBottomWidth: '2px', borderLeftWidth: '2px' };
      case 'bottomRight':
        return { ...base, bottom: 0, right: 0, borderBottomWidth: '2px', borderRightWidth: '2px' };
      default:
        return base;
    }
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px'
  };

  const iconContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px'
  };

  const iconWrapperStyle = {
    position: 'relative'
  };

  const iconGlowStyle = {
    display: 'none'
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    background: 'linear-gradient(to right, #fdba74, #fed7aa, #e9d5ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '0.1em'
  };

  const toggleButtonStyle = {
    marginTop: '12px',
    color: '#fb923c',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid transparent',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    fontSize: '20px',
    fontFamily: 'monospace'
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };

  const forgotPasswordStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '-16px',
    marginBottom: '24px'
  };

  const forgotButtonStyle = {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#9a3412',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    transition: 'color 0.3s ease'
  };

  const submitContainerStyle = {
    paddingTop: '16px'
  };

  return (
    <div style={containerStyle}>
      {/* CSS Keyframes for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.05); }
          }
        `}
      </style>

      {/* Floating Holographic Elements Background */}
      <div style={floatingOrb1Style}></div>
      <div style={floatingOrb2Style}></div>

      {/* Main Card */}
      <div style={cardStyle}>
        
        {/* Decorative Corner Accents */}
        <div style={cornerAccentStyle('topLeft')}></div>
        <div style={cornerAccentStyle('topRight')}></div>
        <div style={cornerAccentStyle('bottomLeft')}></div>
        <div style={cornerAccentStyle('bottomRight')}></div>

        {/* Header Section */}
        <div style={headerStyle}>
          <div style={iconContainerStyle}>
            <div style={iconWrapperStyle}>
              <div style={iconGlowStyle}></div>
              <IconCpu style={{ width: '64px', height: '64px', color: '#fb923c', position: 'relative', zIndex: 10, animation: 'pulse 2s ease-in-out infinite' }} />
            </div>
          </div>
          <h1 style={titleStyle}>AXIS TERMINAL</h1>
          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => toggleMode(mode === AuthMode.LOGIN ? AuthMode.REGISTER : AuthMode.LOGIN)}
              style={toggleButtonStyle}
              onMouseEnter={(e) => {
                e.target.style.color = '#a855f7';
                e.target.style.borderBottomColor = '#a855f7';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#fb923c';
                e.target.style.borderBottomColor = 'transparent';
              }}
            >
              {mode === AuthMode.LOGIN ? "TOEGANG AANVRAGEN" : "INLOGGEN"}
            </button>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} style={formStyle}>
          
          {(mode === AuthMode.REGISTER || mode === AuthMode.FORGOT_PASSWORD) && (
            <HoloInput
              label="Agent ID"
              name="username"
              value={formData.username}
              onChange={handleChange}
              icon={<IconUser />}
              placeholder="Bijv: Maverick_01"
              required
            />
          )}

          <HoloInput
            label="Neurale Link (E-mail)"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            icon={<IconMail />}
            placeholder="agent@nexus.net"
            required
          />

          {(mode === AuthMode.LOGIN || mode === AuthMode.REGISTER) && (
            <HoloInput
              label="Wachtwoord"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              icon={<IconLock />}
              placeholder="••••••••"
              required
            />
          )}

          {mode === AuthMode.REGISTER && (
            <HoloInput
              label="Bevestig Wachtwoord"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={<IconShield />}
              placeholder="••••••••"
              required
            />
          )}

          {mode === AuthMode.LOGIN && (
            <div style={forgotPasswordStyle}>
              <button 
                type="button"
                onClick={() => toggleMode(AuthMode.FORGOT_PASSWORD)}
                style={forgotButtonStyle}
                onMouseEnter={(e) => e.target.style.color = '#fff'}
                onMouseLeave={(e) => e.target.style.color = '#9a3412'}
              >
                Gegevens Herstellen?
              </button>
            </div>
          )}

          <div style={submitContainerStyle}>
            <HoloButton type="submit">
              {getButtonText()}
              <IconArrowRight style={{ width: '20px', height: '20px' }} />
            </HoloButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
