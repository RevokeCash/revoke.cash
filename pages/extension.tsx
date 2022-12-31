import Divider from 'components/common/Divider';
import DownloadButton from 'components/common/DownloadButton';
import Logo from 'components/common/Logo';
import ContentPageLayout from 'layouts/ContentPageLayout';
import { CHROME_EXTENSION_URL, FIREFOX_EXTENSION_URL } from 'lib/constants';
import { defaultSEO } from 'lib/next-seo.config';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';

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
      <ContentPageLayout>
        <div className="flex flex-col gap-2 text-lg leading-none">
          <h1>{t('extension:title')}</h1>

          <Divider className="my-2" />

          <div>
            <Trans i18nKey="extension:paragraph_1" />
          </div>

          <div>
            <Trans i18nKey="extension:paragraph_2" />
          </div>

          <div className="mx-auto">
            <Image src="/assets/images/extension-screenshot-1.png" height="500" width="800" />
          </div>

          <div>
            <Trans i18nKey="extension:paragraph_3" />
          </div>

          <div>
            <Trans i18nKey="extension:paragraph_4" />
          </div>

          <div className="mx-auto">
            <Image src="/assets/images/extension-screenshot-3.png" height="500" width="800" />
          </div>

          <div>
            <Trans i18nKey="extension:paragraph_5" />
          </div>

          <div>
            <Trans i18nKey="extension:paragraph_6" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
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
      </ContentPageLayout>
    </>
  );
};

export default Extension;
