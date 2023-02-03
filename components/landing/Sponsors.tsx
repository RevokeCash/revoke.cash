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
      <div className="pt-4 pb-8 max-w-3xl">
        <LandingParagraph>
          <Trans
            i18nKey="landing:sponsors.description"
            components={[<Href href="/sponsorships" html underline="hover" />]}
          />
        </LandingParagraph>
      </div>

      <div className="flex flex-col items-center gap-4 max-w-5xl px-2">
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-3 gap-y-4">
          <SponsorBanner
            name="DefiSaver"
            banner="https://i.postimg.cc/q7kCJY7W/defi-savor.png"
            url="https://defisaver.com/?mtm_campaign=cryptostats-dec2022&mtm_source=cryptostats&mtm_medium=banner"
            tier="gold"
          />
          <SponsorBanner
            name="DefiSaver"
            banner="https://i.postimg.cc/q7kCJY7W/defi-savor.png"
            url="https://defisaver.com/?mtm_campaign=cryptostats-dec2022&mtm_source=cryptostats&mtm_medium=banner"
            tier="gold"
          />
        </div>
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-2 gap-y-4">
          <SponsorBanner
            name="DefiSaver"
            banner="https://i.postimg.cc/q7kCJY7W/defi-savor.png"
            url="https://defisaver.com/?mtm_campaign=cryptostats-dec2022&mtm_source=cryptostats&mtm_medium=banner"
            tier="silver"
          />
          <SponsorBanner
            name="DefiSaver"
            banner="https://i.postimg.cc/q7kCJY7W/defi-savor.png"
            url="https://defisaver.com/?mtm_campaign=cryptostats-dec2022&mtm_source=cryptostats&mtm_medium=banner"
            tier="silver"
          />
        </div>
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-1.5 gap-y-4">
          <SponsorBanner
            name="DefiSaver"
            banner="https://i.postimg.cc/q7kCJY7W/defi-savor.png"
            url="https://defisaver.com/?mtm_campaign=cryptostats-dec2022&mtm_source=cryptostats&mtm_medium=banner"
            tier="bronze"
          />
          <SponsorBanner
            name="DefiSaver"
            banner="https://i.postimg.cc/q7kCJY7W/defi-savor.png"
            url="https://defisaver.com/?mtm_campaign=cryptostats-dec2022&mtm_source=cryptostats&mtm_medium=banner"
            tier="bronze"
          />
          <SponsorBanner
            name="DefiSaver"
            banner="https://i.postimg.cc/q7kCJY7W/defi-savor.png"
            url="https://defisaver.com/?mtm_campaign=cryptostats-dec2022&mtm_source=cryptostats&mtm_medium=banner"
            tier="bronze"
          />
        </div>
      </div>
    </FullWidthLandingSection>
  );
};

export default Sponsors;
