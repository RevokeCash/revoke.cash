'use client';

import { SimpleAnalytics } from '@simpleanalytics/next';
import { usePathname } from 'lib/i18n/navigation';
import analytics from 'lib/utils/analytics';
import { useEffect } from 'react';

const Analytics = () => {
  const path = usePathname();

  useEffect(() => {
    analytics.init();
  }, []);

  useEffect(() => {
    if (!path) return;
    analytics.track('Viewed Page', { path });
  }, [path]);

  // SimpleAnalytics
  return (
    <>
      {/* <Script>
        {
          'window.sa_event=window.sa_event||function(){var a=[].slice.call(arguments);window.sa_event.q?window.sa_event.q.push(a):window.sa_event.q=[a]};'
        }
      </Script> */}
      {/* <Script async defer src="/assets/js/sa-v11.js" /> */}
      <SimpleAnalytics autoCollect={false} />
    </>
  );
};

export default Analytics;
