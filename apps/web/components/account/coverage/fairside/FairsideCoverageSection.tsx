'use client';

import { useFairsideCoverage } from 'lib/hooks/ethereum/coverage/useFairsideCoverage';
import type { Address } from 'viem';
import AuthenticatedActiveCoverage from './AuthenticatedActiveCoverage';
import CoverageHeader from './CoverageHeader';
import NoActiveCoverage from './NoActiveCoverage';
import UnauthenticatedActiveCoverage from './UnauthenticatedActiveCoverage';

interface Props {
  account: Address;
}

const CoverageSection = ({ account }: Props) => {
  const { isActive, isAuthenticated, membershipInfo, wallets } = useFairsideCoverage(account);

  return (
    <div className="flex flex-col gap-4">
      <CoverageHeader
        isActive={isActive}
        coverAmount={membershipInfo?.coverAmount}
        validUntil={membershipInfo?.validUntil}
      />
      {!isActive ? (
        <NoActiveCoverage />
      ) : isAuthenticated ? (
        <AuthenticatedActiveCoverage wallets={wallets ?? []} />
      ) : (
        <UnauthenticatedActiveCoverage account={account} />
      )}
    </div>
  );
};

export default CoverageSection;
