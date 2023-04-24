import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Button from 'components/common/Button';
import ChainOverlayLogo from 'components/common/ChainOverlayLogo';
import Select from 'components/common/Select';
import Spinner from 'components/common/Spinner';
import { useAddressAllowances, useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { AllowanceData } from 'lib/interfaces';
import { deduplicateArray } from 'lib/utils';
import { hasZeroBalance } from 'lib/utils/tokens';
import { useEffect, useMemo, useState } from 'react';
import DashboardPanel from './DashboardPanel';

const PermitsPanel = () => {
  const [token, setToken] = useState<AllowanceData>();

  const { darkMode } = useColorTheme();
  const { allowances, isLoading } = useAddressAllowances();
  const { address, selectedChainId } = useAddressPageContext();

  const permitTokens = useMemo(() => {
    const filtered = (allowances ?? []).filter((allowance) => allowance.supportsPermit && !hasZeroBalance(allowance));
    return deduplicateArray(filtered, (a, b) => a.contract.address === b.contract.address);
  }, [allowances]);

  // Reset selected token when permitTokens change
  useEffect(() => setToken(permitTokens[0]), [permitTokens]);

  const displayOption = (allowance: AllowanceData) => {
    return (
      <div className="flex items-center gap-2 text-base leading-tight">
        <ChainOverlayLogo src={allowance.icon} alt={allowance.symbol} chainId={undefined} size={24} overlaySize={16} />
        {allowance.symbol}
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardPanel title="Permit Signatures" className="w-full flex justify-center items-center h-28">
        <Spinner className="w-8 h-8" />
      </DashboardPanel>
    );
  }

  if (permitTokens.length === 0) {
    return (
      <DashboardPanel title="Permit Signatures" className="w-full flex justify-center items-center h-28">
        <p className="text-center">No ERC20 tokens with permit support found.</p>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel title="Permit Signatures" className="w-full flex flex-col justify-center h-28">
      <div className="flex flex-col gap-2 py-2">
        <Select
          instanceId="permit-select"
          classNamePrefix="permit-select"
          className="shrink-0"
          controlTheme={darkMode ? 'dark' : 'light'}
          menuTheme={darkMode ? 'dark' : 'light'}
          options={permitTokens}
          onChange={(option) => setToken(option)}
          formatOptionLabel={displayOption}
          menuPlacement="bottom"
          isSearchable={false}
          placeholder="Select a token"
          isMulti={false}
          menuAlign="right"
          value={token}
        />
        <ControlsWrapper chainId={selectedChainId} address={address} switchChainSize="md">
          {(disabled) => (
            <div className="w-full flex">
              <Button disabled={disabled} size="md" style="secondary" className="w-full">
                Cancel Permit Signatures
              </Button>
            </div>
          )}
        </ControlsWrapper>
      </div>
    </DashboardPanel>
  );
};

export default PermitsPanel;
