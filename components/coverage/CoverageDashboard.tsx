'use client';

import { useQuery } from '@tanstack/react-query';
import Loader from 'components/common/Loader';
import { getMembershipInfo } from 'lib/coverage/fairside';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useMounted } from 'lib/hooks/useMounted';
import CoverageDetailsCard from './CoverageDetailsCard';
import CoverageInfo from './CoverageInfo';
import WalletDetailsCard from './WalletDetails';

const CoverageDashboard = () => {
  const isMounted = useMounted();
  const { address } = useAddressPageContext();

  const { data: membershipInfo, isLoading } = useQuery({
    queryKey: ['fairsideMembershipInfo', address],
    queryFn: () => getMembershipInfo({ walletAddress: address }),
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
    <div className="flex flex-col items-start lg:flex-row gap-2">
      <div className="flex flex-col w-full lg:w-2/3">
        <CoverageDetailsCard membershipInfo={membershipInfo} />
      </div>
      <div className="w-full lg:w-1/3">
        <WalletDetailsCard walletAddress={address} />
      </div>
    </div>
  );
};

export default CoverageDashboard;
