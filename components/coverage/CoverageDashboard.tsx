'use client';

import { Env, FsdSDK } from '@fairside-foundation/sdk';
import { FAIRSIDE_API_KEY } from 'lib/constants';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useMounted } from 'lib/hooks/useMounted';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import CoverageDetailsCard from './CoverageDetailsCard';
import CoverageInfo from './CoverageInfo';
import MembershipCard from './MembershipCard';
import WalletDetails from './WalletDetails';

interface Props {
  isActive: boolean;
  coverageAmount?: number | null;
}

interface MembershipInfo {
  statusCode: number;
  hasCover: boolean;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  coverAmount: number | null;
  activeClaims: string[];
}

const CoverageDashboard = ({ isActive = false, coverageAmount = null }: Props) => {
  const isMounted = useMounted();
  const { address } = useAddressPageContext();
  const [token, setToken] = useState<string | null>(null);
  const t = useTranslations();

  const { fsdAPI, fsdContract, fsdConfig } = FsdSDK({
    apiKey: FAIRSIDE_API_KEY ?? '',
    env: Env.TestNet,
  });
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  useEffect(() => {
    async function fetchMembershipInfo() {
      const results = await fsdAPI.getPublicMembershipInfo({ walletAddress: address });
      setMembershipInfo(results);
    }
    fetchMembershipInfo();
  }, [address, fsdAPI.getPublicMembershipInfo]);
  return (
    <div className="flex flex-col gap-8">
      {isMounted && membershipInfo && (
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <div className="flex flex-col gap-y-4 max-w-[400px] md:w-[400px]">
            <MembershipCard isActive={membershipInfo.isActive} coverageAmount={membershipInfo.coverAmount} />
            {membershipInfo.isActive && (
              <WalletDetails
                isAuthenticated={token != null}
                fsdAPI={fsdAPI}
                walletAddress={address}
                token={token}
                setToken={setToken}
              />
            )}
          </div>
          {!membershipInfo.isActive && <CoverageInfo />}
          {membershipInfo.isActive && (
            <div className="flex flex-col h-[500px] w-[75%]">
              <CoverageDetailsCard
                coverageAmount={membershipInfo.coverAmount}
                validFrom={membershipInfo.validFrom}
                validUntil={membershipInfo.validUntil}
                claimsCount={membershipInfo.activeClaims.length}
                onIncrease={() => window.open('https://test.fairside.dev/', '_blank')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoverageDashboard;
