import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import AssetCell from 'components/allowances/dashboard/cells/AssetCell';
import Button from 'components/common/Button';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { AllowanceData } from 'lib/interfaces';

interface Props {
  token: AllowanceData;
}

const PermitsEntry = ({ token }: Props) => {
  const { address, selectedChainId } = useAddressPageContext();

  const onClick = () => null;

  return (
    <div className="px-4 border-t first:border-none border-zinc-300 dark:border-zinc-500">
      <div className="flex items-center justify-between w-full">
        <AssetCell allowance={token} />
        <div className="flex justify-end">
          <ControlsWrapper chainId={selectedChainId} address={address} switchChainSize="sm">
            {(disabled) => (
              <div>
                <Button disabled={disabled} size="sm" style="secondary" onClick={onClick}>
                  Cancel Signatures
                </Button>
              </div>
            )}
          </ControlsWrapper>
        </div>
      </div>
    </div>
  );
};

export default PermitsEntry;
