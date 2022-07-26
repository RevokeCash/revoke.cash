import Image from 'next/image';
import React from 'react';

interface Props {
  src: string;
  alt: string;
  href: string;
  size?: number;
}

const LogoLink = ({ src, alt, href, size }: Props) => (
  <a href={href} target="_blank">
    <Image
      src={src}
      alt={alt}
      objectFit="contain"
      height={size ?? 24}
      width={size ?? 24}
      quality="100"
      style={{ borderRadius: '50%' }}
    />
  </a>
);

export default LogoLink;
