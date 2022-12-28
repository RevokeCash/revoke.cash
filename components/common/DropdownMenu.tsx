import { Menu } from '@headlessui/react';
import Button from './Button';
import Chevron from './Chevron';

interface Props {
  menuButton: React.ReactNode;
  children: React.ReactNode;
}

const DropdownMenu = ({ menuButton, children }: Props) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black rounded-lg">
          {/* For some reason the padding looks off when it's the same on left and right, so I made them different */}
          <Button style="secondary" size="md" className="flex pl-3 pr-2 font-normal" asDiv>
            {menuButton}
            <Chevron className="w-5 h-5" />
          </Button>
        </Menu.Button>
      </div>
      <Menu.Items className="origin-top-right absolute right-0 mt-2 rounded-lg shadow-lg bg-white border border-black overflow-hidden z-10 flex flex-col focus:outline-none">
        {children}
      </Menu.Items>
    </Menu>
  );
};

export default DropdownMenu;
