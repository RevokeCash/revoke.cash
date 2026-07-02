import { erc7715ProviderActions } from '@metamask/smart-accounts-kit/actions';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import { buildPermissionRequest, isValidAutoRevokePermission } from '@revoke.cash/core/auto-revoke/permissions';
import { isUserRejectionError } from '@revoke.cash/core/utils/errors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ky from 'lib/ky';
import { useConnection, useConnectorClient } from 'wagmi';

export const useGrantAutoRevokePermission = () => {
  const { connector } = useConnection();
  const { data: connectorClient } = useConnectorClient();
  const queryClient = useQueryClient();

  const isMetaMask = connector?.id === 'io.metamask';

  const mutation = useMutation({
    mutationFn: async (chainId: number) => {
      if (!connectorClient || !isMetaMask) throw new Error('MetaMask not connected');
      if (!AUTO_REVOKE_SUPPORTED_CHAINS.includes(chainId)) throw new Error('Unsupported chain');

      const walletClient = connectorClient.extend(erc7715ProviderActions());

      const grantedPermissions = await walletClient.requestExecutionPermissions([buildPermissionRequest(chainId)]);

      const grantedPermission = grantedPermissions.find((permission) =>
        isValidAutoRevokePermission(permission, connectorClient.account.address),
      );
      if (!grantedPermission) throw new Error('No active permission returned');

      await ky.post('/api/auto-revoke/permissions', {
        json: { chainId, permissionContext: grantedPermission.context },
      });
    },
    onError: (error) => {
      if (!isUserRejectionError(error)) {
        console.error('Failed to grant permission:', error);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-revoke'] });
    },
  });

  return {
    grantPermission: async (chainId: number) => {
      return mutation.mutateAsync(chainId).catch(() => null);
    },
    isGranting: mutation.isPending,
    pendingChainId: mutation.isPending ? mutation.variables : null,
    isMetaMask,
  };
};
