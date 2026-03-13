'use client';

import type { ReactNode } from 'react';
import EmbedLayout from '../components/EmbedLayout';
import { worldEmbedConfig } from './config';

const WorldEmbedLayout = ({ children }: { children: ReactNode }) => {
  return <EmbedLayout config={worldEmbedConfig}>{children}</EmbedLayout>;
};

export default WorldEmbedLayout;
