import React from 'react';
import GeneralBrandPage from '../GeneralBrandPage';

/**
 * Code49Page - Brand detail page for CODE49 (Index 1)
 * AI Solutions & Advanced Tech company
 * 
 * This component extends GeneralBrandPage with Code49-specific customizations.
 * Edit this file to customize the Code49 brand experience.
 */
const Code49Page = ({ isVisible, onBack }) => {
  return (
    <GeneralBrandPage 
      isVisible={isVisible}
      onBack={onBack}
      initialBrandIndex={1}
      brandSlug="template-02"
    />
  );
};

// Brand-specific metadata for reference
Code49Page.brandInfo = {
  id: '02',
  slug: 'code49',
  name: 'CODE49',
  tagline: 'AI Solutions & Advanced Tech',
  accentColor: '#06b6d4'
};

export default Code49Page;
