'use client';

import type { UnmatchedTransfer } from '@revoke.cash/core/premium/unmatched-transfers';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminQuery } from 'lib/hooks/admin/useAdminQuery';
import ky from 'lib/ky';
import { toast } from 'react-toastify';

export const useAdminUnmatchedTransfers = (enabled: boolean) => {
  return useAdminQuery<UnmatchedTransfer[]>(['admin', 'unmatched-transfers'], '/api/admin/unmatched-transfers', {
    enabled,
  });
};

interface DismissUnmatchedTransferParams {
  unmatchedTransferId: string;
  note: string;
}

export const useDismissUnmatchedTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ unmatchedTransferId, note }: DismissUnmatchedTransferParams) =>
      ky
        .post(`/api/admin/unmatched-transfers/${unmatchedTransferId}/dismiss`, { json: { note } })
        .json<{ success: true }>(),
    onSuccess: () => toast.success('Unmatched transfer dismissed'),
    onError: (error) => toast.error(parseErrorMessage(error) || 'Failed to dismiss unmatched transfer'),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'unmatched-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview', 'health'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
};
