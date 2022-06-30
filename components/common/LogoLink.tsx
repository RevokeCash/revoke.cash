import Image from 'next/image';
import React from 'react';

interface Props {
  src: string;
  alt: string;
  href: string;
}

const LogoLink = ({ src, alt, href }: Props) => (
  <a href={href}>
    <Image
      src={src}
      alt={alt}
      objectFit="contain"
      height="24"
      width="24"
      quality="100"
      style={{ borderRadius: '50%' }}
    />
  </a>
);

export default LogoLink;
