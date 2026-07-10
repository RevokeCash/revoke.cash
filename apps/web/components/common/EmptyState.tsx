import { InboxIcon } from '@heroicons/react/24/outline';
import { twMerge } from 'tailwind-merge';

interface Props {
  children: React.ReactNode;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconClassName?: string;
}

const EmptyState = ({ children, icon: Icon = InboxIcon, iconClassName }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center whitespace-normal">
      <Icon className={twMerge('w-8 h-8 text-zinc-400 dark:text-zinc-600', iconClassName)} />
      <div className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md min-w-0">{children}</div>
    </div>
  );
};

export default EmptyState;
