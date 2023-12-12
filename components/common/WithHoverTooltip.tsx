import Tippy from '@tippyjs/react';
import type { ReactElement, ReactNode } from 'react';
import 'tippy.js/dist/tippy.css';

interface Props {
  tooltip: ReactNode;
  children: ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

// Make sure to pass native html elements as children, not React components, or forward the ref
const WithHoverTooltip = ({ tooltip, placement, children }: Props) => (
  <Tippy
    interactive
    content={tooltip}
    placement={placement ?? 'top'}
    className="text-center break-words"
    maxWidth={380}
  >
    {children}
  </Tippy>
);

export default WithHoverTooltip;
