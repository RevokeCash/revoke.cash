import { ChainId } from '@revoke.cash/chains';
import { ALCHEMY_API_KEY, DRPC_API_KEY, INFURA_API_KEY, MULTICALL_ADDRESS } from 'lib/constants';
import type { RateLimit } from 'lib/interfaces';
import { AggregatePriceStrategy, AggregationType } from 'lib/price/AggregatePriceStrategy';
import { HardcodedPriceStrategy } from 'lib/price/HardcodedPriceStrategy';
import type { PriceStrategy } from 'lib/price/PriceStrategy';
import { UniswapV2PriceStrategy } from 'lib/price/UniswapV2PriceStrategy';
import { UniswapV3ReadonlyPriceStrategy } from 'lib/price/UniswapV3ReadonlyPriceStrategy';
import { type AddEthereumChainParameter, type PublicClient, toHex, type Chain as ViemChain } from 'viem';
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
  ChainId.Berachain,
  ChainId.CronosMainnet,
  ChainId.Hemi,
  ChainId.Unichain,
  ChainId.Scroll,
  ChainId.CoreBlockchainMainnet,
  ChainId.SeiNetwork,
  ChainId.PlumeMainnet,
  ChainId.BitlayerMainnet,
  ChainId.Abstract,
  ChainId.Mantle,
  ChainId.Mode,
  ChainId.Gnosis,
  ChainId.Blast,
  ChainId.ZkSyncMainnet,
  ChainId.Ink,
  ChainId.MerlinMainnet,
  ChainId.TaikoAlethia,
  ChainId.BOB,
  ChainId.RootstockMainnet,
  ChainId.PulseChain,
  ChainId.Fraxtal,
  ChainId.Morph,
  ChainId.Soneium,
  ChainId.CeloMainnet,
  ChainId.Story,
  ChainId.FlowEVMMainnet,
  ChainId['Filecoin-Mainnet'],
  ChainId.FlareMainnet,
  ChainId.ApeChain,
  ChainId.WorldChain,
  ChainId.ZircuitMainnet,
  ChainId.RoninMainnet,
  ChainId.Lens,
  ChainId.FantomOpera,
  ChainId.OpBNBMainnet,
  ChainId.PolygonzkEVM,
  ChainId.ArbitrumNova,
  ChainId.MetisAndromedaMainnet,
  ChainId.MantaPacificMainnet,
  ChainId.Lisk,
  ChainId['SongbirdCanary-Network'],
  ChainId.IOTAEVM,
  ChainId.Astar,
  999, // Hyperliquid EVM
  ChainId.TelosEVMMainnet,
  ChainId.XDCNetwork,
  ChainId.Sophon,
  ChainId['WEMIX3.0Mainnet'],
  ChainId.RolluxMainnet,
  ChainId.ImmutablezkEVM,
  ChainId.SyscoinMainnet,
  ChainId.XLayerMainnet,
  ChainId.ZetaChainMainnet,
  ChainId.AuroraMainnet,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.BobaNetwork,
  ChainId.ZkLinkNovaMainnet,
  ChainId.GravityAlphaMainnet,
  ChainId.EOSEVMNetwork,
  ChainId.OasisEmerald,
  ChainId.OasisSapphire,
  ChainId.MintMainnet,
  ChainId.ChilizChainMainnet,
  ChainId.Canto,
  ChainId.DogechainMainnet,
  ChainId.Beam,
  ChainId.Shibarium,
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
  ChainId.Sanko,
  ChainId.EthereumClassic,
  ChainId.LightlinkPhoenixMainnet,
  ChainId.ENULSMainnet,
  ChainId.Shape,
  ChainId.ZKFairMainnet,
  ChainId.InEVMMainnet,
  ChainId.CrabNetwork,
  ChainId.DarwiniaNetwork,
  ChainId.Zora,
  ChainId.KardiaChainMainnet,
  ChainId.Superposition,
  ChainId.Nahmii3Mainnet,
  ChainId.ShidoNetwork,
  ChainId.CallistoMainnet,
  ChainId.RARIChainMainnet,
  ChainId.NeoXMainnet,
  ChainId.BitgertMainnet,
  ChainId.Palm,
  ChainId.Redstone,
  ChainId.RSS3VSLMainnet,
  ChainId.ExosamaNetwork,
  ChainId.OctaSpace,
  ChainId.BasedAI,
] as const;

