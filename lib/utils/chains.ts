import { ChainId, chains } from '@revoke.cash/chains';
import { ETHERSCAN_API_KEYS, ETHERSCAN_RATE_LIMITS, RPC_OVERRIDES } from 'lib/constants';
import { RateLimit } from 'lib/interfaces';

export const PROVIDER_SUPPORTED_CHAINS = [
  ChainId.EthereumMainnet,
  ChainId.Goerli,
  ChainId.Sepolia,
  ChainId.PolygonMainnet,
  ChainId.Mumbai,
  ChainId.Optimism,
  ChainId.OptimismGoerliTestnet,
  ChainId.ArbitrumOne,
  ChainId.ArbitrumGoerli,
  ChainId.MetisAndromedaMainnet,
  ChainId.SmartBitcoinCash,
  ChainId.SyscoinMainnet,
  ChainId.SyscoinTanenbaumTestnet,
  ChainId.EthereumClassicMainnet,
  ChainId.CoinExSmartChainMainnet,
  ChainId.CoinExSmartChainTestnet,
  ChainId.ExosamaNetwork,
  ChainId.ZkSyncEraMainnet,
  ChainId.ZkSyncEraTestnet,
  ChainId.BaseGoerliTestnet,
  ChainId.PolygonzkEVM,
  ChainId.PolygonzkEVMTestnet,
  ChainId.CoreBlockchainMainnet,
  ChainId.KCCMainnet,
  ChainId.PulseChain,
  ChainId.LineaTestnet,
];

export const BLOCKSCOUT_SUPPORTED_CHAINS = [
  ChainId.Canto,
  ChainId.KavaEVM,
  ChainId.RSKMainnet,
  ChainId.OasisEmerald,
  ChainId.FuseMainnet,
  ChainId.Palm,
  ChainId.CallistoMainnet,
  ChainId.NahmiiMainnet,
  ChainId.FlareMainnet,
  ChainId['SongbirdCanary-Network'],
  ChainId.AuroraMainnet,
  ChainId.HorizenGobiTestnet,
  ChainId.PulseChainTestnetv4,
  ChainId.ScrollAlphaTestnet,
  ChainId.RedlightChainMainnet,
  // ChainId.GatherMainnetNetwork,
  ChainId.GatherTestnetNetwork,
  ChainId['Taiko(Alpha-2Testnet)'],
  ChainId.ShimmerEVMTestnet,
  ChainId.OasysMainnet,
  ChainId.ENULSMainnet,
];

export const ETHERSCAN_SUPPORTED_CHAINS = [
  ChainId.BinanceSmartChainMainnet,
  ChainId.BinanceSmartChainTestnet,
  ChainId.Gnosis,
  ChainId.FantomOpera,
  ChainId.FantomTestnet,
  ChainId.ArbitrumNova,
  ChainId['AvalancheC-Chain'],
  ChainId.AvalancheFujiTestnet,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.MoonbaseAlpha,
  ChainId.CronosMainnetBeta,
  ChainId.CronosTestnet,
  ChainId.CeloMainnet,
  ChainId.CeloAlfajoresTestnet,
  ChainId.BitTorrentChainMainnet,
  ...BLOCKSCOUT_SUPPORTED_CHAINS,
];

export const COVALENT_SUPPORTED_CHAINS = [
  ChainId.HarmonyMainnetShard0,
  ChainId.Evmos,
  ChainId.GodwokenMainnet,
  ChainId.BobaNetwork,
  ChainId.Astar,
  ChainId.Shiden,
];

export const NODE_SUPPORTED_CHAINS: number[] = [];

export const SUPPORTED_CHAINS = [
  ...PROVIDER_SUPPORTED_CHAINS,
  ...ETHERSCAN_SUPPORTED_CHAINS,
  ...COVALENT_SUPPORTED_CHAINS,
  ...NODE_SUPPORTED_CHAINS,
];

