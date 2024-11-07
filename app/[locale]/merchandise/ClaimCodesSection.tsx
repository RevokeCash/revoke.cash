'use client';

import { useQuery } from '@tanstack/react-query';
import merchCodesDB from 'lib/databases/merch-codes';
import { shortenAddress } from 'lib/utils/formatting';

const ClaimCodesSection = () => {
  const { data: codes } = useQuery({
    queryKey: ['merch-codes'],
    queryFn: () => merchCodesDB.getAllCodes(),
  });

  if (!codes || codes.length === 0) return null;

  return (
    <>
      <h2>Your Merchandise Claim Codes</h2>
      <p>
        While using Revoke.cash in the week leading up to Devcon, you may have been given a code to claim a limited
        edition Revoke.cash t-shirt. Below you can find the codes that were generated on this device that are valid for
        the upcoming event. Note that these codes are valid while supplies last.
      </p>

      <div className="not-prose flex flex-wrap gap-4">
        {codes.map((code) => (
          <div className="border border-black dark:border-white rounded-lg p-4 flex flex-col items-center">
            <div className="font-bold">{code.code}</div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">({shortenAddress(code.address, 4)})</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ClaimCodesSection;
