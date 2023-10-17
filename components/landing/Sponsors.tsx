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
            components={[<Href href="/sponsorships" html underline="hover" router className="font-medium" />]}
          />
        </LandingParagraph>
      </div>

      <div className="flex flex-col items-center gap-4 max-w-5xl">
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-3 gap-y-4">
          <SponsorBanner
            name="Boring Security"
            banner="/assets/images/vendor/sponsors/boring-security.png"
            url="https://boringsecurity.com"
            tier="gold"
            overlay={{
              url: 'https://discord.gg/boringsecurity',
              top: '4.7%',
              left: '82.7%',
              width: '15.8%',
              height: '78.2%',
            }}
          />
        </div>
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-2 gap-y-4 max-w-3xl">
          <SponsorBanner
            name="Vulcan"
            banner="/assets/images/vendor/sponsors/vulcan.jpg"
            url="https://www.vulcan.xyz"
            tier="silver"
          />
          <SponsorBanner
            name="PREMINT"
            banner="/assets/images/vendor/sponsors/premint.jpg"
            url="https://www.premint.xyz"
            tier="silver"
          />
          <SponsorBanner
            name="Layer3"
            banner="/assets/images/vendor/sponsors/layer3.jpg"
            url="https://layer3.xyz"
            tier="silver"
          />
          <SponsorBanner
            name="Brave Wallet"
            banner="/assets/images/vendor/sponsors/brave.png"
            url="https://brave.com/wallet/?mtm_source=revoke.cash&mtm_medium=paid&mtm_campaign=q3wallet"
            tier="silver"
          />
        </div>
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-1.5 gap-y-4">
          <SponsorBanner
            name="Swap.kiwi"
            banner="/assets/images/vendor/sponsors/swap-kiwi.png"
            url="https://swap.kiwi"
            tier="bronze"
          />
        </div>
      </div>
    </FullWidthLandingSection>
  );
};

export default Sponsors;
