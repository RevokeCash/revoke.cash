'use client';

import type { Address } from 'viem';
import CoveredWallets from './CoveredWallets';
import ManageCoverageButton from './ManageCoverageButton';

interface AuthenticatedActiveCoverageProps {
  wallets: Address[];
}

const AuthenticatedActiveCoverage = ({ wallets }: AuthenticatedActiveCoverageProps) => {
  return (
    <>
      <CoveredWallets wallets={wallets} />
      <div className="flex items-center gap-2">
        <ManageCoverageButton />
      </div>
    </>
  );
};

export default AuthenticatedActiveCoverage;
