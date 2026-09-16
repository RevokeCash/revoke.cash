import { Chain, type DeployedContracts, type NativeCurrency, SupportType } from '@revoke.cash/core/chains/Chain';
import { ChainId } from '@revoke.cash/core/chains/ids';
import { ALCHEMY_API_KEY, DRPC_API_KEY, MULTICALL_ADDRESS } from '@revoke.cash/core/constants';
import type { EtherscanPlatform, RateLimit } from '@revoke.cash/core/types';
import type { AddEthereumChainParameter, PublicClient, Chain as ViemChain } from 'viem';

// Make sure to update these lists when updating the above lists
// Order is loosely based on TVL (as per DeFiLlama)

export const CHAIN_SELECT_MAINNETS = [
  ChainId.Ethereum,
  ChainId.BNBChain,
  ChainId.Base,
  ChainId.Arbitrum,
  ChainId.Optimism,
  ChainId.Avalanche,
  ChainId.Polygon,
  ChainId.Monad,
  ChainId.Ink,
  ChainId.Plasma,
  ChainId.RobinhoodChain,
  ChainId.Mantle,
  ChainId.Flare,
  ChainId.Rootstock,
  ChainId.GnosisChain,
  ChainId.Berachain,
  ChainId.Stable,
  ChainId.Katana,
  ChainId.Sei,
  ChainId.Linea,
  ChainId.MegaETH,
  ChainId.Hemi,
  ChainId.Unichain,
  ChainId.Plume,
  ChainId.Sonic,
  ChainId.WorldChain,
  ChainId.Tempo,
  ChainId.Arc,
  ChainId.PulseChain,
  ChainId.Blast,
  ChainId.ZkSyncEra,
  ChainId.FilecoinEVM,
  ChainId.Fraxtal,
  ChainId.Taiko,
  ChainId.BOB,
  ChainId.Morph,
  ChainId.ImmutableZkEVM,
  ChainId.Rollux,
  ChainId.Scroll,
  ChainId.Reya,
  ChainId.RISE,
  ChainId.Abstract,
  ChainId.FlowEVM,
  ChainId.Soneium,
  ChainId.Celo,
  ChainId.Etherlink,
  ChainId.Injective,
  ChainId.DataNetwork,
  ChainId.XDC,
  ChainId.TAC,
  ChainId.ApeChain,
  ChainId.Ronin,
  ChainId.OpBNB,
  ChainId.Citrea,
  ChainId.CORE,
  ChainId.Mode,
  ChainId.Aurora,
  ChainId.ArbitrumNova,
  ChainId.Metis,
  ChainId.MantaPacific,
  ChainId.IOTAEVM,
  ChainId.Astar,
  ChainId.Lens,
  ChainId.HyperEVM,
  ChainId.Somnia,
  ChainId.TelosEVM,
  ChainId.ZetaChain,
  ChainId.Boba,
  ChainId.Shido,
  ChainId.Doma,
  ChainId.Chiliz,
  ChainId.Songbird,
  ChainId.Beam,
  ChainId.IgraNetwork,
  ChainId.Viction,
  ChainId.Oasys,
  ChainId.Vana,
  ChainId.KCC,
  ChainId.Fuse,
  ChainId.EthereumClassic,
  ChainId.Lightlink,
  ChainId.Shape,
  ChainId.Gensyn,
  ChainId.Matchain,
  ChainId.KasplexZkEVM,
  ChainId.Mythos,
  ChainId.Animechain,
] as const;

export const CHAIN_SELECT_TESTNETS = [
  ChainId.EthereumSepolia,
  ChainId.BNBChainTestnet,
  ChainId.BaseSepolia,
  ChainId.ArbitrumSepolia,
  ChainId.OptimismSepolia,
  ChainId.PolygonAmoy,
] as const;

export const ORDERED_CHAINS = [...CHAIN_SELECT_MAINNETS, ...CHAIN_SELECT_TESTNETS] as const;

// Shared by every network that uses Ether as its native currency
const ETH: NativeCurrency = { name: 'Ether', symbol: 'ETH', decimals: 18 };

