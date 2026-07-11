import { contracts } from '@metamask/smart-accounts-kit';
import { decodeDelegations } from '@metamask/smart-accounts-kit/utils';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { isUserRejectionError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { waitForTransactionConfirmation } from '@revoke.cash/core/wallet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ky from 'lib/ky';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import type { Address, Hash, Hex } from 'viem';
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

      let transactionHash: Hash | undefined;
      try {
        transactionHash = await contracts.DelegationManager.execute.disableDelegation({
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

      // Delete the permission record as soon as the transaction is submitted so the executor stops
      // using it, but keep the toggle pending until the on-chain disable is confirmed
      await ky.delete(`/api/auto-revoke/permissions/${chainId}`);

      if (transactionHash) {
        const publicClient = createViemPublicClientForChain(chainId);
        const receipt = await waitForTransactionConfirmation(transactionHash, publicClient);
        if (receipt?.status === 'reverted') {
          throw new Error(t('account.auto_revoke.permissions.revoke_transaction_reverted'));
        }
      }
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
