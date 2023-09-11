import { ChainId, chains } from '@revoke.cash/chains';
import { ETHERSCAN_API_KEYS, ETHERSCAN_RATE_LIMITS, RPC_OVERRIDES } from 'lib/constants';
import { RateLimit } from 'lib/interfaces';
import { Chain, PublicClient, createPublicClient, defineChain, http } from 'viem';

export const PROVIDER_SUPPORTED_CHAINS = [
  ChainId.EthereumMainnet,
  ChainId.Goerli,
  ChainId.Sepolia,
  ChainId.PolygonMainnet,
  ChainId.Mumbai,
  ChainId.OPMainnet,
  ChainId.OptimismGoerliTestnet,
  ChainId.ArbitrumOne,
  ChainId.ArbitrumGoerli,
  ChainId.MetisAndromedaMainnet,
  ChainId.SmartBitcoinCash,
  ChainId.SyscoinMainnet,
  ChainId.SyscoinTanenbaumTestnet,
  ChainId.CoinExSmartChainMainnet,
  ChainId.CoinExSmartChainTestnet,
  ChainId.ExosamaNetwork,
  ChainId.ZkSyncEraMainnet,
  ChainId.ZkSyncEraTestnet,
  ChainId.PolygonzkEVM,
  ChainId.PolygonzkEVMTestnet,
  ChainId.CoreBlockchainMainnet,
  ChainId.KCCMainnet,
  ChainId.PulseChain,
  ChainId.Linea,
  ChainId.LineaTestnet,
  ChainId.Wanchain,
];

export const BLOCKSCOUT_SUPPORTED_CHAINS = [
  ChainId.Canto,
  ChainId.Kava,
  ChainId.RSKMainnet,
  ChainId.OasisEmerald,
  ChainId.FuseMainnet,
  ChainId.Palm,
  ChainId.CallistoMainnet,
  ChainId.NahmiiMainnet,
  ChainId.FlareMainnet,
  ChainId['SongbirdCanary-Network'],
  ChainId.AuroraMainnet,
  ChainId.HorizenEON,
  ChainId.HorizenGobiTestnet,
  ChainId.PulseChainTestnetv4,
  ChainId.ScrollSepoliaTestnet,
  ChainId.RedlightChainMainnet,
  // ChainId.GatherMainnetNetwork,
  ChainId.GatherTestnetNetwork,
  ChainId.TaikoGrimsvotnL2,
  ChainId.ShimmerEVMTestnet,
  ChainId.OasysMainnet,
  ChainId.ENULSMainnet,
  ChainId.ZetaChainAthens3Testnet,
  ChainId.DogechainMainnet,
  ChainId.Mantle,
  ChainId.MantleTestnet,
  ChainId.EthereumClassicMainnet,
  ChainId.Shiden,
  ChainId.CronosMainnet,
  ChainId.CronosTestnet,
  ChainId.Zora,
  ChainId.Astar,
  ChainId.MaxxChainMainnet,
];

export const ETHERSCAN_SUPPORTED_CHAINS = [
  ChainId.BNBSmartChainMainnet,
  ChainId.BNBSmartChainTestnet,
  ChainId.Base,
  ChainId.BaseGoerliTestnet,
  ChainId.Gnosis,
  ChainId.FantomOpera,
  ChainId.FantomTestnet,
  ChainId.ArbitrumNova,
  ChainId['AvalancheC-Chain'],
  ChainId.AvalancheFujiTestnet,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.MoonbaseAlpha,
  ChainId.CeloMainnet,
  ChainId.CeloAlfajoresTestnet,
  ChainId.BitTorrentChainMainnet,
  ...BLOCKSCOUT_SUPPORTED_CHAINS,
];

