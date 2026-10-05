import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import { getChainApiKey, getChainApiUrl } from '@revoke.cash/core/chains';
import { createExplorerClients } from '@revoke.cash/core/events/getters';
import type { Address, Hash } from 'viem';

const EXPLORER_PAGE_SIZE = 1000;

// Etherscan refuses pages past the first 10,000 results (page x offset), so longer lists continue in a new window
const EXPLORER_RESULT_WINDOW = 10_000;

// Admin reports only read the auto-revoke chains, so only those chains have a client
const EXPLORER_CLIENTS = createExplorerClients(AUTO_REVOKE_SUPPORTED_CHAINS);

export interface ExplorerTransaction {
  hash: Hash;
  blockNumber: string;
  timeStamp: string;
  from: Address;
  // Empty for contract creations
  to: string;
  value: string;
  isError: string;
}

interface ExplorerResponse<T> {
  status: string;
  message: string;
  // An error message instead of the result when the request failed
  result: T | string;
}

export interface BlockRange {
  startBlock: number;
  endBlock: number;
}

export const getBlockRange = async (chainId: number, from: Date, to: Date): Promise<BlockRange> => {
  const [startBlock, endBlock] = await Promise.all([
    getBlockNumberByTime(chainId, from, 'after'),
    getBlockNumberByTime(chainId, to, 'before'),
  ]);

  return { startBlock, endBlock };
};

const getBlockNumberByTime = async (chainId: number, time: Date, closest: 'before' | 'after'): Promise<number> => {
  const response = await EXPLORER_CLIENTS[chainId]
    .get(getChainApiUrl(chainId)!, {
      searchParams: {
        chainid: chainId,
        module: 'block',
        action: 'getblocknobytime',
        timestamp: Math.floor(time.getTime() / 1000),
        closest,
        apikey: getChainApiKey(chainId),
      },
    })
    .json<ExplorerResponse<string | { blockNumber: string } | null>>();

  // Blockscout wraps the block number in an object, where Etherscan returns it directly
  const blockNumber = Number(typeof response.result === 'object' ? response.result?.blockNumber : response.result);
  if (!Number.isInteger(blockNumber)) {
    // Etherscan puts the error in the result, Blockscout in the message
    const errorMessage = typeof response.result === 'string' ? response.result : response.message;
    throw new Error(`Failed to look up block by time on chain ${chainId}: ${errorMessage}`);
  }

  return blockNumber;
};

export const fetchExplorerTransactions = async (
  chainId: number,
  action: 'txlist' | 'txlistinternal',
  address: Address,
  blockRange: BlockRange,
): Promise<ExplorerTransaction[]> => {
  const windowTransactions = await fetchExplorerTransactionPages(chainId, action, address, blockRange);
  if (windowTransactions.length < EXPLORER_RESULT_WINDOW) return windowTransactions;

  // A full window can end halfway through its last block, so that block is fetched again in full by the next window
  const lastBlockNumber = Number(windowTransactions.at(-1)!.blockNumber);
  const nextWindowTransactions = await fetchExplorerTransactions(chainId, action, address, {
    startBlock: lastBlockNumber,
    endBlock: blockRange.endBlock,
  });

  return [
    ...windowTransactions.filter((transaction) => Number(transaction.blockNumber) < lastBlockNumber),
    ...nextWindowTransactions,
  ];
};

const fetchExplorerTransactionPages = async (
  chainId: number,
  action: 'txlist' | 'txlistinternal',
  address: Address,
  blockRange: BlockRange,
  page: number = 1,
): Promise<ExplorerTransaction[]> => {
  const response = await EXPLORER_CLIENTS[chainId]
    .get(getChainApiUrl(chainId)!, {
      searchParams: {
        chainid: chainId,
        module: 'account',
        action,
        address,
        startblock: blockRange.startBlock,
        endblock: blockRange.endBlock,
        page,
        offset: EXPLORER_PAGE_SIZE,
        sort: 'asc',
        apikey: getChainApiKey(chainId),
      },
    })
    .json<ExplorerResponse<ExplorerTransaction[]>>();

  // An empty result is still an array (with the message "No transactions found"), so a string is always an error
  if (!Array.isArray(response.result)) {
    throw new Error(`Failed to fetch ${action} for ${address} on chain ${chainId}: ${response.result}`);
  }

  if (response.result.length < EXPLORER_PAGE_SIZE || page * EXPLORER_PAGE_SIZE >= EXPLORER_RESULT_WINDOW) {
    return response.result;
  }

  const nextPageTransactions = await fetchExplorerTransactionPages(chainId, action, address, blockRange, page + 1);
  return [...response.result, ...nextPageTransactions];
};

export const getExplorerWalletBalance = async (
  chainId: number,
  address: Address,
  blockNumber: number,
): Promise<bigint> => {
  const response = await EXPLORER_CLIENTS[chainId]
    .get(getChainApiUrl(chainId)!, {
      searchParams: {
        chainid: chainId,
        module: 'account',
        action: 'balancehistory',
        address,
        blockno: blockNumber,
        apikey: getChainApiKey(chainId),
      },
    })
    .json<ExplorerResponse<string>>();

  if (response.status !== '1') {
    throw new Error(`Failed to fetch the balance of ${address} on chain ${chainId}: ${response.result}`);
  }

  return BigInt(response.result);
};
