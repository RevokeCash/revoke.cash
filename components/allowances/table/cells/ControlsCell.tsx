import { useRevoke } from 'lib/hooks/useRevoke';
import { AllowanceData } from 'lib/interfaces';
import ControlsSection from '../../controls/ControlsSection';

interface Props {
  allowance: AllowanceData;
  onUpdate: (allowance: AllowanceData, newAmount?: string) => void;
}

const ControlsCell = ({ allowance, onUpdate }: Props) => {
  const { revoke } = useRevoke(allowance, onUpdate);

  return (
    <div className="flex h-6 w-full justify-end">
      <ControlsSection allowance={allowance} revoke={revoke} />
    </div>
  );
};

export default ControlsCell;
