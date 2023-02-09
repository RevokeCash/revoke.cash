import Href from 'components/common/Href';
import SponsorBanner from 'components/sponsors/SponsorBanner';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import FullWidthLandingSection from './FullWidthLandingSection';
import LandingParagraph from './LandingParagraph';

const Sponsors = () => {
  const { t } = useTranslation();

  return (
    <FullWidthLandingSection title={t('landing:sponsors.title')}>
      <div className="pt-4 pb-6 max-w-3xl mx-auto">
        <LandingParagraph>
          <Trans
            i18nKey="landing:sponsors.description"
            components={[<Href href="/sponsorships" html underline="hover" />]}
          />
        </LandingParagraph>
      </div>

      <div className="flex flex-col items-center gap-4 max-w-5xl px-2">
        {/* <div className="flex flex-row flex-wrap items-center justify-center gap-x-3 gap-y-4">
        <SponsorBanner
            name="Vulcan"
            banner="/assets/images/vendor/sponsors/vulcan.png"
            url="https://vulcan.xyz"
            tier="gold"
          />
          <SponsorBanner
            name="PREMINT"
            banner="/assets/images/vendor/sponsors/premint.png"
            url="https://vulcan.xyz"
            tier="gold"
          />
        </div> */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-2 gap-y-4">
          <SponsorBanner
            name="Vulcan"
            banner="/assets/images/vendor/sponsors/vulcan.png"
            url="https://vulcan.xyz"
            tier="silver"
          />
          <SponsorBanner
            name="PREMINT"
            banner="/assets/images/vendor/sponsors/premint.png"
            url="https://premint.xyz"
            tier="silver"
          />
        </div>
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-1.5 gap-y-4">
          <SponsorBanner
            name="Earni.fi"
            banner="/assets/images/vendor/sponsors/earnifi.png"
            url="https://earni.fi"
            tier="bronze"
          />
        </div>
      </div>
    </FullWidthLandingSection>
  );
};

export default Sponsors;
