import { ChainId, chains } from 'eth-chains';
import {
  COVALENT_SUPPORTED_CHAINS,
  ETHERSCAN_SUPPORTED_CHAINS,
  NODE_SUPPORTED_CHAINS,
  PROVIDER_SUPPORTED_CHAINS,
} from 'lib/constants';

export function isSupportedChain(chainId: number): boolean {
  return isProviderSupportedChain(chainId) || isBackendSupportedChain(chainId);
}

export function isProviderSupportedChain(chainId: number): boolean {
  return PROVIDER_SUPPORTED_CHAINS.includes(chainId);
}

export function isBackendSupportedChain(chainId: number): boolean {
  return isCovalentSupportedChain(chainId) || isEtherscanSupportedChain(chainId) || isNodeSupportedChain(chainId);
}

export function isCovalentSupportedChain(chainId: number): boolean {
  return COVALENT_SUPPORTED_CHAINS.includes(chainId);
}

export function isEtherscanSupportedChain(chainId: number): boolean {
  return ETHERSCAN_SUPPORTED_CHAINS.includes(chainId);
}

export function isNodeSupportedChain(chainId: number): boolean {
  return NODE_SUPPORTED_CHAINS.includes(chainId);
}

export const getChainName = (chainId: number): string => {
  const overrides = {
    [ChainId.EthereumMainnet]: 'Ethereum',
    [ChainId.BinanceSmartChainMainnet]: 'Binance Smart Chain',
    [ChainId['AvalancheC-Chain']]: 'Avalanche',
    [ChainId.PolygonMainnet]: 'Polygon',
    [ChainId.ArbitrumOne]: 'Arbitrum',
    [ChainId.CronosMainnetBeta]: 'Cronos',
    [ChainId.FantomOpera]: 'Fantom',
    [ChainId.KlaytnMainnetCypress]: 'Klaytn',
    [ChainId.KlaytnTestnetBaobab]: 'Klaytn Baobab',
    [ChainId.AuroraMainnet]: 'Aurora',
    [ChainId.CeloMainnet]: 'Celo',
    [ChainId.HuobiECOChainMainnet]: 'HECO',
    [ChainId.RSKMainnet]: 'RSK',
    [ChainId.MetisAndromedaMainnet]: 'Metis',
    [ChainId.TelosEVMMainnet]: 'Telos',
    [ChainId.IoTeXNetworkMainnet]: 'IoTeX',
    [ChainId.IoTeXNetworkTestnet]: 'IoTeX Testnet',
    [ChainId.HarmonyMainnetShard0]: 'Harmony',
    [ChainId.HarmonyTestnetShard0]: 'Harmony Testnet',
    [ChainId.GodwokenMainnet]: 'Godwoken',
    [ChainId['GodwokenTestnet(V1.1)']]: 'Godwoken Testnet',
    [ChainId.SmartBitcoinCash]: 'SmartBCH',
    [ChainId.FuseMainnet]: 'Fuse',
    [ChainId.SyscoinMainnet]: 'Syscoin',
    [ChainId.CLVParachain]: 'CLV',
    [ChainId.BitTorrentChainMainnet]: 'BTT Chain',
    [ChainId.Goerli]: 'Goerli',
    [ChainId.BinanceSmartChainTestnet]: 'BSC Testnet',
    [ChainId.AvalancheFujiTestnet]: 'Avalanche Fuji',
    [ChainId.Mumbai]: 'Polygon Mumbai',
    [ChainId.OptimisticEthereumTestnetGoerli]: 'Optimism Goerli',
    [421613]: 'Arbitrum Goerli',
    [ChainId.CeloAlfajoresTestnet]: 'Celo Alfajores',
    [ChainId.HuobiECOChainTestnet]: 'HECO Testnet',
    [ChainId.MetisStardustTestnet]: 'Metis Stardust',
    [ChainId.TelosEVMTestnet]: 'Telos Testnet',
    [ChainId.SmartBitcoinCashTestnet]: 'SmartBCH Testnet',
    [ChainId.SyscoinTanenbaumTestnet]: 'Syscoin Tenenbaum',
    [ChainId.BitTorrentChainTestnet]: 'BTTC Testnet',
    [ChainId.EmeraldParatimeMainnet]: 'Oasis Emerald',
    [ChainId.EmeraldParatimeTestnet]: 'Oasis Testnet',
  };

  return overrides[chainId] ?? chains.get(chainId)?.name ?? `Chain with ID ${chainId}`;
};

