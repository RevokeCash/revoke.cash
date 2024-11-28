import { twMerge } from 'tailwind-merge';
import type { Address } from 'viem';
import AllowancesSummary from './AllowancesSummary';

interface Props {
  address: Address;
  chainId: number;
}

const WalletHealthSection = ({ address, chainId }: Props) => {
  const classes = twMerge(
    'h-20 flex items-center justify-between gap-4 border border-black dark:border-white rounded-lg px-4 empty:hidden',
  );

  return (
    <div className={classes}>
      <AllowancesSummary chainId={chainId} />
    </div>
  );
};

export default WalletHealthSection;