// Make sure to update these lists when updating the above lists
// Order is loosely based on TVL (as per DeFiLlama)
export const CHAIN_SELECT_MAINNETS = [
  ChainId.EthereumMainnet,
  ChainId.BinanceSmartChainMainnet,
  ChainId.PolygonMainnet,
  ChainId.PolygonzkEVM,
  ChainId.ArbitrumOne,
  ChainId.ArbitrumNova,
  ChainId.Optimism,
  ChainId.ZkSyncEraMainnet,
  ChainId['AvalancheC-Chain'],
  ChainId.FantomOpera,
  ChainId.CronosMainnetBeta,
  ChainId.KavaEVM,
  ChainId.Canto,
  ChainId.CeloMainnet,
  ChainId.RSKMainnet,
  ChainId.Gnosis,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.KCCMainnet,
  ChainId.Astar,
  ChainId.MetisAndromedaMainnet,
  ChainId.AuroraMainnet,
  ChainId['SongbirdCanary-Network'],
  ChainId.BitTorrentChainMainnet,
  ChainId.CoreBlockchainMainnet,
  ChainId.OasisEmerald,
  ChainId.SmartBitcoinCash,
  ChainId.HarmonyMainnetShard0,
  ChainId.BobaNetwork,
  ChainId.CoinExSmartChainMainnet,
  ChainId.FuseMainnet,
  ChainId.OasysMainnet,
  ChainId.Evmos,
  ChainId.SyscoinMainnet,
  ChainId.NahmiiMainnet,
  ChainId.GodwokenMainnet,
  ChainId.CallistoMainnet,
  ChainId.FlareMainnet,
  ChainId.Shiden,
  ChainId.EthereumClassicMainnet,
  ChainId.PulseChain,
  ChainId.ENULSMainnet,
  ChainId.Palm,
  ChainId.ExosamaNetwork,
  ChainId.RedlightChainMainnet,
  // ChainId.GatherMainnetNetwork,
];

export const CHAIN_SELECT_TESTNETS = [
  ChainId.Goerli,
  ChainId.Sepolia,
  ChainId.BinanceSmartChainTestnet,
  ChainId.Mumbai,
  ChainId.PolygonzkEVMTestnet,
  ChainId.ArbitrumGoerli,
  ChainId.OptimismGoerliTestnet,
  ChainId.ZkSyncEraTestnet,
  ChainId.LineaTestnet,
  ChainId.ScrollAlphaTestnet,
  ChainId.BaseGoerliTestnet,
  // ChainId['Taiko(Alpha-2Testnet)'],
  ChainId.AvalancheFujiTestnet,
  ChainId.FantomTestnet,
  ChainId.CronosTestnet,
  ChainId.CeloAlfajoresTestnet,
  ChainId.MoonbaseAlpha,
  ChainId.CoinExSmartChainTestnet,
  ChainId.SyscoinTanenbaumTestnet,
  ChainId.PulseChainTestnetv4,
  ChainId.HorizenGobiTestnet,
  ChainId.GatherTestnetNetwork,
  ChainId.ShimmerEVMTestnet,
];

export const isSupportedChain = (chainId: number): boolean => {
  return isProviderSupportedChain(chainId) || isBackendSupportedChain(chainId);
};

export const isProviderSupportedChain = (chainId: number): boolean => {
  return PROVIDER_SUPPORTED_CHAINS.includes(chainId);
};

export const isBackendSupportedChain = (chainId: number): boolean => {
  return isCovalentSupportedChain(chainId) || isEtherscanSupportedChain(chainId) || isNodeSupportedChain(chainId);
};

export const isCovalentSupportedChain = (chainId: number): boolean => {
  return COVALENT_SUPPORTED_CHAINS.includes(chainId);
};

export const isBlockscoutSupportedChain = (chainId: number): boolean => {
  return BLOCKSCOUT_SUPPORTED_CHAINS.includes(chainId);
};

export const isEtherscanSupportedChain = (chainId: number): boolean => {
  return ETHERSCAN_SUPPORTED_CHAINS.includes(chainId);
};

export const isNodeSupportedChain = (chainId: number): boolean => {
  return NODE_SUPPORTED_CHAINS.includes(chainId);
};

