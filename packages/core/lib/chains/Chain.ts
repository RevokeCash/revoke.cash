import { ChainId } from '@revoke.cash/core/chains/ids';
import { ETHERSCAN_API_KEYS, ETHERSCAN_RATE_LIMITS, RPC_OVERRIDES, SITE_URL } from '@revoke.cash/core/constants';
import type { EtherscanPlatform, RateLimit } from '@revoke.cash/core/types';
import { isNullish } from '@revoke.cash/core/utils';
import { SECOND } from '@revoke.cash/core/utils/time';
import {
  type AddEthereumChainParameter,
  type ChainContract,
  createPublicClient,
  defineChain,
  http,
  type PublicClient,
  type Chain as ViemChain,
} from 'viem';
import { chainConfig as opStackChainConfig } from 'viem/op-stack';

export interface ChainOptions {
  type: SupportType;
  chainId: number;
  name: string;
  logoUrl: string;
  infoUrl: string;
  nativeCurrency: NativeCurrency;
  nativeTokenCoingeckoId?: string;
  coingeckoNetworkId?: string;
  explorerUrl: string;
  etherscanCompatibleApiUrl?: string;
  rpc: {
    main: string;
    logs?: string;
    traces?: string;
    free?: string;
  };
  deployedContracts?: DeployedContracts;
  isTestnet?: boolean;
  isCanary?: boolean;
  isOpStack?: boolean;
  correspondingMainnetChainId?: number;
}

export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export type DeployedContracts = Record<string, ChainContract>;

export enum SupportType {
  PROVIDER = 'PROVIDER',
  HYPERSYNC = 'HYPERSYNC',
  ETHERSCAN = 'ETHERSCAN',
  BLOCKSCOUT = 'BLOCKSCOUT', // Note that this is mostly Etherscan Compatible, with slight differences in the API
  ROUTESCAN = 'ROUTESCAN', // Note that this is fully Etherscan Compatible, just for identification
  COVALENT = 'COVALENT',
  BACKEND_NODE = 'BACKEND_NODE',
  BACKEND_CUSTOM = 'BACKEND_CUSTOM',
  UNSUPPORTED = 'UNSUPPORTED',
}

export class Chain {
  chainId: number;
  type: SupportType;

  constructor(private options: ChainOptions) {
    this.chainId = options.chainId;
    this.type = options.type;
  }

  isSupported(): boolean {
    return this.type !== SupportType.UNSUPPORTED;
  }

  getName(): string {
    if (!this.isSupported()) {
      return `${this.options.name} (Unsupported)`;
    }

    return this.options.name;
  }

  getSlug(): string {
    const chainName = this.getName();
    return chainName
      .toLowerCase()
      .replace(' (unsupported)', '')
      .replace(/\s/g, '-')
      .replace(/\./g, '-')
      .replace(/zerθ/g, 'zero');
  }

  isTestnet(): boolean {
    return this.options.isTestnet ?? false;
  }

  isCanary(): boolean {
    return this.options.isCanary ?? false;
  }

  isOpStack(): boolean {
    return this.options.isOpStack ?? false;
  }

  getLogoUrl(): string {
    return this.options.logoUrl;
  }

  getExplorerUrl(): string {
    return this.options.explorerUrl;
  }

  getRpcUrl(): string {
    return RPC_OVERRIDES[this.chainId] ?? this.options.rpc.main;
  }

  getLogsRpcUrl(): string {
    return this.options.rpc.logs ?? this.getRpcUrl();
  }

  getTracesRpcUrl(): string {
    return this.options.rpc.traces ?? this.getRpcUrl();
  }

  getFreeRpcUrl(): string {
    return this.options.rpc.free ?? this.getRpcUrl();
  }

  getInfoUrl(): string {
    return this.options.infoUrl;
  }

  getNativeToken(): string {
    return this.options.nativeCurrency.symbol;
  }

  getNativeTokenCoingeckoId(): string | undefined {
    return this.options.nativeTokenCoingeckoId ?? (this.getNativeToken() === 'ETH' ? 'ethereum' : undefined);
  }

  getCoingeckoNetworkId(): string | undefined {
    return this.options.coingeckoNetworkId;
  }

  getEtherscanCompatibleApiUrl(): string | undefined {
    if (this.type === SupportType.ROUTESCAN) {
      return `https://api.routescan.io/v2/network/${this.isTestnet() ? 'testnet' : 'mainnet'}/evm/${this.chainId}/etherscan/api`;
    }

    if (this.type === SupportType.BLOCKSCOUT && isNullish(this.options.etherscanCompatibleApiUrl)) {
      return `https://api.blockscout.com/${this.chainId}/api`;
    }

    return this.options.etherscanCompatibleApiUrl ?? 'https://api.etherscan.io/v2/api';
  }

