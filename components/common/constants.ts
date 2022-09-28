import Resolution from '@unstoppabledomains/resolution';
import { ChainId } from 'eth-chains';
import { providers } from 'ethers';
import { IronSessionOptions } from 'iron-session';

export const TRUSTWALLET_BASE_URL = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains';
export const DAPP_LIST_BASE_URL = '/dapp-contract-list';
export const ETHEREUM_LISTS_CONTRACTS = 'https://raw.githubusercontent.com/ethereum-lists/contracts/main';
export const CHROME_EXTENSION_URL =
  'https://chrome.google.com/webstore/detail/revokecash/nmniboccheadcclilkfkonokbcoceced';
export const FIREFOX_EXTENSION_URL = 'https://addons.mozilla.org/en-US/firefox/addon/revoke-cash/';
export const DISCORD_URL = 'https://discord.gg/revoke-cash';
export const GITCOIN_URL = 'https://gitcoin.co/grants/259/revokecash-helping-you-stay-safe-in-web3';

export const ADDRESS_ZERO_PADDED = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const DUMMY_ADDRESS = '0x0000000000000000000000000000000000000001';
export const DUMMY_ADDRESS_2 = '0x0000000000000000000000000000000000000002';
export const OPENSEA_REGISTRY_ADDRESS = '0xa5409ec958C83C3f309868babACA7c86DCB077c1';
export const MOONBIRDS_ADDRESS = '0x23581767a106ae21c074b2276D25e5C3e136a68b';
export const DONATION_ADDRESS = '0xfcBf17200C64E860F6639aa12B525015d115F863'; // revoke.kalis.eth

export const ENS_RESOLUTION =
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY && new providers.AlchemyProvider(1, process.env.NEXT_PUBLIC_ALCHEMY_API_KEY);

export const UNS_RESOLUTION =
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY &&
  new Resolution({
    sourceConfig: {
      uns: {
        locations: {
          Layer1: {
            url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
            network: 'mainnet',
          },
          Layer2: {
            url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
            network: 'polygon-mainnet',
          },
        },
      },
    },
  });

export const IRON_OPTIONS: IronSessionOptions = {
  cookieName: 'revoke_session',
  password: process.env.IRON_SESSION_PASSWORD,
  ttl: 60 * 60 * 24,
  cookieOptions: {
    secure: true, // Change this to false when locally testing on Safari, must be true for locally testing Gnosis Safe
    sameSite: 'none',
  },
};

export const PROVIDER_SUPPORTED_NETWORKS = [
  ChainId.EthereumMainnet,
  ChainId.Ropsten,
  ChainId.Rinkeby,
  ChainId.Goerli,
  ChainId.Kovan,
  ChainId.Sepolia,
  ChainId.TelosEVMMainnet,
  ChainId.TelosEVMTestnet,
  ChainId.Gnosis,
  ChainId.MetisAndromedaMainnet,
  ChainId.MetisStardustTestnet,
  ChainId.SmartBitcoinCash,
  ChainId.SmartBitcoinCashTestnet,
  ChainId.FuseMainnet,
  ChainId.FuseSparknet,
  ChainId.SyscoinTanenbaumTestnet,
  ChainId.SyscoinMainnet,
];

export const ETHERSCAN_SUPPORTED_NETWORKS = [
  ChainId.BinanceSmartChainMainnet,
  ChainId.BinanceSmartChainTestnet,
  ChainId.PolygonMainnet,
  ChainId.Mumbai,
  ChainId['AvalancheC-Chain'],
  ChainId.AvalancheFujiTestnet,
  ChainId.FantomOpera,
  ChainId.FantomTestnet,
  ChainId.ArbitrumOne,
  ChainId.ArbitrumRinkeby,
  ChainId.HuobiECOChainMainnet,
  ChainId.HuobiECOChainTestnet,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.MoonbaseAlpha,
  ChainId.CronosMainnetBeta,
  ChainId.CronosTestnet,
  ChainId.CeloMainnet,
  ChainId.CeloAlfajoresTestnet,
  ChainId.AuroraMainnet,
  ChainId.AuroraTestnet,
  ChainId.BitTorrentChainMainnet,
  ChainId.BitTorrentChainTestnet,
  ChainId.CLVParachain,
];