export const getChainName = (chainId: number): string => {
  const overrides: Record<number, string> = {
    [ChainId.EthereumMainnet]: 'Ethereum',
    [ChainId.BinanceSmartChainMainnet]: 'Binance Smart Chain',
    [ChainId['AvalancheC-Chain']]: 'Avalanche',
    [ChainId.PolygonMainnet]: 'Polygon',
    [ChainId.ArbitrumOne]: 'Arbitrum',
    [ChainId.ArbitrumNova]: 'Arbitrum Nova',
    [ChainId.CronosMainnetBeta]: 'Cronos',
    [ChainId.FantomOpera]: 'Fantom',
    [ChainId.KlaytnMainnetCypress]: 'Klaytn',
    [ChainId.KlaytnTestnetBaobab]: 'Klaytn Baobab',
    [ChainId.AuroraMainnet]: 'Aurora',
    [ChainId.CeloMainnet]: 'Celo',
    [ChainId.HuobiECOChainMainnet]: 'HECO',
    [ChainId.RSKMainnet]: 'Rootstock',
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
    [ChainId.OptimismGoerliTestnet]: 'Optimism Goerli',
    [ChainId.ArbitrumGoerli]: 'Arbitrum Goerli',
    [ChainId.CeloAlfajoresTestnet]: 'Celo Alfajores',
    [ChainId.HuobiECOChainTestnet]: 'HECO Testnet',
    [ChainId.MetisStardustTestnet]: 'Metis Stardust',
    [ChainId.TelosEVMTestnet]: 'Telos Testnet',
    [ChainId.SmartBitcoinCashTestnet]: 'SmartBCH Testnet',
    [ChainId.SyscoinTanenbaumTestnet]: 'Syscoin Tenenbaum',
    [ChainId.BitTorrentChainTestnet]: 'BTTC Testnet',
    [ChainId.OasisEmerald]: 'Oasis Emerald',
    [ChainId.OasisEmeraldTestnet]: 'Oasis Testnet',
    [ChainId.EthereumClassicMainnet]: 'Ethereum Classic',
    [ChainId.Canto]: 'Canto',
    [ChainId.KavaEVM]: 'Kava',
    [ChainId.KavaEVMTestnet]: 'Kava Testnet',
    [ChainId.DogechainMainnet]: 'Dogechain',
    [ChainId.DogechainTestnet]: 'Dogechain Testnet',
    [ChainId.CallistoMainnet]: 'Callisto',
    [ChainId.NahmiiMainnet]: 'Nahmii',
    [ChainId.CoinExSmartChainMainnet]: 'CoinEx Smart Chain',
    [ChainId.CoinExSmartChainTestnet]: 'CoinEx Testnet',
    [ChainId.ExosamaNetwork]: 'Exosama',
    [ChainId.FlareMainnet]: 'Flare',
    [ChainId['SongbirdCanary-Network']]: 'Songbird',
    [ChainId.BobaNetwork]: 'Boba',
    [ChainId.HorizenGobiTestnet]: 'Horizen Gobi',
    [ChainId.ZkSyncEraMainnet]: 'zkSync Era',
    [ChainId.ZkSyncEraTestnet]: 'zkSync Era Goerli',
    [ChainId.PolygonzkEVM]: 'Polygon zkEVM',
    [ChainId.PolygonzkEVMTestnet]: 'Polygon Test-zkEVM',
    [ChainId.PulseChain]: 'PulseChain',
    [ChainId.PulseChainTestnetv4]: 'PulseChain Testnet',
    [ChainId.LineaTestnet]: 'Linea Goerli',
    [ChainId.ScrollAlphaTestnet]: 'Scroll Alpha',
    [ChainId.BaseGoerliTestnet]: 'Base Goerli',
    [ChainId.RedlightChainMainnet]: 'Redlight',
    [ChainId.GatherMainnetNetwork]: 'Gather',
    [ChainId.GatherTestnetNetwork]: 'Gather Testnet',
    [ChainId['Taiko(Alpha-2Testnet)']]: 'Taiko Alpha',
    [ChainId.CoreBlockchainMainnet]: 'CORE',
    [ChainId.KCCMainnet]: 'KCC',
    [ChainId.ShimmerEVMTestnet]: 'Shimmer Testnet',
    [ChainId.OasysMainnet]: 'Oasys',
    [ChainId.ENULSMainnet]: 'ENULS',
  };

  const name = overrides[chainId] ?? chains.get(chainId)?.name ?? `Chain ID ${chainId}`;
  if (!isSupportedChain(chainId)) {
    return `${name} (Unsupported)`;
  }

  return name;
};

