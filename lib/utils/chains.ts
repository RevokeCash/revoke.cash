import { ChainId, getChain } from '@revoke.cash/chains';
import { NFTGetter, ResevoirNFT } from 'lib/api/nft';
import {
  ALCHEMY_API_KEY,
  ETHERSCAN_API_KEYS,
  ETHERSCAN_RATE_LIMITS,
  INFURA_API_KEY,
  RESEVOIR_API_KEY,
  RPC_OVERRIDES,
} from 'lib/constants';
import { EtherscanPlatform, RateLimit } from 'lib/interfaces';
import { AggregatePriceStrategy, AggregationType } from 'lib/price/AggregatePriceStrategy';
import { BackendPriceStrategy } from 'lib/price/BackendPriceStrategy';
import { HardcodedPriceStrategy } from 'lib/price/HardcodedPriceStrategy';
import { PriceStrategy } from 'lib/price/PriceStrategy';
import { UniswapV2PriceStrategy } from 'lib/price/UniswapV2PriceStrategy';
import { UniswapV3ReadonlyPriceStrategy } from 'lib/price/UniswapV3ReadonlyPriceStrategy';
import { Chain, PublicClient, createPublicClient, defineChain, http, toHex } from 'viem';
import { SECOND } from './time';

export const PROVIDER_SUPPORTED_CHAINS = [
  ChainId.ArbitrumGoerli,
  ChainId.ArbitrumOne,
  ChainId.ArbitrumSepolia,
  ChainId.CoinExSmartChainMainnet,
  ChainId.CoinExSmartChainTestnet,
  ChainId.CoreBlockchainMainnet,
  ChainId.EthereumMainnet,
  ChainId.ExosamaNetwork,
  ChainId.FrameTestnet,
  ChainId.Goerli,
  ChainId.KCCMainnet,
  ChainId.Linea,
  ChainId.LineaTestnet,
  ChainId.MetisAndromedaMainnet,
  ChainId.Mumbai,
  ChainId.OPMainnet,
  ChainId.OPSepoliaTestnet,
  ChainId.OptimismGoerliTestnet,
  ChainId.PolygonMainnet,
  ChainId.PulseChain,
  ChainId.Sepolia,
  ChainId.Shibarium,
  ChainId.SyscoinMainnet,
  ChainId.SyscoinTanenbaumTestnet,
  ChainId.TaikoJolnirL2,
  ChainId.TaikoKatlaL2,
  ChainId.Wanchain,
  ChainId.XDCNetwork,
  ChainId.ZKFairMainnet,
  ChainId.ZkSyncMainnet,
  ChainId['ZkSyncEraGoerliTestnet(deprecated)'],
  ChainId.ZkSyncSepoliaTestnet,
];

export const BLOCKSCOUT_SUPPORTED_CHAINS = [
  ChainId.Astar,
  ChainId.AuroraMainnet,
  ChainId.BitgertMainnet,
  ChainId.BitrockMainnet,
  ChainId.CallistoMainnet,
  ChainId.CronosMainnet,
  ChainId.CronosTestnet,
  ChainId.DogechainMainnet,
  ChainId.ElastosSmartChain,
  ChainId.ENULSMainnet,
  ChainId.EOSEVMNetwork,
  ChainId.EthereumClassic,
  ChainId.FlareMainnet,
  ChainId.FuseMainnet,
  ChainId.GoldXChainMainnet,
  ChainId.HorizenEONMainnet,
  ChainId.HorizenGobiTestnet,
  ChainId.KardiaChainMainnet,
  ChainId.Kava,
  ChainId.LightlinkPhoenixMainnet,
  ChainId.MantaPacificMainnet,
  ChainId.Mantle,
  ChainId.MantleTestnet,
  ChainId.MaxxChainMainnet,
  ChainId.MilkomedaC1Mainnet,
  ChainId.NahmiiMainnet,
  ChainId.OasisEmerald,
  ChainId.OasisSapphire,
  ChainId.OasysMainnet,
  ChainId.OctaSpace,
  ChainId.PegoNetwork,
  ChainId['PGN(PublicGoodsNetwork)'],
  ChainId.PulseChainTestnetv4,
  ChainId.RedlightChainMainnet,
  ChainId.RolluxMainnet,
  ChainId.RootstockMainnet,
  ChainId.Scroll,
  ChainId.ScrollSepoliaTestnet,
  ChainId.Shiden,
  ChainId.ShimmerEVM,
  ChainId.ShimmerEVMTestnet,
  ChainId['SongbirdCanary-Network'],
  ChainId.VelasEVMMainnet,
  ChainId.ZetaChainAthens3Testnet,
  ChainId.Zora,
];

export const ETHERSCAN_SUPPORTED_CHAINS = [
  ChainId['AvalancheC-Chain'],
  ChainId.ArbitrumNova,
  ChainId.AvalancheFujiTestnet,
  ChainId.Base,
  ChainId.BaseGoerliTestnet,
  ChainId.BitTorrentChainMainnet,
  ChainId.BNBSmartChainMainnet,
  ChainId.BNBSmartChainTestnet,
  ChainId.CeloAlfajoresTestnet,
  ChainId.CeloMainnet,
  ChainId.FantomOpera,
  ChainId.FantomTestnet,
  ChainId.Gnosis,
  ChainId.Holesky,
  ChainId.Kroma,
  ChainId.KromaSepolia,
  ChainId.MoonbaseAlpha,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.OpBNBMainnet,
  ChainId.PolygonzkEVM,
  ChainId.PolygonzkEVMTestnet,
  ChainId['WEMIX3.0Mainnet'],
  ...BLOCKSCOUT_SUPPORTED_CHAINS,
];

export const COVALENT_SUPPORTED_CHAINS = [
  ChainId.BobaNetwork,
  ChainId.Canto,
  ChainId.Evmos,
  ChainId.HarmonyMainnetShard0,
  ChainId.Palm,
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
  ChainId.BNBSmartChainMainnet,
  ChainId.OpBNBMainnet,
  ChainId.PolygonMainnet,
  ChainId.PolygonzkEVM,
  ChainId.ArbitrumOne,
  ChainId.ArbitrumNova,
  ChainId.OPMainnet,
  ChainId['AvalancheC-Chain'],
  ChainId.Base,
  ChainId.ZkSyncMainnet,
  ChainId.Linea,
  ChainId.Scroll,
  ChainId['PGN(PublicGoodsNetwork)'],
  ChainId.MantaPacificMainnet,
  ChainId.CronosMainnet,
  ChainId.Kava,
  ChainId.Gnosis,
  ChainId.Mantle,
  ChainId.CeloMainnet,
  ChainId.PulseChain,
  ChainId.RootstockMainnet,
  ChainId.FantomOpera,
  ChainId.Astar,
  ChainId.MetisAndromedaMainnet,
  ChainId.Canto,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.AuroraMainnet,
  ChainId['WEMIX3.0Mainnet'],
  ChainId.PegoNetwork,
  ChainId.ZKFairMainnet,
  ChainId.FlareMainnet,
  ChainId['SongbirdCanary-Network'],
  ChainId.ShimmerEVM,
  ChainId.HarmonyMainnetShard0,
  ChainId.Evmos,
  ChainId.KardiaChainMainnet,
  ChainId.Wanchain,
  ChainId.BobaNetwork,
  ChainId.CoreBlockchainMainnet,
  ChainId.HorizenEONMainnet,
  ChainId.VelasEVMMainnet,
  ChainId.OasysMainnet,
  ChainId.DogechainMainnet,
  ChainId.XDCNetwork,
  ChainId.KCCMainnet,
  ChainId.MilkomedaC1Mainnet,
  ChainId.ElastosSmartChain,
  ChainId.EOSEVMNetwork,
  ChainId.FuseMainnet,
  ChainId.OasisEmerald,
  ChainId.OasisSapphire,
  ChainId.BitTorrentChainMainnet,
  ChainId.CoinExSmartChainMainnet,
  ChainId.RolluxMainnet,
  ChainId.SyscoinMainnet,
  ChainId.Kroma,
  ChainId.EthereumClassic,
  ChainId.NahmiiMainnet,
  ChainId.Shibarium,
  ChainId.BitgertMainnet,
  ChainId.ENULSMainnet,
  ChainId.CallistoMainnet,
  ChainId.Shiden,
  ChainId.LightlinkPhoenixMainnet,
  ChainId.Palm,
  ChainId.BitrockMainnet,
  ChainId.Zora,
  ChainId.ExosamaNetwork,
  ChainId.RedlightChainMainnet,
  ChainId.MaxxChainMainnet,
  ChainId.OctaSpace,
  ChainId.GoldXChainMainnet,
];

export const CHAIN_SELECT_TESTNETS = [
  ChainId.Sepolia,
  ChainId.Goerli,
  ChainId.Holesky,
  ChainId.BNBSmartChainTestnet,
  ChainId.Mumbai,
  ChainId.PolygonzkEVMTestnet,
  ChainId.ArbitrumSepolia,
  ChainId.ArbitrumGoerli,
  ChainId.OPSepoliaTestnet,
  ChainId.OptimismGoerliTestnet,
  ChainId.BaseGoerliTestnet,
  ChainId.ZkSyncSepoliaTestnet,
  ChainId['ZkSyncEraGoerliTestnet(deprecated)'],
  ChainId.LineaTestnet,
  ChainId.ScrollSepoliaTestnet,
  ChainId.TaikoJolnirL2,
  ChainId.TaikoKatlaL2,
  ChainId.FrameTestnet,
  ChainId.AvalancheFujiTestnet,
  ChainId.CronosTestnet,
  ChainId.PulseChainTestnetv4,
  ChainId.CeloAlfajoresTestnet,
  ChainId.FantomTestnet,
  ChainId.MoonbaseAlpha,
  ChainId.MantleTestnet,
  ChainId.CoinExSmartChainTestnet,
  ChainId.SyscoinTanenbaumTestnet,
  ChainId.KromaSepolia,
  ChainId.HorizenGobiTestnet,
  ChainId.ShimmerEVMTestnet,
  ChainId.ZetaChainAthens3Testnet,
];

export const ORDERED_CHAINS = [...CHAIN_SELECT_MAINNETS, ...CHAIN_SELECT_TESTNETS];

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

export const isMainnetChain = (chainId: number): boolean => CHAIN_SELECT_MAINNETS.includes(chainId);
export const isTestnetChain = (chainId: number): boolean => CHAIN_SELECT_TESTNETS.includes(chainId);

