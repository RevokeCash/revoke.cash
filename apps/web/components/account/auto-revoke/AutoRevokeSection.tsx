'use client';

import type { PremiumSubscription } from '@revoke.cash/core/premium/subscriptions';
import Card, { CardTitle } from 'components/common/Card';
import NoticeBanner from 'components/common/NoticeBanner';
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
  isPreview?: boolean;
}

const AutoRevokeSection = ({ activeSubscription, account, isPreview = false }: Props) => {
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
  const { effectiveRules, updateRules, isError: hasRulesError } = isAdmin ? subscriptionRules : addressRules;
  const hasError = hasPermissionsError || hasRulesError;

  return (
    <Card
      header={<CardTitle title={t('account.auto_revoke.title')} />}
      isLoading={isLoading}
      className={isLoading ? 'h-48' : undefined}
    >
      {hasError ? (
        <NoticeBanner style="warning">{t('account.auto_revoke.load_failed')}</NoticeBanner>
      ) : (
        <AutoRevokeSectionContent
          account={account}
          addresses={activeSubscription?.addresses ?? [account]}
          permissions={permissions}
          isAdmin={isAdmin}
          addressRules={addressRules}
          effectiveRules={effectiveRules}
          updateRules={updateRules}
          isPreview={isPreview}
        />
      )}
    </Card>
  );
};

export default AutoRevokeSection;
