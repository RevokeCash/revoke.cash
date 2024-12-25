import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { getChainExplorerUrl } from 'lib/utils/chains';
import type { TimeLog } from 'lib/utils/events';
import { SECOND, formatDateNormalised } from 'lib/utils/time';
import { useLocale, useTranslations } from 'next-intl';
import TimeAgo from 'timeago-react';

interface Props {
  chainId: number;
  lastUpdated?: TimeLog;
}

const LastUpdatedCell = ({ chainId, lastUpdated }: Props) => {
  const t = useTranslations();
  const locale = useLocale();

  if (!lastUpdated?.timestamp) return null;

  const lastUpdatedDate = new Date(lastUpdated.timestamp * SECOND);
  const explorerUrl = getChainExplorerUrl(chainId);

  // const oldApproval = lastUpdated.timestamp * SECOND < Date.now() - 12 * MONTH;

  return (
    <div className="flex justify-start items-center font-monosans gap-2 w-41">
      <WithHoverTooltip tooltip={<TimeAgo datetime={lastUpdatedDate} locale={locale} />}>
        <Href underline="hover" href={`${explorerUrl}/tx/${lastUpdated.transactionHash}`} external className="tx-link">
          {formatDateNormalised(lastUpdatedDate)}
        </Href>
      </WithHoverTooltip>
      {/* {oldApproval && (
        <WithHoverTooltip tooltip={t('address.tooltips.old_approval')}>
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 focus:outline-black" />
        </WithHoverTooltip>
      )} */}
    </div>
  );
};

export default LastUpdatedCell;