export const COVALENT_SUPPORTED_CHAINS = [ChainId.HarmonyMainnetShard0, ChainId.Evmos, ChainId.BobaNetwork];

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
  ChainId.BNBSmartChainMainnet,
  ChainId.PolygonMainnet,
  ChainId.PolygonzkEVM,
  ChainId.ArbitrumOne,
  ChainId.ArbitrumNova,
  ChainId.OPMainnet,
  ChainId.Base,
  ChainId.ZkSyncEraMainnet,
  ChainId.Linea,
  ChainId['AvalancheC-Chain'],
  ChainId.CronosMainnet,
  ChainId.Kava,
  ChainId.PulseChain,
  ChainId.CeloMainnet,
  ChainId.Gnosis,
  ChainId.RSKMainnet,
  ChainId.FantomOpera,
  ChainId.Astar,
  ChainId.Canto,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.Mantle,
  ChainId.MetisAndromedaMainnet,
  ChainId['SongbirdCanary-Network'],
  ChainId.BitTorrentChainMainnet,
  ChainId.AuroraMainnet,
  ChainId.SmartBitcoinCash,
  ChainId.CoreBlockchainMainnet,
  ChainId.Wanchain,
  ChainId.HarmonyMainnetShard0,
  ChainId.DogechainMainnet,
  ChainId.Evmos,
  ChainId.BobaNetwork,
  ChainId.CoinExSmartChainMainnet,
  ChainId.KCCMainnet,
  ChainId.OasisEmerald,
  ChainId.OasysMainnet,
  ChainId.FuseMainnet,
  ChainId.NahmiiMainnet,
  ChainId.ENULSMainnet,
  ChainId.EthereumClassicMainnet,
  ChainId.CallistoMainnet,
  ChainId.Shiden,
  ChainId.SyscoinMainnet,
  ChainId.FlareMainnet,
  ChainId.Palm,
  ChainId.Zora,
  ChainId.HorizenEON,
  ChainId.ExosamaNetwork,
  ChainId.RedlightChainMainnet,
  ChainId.MaxxChainMainnet,
  // ChainId.GatherMainnetNetwork,
];

export const CHAIN_SELECT_TESTNETS = [
  ChainId.Goerli,
  ChainId.Sepolia,
  ChainId.BNBSmartChainTestnet,
  ChainId.Mumbai,
  ChainId.PolygonzkEVMTestnet,
  ChainId.ArbitrumGoerli,
  ChainId.OptimismGoerliTestnet,
  ChainId.BaseGoerliTestnet,
  ChainId.ZkSyncEraTestnet,
  ChainId.LineaTestnet,
  ChainId.ScrollSepoliaTestnet,
  ChainId.TaikoGrimsvotnL2,
  ChainId.AvalancheFujiTestnet,
  ChainId.CronosTestnet,
  ChainId.PulseChainTestnetv4,
  ChainId.CeloAlfajoresTestnet,
  ChainId.FantomTestnet,
  ChainId.MoonbaseAlpha,
  ChainId.MantleTestnet,
  ChainId.CoinExSmartChainTestnet,
  ChainId.SyscoinTanenbaumTestnet,
  ChainId.HorizenGobiTestnet,
  ChainId.GatherTestnetNetwork,
  ChainId.ShimmerEVMTestnet,
  ChainId.ZetaChainAthens3Testnet,
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
    [ChainId.BNBSmartChainMainnet]: 'BNB Chain',
    [ChainId['AvalancheC-Chain']]: 'Avalanche',
    [ChainId.PolygonMainnet]: 'Polygon',
    [ChainId.ArbitrumOne]: 'Arbitrum',
    [ChainId.ArbitrumNova]: 'Arbitrum Nova',
    [ChainId.CronosMainnet]: 'Cronos',
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
    [ChainId.SmartBitcoinCash]: 'SmartBCH',
    [ChainId.FuseMainnet]: 'Fuse',
    [ChainId.SyscoinMainnet]: 'Syscoin',
    [ChainId.CLVParachain]: 'CLV',
    [ChainId.BitTorrentChainMainnet]: 'BTT Chain',
    [ChainId.Goerli]: 'Goerli',
    [ChainId.BNBSmartChainTestnet]: 'BNB Chain Testnet',
    [ChainId.AvalancheFujiTestnet]: 'Avalanche Fuji',
    [ChainId.Mumbai]: 'Polygon Mumbai',
    [ChainId.OptimismGoerliTestnet]: 'Optimism Goerli',
    [ChainId.ArbitrumGoerli]: 'Arbitrum Goerli',
    [ChainId.CeloAlfajoresTestnet]: 'Celo Alfajores',
    [ChainId.HuobiECOChainTestnet]: 'HECO Testnet',
    [ChainId.MetisStardustTestnet]: 'Metis Stardust',
    [ChainId.TelosEVMTestnet]: 'Telos Testnet',
    [ChainId.SmartBitcoinCashTestnet]: 'SmartBCH Testnet',
    [ChainId.SyscoinTanenbaumTestnet]: 'Syscoin Tanenbaum',
    [ChainId.BitTorrentChainTestnet]: 'BTTC Testnet',
    [ChainId.OasisEmerald]: 'Oasis Emerald',
    [ChainId.OasisEmeraldTestnet]: 'Oasis Testnet',
    [ChainId.EthereumClassicMainnet]: 'Ethereum Classic',
    [ChainId.Canto]: 'Canto',
    [ChainId.Kava]: 'Kava',
    [ChainId.KavaTestnet]: 'Kava Testnet',
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
    [ChainId.PolygonzkEVMTestnet]: 'Polygon zkEVM Testnet',
    [ChainId.PulseChain]: 'PulseChain',
    [ChainId.PulseChainTestnetv4]: 'PulseChain Testnet',
    [ChainId.Linea]: 'Linea',
    [ChainId.LineaTestnet]: 'Linea Goerli',
    [ChainId.ScrollSepoliaTestnet]: 'Scroll Sepolia',
    [ChainId.BaseGoerliTestnet]: 'Base Goerli',
    [ChainId.RedlightChainMainnet]: 'Redlight',
    [ChainId.GatherMainnetNetwork]: 'Gather',
    [ChainId.GatherTestnetNetwork]: 'Gather Testnet',
    [ChainId.TaikoGrimsvotnL2]: 'Taiko Grimsvotn',
    [ChainId.CoreBlockchainMainnet]: 'CORE',
    [ChainId.KCCMainnet]: 'KCC',
    [ChainId.ShimmerEVMTestnet]: 'Shimmer Testnet',
    [ChainId.OasysMainnet]: 'Oasys',
    [ChainId.ENULSMainnet]: 'ENULS',
    [ChainId.ZetaChainAthens3Testnet]: 'ZetaChain Athens',
    [ChainId.OPMainnet]: 'Optimism',
    [ChainId.HorizenEON]: 'Horizen EON',
    [ChainId.MaxxChainMainnet]: 'MaxxChain',
  };

  const name = overrides[chainId] ?? chains.get(chainId)?.name ?? `Chain ID ${chainId}`;
  if (!isSupportedChain(chainId)) {
    return `${name} (Unsupported)`;
  }

  return name;
};

