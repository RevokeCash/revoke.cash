'use client';

import { usePathname } from 'lib/i18n/navigation';
import { useParams } from 'next/navigation';
import React, { type ReactNode, useContext, useEffect, useState } from 'react';

interface TimeMachineMetadata {
  isLoading: boolean;
  oldestEventTimestamp: number | undefined;
}

export interface TimeMachineState extends TimeMachineMetadata {
  timestamp: number | undefined;
  setTimestamp: (timestamp: number | undefined) => void;
  isActive: boolean;
  setMetadata: (metadata: TimeMachineMetadata) => void;
}

const TimeMachineContext = React.createContext<TimeMachineState>(undefined as any);

export const TimeMachineProvider = ({ children }: { children: ReactNode }) => {
  const [rawTimestamp, setTimestamp] = useState<number | undefined>(undefined);
  const [metadata, setMetadata] = useState<TimeMachineMetadata>({
    isLoading: false,
    oldestEventTimestamp: undefined,
  });

  // Auto-disable time machine when navigating away from the allowances tab — the allowances
  // dashboard is the only surface that respects it, so leaving the tab implicitly exits.
  const { addressOrName } = useParams<{ addressOrName: string }>();
  const path = usePathname();
  const isAllowancesTab = path?.endsWith(`/address/${addressOrName}`);
  const timestamp = isAllowancesTab ? rawTimestamp : undefined;
  const isActive = timestamp !== undefined;

  useEffect(() => {
    if (!isAllowancesTab) setTimestamp(undefined);
  }, [isAllowancesTab]);

  return (
    <TimeMachineContext.Provider
      value={{
        timestamp,
        setTimestamp,
        isActive,
        ...metadata,
        setMetadata,
      }}
    >
      {children}
    </TimeMachineContext.Provider>
  );
};

export const useTimeMachine = (): TimeMachineState => {
  const ctx = useContext(TimeMachineContext);
  if (!ctx) throw new Error('useTimeMachine must be used within a TimeMachineProvider');

  return ctx;
};
