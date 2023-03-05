import { ChainId, chains } from 'eth-chains';
import { ETHERSCAN_API_KEYS } from 'lib/constants';
import { RateLimit } from 'lib/interfaces';

export const PROVIDER_SUPPORTED_CHAINS = [
  ChainId.EthereumMainnet,
  ChainId.Goerli,
  ChainId.Sepolia,
  ChainId.MetisAndromedaMainnet,
  ChainId.SmartBitcoinCash,
  ChainId.SyscoinTanenbaumTestnet,
  ChainId.SyscoinMainnet,
  ChainId.EthereumClassicMainnet,
  ChainId.CoinExSmartChainMainnet,
  ChainId.CoinExSmartChainTestnet,
  2109, // Exosama
  18159, // Proof of Memes
  // 324, // zkSync Era
  280, // zkSync Era Goerli
];

export const BLOCKSCOUT_SUPPORTED_CHAINS = [
  7700, // Canto
  ChainId.KavaEVM,
  // 2000, // Dogechain
  ChainId.RSKMainnet,
  ChainId.EmeraldParatimeMainnet,
  ChainId.FuseMainnet,
  ChainId.Palm,
  ChainId.CallistoMainnet,
  ChainId.NahmiiMainnet,
  ChainId.FlareMainnet,
  ChainId['SongbirdCanary-Network'],
  ChainId.AuroraMainnet,
  1662, // Horizen Yuma Testnet
  1442, // Polygon zkEVM Testnet
];

export const ETHERSCAN_SUPPORTED_CHAINS = [
  ChainId.BinanceSmartChainMainnet,
  ChainId.BinanceSmartChainTestnet,
  ChainId.PolygonMainnet,
  ChainId.Gnosis,
  ChainId.Mumbai,
  ChainId['AvalancheC-Chain'],
  ChainId.AvalancheFujiTestnet,
  ChainId.FantomOpera,
  ChainId.FantomTestnet,
  ChainId.ArbitrumOne,
  421613, // Arbitrum Goerli
  42170, // Arbitrum Nova
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
  ChainId.IoTeXNetworkMainnet,
  ChainId.Evmos,
  ChainId.GodwokenMainnet,
  ChainId.BobaNetwork,
  ChainId.Astar,
  ChainId.Shiden,
];

export const NODE_SUPPORTED_CHAINS = [ChainId.Optimism, ChainId.OptimisticEthereumTestnetGoerli];

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
  ChainId.ArbitrumOne,
  42170, // Arbitrum Nova
  ChainId.Optimism,
  // 324, // zkSync Era
  ChainId['AvalancheC-Chain'],
  ChainId.FantomOpera,
  ChainId.CronosMainnetBeta,
  ChainId.KavaEVM,
  ChainId.CeloMainnet,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  7700, // Canto
  ChainId.AuroraMainnet,
  ChainId.Gnosis,
  ChainId.RSKMainnet,
  ChainId.MetisAndromedaMainnet,
  ChainId.Astar,
  ChainId.IoTeXNetworkMainnet,
  ChainId.EmeraldParatimeMainnet,
  ChainId.BitTorrentChainMainnet,
  // 2000, // Dogechain
  ChainId.HarmonyMainnetShard0,
  ChainId.GodwokenMainnet,
  ChainId.SmartBitcoinCash,
  ChainId['SongbirdCanary-Network'],
  ChainId.BobaNetwork,
  ChainId.Evmos,
  ChainId.FuseMainnet,
  ChainId.SyscoinMainnet,
  ChainId.CallistoMainnet,
  ChainId.NahmiiMainnet,
  ChainId.CoinExSmartChainMainnet,
  ChainId.FlareMainnet,
  ChainId.Shiden,
  ChainId.EthereumClassicMainnet,
  ChainId.Palm,
  2109, // Exosama
  18159, // Proof of Memes
];

export const CHAIN_SELECT_TESTNETS = [
  ChainId.Goerli,
  ChainId.Sepolia,
  ChainId.BinanceSmartChainTestnet,
  ChainId.Mumbai,
  1442, // Polygon zkEVM Testnet
  421613, // Arbitrum Goerli
  ChainId.OptimisticEthereumTestnetGoerli,
  280, // zkSync Goerli
  ChainId.AvalancheFujiTestnet,
  ChainId.FantomTestnet,
  ChainId.CronosTestnet,
  ChainId.CeloAlfajoresTestnet,
  ChainId.MoonbaseAlpha,
  ChainId.CoinExSmartChainTestnet,
  ChainId.SyscoinTanenbaumTestnet,
  1662, // Horizen Yuma Testnet
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
  const overrides = {
    [ChainId.EthereumMainnet]: 'Ethereum',
    [ChainId.BinanceSmartChainMainnet]: 'Binance Smart Chain',
    [ChainId['AvalancheC-Chain']]: 'Avalanche',
    [ChainId.PolygonMainnet]: 'Polygon',
    [ChainId.ArbitrumOne]: 'Arbitrum',
    [42170]: 'Arbitrum Nova',
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
    [ChainId.EthereumClassicMainnet]: 'Ethereum Classic',
    [7700]: 'Canto',
    [ChainId.KavaEVM]: 'Kava',
    [ChainId.KavaEVMTestnet]: 'Kava Testnet',
    [2000]: 'Dogechain',
    [568]: 'Dogechain Testnet',
    [ChainId.CallistoMainnet]: 'Callisto',
    [ChainId.NahmiiMainnet]: 'Nahmii',
    [ChainId.CoinExSmartChainMainnet]: 'CoinEx Smart Chain',
    [ChainId.CoinExSmartChainTestnet]: 'CoinEx Testnet',
    [2109]: 'Exosama',
    [18159]: 'Proof of Memes',
    [ChainId.FlareMainnet]: 'Flare',
    [ChainId['SongbirdCanary-Network']]: 'Songbird',
    [ChainId.BobaNetwork]: 'Boba',
    [1662]: 'Horizen Yuma',
    [324]: 'zkSync Era',
    [280]: 'zkSync Era Goerli',
    [1442]: 'Polygon Test-zkEVM',
  };

  return overrides[chainId] ?? chains.get(chainId)?.name ?? `Chain with ID ${chainId}`;
};

