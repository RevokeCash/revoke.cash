'use client';

import Image from 'next/image';
import { memo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import PlaceholderIcon from './PlaceholderIcon';

interface Props {
  src?: string;
  alt: string;
  size?: number;
  square?: boolean;
  border?: boolean;
  className?: string;
  placeholderText?: string;
}

const Logo = ({ src, alt, size, square, border, className, placeholderText }: Props) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    // Array.from splits by code point, so a leading emoji is not cut in half
    const placeholderLetter = placeholderText ? Array.from(placeholderText)[0]?.toUpperCase() : undefined;

    return (
      <PlaceholderIcon
        size={size ?? 24}
        border={border}
        square={square}
        className="flex shrink-0 items-center justify-center overflow-hidden"
      >
        {placeholderLetter && (
          <span
            aria-hidden
            style={{ fontSize: (size ?? 24) / 2 }}
            className="font-semibold leading-none select-none text-zinc-600 dark:text-zinc-200"
          >
            {placeholderLetter}
          </span>
        )}
      </PlaceholderIcon>
    );
  }

  const classes = twMerge(
    'aspect-square object-cover bg-zinc-200 dark:bg-zinc-800 shrink-0',
    square ? 'rounded-lg' : 'rounded-full',
    border && 'border border-zinc-200 dark:border-zinc-800',
    className,
  );

  if (!src.startsWith('/')) {
    return (
      // biome-ignore lint/performance/noImgElement: we only use this img element when we specifically cannot use the Image component
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

export default memo(Logo);
