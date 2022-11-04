import { DashboardSettings, StateSetter, TokenMapping } from 'lib/interfaces';
import { getOpenSeaProxyAddress } from 'lib/utils/erc721';
import { getFullTokenMapping } from 'lib/utils/tokens';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { useAsync } from 'react-async-hook';
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
}

const AppContext = React.createContext<AppContext>({});

interface Props {
  children: ReactNode;
}

// TODO: Do we need to export a "loading" variable to indicate the loading of the async parts?
export const AppContextProvider = ({ children }: Props) => {
  const { selectedChainId, readProvider } = useEthereum();
  const [inputAddress, setInputAddress] = useState<string>();
  const { result: tokenMapping } = useAsync(getFullTokenMapping, [selectedChainId]);

  const { result: openSeaProxyAddress } = useAsync(
    () => getOpenSeaProxyAddress(inputAddress, readProvider),
    [inputAddress, selectedChainId]
  );

  const [settings, setSettings] = useLocalStorage<DashboardSettings>('settings', DEFAULT_SETTINGS);

  // Ensure that new settings are added alongside the old ones if settings are already saved
  useEffect(() => {
    const combinedSettings = { ...DEFAULT_SETTINGS, ...settings };
    if (JSON.stringify(combinedSettings) === JSON.stringify(settings)) return;
    setSettings(combinedSettings);
  }, [settings]);

  return (
    <AppContext.Provider
      value={{
        tokenMapping,
        openSeaProxyAddress,
        inputAddress,
        setInputAddress,
        settings,
        setSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
