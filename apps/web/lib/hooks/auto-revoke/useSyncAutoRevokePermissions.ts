'use client';

import { erc7715ProviderActions } from '@metamask/smart-accounts-kit/actions';
import { filterActivePermissions } from '@revoke.cash/core/auto-revoke/permissions';
import { deduplicateArray } from '@revoke.cash/core/utils';
import { isUserRejectionError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ky from 'lib/ky';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { useConnection, useConnectorClient } from 'wagmi';

export const useSyncAutoRevokePermissions = () => {
  const t = useTranslations();
  const { connector } = useConnection();
  const { data: connectorClient } = useConnectorClient();
  const queryClient = useQueryClient();

  const isMetaMask = connector?.id === 'io.metamask';

  const mutation = useMutation({
    mutationFn: async () => {
      if (!connectorClient || !isMetaMask) throw new Error('MetaMask not connected');

      const walletClient = connectorClient.extend(erc7715ProviderActions());

      // MetaMask returns permissions across every account in the wallet — scope to the connected one.
      const allPermissions = await walletClient.getGrantedExecutionPermissions();
      const activePermissions = await filterActivePermissions(allPermissions, connectorClient.account.address);

      // MetaMask can return more than one still-enabled permission for the same chain
      // (e.g. an old grant and a newer re-grant). `filterActivePermissions` returns
      // newest-first, so dedupe-by-chainId keeps the most recent for each chain.
      const uniquePerChain = deduplicateArray(activePermissions, (permission) => String(permission.chainId));

      const results = uniquePerChain.map((permission) => ({
        chainId: permission.chainId,
        permissionContext: permission.context,
      }));

      await ky.post('/api/auto-revoke/permissions/sync', { json: { permissions: results } });

      return results;
    },
    onSuccess: () => {
      toast.success(t('account.auto_revoke.permissions.sync_success'));
    },
    onError: (error) => {
      if (isUserRejectionError(error)) return;
      console.error('Failed to sync permissions:', error);
      toast.error(parseErrorMessage(error) || t('account.auto_revoke.permissions.sync_failed'));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['auto-revoke'] }),
  });

  return {
    syncPermissions: () => mutation.mutateAsync().catch(() => []),
    isSyncing: mutation.isPending,
    isMetaMask,
  };
};
