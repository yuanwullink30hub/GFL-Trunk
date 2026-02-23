import React, { memo } from 'react';
import FilosofiePlaybox from './filosofie/FilosofiePage';

const FilosofiePage = memo(({ isVisible, onBack }) => {
  return <FilosofiePlaybox isVisible={isVisible} onBack={onBack} />;
});

FilosofiePage.displayName = 'FilosofiePage';

export default FilosofiePage;
