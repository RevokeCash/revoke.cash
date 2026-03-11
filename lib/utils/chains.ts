import { ChainId } from '@revoke.cash/chains';
import { ALCHEMY_API_KEY, DRPC_API_KEY, INFURA_API_KEY, MULTICALL_ADDRESS } from 'lib/constants';
import type { RateLimit } from 'lib/interfaces';
import type { AddEthereumChainParameter, PublicClient, Chain as ViemChain } from 'viem';
import { Chain, type DeployedContracts, SupportType } from '../chains/Chain';

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
  ChainId.SonicMainnet,
  ChainId.Linea,
  ChainId.Katana,
  ChainId.Scroll,
  ChainId.Monad,
  ChainId.Mantle,
  ChainId.Ink,
  ChainId.Berachain,
  ChainId.FlareMainnet,
  ChainId.Gnosis,
  ChainId.CronosMainnet,
  ChainId.Hemi,
  ChainId.Unichain,
  ChainId.CoreBlockchainMainnet,
  ChainId.SeiNetwork,
  ChainId.PlumeMainnet,
  ChainId.PulseChain,
  ChainId.RootstockMainnet,
  ChainId.MegaETHMainnet,
  // ChainId.BitlayerMainnet,
  ChainId.Abstract,
  ChainId.Mode,
  ChainId.Blast,
  ChainId.ZkSyncMainnet,
  ChainId.Swellchain,
  ChainId.TaikoAlethia,
  ChainId.BOB,
  ChainId.WorldChain,
  ChainId.Fraxtal,
  ChainId.Morph,
  ChainId.Soneium,
  ChainId['Filecoin-Mainnet'],
  ChainId.CeloMainnet,
  ChainId.EtherlinkMainnet,
  ChainId.Injective,
  ChainId.Story,
  ChainId.FlowEVMMainnet,
  ChainId.ApeChain,
  ChainId.ZircuitMainnet,
  ChainId.RoninMainnet,
  ChainId.Lens,
  ChainId.OpBNBMainnet,
  ChainId.XDCNetwork,
  ChainId.ImmutablezkEVM,
  ChainId.ArbitrumNova,
  ChainId.MetisAndromedaMainnet,
  ChainId.MantaPacificMainnet,
  ChainId.Lisk,
  ChainId['SongbirdCanary-Network'],
  ChainId.IOTAEVM,
  ChainId.Astar,
  999, // Hyperliquid EVM
  ChainId.TelosEVMMainnet,
  ChainId.Sophon,
  ChainId.RolluxMainnet,
  ChainId.SyscoinMainnet,
  ChainId.ZetaChainMainnet,
  ChainId.AuroraMainnet,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.BobaNetwork,
  ChainId.GravityAlphaMainnet,
  ChainId.OasisEmerald,
  ChainId.OasisSapphire,
  ChainId.MintMainnet,
  ChainId.ChilizChainMainnet,
  ChainId.DogechainMainnet,
  ChainId.Beam,
  5031, // Somnia
  ChainId.Viction,
  ChainId.HarmonyMainnetShard0,
  ChainId.DegenChain,
  ChainId.OasysMainnet,
  ChainId.Vana,
  ChainId.KCCMainnet,
  ChainId.FuseMainnet,
  ChainId.CoinExSmartChainMainnet,
  ChainId.ZERONetwork,
  ChainId.NeonEVMMainnet,
  ChainId.VelasEVMMainnet,
  ChainId.ElastosSmartChain,
  ChainId.ShimmerEVM,
  ChainId.BitTorrentChainMainnet,
  ChainId.EthereumClassic,
  ChainId.SubtensorEVM,
  ChainId.LightlinkPhoenixMainnet,
  ChainId.ENULSMainnet,
  ChainId.Shape,
  ChainId.DarwiniaNetwork,
  ChainId.Superposition,
  ChainId.Nahmii3Mainnet,
  ChainId.ShidoNetwork,
  ChainId.RARIChainMainnet,
  ChainId.NeoXMainnet,
  ChainId.BitgertMainnet,
  ChainId.Redstone,
  ChainId.RSS3VSLMainnet,
  ChainId.ExosamaNetwork,
  ChainId.OctaSpace,
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
  ChainId.ScrollSepoliaTestnet,
  ChainId.AvalancheFujiTestnet,
  ChainId.CronosTestnet,
  ChainId.ZetaChainTestnet,
  ChainId.PlumeTestnet,
  ChainId.BeamTestnet,
  ChainId.RISETestnet,
  ChainId.ZenChainTestnet,
  824642, // ZugChain Testnet
] as const;

export const ORDERED_CHAINS = [...CHAIN_SELECT_MAINNETS, ...CHAIN_SELECT_TESTNETS] as const;

