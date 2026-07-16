import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { CHAIN_SELECT_MAINNETS } from '@revoke.cash/core/chains';
import Button from 'components/common/Button';
import ChainLogoStack from 'components/common/ChainLogoStack';
import TestimonialCarousel from 'components/landing/TestimonialCarousel';
import { TESTIMONIALS } from 'components/landing/testimonials-data';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const HeroSection = () => {
  const t = useTranslations();
  const featuredChainIds = CHAIN_SELECT_MAINNETS.slice(0, 6);

  const testimonials = TESTIMONIALS.map((testimonial) => ({
    ...testimonial,
    quote: t(`landing.testimonials.quotes.${testimonial.quoteKey}`),
  }));

  return (
    <div className="w-full px-4">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl gap-10 p-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-6 max-w-xl w-full mx-auto lg:max-w-none lg:mx-0">
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
            <div className="lg:hidden flex flex-col justify-center">
              <HeroShowcaseMedia />
            </div>
            <div className="flex flex-col gap-6 max-w-xl mx-auto lg:mx-0">
              <TestimonialCarousel testimonials={testimonials} />
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
          <div className="hidden lg:flex flex-col justify-center">
            <HeroShowcaseMedia />
          </div>
        </div>
      </div>
    </div>
  );
};

const HeroShowcaseMedia = () => {
  const t = useTranslations();

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800">
      <video
        src="/assets/videos/landing/hero.mp4"
        poster="/assets/images/landing/hero.jpg"
        aria-label={t('landing.features.dashboard.title')}
        className="h-auto w-full motion-reduce:hidden"
        autoPlay
        muted
        loop
        playsInline
      />
      <Image
        src="/assets/images/landing/hero.jpg"
        alt={t('landing.features.dashboard.title')}
        width={1200}
        height={900}
        priority
        fetchPriority="high"
        className="hidden h-auto w-full motion-reduce:block"
      />
    </div>
  );
};

export default HeroSection;
