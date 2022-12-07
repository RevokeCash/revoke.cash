import { useQuery } from '@tanstack/react-query';
import Href from 'components/common/Href';
import SpinLoader from 'components/common/SpinLoader';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAppContext } from 'lib/hooks/useAppContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { AllowanceData } from 'lib/interfaces';
import { shortenName } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { classNames } from 'lib/utils/styles';
import { addressToAppName } from 'lib/utils/whois';

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
    return <SpinLoader size={10} />;
  }

  return (
    <div className={classNames(!allowance.spender && 'text-gray-400', 'flex justify-start')}>
      <WithHoverTooltip tooltip={allowance.spender}>
        <Href href={explorerUrl} external>
          {spenderName ?? shortenName(allowance.spender)}
        </Href>
      </WithHoverTooltip>
    </div>
  );
};

export default SpenderCell;
