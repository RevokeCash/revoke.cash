'use client';

import { useQuery } from '@tanstack/react-query';
import { isNullish } from 'lib/utils';

interface ExtensionConfig {
  version: string;
  feeCollectionActive: boolean;
  tier: 'lite' | 'standard';
}

declare global {
  interface Window {
    revokeCash?: {
      getConfig: () => Promise<ExtensionConfig>;
    };
  }
}

export const useExtensionConfig = () => {
  const { data: config, isLoading } = useQuery({
    queryKey: ['extensionConfig'],
    queryFn: async () => {
      if (!window.revokeCash) return null;

      const config = await window.revokeCash.getConfig();
      if (!config) return null;

      config.tier = config.feeCollectionActive ? 'standard' : 'lite';

      return config;
    },
    // Only retry once since it's a local check
    retry: 1,
  });

  return {
    isInstalled: !isNullish(config),
    config: config ?? null,
    isLoading,
  };
};