export const getChainName = (chainId: number): string => {
  const overrides: Record<number, string> = {
    [ChainId.ArbitrumGoerli]: 'Arbitrum Goerli',
    [ChainId.ArbitrumSepolia]: 'Arbitrum Sepolia',
    [ChainId.ArbitrumNova]: 'Arbitrum Nova',
    [ChainId.ArbitrumOne]: 'Arbitrum',
    [ChainId.AuroraMainnet]: 'Aurora',
    [ChainId['AvalancheC-Chain']]: 'Avalanche',
    [ChainId.AvalancheFujiTestnet]: 'Avalanche Fuji',
    [ChainId.BaseGoerliTestnet]: 'Base Goerli',
    [ChainId.BitgertMainnet]: 'Bitgert',
    [ChainId.BitrockMainnet]: 'Bitrock',
    [ChainId.BitTorrentChainMainnet]: 'BTT Chain',
    [ChainId.BitTorrentChainTestnet]: 'BTTC Testnet',
    [ChainId.BNBSmartChainMainnet]: 'BNB Chain',
    [ChainId.BNBSmartChainTestnet]: 'BNB Chain Testnet',
    [ChainId.BobaNetwork]: 'Boba',
    [ChainId.CallistoMainnet]: 'Callisto',
    [ChainId.Canto]: 'Canto',
    [ChainId.CeloAlfajoresTestnet]: 'Celo Alfajores',
    [ChainId.CeloMainnet]: 'Celo',
    [ChainId.CoinExSmartChainMainnet]: 'CoinEx Smart Chain',
    [ChainId.CoinExSmartChainTestnet]: 'CoinEx Testnet',
    [ChainId.CoreBlockchainMainnet]: 'CORE',
    [ChainId.CronosMainnet]: 'Cronos',
    [ChainId.DogechainMainnet]: 'Dogechain',
    [ChainId.DogechainTestnet]: 'Dogechain Testnet',
    [ChainId.ElastosSmartChain]: 'Elastos',
    [ChainId.ENULSMainnet]: 'ENULS',
    [ChainId.EOSEVMNetwork]: 'EOS EVM',
    [ChainId.EthereumClassic]: 'Ethereum Classic',
    [ChainId.EthereumMainnet]: 'Ethereum',
    [ChainId.ExosamaNetwork]: 'Exosama',
    [ChainId.FantomOpera]: 'Fantom',
    [ChainId.FlareMainnet]: 'Flare',
    [ChainId.FuseMainnet]: 'Fuse',
    [ChainId.Gnosis]: 'Gnosis Chain',
    [ChainId.GodwokenMainnet]: 'Godwoken',
    [ChainId.Goerli]: 'Ethereum Goerli',
    [ChainId.Holesky]: 'Ethereum Holesky',
    [ChainId.GoldXChainMainnet]: 'GoldX',
    [ChainId.HarmonyMainnetShard0]: 'Harmony',
    [ChainId.HarmonyTestnetShard0]: 'Harmony Testnet',
    [ChainId.HorizenEONMainnet]: 'Horizen EON',
    [ChainId.HorizenGobiTestnet]: 'Horizen Gobi',
    [ChainId.HuobiECOChainMainnet]: 'HECO',
    [ChainId.HuobiECOChainTestnet]: 'HECO Testnet',
    [ChainId.IoTeXNetworkMainnet]: 'IoTeX',
    [ChainId.IoTeXNetworkTestnet]: 'IoTeX Testnet',
    [ChainId.KardiaChainMainnet]: 'KardiaChain',
    [ChainId.Kava]: 'Kava',
    [ChainId.KavaTestnet]: 'Kava Testnet',
    [ChainId.KCCMainnet]: 'KCC',
    [ChainId.KlaytnMainnetCypress]: 'Klaytn',
    [ChainId.KlaytnTestnetBaobab]: 'Klaytn Baobab',
    [ChainId.LightlinkPhoenixMainnet]: 'Lightlink',
    [ChainId.Linea]: 'Linea',
    [ChainId.LineaTestnet]: 'Linea Goerli',
    [ChainId.MantaPacificMainnet]: 'Manta Pacific',
    [ChainId.MaxxChainMainnet]: 'MaxxChain',
    [ChainId.MetisAndromedaMainnet]: 'Metis',
    [ChainId.MetisStardustTestnet]: 'Metis Stardust',
    [ChainId.MilkomedaC1Mainnet]: 'Milkomeda C1',
    [ChainId.Mumbai]: 'Polygon Mumbai',
    [ChainId.NahmiiMainnet]: 'Nahmii',
    [ChainId.OasisEmerald]: 'Oasis Emerald',
    [ChainId.OasisEmeraldTestnet]: 'Oasis Testnet',
    [ChainId.OasysMainnet]: 'Oasys',
    [ChainId.OctaSpace]: 'OctaSpace',
    [ChainId.OpBNBMainnet]: 'opBNB',
    [ChainId.OPMainnet]: 'Optimism',
    [ChainId.OPSepoliaTestnet]: 'Optimism Sepolia',
    [ChainId.OptimismGoerliTestnet]: 'Optimism Goerli',
    [ChainId.PegoNetwork]: 'Pego',
    [ChainId['PGN(PublicGoodsNetwork)']]: 'PGN',
    [ChainId.PolygonMainnet]: 'Polygon',
    [ChainId.PolygonzkEVM]: 'Polygon zkEVM',
    [ChainId.PolygonzkEVMTestnet]: 'Polygon zkEVM Testnet',
    [ChainId.PulseChain]: 'PulseChain',
    [ChainId.PulseChainTestnetv4]: 'PulseChain Testnet',
    [ChainId.RedlightChainMainnet]: 'Redlight',
    [ChainId.RolluxMainnet]: 'Rollux',
    [ChainId.RootstockMainnet]: 'Rootstock',
    [ChainId.Scroll]: 'Scroll',
    [ChainId.ScrollSepoliaTestnet]: 'Scroll Sepolia',
    [ChainId.Sepolia]: 'Ethereum Sepolia',
    [ChainId.Shibarium]: 'Shibarium',
    [ChainId.ShimmerEVM]: 'Shimmer',
    [ChainId.ShimmerEVMTestnet]: 'Shimmer Testnet',
    [ChainId.SmartBitcoinCash]: 'SmartBCH',
    [ChainId['SongbirdCanary-Network']]: 'Songbird',
    [ChainId.SyscoinMainnet]: 'Syscoin',
    [ChainId.SyscoinTanenbaumTestnet]: 'Syscoin Tanenbaum',
    [ChainId.TaikoJolnirL2]: 'Taiko Jolnir',
    [ChainId.TaikoKatlaL2]: 'Taiko Katla',
    [ChainId.TelosEVMMainnet]: 'Telos',
    [ChainId.TelosEVMTestnet]: 'Telos Testnet',
    [ChainId.VelasEVMMainnet]: 'Velas',
    [ChainId['WEMIX3.0Mainnet']]: 'WEMIX',
    [ChainId.XDCNetwork]: 'XDC',
    [ChainId.ZetaChainAthens3Testnet]: 'ZetaChain Athens',
    [ChainId.ZetaChainMainnet]: 'ZetaChain',
    [ChainId.ZKFairMainnet]: 'ZKFair',
    [ChainId.ZkSyncMainnet]: 'zkSync Era',
    [ChainId['ZkSyncEraGoerliTestnet(deprecated)']]: 'zkSync Goerli',
    [ChainId.ZkSyncSepoliaTestnet]: 'zkSync Sepolia',
    [12345678901]: 'Taiko', // TODO: This is a placeholder so we can add a description for Taiko
    [12345678902]: 'Frame', // TODO: This is a placeholder so we can add a description for Frame
  };

  const name = overrides[chainId] ?? getChain(chainId)?.name ?? `Chain ID ${chainId}`;
  if (!isSupportedChain(chainId)) {
    return `${name} (Unsupported)`;
  }

  return name;
};

export const getChainSlug = (chainId: number): string => {
  const chainName = getChainName(chainId);
  return chainName.toLowerCase().replace(' (unsupported)', '').replace(/\s/g, '-');
};

const REVERSE_CHAIN_SLUGS: Record<string, number> = Object.fromEntries(
  SUPPORTED_CHAINS.map((chainId) => [getChainSlug(chainId), chainId]),
);

export const getChainIdFromSlug = (slug: string): number | undefined => {
  return REVERSE_CHAIN_SLUGS[slug];
};

export const getChainExplorerUrl = (chainId: number): string | undefined => {
  const overrides: Record<number, string> = {
    [ChainId.ArbitrumGoerli]: 'https://goerli.arbiscan.io',
    [ChainId.ArbitrumNova]: 'https://nova.arbiscan.io',
    [ChainId.Astar]: 'https://blockscout.com/astar',
    [ChainId.AuroraMainnet]: 'https://explorer.aurora.dev',
    [ChainId.BitTorrentChainMainnet]: 'https://bttcscan.com',
    [ChainId.BitTorrentChainTestnet]: 'https://testnet.bttcscan.com',
    [ChainId.CallistoMainnet]: 'https://explorer.callisto.network',
    [ChainId.Canto]: 'https://tuber.build',
    [ChainId.CeloAlfajoresTestnet]: 'https://alfajores.celoscan.io',
    [ChainId.FuseMainnet]: 'https://explorer.fuse.io',
    [ChainId.Gnosis]: 'https://gnosisscan.io',
    [ChainId.GodwokenMainnet]: 'https://www.gwscan.com',
    [ChainId.KardiaChainMainnet]: 'https://explorer.kardiachain.io',
    [ChainId.Linea]: 'https://lineascan.build',
    [ChainId.LineaTestnet]: 'https://goerli.lineascan.build',
    [ChainId.OasysMainnet]: 'https://scan.oasys.games',
    [ChainId.OptimismGoerliTestnet]: 'https://goerli-optimism.etherscan.io',
    [ChainId.Palm]: 'https://www.ondora.xyz/network/palm',
    [ChainId.PolygonzkEVM]: 'https://zkevm.polygonscan.com',
    [ChainId.PolygonzkEVMTestnet]: 'https://testnet-zkevm.polygonscan.com',
    [ChainId.PulseChain]: 'https://scan.pulsechain.com',
    [ChainId.PulseChainTestnetv4]: 'https://scan.v4.testnet.pulsechain.com',
    [ChainId.Scroll]: 'https://scrollscan.com',
    [ChainId.SmartBitcoinCash]: 'https://www.smartscan.cash',
    [ChainId.Wanchain]: 'https://www.wanscan.org',
    [ChainId.ZetaChainAthens3Testnet]: 'https://zetachain-athens-3.blockscout.com',
  };

  const [explorer] = getChain(chainId)?.explorers ?? [];

  return overrides[chainId] ?? explorer?.url;
};

