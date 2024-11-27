import { useRevoke } from 'lib/hooks/ethereum/useRevoke';
import type { AllowanceData, OnUpdate } from 'lib/interfaces';
import ControlsSection from '../../controls/ControlsSection';

interface Props {
  allowance: AllowanceData;
  onUpdate: OnUpdate;
}

const ControlsCell = ({ allowance, onUpdate }: Props) => {
  const { revoke } = useRevoke(allowance, onUpdate);

  return (
    <div className="flex justify-end w-28 mr-0 mx-auto">
      <ControlsSection allowance={allowance} revoke={revoke} />
    </div>
  );
};

export default ControlsCell;
