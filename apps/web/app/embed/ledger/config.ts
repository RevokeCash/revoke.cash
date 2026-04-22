'use client';

import { injected } from 'wagmi/connectors';
import type { EmbedConfig } from '../lib/types';

export const ledgerEmbedConfig: EmbedConfig = {
  type: 'ledger',
  connectors: [injected()],
  detectAutoConnect: async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum?.isLedgerLive) return 'injected';
    return null;
  },
  routePrefix: '/embed/ledger',
};
