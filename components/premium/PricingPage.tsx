import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import Label from 'components/common/Label';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

type TierKey = 'free' | 'premium' | 'bundle';

interface PricingFeature {
  labelKey: string;
  free: boolean | string;
  premium: boolean | string;
  bundle: boolean | string;
  /** Per-tier override for the card display label (keyed by tier key). */
  cardLabelKey?: Partial<Record<TierKey, string>>;
}

const FEATURES: PricingFeature[] = [
  { labelKey: 'revoke_approvals', free: 'one_chain', premium: true, bundle: true },
  { labelKey: 'approval_history', free: 'one_chain', premium: true, bundle: true },
  { labelKey: 'exploit_checker', free: 'one_chain', premium: true, bundle: true },
  {
    labelKey: 'batch_revoke',
    free: 'per_batch',
    premium: 'unlimited',
    bundle: 'unlimited',
    cardLabelKey: {
      free: 'batch_revoke_paid',
      premium: 'unlimited_batch_revokes',
      bundle: 'unlimited_batch_revokes',
    },
  },
  { labelKey: 'multichain_dashboard', free: false, premium: true, bundle: true },
  { labelKey: 'multichain_exploit_checker', free: false, premium: true, bundle: true },
  { labelKey: 'priority_support', free: false, premium: true, bundle: true },
  {
    labelKey: 'address_slots',
    free: false,
    premium: 'one_address_slot',
    bundle: 'ten_address_slots',
    cardLabelKey: { premium: 'one_address_slot', bundle: 'ten_address_slots' },
  },
];

const TIER_KEYS: TierKey[] = ['free', 'premium', 'bundle'];

const TIER_PRICES: Record<TierKey, string> = {
  free: '$0',
  premium: '$99',
  bundle: '$299',
};

const TIER_HREFS: Record<TierKey, string> = {
  free: '/token-approval-checker/ethereum',
  premium: '/account',
  bundle: '/account',
};

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
    </div>
  );
};

export default PricingPage;

const TierCard = ({ tierKey }: { tierKey: TierKey }) => {
  const t = useTranslations();
  const highlighted = tierKey === 'premium';

  return (
    <div
      className={twMerge(
        'relative flex flex-col gap-6 rounded-xl border p-6',
        highlighted
          ? 'border-brand bg-brand/5 dark:bg-brand/10 ring-1 ring-brand'
          : 'border-zinc-200 dark:border-zinc-700',
      )}
    >
      {highlighted && (
        <Label className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-zinc-900">
          {t('premium.pricing.most_popular')}
        </Label>
      )}

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t(`premium.pricing.tiers.${tierKey}.name`)}</h2>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{TIER_PRICES[tierKey]}</span>
          {tierKey !== 'free' && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('premium.pricing.per_year')}</span>
          )}
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {t(`premium.pricing.tiers.${tierKey}.description`)}
        </p>
      </div>

      <Button
        href={TIER_HREFS[tierKey]}
        router
        style={highlighted ? 'primary' : 'secondary'}
        size="md"
        className="w-full justify-center"
      >
        {t(`premium.pricing.tiers.${tierKey}.cta`)}
      </Button>

      <ul className="flex flex-col gap-2.5">
        {FEATURES.map((feature) => {
          const included = feature[tierKey] !== false;
          const labelKey = feature.cardLabelKey?.[tierKey] ?? feature.labelKey;

          return (
            <li key={feature.labelKey} className="flex items-center gap-2 text-sm">
              {included ? (
                <CheckIcon className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <XMarkIcon className="w-4 h-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
              )}
              <span className={included ? undefined : 'text-zinc-400 dark:text-zinc-600'}>
                {t(`premium.pricing.features.${labelKey}`, { price: '$1.50' })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const ComparisonTable = () => {
  const t = useTranslations();

  const resolveFeatureValue = (value: boolean | string): boolean | string => {
    if (typeof value === 'boolean') return value;
    return t(`premium.pricing.features.${value}`, { price: '$1.50' });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-center">{t('premium.pricing.compare_plans')}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left py-3 pr-4 font-medium text-zinc-600 dark:text-zinc-400">
                {t('premium.pricing.feature_column')}
              </th>
              {TIER_KEYS.map((tierKey) => (
                <th key={tierKey} className="py-3 px-4 font-semibold text-center">
                  {t(`premium.pricing.tiers.${tierKey}.name`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((feature) => (
              <tr key={feature.labelKey} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                  {t(`premium.pricing.features.${feature.labelKey}`)}
                </td>
                {TIER_KEYS.map((tierKey) => (
                  <td key={tierKey} className="py-3 px-4 text-center">
                    <FeatureValue value={resolveFeatureValue(feature[tierKey])} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FeatureValue = ({ value }: { value: boolean | string }) => {
  if (value === true) return <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />;
  if (value === false) return <XMarkIcon className="w-5 h-5 text-zinc-300 dark:text-zinc-600 mx-auto" />;
  return <span className="text-sm text-zinc-700 dark:text-zinc-300">{value}</span>;
};