export const getChainExplorerUrl = (chainId: number): string | undefined => {
  const overrides = {
    [ChainId.SmartBitcoinCash]: 'https://smartscan.cash',
    [ChainId.Moonbeam]: 'https://moonbeam.moonscan.io',
    [ChainId.Moonriver]: 'https://moonriver.moonscan.io',
    [ChainId.CeloMainnet]: 'https://celoscan.io',
    [ChainId.CeloAlfajoresTestnet]: 'https://alfajores.celoscan.io',
    [ChainId.AuroraMainnet]: 'https://explorer.aurora.dev',
    [ChainId.BitTorrentChainMainnet]: 'https://bttcscan.com',
    [ChainId.BitTorrentChainTestnet]: 'https://testnet.bttcscan.com',
    [ChainId.CLVParachain]: 'https://clvscan.com',
    [ChainId.SyscoinTanenbaumTestnet]: 'https://tanenbaum.io',
    [ChainId.SyscoinMainnet]: 'https://explorer.syscoin.org',
    [ChainId.Astar]: 'https://blockscout.com/astar',
    [ChainId.Gnosis]: 'https://gnosisscan.io',
    [421613]: 'https://goerli.arbiscan.io',
    [42170]: 'https://nova.arbiscan.io',
    [7700]: 'https://evm.explorer.canto.io',
    [ChainId.KavaEVM]: 'https://explorer.kava.io',
    [ChainId.KavaEVMTestnet]: 'https://explorer.testnet.kava.io',
    [2000]: 'https://explorer.dogechain.dog',
    [568]: 'https://explorer-testnet.dogechain.dog',
    [2109]: 'https://explorer.exosama.com',
    [18159]: 'https://memescan.io',
    [ChainId.FlareMainnet]: 'https://flare-explorer.flare.network',
    [ChainId['SongbirdCanary-Network']]: 'https://songbird-explorer.flare.network',
    [1662]: 'https://yuma-explorer.horizen.io',
    [324]: 'https://explorer.zksync.io',
    [280]: 'https://goerli.explorer.zksync.io',
    [1442]: 'https://explorer.public.zkevm-test.net',
  };

  const [explorer] = chains.get(chainId)?.explorers ?? [];

  return overrides[chainId] ?? explorer?.url;
};

