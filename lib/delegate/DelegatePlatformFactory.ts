import { ChainId } from '@revoke.cash/chains';
import type { PublicClient } from 'viem';
import type { DelegatePlatform } from './DelegatePlatform';
import { DelegateV1Platform } from './DelegateV1Platform';
import { DelegateV2Platform } from './DelegateV2Platform';
import { WarmPlatform } from './WarmPlatform';

export const DELEGATE_SUPPORTED_CHAINS: ChainId[] = [
  ChainId.EthereumMainnet,
  ChainId.ArbitrumOne,
  ChainId.ArbitrumNova,
  ChainId['AvalancheC-Chain'],
  ChainId.Base,
  ChainId.BlastMainnet,
  ChainId.BNBSmartChainMainnet,
  ChainId.Canto,
  ChainId.CeloMainnet,
  ChainId.FantomOpera,
  ChainId.Gnosis,
  ChainId.HYCHAIN,
  ChainId.Linea,
  ChainId.Mantle,
  ChainId.Moonbeam,
  ChainId.Moonriver,
  ChainId.OPMainnet,
  ChainId.PolygonMainnet,
  ChainId.PolygonzkEVM,
  ChainId.RoninMainnet,
  ChainId.Sanko,
  ChainId.Scroll,
  ChainId.SeiNetwork,
  ChainId.TaikoAlethia,
  ChainId.XaiMainnet,
  ChainId.ZetaChainMainnet,
  ChainId.Zora,

  // Testnets
  ChainId.EthereumSepolia, // Ethereum (Sepolia)
  ChainId.AbstractSepoliaTestnet,
  ChainId.Holesky,
  ChainId.BaseSepoliaTestnet,
  ChainId.BerachainbArtio,
];
export const WARM_SUPPORTED_CHAINS: ChainId[] = [ChainId.EthereumMainnet, ChainId.EthereumSepolia];

export function createDelegatePlatforms(publicClient: PublicClient, chainId: ChainId): DelegatePlatform[] {
  const platforms: DelegatePlatform[] = [];

  // Add delegate platforms if supported on this chain
  if (DELEGATE_SUPPORTED_CHAINS.includes(chainId)) {
    platforms.push(new DelegateV1Platform(publicClient));
    platforms.push(new DelegateV2Platform(publicClient));
  }
  if (WARM_SUPPORTED_CHAINS.includes(chainId)) {
    platforms.push(new WarmPlatform(publicClient));
  }

  return platforms;
}
