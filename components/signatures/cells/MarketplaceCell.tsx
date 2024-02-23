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
    <div className="flex items-center gap-2 py-2 w-40 lg:w-56 h-[50px]">
      <Logo src={marketplace.logo} alt={marketplace.name} size={24} border />
      <div>{marketplace.name}</div>
      <WithHoverTooltip tooltip={t('address:tooltips.marketplace_listings', { marketplace: marketplace.name })}>
        <div>
          <InformationCircleIcon className="w-4 h-h-4" />
        </div>
      </WithHoverTooltip>
    </div>
  );
};

export default MarketplaceCell;
