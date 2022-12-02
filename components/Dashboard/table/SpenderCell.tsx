import { useQuery } from '@tanstack/react-query';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAppContext } from 'lib/hooks/useAppContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { AllowanceData } from 'lib/interfaces';
import { shortenAddress } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { classNames } from 'lib/utils/styles';
import { addressToAppName } from 'lib/utils/whois';
import { ClipLoader } from 'react-spinners';

interface Props {
  allowance: AllowanceData;
}

const SpenderCell = ({ allowance }: Props) => {
  const { selectedChainId } = useEthereum();
  const { openSeaProxyAddress } = useAppContext();

  // TODO: Expose this data to react-table
  const { data: spenderName, isLoading } = useQuery({
    queryKey: ['spenderName', allowance.spender],
    queryFn: () => addressToAppName(allowance.spender, selectedChainId, openSeaProxyAddress),
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/address/${allowance.spender}`;

  if (isLoading) {
    return (
      <div>
        <ClipLoader size={10} color={'#000'} loading={isLoading} />
      </div>
    );
  }

  return (
    <div className={classNames(!allowance.spender && 'text-gray-400', 'flex justify-start')}>
      <WithHoverTooltip tooltip={allowance.spender}>
        <a href={explorerUrl} className="underline text-black visited:text-black">
          {spenderName ?? shortenAddress(allowance.spender)}
        </a>
      </WithHoverTooltip>
    </div>
  );
};

export default SpenderCell;
