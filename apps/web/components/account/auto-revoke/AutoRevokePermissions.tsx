'use client';

import type { AutoRevokePermission } from 'lib/auto-revoke/types';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';
import AutoRevokePermissionRow from './AutoRevokePermissionRow';

interface Props {
  addresses: Address[];
  connectedAddress: Address;
  permissions: AutoRevokePermission[];
  isAdmin: boolean;
}

const AutoRevokePermissions = ({ addresses, connectedAddress, permissions, isAdmin }: Props) => {
  const t = useTranslations();

  const displayAddresses = isAdmin
    ? addresses
    : addresses.filter((address) => address.toLowerCase() === connectedAddress.toLowerCase());

  return (
    <div>
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
            permissions={permissions.filter((permission) => permission.address.toLowerCase() === address.toLowerCase())}
          />
        ))}
      </div>
    </div>
  );
};

export default AutoRevokePermissions;
