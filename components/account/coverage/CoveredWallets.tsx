'use client';

import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';

interface CoveredWalletsProps {
  wallets: Address[];
}

const CoveredWallets = ({ wallets }: CoveredWalletsProps) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.coverage.covered_wallets')}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{wallets.length} / 10</span>
      </div>
      <div className="flex flex-col gap-2">
        {wallets.map((address) => (
          <CoveredWalletRow key={address} address={address} />
        ))}
      </div>
    </div>
  );
};

const CoveredWalletRow = ({ address }: { address: Address }) => {
  const { domainName } = useNameLookup(address);

  return (
    <div className="flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm min-w-0">
      {domainName && <span className="font-bold shrink-0">{domainName}</span>}
      <span className="font-mono text-zinc-500 dark:text-zinc-400 truncate">{address}</span>
    </div>
  );
};

export default CoveredWallets;