export const getChainRpcUrl = (chainId: number, infuraKey: string = ''): string | undefined => {
  // These are not in the eth-chains package, so manually got from chainlist.org
  const overrides = {
    [ChainId.ArbitrumOne]: 'https://arb1.arbitrum.io/rpc',
    [421613]: 'https://goerli-rollup.arbitrum.io/rpc',
    [42170]: 'https://nova.arbitrum.io/rpc',
    [ChainId.Moonbeam]: 'https://rpc.api.moonbeam.network',
    [ChainId.Sepolia]: `https://sepolia.infura.io/v3/${infuraKey}`,
    [ChainId.Shiden]: 'https://shiden.api.onfinality.io/public',
    [ChainId.GodwokenMainnet]: 'https://v1.mainnet.godwoken.io/rpc',
    [7700]: 'https://canto.slingshot.finance',
    [2000]: 'https://rpc.dogechain.dog',
    [ChainId.FantomTestnet]: 'https://rpc.ankr.com/fantom_testnet',
    [ChainId.KavaEVMTestnet]: 'https://evm.testnet.kava.io',
    [ChainId.Evmos]: 'https://evmos-evm.publicnode.com',
    [ChainId.CallistoMainnet]: 'https://rpc.callisto.network',
    [ChainId.Astar]: 'https://evm.astar.network',
    [ChainId.Optimism]: 'https://optimism-mainnet.public.blastapi.io',
    [2109]: 'https://rpc.exosama.com',
    [18159]: 'https://mainnet-rpc.memescan.io',
    [ChainId.FlareMainnet]: 'https://flare-api.flare.network/ext/C/rpc',
    [ChainId['SongbirdCanary-Network']]: 'https://songbird-api.flare.network/ext/C/rpc',
    [ChainId.CronosMainnetBeta]: 'https://node.croswap.com/rpc',
    [ChainId.CronosTestnet]: 'https://evm-t3.cronos.org',
    [ChainId.Mumbai]: 'https://polygon-mumbai.blockpi.network/v1/rpc/public',
    [1662]: 'https://yuma-testnet.horizenlabs.io/ethv1', // Horizen Dune Testnet
    [324]: 'https://zksync2-mainnet.zksync.io',
    [280]: 'https://zksync2-testnet.zksync.dev',
    [1442]: 'https://rpc.public.zkevm-test.net',
  };

  const [rpcUrl] = chains.get(chainId)?.rpc ?? [];
  return overrides[chainId] ?? rpcUrl?.replace('${INFURA_API_KEY}', infuraKey);
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
    [42170]: '/assets/images/vendor/chains/arbitrum-nova.svg',
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
    [ChainId.BitTorrentChainMainnet]: '/assets/images/vendor/chains/bttc.png',
    [ChainId.BitTorrentChainTestnet]: '/assets/images/vendor/chains/bttc.png',
    [ChainId.CLVParachain]: '/assets/images/vendor/chains/clover.jpeg',
    [ChainId.SyscoinTanenbaumTestnet]: '/assets/images/vendor/chains/syscoin.png',
    [ChainId.SyscoinMainnet]: '/assets/images/vendor/chains/syscoin.png',
    [ChainId.Astar]: '/assets/images/vendor/chains/astar.png',
    [ChainId.Shiden]: '/assets/images/vendor/chains/shiden.svg',
    [ChainId.GodwokenMainnet]: '/assets/images/vendor/chains/godwoken.png',
    [ChainId['GodwokenTestnet(V1.1)']]: '/assets/images/vendor/chains/godwoken.png',
    [ChainId.EmeraldParatimeMainnet]: '/assets/images/vendor/chains/oasis.png',
    [ChainId.EmeraldParatimeTestnet]: '/assets/images/vendor/chains/oasis.png',
    [ChainId.EthereumClassicMainnet]: '/assets/images/vendor/chains/etc.png',
    [7700]: '/assets/images/vendor/chains/canto.png',
    [ChainId.KavaEVM]: '/assets/images/vendor/chains/kava.png',
    [ChainId.KavaEVMTestnet]: '/assets/images/vendor/chains/kava.png',
    [2000]: '/assets/images/vendor/chains/dogechain.png',
    [568]: '/assets/images/vendor/chains/dogechain.png',
    [ChainId.CallistoMainnet]: '/assets/images/vendor/chains/callisto.png',
    [ChainId.NahmiiMainnet]: '/assets/images/vendor/chains/nahmii.png',
    [ChainId.CoinExSmartChainMainnet]: '/assets/images/vendor/chains/coinex.png',
    [ChainId.CoinExSmartChainTestnet]: '/assets/images/vendor/chains/coinex.png',
    [2109]: '/assets/images/vendor/chains/exosama.png',
    [18159]: '/assets/images/vendor/chains/proof-of-memes.jpeg',
    [ChainId.FlareMainnet]: '/assets/images/vendor/chains/flare.png',
    [ChainId['SongbirdCanary-Network']]: '/assets/images/vendor/chains/songbird.webp',
    [ChainId.BobaNetwork]: '/assets/images/vendor/chains/boba.jpeg',
    [1662]: '/assets/images/vendor/chains/horizen.png',
    [324]: '/assets/images/vendor/chains/zksync.jpeg',
    [280]: '/assets/images/vendor/chains/zksync.jpeg',
    [1442]: '/assets/images/vendor/chains/polygon.png',
  };

  return mapping[chainId] ?? '/assets/images/vendor/chains/ethereum.png';
};

export const getChainNativeToken = (chainId: number): string => {
  const overrides = {
    [7700]: 'CANTO',
    [2000]: 'DOGE',
    [568]: 'DOGE',
    [ChainId.CoinExSmartChainMainnet]: 'CET',
    [ChainId.CoinExSmartChainTestnet]: 'CETT',
    [2109]: 'SAMA',
    [18159]: 'POM',
    [1662]: 'TZEN',
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
    POM: '2500',
    SGB: '1000',
    FLR: '500',
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
    [421613]: 'https://api-goerli.arbiscan.io/api',
    [42170]: 'https://api-nova.arbiscan.io/api',
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
    [7700]: 'https://evm.explorer.canto.io/api',
    [ChainId.KavaEVM]: 'https://explorer.kava.io/api',
    [ChainId.KavaEVMTestnet]: 'https://explorer.testnet.kava.io/api',
    [2000]: 'https://explorer.dogechain.dog/api',
    [568]: 'https://explorer-testnet.dogechain.dog/api',
    [ChainId.RSKMainnet]: 'https://blockscout.com/rsk/mainnet/api',
    [ChainId.EmeraldParatimeMainnet]: 'https://explorer.emerald.oasis.dev/api',
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
    [1662]: 'https://yuma-explorer.horizen.io/api',
    [1442]: 'https://explorer.public.zkevm-test.net/api',
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
