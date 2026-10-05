'use client';

import type { AddressIndexerState, AddressSubscription } from '@revoke.cash/core/admin/lookup';
import type { AddressRulesConfig } from '@revoke.cash/core/auto-revoke/evaluation/rules';
import type { AutoRevokePermission } from '@revoke.cash/core/auto-revoke/permissions';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminQuery } from 'lib/hooks/admin/useAdminQuery';
import ky from 'lib/ky';
import { toast } from 'react-toastify';
import type { Address } from 'viem';

interface AdminLookupResult {
  subscriptions: AddressSubscription[];
  permissions: AutoRevokePermission[];
  rulesConfig: AddressRulesConfig;
  indexerStates: AddressIndexerState[];
}

export interface OnChainPermissionCheck {
  enabledOnChain: boolean | null;
  accountUpgraded: boolean | null;
}

const getAdminLookupQueryKey = (address: Address) => ['admin', 'lookup', address] as const;

export const useAdminLookup = (address: Address) => {
  return useAdminQuery<AdminLookupResult>(getAdminLookupQueryKey(address), `/api/admin/lookup/${address}`);
};

// Lazy query: the on-chain check only runs when the admin clicks "Check on-chain" for a row
export const useOnChainPermissionCheck = (address: Address, chainId: number) => {
  return useAdminQuery<OnChainPermissionCheck>(
    [...getAdminLookupQueryKey(address), 'onchain', chainId],
    `/api/admin/lookup/${address}/permissions/${chainId}/onchain`,
    { enabled: false },
  );
};

export const useResetAddressIndexing = (address: Address) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ky.post(`/api/admin/indexer/${address}/reset`).json<{ ok: boolean }>(),
    onSuccess: () => {
      toast.success('Indexing reset for this address');
      queryClient.invalidateQueries({ queryKey: getAdminLookupQueryKey(address) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'health'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview', 'health'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error) ?? 'Failed to reset indexing');
    },
  });
};

export const useResetChainIndexing = (chainId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ky.post(`/api/admin/indexer/chain/${chainId}/reset`).json<{ ok: boolean }>(),
    onSuccess: () => {
      toast.success('Indexing reset for this chain');
      // A chain reset touches indexer rows of many addresses, so all cached lookups are stale
      queryClient.invalidateQueries({ queryKey: ['admin', 'lookup'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'health'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview', 'health'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error) ?? 'Failed to reset indexing');
    },
  });
};
