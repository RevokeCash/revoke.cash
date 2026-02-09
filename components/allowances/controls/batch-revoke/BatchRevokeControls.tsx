import Button from 'components/common/Button';
import Loader from 'components/common/Loader';
import { useWalletCapabilities } from 'lib/hooks/ethereum/useWalletCapabilities';
import { useAddress } from 'lib/hooks/page-context/useAddress';
import { useTranslations } from 'next-intl';
import ControlsWrapper from '../ControlsWrapper';
import FeeNotice from './FeeNotice';

interface Props {
  chainId: number;
  feeDollarAmount: string;
  isRevoking: boolean;
  isAllConfirmed: boolean;
  setOpen: (open: boolean) => void;
  revoke: () => Promise<void>;
}

const BatchRevokeControls = ({ chainId, feeDollarAmount, isRevoking, isAllConfirmed, setOpen, revoke }: Props) => {
  const t = useTranslations();
  const { address } = useAddress();
  const walletCapabilities = useWalletCapabilities(chainId);

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
        <FeeNotice chainId={chainId} feeDollarAmount={feeDollarAmount} />
        <ControlsWrapper chainId={chainId} address={address} switchChainSize="md">
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
