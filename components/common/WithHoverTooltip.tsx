import type { ReactNode } from 'react';
import type { OverlayChildren } from 'react-bootstrap/esm/Overlay';

interface Props {
  tooltip: OverlayChildren;
  children: ReactNode;
}

const WithHoverTooltip = ({ tooltip, children }: Props) => <div className="block">{children}</div>;

export default WithHoverTooltip;
