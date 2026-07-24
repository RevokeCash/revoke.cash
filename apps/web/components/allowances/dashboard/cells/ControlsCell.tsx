import type { OnUpdate, TokenAllowanceData } from '@revoke.cash/core/allowances';
import { isNullish } from '@revoke.cash/core/utils';
import { useRevoke } from 'lib/hooks/ethereum/useRevoke';
import ControlsSection from '../../controls/ControlsSection';

interface Props {
  allowance: TokenAllowanceData;
  onUpdate: OnUpdate;
  timeMachineTimestamp?: number;
}

const ControlsCell = ({ allowance, onUpdate, timeMachineTimestamp }: Props) => {
  const { revoke } = useRevoke(allowance, onUpdate);

  if (!isNullish(timeMachineTimestamp)) {
    return <div className="w-26 mr-0 mx-auto" />;
  }

  return (
    <div className="flex justify-end w-26 mr-0 mx-auto">
      <ControlsSection allowance={allowance} revoke={revoke} />
    </div>
  );
};

export default ControlsCell;
