'use client';

import { Env, FsdSDK } from '@fairside-foundation/sdk';
import { useQuery } from '@tanstack/react-query';
import Loader from 'components/common/Loader';
import { FAIRSIDE_API_KEY } from 'lib/constants';
import { getMembershipInfo } from 'lib/coverage/fairside';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useMounted } from 'lib/hooks/useMounted';
import { useState } from 'react';
import CoverageDetailsCard from './CoverageDetailsCard';
import CoverageInfo from './CoverageInfo';
import WalletDetails from './WalletDetails';

const CoverageDashboard = () => {
  const isMounted = useMounted();
  const { address } = useAddressPageContext();
  const [token, setToken] = useState<string | null>(null);

  const { fsdAPI, fsdContract, fsdConfig } = FsdSDK({
    apiKey: FAIRSIDE_API_KEY ?? '',
    env: Env.MainNet,
  });

  const { data: membershipInfo, isLoading } = useQuery({
    queryKey: ['fairsideMembershipInfo', address],
    queryFn: () => getMembershipInfo(address),
  });

  if (!isMounted || isLoading) {
    return (
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="h-[500px] w-full lg:w-2/3">
          <Loader isLoading={true} className="h-[500px]" />
        </div>
        <div className="h-[500px] w-full lg:w-1/3">
          <Loader isLoading={true} className="h-[500px]" />
        </div>
      </div>
    );
  }

  if (!membershipInfo?.isActive) {
    return <CoverageInfo />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      <div className="flex flex-col w-full lg:w-2/3">
        <CoverageDetailsCard
          coverageAmount={membershipInfo.coverAmount}
          validFrom={membershipInfo.validFrom}
          validUntil={membershipInfo.validUntil}
          claimsCount={membershipInfo.activeClaims.length}
          onIncrease={() => window.open('https://app.fairside.io/', '_blank')}
        />
      </div>
      <div className="w-full lg:w-1/3">
        <WalletDetails
          isAuthenticated={token != null}
          fsdAPI={fsdAPI}
          walletAddress={address}
          token={token}
          setToken={setToken}
        />
      </div>
    </div>
  );
};

export default CoverageDashboard;
