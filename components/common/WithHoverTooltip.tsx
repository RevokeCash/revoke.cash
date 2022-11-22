import Tippy from '@tippyjs/react';
import type { ReactNode } from 'react';
import 'tippy.js/dist/tippy.css';

interface Props {
  tooltip: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  disabled?: boolean;
}

const WithHoverTooltip = ({ tooltip, placement, disabled, children }: Props) => (
  <div className="relative">
    <Tippy content={tooltip} placement={placement ?? 'top'} className="text-center w-60">
      <div>
        {disabled && <div className="cursor-not-allowed absolute inset-0 w-full h-full z-10" />}
        {children}
      </div>
    </Tippy>
  </div>
);

export default WithHoverTooltip;
