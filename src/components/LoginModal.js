import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
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
          {/* ADD YOUR AISTUDIOS CONTENT HERE */}
          
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(LoginModal);
