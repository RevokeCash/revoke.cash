import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Button from 'components/common/Button';
import Logo from 'components/common/Logo';
import Select from 'components/common/Select';
import { useMarketplaces } from 'lib/hooks/ethereum/useMarketplaces';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { useMounted } from 'lib/hooks/useMounted';
import { Marketplace } from 'lib/interfaces';
import { useEffect, useState } from 'react';
import { useSigner } from 'wagmi';
import DashboardPanel from './DashboardPanel';

const NftMarketplacePanel = () => {
  const isMounted = useMounted();
  const { darkMode } = useColorTheme();

  const { address, selectedChainId } = useAddressPageContext();
  const { data: signer } = useSigner();

  const marketplaces = useMarketplaces(selectedChainId);
  const [marketplace, setMarketplace] = useState<Marketplace>();
  useEffect(() => setMarketplace(marketplaces[0]), [marketplaces]);

  const displayOption = (option: Marketplace) => {
    return (
      <div className="flex items-center gap-2 text-base leading-tight">
        <Logo src={option.logo} alt={option.name} size={24} />
        {option.name}
      </div>
    );
  };

  if (marketplaces.length === 0) {
    return (
      <DashboardPanel title="Marketplace Signatures" className="w-full flex justify-center items-center h-28">
        <p className="text-center">No marketplaces found for this chain.</p>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel title="Marketplace Signatures">
      <div className="flex flex-col gap-2 py-2">
        <Select
          instanceId="permit-select"
          classNamePrefix="permit-select"
          className="shrink-0"
          controlTheme={darkMode ? 'dark' : 'light'}
          menuTheme={darkMode ? 'dark' : 'light'}
          options={marketplaces}
          onChange={(option) => setMarketplace(option)}
          formatOptionLabel={displayOption}
          menuPlacement="bottom"
          isSearchable={false}
          placeholder="Select a marketplace"
          isMulti={false}
          menuAlign="right"
          value={marketplace}
        />

        <ControlsWrapper chainId={selectedChainId} address={address} switchChainSize="md">
          {(disabled) => (
            <div className="w-full flex">
              <Button
                disabled={isMounted && disabled}
                size="md"
                style="secondary"
                onClick={() => marketplace?.cancelSignatures(signer)}
                className="w-full"
              >
                Cancel Marketplace Signatures
              </Button>
            </div>
          )}
        </ControlsWrapper>
      </div>
    </DashboardPanel>
  );
};

export default NftMarketplacePanel;
