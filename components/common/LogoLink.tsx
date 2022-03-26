import React from 'react'
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap'

interface Props {
  src: string;
  alt: string;
  href: string;
}

const LogoLink = ({ src, alt, href }: Props) => (
  <a href={href}>
    <img src={src} alt={alt} height="24px" style={{ borderRadius: '50%' }} />
  </a>
);

export default LogoLink