export const getChainExplorerUrl = (chainId: number): string | undefined => {
  const overrides: Record<number, string> = {
    [ChainId.SmartBitcoinCash]: 'https://smartscan.cash',
    [ChainId.CeloAlfajoresTestnet]: 'https://alfajores.celoscan.io',
    [ChainId.AuroraMainnet]: 'https://explorer.aurora.dev',
    [ChainId.BitTorrentChainMainnet]: 'https://bttcscan.com',
    [ChainId.BitTorrentChainTestnet]: 'https://testnet.bttcscan.com',
    [ChainId.CLVParachain]: 'https://clvscan.com',
    [ChainId.Astar]: 'https://blockscout.com/astar',
    [ChainId.Gnosis]: 'https://gnosisscan.io',
    [ChainId.ArbitrumGoerli]: 'https://goerli.arbiscan.io',
    [ChainId.ArbitrumNova]: 'https://nova.arbiscan.io',
    [ChainId.KavaEVMTestnet]: 'https://explorer.testnet.kava.io',
    [ChainId.PolygonzkEVM]: 'https://zkevm.polygonscan.com',
    [ChainId.PolygonzkEVMTestnet]: 'https://testnet-zkevm.polygonscan.com',
    [ChainId.PulseChain]: 'https://scan.pulsechain.com',
    [ChainId.PulseChainTestnetv4]: 'https://scan.v4.testnet.pulsechain.com',
    [ChainId.LineaTestnet]: 'https://explorer.goerli.linea.build',
    [ChainId.OasysMainnet]: 'https://scan.oasys.games',
    [ChainId.OptimismGoerliTestnet]: 'https://goerli-optimism.etherscan.io',
    [ChainId.FuseMainnet]: 'https://explorer.fuse.io',
    [ChainId.CallistoMainnet]: 'https://explorer.callisto.network',
    [ChainId.GodwokenMainnet]: 'https://www.gwscan.com',
  };

  const [explorer] = chains.get(chainId)?.explorers ?? [];

  return overrides[chainId] ?? explorer?.url;
};

export const getChainRpcUrl = (chainId: number): string | undefined => {
  const infuraKey = process.env.NEXT_PUBLIC_INFURA_API_KEY;
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

  const overrides: Record<number, string> = {
    // [ChainId.EthereumMainnet]: `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.EthereumMainnet]: `https://mainnet.infura.io/v3/${infuraKey}`,
    [ChainId.Goerli]: `https://goerli.infura.io/v3/${infuraKey}`,
    [ChainId.Sepolia]: `https://sepolia.infura.io/v3/${infuraKey}`,
    [ChainId.ArbitrumOne]: `https://arb1.arbitrum.io/rpc`,
    [ChainId.FantomTestnet]: 'https://rpc.ankr.com/fantom_testnet',
    [ChainId.Evmos]: 'https://evmos-evm.publicnode.com',
    [ChainId.Astar]: 'https://evm.astar.network',
    [ChainId.Optimism]: `https://optimism-mainnet.infura.io/v3/${infuraKey}`,
    [ChainId.OptimismGoerliTestnet]: `https://optimism-goerli.infura.io/v3/${infuraKey}`,
    [ChainId.CronosMainnetBeta]: 'https://node.croswap.com/rpc',
    [ChainId.Mumbai]: 'https://polygon-mumbai.blockpi.network/v1/rpc/public',
    [ChainId.LineaTestnet]: `https://consensys-zkevm-goerli-prealpha.infura.io/v3/${infuraKey}`,
    [ChainId.CoreBlockchainMainnet]: 'https://rpc-core.icecreamswap.com',
    ...RPC_OVERRIDES,
  };

  const [rpcUrl] = chains.get(chainId)?.rpc ?? [];
  return overrides[chainId] ?? rpcUrl?.replace('${INFURA_API_KEY}', infuraKey);
};

// We should always use Infura for logs, even if we use a different RPC URL for other purposes
export const getChainLogsRpcUrl = (chainId: number): string | undefined => {
  const infuraKey = process.env.NEXT_PUBLIC_INFURA_API_KEY;
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

  const overrides = {
    // [ChainId.EthereumMainnet]: `https://mainnet.infura.io/v3/${infuraKey}`,
    // [ChainId.Goerli]: `https://goerli.infura.io/v3/${infuraKey}`,
    // [ChainId.Sepolia]: `https://sepolia.infura.io/v3/${infuraKey}`,
    [ChainId.PolygonMainnet]: `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.Mumbai]: `https://polygon-mumbai.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.Optimism]: `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.OptimismGoerliTestnet]: `https://opt-goerli.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.ArbitrumOne]: `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.ArbitrumGoerli]: `https://arb-goerli.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.PolygonzkEVM]: `https://polygonzkevm-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.PolygonzkEVMTestnet]: `https://polygonzkevm-testnet.g.alchemy.com/v2/${alchemyKey}`,
  };

  return overrides[chainId] ?? getChainRpcUrl(chainId);
};

