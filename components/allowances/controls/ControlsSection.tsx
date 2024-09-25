import RevokeButton from 'components/allowances/controls/RevokeButton';
import { AllowanceData, TransactionSubmitted } from 'lib/interfaces';
import { getAllowanceI18nValues } from 'lib/utils/allowances';
import ControlsWrapper from './ControlsWrapper';
import UpdateControls from './UpdateControls';

interface Props {
  allowance: AllowanceData;
  update?: (newAmount?: string) => Promise<TransactionSubmitted>;
  reset?: () => void;
  revoke?: () => Promise<TransactionSubmitted>;
}

const ControlsSection = ({ allowance, revoke, update, reset }: Props) => {
  if (!allowance.spender) return null;

  const { amount } = getAllowanceI18nValues(allowance);

  return (
    <ControlsWrapper chainId={allowance.chainId} address={allowance.owner} switchChainSize="sm">
      {(disabled) => (
        <div className="controls-section">
          {revoke && <RevokeButton revoke={revoke} disabled={disabled} />}
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
