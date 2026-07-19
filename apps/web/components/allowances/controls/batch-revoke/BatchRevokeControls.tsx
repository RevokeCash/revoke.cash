import Button from 'components/common/Button';
import Loader from 'components/common/Loader';
import type { BatchRevokeProgress } from 'lib/hooks/ethereum/useRevokeBatchQueuedTransactions';
import { useWalletCapabilities } from 'lib/hooks/ethereum/useWalletCapabilities';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import ControlsWrapper from '../ControlsWrapper';
import Eip5792Notice from './Eip5792Notice';
import FeeNotice from './FeeNotice';
import { isZeroFeeDollarAmount } from './fee';
import PremiumUpgradePrompt from './PremiumUpgradePrompt';

interface Props {
  chainId: number;
  allowanceCount: number;
  feeDollarAmount: string;
  isRevoking: boolean;
  isAllConfirmed: boolean;
  setOpen: (open: boolean) => void;
  revoke: () => Promise<void>;
  progress: BatchRevokeProgress | null;
}

const BatchRevokeControls = ({
  chainId,
  allowanceCount,
  feeDollarAmount,
  isRevoking,
  isAllConfirmed,
  setOpen,
  revoke,
  progress,
}: Props) => {
  const t = useTranslations();
  const { address } = useAddress();
  const walletCapabilities = useWalletCapabilities(chainId);

  const getButtonText = () => {
    if (isRevoking) {
      if (progress?.isPayingFee) return t('common.buttons.paying_fee');
      if (progress && progress.total > 1) {
        return t('common.buttons.revoking_progress', { current: progress.current, total: progress.total });
      }
      return t('common.buttons.revoking');
    }
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
        <div
          className={twMerge(
            'flex flex-col items-center justify-center gap-2 transition-opacity',
            isRevoking && 'opacity-50',
          )}
        >
          <FeeNotice chainId={chainId} feeDollarAmount={feeDollarAmount} />
          <Eip5792Notice chainId={chainId} allowanceCount={allowanceCount} />
          {!isZeroFeeDollarAmount(feeDollarAmount) && <PremiumUpgradePrompt />}
        </div>
        <ControlsWrapper address={address}>
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