export const getChainLogo = (chainId: number): string => {
  const mapping = {
    [ChainId.EthereumMainnet]: '/assets/images/vendor/chains/ethereum.svg',
    [ChainId.Goerli]: '/assets/images/vendor/chains/ethereum.svg',
    [ChainId.Sepolia]: '/assets/images/vendor/chains/ethereum.svg',
    [ChainId.Gnosis]: '/assets/images/vendor/chains/gnosis.svg',
    [ChainId.MetisAndromedaMainnet]: '/assets/images/vendor/chains/metis.svg',
    [ChainId.MetisStardustTestnet]: '/assets/images/vendor/chains/metis.svg',
    [ChainId.SmartBitcoinCash]: '/assets/images/vendor/chains/smartbch.svg',
    [ChainId.SmartBitcoinCashTestnet]: '/assets/images/vendor/chains/smartbch.svg',
    [ChainId.FuseMainnet]: '/assets/images/vendor/chains/fuse.png',
    [ChainId.FuseSparknet]: '/assets/images/vendor/chains/fuse.png',
    [ChainId.BinanceSmartChainMainnet]: '/assets/images/vendor/chains/bsc.svg',
    [ChainId.BinanceSmartChainTestnet]: '/assets/images/vendor/chains/bsc.svg',
    [ChainId.PolygonMainnet]: '/assets/images/vendor/chains/polygon.svg',
    [ChainId.Mumbai]: '/assets/images/vendor/chains/polygon.svg',
    [ChainId['AvalancheC-Chain']]: '/assets/images/vendor/chains/avalanche.svg',
    [ChainId.AvalancheFujiTestnet]: '/assets/images/vendor/chains/avalanche.svg',
    [ChainId.FantomOpera]: '/assets/images/vendor/chains/fantom.svg',
    [ChainId.FantomTestnet]: '/assets/images/vendor/chains/fantom.svg',
    [ChainId.ArbitrumOne]: '/assets/images/vendor/chains/arbitrum.svg',
    [ChainId.ArbitrumGoerli]: '/assets/images/vendor/chains/arbitrum.svg',
    [ChainId.ArbitrumNova]: '/assets/images/vendor/chains/arbitrum-nova.svg',
    [ChainId.Moonbeam]: '/assets/images/vendor/chains/moonbeam.svg',
    [ChainId.Moonriver]: '/assets/images/vendor/chains/moonriver.svg',
    [ChainId.MoonbaseAlpha]: '/assets/images/vendor/chains/moonbeam.svg',
    [ChainId.CronosMainnetBeta]: '/assets/images/vendor/chains/cronos.svg',
    [ChainId.CronosTestnet]: '/assets/images/vendor/chains/cronos.svg',
    [ChainId.RSKMainnet]: '/assets/images/vendor/chains/rootstock.jpg',
    [ChainId.RSKTestnet]: '/assets/images/vendor/chains/rootstock.jpg',
    [ChainId.HarmonyMainnetShard0]: '/assets/images/vendor/chains/harmony.svg',
    [ChainId.HarmonyTestnetShard0]: '/assets/images/vendor/chains/harmony.svg',
    [ChainId.IoTeXNetworkMainnet]: '/assets/images/vendor/chains/iotex.png',
    [ChainId.IoTeXNetworkTestnet]: '/assets/images/vendor/chains/iotex.png',
    [ChainId.KlaytnMainnetCypress]: '/assets/images/vendor/chains/klaytn.svg',
    [ChainId.KlaytnTestnetBaobab]: '/assets/images/vendor/chains/klaytn.svg',
    [ChainId.Palm]: '/assets/images/vendor/chains/palm.svg',
    [ChainId.PalmTestnet]: '/assets/images/vendor/chains/palm.svg',
    [ChainId.Optimism]: '/assets/images/vendor/chains/optimism.svg',
    [ChainId.OptimismGoerliTestnet]: '/assets/images/vendor/chains/optimism.svg',
    [ChainId.Evmos]: '/assets/images/vendor/chains/evmos.svg',
    [ChainId.EvmosTestnet]: '/assets/images/vendor/chains/evmos.svg',
    [ChainId.CeloMainnet]: '/assets/images/vendor/chains/celo.svg',
    [ChainId.CeloAlfajoresTestnet]: '/assets/images/vendor/chains/celo.svg',
    [ChainId.AuroraMainnet]: '/assets/images/vendor/chains/aurora.svg',
    [ChainId.BitTorrentChainMainnet]: '/assets/images/vendor/chains/bttc.svg',
    [ChainId.BitTorrentChainTestnet]: '/assets/images/vendor/chains/bttc.svg',
    [ChainId.CLVParachain]: '/assets/images/vendor/chains/clover.jpeg',
    [ChainId.SyscoinTanenbaumTestnet]: '/assets/images/vendor/chains/syscoin.svg',
    [ChainId.SyscoinMainnet]: '/assets/images/vendor/chains/syscoin.svg',
    [ChainId.Astar]: '/assets/images/vendor/chains/astar.svg',
    [ChainId.Shiden]: '/assets/images/vendor/chains/shiden.svg',
    [ChainId.GodwokenMainnet]: '/assets/images/vendor/chains/godwoken.png',
    [ChainId.OasisEmerald]: '/assets/images/vendor/chains/oasis.png',
    [ChainId.OasisEmeraldTestnet]: '/assets/images/vendor/chains/oasis.png',
    [ChainId.EthereumClassicMainnet]: '/assets/images/vendor/chains/etc.png',
    [ChainId.Canto]: '/assets/images/vendor/chains/canto.svg',
    [ChainId.KavaEVM]: '/assets/images/vendor/chains/kava.svg',
    [ChainId.KavaEVMTestnet]: '/assets/images/vendor/chains/kava.svg',
    [ChainId.CallistoMainnet]: '/assets/images/vendor/chains/callisto.png',
    [ChainId.NahmiiMainnet]: '/assets/images/vendor/chains/nahmii.svg',
    [ChainId.CoinExSmartChainMainnet]: '/assets/images/vendor/chains/coinex.svg',
    [ChainId.CoinExSmartChainTestnet]: '/assets/images/vendor/chains/coinex.svg',
    [ChainId.ExosamaNetwork]: '/assets/images/vendor/chains/exosama.png',
    [ChainId.FlareMainnet]: '/assets/images/vendor/chains/flare.svg',
    [ChainId['SongbirdCanary-Network']]: '/assets/images/vendor/chains/songbird.svg',
    [ChainId.BobaNetwork]: '/assets/images/vendor/chains/boba.jpeg',
    [ChainId.HorizenGobiTestnet]: '/assets/images/vendor/chains/horizen.png',
    [ChainId.ZkSyncEraMainnet]: '/assets/images/vendor/chains/zksync.jpeg',
    [ChainId.ZkSyncEraTestnet]: '/assets/images/vendor/chains/zksync.jpeg',
    [ChainId.PolygonzkEVM]: '/assets/images/vendor/chains/polygon.svg',
    [ChainId.PolygonzkEVMTestnet]: '/assets/images/vendor/chains/polygon.svg',
    [ChainId.PulseChain]: '/assets/images/vendor/chains/pulsechain.png',
    [ChainId.PulseChainTestnetv4]: '/assets/images/vendor/chains/pulsechain.png',
    [ChainId.LineaTestnet]: '/assets/images/vendor/chains/linea.svg',
    [ChainId.ScrollAlphaTestnet]: '/assets/images/vendor/chains/scroll.png',
    [ChainId.BaseGoerliTestnet]: '/assets/images/vendor/chains/base.svg',
    [ChainId.RedlightChainMainnet]: '/assets/images/vendor/chains/redlight.png',
    [ChainId.GatherMainnetNetwork]: '/assets/images/vendor/chains/gather.jpg',
    [ChainId.GatherTestnetNetwork]: '/assets/images/vendor/chains/gather.jpg',
    [ChainId['Taiko(Alpha-2Testnet)']]: '/assets/images/vendor/chains/taiko.svg',
    [ChainId.CoreBlockchainMainnet]: '/assets/images/vendor/chains/core.png',
    [ChainId.KCCMainnet]: '/assets/images/vendor/chains/kcc.svg',
    [ChainId.OasysMainnet]: '/assets/images/vendor/chains/oasys.png',
    [ChainId.ShimmerEVMTestnet]: '/assets/images/vendor/chains/shimmer.svg',
    [ChainId.ENULSMainnet]: '/assets/images/vendor/chains/enuls.svg',
    [ChainId.HuobiECOChainMainnet]: '/assets/images/vendor/chains/heco.svg',
    [ChainId.HuobiECOChainTestnet]: '/assets/images/vendor/chains/heco.svg',
  };

  return mapping[chainId] ?? '/assets/images/vendor/chains/ethereum.svg';
};

