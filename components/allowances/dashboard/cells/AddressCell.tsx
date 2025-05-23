import CopyButton from 'components/common/CopyButton';
import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { SpenderData, SpenderRiskData } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { shortenAddress } from 'lib/utils/formatting';
import type { Address } from 'viem';
import RiskTooltip from '../wallet-health/RiskTooltip';

interface Props {
  address: Address;
  spenderData?: SpenderData | SpenderRiskData;
  chainId: number;
}

const AddressCell = ({ address, spenderData, chainId }: Props) => {
  const explorerUrl = `${getChainExplorerUrl(chainId)}/address/${address}`;

  return (
    <div className="flex items-center gap-2 max-w-52">
      <div className="flex flex-col justify-start items-start">
        <WithHoverTooltip tooltip={address}>
          <Href href={explorerUrl} underline="hover" external>
            <div className="max-w-[10rem] truncate">{spenderData?.name ?? shortenAddress(address, 6)}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {spenderData?.name ? shortenAddress(address, 6) : null}
            </div>
          </Href>
        </WithHoverTooltip>
      </div>
      <CopyButton content={address} className="text-zinc-500 dark:text-zinc-400" />
      <RiskTooltip riskFactors={spenderData?.riskFactors ?? undefined} />
    </div>
  );
};

export default AddressCell;
