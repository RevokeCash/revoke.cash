import { formatArticleDate } from 'lib/utils/time';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

const getExpiryInfo = (validUntil: string | null): { text: string; isWarning: boolean; isDanger: boolean } => {
  if (!validUntil) return { text: '', isWarning: false, isDanger: false };

  const now = new Date();
  const expiryDate = new Date(validUntil);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    text: `Expires in ${daysUntilExpiry} days`,
    isWarning: daysUntilExpiry <= 60,
    isDanger: daysUntilExpiry <= 30,
  };
};

interface CoverageDetailsProps {
  coverageAmount: number | null;
  validFrom: string | null;
  validUntil: string | null;
  claimsCount: number | null;
  onIncrease?: () => void;
  className?: string;
}

const CoverageDetailsCard = ({
  coverageAmount,
  validFrom,
  validUntil,
  claimsCount,
  onIncrease,
  className,
}: CoverageDetailsProps) => {
  const t = useTranslations('address.coverage');

  const expiryInfo = getExpiryInfo(validUntil);
  const expiryClass = twMerge(
    'text-sm text-gray-500 dark:text-gray-400 italic',
    expiryInfo.isWarning && 'text-yellow-500 dark:text-yellow-400',
    expiryInfo.isDanger && 'text-red-500 dark:text-red-400',
  );

  return (
    <div className={twMerge('border border-gray-400 dark:border-gray-700 rounded-lg overflow-hidden', className)}>
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-medium">
        {t('membership_card_title')}
      </div>

      <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <span className="text-gray-600 dark:text-gray-400">{t('amount')}:</span>
        <div className="text-black dark:text-white font-medium flex items-center gap-2">
          {coverageAmount} ETH
          {onIncrease && (
            <button
              type="button"
              onClick={onIncrease}
              className="px-3 py-1 text-sm bg-white hover:bg-white/80 text-black rounded-full transition-colors border border-gray-800 hover:shadow-[0_8px_8px_rgba(0,0,0,0.25)] duration-300 ease-in-out"
            >
              Increase
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <span className="text-gray-600 dark:text-gray-400">Timeframe:</span>
        <div className="text-right">
          <div className="text-black dark:text-white font-medium flex items-center gap-2">
            {`${formatArticleDate(validFrom!)} - ${formatArticleDate(validUntil!)}`}
          </div>
          <div className={expiryClass}>{expiryInfo.text}</div>
        </div>
      </div>

      <div className="px-4 py-3 flex justify-between items-center border-b-0 border-gray-200 dark:border-gray-700">
        <span className="text-gray-600 dark:text-gray-400">{t('claims')}:</span>
        <div className="text-black dark:text-white font-medium flex items-center gap-2">
          <span className="text-amber-600 dark:text-amber-500">
            {claimsCount === 0 ? t('no_claims') : `${claimsCount} claims`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CoverageDetailsCard;
