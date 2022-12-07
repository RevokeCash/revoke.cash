import { AllowanceData } from 'lib/interfaces';
import ControlsSection from './ControlsSection';

interface Props {
  allowance: AllowanceData;
  onUpdate: (allowance: AllowanceData, newAmount?: string) => void;
}

const ControlsCell = ({ allowance, onUpdate }: Props) => {
  return (
    <div className="flex h-6 w-full justify-end">
      <ControlsSection allowance={allowance} onUpdate={onUpdate} />
    </div>
  );
};

export default ControlsCell;
