import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { PermitTokenData } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { SECOND, formatDateNormalised } from 'lib/utils/time';
import useTranslation from 'next-translate/useTranslation';
import TimeAgo from 'timeago-react';

interface Props {
  token: PermitTokenData;
}

const LastCancelledCell = ({ token }: Props) => {
  const { lang } = useTranslation();

  if (!token.lastCancelled) return null;

  const lastCancelledDate = new Date(token.lastCancelled.timestamp * SECOND);
  const explorerUrl = getChainExplorerUrl(token.chainId);

  return (
    <div className="flex justify-start items-center font-monosans gap-2">
      <WithHoverTooltip tooltip={<TimeAgo datetime={lastCancelledDate} locale={lang} />}>
        <Href underline="hover" href={`${explorerUrl}/tx/${token.lastCancelled.transactionHash}`} external>
          {formatDateNormalised(lastCancelledDate)}
        </Href>
      </WithHoverTooltip>
    </div>
  );
};

export default LastCancelledCell;
