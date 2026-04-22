'use client';

import { createContext, useContext } from 'react';
import type { AutoConnectStatus, EmbedConfig } from './types';

const EmbedConfigContext = createContext<EmbedConfig | undefined>(undefined);

export const EmbedConfigProvider = EmbedConfigContext.Provider;

export const useEmbedConfig = () => {
  const config = useContext(EmbedConfigContext);
  if (!config) {
    throw new Error('useEmbedConfig must be used within an EmbedConfigProvider');
  }
  return config;
};

const AutoConnectStatusContext = createContext<AutoConnectStatus>('connecting');

export const AutoConnectStatusProvider = AutoConnectStatusContext.Provider;

export const useAutoConnectStatus = () => useContext(AutoConnectStatusContext);
