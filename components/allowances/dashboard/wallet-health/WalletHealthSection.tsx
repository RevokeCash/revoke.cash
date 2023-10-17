import { twMerge } from 'tailwind-merge';
import { Address } from 'viem';
import AllowancesSummary from './AllowancesSummary';
import WalletHealth from './WalletHealth';

interface Props {
  address: Address;
  chainId: number;
}

const WalletHealthSection = ({ address, chainId }: Props) => {
  const classes = twMerge(
    'flex flex-col sm:flex-row justify-between gap-4 border border-black dark:border-white rounded-lg py-3 px-4 empty:hidden',
  );

  return (
    <div className={classes}>
      <WalletHealth address={address} chainId={chainId} />
      <AllowancesSummary chainId={chainId} />
    </div>
  );
};

export default WalletHealthSection;
