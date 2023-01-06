import { useQuery } from '@tanstack/react-query';
import Href from 'components/common/Href';
import Spinner from 'components/common/Spinner';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useAddressContext } from 'lib/hooks/useAddressContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { AllowanceData } from 'lib/interfaces';
import { shortenString } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { classNames } from 'lib/utils/styles';
import { addressToAppName } from 'lib/utils/whois';

interface Props {
  allowance: AllowanceData;
}

const SpenderCell = ({ allowance }: Props) => {
  const { selectedChainId } = useEthereum();
  const { openSeaProxyAddress } = useAddressContext();

  // TODO: Expose this data to react-table
  const { data: spenderName, isLoading } = useQuery({
    queryKey: ['spenderName', allowance.spender],
    queryFn: () => addressToAppName(allowance.spender, selectedChainId, openSeaProxyAddress),
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/address/${allowance.spender}`;

  if (isLoading) {
    return <Spinner className="w-4 h-4" />;
  }

  if (!allowance.spender) {
    return null;
  }

  return (
    <div className={classNames('flex justify-start')}>
      <WithHoverTooltip tooltip={allowance.spender}>
        <Href href={explorerUrl} underline="hover" external>
          {spenderName ?? shortenString(allowance.spender, 17)}
        </Href>
      </WithHoverTooltip>
    </div>
  );
};

export default SpenderCell;
