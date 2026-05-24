'use client';

import type { OnUpdate } from '@revoke.cash/core/allowances';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';
import React, { type ReactNode, useContext, useEffect, useMemo } from 'react';
import type { Address } from 'viem';
import { useNameLookup } from '../ethereum/useNameLookup';
import { usePremiumAddressData } from '../ethereum/usePremiumAddressData';
import { type ChainAllowanceData, usePremiumChainAllowanceData } from '../ethereum/usePremiumChainAllowanceData';
import { useTimeMachineAddressData } from '../ethereum/useTimeMachineAddressData';
import { useTimeMachine } from './TimeMachineContext';

export type { ChainAllowanceData, ChainLoadingStatus } from '../ethereum/usePremiumChainAllowanceData';

interface PremiumAddressContext {
  address: Address;
  domainName?: string;
  chainData: ChainAllowanceData[];
  isLoading: boolean;
  onUpdate: OnUpdate;
}

interface Props {
  children: ReactNode;
  address: Address;
  domainName?: string | null;
}

export const PremiumAddressPageContext = React.createContext<PremiumAddressContext>(undefined as any);

export const PremiumAddressPageContextProvider = ({ children, address, domainName }: Props) => {
  const { domainName: resolvedDomainName } = useNameLookup(domainName ? undefined : address);

  const timeMachine = useTimeMachine();

  const currentAddressDataResults = usePremiumAddressData(address, ORDERED_CHAINS);
  const addressDataResults = useTimeMachineAddressData(
    address,
    ORDERED_CHAINS,
    currentAddressDataResults,
    timeMachine.timestamp,
  );

  const { chainData, isLoading, onUpdate } = usePremiumChainAllowanceData({
    address,
    chains: ORDERED_CHAINS,
    currentResults: currentAddressDataResults,
    addressDataResults,
    isHistorical: timeMachine.isActive,
  });

  const oldestEventTimestamp = useMemo(() => {
    const timestamps = chainData.flatMap((chain) => chain.events).map((event) => event.time.timestamp);
    return timestamps.length > 0 ? Math.min(...timestamps) : undefined;
  }, [chainData]);

  useEffect(() => {
    timeMachine.setMetadata({ isLoading, oldestEventTimestamp });
  }, [isLoading, oldestEventTimestamp, timeMachine.setMetadata]);

  return (
    <PremiumAddressPageContext.Provider
      value={{
        address,
        domainName: domainName ?? resolvedDomainName ?? undefined,
        chainData,
        isLoading,
        onUpdate,
      }}
    >
      {children}
    </PremiumAddressPageContext.Provider>
  );
};

export const usePremiumAddressPageContext = () => {
  const context = useContext(PremiumAddressPageContext);
  if (!context) {
    throw new Error('usePremiumAddressPageContext must be used within a PremiumAddressPageContextProvider');
  }
  return context;
};