const MULTICALL = {
  multicall3: {
    address: MULTICALL_ADDRESS,
  },
};

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
    deployedContracts: { multicall3: { address: '0xAa4De41dba0Ca5dCBb288b7cC6b708F3aaC759E7' } },
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
    deployedContracts: { multicall3: { address: '0xF9cda624FBC7e059355ce98a31693d299FACd963' } },
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
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.PolygonMainnet,
  }),
  [ChainId.ApeChain]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.ArbitrumNova]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.ArbitrumNova,
    name: 'Arbitrum Nova',
    nativeToken: 'ETH',
    coingeckoNetworkId: 'arbitrum_nova',
    logoUrl: '/assets/images/vendor/chains/arbitrum-nova.svg',
    explorerUrl: 'https://nova.arbiscan.io',
    rpc: {
      main: `https://arbnova-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
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
      logs: `https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      free: 'https://arb1.arbitrum.io/rpc',
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.ArbitrumSepolia]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ArbitrumSepolia,
    name: 'Arbitrum Sepolia',
    logoUrl: '/assets/images/vendor/chains/arbitrum.svg',
    explorerUrl: 'https://sepolia.arbiscan.io',
    rpc: {
      main: `https://arbitrum-sepolia.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
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
    etherscanCompatibleApiUrl: 'https://blockscout.com/astar/api',
    rpc: {
      main: 'https://evm.astar.network',
      free: 'https://evm.astar.network',
    },
    deployedContracts: { ...MULTICALL },
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId['AvalancheC-Chain']]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId['AvalancheC-Chain'],
    name: 'Avalanche',
    nativeTokenCoingeckoId: 'avalanche-2',
    coingeckoNetworkId: 'avax',
    logoUrl: '/assets/images/vendor/chains/avalanche.svg',
    explorerUrl: 'https://snowscan.xyz',
    etherscanCompatibleApiUrl: 'https://api.snowscan.xyz/api',
    rpc: {
      main: `https://avalanche-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.AvalancheFujiTestnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.AvalancheFujiTestnet,
    name: 'Avalanche Fuji',
    nativeTokenCoingeckoId: 'avalanche-2',
    logoUrl: '/assets/images/vendor/chains/avalanche.svg',
    explorerUrl: 'https://testnet.snowscan.xyz',
    etherscanCompatibleApiUrl: 'https://api-testnet.snowscan.xyz/api',
    rpc: {
      main: `https://avalanche-fuji.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId['AvalancheC-Chain'],
  }),
  [ChainId.Base]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Base,
    name: 'Base',
    coingeckoNetworkId: 'base',
    logoUrl: '/assets/images/vendor/chains/base.svg',
    etherscanCompatibleApiUrl: 'https://api.basescan.org/api',
    rpc: {
      main: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      logs: `https://base-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    // TODO: Look at integrating Aerodrome (forked from Velodrome) for Base
    // TODO: Can also add BaseSwap (Unsiwap v2)
  }),
  [ChainId.BaseSepoliaTestnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.BaseSepoliaTestnet,
    name: 'Base Sepolia',
    logoUrl: '/assets/images/vendor/chains/base.svg',
    etherscanCompatibleApiUrl: 'https://api-sepolia.basescan.org/api',
    rpc: {
      main: `https://base-sepolia.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
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
      multicall3: { address: '0x4956F15eFdc3dC16645e90Cc356eAFA65fFC65Ec' },
    },
  }),
  [ChainId.BeamTestnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.BeamTestnet,
    name: 'Beam Testnet',
    nativeTokenCoingeckoId: 'beam',
    logoUrl: '/assets/images/vendor/chains/beam.svg',
    deployedContracts: {
      multicall3: { address: '0x9BF49b704EE2A095b95c1f2D4EB9010510c41C9E' },
    },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Beam,
  }),
  [ChainId.Berachain]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.Berachain,
    name: 'Berachain',
    nativeTokenCoingeckoId: 'berachain-bera',
    coingeckoNetworkId: 'berachain',
    logoUrl: '/assets/images/vendor/chains/berachain.svg',
    explorerUrl: 'https://berascan.com',
    rpc: {
      main: `https://berachain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.BitgertMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.BitgertMainnet,
    name: 'Bitgert',
    nativeTokenCoingeckoId: 'bitrise-token',
    coingeckoNetworkId: 'bitgert',
    logoUrl: '/assets/images/vendor/chains/bitgert.svg',
    etherscanCompatibleApiUrl: 'https://brisescan.com/api',
    nativeToken: 'BRISE',
    rpc: {
      main: 'https://rpc-bitgert.icecreamswap.com',
      free: 'https://rpc-bitgert.icecreamswap.com',
    },
    deployedContracts: { ...MULTICALL },
  }),
  // [ChainId.BitlayerMainnet]: new Chain({
  //   type: SupportType.PROVIDER,
  //   chainId: ChainId.BitlayerMainnet,
  //   name: 'Bitlayer',
  //   nativeTokenCoingeckoId: 'bitcoin',
  //   logoUrl: '/assets/images/vendor/chains/bitlayer.png',
  //   rpc: {
  //     main: 'https://rpc.bitlayer.org',
  //   },
  //   deployedContracts: { ...MULTICALL },
  // }),
  [ChainId.BitTorrentChainMainnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.BitTorrentChainMainnet,
    name: 'BTT Chain',
    nativeTokenCoingeckoId: 'bittorrent',
    coingeckoNetworkId: 'bttc',
    logoUrl: '/assets/images/vendor/chains/bttc.svg',
    explorerUrl: 'https://bttcscan.com',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Blast]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Blast,
    name: 'Blast',
    coingeckoNetworkId: 'blast',
    logoUrl: '/assets/images/vendor/chains/blast.jpg',
    explorerUrl: 'https://blastscan.io',
    etherscanCompatibleApiUrl: 'https://api.blastscan.io/api',
    rpc: {
      // main: `https://blast-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      main: `https://blast-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.BNBSmartChainMainnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
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
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.BNBSmartChainTestnet,
    name: 'BNB Chain Testnet',
    nativeTokenCoingeckoId: 'binancecoin',
    logoUrl: '/assets/images/vendor/chains/bnb-chain.svg',
    rpc: {
      main: `https://bnb-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.BobaNetwork]: new Chain({
    type: SupportType.ROUTESCAN,
    chainId: ChainId.BobaNetwork,
    name: 'Boba',
    coingeckoNetworkId: 'boba',
    logoUrl: '/assets/images/vendor/chains/boba.jpg',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.CeloMainnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.CeloMainnet,
    name: 'Celo',
    nativeTokenCoingeckoId: 'celo',
    coingeckoNetworkId: 'celo',
    logoUrl: '/assets/images/vendor/chains/celo.svg',
    rpc: {
      main: `https://celo-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    // TODO: Could benefit from a Curve.fi strategy
  }),
  [ChainId.ChilizChainMainnet]: new Chain({
    type: SupportType.ROUTESCAN,
    chainId: ChainId.ChilizChainMainnet,
    name: 'Chiliz',
    nativeTokenCoingeckoId: 'chiliz',
    coingeckoNetworkId: 'chiliz-chain',
    logoUrl: '/assets/images/vendor/chains/chiliz.png',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.CoinExSmartChainMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.CoinExSmartChainMainnet,
    name: 'CoinEx Smart Chain',
    nativeToken: 'CET',
    nativeTokenCoingeckoId: 'coinex-token',
    logoUrl: '/assets/images/vendor/chains/coinex.svg',
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
    deployedContracts: { ...MULTICALL },
    // Note: CORE apparently has like 5 competing "USDT" coins trading on different DEXes, so for now we added 3
    // different strategies for different DEXes, making sure to use different USDTs for each.
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.CronosTestnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.CronosTestnet,
    name: 'Cronos Testnet',
    nativeTokenCoingeckoId: 'crypto-com-chain',
    logoUrl: '/assets/images/vendor/chains/cronos.svg',
    etherscanCompatibleApiUrl: 'https://cronos.org/explorer/testnet3/api',
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.CronosMainnet,
  }),
  [ChainId.DarwiniaNetwork]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.DarwiniaNetwork,
    name: 'Darwinia',
    nativeTokenCoingeckoId: 'darwinia-network',
    logoUrl: '/assets/images/vendor/chains/darwinia.svg',
    etherscanCompatibleApiUrl: 'https://explorer.darwinia.network/api',
    deployedContracts: { ...MULTICALL },
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.ElastosSmartChain]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ElastosSmartChain,
    name: 'Elastos',
    nativeTokenCoingeckoId: 'elastos',
    coingeckoNetworkId: 'ela',
    logoUrl: '/assets/images/vendor/chains/elastos.jpg',
    etherscanCompatibleApiUrl: 'https://esc.elastos.io/api',
    rpc: {
      main: 'https://rpc.glidefinance.io',
    },
  }),
  [ChainId.ENULSMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ENULSMainnet,
    name: 'ENULS',
    nativeTokenCoingeckoId: 'nuls',
    coingeckoNetworkId: 'enuls',
    logoUrl: '/assets/images/vendor/chains/enuls.svg',
    etherscanCompatibleApiUrl: 'https://evmscan.nuls.io/api',
  }),
  [ChainId.EtherlinkMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.EtherlinkMainnet,
    name: 'Etherlink',
    nativeTokenCoingeckoId: 'tezos',
    coingeckoNetworkId: 'etherlink',
    logoUrl: '/assets/images/vendor/chains/etherlink.svg',
    etherscanCompatibleApiUrl: 'https://explorer.etherlink.com/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.EthereumClassic]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.EthereumClassic,
    name: 'Ethereum Classic',
    nativeTokenCoingeckoId: 'ethereum-classic',
    coingeckoNetworkId: 'ethereum_classic',
    logoUrl: '/assets/images/vendor/chains/etc.png',
    etherscanCompatibleApiUrl: 'https://blockscout.com/etc/mainnet/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.EthereumMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.EthereumMainnet,
    name: 'Ethereum',
    coingeckoNetworkId: 'eth',
    logoUrl: '/assets/images/vendor/chains/ethereum.svg',
    rpc: {
      // main: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      main: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      free: 'https://eth.llamarpc.com',
    },
    deployedContracts: {
      ...MULTICALL,
      ensUniversalResolver: { address: '0xeeeeeeee14d718c2b47d9923deab1335e144eeee' },
    },
  }),
  [ChainId.EthereumSepolia]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.EthereumSepolia,
    name: 'Ethereum Sepolia',
    logoUrl: '/assets/images/vendor/chains/ethereum.svg',
    rpc: {
      main: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      free: 'https://ethereum-sepolia-rpc.publicnode.com',
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.EthereumMainnet,
  }),
  [ChainId.ExosamaNetwork]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ExosamaNetwork,
    name: 'Exosama',
    nativeTokenCoingeckoId: 'exosama-network',
    coingeckoNetworkId: 'exosama',
    logoUrl: '/assets/images/vendor/chains/exosama.png',
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
    etherscanCompatibleApiUrl: 'https://filecoin.blockscout.com/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.FlareMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.FlareMainnet,
    name: 'Flare',
    nativeTokenCoingeckoId: 'flare-networks',
    coingeckoNetworkId: 'flare',
    logoUrl: '/assets/images/vendor/chains/flare.svg',
    etherscanCompatibleApiUrl: 'https://flare-explorer.flare.network/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.FlowEVMMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.FlowEVMMainnet,
    name: 'Flow EVM',
    nativeTokenCoingeckoId: 'flow',
    coingeckoNetworkId: 'flow-evm',
    logoUrl: '/assets/images/vendor/chains/flow.png',
    etherscanCompatibleApiUrl: 'https://evm.flowscan.io/api',
    rpc: {
      main: `https://flow-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Fraxtal]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.Fraxtal,
    name: 'Fraxtal',
    nativeTokenCoingeckoId: 'frax-ether',
    coingeckoNetworkId: 'fraxtal',
    logoUrl: '/assets/images/vendor/chains/fraxtal.svg',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.FuseMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.FuseMainnet,
    name: 'Fuse',
    nativeTokenCoingeckoId: 'fuse-network-token',
    coingeckoNetworkId: 'fuse',
    logoUrl: '/assets/images/vendor/chains/fuse.png',
    explorerUrl: 'https://explorer.fuse.io',
    etherscanCompatibleApiUrl: 'https://explorer.fuse.io/api',
    rpc: {
      main: `https://lb.drpc.live/fuse/${DRPC_API_KEY}`,
      free: 'https://fuse.drpc.org',
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Gnosis]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Gnosis,
    name: 'Gnosis Chain',
    nativeTokenCoingeckoId: 'xdai',
    coingeckoNetworkId: 'xdai',
    logoUrl: '/assets/images/vendor/chains/gnosis.svg',
    explorerUrl: 'https://gnosisscan.io',
    etherscanCompatibleApiUrl: 'https://api.gnosisscan.io/api',
    deployedContracts: { ...MULTICALL },
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
    etherscanCompatibleApiUrl: 'https://explorer-gravity-mainnet-0.t.conduit.xyz/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.HarmonyMainnetShard0]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.HarmonyMainnetShard0,
    name: 'Harmony',
    nativeTokenCoingeckoId: 'harmony',
    logoUrl: '/assets/images/vendor/chains/harmony.svg',
    etherscanCompatibleApiUrl: 'https://explorer.harmony.one/api',
    deployedContracts: { ...MULTICALL },
    rpc: {
      main: 'https://api.harmony.one',
    },
  }),
  // [ChainId.HeliosChainTestnet]: new Chain({
  //   type: SupportType.BLOCKSCOUT,
  //   chainId: ChainId.HeliosChainTestnet,
  //   name: 'Helios',
  //   logoUrl: '/assets/images/vendor/chains/helios.svg',
  //   etherscanCompatibleApiUrl: 'https://explorer.helios.xyz/api',
  //   deployedContracts: { ...MULTICALL },
  // }),
  [ChainId.Hemi]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Hemi,
    name: 'Hemi',
    coingeckoNetworkId: 'hemi',
    logoUrl: '/assets/images/vendor/chains/hemi.svg',
    etherscanCompatibleApiUrl: 'https://explorer.hemi.xyz/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.HuobiECOChainMainnet]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.HuobiECOChainMainnet,
    name: 'HECO',
    logoUrl: '/assets/images/vendor/chains/heco.svg',
  }),
  999: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: 999,
    name: 'Hyperliquid EVM',
    nativeToken: 'HYPE',
    nativeTokenCoingeckoId: 'hyperliquid',
    coingeckoNetworkId: 'hyperevm',
    explorerUrl: 'https://hyperevmscan.io',
    infoUrl: 'https://hyperfoundation.org/',
    logoUrl: '/assets/images/vendor/chains/hyperliquid.svg',
    rpc: {
      main: 'https://rpc.hyperliquid.xyz/evm',
      free: 'https://rpc.hyperliquid.xyz/evm',
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.ImmutablezkEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ImmutablezkEVM,
    name: 'Immutable zkEVM',
    nativeTokenCoingeckoId: 'immutable-x',
    coingeckoNetworkId: 'immutable-zkevm',
    logoUrl: '/assets/images/vendor/chains/immutable.svg',
    etherscanCompatibleApiUrl: 'https://explorer.immutable.com/api',
    rpc: {
      main: `https://lb.drpc.live/immutable-zkevm/${DRPC_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Ink]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Ink,
    name: 'Ink',
    coingeckoNetworkId: 'ink',
    logoUrl: '/assets/images/vendor/chains/ink.svg',
    etherscanCompatibleApiUrl: 'https://explorer.inkonchain.com/api',
    rpc: {
      main: `https://ink-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.IOTAEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.IOTAEVM,
    name: 'IOTA EVM',
    nativeTokenCoingeckoId: 'iota',
    coingeckoNetworkId: 'iota-evm',
    logoUrl: '/assets/images/vendor/chains/iota.svg',
    etherscanCompatibleApiUrl: 'https://explorer.evm.iota.org/api',
    deployedContracts: { ...MULTICALL },
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
    // deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Katana]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Katana,
    name: 'Katana',
    coingeckoNetworkId: 'katana',
    logoUrl: '/assets/images/vendor/chains/katana.svg',
    etherscanCompatibleApiUrl: 'https://explorer-katana.t.conduit.xyz/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.KCCMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.KCCMainnet,
    name: 'KCC',
    nativeTokenCoingeckoId: 'kucoin-shares',
    coingeckoNetworkId: 'kcc',
    logoUrl: '/assets/images/vendor/chains/kcc.svg',
    deployedContracts: { ...MULTICALL },
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.LightlinkPhoenixMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.LightlinkPhoenixMainnet,
    name: 'Lightlink',
    coingeckoNetworkId: 'lightlink-phoenix',
    logoUrl: '/assets/images/vendor/chains/lightlink.jpg',
    etherscanCompatibleApiUrl: 'https://phoenix.lightlink.io/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Linea]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Linea,
    name: 'Linea',
    coingeckoNetworkId: 'linea',
    logoUrl: '/assets/images/vendor/chains/linea.png',
    explorerUrl: 'https://lineascan.build',
    rpc: {
      // main: `https://linea-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      main: `https://linea-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    // TODO: Add SyncSwap strategy to support Linea
  }),
  [ChainId.Lisk]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Lisk,
    name: 'Lisk',
    coingeckoNetworkId: 'lisk',
    logoUrl: '/assets/images/vendor/chains/lisk.svg',
    deployedContracts: { ...MULTICALL },
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Mantle]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.Mantle,
    name: 'Mantle',
    nativeTokenCoingeckoId: 'mantle',
    coingeckoNetworkId: 'mantle',
    logoUrl: '/assets/images/vendor/chains/mantle.svg',
    rpc: {
      main: `https://mantle-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.MegaETHMainnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.MegaETHMainnet,
    name: 'MegaETH',
    coingeckoNetworkId: 'megaeth',
    logoUrl: '/assets/images/vendor/chains/megaeth.svg',
    explorerUrl: 'https://mega.etherscan.io',
    rpc: {
      main: `https://lb.drpc.live/megaeth/${DRPC_API_KEY}`,
      free: 'https://mainnet.megaeth.com/rpc',
    },
    deployedContracts: { ...MULTICALL },
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.MintMainnet]: new Chain({
    type: SupportType.ROUTESCAN,
    chainId: ChainId.MintMainnet,
    name: 'Mint',
    coingeckoNetworkId: 'mint',
    logoUrl: '/assets/images/vendor/chains/mint.svg',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Mode]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Mode,
    name: 'Mode',
    coingeckoNetworkId: 'mode',
    logoUrl: '/assets/images/vendor/chains/mode.jpg',
    etherscanCompatibleApiUrl: 'https://explorer.mode.network/api',
    rpc: {
      main: `https://mode-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Monad]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Moonbeam]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.Moonbeam,
    name: 'Moonbeam',
    nativeTokenCoingeckoId: 'moonbeam',
    coingeckoNetworkId: 'glmr',
    logoUrl: '/assets/images/vendor/chains/moonbeam.svg',
    rpc: {
      main: `https://lb.drpc.live/moonbeam/${DRPC_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    // TODO: Add Algebra (StellaSwap) strategy to support Moonbeam
  }),
  [ChainId.Moonriver]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.Moonriver,
    name: 'Moonriver',
    nativeTokenCoingeckoId: 'moonriver',
    coingeckoNetworkId: 'movr',
    logoUrl: '/assets/images/vendor/chains/moonriver.svg',
    infoUrl: 'https://moonbeam.network/networks/moonriver/',
    rpc: {
      main: `https://lb.drpc.live/moonriver/${DRPC_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Nahmii3Mainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Nahmii3Mainnet,
    name: 'Nahmii',
    coingeckoNetworkId: 'nahmii',
    logoUrl: '/assets/images/vendor/chains/nahmii.svg',
    etherscanCompatibleApiUrl: 'https://backend.explorer.n3.nahmii.io/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.NeonEVMMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.NeonEVMMainnet,
    name: 'Neon',
    nativeTokenCoingeckoId: 'neon',
    coingeckoNetworkId: 'neon-evm',
    logoUrl: '/assets/images/vendor/chains/neon.svg',
    etherscanCompatibleApiUrl: 'https://neon.blockscout.com/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.NeoXMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.NeoXMainnet,
    name: 'Neo X',
    nativeTokenCoingeckoId: 'gas',
    infoUrl: 'https://x.neo.org',
    logoUrl: '/assets/images/vendor/chains/neo-x.svg',
    etherscanCompatibleApiUrl: 'https://xexplorer.neo.org/api',
    rpc: {
      main: 'https://mainnet-1.rpc.banelabs.org',
      free: 'https://mainnet-2.rpc.banelabs.org',
    },
  }),
  // [ChainId.NumbersMainnet]: new Chain({
  //   type: SupportType.BLOCKSCOUT,
  //   chainId: ChainId.NumbersMainnet,
  //   name: 'Numbers',
  //   // logoUrl: '/assets/images/vendor/chains/numbers.png',
  //   etherscanCompatibleApiUrl: 'https://mainnet.num.network/api',
  // }),
  [ChainId.OasisEmerald]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.OasisEmerald,
    name: 'Oasis Emerald',
    nativeTokenCoingeckoId: 'oasis-network',
    logoUrl: '/assets/images/vendor/chains/oasis.png',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.OasisSapphire]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.OasisSapphire,
    name: 'Oasis Sapphire',
    nativeTokenCoingeckoId: 'oasis-network',
    coingeckoNetworkId: 'oasis-sapphire',
    logoUrl: '/assets/images/vendor/chains/oasis.png',
    deployedContracts: { ...MULTICALL },
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
  [ChainId.OctaSpace]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.OctaSpace,
    name: 'OctaSpace',
    nativeTokenCoingeckoId: 'octaspace',
    coingeckoNetworkId: 'octaspace',
    logoUrl: '/assets/images/vendor/chains/octaspace.png',
    etherscanCompatibleApiUrl: 'https://explorer.octa.space/api',
    rpc: {
      main: 'https://rpc.octa.space',
    },
  }),
  [ChainId.OpBNBMainnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.OpBNBMainnet,
    name: 'opBNB',
    nativeTokenCoingeckoId: 'binancecoin',
    coingeckoNetworkId: 'opbnb',
    logoUrl: '/assets/images/vendor/chains/bnb-chain.svg',
    rpc: {
      main: `https://opbnb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.OPMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.OPMainnet,
    name: 'Optimism',
    coingeckoNetworkId: 'optimism',
    logoUrl: '/assets/images/vendor/chains/optimism.svg',
    rpc: {
      main: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      logs: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    // TODO: Look at integrating Velodrome for OP
  }),
  [ChainId.OPSepoliaTestnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.OPSepoliaTestnet,
    name: 'Optimism Sepolia',
    logoUrl: '/assets/images/vendor/chains/optimism.svg',
    rpc: {
      main: `https://optimism-sepolia.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.OPMainnet,
  }),
  [ChainId.PlasmaMainnet]: new Chain({
    type: SupportType.ROUTESCAN,
    chainId: ChainId.PlasmaMainnet,
    name: 'Plasma',
    logoUrl: '/assets/images/vendor/chains/plasma.svg',
    nativeTokenCoingeckoId: 'plasma',
    coingeckoNetworkId: 'plasma',
    rpc: {
      main: `https://plasma-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.PlumeTestnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.PlumeTestnet,
    name: 'Plume Testnet',
    nativeTokenCoingeckoId: 'plume',
    logoUrl: '/assets/images/vendor/chains/plume.svg',
    etherscanCompatibleApiUrl: 'https://explorer-plume-testnet-1.t.conduit.xyz/api',
    rpc: {
      main: 'https://testnet-rpc.plume.org',
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.PlumeMainnet,
  }),
  [ChainId.PolygonMainnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.PolygonMainnet,
    name: 'Polygon',
    nativeTokenCoingeckoId: 'polygon-ecosystem-token',
    coingeckoNetworkId: 'polygon_pos',
    logoUrl: '/assets/images/vendor/chains/polygon.svg',
    rpc: {
      main: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      // main: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      // logs: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://polygon.drpc.org',
    },
    deployedContracts: { ...MULTICALL },
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
    explorerUrl: 'https://scan.pulsechainfoundation.org/#',
    etherscanCompatibleApiUrl: 'https://api.scan.pulsechain.com/api',
    // Although multicall is deployed on Pulsechain, it is causing issues
    // deployedContracts: { ...MULTICALL },
  }),
  [ChainId.RARIChainMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.RARIChainMainnet,
    name: 'RARI Chain',
    coingeckoNetworkId: 'rari',
    logoUrl: '/assets/images/vendor/chains/rari.svg',
    infoUrl: 'https://rarichain.org/',
    explorerUrl: 'https://mainnet.explorer.rarichain.org',
    etherscanCompatibleApiUrl: 'https://mainnet.explorer.rarichain.org/api',
    rpc: {
      main: 'https://mainnet.rpc.rarichain.org/http',
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Redstone]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Redstone,
    name: 'Redstone',
    coingeckoNetworkId: 'redstone',
    logoUrl: '/assets/images/vendor/chains/redstone.svg',
    etherscanCompatibleApiUrl: 'https://explorer.redstone.xyz/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.RolluxMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.RolluxMainnet,
    name: 'Rollux',
    nativeTokenCoingeckoId: 'syscoin',
    coingeckoNetworkId: 'rollux',
    logoUrl: '/assets/images/vendor/chains/rollux.svg',
    etherscanCompatibleApiUrl: 'https://explorer.rollux.com/api',
    rpc: {
      main: 'https://rpc.rollux.com',
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.RISE]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.RISE,
    name: 'RISE',
    logoUrl: '/assets/images/vendor/chains/rise.svg',
  }),
  [ChainId.RISETestnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.RISETestnet,
    name: 'RISE Testnet',
    logoUrl: '/assets/images/vendor/chains/rise.svg',
    explorerUrl: 'https://explorer.testnet.riselabs.xyz',
    etherscanCompatibleApiUrl: 'https://explorer.testnet.riselabs.xyz/api',
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.RISE,
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.RootstockMainnet]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.RootstockMainnet,
    name: 'Rootstock',
    nativeTokenCoingeckoId: 'rootstock',
    coingeckoNetworkId: 'rootstock',
    logoUrl: '/assets/images/vendor/chains/rootstock.jpg',
    explorerUrl: 'https://rootstock.blockscout.com',
    etherscanCompatibleApiUrl: 'https://rootstock.blockscout.com/api',
    rpc: {
      main: `https://rootstock-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.RSS3VSLMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.RSS3VSLMainnet,
    name: 'RSS3 VSL',
    nativeTokenCoingeckoId: 'rss3',
    coingeckoNetworkId: 'rss3-vsl-mainnet',
    logoUrl: '/assets/images/vendor/chains/rss3.svg',
    etherscanCompatibleApiUrl: 'https://scan.rss3.io/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Scroll]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Scroll,
    name: 'Scroll',
    coingeckoNetworkId: 'scroll',
    logoUrl: '/assets/images/vendor/chains/scroll.svg',
    explorerUrl: 'https://scrollscan.com',
    etherscanCompatibleApiUrl: 'https://api.scrollscan.com/api',
    rpc: {
      main: `https://scroll-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.ScrollSepoliaTestnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.ScrollSepoliaTestnet,
    name: 'Scroll Sepolia',
    logoUrl: '/assets/images/vendor/chains/scroll.svg',
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Scroll,
  }),
  [ChainId.SeiNetwork]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.SeiNetwork,
    name: 'Sei',
    nativeTokenCoingeckoId: 'sei-network',
    coingeckoNetworkId: 'sei-network',
    logoUrl: '/assets/images/vendor/chains/sei.svg',
    explorerUrl: 'https://seiscan.io',
    rpc: {
      main: `https://sei-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Shape]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Shape,
    name: 'Shape',
    coingeckoNetworkId: 'shape',
    logoUrl: '/assets/images/vendor/chains/shape.svg',
    etherscanCompatibleApiUrl: 'https://shapescan.xyz/api',
    rpc: {
      main: `https://shape-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
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
    etherscanCompatibleApiUrl: 'https://explorer.evm.shimmer.network/api',
    deployedContracts: { ...MULTICALL },
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
    etherscanCompatibleApiUrl: 'https://soneium.blockscout.com/api',
    rpc: {
      main: `https://soneium-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.soneium.org',
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.SonicMainnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.SonicMainnet,
    name: 'Sonic',
    nativeTokenCoingeckoId: 'sonic-3',
    coingeckoNetworkId: 'sonic',
    logoUrl: '/assets/images/vendor/chains/sonic.svg',
    explorerUrl: 'https://sonicscan.org',
    rpc: {
      main: `https://sonic-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId['SongbirdCanary-Network']]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId['SongbirdCanary-Network'],
    name: 'Songbird',
    nativeTokenCoingeckoId: 'songbird',
    coingeckoNetworkId: 'songbird',
    logoUrl: '/assets/images/vendor/chains/songbird.svg',
    infoUrl: 'https://flare.network/songbird',
    etherscanCompatibleApiUrl: 'https://songbird-explorer.flare.network/api',
    deployedContracts: { ...MULTICALL },
    isCanary: true,
    correspondingMainnetChainId: ChainId.FlareMainnet,
  }),
  [ChainId.Sophon]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Sophon,
    name: 'Sophon',
    nativeTokenCoingeckoId: 'sophon',
    coingeckoNetworkId: 'sophon',
    logoUrl: '/assets/images/vendor/chains/sophon.jpg',
    explorerUrl: 'https://sophscan.xyz',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Story]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Story,
    name: 'Story',
    nativeTokenCoingeckoId: 'story-2',
    coingeckoNetworkId: 'story',
    logoUrl: '/assets/images/vendor/chains/story.svg',
    etherscanCompatibleApiUrl: 'https://storyscan.xyz/api',
    rpc: {
      main: 'https://mainnet.storyrpc.io',
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.SubtensorEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.SubtensorEVM,
    name: 'Bittensor EVM',
    nativeTokenCoingeckoId: 'bittensor',
    coingeckoNetworkId: 'bittensor',
    logoUrl: '/assets/images/vendor/chains/bittensor.svg',
    explorerUrl: 'https://evm.taostats.io',
    etherscanCompatibleApiUrl: 'https://evm.taostats.io/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Superposition]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Superposition,
    name: 'Superposition',
    coingeckoNetworkId: 'superposition',
    logoUrl: '/assets/images/vendor/chains/superposition.svg',
    etherscanCompatibleApiUrl: 'https://explorer-superposition-1v9rjalnat.t.conduit.xyz/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Swellchain]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Swellchain,
    name: 'Swellchain',
    coingeckoNetworkId: 'swellchain',
    logoUrl: '/assets/images/vendor/chains/swellchain.svg',
    etherscanCompatibleApiUrl: 'https://explorer.swellnetwork.io/api',
    rpc: {
      main: 'https://rpc.ankr.com/swell',
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.SyscoinMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.SyscoinMainnet,
    name: 'Syscoin',
    nativeTokenCoingeckoId: 'syscoin',
    logoUrl: '/assets/images/vendor/chains/syscoin.svg',
    etherscanCompatibleApiUrl: 'https://explorer.syscoin.org/api',
    rpc: {
      main: 'https://rpc.syscoin.org',
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.TaikoAlethia]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.TaikoAlethia,
    name: 'Taiko Alethia',
    coingeckoNetworkId: 'taiko',
    logoUrl: '/assets/images/vendor/chains/taiko.svg',
    explorerUrl: 'https://taikoscan.io',
    deployedContracts: { ...MULTICALL },
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Unichain]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.Unichain,
    name: 'Unichain',
    coingeckoNetworkId: 'unichain',
    logoUrl: '/assets/images/vendor/chains/unichain.svg',
    explorerUrl: 'https://uniscan.xyz',
    rpc: {
      main: `https://unichain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.unichain.org',
    },
    deployedContracts: { ...MULTICALL },
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
  [ChainId.VelasEVMMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.VelasEVMMainnet,
    name: 'Velas',
    nativeTokenCoingeckoId: 'velas',
    coingeckoNetworkId: 'velas',
    logoUrl: '/assets/images/vendor/chains/velas.svg',
    etherscanCompatibleApiUrl: 'https://evmexplorer.velas.com/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Viction]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.Viction,
    name: 'Viction',
    nativeTokenCoingeckoId: 'tomochain',
    coingeckoNetworkId: 'tomochain',
    logoUrl: '/assets/images/vendor/chains/viction.svg',
    explorerUrl: 'https://www.vicscan.xyz',
    deployedContracts: { ...MULTICALL },
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
    deployedContracts: { ...MULTICALL },
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
  [ChainId.ZenChain]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.ZenChain,
    name: 'ZenChain',
    logoUrl: '/assets/images/vendor/chains/zenchain.svg',
  }),
  [ChainId.ZenChainTestnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ZenChainTestnet,
    name: 'ZenChain Testnet',
    logoUrl: '/assets/images/vendor/chains/zenchain.svg',
    etherscanCompatibleApiUrl: 'https://zentrace.io/api',
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.ZenChain,
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
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.ZetaChainTestnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ZetaChainTestnet,
    name: 'ZetaChain Testnet',
    nativeTokenCoingeckoId: 'zetachain',
    logoUrl: '/assets/images/vendor/chains/zetachain.svg',
    explorerUrl: 'https://zetachain-athens-3.blockscout.com',
    etherscanCompatibleApiUrl: 'https://zetachain-athens-3.blockscout.com/api',
    rpc: {
      main: `https://lb.drpc.live/zeta-chain-testnet/${DRPC_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.ZetaChainMainnet,
  }),
  [ChainId.ZetaChainMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ZetaChainMainnet,
    name: 'ZetaChain',
    nativeTokenCoingeckoId: 'zetachain',
    coingeckoNetworkId: 'zetachain',
    logoUrl: '/assets/images/vendor/chains/zetachain.svg',
    explorerUrl: 'https://zetachain.blockscout.com',
    etherscanCompatibleApiUrl: 'https://zetachain.blockscout.com/api',
    rpc: {
      main: `https://lb.drpc.live/zeta-chain/${DRPC_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
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
      multicall3: { address: '0xF9cda624FBC7e059355ce98a31693d299FACd963' },
    },
    // TODO: Add SyncSwap strategy to support ZkSync
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
    deployedContracts: { ...MULTICALL },
  }),
  1234567890: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: 1234567890,
    name: 'ZugChain',
    logoUrl: '/assets/images/vendor/chains/zugchain.svg',
  }),
  824642: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: 824642,
    name: 'ZugChain Testnet',
    nativeToken: 'ZUG',
    infoUrl: 'https://zugchain.org',
    logoUrl: '/assets/images/vendor/chains/zugchain.svg',
    explorerUrl: 'https://explorer.zugchain.org',
    etherscanCompatibleApiUrl: 'https://explorer.zugchain.org/api',
    rpc: {
      main: 'https://rpc.zugchain.org',
    },
    isTestnet: true,
    correspondingMainnetChainId: 1234567890,
  }),
} as const;

export const SUPPORTED_CHAINS = Object.values(CHAINS)
  .filter((chain) => chain.isSupported())
  .map((chain) => chain.chainId);

export const ETHERSCAN_SUPPORTED_CHAINS = Object.values(CHAINS)
  .filter((chain) => chain.type === SupportType.ETHERSCAN_COMPATIBLE)
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
  return getChainConfig(chainId).type === SupportType.ETHERSCAN_COMPATIBLE;
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

export const createViemPublicClientForChain = (chainId: DocumentedChainId, url?: string): PublicClient => {
  return getChainConfig(chainId).createViemPublicClient(url);
};

export const getChainAddEthereumChainParameter = (chainId: DocumentedChainId): AddEthereumChainParameter => {
  return getChainConfig(chainId).getAddEthereumChainParameter();
};
