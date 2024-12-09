import { Menu } from '@headlessui/react';
import { twMerge } from 'tailwind-merge';
import Button, { type Props as ButtonProps } from './Button';
import Chevron from './Chevron';

interface Props {
  menuButton: React.ReactNode;
  children: React.ReactNode;
  buttonClassName?: string;
  itemsClassName?: string;
  style?: 'button' | 'nav';
  align?: 'left' | 'right';
}

const DropdownMenu = ({ menuButton, children, style, align, buttonClassName, itemsClassName }: Props) => {
  const classes = {
    items: twMerge(
      align === 'left' ? 'origin-top-left left-0' : 'origin-top-right right-0',
      'absolute rounded-lg shadow-lg bg-white border border-black dark:border-white flex flex-col shrink-0',
      'z-10 mt-2 max-h-88 overflow-x-hidden overflow-y-scroll focus:outline-none',
      itemsClassName,
    ),
    button: twMerge(
      'flex items-center',
      style === 'nav' ? 'font-medium text-lg' : 'pl-3 pr-2 font-normal',
      buttonClassName,
    ),
  };
  return (
    <Menu as="div" className="relative text-left">
      <Menu.Button
        className={twMerge(
          'flex focus-visible:outline-none focus-visible:ring-black focus-visible:dark:ring-white',
          style === 'nav' ? 'focus-visible:ring-2 rounded' : 'focus-visible:ring-1 rounded-lg',
        )}
      >
        <Button
          style={style === 'nav' ? 'none' : 'secondary'}
          size={style === 'nav' ? 'none' : 'md'}
          className={classes.button}
          asDiv
        >
          {menuButton}
          <Chevron className="w-5 h-5 fill-black dark:fill-white" />
        </Button>
      </Menu.Button>
      <Menu.Items className={classes.items} unmount={false}>
        {children}
      </Menu.Items>
    </Menu>
  );
};

export const DropdownMenuItem = (props: Omit<ButtonProps, 'style' | 'size'>) => {
  return (
    <Menu.Item>
      {({ active }) => (
        <Button
          style="secondary"
          size="menu"
          {...props}
          className={twMerge(
            props.className,
            'w-full',
            active ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-white dark:bg-black hover:bg-white hover:dark:bg-black',
          )}
        />
      )}
    </Menu.Item>
  );
};

export default DropdownMenu;
