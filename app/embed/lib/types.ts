import type { ReactNode } from 'react';
import type { CreateConnectorFn } from 'wagmi';

export type EmbedType = 'farcaster' | 'safe' | 'ledger' | 'world';

export type AutoConnectStatus = 'connecting' | 'connected' | 'failed';

export interface EmbedConfig {
  /** Unique identifier for this embed */
  type: EmbedType;

  /** wagmi connector(s) to use for this embed */
  connectors: CreateConnectorFn[];

  /**
   * Auto-connect logic. Returns the connector ID to auto-connect to,
   * or null if auto-connect should not happen.
   */
  detectAutoConnect: () => Promise<string | null>;

  /** Callback invoked after successful auto-connect (e.g. Farcaster calls sdk.actions.ready()) */
  onConnected?: () => Promise<void>;

  /** Optional share/action button renderer. Receives current allowances for composing share text. */
  renderShareAction?: (props: { allowances?: any[] }) => ReactNode;

  /** Route path prefix for this embed (e.g. '/embed/farcaster') */
  routePrefix: string;

  /** Optional chain ID to default to. When set, the chain selector is hidden. */
  defaultChainId?: number;
}
