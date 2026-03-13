'use client';

import { ChainId } from '@revoke.cash/chains';
import { MiniKit } from '@worldcoin/minikit-js';
import { worldApp } from '@worldcoin/minikit-js/wagmi';
import type { EmbedConfig } from '../lib/types';

export const worldEmbedConfig: EmbedConfig = {
  type: 'world',
  connectors: [worldApp()],
  detectAutoConnect: async () => {
    if (MiniKit.isInstalled()) return 'worldApp';
    return null;
  },
  routePrefix: '/embed/world',
  defaultChainId: ChainId.WorldChain,
};
