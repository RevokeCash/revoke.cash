import Button from 'components/common/Button';
import TipSection from 'components/common/donate/TipSection';
import { useDonate } from 'lib/hooks/ethereum/useDonate';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import type { TokenAllowanceData } from 'lib/utils/allowances';
import { track } from 'lib/utils/analytics';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import ControlsWrapper from '../ControlsWrapper';

interface Props {
  selectedAllowances: TokenAllowanceData[];
  isRevoking: boolean;
  isAllConfirmed: boolean;
  setOpen: (open: boolean) => void;
  revoke: (tipAmount: string) => Promise<void>;
}

const BatchRevokeControls = ({ selectedAllowances, isRevoking, isAllConfirmed, setOpen, revoke }: Props) => {
  const t = useTranslations();
  const { address, selectedChainId } = useAddressPageContext();
  const { defaultAmount, nativeToken } = useDonate(selectedChainId, 'batch-revoke-tip');

  const [tipAmount, setTipAmount] = useState<string | null>(null);

  const getButtonText = () => {
    if (isRevoking) return t('common.buttons.revoking');
    if (isAllConfirmed) return t('common.buttons.close');
    return t('common.buttons.revoke');
  };

  const getButtonAction = () => {
    if (isAllConfirmed) return () => setOpen(false);
    return async () => {
      if (!tipAmount) throw new Error('Tip amount is required');

      const getTipSelection = () => {
        if (tipAmount === '0') return 'none';
        if (Number(tipAmount) < Number(defaultAmount)) return 'low';
        if (Number(tipAmount) > Number(defaultAmount)) return 'high';
        return 'mid';
      };

      track('Batch Revoked', {
        chainId: selectedChainId,
        address,
        allowances: selectedAllowances.length,
        amount: tipAmount,
        tipSelection: getTipSelection(),
      });

      await revoke(tipAmount);
    };
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <TipSection midAmount={defaultAmount} nativeToken={nativeToken} onSelect={setTipAmount} />
      <ControlsWrapper
        chainId={selectedChainId}
        address={address}
        overrideDisabled={!tipAmount}
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