// This is used on the "Add a network" page
export const getChainFreeRpcUrl = (chainId: number): string | undefined => {
  const overrides: Record<number, string> = {
    [ChainId.ArbitrumOne]: 'https://arb1.arbitrum.io/rpc',
    [ChainId.EthereumMainnet]: 'https://eth.llamarpc.com',
    [ChainId.Goerli]: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    [ChainId.Palm]: 'https://palm-mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  };

  const [rpcUrl] = getChain(chainId)?.rpc ?? [];
  return overrides[chainId] ?? rpcUrl;
};

export const getChainRpcUrl = (chainId: number): string | undefined => {
  const infuraKey = INFURA_API_KEY;
  const alchemyKey = ALCHEMY_API_KEY;

  const overrides: Record<number, string> = {
    [ChainId.ArbitrumGoerli]: `https://arbitrum-goerli.infura.io/v3/${infuraKey}`,
    [ChainId.ArbitrumOne]: `https://arbitrum-mainnet.infura.io/v3/${infuraKey}`,
    [ChainId.ArbitrumSepolia]: `https://arbitrum-sepolia.infura.io/v3/${infuraKey}`,
    [ChainId.Astar]: 'https://evm.astar.network',
    [ChainId['AvalancheC-Chain']]: `https://avalanche-mainnet.infura.io/v3/${infuraKey}`,
    [ChainId.AvalancheFujiTestnet]: `https://avalanche-fuji.infura.io/v3/${infuraKey}`,
    [ChainId.Base]: 'https://mainnet.base.org',
    [ChainId.Canto]: 'https://mainnode.plexnode.org:8545',
    [ChainId.CoreBlockchainMainnet]: 'https://rpc.coredao.org',
    [ChainId.CronosMainnet]: 'https://evm.cronos.org',
    // [ChainId.EthereumMainnet]: `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.EthereumMainnet]: `https://mainnet.infura.io/v3/${infuraKey}`,
    [ChainId.Evmos]: 'https://evmos-evm.publicnode.com',
    [ChainId.FantomTestnet]: 'https://rpc.ankr.com/fantom_testnet',
    [ChainId.Goerli]: `https://goerli.infura.io/v3/${infuraKey}`,
    [ChainId.HorizenEONMainnet]: 'https://eon-rpc.horizenlabs.io/ethv1',
    [ChainId.Linea]: `https://linea-mainnet.infura.io/v3/${infuraKey}`,
    [ChainId.LineaTestnet]: `https://linea-goerli.infura.io/v3/${infuraKey}`,
    [ChainId.Mumbai]: `https://polygon-mumbai.infura.io/v3/${infuraKey}`,
    [ChainId.OPMainnet]: `https://optimism-mainnet.infura.io/v3/${infuraKey}`,
    [ChainId.OPSepoliaTestnet]: `https://optimism-sepolia.infura.io/v3/${infuraKey}`,
    [ChainId.OptimismGoerliTestnet]: `https://optimism-goerli.infura.io/v3/${infuraKey}`,
    [ChainId.PolygonMainnet]: `https://polygon-mainnet.infura.io/v3/${infuraKey}`,
    [ChainId.PolygonzkEVM]: `https://polygonzkevm-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.PolygonzkEVMTestnet]: `https://polygonzkevm-testnet.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.Sepolia]: `https://sepolia.infura.io/v3/${infuraKey}`,
    [ChainId.Shiden]: 'https://shiden.public.blastapi.io',
    [ChainId.XDCNetwork]: 'https://erpc.xdcrpc.com',
    [ChainId.ZetaChainAthens3Testnet]: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    [ChainId['ZkSyncEraGoerliTestnet(deprecated)']]: 'https://testnet.era.zksync.dev',
    [ChainId.ZkSyncSepoliaTestnet]: 'https://sepolia.era.zksync.dev',
    ...RPC_OVERRIDES,
  };

  const [rpcUrl] = getChain(chainId)?.rpc ?? [];
  return overrides[chainId] ?? rpcUrl?.replace('${INFURA_API_KEY}', infuraKey);
};

// We should always use Infura for logs, even if we use a different RPC URL for other purposes
export const getChainLogsRpcUrl = (chainId: number): string | undefined => {
  const infuraKey = INFURA_API_KEY;
  const alchemyKey = ALCHEMY_API_KEY;

  const overrides = {
    [ChainId.ArbitrumGoerli]: `https://arb-goerli.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.ArbitrumOne]: `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.ArbitrumSepolia]: `https://arb-sepolia.g.alchemy.com/v2/${alchemyKey}`,
    // [ChainId.EthereumMainnet]: `https://mainnet.infura.io/v3/${infuraKey}`,
    // [ChainId.Goerli]: `https://goerli.infura.io/v3/${infuraKey}`,
    [ChainId.Mumbai]: `https://polygon-mumbai.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.OPMainnet]: `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.OPSepoliaTestnet]: `https://opt-sepolia.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.OptimismGoerliTestnet]: `https://opt-goerli.g.alchemy.com/v2/${alchemyKey}`,
    [ChainId.PolygonMainnet]: `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    // [ChainId.Sepolia]: `https://sepolia.infura.io/v3/${infuraKey}`,
  };

  return overrides[chainId] ?? getChainRpcUrl(chainId);
};

export const getNFTGetter = (chainId: number): NFTGetter | undefined => {
  const mapping = {
    [ChainId.EthereumMainnet]: new ResevoirNFT(RESEVOIR_API_KEY),
  };

  return mapping[chainId] ?? undefined;
};

export const getChainLogo = (chainId: number): string => {
  const mapping = {
    [ChainId.ArbitrumGoerli]: '/assets/images/vendor/chains/arbitrum.svg',
    [ChainId.ArbitrumNova]: '/assets/images/vendor/chains/arbitrum-nova.svg',
    [ChainId.ArbitrumOne]: '/assets/images/vendor/chains/arbitrum.svg',
    [ChainId.ArbitrumSepolia]: '/assets/images/vendor/chains/arbitrum.svg',
    [ChainId.Astar]: '/assets/images/vendor/chains/astar.svg',
    [ChainId.AuroraMainnet]: '/assets/images/vendor/chains/aurora.svg',
    [ChainId['AvalancheC-Chain']]: '/assets/images/vendor/chains/avalanche.svg',
    [ChainId.AvalancheFujiTestnet]: '/assets/images/vendor/chains/avalanche.svg',
    [ChainId.Base]: '/assets/images/vendor/chains/base.svg',
    [ChainId.BaseGoerliTestnet]: '/assets/images/vendor/chains/base.svg',
    [ChainId.BitgertMainnet]: '/assets/images/vendor/chains/bitgert.svg',
    [ChainId.BitrockMainnet]: '/assets/images/vendor/chains/bitrock.svg',
    [ChainId.BitTorrentChainMainnet]: '/assets/images/vendor/chains/bttc.svg',
    [ChainId.BitTorrentChainTestnet]: '/assets/images/vendor/chains/bttc.svg',
    [ChainId.BNBSmartChainMainnet]: '/assets/images/vendor/chains/bsc.svg',
    [ChainId.BNBSmartChainTestnet]: '/assets/images/vendor/chains/bsc.svg',
    [ChainId.BobaNetwork]: '/assets/images/vendor/chains/boba.jpg',
    [ChainId.CallistoMainnet]: '/assets/images/vendor/chains/callisto.png',
    [ChainId.Canto]: '/assets/images/vendor/chains/canto.svg',
    [ChainId.CeloAlfajoresTestnet]: '/assets/images/vendor/chains/celo.svg',
    [ChainId.CeloMainnet]: '/assets/images/vendor/chains/celo.svg',
    [ChainId.CoinExSmartChainMainnet]: '/assets/images/vendor/chains/coinex.svg',
    [ChainId.CoinExSmartChainTestnet]: '/assets/images/vendor/chains/coinex.svg',
    [ChainId.CoreBlockchainMainnet]: '/assets/images/vendor/chains/core.png',
    [ChainId.CronosMainnet]: '/assets/images/vendor/chains/cronos.svg',
    [ChainId.CronosTestnet]: '/assets/images/vendor/chains/cronos.svg',
    [ChainId.DogechainMainnet]: '/assets/images/vendor/chains/dogechain.jpg',
    [ChainId.ElastosSmartChain]: '/assets/images/vendor/chains/elastos.jpg',
    [ChainId.ENULSMainnet]: '/assets/images/vendor/chains/enuls.svg',
    [ChainId.EOSEVMNetwork]: '/assets/images/vendor/chains/eos.svg',
    [ChainId.EthereumClassic]: '/assets/images/vendor/chains/etc.png',
    [ChainId.EthereumMainnet]: '/assets/images/vendor/chains/ethereum.svg',
    [ChainId.Evmos]: '/assets/images/vendor/chains/evmos.svg',
    [ChainId.EvmosTestnet]: '/assets/images/vendor/chains/evmos.svg',
    [ChainId.ExosamaNetwork]: '/assets/images/vendor/chains/exosama.png',
    [ChainId.FantomOpera]: '/assets/images/vendor/chains/fantom.svg',
    [ChainId.FantomTestnet]: '/assets/images/vendor/chains/fantom.svg',
    [ChainId.FlareMainnet]: '/assets/images/vendor/chains/flare.svg',
    [ChainId.FrameTestnet]: '/assets/images/vendor/chains/frame.jpg',
    [ChainId.FuseMainnet]: '/assets/images/vendor/chains/fuse.png',
    [ChainId.FuseSparknet]: '/assets/images/vendor/chains/fuse.png',
    [ChainId.Gnosis]: '/assets/images/vendor/chains/gnosis.svg',
    [ChainId.Goerli]: '/assets/images/vendor/chains/ethereum.svg',
    [ChainId.Holesky]: '/assets/images/vendor/chains/ethereum.svg',
    [ChainId.GoldXChainMainnet]: '/assets/images/vendor/chains/goldx.jpg',
    [ChainId.HarmonyMainnetShard0]: '/assets/images/vendor/chains/harmony.svg',
    [ChainId.HarmonyTestnetShard0]: '/assets/images/vendor/chains/harmony.svg',
    [ChainId.HorizenEONMainnet]: '/assets/images/vendor/chains/horizen.png',
    [ChainId.HorizenGobiTestnet]: '/assets/images/vendor/chains/horizen.png',
    [ChainId.HuobiECOChainMainnet]: '/assets/images/vendor/chains/heco.svg',
    [ChainId.HuobiECOChainTestnet]: '/assets/images/vendor/chains/heco.svg',
    [ChainId.IoTeXNetworkMainnet]: '/assets/images/vendor/chains/iotex.png',
    [ChainId.IoTeXNetworkTestnet]: '/assets/images/vendor/chains/iotex.png',
    [ChainId.KardiaChainMainnet]: '/assets/images/vendor/chains/kardiachain.svg',
    [ChainId.Kava]: '/assets/images/vendor/chains/kava.svg',
    [ChainId.KavaTestnet]: '/assets/images/vendor/chains/kava.svg',
    [ChainId.KCCMainnet]: '/assets/images/vendor/chains/kcc.svg',
    [ChainId.KlaytnMainnetCypress]: '/assets/images/vendor/chains/klaytn.svg',
    [ChainId.KlaytnTestnetBaobab]: '/assets/images/vendor/chains/klaytn.svg',
    [ChainId.Kroma]: '/assets/images/vendor/chains/kroma.svg',
    [ChainId.KromaSepolia]: '/assets/images/vendor/chains/kroma.svg',
    [ChainId.LightlinkPhoenixMainnet]: '/assets/images/vendor/chains/lightlink.jpg',
    [ChainId.Linea]: '/assets/images/vendor/chains/linea.png',
    [ChainId.LineaTestnet]: '/assets/images/vendor/chains/linea.png',
    [ChainId.MantaPacificMainnet]: '/assets/images/vendor/chains/manta-pacific.svg',
    [ChainId.Mantle]: '/assets/images/vendor/chains/mantle.svg',
    [ChainId.MantleTestnet]: '/assets/images/vendor/chains/mantle.svg',
    [ChainId.MaxxChainMainnet]: '/assets/images/vendor/chains/maxxchain.png',
    [ChainId.MetisAndromedaMainnet]: '/assets/images/vendor/chains/metis.svg',
    [ChainId.MetisStardustTestnet]: '/assets/images/vendor/chains/metis.svg',
    [ChainId.MilkomedaC1Mainnet]: '/assets/images/vendor/chains/milkomeda.svg',
    [ChainId.MoonbaseAlpha]: '/assets/images/vendor/chains/moonbeam.svg',
    [ChainId.Moonbeam]: '/assets/images/vendor/chains/moonbeam.svg',
    [ChainId.Moonriver]: '/assets/images/vendor/chains/moonriver.svg',
    [ChainId.Mumbai]: '/assets/images/vendor/chains/polygon.svg',
    [ChainId.NahmiiMainnet]: '/assets/images/vendor/chains/nahmii.svg',
    [ChainId.OasisEmerald]: '/assets/images/vendor/chains/oasis.png',
    [ChainId.OasisEmeraldTestnet]: '/assets/images/vendor/chains/oasis.png',
    [ChainId.OasisSapphire]: '/assets/images/vendor/chains/oasis.png',
    [ChainId.OasysMainnet]: '/assets/images/vendor/chains/oasys.svg',
    [ChainId.OctaSpace]: '/assets/images/vendor/chains/octaspace.png',
    [ChainId.OpBNBMainnet]: '/assets/images/vendor/chains/bsc.svg',
    [ChainId.OPMainnet]: '/assets/images/vendor/chains/optimism.svg',
    [ChainId.OPSepoliaTestnet]: '/assets/images/vendor/chains/optimism.svg',
    [ChainId.OptimismGoerliTestnet]: '/assets/images/vendor/chains/optimism.svg',
    [ChainId.Palm]: '/assets/images/vendor/chains/palm.png',
    [ChainId.PegoNetwork]: '/assets/images/vendor/chains/pego.jpg',
    [ChainId['PGN(PublicGoodsNetwork)']]: '/assets/images/vendor/chains/pgn.svg',
    [ChainId.PolygonMainnet]: '/assets/images/vendor/chains/polygon.svg',
    [ChainId.PolygonzkEVM]: '/assets/images/vendor/chains/polygon.svg',
    [ChainId.PolygonzkEVMTestnet]: '/assets/images/vendor/chains/polygon.svg',
    [ChainId.PulseChain]: '/assets/images/vendor/chains/pulsechain.png',
    [ChainId.PulseChainTestnetv4]: '/assets/images/vendor/chains/pulsechain.png',
    [ChainId.RedlightChainMainnet]: '/assets/images/vendor/chains/redlight.png',
    [ChainId.RolluxMainnet]: '/assets/images/vendor/chains/rollux.svg',
    [ChainId.RootstockMainnet]: '/assets/images/vendor/chains/rootstock.jpg',
    [ChainId.Scroll]: '/assets/images/vendor/chains/scroll.svg',
    [ChainId.ScrollSepoliaTestnet]: '/assets/images/vendor/chains/scroll.svg',
    [ChainId.Sepolia]: '/assets/images/vendor/chains/ethereum.svg',
    [ChainId.Shibarium]: '/assets/images/vendor/chains/shibarium.svg',
    [ChainId.Shiden]: '/assets/images/vendor/chains/shiden.svg',
    [ChainId.ShimmerEVM]: '/assets/images/vendor/chains/shimmer.svg',
    [ChainId.ShimmerEVMTestnet]: '/assets/images/vendor/chains/shimmer.svg',
    [ChainId.SmartBitcoinCash]: '/assets/images/vendor/chains/smartbch.svg',
    [ChainId.SmartBitcoinCashTestnet]: '/assets/images/vendor/chains/smartbch.svg',
    [ChainId['SongbirdCanary-Network']]: '/assets/images/vendor/chains/songbird.svg',
    [ChainId.SyscoinMainnet]: '/assets/images/vendor/chains/syscoin.svg',
    [ChainId.SyscoinTanenbaumTestnet]: '/assets/images/vendor/chains/syscoin.svg',
    [ChainId.TaikoJolnirL2]: '/assets/images/vendor/chains/taiko.svg',
    [ChainId.TaikoKatlaL2]: '/assets/images/vendor/chains/taiko.svg',
    [ChainId.TelosEVMMainnet]: '/assets/images/vendor/chains/telos.png',
    [ChainId.VelasEVMMainnet]: '/assets/images/vendor/chains/velas.svg',
    [ChainId.Wanchain]: '/assets/images/vendor/chains/wanchain.svg',
    [ChainId['WEMIX3.0Mainnet']]: '/assets/images/vendor/chains/wemix.svg',
    [ChainId.XDCNetwork]: '/assets/images/vendor/chains/xdc.svg',
    [ChainId.ZetaChainAthens3Testnet]: '/assets/images/vendor/chains/zetachain.svg',
    [ChainId.ZKFairMainnet]: '/assets/images/vendor/chains/zkfair.svg',
    [ChainId.ZkSyncMainnet]: '/assets/images/vendor/chains/zksync.jpeg',
    [ChainId['ZkSyncEraGoerliTestnet(deprecated)']]: '/assets/images/vendor/chains/zksync.jpeg',
    [ChainId.ZkSyncSepoliaTestnet]: '/assets/images/vendor/chains/zksync.jpeg',
    [ChainId.Zora]: '/assets/images/vendor/chains/zora.svg',
  };

  return mapping[chainId] ?? '/assets/images/vendor/chains/ethereum.svg';
};

