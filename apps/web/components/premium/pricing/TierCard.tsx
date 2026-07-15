import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD } from '@revoke.cash/core/auto-revoke/config';
import { isNullish } from '@revoke.cash/core/utils';
import Button from 'components/common/Button';
import Href from 'components/common/Href';
import InformationIconTooltip from 'components/common/InformationIconTooltip';
import Label from 'components/common/Label';
import StatusLabel from 'components/common/StatusLabel';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { FEATURES, type PricingFeature, type TierKey } from './pricing-data';

interface Props {
  tierKey: TierKey;
  price: string;
  perWalletPerMonthPrice?: string;
  walletSlots?: number;
  href: string;
  className?: string;
  badgeLabel?: string;
  badgeClassName?: string;
  buttonStyle?: 'primary' | 'secondary' | 'tertiary' | 'none';
  referencesTier?: TierKey;
  link?: { href: string; label: string };
}

const TierCard = ({
  tierKey,
  price,
  perWalletPerMonthPrice,
  walletSlots,
  href,
  className,
  badgeLabel,
  badgeClassName,
  buttonStyle = 'secondary',
  referencesTier,
  link,
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
                {!isNullish(walletSlots) && t.has(`premium.pricing.tiers.${tierKey}.price_note`) && (
                  <> • {t(`premium.pricing.tiers.${tierKey}.price_note`, { count: walletSlots })}</>
                )}
              </span>
            )}
          </div>
          {t.has(`premium.pricing.tiers.${tierKey}.savings`) && (
            <StatusLabel status="success" className={twMerge('mt-1 w-fit', tierKey === 'free' && 'invisible')}>
              {t(`premium.pricing.tiers.${tierKey}.savings`, { price: perWalletPerMonthPrice ?? '' })}
            </StatusLabel>
          )}
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t(`premium.pricing.tiers.${tierKey}.description`)}</p>
      </div>

      <Button href={href} router style={buttonStyle} size="md" className="w-full justify-center">
        {t(`premium.pricing.tiers.${tierKey}.cta`)}
      </Button>

      <FeatureList tierKey={tierKey} referencesTier={referencesTier} />

      {link && (
        <Href href={link.href} router underline="always" className="mt-auto w-fit text-sm font-medium">
          {link.label} →
        </Href>
      )}
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
    <ul className="flex flex-col gap-2.5">
      <li className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        {t('premium.pricing.includes_tier', { tierName: t(`premium.pricing.tiers.${referencesTier}.name`) })}
      </li>
      {uniqueFeatures.map((feature) => (
        <FeatureItem key={feature.labelKey} feature={feature} tierKey={tierKey} included />
      ))}
    </ul>
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
