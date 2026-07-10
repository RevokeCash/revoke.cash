'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import type { AutoRevokePermission } from '@revoke.cash/core/auto-revoke/permissions';
import { useGrantAutoRevokePermission } from 'lib/hooks/auto-revoke/useGrantAutoRevokePermission';
import { useRevokeAutoRevokePermission } from 'lib/hooks/auto-revoke/useRevokeAutoRevokePermission';
import { useSyncAutoRevokePermissions } from 'lib/hooks/auto-revoke/useSyncAutoRevokePermissions';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { type Address, isAddressEqual } from 'viem';
import AutoRevokeChainToggle from './AutoRevokeChainToggle';
import AutoRevokePermissionSummary from './AutoRevokePermissionSummary';
import SyncPermissionsButton from './SyncPermissionsButton';

interface Props {
  address: Address;
  connectedAddress: Address;
  permissions: AutoRevokePermission[];
}

const AutoRevokePermissionRow = ({ address, connectedAddress, permissions }: Props) => {
  const t = useTranslations();
  const isConnected = isAddressEqual(address, connectedAddress);
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

  const chainToggles = (
    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 gap-x-4">
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
  );

  // The connected wallet's permissions are the primary action of this section, so they are always
  // expanded; other wallets' permissions are read-only and collapsed behind a disclosure
  if (isConnected) {
    return (
      <div className="py-2">
        <AutoRevokePermissionSummary address={address} grantedCount={grantedCount} totalCount={totalCount} />
        <div className="mt-1">
          {isMetaMask && (
            <div className="flex justify-end mb-2 mt-1">
              <SyncPermissionsButton onSync={syncPermissions} isSyncing={isSyncing} />
            </div>
          )}
          {chainToggles}
        </div>
      </div>
    );
  }

  return (
    <Disclosure as="div" className="py-2">
      {({ open }) => (
        <>
          <DisclosureButton className="flex items-center justify-between gap-2 w-full cursor-pointer">
            <AutoRevokePermissionSummary address={address} grantedCount={grantedCount} totalCount={totalCount} />
            <ChevronDownIcon
              className={twMerge('h-4 w-4 shrink-0 text-zinc-400 transition-transform', open && 'rotate-180')}
            />
          </DisclosureButton>
          <DisclosurePanel className="mt-1">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              {t('account.auto_revoke.permissions.connect_to_manage')}
            </p>
            {chainToggles}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
};

export default AutoRevokePermissionRow;