export const getChainInfoUrl = (chainId: number): string | undefined => {
  const overrides = {
    [ChainId.MantaPacificMainnet]: 'https://pacific.manta.network/',
    [ChainId.Moonriver]: 'https://moonbeam.network/networks/moonriver/',
    [ChainId.Shiden]: 'https://shiden.astar.network/',
    [ChainId['SongbirdCanary-Network']]: 'https://flare.network/songbird/',
    [ChainId.Wanchain]: 'https://www.wanchain.org/',
    [ChainId.XDCNetwork]: 'https://xdc.org/',
  };

  const mainnetChainId = getCorrespondingMainnetChainId(chainId);
  const mainnetChainInfoUrl = mainnetChainId ? getChainInfoUrl(mainnetChainId) : undefined;

  return overrides[chainId] ?? mainnetChainInfoUrl ?? getChain(chainId)?.infoURL;
};

export const getChainNativeToken = (chainId: number): string => {
  const overrides = {
    [ChainId.BitgertMainnet]: 'BRISE',
    [ChainId.CoinExSmartChainMainnet]: 'CET',
    [ChainId.CoinExSmartChainTestnet]: 'CETT',
  };

  return overrides[chainId] ?? getChain(chainId)?.nativeCurrency?.symbol ?? 'ETH';
};

// Target a default of around $10-20
export const getDefaultDonationAmount = (nativeToken: string): string => {
  const mapping = {
    ASTR: '300',
    AVAX: '1',
    BCH: '0.1',
    BNB: '0.05',
    BONE: '20',
    BRISE: '100000000',
    BROCK: '20',
    BTT: '20000000',
    CANTO: '100',
    CELO: '20',
    CET: '250',
    CLO: '5000',
    CORE: '10',
    CRO: '100',
    DOGE: '250',
    ELA: '10',
    EOS: '20',
    ETC: '1',
    ETH: '0.01',
    EVMOS: '10',
    FLR: '500',
    FTM: '50',
    FUSE: '100',
    GLMR: '30',
    GTH: '2500',
    HT: '2',
    IOTX: '500',
    KAI: '5000',
    KAVA: '20',
    KCS: '2',
    KLAYTN: '50',
    NULS: '50',
    mADA: '50',
    MATIC: '15',
    METIS: '0.5',
    MNT: '25',
    MOVR: '1',
    OAS: '100',
    ONE: '1000',
    PG: '20',
    PLS: '100000',
    PWR: '1000',
    RBTC: '0.001',
    REDLC: '100',
    ROSE: '100',
    SAMA: '500',
    SDN: '50',
    SGB: '1000',
    SMR: '250',
    SYS: '100',
    TLOS: '100',
    USDC: '10',
    VLX: '2000',
    WAN: '100',
    WEMIX: '20',
    XDAI: '15',
    XDC: '300',
    ZEN: '1',
  };

  return mapping[nativeToken] ?? '1';
};

