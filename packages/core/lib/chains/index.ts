import { ChainId } from '@revoke.cash/chains';
import { Chain, type DeployedContracts, SupportType } from '@revoke.cash/core/chains/Chain';
import { ALCHEMY_API_KEY, DRPC_API_KEY, MULTICALL_ADDRESS } from '@revoke.cash/core/constants';
import type { EtherscanPlatform, RateLimit } from '@revoke.cash/core/types';
import type { AddEthereumChainParameter, PublicClient, Chain as ViemChain } from 'viem';

// Make sure to update these lists when updating the above lists
// Order is loosely based on TVL (as per DeFiLlama)

export const CHAIN_SELECT_MAINNETS = [
  ChainId.EthereumMainnet,
  ChainId.BNBSmartChainMainnet,
  ChainId.PolygonMainnet,
  ChainId.Base,
  ChainId.ArbitrumOne,
  ChainId.OPMainnet,
  ChainId.PlasmaMainnet,
  ChainId['AvalancheC-Chain'],
  ChainId.Monad,
  ChainId.Mantle,
  ChainId.Ink,
  ChainId.Katana,
  ChainId.FlareMainnet,
  ChainId.CronosMainnet,
  ChainId.Linea,
  ChainId.MegaETHMainnet,
  ChainId.RootstockMainnet,
  ChainId.StableMainnet,
  ChainId.SonicMainnet,
  ChainId.Hemi,
  ChainId.Berachain,
  ChainId.Gnosis,
  ChainId.Unichain,
  ChainId.CoreBlockchainMainnet,
  ChainId.SeiNetwork,
  ChainId.PlumeMainnet,
  ChainId.WorldChain,
  ChainId.TempoMainnetPresto,
  4663, // Robinhood Chain
  ChainId.PulseChain,
  ChainId.Mode,
  ChainId.Blast,
  ChainId.ZkSyncMainnet,
  ChainId['Filecoin-Mainnet'],
  ChainId.Abstract,
  ChainId.Taiko,
  ChainId.BOB,
  ChainId.ImmutablezkEVM,
  ChainId.RolluxMainnet,
  ChainId.Scroll,
  ChainId.ReyaNetwork,
  ChainId.Fraxtal,
  ChainId.Morph,
  ChainId.Soneium,
  ChainId.CeloMainnet,
  ChainId.EtherlinkMainnet,
  ChainId.Injective,
  ChainId.RISE,
  ChainId.Story,
  ChainId.FlowEVMMainnet,
  ChainId.TACMainnet,
  ChainId.ApeChain,
  ChainId.ZircuitMainnet,
  ChainId.RoninMainnet,
  ChainId.Lens,
  ChainId.OpBNBMainnet,
  ChainId.CitreaMainnet,
  ChainId.XDCNetwork,
  ChainId.ArbitrumNova,
  ChainId.MetisAndromedaMainnet,
  ChainId.MantaPacificMainnet,
  ChainId.Lisk,
  ChainId['SongbirdCanary-Network'],
  ChainId.IOTAEVM,
  ChainId.Astar,
  999, // Hyperliquid EVM
  ChainId.TelosEVMMainnet,
  ChainId.ZetaChainMainnet,
  ChainId.AuroraMainnet,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.BobaNetwork,
  ChainId.GravityAlphaMainnet,
  ChainId.ChilizChainMainnet,
  ChainId.DogechainMainnet,
  ChainId.Beam,
  ChainId.IgraNetwork,
  5031, // Somnia
  ChainId.Viction,
  ChainId.EDUChain,
  ChainId.HarmonyMainnetShard0,
  ChainId.DegenChain,
  ChainId.OasysMainnet,
  ChainId.Vana,
  ChainId.KCCMainnet,
  ChainId.FuseMainnet,
  ChainId.ZERONetwork,
  ChainId.NeonEVMMainnet,
  ChainId.ShimmerEVM,
  ChainId.EthereumClassic,
  ChainId.LightlinkPhoenixMainnet,
  ChainId.Shape,
  ChainId.Superposition,
  ChainId.GensynMainnet,
  ChainId.ShidoNetwork,
  ChainId.Matchain,
  ChainId.BitgertMainnet,
  202555, // Kasplex zkEVM
] as const;

export const CHAIN_SELECT_TESTNETS = [
  ChainId.EthereumSepolia,
  ChainId.BNBSmartChainTestnet,
  ChainId.Amoy,
  ChainId.OPSepoliaTestnet,
  ChainId.ArbitrumSepolia,
  ChainId.BaseSepoliaTestnet,
  ChainId.AbstractSepoliaTestnet,
  ChainId.AvalancheFujiTestnet,
] as const;

export const ORDERED_CHAINS = [...CHAIN_SELECT_MAINNETS, ...CHAIN_SELECT_TESTNETS] as const;

