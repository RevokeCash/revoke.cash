import {
  ArrowUturnLeftIcon,
  ClockIcon,
  GlobeAltIcon,
  RectangleStackIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { Feature } from 'components/landing/FeaturesShowcase';
import { useTranslations } from 'next-intl';
import ComparisonTable from './ComparisonTable';
import TierCard from './TierCard';

const TRANSLATION_PREFIX = 'premium.pricing.feature_sections';

const PremiumPricingPageContent = () => {
  const t = useTranslations();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-12">
      <div className="text-center flex flex-col gap-3">
        <h1 className="text-4xl font-semibold">{t('premium.pricing.title')}</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">{t('premium.pricing.description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TierCard tierKey="free" price="$0" href="/token-approval-checker/ethereum" />
        <TierCard tierKey="premium" price="$79" href="/account" />
        <TierCard tierKey="bundle" price="$199" href="/account" highlighted />
      </div>

      <ComparisonTable />

      <div className="flex flex-col gap-8">
        <h2 className="text-3xl font-bold text-center">{t('premium.pricing.feature_sections.title')}</h2>
        <div className="flex flex-col gap-8">
          <Feature
            featureKey="multichain_approvals"
            icon={GlobeAltIcon}
            image="/assets/images/premium/multichain-approvals.jpg"
            imagePosition="left"
            translationPrefix={TRANSLATION_PREFIX}
          />
          <Feature
            featureKey="multichain_history"
            icon={ClockIcon}
            image="/assets/images/premium/multichain-history.jpg"
            imagePosition="right"
            translationPrefix={TRANSLATION_PREFIX}
          />
          <Feature
            featureKey="multichain_exploit_checker"
            icon={ShieldExclamationIcon}
            image="/assets/images/premium/multichain-exploit-checker.jpg"
            imagePosition="left"
            translationPrefix={TRANSLATION_PREFIX}
          />
          <Feature
            featureKey="unlimited_batch_revokes"
            icon={RectangleStackIcon}
            image="/assets/images/premium/batch-revoke.jpg"
            imagePosition="right"
            translationPrefix={TRANSLATION_PREFIX}
          />
          <Feature
            featureKey="time_machine"
            icon={ArrowUturnLeftIcon}
            image="/assets/images/premium/time-machine.jpg"
            imagePosition="left"
            translationPrefix={TRANSLATION_PREFIX}
          />
        </div>
      </div>
    </div>
  );
};

export default PremiumPricingPageContent;
