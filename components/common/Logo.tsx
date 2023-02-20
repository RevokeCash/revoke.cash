import { classNames } from 'lib/utils/styles';
import Image from 'next/image';
import { useState } from 'react';
import PlaceholderIcon from './PlaceholderIcon';

interface Props {
  src: string;
  alt: string;
  size?: number;
  square?: boolean;
}

const Logo = ({ src, alt, size, square }: Props) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return <PlaceholderIcon size={size} />;
  }

  if (!src.startsWith('/')) {
    return (
      <img
        src={src}
        alt={alt}
        height={size ?? 24}
        width={size ?? 24}
        className={classNames('aspect-square object-cover', square ? 'rounded-lg' : 'rounded-full')}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <Image
      objectFit="contain"
      src={src}
      alt={alt}
      height={size ?? 24}
      width={size ?? 24}
      quality="100"
      className={classNames('aspect-square object-cover', square ? 'rounded-lg' : 'rounded-full')}
      onError={() => setError(true)}
    />
  );
};

export default Logo;
