import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import AssetCell from 'components/allowances/dashboard/cells/AssetCell';
import Button from 'components/common/Button';
import { Contract } from 'ethers';
import { DUMMY_ADDRESS } from 'lib/constants';
import { useHandleTransaction } from 'lib/hooks/ethereum/useHandleTransaction';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { AllowanceData, TransactionType } from 'lib/interfaces';
import { permit } from 'lib/utils/permit';
import useTranslation from 'next-translate/useTranslation';
import { useSigner } from 'wagmi';

interface Props {
  token: AllowanceData;
}

const PermitsEntry = ({ token }: Props) => {
  const { t } = useTranslation();
  const { data: signer } = useSigner();
  const { address, selectedChainId } = useAddressPageContext();
  const handleTransaction = useHandleTransaction();

  const onClick = async () => {
    const writeContract = new Contract(token.contract.address, token.contract.interface, signer);
    const transactionPromise = permit(signer, writeContract, DUMMY_ADDRESS, '0');
    await handleTransaction(transactionPromise, TransactionType.OTHER);
  };

  return (
    <div className="px-4 border-t first:border-none border-zinc-300 dark:border-zinc-500">
      <div className="flex items-center justify-between w-full">
        <AssetCell allowance={token} />
        <div className="flex justify-end">
          <ControlsWrapper chainId={selectedChainId} address={address} switchChainSize="sm">
            {(disabled) => (
              <div>
                <Button disabled={disabled} size="sm" style="secondary" onClick={onClick}>
                  {t('common:buttons.cancel_signatures')}
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
