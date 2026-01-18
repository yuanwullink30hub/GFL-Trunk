import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';

const LoginModal = ({ isOpen, onClose }) => {
  const handleLogin = () => {
    // Handle successful login - close the modal
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.6, delay: 0.5, ease: 'easeInOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.6, delay: 0, ease: 'easeInOut' } }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            overflow: 'auto'
          }}
        >
          <div style={{ transform: 'scale(0.8)', transformOrigin: 'center center' }}>
            <LoginForm onLogin={handleLogin} onClose={onClose} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(LoginModal);
