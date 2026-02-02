import React from 'react';
import GeneralBrandPage from '../GeneralBrandPage';

/**
 * KarmanPage - Brand detail page for KARMAN (Index 0)
 * Underground Techno Events organization
 * 
 * This component extends GeneralBrandPage with Karman-specific customizations.
 * Edit this file to customize the Karman brand experience.
 */
const KarmanPage = ({ isVisible, onBack }) => {
  return (
    <GeneralBrandPage 
      isVisible={isVisible}
      onBack={onBack}
      initialBrandIndex={0}
      brandSlug="karman"
    />
  );
};

// Brand-specific metadata for reference
KarmanPage.brandInfo = {
  id: '01',
  slug: 'karman',
  name: 'KARMAN',
  tagline: 'Underground Techno Events',
  accentColor: '#8b5cf6'
};

export default KarmanPage;
