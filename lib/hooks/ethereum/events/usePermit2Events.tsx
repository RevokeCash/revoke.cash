import { PERMIT2_ABI } from 'lib/abis';
import { addressToTopic } from 'lib/utils';
import { useMemo } from 'react';
import { type Address, getAbiItem, toEventSelector } from 'viem';
import { useLogsFullBlockRange } from '../useLogsFullBlockRange';

export const usePermit2Events = (address: Address, chainId: number) => {
  const getPermit2EventSelector = (eventName: 'Permit' | 'Approval' | 'Lockdown') => {
    return toEventSelector(getAbiItem({ abi: PERMIT2_ABI, name: eventName }));
  };

  const addressTopic = address ? addressToTopic(address) : undefined;

  const approvalTopics = addressTopic && [getPermit2EventSelector('Approval'), addressTopic];
  const permitTopics = addressTopic && [getPermit2EventSelector('Permit'), addressTopic];
  const lockdownTopics = addressTopic && [getPermit2EventSelector('Lockdown'), addressTopic];

  const {
    data: approval,
    isLoading: isApprovalLoading,
    error: approvalError,
  } = useLogsFullBlockRange('Permit2 Approval', chainId, {
    topics: approvalTopics,
  });

  const {
    data: permit,
    isLoading: isPermitLoading,
    error: permitError,
  } = useLogsFullBlockRange('Permit2 Permit', chainId, {
    topics: permitTopics,
  });

  const {
    data: lockdown,
    isLoading: isLockdownLoading,
    error: lockdownError,
  } = useLogsFullBlockRange('Permit2 Lockdown', chainId, {
    topics: lockdownTopics,
  });

  const isLoading = isPermitLoading || isApprovalLoading || isLockdownLoading;
  const error = permitError || approvalError || lockdownError;

  const events = useMemo(() => {
    if (!permit || !approval || !lockdown) return undefined;
    if (error || isLoading) return undefined;
    return [...approval, ...permit, ...lockdown];
  }, [permit, approval, lockdown]);

  return { events, isLoading, error };
};
