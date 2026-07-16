import type { Log } from '@revoke.cash/core/events';
import { deduplicateArray } from '@revoke.cash/core/utils';
import { type Address, getAddress, type Hex, pad, slice } from 'viem';

export const topicToAddress = (topic: Hex) => getAddress(slice(topic, 12));
export const addressToTopic = (address: Address) => pad(address, { size: 32 }).toLowerCase() as Hex;

export const logSorterChronological = (a: Log, b: Log) => {
  if (a.blockNumber === b.blockNumber) {
    if (a.transactionIndex === b.transactionIndex) {
      return Number(a.logIndex - b.logIndex);
    }
    return Number(a.transactionIndex - b.transactionIndex);
  }
  return Number(a.blockNumber - b.blockNumber);
};

export const sortLogsChronologically = (logs: Log[]) => logs.sort(logSorterChronological);

export const sortTokenEventsChronologically = <T extends { rawLog: Log }>(events: T[]): T[] =>
  events.sort((a, b) => logSorterChronological(a.rawLog, b.rawLog));

export const deduplicateLogsByTopics = (logs: Log[], consideredIndexes: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3]) => {
  const keyGenerator = (log: Log) => {
    const topicsKey = log.topics
      .map((topic, index) => (consideredIndexes.includes(index as 0 | 1 | 2 | 3) ? topic : 'ignored'))
      .join('-');

    return `${log.address}-${topicsKey}`;
  };

  return deduplicateArray(logs, keyGenerator);
};

export const filterLogsByAddress = (logs: Log[], address: string) => {
  return logs.filter((log) => log.address === address);
};

export const filterLogsByTopics = (logs: Log[], topics: string[]) => {
  return logs.filter((log) => {
    return topics.every((topic, index) => !topic || topic === log.topics[index]);
  });
};