export const CHAINS = {
  [ChainId.Abstract]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Abstract,
    name: 'Abstract',
    nativeToken: 'ETH',
    coingeckoNetworkId: 'abstract',
    logoUrl: '/assets/images/vendor/chains/abstract.jpg',
    explorerUrl: 'https://abscan.org',
    rpc: {
      main: `https://abstract-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://api.mainnet.abs.xyz',
    },
    deployedContracts: { multicall3: { address: '0xAa4De41dba0Ca5dCBb288b7cC6b708F3aaC759E7', blockCreated: 5288 } },
  }),
  [ChainId.AbstractSepoliaTestnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.AbstractSepoliaTestnet,
    name: 'Abstract Testnet',
    nativeToken: 'ETH',
    logoUrl: '/assets/images/vendor/chains/abstract.jpg',
    explorerUrl: 'https://sepolia.abscan.org',
    rpc: {
      main: `https://abstract-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: '0xF9cda624FBC7e059355ce98a31693d299FACd963', blockCreated: 358349 } },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Abstract,
  }),
  [ChainId.Amoy]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Amoy,
    name: 'Polygon Amoy',
    nativeToken: 'POL',
    nativeTokenCoingeckoId: 'polygon-ecosystem-token',
    logoUrl: '/assets/images/vendor/chains/polygon.svg',
    rpc: {
      main: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 3127388 } },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.PolygonMainnet,
  }),
  [ChainId.ApeChain]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.ApeChain,
    name: 'ApeChain',
    nativeToken: 'APE',
    nativeTokenCoingeckoId: 'apecoin',
    coingeckoNetworkId: 'apechain',
    logoUrl: '/assets/images/vendor/chains/apechain.svg',
    explorerUrl: 'https://apescan.io',
    infoUrl: 'https://apechain.com',
    rpc: {
      main: `https://apechain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://apechain.calderachain.xyz/http',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 20889 } },
  }),
  [ChainId.ArbitrumNova]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ArbitrumNova,
    name: 'Arbitrum Nova',
    nativeToken: 'ETH',
    coingeckoNetworkId: 'arbitrum_nova',
    logoUrl: '/assets/images/vendor/chains/arbitrum-nova.svg',
    explorerUrl: 'https://arbitrum-nova.blockscout.com',
    rpc: {
      main: `https://lb.drpc.live/arbitrum-nova/${DRPC_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1746963 } },
  }),
  [ChainId.ArbitrumOne]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ArbitrumOne,
    name: 'Arbitrum',
    nativeToken: 'ETH',
    coingeckoNetworkId: 'arbitrum',
    logoUrl: '/assets/images/vendor/chains/arbitrum.svg',
    explorerUrl: 'https://arbiscan.io',
    rpc: {
      main: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://arb1.arbitrum.io/rpc',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 7654707 } },
  }),
  [ChainId.ArbitrumSepolia]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.ArbitrumSepolia,
    name: 'Arbitrum Sepolia',
    logoUrl: '/assets/images/vendor/chains/arbitrum.svg',
    explorerUrl: 'https://sepolia.arbiscan.io',
    rpc: {
      main: `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 81930 } },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.ArbitrumOne,
  }),
  [ChainId.Astar]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Astar,
    name: 'Astar',
    nativeTokenCoingeckoId: 'astar',
    coingeckoNetworkId: 'astr',
    logoUrl: '/assets/images/vendor/chains/astar.svg',
    explorerUrl: 'https://blockscout.com/astar',
    rpc: {
      main: 'https://evm.astar.network',
      free: 'https://evm.astar.network',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 761794 } },
  }),
  [ChainId.AuroraMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.AuroraMainnet,
    name: 'Aurora',
    nativeTokenCoingeckoId: 'aurora-near',
    coingeckoNetworkId: 'aurora',
    logoUrl: '/assets/images/vendor/chains/aurora.svg',
    explorerUrl: 'https://explorer.aurora.dev',
    etherscanCompatibleApiUrl: 'https://explorer.mainnet.aurora.dev/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 62907816 } },
  }),
  [ChainId['AvalancheC-Chain']]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId['AvalancheC-Chain'],
    name: 'Avalanche',
    nativeTokenCoingeckoId: 'avalanche-2',
    coingeckoNetworkId: 'avax',
    logoUrl: '/assets/images/vendor/chains/avalanche.svg',
    explorerUrl: 'https://snowscan.xyz',
    rpc: {
      main: `https://avax-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 11907934 } },
  }),
  [ChainId.AvalancheFujiTestnet]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.AvalancheFujiTestnet,
    name: 'Avalanche Fuji',
    nativeTokenCoingeckoId: 'avalanche-2',
    logoUrl: '/assets/images/vendor/chains/avalanche.svg',
    explorerUrl: 'https://testnet.snowscan.xyz',
    rpc: {
      main: `https://avax-fuji.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 7096959 } },
    isTestnet: true,
    correspondingMainnetChainId: ChainId['AvalancheC-Chain'],
  }),
  [ChainId.Base]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Base,
    name: 'Base',
    coingeckoNetworkId: 'base',
    logoUrl: '/assets/images/vendor/chains/base.svg',
    rpc: {
      main: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 5022 } },
  }),
  [ChainId.BaseSepoliaTestnet]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.BaseSepoliaTestnet,
    name: 'Base Sepolia',
    logoUrl: '/assets/images/vendor/chains/base.svg',
    rpc: {
      main: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1059647 } },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Base,
  }),
  [ChainId.Beam]: new Chain({
    type: SupportType.ROUTESCAN,
    chainId: ChainId.Beam,
    name: 'Beam',
    nativeTokenCoingeckoId: 'beam',
    coingeckoNetworkId: 'beam',
    logoUrl: '/assets/images/vendor/chains/beam.svg',
    explorerUrl: 'https://4337.routescan.io',
    rpc: {
      main: 'https://build.onbeam.com/rpc',
    },
    deployedContracts: {
      multicall3: { address: '0x4956F15eFdc3dC16645e90Cc356eAFA65fFC65Ec', blockCreated: 1 },
    },
  }),
  [ChainId.Berachain]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Berachain,
    name: 'Berachain',
    nativeTokenCoingeckoId: 'berachain-bera',
    coingeckoNetworkId: 'berachain',
    logoUrl: '/assets/images/vendor/chains/berachain.svg',
    explorerUrl: 'https://berascan.com',
    rpc: {
      main: `https://berachain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.BitgertMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.BitgertMainnet,
    name: 'Bitgert',
    nativeToken: 'BRISE',
    nativeTokenCoingeckoId: 'bitrise-token',
    coingeckoNetworkId: 'bitgert',
    logoUrl: '/assets/images/vendor/chains/bitgert.svg',
    etherscanCompatibleApiUrl: 'https://brisescan.com/api',
    rpc: {
      main: 'https://rpc-bitgert.icecreamswap.com',
      free: 'https://rpc-bitgert.icecreamswap.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 2118034 } },
  }),
  [ChainId.Blast]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Blast,
    name: 'Blast',
    coingeckoNetworkId: 'blast',
    logoUrl: '/assets/images/vendor/chains/blast.jpg',
    explorerUrl: 'https://blastscan.io',
    rpc: {
      main: `https://blast-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 212929 } },
  }),
  [ChainId.BNBSmartChainMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.BNBSmartChainMainnet,
    name: 'BNB Chain',
    nativeTokenCoingeckoId: 'binancecoin',
    coingeckoNetworkId: 'bsc',
    logoUrl: '/assets/images/vendor/chains/bnb-chain.svg',
    rpc: {
      main: `https://bnb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: {
      multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11', blockCreated: 15921452 },
    },
  }),
  [ChainId.BNBSmartChainTestnet]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.BNBSmartChainTestnet,
    name: 'BNB Chain Testnet',
    nativeTokenCoingeckoId: 'binancecoin',
    logoUrl: '/assets/images/vendor/chains/bnb-chain.svg',
    rpc: {
      main: `https://bnb-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 17422483 } },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.BNBSmartChainMainnet,
  }),
  [ChainId.BOB]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.BOB,
    name: 'BOB',
    coingeckoNetworkId: 'bob-network',
    logoUrl: '/assets/images/vendor/chains/bob.svg',
    etherscanCompatibleApiUrl: 'https://explorer.gobob.xyz/api',
    rpc: {
      main: `https://bob-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 23131 } },
  }),
  [ChainId.CitreaMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.CitreaMainnet,
    name: 'Citrea',
    nativeToken: 'cBTC',
    nativeTokenCoingeckoId: 'bitcoin',
    coingeckoNetworkId: 'citrea',
    infoUrl: 'https://citrea.xyz',
    logoUrl: '/assets/images/vendor/chains/citrea.svg',
    explorerUrl: 'https://explorer.mainnet.citrea.xyz',
    etherscanCompatibleApiUrl: 'https://explorer.mainnet.citrea.xyz/api',
    rpc: {
      main: 'https://rpc.mainnet.citrea.xyz',
      free: 'https://rpc.mainnet.citrea.xyz',
    },
    deployedContracts: {
      multicall3: { address: '0xA738e84fdE890Bc60b99AF7ccE43990E534304de' },
    },
  }),
  [ChainId.BobaNetwork]: new Chain({
    type: SupportType.ROUTESCAN,
    chainId: ChainId.BobaNetwork,
    name: 'Boba',
    coingeckoNetworkId: 'boba',
    logoUrl: '/assets/images/vendor/chains/boba.jpg',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 446859 } },
  }),
  [ChainId.CeloMainnet]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.CeloMainnet,
    name: 'Celo',
    nativeTokenCoingeckoId: 'celo',
    coingeckoNetworkId: 'celo',
    logoUrl: '/assets/images/vendor/chains/celo.svg',
    rpc: {
      main: `https://celo-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 13112599 } },
  }),
  [ChainId.ChilizChainMainnet]: new Chain({
    type: SupportType.ROUTESCAN,
    chainId: ChainId.ChilizChainMainnet,
    name: 'Chiliz',
    nativeTokenCoingeckoId: 'chiliz',
    coingeckoNetworkId: 'chiliz-chain',
    logoUrl: '/assets/images/vendor/chains/chiliz.png',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 8080847 } },
  }),
  [ChainId.CoreBlockchainMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.CoreBlockchainMainnet,
    name: 'CORE',
    nativeTokenCoingeckoId: 'coredaoorg',
    coingeckoNetworkId: 'core',
    logoUrl: '/assets/images/vendor/chains/core.png',
    rpc: {
      main: 'https://rpc.coredao.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 11907934 } },
  }),
  [ChainId.CronosMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.CronosMainnet,
    name: 'Cronos',
    nativeTokenCoingeckoId: 'crypto-com-chain',
    coingeckoNetworkId: 'cro',
    logoUrl: '/assets/images/vendor/chains/cronos.svg',
    etherscanCompatibleApiUrl: 'https://cronos.org/explorer/api',
    rpc: {
      main: `https://lb.drpc.live/cronos/${DRPC_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1963112 } },
  }),
  [ChainId.DegenChain]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.DegenChain,
    name: 'Degen Chain',
    nativeTokenCoingeckoId: 'degen-base',
    coingeckoNetworkId: 'degenchain',
    logoUrl: '/assets/images/vendor/chains/degen.png',
    explorerUrl: 'https://explorer.degen.tips',
    etherscanCompatibleApiUrl: 'https://explorer.degen.tips/api',
    rpc: {
      main: 'https://rpc.degen.tips',
    },
  }),
  [ChainId.DogechainMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.DogechainMainnet,
    name: 'Dogechain',
    nativeTokenCoingeckoId: 'dogechain',
    coingeckoNetworkId: 'dogechain',
    logoUrl: '/assets/images/vendor/chains/dogechain.jpg',
    etherscanCompatibleApiUrl: 'https://explorer.dogechain.dog/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 25384031 } },
  }),
  [ChainId.EDUChain]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.EDUChain,
    name: 'EDU Chain',
    nativeToken: 'EDU',
    nativeTokenCoingeckoId: 'edu-coin',
    coingeckoNetworkId: 'educhain',
    logoUrl: '/assets/images/vendor/chains/edu-chain.svg',
    explorerUrl: 'https://educhain.blockscout.com',
    rpc: {
      main: 'https://rpc.edu-chain.raas.gelato.cloud',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 16410660 } },
  }),
  [ChainId.EtherlinkMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.EtherlinkMainnet,
    name: 'Etherlink',
    nativeTokenCoingeckoId: 'tezos',
    coingeckoNetworkId: 'etherlink',
    logoUrl: '/assets/images/vendor/chains/etherlink.svg',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 33899 } },
  }),
  [ChainId.EthereumClassic]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.EthereumClassic,
    name: 'Ethereum Classic',
    nativeTokenCoingeckoId: 'ethereum-classic',
    coingeckoNetworkId: 'ethereum_classic',
    logoUrl: '/assets/images/vendor/chains/etc.png',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 18288646 } },
  }),
  [ChainId.EthereumMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.EthereumMainnet,
    name: 'Ethereum',
    coingeckoNetworkId: 'eth',
    logoUrl: '/assets/images/vendor/chains/ethereum.svg',
    rpc: {
      main: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://eth.drpc.org',
    },
    deployedContracts: {
      multicall3: { address: MULTICALL_ADDRESS, blockCreated: 14353601 },
      ensUniversalResolver: { address: '0xeeeeeeee14d718c2b47d9923deab1335e144eeee' },
    },
  }),
  [ChainId.EthereumSepolia]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.EthereumSepolia,
    name: 'Ethereum Sepolia',
    logoUrl: '/assets/images/vendor/chains/ethereum.svg',
    rpc: {
      main: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://ethereum-sepolia-rpc.publicnode.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 751532 } },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.EthereumMainnet,
  }),
  [ChainId.FantomOpera]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.FantomOpera,
    name: 'Fantom',
    nativeTokenCoingeckoId: 'fantom',
    coingeckoNetworkId: 'ftm',
    logoUrl: '/assets/images/vendor/chains/fantom.svg',
  }),
  [ChainId['Filecoin-Mainnet']]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId['Filecoin-Mainnet'],
    name: 'Filecoin EVM',
    nativeTokenCoingeckoId: 'filecoin',
    coingeckoNetworkId: 'filecoin',
    logoUrl: '/assets/images/vendor/chains/filecoin.svg',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 3328594 } },
  }),
  [ChainId.FlareMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.FlareMainnet,
    name: 'Flare',
    nativeTokenCoingeckoId: 'flare-networks',
    coingeckoNetworkId: 'flare',
    logoUrl: '/assets/images/vendor/chains/flare.svg',
    etherscanCompatibleApiUrl: 'https://flare-explorer.flare.network/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 3002461 } },
  }),
  [ChainId.FlowEVMMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.FlowEVMMainnet,
    name: 'Flow EVM',
    nativeTokenCoingeckoId: 'flow',
    coingeckoNetworkId: 'flow-evm',
    logoUrl: '/assets/images/vendor/chains/flow.png',
    rpc: {
      main: `https://flow-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 6205 } },
  }),
  [ChainId.Fraxtal]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Fraxtal,
    name: 'Fraxtal',
    nativeTokenCoingeckoId: 'frax-share',
    coingeckoNetworkId: 'fraxtal',
    logoUrl: '/assets/images/vendor/chains/fraxtal.svg',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.FuseMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.FuseMainnet,
    name: 'Fuse',
    nativeTokenCoingeckoId: 'fuse-network-token',
    coingeckoNetworkId: 'fuse',
    logoUrl: '/assets/images/vendor/chains/fuse.png',
    explorerUrl: 'https://explorer.fuse.io',
    rpc: {
      main: `https://lb.drpc.live/fuse/${DRPC_API_KEY}`,
      free: 'https://rpc.fuse.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 16146628 } },
  }),
  [ChainId.GensynMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.GensynMainnet,
    name: 'Gensyn',
    nativeTokenCoingeckoId: 'gensyn',
    coingeckoNetworkId: 'gensyn',
    logoUrl: '/assets/images/vendor/chains/gensyn.svg',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.Gnosis]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Gnosis,
    name: 'Gnosis Chain',
    nativeTokenCoingeckoId: 'xdai',
    coingeckoNetworkId: 'xdai',
    logoUrl: '/assets/images/vendor/chains/gnosis.svg',
    explorerUrl: 'https://gnosisscan.io',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 21022491 } },
    rpc: {
      main: `https://gnosis-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
  }),
  [ChainId.GravityAlphaMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.GravityAlphaMainnet,
    name: 'Gravity Alpha',
    nativeTokenCoingeckoId: 'g-token',
    coingeckoNetworkId: 'gravity-alpha',
    logoUrl: '/assets/images/vendor/chains/gravity.svg',
    etherscanCompatibleApiUrl: 'https://api.explorer.gravity.xyz/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 16851 } },
  }),
  [ChainId.HarmonyMainnetShard0]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.HarmonyMainnetShard0,
    name: 'Harmony',
    nativeTokenCoingeckoId: 'harmony',
    logoUrl: '/assets/images/vendor/chains/harmony.svg',
    etherscanCompatibleApiUrl: 'https://explorer.harmony.one/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 24185753 } },
    rpc: {
      main: 'https://api.harmony.one',
    },
  }),
  [ChainId.Hemi]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Hemi,
    name: 'Hemi',
    coingeckoNetworkId: 'hemi',
    logoUrl: '/assets/images/vendor/chains/hemi.svg',
    etherscanCompatibleApiUrl: 'https://explorer.hemi.xyz/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.HuobiECOChainMainnet]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.HuobiECOChainMainnet,
    name: 'HECO',
    logoUrl: '/assets/images/vendor/chains/heco.svg',
  }),
  999: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: 999,
    name: 'Hyperliquid EVM',
    nativeToken: 'HYPE',
    nativeTokenCoingeckoId: 'hyperliquid',
    coingeckoNetworkId: 'hyperevm',
    explorerUrl: 'https://hyperevmscan.io',
    infoUrl: 'https://hyperfoundation.org/',
    logoUrl: '/assets/images/vendor/chains/hyperliquid.svg',
    rpc: {
      main: `https://hyperliquid-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.hyperliquid.xyz/evm',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 13051 } },
  }),
  [ChainId.ImmutablezkEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ImmutablezkEVM,
    name: 'Immutable zkEVM',
    nativeTokenCoingeckoId: 'immutable-x',
    coingeckoNetworkId: 'immutable-zkevm',
    logoUrl: '/assets/images/vendor/chains/immutable.svg',
    rpc: {
      main: `https://lb.drpc.live/immutable-zkevm/${DRPC_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 4335972 } },
  }),
  [ChainId.Injective]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Injective,
    name: 'Injective',
    nativeTokenCoingeckoId: 'injective-protocol',
    coingeckoNetworkId: 'injective',
    logoUrl: '/assets/images/vendor/chains/injective.svg',
    explorerUrl: 'https://blockscout.injective.network',
    etherscanCompatibleApiUrl: 'https://blockscout-api.injective.network/api',
    rpc: {
      main: 'https://sentry.evm-rpc.injective.network',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 127255206 } },
  }),
  [ChainId.Ink]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Ink,
    name: 'Ink',
    coingeckoNetworkId: 'ink',
    logoUrl: '/assets/images/vendor/chains/ink.svg',
    rpc: {
      main: `https://ink-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.IOTAEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.IOTAEVM,
    name: 'IOTA EVM',
    nativeTokenCoingeckoId: 'iota',
    coingeckoNetworkId: 'iota-evm',
    logoUrl: '/assets/images/vendor/chains/iota.svg',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 25022 } },
  }),
  [ChainId.IoTeXNetworkMainnet]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.IoTeXNetworkMainnet,
    name: 'IoTeX',
    coingeckoNetworkId: 'iotx',
    logoUrl: '/assets/images/vendor/chains/iotex.png',
  }),
  [ChainId.KaiaMainnet]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.KaiaMainnet,
    name: 'Kaia',
    coingeckoNetworkId: 'kaia',
    logoUrl: '/assets/images/vendor/chains/kaia.svg',
  }),
  [ChainId.IgraNetwork]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.IgraNetwork,
    name: 'Igra Network',
    nativeTokenCoingeckoId: 'kaspa',
    coingeckoNetworkId: 'igra',
    logoUrl: '/assets/images/vendor/chains/igra.svg',
    etherscanCompatibleApiUrl: 'https://explorer.igralabs.com/api',
    deployedContracts: {
      multicall3: { address: '0x9397290CaEe43Fd443d7f110247822Cb50878319' },
    },
  }),
  202555: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: 202555,
    name: 'Kasplex zkEVM',
    nativeToken: 'KAS',
    nativeTokenCoingeckoId: 'kaspa',
    coingeckoNetworkId: 'kasplex',
    infoUrl: 'https://kasplex.org/',
    logoUrl: '/assets/images/vendor/chains/kasplex.png',
    explorerUrl: 'https://explorer.kasplex.org',
    etherscanCompatibleApiUrl: 'https://api-explorer.kasplex.org/api',
    rpc: {
      main: 'https://evmrpc.kasplex.org',
    },
  }),
  [ChainId.Katana]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Katana,
    name: 'Katana',
    coingeckoNetworkId: 'katana',
    logoUrl: '/assets/images/vendor/chains/katana.svg',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.KCCMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.KCCMainnet,
    name: 'KCC',
    nativeTokenCoingeckoId: 'kucoin-shares',
    coingeckoNetworkId: 'kcc',
    logoUrl: '/assets/images/vendor/chains/kcc.svg',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 11760430 } },
  }),
  [ChainId.Lens]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Lens,
    name: 'Lens',
    nativeTokenCoingeckoId: 'gho',
    coingeckoNetworkId: 'lens',
    logoUrl: '/assets/images/vendor/chains/lens.jpg',
    explorerUrl: 'https://explorer.lens.xyz',
    rpc: {
      main: `https://lens-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.lens.xyz',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1724216 } },
  }),
  [ChainId.LightlinkPhoenixMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.LightlinkPhoenixMainnet,
    name: 'Lightlink',
    coingeckoNetworkId: 'lightlink-phoenix',
    logoUrl: '/assets/images/vendor/chains/lightlink.jpg',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 125499184 } },
  }),
  [ChainId.Linea]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Linea,
    name: 'Linea',
    coingeckoNetworkId: 'linea',
    logoUrl: '/assets/images/vendor/chains/linea.png',
    explorerUrl: 'https://lineascan.build',
    rpc: {
      main: `https://linea-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 42 } },
  }),
  [ChainId.Lisk]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Lisk,
    name: 'Lisk',
    coingeckoNetworkId: 'lisk',
    logoUrl: '/assets/images/vendor/chains/lisk.svg',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.MantaPacificMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.MantaPacificMainnet,
    name: 'Manta Pacific',
    coingeckoNetworkId: 'manta-pacific',
    logoUrl: '/assets/images/vendor/chains/manta-pacific.svg',
    infoUrl: 'https://pacific.manta.network/',
    etherscanCompatibleApiUrl: 'https://manta-pacific.calderaexplorer.xyz/api',
    rpc: {
      main: `https://lb.drpc.live/manta-pacific/${DRPC_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 332890 } },
  }),
  [ChainId.Mantle]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Mantle,
    name: 'Mantle',
    nativeTokenCoingeckoId: 'mantle',
    coingeckoNetworkId: 'mantle',
    logoUrl: '/assets/images/vendor/chains/mantle.svg',
    rpc: {
      main: `https://mantle-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 304717 } },
  }),
  [ChainId.Matchain]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Matchain,
    name: 'Matchain',
    nativeToken: 'BNB',
    nativeTokenCoingeckoId: 'binancecoin',
    coingeckoNetworkId: 'matchain',
    logoUrl: '/assets/images/vendor/chains/matchain.svg',
    explorerUrl: 'https://matchscan.io',
    rpc: {
      main: 'https://rpc.matchain.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.MegaETHMainnet]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.MegaETHMainnet,
    name: 'MegaETH',
    coingeckoNetworkId: 'megaeth',
    logoUrl: '/assets/images/vendor/chains/megaeth.svg',
    explorerUrl: 'https://mega.etherscan.io',
    rpc: {
      main: `https://lb.drpc.live/megaeth/${DRPC_API_KEY}`,
      free: 'https://mainnet.megaeth.com/rpc',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.MetisAndromedaMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.MetisAndromedaMainnet,
    name: 'Metis',
    nativeTokenCoingeckoId: 'metis-token',
    coingeckoNetworkId: 'metis',
    logoUrl: '/assets/images/vendor/chains/metis.svg',
    etherscanCompatibleApiUrl: 'https://andromeda-explorer.metis.io/api',
    rpc: {
      main: `https://metis-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 2338552 } },
  }),
  [ChainId.Mode]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Mode,
    name: 'Mode',
    coingeckoNetworkId: 'mode',
    logoUrl: '/assets/images/vendor/chains/mode.jpg',
    rpc: {
      main: `https://mode-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 2465882 } },
  }),
  [ChainId.Monad]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Monad,
    name: 'Monad',
    nativeTokenCoingeckoId: 'monad',
    coingeckoNetworkId: 'monad',
    logoUrl: '/assets/images/vendor/chains/monad.svg',
    explorerUrl: 'https://monadscan.com',
    rpc: {
      main: `https://monad-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.monad.xyz',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 9248132 } },
  }),
  [ChainId.Moonbeam]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Moonbeam,
    name: 'Moonbeam',
    nativeTokenCoingeckoId: 'moonbeam',
    coingeckoNetworkId: 'glmr',
    logoUrl: '/assets/images/vendor/chains/moonbeam.svg',
    rpc: {
      main: `https://lb.drpc.live/moonbeam/${DRPC_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 609002 } },
  }),
  [ChainId.Moonriver]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Moonriver,
    name: 'Moonriver',
    nativeTokenCoingeckoId: 'moonriver',
    coingeckoNetworkId: 'movr',
    logoUrl: '/assets/images/vendor/chains/moonriver.svg',
    infoUrl: 'https://moonbeam.network/networks/moonriver/',
    rpc: {
      main: `https://lb.drpc.live/moonriver/${DRPC_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1597904 } },
    isCanary: true,
    correspondingMainnetChainId: ChainId.Moonbeam,
  }),
  [ChainId.Morph]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Morph,
    name: 'Morph',
    coingeckoNetworkId: 'morph-l2',
    logoUrl: '/assets/images/vendor/chains/morph.svg',
    etherscanCompatibleApiUrl: 'https://explorer-api.morphl2.io/api',
    rpc: {
      main: 'https://rpc.morphl2.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 3654913 } },
  }),
  [ChainId.NeonEVMMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.NeonEVMMainnet,
    name: 'Neon',
    nativeTokenCoingeckoId: 'neon',
    coingeckoNetworkId: 'neon-evm',
    logoUrl: '/assets/images/vendor/chains/neon.svg',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 206545524 } },
  }),
  [ChainId.OasysMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.OasysMainnet,
    name: 'Oasys',
    nativeTokenCoingeckoId: 'oasys',
    coingeckoNetworkId: 'oasys',
    logoUrl: '/assets/images/vendor/chains/oasys.svg',
    explorerUrl: 'https://scan.oasys.games',
    etherscanCompatibleApiUrl: 'https://scan.oasys.games/api',
  }),
  [ChainId.OpBNBMainnet]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.OpBNBMainnet,
    name: 'opBNB',
    nativeTokenCoingeckoId: 'binancecoin',
    coingeckoNetworkId: 'opbnb',
    logoUrl: '/assets/images/vendor/chains/bnb-chain.svg',
    rpc: {
      main: `https://opbnb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 512881 } },
  }),
  [ChainId.OPMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.OPMainnet,
    name: 'Optimism',
    coingeckoNetworkId: 'optimism',
    logoUrl: '/assets/images/vendor/chains/optimism.svg',
    rpc: {
      main: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 4286263 } },
  }),
  [ChainId.OPSepoliaTestnet]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.OPSepoliaTestnet,
    name: 'Optimism Sepolia',
    logoUrl: '/assets/images/vendor/chains/optimism.svg',
    rpc: {
      main: `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1620204 } },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.OPMainnet,
  }),
  [ChainId.PlasmaMainnet]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.PlasmaMainnet,
    name: 'Plasma',
    logoUrl: '/assets/images/vendor/chains/plasma.svg',
    nativeTokenCoingeckoId: 'plasma',
    coingeckoNetworkId: 'plasma',
    rpc: {
      main: `https://plasma-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.PlumeMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.PlumeMainnet,
    name: 'Plume',
    nativeTokenCoingeckoId: 'plume',
    coingeckoNetworkId: 'plume-network',
    logoUrl: '/assets/images/vendor/chains/plume.svg',
    etherscanCompatibleApiUrl: 'https://explorer-plume-mainnet-1.t.conduit.xyz/api',
    rpc: {
      main: 'https://rpc.plume.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 48577 } },
  }),
  [ChainId.PolygonMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.PolygonMainnet,
    name: 'Polygon',
    nativeTokenCoingeckoId: 'polygon-ecosystem-token',
    coingeckoNetworkId: 'polygon_pos',
    logoUrl: '/assets/images/vendor/chains/polygon.svg',
    rpc: {
      main: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://polygon.drpc.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 25770160 } },
  }),
  [ChainId.PolygonzkEVM]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.PolygonzkEVM,
    name: 'Polygon zkEVM',
    coingeckoNetworkId: 'polygon-zkevm',
    logoUrl: '/assets/images/vendor/chains/polygon.svg',
  }),
  [ChainId.PulseChain]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.PulseChain,
    name: 'PulseChain',
    nativeTokenCoingeckoId: 'pulsechain',
    coingeckoNetworkId: 'pulsechain',
    logoUrl: '/assets/images/vendor/chains/pulsechain.png',
    explorerUrl: 'https://otherscan.pulsechain.box',
    etherscanCompatibleApiUrl: 'https://api.scan.pulsechain.com/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 14353601 } },
  }),
  [ChainId.ReyaNetwork]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ReyaNetwork,
    name: 'Reya',
    logoUrl: '/assets/images/vendor/chains/reya.svg',
    explorerUrl: 'https://explorer.reya.network',
    rpc: {
      main: 'https://rpc.reya.network',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 10458805 } },
  }),
  [ChainId.RolluxMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.RolluxMainnet,
    name: 'Rollux',
    nativeTokenCoingeckoId: 'syscoin',
    coingeckoNetworkId: 'rollux',
    logoUrl: '/assets/images/vendor/chains/rollux.svg',
    rpc: {
      main: 'https://rpc.rollux.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 119222 } },
  }),
  [ChainId.RISE]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.RISE,
    name: 'RISE',
    logoUrl: '/assets/images/vendor/chains/rise.svg',
    explorerUrl: 'https://explorer.risechain.com',
    etherscanCompatibleApiUrl: 'https://explorer.risechain.com/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  4663: new Chain({
    type: SupportType.PROVIDER,
    chainId: 4663,
    name: 'Robinhood Chain',
    nativeToken: 'ETH',
    coingeckoNetworkId: 'robinhood',
    logoUrl: '/assets/images/vendor/chains/robinhood.png',
    explorerUrl: 'https://robinhoodchain.blockscout.com',
    infoUrl: 'https://robinhood.com/chain',
    rpc: {
      main: `https://robinhood-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.mainnet.chain.robinhood.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.RoninMainnet]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.RoninMainnet,
    name: 'Ronin',
    nativeTokenCoingeckoId: 'ronin',
    coingeckoNetworkId: 'ronin',
    logoUrl: '/assets/images/vendor/chains/ronin.svg',
    rpc: {
      main: `https://ronin-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 26023535 } },
  }),
  [ChainId.RootstockMainnet]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.RootstockMainnet,
    name: 'Rootstock',
    nativeTokenCoingeckoId: 'rootstock',
    coingeckoNetworkId: 'rootstock',
    logoUrl: '/assets/images/vendor/chains/rootstock.jpg',
    explorerUrl: 'https://rootstock.blockscout.com',
    rpc: {
      main: `https://rootstock-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 4249540 } },
  }),
  [ChainId.Scroll]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Scroll,
    name: 'Scroll',
    coingeckoNetworkId: 'scroll',
    logoUrl: '/assets/images/vendor/chains/scroll.svg',
    explorerUrl: 'https://scrollscan.com',
    rpc: {
      main: `https://scroll-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 14 } },
  }),
  [ChainId.SeiNetwork]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.SeiNetwork,
    name: 'Sei',
    nativeTokenCoingeckoId: 'sei-network',
    coingeckoNetworkId: 'sei-network',
    logoUrl: '/assets/images/vendor/chains/sei.svg',
    explorerUrl: 'https://seiscan.io',
    rpc: {
      main: `https://sei-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 79351444 } },
  }),
  [ChainId.Shape]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Shape,
    name: 'Shape',
    coingeckoNetworkId: 'shape',
    logoUrl: '/assets/images/vendor/chains/shape.svg',
    rpc: {
      main: `https://shape-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1 } },
  }),
  [ChainId.ShidoNetwork]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ShidoNetwork,
    name: 'Shido',
    nativeTokenCoingeckoId: 'shido-2',
    coingeckoNetworkId: 'shido-network',
    logoUrl: '/assets/images/vendor/chains/shido.png',
    explorerUrl: 'https://shidoscan.net',
    etherscanCompatibleApiUrl: 'https://shidoscan.net/api',
    rpc: {
      main: 'https://evm.shidoscan.net',
    },
  }),
  [ChainId.ShimmerEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ShimmerEVM,
    name: 'Shimmer',
    nativeTokenCoingeckoId: 'shimmer',
    coingeckoNetworkId: 'shimmerevm',
    logoUrl: '/assets/images/vendor/chains/shimmer.svg',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1290 } },
  }),
  5031: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: 5031,
    name: 'Somnia',
    nativeToken: 'SOMI',
    nativeTokenCoingeckoId: 'somnia',
    coingeckoNetworkId: 'somnia',
    logoUrl: '/assets/images/vendor/chains/somnia.png',
    infoUrl: 'https://somnia.network',
    explorerUrl: 'https://mainnet.somnia.w3us.site',
    etherscanCompatibleApiUrl: 'https://mainnet.somnia.w3us.site/api',
    rpc: {
      main: 'https://api.infra.mainnet.somnia.network',
    },
  }),
  [ChainId.Soneium]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Soneium,
    name: 'Soneium',
    coingeckoNetworkId: 'soneium',
    logoUrl: '/assets/images/vendor/chains/soneium.png',
    explorerUrl: 'https://soneium.blockscout.com',
    rpc: {
      main: `https://soneium-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.soneium.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1 } },
  }),
  [ChainId.SonicMainnet]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.SonicMainnet,
    name: 'Sonic',
    nativeTokenCoingeckoId: 'sonic-3',
    coingeckoNetworkId: 'sonic',
    logoUrl: '/assets/images/vendor/chains/sonic.svg',
    explorerUrl: 'https://sonicscan.org',
    rpc: {
      main: `https://sonic-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 60 } },
  }),
  [ChainId['SongbirdCanary-Network']]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId['SongbirdCanary-Network'],
    name: 'Songbird',
    nativeTokenCoingeckoId: 'songbird',
    logoUrl: '/assets/images/vendor/chains/songbird.svg',
    infoUrl: 'https://flare.network/songbird',
    etherscanCompatibleApiUrl: 'https://songbird-explorer.flare.network/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 13382504 } },
    isCanary: true,
    correspondingMainnetChainId: ChainId.FlareMainnet,
  }),
  [ChainId.StableMainnet]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.StableMainnet,
    name: 'Stable',
    nativeToken: 'USDT0',
    nativeTokenCoingeckoId: 'usdt0',
    logoUrl: '/assets/images/vendor/chains/stable.svg',
    explorerUrl: 'https://stablescan.xyz',
    rpc: {
      main: 'https://rpc.stable.xyz',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 2423647 } },
  }),
  [ChainId.Story]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Story,
    name: 'Story',
    nativeTokenCoingeckoId: 'story-2',
    coingeckoNetworkId: 'story',
    logoUrl: '/assets/images/vendor/chains/story.svg',
    rpc: {
      main: 'https://mainnet.storyrpc.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 340998 } },
  }),
  [ChainId.Superposition]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Superposition,
    name: 'Superposition',
    coingeckoNetworkId: 'superposition',
    logoUrl: '/assets/images/vendor/chains/superposition.svg',
    etherscanCompatibleApiUrl: 'https://explorer-superposition-1v9rjalnat.t.conduit.xyz/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 39 } },
  }),
  [ChainId.TACMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.TACMainnet,
    name: 'TAC',
    nativeToken: 'TAC',
    nativeTokenCoingeckoId: 'tac',
    coingeckoNetworkId: 'tac',
    logoUrl: '/assets/images/vendor/chains/tac.svg',
    explorerUrl: 'https://tac.blockscout.com',
    rpc: {
      main: 'https://rpc.tac.build',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.Taiko]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Taiko,
    name: 'Taiko',
    coingeckoNetworkId: 'taiko',
    logoUrl: '/assets/images/vendor/chains/taiko.svg',
    explorerUrl: 'https://taikoscan.io',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 11269 } },
  }),
  [ChainId.TelosEVMMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.TelosEVMMainnet,
    name: 'Telos EVM',
    nativeTokenCoingeckoId: 'telos',
    coingeckoNetworkId: 'tlos',
    logoUrl: '/assets/images/vendor/chains/telos.svg',
    etherscanCompatibleApiUrl: 'https://teloscan.io/api',
    rpc: {
      main: 'https://rpc.telos.net',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 246530709 } },
  }),
  [ChainId.TempoMainnetPresto]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.TempoMainnetPresto,
    name: 'Tempo',
    nativeTokenCoingeckoId: 'pathusd',
    coingeckoNetworkId: 'tempo',
    logoUrl: '/assets/images/vendor/chains/tempo.svg',
    rpc: {
      main: `https://tempo-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.Unichain]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Unichain,
    name: 'Unichain',
    coingeckoNetworkId: 'unichain',
    logoUrl: '/assets/images/vendor/chains/unichain.svg',
    explorerUrl: 'https://uniscan.xyz',
    rpc: {
      main: `https://unichain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.unichain.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.Vana]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Vana,
    name: 'Vana',
    nativeTokenCoingeckoId: 'vana',
    coingeckoNetworkId: 'vana',
    logoUrl: '/assets/images/vendor/chains/vana.png',
    etherscanCompatibleApiUrl: 'https://vanascan.io/api',
  }),
  [ChainId.Viction]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.Viction,
    name: 'Viction',
    nativeTokenCoingeckoId: 'tomochain',
    coingeckoNetworkId: 'tomochain',
    logoUrl: '/assets/images/vendor/chains/viction.svg',
    explorerUrl: 'https://viction.blockscout.com/',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 87169904 } },
  }),
  [ChainId.WorldChain]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.WorldChain,
    name: 'World Chain',
    coingeckoNetworkId: 'world-chain',
    logoUrl: '/assets/images/vendor/chains/worldchain.svg',
    explorerUrl: 'https://worldchain-mainnet.explorer.alchemy.com',
    rpc: {
      main: `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.XDCNetwork]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.XDCNetwork,
    name: 'XDC',
    nativeTokenCoingeckoId: 'xdce-crowd-sale',
    coingeckoNetworkId: 'xdc',
    logoUrl: '/assets/images/vendor/chains/xdc.svg',
    rpc: {
      main: 'https://rpc.ankr.com/xdc',
      free: 'https://rpc.ankr.com/xdc',
    },
  }),
  [ChainId.ZERONetwork]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ZERONetwork,
    name: 'ZERϴ',
    coingeckoNetworkId: 'zero-network',
    logoUrl: '/assets/images/vendor/chains/zero.svg',
    rpc: {
      main: `https://lb.drpc.live/zero/${DRPC_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.ZetaChainMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ZetaChainMainnet,
    name: 'ZetaChain',
    nativeTokenCoingeckoId: 'zetachain',
    coingeckoNetworkId: 'zetachain',
    logoUrl: '/assets/images/vendor/chains/zetachain.svg',
    explorerUrl: 'https://zetachain.blockscout.com',
    rpc: {
      main: `https://zetachain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1632781 } },
  }),
  [ChainId.ZkSyncMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ZkSyncMainnet,
    name: 'zkSync Era',
    coingeckoNetworkId: 'zksync',
    logoUrl: '/assets/images/vendor/chains/zksync.jpeg',
    explorerUrl: 'https://era.zksync.network',
    rpc: {
      main: `https://zksync-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: {
      multicall3: { address: '0xF9cda624FBC7e059355ce98a31693d299FACd963', blockCreated: 3908235 },
    },
  }),
  [ChainId.ZircuitMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ZircuitMainnet,
    name: 'Zircuit',
    coingeckoNetworkId: 'zircuit',
    logoUrl: '/assets/images/vendor/chains/zircuit.svg',
    rpc: {
      main: `https://lb.drpc.live/zircuit/${DRPC_API_KEY}`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
} as const;

export const SUPPORTED_CHAINS = Object.values(CHAINS)
  .filter((chain) => chain.isSupported())
  .map((chain) => chain.chainId);

export const ETHERSCAN_SUPPORTED_CHAINS = Object.values(CHAINS)
  .filter((chain) => chain.type === SupportType.ETHERSCAN)
  .map((chain) => chain.chainId);

export const BLOCKSCOUT_SUPPORTED_CHAINS = Object.values(CHAINS)
  .filter((chain) => chain.type === SupportType.BLOCKSCOUT)
  .map((chain) => chain.chainId);

export const ROUTESCAN_SUPPORTED_CHAINS = Object.values(CHAINS)
  .filter((chain) => chain.type === SupportType.ROUTESCAN)
  .map((chain) => chain.chainId);

export type DocumentedChainId = keyof typeof CHAINS;
export type SupportedChainId = (typeof ORDERED_CHAINS)[number];

export const getChainConfig = (chainId: DocumentedChainId): Chain => {
  return CHAINS[chainId];
};

// TODO: All these functions below are kept for backwards compatibility and should be removed in the future in favor of getChainConfig

export const isSupportedChain = (chainId: DocumentedChainId): boolean => {
  return Boolean(getChainConfig(chainId)?.isSupported());
};

export const isBackendSupportedChain = (chainId: DocumentedChainId): boolean => {
  const chain = getChainConfig(chainId);
  return chain.isSupported() && chain.type !== SupportType.PROVIDER;
};

export const isProviderSupportedChain = (chainId: DocumentedChainId): boolean => {
  return getChainConfig(chainId).type === SupportType.PROVIDER;
};

export const isHyperSyncSupportedChain = (chainId: DocumentedChainId): boolean => {
  return getChainConfig(chainId).type === SupportType.HYPERSYNC;
};

export const isCovalentSupportedChain = (chainId: DocumentedChainId): boolean => {
  return getChainConfig(chainId).type === SupportType.COVALENT;
};

export const isEtherscanSupportedChain = (chainId: DocumentedChainId): boolean => {
  return getChainConfig(chainId).type === SupportType.ETHERSCAN;
};

export const isBlockScoutSupportedChain = (chainId: DocumentedChainId): boolean => {
  return getChainConfig(chainId).type === SupportType.BLOCKSCOUT;
};

export const isRoutescanSupportedChain = (chainId: DocumentedChainId): boolean => {
  return getChainConfig(chainId).type === SupportType.ROUTESCAN;
};

export const isNodeSupportedChain = (chainId: DocumentedChainId): boolean => {
  return getChainConfig(chainId).type === SupportType.BACKEND_NODE;
};

export const isCustomSupportedChain = (chainId: DocumentedChainId): boolean => {
  return getChainConfig(chainId).type === SupportType.BACKEND_CUSTOM;
};

export const isMainnetChain = (chainId: DocumentedChainId): boolean => {
  return !isTestnetChain(chainId);
};

export const isTestnetChain = (chainId: DocumentedChainId): boolean => {
  return getChainConfig(chainId).isTestnet();
};

export const getChainName = (chainId: DocumentedChainId): string => {
  return getChainConfig(chainId).getName();
};

export const getChainSlug = (chainId: DocumentedChainId): string => {
  return getChainConfig(chainId).getSlug();
};

const REVERSE_CHAIN_SLUGS: Record<string, number> = Object.fromEntries(
  SUPPORTED_CHAINS.map((chainId) => [getChainSlug(chainId), chainId]),
);

export type ChainSlug = keyof typeof REVERSE_CHAIN_SLUGS;

export const getChainIdFromSlug = (slug: ChainSlug): DocumentedChainId => {
  return REVERSE_CHAIN_SLUGS[slug];
};

export const getChainExplorerUrl = (chainId: DocumentedChainId): string => {
  return getChainConfig(chainId).getExplorerUrl();
};

// This is used on the "Add a network" page
export const getChainFreeRpcUrl = (chainId: DocumentedChainId): string => {
  return getChainConfig(chainId).getFreeRpcUrl();
};

export const getChainRpcUrl = (chainId: DocumentedChainId): string => {
  return getChainConfig(chainId).getRpcUrl();
};

export const getChainRpcUrls = (chainId: DocumentedChainId): string[] => {
  return getChainConfig(chainId).getRpcUrls();
};

export const getChainLogsRpcUrl = (chainId: DocumentedChainId): string => {
  return getChainConfig(chainId).getLogsRpcUrl();
};

export const getChainLogo = (chainId: DocumentedChainId): string | undefined => {
  return getChainConfig(chainId).getLogoUrl();
};

export const getChainInfoUrl = (chainId: DocumentedChainId): string | undefined => {
  return getChainConfig(chainId).getInfoUrl();
};

export const getChainNativeToken = (chainId: DocumentedChainId): string => {
  return getChainConfig(chainId).getNativeToken();
};

export const getChainNativeTokenCoingeckoId = (chainId: DocumentedChainId): string | undefined => {
  return getChainConfig(chainId).getNativeTokenCoingeckoId();
};

export const getChainCoingeckoNetworkId = (chainId: DocumentedChainId): string | undefined => {
  return getChainConfig(chainId).getCoingeckoNetworkId();
};

export const getChainApiUrl = (chainId: DocumentedChainId): string | undefined => {
  return getChainConfig(chainId).getEtherscanCompatibleApiUrl();
};

export const getChainEtherscanCompatiblePlatformNames = (chainId: DocumentedChainId): EtherscanPlatform | undefined => {
  return getChainConfig(chainId).getEtherscanCompatiblePlatformNames();
};

export const getChainApiKey = (chainId: DocumentedChainId): string | undefined => {
  return getChainConfig(chainId).getEtherscanCompatibleApiKey();
};

export const getChainApiRateLimit = (chainId: DocumentedChainId): RateLimit => {
  return getChainConfig(chainId).getEtherscanCompatibleApiRateLimit();
};

export const getChainApiIdentifer = (chainId: DocumentedChainId): string => {
  return getChainConfig(chainId).getEtherscanCompatibleApiIdentifier();
};

export const getCorrespondingMainnetChainId = (chainId: DocumentedChainId): number | undefined => {
  return getChainConfig(chainId).getCorrespondingMainnetChainId();
};

export const getChainDeployedContracts = (chainId: DocumentedChainId): DeployedContracts | undefined => {
  return getChainConfig(chainId).getDeployedContracts();
};

export const getViemChainConfig = (chainId: DocumentedChainId): ViemChain => {
  return getChainConfig(chainId).getViemChainConfig();
};

export const createViemPublicClientForChain = (
  chainId: DocumentedChainId,
  url?: string,
  blockNumber?: bigint,
): PublicClient => {
  return getChainConfig(chainId).createViemPublicClient(url, blockNumber);
};

export const getChainAddEthereumChainParameter = (chainId: DocumentedChainId): AddEthereumChainParameter => {
  return getChainConfig(chainId).getAddEthereumChainParameter();
};

export const chainIdSorter = (a: number, b: number) => {
  const indexOfA = CHAIN_SELECT_MAINNETS.indexOf(a);
  const indexOfB = CHAIN_SELECT_MAINNETS.indexOf(b);
  if (indexOfA === -1) return 1;
  if (indexOfB === -1) return -1;
  return indexOfA - indexOfB;
};
