'use client';

import type { ReactNode } from 'react';
import EmbedLayout from '../components/EmbedLayout';
import { safeEmbedConfig } from './config';

const SafeEmbedLayout = ({ children }: { children: ReactNode }) => {
  return <EmbedLayout config={safeEmbedConfig}>{children}</EmbedLayout>;
};

export default SafeEmbedLayout;
