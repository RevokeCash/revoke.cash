import {
  ETHERSCAN_SUPPORTED_CHAINS,
  getChainApiIdentifer,
  getChainApiKey,
  getChainApiRateLimit,
  getChainApiUrl,
  getChainEtherscanCompatiblePlatformNames,
  getChainLogsRpcUrl,
} from '@revoke.cash/core/chains';
import type { Filter, Log } from '@revoke.cash/core/events';
import { EventLogsUnavailableError, LatestBlockUnavailableError } from '@revoke.cash/core/events/errors';
import { ViemLogsProvider } from '@revoke.cash/core/events/providers';
import ky, { kyQueue } from '@revoke.cash/core/ky';
import { RequestQueue } from '@revoke.cash/core/request-queue';
import type { EtherscanPlatform } from '@revoke.cash/core/types';
import { isNullish } from '@revoke.cash/core/utils';
import { isLogResponseSizeError } from '@revoke.cash/core/utils/errors';
import type { KyInstance } from 'ky';
import { type Address, getAddress, type Hash, type Hex } from 'viem';
import type { EventGetter } from './EventGetter';

interface LogsResponse {
  status: string;
  message: string;
  result: string | Array<EtherscanLog>;
}

interface EtherscanLog {
  address: Address;
  blockNumber: Hex;
  timeStamp: Hex;
  topics: [topic0: Hex, ...rest: Hex[]];
  data: Hex;
  transactionHash: Hash;
  transactionIndex: Hex;
  logIndex: Hex;
}

interface LatestBlockResponse {
  status: string;
  message: string;
  result: string;
}

export class EtherscanEventGetter implements EventGetter {
  protected clients: { [chainId: number]: KyInstance };

  constructor() {
    this.clients = createExplorerClients(ETHERSCAN_SUPPORTED_CHAINS);
  }

  async getLatestBlock(chainId: number): Promise<number> {
    const apiUrl = getChainApiUrl(chainId)!;
    const apiKey = getChainApiKey(chainId);
    const platform = getChainEtherscanCompatiblePlatformNames(chainId);
    const client = this.clients[chainId]!;

    const searchParams = prepareGetLatestBlockQuery(chainId, apiKey, platform);

    const result = await client.get(apiUrl, { searchParams }).json<LatestBlockResponse>();

    const blockNumber = Number(result.result);
    if (!blockNumber) {
      console.log(`${apiUrl}?${new URLSearchParams(searchParams).toString()}`);
      throw new LatestBlockUnavailableError(chainId);
    }
    return blockNumber;
  }

  async getEvents(chainId: number, filter: Filter): Promise<Log[]> {
    const apiUrl = getChainApiUrl(chainId)!;
    const apiKey = getChainApiKey(chainId);
    const platform = getChainEtherscanCompatiblePlatformNames(chainId);
    const client = this.clients[chainId]!;

    const searchParams = prepareGetLogsQuery(chainId, filter, apiKey, platform);

    let data: LogsResponse;
    try {
      data = await client.get(apiUrl, { searchParams }).json<LogsResponse>();
    } catch (e) {
      console.log(e);
      console.log(`${apiUrl}?${new URLSearchParams(searchParams).toString()}`);

      if (isLogResponseSizeError(e)) throw new Error('Log response size exceeded');

      throw new EventLogsUnavailableError(chainId);
    }

    if (typeof data.result === 'string') {
      // If the query times out, this indicates that we should try again with a smaller block range
      if (data.result.includes('Query Timeout occurred')) {
        throw new Error('Log response size exceeded');
      }

      throw new EventLogsUnavailableError(chainId, data.result);
    }

    if (typeof data.message === 'string') {
      // Routescan / Snowtrace will report a timeout if the range is too large
      const isTimeoutError =
        isNullish(data?.result) &&
        (data.message.includes('Timeout reached') || data.message.includes('Query Timeout occurred'));
      if (isTimeoutError) throw new Error('Log response size exceeded');
    }

    if (!Array.isArray(data.result)) {
      console.log(data);
      throw new EventLogsUnavailableError(chainId);
    }

    // Throw an error that is compatible with the recursive getLogs retrying client-side if we hit the result limit
    if (data.result?.length === 1000) {
      // If the result size is still too large when looking at events for a single block, we use the "regular"
      // RPC call to get the logs, since these generally have no problem when only looking at a single block
      if (filter.fromBlock === filter.toBlock) {
        const backupLogsProvider = new ViemLogsProvider(chainId, getChainLogsRpcUrl(chainId));
        return await backupLogsProvider.getLogs(filter);
      }

      throw new Error('Log response size exceeded');
    }

    return data.result.map(formatEtherscanEvent);
  }
}

