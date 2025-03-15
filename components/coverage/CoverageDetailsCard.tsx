import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import Card from 'components/common/Card';
import { type ActiveMembershipInfo, FAIRSIDE_APP_URL } from 'lib/coverage/fairside';
import { timeago } from 'lib/i18n/timeago';
import { DAY, formatArticleDate } from 'lib/utils/time';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface CoverageDetailsProps {
  membershipInfo: ActiveMembershipInfo;
}

const CoverageDetailsCard = ({ membershipInfo }: CoverageDetailsProps) => {
  const t = useTranslations();
  const locale = useLocale();

  const daysUntilExpiry = Math.ceil((new Date(membershipInfo.validUntil).getTime() - new Date().getTime()) / DAY);
  const inTime = timeago.format(new Date(membershipInfo.validUntil), locale);

  const expiryClass = twMerge(
    'text-sm text-zinc-500 dark:text-zinc-400 italic',
    daysUntilExpiry <= 60 && 'text-yellow-500 dark:text-yellow-400',
    daysUntilExpiry <= 30 && 'text-red-500 dark:text-red-400',
  );

  return (
    <Card
      title={t('address.coverage.membership.title')}
      className="py-0 justify-center flex flex-col divide-y divide-zinc-200 dark:divide-zinc-700"
    >
      <CoverageDetailsItem label={t('address.coverage.membership.labels.amount')}>
        {`${membershipInfo.coverAmount} ETH`}
        <Button style="secondary" size="sm" href={FAIRSIDE_APP_URL} external className="flex items-center gap-1.5">
          {t('common.buttons.increase')}
          <ArrowTopRightOnSquareIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
        </Button>
      </CoverageDetailsItem>

      <CoverageDetailsItem label={t('address.coverage.membership.labels.timeframe')}>
        <div className="text-right">
          <div className="text-black dark:text-white font-medium flex items-center gap-2">
            {`${formatArticleDate(membershipInfo.validFrom!)} - ${formatArticleDate(membershipInfo.validUntil!)}`}
          </div>
          <div className={expiryClass}>{t('address.permit2.expiration', { inTime })}</div>
        </div>
      </CoverageDetailsItem>

      <CoverageDetailsItem label={t('address.coverage.membership.labels.claims')}>
        <span className="text-amber-600 dark:text-amber-500">
          {t('address.coverage.membership.claims', { count: membershipInfo.activeClaims.length })}
        </span>
      </CoverageDetailsItem>
    </Card>
  );
};

interface CoverageDetailsItemProps {
  label: string;
  children: ReactNode;
  className?: string;
}

const CoverageDetailsItem = ({ label, children, className }: CoverageDetailsItemProps) => {
  const classes = twMerge('py-3 flex justify-between items-center', className);

  return (
    <div className={classes}>
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <div className="font-medium flex items-center gap-2">{children}</div>
    </div>
  );
};

export default CoverageDetailsCard;
