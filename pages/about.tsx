import Divider from 'components/common/Divider';
import Href from 'components/common/Href';
import ImageLink from 'components/common/ImageLink';
import PublicLayout from 'layouts/PublicLayout';
import { defaultSEO } from 'lib/next-seo.config';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';

const About: NextPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <NextSeo {...defaultSEO} title={t('common:meta.title')} description={t('common:meta.description')} />
      <PublicLayout>
        <div className="flex flex-col gap-2 text-lg leading-none">
          <h1 className="text-center">{t('about:title')}</h1>

          <div>
            <h4>{t('about:sections.token_allowances.heading')}</h4>
            <Trans i18nKey="about:sections.token_allowances.paragraph_1" components={[<span className="italic" />]} />
          </div>

          <div>
            <h4>{t('about:sections.risks.heading')}</h4>
            <Trans i18nKey="about:sections.risks.paragraph_1" />
          </div>

          <div>
            <h4>{t('about:sections.revoke_cash.heading')}</h4>
            <Trans i18nKey="about:sections.revoke_cash.paragraph_1" />
          </div>

          <div>
            <h4>{t('about:sections.read_more.heading')}</h4>
            <Trans
              i18nKey="about:sections.read_more.paragraph_1"
              components={[
                <Href href="https://kalis.me/unlimited-erc20-allowances/" className="italic" style="html" external />,
                <Href href="/faq" router style="html" />,
              ]}
            />
          </div>

          <div>
            <h4>{t('about:sections.credits.heading')}</h4>
            <Trans
              i18nKey="about:sections.credits.paragraph_1"
              components={[
                <Href href="https://twitter.com/RoscoKalis" external style="html" />,
                <Href href="https://etherscan.io/" external style="html" />,
                <Href href="https://blockscout.com/" external style="html" />,
                <Href href="https://covalenthq.com/" external style="html" />,
              ]}
            />
          </div>

          <div>
            <h4>{t('about:sections.sponsors.heading')}</h4>
            <div className="flex flex-col gap-2">
              <div>
                <Trans
                  i18nKey="about:sections.sponsors.paragraph_1"
                  components={[<Href href="https://twitter.com/RevokeCash" external style="html" />]}
                />
              </div>
              <div className="flex flex-wrap justify-center items-center gap-1">
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

          <div className="flex flex-wrap justify-center items-center gap-1">
            <Href href="/privacy-policy" router style="html">
              {t('common:privacy_policy')}
            </Href>
          </div>
        </div>
      </PublicLayout>
    </>
  );
};

export default About;
