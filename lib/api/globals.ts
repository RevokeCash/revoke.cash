import { SupportType } from 'lib/chains/Chain';
import { type DocumentedChainId, getChainConfig } from 'lib/utils/chains';
import { BlockScoutEventGetter } from './logs/BlockScoutEventGetter';
import { CovalentEventGetter } from './logs/CovalentEventGetter';
import { CustomEventGetter } from './logs/CustomEventGetter';
import { EtherscanEventGetter } from './logs/EtherscanEventGetter';
import type { EventGetter } from './logs/EventGetter';
import { HyperSyncEventGetter } from './logs/HyperSyncEventGetter';
import { NodeEventGetter } from './logs/NodeEventGetter';
import { RoutescanEventGetter } from './logs/RoutescanEventGetter';

// Event getters should only be instantiated once. These singleton accessors keep
// initialization lazy so we don't pay startup cost (or import side effects) until needed.
const singleton = <T>(factory: () => T): (() => T) => {
  let instance: T | undefined;

  return () => {
    if (!instance) instance = factory();
    return instance;
  };
};

const EVENT_GETTERS: Record<SupportType, () => EventGetter | undefined> = {
  [SupportType.COVALENT]: singleton(
    () => new CovalentEventGetter(process.env.COVALENT_API_KEY, Number(process.env.COVALENT_RATE_LIMIT) || 4),
  ),
  [SupportType.ROUTESCAN]: singleton(() => new RoutescanEventGetter()),
  [SupportType.ETHERSCAN_COMPATIBLE]: singleton(() => new EtherscanEventGetter()),
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