export const getChainSlug = (chainId: number): string => {
  const chainName = getChainName(chainId);
  return chainName.toLowerCase().replace(/\s/g, '-');
};

const REVERSE_CHAIN_SLUGS: Record<string, number> = Object.fromEntries(
  SUPPORTED_CHAINS.map((chainId) => [getChainSlug(chainId), chainId]),
);

export const getChainIdFromSlug = (slug: string): number | undefined => {
  return REVERSE_CHAIN_SLUGS[slug];
};

export const getChainExplorerUrl = (chainId: number): string | undefined => {
  const overrides: Record<number, string> = {
    [ChainId.SmartBitcoinCash]: 'https://www.smartscan.cash',
    [ChainId.CeloAlfajoresTestnet]: 'https://alfajores.celoscan.io',
    [ChainId.AuroraMainnet]: 'https://explorer.aurora.dev',
    [ChainId.BitTorrentChainMainnet]: 'https://bttcscan.com',
    [ChainId.BitTorrentChainTestnet]: 'https://testnet.bttcscan.com',
    [ChainId.CLVParachain]: 'https://clvscan.com',
    [ChainId.Astar]: 'https://blockscout.com/astar',
    [ChainId.Gnosis]: 'https://gnosisscan.io',
    [ChainId.ArbitrumGoerli]: 'https://goerli.arbiscan.io',
    [ChainId.ArbitrumNova]: 'https://nova.arbiscan.io',
    [ChainId.PolygonzkEVM]: 'https://zkevm.polygonscan.com',
    [ChainId.PolygonzkEVMTestnet]: 'https://testnet-zkevm.polygonscan.com',
    [ChainId.PulseChain]: 'https://scan.pulsechain.com',
    [ChainId.PulseChainTestnetv4]: 'https://scan.v4.testnet.pulsechain.com',
    [ChainId.LineaTestnet]: 'https://goerli.lineascan.build',
    [ChainId.OasysMainnet]: 'https://scan.oasys.games',
    [ChainId.OptimismGoerliTestnet]: 'https://goerli-optimism.etherscan.io',
    [ChainId.FuseMainnet]: 'https://explorer.fuse.io',
    [ChainId.CallistoMainnet]: 'https://explorer.callisto.network',
    [ChainId.GodwokenMainnet]: 'https://www.gwscan.com',
    [ChainId.Wanchain]: 'https://www.wanscan.org',
    [ChainId.Canto]: 'https://tuber.build',
    [ChainId.Linea]: 'https://lineascan.build',
    [ChainId.ZetaChainAthens3Testnet]: 'https://zetachain-athens-3.blockscout.com',
  };

  const [explorer] = chains.get(chainId)?.explorers ?? [];

  return overrides[chainId] ?? explorer?.url;
};

