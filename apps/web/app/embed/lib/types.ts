import type { ReactNode } from 'react';
import type { CreateConnectorFn } from 'wagmi';

export type EmbedType = 'farcaster' | 'safe' | 'ledger' | 'world';

export type AutoConnectStatus = 'connecting' | 'connected' | 'failed';

export interface EmbedConfig {
  type: EmbedType;
  connectors: CreateConnectorFn[];
  detectAutoConnect: () => Promise<string | null>;
  onConnected?: () => Promise<void>;
  renderShareAction?: (props: { allowances?: any[] }) => ReactNode;
  routePrefix: string;
  showChainSelect?: boolean;
}
