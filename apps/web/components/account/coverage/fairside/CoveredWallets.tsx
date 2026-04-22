'use client';

import AddressRow from 'components/account/AddressRow';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';

interface CoveredWalletsProps {
  wallets: Address[];
}

const CoveredWallets = ({ wallets }: CoveredWalletsProps) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t('account.coverage.fairside.covered_wallets')}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{wallets.length} / 10</span>
      </div>
      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {wallets.map((address) => (
          <AddressRow key={address} address={address} />
        ))}
      </div>
    </div>
  );
};

export default CoveredWallets;
