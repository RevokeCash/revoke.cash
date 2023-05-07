import { providers as multicall } from '@0xsequence/multicall';
import type { ChainProviderFn, FallbackProviderConfig } from '@wagmi/core';
import type { Chain } from 'wagmi/chains';
import { getChainProvider } from './chains';

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

export function revokeProvider<TChain extends Chain = Chain>({
  priority,
  stallTimeout,
  weight,
}: FallbackProviderConfig = {}): ChainProviderFn<TChain, multicall.MulticallProvider> {
  return function (chain) {
    return {
      chain,
      provider: () => {
        const rpcProvider = getChainProvider(chain.id);
        const multicallProvider = new multicall.MulticallProvider(rpcProvider, { verbose: true });
        const providerProxy = createMulticallProviderProxy(multicallProvider);

        return Object.assign(providerProxy, { priority, stallTimeout, weight });
      },
    };
  };
}
