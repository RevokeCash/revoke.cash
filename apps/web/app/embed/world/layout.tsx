'use client';

import type { ReactNode } from 'react';
import EmbedLayout from '../components/EmbedLayout';
import WorldMiniKitProvider from './components/WorldMiniKitProvider';
import { worldEmbedConfig } from './config';

const WorldEmbedLayout = ({ children }: { children: ReactNode }) => {
  return (
    <EmbedLayout config={worldEmbedConfig}>
      <WorldMiniKitProvider>{children}</WorldMiniKitProvider>
    </EmbedLayout>
  );
};

export default WorldEmbedLayout;