export const CHAIN_SELECT_TESTNETS = [
  ChainId.EthereumSepolia,
  ChainId.Holesky,
  ChainId.BNBSmartChainTestnet,
  ChainId.Amoy,
  ChainId.PolygonzkEVMCardonaTestnet,
  ChainId.OPSepoliaTestnet,
  ChainId.ArbitrumSepolia,
  ChainId.BaseSepoliaTestnet,
  ChainId.ZkSyncSepoliaTestnet,
  ChainId.AbstractSepoliaTestnet,
  ChainId.LineaSepolia,
  ChainId.ScrollSepoliaTestnet,
  ChainId.TaikoHekla,
  ChainId.BlastSepoliaTestnet,
  ChainId.MorphHolesky,
  ChainId.AvalancheFujiTestnet,
  ChainId.CronosTestnet,
  ChainId.CeloAlfajoresTestnet,
  ChainId.MoonbaseAlpha,
  ChainId.MantleSepoliaTestnet,
  ChainId.FraxtalTestnet,
  ChainId.ZetaChainTestnet,
  ChainId.MonadTestnet,
  ChainId.PlumeTestnet,
  ChainId.BeamTestnet,
  ChainId.TabiTestnetv2,
  ChainId.CreatorChainTestnet,
  ChainId.ZenChainTestnet,
  ChainId.MegaETHTestnet,
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
    logoUrl: '/assets/images/vendor/chains/abstract.jpg',
    explorerUrl: 'https://abscan.org',
    rpc: {
      main: `https://abstract-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://api.mainnet.abs.xyz',
    },
    deployedContracts: { multicall3: { address: '0xAa4De41dba0Ca5dCBb288b7cC6b708F3aaC759E7' } },
    priceStrategy: undefined, // TODO
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
    nativeTokenCoingeckoId: 'matic-network',
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
    logoUrl: '/assets/images/vendor/chains/apechain.svg',
    explorerUrl: 'https://apescan.io',
    infoUrl: 'https://apechain.com',
    rpc: {
      main: `https://apechain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://apechain.calderachain.xyz/http',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.ArbitrumNova]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.ArbitrumNova,
    name: 'Arbitrum Nova',
    nativeToken: 'ETH',
    logoUrl: '/assets/images/vendor/chains/arbitrum-nova.svg',
    explorerUrl: 'https://nova.arbiscan.io',
    rpc: {
      main: `https://arbnova-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      logs: 'https://42170.rpc.hypersync.xyz',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.ArbitrumOne]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ArbitrumOne,
    name: 'Arbitrum',
    nativeToken: 'ETH',
    logoUrl: '/assets/images/vendor/chains/arbitrum.svg',
    explorerUrl: 'https://arbiscan.io',
    rpc: {
      main: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      logs: `https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      free: 'https://arb1.arbitrum.io/rpc',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
        // new BackendPriceStrategy({}),
      ],
    }),
    // backendPriceStrategy: new ReservoirNftPriceStrategy({
    //   apiKey: RESERVOIR_API_KEY,
    //   apiUrl: 'https://api-arbitrum.reservoir.tools',
    // }),
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
    logoUrl: '/assets/images/vendor/chains/astar.svg',
    explorerUrl: 'https://blockscout.com/astar',
    etherscanCompatibleApiUrl: 'https://blockscout.com/astar/api',
    rpc: {
      main: 'https://evm.astar.network',
      free: 'https://evm.astar.network',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.AuroraMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.AuroraMainnet,
    name: 'Aurora',
    nativeTokenCoingeckoId: 'aurora-near',
    logoUrl: '/assets/images/vendor/chains/aurora.svg',
    explorerUrl: 'https://explorer.aurora.dev',
    etherscanCompatibleApiUrl: 'https://explorer.mainnet.aurora.dev/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId['AvalancheC-Chain']]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId['AvalancheC-Chain'],
    name: 'Avalanche',
    nativeTokenCoingeckoId: 'avalanche-2',
    logoUrl: '/assets/images/vendor/chains/avalanche.svg',
    explorerUrl: 'https://snowscan.xyz',
    etherscanCompatibleApiUrl: 'https://api.snowscan.xyz/api',
    rpc: {
      main: `https://avalanche-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
      aggregationType: AggregationType.ANY,
      strategies: [
        // Trader JOE (Router) | WAVAX -> USDC
        new UniswapV2PriceStrategy({
          address: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
          path: ['0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'],
          decimals: 6,
        }),
        // new BackendPriceStrategy({}),
      ],
    }),
    // backendPriceStrategy: new ReservoirNftPriceStrategy({
    //   apiKey: RESERVOIR_API_KEY,
    //   apiUrl: 'https://api-avalanche.reservoir.tools',
    // }),
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
  [ChainId.BasedAI]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.BasedAI,
    name: 'BasedAI',
    nativeTokenCoingeckoId: 'basedai',
    logoUrl: '/assets/images/vendor/chains/basedai.jpg',
    explorerUrl: 'https://explorer.bf1337.org',
    etherscanCompatibleApiUrl: 'https://explorer.bf1337.org/api',
    rpc: {
      main: 'https://mainnet.basedaibridge.com/rpc',
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Base]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Base,
    name: 'Base',
    logoUrl: '/assets/images/vendor/chains/base.svg',
    etherscanCompatibleApiUrl: 'https://api.basescan.org/api',
    rpc: {
      main: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      logs: `https://base-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    // TODO: Look at integrating Aerodrome (forked from Velodrome) for Base
    // TODO: Can also add BaseSwap (Unsiwap v2)
    priceStrategy: new AggregatePriceStrategy({
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
        // new BackendPriceStrategy({}),
      ],
    }),
    // backendPriceStrategy: new ReservoirNftPriceStrategy({
    //   apiKey: RESERVOIR_API_KEY,
    //   apiUrl: 'https://api-base.reservoir.tools',
    // }),
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
    type: SupportType.PROVIDER,
    chainId: ChainId.Beam,
    name: 'Beam',
    nativeTokenCoingeckoId: 'beam',
    logoUrl: '/assets/images/vendor/chains/beam.svg',
    explorerUrl: 'https://4337.routescan.io',
    rpc: {
      main: 'https://build.onbeam.com/rpc',
    },
    deployedContracts: {
      multicall3: { address: '0x4956F15eFdc3dC16645e90Cc356eAFA65fFC65Ec' },
    },
    priceStrategy: new AggregatePriceStrategy({
      aggregationType: AggregationType.ANY,
      strategies: [
        // Beam Swap (Router) | WBEAM -> USDC
        new UniswapV2PriceStrategy({
          address: '0x965B104e250648d01d4B3b72BaC751Cde809D29E',
          path: ['0xD51BFa777609213A653a2CD067c9A0132a2D316A', '0x76BF5E7d2Bcb06b1444C0a2742780051D8D0E304'],
          decimals: 6,
        }),
      ],
    }),
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
    logoUrl: '/assets/images/vendor/chains/berachain.svg',
    explorerUrl: 'https://berascan.com',
    rpc: {
      main: `https://berachain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.BitgertMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.BitgertMainnet,
    name: 'Bitgert',
    nativeTokenCoingeckoId: 'bitrise-token',
    logoUrl: '/assets/images/vendor/chains/bitgert.svg',
    etherscanCompatibleApiUrl: 'https://brisescan.com/api',
    nativeToken: 'BRISE',
    rpc: {
      main: 'https://rpc-bitgert.icecreamswap.com',
      free: 'https://rpc-bitgert.icecreamswap.com',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // No liquid stablecoins
  }),
  [ChainId.BitlayerMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.BitlayerMainnet,
    name: 'Bitlayer',
    nativeTokenCoingeckoId: 'bitcoin',
    logoUrl: '/assets/images/vendor/chains/bitlayer.png',
    rpc: {
      main: 'https://rpc.bitlayer.org',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.BitTorrentChainMainnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.BitTorrentChainMainnet,
    name: 'BTT Chain',
    nativeTokenCoingeckoId: 'bittorrent',
    logoUrl: '/assets/images/vendor/chains/bttc.svg',
    explorerUrl: 'https://bttcscan.com',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // No DEXes that are compatible with other popular DEXes
  }),
  [ChainId.Blast]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Blast,
    name: 'Blast',
    logoUrl: '/assets/images/vendor/chains/blast.jpg',
    explorerUrl: 'https://blastscan.io',
    etherscanCompatibleApiUrl: 'https://api.blastscan.io/api',
    rpc: {
      // main: `https://blast-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      main: `https://blast-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      logs: 'https://81457.rpc.hypersync.xyz',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.BlastSepoliaTestnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.BlastSepoliaTestnet,
    name: 'Blast Sepolia',
    logoUrl: '/assets/images/vendor/chains/blast.jpg',
    explorerUrl: 'https://sepolia.blastscan.io',
    rpc: {
      main: `https://blast-sepolia.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Blast,
  }),
  [ChainId.BNBSmartChainMainnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.BNBSmartChainMainnet,
    name: 'BNB Chain',
    nativeTokenCoingeckoId: 'binancecoin',
    logoUrl: '/assets/images/vendor/chains/bnb-chain.svg',
    rpc: {
      main: `https://bnb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      // logs: 'https://56.rpc.hypersync.xyz',
    },
    deployedContracts: {
      multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11', blockCreated: 15921452 },
    },
    priceStrategy: new AggregatePriceStrategy({
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
        // new BackendPriceStrategy({}),
      ],
    }),
    // backendPriceStrategy: new ReservoirNftPriceStrategy({
    //   apiKey: RESERVOIR_API_KEY,
    //   apiUrl: 'https://api-bsc.reservoir.tools',
    // }),
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
    logoUrl: '/assets/images/vendor/chains/bob.svg',
    etherscanCompatibleApiUrl: 'https://explorer.gobob.xyz/api',
    rpc: {
      main: `https://bob-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.BobaNetwork]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.BobaNetwork,
    name: 'Boba',
    logoUrl: '/assets/images/vendor/chains/boba.jpg',
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.CallistoMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.CallistoMainnet,
    name: 'Callisto',
    nativeTokenCoingeckoId: 'callisto',
    logoUrl: '/assets/images/vendor/chains/callisto.png',
    explorerUrl: 'https://explorer.callistodao.org',
    etherscanCompatibleApiUrl: 'https://explorer.callistodao.org/api',
    rpc: {
      main: 'https://rpc.callistodao.org',
      free: 'https://rpc.callistodao.org',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.Canto]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Canto,
    name: 'Canto',
    nativeTokenCoingeckoId: 'canto',
    logoUrl: '/assets/images/vendor/chains/canto.svg',
    explorerUrl: 'https://tuber.build',
    etherscanCompatibleApiUrl: 'https://explorer.plexnode.wtf/api',
    rpc: {
      main: 'https://canto.gravitychain.io',
      free: 'https://canto.gravitychain.io',
    },
    deployedContracts: { ...MULTICALL },
    // TODO: Canto DEX is not fully compatible with Uniswap v2, but it might be partially compatible, so we can look into
    // amending the Uniswap v2 strategy to work with it (https://tuber.build/address/0xa252eEE9BDe830Ca4793F054B506587027825a8e)
    priceStrategy: undefined,
  }),
  [ChainId.CeloAlfajoresTestnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.CeloAlfajoresTestnet,
    name: 'Celo Alfajores',
    nativeTokenCoingeckoId: 'celo',
    logoUrl: '/assets/images/vendor/chains/celo.svg',
    explorerUrl: 'https://alfajores.celoscan.io',
    rpc: {
      main: `https://celo-alfajores.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.CeloMainnet,
  }),
  [ChainId.CeloMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.CeloMainnet,
    name: 'Celo',
    nativeTokenCoingeckoId: 'celo',
    logoUrl: '/assets/images/vendor/chains/celo.svg',
    rpc: {
      // main: `https://celo-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY} `,
      main: `https://celo-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    // TODO: Could benefit from a Curve.fi strategy
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.ChilizChainMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ChilizChainMainnet,
    name: 'Chiliz',
    nativeTokenCoingeckoId: 'chiliz',
    logoUrl: '/assets/images/vendor/chains/chiliz.png',
    etherscanCompatibleApiUrl: 'https://scan.chiliz.com/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.CoinExSmartChainMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.CoinExSmartChainMainnet,
    name: 'CoinEx Smart Chain',
    nativeToken: 'CET',
    nativeTokenCoingeckoId: 'coinex-token',
    logoUrl: '/assets/images/vendor/chains/coinex.svg',
    priceStrategy: undefined, // No liquid stablecoins
  }),
  [ChainId.CoreBlockchainMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.CoreBlockchainMainnet,
    name: 'CORE',
    nativeTokenCoingeckoId: 'coredaoorg',
    logoUrl: '/assets/images/vendor/chains/core.png',
    rpc: {
      main: 'https://rpc.coredao.org',
    },
    deployedContracts: { ...MULTICALL },
    // Note: CORE apparently has like 5 competing "USDT" coins trading on different DEXes, so for now we added 3
    // different strategies for different DEXes, making sure to use different USDTs for each.
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.CrabNetwork]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.CrabNetwork,
    name: 'Crab',
    logoUrl: '/assets/images/vendor/chains/crab.svg',
    etherscanCompatibleApiUrl: 'https://crab-scan.darwinia.network/api',
    rpc: {
      main: 'https://crab-rpc.darwinia.network',
    },
    deployedContracts: { ...MULTICALL },
    isCanary: true,
    correspondingMainnetChainId: ChainId.DarwiniaNetwork,
    priceStrategy: undefined, // TODO
  }),
  [ChainId.CreatorChainTestnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.CreatorChainTestnet,
    name: 'Creator Chain Testnet',
    logoUrl: '/assets/images/vendor/chains/creator-chain.png',
    etherscanCompatibleApiUrl: 'https://explorer.creatorchain.io/api',
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: 12345678902,
  }),
  [ChainId.CronosMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.CronosMainnet,
    name: 'Cronos',
    nativeTokenCoingeckoId: 'crypto-com-chain',
    logoUrl: '/assets/images/vendor/chains/cronos.svg',
    etherscanCompatibleApiUrl: 'https://cronos.org/explorer/api',
    rpc: {
      main: `https://lb.drpc.org/ogrpc?network=cronos&dkey=${DRPC_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
    priceStrategy: undefined, // TODO
  }),
  [ChainId.DegenChain]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.DegenChain,
    name: 'Degen Chain',
    nativeTokenCoingeckoId: 'degen-base',
    logoUrl: '/assets/images/vendor/chains/degen.png',
    explorerUrl: 'https://explorer.degen.tips',
    etherscanCompatibleApiUrl: 'https://explorer.degen.tips/api',
    rpc: {
      main: 'https://rpc.degen.tips',
    },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.DogechainMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.DogechainMainnet,
    name: 'Dogechain',
    nativeTokenCoingeckoId: 'dogechain',
    logoUrl: '/assets/images/vendor/chains/dogechain.jpg',
    etherscanCompatibleApiUrl: 'https://explorer.dogechain.dog/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // All stablecoins on Dogechain are depegged
  }),
  [ChainId.ElastosSmartChain]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ElastosSmartChain,
    name: 'Elastos',
    nativeTokenCoingeckoId: 'elastos',
    logoUrl: '/assets/images/vendor/chains/elastos.jpg',
    etherscanCompatibleApiUrl: 'https://esc.elastos.io/api',
    rpc: {
      main: 'https://rpc.glidefinance.io',
    },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.ENULSMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ENULSMainnet,
    name: 'ENULS',
    nativeTokenCoingeckoId: 'nuls',
    logoUrl: '/assets/images/vendor/chains/enuls.svg',
    etherscanCompatibleApiUrl: 'https://evmscan.nuls.io/api',
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.EOSEVMNetwork]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.EOSEVMNetwork,
    name: 'EOS EVM',
    nativeTokenCoingeckoId: 'eos',
    logoUrl: '/assets/images/vendor/chains/eos.svg',
    etherscanCompatibleApiUrl: 'https://explorer.evm.eosnetwork.com/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.EthereumClassic]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.EthereumClassic,
    name: 'Ethereum Classic',
    nativeTokenCoingeckoId: 'ethereum-classic',
    logoUrl: '/assets/images/vendor/chains/etc.png',
    etherscanCompatibleApiUrl: 'https://blockscout.com/etc/mainnet/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // No liquid stablecoins
  }),
  [ChainId.EthereumMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.EthereumMainnet,
    name: 'Ethereum',
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
    priceStrategy: new AggregatePriceStrategy({
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
        // new BackendPriceStrategy({}),
      ],
    }),
    // backendPriceStrategy: new ReservoirNftPriceStrategy({
    //   apiKey: RESERVOIR_API_KEY,
    //   apiUrl: 'https://api.reservoir.tools',
    // }),
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
    logoUrl: '/assets/images/vendor/chains/exosama.png',
    priceStrategy: undefined, // <$100k Liquidity
  }),
  [ChainId.FantomOpera]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.FantomOpera,
    name: 'Fantom',
    nativeTokenCoingeckoId: 'fantom',
    logoUrl: '/assets/images/vendor/chains/fantom.svg',
    rpc: {
      main: `https://lb.drpc.org/ogrpc?network=fantom&dkey=${DRPC_API_KEY}`,
      // logs: 'https://250.rpc.hypersync.xyz',
      free: 'https://rpc.fantom.network',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId['Filecoin-Mainnet']]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId['Filecoin-Mainnet'],
    name: 'Filecoin EVM',
    nativeTokenCoingeckoId: 'filecoin',
    logoUrl: '/assets/images/vendor/chains/filecoin.svg',
    etherscanCompatibleApiUrl: 'https://filecoin.blockscout.com/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.FlareMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.FlareMainnet,
    name: 'Flare',
    nativeTokenCoingeckoId: 'flare-networks',
    logoUrl: '/assets/images/vendor/chains/flare.svg',
    etherscanCompatibleApiUrl: 'https://flare-explorer.flare.network/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.FlowEVMMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.FlowEVMMainnet,
    name: 'Flow EVM',
    nativeTokenCoingeckoId: 'flow',
    logoUrl: '/assets/images/vendor/chains/flow.png',
    etherscanCompatibleApiUrl: 'https://evm.flowscan.io/api',
    rpc: {
      main: `https://flow-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Fraxtal]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.Fraxtal,
    name: 'Fraxtal',
    nativeTokenCoingeckoId: 'frax-ether',
    logoUrl: '/assets/images/vendor/chains/fraxtal.svg',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.FraxtalTestnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.FraxtalTestnet,
    name: 'Fraxtal Holesky',
    nativeTokenCoingeckoId: 'frax-ether',
    logoUrl: '/assets/images/vendor/chains/fraxtal.svg',
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Fraxtal,
  }),
  [ChainId.FuseMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.FuseMainnet,
    name: 'Fuse',
    nativeTokenCoingeckoId: 'fuse-network-token',
    logoUrl: '/assets/images/vendor/chains/fuse.png',
    explorerUrl: 'https://explorer.fuse.io',
    etherscanCompatibleApiUrl: 'https://explorer.fuse.io/api',
    rpc: {
      main: 'https://fuse-pokt.nodies.app',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.Gnosis]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Gnosis,
    name: 'Gnosis Chain',
    nativeTokenCoingeckoId: 'xdai',
    logoUrl: '/assets/images/vendor/chains/gnosis.svg',
    explorerUrl: 'https://gnosisscan.io',
    etherscanCompatibleApiUrl: 'https://api.gnosisscan.io/api',
    deployedContracts: { ...MULTICALL },
    rpc: {
      main: `https://gnosis-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.GravityAlphaMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.GravityAlphaMainnet,
    name: 'Gravity Alpha',
    nativeTokenCoingeckoId: 'g-token',
    logoUrl: '/assets/images/vendor/chains/gravity.svg',
    etherscanCompatibleApiUrl: 'https://explorer-gravity-mainnet-0.t.conduit.xyz/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
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
    priceStrategy: undefined, // RPC on Harmony is not really reliable + USDC is depegged, so not worth it
  }),
  [ChainId.Hemi]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Hemi,
    name: 'Hemi',
    logoUrl: '/assets/images/vendor/chains/hemi.svg',
    etherscanCompatibleApiUrl: 'https://explorer.hemi.xyz/api',
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.Holesky]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.Holesky,
    name: 'Ethereum Holesky',
    logoUrl: '/assets/images/vendor/chains/ethereum.svg',
    rpc: {
      main: `https://eth-holesky.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://holesky.drpc.org',
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.EthereumMainnet,
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
    explorerUrl: 'https://hyperevmscan.io',
    infoUrl: 'https://hyperfoundation.org/',
    logoUrl: '/assets/images/vendor/chains/hyperliquid.svg',
    rpc: {
      main: 'https://rpc.hyperliquid.xyz/evm',
      free: 'https://rpc.hyperliquid.xyz/evm',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.ImmutablezkEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ImmutablezkEVM,
    name: 'Immutable zkEVM',
    nativeTokenCoingeckoId: 'immutable-x',
    logoUrl: '/assets/images/vendor/chains/immutable.svg',
    etherscanCompatibleApiUrl: 'https://explorer.immutable.com/api',
    rpc: {
      main: `https://lb.drpc.org/ogrpc?network=immutable-zkevm&dkey=${DRPC_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
  }),
  [ChainId.InEVMMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.InEVMMainnet,
    name: 'inEVM',
    nativeTokenCoingeckoId: 'injective-protocol',
    logoUrl: '/assets/images/vendor/chains/injective.svg',
    explorerUrl: 'https://explorer.inevm.com',
    etherscanCompatibleApiUrl: 'https://explorer.inevm.com/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Ink]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Ink,
    name: 'Ink',
    logoUrl: '/assets/images/vendor/chains/ink.svg',
    rpc: {
      main: `https://ink-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.IOTAEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.IOTAEVM,
    name: 'IOTA EVM',
    nativeTokenCoingeckoId: 'iota',
    logoUrl: '/assets/images/vendor/chains/iota.svg',
    etherscanCompatibleApiUrl: 'https://explorer.evm.iota.org/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.IoTeXNetworkMainnet]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.IoTeXNetworkMainnet,
    name: 'IoTeX',
    logoUrl: '/assets/images/vendor/chains/iotex.png',
  }),
  [ChainId.KaiaMainnet]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.KaiaMainnet,
    name: 'Kaia',
    logoUrl: '/assets/images/vendor/chains/kaia.svg',
  }),
  [ChainId.KardiaChainMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.KardiaChainMainnet,
    name: 'KardiaChain',
    nativeTokenCoingeckoId: 'kardiachain',
    logoUrl: '/assets/images/vendor/chains/kardiachain.svg',
    explorerUrl: 'https://explorer.kardiachain.io',
    etherscanCompatibleApiUrl: 'https://explorer.kardiachain.io/api',
    priceStrategy: undefined, // No liquid stablecoins
  }),
  [ChainId.Katana]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Katana,
    name: 'Katana',
    logoUrl: '/assets/images/vendor/chains/katana.svg',
    etherscanCompatibleApiUrl: 'https://explorer-katana.t.conduit.xyz/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.KCCMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.KCCMainnet,
    name: 'KCC',
    nativeTokenCoingeckoId: 'kucoin-shares',
    logoUrl: '/assets/images/vendor/chains/kcc.svg',
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.Lens]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.Lens,
    name: 'Lens',
    nativeTokenCoingeckoId: 'gho',
    logoUrl: '/assets/images/vendor/chains/lens.jpg',
    explorerUrl: 'https://explorer.lens.xyz',
    rpc: {
      main: `https://lens-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.lens.xyz',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.LightlinkPhoenixMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.LightlinkPhoenixMainnet,
    name: 'Lightlink',
    logoUrl: '/assets/images/vendor/chains/lightlink.jpg',
    etherscanCompatibleApiUrl: 'https://phoenix.lightlink.io/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // <$100k Liquidity
  }),
  [ChainId.Linea]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Linea,
    name: 'Linea',
    logoUrl: '/assets/images/vendor/chains/linea.png',
    explorerUrl: 'https://lineascan.build',
    rpc: {
      // main: `https://linea-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      main: `https://linea-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    // TODO: Add SyncSwap strategy to support Linea
    priceStrategy: undefined,
    // backendPriceStrategy: new ReservoirNftPriceStrategy({
    //   apiKey: RESERVOIR_API_KEY,
    //   apiUrl: 'https://api-linea.reservoir.tools',
    // }),
  }),
  [ChainId.LineaSepolia]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.LineaSepolia,
    name: 'Linea Sepolia',
    logoUrl: '/assets/images/vendor/chains/linea.png',
    rpc: {
      main: `https://linea-sepolia.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Linea,
  }),
  // [ChainId.LUKSOMainnet]: new Chain({
  //   type: SupportType.BLOCKSCOUT,
  //   chainId: ChainId.LUKSOMainnet,
  //   name: 'LUKSO',
  //   logoUrl: '/assets/images/vendor/chains/lukso.svg',
  //   etherscanCompatibleApiUrl: 'https://api.explorer.execution.mainnet.lukso.network/api',
  //   deployedContracts: { ...MULTICALL },
  // }),
  // [ChainId.LUKSOTestnet]: new Chain({
  //   type: SupportType.BLOCKSCOUT,
  //   chainId: ChainId.LUKSOTestnet,
  //   name: 'LUKSO Testnet',
  //   logoUrl: '/assets/images/vendor/chains/lukso.svg',
  //   etherscanCompatibleApiUrl: 'https://api.explorer.execution.testnet.lukso.network/api',
  //   deployedContracts: { ...MULTICALL },
  //   isTestnet: true,
  //   correspondingMainnetChainId: ChainId.LUKSOMainnet,
  // }),
  [ChainId.Lisk]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Lisk,
    name: 'Lisk',
    rpc: {
      logs: 'https://1135.rpc.hypersync.xyz',
    },
    logoUrl: '/assets/images/vendor/chains/lisk.svg',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.MantaPacificMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.MantaPacificMainnet,
    name: 'Manta Pacific',
    logoUrl: '/assets/images/vendor/chains/manta-pacific.svg',
    infoUrl: 'https://pacific.manta.network/',
    etherscanCompatibleApiUrl: 'https://manta-pacific.calderaexplorer.xyz/api',
    rpc: {
      main: `https://lb.drpc.org/ogrpc?network=manta-pacific&dkey=${DRPC_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Mantle]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.Mantle,
    name: 'Mantle',
    nativeTokenCoingeckoId: 'mantle',
    logoUrl: '/assets/images/vendor/chains/mantle.svg',
    rpc: {
      main: `https://mantle-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
      aggregationType: AggregationType.ANY,
      strategies: [
        // Merchant Moe (Router) | WMNT -> USDT
        new UniswapV2PriceStrategy({
          address: '0xeaEE7EE68874218c3558b40063c42B82D3E7232a',
          path: ['0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8', '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE'],
          decimals: 6,
          liquidityParameters: { baseAmount: 10n },
        }),
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
  }),
  [ChainId.MantleSepoliaTestnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.MantleSepoliaTestnet,
    name: 'Mantle Sepolia',
    nativeTokenCoingeckoId: 'mantle',
    logoUrl: '/assets/images/vendor/chains/mantle.svg',
    etherscanCompatibleApiUrl: 'https://explorer.sepolia.mantle.xyz/api',
    rpc: {
      main: `https://mantle-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Mantle,
  }),
  [ChainId.MegaETHTestnet]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.MegaETHTestnet,
    name: 'MegaETH Testnet',
    logoUrl: '/assets/images/vendor/chains/megaeth.svg',
    explorerUrl: 'https://web3.okx.com/explorer/megaeth-testnet',
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: 12345678903,
  }),
  [ChainId.MerlinMainnet]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.MerlinMainnet,
    name: 'Merlin',
    nativeTokenCoingeckoId: 'bitcoin',
    logoUrl: '/assets/images/vendor/chains/merlin.svg',
    explorerUrl: 'https://scan.merlinchain.io',
    rpc: {
      main: 'https://rpc.merlinchain.io',
    },
  }),
  [ChainId.MetisAndromedaMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.MetisAndromedaMainnet,
    name: 'Metis',
    nativeTokenCoingeckoId: 'metis-token',
    logoUrl: '/assets/images/vendor/chains/metis.svg',
    etherscanCompatibleApiUrl: 'https://andromeda-explorer.metis.io/api',
    rpc: {
      main: `https://metis-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.MintMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.MintMainnet,
    name: 'Mint',
    logoUrl: '/assets/images/vendor/chains/mint.svg',
    etherscanCompatibleApiUrl: 'https://explorer.mintchain.io/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Mode]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Mode,
    name: 'Mode',
    logoUrl: '/assets/images/vendor/chains/mode.jpg',
    etherscanCompatibleApiUrl: 'https://explorer.mode.network/api',
    rpc: {
      main: `https://mode-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.MonadMainnet]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.MonadMainnet,
    name: 'Monad',
    logoUrl: '/assets/images/vendor/chains/monad.svg',
  }),
  [ChainId.MonadTestnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.MonadTestnet,
    name: 'Monad Testnet',
    logoUrl: '/assets/images/vendor/chains/monad.svg',
    rpc: {
      main: `https://monad-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.MonadMainnet,
  }),
  [ChainId.MoonbaseAlpha]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.MoonbaseAlpha,
    name: 'Moonbase Alpha',
    logoUrl: '/assets/images/vendor/chains/moonbeam.svg',
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Moonbeam,
  }),
  [ChainId.Moonbeam]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.Moonbeam,
    name: 'Moonbeam',
    nativeTokenCoingeckoId: 'moonbeam',
    logoUrl: '/assets/images/vendor/chains/moonbeam.svg',
    rpc: {
      main: `https://lb.drpc.org/ogrpc?network=moonbeam&dkey=${DRPC_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    // TODO: Add Algebra (StellaSwap) strategy to support Moonbeam
    priceStrategy: undefined,
  }),
  [ChainId.Moonriver]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.Moonriver,
    name: 'Moonriver',
    nativeTokenCoingeckoId: 'moonriver',
    logoUrl: '/assets/images/vendor/chains/moonriver.svg',
    infoUrl: 'https://moonbeam.network/networks/moonriver/',
    rpc: {
      main: `https://lb.drpc.org/ogrpc?network=moonriver&dkey=${DRPC_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    isCanary: true,
    correspondingMainnetChainId: ChainId.Moonbeam,
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.Morph]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Morph,
    name: 'Morph',
    logoUrl: '/assets/images/vendor/chains/morph.svg',
    etherscanCompatibleApiUrl: 'https://explorer-api.morphl2.io/api',
    rpc: {
      main: 'https://rpc.morphl2.io',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.MorphHolesky]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.MorphHolesky,
    name: 'Morph Holesky',
    logoUrl: '/assets/images/vendor/chains/morph.svg',
    etherscanCompatibleApiUrl: 'https://explorer-api-holesky.morphl2.io/api',
    rpc: {
      main: 'https://rpc-holesky.morphl2.io',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Morph,
  }),
  [ChainId.Nahmii3Mainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Nahmii3Mainnet,
    name: 'Nahmii',
    logoUrl: '/assets/images/vendor/chains/nahmii.svg',
    etherscanCompatibleApiUrl: 'https://backend.explorer.n3.nahmii.io/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.NeonEVMMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.NeonEVMMainnet,
    name: 'Neon',
    nativeTokenCoingeckoId: 'neon',
    logoUrl: '/assets/images/vendor/chains/neon.svg',
    etherscanCompatibleApiUrl: 'https://neon.blockscout.com/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
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
  //   priceStrategy: undefined, // <$100k Liquidity
  // }),
  [ChainId.OasisEmerald]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.OasisEmerald,
    name: 'Oasis Emerald',
    nativeTokenCoingeckoId: 'oasis-network',
    logoUrl: '/assets/images/vendor/chains/oasis.png',
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.OasisSapphire]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.OasisSapphire,
    name: 'Oasis Sapphire',
    nativeTokenCoingeckoId: 'oasis-network',
    logoUrl: '/assets/images/vendor/chains/oasis.png',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // <$100k Liquidity
  }),
  [ChainId.OasysMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.OasysMainnet,
    name: 'Oasys',
    nativeTokenCoingeckoId: 'oasys',
    logoUrl: '/assets/images/vendor/chains/oasys.svg',
    explorerUrl: 'https://scan.oasys.games',
    etherscanCompatibleApiUrl: 'https://scan.oasys.games/api',
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.OctaSpace]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.OctaSpace,
    name: 'OctaSpace',
    nativeTokenCoingeckoId: 'octaspace',
    logoUrl: '/assets/images/vendor/chains/octaspace.png',
    etherscanCompatibleApiUrl: 'https://explorer.octa.space/api',
    priceStrategy: undefined, // <$100k Liquidity
  }),
  [ChainId.OpBNBMainnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.OpBNBMainnet,
    name: 'opBNB',
    nativeTokenCoingeckoId: 'binancecoin',
    logoUrl: '/assets/images/vendor/chains/bnb-chain.svg',
    rpc: {
      main: `https://opbnb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.OPMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.OPMainnet,
    name: 'Optimism',
    logoUrl: '/assets/images/vendor/chains/optimism.svg',
    rpc: {
      main: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      logs: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    // TODO: Look at integrating Velodrome for OP
    priceStrategy: new AggregatePriceStrategy({
      aggregationType: AggregationType.ANY,
      strategies: [
        // Uniswap v3 (Factory) | (0.3%) WETH -> (0.05%) USDC
        new UniswapV3ReadonlyPriceStrategy({
          address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
          path: [
            toHex(3000, { size: 3 }),
            '0x4200000000000000000000000000000000000006',
            toHex(500, { size: 3 }),
            '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          ],
          decimals: 6,
        }),
        // Uniswap v3 (Factory) | (1%) WETH -> (0.05%) USDC
        new UniswapV3ReadonlyPriceStrategy({
          address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
          path: [
            toHex(10000, { size: 3 }),
            '0x4200000000000000000000000000000000000006',
            toHex(500, { size: 3 }),
            '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
          ],
          decimals: 6,
        }),
        new HardcodedPriceStrategy({
          // USDC.e and USDT don't have suitable pait on Uniswap v3
          tokens: ['0x7F5c764cBc14f9669B88837ca1490cCa17c31607', '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'],
        }),
        // new BackendPriceStrategy({}),
      ],
    }),
    // backendPriceStrategy: new ReservoirNftPriceStrategy({
    //   apiKey: RESERVOIR_API_KEY,
    //   apiUrl: 'https://api-optimism.reservoir.tools',
    // }),
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
  [ChainId.Palm]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.Palm,
    name: 'Palm',
    logoUrl: '/assets/images/vendor/chains/palm.png',
    explorerUrl: 'https://www.ondora.xyz/network/palm',
    rpc: {
      main: `https://palm-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      free: 'https://palm-mainnet.public.blastapi.io',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // <$100k Liquidity
  }),
  [ChainId.PlasmaMainnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.PlasmaMainnet,
    name: 'Plasma',
    logoUrl: '/assets/images/vendor/chains/plasma.svg',
    nativeTokenCoingeckoId: 'plasma',
    etherscanCompatibleApiUrl: 'https://api.routescan.io/v2/network/mainnet/evm/9745/etherscan/api',
    rpc: {
      main: `https://plasma-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
  }),
  [ChainId.PlumeMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.PlumeMainnet,
    name: 'Plume',
    nativeTokenCoingeckoId: 'plume',
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
    type: SupportType.PROVIDER,
    chainId: ChainId.PolygonMainnet,
    name: 'Polygon',
    nativeTokenCoingeckoId: 'matic-network',
    logoUrl: '/assets/images/vendor/chains/polygon.svg',
    rpc: {
      main: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      // main: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      // logs: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
        // new BackendPriceStrategy({}),
      ],
    }),
    // backendPriceStrategy: new ReservoirNftPriceStrategy({
    //   apiKey: RESERVOIR_API_KEY,
    //   apiUrl: 'https://api-polygon.reservoir.tools',
    // }),
  }),
  [ChainId.PolygonzkEVM]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.PolygonzkEVM,
    name: 'Polygon zkEVM',
    logoUrl: '/assets/images/vendor/chains/polygon.svg',
    explorerUrl: 'https://zkevm.polygonscan.com',
    rpc: {
      main: `https://polygonzkevm-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    // TODO: Add Algebra strategy (probably slightly amended from Uniswap v3) to support zkEVM
    priceStrategy: undefined,
    // backendPriceStrategy: new ReservoirNftPriceStrategy({
    //   apiKey: RESERVOIR_API_KEY,
    //   apiUrl: 'https://api-polygon-zkevm.reservoir.tools',
    // }),
  }),
  [ChainId.PolygonzkEVMCardonaTestnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.PolygonzkEVMCardonaTestnet,
    name: 'Polygon zkEVM Cardona',
    logoUrl: '/assets/images/vendor/chains/polygon.svg',
    explorerUrl: 'https://cardona-zkevm.polygonscan.com/',
    rpc: {
      main: `https://polygonzkevm-cardona.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.PolygonzkEVM,
  }),
  [ChainId.PulseChain]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.PulseChain,
    name: 'PulseChain',
    nativeTokenCoingeckoId: 'pulsechain',
    logoUrl: '/assets/images/vendor/chains/pulsechain.png',
    explorerUrl: 'https://scan.pulsechainfoundation.org/#',
    etherscanCompatibleApiUrl: 'https://api.scan.pulsechain.com/api',
    // Although multicall is deployed on Pulsechain, it is causing issues
    // deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.RARIChainMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.RARIChainMainnet,
    name: 'RARI Chain',
    logoUrl: '/assets/images/vendor/chains/rari.svg',
    infoUrl: 'https://rarichain.org/',
    explorerUrl: 'https://mainnet.explorer.rarichain.org',
    etherscanCompatibleApiUrl: 'https://mainnet.explorer.rarichain.org/api',
    rpc: {
      main: 'https://mainnet.rpc.rarichain.org/http',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Redstone]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Redstone,
    name: 'Redstone',
    logoUrl: '/assets/images/vendor/chains/redstone.svg',
    etherscanCompatibleApiUrl: 'https://explorer.redstone.xyz/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.RolluxMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.RolluxMainnet,
    name: 'Rollux',
    nativeTokenCoingeckoId: 'syscoin',
    logoUrl: '/assets/images/vendor/chains/rollux.svg',
    etherscanCompatibleApiUrl: 'https://explorer.rollux.com/api',
    rpc: {
      main: 'https://rpc.rollux.com',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.RoninMainnet]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.RoninMainnet,
    name: 'Ronin',
    nativeTokenCoingeckoId: 'ronin',
    logoUrl: '/assets/images/vendor/chains/ronin.svg',
    rpc: {
      main: `https://ronin-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
      aggregationType: AggregationType.ANY,
      strategies: [
        // Katana v2 (Router) | WRON -> USDC
        new UniswapV2PriceStrategy({
          address: '0x7d0556d55ca1a92708681e2e231733ebd922597d',
          path: ['0xe514d9deb7966c8be0ca922de8a064264ea6bcd4', '0x0b7007c13325c48911f73a2dad5fa5dcbf808adc'],
          decimals: 6,
          liquidityParameters: { baseAmount: 100n },
        }),
      ],
    }),
  }),
  [ChainId.RootstockMainnet]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.RootstockMainnet,
    name: 'Rootstock',
    nativeTokenCoingeckoId: 'rootstock',
    logoUrl: '/assets/images/vendor/chains/rootstock.jpg',
    explorerUrl: 'https://rootstock.blockscout.com',
    etherscanCompatibleApiUrl: 'https://rootstock.blockscout.com/api',
    rpc: {
      main: `https://rootstock-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      logs: 'https://30.rpc.hypersync.xyz',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // No DEXes that are compatible with other popular DEXes
  }),
  [ChainId.RSS3VSLMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.RSS3VSLMainnet,
    name: 'RSS3 VSL',
    nativeTokenCoingeckoId: 'rss3',
    logoUrl: '/assets/images/vendor/chains/rss3.svg',
    etherscanCompatibleApiUrl: 'https://scan.rss3.io/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // <$100k Liquidity
  }),
  [ChainId.Sanko]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Sanko,
    name: 'Sanko',
    nativeTokenCoingeckoId: 'dream-machine-token',
    logoUrl: '/assets/images/vendor/chains/sanko.webp',
    etherscanCompatibleApiUrl: 'https://explorer.sanko.xyz/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Scroll]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Scroll,
    name: 'Scroll',
    logoUrl: '/assets/images/vendor/chains/scroll.svg',
    explorerUrl: 'https://scrollscan.com',
    etherscanCompatibleApiUrl: 'https://api.scrollscan.com/api',
    rpc: {
      main: `https://scroll-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      logs: 'https://534352.rpc.hypersync.xyz',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
    // backendPriceStrategy: new ReservoirNftPriceStrategy({
    //   apiKey: RESERVOIR_API_KEY,
    //   apiUrl: 'https://api-scroll.reservoir.tools',
    // }),
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
    logoUrl: '/assets/images/vendor/chains/sei.svg',
    explorerUrl: 'https://seiscan.io',
    rpc: {
      main: `https://sei-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Shape]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Shape,
    name: 'Shape',
    logoUrl: '/assets/images/vendor/chains/shape.svg',
    rpc: {
      main: `https://shape-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Shibarium]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Shibarium,
    name: 'Shibarium',
    nativeTokenCoingeckoId: 'bone-shibaswap',
    logoUrl: '/assets/images/vendor/chains/shibarium.svg',
    etherscanCompatibleApiUrl: 'https://www.shibariumscan.io/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.ShidoNetwork]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ShidoNetwork,
    name: 'Shido',
    nativeTokenCoingeckoId: 'shido-2',
    logoUrl: '/assets/images/vendor/chains/shido.png',
    explorerUrl: 'https://shidoscan.net',
    etherscanCompatibleApiUrl: 'https://shidoscan.net/api',
    rpc: {
      main: 'https://evm.shidoscan.net',
    },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.ShimmerEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ShimmerEVM,
    name: 'Shimmer',
    nativeTokenCoingeckoId: 'shimmer',
    logoUrl: '/assets/images/vendor/chains/shimmer.svg',
    etherscanCompatibleApiUrl: 'https://explorer.evm.shimmer.network/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  5031: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: 5031,
    name: 'Somnia',
    nativeToken: 'SOMI',
    nativeTokenCoingeckoId: 'somnia',
    logoUrl: '/assets/images/vendor/chains/somnia.png',
    infoUrl: 'https://somnia.network',
    explorerUrl: 'https://mainnet.somnia.w3us.site',
    etherscanCompatibleApiUrl: 'https://mainnet.somnia.w3us.site/api',
    rpc: {
      main: 'https://somnia-json-rpc.stakely.io',
    },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Soneium]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Soneium,
    name: 'Soneium',
    logoUrl: '/assets/images/vendor/chains/soneium.png',
    explorerUrl: 'https://soneium.blockscout.com',
    etherscanCompatibleApiUrl: 'https://soneium.blockscout.com/api',
    rpc: {
      main: `https://soneium-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.soneium.org',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.SonicMainnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.SonicMainnet,
    name: 'Sonic',
    nativeTokenCoingeckoId: 'sonic-3',
    logoUrl: '/assets/images/vendor/chains/sonic.svg',
    explorerUrl: 'https://sonicscan.org',
    rpc: {
      main: `https://sonic-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId['SongbirdCanary-Network']]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId['SongbirdCanary-Network'],
    name: 'Songbird',
    nativeTokenCoingeckoId: 'songbird',
    logoUrl: '/assets/images/vendor/chains/songbird.svg',
    infoUrl: 'https://flare.network/songbird',
    etherscanCompatibleApiUrl: 'https://songbird-explorer.flare.network/api',
    deployedContracts: { ...MULTICALL },
    isCanary: true,
    correspondingMainnetChainId: ChainId.FlareMainnet,
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.Sophon]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Sophon,
    name: 'Sophon',
    nativeTokenCoingeckoId: 'sophon',
    logoUrl: '/assets/images/vendor/chains/sophon.jpg',
    explorerUrl: 'https://sophscan.xyz',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Story]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Story,
    name: 'Story',
    nativeTokenCoingeckoId: 'story-2',
    logoUrl: '/assets/images/vendor/chains/story.svg',
    etherscanCompatibleApiUrl: 'https://storyscan.xyz/api',
    rpc: {
      main: 'https://mainnet.storyrpc.io',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Superposition]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Superposition,
    name: 'Superposition',
    logoUrl: '/assets/images/vendor/chains/superposition.svg',
    etherscanCompatibleApiUrl: 'https://explorer-superposition-1v9rjalnat.t.conduit.xyz/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
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
    priceStrategy: undefined, // <$100k Liquidity
  }),
  [ChainId.TabiTestnetv2]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.TabiTestnetv2,
    name: 'Tabi Testnet',
    logoUrl: '/assets/images/vendor/chains/tabi.svg',
    infoUrl: 'https://www.tabichain.com',
    explorerUrl: 'https://testnetv2.tabiscan.com',
    etherscanCompatibleApiUrl: 'https://tabiv2-test.tabiscan.com/api',
    rpc: {
      main: 'https://rpc.testnetv2.tabichain.com',
    },
    nativeToken: 'TABI',
    isTestnet: true,
    correspondingMainnetChainId: 12345678905, // TODO: This is a placeholder so we can add a description for Tabi
  }),
  [ChainId.TaikoAlethia]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.TaikoAlethia,
    name: 'Taiko Alethia',
    logoUrl: '/assets/images/vendor/chains/taiko.svg',
    explorerUrl: 'https://taikoscan.io',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.TaikoHekla]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.TaikoHekla,
    name: 'Taiko Hekla',
    logoUrl: '/assets/images/vendor/chains/taiko.svg',
    explorerUrl: 'https://hekla.taikoscan.io',
    rpc: {
      main: `https://lb.drpc.org/ogrpc?network=taiko-hekla&dkey=${DRPC_API_KEY}`,
      free: 'https://taiko-hekla.drpc.org',
    },
    deployedContracts: { ...MULTICALL },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.TaikoAlethia,
  }),
  [ChainId.TelosEVMMainnet]: new Chain({
    type: SupportType.BACKEND_CUSTOM, // TeloscanEventGetter
    chainId: ChainId.TelosEVMMainnet,
    name: 'Telos EVM',
    nativeTokenCoingeckoId: 'telos',
    logoUrl: '/assets/images/vendor/chains/telos.svg',
    rpc: {
      main: 'https://rpc.telos.net',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Unichain]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Unichain,
    name: 'Unichain',
    logoUrl: '/assets/images/vendor/chains/unichain.svg',
    explorerUrl: 'https://uniscan.xyz',
    rpc: {
      main: `https://unichain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.unichain.org',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Vana]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Vana,
    name: 'Vana',
    nativeTokenCoingeckoId: 'vana',
    logoUrl: '/assets/images/vendor/chains/vana.png',
    etherscanCompatibleApiUrl: 'https://vanascan.io/api',
    priceStrategy: undefined, // TODO
  }),
  [ChainId.VelasEVMMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.VelasEVMMainnet,
    name: 'Velas',
    nativeTokenCoingeckoId: 'velas',
    logoUrl: '/assets/images/vendor/chains/velas.svg',
    etherscanCompatibleApiUrl: 'https://evmexplorer.velas.com/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.Viction]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.Viction,
    name: 'Viction',
    nativeTokenCoingeckoId: 'tomochain',
    logoUrl: '/assets/images/vendor/chains/viction.svg',
    explorerUrl: 'https://www.vicscan.xyz',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId['WEMIX3.0Mainnet']]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId['WEMIX3.0Mainnet'],
    name: 'WEMIX',
    nativeTokenCoingeckoId: 'wemix-token',
    logoUrl: '/assets/images/vendor/chains/wemix.svg',
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.WorldChain]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.WorldChain,
    name: 'World Chain',
    logoUrl: '/assets/images/vendor/chains/worldchain.svg',
    explorerUrl: 'https://worldchain-mainnet.explorer.alchemy.com',
    rpc: {
      main: `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.XDCNetwork]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.XDCNetwork,
    name: 'XDC',
    nativeTokenCoingeckoId: 'xdce-crowd-sale',
    logoUrl: '/assets/images/vendor/chains/xdc.svg',
    rpc: {
      main: 'https://rpc.ankr.com/xdc',
      free: 'https://rpc.ankr.com/xdc',
    },
  }),
  [ChainId.XLayerMainnet]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.XLayerMainnet,
    name: 'X Layer',
    nativeTokenCoingeckoId: 'okb',
    logoUrl: '/assets/images/vendor/chains/xlayer.svg',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
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
    logoUrl: '/assets/images/vendor/chains/zero.svg',
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
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
      main: `https://lb.drpc.org/ogrpc?network=zeta-chain-testnet&dkey=${DRPC_API_KEY}`,
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
    logoUrl: '/assets/images/vendor/chains/zetachain.svg',
    explorerUrl: 'https://zetachain.blockscout.com',
    etherscanCompatibleApiUrl: 'https://zetachain.blockscout.com/api',
    rpc: {
      main: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.ZKFairMainnet]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ZKFairMainnet,
    name: 'ZKFair',
    nativeTokenCoingeckoId: 'zkfair',
    logoUrl: '/assets/images/vendor/chains/zkfair.svg',
    etherscanCompatibleApiUrl: 'https://scan.zkfair.io/api',
    deployedContracts: { ...MULTICALL },
    priceStrategy: new AggregatePriceStrategy({
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
  }),
  [ChainId.ZkLinkNovaMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ZkLinkNovaMainnet,
    name: 'zkLink Nova',
    nativeTokenCoingeckoId: 'zklink',
    logoUrl: '/assets/images/vendor/chains/zklink.png',
    priceStrategy: undefined, // TODO
  }),
  [ChainId.ZkSyncMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ZkSyncMainnet,
    name: 'zkSync Era',
    logoUrl: '/assets/images/vendor/chains/zksync.jpeg',
    explorerUrl: 'https://era.zksync.network',
    etherscanCompatibleApiUrl: 'https://api-era.zksync.network/api',
    rpc: {
      main: `https://zksync-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: {
      multicall3: { address: '0xF9cda624FBC7e059355ce98a31693d299FACd963' },
    },
    // TODO: Add SyncSwap strategy to support ZkSync
    priceStrategy: undefined,
    // backendPriceStrategy: new ReservoirNftPriceStrategy({
    //   apiKey: RESERVOIR_API_KEY,
    //   apiUrl: 'https://api-zksync.reservoir.tools',
    // }),
  }),
  [ChainId.ZkSyncSepoliaTestnet]: new Chain({
    type: SupportType.ETHERSCAN_COMPATIBLE,
    chainId: ChainId.ZkSyncSepoliaTestnet,
    name: 'zkSync Sepolia',
    logoUrl: '/assets/images/vendor/chains/zksync.jpeg',
    explorerUrl: 'https://sepolia-era.zksync.network',
    rpc: {
      main: `https://zksync-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    deployedContracts: {
      multicall3: { address: '0xF9cda624FBC7e059355ce98a31693d299FACd963' },
    },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.ZkSyncMainnet,
  }),
  [ChainId.ZircuitMainnet]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ZircuitMainnet,
    name: 'Zircuit',
    logoUrl: '/assets/images/vendor/chains/zircuit.svg',
    rpc: {
      main: `https://lb.drpc.org/ogrpc?network=zircuit-mainnet&dkey=${DRPC_API_KEY}`,
    },
    deployedContracts: { ...MULTICALL },
    priceStrategy: undefined, // TODO
  }),
  [ChainId.Zora]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Zora,
    name: 'Zora',
    logoUrl: '/assets/images/vendor/chains/zora.svg',
    etherscanCompatibleApiUrl: 'https://explorer.zora.energy/api',
    deployedContracts: { ...MULTICALL },
    rpc: {
      main: `https://zora-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    priceStrategy: undefined, // <$100k Liquidity
    // backendPriceStrategy: new ReservoirNftPriceStrategy({
    //   apiKey: RESERVOIR_API_KEY,
    //   apiUrl: 'https://api-zora.reservoir.tools',
    // }),
  }),
  // TODO: These are placeholders so we can add descriptions
  12345678902: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: 12345678902,
    name: 'Creator Chain',
  }),
  12345678903: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: 12345678903,
    name: 'MegaETH',
  }),
  12345678905: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: 12345678905,
    name: 'Tabi',
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

export const getChainPriceStrategy = (chainId: DocumentedChainId): PriceStrategy | undefined => {
  return getChainConfig(chainId).getPriceStrategy();
};

export const getChainBackendPriceStrategy = (chainId: DocumentedChainId): PriceStrategy | undefined => {
  return getChainConfig(chainId).getBackendPriceStrategy();
};
