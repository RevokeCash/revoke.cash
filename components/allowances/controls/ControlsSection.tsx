import RevokeButton from 'components/allowances/controls/RevokeButton';
import type { TransactionSubmitted } from 'lib/interfaces';
import { type TokenAllowanceData, getAllowanceI18nValues, getAllowanceKey } from 'lib/utils/allowances';
import { isRevertedError } from 'lib/utils/errors';
import { useTranslations } from 'next-intl';
import ControlsWrapper from './ControlsWrapper';
import UpdateControls from './UpdateControls';

interface Props {
  allowance: TokenAllowanceData;
  update?: (newAmount: string) => Promise<TransactionSubmitted | undefined>;
  reset?: () => void;
  revoke?: () => Promise<TransactionSubmitted | undefined>;
}

const ControlsSection = ({ allowance, revoke, update, reset }: Props) => {
  const t = useTranslations();

  if (!allowance.payload) return null;

  const { amount } = getAllowanceI18nValues(allowance);

  const tooltip = isRevertedError(allowance.payload?.revokeError)
    ? t('common.toasts.revoke_failed_revert', { message: allowance.payload?.revokeError })
    : allowance.payload?.revokeError;

  return (
    <ControlsWrapper
      chainId={allowance.chainId}
      address={allowance.owner}
      switchChainSize="sm"
      overrideDisabled={Boolean(tooltip)}
      disabledReason={tooltip}
    >
      {(disabled) => (
        <div className="controls-section">
          {revoke && <RevokeButton transactionKey={getAllowanceKey(allowance)} revoke={revoke} disabled={disabled} />}
          {update && reset && (
            <UpdateControls
              update={update}
              disabled={disabled}
              reset={reset}
              defaultValue={amount === 'Unlimited' ? '0' : (amount?.replace(/,/, '') ?? '0')}
            />
          )}
        </div>
      )}
    </ControlsWrapper>
  );
};

export default ControlsSection;
