import * as Tooltip from '@radix-ui/react-tooltip';
import { type ReactElement, type ReactNode, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  tooltip: ReactNode;
  children: ReactElement;
}

// Make sure to pass native html elements as children, not React components, or forward the ref
const WithHoverTooltip = ({ tooltip, children }: Props) => {
  const contentClasses = twMerge(
    'max-w-[400px] text-center break-words font-normal text-sm border py-1 px-2 rounded-md mx-1',
    'border-zinc-800 text-zinc-800 bg-zinc-100',
    'dark:border-zinc-100 dark:text-zinc-200 dark:bg-zinc-800',
    'tooltip-content',
  );

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className={contentClasses} sideOffset={4}>
            {tooltip}
            <Tooltip.Arrow asChild>
              {/* Note: stroke and -mt need to be set to match the border width of the content */}
              <Arrow className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-800 dark:stroke-zinc-100 -mt-[1px] w-4 h-2 stroke-1" />
            </Tooltip.Arrow>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
export default WithHoverTooltip;

const Arrow = forwardRef((props: React.SVGProps<SVGSVGElement>, ref: React.Ref<SVGSVGElement>) => (
  <svg viewBox="0 0 24 12" xmlns="http://www.w3.org/2000/svg" {...props} ref={ref}>
    <title>Arrow</title>
    <path d="M0 0L12 8L24 0" vectorEffect="non-scaling-stroke" />
  </svg>
));
