'use client';

import { useQuery } from '@tanstack/react-query';
import AddressCell from 'components/allowances/dashboard/cells/AddressCell';
import AssetDisplay from 'components/allowances/dashboard/cells/AssetDisplay';
import Loader from 'components/common/Loader';
import type { Delegation } from 'lib/delegations/DelegatePlatform';
import { isNullish } from 'lib/utils';
import { getTokenMetadataUnknown } from 'lib/utils/tokens';
import { useTranslations } from 'next-intl';
import { usePublicClient } from 'wagmi';

interface Props {
  delegation: Delegation;
}

const ContractCell = ({ delegation }: Props) => {
  const t = useTranslations();
  const publicClient = usePublicClient({ chainId: delegation.chainId });

  const { data: tokenMetadata, isLoading } = useQuery({
    queryKey: ['tokenMetadata', delegation.contract, delegation.chainId],
    queryFn: () => (delegation.contract ? getTokenMetadataUnknown(delegation.contract, publicClient!) : null),
    enabled: !isNullish(delegation.contract) && !isNullish(publicClient),
  });

  if (!delegation.contract) {
    return <span className="text-gray-500 dark:text-gray-400">{t('address.delegations.contract.not_applicable')}</span>;
  }

  if (isLoading) {
    return <Loader isLoading={true} loadingChildren={<div className="w-full h-6" />} />;
  }

  if (!tokenMetadata) {
    return <AddressCell address={delegation.contract} chainId={delegation.chainId} />;
  }

  return (
    <div className="flex items-center gap-1">
      <AssetDisplay
        asset={{
          metadata: tokenMetadata ?? undefined,
          contract: { address: delegation.contract },
          chainId: delegation.chainId,
        }}
      />
      {delegation.tokenId ? (
        <span className="text-gray-500 dark:text-gray-400">#{delegation.tokenId.toString()}</span>
      ) : null}
    </div>
  );
};

export default ContractCell;