export const getChainNativeToken = (chainId: number): string => {
  const overrides = {
    [ChainId.CoinExSmartChainMainnet]: 'CET',
    [ChainId.CoinExSmartChainTestnet]: 'CETT',
  };

  return overrides[chainId] ?? chains.get(chainId)?.nativeCurrency?.symbol ?? 'ETH';
};

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
    ETC: '1',
    CANTO: '100',
    KAVA: '20',
    DOGE: '250',
    CLO: '5000',
    CET: '250',
    SAMA: '500',
    SGB: '1000',
    FLR: '500',
    REDLC: '100',
    GTH: '2500',
    CORE: '10',
    KCS: '2',
    SMR: '250',
    OAS: '100',
    NULS: '50',
    PLS: '100000',
  };

  return mapping[nativeToken] ?? '1';
};

export const getChainApiUrl = (chainId: number): string | undefined => {
  const apiUrls = {
    [ChainId.EthereumMainnet]: 'https://api.etherscan.io/api',
    [ChainId.BinanceSmartChainMainnet]: 'https://api.bscscan.com/api',
    [ChainId.BinanceSmartChainTestnet]: 'https://api-testnet.bscscan.com/api',
    [ChainId.PolygonMainnet]: 'https://api.polygonscan.com/api',
    [ChainId.Mumbai]: 'https://api-testnet.polygonscan.com/api',
    [ChainId['AvalancheC-Chain']]: 'https://api.snowtrace.io/api',
    [ChainId.AvalancheFujiTestnet]: 'https://api-testnet.snowtrace.io/api',
    [ChainId.FantomOpera]: 'https://api.ftmscan.com/api',
    [ChainId.FantomTestnet]: 'https://api-testnet.ftmscan.com/api',
    [ChainId.ArbitrumOne]: 'https://api.arbiscan.io/api',
    [ChainId.ArbitrumGoerli]: 'https://api-goerli.arbiscan.io/api',
    [ChainId.ArbitrumNova]: 'https://api-nova.arbiscan.io/api',
    [ChainId.HuobiECOChainMainnet]: 'https://api.hecoinfo.com/api',
    [ChainId.HuobiECOChainTestnet]: 'https://api-testnet.hecoinfo.com/api',
    [ChainId.Moonbeam]: 'https://api-moonbeam.moonscan.io/api',
    [ChainId.Moonriver]: 'https://api-moonriver.moonscan.io/api',
    [ChainId.MoonbaseAlpha]: 'https://api-moonbase.moonscan.io/api',
    [ChainId.CronosMainnetBeta]: 'https://api.cronoscan.com/api',
    [ChainId.CronosTestnet]: 'https://api-testnet.cronoscan.com/api',
    [ChainId.CeloMainnet]: 'https://api.celoscan.io/api',
    [ChainId.CeloAlfajoresTestnet]: 'https://api-alfajores.celoscan.io/api',
    [ChainId.AuroraMainnet]: 'https://explorer.aurora.dev/api',
    [ChainId.BitTorrentChainMainnet]: 'https://api.bttcscan.com/api',
    [ChainId.BitTorrentChainTestnet]: 'https://api-testnet.bttcscan.com/api',
    [ChainId.CLVParachain]: 'https://api.clvscan.com/api',
    [ChainId.Canto]: 'https://evm.explorer.canto.io/api',
    [ChainId.KavaEVM]: 'https://explorer.kava.io/api',
    [ChainId.KavaEVMTestnet]: 'https://explorer.testnet.kava.io/api',
    [ChainId.RSKMainnet]: 'https://blockscout.com/rsk/mainnet/api',
    [ChainId.OasisEmerald]: 'https://explorer.emerald.oasis.dev/api',
    [ChainId.Evmos]: 'https://evm.evmos.org/api',
    [ChainId.FuseMainnet]: 'https://explorer.fuse.io/api',
    [ChainId.Shiden]: 'https://blockscout.com/shiden/api',
    [ChainId.Astar]: 'https://blockscout.com/astar/api',
    [ChainId.Palm]: 'https://explorer.palm.io/api',
    [ChainId.CallistoMainnet]: 'https://explorer.callisto.network/api',
    [ChainId.NahmiiMainnet]: 'https://explorer.nahmii.io/api',
    [ChainId.FlareMainnet]: 'https://flare-explorer.flare.network/api',
    [ChainId['SongbirdCanary-Network']]: 'https://songbird-explorer.flare.network/api',
    [ChainId.Gnosis]: 'https://api.gnosisscan.io/api',
    [ChainId.HorizenGobiTestnet]: 'https://gobi-explorer.horizen.io/api',
    [ChainId.PulseChain]: 'https://scan.pulsechain.com/api',
    [ChainId.PulseChainTestnetv4]: 'https://scan.v4.testnet.pulsechain.com/api',
    [ChainId.LineaTestnet]: 'https://explorer.goerli.linea.build/api',
    [ChainId.ScrollAlphaTestnet]: 'https://blockscout.scroll.io/api',
    [ChainId.RedlightChainMainnet]: 'https://redlightscan.finance/api',
    [ChainId.GatherMainnetNetwork]: 'https://explorer.gather.network/api',
    [ChainId.GatherTestnetNetwork]: 'https://testnet-explorer.gather.network/api',
    [ChainId['Taiko(Alpha-2Testnet)']]: 'https://explorer.a2.taiko.xyz/api',
    [ChainId.ShimmerEVMTestnet]: 'https://explorer.evm.testnet.shimmer.network/api',
    [ChainId.OasysMainnet]: 'https://scan.oasys.games/api',
    [ChainId.ENULSMainnet]: 'https://evmscan.nuls.io/api',
  };

  return apiUrls[chainId];
};