export const getChainApiUrl = (chainId: number): string | undefined => {
  const apiUrls = {
    [ChainId.ArbitrumGoerli]: 'https://api-goerli.arbiscan.io/api',
    [ChainId.ArbitrumNova]: 'https://api-nova.arbiscan.io/api',
    [ChainId.ArbitrumOne]: 'https://api.arbiscan.io/api',
    [ChainId.Astar]: 'https://blockscout.com/astar/api',
    [ChainId.AuroraMainnet]: 'https://explorer.aurora.dev/api',
    [ChainId['AvalancheC-Chain']]: 'https://api.snowtrace.io/api',
    [ChainId.AvalancheFujiTestnet]: 'https://api-testnet.snowtrace.io/api',
    [ChainId.Base]: 'https://api.basescan.org/api',
    [ChainId.BaseGoerliTestnet]: 'https://api-goerli.basescan.org/api',
    [ChainId.BitgertMainnet]: 'https://brisescan.com/api',
    [ChainId.BitrockMainnet]: 'https://explorer.bit-rock.io/api',
    [ChainId.BitTorrentChainMainnet]: 'https://api.bttcscan.com/api',
    [ChainId.BitTorrentChainTestnet]: 'https://api-testnet.bttcscan.com/api',
    [ChainId.BNBSmartChainMainnet]: 'https://api.bscscan.com/api',
    [ChainId.BNBSmartChainTestnet]: 'https://api-testnet.bscscan.com/api',
    [ChainId.CallistoMainnet]: 'https://explorer.callisto.network/api',
    [ChainId.Canto]: 'https://tuber.build/api',
    [ChainId.CeloAlfajoresTestnet]: 'https://api-alfajores.celoscan.io/api',
    [ChainId.CeloMainnet]: 'https://api.celoscan.io/api',
    [ChainId.CronosMainnet]: 'https://cronos.org/explorer/api',
    [ChainId.CronosTestnet]: 'https://cronos.org/explorer/testnet3/api',
    [ChainId.DogechainMainnet]: 'https://explorer.dogechain.dog/api',
    [ChainId.ElastosSmartChain]: 'https://esc.elastos.io/api',
    [ChainId.ENULSMainnet]: 'https://evmscan.nuls.io/api',
    [ChainId.EOSEVMNetwork]: 'https://explorer.evm.eosnetwork.com/api',
    [ChainId.EthereumClassic]: 'https://blockscout.com/etc/mainnet/api',
    [ChainId.EthereumMainnet]: 'https://api.etherscan.io/api',
    [ChainId.Evmos]: 'https://evm.evmos.org/api',
    [ChainId.FantomOpera]: 'https://api.ftmscan.com/api',
    [ChainId.FantomTestnet]: 'https://api-testnet.ftmscan.com/api',
    [ChainId.FlareMainnet]: 'https://flare-explorer.flare.network/api',
    [ChainId.FrameTestnet]: 'https://explorer.testnet.frame.xyz/api',
    [ChainId.FuseMainnet]: 'https://explorer.fuse.io/api',
    [ChainId.Gnosis]: 'https://api.gnosisscan.io/api',
    [ChainId.GoldXChainMainnet]: 'https://explorer.goldxchain.io/api',
    [ChainId.Holesky]: 'https://api-holesky.etherscan.io/api',
    [ChainId.HorizenEONMainnet]: 'https://eon-explorer.horizenlabs.io/api',
    [ChainId.HorizenGobiTestnet]: 'https://gobi-explorer.horizen.io/api',
    [ChainId.HuobiECOChainMainnet]: 'https://api.hecoinfo.com/api',
    [ChainId.HuobiECOChainTestnet]: 'https://api-testnet.hecoinfo.com/api',
    [ChainId.KardiaChainMainnet]: 'https://explorer.kardiachain.io/api',
    [ChainId.Kava]: 'https://explorer.kava.io/api',
    [ChainId.KavaTestnet]: 'https://explorer.testnet.kava.io/api',
    [ChainId.Kroma]: 'https://api.kromascan.com/api',
    [ChainId.KromaSepolia]: 'https://api-sepolia.kromascan.com/api',
    [ChainId.LightlinkPhoenixMainnet]: 'https://phoenix.lightlink.io/api',
    [ChainId.Linea]: 'https://lineascan.build/api',
    [ChainId.LineaTestnet]: 'https://goerli.lineascan.build/api',
    [ChainId.MantaPacificMainnet]: 'https://manta-pacific.calderaexplorer.xyz/api',
    [ChainId.Mantle]: 'https://explorer.mantle.xyz/api',
    [ChainId.MantleTestnet]: 'https://explorer.testnet.mantle.xyz/api',
    [ChainId.MaxxChainMainnet]: 'https://explorer.maxxchain.org/api',
    [ChainId.MilkomedaC1Mainnet]: 'https://explorer-mainnet-cardano-evm.c1.milkomeda.com/api',
    [ChainId.Moonbeam]: 'https://api-moonbeam.moonscan.io/api',
    [ChainId.Moonriver]: 'https://api-moonriver.moonscan.io/api',
    [ChainId.MoonbaseAlpha]: 'https://api-moonbase.moonscan.io/api',
    [ChainId.Mumbai]: 'https://api-testnet.polygonscan.com/api',
    [ChainId.NahmiiMainnet]: 'https://explorer.nahmii.io/api',
    [ChainId.OasisEmerald]: 'https://explorer.emerald.oasis.dev/api',
    [ChainId.OasisSapphire]: 'https://explorer.sapphire.oasis.io/api',
    [ChainId.OasysMainnet]: 'https://scan.oasys.games/api',
    [ChainId.OctaSpace]: 'https://explorer.octa.space/api',
    [ChainId.OpBNBMainnet]: 'https://api-opbnb.bscscan.com/api',
    [ChainId.Palm]: 'https://explorer.palm.io/api',
    [ChainId.PegoNetwork]: 'https://scan.pego.network/api',
    [ChainId['PGN(PublicGoodsNetwork)']]: 'https://explorer.publicgoods.network/api',
    [ChainId.PolygonMainnet]: 'https://api.polygonscan.com/api',
    [ChainId.PolygonzkEVM]: 'https://api-zkevm.polygonscan.com/api',
    [ChainId.PolygonzkEVMTestnet]: 'https://api-testnet-zkevm.polygonscan.com/api',
    [ChainId.PulseChain]: 'https://scan.pulsechain.com/api',
    [ChainId.PulseChainTestnetv4]: 'https://scan.v4.testnet.pulsechain.com/api',
    [ChainId.RedlightChainMainnet]: 'https://redlightscan.finance/api',
    [ChainId.RolluxMainnet]: 'https://explorer.rollux.com/api',
    [ChainId.RootstockMainnet]: 'https://blockscout.com/rsk/mainnet/api',
    [ChainId.Scroll]: 'https://blockscout.scroll.io/api',
    [ChainId.ScrollSepoliaTestnet]: 'https://sepolia-blockscout.scroll.io/api',
    [ChainId.Shiden]: 'https://blockscout.com/shiden/api',
    [ChainId.ShimmerEVM]: 'https://explorer.evm.shimmer.network/api',
    [ChainId.ShimmerEVMTestnet]: 'https://explorer.evm.testnet.shimmer.network/api',
    [ChainId['SongbirdCanary-Network']]: 'https://songbird-explorer.flare.network/api',
    [ChainId.VelasEVMMainnet]: 'https://evmexplorer.velas.com/api',
    [ChainId['WEMIX3.0Mainnet']]: 'https://api.wemixscan.com/api',
    [ChainId.ZetaChainAthens3Testnet]: 'https://zetachain-athens-3.blockscout.com/api',
    [ChainId.ZKFairMainnet]: 'https://scan.zkfair.io/api',
    [ChainId.ZkSyncMainnet]: 'https://zksync2-mainnet.zkscan.io/api',
    [ChainId.Zora]: 'https://explorer.zora.energy/api',
  };

  return apiUrls[chainId];
};

export const getChainEtherscanPlatformNames = (chainId: number): EtherscanPlatform | undefined => {
  const apiUrl = getChainApiUrl(chainId);
  if (!apiUrl) return undefined;

  const domain = new URL(apiUrl).hostname.split('.').at(-2);
  const subdomain = new URL(apiUrl).hostname.split('.').at(-3)?.split('-').at(-1);
  return { domain, subdomain };
};

export const getChainApiKey = (chainId: number): string | undefined => {
  const platform = getChainEtherscanPlatformNames(chainId);
  return ETHERSCAN_API_KEYS[`${platform?.subdomain}.${platform?.domain}`] ?? ETHERSCAN_API_KEYS[platform?.domain];
};

export const getChainApiRateLimit = (chainId: number): RateLimit => {
  const platform = getChainEtherscanPlatformNames(chainId);
  const customRateLimit =
    ETHERSCAN_RATE_LIMITS[`${platform?.subdomain}.${platform?.domain}`] ?? ETHERSCAN_RATE_LIMITS[platform?.domain];

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
  const platform = getChainEtherscanPlatformNames(chainId);
  const apiKey = getChainApiKey(chainId);
  return `${platform?.domain}:${apiKey}`;
};

export const getCorrespondingMainnetChainId = (chainId: number): number | undefined => {
  const testnets = {
    [ChainId.ArbitrumGoerli]: ChainId.ArbitrumOne,
    [ChainId.ArbitrumSepolia]: ChainId.ArbitrumOne,
    [ChainId.AvalancheFujiTestnet]: ChainId['AvalancheC-Chain'],
    [ChainId.BaseGoerliTestnet]: ChainId.Base,
    [ChainId.BNBSmartChainTestnet]: ChainId.BNBSmartChainMainnet,
    [ChainId.CeloAlfajoresTestnet]: ChainId.CeloMainnet,
    [ChainId.CoinExSmartChainTestnet]: ChainId.CoinExSmartChainMainnet,
    [ChainId.CronosTestnet]: ChainId.CronosMainnet,
    [ChainId.FantomTestnet]: ChainId.FantomOpera,
    [ChainId.FrameTestnet]: 12345678902, // TODO: This is a placeholder so we can add a description for Frame
    [ChainId.Goerli]: ChainId.EthereumMainnet,
    [ChainId.Holesky]: ChainId.EthereumMainnet,
    [ChainId.HorizenGobiTestnet]: ChainId.HorizenEONMainnet,
    [ChainId.KromaSepolia]: ChainId.Kroma,
    [ChainId.LineaTestnet]: ChainId.Linea,
    [ChainId.MantleTestnet]: ChainId.Mantle,
    [ChainId.MoonbaseAlpha]: ChainId.Moonbeam,
    [ChainId.Mumbai]: ChainId.PolygonMainnet,
    [ChainId.OPSepoliaTestnet]: ChainId.OPMainnet,
    [ChainId.OptimismGoerliTestnet]: ChainId.OPMainnet,
    [ChainId.PolygonzkEVMTestnet]: ChainId.PolygonzkEVM,
    [ChainId.PulseChainTestnetv4]: ChainId.PulseChain,
    [ChainId.ScrollSepoliaTestnet]: ChainId.Scroll,
    [ChainId.Sepolia]: ChainId.EthereumMainnet,
    [ChainId.ShimmerEVMTestnet]: ChainId.ShimmerEVM,
    [ChainId.SyscoinTanenbaumTestnet]: ChainId.SyscoinMainnet,
    [ChainId.TaikoJolnirL2]: 12345678901, // TODO: This is a placeholder so we can add a description for Taiko
    [ChainId.TaikoKatlaL2]: 12345678901, // TODO: This is a placeholder so we can add a description for Taiko
    [ChainId.ZetaChainAthens3Testnet]: ChainId.ZetaChainMainnet,
    [ChainId['ZkSyncEraGoerliTestnet(deprecated)']]: ChainId.ZkSyncMainnet,
    [ChainId.ZkSyncSepoliaTestnet]: ChainId.ZkSyncMainnet,
  };

  const canaryNetworks = {
    [ChainId.Moonriver]: ChainId.Moonbeam,
    [ChainId.Shiden]: ChainId.Astar,
    [ChainId['SongbirdCanary-Network']]: ChainId.FlareMainnet,
  };

  return testnets[chainId] ?? canaryNetworks[chainId];
};

