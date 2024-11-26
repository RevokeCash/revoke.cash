import type { ReactNode } from 'react';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  children: ReactNode;
  tooltip?: ReactNode;
}

const DisabledOverlay = ({ children, tooltip }: Props) => {
  const overlay = (
    <div className="relative blur-sm">
      <div>{children}</div>
      <div className="inset-0 absolute bg-zinc-400 dark:bg-zinc-700 bg-opacity-50 dark:bg-opacity-50 z-10 rounded-lg cursor-not-allowed" />
    </div>
  );

  if (tooltip) {
    return <WithHoverTooltip tooltip={tooltip}>{overlay}</WithHoverTooltip>;
  }

  return overlay;
};

export default DisabledOverlay;
