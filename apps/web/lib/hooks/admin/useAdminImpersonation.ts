'use client';

import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { useMutation } from '@tanstack/react-query';
import ky from 'lib/ky';
import { toast } from 'react-toastify';
import type { Address } from 'viem';

// Impersonation lives in the server-side session, and the admin dashboard and the user-facing site are
// separate root layouts, so callers follow a successful mutation with a full page navigation
export const useStartImpersonation = () => {
  return useMutation({
    mutationFn: (address: Address) =>
      ky.post('/api/admin/impersonation', { json: { address } }).json<{ ok: boolean }>(),
    onError: (error) => {
      toast.error(parseErrorMessage(error) || 'Failed to start impersonation');
    },
  });
};

export const useStopImpersonation = () => {
  return useMutation({
    mutationFn: () => ky.delete('/api/admin/impersonation').json<{ ok: boolean }>(),
    onError: (error) => {
      toast.error(parseErrorMessage(error) || 'Failed to stop impersonation');
    },
  });
};
