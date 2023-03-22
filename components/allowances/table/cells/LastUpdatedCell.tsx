import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import type { AllowanceData } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { formatDateNormalised, SECOND } from 'lib/utils/time';
import useTranslation from 'next-translate/useTranslation';
import TimeAgo from 'timeago-react';

interface Props {
  allowance: AllowanceData;
}

const LastUpdatedCell = ({ allowance }: Props) => {
  const { selectedChainId } = useAddressPageContext();
  const { lang } = useTranslation();

  if (!allowance.lastUpdated) return null;

  const lastUpdatedDate = new Date(allowance.lastUpdated * SECOND);
  const explorerUrl = getChainExplorerUrl(selectedChainId);

  return (
    <div className="flex justify-start font-monosans">
      <WithHoverTooltip tooltip={<TimeAgo datetime={lastUpdatedDate} locale={lang} />}>
        <Href underline="hover" href={`${explorerUrl}/tx/${allowance.transactionHash}`} external>
          {formatDateNormalised(lastUpdatedDate)}
        </Href>
      </WithHoverTooltip>
    </div>
  );
};

export default LastUpdatedCell;
