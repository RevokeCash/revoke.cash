'use client';

import KonamiEasterEgg from 'components/common/KonamiEasterEgg';
import { useKonamiCode } from 'lib/hooks/useKonamiCode';
import { useState } from 'react';

const KonamiCodeListener = () => {
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  useKonamiCode(() => {
    setShowEasterEgg(true);
  });

  return <>{showEasterEgg && <KonamiEasterEgg onClose={() => setShowEasterEgg(false)} />}</>;
};

export default KonamiCodeListener;
