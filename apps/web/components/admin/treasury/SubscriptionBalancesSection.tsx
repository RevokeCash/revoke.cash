'use client';

import { getSubscriptionRoute } from '@revoke.cash/core/admin/treasury-routes';
import { SUBSCRIPTIONS_ADDRESS } from '@revoke.cash/core/constants';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import Card, { CardTitle } from 'components/common/Card';
import { useAdminTreasury } from 'lib/hooks/admin/useAdminTreasury';
import { useMemo } from 'react';
import TreasuryBalancesTable, { type TreasuryBalanceRow } from './TreasuryBalancesTable';

const SubscriptionBalancesSection = () => {
  const { data, isLoading, error } = useAdminTreasury();

  // Chains and tokens that hold nothing are left out, so only balances that can be moved are listed
  const rows = useMemo(() => {
    const tokenBalances = data?.tokenBalances ?? [];

    return tokenBalances
      .filter((tokenBalance) => tokenBalance.balance === null || BigInt(tokenBalance.balance) > 0n)
      .map(
        (tokenBalance): TreasuryBalanceRow => ({
          id: `${tokenBalance.chainId}-${tokenBalance.tokenSymbol}`,
          chainId: tokenBalance.chainId,
          tokenSymbol: tokenBalance.tokenSymbol,
          decimals: tokenBalance.decimals,
          balance: tokenBalance.balance,
          priceUsd: tokenBalance.priceUsd,
          balanceUsd: tokenBalance.balanceUsd,
          route: getSubscriptionRoute(tokenBalance.chainId, tokenBalance.tokenSymbol),
          missingGasToken: tokenBalance.hasEnoughGas === false ? tokenBalance.nativeToken : undefined,
        }),
      );
  }, [data]);

  return (
    <Card
      header={
        <CardTitle
          title="Subscription balances"
          subtitle={`USDC and USDT balances of subscriptions.revoke.eth (${shortenAddress(SUBSCRIPTIONS_ADDRESS, 6)}) on the premium payment chains`}
        />
      }
      className="p-0"
    >
      <TreasuryBalancesTable
        rows={rows}
        isLoading={isLoading}
        error={error}
        emptyChildren="No subscription balances on any payment chain"
      />
    </Card>
  );
};

export default SubscriptionBalancesSection;
