import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface Props {
  menuButton: React.ReactNode;
  children: React.ReactNode;
}

const DropdownMenu = ({ menuButton, children }: Props) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button>{menuButton}</Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 rounded-lg shadow-lg bg-white border border-black overflow-hidden z-10 flex flex-col">
          {children}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default DropdownMenu;
