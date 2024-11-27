import RevokeButton from 'components/allowances/controls/RevokeButton';
import { TransactionSubmitted } from 'lib/interfaces';
import { getAllowanceI18nValues, TokenAllowanceData } from 'lib/utils/allowances';
import ControlsWrapper from './ControlsWrapper';
import UpdateControls from './UpdateControls';

interface Props {
  allowance: TokenAllowanceData;
  update?: (newAmount: string) => Promise<TransactionSubmitted | undefined>;
  reset?: () => void;
  revoke?: () => Promise<TransactionSubmitted | undefined>;
}

const ControlsSection = ({ allowance, revoke, update, reset }: Props) => {
  if (!allowance.payload) return null;

  const { amount } = getAllowanceI18nValues(allowance);

  return (
    <ControlsWrapper chainId={allowance.chainId} address={allowance.owner} switchChainSize="sm">
      {(disabled) => (
        <div className="controls-section">
          {revoke && <RevokeButton allowance={allowance} revoke={revoke} disabled={disabled} />}
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