const prepareGetLatestBlockQuery = (chainId: number, apiKey?: string, platform?: EtherscanPlatform) => {
  const timestamp = Math.floor(Date.now() / 1000);

  const query = {
    chainId: String(chainId),
    module: 'block',
    action: 'getblocknobytime',
    timestamp: String(timestamp),
    closest: 'before',
    // The new Blockscout API uses the 'apikey' parameter instead of 'apiKey'
    apiKey: platform?.domain === 'blockscout' ? undefined : apiKey,
    apikey: platform?.domain === 'blockscout' ? apiKey : undefined,
  };

  // Remove 'undefined' values from the query
  return JSON.parse(JSON.stringify(query));
};

const prepareGetLogsQuery = (chainId: number, filter: Filter, apiKey?: string, platform?: EtherscanPlatform) => {
  const [topic0, topic1, topic2, topic3] = (filter.topics ?? []).map((topic) =>
    typeof topic === 'string' ? topic.toLowerCase() : topic,
  );

  const query = {
    chainId: String(chainId),
    module: 'logs',
    action: 'getLogs',
    address: filter.address ?? undefined,
    fromBlock: String(filter.fromBlock ?? 0),
    toBlock: String(filter.toBlock ?? 'latest'),
    topic0: topic0 ?? undefined,
    topic1: topic1 ?? undefined,
    topic2: topic2 ?? undefined,
    topic3: topic3 ?? undefined,
    topic0_1_opr: topic0 && topic1 ? 'and' : undefined,
    topic0_2_opr: topic0 && topic2 ? 'and' : undefined,
    topic0_3_opr: topic0 && topic3 ? 'and' : undefined,
    topic1_2_opr: topic1 && topic2 ? 'and' : undefined,
    topic1_3_opr: topic1 && topic3 ? 'and' : undefined,
    topic2_3_opr: topic2 && topic3 ? 'and' : undefined,
    offset: String(1000),
    page: String(1),
    // The new Blockscout API uses the 'apikey' parameter instead of 'apiKey'
    apiKey: platform?.domain === 'blockscout' ? undefined : apiKey,
    apikey: platform?.domain === 'blockscout' ? apiKey : undefined,
  };

  // Remove 'undefined' values from the query
  return JSON.parse(JSON.stringify(query));
};

const formatEtherscanEvent = (etherscanLog: EtherscanLog): Log => ({
  address: getAddress(etherscanLog.address),
  topics: etherscanLog.topics.filter((topic: string) => !isNullish(topic)) as [topic0: Hex, ...rest: Hex[]],
  data: etherscanLog.data,
  transactionHash: etherscanLog.transactionHash,
  blockNumber: Number(etherscanLog.blockNumber) || 0,
  transactionIndex: Number(etherscanLog.transactionIndex) || 0,
  logIndex: Number(etherscanLog.logIndex) || 0,
  timestamp: Number(etherscanLog.timeStamp) || undefined,
});

// One rate-paced explorer client per chain; retries re-enter the chain's request queue
export const createExplorerClients = (chainIds: readonly number[]): { [chainId: number]: KyInstance } => {
  const clientEntries = chainIds.map((chainId) => [
    chainId,
    createExplorerKy(new RequestQueue(getChainApiIdentifer(chainId), getChainApiRateLimit(chainId))),
  ]);

  return Object.fromEntries(clientEntries);
};

// Some explorer APIs (e.g. PulseChain) sit behind a WAF that returns 502 for requests that lack the
// browser fetch-metadata headers, since server-side fetch does not send them. Including this header
// makes the request look like a browser request and is harmless for explorers that do not check it.
const EXPLORER_REQUEST_HEADERS = { 'Sec-Fetch-Site': 'none' };

export const createExplorerKy = (queue: RequestQueue): KyInstance => {
  return ky.extend({
    retry: { limit: 5 },
    headers: EXPLORER_REQUEST_HEADERS,
    fetch: (input, options) => queue.add(() => kyQueue.add(() => fetch(input, options))),
    hooks: {
      afterResponse: [convertRateLimitBodyTo429],
    },
  });
};

// Rate-limit messages are tiny, so anything larger cannot be one; this avoids reading
// multi-megabyte log responses a second time just to sniff them.
const RATE_LIMIT_BODY_SNIFF_MAX_BYTES = 4096;

const RATE_LIMIT_BODY_MARKERS = ['max rate limit reached', 'max calls per sec rate limit reached', 'too many requests'];

const convertRateLimitBodyTo429 = async ({ response }: { response: Response }): Promise<Response | undefined> => {
  if (!response.ok) return;

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > RATE_LIMIT_BODY_SNIFF_MAX_BYTES) return;

  const body = await response.clone().text();
  if (body.length > RATE_LIMIT_BODY_SNIFF_MAX_BYTES) return;

  const lowercaseBody = body.toLowerCase();
  if (RATE_LIMIT_BODY_MARKERS.some((marker) => lowercaseBody.includes(marker))) {
    return new Response(body, { status: 429, statusText: 'Too Many Requests', headers: response.headers });
  }
};
