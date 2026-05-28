import { findUnenrichedTokens, UnenrichedTokensQuery } from '@revoke.cash/core/indexer/token-metadata';
import { toLowercaseAddress } from '@revoke.cash/core/utils';
import { Queue } from 'bullmq';
import type { Address } from 'viem';

export interface TokenMetadataJobData {
  chainId: number;
  tokenAddress: Address;
  source: 'events' | 'scheduler' | 'manual';
}

export const TOKEN_METADATA_QUEUE_NAME = 'indexer_token_metadata';
const DEFAULT_TOKEN_METADATA_BATCH_SIZE = 2_000;

export const tokenMetadataJobId = (chainId: number, tokenAddress: Address): string =>
  `${chainId}-${toLowercaseAddress(tokenAddress)}`;

export const enqueueUnenrichedTokens = async (
  queue: Queue<TokenMetadataJobData>,
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
