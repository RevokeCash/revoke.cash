import { ChainId } from '@revoke.cash/core/chains/ids';

// Almost every chain for which we use paid RPC providers supports debug_traceTransaction. Many public RPC endpoints
// also support it, so we only need to deny-list chains that are known to not support it. Last checked 2026-08-02.
export const APPROVED_TRANSFERS_UNSUPPORTED_CHAINS: number[] = [
  // No trace support found on any configured or known endpoint (probed 2026-08-02)
  ChainId.Etherlink,
  ChainId.Matchain,
  ChainId.Oasys,
  ChainId.Reya,
  ChainId.Rollux,
  ChainId.XDC, // dRPC serves XDC but without debug/trace methods
  ChainId.EthereumClassic, // dRPC serves ETC but without debug/trace methods
  ChainId.ArbitrumNova, // dRPC serves Arbitrum Nova but rejects all callTracer configs
  ChainId.Songbird,
  ChainId.Shido,
  ChainId.FilecoinEVM, // no debug_traceTransaction (only parity-style trace methods)
  ChainId.PulseChain, // no debug_traceTransaction (only parity-style trace methods)
  ChainId.Taiko, // traces fail on recent transactions (only sufficiently old ones succeed)
  // ZKsync-stack nodes ignore withLog, so their traces never contain the frame logs extraction requires
  ChainId.ZkSyncEra,
  ChainId.Abstract,
  ChainId.Lens,
  // These chains' tracers accept withLog but return no frame logs (probed 2026-08-02)
  ChainId.Aurora,
  ChainId.Harmony,
  ChainId.KCC,
  ChainId.Metis,
  ChainId.Scroll,
  ChainId.TAC,
  ChainId.Viction,
  ChainId.ZetaChain,
];

export const isApprovedTransfersSupportedChain = (chainId: number): boolean => {
  return !APPROVED_TRANSFERS_UNSUPPORTED_CHAINS.includes(chainId);
};

export const TRACE_SUPPORTED_FROM_BLOCK: Record<number, number> = {
  // Nitro migration: Classic-era blocks only support parity-style arbtrace_* methods, not debug_traceTransaction
  [ChainId.Arbitrum]: 22_207_817,
  // Bedrock migration: pre-Bedrock blocks are served by a legacy l2geth backend whose tracer predates withLog
  [ChainId.Optimism]: 105_235_063,
  // Anchorage migration: same legacy-backend situation as pre-Bedrock Optimism
  [ChainId.Boba]: 1_149_019,
};

// Trace calls are rate-budgeted per PROVIDER, not per chain
export const traceProviderKey = (rpcUrl: string, chainId: number): string => {
  try {
    const { hostname } = new URL(rpcUrl);
    if (hostname.endsWith('alchemy.com')) return 'alchemy';
    if (hostname.endsWith('drpc.live') || hostname.endsWith('drpc.org')) return 'drpc';
    return `public-${chainId}`;
  } catch {
    return `public-${chainId}`;
  }
};
