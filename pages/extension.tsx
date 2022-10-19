import DownloadButton from 'components/common/DownloadButton';
import Heading from 'components/common/Heading';
import Logo from 'components/common/Logo';
import { CHROME_EXTENSION_URL, FIREFOX_EXTENSION_URL } from 'lib/constants';
import { defaultSEO } from 'lib/next-seo.config';
import { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import React from 'react';
import 'react-toastify/dist/ReactToastify.css';

const Extension: NextPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <NextSeo
        {...defaultSEO}
        title={t('extension:meta.title')}
        description={t('extension:meta.description')}
        openGraph={{
          url: 'https://revoke.cash/extension',
          images: [
            {
              url: 'https://revoke.cash/assets/images/extension-card.png',
              width: 1600,
              height: 900,
            },
          ],
          site_name: 'Revoke.cash',
          type: 'website',
        }}
      />
      <div
        style={{
          textAlign: 'left',
          fontSize: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '800px',
          margin: 'auto',
        }}
      >
        <Heading text={t('extension:title')} type="h2" center />

        <div>
          <Trans i18nKey="extension:paragraph_1" />
        </div>

        <div>
          <Trans i18nKey="extension:paragraph_2" />
        </div>

        <div>
          <Image src="/assets/images/extension-screenshot-1.png" height="800" width="1280" />
        </div>

        <div>
          <Trans i18nKey="extension:paragraph_3" />
        </div>

        <div>
          <Trans i18nKey="extension:paragraph_4" />
        </div>

        <div>
          <Image src="/assets/images/extension-screenshot-3.png" height="800" width="1280" />
        </div>

        <div>
          <Trans i18nKey="extension:paragraph_5" />
        </div>

        <div>
          <Trans i18nKey="extension:paragraph_6" />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
          <DownloadButton href={CHROME_EXTENSION_URL}>
            <Logo src="/assets/images/vendor/chrome.png" alt="Chrome Logo" />
            <Logo src="/assets/images/vendor/brave.png" alt="Brave Logo" />
            <Logo src="/assets/images/vendor/edge.png" alt="Edge Logo" />
          </DownloadButton>
          <DownloadButton href={FIREFOX_EXTENSION_URL}>
            <Logo src="/assets/images/vendor/firefox.png" alt="Firefox Logo" />
          </DownloadButton>
        </div>
      </div>
    </>
  );
};

export default Extension;
