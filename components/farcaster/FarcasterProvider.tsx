'use client';

import type sdk from '@farcaster/miniapp-sdk';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import FarcasterLoadingScreen from './FarcasterLoadingScreen';

type FarcasterSdk = typeof sdk;

interface FarcasterContextValue {
  sdk: FarcasterSdk | null;
  isReady: boolean;
}

const FarcasterContext = createContext<FarcasterContextValue>({
  sdk: null,
  isReady: false,
});

export const useFarcaster = () => useContext(FarcasterContext);

export const FarcasterProvider = ({ children }: { children: ReactNode }) => {
  const [sdkInstance, setSdkInstance] = useState<FarcasterSdk | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const { sdk: farcasterSdk } = await import('@farcaster/miniapp-sdk');

        if (farcasterSdk) {
          setSdkInstance(farcasterSdk);
          await farcasterSdk.actions.ready();
          setIsReady(true);
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        // The app can still work without the SDK (e.g., when accessed directly via browser)
        setIsReady(true);
      }
    };

    initializeSDK();
  }, []);

  return (
    <FarcasterContext.Provider value={{ sdk: sdkInstance, isReady }}>
      {!isReady ? <FarcasterLoadingScreen /> : children}
    </FarcasterContext.Provider>
  );
};
