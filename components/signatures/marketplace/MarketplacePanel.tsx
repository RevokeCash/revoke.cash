import { InformationCircleIcon } from '@heroicons/react/24/outline';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useMarketplaces } from 'lib/hooks/ethereum/useMarketplaces';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import DashboardPanel from '../DashboardPanel';
import MarketplaceEntry from './MarketplaceEntry';

const MarketplacePanel = () => {
  const { selectedChainId } = useAddressPageContext();
  const marketplaces = useMarketplaces(selectedChainId);

  const title = (
    <div className="flex items-center gap-2">
      <div>Marketplace Signatures</div>
      <WithHoverTooltip tooltip="Once approved, marketplaces are able to move assets on your behalf. Bad actors exploit these approvals to create zero-priced listings on third party websites. Cancel these if you signed a marketplace signature on a phishing website.">
        <div>
          <InformationCircleIcon className="w-4 h-4" />
        </div>
      </WithHoverTooltip>
    </div>
  );

  if (marketplaces.length === 0) {
    return (
      <DashboardPanel title={title} className="w-full flex justify-center items-center h-12">
        <p className="text-center">No marketplaces found for this chain.</p>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <div className="w-full">
        {marketplaces.map((marketplace) => (
          <MarketplaceEntry key={marketplace.name} marketplace={marketplace} />
        ))}
      </div>
    </DashboardPanel>
  );
};

export default MarketplacePanel;