  getEtherscanCompatibleApiKey(): string | undefined {
    const platform = this.getEtherscanCompatiblePlatformNames();
    const subdomainApiKey = ETHERSCAN_API_KEYS[`${platform?.subdomain}.${platform?.domain}`];
    const domainApiKey = ETHERSCAN_API_KEYS[`${platform?.domain}`];
    return subdomainApiKey ?? domainApiKey;
  }

  getEtherscanCompatibleApiRateLimit(): RateLimit {
    const platform = this.getEtherscanCompatiblePlatformNames();
    const subdomainRateLimit = ETHERSCAN_RATE_LIMITS[`${platform?.subdomain}.${platform?.domain}`];
    const domainRateLimit = ETHERSCAN_RATE_LIMITS[`${platform?.domain}`];
    const customRateLimit = subdomainRateLimit ?? domainRateLimit;

    if (customRateLimit) {
      return { interval: 1000, intervalCap: customRateLimit };
    }

    // For all other chains we assume a rate limit of 5 requests per second (which we underestimate as 4/s to be safe)
    // Note that Etherscan requests without an API key are limited to 1 per 5 seconds, so we essentially assume that
    // all chains have an API key (since 1 per 5 seconds would be prohibitively slow for our use case)
    return { interval: 1000, intervalCap: 4 };
  }

  // TODO: Blockscout-hosted chains will all get identified as 'blockscout:undefined'. It is unclear if Blockscout
  // has a single rate limit for all chains or if each chain has its own rate limit. If the former, we're all good,
  // if the latter, we need to add a special case for these chains.
  getEtherscanCompatibleApiIdentifier(): string {
    const platform = this.getEtherscanCompatiblePlatformNames();
    const apiKey = this.getEtherscanCompatibleApiKey();
    return `${platform?.domain}:${apiKey}`;
  }

  getEtherscanCompatiblePlatformNames = (): EtherscanPlatform | undefined => {
    const apiUrl = this.getEtherscanCompatibleApiUrl();
    if (!apiUrl) return undefined;

    const domain = new URL(apiUrl).hostname.split('.').at(-2)!;
    const subdomain = new URL(apiUrl).hostname.split('.').at(-3)?.split('-').at(-1);
    return { domain, subdomain };
  };

  getCorrespondingMainnetChainId(): number | undefined {
    return this.options.correspondingMainnetChainId;
  }

  getDeployedContracts(): DeployedContracts | undefined {
    return this.options.deployedContracts;
  }

  getViemChainConfig(): ViemChain {
    const chainName = this.getName();
    const stackSpecificChainConfig = this.isOpStack() ? opStackChainConfig : undefined;

    return defineChain({
      ...stackSpecificChainConfig,
      id: this.chainId,
      name: chainName,
      network: this.getSlug(),
      nativeCurrency: this.options.nativeCurrency,
      rpcUrls: {
        default: { http: [this.getRpcUrl()] },
        public: { http: [this.getRpcUrl()] },
      },
      blockExplorers: {
        default: {
          name: `${chainName} Explorer`,
          url: this.getExplorerUrl(),
        },
      },
      contracts: { ...stackSpecificChainConfig?.contracts, ...this.getDeployedContracts() },
      testnet: this.isTestnet(),
    });
  }

  getAddEthereumChainParameter(): AddEthereumChainParameter {
    return {
      chainId: String(this.chainId),
      chainName: this.getName(),
      nativeCurrency: this.options.nativeCurrency,
      rpcUrls: [this.getFreeRpcUrl()],
      blockExplorerUrls: [this.getExplorerUrl()],
      iconUrls: [`${SITE_URL}${this.getLogoUrl()}`],
    };
  }

  createViemPublicClient(
    overrideUrl?: string,
    blockNumber?: bigint,
    httpOptions?: { timeout?: number; retryCount?: number },
  ): PublicClient {
    // We noticed that certain chains run out of gas when using the default multicall settings
    const multicallOverrides: Record<number, boolean | { batchSize: number }> = {
      [ChainId.Mantle]: { batchSize: 256 },
      [ChainId.Oasys]: false,
    };

    const transportOverrides: Record<number, any> = {
      // Kasplex's RPC does not handle batch requests properly
      [ChainId.KasplexZkEVM]: { batch: false },
    };

    const shouldUseDeployless = () => {
      const multicall3 = this.getDeployedContracts()?.multicall3;
      if (!multicall3) return true;
      if (isNullish(blockNumber)) return false;
      if (isNullish(multicall3.blockCreated)) return false;
      return BigInt(multicall3.blockCreated) > blockNumber;
    };

    const multicallConfig = shouldUseDeployless() ? { deployless: true } : true;
    const transportOptions = {
      ...(transportOverrides[this.chainId] ?? { batch: { wait: 10, batchSize: 10 } }),
      ...httpOptions,
    };

    return createPublicClient({
      pollingInterval: 4 * SECOND,
      chain: this.getViemChainConfig(),
      transport: http(overrideUrl ?? this.getRpcUrl(), transportOptions),
      batch: { multicall: multicallOverrides[this.chainId] ?? multicallConfig },
    });
  }
}
