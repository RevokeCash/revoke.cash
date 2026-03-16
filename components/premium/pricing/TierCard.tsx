import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import Label from 'components/common/Label';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { FEATURES, type TierKey } from './pricing-data';

interface Props {
  tierKey: TierKey;
  price: string;
  href: string;
  highlighted?: boolean;
}

const TierCard = ({ tierKey, price, href, highlighted }: Props) => {
  const t = useTranslations();

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
          {t('premium.pricing.best_value')}
        </Label>
      )}

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t(`premium.pricing.tiers.${tierKey}.name`)}</h2>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{price}</span>
          {tierKey !== 'free' && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('premium.pricing.per_year')}</span>
          )}
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {t(`premium.pricing.tiers.${tierKey}.description`)}
        </p>
      </div>

      <Button
        href={href}
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

export default TierCard;
