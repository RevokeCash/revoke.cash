import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD } from '@revoke.cash/core/auto-revoke/config';
import Button from 'components/common/Button';
import InformationIconTooltip from 'components/common/InformationIconTooltip';
import Label from 'components/common/Label';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { FEATURES, type PricingFeature, type TierKey } from './pricing-data';

interface Props {
  tierKey: TierKey;
  price: string;
  href: string;
  className?: string;
  badgeLabel?: string;
  badgeClassName?: string;
  buttonStyle?: 'primary' | 'secondary' | 'tertiary' | 'none';
  referencesTier?: TierKey;
}

const TierCard = ({
  tierKey,
  price,
  href,
  className,
  badgeLabel,
  badgeClassName,
  buttonStyle = 'secondary',
  referencesTier,
}: Props) => {
  const t = useTranslations();

  return (
    <div
      className={twMerge(
        'relative flex flex-col gap-6 rounded-xl border p-6 border-zinc-200 dark:border-zinc-700',
        className,
      )}
    >
      {badgeLabel && (
        <Label className={twMerge('absolute -top-3 left-1/2 -translate-x-1/2', badgeClassName)}>{badgeLabel}</Label>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold font-heading">{t(`premium.pricing.tiers.${tierKey}.name`)}</h2>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-3xl font-bold">{price}</span>
            {tierKey !== 'free' && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {t('premium.pricing.per_year')}
                {t.has(`premium.pricing.tiers.${tierKey}.price_note`) && (
                  <> &middot; {t(`premium.pricing.tiers.${tierKey}.price_note`)}</>
                )}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t(`premium.pricing.tiers.${tierKey}.description`)}</p>
      </div>

      <Button href={href} router style={buttonStyle} size="md" className="w-full justify-center">
        {t(`premium.pricing.tiers.${tierKey}.cta`)}
      </Button>

      <FeatureList tierKey={tierKey} referencesTier={referencesTier} />
    </div>
  );
};

export default TierCard;

interface FeatureListProps {
  tierKey: TierKey;
  referencesTier?: TierKey;
}

const FeatureList = ({ tierKey, referencesTier }: FeatureListProps) => {
  const t = useTranslations();

  if (!referencesTier) {
    const includedFeatures = FEATURES.filter((feature) => feature[tierKey] !== false && !feature.comparisonOnly);
    return (
      <ul className="flex flex-col gap-2.5">
        {includedFeatures.map((feature) => (
          <FeatureItem key={feature.labelKey} feature={feature} tierKey={tierKey} included />
        ))}
      </ul>
    );
  }

  const uniqueFeatures = FEATURES.filter(
    (feature) =>
      !feature.comparisonOnly &&
      feature[tierKey] !== false &&
      (feature[referencesTier] === false || feature.upgradedIn?.includes(tierKey)),
  );

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2.5">
        <li className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {t('premium.pricing.includes_tier', { tierName: t(`premium.pricing.tiers.${referencesTier}.name`) })}
        </li>
        {uniqueFeatures.map((feature) => (
          <FeatureItem key={feature.labelKey} feature={feature} tierKey={tierKey} included />
        ))}
      </ul>

      {t.has(`premium.pricing.tiers.${tierKey}.savings`) && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          {t(`premium.pricing.tiers.${tierKey}.savings`, { price: '$1.66' })}
        </p>
      )}
    </div>
  );
};

interface FeatureItemProps {
  feature: PricingFeature;
  tierKey: TierKey;
  included: boolean;
}

const FeatureItem = ({ feature, tierKey, included }: FeatureItemProps) => {
  const t = useTranslations();
  const labelKey = feature.cardLabelKey?.[tierKey] ?? feature.labelKey;

  return (
    <li className="flex items-center gap-2 text-sm">
      {included ? (
        <CheckIcon className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
      ) : (
        <XMarkIcon className="w-4 h-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
      )}
      <span className={twMerge('flex items-center gap-1', !included && 'text-zinc-400 dark:text-zinc-600')}>
        {t(`premium.pricing.features.${labelKey}`, {
          price: '$1.50',
          budget: `$${AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD}`,
        })}
        {feature.tooltipKey && <InformationIconTooltip tooltip={t(`premium.pricing.tooltips.${feature.tooltipKey}`)} />}
      </span>
    </li>
  );
};
