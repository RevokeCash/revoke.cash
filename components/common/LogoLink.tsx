import React from 'react'

interface Props {
  src: string;
  alt: string;
  href: string;
}

const LogoLink = ({ src, alt, href }: Props) => (
  <a href={href}>
    <img src={src} alt={alt} height="24" style={{ borderRadius: '50%' }} />
  </a>
);

export default LogoLink
