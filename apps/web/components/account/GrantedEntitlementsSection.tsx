'use client';

import type { PremiumEntitlement } from '@revoke.cash/core/premium/types';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import Card, { CardTitle } from 'components/common/Card';
import StatusLabel from 'components/common/StatusLabel';
import { useTranslations } from 'next-intl';

interface Props {
  entitlements: PremiumEntitlement[];
}

const GrantedEntitlementsSection = ({ entitlements }: Props) => {
  const t = useTranslations();

  return (
    <Card header={<CardTitle title={t('account.granted.title')} />} className="flex flex-col gap-2">
      {entitlements.map((entitlement) => (
        <div
          key={entitlement.ownerAddress}
          className="flex flex-col gap-2 rounded-md bg-zinc-100 dark:bg-zinc-800/50 p-4 border border-transparent dark:border-zinc-700"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{entitlement.planName}</span>
            <StatusLabel status="success">{t('account.granted.active')}</StatusLabel>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('account.granted.granted_by', {
              address: shortenAddress(entitlement.ownerAddress, 4),
              date: entitlement.endsAt.slice(0, 10),
            })}
          </p>
        </div>
      ))}
    </Card>
  );
};

export default GrantedEntitlementsSection;
