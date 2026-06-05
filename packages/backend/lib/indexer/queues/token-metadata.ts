import { findUnenrichedTokens, type UnenrichedTokensQuery } from '@revoke.cash/core/indexer/token-metadata';
import { toLowercaseAddress } from '@revoke.cash/core/utils';
import type { Address } from 'viem';

export interface TokenMetadataJobData {
  chainId: number;
  tokenAddress: Address;
  source: 'events' | 'scheduler' | 'manual';
}

interface TokenMetadataQueue {
  addBulk(
    jobs: Array<{
      name: string;
      data: TokenMetadataJobData;
      opts: { jobId: string };
    }>,
  ): Promise<unknown>;
}

export const TOKEN_METADATA_QUEUE_NAME = 'indexer_token_metadata';
const DEFAULT_TOKEN_METADATA_BATCH_SIZE = 2_000;

export const tokenMetadataJobId = (chainId: number, tokenAddress: Address): string =>
  `${chainId}-${toLowercaseAddress(tokenAddress)}`;

export const enqueueUnenrichedTokens = async (
  queue: TokenMetadataQueue,
  query: UnenrichedTokensQuery,
  source: TokenMetadataJobData['source'],
): Promise<number> => {
  const tokens = await findUnenrichedTokens({ limit: DEFAULT_TOKEN_METADATA_BATCH_SIZE, ...query });
  if (tokens.length === 0) return 0;

  await queue.addBulk(
    tokens.map((tokenAddress) => ({
      name: 'enrich',
      data: { chainId: query.chainId, tokenAddress, source },
      opts: { jobId: tokenMetadataJobId(query.chainId, tokenAddress) },
    })),
  );

  return tokens.length;
};