export function getChainExplorerUrl(chainId: number): string | undefined {
  const overrides = {
    [ChainId.SmartBitcoinCash]: 'https://smartscan.cash',
    [ChainId.Moonbeam]: 'https://moonbeam.moonscan.io',
    [ChainId.Moonriver]: 'https://moonriver.moonscan.io',
    [ChainId.CeloMainnet]: 'https://celoscan.io',
    [ChainId.CeloAlfajoresTestnet]: 'https://alfajores.celoscan.io',
    [ChainId.AuroraMainnet]: 'https://aurorascan.dev',
    [ChainId.AuroraTestnet]: 'https://testnet.aurorascan.dev',
    [ChainId.BitTorrentChainMainnet]: 'https://bttcscan.com',
    [ChainId.BitTorrentChainTestnet]: 'https://testnet.bttcscan.com',
    [ChainId.CLVParachain]: 'https://clvscan.com',
    [ChainId.SyscoinTanenbaumTestnet]: 'https://tanenbaum.io',
    [ChainId.SyscoinMainnet]: 'https://explorer.syscoin.org',
    [ChainId.Astar]: 'https://blockscout.com/astar',
    [ChainId.Gnosis]: 'https://gnosisscan.io',
    [421613]: 'https://goerli.arbiscan.io',
  };

  const [explorer] = chains.get(chainId)?.explorers ?? [];

  return overrides[chainId] ?? explorer?.url;
}

export function getChainRpcUrl(chainId: number, infuraKey: string = ''): string | undefined {
  // These are not in the eth-chains package, so manually got from chainlist.org
  const overrides = {
    [ChainId.ArbitrumOne]: 'https://arb1.arbitrum.io/rpc',
    [421613]: 'https://goerli-rollup.arbitrum.io/rpc',
    [ChainId.Moonbeam]: 'https://moonbeam.public.blastapi.io',
    [ChainId.Sepolia]: `https://sepolia.infura.io/v3/${infuraKey}`,
  };

  const [rpcUrl] = chains.get(chainId)?.rpc ?? [];
  return overrides[chainId] ?? rpcUrl?.replace('${INFURA_API_KEY}', infuraKey);
}

export const getChainInfoUrl = (chainId: number): string | undefined => {
  const overrides = {
    [ChainId.Gnosis]: 'https://www.gnosischain.com/evm',
    [ChainId.CeloMainnet]: 'https://celo.org',
  };

  return overrides[chainId] ?? chains.get(chainId)?.infoURL;
};

export const getChainTrustWalletName = (chainId: number): string | undefined => {
  const mapping = {
    [ChainId.ArbitrumOne]: 'arbitrum',
    [ChainId.AuroraMainnet]: 'aurora',
    [ChainId['AvalancheC-Chain']]: 'avalanchec',
    [ChainId.CeloMainnet]: 'celo',
    [ChainId.EthereumClassicMainnet]: 'classic',
    [ChainId.CronosMainnetBeta]: 'cronos',
    [ChainId.EthereumMainnet]: 'ethereum',
    [ChainId.FantomOpera]: 'fantom',
    [ChainId.HarmonyMainnetShard0]: 'harmony',
    [ChainId.HuobiECOChainMainnet]: 'heco',
    [ChainId.IoTeXNetworkMainnet]: 'iotex',
    [ChainId.Optimism]: 'optimism',
    [ChainId.PolygonMainnet]: 'polygon',
    [ChainId.BinanceSmartChainMainnet]: 'smartchain',
    [ChainId.Gnosis]: 'xdai',
  };

  return mapping[chainId];
};

