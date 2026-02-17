import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { getChainExplorerUrl } from 'lib/utils/chains';
import type { TimeLog } from 'lib/utils/events';
import { formatDateNormalised, SECOND } from 'lib/utils/time';
import { useLocale } from 'next-intl';
import TimeAgo from 'timeago-react';

interface Props {
  chainId: number;
  lastCancelled?: TimeLog;
}

const LastCancelledCell = ({ chainId, lastCancelled }: Props) => {
  const locale = useLocale();

  if (!lastCancelled?.timestamp) return <div className="w-40" />;

  const lastCancelledDate = new Date(lastCancelled.timestamp * SECOND);
  const explorerUrl = getChainExplorerUrl(chainId);

  return (
    <div className="flex justify-start items-center font-monosans gap-2 w-40">
      <WithHoverTooltip tooltip={<TimeAgo datetime={lastCancelledDate} locale={locale} />}>
        <Href underline="hover" href={`${explorerUrl}/tx/${lastCancelled.transactionHash}`} external>
          {formatDateNormalised(lastCancelledDate)}
        </Href>
      </WithHoverTooltip>
    </div>
  );
};

export default LastCancelledCell;
