import Button from 'components/common/Button';
import TipSection from 'components/common/donate/TipSection';
import { useDonate } from 'lib/hooks/ethereum/useDonate';
import { useNativeTokenPrice } from 'lib/hooks/ethereum/useNativeTokenPrice';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { isNullish } from 'lib/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import ControlsWrapper from '../ControlsWrapper';

interface Props {
  isRevoking: boolean;
  isAllConfirmed: boolean;
  setOpen: (open: boolean) => void;
  revoke: (tipDollarAmount: string) => Promise<void>;
}

const BatchRevokeControls = ({ isRevoking, isAllConfirmed, setOpen, revoke }: Props) => {
  const t = useTranslations();
  const { address, selectedChainId } = useAddressPageContext();
  const { nativeToken } = useDonate(selectedChainId, 'batch-revoke-tip');
  const { nativeTokenPrice } = useNativeTokenPrice(selectedChainId);

  const [tipAmount, setTipAmount] = useState<string | null>(null);

  const getButtonText = () => {
    if (isRevoking) return t('common.buttons.revoking');
    if (isAllConfirmed) return t('common.buttons.close');
    return t('common.buttons.revoke');
  };

  const getButtonAction = () => {
    if (isAllConfirmed) return () => setOpen(false);
    return async () => {
      if (!tipAmount && !isNullish(nativeTokenPrice)) throw new Error('Tip amount is required');
      await revoke(tipAmount ?? '0');
    };
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <TipSection chainId={selectedChainId} nativeToken={nativeToken} onSelect={setTipAmount} />
      <ControlsWrapper
        chainId={selectedChainId}
        address={address}
        overrideDisabled={!tipAmount && !isNullish(nativeTokenPrice)}
        disabledReason={t('address.tooltips.select_tip')}
      >
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
  );
};

export default BatchRevokeControls;
