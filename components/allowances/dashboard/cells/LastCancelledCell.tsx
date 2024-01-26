import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { ADDRESS_ZERO_PADDED, ADDRESS_ZERO_PADDED_1 } from 'lib/constants';
import { useAddressEvents } from 'lib/hooks/page-context/AddressPageContext';
import type { AddressEvents, AllowanceData } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { SECOND, formatDateNormalised } from 'lib/utils/time';
import useTranslation from 'next-translate/useTranslation';
import TimeAgo from 'timeago-react';

interface Props {
  allowance: AllowanceData;
}

// We export this function so it can be reused in other places such as the 'PermitsEntry.tsx' file.
export function filterLastCancelled(
  events: AddressEvents,
  token: AllowanceData,
): {
  time: string;
  alreadyCancelled: boolean;
} {
  const filteredEvents = events.approval.filter(
    (event) =>
      event.address === token.contract.address &&
      (event.topics[2] === ADDRESS_ZERO_PADDED_1 ||
        event.topics[2] === ADDRESS_ZERO_PADDED ||
        (event.timestamp > 0 && event.topics[2] !== ADDRESS_ZERO_PADDED)) &&
      (event.data === ADDRESS_ZERO_PADDED || event.data === '0x'),
  );
  // If the Log list contain at least an element, then we are sure to retrieve the lastCancelled time
  if (filteredEvents?.length > 0) {
    return { time: formatDateNormalised(new Date(filteredEvents[0]?.timestamp * SECOND)), alreadyCancelled: true };
  }
  return { time: null, alreadyCancelled: false };
}

const LastCancelledCell = ({ allowance }: Props) => {
  const { lang, t } = useTranslation();
  const { events } = useAddressEvents();

  const cancelledInfo = filterLastCancelled(events, allowance);
  const explorerUrl = getChainExplorerUrl(allowance.chainId);

  return (
    <div className="flex justify-start items-center font-monosans gap-2 w-41">
      <WithHoverTooltip tooltip={<TimeAgo datetime={cancelledInfo.time} locale={lang} />}>
        <Href underline="hover" href={`${explorerUrl}/tx/${allowance.transactionHash}`} external className="tx-link">
          {cancelledInfo.time}
        </Href>
      </WithHoverTooltip>
    </div>
  );
};

export default LastCancelledCell;
