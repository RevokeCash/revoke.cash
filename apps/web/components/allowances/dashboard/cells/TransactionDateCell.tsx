import { getChainExplorerUrl } from '@revoke.cash/core/chains';
import type { TimeLog } from '@revoke.cash/core/events';
import { formatDateNormalised, SECOND } from '@revoke.cash/core/utils/time';
import Href from 'components/common/Href';
import TimeAgo from 'components/common/TimeAgo';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useLocale } from 'next-intl';

interface Props {
  chainId: number;
  timeLog?: Partial<TimeLog>;
}

const TransactionDateCell = ({ chainId, timeLog }: Props) => {
  const locale = useLocale();

  if (!timeLog?.timestamp) return null;

  const date = new Date(timeLog.timestamp * SECOND);
  const formattedDate = formatDateNormalised(date);
  const explorerUrl = getChainExplorerUrl(chainId);

  return (
    <div className="flex justify-start items-center font-monosans gap-2 w-40">
      <WithHoverTooltip tooltip={<TimeAgo datetime={date} locale={locale} />}>
        {timeLog.transactionHash ? (
          <Href underline="hover" href={`${explorerUrl}/tx/${timeLog.transactionHash}`} external className="tx-link">
            {formattedDate}
          </Href>
        ) : (
          <span className="text-zinc-500 dark:text-zinc-400">{formattedDate}</span>
        )}
      </WithHoverTooltip>
    </div>
  );
};

export default TransactionDateCell;
