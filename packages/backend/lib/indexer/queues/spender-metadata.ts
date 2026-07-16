import { findUnenrichedSpenders, type UnenrichedSpendersQuery } from '@revoke.cash/core/indexer/spender-metadata';
import { toLowercaseAddress } from '@revoke.cash/core/utils';
import type { Address } from 'viem';

export interface SpenderMetadataJobData {
  chainId: number;
  spenderAddress: Address;
  source: 'events' | 'scheduler' | 'manual';
}

interface SpenderMetadataQueue {
  addBulk(
    jobs: Array<{
      name: string;
      data: SpenderMetadataJobData;
      opts: { jobId: string };
    }>,
  ): Promise<unknown>;
}

export const SPENDER_METADATA_QUEUE_NAME = 'indexer_spender_metadata';

export const spenderMetadataJobId = (chainId: number, spenderAddress: Address): string =>
  `enrich-spender-metadata-${chainId}-${toLowercaseAddress(spenderAddress)}`;

export const enqueueUnenrichedSpenders = async (
  queue: SpenderMetadataQueue,
  query: UnenrichedSpendersQuery,
  source: SpenderMetadataJobData['source'],
): Promise<number> => {
  const spenders = await findUnenrichedSpenders({ limit: 2000, ...query });
  if (spenders.length === 0) return 0;

  await queue.addBulk(
    spenders.map((spenderAddress) => ({
      name: 'enrich',
      data: { chainId: query.chainId, spenderAddress, source },
      opts: { jobId: spenderMetadataJobId(query.chainId, spenderAddress) },
    })),
  );

  return spenders.length;
};
