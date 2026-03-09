import { useTranslations } from 'next-intl';
import ComparisonTable from './ComparisonTable';
import { TIER_KEYS } from './pricing-data';
import TierCard from './TierCard';

const PricingPage = () => {
  const t = useTranslations();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-12">
      <div className="text-center flex flex-col gap-3">
        <h1 className="text-4xl font-semibold">{t('premium.pricing.title')}</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">{t('premium.pricing.description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIER_KEYS.map((tierKey) => (
          <TierCard key={tierKey} tierKey={tierKey} />
        ))}
      </div>

      <ComparisonTable />

      {/* <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-center">{t('premium.pricing.feature_sections.title')}</h2>
        <div className="flex flex-col gap-12">
          {FEATURE_SECTIONS.map(({ key, image }, index) => (
            <FeatureSection
              key={key}
              sectionKey={key}
              image={image}
              imagePosition={index % 2 === 0 ? 'left' : 'right'}
            />
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default PricingPage;
