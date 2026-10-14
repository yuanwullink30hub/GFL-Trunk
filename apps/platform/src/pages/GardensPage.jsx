import React, { memo } from 'react';
import GeneralBrandPage from '@gfl/brands';

/**
 * GardensPage — Shows the brand page template on the first page (index 0 in the BRANDS array, owner 14 Oct;
 * every slot is the same template). Always displays it regardless of which slide was clicked.
 */
const GardensPage = memo(({ isVisible, warm = false, onBack }) => {
  return (
    <GeneralBrandPage
      isVisible={isVisible}
      warm={warm}
      onBack={onBack}
      initialBrandIndex={0}
      hideNavWheel={true}
      overviewFirst={true}
    />
  );
});

export default GardensPage;
