import AllowancesSummary from './AllowancesSummary';
import PremiumAllowancesSummary from './PremiumAllowancesSummary';

interface Props {
  isPremium?: boolean;
}

const WalletHealthSection = ({ isPremium = false }: Props) => {
  return (
    <div className="flex items-center justify-between gap-4 px-4 self-center empty:hidden">
      {isPremium ? <PremiumAllowancesSummary /> : <AllowancesSummary />}
    </div>
  );
};

export default WalletHealthSection;