// This is used on the "Add a network" page
export const getChainFreeRpcUrl = (chainId: number): string | undefined => {
  const overrides: Record<number, string> = {
    [ChainId.EthereumMainnet]: 'https://eth.llamarpc.com',
    [ChainId.ArbitrumOne]: 'https://arb1.arbitrum.io/rpc',
    [ChainId.Palm]: 'https://palm-mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    [ChainId.Goerli]: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    [ChainId.Linea]: 'https://linea-mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  };

  const [rpcUrl] = chains.get(chainId)?.rpc ?? [];
  return overrides[chainId] ?? rpcUrl;
};

export const getChainRpcUrl = (chainId: number): string | undefined => {
  const infuraKey = process.env.INFURA_API_KEY ?? process.env.NEXT_PUBLIC_INFURA_API_KEY;
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

  const overrides: Record<number, string> = {
    // [ChainId.EthereumMainnet]: `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.EthereumMainnet]: `https://mainnet.infura.io/v3/${infuraKey}`,
    [ChainId.Goerli]: `https://goerli.infura.io/v3/${infuraKey}`,
    [ChainId.Sepolia]: `https://sepolia.infura.io/v3/${infuraKey}`,
    [ChainId.PolygonMainnet]: `https://polygon.llamarpc.com`,
    [ChainId.ArbitrumOne]: `https://arb1.arbitrum.io/rpc`,
    [ChainId.FantomTestnet]: 'https://rpc.ankr.com/fantom_testnet',
    [ChainId.Evmos]: 'https://evmos-evm.publicnode.com',
    [ChainId.Astar]: 'https://evm.astar.network',
    [ChainId.OPMainnet]: `https://optimism-mainnet.infura.io/v3/${infuraKey}`,
    [ChainId.OptimismGoerliTestnet]: `https://optimism-goerli.infura.io/v3/${infuraKey}`,
    [ChainId.CronosMainnet]: 'https://cronos.blockpi.network/v1/rpc/public',
    [ChainId.Mumbai]: 'https://polygon-mumbai.blockpi.network/v1/rpc/public',
    [ChainId.LineaTestnet]: `https://linea-goerli.infura.io/v3/${infuraKey}`,
    [ChainId.CoreBlockchainMainnet]: 'https://rpc.coredao.org',
    [ChainId.Base]: 'https://mainnet.base.org',
    [ChainId.Canto]: 'https://mainnode.plexnode.org:8545',
    [ChainId.Linea]: `https://linea-mainnet.infura.io/v3/${infuraKey}`,
    [ChainId.Shiden]: 'https://shiden.public.blastapi.io',
    [ChainId.ZetaChainAthens3Testnet]: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
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
    [ChainId.OPMainnet]: `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`,
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
    [ChainId.BNBSmartChainMainnet]: '/assets/images/vendor/chains/bsc.svg',
    [ChainId.BNBSmartChainTestnet]: '/assets/images/vendor/chains/bsc.svg',
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
    [ChainId.CronosMainnet]: '/assets/images/vendor/chains/cronos.svg',
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
    [ChainId.OPMainnet]: '/assets/images/vendor/chains/optimism.svg',
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
    [ChainId.Kava]: '/assets/images/vendor/chains/kava.svg',
    [ChainId.KavaTestnet]: '/assets/images/vendor/chains/kava.svg',
    [ChainId.CallistoMainnet]: '/assets/images/vendor/chains/callisto.png',
    [ChainId.NahmiiMainnet]: '/assets/images/vendor/chains/nahmii.svg',
    [ChainId.CoinExSmartChainMainnet]: '/assets/images/vendor/chains/coinex.svg',
    [ChainId.CoinExSmartChainTestnet]: '/assets/images/vendor/chains/coinex.svg',
    [ChainId.ExosamaNetwork]: '/assets/images/vendor/chains/exosama.png',
    [ChainId.FlareMainnet]: '/assets/images/vendor/chains/flare.svg',
    [ChainId['SongbirdCanary-Network']]: '/assets/images/vendor/chains/songbird.svg',
    [ChainId.BobaNetwork]: '/assets/images/vendor/chains/boba.jpeg',
    [ChainId.HorizenEON]: '/assets/images/vendor/chains/horizen.png',
    [ChainId.HorizenGobiTestnet]: '/assets/images/vendor/chains/horizen.png',
    [ChainId.ZkSyncEraMainnet]: '/assets/images/vendor/chains/zksync.jpeg',
    [ChainId.ZkSyncEraTestnet]: '/assets/images/vendor/chains/zksync.jpeg',
    [ChainId.PolygonzkEVM]: '/assets/images/vendor/chains/polygon.svg',
    [ChainId.PolygonzkEVMTestnet]: '/assets/images/vendor/chains/polygon.svg',
    [ChainId.PulseChain]: '/assets/images/vendor/chains/pulsechain.png',
    [ChainId.PulseChainTestnetv4]: '/assets/images/vendor/chains/pulsechain.png',
    [ChainId.Linea]: '/assets/images/vendor/chains/linea.png',
    [ChainId.LineaTestnet]: '/assets/images/vendor/chains/linea.png',
    [ChainId.ScrollSepoliaTestnet]: '/assets/images/vendor/chains/scroll.png',
    [ChainId.Base]: '/assets/images/vendor/chains/base.svg',
    [ChainId.BaseGoerliTestnet]: '/assets/images/vendor/chains/base.svg',
    [ChainId.RedlightChainMainnet]: '/assets/images/vendor/chains/redlight.png',
    [ChainId.GatherMainnetNetwork]: '/assets/images/vendor/chains/gather.jpg',
    [ChainId.GatherTestnetNetwork]: '/assets/images/vendor/chains/gather.jpg',
    [ChainId.TaikoGrimsvotnL2]: '/assets/images/vendor/chains/taiko.svg',
    [ChainId.CoreBlockchainMainnet]: '/assets/images/vendor/chains/core.png',
    [ChainId.KCCMainnet]: '/assets/images/vendor/chains/kcc.svg',
    [ChainId.OasysMainnet]: '/assets/images/vendor/chains/oasys.png',
    [ChainId.ShimmerEVMTestnet]: '/assets/images/vendor/chains/shimmer.svg',
    [ChainId.ENULSMainnet]: '/assets/images/vendor/chains/enuls.svg',
    [ChainId.HuobiECOChainMainnet]: '/assets/images/vendor/chains/heco.svg',
    [ChainId.HuobiECOChainTestnet]: '/assets/images/vendor/chains/heco.svg',
    [ChainId.Wanchain]: '/assets/images/vendor/chains/wanchain.svg',
    [ChainId.TelosEVMMainnet]: '/assets/images/vendor/chains/telos.png',
    [ChainId.ZetaChainAthens3Testnet]: '/assets/images/vendor/chains/zetachain.svg',
    [ChainId.DogechainMainnet]: '/assets/images/vendor/chains/dogechain.jpg',
    [ChainId.Mantle]: '/assets/images/vendor/chains/mantle.svg',
    [ChainId.MantleTestnet]: '/assets/images/vendor/chains/mantle.svg',
    [ChainId.Zora]: '/assets/images/vendor/chains/zora.svg',
    [ChainId.MaxxChainMainnet]: '/assets/images/vendor/chains/maxxchain.png',
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
    XDAI: '15',
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
    WAN: '100',
    ZEN: '1',
    MNT: '25',
    PWR: '1000',
  };

  return mapping[nativeToken] ?? '1';
};

export const getChainApiUrl = (chainId: number): string | undefined => {
  const apiUrls = {
    [ChainId.EthereumMainnet]: 'https://api.etherscan.io/api',
    [ChainId.BNBSmartChainMainnet]: 'https://api.bscscan.com/api',
    [ChainId.BNBSmartChainTestnet]: 'https://api-testnet.bscscan.com/api',
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
    [ChainId.CronosMainnet]: 'https://cronos.org/explorer/api',
    [ChainId.CronosTestnet]: 'https://cronos.org/explorer/testnet3/api',
    [ChainId.CeloMainnet]: 'https://api.celoscan.io/api',
    [ChainId.CeloAlfajoresTestnet]: 'https://api-alfajores.celoscan.io/api',
    [ChainId.AuroraMainnet]: 'https://explorer.aurora.dev/api',
    [ChainId.BitTorrentChainMainnet]: 'https://api.bttcscan.com/api',
    [ChainId.BitTorrentChainTestnet]: 'https://api-testnet.bttcscan.com/api',
    [ChainId.CLVParachain]: 'https://api.clvscan.com/api',
    [ChainId.Canto]: 'https://tuber.build/api',
    [ChainId.Kava]: 'https://explorer.kava.io/api',
    [ChainId.KavaTestnet]: 'https://explorer.testnet.kava.io/api',
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
    [ChainId.HorizenEON]: 'https://eon-explorer.horizenlabs.io/api',
    [ChainId.HorizenGobiTestnet]: 'https://gobi-explorer.horizen.io/api',
    [ChainId.PulseChain]: 'https://scan.pulsechain.com/api',
    [ChainId.PulseChainTestnetv4]: 'https://scan.v4.testnet.pulsechain.com/api',
    [ChainId.Linea]: 'https://lineascan.build/api',
    [ChainId.LineaTestnet]: 'https://goerli.lineascan.build/api',
    [ChainId.ScrollSepoliaTestnet]: 'https://sepolia-blockscout.scroll.io/api',
    [ChainId.RedlightChainMainnet]: 'https://redlightscan.finance/api',
    [ChainId.GatherMainnetNetwork]: 'https://explorer.gather.network/api',
    [ChainId.GatherTestnetNetwork]: 'https://testnet-explorer.gather.network/api',
    [ChainId.TaikoGrimsvotnL2]: 'https://explorer.test.taiko.xyz/api',
    [ChainId.ShimmerEVMTestnet]: 'https://explorer.evm.testnet.shimmer.network/api',
    [ChainId.OasysMainnet]: 'https://scan.oasys.games/api',
    [ChainId.ENULSMainnet]: 'https://evmscan.nuls.io/api',
    [ChainId.ZkSyncEraMainnet]: 'https://zksync2-mainnet.zkscan.io/api',
    [ChainId.ZetaChainAthens3Testnet]: 'https://zetachain-athens-3.blockscout.com/api',
    [ChainId.DogechainMainnet]: 'https://explorer.dogechain.dog/api',
    [ChainId.Mantle]: 'https://explorer.mantle.xyz/api',
    [ChainId.MantleTestnet]: 'https://explorer.testnet.mantle.xyz/api',
    [ChainId.Base]: 'https://api.basescan.org/api',
    [ChainId.BaseGoerliTestnet]: 'https://api-goerli.basescan.org/api',
    [ChainId.EthereumClassicMainnet]: 'https://blockscout.com/etc/mainnet/api',
    [ChainId.Zora]: 'https://explorer.zora.energy/api',
    [ChainId.MaxxChainMainnet]: 'https://explorer.maxxchain.org/api',
  };

  return apiUrls[chainId];
};

export const getChainEtherscanPlatformNames = (
  chainId: number,
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

export const getChainDeployedContracts = (chainId: number): any | undefined => {
  const MULTICALL = {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  };

  const mapping = {
    [ChainId.EthereumMainnet]: {
      ...MULTICALL,
      ensRegistry: { address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' },
      ensUniversalResolver: { address: '0xc0497E381f536Be9ce14B0dD3817cBcAe57d2F62' },
    },
    [ChainId.Goerli]: { ...MULTICALL },
    [ChainId.Sepolia]: { ...MULTICALL },
    [ChainId.ArbitrumOne]: { ...MULTICALL },
    [ChainId.ArbitrumGoerli]: { ...MULTICALL },
    [ChainId.ArbitrumNova]: { ...MULTICALL },
    [ChainId.AuroraMainnet]: { ...MULTICALL },
    [ChainId.Astar]: { ...MULTICALL },
    [ChainId['AvalancheC-Chain']]: { ...MULTICALL },
    [ChainId.AvalancheFujiTestnet]: { ...MULTICALL },
    [ChainId.Base]: { ...MULTICALL },
    [ChainId.BaseGoerliTestnet]: { ...MULTICALL },
    [ChainId.BobaNetwork]: { ...MULTICALL },
    [ChainId.BNBSmartChainMainnet]: { ...MULTICALL },
    [ChainId.BNBSmartChainTestnet]: { ...MULTICALL },
    [ChainId.Canto]: { ...MULTICALL },
    [ChainId.CeloMainnet]: { ...MULTICALL },
    [ChainId.CeloAlfajoresTestnet]: { ...MULTICALL },
    [ChainId.CronosMainnet]: { ...MULTICALL },
    [ChainId.CronosTestnet]: { ...MULTICALL },
    [ChainId.DogechainMainnet]: { ...MULTICALL },
    [ChainId.FantomOpera]: { ...MULTICALL },
    [ChainId.FantomTestnet]: { ...MULTICALL },
    [ChainId.GodwokenMainnet]: { ...MULTICALL },
    [ChainId.Gnosis]: { ...MULTICALL },
    [ChainId.HarmonyMainnetShard0]: { ...MULTICALL },
    [ChainId.IoTeXNetworkMainnet]: { ...MULTICALL },
    [ChainId.Kava]: { ...MULTICALL },
    [ChainId.KCCMainnet]: { ...MULTICALL },
    [ChainId.Linea]: { ...MULTICALL },
    [ChainId.LineaTestnet]: { ...MULTICALL },
    [ChainId.Mantle]: { ...MULTICALL },
    [ChainId.MetisAndromedaMainnet]: { ...MULTICALL },
    [ChainId.MetisGoerliTestnet]: { ...MULTICALL },
    [ChainId.MoonbaseAlpha]: { ...MULTICALL },
    [ChainId.Moonbeam]: { ...MULTICALL },
    [ChainId.Moonriver]: { ...MULTICALL },
    [ChainId.OasisEmerald]: { ...MULTICALL },
    [ChainId.OPMainnet]: { ...MULTICALL },
    [ChainId.OptimismGoerliTestnet]: { ...MULTICALL },
    [ChainId.PolygonMainnet]: { ...MULTICALL },
    [ChainId.Mumbai]: { ...MULTICALL },
    [ChainId.PolygonzkEVM]: { ...MULTICALL },
    [ChainId.PolygonzkEVMTestnet]: { ...MULTICALL },
    [ChainId.PulseChain]: { ...MULTICALL },
    [ChainId.PulseChainTestnetv4]: { ...MULTICALL },
    [ChainId.RSKMainnet]: { ...MULTICALL },
    [ChainId.RSKTestnet]: { ...MULTICALL },
    [ChainId['SongbirdCanary-Network']]: { ...MULTICALL },
    [ChainId.SyscoinMainnet]: { ...MULTICALL },
    [ChainId.SyscoinTanenbaumTestnet]: { ...MULTICALL },
    [ChainId.TelosEVMMainnet]: { ...MULTICALL },
    [ChainId.Wanchain]: {
      multicall3: { address: '0xcDF6A1566e78EB4594c86Fe73Fcdc82429e97fbB' },
    },
    [ChainId.ZkSyncEraMainnet]: {
      multicall3: { address: '0xF9cda624FBC7e059355ce98a31693d299FACd963' },
    },
    [ChainId.ZkSyncEraTestnet]: {
      multicall3: { address: '0xF9cda624FBC7e059355ce98a31693d299FACd963' },
    },
    [ChainId.Zora]: { ...MULTICALL },
  };

  return mapping[chainId];
};

export const getViemChainConfig = (chainId: number): Chain | undefined => {
  const chainInfo = chains.get(chainId);
  const chainName = getChainName(chainId);
  const fallbackNativeCurrency = { name: chainName, symbol: getChainNativeToken(chainId), decimals: 18 };

  return defineChain({
    id: chainId,
    name: chainName,
    network: chainName.toLowerCase().replaceAll(' ', '-'),
    nativeCurrency: chainInfo?.nativeCurrency ?? fallbackNativeCurrency,
    rpcUrls: {
      default: { http: [getChainRpcUrl(chainId)] },
      public: { http: [getChainRpcUrl(chainId)] },
    },
    blockExplorers: {
      default: {
        name: chainName + ' Explorer',
        url: getChainExplorerUrl(chainId),
      },
    },
    contracts: getChainDeployedContracts(chainId),
    testnet: CHAIN_SELECT_TESTNETS.includes(chainId),
  });
};

export const createViemPublicClientForChain = (chainId: number, url?: string): PublicClient => {
  return createPublicClient({
    chain: getViemChainConfig(chainId),
    transport: http(url ?? getChainRpcUrl(chainId)),
  });
};
