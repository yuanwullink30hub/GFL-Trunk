import React from 'react';
import GeneralBrandPage from './GeneralBrandPage';

/**
 * GardensPage — Shows the brand page template (index 4 in BRANDS array).
 * Always displays the template brand regardless of which slide was clicked.
 */
const GardensPage = ({ isVisible, onBack }) => {
  return (
    <GeneralBrandPage
      isVisible={isVisible}
      onBack={onBack}
      initialBrandIndex={4}
      hideNavWheel={true}
    />
  );
};

export default GardensPage;
