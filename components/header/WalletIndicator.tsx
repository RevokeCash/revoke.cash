'use client';

import { useMounted } from 'lib/hooks/useMounted';
import WalletIndicatorDropdown from './WalletIndicatorDropdown';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
}

const WalletIndicator = ({ size, style, className }: Props) => {
  const isMounted = useMounted();

  if (!isMounted) return null;

  return (
    <div className="flex gap-2">
      <WalletIndicatorDropdown size={size} style={style} className={className} />
    </div>
  );
};

export default WalletIndicator;
