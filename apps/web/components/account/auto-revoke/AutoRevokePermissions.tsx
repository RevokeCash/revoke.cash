'use client';

import type { AutoRevokePermission } from '@revoke.cash/core/auto-revoke/permissions';
import { useTranslations } from 'next-intl';
import { type Address, isAddressEqual } from 'viem';
import AutoRevokePermissionRow from './AutoRevokePermissionRow';

interface Props {
  addresses: Address[];
  connectedAddress: Address;
  permissions: AutoRevokePermission[];
  isAdmin: boolean;
}

const AutoRevokePermissions = ({ addresses, connectedAddress, permissions, isAdmin }: Props) => {
  const t = useTranslations();

  const otherAddresses = addresses.filter((address) => !isAddressEqual(address, connectedAddress));
  const displayAddresses = isAdmin ? [connectedAddress, ...otherAddresses] : [connectedAddress];

  return (
    <div className="min-w-0">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        {t('account.auto_revoke.permissions.title')}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
        {t('account.auto_revoke.permissions.grant_description')}
      </p>
      <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {displayAddresses.map((address) => (
          <AutoRevokePermissionRow
            key={address}
            address={address}
            connectedAddress={connectedAddress}
            permissions={permissions.filter((permission) => isAddressEqual(permission.address, address))}
          />
        ))}
      </div>
    </div>
  );
};

export default AutoRevokePermissions;
