import { providers } from 'ethers';
import { BackendProvider } from 'lib/providers';
import { getChainRpcUrl, isBackendSupportedChain } from 'lib/utils/chains';

interface Props {
  chainId?: number;
}

export const useLogsProvider = ({ chainId }: Props) => {
  // The "logs provider" is a wallet-independent provider that is used to retrieve logs
  // to ensure that custom RPCs don't break Revoke.cash functionality.
  const rpcUrl = getLogsProviderUrl(chainId);
  const rpcProvider = new providers.JsonRpcProvider(rpcUrl, chainId);
  const backendProvider = new BackendProvider(chainId);
  return isBackendSupportedChain(chainId) ? backendProvider : rpcProvider;
};

const getLogsProviderUrl = (chainId: number) => {
  // If an Infura API key is set, it should *always* be used for mainnet, even if the "regular" RPC URL is overridden
  // with the NEXT_PUBLIC_RPC_URLS environment variable. This is because Infura is the most reliable provider for logs.
  if (chainId === 1 && process.env.NEXT_PUBLIC_INFURA_API_KEY) {
    return `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`;
  }

  return getChainRpcUrl(chainId, process.env.NEXT_PUBLIC_INFURA_API_KEY);
};
