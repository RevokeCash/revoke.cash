'use client';

import { useFairsideCoverage } from 'lib/hooks/ethereum/coverage/useFairsideCoverage';
import type { Address } from 'viem';
import ActiveCoverageHeader from './ActiveCoverageHeader';
import AuthenticatedActiveCoverage from './AuthenticatedActiveCoverage';
import UnauthenticatedActiveCoverage from './UnauthenticatedActiveCoverage';

interface ActiveCoverageProps {
  account: Address;
}

const ActiveCoverage = ({ account }: ActiveCoverageProps) => {
  const { membershipInfo, isAuthenticated, wallets } = useFairsideCoverage(account);

  if (!membershipInfo || !membershipInfo.coverAmount || !membershipInfo.validUntil) return null;

  return (
    <div className="flex flex-col gap-4">
      <ActiveCoverageHeader coverAmount={membershipInfo.coverAmount} validUntil={membershipInfo.validUntil} />
      {isAuthenticated ? (
        <AuthenticatedActiveCoverage wallets={wallets ?? []} />
      ) : (
        <UnauthenticatedActiveCoverage account={account} />
      )}
    </div>
  );
};

export default ActiveCoverage;
