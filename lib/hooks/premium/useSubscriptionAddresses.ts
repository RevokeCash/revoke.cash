import { useMutation, useQueryClient } from '@tanstack/react-query';
import ky from 'lib/ky';
import { parseErrorMessage } from 'lib/utils/errors';
import { useState } from 'react';
import { toast } from 'react-toastify';
import type { Address } from 'viem';
import { getSubscriptionsQueryKey } from './usePremiumSubscriptions';

export const useSubscriptionAddresses = (ownerAddress: Address) => {
  const queryClient = useQueryClient();
  const [addressInputs, setAddressInputs] = useState<Record<string, string>>({});

  const addAddressMutation = useMutation({
    mutationFn: async ({ subscriptionId, address }: { subscriptionId: string; address: string }) => {
      return ky
        .post(`/api/premium/subscriptions/${subscriptionId}/addresses`, { json: { address } })
        .json<{ ok: boolean }>();
    },
    onSuccess: (_, variables) => {
      setAddressInputs((prev) => ({ ...prev, [variables.subscriptionId]: '' }));
      queryClient.invalidateQueries({ queryKey: getSubscriptionsQueryKey(ownerAddress) });
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error) || 'Failed to add address');
    },
  });

  const removeAddressMutation = useMutation({
    mutationFn: async ({ subscriptionId, address }: { subscriptionId: string; address: string }) => {
      return ky
        .delete(`/api/premium/subscriptions/${subscriptionId}/addresses/${encodeURIComponent(address)}`)
        .json<{ ok: boolean }>();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getSubscriptionsQueryKey(ownerAddress) });
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error) || 'Failed to remove address');
    },
  });

  return {
    addressInputs,
    setAddressInput: (subscriptionId: string, value: string) => {
      setAddressInputs((prev) => ({ ...prev, [subscriptionId]: value }));
    },
    addAddress: addAddressMutation.mutate,
    isAddingAddress: addAddressMutation.isPending,
    removeAddress: removeAddressMutation.mutate,
    isRemovingAddress: removeAddressMutation.isPending,
  };
};
