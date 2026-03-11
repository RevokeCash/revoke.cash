import Button from 'components/common/Button';
import Loader from 'components/common/Loader';
import { useWalletCapabilities } from 'lib/hooks/ethereum/useWalletCapabilities';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useTranslations } from 'next-intl';
import ControlsWrapper from '../ControlsWrapper';
import FeeNotice from './FeeNotice';

interface Props {
  feeDollarAmount: string;
  isRevoking: boolean;
  isAllConfirmed: boolean;
  setOpen: (open: boolean) => void;
  revoke: () => Promise<void>;
}

const BatchRevokeControls = ({ feeDollarAmount, isRevoking, isAllConfirmed, setOpen, revoke }: Props) => {
  const t = useTranslations();
  const { address, selectedChainId } = useAddressPageContext();
  const walletCapabilities = useWalletCapabilities(selectedChainId);

  const getButtonText = () => {
    if (isRevoking) return t('common.buttons.revoking');
    if (isAllConfirmed) return t('common.buttons.close');
    return t('common.buttons.revoke');
  };

  const getButtonAction = () => {
    if (isAllConfirmed) return () => setOpen(false);
    return revoke;
  };

  return (
    <Loader isLoading={walletCapabilities.isLoading}>
      <div className="flex flex-col items-center justify-center gap-8">
        <FeeNotice chainId={selectedChainId} feeDollarAmount={feeDollarAmount} />
        <ControlsWrapper chainId={selectedChainId} address={address} switchChainSize="md">
          {(disabled) => (
            <div>
              <Button
                style="primary"
                size="md"
                className="px-16"
                onClick={getButtonAction()}
                loading={isRevoking}
                disabled={disabled}
              >
                {getButtonText()}
              </Button>
            </div>
          )}
        </ControlsWrapper>
      </div>
    </Loader>
  );
};

export default BatchRevokeControls;
