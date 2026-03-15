import blocksDB from 'lib/databases/blocks';
import type { PublicClient } from 'viem';

export interface BlockAtTimestamp {
  blockNumber: number;
  timestamp: number;
}

/**
 * Finds the closest block at or before a target timestamp using interpolated binary search.
 * Uses blocksDB cache to avoid redundant RPC calls for previously fetched block timestamps.
 * Typically converges in ~5-10 iterations.
 */
export const findBlockByTimestamp = async (
  client: PublicClient,
  targetTimestamp: number,
  options?: { fromBlock?: number; toBlock?: number },
): Promise<BlockAtTimestamp | null> => {
  const fromBlock = options?.fromBlock ?? 1;
  const toBlock = options?.toBlock ?? Number(await client.getBlockNumber());
  if (fromBlock > toBlock) return null;

  const firstTimestamp = await blocksDB.getBlockTimestamp(client, fromBlock);
  const lastTimestamp = await blocksDB.getBlockTimestamp(client, toBlock);

  // Target is before genesis or after latest
  if (targetTimestamp < firstTimestamp) return null;
  if (targetTimestamp >= lastTimestamp) return { blockNumber: toBlock, timestamp: lastTimestamp };

  // Calculate the percentage of the time difference that has passed
  const timeDiff = lastTimestamp - firstTimestamp;
  const percentageTimeDiff = timeDiff > 0 ? (targetTimestamp - firstTimestamp) / timeDiff : 0.5;

  // Calculate the block number where the target date is likely to be
  const blockDiff = toBlock - fromBlock;
  const estimatedBlockNumber = Math.floor(fromBlock + percentageTimeDiff * blockDiff);

  if (estimatedBlockNumber === fromBlock) return { blockNumber: fromBlock, timestamp: firstTimestamp };
  if (estimatedBlockNumber === toBlock) return { blockNumber: toBlock, timestamp: lastTimestamp };

  const estimatedTimestamp = await blocksDB.getBlockTimestamp(client, estimatedBlockNumber);

  if (estimatedTimestamp > targetTimestamp) {
    return findBlockByTimestamp(client, targetTimestamp, { fromBlock, toBlock: estimatedBlockNumber });
  }

  if (estimatedTimestamp < targetTimestamp) {
    return findBlockByTimestamp(client, targetTimestamp, { fromBlock: estimatedBlockNumber, toBlock });
  }

  return { blockNumber: estimatedBlockNumber, timestamp: estimatedTimestamp };
};
