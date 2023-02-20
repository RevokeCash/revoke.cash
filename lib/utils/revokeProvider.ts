import { providers as multicall } from '@0xsequence/multicall';
import type { ChainProviderFn, FallbackProviderConfig } from '@wagmi/core';
import { providers } from 'ethers';
import type { Chain } from 'wagmi/chains';
import { getChainRpcUrl } from './chains';

export const createMulticallProviderProxy = (
  multicallProvider: multicall.MulticallProvider
): multicall.MulticallProvider => {
  const handler = {
    get: (target: any, prop: string) => {
      if (prop in target && !!target[prop]) {
        return target[prop];
      } else {
        return Reflect.get(target.provider, prop);
      }
    },
  };

  return new Proxy(multicallProvider, handler);
};

// TODO: Use injected provider if available
// const getInjectedProvider = (chain: Chain) => {
//   if (typeof window === 'undefined') return undefined;
//   if (!window.ethereum) return undefined;
//   if (Number((window as any).ethereum.chainId) !== chain.id) return undefined;
//   return new providers.Web3Provider(window.ethereum, chain.id);
// }

export function revokeProvider<TChain extends Chain = Chain>({
  priority,
  stallTimeout,
  weight,
}: FallbackProviderConfig = {}): ChainProviderFn<TChain, multicall.MulticallProvider> {
  return function (chain) {
    return {
      chain,
      provider: () => {
        // const web3Provider = getInjectedProvider(chain);

        const rpcUrl = getChainRpcUrl(chain.id, process.env.NEXT_PUBLIC_INFURA_API_KEY);
        const rpcProvider = new providers.JsonRpcProvider(rpcUrl, chain.id);

        const multicallProvider = new multicall.MulticallProvider(rpcProvider, { verbose: true });
        const providerProxy = createMulticallProviderProxy(multicallProvider);

        return Object.assign(providerProxy, { priority, stallTimeout, weight });
      },
    };
  };
}
