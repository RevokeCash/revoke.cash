import { type DocumentedChainId, getChainConfig } from '@revoke.cash/core/chains';
import { SupportType } from '@revoke.cash/core/chains/Chain';
import { singleton } from '@revoke.cash/core/utils';
import { BlockScoutEventGetter } from './BlockScoutEventGetter';
import { CovalentEventGetter } from './CovalentEventGetter';
import { CustomEventGetter } from './CustomEventGetter';
import { EtherscanEventGetter } from './EtherscanEventGetter';
import type { EventGetter } from './EventGetter';
import { HyperSyncEventGetter } from './HyperSyncEventGetter';
import { NodeEventGetter } from './NodeEventGetter';
import { RoutescanEventGetter } from './RoutescanEventGetter';

// Event getters should only be instantiated once. These singleton accessors keep
// initialization lazy so we don't pay startup cost (or import side effects) until needed.

const EVENT_GETTERS: Record<SupportType, () => EventGetter | undefined> = {
  [SupportType.COVALENT]: singleton(
    () => new CovalentEventGetter(process.env.COVALENT_API_KEY, Number(process.env.COVALENT_RATE_LIMIT) || 4),
  ),
  [SupportType.ROUTESCAN]: singleton(() => new RoutescanEventGetter()),
  [SupportType.ETHERSCAN]: singleton(() => new EtherscanEventGetter()),
  [SupportType.BLOCKSCOUT]: singleton(() => new BlockScoutEventGetter()),
  [SupportType.HYPERSYNC]: singleton(() => new HyperSyncEventGetter()),
  [SupportType.BACKEND_NODE]: singleton(() => new NodeEventGetter(JSON.parse(process.env.NODE_URLS ?? '{}'))),
  [SupportType.BACKEND_CUSTOM]: singleton(() => new CustomEventGetter({})),
  [SupportType.UNSUPPORTED]: () => undefined,
  [SupportType.PROVIDER]: () => undefined,
};

export const getEventGetter = (chainId: DocumentedChainId): EventGetter => {
  const chainConfig = getChainConfig(chainId);
  const supportType = chainConfig.type;
  const eventGetter = EVENT_GETTERS[supportType]();

  if (!eventGetter) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return eventGetter;
};
