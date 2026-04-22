'use client';

import { safe } from 'wagmi/connectors';
import type { EmbedConfig } from '../lib/types';

export const safeEmbedConfig: EmbedConfig = {
  type: 'safe',
  connectors: [safe({ debug: false })],
  detectAutoConnect: async () => {
    if (typeof window !== 'undefined' && window.parent !== window) return 'safe';
    return null;
  },
  routePrefix: '/embed/safe',
};
