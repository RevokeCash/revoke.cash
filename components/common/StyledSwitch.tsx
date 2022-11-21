import { Switch } from '@headlessui/react';
import { classNames } from 'lib/utils/classNames';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const StyledSwitch = ({ checked, onChange }: Props) => {
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      className={classNames(
        'bg-black relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none '
      )}
    >
      <span
        aria-hidden="true"
        className={classNames(
          checked ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
        )}
      />
    </Switch>
  );
};

export default StyledSwitch;
