import { PERMIT2_ABI } from 'lib/abis';
import { addressToTopic } from 'lib/utils';
import { PERMIT2_ADDRESS } from 'lib/utils/permit2';
import { useMemo } from 'react';
import { Address, getAbiItem, getEventSelector } from 'viem';
import { useBlockNumber } from '../useBlockNumber';
import { useLogs } from '../useLogs';

export const usePermit2Events = (address: Address, chainId: number) => {
  const { data: blockNumber, isLoading: isBlockNumberLoading, error: blockNumberError } = useBlockNumber(chainId);

  const getPermit2EventSelector = (eventName: 'Permit' | 'Approval' | 'Lockdown') => {
    return getEventSelector(getAbiItem({ abi: PERMIT2_ABI, name: eventName }));
  };

  const addressTopic = address ? addressToTopic(address) : undefined;

  const approvalTopics = addressTopic && [getPermit2EventSelector('Approval'), addressTopic];
  const permitTopics = addressTopic && [getPermit2EventSelector('Permit'), addressTopic];
  const lockdownTopics = addressTopic && [getPermit2EventSelector('Lockdown'), addressTopic];

  const baseFilter = { address: PERMIT2_ADDRESS, fromBlock: 0, toBlock: blockNumber };

  const {
    data: approval,
    isLoading: isApprovalLoading,
    error: approvalError,
  } = useLogs('Permit2 Approval', chainId, { ...baseFilter, topics: approvalTopics });

  const {
    data: permit,
    isLoading: isPermitLoading,
    error: permitError,
  } = useLogs('Permit2 Permit', chainId, { ...baseFilter, topics: permitTopics });

  const {
    data: lockdown,
    isLoading: isLockdownLoading,
    error: lockdownError,
  } = useLogs('Permit2 Lockdown', chainId, { ...baseFilter, topics: lockdownTopics });

  const isEventsLoading = isPermitLoading || isApprovalLoading || isLockdownLoading;
  const isLoading = isBlockNumberLoading || isEventsLoading;
  const error = blockNumberError || permitError || approvalError || lockdownError;

  const events = useMemo(() => {
    if (!permit || !approval || !lockdown) return undefined;
    if (error || isLoading) return undefined;
    return [...approval, ...permit, ...lockdown];
  }, [permit, approval, lockdown]);

  return { events, isLoading, error };
};
