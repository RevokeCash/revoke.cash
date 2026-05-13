import { findUnenrichedTokens, UnenrichedTokensQuery } from '@revoke.cash/core/monitor/token-enrichment';
import { toLowercaseAddress } from '@revoke.cash/core/utils';
import { Queue } from 'bullmq';
import type { Address } from 'viem';

export interface TokenEnrichmentJobData {
  chainId: number;
  tokenAddress: Address;
  source: 'scan' | 'scheduler' | 'manual';
}

export const TOKEN_ENRICHMENT_QUEUE_NAME = 'monitor_token_enrichment';

export const tokenEnrichmentJobId = (chainId: number, tokenAddress: Address): string =>
  `${chainId}-${toLowercaseAddress(tokenAddress)}`;

export const enqueueUnenrichedTokens = async (
  queue: Queue<TokenEnrichmentJobData>,
  query: UnenrichedTokensQuery,
  source: TokenEnrichmentJobData['source'],
): Promise<number> => {
  const tokens = await findUnenrichedTokens({ limit: 500, ...query });
  if (tokens.length === 0) return 0;

  await queue.addBulk(
    tokens.map((tokenAddress) => ({
      name: 'enrich',
      data: { chainId: query.chainId, tokenAddress, source },
      opts: { jobId: tokenEnrichmentJobId(query.chainId, tokenAddress) },
    })),
  );

  return tokens.length;
};
