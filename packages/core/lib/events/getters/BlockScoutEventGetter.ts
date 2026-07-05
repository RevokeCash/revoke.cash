import {
  BLOCKSCOUT_SUPPORTED_CHAINS,
  getChainApiIdentifer,
  getChainApiKey,
  getChainApiRateLimit,
  getChainApiUrl,
  getChainEtherscanCompatiblePlatformNames,
} from '@revoke.cash/core/chains';
import { EventDataSourceOutOfSyncError, LatestBlockUnavailableError } from '@revoke.cash/core/events/errors';
import ky, { retryOn429 } from '@revoke.cash/core/ky';
import { RequestQueue } from '@revoke.cash/core/request-queue';
import type { EtherscanPlatform } from '@revoke.cash/core/types';
import type { Hex } from 'viem';
import { EtherscanEventGetter, EXPLORER_REQUEST_HEADERS } from './EtherscanEventGetter';
import type { EventGetter } from './EventGetter';

interface LatestBlockResponse {
  status: string;
  message: string;
  result: Hex;
}

interface IndexingStatusResponse {
  finished_indexing: boolean;
  finished_indexing_blocks: boolean;
  indexed_blocks_ratio: number;
  indexed_internal_transactions_ratio: number;
}

export class BlockScoutEventGetter extends EtherscanEventGetter implements EventGetter {
  constructor() {
    super();

    const queueEntries = BLOCKSCOUT_SUPPORTED_CHAINS.map((chainId) => [
      chainId,
      new RequestQueue(getChainApiIdentifer(chainId), getChainApiRateLimit(chainId)),
    ]);

    this.queues = Object.fromEntries(queueEntries);
  }

  async getLatestBlock(chainId: number): Promise<number> {
    const apiUrl = getChainApiUrl(chainId)!;
    const apiKey = getChainApiKey(chainId);
    const platform = getChainEtherscanCompatiblePlatformNames(chainId);
    const queue = this.queues[chainId]!;

    const searchParams = prepareGetLatestBlockQuery(apiKey, platform);

    const latestBlockPromise = retryOn429(() =>
      queue.add(() =>
        ky
          .get(apiUrl, { searchParams, headers: EXPLORER_REQUEST_HEADERS, retry: 3, timeout: false })
          .json<LatestBlockResponse>(),
      ),
    );

    const indexingStatusPromise = retryOn429(() =>
      queue.add(() =>
        ky
          .get(`${apiUrl}/v2/main-page/indexing-status`, { headers: EXPLORER_REQUEST_HEADERS })
          .json<IndexingStatusResponse>(),
      ),
    );

    const [latestBlock, indexingStatus] = await Promise.allSettled([latestBlockPromise, indexingStatusPromise]);

    if (latestBlock.status !== 'fulfilled') {
      console.log(`${apiUrl}?${new URLSearchParams(searchParams).toString()}`);
      throw new LatestBlockUnavailableError(chainId);
    }

    // Note: if the API does not support indexing status, we simply do not apply the check and assume the data is synced
    if (indexingStatus.status === 'fulfilled') {
      if (indexingStatus.value.indexed_blocks_ratio < 0.95) {
        console.log(indexingStatus.value);
        console.log(`${apiUrl}/v2/main-page/indexing-status`);
        throw new EventDataSourceOutOfSyncError(chainId);
      }
    }

    const blockNumber = Number(latestBlock.value.result);
    if (!blockNumber) {
      console.log(latestBlock.value);
      console.log(`${apiUrl}?${new URLSearchParams(searchParams).toString()}`);
      throw new LatestBlockUnavailableError(chainId);
    }

    return blockNumber;
  }
}

// Note: newer Blockscout instances have an Etherscan-compatible API, but older ones do not
// which is why we have a separate BlockScoutEventGetter
const prepareGetLatestBlockQuery = (apiKey?: string, platform?: EtherscanPlatform) => {
  const query = {
    module: 'block',
    action: 'eth_block_number',
    // The new Blockscout API uses the 'apikey' parameter instead of 'apiKey'
    apiKey: platform?.domain === 'blockscout' ? undefined : apiKey,
    apikey: platform?.domain === 'blockscout' ? apiKey : undefined,
  };

  // Remove 'undefined' values from the query
  return JSON.parse(JSON.stringify(query));
};
