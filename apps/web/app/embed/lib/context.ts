'use client';

import { createContext, useContext } from 'react';
import type { AutoConnectStatus, EmbedConfig } from './types';

export const EmbedConfigContext = createContext<EmbedConfig | undefined>(undefined);

export const useEmbedConfig = () => {
  const config = useContext(EmbedConfigContext);
  if (!config) {
    throw new Error('useEmbedConfig must be used within an EmbedConfigContext');
  }
  return config;
};

export const AutoConnectStatusContext = createContext<AutoConnectStatus>('connecting');

export const useAutoConnectStatus = () => useContext(AutoConnectStatusContext);
