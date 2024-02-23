import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { Log } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { SECOND, formatDateNormalised } from 'lib/utils/time';
import useTranslation from 'next-translate/useTranslation';
import TimeAgo from 'timeago-react';

interface Props {
  chainId: number;
  lastCancelled?: Log;
}

const LastCancelledCell = ({ chainId, lastCancelled }: Props) => {
  const { lang } = useTranslation();

  if (!lastCancelled) return <div className="w-40" />;

  const lastCancelledDate = new Date(lastCancelled.timestamp * SECOND);
  const explorerUrl = getChainExplorerUrl(chainId);

  return (
    <div className="flex justify-start items-center font-monosans gap-2 w-40">
      <WithHoverTooltip tooltip={<TimeAgo datetime={lastCancelledDate} locale={lang} />}>
        <Href underline="hover" href={`${explorerUrl}/tx/${lastCancelled.transactionHash}`} external>
          {formatDateNormalised(lastCancelledDate)}
        </Href>
      </WithHoverTooltip>
    </div>
  );
};

export default LastCancelledCell;
