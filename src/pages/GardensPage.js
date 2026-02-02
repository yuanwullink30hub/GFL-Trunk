import React from 'react';
import GeneralBrandPage from './GeneralBrandPage';

/**
 * GardensPage - Wrapper component that renders the GeneralBrandPage
 * This now uses the full NeonNexus brand discovery experience
 * 
 * Props:
 * - isVisible: boolean - whether the page should be displayed
 * - onBack: function - callback to close the page and return
 * - initialBrandIndex: number - which brand (0-11) to show initially (corresponds to Gardens slideshow index)
 */
const GardensPage = ({ isVisible, onBack, initialBrandIndex = 0 }) => {
  return (
    <GeneralBrandPage 
      isVisible={isVisible}
      onBack={onBack}
      initialBrandIndex={initialBrandIndex}
    />
  );
};

export default GardensPage;
