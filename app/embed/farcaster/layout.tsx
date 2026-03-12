'use client';

import type { ReactNode } from 'react';
import EmbedLayout from '../components/EmbedLayout';
import { farcasterEmbedConfig } from './config';

const FarcasterEmbedLayout = ({ children }: { children: ReactNode }) => {
  return <EmbedLayout config={farcasterEmbedConfig}>{children}</EmbedLayout>;
};

export default FarcasterEmbedLayout;
