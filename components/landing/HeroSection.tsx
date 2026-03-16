import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import ChainLogoStack from 'components/common/ChainLogoStack';
import TestimonialCard from 'components/landing/TestimonialCard';
import { TESTIMONIALS } from 'components/landing/testimonials-data';
import { CHAIN_SELECT_MAINNETS } from 'lib/utils/chains';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const HeroSection = () => {
  const t = useTranslations();
  const testimonial = TESTIMONIALS[0];
  const featuredChainIds = CHAIN_SELECT_MAINNETS.slice(0, 6);

  return (
    <div className="w-full px-4 sm:pt-4">
      <div className="relative overflow-hidden  bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-14">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
                {t('landing.hero_section.title')}
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">{t('landing.hero_section.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/token-approval-checker/ethereum" style="primary" size="lg" router className="gap-2">
                {t('common.buttons.get_started')}
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-w-xl">
              <TestimonialCard testimonial={testimonial} />
            </div>
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
                100+ {t('landing.stats.networks_supported').toLowerCase()}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center">
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
