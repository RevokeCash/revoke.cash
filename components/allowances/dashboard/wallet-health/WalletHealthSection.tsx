import { twMerge } from 'tailwind-merge';
import AllowancesSummary from './AllowancesSummary';
import PremiumAllowancesSummary from './PremiumAllowancesSummary';

interface Props {
  isPremium?: boolean;
}

const WalletHealthSection = ({ isPremium = false }: Props) => {
  const classes = twMerge(
    'h-20 flex items-center justify-between gap-4 border border-black dark:border-white rounded-lg px-4 empty:hidden',
  );

  return <div className={classes}>{isPremium ? <PremiumAllowancesSummary /> : <AllowancesSummary />}</div>;
};

export default WalletHealthSection;
