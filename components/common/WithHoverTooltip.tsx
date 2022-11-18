import Tippy from '@tippyjs/react';
import type { ReactNode } from 'react';
import 'tippy.js/dist/tippy.css';

interface Props {
  tooltip: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

const WithHoverTooltip = ({ tooltip, placement, children }: Props) => (
  <div className="relative">
    <Tippy content={tooltip} placement={placement ?? 'top'}>
      <div className="absolute inset-0 w-full h-full cursor-not-allowed z-10" />
    </Tippy>
    {children}
  </div>
);

export default WithHoverTooltip;
