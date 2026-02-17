'use client';

import KonamiEasterEgg from 'components/common/KonamiEasterEgg';
import { useKonamiCode } from 'lib/hooks/useKonamiCode';
import { useState } from 'react';

/**
 * Client component that listens for the Konami code (↑↑↓↓←→←→BA)
 * and displays the easter egg celebration when activated
 */
const KonamiCodeListener = () => {
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  useKonamiCode(() => {
    setShowEasterEgg(true);
  });

  return <>{showEasterEgg && <KonamiEasterEgg onClose={() => setShowEasterEgg(false)} />}</>;
};

export default KonamiCodeListener;
