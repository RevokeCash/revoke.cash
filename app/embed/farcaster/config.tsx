'use client';

import farcasterSdk from '@farcaster/miniapp-sdk';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { ChainId } from '@revoke.cash/chains';
import type { EmbedConfig } from '../lib/types';
import FarcasterShareButton from './components/FarcasterShareButton';

export const farcasterEmbedConfig: EmbedConfig = {
  type: 'farcaster',
  connectors: [farcasterMiniApp()],
  detectAutoConnect: async () => {
    if (await farcasterSdk.isInMiniApp()) return 'farcaster';
    return null;
  },
  onConnected: async () => {
    await farcasterSdk.actions.ready().catch(console.error);
  },
  renderShareAction: ({ allowances }) => <FarcasterShareButton allowances={allowances} />,
  routePrefix: '/embed/farcaster',
  defaultChainId: ChainId.Base,
};
