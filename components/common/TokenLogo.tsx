import { classNames } from 'lib/utils/styles';
import { useState } from 'react';

interface Props {
  src?: string;
  alt: string;
  size?: number;
}

const TokenLogo = ({ src, alt, size }: Props) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div style={{ width: size, height: size }} className="bg-gray-300 dark:bg-gray-600 aspect-square rounded-full" />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      height={size ?? 24}
      width={size ?? 24}
      className={classNames('aspect-square rounded-full object-cover')}
      onError={() => setError(true)}
    />
  );
};

export default TokenLogo;
