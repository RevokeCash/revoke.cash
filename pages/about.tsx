import Divider from 'components/common/Divider';
import Heading from 'components/common/Heading';
import ImageLink from 'components/common/ImageLink';
import { defaultSEO } from 'lib/next-seo.config';
import { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import Link from 'next/link';
import React from 'react';
import 'react-toastify/dist/ReactToastify.css';

const About: NextPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <NextSeo {...defaultSEO} title={t('common:meta.title')} description={t('common:meta.description')} />
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
        <Heading text={t('about:title')} type="h2" center />

        <div>
          <Heading text={t('about:sections.token_allowances.heading')} type="h4" />
          <Trans
            i18nKey="about:sections.token_allowances.paragraph_1"
            components={[<span style={{ fontStyle: 'italic' }} />]}
          />
        </div>

        <div>
          <Heading text={t('about:sections.risks.heading')} type="h4" />
          <Trans i18nKey="about:sections.risks.paragraph_1" />
        </div>

        <div>
          <Heading text={t('about:sections.revoke_cash.heading')} type="h4" />
          <Trans i18nKey="about:sections.revoke_cash.paragraph_1" />
        </div>

        <div>
          <Heading text={t('about:sections.read_more.heading')} type="h4" />
          <Trans
            i18nKey="about:sections.read_more.paragraph_1"
            components={[
              <a href="https://kalis.me/unlimited-erc20-allowances/" target="_blank">
                <span style={{ fontStyle: 'italic' }} />
              </a>,
              <Link href="/faq">
                <a />
              </Link>,
            ]}
          />
        </div>

        <div>
          <Heading text={t('about:sections.credits.heading')} type="h4" />
          <Trans
            i18nKey="about:sections.credits.paragraph_1"
            components={[
              <a href="https://twitter.com/RoscoKalis" target="_blank" />,
              <a href="https://etherscan.io/" target="_blank" />,
              <a href="https://covalenthq.com/" target="_blank" />,
            ]}
          />
        </div>

        <div>
          <Heading text={t('about:sections.sponsors.heading')} type="h4" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <Trans
                i18nKey="about:sections.sponsors.paragraph_1"
                components={[<a href="https://twitter.com/RevokeCash" target="_blank" />]}
              />
            </div>
            <div
              style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
            >
              <ImageLink
                src="/assets/images/vendor/earnifi.png"
                alt="Earni.fi"
                href="https://earni.fi/"
                height={75}
                width={225}
                label="Earni.fi"
              />
            </div>
          </div>
        </div>

        <Divider />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
          <Link href="/privacy-policy">{t('common:privacy_policy')}</Link>
        </div>
      </div>
    </>
  );
};

export default About;
