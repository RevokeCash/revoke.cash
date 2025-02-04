import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  isActive: boolean;
  coverageAmount?: number | null;
}

const MembershipCard = ({ isActive, coverageAmount = null }: Props) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-4 h-[150px] justify-between rounded-xl border border-gray-700 p-4 bg-gradient-to-t from-[#C5C5C5] to-white shadow-[0_8px_8px_rgba(0,0,0,0.25)] hover:scale-105 transition-all duration-300 ease-in-out duration-300ms">
      <div className="font-bold text-xl">{t('address.coverage.membership_card_title')}</div>
      <div className="flex flex-row gap-2 justify-between">
        <div className="flex flex-col justify-between items-start">
          <span className="text-sm font-bold">{t('address.coverage.status')}:</span>
          <span className={twMerge('font-bold text-lg', isActive ? 'text-green-500' : 'text-red-500')}>
            {isActive ? t('address.coverage.covered') : t('address.coverage.not_covered')}
          </span>
        </div>

        {isActive && coverageAmount && (
          <div className="flex flex-col justify-between items-start">
            <span className="text-sm font-bold">{t('address.coverage.amount')}:</span>
            <span className="font-lg font-bold">{coverageAmount} ETH</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipCard;
