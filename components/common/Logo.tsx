import Image from 'next/image';
import React from 'react';

interface Props {
  src: string;
  alt: string;
  size?: number;
}

const Logo = ({ src, alt, size }: Props) => (
  <Image
    src={src}
    alt={alt}
    objectFit="contain"
    height={size ?? 24}
    width={size ?? 24}
    quality="100"
    style={{ borderRadius: '50%' }}
  />
);

export default Logo;
