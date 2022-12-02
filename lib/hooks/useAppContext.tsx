import { useQuery } from '@tanstack/react-query';
import type { DashboardSettings, StateSetter, TokenMapping } from 'lib/interfaces';
import { getFullTokenMapping } from 'lib/utils/tokens';
import { getOpenSeaProxyAddress } from 'lib/utils/whois';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import useLocalStorage from 'use-local-storage';
import { useEthereum } from './useEthereum';

const DEFAULT_SETTINGS = {
  includeUnverifiedTokens: true,
  includeTokensWithoutBalances: true,
  includeTokensWithoutAllowances: true,
  tokenStandard: 'ERC20' as const,
};

interface AppContext {
  tokenMapping?: TokenMapping;
  openSeaProxyAddress?: string;
  inputAddress?: string;
  setInputAddress?: StateSetter<string>;
  settings?: DashboardSettings;
  setSettings?: StateSetter<DashboardSettings>;
  loading?: boolean;
}

const AppContext = React.createContext<AppContext>({});

interface Props {
  children: ReactNode;
}

// TODO: Do we need to export a "loading" variable to indicate the loading of the async parts?
export const AppContextProvider = ({ children }: Props) => {
  const { selectedChainId, readProvider } = useEthereum();
  const [inputAddress, setInputAddress] = useState<string>();
  const { data: tokenMapping, isLoading: loadingTokenMapping } = useQuery({
    queryKey: ['tokenMapping', selectedChainId],
    queryFn: () => getFullTokenMapping(selectedChainId),
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const { data: openSeaProxyAddress, isLoading: loadingOpenSeaProxyAddress } = useQuery({
    queryKey: ['openSeaProxyAddress', inputAddress, selectedChainId],
    queryFn: () => getOpenSeaProxyAddress(inputAddress, readProvider),
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const [settings, setSettings] = useLocalStorage<DashboardSettings>('settings', DEFAULT_SETTINGS);

  // Ensure that new settings are added alongside the old ones if settings are already saved
  useEffect(() => {
    const combinedSettings = { ...DEFAULT_SETTINGS, ...settings };
    if (JSON.stringify(combinedSettings) === JSON.stringify(settings)) return;
    setSettings(combinedSettings);
  }, [settings]);

  const loading = loadingTokenMapping || loadingOpenSeaProxyAddress;

  return (
    <AppContext.Provider
      value={{
        tokenMapping,
        openSeaProxyAddress,
        inputAddress,
        setInputAddress,
        settings,
        setSettings,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
