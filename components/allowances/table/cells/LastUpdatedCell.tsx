import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { AllowanceData } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';
import TimeAgo from 'timeago-react';

interface Props {
  allowance: AllowanceData;
}

const LastUpdatedCell = ({ allowance }: Props) => {
  const { selectedChainId } = useEthereum();
  const { lang } = useTranslation();

  if (!allowance.lastUpdated) return null;

  const lastUpdatedDate = new Date(allowance.lastUpdated * 1000);
  const explorerUrl = getChainExplorerUrl(selectedChainId);

  return (
    <div className="flex justify-start">
      <WithHoverTooltip tooltip={<TimeAgo datetime={lastUpdatedDate} locale={lang} />}>
        <Href href={`${explorerUrl}/tx/${allowance.transactionHash}`} external>
          {lastUpdatedDate.toLocaleDateString()} {lastUpdatedDate.toLocaleTimeString()}
        </Href>
      </WithHoverTooltip>
    </div>
  );
};

export default LastUpdatedCell;