export const getChainLogo = (chainId: number): string => {
  const mapping = {
    [ChainId.EthereumMainnet]: '/assets/images/vendor/chains/ethereum.png',
    [ChainId.Goerli]: '/assets/images/vendor/chains/ethereum.png',
    [ChainId.Sepolia]: '/assets/images/vendor/chains/ethereum.png',
    [ChainId.TelosEVMMainnet]: '/assets/images/vendor/chains/telos.png',
    [ChainId.TelosEVMTestnet]: '/assets/images/vendor/chains/telos.png',
    [ChainId.Gnosis]: '/assets/images/vendor/chains/gnosis-chain.png',
    [ChainId.MetisAndromedaMainnet]: '/assets/images/vendor/chains/metis.png',
    [ChainId.MetisStardustTestnet]: '/assets/images/vendor/chains/metis.png',
    [ChainId.SmartBitcoinCash]: '/assets/images/vendor/chains/smartbch.png',
    [ChainId.SmartBitcoinCashTestnet]: '/assets/images/vendor/chains/smartbch.png',
    [ChainId.FuseMainnet]: '/assets/images/vendor/chains/fuse.png',
    [ChainId.FuseSparknet]: '/assets/images/vendor/chains/fuse.png',
    [ChainId.BinanceSmartChainMainnet]: '/assets/images/vendor/chains/binance.png',
    [ChainId.BinanceSmartChainTestnet]: '/assets/images/vendor/chains/binance.png',
    [ChainId.PolygonMainnet]: '/assets/images/vendor/chains/polygon.png',
    [ChainId.Mumbai]: '/assets/images/vendor/chains/polygon.png',
    [ChainId['AvalancheC-Chain']]: '/assets/images/vendor/chains/avalanche.png',
    [ChainId.AvalancheFujiTestnet]: '/assets/images/vendor/chains/avalanche.png',
    [ChainId.FantomOpera]: '/assets/images/vendor/chains/fantom.png',
    [ChainId.FantomTestnet]: '/assets/images/vendor/chains/fantom.png',
    [ChainId.ArbitrumOne]: '/assets/images/vendor/chains/arbitrum.svg',
    [421613]: '/assets/images/vendor/chains/arbitrum.svg', // Arbitrum Goerli
    [ChainId.HuobiECOChainMainnet]: '/assets/images/vendor/chains/heco.png',
    [ChainId.HuobiECOChainTestnet]: '/assets/images/vendor/chains/heco.png',
    [ChainId.Moonbeam]: '/assets/images/vendor/chains/moonbeam.png',
    [ChainId.Moonriver]: '/assets/images/vendor/chains/moonriver.png',
    [ChainId.MoonbaseAlpha]: '/assets/images/vendor/chains/moonbeam.png',
    [ChainId.CronosMainnetBeta]: '/assets/images/vendor/chains/cronos.jpeg',
    [ChainId.CronosTestnet]: '/assets/images/vendor/chains/cronos.jpeg',
    [ChainId.RSKMainnet]: '/assets/images/vendor/chains/rootstock.png',
    [ChainId.RSKTestnet]: '/assets/images/vendor/chains/rootstock.png',
    [ChainId.HarmonyMainnetShard0]: '/assets/images/vendor/chains/harmony.png',
    [ChainId.HarmonyTestnetShard0]: '/assets/images/vendor/chains/harmony.png',
    [ChainId.IoTeXNetworkMainnet]: '/assets/images/vendor/chains/iotex.png',
    [ChainId.IoTeXNetworkTestnet]: '/assets/images/vendor/chains/iotex.png',
    [ChainId.KlaytnMainnetCypress]: '/assets/images/vendor/chains/klaytn.png',
    [ChainId.KlaytnTestnetBaobab]: '/assets/images/vendor/chains/klaytn.png',
    [ChainId.Palm]: '/assets/images/vendor/chains/palm.jpeg',
    [ChainId.PalmTestnet]: '/assets/images/vendor/chains/palm.jpeg',
    [ChainId.Optimism]: '/assets/images/vendor/chains/optimism.jpeg',
    [ChainId.OptimisticEthereumTestnetGoerli]: '/assets/images/vendor/chains/optimism.jpeg',
    [ChainId.Evmos]: '/assets/images/vendor/chains/evmos.png',
    [ChainId.EvmosTestnet]: '/assets/images/vendor/chains/evmos.png',
    [ChainId.CeloMainnet]: '/assets/images/vendor/chains/celo.png',
    [ChainId.CeloAlfajoresTestnet]: '/assets/images/vendor/chains/celo.png',
    [ChainId.AuroraMainnet]: '/assets/images/vendor/chains/aurora.jpeg',
    [ChainId.AuroraTestnet]: '/assets/images/vendor/chains/aurora.jpeg',
    [ChainId.BitTorrentChainMainnet]: '/assets/images/vendor/chains/btt.svg',
    [ChainId.BitTorrentChainTestnet]: '/assets/images/vendor/chains/btt.svg',
    [ChainId.CLVParachain]: '/assets/images/vendor/chains/clover.jpeg',
    [ChainId.SyscoinTanenbaumTestnet]: '/assets/images/vendor/chains/syscoin.png',
    [ChainId.SyscoinMainnet]: '/assets/images/vendor/chains/syscoin.png',
    [ChainId.Astar]: '/assets/images/vendor/chains/astar.png',
    [ChainId.Shiden]: '/assets/images/vendor/chains/shiden.svg',
    [ChainId.GodwokenMainnet]: '/assets/images/vendor/chains/godwoken.png',
    [ChainId['GodwokenTestnet(V1.1)']]: '/assets/images/vendor/chains/godwoken.png',
    [ChainId.EmeraldParatimeMainnet]: '/assets/images/vendor/chains/oasis.png',
    [ChainId.EmeraldParatimeTestnet]: '/assets/images/vendor/chains/oasis.png',
  };

  return mapping[chainId] ?? '/assets/images/vendor/chains/ethereum.png';
};

export const getChainNativeToken = (chainId: number): string => chains.get(chainId)?.nativeCurrency?.symbol ?? 'ETH';

// Target a default of around $10-20
export const getDefaultDonationAmount = (nativeToken: string): string => {
  const mapping = {
    ETH: '0.01',
    RBTC: '0.001',
    BCH: '0.1',
    BNB: '0.05',
    xDAI: '15',
    MATIC: '15',
    AVAX: '1',
    TLOS: '100',
    METIS: '0.5',
    FUSE: '100',
    FTM: '50',
    ONE: '1000',
    HT: '2',
    SDN: '50',
    GLMR: '30',
    MOVR: '1',
    IOTX: '500',
    KLAYTN: '50',
    ROSE: '100',
    CRO: '100',
    EVMOS: '10',
    CELO: '20',
    BTT: '20000000',
    CLV: '200',
    SYS: '100',
    ASTR: '300',
    CKB: '1000', // Godwoken
  };

  return mapping[nativeToken] ?? '1';
};