export const getChainDeployedContracts = (chainId: number): any | undefined => {
  const MULTICALL = {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  };

  const mapping = {
    [ChainId.ArbitrumGoerli]: { ...MULTICALL },
    [ChainId.ArbitrumNova]: { ...MULTICALL },
    [ChainId.ArbitrumOne]: { ...MULTICALL },
    [ChainId.Astar]: { ...MULTICALL },
    [ChainId.AuroraMainnet]: { ...MULTICALL },
    [ChainId['AvalancheC-Chain']]: { ...MULTICALL },
    [ChainId.AvalancheFujiTestnet]: { ...MULTICALL },
    [ChainId.Base]: { ...MULTICALL },
    [ChainId.BaseGoerliTestnet]: { ...MULTICALL },
    [ChainId.BitgertMainnet]: { ...MULTICALL },
    [ChainId.BitTorrentChainMainnet]: { ...MULTICALL },
    [ChainId.BNBSmartChainMainnet]: { ...MULTICALL },
    [ChainId.BNBSmartChainTestnet]: { ...MULTICALL },
    [ChainId.BobaNetwork]: { ...MULTICALL },
    [ChainId.CallistoMainnet]: { ...MULTICALL },
    [ChainId.Canto]: { ...MULTICALL },
    [ChainId.CeloMainnet]: { ...MULTICALL },
    [ChainId.CeloAlfajoresTestnet]: { ...MULTICALL },
    [ChainId.CoreBlockchainMainnet]: { ...MULTICALL },
    [ChainId.CronosMainnet]: { ...MULTICALL },
    [ChainId.CronosTestnet]: { ...MULTICALL },
    [ChainId.DogechainMainnet]: { ...MULTICALL },
    [ChainId.EOSEVMNetwork]: { ...MULTICALL },
    [ChainId.EthereumMainnet]: {
      ...MULTICALL,
      ensRegistry: { address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' },
      ensUniversalResolver: { address: '0xc0497E381f536Be9ce14B0dD3817cBcAe57d2F62' },
    },
    [ChainId.EthereumClassic]: { ...MULTICALL },
    [ChainId.Evmos]: { ...MULTICALL },
    [ChainId.FantomOpera]: { ...MULTICALL },
    [ChainId.FantomTestnet]: { ...MULTICALL },
    [ChainId.FlareMainnet]: { ...MULTICALL },
    [ChainId.FrameTestnet]: { ...MULTICALL },
    [ChainId.FuseMainnet]: { ...MULTICALL },
    [ChainId.Goerli]: { ...MULTICALL },
    [ChainId.Gnosis]: { ...MULTICALL },
    [ChainId.HarmonyMainnetShard0]: { ...MULTICALL },
    [ChainId.Holesky]: { ...MULTICALL },
    [ChainId.IoTeXNetworkMainnet]: { ...MULTICALL },
    [ChainId.Kava]: { ...MULTICALL },
    [ChainId.KCCMainnet]: { ...MULTICALL },
    [ChainId.Linea]: { ...MULTICALL },
    [ChainId.LineaTestnet]: { ...MULTICALL },
    [ChainId.MantaPacificMainnet]: { ...MULTICALL },
    [ChainId.Mantle]: { ...MULTICALL },
    [ChainId.MantleTestnet]: { ...MULTICALL },
    [ChainId.MetisAndromedaMainnet]: { ...MULTICALL },
    [ChainId.MetisGoerliTestnet]: { ...MULTICALL },
    [ChainId.MilkomedaC1Mainnet]: { ...MULTICALL },
    [ChainId.MoonbaseAlpha]: { ...MULTICALL },
    [ChainId.Moonbeam]: { ...MULTICALL },
    [ChainId.Moonriver]: { ...MULTICALL },
    [ChainId.Mumbai]: { ...MULTICALL },
    [ChainId.OasisEmerald]: { ...MULTICALL },
    [ChainId.OasisSapphire]: { ...MULTICALL },
    [ChainId.OpBNBMainnet]: { ...MULTICALL },
    [ChainId.OPMainnet]: { ...MULTICALL },
    [ChainId.OptimismGoerliTestnet]: { ...MULTICALL },
    [ChainId.Palm]: { ...MULTICALL },
    [ChainId['PGN(PublicGoodsNetwork)']]: { ...MULTICALL },
    [ChainId.PolygonMainnet]: { ...MULTICALL },
    [ChainId.PolygonzkEVM]: { ...MULTICALL },
    [ChainId.PolygonzkEVMTestnet]: { ...MULTICALL },
    // Although multicall is deployed on Pulsechain, it is causing issues
    // [ChainId.PulseChain]: { ...MULTICALL },
    // [ChainId.PulseChainTestnetv4]: { ...MULTICALL },
    [ChainId.RolluxMainnet]: { ...MULTICALL },
    [ChainId.RootstockMainnet]: { ...MULTICALL },
    [ChainId.Scroll]: { ...MULTICALL },
    [ChainId.ScrollSepoliaTestnet]: { ...MULTICALL },
    [ChainId.Sepolia]: { ...MULTICALL },
    [ChainId.ShimmerEVM]: { ...MULTICALL },
    [ChainId['SongbirdCanary-Network']]: { ...MULTICALL },
    [ChainId.SyscoinMainnet]: { ...MULTICALL },
    [ChainId.SyscoinTanenbaumTestnet]: { ...MULTICALL },
    [ChainId.TaikoJolnirL2]: { ...MULTICALL },
    // [ChainId.TaikoKatlaL2]: { ...MULTICALL },
    [ChainId.TelosEVMMainnet]: { ...MULTICALL },
    [ChainId.VelasEVMMainnet]: { ...MULTICALL },
    [ChainId.Wanchain]: {
      multicall3: { address: '0xcDF6A1566e78EB4594c86Fe73Fcdc82429e97fbB' },
    },
    [ChainId.ZKFairMainnet]: { ...MULTICALL },
    [ChainId.ZkSyncMainnet]: {
      multicall3: { address: '0xF9cda624FBC7e059355ce98a31693d299FACd963' },
    },
    [ChainId['ZkSyncEraGoerliTestnet(deprecated)']]: {
      multicall3: { address: '0xF9cda624FBC7e059355ce98a31693d299FACd963' },
    },
    [ChainId.ZkSyncSepoliaTestnet]: {
      multicall3: { address: '0xF9cda624FBC7e059355ce98a31693d299FACd963' },
    },
    [ChainId.Zora]: { ...MULTICALL },
  };

  return mapping[chainId];
};

export const getViemChainConfig = (chainId: number): Chain | undefined => {
  const chainInfo = getChain(chainId);
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
    pollingInterval: 4 * SECOND,
    chain: getViemChainConfig(chainId),
    transport: http(url ?? getChainRpcUrl(chainId)),
    batch: { multicall: true },
  });
};

export const getChainPriceStrategy = (chainId: number): PriceStrategy | undefined => {
  return PRICE_STRATEGIES[chainId];
};

