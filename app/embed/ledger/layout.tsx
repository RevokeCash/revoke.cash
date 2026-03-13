'use client';

import type { ReactNode } from 'react';
import EmbedLayout from '../components/EmbedLayout';
import { ledgerEmbedConfig } from './config';

const LedgerEmbedLayout = ({ children }: { children: ReactNode }) => {
  return <EmbedLayout config={ledgerEmbedConfig}>{children}</EmbedLayout>;
};

export default LedgerEmbedLayout;
