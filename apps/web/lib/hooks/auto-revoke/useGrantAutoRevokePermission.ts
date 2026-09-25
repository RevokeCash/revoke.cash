import {
  erc7715ProviderActions,
  type RequestExecutionPermissionsReturnType,
} from '@metamask/smart-accounts-kit/actions';
import { isAutoRevokeSupportedChain } from '@revoke.cash/core/auto-revoke/config';
import {
  buildPermissionRequest,
  getPermissionDelegator,
  isAutoRevokePermission,
  isValidAutoRevokePermission,
} from '@revoke.cash/core/auto-revoke/permissions';
import { isUserRejectionError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ky from 'lib/ky';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { type Address, isAddressEqual } from 'viem';
import { useConnectorClient } from 'wagmi';
import { useEnsureWalletClient } from '../ethereum/ensureWalletClient';
import { getSupportErrorKey, useAutoRevokeSupport } from './useAutoRevokeSupport';

export const useGrantAutoRevokePermission = () => {
  const t = useTranslations();
  const { data: connectorClient } = useConnectorClient();
  const { ensureWalletClient } = useEnsureWalletClient();
  const { supportsAutoRevoke, supportStatus, isLoading: isLoadingSupport } = useAutoRevokeSupport();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (chainId: number) => {
      if (!connectorClient || isLoadingSupport || !supportsAutoRevoke) {
        throw new Error(t(getSupportErrorKey(supportStatus)));
      }
      if (!isAutoRevokeSupportedChain(chainId)) throw new Error('Unsupported chain');

      const connectedAddress = connectorClient.account.address;
      const walletClient = (await ensureWalletClient(chainId)).extend(erc7715ProviderActions());

      const grantedPermissions = await walletClient.requestExecutionPermissions([
        buildPermissionRequest(chainId, connectedAddress),
      ]);

      const grantedPermission = grantedPermissions.find((permission) =>
        isValidAutoRevokePermission(permission, connectedAddress),
      );

      if (!grantedPermission) {
        const otherGrantingAccount = findOtherGrantingAccount(grantedPermissions, connectedAddress);
        if (otherGrantingAccount) {
          throw new Error(
            t('account.auto_revoke.permissions.granted_from_other_account', {
              grantedAddress: shortenAddress(otherGrantingAccount),
              connectedAddress: shortenAddress(connectedAddress),
            }),
          );
        }
        throw new Error(t('account.auto_revoke.permissions.no_active_permission_returned'));
      }

      await ky.post('/api/auto-revoke/permissions', {
        json: { chainId, permissionContext: grantedPermission.context },
      });
    },
    onError: (error) => {
      if (isUserRejectionError(error)) return;
      console.error('Failed to grant permission:', error);
      toast.error(parseErrorMessage(error) || t('account.auto_revoke.permissions.grant_failed'));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['auto-revoke'] }),
  });

  return {
    grantPermission: async (chainId: number) => {
      return mutation.mutateAsync(chainId).catch(() => null);
    },
    isGranting: mutation.isPending,
    pendingChainId: mutation.isPending ? mutation.variables : null,
    supportsAutoRevoke,
  };
};

// MetaMask lets the user change the granting account in its permission dialog, so a well-formed permission can come
// back signed by an account other than the connected one.
const findOtherGrantingAccount = (
  permissions: RequestExecutionPermissionsReturnType,
  connectedAddress: Address,
): Address | null => {
  const delegators = permissions.filter(isAutoRevokePermission).map(getPermissionDelegator);
  return delegators.find((delegator) => delegator && !isAddressEqual(delegator, connectedAddress)) ?? null;
};
