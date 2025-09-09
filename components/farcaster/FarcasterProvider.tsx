'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface FarcasterSDK {
  actions: {
    ready: (params?: { disableNativeGestures?: boolean }) => Promise<void>;
    composeCast: (params?: {
      text?: string;
      embeds?: [] | [string] | [string, string];
      channelKey?: string;
      parent?: string;
      close?: boolean;
    }) => Promise<{ cast: { hash: string; channel?: string } | null }>;
    openMiniApp: (url: string) => Promise<void>;
    addMiniApp: (url: string) => Promise<void>;
  };
  context: {
    user?: {
      fid: number;
      username?: string;
      displayName?: string;
      pfpUrl?: string;
    };
    location?: {
      type: string;
    };
    client?: {
      platform: 'web' | 'mobile';
      fid: number;
      added: boolean;
    };
  };
  wallet?: {
    getEthereumProvider: () => any;
  };
}

interface FarcasterContextValue {
  sdk: any | null;
  isReady: boolean;
}

const FarcasterContext = createContext<FarcasterContextValue>({
  sdk: null,
  isReady: false,
});

export const useFarcaster = () => useContext(FarcasterContext);

interface FarcasterProviderProps {
  children: ReactNode;
}

export const FarcasterProvider = ({ children }: FarcasterProviderProps) => {
  const [sdk, setSdk] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Dynamically import the SDK to avoid SSR issues
        const { sdk: farcasterSdk } = await import('@farcaster/miniapp-sdk');

        if (farcasterSdk) {
          setSdk(farcasterSdk);

          // Call ready to hide the splash screen
          await farcasterSdk.actions.ready();
          setIsReady(true);
          console.log('Farcaster SDK initialized');
        }
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        // The app can still work without the SDK (e.g., when accessed directly via browser)
        setIsReady(true);
      }
    };

    initializeSDK();
  }, []);

  return <FarcasterContext.Provider value={{ sdk, isReady }}>{children}</FarcasterContext.Provider>;
};
