import Script from 'next/script';

const Analytics = () => {
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
