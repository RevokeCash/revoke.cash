'use client';

import Image from 'next/image';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import PlaceholderIcon from './PlaceholderIcon';

interface Props {
  src?: string;
  alt: string;
  size?: number;
  square?: boolean;
  border?: boolean;
  className?: string;
}

const Logo = ({ src, alt, size, square, border, className }: Props) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return <PlaceholderIcon size={size ?? 24} border={border} square={square} />;
  }

  const classes = twMerge(
    'aspect-square object-cover bg-white shrink-0',
    square ? 'rounded-lg' : 'rounded-full',
    border && 'border border-black dark:border-white',
    className,
  );

  if (!src.startsWith('/')) {
    return (
      <img
        src={src}
        alt={alt}
        height={size ?? 24}
        width={size ?? 24}
        className={classes}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      height={size ?? 24}
      width={size ?? 24}
      quality="100"
      className={classes}
      onError={() => setError(true)}
    />
  );
};

export default Logo;
