import React from 'react';
import GeneralBrandPage from './GeneralBrandPage';

/**
 * GardensPage - Wrapper component that renders the GeneralBrandPage
 * This now uses the full NeonNexus brand discovery experience
 * 
 * Props:
 * - isVisible: boolean - whether the page should be displayed
 * - onBack: function - callback to close the page and return
 * - brandIndex: number - which brand (0-11) to show (controlled by parent via brand ring)
 */
const GardensPage = ({ isVisible, onBack, brandIndex = 0 }) => {
  return (
    <GeneralBrandPage 
      isVisible={isVisible}
      onBack={onBack}
      initialBrandIndex={brandIndex}
    />
  );
};

export default GardensPage;
