'use client';

import type { EmbedConfig } from '../lib/types';

// TODO: Configure World Mini App connector and auto-connect detection
export const worldEmbedConfig: EmbedConfig = {
  type: 'world',
  connectors: [],
  detectAutoConnect: async () => null,
  routePrefix: '/embed/world',
};