export const getChainEtherscanPlatformNames = (
  chainId: number
): { platform: string; subPlatform?: string } | undefined => {
  const apiUrl = getChainApiUrl(chainId);
  if (!apiUrl) return undefined;

  const platform = new URL(apiUrl).hostname.split('.').at(-2);
  const subPlatform = new URL(apiUrl).hostname.split('.').at(-3)?.split('-').at(-1);
  return { platform, subPlatform };
};

export const getChainApiKey = (chainId: number): string | undefined => {
  const { platform, subPlatform } = getChainEtherscanPlatformNames(chainId);
  return ETHERSCAN_API_KEYS[`${subPlatform}.${platform}`] ?? ETHERSCAN_API_KEYS[platform];
};

export const getChainApiRateLimit = (chainId: number): RateLimit => {
  const { platform, subPlatform } = getChainEtherscanPlatformNames(chainId);
  const customRateLimit = ETHERSCAN_RATE_LIMITS[`${subPlatform}.${platform}`] ?? ETHERSCAN_RATE_LIMITS[platform];

  if (customRateLimit) {
    return { interval: 1000, intervalCap: customRateLimit };
  }

  // Etherscan has a rate limit of 1 request per 5 seconds if no API key is provided
  // Note that we exclude Blockscout chains here because they require no API key
  if (isEtherscanSupportedChain(chainId) && !isBlockscoutSupportedChain(chainId) && !getChainApiKey(chainId)) {
    return { interval: 5000, intervalCap: 1 };
  }

  // For all other chains we assume a rate limit of 5 requests per second (which we underestimate as 4/s to be safe)
  return { interval: 1000, intervalCap: 4 };
};

// TODO: Blockscout-hosted chains will all get identified as 'blockscout:undefined'. It is unclear if Blockscout
// has a single rate limit for all chains or if each chain has its own rate limit. If the former, we're all good,
// if the latter, we need to add a special case for these chains.
export const getChainApiIdentifer = (chainId: number): string => {
  const { platform } = getChainEtherscanPlatformNames(chainId);
  const apiKey = getChainApiKey(chainId);
  return `${platform}:${apiKey}`;
};