export const CHAINS = {
  [ChainId.Abstract]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Abstract,
    name: 'Abstract',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'abstract',
    logoUrl: '/assets/images/vendor/chains/abstract.jpg',
    infoUrl: 'https://abs.xyz',
    explorerUrl: 'https://abscan.org',
    rpc: {
      main: `https://abstract-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://api.mainnet.abs.xyz',
    },
    deployedContracts: { multicall3: { address: '0xAa4De41dba0Ca5dCBb288b7cC6b708F3aaC759E7', blockCreated: 5288 } },
  }),
  [ChainId.Animechain]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Animechain,
    name: 'Animechain',
    nativeCurrency: { name: 'Animecoin', symbol: 'ANIME', decimals: 18 },
    nativeTokenCoingeckoId: 'anime',
    logoUrl: '/assets/images/vendor/chains/animechain.webp',
    explorerUrl: 'https://explorer.anime.xyz',
    infoUrl: 'https://www.anime.xyz',
    rpc: {
      main: `https://anime-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc-animechain-39xf6m45e3.t.conduit.xyz',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 23482 } },
  }),
  [ChainId.ApeChain]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.ApeChain,
    name: 'ApeChain',
    nativeCurrency: { name: 'ApeCoin', symbol: 'APE', decimals: 18 },
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
  [ChainId.Arbitrum]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Arbitrum,
    name: 'Arbitrum',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'arbitrum',
    logoUrl: '/assets/images/vendor/chains/arbitrum.svg',
    infoUrl: 'https://arbitrum.io',
    explorerUrl: 'https://arbiscan.io',
    rpc: {
      main: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://arb1.arbitrum.io/rpc',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 7654707 } },
  }),
  [ChainId.ArbitrumNova]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ArbitrumNova,
    name: 'Arbitrum Nova',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'arbitrum_nova',
    logoUrl: '/assets/images/vendor/chains/arbitrum-nova.svg',
    infoUrl: 'https://arbitrum.io',
    explorerUrl: 'https://arbitrum-nova.blockscout.com',
    rpc: {
      main: `https://lb.drpc.live/arbitrum-nova/${DRPC_API_KEY}`,
      free: 'https://nova.arbitrum.io/rpc',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1746963 } },
  }),
  [ChainId.ArbitrumSepolia]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.ArbitrumSepolia,
    name: 'Arbitrum Sepolia',
    nativeCurrency: ETH,
    logoUrl: '/assets/images/vendor/chains/arbitrum.svg',
    infoUrl: 'https://arbitrum.io',
    explorerUrl: 'https://sepolia.arbiscan.io',
    rpc: {
      main: `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://sepolia-rollup.arbitrum.io/rpc',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 81930 } },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Arbitrum,
  }),
  [ChainId.Arc]: new Chain({
    // explorer.arc.io's own API sits behind a Cloudflare challenge, so logs come from the hosted api.blockscout.com gateway
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Arc,
    name: 'Arc',
    // Native USDC has 18 decimals; the ERC-20 interface at 0x3600000000000000000000000000000000000000 has 6
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    nativeTokenCoingeckoId: 'usd-coin',
    coingeckoNetworkId: 'arc',
    logoUrl: '/assets/images/vendor/chains/arc.svg',
    infoUrl: 'https://www.arc.io',
    explorerUrl: 'https://explorer.arc.io',
    rpc: {
      main: `https://arc-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.mainnet.arc.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.Astar]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Astar,
    name: 'Astar',
    nativeCurrency: { name: 'Astar', symbol: 'ASTR', decimals: 18 },
    nativeTokenCoingeckoId: 'astar',
    coingeckoNetworkId: 'astr',
    logoUrl: '/assets/images/vendor/chains/astar.svg',
    infoUrl: 'https://astar.network/',
    explorerUrl: 'https://blockscout.com/astar',
    rpc: {
      main: `https://astar-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://evm.astar.network',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 761794 } },
  }),
  [ChainId.Aurora]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Aurora,
    name: 'Aurora',
    nativeCurrency: ETH,
    nativeTokenCoingeckoId: 'aurora-near',
    coingeckoNetworkId: 'aurora',
    logoUrl: '/assets/images/vendor/chains/aurora.svg',
    infoUrl: 'https://aurora.dev',
    rpc: {
      main: 'https://mainnet.aurora.dev',
    },
    explorerUrl: 'https://explorer.aurora.dev',
    etherscanCompatibleApiUrl: 'https://explorer.mainnet.aurora.dev/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 62907816 } },
  }),
  [ChainId.Avalanche]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Avalanche,
    name: 'Avalanche',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    nativeTokenCoingeckoId: 'avalanche-2',
    coingeckoNetworkId: 'avax',
    logoUrl: '/assets/images/vendor/chains/avalanche.svg',
    infoUrl: 'https://www.avax.network/',
    explorerUrl: 'https://snowscan.xyz',
    rpc: {
      main: `https://avax-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://api.avax.network/ext/bc/C/rpc',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 11907934 } },
  }),
  [ChainId.Base]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Base,
    name: 'Base',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'base',
    logoUrl: '/assets/images/vendor/chains/base.svg',
    explorerUrl: 'https://basescan.org',
    infoUrl: 'https://base.org',
    rpc: {
      main: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.base.org/',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 5022 } },
    isOpStack: true,
  }),
  [ChainId.BaseSepolia]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.BaseSepolia,
    name: 'Base Sepolia',
    nativeCurrency: ETH,
    logoUrl: '/assets/images/vendor/chains/base.svg',
    explorerUrl: 'https://sepolia.basescan.org',
    infoUrl: 'https://base.org',
    rpc: {
      main: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://sepolia.base.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1059647 } },
    isTestnet: true,
    isOpStack: true,
    correspondingMainnetChainId: ChainId.Base,
  }),
  [ChainId.Beam]: new Chain({
    type: SupportType.ROUTESCAN,
    chainId: ChainId.Beam,
    name: 'Beam',
    nativeCurrency: { name: 'Beam', symbol: 'BEAM', decimals: 18 },
    nativeTokenCoingeckoId: 'beam',
    coingeckoNetworkId: 'beam',
    logoUrl: '/assets/images/vendor/chains/beam.svg',
    infoUrl: 'https://www.onbeam.com',
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
    nativeCurrency: { name: 'BERA Token', symbol: 'BERA', decimals: 18 },
    nativeTokenCoingeckoId: 'berachain-bera',
    coingeckoNetworkId: 'berachain',
    logoUrl: '/assets/images/vendor/chains/berachain.svg',
    infoUrl: 'https://www.berachain.com',
    explorerUrl: 'https://berascan.com',
    rpc: {
      main: `https://berachain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.berachain.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.Blast]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Blast,
    name: 'Blast',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'blast',
    logoUrl: '/assets/images/vendor/chains/blast.jpg',
    infoUrl: 'https://blast.io/',
    explorerUrl: 'https://blastscan.io',
    rpc: {
      main: `https://blast-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.blast.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 212929 } },
    isOpStack: true,
  }),
  [ChainId.BNBChain]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.BNBChain,
    name: 'BNB Chain',
    nativeCurrency: { name: 'BNB Chain Native Token', symbol: 'BNB', decimals: 18 },
    nativeTokenCoingeckoId: 'binancecoin',
    coingeckoNetworkId: 'bsc',
    logoUrl: '/assets/images/vendor/chains/bnb-chain.svg',
    explorerUrl: 'https://bscscan.com',
    infoUrl: 'https://www.bnbchain.org/en',
    rpc: {
      main: `https://bnb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://bsc-dataseed1.bnbchain.org',
    },
    deployedContracts: {
      multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11', blockCreated: 15921452 },
    },
  }),
  [ChainId.BNBChainTestnet]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.BNBChainTestnet,
    name: 'BNB Chain Testnet',
    nativeCurrency: { name: 'BNB Chain Native Token', symbol: 'tBNB', decimals: 18 },
    nativeTokenCoingeckoId: 'binancecoin',
    logoUrl: '/assets/images/vendor/chains/bnb-chain.svg',
    explorerUrl: 'https://testnet.bscscan.com',
    infoUrl: 'https://www.bnbchain.org/en',
    rpc: {
      main: `https://bnb-testnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://bsc-testnet-rpc.publicnode.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 17422483 } },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.BNBChain,
  }),
  [ChainId.BOB]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.BOB,
    name: 'BOB',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'bob-network',
    logoUrl: '/assets/images/vendor/chains/bob.svg',
    explorerUrl: 'https://explorer.gobob.xyz',
    infoUrl: 'https://gobob.xyz',
    rpc: {
      main: 'https://rpc.gobob.xyz',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 23131 } },
    isOpStack: true,
  }),
  [ChainId.Boba]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Boba,
    name: 'Boba',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'boba',
    logoUrl: '/assets/images/vendor/chains/boba.jpg',
    explorerUrl: 'https://bobascan.com',
    infoUrl: 'https://boba.network',
    rpc: {
      main: `https://boba-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.boba.network',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 446859 } },
    isOpStack: true,
  }),
  [ChainId.Celo]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Celo,
    name: 'Celo',
    nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
    nativeTokenCoingeckoId: 'celo',
    coingeckoNetworkId: 'celo',
    logoUrl: '/assets/images/vendor/chains/celo.svg',
    explorerUrl: 'https://celoscan.io',
    infoUrl: 'https://celo.org/',
    rpc: {
      main: `https://celo-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://forno.celo.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 13112599 } },
  }),
  [ChainId.Chiliz]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Chiliz,
    name: 'Chiliz',
    nativeCurrency: { name: 'Chiliz', symbol: 'CHZ', decimals: 18 },
    nativeTokenCoingeckoId: 'chiliz',
    coingeckoNetworkId: 'chiliz-chain',
    logoUrl: '/assets/images/vendor/chains/chiliz.png',
    explorerUrl: 'https://chiliscan.com',
    infoUrl: 'https://chiliz.com',
    rpc: {
      main: 'https://rpc.chiliz.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 8080847 } },
  }),
  [ChainId.Citrea]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Citrea,
    name: 'Citrea',
    nativeCurrency: { name: 'Citrea BTC', symbol: 'cBTC', decimals: 18 },
    nativeTokenCoingeckoId: 'bitcoin',
    coingeckoNetworkId: 'citrea',
    infoUrl: 'https://citrea.xyz',
    logoUrl: '/assets/images/vendor/chains/citrea.svg',
    explorerUrl: 'https://explorer.mainnet.citrea.xyz',
    etherscanCompatibleApiUrl: 'https://explorer.mainnet.citrea.xyz/api',
    rpc: {
      main: `https://citrea-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.mainnet.citrea.xyz',
    },
    deployedContracts: {
      multicall3: { address: '0xA738e84fdE890Bc60b99AF7ccE43990E534304de' },
    },
  }),
  [ChainId.CORE]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.CORE,
    name: 'CORE',
    nativeCurrency: { name: 'Core Blockchain Native Token', symbol: 'CORE', decimals: 18 },
    nativeTokenCoingeckoId: 'coredaoorg',
    coingeckoNetworkId: 'core',
    logoUrl: '/assets/images/vendor/chains/core.png',
    explorerUrl: 'https://scan.coredao.org',
    infoUrl: 'https://www.coredao.org',
    rpc: {
      main: `https://lb.drpc.live/core/${DRPC_API_KEY}`,
      free: 'https://rpc.coredao.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 11907934 } },
  }),
  [ChainId.Cronos]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.Cronos,
    name: 'Cronos',
    nativeCurrency: { name: 'Cronos', symbol: 'CRO', decimals: 18 },
    nativeTokenCoingeckoId: 'crypto-com-chain',
    coingeckoNetworkId: 'cro',
    logoUrl: '/assets/images/vendor/chains/cronos.svg',
    explorerUrl: 'https://explorer.cronos.com',
    infoUrl: 'https://cronos.com/',
    rpc: {
      main: 'https://evm.cronos.org',
    },
  }),
  [ChainId.DataNetwork]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.DataNetwork,
    name: 'Data Network',
    nativeCurrency: { name: 'DATA', symbol: 'DATA', decimals: 18 },
    nativeTokenCoingeckoId: 'story-2',
    coingeckoNetworkId: 'story',
    logoUrl: '/assets/images/vendor/chains/data.svg',
    explorerUrl: 'https://datanetscan.io',
    infoUrl: 'https://datafdn.org/',
    rpc: {
      main: `https://story-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.datarpc.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 340998 } },
  }),
  [ChainId.Doma]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Doma,
    name: 'Doma',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'doma',
    logoUrl: '/assets/images/vendor/chains/doma.jpg',
    explorerUrl: 'https://explorer.doma.xyz',
    infoUrl: 'https://doma.xyz',
    etherscanCompatibleApiUrl: 'https://explorer.doma.xyz/api',
    rpc: {
      main: `https://lb.drpc.live/doma/${DRPC_API_KEY}`,
      free: 'https://rpc.doma.xyz',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
    isOpStack: true,
  }),
  [ChainId.Ethereum]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Ethereum,
    name: 'Ethereum',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'eth',
    logoUrl: '/assets/images/vendor/chains/ethereum.svg',
    explorerUrl: 'https://etherscan.io',
    infoUrl: 'https://ethereum.org',
    rpc: {
      main: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://eth.drpc.org',
    },
    deployedContracts: {
      multicall3: { address: MULTICALL_ADDRESS, blockCreated: 14353601 },
      ensUniversalResolver: { address: '0xeeeeeeee14d718c2b47d9923deab1335e144eeee' },
    },
  }),
  [ChainId.EthereumClassic]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.EthereumClassic,
    name: 'Ethereum Classic',
    nativeCurrency: { name: 'Ether', symbol: 'ETC', decimals: 18 },
    nativeTokenCoingeckoId: 'ethereum-classic',
    coingeckoNetworkId: 'ethereum_classic',
    logoUrl: '/assets/images/vendor/chains/etc.png',
    explorerUrl: 'https://etc.blockscout.com',
    infoUrl: 'https://ethereumclassic.org',
    rpc: {
      main: `https://lb.drpc.live/ethereum-classic/${DRPC_API_KEY}`,
      free: 'https://0xrpc.io/etc',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 18288646 } },
  }),
  [ChainId.EthereumSepolia]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.EthereumSepolia,
    name: 'Ethereum Sepolia',
    nativeCurrency: ETH,
    logoUrl: '/assets/images/vendor/chains/ethereum.svg',
    explorerUrl: 'https://sepolia.etherscan.io',
    infoUrl: 'https://ethereum.org',
    rpc: {
      main: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://ethereum-sepolia-rpc.publicnode.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 751532 } },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Ethereum,
  }),
  [ChainId.Etherlink]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Etherlink,
    name: 'Etherlink',
    nativeCurrency: { name: 'tez', symbol: 'XTZ', decimals: 18 },
    nativeTokenCoingeckoId: 'tezos',
    coingeckoNetworkId: 'etherlink',
    logoUrl: '/assets/images/vendor/chains/etherlink.svg',
    explorerUrl: 'https://explorer.etherlink.com',
    infoUrl: 'https://etherlink.com',
    rpc: {
      main: 'https://node.mainnet.etherlink.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 33899 } },
  }),
  [ChainId.Fantom]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.Fantom,
    name: 'Fantom',
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
    nativeTokenCoingeckoId: 'fantom',
    coingeckoNetworkId: 'ftm',
    logoUrl: '/assets/images/vendor/chains/fantom.svg',
    explorerUrl: 'https://ftmscan.com',
    infoUrl: 'https://fantom.foundation',
    rpc: {
      main: 'https://rpc.ftm.tools',
    },
  }),
  [ChainId.FilecoinEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.FilecoinEVM,
    name: 'Filecoin EVM',
    nativeCurrency: { name: 'filecoin', symbol: 'FIL', decimals: 18 },
    nativeTokenCoingeckoId: 'filecoin',
    coingeckoNetworkId: 'filecoin',
    logoUrl: '/assets/images/vendor/chains/filecoin.svg',
    explorerUrl: 'https://filecoin.blockscout.com',
    infoUrl: 'https://filecoin.io',
    rpc: {
      main: `https://lb.drpc.live/filecoin/${DRPC_API_KEY}`,
      free: `https://filecoin.drpc.org`,
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 3328594 } },
  }),
  [ChainId.Flare]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Flare,
    name: 'Flare',
    nativeCurrency: { name: 'Flare', symbol: 'FLR', decimals: 18 },
    nativeTokenCoingeckoId: 'flare-networks',
    coingeckoNetworkId: 'flare',
    logoUrl: '/assets/images/vendor/chains/flare.svg',
    explorerUrl: 'https://flare-explorer.flare.network',
    infoUrl: 'https://flare.network',
    etherscanCompatibleApiUrl: 'https://flare-explorer.flare.network/api',
    rpc: {
      main: `https://lb.drpc.live/flare/${DRPC_API_KEY}`,
      free: 'https://flare-api.flare.network/ext/C/rpc',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 3002461 } },
  }),
  [ChainId.FlowEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.FlowEVM,
    name: 'Flow EVM',
    nativeCurrency: { name: 'FLOW', symbol: 'FLOW', decimals: 18 },
    nativeTokenCoingeckoId: 'flow',
    coingeckoNetworkId: 'flow-evm',
    logoUrl: '/assets/images/vendor/chains/flow.png',
    explorerUrl: 'https://evm.flowscan.io',
    infoUrl: 'https://developers.flow.com/evm/about',
    rpc: {
      main: `https://flow-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.evm.nodes.onflow.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 6205 } },
  }),
  [ChainId.Fraxtal]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Fraxtal,
    name: 'Fraxtal',
    nativeCurrency: { name: 'Frax', symbol: 'FRAX', decimals: 18 },
    nativeTokenCoingeckoId: 'frax-share',
    coingeckoNetworkId: 'fraxtal',
    logoUrl: '/assets/images/vendor/chains/fraxtal.svg',
    explorerUrl: 'https://fraxscan.com',
    infoUrl: 'https://frax.com',
    rpc: {
      main: `https://frax-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.frax.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
    isOpStack: true,
  }),
  [ChainId.Fuse]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Fuse,
    name: 'Fuse',
    nativeCurrency: { name: 'Fuse', symbol: 'FUSE', decimals: 18 },
    nativeTokenCoingeckoId: 'fuse-network-token',
    coingeckoNetworkId: 'fuse',
    logoUrl: '/assets/images/vendor/chains/fuse.png',
    infoUrl: 'https://fuse.io/',
    explorerUrl: 'https://explorer.fuse.io',
    rpc: {
      main: `https://lb.drpc.live/fuse/${DRPC_API_KEY}`,
      free: 'https://rpc.fuse.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 16146628 } },
  }),
  [ChainId.Gensyn]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Gensyn,
    name: 'Gensyn',
    nativeCurrency: ETH,
    nativeTokenCoingeckoId: 'gensyn',
    coingeckoNetworkId: 'gensyn',
    logoUrl: '/assets/images/vendor/chains/gensyn.svg',
    explorerUrl: 'https://gensyn-mainnet.explorer.alchemy.com',
    infoUrl: 'https://gensyn.network/',
    rpc: {
      main: `https://gensyn-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://gensyn-mainnet.g.alchemy.com/public',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.GnosisChain]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.GnosisChain,
    name: 'Gnosis Chain',
    nativeCurrency: { name: 'xDAI', symbol: 'XDAI', decimals: 18 },
    nativeTokenCoingeckoId: 'xdai',
    coingeckoNetworkId: 'xdai',
    logoUrl: '/assets/images/vendor/chains/gnosis.svg',
    infoUrl: 'https://docs.gnosischain.com',
    explorerUrl: 'https://gnosisscan.io',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 21022491 } },
    rpc: {
      main: `https://gnosis-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.gnosischain.com',
    },
  }),
  [ChainId.GravityAlpha]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.GravityAlpha,
    name: 'Gravity Alpha',
    nativeCurrency: { name: 'Gravity', symbol: 'G', decimals: 18 },
    nativeTokenCoingeckoId: 'g-token',
    coingeckoNetworkId: 'gravity-alpha',
    logoUrl: '/assets/images/vendor/chains/gravity.svg',
    explorerUrl: 'https://explorer.gravity.xyz',
    infoUrl: 'https://gravity.xyz',
    rpc: {
      main: 'https://rpc.gravity.xyz',
    },
  }),
  [ChainId.Harmony]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.Harmony,
    name: 'Harmony',
    nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
    nativeTokenCoingeckoId: 'harmony',
    logoUrl: '/assets/images/vendor/chains/harmony.svg',
    explorerUrl: 'https://explorer.harmony.one',
    infoUrl: 'https://www.harmony.one/',
    rpc: {
      main: 'https://api.harmony.one',
    },
  }),
  [ChainId.HECO]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.HECO,
    name: 'HECO',
    nativeCurrency: { name: 'Huobi ECO Chain Native Token', symbol: 'HT', decimals: 18 },
    logoUrl: '/assets/images/vendor/chains/heco.svg',
    explorerUrl: 'https://hecoinfo.com',
    infoUrl: 'https://www.hecochain.com',
    rpc: {
      main: 'https://http-mainnet.hecochain.com',
    },
  }),
  [ChainId.Hemi]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Hemi,
    name: 'Hemi',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'hemi',
    logoUrl: '/assets/images/vendor/chains/hemi.svg',
    explorerUrl: 'https://explorer.hemi.xyz',
    infoUrl: 'https://hemi.xyz',
    etherscanCompatibleApiUrl: 'https://explorer.hemi.xyz/api',
    rpc: {
      main: `https://lb.drpc.live/hemi/${DRPC_API_KEY}`,
      free: 'https://rpc.hemi.network/rpc',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.HyperEVM]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.HyperEVM,
    name: 'HyperEVM',
    nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
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
  [ChainId.IgraNetwork]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.IgraNetwork,
    name: 'Igra Network',
    nativeCurrency: { name: 'iKAS', symbol: 'iKAS', decimals: 18 },
    nativeTokenCoingeckoId: 'kaspa',
    coingeckoNetworkId: 'igra',
    logoUrl: '/assets/images/vendor/chains/igra.svg',
    explorerUrl: 'https://explorer.igralabs.com',
    infoUrl: 'https://igralabs.com',
    rpc: {
      main: 'https://rpc.igralabs.com:8545',
    },
    etherscanCompatibleApiUrl: 'https://explorer.igralabs.com/api',
    deployedContracts: {
      multicall3: { address: '0x9397290CaEe43Fd443d7f110247822Cb50878319' },
    },
  }),
  [ChainId.ImmutableZkEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ImmutableZkEVM,
    name: 'Immutable zkEVM',
    nativeCurrency: { name: 'IMX', symbol: 'IMX', decimals: 18 },
    nativeTokenCoingeckoId: 'immutable-x',
    coingeckoNetworkId: 'immutable-zkevm',
    logoUrl: '/assets/images/vendor/chains/immutable.svg',
    explorerUrl: 'https://explorer.immutable.com',
    infoUrl: 'https://www.immutable.com',
    rpc: {
      main: `https://lb.drpc.live/immutable-zkevm/${DRPC_API_KEY}`,
      free: 'https://rpc.immutable.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 4335972 } },
  }),
  [ChainId.Injective]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Injective,
    name: 'Injective',
    nativeCurrency: { name: 'Injective', symbol: 'INJ', decimals: 18 },
    nativeTokenCoingeckoId: 'injective-protocol',
    coingeckoNetworkId: 'injective',
    logoUrl: '/assets/images/vendor/chains/injective.svg',
    infoUrl: 'https://injective.com',
    explorerUrl: 'https://blockscout.injective.network',
    etherscanCompatibleApiUrl: 'https://blockscout-api.injective.network/api',
    rpc: {
      main: `https://injective-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://sentry.evm-rpc.injective.network',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 127255206 } },
  }),
  [ChainId.Ink]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Ink,
    name: 'Ink',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'ink',
    logoUrl: '/assets/images/vendor/chains/ink.svg',
    explorerUrl: 'https://explorer.inkonchain.com',
    infoUrl: 'https://inkonchain.com',
    rpc: {
      main: `https://ink-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc-gel.inkonchain.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
    isOpStack: true,
  }),
  [ChainId.IOTAEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.IOTAEVM,
    name: 'IOTA EVM',
    nativeCurrency: { name: 'IOTA', symbol: 'IOTA', decimals: 18 },
    nativeTokenCoingeckoId: 'iota',
    coingeckoNetworkId: 'iota-evm',
    logoUrl: '/assets/images/vendor/chains/iota.svg',
    explorerUrl: 'https://explorer.evm.iota.org',
    infoUrl: 'https://www.iota.org',
    rpc: {
      main: 'https://json-rpc.evm.iotaledger.net',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 25022 } },
  }),
  [ChainId.IoTeX]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.IoTeX,
    name: 'IoTeX',
    nativeCurrency: { name: 'IoTeX', symbol: 'IOTX', decimals: 18 },
    coingeckoNetworkId: 'iotx',
    logoUrl: '/assets/images/vendor/chains/iotex.png',
    explorerUrl: 'https://iotexscan.io',
    infoUrl: 'https://iotex.io',
    rpc: {
      main: 'https://babel-api.mainnet.iotex.io',
    },
  }),
  [ChainId.Kaia]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.Kaia,
    name: 'Kaia',
    nativeCurrency: { name: 'KAIA', symbol: 'KAIA', decimals: 18 },
    coingeckoNetworkId: 'kaia',
    logoUrl: '/assets/images/vendor/chains/kaia.svg',
    explorerUrl: 'https://kaiascope.com',
    infoUrl: 'https://kaia.io',
    rpc: {
      main: 'https://public-en.node.kaia.io',
    },
  }),
  [ChainId.KasplexZkEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.KasplexZkEVM,
    name: 'Kasplex zkEVM',
    nativeCurrency: { name: 'Kaspa', symbol: 'KAS', decimals: 18 },
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
    nativeCurrency: ETH,
    coingeckoNetworkId: 'katana',
    logoUrl: '/assets/images/vendor/chains/katana.svg',
    explorerUrl: 'https://katanascan.com',
    infoUrl: 'https://katana.network',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
    rpc: {
      main: `https://katana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.katana.network',
    },
  }),
  [ChainId.KCC]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.KCC,
    name: 'KCC',
    nativeCurrency: { name: 'KuCoin Token', symbol: 'KCS', decimals: 18 },
    nativeTokenCoingeckoId: 'kucoin-shares',
    coingeckoNetworkId: 'kcc',
    logoUrl: '/assets/images/vendor/chains/kcc.svg',
    explorerUrl: 'https://scan.kcc.io',
    infoUrl: 'https://kcc.io',
    rpc: {
      main: 'https://rpc-mainnet.kcc.network',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 11760430 } },
  }),
  [ChainId.Lens]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Lens,
    name: 'Lens',
    nativeCurrency: { name: 'GHO', symbol: 'GHO', decimals: 18 },
    nativeTokenCoingeckoId: 'gho',
    coingeckoNetworkId: 'lens',
    logoUrl: '/assets/images/vendor/chains/lens.jpg',
    infoUrl: 'https://lens.xyz',
    explorerUrl: 'https://explorer.lens.xyz',
    rpc: {
      main: `https://lens-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.lens.xyz',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1724216 } },
  }),
  [ChainId.Lightlink]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Lightlink,
    name: 'Lightlink',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'lightlink-phoenix',
    logoUrl: '/assets/images/vendor/chains/lightlink.jpg',
    explorerUrl: 'https://phoenix.lightlink.io',
    infoUrl: 'https://lightlink.io',
    rpc: {
      main: 'https://replicator.phoenix.lightlink.io/rpc/v1',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 125499184 } },
  }),
  [ChainId.Linea]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Linea,
    name: 'Linea',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'linea',
    logoUrl: '/assets/images/vendor/chains/linea.png',
    infoUrl: 'https://linea.build',
    explorerUrl: 'https://lineascan.build',
    rpc: {
      main: `https://linea-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.linea.build',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 42 } },
  }),
  [ChainId.MantaPacific]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.MantaPacific,
    name: 'Manta Pacific',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'manta-pacific',
    logoUrl: '/assets/images/vendor/chains/manta-pacific.svg',
    explorerUrl: 'https://pacific-explorer.manta.network',
    infoUrl: 'https://manta.network',
    etherscanCompatibleApiUrl: 'https://manta-pacific.calderaexplorer.xyz/api',
    rpc: {
      main: `https://lb.drpc.live/manta-pacific/${DRPC_API_KEY}`,
      free: 'https://pacific-rpc.manta.network/http',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 332890 } },
  }),
  [ChainId.Mantle]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Mantle,
    name: 'Mantle',
    nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
    nativeTokenCoingeckoId: 'mantle',
    coingeckoNetworkId: 'mantle',
    logoUrl: '/assets/images/vendor/chains/mantle.svg',
    explorerUrl: 'https://mantlescan.xyz',
    infoUrl: 'https://mantle.xyz',
    rpc: {
      main: `https://mantle-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.mantle.xyz',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 304717 } },
  }),
  [ChainId.Matchain]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Matchain,
    name: 'Matchain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    nativeTokenCoingeckoId: 'binancecoin',
    coingeckoNetworkId: 'matchain',
    logoUrl: '/assets/images/vendor/chains/matchain.svg',
    infoUrl: 'https://www.matchain.io',
    explorerUrl: 'https://matchscan.io',
    rpc: {
      main: 'https://rpc.matchain.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.MegaETH]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.MegaETH,
    name: 'MegaETH',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'megaeth',
    logoUrl: '/assets/images/vendor/chains/megaeth.svg',
    infoUrl: 'https://megaeth.com',
    explorerUrl: 'https://mega.etherscan.io',
    rpc: {
      main: `https://megaeth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.megaeth.com/rpc',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
    isOpStack: true,
  }),
  [ChainId.Metis]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Metis,
    name: 'Metis',
    nativeCurrency: { name: 'Metis', symbol: 'METIS', decimals: 18 },
    nativeTokenCoingeckoId: 'metis-token',
    coingeckoNetworkId: 'metis',
    logoUrl: '/assets/images/vendor/chains/metis.svg',
    explorerUrl: 'https://andromeda-explorer.metis.io',
    infoUrl: 'https://www.metis.io',
    etherscanCompatibleApiUrl: 'https://andromeda-explorer.metis.io/api',
    rpc: {
      main: `https://metis-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://andromeda.metis.io/?owner=1088',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 2338552 } },
  }),
  [ChainId.Mode]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Mode,
    name: 'Mode',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'mode',
    logoUrl: '/assets/images/vendor/chains/mode.jpg',
    explorerUrl: 'https://explorer.mode.network',
    infoUrl: 'https://docs.mode.network/',
    rpc: {
      main: `https://mode-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.mode.network',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 2465882 } },
    isOpStack: true,
  }),
  [ChainId.Monad]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Monad,
    name: 'Monad',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    nativeTokenCoingeckoId: 'monad',
    coingeckoNetworkId: 'monad',
    logoUrl: '/assets/images/vendor/chains/monad.svg',
    infoUrl: 'https://monad.xyz',
    explorerUrl: 'https://monadscan.com',
    rpc: {
      main: `https://monad-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      traces: 'https://rpc.monad.xyz', // Alchemy's Monad transaction-hash index only covers the last few days
      free: 'https://rpc.monad.xyz',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 9248132 } },
  }),
  [ChainId.Moonbeam]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.Moonbeam,
    name: 'Moonbeam',
    nativeCurrency: { name: 'Glimmer', symbol: 'GLMR', decimals: 18 },
    nativeTokenCoingeckoId: 'moonbeam',
    coingeckoNetworkId: 'glmr',
    logoUrl: '/assets/images/vendor/chains/moonbeam.svg',
    explorerUrl: 'https://moonbeam.moonscan.io',
    infoUrl: 'https://moonbeam.network/networks/moonbeam/',
    rpc: {
      main: 'https://rpc.api.moonbeam.network',
    },
  }),
  [ChainId.Moonriver]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.Moonriver,
    name: 'Moonriver',
    nativeCurrency: { name: 'Moonriver', symbol: 'MOVR', decimals: 18 },
    nativeTokenCoingeckoId: 'moonriver',
    coingeckoNetworkId: 'movr',
    logoUrl: '/assets/images/vendor/chains/moonriver.svg',
    explorerUrl: 'https://moonriver.moonscan.io',
    infoUrl: 'https://moonbeam.network/networks/moonriver/',
    rpc: {
      main: 'https://rpc.api.moonriver.moonbeam.network',
    },
  }),
  [ChainId.Morph]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Morph,
    name: 'Morph',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'morph-l2',
    logoUrl: '/assets/images/vendor/chains/morph.svg',
    explorerUrl: 'https://explorer.morphl2.io',
    infoUrl: 'https://morphl2.io',
    etherscanCompatibleApiUrl: 'https://explorer-api.morphl2.io/api',
    rpc: {
      main: `https://lb.drpc.live/morph/${DRPC_API_KEY}`,
      free: 'https://rpc.morphl2.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 3654913 } },
  }),
  [ChainId.Mythos]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Mythos,
    name: 'Mythos',
    nativeCurrency: { name: 'Mythos', symbol: 'MYTH', decimals: 18 },
    nativeTokenCoingeckoId: 'mythos',
    infoUrl: 'https://mythos.foundation/',
    logoUrl: '/assets/images/vendor/chains/mythos.png',
    explorerUrl: 'https://mythos-mainnet.explorer.alchemy.com',
    etherscanCompatibleApiUrl: 'https://mythos-mainnet.explorer.alchemy.com/api',
    rpc: {
      main: `https://mythos-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mythos-mainnet.g.alchemy.com/public',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
    isOpStack: true,
  }),
  [ChainId.Oasys]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Oasys,
    name: 'Oasys',
    nativeCurrency: { name: 'OAS', symbol: 'OAS', decimals: 18 },
    nativeTokenCoingeckoId: 'oasys',
    coingeckoNetworkId: 'oasys',
    logoUrl: '/assets/images/vendor/chains/oasys.svg',
    infoUrl: 'https://oasys.games',
    rpc: {
      main: 'https://rpc.mainnet.oasys.games',
    },
    explorerUrl: 'https://scan.oasys.games',
    etherscanCompatibleApiUrl: 'https://scan.oasys.games/api',
  }),
  [ChainId.OpBNB]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.OpBNB,
    name: 'opBNB',
    nativeCurrency: { name: 'BNB Chain Native Token', symbol: 'BNB', decimals: 18 },
    nativeTokenCoingeckoId: 'binancecoin',
    coingeckoNetworkId: 'opbnb',
    logoUrl: '/assets/images/vendor/chains/bnb-chain.svg',
    explorerUrl: 'https://opbnbscan.com',
    infoUrl: 'https://opbnb.bnbchain.org/en',
    rpc: {
      main: `https://opbnb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://opbnb-mainnet-rpc.bnbchain.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 512881 } },
    isOpStack: true,
  }),
  [ChainId.Optimism]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Optimism,
    name: 'Optimism',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'optimism',
    logoUrl: '/assets/images/vendor/chains/optimism.svg',
    explorerUrl: 'https://optimistic.etherscan.io',
    infoUrl: 'https://optimism.io',
    rpc: {
      main: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.optimism.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 4286263 } },
    isOpStack: true,
  }),
  [ChainId.OptimismSepolia]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.OptimismSepolia,
    name: 'Optimism Sepolia',
    nativeCurrency: ETH,
    logoUrl: '/assets/images/vendor/chains/optimism.svg',
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    infoUrl: 'https://optimism.io',
    rpc: {
      main: `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://sepolia.optimism.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1620204 } },
    isTestnet: true,
    isOpStack: true,
    correspondingMainnetChainId: ChainId.Optimism,
  }),
  [ChainId.Plasma]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Plasma,
    name: 'Plasma',
    nativeCurrency: { name: 'Plasma', symbol: 'XPL', decimals: 18 },
    logoUrl: '/assets/images/vendor/chains/plasma.svg',
    explorerUrl: 'https://plasmascan.to',
    infoUrl: 'https://plasma.to',
    nativeTokenCoingeckoId: 'plasma',
    coingeckoNetworkId: 'plasma',
    rpc: {
      main: `https://plasma-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.plasma.to',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.Plume]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Plume,
    name: 'Plume',
    nativeCurrency: { name: 'Plume', symbol: 'PLUME', decimals: 18 },
    nativeTokenCoingeckoId: 'plume',
    coingeckoNetworkId: 'plume-network',
    logoUrl: '/assets/images/vendor/chains/plume.svg',
    explorerUrl: 'https://explorer.plume.org',
    infoUrl: 'https://plume.org',
    rpc: {
      main: 'https://rpc.plume.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 48577 } },
  }),
  [ChainId.Polygon]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Polygon,
    name: 'Polygon',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    nativeTokenCoingeckoId: 'polygon-ecosystem-token',
    coingeckoNetworkId: 'polygon_pos',
    logoUrl: '/assets/images/vendor/chains/polygon.svg',
    explorerUrl: 'https://polygonscan.com',
    infoUrl: 'https://polygon.technology/',
    rpc: {
      main: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://polygon.drpc.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 25770160 } },
  }),
  [ChainId.PolygonAmoy]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.PolygonAmoy,
    name: 'Polygon Amoy',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    nativeTokenCoingeckoId: 'polygon-ecosystem-token',
    logoUrl: '/assets/images/vendor/chains/polygon.svg',
    explorerUrl: 'https://amoy.polygonscan.com',
    infoUrl: 'https://polygon.technology/',
    rpc: {
      main: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://polygon-amoy.drpc.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 3127388 } },
    isTestnet: true,
    correspondingMainnetChainId: ChainId.Polygon,
  }),
  [ChainId.PolygonZkEVM]: new Chain({
    type: SupportType.UNSUPPORTED,
    chainId: ChainId.PolygonZkEVM,
    name: 'Polygon zkEVM',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'polygon-zkevm',
    logoUrl: '/assets/images/vendor/chains/polygon.svg',
    explorerUrl: 'https://zkevm.polygonscan.com',
    infoUrl: 'https://polygon.technology/polygon-zkevm',
    rpc: {
      main: 'https://zkevm-rpc.com',
    },
  }),
  [ChainId.PulseChain]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.PulseChain,
    name: 'PulseChain',
    nativeCurrency: { name: 'Pulse', symbol: 'PLS', decimals: 18 },
    nativeTokenCoingeckoId: 'pulsechain',
    coingeckoNetworkId: 'pulsechain',
    logoUrl: '/assets/images/vendor/chains/pulsechain.png',
    infoUrl: 'https://pulsechain.com/',
    rpc: {
      main: 'https://rpc.pulsechain.com',
    },
    explorerUrl: 'https://otherscan.pulsechain.box',
    etherscanCompatibleApiUrl: 'https://api.scan.pulsechain.com/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 14353601 } },
  }),
  [ChainId.Reya]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Reya,
    name: 'Reya',
    nativeCurrency: ETH,
    logoUrl: '/assets/images/vendor/chains/reya.svg',
    infoUrl: 'https://reya.network',
    explorerUrl: 'https://explorer-reya-network.t.conduit.xyz',
    rpc: {
      main: 'https://rpc.reya.network',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 10458805 } },
  }),
  [ChainId.RISE]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.RISE,
    name: 'RISE',
    nativeCurrency: ETH,
    logoUrl: '/assets/images/vendor/chains/rise.svg',
    infoUrl: 'https://risechain.com',
    explorerUrl: 'https://explorer.risechain.com',
    etherscanCompatibleApiUrl: 'https://explorer.risechain.com/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
    rpc: {
      main: `https://rise-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.risechain.com/',
    },
  }),
  [ChainId.RobinhoodChain]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.RobinhoodChain,
    name: 'Robinhood Chain',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'robinhood',
    logoUrl: '/assets/images/vendor/chains/robinhood.png',
    explorerUrl: 'https://robinhoodchain.blockscout.com',
    infoUrl: 'https://docs.robinhood.com/chain',
    rpc: {
      main: `https://robinhood-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.mainnet.chain.robinhood.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.Rollux]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Rollux,
    name: 'Rollux',
    nativeCurrency: { name: 'Syscoin', symbol: 'SYS', decimals: 18 },
    nativeTokenCoingeckoId: 'syscoin',
    coingeckoNetworkId: 'rollux',
    logoUrl: '/assets/images/vendor/chains/rollux.svg',
    explorerUrl: 'https://explorer.rollux.com',
    infoUrl: 'https://rollux.com',
    rpc: {
      main: 'https://rpc.rollux.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 119222 } },
  }),
  [ChainId.Ronin]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.Ronin,
    name: 'Ronin',
    nativeCurrency: { name: 'RON', symbol: 'RON', decimals: 18 },
    nativeTokenCoingeckoId: 'ronin',
    coingeckoNetworkId: 'ronin',
    logoUrl: '/assets/images/vendor/chains/ronin.svg',
    explorerUrl: 'https://explorer.roninchain.com',
    infoUrl: 'https://roninchain.com',
    rpc: {
      main: `https://ronin-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://api.roninchain.com/rpc',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 26023535 } },
  }),
  [ChainId.Rootstock]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Rootstock,
    name: 'Rootstock',
    nativeCurrency: { name: 'Smart Bitcoin', symbol: 'RBTC', decimals: 18 },
    nativeTokenCoingeckoId: 'rootstock',
    coingeckoNetworkId: 'rootstock',
    logoUrl: '/assets/images/vendor/chains/rootstock.jpg',
    infoUrl: 'https://rootstock.io',
    explorerUrl: 'https://rootstock.blockscout.com',
    rpc: {
      main: `https://rootstock-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://public-node.rsk.co',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 4249540 } },
  }),
  [ChainId.Scroll]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.Scroll,
    name: 'Scroll',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'scroll',
    logoUrl: '/assets/images/vendor/chains/scroll.svg',
    infoUrl: 'https://scroll.io',
    explorerUrl: 'https://scrollscan.com',
    rpc: {
      main: `https://scroll-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.scroll.io',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 14 } },
  }),
  [ChainId.Sei]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Sei,
    name: 'Sei',
    nativeCurrency: { name: 'Sei', symbol: 'SEI', decimals: 18 },
    nativeTokenCoingeckoId: 'sei-network',
    coingeckoNetworkId: 'sei-network',
    logoUrl: '/assets/images/vendor/chains/sei.svg',
    infoUrl: 'https://www.sei.io',
    explorerUrl: 'https://seiscan.io',
    rpc: {
      main: `https://sei-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://evm-rpc.sei-apis.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 79351444 } },
  }),
  [ChainId.Shape]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Shape,
    name: 'Shape',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'shape',
    logoUrl: '/assets/images/vendor/chains/shape.svg',
    explorerUrl: 'https://shapescan.xyz',
    infoUrl: 'https://shape.network',
    rpc: {
      main: `https://shape-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.shape.network',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1 } },
    isOpStack: true,
  }),
  [ChainId.Shido]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Shido,
    name: 'Shido',
    nativeCurrency: { name: 'Shido', symbol: 'SHIDO', decimals: 18 },
    nativeTokenCoingeckoId: 'shido-2',
    coingeckoNetworkId: 'shido-network',
    logoUrl: '/assets/images/vendor/chains/shido.png',
    infoUrl: 'https://shido.io',
    explorerUrl: 'https://shidoscan.net',
    etherscanCompatibleApiUrl: 'https://shidoscan.net/api',
    rpc: {
      main: 'https://evm.shidoscan.net',
    },
  }),
  [ChainId.Somnia]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Somnia,
    name: 'Somnia',
    nativeCurrency: { name: 'Somnia Mainnet', symbol: 'SOMI', decimals: 18 },
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
    nativeCurrency: ETH,
    coingeckoNetworkId: 'soneium',
    logoUrl: '/assets/images/vendor/chains/soneium.png',
    infoUrl: 'https://soneium.org',
    explorerUrl: 'https://soneium.blockscout.com',
    rpc: {
      main: `https://soneium-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.soneium.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1 } },
    isOpStack: true,
  }),
  [ChainId.Songbird]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Songbird,
    name: 'Songbird',
    nativeCurrency: { name: 'Songbird', symbol: 'SGB', decimals: 18 },
    nativeTokenCoingeckoId: 'songbird',
    logoUrl: '/assets/images/vendor/chains/songbird.svg',
    explorerUrl: 'https://songbird-explorer.flare.network',
    rpc: {
      main: 'https://songbird-api.flare.network/ext/C/rpc',
    },
    infoUrl: 'https://flare.network/songbird',
    etherscanCompatibleApiUrl: 'https://songbird-explorer.flare.network/api',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 13382504 } },
    isCanary: true,
    correspondingMainnetChainId: ChainId.Flare,
  }),
  [ChainId.Sonic]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Sonic,
    name: 'Sonic',
    nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
    nativeTokenCoingeckoId: 'sonic-3',
    coingeckoNetworkId: 'sonic',
    logoUrl: '/assets/images/vendor/chains/sonic.svg',
    infoUrl: 'https://soniclabs.com',
    explorerUrl: 'https://sonicscan.org',
    rpc: {
      main: `https://sonic-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.soniclabs.com',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 60 } },
  }),
  [ChainId.Stable]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Stable,
    name: 'Stable',
    nativeCurrency: { name: 'USDT0', symbol: 'USDT0', decimals: 18 },
    nativeTokenCoingeckoId: 'usdt0',
    logoUrl: '/assets/images/vendor/chains/stable.svg',
    infoUrl: 'https://stable.xyz',
    explorerUrl: 'https://stablescan.xyz',
    rpc: {
      main: `https://stable-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.stable.xyz',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 2423647 } },
  }),
  [ChainId.TAC]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.TAC,
    name: 'TAC',
    nativeCurrency: { name: 'TAC', symbol: 'TAC', decimals: 18 },
    nativeTokenCoingeckoId: 'tac',
    coingeckoNetworkId: 'tac',
    logoUrl: '/assets/images/vendor/chains/tac.svg',
    infoUrl: 'https://tac.build/',
    explorerUrl: 'https://tac.blockscout.com',
    rpc: {
      main: `https://lb.drpc.live/tac/${DRPC_API_KEY}`,
      free: 'https://rpc.tac.build',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.Taiko]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Taiko,
    name: 'Taiko',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'taiko',
    logoUrl: '/assets/images/vendor/chains/taiko.svg',
    infoUrl: 'https://taiko.xyz',
    rpc: {
      main: 'https://rpc.mainnet.taiko.xyz',
    },
    explorerUrl: 'https://taikoscan.io',
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 11269 } },
  }),
  [ChainId.TelosEVM]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.TelosEVM,
    name: 'Telos EVM',
    nativeCurrency: { name: 'Telos', symbol: 'TLOS', decimals: 18 },
    nativeTokenCoingeckoId: 'telos',
    coingeckoNetworkId: 'tlos',
    logoUrl: '/assets/images/vendor/chains/telos.svg',
    explorerUrl: 'https://teloscan.io',
    infoUrl: 'https://telos.net',
    etherscanCompatibleApiUrl: 'https://teloscan.io/api',
    rpc: {
      main: 'https://rpc.telos.net',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 246530709 } },
  }),
  [ChainId.Tempo]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.Tempo,
    name: 'Tempo',
    nativeCurrency: { name: 'No native currency', symbol: 'USD', decimals: 18 },
    nativeTokenCoingeckoId: 'pathusd',
    coingeckoNetworkId: 'tempo',
    logoUrl: '/assets/images/vendor/chains/tempo.svg',
    explorerUrl: 'https://explore.tempo.xyz',
    infoUrl: 'https://tempo.xyz',
    rpc: {
      main: `https://tempo-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://rpc.mainnet.tempo.xyz',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
  }),
  [ChainId.Unichain]: new Chain({
    type: SupportType.ETHERSCAN,
    chainId: ChainId.Unichain,
    name: 'Unichain',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'unichain',
    logoUrl: '/assets/images/vendor/chains/unichain.svg',
    infoUrl: 'https://unichain.org',
    explorerUrl: 'https://uniscan.xyz',
    rpc: {
      main: `https://unichain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.unichain.org',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
    isOpStack: true,
  }),
  [ChainId.Vana]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.Vana,
    name: 'Vana',
    nativeCurrency: { name: 'Vana', symbol: 'VANA', decimals: 18 },
    nativeTokenCoingeckoId: 'vana',
    coingeckoNetworkId: 'vana',
    logoUrl: '/assets/images/vendor/chains/vana.png',
    explorerUrl: 'https://vanascan.io',
    infoUrl: 'https://vana.org',
    rpc: {
      main: 'https://rpc.vana.org/',
    },
    etherscanCompatibleApiUrl: 'https://vanascan.io/api',
  }),
  [ChainId.Viction]: new Chain({
    type: SupportType.COVALENT,
    chainId: ChainId.Viction,
    name: 'Viction',
    nativeCurrency: { name: 'Viction', symbol: 'VIC', decimals: 18 },
    nativeTokenCoingeckoId: 'tomochain',
    coingeckoNetworkId: 'tomochain',
    logoUrl: '/assets/images/vendor/chains/viction.svg',
    infoUrl: 'https://viction.xyz',
    explorerUrl: 'https://www.vicscan.xyz',
    rpc: {
      main: `https://lb.drpc.live/viction/${DRPC_API_KEY}`,
      free: 'https://rpc.viction.xyz',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 87169904 } },
  }),
  [ChainId.WorldChain]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.WorldChain,
    name: 'World Chain',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'world-chain',
    logoUrl: '/assets/images/vendor/chains/worldchain.svg',
    infoUrl: 'https://world.org/world-chain',
    explorerUrl: 'https://worldchain-mainnet.explorer.alchemy.com',
    rpc: {
      main: `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://worldchain-mainnet.g.alchemy.com/public',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 0 } },
    isOpStack: true,
  }),
  [ChainId.XDC]: new Chain({
    type: SupportType.HYPERSYNC,
    chainId: ChainId.XDC,
    name: 'XDC',
    nativeCurrency: { name: 'XinFin', symbol: 'XDC', decimals: 18 },
    nativeTokenCoingeckoId: 'xdce-crowd-sale',
    coingeckoNetworkId: 'xdc',
    logoUrl: '/assets/images/vendor/chains/xdc.svg',
    explorerUrl: 'https://xdcscan.com',
    infoUrl: 'https://xinfin.org',
    rpc: {
      main: `https://lb.drpc.live/xdc/${DRPC_API_KEY}`,
      free: 'https://rpc.ankr.com/xdc',
    },
  }),
  [ChainId.ZetaChain]: new Chain({
    type: SupportType.BLOCKSCOUT,
    chainId: ChainId.ZetaChain,
    name: 'ZetaChain',
    nativeCurrency: { name: 'Zeta', symbol: 'ZETA', decimals: 18 },
    nativeTokenCoingeckoId: 'zetachain',
    coingeckoNetworkId: 'zetachain',
    logoUrl: '/assets/images/vendor/chains/zetachain.svg',
    infoUrl: 'https://zetachain.com/docs',
    explorerUrl: 'https://zetachain.blockscout.com',
    rpc: {
      main: `https://zetachain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
    },
    deployedContracts: { multicall3: { address: MULTICALL_ADDRESS, blockCreated: 1632781 } },
  }),
  [ChainId.ZkSyncEra]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.ZkSyncEra,
    name: 'zkSync Era',
    nativeCurrency: ETH,
    coingeckoNetworkId: 'zksync',
    logoUrl: '/assets/images/vendor/chains/zksync.jpeg',
    infoUrl: 'https://zksync.io/',
    explorerUrl: 'https://explorer.zksync.io',
    rpc: {
      main: `https://zksync-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      free: 'https://mainnet.era.zksync.io',
    },
    deployedContracts: {
      multicall3: { address: '0xF9cda624FBC7e059355ce98a31693d299FACd963', blockCreated: 3908235 },
    },
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
  return getChainConfig(chainId)?.getName() ?? `Chain ${chainId}`;
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

export const getChainLogsRpcUrl = (chainId: DocumentedChainId): string => {
  return getChainConfig(chainId).getLogsRpcUrl();
};

export const getChainLogo = (chainId: DocumentedChainId): string | undefined => {
  return getChainConfig(chainId)?.getLogoUrl();
};

export const getChainInfoUrl = (chainId: DocumentedChainId): string | undefined => {
  return getChainConfig(chainId)?.getInfoUrl();
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

export const isOpStackChain = (chainId: DocumentedChainId): boolean => {
  return getChainConfig(chainId).isOpStack();
};

export const getViemChainConfig = (chainId: DocumentedChainId): ViemChain => {
  return getChainConfig(chainId).getViemChainConfig();
};

export const createViemPublicClientForChain = (
  chainId: DocumentedChainId,
  url?: string,
  blockNumber?: bigint,
  httpOptions?: { timeout?: number; retryCount?: number },
): PublicClient => {
  return getChainConfig(chainId).createViemPublicClient(url, blockNumber, httpOptions);
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
