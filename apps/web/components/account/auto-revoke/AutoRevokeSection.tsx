'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { PremiumSubscription } from '@revoke.cash/core/premium/subscriptions';
import Card, { CardTitle } from 'components/common/Card';
import {
  useAddressAutoRevokePermissions,
  useSubscriptionAutoRevokePermissions,
} from 'lib/hooks/auto-revoke/useAutoRevokePermissions';
import { useAddressAutoRevokeRules, useSubscriptionAutoRevokeRules } from 'lib/hooks/auto-revoke/useAutoRevokeRules';
import { useTranslations } from 'next-intl';
import { type Address, isAddressEqual } from 'viem';
import AutoRevokeSectionContent from './AutoRevokeSectionContent';

interface Props {
  activeSubscription?: PremiumSubscription;
  account: Address;
}

const AutoRevokeSection = ({ activeSubscription, account }: Props) => {
  const t = useTranslations();
  const isAdmin = Boolean(activeSubscription && isAddressEqual(account, activeSubscription.ownerAddress));

  const subscriptionPermissions = useSubscriptionAutoRevokePermissions(activeSubscription?.id, isAdmin);
  const addressPermissions = useAddressAutoRevokePermissions(account, !isAdmin);

  const subscriptionRules = useSubscriptionAutoRevokeRules(activeSubscription?.id, isAdmin);
  const addressRules = useAddressAutoRevokeRules(account, !isAdmin);

  const isAdminLoading = isAdmin && (subscriptionPermissions.isLoading || subscriptionRules.isLoading);
  const isUserLoading = !isAdmin && (addressPermissions.isLoading || addressRules.isLoading);
  const isLoading = isAdminLoading || isUserLoading;

  const { permissions, isError: hasPermissionsError } = isAdmin ? subscriptionPermissions : addressPermissions;
  const { effectiveRules, updateRules } = isAdmin ? subscriptionRules : addressRules;

  return (
    <Card
      header={<CardTitle title={t('account.auto_revoke.title')} />}
      isLoading={isLoading}
      className={isLoading ? 'h-48' : undefined}
    >
      {hasPermissionsError ? (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-yellow-500" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.auto_revoke.load_failed')}</p>
        </div>
      ) : (
        <AutoRevokeSectionContent
          account={account}
          addresses={activeSubscription?.addresses ?? [account]}
          permissions={permissions}
          isAdmin={isAdmin}
          addressRules={addressRules}
          effectiveRules={effectiveRules}
          updateRules={updateRules}
        />
      )}
    </Card>
  );
};

export default AutoRevokeSection;
