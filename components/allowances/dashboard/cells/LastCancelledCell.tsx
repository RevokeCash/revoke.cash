import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { ADDRESS_ZERO_PADDED, ADDRESS_ZERO_PADDED_1 } from 'lib/constants';
import blocksDB from 'lib/databases/blocks';
import { useAddressEvents } from 'lib/hooks/page-context/AddressPageContext';
import type { AddressEvents, AllowanceData } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { HOUR, SECOND, formatDateNormalised } from 'lib/utils/time';
import useTranslation from 'next-translate/useTranslation';
import React from 'react';
import TimeAgo from 'timeago-react';

interface Props {
  allowance: AllowanceData;
}

// const getTimestamp = async(token: any, blockNumber: number) => await blocksDB.getBlockTimestamp(token.publicClient, blockNumber);
const formatResult = async ({
  isTimestamp,
  timestampOrBlockNumber,
  token,
  hash,
}: {
  isTimestamp: boolean;
  timestampOrBlockNumber: number;
  token: any;
  hash: string;
}) => {
  let timestamp = isTimestamp
    ? timestampOrBlockNumber
    : await blocksDB.getBlockTimestamp(token.publicClient, timestampOrBlockNumber);
  return {
    time: formatDateNormalised(new Date(timestamp * SECOND)),
    alreadyCancelled: timestamp < Date.now() - 24 * HOUR,
    hash,
  };
};

// We export this function so it can be reused in other places such as the 'PermitsEntry.tsx' file.
export async function filterLastCancelled(
  events: AddressEvents,
  token: AllowanceData,
): Promise<{
  time: string;
  hash: string;
  alreadyCancelled: boolean;
}> {
  const filteredEvents = events.approval.filter((event) => {
    // timestamp  = await getTimestamp(token.contract, event.blockNumber); // Doing it this way always return the full event list
    // While this method defaults to 0 for timestamp
    return (
      event.address === token.contract.address &&
      (event.topics[2] === ADDRESS_ZERO_PADDED_1 ||
        event.topics[2] === ADDRESS_ZERO_PADDED ||
        ((event.timestamp || event.blockNumber) > 0 && event.topics[2] !== ADDRESS_ZERO_PADDED)) &&
      (event.data === ADDRESS_ZERO_PADDED || event.data === '0x') &&
      event
    );
  });
  console.log('filteredEvents: ', filteredEvents);
  // If the Log list contain at least an element, then we are sure to retrieve the lastCancelled time
  if (filteredEvents?.length > 0) {
    console.log('currTime: ', Date.now());
    const event = filteredEvents[0];
    let firstTwoParam = { isTimestamp: false, timestampOrBlockNumber: event.blockNumber };
    if (event.timestamp) {
      firstTwoParam.isTimestamp = true;
      firstTwoParam.timestampOrBlockNumber = event.timestamp;
    }
    return await formatResult({ ...firstTwoParam, token, hash: event.transactionHash });
  }
  return { time: null, alreadyCancelled: false, hash: '' };
}

const LastCancelledCell = ({ allowance }: Props) => {
  const { lang, t } = useTranslation();
  const { events } = useAddressEvents();
  const [cancelledInfo, setCancelInfo] = React.useState<{
    time: string;
    hash: string;
    alreadyCancelled: boolean;
  }>();

  React.useEffect(() => {
    const getInfo = async () => {
      const result = await filterLastCancelled(events, allowance);
      setCancelInfo(result);
    };
    getInfo();
    return () => {};
  }, [filterLastCancelled]);
  const explorerUrl = getChainExplorerUrl(allowance.chainId);

  return (
    <div className="flex justify-start items-center font-monosans gap-2 w-41">
      <WithHoverTooltip tooltip={<TimeAgo datetime={cancelledInfo.time} locale={lang} />}>
        <Href underline="hover" href={`${explorerUrl}/tx/${cancelledInfo?.hash}`} external className="tx-link">
          {`L/Cancelled: ${cancelledInfo.time}`}
        </Href>
      </WithHoverTooltip>
    </div>
  );
};

export default LastCancelledCell;
