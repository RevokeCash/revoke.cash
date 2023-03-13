import { useRevoke } from 'lib/hooks/ethereum/useRevoke';
import { AllowanceData } from 'lib/interfaces';
import ControlsSection from '../../controls/ControlsSection';

interface Props {
  allowance: AllowanceData;
  onUpdate: (allowance: AllowanceData, newAmount?: string) => void;
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
