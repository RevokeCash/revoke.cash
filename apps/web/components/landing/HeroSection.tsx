import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { CHAIN_SELECT_MAINNETS } from '@revoke.cash/core/chains';
import Button from 'components/common/Button';
import ChainLogoStack from 'components/common/ChainLogoStack';
import TestimonialCarousel from 'components/landing/TestimonialCarousel';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const HeroSection = () => {
  const t = useTranslations();
  const featuredChainIds = CHAIN_SELECT_MAINNETS.slice(0, 6);

  return (
    <div className="w-full px-4">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl gap-10 p-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
                {t.rich('landing.hero_section.title', {
                  highlight: (chunks) => <span className="bg-brand px-2 text-black whitespace-nowrap">{chunks}</span>,
                })}
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">{t('landing.hero_section.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/token-approval-checker/ethereum" style="primary" size="lg" router className="gap-2">
                {t('common.buttons.get_started')}
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
            {/* Hero image: shown here on mobile, hidden on desktop (shown in separate grid column) */}
            <div className="lg:hidden flex flex-col justify-center">
              <Image
                src="/assets/images/landing/hero.png"
                alt={t('landing.features.dashboard.title')}
                width={2000}
                height={1500}
                priority
                fetchPriority="high"
                className="h-auto w-full"
              />
            </div>
            <div className="flex flex-col gap-6 max-w-xl mx-auto lg:mx-0">
              <TestimonialCarousel />
              <div className="flex items-center gap-2">
                <ChainLogoStack
                  chainIds={featuredChainIds}
                  maxVisible={6}
                  logoSize={24}
                  border={false}
                  itemClassName="ring-2"
                  overlapClassName="-space-x-1.5"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t('landing.stats.networks_supported', { count: '100+' }).toLowerCase()}
                </span>
              </div>
            </div>
          </div>
          {/* Hero image: shown here on desktop in its own grid column, hidden on mobile */}
          <div className="hidden lg:flex flex-col justify-center">
            <Image
              src="/assets/images/landing/hero.png"
              alt={t('landing.features.dashboard.title')}
              width={2000}
              height={1500}
              className="h-auto w-full"
              priority
              fetchPriority="high"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
