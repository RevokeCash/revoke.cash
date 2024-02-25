import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Logo from 'components/common/Logo';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { Marketplace } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  marketplace: Marketplace;
}

const MarketplaceCell = ({ marketplace }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 py-1 w-40 lg:w-56">
      <div className="flex flex-col items-start gap-0.5">
        <div className="flex items-center gap-2 ">
          <Logo src={marketplace.logo} alt={marketplace.name} size={24} border />
          <div>{marketplace.name}</div>
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[10rem] lg:max-w-[14rem] truncate">
          {t('address:signatures.marketplaces.active_approvals', { count: marketplace.allowances.length })}
        </div>
      </div>
      <WithHoverTooltip tooltip={t('address:tooltips.marketplace_listings', { marketplace: marketplace.name })}>
        <div>
          <InformationCircleIcon className="w-4 h-h-4" />
        </div>
      </WithHoverTooltip>
    </div>
  );
};

export default MarketplaceCell;
