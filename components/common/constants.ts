import { ChainId } from 'eth-chains';

export const TRUSTWALLET_BASE_URL = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains';
export const DAPP_LIST_BASE_URL = '/dapp-contract-list';
export const ETHEREUM_LISTS_CONTRACTS = 'https://raw.githubusercontent.com/ethereum-lists/contracts/main';
export const EXTENSION_URL = 'https://chrome.google.com/webstore/detail/revokecash/nmniboccheadcclilkfkonokbcoceced';

export const ADDRESS_ZERO_PADDED = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const DUMMY_ADDRESS = '0x0000000000000000000000000000000000000001';
export const DUMMY_ADDRESS_2 = '0x0000000000000000000000000000000000000002';
export const OPENSEA_REGISTRY_ADDRESS = '0xa5409ec958C83C3f309868babACA7c86DCB077c1';
export const MOONBIRDS_ADDRESS = '0x23581767a106ae21c074b2276D25e5C3e136a68b';

export const IRON_OPTIONS = {
  cookieName: 'revoke_session',
  password: process.env.IRON_SESSION_PASSWORD,
  ttl: 60 * 60 * 24,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export const PROVIDER_SUPPORTED_NETWORKS = [
  ChainId.EthereumMainnet,
  ChainId.EthereumTestnetRopsten,
  ChainId.EthereumTestnetRinkeby,
  ChainId.EthereumTestnetGörli,
  ChainId.EthereumTestnetKovan,
  ChainId.TelosEVMMainnet,
  ChainId.TelosEVMTestnet,
  ChainId.XDAIChain,
  ChainId.MetisAndromedaMainnet,
  ChainId.MetisStardustTestnet,
  ChainId.SmartBitcoinCash,
  ChainId.SmartBitcoinCashTestnet,
  ChainId.FuseMainnet,
  ChainId.FuseSparknet,
  ChainId.SyscoinTanenbaumTestnet,
  57, // Syscoin Mainnet
];

export const ETHERSCAN_SUPPORTED_NETWORKS = [
  ChainId.BinanceSmartChainMainnet,
  ChainId.BinanceSmartChainTestnet,
  ChainId.PolygonMainnet,
  ChainId.PolygonTestnetMumbai,
  ChainId.AvalancheMainnet,
  ChainId.AvalancheFujiTestnet,
  ChainId.FantomOpera,
  ChainId.FantomTestnet,
  ChainId.ArbitrumOne,
  ChainId.ArbitrumTestnetRinkeby,
  ChainId.HuobiECOChainMainnet,
  ChainId.HuobiECOChainTestnet,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.MoonbaseAlpha,
  ChainId.CronosMainnetBeta,
  ChainId.CeloMainnet,
  ChainId.CeloAlfajoresTestnet,
  ChainId.AuroraMainNet,
  ChainId.AuroraTestNet,
  ChainId.BitTorrentChainMainnet,
  ChainId.BitTorrentChainTestnet,
  ChainId.CloverMainnet,
];

// We disable some of these chains because there's not a lot of demand for them, but they are intensive on the backend
// We also disable testnets for the same reason
export const COVALENT_SUPPORTED_NETWORKS = [
  ChainId.RSKMainnet,
  // ChainId.RSKTestnet,
  ChainId.HarmonyMainnetShard0,
  // ChainId.HarmonyTestnetShard0,
  ChainId.IoTeXNetworkMainnet,
  // ChainId.IoTeXNetworkTestnet,
  ChainId.KlaytnMainnetCypress,
  // ChainId.KlaytnTestnetBaobab,
  9001, // Evmos Mainnet (not in the eth-chains library)
  ChainId.PalmMainnet,
  // ChainId.PalmTestnet,
  592, // Astar Mainnet
  ChainId.Shiden,
  // ChainId.PolyjuiceTestnet,
];

export const NODE_SUPPORTED_NETWORKS = [ChainId.OptimisticEthereum];

export const SUPPORTED_NETWORKS = [
  ...PROVIDER_SUPPORTED_NETWORKS,
  ...ETHERSCAN_SUPPORTED_NETWORKS,
  ...COVALENT_SUPPORTED_NETWORKS,
  ...NODE_SUPPORTED_NETWORKS,
];
