import { providers } from 'ethers';
import { BackendProvider } from 'lib/providers';
import { getChainLogsRpcUrl, isBackendSupportedChain } from 'lib/utils/chains';

interface Props {
  chainId?: number;
}

export const useLogsProvider = ({ chainId }: Props) => {
  const rpcUrl = getChainLogsRpcUrl(chainId);
  const rpcProvider = new providers.JsonRpcProvider(rpcUrl, chainId);
  const backendProvider = new BackendProvider(chainId);
  return isBackendSupportedChain(chainId) ? backendProvider : rpcProvider;
};