const PRICE_STRATEGIES: Record<number, PriceStrategy> = {
  [ChainId.ArbitrumNova]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // SushiSwap (Router) | WETH -> USDC
      new UniswapV2PriceStrategy({
        address: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
        path: ['0x722E8BdD2ce80A4422E880164f2079488e115365', '0x750ba8b76187092B0D1E87E28daaf484d1b5273b'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.ArbitrumOne]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Uniswap v3 (Factory) | (0.3%) WETH -> (0.05%) USDC
      new UniswapV3ReadonlyPriceStrategy({
        address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        path: [
          toHex(3000, { size: 3 }),
          '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          toHex(500, { size: 3 }),
          '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        ],
        decimals: 6,
      }),
      // Uniswap v3 (Factory) | (1%) WETH -> (0.05%) USDC
      new UniswapV3ReadonlyPriceStrategy({
        address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        path: [
          toHex(10000, { size: 3 }),
          '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          toHex(500, { size: 3 }),
          '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        ],
        decimals: 6,
      }),
    ],
  }),
  [ChainId.Astar]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // ArthSwap (Router) | WASTR -> USDC
      new UniswapV2PriceStrategy({
        address: '0xE915D2393a08a00c5A463053edD31bAe2199b9e7',
        path: ['0xAeaaf0e2c81Af264101B9129C00F4440cCF0F720', '0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.AuroraMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Trisolaris (Router) | NEAR -> USDC
      new UniswapV2PriceStrategy({
        address: '0x2CB45Edb4517d5947aFdE3BEAbF95A582506858B',
        path: ['0xC42C30aC6Cc15faC9bD938618BcaA1a1FaE8501d', '0xB12BFcA5A55806AaF64E99521918A4bf0fC40802'],
        decimals: 6,
        nativeAsset: '0xC9BdeEd33CD01541e1eeD10f90519d2C06Fe3feB',
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId['AvalancheC-Chain']]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Trader JOE (Router) | WAVAX -> USDC
      new UniswapV2PriceStrategy({
        address: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
        path: ['0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'],
        decimals: 6,
      }),
    ],
  }),
  // TODO: Look at integrating Aerodrome (forked from Velodrome) for Base
  // TODO: Can also add BaseSwap (Unsiwap v2)
  [ChainId.Base]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Uniswap v3 (Factory) | (0.3%) WETH -> (0.05%) USDbC
      new UniswapV3ReadonlyPriceStrategy({
        address: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
        path: [
          toHex(3000, { size: 3 }),
          '0x4200000000000000000000000000000000000006',
          toHex(500, { size: 3 }),
          '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
        ],
        decimals: 6,
      }),
      // Uniswap v3 (Factory) | (1%) WETH -> (0.05%) USDbC
      new UniswapV3ReadonlyPriceStrategy({
        address: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
        path: [
          toHex(10000, { size: 3 }),
          '0x4200000000000000000000000000000000000006',
          toHex(500, { size: 3 }),
          '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
        ],
        decimals: 6,
      }),
    ],
  }),
  [ChainId.BitgertMainnet]: undefined, // No liquid stablecoins
  [ChainId.BitrockMainnet]: undefined, // No liquid stablecoins
  [ChainId.BitTorrentChainMainnet]: undefined, // No DEXes that are compatible with other popular DEXes
  [ChainId.BNBSmartChainMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    // TODO: Maybe add Pancakeswap v3 (Uniswap v3)
    strategies: [
      // PancakeSwap v2 | WBNB -> BUSD
      new UniswapV2PriceStrategy({
        address: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
        path: ['0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'],
      }),
      // PancakeSwap v2 | direct to BUSD
      new UniswapV2PriceStrategy({
        address: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
        path: ['0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'],
      }),
    ],
  }),
  [ChainId.BobaNetwork]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // OolongSwap (Router) | WETH -> USDC
      new UniswapV2PriceStrategy({
        address: '0x17C83E2B96ACfb5190d63F5E46d93c107eC0b514',
        path: ['0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000', '0x66a2A913e447d6b4BF33EFbec43aAeF87890FBbc'],
        decimals: 6,
        liquidityParameters: { baseAmount: 10n },
      }),
    ],
  }),
  [ChainId.CallistoMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Soy Finance (Router) | WCLO -> BUSDT
      new UniswapV2PriceStrategy({
        address: '0xeB5B468fAacC6bBdc14c4aacF0eec38ABCCC13e7',
        path: ['0xF5AD6F6EDeC824C7fD54A66d241a227F6503aD3a', '0xbf6c50889d3a620eb42C0F188b65aDe90De958c4'],
        liquidityParameters: { baseAmount: 10n }, // Super low liquidity DEX
      }),
    ],
  }),
  // TODO: Canto DEX is not fully compatible with Uniswap v2, but it might be partially compatible, so we can look into
  // amending the Uniswap v2 strategy to work with it (https://tuber.build/address/0xa252eEE9BDe830Ca4793F054B506587027825a8e)
  [ChainId.Canto]: undefined,
  // TODO: Could benefit from a Curve.fi strategy
  [ChainId.CeloMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Uniswap v3 (Factory) | (0.3%) CELO -> (0.3%) cUSD
      new UniswapV3ReadonlyPriceStrategy({
        address: '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc',
        path: [
          toHex(3000, { size: 3 }),
          '0x471EcE3750Da237f93B8E339c536989b8978a438',
          toHex(3000, { size: 3 }),
          '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        ],
      }),
      // Uniswap v3 (Factory) | direct (0.3%) cUSD
      new UniswapV3ReadonlyPriceStrategy({
        address: '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc',
        path: [toHex(3000, { size: 3 }), '0x765DE816845861e75A25fCA122bb6898B8B1282a'],
      }),
    ],
  }),
  [ChainId.CoinExSmartChainMainnet]: undefined, // No liquid stablecoins
  // Note: CORE apparently has like 5 competing "USDT" coins trading on different DEXes, so for now we added 3
  // different strategies for different DEXes, making sure to use different USDTs for each.
  [ChainId.CoreBlockchainMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // ArcherSwap (Router) | WCORE -> USDT (1)
      new UniswapV2PriceStrategy({
        address: '0x74F56a7560eF0C72Cf6D677e3f5f51C2D579fF15',
        path: ['0x40375C92d9FAf44d2f9db9Bd9ba41a3317a2404f', '0x900101d06A7426441Ae63e9AB3B9b0F63Be145F1'],
        decimals: 6,
        liquidityParameters: { baseAmount: 50n },
      }),
      // IcecreamSwap (Router) | WCORE -> USDT (2)
      new UniswapV2PriceStrategy({
        address: '0xBb5e1777A331ED93E07cF043363e48d320eb96c4',
        path: ['0x40375C92d9FAf44d2f9db9Bd9ba41a3317a2404f', '0x81bCEa03678D1CEF4830942227720D542Aa15817'],
        liquidityParameters: { baseAmount: 50n },
      }),
      // LFGSwap (Router) | WCORE -> USDT (3)
      new UniswapV2PriceStrategy({
        address: '0x42a0F91973536f85B06B310fa9C70215784F35a1',
        path: ['0x40375C92d9FAf44d2f9db9Bd9ba41a3317a2404f', '0x9Ebab27608bD64AFf36f027049aECC69102a0D1e'],
        decimals: 6,
        liquidityParameters: { baseAmount: 50n },
      }),
    ],
  }),
  [ChainId.CronosMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // VVS Finance (Router) | WCRO -> USDC
      new UniswapV2PriceStrategy({
        address: '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae',
        path: ['0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23', '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.DogechainMainnet]: undefined, // All stablecoins on Dogechain are depegged
  [ChainId.ElastosSmartChain]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Glide Finance (Router) | WELA -> ethUSDC
      new UniswapV2PriceStrategy({
        address: '0xec2f2b94465Ee0a7436beB4E38FC8Cf631ECf7DF',
        path: ['0x517E9e5d46C1EA8aB6f78677d6114Ef47F71f6c4', '0xA06be0F5950781cE28D965E5EFc6996e88a8C141'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
      // Glide Finance (Router) | direct to ethUSDC
      new UniswapV2PriceStrategy({
        address: '0xec2f2b94465Ee0a7436beB4E38FC8Cf631ECf7DF',
        path: ['0xA06be0F5950781cE28D965E5EFc6996e88a8C141'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.ENULSMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // PheasantSwap (Router) | WNULS -> USDTN
      new UniswapV2PriceStrategy({
        address: '0x3653d15A4Ed7E9acAA9AC7C5DB812e8A7a90DF9e',
        path: ['0x217dffF57E3b855803CE88a1374C90759Ea071bD', '0x9e5d124Cd49671f3f7B54d4aef43b3930BcF6dE7'],
        liquidityParameters: { baseAmount: 1n }, // Super low liquidity DEX
      }),
    ],
  }),
  [ChainId.EOSEVMNetwork]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Noah Swap (Router) | WEOS -> USDT
      new UniswapV2PriceStrategy({
        address: '0x1c8f68e8AdBD75c23281e5c88E44D0b7023a4238',
        path: ['0xc00592aA41D32D137dC480d9f6d0Df19b860104F', '0x33B57dC70014FD7AA6e1ed3080eeD2B619632B8e'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.EthereumClassic]: undefined, // No liquid stablecoins
  [ChainId.EthereumMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Uniswap v3 (Factory) | (0.3%) WETH -> (0.05%) USDC
      new UniswapV3ReadonlyPriceStrategy({
        address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        path: [
          toHex(3000, { size: 3 }),
          '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          toHex(500, { size: 3 }),
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        ],
        decimals: 6,
      }),
      // Uniswap v3 (Factory) | (1%) WETH -> (0.05%) USDC
      new UniswapV3ReadonlyPriceStrategy({
        address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        path: [
          toHex(10000, { size: 3 }),
          '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          toHex(500, { size: 3 }),
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        ],
        decimals: 6,
      }),
      // SushiSwap (Router) | WETH -> USDC
      new UniswapV2PriceStrategy({
        address: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
        path: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
        decimals: 6,
      }),

      new BackendPriceStrategy({}),
    ],
  }),
  [ChainId.Evmos]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Forge (Factory) | (0.05%) stEVMOS -> (0.05%) axlUSDC
      new UniswapV3ReadonlyPriceStrategy({
        address: '0xf544365e7065966f190155F629cE0182fC68Eaa2',
        path: [
          toHex(500, { size: 3 }),
          '0x2C68D1d6aB986Ff4640b51e1F14C716a076E44C4',
          toHex(500, { size: 3 }),
          '0x15C3Eb3B621d1Bff62CbA1c9536B7c1AE9149b57',
        ],
        decimals: 6,
        nativeAsset: '0xD4949664cD82660AaE99bEdc034a0deA8A0bd517',
      }),
      // Forge (Factory) | (0.05%) stATOM -> (0.05%) stEVMOS -> (0.05%) axlUSDC
      new UniswapV3ReadonlyPriceStrategy({
        address: '0xf544365e7065966f190155F629cE0182fC68Eaa2',
        path: [
          toHex(500, { size: 3 }),
          '0xB5124FA2b2cF92B2D469b249433BA1c96BDF536D',
          toHex(500, { size: 3 }),
          '0x2C68D1d6aB986Ff4640b51e1F14C716a076E44C4',
          toHex(500, { size: 3 }),
          '0x15C3Eb3B621d1Bff62CbA1c9536B7c1AE9149b57',
        ],
        decimals: 6,
        liquidityParameters: { minLiquidity: 10n ** 9n }, // TODO: This is a stopgap to make prices work, fix later
      }),
    ],
  }),
  [ChainId.ExosamaNetwork]: undefined, // <$100k Liquidity
  [ChainId.FantomOpera]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // SpookySwap (Router) | WFTM -> lzUSDC
      new UniswapV2PriceStrategy({
        address: '0x31F63A33141fFee63D4B26755430a390ACdD8a4d',
        path: ['0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', '0x28a92dde19D9989F39A49905d7C9C2FAc7799bDf'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.FlareMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // FLRX (Router) | WFLR -> eUSDT
      new UniswapV2PriceStrategy({
        address: '0x088EeCB467B3968Da36c71F05023A1d3133B2B83',
        path: ['0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d', '0x96B41289D90444B8adD57e6F265DB5aE8651DF29'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.FuseMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Voltage (Router) | WFUSE -> USDT
      new UniswapV2PriceStrategy({
        address: '0xE3F85aAd0c8DD7337427B9dF5d0fB741d65EEEB5',
        path: ['0x0BE9e53fd7EDaC9F859882AfdDa116645287C629', '0xFaDbBF8Ce7D5b7041bE672561bbA99f79c532e10'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.Gnosis]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // HoneySwap (Router) | direct to WXDAI
      new UniswapV2PriceStrategy({
        address: '0x1C232F01118CB8B424793ae03F870aa7D0ac7f77',
        path: ['0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'],
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.GoldXChainMainnet]: undefined, // < $100k Liquidity
  // Note: The "regular" USDC is depegged on Harmony, so we have to be careful to use the "new" USDC
  [ChainId.HarmonyMainnetShard0]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Tranquil Finance (Router) | WONE -> USDC (pegged)
      new UniswapV2PriceStrategy({
        address: '0x3C8BF7e25EbfAaFb863256A4380A8a93490d8065',
        path: ['0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a', '0xbc594cabd205bd993e7ffa6f3e9cea75c1110da5'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.HorizenEONMainnet]: undefined, // <$100k Liquidity
  [ChainId.KardiaChainMainnet]: undefined, // No liquid stablecoins
  // TODO: Potentially add Curve.fi strategy to support KAVA
  [ChainId.Kava]: undefined,
  [ChainId.KCCMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // MojitoSwap (Router) | WKCS -> USDC
      new UniswapV2PriceStrategy({
        address: '0x8c8067ed3bC19ACcE28C1953bfC18DC85A2127F7',
        path: ['0x4446Fc4eb47f2f6586f9fAAb68B3498F86C07521', '0x980a5AfEf3D17aD98635F6C5aebCBAedEd3c3430'],
        liquidityParameters: { baseAmount: 10n },
      }),
      // KuSwap (Router) | WKCS -> USDT
      new UniswapV2PriceStrategy({
        address: '0x8c8067ed3bC19ACcE28C1953bfC18DC85A2127F7',
        path: ['0x4446Fc4eb47f2f6586f9fAAb68B3498F86C07521', '0x0039f574eE5cC39bdD162E9A88e3EB1f111bAF48'],
        liquidityParameters: { baseAmount: 10n },
      }),
    ],
  }),
  // TODO: Add iZiSwap strategy to support Kroma
  [ChainId.Kroma]: undefined,
  [ChainId.LightlinkPhoenixMainnet]: undefined, // <$100k Liquidity
  // TODO: Add SyncSwap strategy to support Linea
  [ChainId.Linea]: undefined,
  // [ChainId.MantaPacificMainnet]: new AggregatePriceStrategy({
  //   aggregationType: AggregationType.ANY,
  //   strategies: [
  //     // TODO: Check back later to see if this is still the best strategy
  //     // ApertureSwap (Factory) | (0.05%) WETH -> (0.05%) USDC
  //     new UniswapV3ReadonlyPriceStrategy({
  //       address: '0x5bd1F6735B80e58aAC88B8A94836854d3068a13a',
  //       path: [
  //         toHex(500, { size: 3 }),
  //         '0x0Dc808adcE2099A9F62AA87D9670745AbA741746',
  //         toHex(500, { size: 3 }),
  //         '0xb73603C5d87fA094B7314C74ACE2e64D165016fb',
  //       ],
  //       decimals: 6,
  //       liquidityParameters: { minLiquidity: 10n ** 15n }, // TODO: This is a stopgap to make prices work, fix later
  //     })
  //   ]
  // }),
  [ChainId.Mantle]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Note: Agni Finance has a separate "Pool Deployer" contract, which is why using the "Factory" address does
      // not work for generating pool addresses. Most likely the Quoter also doesn't work for the same reason.
      // Agni Finance (Pool Deployer) | (0.25%) WMNT -> (0.05%) USDC
      new UniswapV3ReadonlyPriceStrategy({
        address: '0xe9827B4EBeB9AE41FC57efDdDd79EDddC2EA4d03',
        path: [
          toHex(2500, { size: 3 }),
          '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
          toHex(500, { size: 3 }),
          '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
        ],
        decimals: 6,
        poolBytecodeHash: '0xaf9bd540c3449b723624376f906d8d3a0e6441ff18b847f05f4f85789ab64d9a',
      }),
      // Agni Finance (Pool Deployer) | direct to (0.25%) USDT
      new UniswapV3ReadonlyPriceStrategy({
        address: '0xe9827B4EBeB9AE41FC57efDdDd79EDddC2EA4d03',
        path: [toHex(2500, { size: 3 }), '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE'],
        decimals: 6,
        poolBytecodeHash: '0xaf9bd540c3449b723624376f906d8d3a0e6441ff18b847f05f4f85789ab64d9a',
        liquidityParameters: { minLiquidity: 10n ** 9n }, // TODO: This is a stopgap to make WBTC prices work, fix later
      }),
    ],
  }),
  [ChainId.MaxxChainMainnet]: undefined, // <$100k Liquidity
  [ChainId.MetisAndromedaMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // NetSwap (Router) | METIS -> m.USDC
      new UniswapV2PriceStrategy({
        address: '0x1E876cCe41B7b844FDe09E38Fa1cf00f213bFf56',
        path: ['0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000', '0xEA32A96608495e54156Ae48931A7c20f0dcc1a21'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
      // NetSwap (Router) | direct to m.USDC
      new UniswapV2PriceStrategy({
        address: '0x1E876cCe41B7b844FDe09E38Fa1cf00f213bFf56',
        path: ['0xEA32A96608495e54156Ae48931A7c20f0dcc1a21'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.MilkomedaC1Mainnet]: undefined, // No liquid stablecoins
  // TODO: Add Algebra (StellaSwap) strategy to support Moonbeam
  [ChainId.Moonbeam]: undefined,
  [ChainId.Moonriver]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Solarbeam (Router) | WMOVR -> USDC
      new UniswapV2PriceStrategy({
        address: '0xAA30eF758139ae4a7f798112902Bf6d65612045f',
        path: ['0x98878B06940aE243284CA214f92Bb71a2b032B8A', '0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
        feeParameters: { fee: 0n },
      }),
      // BUSD and USDT (don't have a Uniswap v2-compatible pair on Solarbeam)
      new HardcodedPriceStrategy({
        tokens: ['0x5D9ab5522c64E1F6ef5e3627ECCc093f56167818', '0xB44a9B6905aF7c801311e8F4E76932ee959c663C'],
      }),
    ],
  }),
  [ChainId.NahmiiMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // NiiFi (Router) | WETH -> USDC
      new UniswapV2PriceStrategy({
        address: '0x01dF38E20738c58aF8141504aa6C88013d3D6C5A',
        path: ['0x4200000000000000000000000000000000000006', '0xBe5c622cBbF7F9c326D70f795890661FeB5BF2e6'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.OasisEmerald]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // YuzuSwap (Router) | WROSE -> USDT
      new UniswapV2PriceStrategy({
        address: '0x250d48C5E78f1E85F7AB07FEC61E93ba703aE668',
        path: ['0x21C718C22D52d0F3a789b752D4c2fD5908a8A733', '0xdC19A122e268128B5eE20366299fc7b5b199C8e3'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.OasisSapphire]: undefined, // <$100k Liquidity
  [ChainId.OasysMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // TealSwap (Router) | WOAS -> USDT
      new UniswapV2PriceStrategy({
        address: '0x5200000000000000000000000000000000000019',
        path: ['0x5200000000000000000000000000000000000001', '0xDc3af65eCBD339309Ec55F109CB214E0325c5eD4'],
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.OctaSpace]: undefined, // <$100k Liquidity
  [ChainId.OpBNBMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Cubiswap (Router) | WBNB -> USDT
      new UniswapV2PriceStrategy({
        address: '0x1D7DB8a021c81C7BF4df12cACF279B918F2c4337',
        path: ['0x4200000000000000000000000000000000000006', '0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3'],
      }),
      // FDUSD (no pair on Cubiswap)
      new HardcodedPriceStrategy({
        tokens: ['0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'],
      }),
    ],
  }),
  // TODO: Look at integrating Velodrome for OP
  [ChainId.OPMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Uniswap v3 (Factory) | (0.3%) WETH -> (0.05%) USDbC
      new UniswapV3ReadonlyPriceStrategy({
        address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        path: [
          toHex(3000, { size: 3 }),
          '0x4200000000000000000000000000000000000006',
          toHex(500, { size: 3 }),
          '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        ],
        decimals: 6,
      }),
      // Uniswap v3 (Factory) | (1%) WETH -> (0.05%) USDbC
      new UniswapV3ReadonlyPriceStrategy({
        address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        path: [
          toHex(10000, { size: 3 }),
          '0x4200000000000000000000000000000000000006',
          toHex(500, { size: 3 }),
          '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        ],
        decimals: 6,
      }),
    ],
  }),
  [ChainId.Palm]: undefined, // <$100k Liquidity
  [ChainId.PegoNetwork]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // W3swap (Router) | WPG -> USDT
      new UniswapV2PriceStrategy({
        address: '0xE9d6f80028671279a28790bb4007B10B0595Def1',
        path: ['0x0cF4071940782b640d0b595Cb17bDf3E90869d70', '0x02F9Bebf5E54968D8Cc2562356C91ECDE135801B'],
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId['PGN(PublicGoodsNetwork)']]: undefined, // <$100k Liquidity
  [ChainId.PolygonMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    // Note: QuickSwap v3 is forked from Algebra, so we need to create a strategy for it
    strategies: [
      // QuickSwap v2 | WMATIC -> USDC
      new UniswapV2PriceStrategy({
        address: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
        path: ['0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'],
        decimals: 6,
      }),
      // QuickSwap v2 | direct USDC
      new UniswapV2PriceStrategy({
        address: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
        path: ['0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'],
        decimals: 6,
      }),
    ],
  }),
  // TODO: Add Algebra strategy (probably slightly amended from Uniswap v3) to support zkEVM
  [ChainId.PolygonzkEVM]: undefined,
  [ChainId.PulseChain]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    // PulseX (Router) | WPLS -> DAI
    strategies: [
      new UniswapV2PriceStrategy({
        address: '0x98bf93ebf5c380C0e6Ae8e192A7e2AE08edAcc02',
        path: ['0xA1077a294dDE1B09bB078844df40758a5D0f9a27', '0xefD766cCb38EaF1dfd701853BFCe31359239F305'],
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.RedlightChainMainnet]: undefined, // <$100k Liquidity
  [ChainId.RolluxMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // PegaSys v3 (Factory) | (0.3%) WSYS -> (0.3%) USDC
      new UniswapV3ReadonlyPriceStrategy({
        address: '0xeAa20BEA58979386A7d37BAeb4C1522892c74640',
        path: [
          toHex(3000, { size: 3 }),
          '0x4200000000000000000000000000000000000006',
          toHex(3000, { size: 3 }),
          '0x368433CaC2A0B8D76E64681a9835502a1f2A8A30',
        ],
        decimals: 6,
        poolBytecodeHash: '0x4a995152ad4a45ce61f15e514146bc642453130f5c3ef14b85098e9c6266c43d',
        liquidityParameters: { minLiquidity: 10n ** 9n }, // TODO: This is a stopgap to make prices work, fix later
      }),
    ],
  }),
  [ChainId.RootstockMainnet]: undefined, // No DEXes that are compatible with other popular DEXes
  [ChainId.Scroll]: undefined, // TODO: Add DEX when Scroll is live for a bit longer
  [ChainId.Shibarium]: undefined, // No liquid stablecoins
  [ChainId.Shiden]: undefined, // <$100k Liquidity
  [ChainId['SongbirdCanary-Network']]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // FLRX (Router) | WSGB -> exUSDT
      new UniswapV2PriceStrategy({
        address: '0x40fe25Fc866794d468685Bb8AD2E61757400338f',
        path: ['0x02f0826ef6aD107Cfc861152B32B52fD11BaB9ED', '0x1a7b46656B2b8b29B1694229e122d066020503D0'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.ShimmerEVM]: undefined, // TODO: Check back later when the network is more mature
  [ChainId.SyscoinMainnet]: undefined, // <$100k Liquidity
  [ChainId.VelasEVMMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // WagyuSwap (Router) | WVLX -> USDT
      new UniswapV2PriceStrategy({
        address: '0x3D1c58B6d4501E34DF37Cf0f664A58059a188F00',
        path: ['0xc579D1f3CF86749E05CD06f7ADe17856c2CE3126', '0x01445C31581c354b7338AC35693AB2001B50b9aE'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.Wanchain]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // WanSwap (Router) | WWAN -> wanUSDT
      new UniswapV2PriceStrategy({
        address: '0xeA300406FE2eED9CD2bF5c47D01BECa8Ad294Ec1',
        path: ['0xdabD997aE5E4799BE47d6E69D9431615CBa28f48', '0x11e77E27Af5539872efEd10abaA0b408cfd9fBBD'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId['WEMIX3.0Mainnet']]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // WEMIX.FI (Router) | WEMIX -> mUSDC
      new UniswapV2PriceStrategy({
        address: '0x80a5A916FB355A8758f0a3e47891dc288DAC2665',
        path: ['0x7D72b22a74A216Af4a002a1095C8C707d6eC1C5f', '0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.XDCNetwork]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // XSPSwap (Router) | WXDC -> xUSDT
      new UniswapV2PriceStrategy({
        address: '0xf9c5E4f6E627201aB2d6FB6391239738Cf4bDcf9',
        path: ['0x951857744785E80e2De051c32EE7b25f9c458C42', '0xD4B5f10D61916Bd6E0860144a91Ac658dE8a1437'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
      // Globiance (Router) | GBEX -> USDG
      new UniswapV2PriceStrategy({
        address: '0x90055EdC794e839567a5631d42752dB732E10C8F',
        path: ['0x34514748F86A8dA01Ef082306b6d6e738F777f5A', '0x9C1eb1Ea34e70AC05B5EE5515212e9Ec201Cfc5d'],
        decimals: 6,
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  [ChainId.ZKFairMainnet]: new AggregatePriceStrategy({
    aggregationType: AggregationType.ANY,
    strategies: [
      // Sideswap (Router) | WUSDC
      new UniswapV2PriceStrategy({
        address: '0x72E25Dd6a6E75fC8f7820bA2eDEc3F89bB61f7A4',
        path: ['0xD33Db7EC50A98164cC865dfaa64666906d79319C'],
        liquidityParameters: { baseAmount: 100n },
      }),
    ],
  }),
  // TODO: Add SyncSwap strategy to support ZkSync
  [ChainId.ZkSyncMainnet]: undefined,
  [ChainId.Zora]: undefined, // <$100k Liquidity
};
