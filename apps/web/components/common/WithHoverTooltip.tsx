import type { ReactElement, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import Tooltip from './Tooltip';

interface Props {
  tooltip: ReactNode;
  children: ReactElement;
}

// Make sure to pass native html elements as children, not React components, or forward the ref
const WithHoverTooltip = ({ tooltip, children }: Props) => {
  const contentClasses = twMerge(
    'max-w-[400px] text-center break-words font-normal text-sm border py-1 px-2 rounded-md z-50',
    'border-zinc-800 text-zinc-800 bg-zinc-100',
    'dark:border-zinc-100 dark:text-zinc-200 dark:bg-zinc-800',
  );

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Content className={contentClasses}>
        {tooltip}
        <Tooltip.Arrow className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-800 dark:stroke-zinc-100" />
      </Tooltip.Content>
    </Tooltip.Root>
  );
};
export default WithHoverTooltip;
