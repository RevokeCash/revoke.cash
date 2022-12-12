import Resolution from '@unstoppabledomains/resolution';
import { ChainId } from 'eth-chains';
import { providers } from 'ethers';
import type { IronSessionOptions } from 'iron-session';

export const DAPP_LIST_BASE_URL = '/dapp-contract-list';
export const ETHEREUM_LISTS_CONTRACTS = 'https://raw.githubusercontent.com/ethereum-lists/contracts/main';
export const CHROME_EXTENSION_URL =
  'https://chrome.google.com/webstore/detail/revokecash/nmniboccheadcclilkfkonokbcoceced';
export const FIREFOX_EXTENSION_URL = 'https://addons.mozilla.org/en-US/firefox/addon/revoke-cash/';
export const DISCORD_URL = 'https://discord.gg/revoke-cash';
export const GITCOIN_URL = 'https://gitcoin.co/grants/259/revokecash-helping-you-stay-safe-in-web3';
export const GITHUB_URL = 'https://github.com/RevokeCash/revoke.cash';
export const TWITTER_URL = 'https://twitter.com/RevokeCash';

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

export const PROVIDER_SUPPORTED_CHAINS = [
  ChainId.EthereumMainnet,
  ChainId.Goerli,
  ChainId.Sepolia,
  ChainId.Gnosis,
  ChainId.MetisAndromedaMainnet,
  ChainId.SmartBitcoinCash,
  ChainId.SyscoinTanenbaumTestnet,
  ChainId.SyscoinMainnet,
  ChainId.EthereumClassicMainnet,
];

export const BLOCKSCOUT_SUPPORTED_CHAINS = [
  7700, // Canto
  ChainId.KavaEVM,
  ChainId.KavaEVMTestnet,
  2000, // Dogechain
  ChainId.RSKMainnet,
  ChainId.Evmos,
  ChainId.EmeraldParatimeMainnet,
  ChainId.FuseMainnet,
  ChainId.Palm,
];

export const ETHERSCAN_SUPPORTED_CHAINS = [
  ChainId.BinanceSmartChainMainnet,
  ChainId.BinanceSmartChainTestnet,
  ChainId.PolygonMainnet,
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
  ChainId.AuroraMainnet,
  ChainId.AuroraTestnet,
  ChainId.BitTorrentChainMainnet,
  ...BLOCKSCOUT_SUPPORTED_CHAINS,
];

export const COVALENT_SUPPORTED_CHAINS = [
  ChainId.RSKTestnet,
  ChainId.HarmonyMainnetShard0,
  ChainId.IoTeXNetworkMainnet,
  ChainId.PalmTestnet,
  ChainId.Astar,
  ChainId.GodwokenMainnet,
  ChainId['GodwokenTestnet(V1.1)'],
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
  ChainId['AvalancheC-Chain'],
  ChainId.PolygonMainnet,
  ChainId.ArbitrumOne,
  42170, // Arbitrum Nova
  ChainId.Optimism,
  ChainId.CronosMainnetBeta,
  ChainId.FantomOpera,
  ChainId.KavaEVM,
  ChainId.Gnosis,
  7700, // Canto
  ChainId.AuroraMainnet,
  ChainId.CeloMainnet,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.RSKMainnet,
  ChainId.MetisAndromedaMainnet,
  ChainId.Astar,
  ChainId.IoTeXNetworkMainnet,
  ChainId.EmeraldParatimeMainnet,
  ChainId.HarmonyMainnetShard0,
  2000, // Dogechain
  ChainId.GodwokenMainnet,
  ChainId.SmartBitcoinCash,
  ChainId.FuseMainnet,
  ChainId.Evmos,
  ChainId.SyscoinMainnet,
  ChainId.EthereumClassicMainnet,
  ChainId.BitTorrentChainMainnet,
  ChainId.Palm,
];

export const CHAIN_SELECT_TESTNETS = [
  ChainId.Goerli,
  ChainId.Sepolia,
  ChainId.BinanceSmartChainTestnet,
  ChainId.AvalancheFujiTestnet,
  ChainId.Mumbai,
  421613, // Arbitrum Goerli
  ChainId.OptimisticEthereumTestnetGoerli,
  ChainId.CronosTestnet,
  ChainId.FantomTestnet,
  ChainId.KavaEVMTestnet,
  ChainId.AuroraTestnet,
  ChainId.CeloAlfajoresTestnet,
  ChainId.MoonbaseAlpha,
  ChainId.RSKTestnet,
  ChainId['GodwokenTestnet(V1.1)'],
  ChainId.SyscoinTanenbaumTestnet,
  ChainId.PalmTestnet,
];
