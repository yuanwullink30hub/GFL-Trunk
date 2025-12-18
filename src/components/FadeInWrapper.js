import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const FadeInWrapper = ({ children }) => {
  const location = useLocation();
  const fromZoom = location.state?.fromZoom;
  const zoomOrigin = location.state?.zoomOrigin || { x: '50%', y: '50%' };

  // If coming from a zoom transition, start zoomed in and zoom out
  // Otherwise, just fade in normally
  if (fromZoom) {
    return (
      <motion.div
        style={{
          transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`,
          willChange: 'transform, opacity'
        }}
        initial={{ scale: 60, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          scale: { duration: 1.2, ease: [0.2, 0, 0.2, 1] },
          opacity: { duration: 0.45, ease: 'easeOut' }
        }}
      >
        {children}
      </motion.div>
    );
  }

  // Default fade in for direct navigation
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

export default FadeInWrapper;
