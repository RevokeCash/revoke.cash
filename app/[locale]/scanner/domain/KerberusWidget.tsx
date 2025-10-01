'use client';

import { KERBERUS_API_KEY } from 'lib/constants';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import Script from 'next/script';

const KerberusWidget = () => {
  const { darkMode } = useColorTheme();
  if (!KERBERUS_API_KEY) return null;

  return (
    <div className="min-h-21 pb-4 text-center">
      <div
        id="kerberus-search-widget"
        data-api-key={KERBERUS_API_KEY}
        data-ref-code="REVOKECASH"
        data-dark-mode={darkMode}
      />
      <Script
        src="https://cdn.kerberus.com/widgets/kerberus-search-widget-1744134808.js"
        integrity="sha384-Nw62ytrjA+5ndfNwAeHQryqk55YcvEATG/kD9M6xHlQM36gGgTa68aSoTiYyygA0"
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default KerberusWidget;