// We disable some of these chains because there's not a lot of demand for them, but they are intensive on the backend
// We also disable testnets for the same reason
export const COVALENT_SUPPORTED_NETWORKS = [
  ChainId.RSKMainnet,
  ChainId.RSKTestnet,
  ChainId.HarmonyMainnetShard0,
  // ChainId.HarmonyTestnetShard0,
  ChainId.IoTeXNetworkMainnet,
  // ChainId.IoTeXNetworkTestnet,
  ChainId.KlaytnMainnetCypress,
  // ChainId.KlaytnTestnetBaobab,
  ChainId.Evmos,
  ChainId.EvmosTestnet,
  ChainId.Palm,
  // ChainId.PalmTestnet,
  ChainId.Astar,
  ChainId.Shiden,
  ChainId.GodwokenMainnet,
  // ChainId.PolyjuiceTestnet,
  // ChainId['GodwokenTestnet(V1.1)'],
];

export const NODE_SUPPORTED_NETWORKS = [ChainId.Optimism, ChainId.OptimisticEthereumTestnetGoerli];

export const SUPPORTED_NETWORKS = [
  ...PROVIDER_SUPPORTED_NETWORKS,
  ...ETHERSCAN_SUPPORTED_NETWORKS,
  ...COVALENT_SUPPORTED_NETWORKS,
  ...NODE_SUPPORTED_NETWORKS,
];

// Make sure to update these lists when updating the above lists
// Order is loosely based on TVL (as per DeFiLlama)
export const NETWORK_SELECT_MAINNETS = [
  ChainId.EthereumMainnet,
  ChainId.BinanceSmartChainMainnet,
  ChainId['AvalancheC-Chain'],
  ChainId.PolygonMainnet,
  ChainId.ArbitrumOne,
  ChainId.Optimism,
  ChainId.CronosMainnetBeta,
  ChainId.FantomOpera,
  ChainId.KlaytnMainnetCypress,
  ChainId.Gnosis,
  ChainId.AuroraMainnet,
  ChainId.CeloMainnet,
  ChainId.HuobiECOChainMainnet,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.RSKMainnet,
  ChainId.MetisAndromedaMainnet,
  ChainId.TelosEVMMainnet,
  ChainId.Astar,
  ChainId.IoTeXNetworkMainnet,
  ChainId.HarmonyMainnetShard0,
  ChainId.GodwokenMainnet,
  ChainId.SmartBitcoinCash,
  ChainId.FuseMainnet,
  ChainId.Evmos,
  ChainId.SyscoinMainnet,
  ChainId.Shiden,
  ChainId.CLVParachain,
  ChainId.BitTorrentChainMainnet,
  ChainId.Palm,
];

export const NETWORK_SELECT_TESTNETS = [
  ChainId.Goerli,
  ChainId.Sepolia,
  ChainId.Ropsten,
  ChainId.Rinkeby,
  ChainId.Kovan,
  ChainId.BinanceSmartChainTestnet,
  ChainId.AvalancheFujiTestnet,
  ChainId.Mumbai,
  ChainId.ArbitrumRinkeby,
  ChainId.OptimisticEthereumTestnetGoerli,
  ChainId.CronosTestnet,
  ChainId.FantomTestnet,
  // ChainId.KlaytnTestnetBaobab,
  ChainId.AuroraTestnet,
  ChainId.CeloAlfajoresTestnet,
  ChainId.HuobiECOChainTestnet,
  ChainId.MoonbaseAlpha,
  ChainId.RSKTestnet,
  ChainId.MetisStardustTestnet,
  ChainId.TelosEVMTestnet,
  // ChainId.IoTeXNetworkTestnet,
  // ChainId.HarmonyTestnetShard0,
  // ChainId['GodwokenTestnet(V1.1)'],
  // ChainId.PolyjuiceTestnet,
  ChainId.SmartBitcoinCashTestnet,
  ChainId.FuseSparknet,
  ChainId.EvmosTestnet,
  ChainId.SyscoinTanenbaumTestnet,
  ChainId.BitTorrentChainTestnet,
  // ChainId.PalmTestnet,
];
