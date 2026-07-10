import { contracts } from '@metamask/smart-accounts-kit';
import { decodeDelegations } from '@metamask/smart-accounts-kit/utils';
import { isUserRejectionError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ky from 'lib/ky';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import type { Address, Hex } from 'viem';
import { useConnection } from 'wagmi';
import { useEnsureWalletClient } from '../ethereum/ensureWalletClient';

interface RevokePermissionParams {
  permissionContext: Hex;
  delegationManagerAddress: Address;
  chainId: number;
}

export const useRevokeAutoRevokePermission = () => {
  const t = useTranslations();
  const { connector } = useConnection();
  const { ensureWalletClient } = useEnsureWalletClient();
  const queryClient = useQueryClient();

  const isMetaMask = connector?.id === 'io.metamask';

  const mutation = useMutation({
    mutationFn: async ({ permissionContext, delegationManagerAddress, chainId }: RevokePermissionParams) => {
      if (!isMetaMask) throw new Error(t('account.auto_revoke.metamask_not_connected'));

      const walletClient = await ensureWalletClient(chainId);

      const decodedPermission = decodeDelegations(permissionContext)?.[0];
      if (!decodedPermission) throw new Error(t('account.auto_revoke.permissions.decode_failed'));

      try {
        await contracts.DelegationManager.execute.disableDelegation({
          client: walletClient,
          delegationManagerAddress,
          delegation: decodedPermission,
        });
      } catch (error) {
        const message = parseErrorMessage(error);
        if (message.includes('AlreadyDisabled')) {
          console.log('Permission already disabled on-chain, skipping');
        } else {
          throw error;
        }
      }

      await ky.delete(`/api/auto-revoke/permissions/${chainId}`);
    },
    onError: (error) => {
      if (isUserRejectionError(error)) return;
      console.error('Failed to revoke permission:', error);
      toast.error(parseErrorMessage(error) || t('account.auto_revoke.permissions.revoke_failed'));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['auto-revoke'] }),
  });

  return {
    revokePermission: async (permissionContext: Hex, delegationManagerAddress: Address, chainId: number) => {
      return mutation.mutateAsync({ permissionContext, delegationManagerAddress, chainId }).catch(() => null);
    },
    isRevoking: mutation.isPending,
    pendingChainId: mutation.isPending ? (mutation.variables?.chainId ?? null) : null,
    isMetaMask,
  };
};
