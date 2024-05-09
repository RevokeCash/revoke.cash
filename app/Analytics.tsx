'use client';

import { usePathname } from 'lib/i18n/navigation';
import { init, track } from 'lib/utils/analytics';
import Script from 'next/script';
import { useEffect } from 'react';

const Analytics = () => {
  const path = usePathname();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!path) return;
    track('Viewed Page', { path });
  }, [path]);

  // SimpleAnalytics
  return (
    <>
      <Script>
        {
          'window.sa_event=window.sa_event||function(){var a=[].slice.call(arguments);window.sa_event.q?window.sa_event.q.push(a):window.sa_event.q=[a]};'
        }
      </Script>
      <Script async defer src="/assets/js/sa-v11.js" />
    </>
  );
};

export default Analytics;
