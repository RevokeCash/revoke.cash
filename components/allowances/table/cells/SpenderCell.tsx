import { useQuery } from '@tanstack/react-query';
import Href from 'components/common/Href';
import Spinner from 'components/common/Spinner';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useOpenSeaProxyAddress } from 'lib/hooks/ethereum/useOpenSeaProxyAddress';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import type { AllowanceData } from 'lib/interfaces';
import { shortenString } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { addressToAppName } from 'lib/utils/whois';
import { twMerge } from 'tailwind-merge';

interface Props {
  allowance: AllowanceData;
}

const SpenderCell = ({ allowance }: Props) => {
  const { address } = useAddressPageContext();
  const { openSeaProxyAddress } = useOpenSeaProxyAddress(address);

  // TODO: Expose this data to react-table
  const { data: spenderName, isLoading } = useQuery({
    queryKey: ['spenderName', allowance.spender, allowance.chainId, openSeaProxyAddress],
    queryFn: () => addressToAppName(allowance.spender, allowance.chainId, openSeaProxyAddress),
    // Chances of this data changing while the user is on the page are very slim
    staleTime: Infinity,
  });

  const explorerUrl = `${getChainExplorerUrl(allowance.chainId)}/address/${allowance.spender}`;

  if (isLoading) {
    return <Spinner className="w-4 h-4" />;
  }

  if (!allowance.spender) {
    return null;
  }

  return (
    <div className={twMerge('flex justify-start')}>
      <WithHoverTooltip tooltip={allowance.spender}>
        <Href href={explorerUrl} underline="hover" external>
          {spenderName ?? shortenString(allowance.spender, 17)}
        </Href>
      </WithHoverTooltip>
    </div>
  );
};

export default SpenderCell;
