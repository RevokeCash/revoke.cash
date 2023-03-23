import { providers } from 'ethers';
import { BackendProvider } from 'lib/providers';
import { getChainLogsRpcUrl, isBackendSupportedChain } from 'lib/utils/chains';

interface Props {
  chainId?: number;
}

export const useLogsProvider = ({ chainId }: Props) => {
  // The "logs provider" is a wallet-independent provider that is used to retrieve logs
  // to ensure that custom RPCs don't break Revoke.cash functionality.
  const rpcUrl = getChainLogsRpcUrl(chainId, process.env.NEXT_PUBLIC_INFURA_API_KEY);
  const rpcProvider = new providers.JsonRpcProvider(rpcUrl, chainId);
  const backendProvider = new BackendProvider(chainId);
  return isBackendSupportedChain(chainId) ? backendProvider : rpcProvider;
};
