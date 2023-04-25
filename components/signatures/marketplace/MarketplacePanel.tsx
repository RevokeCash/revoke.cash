import { InformationCircleIcon } from '@heroicons/react/24/outline';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useMarketplaces } from 'lib/hooks/ethereum/useMarketplaces';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import DashboardPanel from '../DashboardPanel';
import MarketplaceEntry from './MarketplaceEntry';

const MarketplacePanel = () => {
  const { selectedChainId } = useAddressPageContext();
  const marketplaces = useMarketplaces(selectedChainId);

  if (marketplaces.length === 0) {
    return (
      <DashboardPanel title="Marketplace Signatures" className="w-full flex justify-center items-center h-12">
        <p className="text-center">No marketplaces found for this chain.</p>
      </DashboardPanel>
    );
  }

  const title = (
    <div className="flex items-center gap-2">
      <div>Marketplace Signatures</div>
      <WithHoverTooltip tooltip="Marketplace Signatures can be used to access all assets that are approved to the marketplace. You should only cancel these if you signed a Marketplace listing signature on a scam website.">
        <div>
          <InformationCircleIcon className="w-4 h-4" />
        </div>
      </WithHoverTooltip>
    </div>
  );

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
