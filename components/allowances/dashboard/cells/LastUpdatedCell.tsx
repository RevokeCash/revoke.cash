import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { AllowanceData } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { formatDateNormalised, SECOND } from 'lib/utils/time';
import useTranslation from 'next-translate/useTranslation';
import TimeAgo from 'timeago-react';

interface Props {
  allowance: AllowanceData;
}

const LastUpdatedCell = ({ allowance }: Props) => {
  const { lang } = useTranslation();

  if (!allowance.lastUpdated) return null;

  const lastUpdatedDate = new Date(allowance.lastUpdated * SECOND);
  const explorerUrl = getChainExplorerUrl(allowance.chainId);

  return (
    <div className="flex justify-start font-monosans">
      <WithHoverTooltip tooltip={<TimeAgo datetime={lastUpdatedDate} locale={lang} />}>
        <Href underline="hover" href={`${explorerUrl}/tx/${allowance.transactionHash}`} external className="tx-link">
          {formatDateNormalised(lastUpdatedDate)}
        </Href>
      </WithHoverTooltip>
    </div>
  );
};

export default LastUpdatedCell;
