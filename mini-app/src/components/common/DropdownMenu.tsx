import { useState, useRef, useEffect } from 'react';

interface Props {
  menuButton: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  style?: 'button' | 'nav';
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
}

const DropdownMenu = ({ menuButton, children, align = 'right', style = 'button' }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative text-left w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-2 px-3 bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 
          border border-black dark:border-white rounded-lg font-medium text-sm
          cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors
          min-w-[120px] w-full justify-between focus:outline-none focus:ring-1 
          focus:ring-black dark:focus:ring-white"
      >
        <span className="truncate">{menuButton}</span>
        <svg className="w-4 h-4 transition-transform" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute mt-2 rounded-lg shadow-lg bg-white dark:bg-black border border-black dark:border-white 
          flex flex-col shrink-0 z-10 max-h-88 overflow-x-hidden overflow-y-scroll 
          ${align === 'left' ? 'origin-top-left left-0' : 'origin-top-right right-0'}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const DropdownMenuItem = ({ children, href, target, rel, onClick }: DropdownMenuItemProps) => {
  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className="w-full px-4 py-3 text-left text-zinc-900 dark:text-zinc-100 
          bg-white dark:bg-black hover:bg-zinc-200 dark:hover:bg-zinc-800 
          no-underline text-sm font-medium border-none cursor-pointer 
          first:rounded-t-lg last:rounded-b-lg"
      >
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 text-left text-zinc-900 dark:text-zinc-100 
        bg-white dark:bg-black hover:bg-zinc-200 dark:hover:bg-zinc-800 
        text-sm font-medium border-none cursor-pointer 
        first:rounded-t-lg last:rounded-b-lg"
    >
      {children}
    </button>
  );
};

export default DropdownMenu;
