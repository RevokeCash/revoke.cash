import ky, { retryOn429 } from 'lib/ky';
import {
  BLOCKSCOUT_SUPPORTED_CHAINS,
  getChainApiIdentifer,
  getChainApiKey,
  getChainApiRateLimit,
  getChainApiUrl,
} from 'lib/utils/chains';
import type { Hex } from 'viem';
import { EtherscanEventGetter } from './EtherscanEventGetter';
import type { EventGetter } from './EventGetter';
import { RequestQueue } from './RequestQueue';

interface LatestBlockResponse {
  status: string;
  message: string;
  result: Hex;
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
    const queue = this.queues[chainId]!;

    const searchParams = prepareGetLatestBlockQuery(apiKey);

    const result = await retryOn429(() =>
      queue.add(() => ky.get(apiUrl, { searchParams, retry: 3, timeout: false }).json<LatestBlockResponse>()),
    );

    const blockNumber = Number(result.result);
    if (!blockNumber) throw new Error('Failed to get latest block number');

    return blockNumber;
  }
}

// Note: newer Blockscout instances have an Etherscan-compatible API, but older ones do not
// which is why we have a separate BlockScoutEventGetter
const prepareGetLatestBlockQuery = (apiKey?: string) => {
  const query = {
    module: 'block',
    action: 'eth_block_number',
    apiKey,
  };

  // Remove 'undefined' values from the query
  return JSON.parse(JSON.stringify(query));
};
