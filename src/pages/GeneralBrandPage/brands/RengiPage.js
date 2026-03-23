import React from 'react';
import GeneralBrandPage from '../GeneralBrandPage';

/**
 * RengiPage - Brand detail page for RENGI FOODS (Index 3)
 * Sustainable Organic Nutrition company
 * 
 * This component extends GeneralBrandPage with Rengi-specific customizations.
 * Edit this file to customize the Rengi Foods brand experience.
 */
const RengiPage = ({ isVisible, onBack }) => {
  return (
    <GeneralBrandPage 
      isVisible={isVisible}
      onBack={onBack}
      initialBrandIndex={3}
      brandSlug="template-04"
    />
  );
};

// Brand-specific metadata for reference
RengiPage.brandInfo = {
  id: '04',
  slug: 'rengi',
  name: 'RENGI FOODS',
  tagline: 'Sustainable Organic Nutrition',
  accentColor: '#10b981'
};

export default RengiPage;
