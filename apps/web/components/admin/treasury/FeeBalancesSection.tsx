'use client';

import { getFeeRoute } from '@revoke.cash/core/admin/treasury-routes';
import { FEES_ADDRESS } from '@revoke.cash/core/constants';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import Card, { CardTitle } from 'components/common/Card';
import { useAdminTreasury } from 'lib/hooks/admin/useAdminTreasury';
import { useMemo } from 'react';
import TreasuryBalancesTable, { type TreasuryBalanceRow } from './TreasuryBalancesTable';

const FeeBalancesSection = () => {
  const { data, isLoading, error } = useAdminTreasury();

  // Chains that hold nothing are left out: with this many supported mainnets, only the ones that still hold a
  // balance (or could not be read at all) are relevant for reconciliation
  const rows = useMemo(() => {
    const nativeBalances = data?.nativeBalances ?? [];

    return nativeBalances
      .filter((nativeBalance) => nativeBalance.balance === null || BigInt(nativeBalance.balance) > 0n)
      .map(
        (nativeBalance): TreasuryBalanceRow => ({
          id: String(nativeBalance.chainId),
          chainId: nativeBalance.chainId,
          tokenSymbol: nativeBalance.nativeToken,
          decimals: nativeBalance.decimals,
          balance: nativeBalance.balance,
          priceUsd: nativeBalance.priceUsd,
          balanceUsd: nativeBalance.balanceUsd,
          route: getFeeRoute(nativeBalance.chainId),
        }),
      )
      .sort((a, b) => (b.balanceUsd ?? -1) - (a.balanceUsd ?? -1));
  }, [data]);

  const checkedChainCount = data?.nativeBalances.length ?? 0;
  const unreadableChainCount =
    data?.nativeBalances.filter((nativeBalance) => nativeBalance.balance === null).length ?? 0;

  return (
    <Card
      header={
        <CardTitle
          title="Batch revoke fee balances"
          subtitle={`Native token balances of fees.revoke.eth (${shortenAddress(FEES_ADDRESS, 6)}) on every supported mainnet`}
        />
      }
      className="p-0"
    >
      <TreasuryBalancesTable
        rows={rows}
        isLoading={isLoading}
        error={error}
        emptyChildren="No fee balances left on any supported chain"
      />
      {unreadableChainCount > 0 && (
        <div className="px-4 py-2 text-xs text-zinc-500">
          {unreadableChainCount} of {checkedChainCount} chains could not be read and are excluded from the total
        </div>
      )}
    </Card>
  );
};

export default FeeBalancesSection;
