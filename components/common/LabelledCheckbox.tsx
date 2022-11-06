import { track } from '@amplitude/analytics-browser';
import type { ChangeEvent } from 'react';

interface Props {
  label: string;
  checked: boolean;
  update: (checked: boolean) => void;
}

const LabelledCheckbox = ({ label, checked, update }: Props) => {
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    track('Toggled checkbox', { label, checked: event.target.checked });
    update(event.target.checked);
  };

  return (
    <div>
      <span style={{ marginRight: 5 }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </div>
  );
};

export default LabelledCheckbox;
