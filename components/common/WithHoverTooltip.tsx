import type { ReactNode } from 'react';
import { OverlayTrigger } from 'react-bootstrap';
import type { OverlayChildren } from 'react-bootstrap/esm/Overlay';

interface Props {
  tooltip: OverlayChildren;
  children: ReactNode;
}

const WithHoverTooltip = ({ tooltip, children }: Props) => (
  <div style={{ position: 'relative' }}>
    <OverlayTrigger placement="auto" overlay={tooltip}>
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          cursor: 'not-allowed',
          zIndex: 2,
        }}
      />
    </OverlayTrigger>
    {children}
  </div>
);

export default WithHoverTooltip;
