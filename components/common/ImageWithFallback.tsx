'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

interface Props extends ImageProps {
  fallbackSrc: string;
}

const ImageWithFallback = ({ fallbackSrc, ...props }: Props) => {
  const [src, setSrc] = useState(props.src ?? fallbackSrc);

  return (
    <Image
      {...props}
      src={src}
      onError={(e) => {
        setSrc(fallbackSrc);
      }}
    />
  );
};

export default ImageWithFallback;
