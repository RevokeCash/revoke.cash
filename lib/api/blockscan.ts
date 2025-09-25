import { getChainApiKey, getChainApiUrl } from 'lib/utils/chains';
import type { Hex } from 'viem';

interface EtherscanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}

export const getTransactions = async (
  chainId: number,
  address: Hex,
  startBlock: number,
  endBlock: number,
): Promise<EtherscanTransaction[]> => {
  const apiKey = getChainApiKey(chainId);
  const apiUrl = getChainApiUrl(chainId);

  if (!apiUrl) {
    throw new Error('API URL is not available for this chain');
  }

  const params = {
    address,
    page: '1',
    sort: 'asc',
    action: 'txlist',
    module: 'account',
    chainid: String(chainId),
    apikey: apiKey as string,
    endblock: endBlock.toString(),
    startblock: startBlock.toString(),
  };

  const response = await fetch(`${apiUrl}?${new URLSearchParams(params)}`);
  const data = await response.json();

  if (data.status !== '1' || !Array.isArray(data.result)) {
    throw new Error(`Failed to fetch transactions: ${data.message || 'Unknown error'}`);
  }

  return data.result as EtherscanTransaction[];
};
