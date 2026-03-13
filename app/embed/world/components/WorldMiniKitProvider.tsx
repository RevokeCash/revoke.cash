'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { type ReactNode, useEffect } from 'react';

interface Props {
  children: ReactNode;
}

const WorldMiniKitProvider = ({ children }: Props) => {
  useEffect(() => {
    MiniKit.install(process.env.NEXT_PUBLIC_WORLD_APP_ID);
  }, []);

  return children;
};

export default WorldMiniKitProvider;
