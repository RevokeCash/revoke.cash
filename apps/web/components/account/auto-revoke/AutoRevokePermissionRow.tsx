'use client';

import { Disclosure } from '@headlessui/react';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import type { AutoRevokePermission } from '@revoke.cash/core/auto-revoke/permissions';
import { useGrantAutoRevokePermission } from 'lib/hooks/auto-revoke/useGrantAutoRevokePermission';
import { useRevokeAutoRevokePermission } from 'lib/hooks/auto-revoke/useRevokeAutoRevokePermission';
import { useSyncAutoRevokePermissions } from 'lib/hooks/auto-revoke/useSyncAutoRevokePermissions';
import type { Address } from 'viem';
import AutoRevokeChainToggle from './AutoRevokeChainToggle';
import AutoRevokePermissionSummary from './AutoRevokePermissionSummary';
import SyncPermissionsButton from './SyncPermissionsButton';

interface Props {
  address: Address;
  connectedAddress: Address;
  permissions: AutoRevokePermission[];
}

const AutoRevokePermissionRow = ({ address, connectedAddress, permissions }: Props) => {
  const isConnected = address.toLowerCase() === connectedAddress.toLowerCase();
  const activePermissions = permissions.filter((permission) => permission.isActive);
  const grantedCount = activePermissions.length;
  const totalCount = AUTO_REVOKE_SUPPORTED_CHAINS.length;

  const { grantPermission, isGranting, pendingChainId: grantingChainId } = useGrantAutoRevokePermission();
  const { revokePermission, isRevoking, pendingChainId: revokingChainId } = useRevokeAutoRevokePermission();
  const { syncPermissions, isSyncing, isMetaMask } = useSyncAutoRevokePermissions();

  const isPending = isGranting || isRevoking || isSyncing;
  const pendingChainId = grantingChainId ?? revokingChainId;

  const handleToggleChain = (chainId: number, enable: boolean) => {
    if (enable) {
      grantPermission(chainId);
    } else {
      const permission = activePermissions.find((permission) => permission.chainId === chainId);
      if (!permission) return;
      revokePermission(permission.permissionContext, permission.delegationManager, chainId);
    }
  };

  return (
    <Disclosure as="div" className="py-2">
      {({ open }) => (
        <>
          <Disclosure.Button className="flex items-center justify-between gap-2 w-full cursor-pointer">
            <AutoRevokePermissionSummary
              address={address}
              grantedCount={grantedCount}
              totalCount={totalCount}
              open={open}
            />
          </Disclosure.Button>
          <Disclosure.Panel className="mt-1">
            {isConnected && isMetaMask && (
              <div className="flex justify-end mb-2 mt-1">
                <SyncPermissionsButton onSync={syncPermissions} isSyncing={isSyncing} />
              </div>
            )}
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4">
              {AUTO_REVOKE_SUPPORTED_CHAINS.map((chainId) => (
                <AutoRevokeChainToggle
                  key={chainId}
                  chainId={chainId}
                  isGranted={activePermissions.some((permission) => permission.chainId === chainId)}
                  isConnected={isConnected}
                  isPending={isPending}
                  isPendingForThisChain={pendingChainId === chainId}
                  onToggle={(enabled) => handleToggleChain(chainId, enabled)}
                />
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default AutoRevokePermissionRow;
