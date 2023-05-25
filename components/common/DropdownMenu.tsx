import { Menu } from '@headlessui/react';
import { twMerge } from 'tailwind-merge';
import Button from './Button';
import Chevron from './Chevron';

interface Props {
  menuButton: React.ReactNode;
  children: React.ReactNode;
  style?: 'button' | 'nav';
}

const DropdownMenu = ({ menuButton, children, style }: Props) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black rounded-lg">
          <Button
            style={style === 'nav' ? 'none' : 'secondary'}
            size={style === 'nav' ? 'none' : 'md'}
            className={twMerge('flex items-center', style === 'nav' ? 'font-medium text-lg' : 'pl-3 pr-2 font-normal')}
            asDiv
          >
            {menuButton}
            <Chevron className="w-5 h-5 fill-black dark:fill-white" />
          </Button>
        </Menu.Button>
      </div>
      <Menu.Items className="origin-top-right absolute right-0 mt-2 rounded-lg shadow-lg bg-white border border-black dark:border-white overflow-hidden z-10 flex flex-col focus:outline-none shrink-0">
        {children}
      </Menu.Items>
    </Menu>
  );
};

export default DropdownMenu;
