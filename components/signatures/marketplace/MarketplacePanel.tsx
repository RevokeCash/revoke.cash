import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Card from 'components/common/Card';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useMarketplaces } from 'lib/hooks/ethereum/useMarketplaces';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import useTranslation from 'next-translate/useTranslation';
import MarketplaceEntry from './MarketplaceEntry';

const MarketplacePanel = () => {
  const { t } = useTranslation();
  const { selectedChainId } = useAddressPageContext();
  const marketplaces = useMarketplaces(selectedChainId);

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address:signatures.marketplaces.title')}</div>
      <WithHoverTooltip tooltip={t('address:tooltips.marketplace_signatures')}>
        <div>
          <InformationCircleIcon className="w-4 h-4" />
        </div>
      </WithHoverTooltip>
    </div>
  );

  if (marketplaces.length === 0) {
    return (
      <Card title={title} className="w-full flex justify-center items-center h-12">
        <p className="text-center">{t('address:signatures.marketplaces.none_found')}</p>
      </Card>
    );
  }

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <div className="w-full">
        {marketplaces.map((marketplace) => (
          <MarketplaceEntry key={marketplace.name} marketplace={marketplace} />
        ))}
      </div>
    </Card>
  );
};

export default MarketplacePanel;
