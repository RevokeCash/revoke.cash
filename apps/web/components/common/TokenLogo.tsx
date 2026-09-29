'use client';

import { memo } from 'react';
import Logo from './Logo';

interface Props {
  symbol: string;
  size?: number;
  border?: boolean;
  className?: string;
}

const TokenLogo = ({ symbol, size, border = true, className }: Props) => {
  const src = `/assets/images/vendor/tokens/${symbol.toLowerCase()}.svg`;

  return <Logo src={src} alt={symbol} size={size} border={border} className={className} placeholderText={symbol} />;
};

export default memo(TokenLogo);
