import React from 'react';
import GeneralBrandPage from '../GeneralBrandPage';

/**
 * ElevenElevenPage - Brand detail page for ELEVEN ELEVEN TATTOOS (Index 2)
 * Artistic Expression & Body Art studio
 * 
 * This component extends GeneralBrandPage with Eleven Eleven-specific customizations.
 * Edit this file to customize the tattoo studio brand experience.
 */
const ElevenElevenPage = ({ isVisible, onBack }) => {
  return (
    <GeneralBrandPage 
      isVisible={isVisible}
      onBack={onBack}
      initialBrandIndex={2}
      brandSlug="template-03"
    />
  );
};

// Brand-specific metadata for reference
ElevenElevenPage.brandInfo = {
  id: '03',
  slug: 'eleven-eleven',
  name: 'ELEVEN ELEVEN TATTOOS',
  tagline: 'Artistic Expression & Body Art',
  accentColor: '#ec4899'
};

export default ElevenElevenPage;
