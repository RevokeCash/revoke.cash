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

  return (
    <DashboardPanel title="Marketplace Signatures" className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <div className="w-full">
        {marketplaces.map((marketplace) => (
          <MarketplaceEntry key={marketplace.name} marketplace={marketplace} />
        ))}
      </div>
    </DashboardPanel>
  );
};

export default MarketplacePanel;
