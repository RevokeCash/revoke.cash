import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import InformationIconTooltip from 'components/common/InformationIconTooltip';
import { useTranslations } from 'next-intl';
import { FEATURES, TIER_KEYS } from './pricing-data';

const ComparisonTable = () => {
  const t = useTranslations();

  const resolveFeatureValue = (value: boolean | string): boolean | string => {
    if (typeof value === 'boolean') return value;
    return t(`premium.pricing.features.${value}`, { price: '$1.50' });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-center">{t('premium.pricing.compare_plans')}</h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-lg text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900">
              <th className="text-left py-3 pl-5 pr-4 font-medium text-zinc-500 dark:text-zinc-400">
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
            {FEATURES.map((feature, index) => (
              <tr key={feature.labelKey} className={index % 2 === 0 ? '' : 'bg-zinc-50/50 dark:bg-zinc-900/50'}>
                <td className="py-3 pl-5 pr-4 text-zinc-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1">
                    {t(`premium.pricing.features.${feature.labelKey}`)}
                    {feature.tooltipKey && (
                      <InformationIconTooltip tooltip={t(`premium.pricing.tooltips.${feature.tooltipKey}`)} />
                    )}
                  </span>
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

export default ComparisonTable;

const FeatureValue = ({ value }: { value: boolean | string }) => {
  if (value === true) return <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />;
  if (value === false) return <XMarkIcon className="w-5 h-5 text-zinc-300 dark:text-zinc-600 mx-auto" />;
  return <span className="text-sm text-zinc-700 dark:text-zinc-300">{value}</span>;
};
